package com.autonoma.erp.service.admin;

import com.autonoma.erp.model.admin.BosSchedulerConfig;
import com.autonoma.erp.model.admin.BosSchedulerExecutionLog;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeManagerMapping;
import com.autonoma.erp.repository.admin.BosSchedulerConfigRepository;
import com.autonoma.erp.repository.admin.BosSchedulerExecutionLogRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.util.SpringContext;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.stereotype.Component;
import java.util.*;

@Component
@Slf4j
@DisallowConcurrentExecution
public class AutomationJobExecutor implements Job {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AutomationJobExecutor.class);

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        JobDataMap dataMap = context.getMergedJobDataMap();
        Long configId = dataMap.getLong("configId");
        
        log.info("===== Starting Automation Job Execution for Config ID: {} =====", configId);
        long startTime = System.currentTimeMillis();
        
        BosSchedulerConfigRepository configRepository = SpringContext.getBean(BosSchedulerConfigRepository.class);
        BosSchedulerExecutionLogRepository logRepository = SpringContext.getBean(BosSchedulerExecutionLogRepository.class);
        DynamicQueryBuilderService queryBuilder = SpringContext.getBean(DynamicQueryBuilderService.class);
        ReportCompilerService reportCompiler = SpringContext.getBean(ReportCompilerService.class);
        EmailSendingService emailSendingService = SpringContext.getBean(EmailSendingService.class);
        
        if (configRepository == null || logRepository == null) {
            log.error("Spring context lookup failed inside Quartz execution thread.");
            return;
        }

        Optional<BosSchedulerConfig> configOpt = configRepository.findById(configId);
        if (!configOpt.isPresent()) {
            log.warn("Automation configuration with ID {} not found in database. Skipping.", configId);
            return;
        }

        BosSchedulerConfig config = configOpt.get();
        if (Boolean.FALSE.equals(config.getIsActive())) {
            log.warn("Automation configuration {} is INACTIVE. Skipping execution.", config.getConfigName());
            return;
        }

        // Initialize execution log
        BosSchedulerExecutionLog execLog = BosSchedulerExecutionLog.builder()
                .configId(configId)
                .schedulerName(config.getConfigName())
                .status("RUNNING")
                .triggerTime(new Date())
                .build();
        execLog = logRepository.save(execLog);

        try {
            // 1. Fetch Dynamic Data
            List<Map<String, Object>> data = queryBuilder.executeQuery(
                    config.getSourceName(), 
                    config.getSelectedFields(), 
                    config.getFilterJson()
            );
            log.info("Fetched {} database records matching criteria.", data.size());

            // 2. Parse configurations
            Map<String, String> recipientConfig = objectMapper.readValue(config.getRecipientJson(), 
                    new TypeReference<Map<String, String>>() {});
            Map<String, Object> outputConfig = objectMapper.readValue(config.getOutputJson(), 
                    new TypeReference<Map<String, Object>>() {});
            
            String emailSubjectTemplate = (String) outputConfig.getOrDefault("subject", config.getConfigName());
            String emailBodyTemplate = (String) outputConfig.getOrDefault("body", "Here is your report.");
            String emailFooter = (String) outputConfig.getOrDefault("footer", "Automated Business Alert");
            
            // Check formats: EXCEL, PDF, CSV, EMAIL
            List<String> formats = (List<String>) outputConfig.get("formats");
            if (formats == null) {
                formats = new ArrayList<>();
            }
            
            boolean includeExcel = formats.contains("EXCEL");
            boolean includePdf = formats.contains("PDF");
            boolean includeCsv = formats.contains("CSV");
            
            String toDynamic = recipientConfig.getOrDefault("toDynamic", "");
            String ccDynamic = recipientConfig.getOrDefault("ccDynamic", "");
            
            int successCount = 0;
            int failureCount = 0;

            // 3. Determine Execution Mode: Row-by-row Dynamic Alerts vs. Aggregated Summaries
            if (!toDynamic.isEmpty() || !ccDynamic.isEmpty()) {
                // ROW-BY-ROW Dynamic Alerts (e.g. Birthday wishes to employees, or individual PO status alerts)
                log.info("Executing in ROW-BY-ROW dynamic routing mode.");
                
                for (Map<String, Object> row : data) {
                    try {
                        String toEmail = resolveDynamicEmail(row, toDynamic);
                        if (toEmail == null || toEmail.trim().isEmpty()) {
                            // Fallback to static email list if configured
                            toEmail = recipientConfig.getOrDefault("to", "");
                        }

                        if (toEmail == null || toEmail.trim().isEmpty()) {
                            log.warn("Skipping dynamic alert row: recipient email could not be resolved.");
                            failureCount++;
                            continue;
                        }

                        String ccEmail = resolveDynamicEmail(row, ccDynamic);
                        if (ccEmail == null || ccEmail.trim().isEmpty()) {
                            ccEmail = recipientConfig.getOrDefault("cc", "");
                        }
                        
                        String bccEmail = recipientConfig.getOrDefault("bcc", "");

                        // Compile body and subject templates matching this row's details
                        String compiledSubject = compileTemplateVariables(emailSubjectTemplate, row);
                        String compiledBody = reportCompiler.compileHtml(emailBodyTemplate, Collections.singletonList(row), compiledSubject, emailFooter, row);
                        
                        // Prepare single-row attachments if requested
                        List<Map<String, Object>> attachments = new ArrayList<>();
                        List<Map<String, Object>> singleRowList = Collections.singletonList(row);
                        
                        if (includeExcel) {
                            byte[] excelBytes = reportCompiler.generateExcel(singleRowList, config.getConfigName());
                            attachments.add(createAttachment(config.getConfigName() + ".xlsx", excelBytes));
                        }
                        if (includePdf) {
                            byte[] pdfBytes = reportCompiler.generatePdf(singleRowList, config.getConfigName(), config.getConfigName(), emailFooter);
                            attachments.add(createAttachment(config.getConfigName() + ".pdf", pdfBytes));
                        }
                        if (includeCsv) {
                            byte[] csvBytes = reportCompiler.generateCsv(singleRowList);
                            attachments.add(createAttachment(config.getConfigName() + ".csv", csvBytes));
                        }

                        boolean ok = emailSendingService.sendEmailWithAttachments(toEmail, ccEmail, bccEmail, compiledSubject, compiledBody, attachments);
                        if (ok) {
                            successCount++;
                        } else {
                            failureCount++;
                        }
                    } catch (Exception ex) {
                        log.error("Failed to execute dynamic row notification: {}", ex.getMessage());
                        failureCount++;
                    }
                }
            } else {
                // AGGREGATED Summary Mode (e.g., sending low stock alerts or daily attendance summary to admin list)
                log.info("Executing in AGGREGATED summary report mode.");
                
                String toEmails = recipientConfig.getOrDefault("to", "");
                String ccEmails = recipientConfig.getOrDefault("cc", "");
                String bccEmails = recipientConfig.getOrDefault("bcc", "");
                
                if (toEmails == null || toEmails.trim().isEmpty()) {
                    throw new IllegalArgumentException("No static recipients defined for aggregated automation.");
                }

                // Compile placeholders and bind dataset as table
                Map<String, Object> globalVars = new HashMap<>();
                String compiledBody = reportCompiler.compileHtml(emailBodyTemplate, data, emailSubjectTemplate, emailFooter, globalVars);
                
                List<Map<String, Object>> attachments = new ArrayList<>();
                if (includeExcel) {
                    byte[] excelBytes = reportCompiler.generateExcel(data, config.getConfigName());
                    attachments.add(createAttachment(config.getConfigName() + ".xlsx", excelBytes));
                }
                if (includePdf) {
                    byte[] pdfBytes = reportCompiler.generatePdf(data, config.getConfigName(), config.getConfigName(), emailFooter);
                    attachments.add(createAttachment(config.getConfigName() + ".pdf", pdfBytes));
                }
                if (includeCsv) {
                    byte[] csvBytes = reportCompiler.generateCsv(data);
                    attachments.add(createAttachment(config.getConfigName() + ".csv", csvBytes));
                }

                boolean ok = emailSendingService.sendEmailWithAttachments(toEmails, ccEmails, bccEmails, emailSubjectTemplate, compiledBody, attachments);
                if (ok) {
                    successCount = 1;
                } else {
                    failureCount = 1;
                }
            }

            // Update Log
            execLog.setStatus("COMPLETED");
            execLog.setSuccessCount(successCount);
            execLog.setFailureCount(failureCount);
            execLog.setDurationMs(System.currentTimeMillis() - startTime);
            execLog.setErrorDetails("Execution completed successfully.");
            logRepository.save(execLog);
            
            log.info("===== Automation Job Completed for Config ID: {} (Successes: {}, Failures: {}) =====", 
                    configId, successCount, failureCount);
            
        } catch (Exception e) {
            log.error("Execution error in dynamic automation runner: {}", e.getMessage(), e);
            execLog.setStatus("FAILED");
            execLog.setDurationMs(System.currentTimeMillis() - startTime);
            execLog.setErrorDetails(e.getMessage() != null ? e.getMessage() : e.toString());
            logRepository.save(execLog);
        }
    }

    private String resolveDynamicEmail(Map<String, Object> row, String dynamicType) {
        if (dynamicType == null || dynamicType.trim().isEmpty()) {
            return null;
        }

        EmployeeMasterRepository empRepo = SpringContext.getBean(EmployeeMasterRepository.class);
        if (empRepo == null) return null;

        // Helper: get employee code/id from database records
        String empCode = extractField(row, "empCode", "employeeCode", "EMP_CODE", "employee_code");
        
        Optional<EmployeeMaster> empOpt = Optional.empty();
        if (empCode != null && !empCode.trim().isEmpty()) {
            empOpt = empRepo.findByEmpCode(empCode.trim());
        }

        switch (dynamicType.toUpperCase()) {
            case "EMPLOYEE_EMAIL":
                // Try to get from row first
                String mailInRow = extractField(row, "officeMail", "emailId", "email", "mail", "employee_email");
                if (mailInRow != null && mailInRow.contains("@")) {
                    return mailInRow;
                }
                // Fallback: look up in EmployeeMaster
                return empOpt.map(EmployeeMaster::getOfficeMail).orElse(null);

            case "REPORTING_MANAGER":
                if (empOpt.isPresent()) {
                    EmployeeMaster employee = empOpt.get();
                    // Let's inspect the EmployeeManagerMapping
                    jakarta.persistence.EntityManager em = SpringContext.getBean(jakarta.persistence.EntityManager.class);
                    if (em != null) {
                        try {
                            List<EmployeeManagerMapping> mappings = em.createQuery(
                                    "SELECT m FROM EmployeeManagerMapping m WHERE m.empId = :empId AND m.isActive = true", 
                                    EmployeeManagerMapping.class)
                                    .setParameter("empId", employee.getId())
                                    .getResultList();
                            
                            if (!mappings.isEmpty()) {
                                EmployeeManagerMapping mapping = mappings.get(0);
                                Long managerId = mapping.getBusinessManagerId() != null 
                                        ? mapping.getBusinessManagerId() 
                                        : mapping.getHomeManagerId();
                                
                                if (managerId != null) {
                                    String email = getEmployeeEmail(managerId);
                                    if (email != null && !email.trim().isEmpty()) {
                                        return email.trim();
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.error("Failed to query manager email mappings: {}", e.getMessage());
                        }
                    }
                    // Secondary fallback: check verticalHead or homeManager fields from master
                    String mName = employee.getBusinessManager() != null ? employee.getBusinessManager() : employee.getHomeManager();
                    if (mName != null && !mName.trim().isEmpty()) {
                        String email = getEmployeeEmailByNameOrCode(mName);
                        if (email != null && !email.trim().isEmpty()) {
                            return email.trim();
                        }
                    }
                }
                break;
                
            case "DEPARTMENT_HEAD":
                if (empOpt.isPresent() && empOpt.get().getDepartment() != null) {
                    // We check if the department has head details or dynamic heads
                    String deptMail = empOpt.get().getDepartment().getDepartmentMailId();
                    if (deptMail != null && deptMail.contains("@")) {
                        return deptMail;
                    }
                }
                break;
                
            case "HR_EMAIL":
                if (empOpt.isPresent() && empOpt.get().getHrManager() != null) {
                    String hrName = empOpt.get().getHrManager();
                    String email = getEmployeeEmailByNameOrCode(hrName);
                    if (email != null && !email.trim().isEmpty()) {
                        return email.trim();
                    }
                }
                break;
        }

        return null;
    }

    private String extractField(Map<String, Object> row, String... keys) {
        for (String key : keys) {
            Object val = row.get(key);
            if (val != null && !val.toString().trim().isEmpty()) {
                return val.toString().trim();
            }
        }
        return null;
    }

    private String compileTemplateVariables(String template, Map<String, Object> row) {
        if (template == null) return "";
        String result = template;
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String valStr = entry.getValue() != null ? entry.getValue().toString() : "";
            result = result.replace(placeholder, valStr);
        }
        return result;
    }

    private Map<String, Object> createAttachment(String name, byte[] content) {
        Map<String, Object> map = new HashMap<>();
        map.put("fileName", name);
        map.put("content", content);
        return map;
    }

    private String getEmployeeEmail(Long employeeId) {
        if (employeeId == null) return null;
        try {
            com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository jpRepo = 
                SpringContext.getBean(com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository.class);
            if (jpRepo != null) {
                return jpRepo.findByEmployeeId(employeeId)
                    .map(jp -> jp.getOfficeEmail())
                    .orElse(null);
            }
        } catch (Exception e) {
            log.error("Failed to get employee email: {}", e.getMessage());
        }
        return null;
    }

    private String getEmployeeEmailByNameOrCode(String nameOrCode) {
        if (nameOrCode == null || nameOrCode.trim().isEmpty()) return null;
        try {
            com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository empRepo = 
                SpringContext.getBean(com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository.class);
            if (empRepo != null) {
                Optional<EmployeeMaster> empOpt = empRepo.findByEmpCodeOrName(nameOrCode);
                if (empOpt.isPresent()) {
                    return getEmployeeEmail(empOpt.get().getId());
                }
            }
        } catch (Exception e) {
            log.error("Failed to get employee email by name/code: {}", e.getMessage());
        }
        return null;
    }
}
