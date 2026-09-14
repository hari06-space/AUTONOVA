package com.autonoma.erp.modules.qms.audit.service;

import com.autonoma.erp.model.admin.AppPreference;
import com.autonoma.erp.repository.admin.AppPreferenceRepository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.qms.audit.repository.AuditAttendanceRepository;
import com.autonoma.erp.modules.qms.audit.repository.AuditObservationRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.platform.notification.service.NotificationService;

import com.autonoma.erp.modules.qms.audit.entity.AuditSchedule;
import com.autonoma.erp.modules.qms.audit.entity.AuditScheduleCriteria;
import com.autonoma.erp.modules.qms.audit.entity.AuditScheduleLog;
import com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.PageImpl;
import com.autonoma.erp.config.TenantContextHolder;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@org.springframework.transaction.annotation.Transactional
public class AuditScheduleService {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AuditScheduleService.class);
    private static final org.slf4j.Logger log = logger;

    @Autowired
    private com.autonoma.erp.service.DatabaseFeatureService databaseFeatureService;

    @Autowired
    private AuditScheduleRepository repository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditScheduleLogRepository auditScheduleLogRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditAttendanceRepository auditAttendanceRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.AppPreferenceRepository appPreferenceRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditObservationRepository auditObservationRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeMasterRepository;

    @Autowired(required = false)
    private com.autonoma.erp.modules.hr.leave.repository.LeaveEntryRepository leaveEntryRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.UserRepository userRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private com.autonoma.erp.repository.admin.BosUserPageAuthRepository bosUserPageAuthRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.BosPageRepository bosPageRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.PrefixCredentialRepository prefixCredentialRepository;

    @Autowired
    private com.autonoma.erp.modules.platform.notification.service.NotificationService notificationService;

    @Autowired
    private com.autonoma.erp.modules.master.contact.repository.ContactMasterRepository contactMasterRepository;

    private void syncContactMaster(AuditSchedule schedule) {
        if (schedule == null) return;
        try {
            String customerName = null;
            String contactName = null;
            String emailId = null;
            String mobileNo = null;

            if (schedule.getAuditeeDetails() != null && !schedule.getAuditeeDetails().trim().isEmpty()) {
                com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(schedule.getAuditeeDetails());
                if (node.has("customerName") && !node.get("customerName").asText().trim().isEmpty()) {
                    customerName = node.get("customerName").asText().trim();
                }
                if (node.has("contactName") && !node.get("contactName").asText().trim().isEmpty()) {
                    contactName = node.get("contactName").asText().trim();
                }
                if (node.has("externalEmailId") && !node.get("externalEmailId").asText().trim().isEmpty()) {
                    emailId = node.get("externalEmailId").asText().trim();
                }
                if (node.has("externalMobileNo") && !node.get("externalMobileNo").asText().trim().isEmpty()) {
                    mobileNo = node.get("externalMobileNo").asText().trim();
                }
            }

            if (contactName == null || contactName.trim().isEmpty()) {
                if (schedule.getExternalName() != null && !schedule.getExternalName().trim().isEmpty()) {
                    contactName = schedule.getExternalName().trim();
                }
            }

            if (contactName == null || contactName.trim().isEmpty()) {
                return;
            }

            final String finalContactName = contactName.trim();
            final String finalCustomerName = (customerName != null && !customerName.trim().isEmpty()) ? customerName.trim() : null;
            final String finalEmailId = emailId;
            final String finalMobileNo = mobileNo;

            List<com.autonoma.erp.modules.master.contact.entity.ContactMaster> matchingContacts = new java.util.ArrayList<>();
            if (finalCustomerName != null) {
                matchingContacts = contactMasterRepository.findByGroupNameAndContactName(finalCustomerName, finalContactName);
            }
            if (matchingContacts.isEmpty()) {
                matchingContacts = contactMasterRepository.findAll().stream()
                        .filter(c -> c.getContactName() != null && c.getContactName().trim().equalsIgnoreCase(finalContactName)
                                && (finalCustomerName == null || (c.getGroupName() != null && c.getGroupName().trim().equalsIgnoreCase(finalCustomerName))))
                        .collect(java.util.stream.Collectors.toList());
            }

            if (!matchingContacts.isEmpty()) {
                for (com.autonoma.erp.modules.master.contact.entity.ContactMaster contact : matchingContacts) {
                    boolean changed = false;
                    if (finalEmailId != null && !finalEmailId.trim().isEmpty() && !finalEmailId.equalsIgnoreCase(contact.getEmailId())) {
                        contact.setEmailId(finalEmailId.trim());
                        changed = true;
                    }
                    if (finalMobileNo != null && !finalMobileNo.trim().isEmpty() && !finalMobileNo.equalsIgnoreCase(contact.getMobileNo())) {
                        contact.setMobileNo(finalMobileNo.trim());
                        changed = true;
                    }
                    if (changed) {
                        contactMasterRepository.save(contact);
                        logger.info("Auto-synced ContactMaster ID {} ({}) with Email: {}, Mobile: {}", contact.getId(), contact.getContactName(), finalEmailId, finalMobileNo);
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Could not sync ContactMaster details for audit schedule {}: {}", schedule.getScheduleNo(), e.getMessage());
        }
    }

    private void sendAuditNotifications(AuditSchedule schedule, String actionType) {
        try {
            logger.info("Sending notifications for Audit Schedule: {}, action: {}", schedule.getScheduleNo(),
                    actionType);
            String auditeeCode = extractEmployeeCode(schedule.getAuditee());
            String auditorCode = extractEmployeeCode(schedule.getAuditor());
            String ncrCode = extractEmployeeCode(schedule.getNcrApprovedBy());
            String coordCode = null;
            if (schedule.getCoOrdinatorEntity() != null) {
                coordCode = schedule.getCoOrdinatorEntity().getEmpCode();
            } else if (schedule.getCoOrdinatorId() != null) {
                com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster cEmp = employeeMasterRepository.findById(schedule.getCoOrdinatorId()).orElse(null);
                if (cEmp != null) coordCode = cEmp.getEmpCode();
            }

            java.util.Set<String> recipientCodes = new java.util.HashSet<>();
            if (auditeeCode != null && !auditeeCode.trim().isEmpty()) {
                recipientCodes.add(auditeeCode.trim().toLowerCase());
            }
            if (auditorCode != null && !auditorCode.trim().isEmpty()) {
                recipientCodes.add(auditorCode.trim().toLowerCase());
            }
            if (ncrCode != null && !ncrCode.trim().isEmpty()) {
                recipientCodes.add(ncrCode.trim().toLowerCase());
            }
            if (coordCode != null && !coordCode.trim().isEmpty()) {
                recipientCodes.add(coordCode.trim().toLowerCase());
            }

            for (String code : recipientCodes) {
                employeeMasterRepository.findByEmpCodeIgnoreCase(code).ifPresent(emp -> {
                    notificationService.notifyUserAboutAudit(emp, schedule, actionType);
                });
            }
        } catch (Exception e) {
            logger.error("Failed to send audit notifications for schedule {}: {}", schedule.getScheduleNo(),
                    e.getMessage(), e);
        }
    }

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    public List<AuditSchedule> getAllAuditSchedules(String taskScope, String currentUser, Long memberId,
            String fromDate, String toDate, String considerDate) {
        Long userEmpId = null;
        Long userDeptId = null;
        String employeeName = null;

        String resolvedUser = currentUser;
        if (resolvedUser == null || resolvedUser.trim().isEmpty()) {
            resolvedUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        }

        if (resolvedUser != null && !resolvedUser.trim().isEmpty()) {
            com.autonoma.erp.model.admin.UserCredential credential = userRepository.findByUserId(resolvedUser).orElse(null);
            if (credential == null) {
                String origTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
                try {
                    com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                    credential = userRepository.findByUserId(resolvedUser).orElse(null);
                } finally {
                    com.autonoma.erp.config.TenantContextHolder.setTenantId(origTenant);
                }
            }
            if (credential != null) {
                userEmpId = credential.getEmpId();
            }
            if (userEmpId == null) {
                EmployeeMaster empFallback = employeeMasterRepository.findByEmpCodeOrName(resolvedUser).orElse(null);
                if (empFallback != null) {
                    userEmpId = empFallback.getId();
                }
            }
            if (userEmpId != null) {
                EmployeeMaster emp = employeeMasterRepository.findById(userEmpId).orElse(null);
                if (emp != null) {
                    employeeName = emp.getEmployeeName();
                    if (emp.getOrganization() != null) {
                        userDeptId = emp.getOrganization().getDepartmentId();
                    }
                }
            }
        }

        List<Long> reporteeEmpIds = new ArrayList<>();
        if (employeeName != null && !employeeName.trim().isEmpty()) {
            List<EmployeeMaster> activeReports = employeeMasterRepository
                    .findActiveReportsByVerticalHeadName(employeeName.trim());
            if (activeReports != null) {
                for (EmployeeMaster reportee : activeReports) {
                    reporteeEmpIds.add(reportee.getId());
                }
            }
        }

        java.util.Date parsedFromDate = null;
        java.util.Date parsedToDate = null;
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
        if ("Yes".equalsIgnoreCase(considerDate)) {
            try {
                if (fromDate != null && !fromDate.trim().isEmpty()) {
                    java.util.Date temp = sdf.parse(fromDate);
                    java.util.Calendar cal = java.util.Calendar
                            .getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                    cal.setTime(temp);
                    cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
                    cal.set(java.util.Calendar.MINUTE, 0);
                    cal.set(java.util.Calendar.SECOND, 0);
                    cal.set(java.util.Calendar.MILLISECOND, 0);
                    parsedFromDate = cal.getTime();
                } else {
                    java.util.Calendar cal = java.util.Calendar
                            .getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                    cal.set(1970, 0, 1, 0, 0, 0);
                    parsedFromDate = cal.getTime();
                }
            } catch (Exception e) {
            }
            try {
                if (toDate != null && !toDate.trim().isEmpty()) {
                    java.util.Date temp = sdf.parse(toDate);
                    java.util.Calendar cal = java.util.Calendar
                            .getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                    cal.setTime(temp);
                    cal.set(java.util.Calendar.HOUR_OF_DAY, 23);
                    cal.set(java.util.Calendar.MINUTE, 59);
                    cal.set(java.util.Calendar.SECOND, 59);
                    cal.set(java.util.Calendar.MILLISECOND, 999);
                    parsedToDate = cal.getTime();
                } else {
                    java.util.Calendar cal = java.util.Calendar
                            .getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                    cal.set(2099, 11, 31, 23, 59, 59);
                    parsedToDate = cal.getTime();
                }
            } catch (Exception e) {
            }
        }

        java.util.Map<String, Object> params = new java.util.HashMap<>();
        String jpql = buildAuditScheduleJpql(taskScope, currentUser, memberId, fromDate, toDate, considerDate, null, null,
                userEmpId, userDeptId, resolvedUser, reporteeEmpIds, parsedFromDate, parsedToDate, params, false);

        jpql += " ORDER BY a.id DESC";
        jakarta.persistence.TypedQuery<AuditSchedule> query = entityManager.createQuery(jpql, AuditSchedule.class);
        for (java.util.Map.Entry<String, Object> entry : params.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
        }

        List<AuditSchedule> resultList = query.getResultList();

        if (resultList.isEmpty()) {
            return resultList;
        }

        List<String> scheduleNos = new ArrayList<>();
        for (AuditSchedule s : resultList) {
            if (s.getScheduleNo() != null) {
                scheduleNos.add(s.getScheduleNo());
            }
        }

        java.util.Set<String> obsSet = new java.util.HashSet<>();
        java.util.Set<String> attSet = new java.util.HashSet<>();

        if (!scheduleNos.isEmpty()) {
            List<String> obsList = entityManager
                    .createQuery("SELECT DISTINCT o.auditScheduleNo FROM AuditObservation o WHERE o.auditScheduleNo IN :scheduleNos", String.class)
                    .setParameter("scheduleNos", scheduleNos)
                    .getResultList();
            for (String s : obsList) {
                if (s != null) obsSet.add(s.trim().toUpperCase());
            }

            List<String> attList = entityManager
                    .createQuery("SELECT DISTINCT a.auditSchedule.scheduleNo FROM AuditAttendance a WHERE a.auditSchedule.scheduleNo IN :scheduleNos", String.class)
                    .setParameter("scheduleNos", scheduleNos)
                    .getResultList();
            for (String s : attList) {
                if (s != null) attSet.add(s.trim().toUpperCase());
            }
        }

        for (AuditSchedule schedule : resultList) {
            String schNo = schedule.getScheduleNo();
            String upperSchNo = schNo != null ? schNo.trim().toUpperCase() : null;

            boolean exists = upperSchNo != null && attSet.contains(upperSchNo);
            schedule.setHasAttendance(exists);

            boolean hasObservation = upperSchNo != null && obsSet.contains(upperSchNo);
            if (hasObservation && !"CLOSED".equalsIgnoreCase(schedule.getStatus())) {
                schedule.setStatus("CLOSED");
            }
        }
        return resultList;
    }

    public Optional<AuditSchedule> getAuditScheduleById(Long id) {
        return repository.findById(id).map(schedule -> {
            boolean exists = !auditAttendanceRepository.findByAuditScheduleNo(schedule.getScheduleNo()).isEmpty();
            schedule.setHasAttendance(exists);

            // Auto-heal schedule status in memory only if observation already exists in DB
            boolean hasObservation = auditObservationRepository
                    .existsByAuditScheduleNoIgnoreCase(schedule.getScheduleNo());
            if (hasObservation && !"CLOSED".equalsIgnoreCase(schedule.getStatus())) {
                schedule.setStatus("CLOSED");
            }
            return schedule;
        });
    }

    public AuditSchedule createAuditSchedule(AuditSchedule auditSchedule) {
        logger.debug("Creating Audit Schedule with {} criteria items",
                auditSchedule.getCriteriaList() != null ? auditSchedule.getCriteriaList().size() : 0);

        if (auditSchedule.getAuditDate() != null) {
            java.time.LocalDate requestedDate = convertToLocalDate(auditSchedule.getAuditDate());
            java.time.LocalDate adjustedDate = adjustToNextWorkingDay(requestedDate);
            java.util.Date finalAuditDate = java.util.Date.from(adjustedDate.atStartOfDay(java.time.ZoneId.of("Asia/Kolkata")).toInstant());
            auditSchedule.setAuditDate(finalAuditDate);
        }

        validateEmployeeEligibility(auditSchedule);
        validateEmployeeAvailability(auditSchedule, null);

        if (auditSchedule.getCriteriaList() != null) {
            for (AuditScheduleCriteria criteria : auditSchedule.getCriteriaList()) {
                criteria.setAuditSchedule(auditSchedule);
            }
        }
        updateAuditSearchText(auditSchedule);
        AuditSchedule saved = repository.save(auditSchedule);
        syncContactMaster(saved);
        
        saveOrUpdateSchedulerConfig(saved);

        sendAuditNotifications(saved, "CREATE");
        return saved;
    }

    private void saveOrUpdateSchedulerConfig(AuditSchedule saved) {
        boolean shouldUpdate = Boolean.TRUE.equals(saved.getUpdateConfig())
                || (saved.getFrequency() != null && !"NONE".equalsIgnoreCase(saved.getFrequency()) && saved.getParentId() == null);
        if (shouldUpdate) {
            try {
                com.autonoma.erp.modules.qms.audit.repository.AuditSchedulerConfigRepository configRepo = 
                    com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.qms.audit.repository.AuditSchedulerConfigRepository.class);
                if (configRepo != null) {
                    com.autonoma.erp.modules.qms.audit.entity.AuditSchedulerConfig asc = configRepo.findByConfigCodeIgnoreCase(saved.getScheduleNo())
                            .stream().findFirst().orElseGet(com.autonoma.erp.modules.qms.audit.entity.AuditSchedulerConfig::new);
                    
                    asc.setConfigCode(saved.getScheduleNo());
                    asc.setConfigName("Auto: " + (saved.getAuditType() != null ? saved.getAuditType() : "Audit") + " - " + (saved.getDepartment() != null ? saved.getDepartment() : "Dept"));
                    asc.setAuditTypeId(saved.getAuditTypeId());
                    asc.setDepartmentId(saved.getDepartmentId());
                    asc.setAuditAreaId(saved.getAuditAreaId());
                    asc.setFrequency(saved.getFrequency());
                    asc.setRepeatEveryValue(saved.getRepeatEveryValue() != null ? saved.getRepeatEveryValue() : 1);
                    asc.setRepeatEveryUnit(saved.getRepeatEveryUnit() != null ? saved.getRepeatEveryUnit() : "DAYS");
                    asc.setWeekDays(saved.getWeekDays());
                    asc.setStartTime(saved.getStartTime() != null ? saved.getStartTime() : "10:00 AM");
                    asc.setEndTime(saved.getEndTime() != null ? saved.getEndTime() : "11:00 AM");
                    asc.setStatus(saved.getIsActive() != null ? saved.getIsActive() : true);
                    asc.setCriteriaMinCount(saved.getCriteriaMinCount() != null ? saved.getCriteriaMinCount() : 1);
                    asc.setHolidayStrategy("NEXT");
                    asc.setLeaveValidation(true);
                    asc.setDuplicateCheck(true);
                    asc.setParentAuditScheduleId(saved.getId());
                    if (asc.getId() == null) {
                        asc.setCreatedBy(saved.getCreatedUser() != null ? saved.getCreatedUser() : "SYSTEM");
                        asc.setCreatedDate(new java.util.Date());
                    } else {
                        asc.setUpdatedBy(saved.getUpdatedBy() != null ? saved.getUpdatedBy() : "SYSTEM");
                        asc.setUpdatedDate(new java.util.Date());
                    }
                    asc = configRepo.save(asc);
                    if (saved.getConfigId() == null || !saved.getConfigId().equals(asc.getId())) {
                        saved.setConfigId(asc.getId());
                        repository.save(saved);
                    }
                    try {
                        com.autonoma.erp.modules.qms.audit.service.AuditSchedulerEngine engine = 
                            com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.qms.audit.service.AuditSchedulerEngine.class);
                        if (engine != null) {
                            engine.processConfig(asc, new java.util.Date());
                        }
                    } catch (Exception ex) {
                        logger.warn("Failed to auto-generate next draft audit recurrence on save: {}", ex.getMessage());
                    }
                }
            } catch (Exception e) {
                logger.error("Failed to auto-generate/update scheduler config from template schedule", e);
            }
        }
    }

    public AuditSchedule updateAuditSchedule(Long id, AuditSchedule updatedAuditSchedule) {
        return updateAuditSchedule(id, updatedAuditSchedule, false);
    }

    public AuditSchedule updateAuditSchedule(Long id, AuditSchedule updatedAuditSchedule, Boolean isReschedule) {
        // com.autonoma.erp.util.HolidayValidator.validateDate(updatedAuditSchedule.getAuditDate());
        return repository.findById(id).map(existing -> {
            if ("CLOSED".equalsIgnoreCase(existing.getStatus())) {
                throw new RuntimeException("This Audit Schedule has been closed and can no longer be modified.");
            }

            AuditSchedule target = existing;

            boolean dateOrTimeChanged = false;
            if (target.getAuditDate() != null && updatedAuditSchedule.getAuditDate() != null
                    && !target.getAuditDate().equals(updatedAuditSchedule.getAuditDate())) {
                dateOrTimeChanged = true;
            }
            if (target.getStartTime() != null && updatedAuditSchedule.getStartTime() != null
                    && !target.getStartTime().equals(updatedAuditSchedule.getStartTime())) {
                dateOrTimeChanged = true;
            }
            if (target.getEndTime() != null && updatedAuditSchedule.getEndTime() != null
                    && !target.getEndTime().equals(updatedAuditSchedule.getEndTime())) {
                dateOrTimeChanged = true;
            }

            boolean assigneeChanged = false;
            if (target.getAuditee() != null && updatedAuditSchedule.getAuditee() != null
                    && !target.getAuditee().equals(updatedAuditSchedule.getAuditee())) {
                assigneeChanged = true;
            }
            if (target.getAuditor() != null && updatedAuditSchedule.getAuditor() != null
                    && !target.getAuditor().equals(updatedAuditSchedule.getAuditor())) {
                assigneeChanged = true;
            }

            // Capture previous values for audit log
            java.util.Date prevAuditDate = target.getAuditDate();
            String prevStartTime = target.getStartTime();
            String prevEndTime = target.getEndTime();
            String prevAuditor = target.getAuditor();
            String prevAuditee = target.getAuditee();

            // Increment reschedule count if the audit date is changed
            if (target.getAuditDate() != null && updatedAuditSchedule.getAuditDate() != null
                    && !target.getAuditDate().equals(updatedAuditSchedule.getAuditDate())) {
                int currentCount = target.getRescheduleCount() != null ? target.getRescheduleCount() : 0;
                target.setRescheduleCount(currentCount + 1);
            }

            target.setScheduleDate(updatedAuditSchedule.getScheduleDate());
            
            // Status Update Logic
            if (isReschedule != null && isReschedule) {
                target.setStatus("RESCHEDULE");
            } else {
                target.setStatus(updatedAuditSchedule.getStatus());
            }

            target.setAuditType(updatedAuditSchedule.getAuditType());
            target.setItemCode(updatedAuditSchedule.getItemCode());
            target.setAuditArea(updatedAuditSchedule.getAuditArea());
            if (updatedAuditSchedule.getAuditDate() != null) {
                java.time.LocalDate requestedDate = convertToLocalDate(updatedAuditSchedule.getAuditDate());
                java.time.LocalDate adjustedDate = adjustToNextWorkingDay(requestedDate);
                java.util.Date finalAuditDate = java.util.Date.from(adjustedDate.atStartOfDay(java.time.ZoneId.of("Asia/Kolkata")).toInstant());
                target.setAuditDate(finalAuditDate);
            } else {
                target.setAuditDate(null);
            }
            target.setStartTime(updatedAuditSchedule.getStartTime());
            target.setEndTime(updatedAuditSchedule.getEndTime());
            target.setDepartment(updatedAuditSchedule.getDepartment());
            
            boolean isTemplatePayload = updatedAuditSchedule.getParentId() == null 
                    && updatedAuditSchedule.getFrequency() != null 
                    && !"NONE".equalsIgnoreCase(updatedAuditSchedule.getFrequency());

            if (!isTemplatePayload) {
                target.setAuditor(updatedAuditSchedule.getAuditor());
                if (updatedAuditSchedule.getAuditorId() != null) {
                    target.setAuditorId(updatedAuditSchedule.getAuditorId());
                    target.setAuditorEntity(employeeMasterRepository.findById(updatedAuditSchedule.getAuditorId()).orElse(null));
                }
                target.setAuditee(updatedAuditSchedule.getAuditee());
                if (updatedAuditSchedule.getAuditeeId() != null) {
                    target.setAuditeeId(updatedAuditSchedule.getAuditeeId());
                    target.setAuditeeEntity(employeeMasterRepository.findById(updatedAuditSchedule.getAuditeeId()).orElse(null));
                }
                target.setNcrApprovedBy(updatedAuditSchedule.getNcrApprovedBy());
                if (updatedAuditSchedule.getNcrApprovedById() != null) {
                    target.setNcrApprovedById(updatedAuditSchedule.getNcrApprovedById());
                    target.setNcrApprovedByEntity(employeeMasterRepository.findById(updatedAuditSchedule.getNcrApprovedById()).orElse(null));
                }
                if (updatedAuditSchedule.getCoOrdinatorId() != null) {
                    target.setCoOrdinatorId(updatedAuditSchedule.getCoOrdinatorId());
                    target.setCoOrdinatorEntity(employeeMasterRepository.findById(updatedAuditSchedule.getCoOrdinatorId()).orElse(null));
                }
            }
            
            target.setCriteriaMinCount(updatedAuditSchedule.getCriteriaMinCount());
            target.setUpdatedBy(updatedAuditSchedule.getUpdatedBy());

            target.getCriteriaList().clear();
            if (updatedAuditSchedule.getCriteriaList() != null) {
                for (AuditScheduleCriteria criteria : updatedAuditSchedule.getCriteriaList()) {
                    AuditScheduleCriteria newCriteria = new AuditScheduleCriteria();
                    newCriteria.setAuditSchedule(target);
                    newCriteria.setSeqNo(criteria.getSeqNo());
                    newCriteria.setClause(criteria.getClause());
                    newCriteria.setCriteriaDetails(criteria.getCriteriaDetails());
                    newCriteria.setAttachmentReq(criteria.getAttachmentReq());
                    newCriteria.setRemarks(criteria.getRemarks());
                    newCriteria.setIsActive(criteria.getIsActive() != null ? criteria.getIsActive() : true);
                    target.getCriteriaList().add(newCriteria);
                }
            }
            // Run validations on final target
            validateEmployeeEligibility(target);
            validateEmployeeAvailability(target, target.getId());

            updateAuditSearchText(target);
            AuditSchedule saved = repository.save(target);
            syncContactMaster(saved);

            saveOrUpdateSchedulerConfig(saved);

            if (isReschedule != null && isReschedule) {
                boolean isFromConfig = (saved.getParentId() != null)
                        || (saved.getFrequency() != null && !"NONE".equalsIgnoreCase(saved.getFrequency()));
                if (!isFromConfig) {
                    try {
                        com.autonoma.erp.modules.qms.audit.repository.AuditSchedulerConfigRepository configRepo =
                            com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.qms.audit.repository.AuditSchedulerConfigRepository.class);
                        if (configRepo != null && saved.getScheduleNo() != null && configRepo.findByConfigCodeIgnoreCase(saved.getScheduleNo()).isPresent()) {
                            isFromConfig = true;
                        }
                    } catch (Exception ignored) {}
                }

                if (isFromConfig) {
                    AuditScheduleLog log = new AuditScheduleLog();
                    log.setScheduleId(saved.getId());
                    log.setScheduleNo(saved.getScheduleNo());
                    log.setPrevAuditDate(prevAuditDate);
                    log.setNewAuditDate(saved.getAuditDate());
                    log.setPrevStartTime(prevStartTime);
                    log.setNewStartTime(saved.getStartTime());
                    log.setPrevEndTime(prevEndTime);
                    log.setNewEndTime(saved.getEndTime());
                    log.setPrevAuditor(prevAuditor);
                    log.setNewAuditor(saved.getAuditor());
                    log.setPrevAuditee(prevAuditee);
                    log.setNewAuditee(saved.getAuditee());
                    
                    String modifiedByUser = saved.getUpdatedBy();
                    if (modifiedByUser == null || modifiedByUser.trim().isEmpty()) {
                        modifiedByUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                    }
                    log.setModifiedBy(modifiedByUser);
                    log.setModifiedDate(new java.util.Date());
                    log.setAction("RESCHEDULE");

                    auditScheduleLogRepository.save(log);
                }
            }

            String actionType = "UPDATE";
            if (dateOrTimeChanged || (isReschedule != null && isReschedule)) {
                actionType = "RESCHEDULE";
            } else if (assigneeChanged) {
                actionType = "ASSIGN";
            }
            sendAuditNotifications(saved, actionType);

            return saved;
        }).orElseThrow(() -> new RuntimeException("Audit Schedule not found with id " + id));
    }

    private String extractEmployeeCode(String employeeField) {
        if (employeeField == null || employeeField.trim().isEmpty()) {
            return null;
        }
        int index = employeeField.lastIndexOf(" - ");
        if (index != -1) {
            return employeeField.substring(index + 3).trim();
        }
        return employeeField.trim();
    }

    private void validateEmployeeEligibility(AuditSchedule schedule) {
        String auditType = schedule.getAuditType();
        if (auditType == null || auditType.trim().isEmpty()) {
            return;
        }

        String cleanAuditType = auditType.trim().toUpperCase();
        String scheduleDept = schedule.getDepartment();

        // 1. Validate Auditor
        com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster auditor = null;
        if (schedule.getAuditorId() != null) {
            auditor = employeeMasterRepository.findById(schedule.getAuditorId()).orElse(null);
        }
        if (auditor == null) {
            String auditorCode = extractEmployeeCode(schedule.getAuditor());
            if (auditorCode != null && !auditorCode.trim().isEmpty()) {
                auditor = findEmployeeMaster(auditorCode);
            }
        }
        if (auditor != null) {
            if (!"YES".equalsIgnoreCase(auditor.getIsAuditor())
                    || !hasEligibilityType(auditor.getAuditorType(), cleanAuditType)) {
                String empName = auditor.getEmployeeName();
                throw new RuntimeException("Validation Error: Employee \"" + empName
                        + "\" is not eligible as an Auditor for Audit Type \"" + auditType + "\".");
            }
            if (auditor.getDepartment() != null && scheduleDept != null) {
                String auditorDept = auditor.getDepartment().getDepartmentName();
                if (auditorDept != null && auditorDept.trim().equalsIgnoreCase(scheduleDept.trim())) {
                    throw new RuntimeException("Validation Error: Auditor \"" + auditor.getEmployeeName()
                            + "\" cannot be from the same department as the Audited Department \"" + scheduleDept + "\".");
                }
            }
        }

        // 2. Validate Auditee
        com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster auditee = null;
        if (schedule.getAuditeeId() != null) {
            auditee = employeeMasterRepository.findById(schedule.getAuditeeId()).orElse(null);
        }
        if (auditee == null) {
            String auditeeCode = extractEmployeeCode(schedule.getAuditee());
            if (auditeeCode != null && !auditeeCode.trim().isEmpty()) {
                auditee = findEmployeeMaster(auditeeCode);
            }
        }
        if (auditee != null) {
            if (!"YES".equalsIgnoreCase(auditee.getIsAuditee())
                    || !hasEligibilityType(auditee.getAuditeeType(), cleanAuditType)) {
                String empName = auditee.getEmployeeName();
                throw new RuntimeException("Validation Error: Employee \"" + empName
                        + "\" is not eligible as an Auditee for Audit Type \"" + auditType + "\".");
            }
            if (auditee.getDepartment() != null && scheduleDept != null) {
                String auditeeDept = auditee.getDepartment().getDepartmentName();
                if (auditeeDept != null && !auditeeDept.trim().equalsIgnoreCase(scheduleDept.trim())) {
                    throw new RuntimeException("Validation Error: Auditee \"" + auditee.getEmployeeName()
                            + "\" department \"" + auditeeDept + "\" does not match Schedule Department \"" + scheduleDept + "\".");
                }
            }
        }

        // 3. Validate NCR Approver
        com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster ncrApprover = null;
        if (schedule.getNcrApprovedById() != null) {
            ncrApprover = employeeMasterRepository.findById(schedule.getNcrApprovedById()).orElse(null);
        }
        if (ncrApprover == null) {
            String ncrApproverCode = extractEmployeeCode(schedule.getNcrApprovedBy());
            if (ncrApproverCode != null && !ncrApproverCode.trim().isEmpty()) {
                ncrApprover = findEmployeeMaster(ncrApproverCode);
            }
        }
        if (ncrApprover != null) {
            if (!"YES".equalsIgnoreCase(ncrApprover.getIsNcrApprover())
                    || !hasEligibilityType(ncrApprover.getNcrApproverType(), cleanAuditType)) {
                String empName = ncrApprover.getEmployeeName();
                throw new RuntimeException("Validation Error: Employee \"" + empName
                        + "\" is not eligible as an NC Approver for Audit Type \"" + auditType + "\".");
            }
            if (ncrApprover.getDepartment() != null && scheduleDept != null) {
                String ncrDept = ncrApprover.getDepartment().getDepartmentName();
                if (ncrDept != null && ncrDept.trim().equalsIgnoreCase(scheduleDept.trim())) {
                    throw new RuntimeException("Validation Error: NC Approver \"" + ncrApprover.getEmployeeName()
                            + "\" cannot be from the same department as the Audited Department \"" + scheduleDept + "\".");
                }
            }
        }

        // 4. Validate unique role assignment within the same schedule
        if (auditor != null && auditee != null && auditor.getId().equals(auditee.getId())) {
            throw new RuntimeException("Validation Error: Auditor \"" + auditor.getEmployeeName()
                    + "\" cannot be the same person as the Auditee.");
        }
        if (auditor != null && ncrApprover != null && auditor.getId().equals(ncrApprover.getId())) {
            throw new RuntimeException("Validation Error: Auditor \"" + auditor.getEmployeeName()
                    + "\" cannot be the same person as the NC Approver.");
        }
        if (auditee != null && ncrApprover != null && auditee.getId().equals(ncrApprover.getId())) {
            throw new RuntimeException("Validation Error: Auditee \"" + auditee.getEmployeeName()
                    + "\" cannot be the same person as the NC Approver.");
        }

        validateConsecutiveAssignment(schedule);
    }

    private com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster findEmployeeMaster(String code) {
        if (code == null || code.trim().isEmpty()) {
            return null;
        }
        String cleanCode = code.trim();
        com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp = employeeMasterRepository.findByEmpCodeIgnoreCase(cleanCode).orElse(null);
        if (emp == null) {
            emp = employeeMasterRepository.findByOldEmpCode(cleanCode).orElse(null);
        }
        if (emp == null) {
            // Fallback case-insensitive lookup for oldEmpCode
            emp = employeeMasterRepository.findAll().stream()
                .filter(e -> e.getOldEmpCode() != null && e.getOldEmpCode().equalsIgnoreCase(cleanCode))
                .findFirst().orElse(null);
        }
        return emp;
    }

    private boolean hasEligibilityType(String typeListStr, String selectedType) {
        if (typeListStr == null || typeListStr.trim().isEmpty()) {
            return false;
        }
        for (String type : typeListStr.split(",")) {
            if (type.trim().equalsIgnoreCase(selectedType)) {
                return true;
            }
        }
        return false;
    }

    private void validateEmployeeAvailability(AuditSchedule schedule, Long excludeId) {
        if (schedule.getStatus() != null && !"OPEN".equalsIgnoreCase(schedule.getStatus()) && !"RESCHEDULE".equalsIgnoreCase(schedule.getStatus())) {
            return;
        }

        List<Long> employeeIds = new java.util.ArrayList<>();
        if (schedule.getAuditeeId() != null) {
            employeeIds.add(schedule.getAuditeeId());
        }
        if (schedule.getAuditorId() != null) {
            employeeIds.add(schedule.getAuditorId());
        }

        if (employeeIds.isEmpty()) {
            // Fallback to text codes if IDs are not populated
            String auditeeCode = extractEmployeeCode(schedule.getAuditee());
            String auditorCode = extractEmployeeCode(schedule.getAuditor());
            if (auditeeCode != null && !auditeeCode.trim().isEmpty()) {
                com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp = findEmployeeMaster(auditeeCode);
                if (emp != null) employeeIds.add(emp.getId());
            }
            if (auditorCode != null && !auditorCode.trim().isEmpty()) {
                com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp = findEmployeeMaster(auditorCode);
                if (emp != null) employeeIds.add(emp.getId());
            }
        }

        if (employeeIds.isEmpty()) {
            return;
        }

        List<AuditSchedule> activeSchedules = repository.findAll().stream()
                .filter(a -> "OPEN".equalsIgnoreCase(a.getStatus()) || "RESCHEDULE".equalsIgnoreCase(a.getStatus()))
                .filter(a -> excludeId == null || !a.getId().equals(excludeId))
                .toList();

        for (AuditSchedule active : activeSchedules) {
            // Check if same date
            if (!isSameDate(schedule.getAuditDate(), active.getAuditDate())) {
                continue;
            }

            // Check if overlapping time
            if (!isTimeOverlapping(schedule.getStartTime(), schedule.getEndTime(), active.getStartTime(),
                    active.getEndTime())) {
                continue;
            }

            List<Long> activeEmployeeIds = new java.util.ArrayList<>();
            if (active.getAuditeeId() != null) {
                activeEmployeeIds.add(active.getAuditeeId());
            }
            if (active.getAuditorId() != null) {
                activeEmployeeIds.add(active.getAuditorId());
            }

            for (Long empId : employeeIds) {
                if (activeEmployeeIds.contains(empId)) {
                    com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp = employeeMasterRepository.findById(empId).orElse(null);
                    String empName = emp != null ? emp.getEmployeeName() : "Employee";
                    throw new RuntimeException("Validation Error: Employee \"" + empName
                            + "\" is already allocated to Audit " + active.getScheduleNo() + " at the same time ("
                            + active.getStartTime() + " - " + active.getEndTime() + ").");
                }
            }
        }
    }

    private boolean isSameDate(java.util.Date d1, java.util.Date d2) {
        if (d1 == null || d2 == null)
            return false;
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
        return sdf.format(d1).equals(sdf.format(d2));
    }

    private int convertTimeToMinutes(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) {
            return 0;
        }
        try {
            String clean = timeStr.trim().toUpperCase();
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("^(\\d{1,2}):(\\d{2})\\s*(AM|PM)?$");
            java.util.regex.Matcher matcher = pattern.matcher(clean);
            if (!matcher.matches()) {
                return 0;
            }
            int hours = Integer.parseInt(matcher.group(1));
            int minutes = Integer.parseInt(matcher.group(2));
            String ampm = matcher.group(3);

            if (ampm != null) {
                if ("PM".equals(ampm) && hours != 12) {
                    hours += 12;
                } else if ("AM".equals(ampm) && hours == 12) {
                    hours = 0;
                }
            }
            return hours * 60 + minutes;
        } catch (Exception e) {
            return 0;
        }
    }

    private boolean isTimeOverlapping(String start1, String end1, String start2, String end2) {
        int s1 = convertTimeToMinutes(start1);
        int e1 = convertTimeToMinutes(end1);
        int s2 = convertTimeToMinutes(start2);
        int e2 = convertTimeToMinutes(end2);
        return s1 < e2 && s2 < e1;
    }

    public void deleteAuditSchedule(Long id) {
        repository.findById(id).ifPresent(existing -> {
            // Check if there is any attendance put for this schedule
            boolean exists = !auditAttendanceRepository.findByAuditScheduleNo(existing.getScheduleNo()).isEmpty();
            if (exists) {
                throw new RuntimeException(
                        "Cannot delete this audit schedule because employee attendance has already been recorded.");
            }
            // Check if there is any observation recorded for this schedule
            boolean hasObservation = auditObservationRepository
                    .existsByAuditScheduleNoIgnoreCase(existing.getScheduleNo());
            if (hasObservation) {
                throw new RuntimeException(
                        "Cannot delete this audit schedule because audit observations have already been recorded for it.");
            }
            sendAuditNotifications(existing, "CANCEL");
            repository.delete(existing);
        });
    }

    public AuditSchedule cancelAuditSchedule(Long id, String cancelReason) {
        if (cancelReason == null || cancelReason.trim().isEmpty()) {
            throw new RuntimeException("Cancel reason is required to cancel an Audit Schedule.");
        }
        return repository.findById(id).map(existing -> {
            if ("CLOSED".equalsIgnoreCase(existing.getStatus())) {
                throw new RuntimeException("This Audit Schedule is closed and cannot be cancelled.");
            }
            if ("CANCELLED".equalsIgnoreCase(existing.getStatus())) {
                throw new RuntimeException("This Audit Schedule is already cancelled.");
            }
            existing.setStatus("CANCELLED");
            existing.setCancelReason(cancelReason.trim());
            existing.setUpdatedDate(new java.util.Date());
            existing.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());

            updateAuditSearchText(existing);
            AuditSchedule saved = repository.save(existing);

            // Send Notifications to Auditee, Auditor, NC Approved By, and Co-Ordinator
            sendAuditNotifications(saved, "CANCEL");

            // Auto-trigger next recurring draft audit immediately on cancel
            if (saved.getConfigId() != null || (saved.getFrequency() != null && !"NONE".equalsIgnoreCase(saved.getFrequency()))) {
                try {
                    com.autonoma.erp.modules.qms.audit.service.AuditSchedulerEngine engine = 
                        com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.qms.audit.service.AuditSchedulerEngine.class);
                    if (engine != null) {
                        engine.generateScheduledAudits(new java.util.Date());
                    }
                } catch (Exception ex) {
                    logger.warn("Failed to auto-generate next draft audit recurrence on cancel: {}", ex.getMessage());
                }
            }

            return saved;
        }).orElseThrow(() -> new RuntimeException("Audit Schedule not found with id " + id));
    }

    public String getNextScheduleNo() {
        String prefix = "AD-26-";
        String suffix = "";
        int digits = 4;
        try {
            java.util.List<com.autonoma.erp.model.admin.PrefixCredential> allCreds = prefixCredentialRepository
                    .findAll();
            java.time.LocalDate now = java.time.LocalDate.now();
            String currentAccountYear = now.getYear() + "-" + (now.getYear() + 1);
            com.autonoma.erp.model.admin.PrefixCredential cred = allCreds.stream()
                    .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                    .filter(c -> currentAccountYear.equals(c.getAccountYear()))
                    .findFirst()
                    .orElse(allCreds.stream()
                            .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                            .findFirst().orElse(null));

            if (cred != null) {
                if (cred.getAuditSchedulePrefix() != null && !cred.getAuditSchedulePrefix().isEmpty()) {
                    prefix = cred.getAuditSchedulePrefix();
                }
                if (cred.getAuditScheduleSuffix() != null && !cred.getAuditScheduleSuffix().isEmpty()) {
                    suffix = cred.getAuditScheduleSuffix();
                }
                digits = cred.getAuditScheduleDigit() != null ? cred.getAuditScheduleDigit() : 4;
            }
        } catch (Exception e) {
            logger.warn("Could not load prefix from AD_PREFIX_CREDENTIALS, using fallback", e);
        }

        String searchPattern = prefix + "%" + suffix;
        
        String lastNo = null;
        try {
            lastNo = jdbcTemplate.queryForObject(
                    "SELECT TOP 1 SCHEDULE_NO FROM QMS_AUDIT_SCHEDULE WHERE SCHEDULE_NO LIKE ? ORDER BY ID DESC", 
                    String.class, searchPattern);
        } catch (Exception e) {}
        
        long nextNum = 1;
        if (lastNo != null) {
            try {
                String numStr = lastNo;
                if (!prefix.isEmpty() && numStr.startsWith(prefix)) {
                    numStr = numStr.substring(prefix.length());
                }
                if (!suffix.isEmpty() && numStr.endsWith(suffix)) {
                    numStr = numStr.substring(0, numStr.length() - suffix.length());
                }
                nextNum = Long.parseLong(numStr) + 1;
            } catch (Exception e) {
                logger.warn("Could not parse sequence from latest: " + lastNo, e);
            }
        }
        return prefix + String.format("%0" + digits + "d", nextNum) + suffix;
    }

    private void updateAuditSearchText(AuditSchedule schedule) {
        schedule.setSearchText(String.join(" ",
                java.util.Objects.toString(schedule.getScheduleNo(), ""),
                java.util.Objects.toString(schedule.getAuditType(), ""),
                java.util.Objects.toString(schedule.getAuditArea(), ""),
                java.util.Objects.toString(schedule.getDepartment(), ""),
                java.util.Objects.toString(schedule.getAuditor(), ""),
                java.util.Objects.toString(schedule.getAuditee(), "")).toLowerCase());
    }

    private String buildAuditScheduleJpql(
            String taskScope, String currentUser, Long memberId,
            String fromDate, String toDate, String considerDate,
            String status, String searchValue,
            Long userEmpId, Long userDeptId, String resolvedUser, List<Long> reporteeEmpIds,
            java.util.Date parsedFromDate, java.util.Date parsedToDate,
            java.util.Map<String, Object> params,
            boolean countOnly) {

        // Clean parameters
        String cleanStatus = status;
        if (cleanStatus != null) {
            cleanStatus = cleanStatus.trim();
            if (cleanStatus.isEmpty() || "ALL".equalsIgnoreCase(cleanStatus)) {
                cleanStatus = null;
            }
        }
        String cleanSearch = searchValue;
        if (cleanSearch != null) {
            cleanSearch = cleanSearch.trim();
            if (cleanSearch.isEmpty() || "ALL".equalsIgnoreCase(cleanSearch)) {
                cleanSearch = null;
            }
        }
        
        String effectiveScope = "Mine";
        if (taskScope != null && !taskScope.trim().isEmpty()) {
            effectiveScope = taskScope;
        }

        String maxAllowedScope = "Mine";
        if ("SUPER BOSS".equalsIgnoreCase(currentUser) || "Company".equalsIgnoreCase(effectiveScope)) {
            maxAllowedScope = "Company";
        } else if (currentUser != null && !currentUser.trim().isEmpty()) {
            com.autonoma.erp.model.admin.UserCredential credential = userRepository.findByUserId(currentUser)
                    .orElse(null);
            if (credential != null && credential.getUserLevel() != null && credential.getUserLevel() >= 5) {
                maxAllowedScope = "Company";
            } else {
                com.autonoma.erp.model.admin.BosPage page = bosPageRepository.findByPageCode("QM1230")
                        .orElseGet(() -> bosPageRepository.findByPageCode("QM1210").orElse(null));
                if (page != null) {
                    com.autonoma.erp.model.admin.BosUserPageAuth auth = bosUserPageAuthRepository
                            .findByUserIdAndPageId(currentUser, page.getPageId());
                    if (auth != null) {
                        if (Integer.valueOf(1).equals(auth.getAdditional1()) || Integer.valueOf(1).equals(auth.getReadAcs())) {
                            maxAllowedScope = "Company";
                        } else if (Integer.valueOf(1).equals(auth.getManager())) {
                            maxAllowedScope = "Team";
                        } else if (Integer.valueOf(1).equals(auth.getReadAcs())) {
                            maxAllowedScope = "Mine";
                        }
                    }
                }
            }
        }

        if ("Company".equalsIgnoreCase(effectiveScope)) {
            if (!"Company".equalsIgnoreCase(maxAllowedScope)) {
                if ("Team".equalsIgnoreCase(maxAllowedScope)) {
                    effectiveScope = "Team";
                } else {
                    effectiveScope = "Mine";
                }
            }
        } else if ("Team".equalsIgnoreCase(effectiveScope)) {
            if (!"Company".equalsIgnoreCase(maxAllowedScope) && !"Team".equalsIgnoreCase(maxAllowedScope)) {
                effectiveScope = "Mine";
            }
        }

        StringBuilder jpql = new StringBuilder();
        if (countOnly) {
            jpql.append("SELECT COUNT(a) FROM AuditSchedule a WHERE 1 = 1");
        } else {
            jpql.append("SELECT a FROM AuditSchedule a WHERE 1 = 1");
        }

        if (cleanStatus != null) {
            if (cleanStatus.contains(",")) {
                jpql.append(" AND a.status IN :statusList");
                params.put("statusList", java.util.Arrays.asList(cleanStatus.split(",")));
            } else {
                jpql.append(" AND a.status = :status");
                params.put("status", cleanStatus);
            }
        }

        if (cleanSearch != null) {
            jpql.append(" AND (LOWER(a.searchText) LIKE :cleanSearch OR LOWER(a.scheduleNo) LIKE :cleanSearch)");
            params.put("cleanSearch", "%" + cleanSearch.toLowerCase() + "%");
        }

        if ("Yes".equalsIgnoreCase(considerDate)) {
            if (parsedFromDate != null) {
                jpql.append(" AND a.auditDate >= :parsedFromDate");
                params.put("parsedFromDate", parsedFromDate);
            }
            if (parsedToDate != null) {
                jpql.append(" AND a.auditDate <= :parsedToDate");
                params.put("parsedToDate", parsedToDate);
            }
        }

        if (memberId != null) {
            jpql.append(" AND (a.auditorId = :memberId OR a.auditeeId = :memberId)");
            params.put("memberId", memberId);
        } else {
            if ("Mine".equalsIgnoreCase(effectiveScope)) {
                jpql.append(" AND (");
                boolean hasCondition = false;
                if (userEmpId != null) {
                    jpql.append("(a.auditorId = :userEmpId OR a.auditeeId = :userEmpId OR a.ncrApprovedById = :userEmpId)");
                    params.put("userEmpId", userEmpId);
                    hasCondition = true;
                }
                if (resolvedUser != null && !resolvedUser.trim().isEmpty()) {
                    if (hasCondition) jpql.append(" OR ");
                    String cleanResolved = resolvedUser.toLowerCase().trim();
                    jpql.append("(LOWER(a.createdUser) = :resolvedUser OR LOWER(a.searchText) LIKE :resolvedLike)");
                    params.put("resolvedUser", cleanResolved);
                    params.put("resolvedLike", "%" + cleanResolved + "%");
                    hasCondition = true;
                }
                if (!hasCondition) {
                    jpql.append("1=0");
                }
                jpql.append(")");
            } else if ("Team".equalsIgnoreCase(effectiveScope)) {
                jpql.append(" AND (");
                boolean hasCondition = false;
                if (userEmpId != null) {
                    jpql.append("(a.auditorId = :userEmpId OR a.auditeeId = :userEmpId OR a.ncrApprovedById = :userEmpId)");
                    params.put("userEmpId", userEmpId);
                    hasCondition = true;
                }
                if (userDeptId != null) {
                    if (hasCondition) jpql.append(" OR ");
                    jpql.append("a.departmentId = :userDeptId");
                    params.put("userDeptId", userDeptId);
                    hasCondition = true;
                }
                if (reporteeEmpIds != null && !reporteeEmpIds.isEmpty()) {
                    if (hasCondition) jpql.append(" OR ");
                    jpql.append("(a.auditorId IN :reporteeEmpIds OR a.auditeeId IN :reporteeEmpIds OR a.ncrApprovedById IN :reporteeEmpIds)");
                    params.put("reporteeEmpIds", reporteeEmpIds);
                    hasCondition = true;
                }
                if (resolvedUser != null) {
                    if (hasCondition) jpql.append(" OR ");
                    jpql.append("LOWER(a.createdUser) = :resolvedUser");
                    params.put("resolvedUser", resolvedUser.toLowerCase().trim());
                    hasCondition = true;
                }
                if (!hasCondition) {
                    jpql.append("1=0");
                }
                jpql.append(")");
            }
        }



        return jpql.toString();
    }

    public Page<AuditSchedule> searchAuditSchedules(String status, String searchValue, Pageable pageable,
            String taskScope, String currentUser, Long memberId, String fromDate, String toDate, String considerDate) {
        Long userEmpId = null;
        Long userDeptId = null;
        String employeeName = null;

        String resolvedUser = currentUser;
        if (resolvedUser == null || resolvedUser.trim().isEmpty()) {
            resolvedUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        }

        if (resolvedUser != null && !resolvedUser.trim().isEmpty()) {
            String origTenant = TenantContextHolder.getTenantId();
            try {
                TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                com.autonoma.erp.model.admin.UserCredential credential = userRepository.findByUserId(resolvedUser).orElse(null);
                if (credential != null) {
                    userEmpId = credential.getEmpId();
                }
            } finally {
                TenantContextHolder.setTenantId(origTenant);
            }
            if (userEmpId == null) {
                EmployeeMaster empFallback = employeeMasterRepository.findByEmpCodeOrName(resolvedUser).orElse(null);
                if (empFallback != null) {
                    userEmpId = empFallback.getId();
                }
            }
            if (userEmpId != null) {
                EmployeeMaster emp = employeeMasterRepository.findById(userEmpId).orElse(null);
                if (emp != null) {
                    employeeName = emp.getEmployeeName();
                    if (emp.getOrganization() != null) {
                        userDeptId = emp.getOrganization().getDepartmentId();
                    }
                }
            }
        }

        List<Long> reporteeEmpIds = new ArrayList<>();
        if (employeeName != null && !employeeName.trim().isEmpty()) {
            List<EmployeeMaster> activeReports = employeeMasterRepository
                    .findActiveReportsByVerticalHeadName(employeeName.trim());
            if (activeReports != null) {
                for (EmployeeMaster reportee : activeReports) {
                    reporteeEmpIds.add(reportee.getId());
                }
            }
        }

        java.util.Date parsedFromDate = null;
        java.util.Date parsedToDate = null;
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
        if ("Yes".equalsIgnoreCase(considerDate)) {
            try {
                if (fromDate != null && !fromDate.trim().isEmpty()) {
                    java.util.Date temp = sdf.parse(fromDate);
                    java.util.Calendar cal = java.util.Calendar
                            .getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                    cal.setTime(temp);
                    cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
                    cal.set(java.util.Calendar.MINUTE, 0);
                    cal.set(java.util.Calendar.SECOND, 0);
                    cal.set(java.util.Calendar.MILLISECOND, 0);
                    parsedFromDate = cal.getTime();
                } else {
                    java.util.Calendar cal = java.util.Calendar
                            .getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                    cal.set(1970, 0, 1, 0, 0, 0);
                    parsedFromDate = cal.getTime();
                }
            } catch (Exception e) {
            }
            try {
                if (toDate != null && !toDate.trim().isEmpty()) {
                    java.util.Date temp = sdf.parse(toDate);
                    java.util.Calendar cal = java.util.Calendar
                            .getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                    cal.setTime(temp);
                    cal.set(java.util.Calendar.HOUR_OF_DAY, 23);
                    cal.set(java.util.Calendar.MINUTE, 59);
                    cal.set(java.util.Calendar.SECOND, 59);
                    cal.set(java.util.Calendar.MILLISECOND, 999);
                    parsedToDate = cal.getTime();
                } else {
                    java.util.Calendar cal = java.util.Calendar
                            .getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                    cal.set(2099, 11, 31, 23, 59, 59);
                    parsedToDate = cal.getTime();
                }
            } catch (Exception e) {
            }
        }

        java.util.Map<String, Object> params = new java.util.HashMap<>();
        String countJpql = buildAuditScheduleJpql(taskScope, currentUser, memberId, fromDate, toDate, considerDate, status, searchValue,
                userEmpId, userDeptId, resolvedUser, reporteeEmpIds, parsedFromDate, parsedToDate, params, true);

        jakarta.persistence.TypedQuery<Long> countQuery = entityManager.createQuery(countJpql, Long.class);
        for (java.util.Map.Entry<String, Object> entry : params.entrySet()) {
            countQuery.setParameter(entry.getKey(), entry.getValue());
        }
        Long totalCount = countQuery.getSingleResult();

        if (totalCount == 0) {
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }

        String selectJpql = buildAuditScheduleJpql(taskScope, currentUser, memberId, fromDate, toDate, considerDate, status, searchValue,
                userEmpId, userDeptId, resolvedUser, reporteeEmpIds, parsedFromDate, parsedToDate, params, false);

        selectJpql += " ORDER BY a.id DESC";
        jakarta.persistence.TypedQuery<AuditSchedule> selectQuery = entityManager.createQuery(selectJpql, AuditSchedule.class);
        for (java.util.Map.Entry<String, Object> entry : params.entrySet()) {
            selectQuery.setParameter(entry.getKey(), entry.getValue());
        }

        if (pageable != null) {
            selectQuery.setFirstResult((int) pageable.getOffset());
            selectQuery.setMaxResults(pageable.getPageSize());
        }

        List<AuditSchedule> resultList = selectQuery.getResultList();

        List<String> scheduleNos = new ArrayList<>();
        for (AuditSchedule s : resultList) {
            if (s.getScheduleNo() != null) {
                scheduleNos.add(s.getScheduleNo());
            }
        }

        java.util.Set<String> obsSet = new java.util.HashSet<>();
        java.util.Set<String> attSet = new java.util.HashSet<>();

        if (!scheduleNos.isEmpty()) {
            List<String> obsList = entityManager
                    .createQuery("SELECT DISTINCT o.auditScheduleNo FROM AuditObservation o WHERE o.auditScheduleNo IN :scheduleNos", String.class)
                    .setParameter("scheduleNos", scheduleNos)
                    .getResultList();
            for (String s : obsList) {
                if (s != null) obsSet.add(s.trim().toUpperCase());
            }

            List<String> attList = entityManager
                    .createQuery("SELECT DISTINCT a.auditSchedule.scheduleNo FROM AuditAttendance a WHERE a.auditSchedule.scheduleNo IN :scheduleNos", String.class)
                    .setParameter("scheduleNos", scheduleNos)
                    .getResultList();
            for (String s : attList) {
                if (s != null) attSet.add(s.trim().toUpperCase());
            }
        }

        for (AuditSchedule schedule : resultList) {
            String schNo = schedule.getScheduleNo();
            String upperSchNo = schNo != null ? schNo.trim().toUpperCase() : null;

            boolean exists = upperSchNo != null && attSet.contains(upperSchNo);
            schedule.setHasAttendance(exists);

            boolean hasObservation = upperSchNo != null && obsSet.contains(upperSchNo);
            if (hasObservation && !"CLOSED".equalsIgnoreCase(schedule.getStatus())) {
                schedule.setStatus("CLOSED");
            }
        }

        return new PageImpl<>(resultList, pageable, totalCount);
    }

    @org.springframework.transaction.annotation.Transactional
    public void generateScheduledAudits(java.util.Date targetDate) {
        logger.info("Starting automatic Audit Schedule generation for target date: {}", targetDate);
        try {
            AuditSchedulerEngine engine = com.autonoma.erp.util.SpringContext.getBean(AuditSchedulerEngine.class);
            if (engine != null) {
                engine.generateScheduledAudits(targetDate);
            }
            cleanupDuplicateOpenSchedules();
        } catch (Exception e) {
            logger.error("Failed to run AuditSchedulerEngine from generateScheduledAudits", e);
        }
    }

    public void cleanupDuplicateOpenSchedules() {
        try {
            List<AuditSchedule> allOpen = repository.findAllOpenActive();
            java.util.Map<String, List<AuditSchedule>> groupMap = new java.util.HashMap<>();
            for (AuditSchedule s : allOpen) {
                if (s.getAuditDate() == null) continue;
                java.time.LocalDate d = convertToLocalDate(s.getAuditDate());
                String freq = s.getFrequency() != null ? s.getFrequency().trim().toUpperCase() : "MONTHLY";
                if (!"MONTHLY".equalsIgnoreCase(freq)) continue;

                String typeKey = s.getAuditTypeId() != null ? String.valueOf(s.getAuditTypeId()) : (s.getAuditType() != null ? s.getAuditType() : "");
                String deptKey = s.getDepartmentId() != null ? String.valueOf(s.getDepartmentId()) : (s.getDepartment() != null ? s.getDepartment() : "");
                String areaKey = s.getAuditAreaId() != null ? String.valueOf(s.getAuditAreaId()) : (s.getAuditArea() != null ? s.getAuditArea() : "");

                String key = typeKey + "__" + deptKey + "__" + areaKey + "__" + d.getYear() + "-" + d.getMonthValue();
                groupMap.computeIfAbsent(key, k -> new java.util.ArrayList<>()).add(s);
            }

            for (List<AuditSchedule> list : groupMap.values()) {
                if (list.size() > 1) {
                    List<AuditSchedule> noAttendanceList = list.stream()
                        .filter(s -> auditAttendanceRepository.findByAuditScheduleNo(s.getScheduleNo()).isEmpty())
                        .sorted((a, b) -> b.getId().compareTo(a.getId()))
                        .toList();

                    if (noAttendanceList.size() > 1) {
                        for (int i = 1; i < noAttendanceList.size(); i++) {
                            AuditSchedule dupe = noAttendanceList.get(i);
                            dupe.setIsActive(false);
                            dupe.setStatus("CANCELLED");
                            dupe.setCancelReason("Auto-cleaned duplicate monthly schedule");
                            repository.save(dupe);
                            logger.info("Deactivated duplicate open schedule ID {} ({}) for date {}", dupe.getId(), dupe.getScheduleNo(), dupe.getAuditDate());
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Failed to cleanup duplicate open schedules", e);
        }
    }

    private java.util.Date truncateTime(java.util.Date date) {
        java.util.Calendar cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
        cal.setTime(date);
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
        cal.set(java.util.Calendar.MINUTE, 0);
        cal.set(java.util.Calendar.SECOND, 0);
        cal.set(java.util.Calendar.MILLISECOND, 0);
        return cal.getTime();
    }

    private java.time.LocalDate convertToLocalDate(java.util.Date date) {
        if (date instanceof java.sql.Date) {
            return ((java.sql.Date) date).toLocalDate();
        }
        return date.toInstant().atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate();
    }

    private java.time.LocalDate getLatestAuditDateForTemplate(AuditSchedule template) {
        List<AuditSchedule> children = repository.findByParentId(template.getId());
        java.util.Optional<java.util.Date> latestDate = children.stream()
                .map(AuditSchedule::getAuditDate)
                .filter(java.util.Objects::nonNull)
                .max(java.util.Comparator.naturalOrder());

        if (latestDate.isPresent()) {
            return convertToLocalDate(latestDate.get());
        }
        if (template.getAuditDate() != null) {
            return convertToLocalDate(template.getAuditDate());
        }
        return java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
    }

    private java.time.LocalDate computeNextAuditDate(java.time.LocalDate baseDate, String frequency, Integer repeatVal, String repeatUnit) {
        if (baseDate == null) {
            return java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
        }
        if (frequency == null || "NONE".equalsIgnoreCase(frequency)) {
            return baseDate;
        }

        int val = (repeatVal != null && repeatVal > 0) ? repeatVal : 1;
        String unit = (repeatUnit != null) ? repeatUnit.trim().toUpperCase() : "DAYS";

        return switch (frequency.trim().toUpperCase()) {
            case "DAILY" -> baseDate.plusDays(1);
            case "WEEKLY" -> baseDate.plusWeeks(1);
            case "MONTHLY" -> baseDate.plusMonths(1);
            case "QUARTERLY" -> baseDate.plusMonths(3);
            case "HALF YEARLY", "HALF_YEARLY", "BI-ANNUAL", "BI_ANNUAL" -> baseDate.plusMonths(6);
            case "YEARLY", "ANNUAL" -> baseDate.plusYears(1);
            case "CUSTOM" -> switch (unit) {
                case "DAYS" -> baseDate.plusDays(val);
                case "WEEKS" -> baseDate.plusWeeks(val);
                case "MONTHS" -> baseDate.plusMonths(val);
                default -> baseDate.plusDays(val);
            };
            default -> baseDate.plusDays(1);
        };
    }

    private boolean isHolidayOrSunday(java.time.LocalDate date) {
        if (date == null) return false;
        if (date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) return true;
        try {
            com.autonoma.erp.util.HolidayValidator.validateDate(date);
            return false;
        } catch (Exception e) {
            return true;
        }
    }

    private java.time.LocalDate adjustToNextWorkingDay(java.time.LocalDate candidateDate) {
        java.time.LocalDate current = candidateDate;
        int maxAttempts = 60;
        int attempts = 0;

        while (attempts < maxAttempts) {
            if (isHolidayOrSunday(current)) {
                current = current.plusDays(1);
                attempts++;
                continue;
            }

            return current;
        }

        return current;
    }

    private EmployeeMaster selectNextEligibleAuditor(AuditSchedule template, java.util.Date executionDate) {
        String auditType = template.getAuditType();
        if (auditType == null || auditType.trim().isEmpty()) {
            return null;
        }
        String cleanAuditType = auditType.trim().toUpperCase();
        String scheduleDept = template.getDepartment();
        
        List<EmployeeMaster> allEmployees = employeeMasterRepository.findAll().stream()
                .filter(e -> e.getStatus() != null && "Active".equalsIgnoreCase(e.getStatus().getName()) && Boolean.TRUE.equals(e.getIsActive()))
                .toList();
                
        List<EmployeeMaster> eligibleAuditors = allEmployees.stream()
                .filter(e -> "YES".equalsIgnoreCase(e.getIsAuditor()))
                .filter(e -> hasEligibilityType(e.getAuditorType(), cleanAuditType))
                .filter(e -> {
                    if (e.getDepartment() != null && scheduleDept != null) {
                        return !scheduleDept.trim().equalsIgnoreCase(e.getDepartment().getDepartmentName());
                    }
                    return true;
                })
                .sorted(java.util.Comparator.comparing(EmployeeMaster::getId))
                .toList();
                
        if (eligibleAuditors.isEmpty()) {
            return null;
        }

        List<EmployeeMaster> availableAuditors = eligibleAuditors;
        if (leaveEntryRepository != null && executionDate != null) {
            availableAuditors = eligibleAuditors.stream()
                    .filter(e -> leaveEntryRepository.findByEmployeeIdAndDateAndIsActiveTrue(e.getId(), executionDate).isEmpty())
                    .toList();
        }

        if (availableAuditors.isEmpty()) {
            return null;
        }
        
        Optional<AuditSchedule> lastGenOpt = repository.findFirstByParentIdOrderByIdDesc(template.getId());
        if (lastGenOpt.isEmpty() || lastGenOpt.get().getAuditorId() == null) {
            return availableAuditors.get(0);
        }
        
        Long lastAuditorId = lastGenOpt.get().getAuditorId();
        int lastIndex = -1;
        for (int i = 0; i < availableAuditors.size(); i++) {
            if (availableAuditors.get(i).getId().equals(lastAuditorId)) {
                lastIndex = i;
                break;
            }
        }
        
        int nextIndex = (lastIndex + 1) % availableAuditors.size();
        return availableAuditors.get(nextIndex);
    }

    private EmployeeMaster selectNextEligibleAuditor(AuditSchedule template) {
        return selectNextEligibleAuditor(template, null);
    }

    private EmployeeMaster selectNextEligibleAuditee(AuditSchedule template, java.util.Date executionDate) {
        String auditType = template.getAuditType();
        if (auditType == null || auditType.trim().isEmpty()) {
            return null;
        }
        String cleanAuditType = auditType.trim().toUpperCase();
        String scheduleDept = template.getDepartment();
        
        List<EmployeeMaster> allEmployees = employeeMasterRepository.findAll().stream()
                .filter(e -> e.getStatus() != null && "Active".equalsIgnoreCase(e.getStatus().getName()) && Boolean.TRUE.equals(e.getIsActive()))
                .toList();
                
        List<EmployeeMaster> eligibleAuditees = allEmployees.stream()
                .filter(e -> "YES".equalsIgnoreCase(e.getIsAuditee()))
                .filter(e -> hasEligibilityType(e.getAuditeeType(), cleanAuditType))
                .filter(e -> {
                    if (e.getDepartment() != null && scheduleDept != null) {
                        return scheduleDept.trim().equalsIgnoreCase(e.getDepartment().getDepartmentName());
                    }
                    return false;
                })
                .sorted(java.util.Comparator.comparing(EmployeeMaster::getId))
                .toList();
                
        if (eligibleAuditees.isEmpty()) {
            return null;
        }

        List<EmployeeMaster> availableAuditees = eligibleAuditees;
        if (leaveEntryRepository != null && executionDate != null) {
            availableAuditees = eligibleAuditees.stream()
                    .filter(e -> leaveEntryRepository.findByEmployeeIdAndDateAndIsActiveTrue(e.getId(), executionDate).isEmpty())
                    .toList();
        }

        if (availableAuditees.isEmpty()) {
            return null;
        }
        
        Optional<AuditSchedule> lastGenOpt = repository.findFirstByParentIdOrderByIdDesc(template.getId());
        if (lastGenOpt.isEmpty() || lastGenOpt.get().getAuditeeId() == null) {
            return availableAuditees.get(0);
        }
        
        Long lastAuditeeId = lastGenOpt.get().getAuditeeId();
        int lastIndex = -1;
        for (int i = 0; i < availableAuditees.size(); i++) {
            if (availableAuditees.get(i).getId().equals(lastAuditeeId)) {
                lastIndex = i;
                break;
            }
        }
        
        int nextIndex = (lastIndex + 1) % availableAuditees.size();
        return availableAuditees.get(nextIndex);
    }

    private EmployeeMaster selectNextEligibleAuditee(AuditSchedule template) {
        return selectNextEligibleAuditee(template, null);
    }

    private void validateConsecutiveAssignment(AuditSchedule schedule) {
        Long parentId = schedule.getParentId();
        if (parentId == null && (schedule.getFrequency() == null || "NONE".equalsIgnoreCase(schedule.getFrequency()))) {
            return;
        }
        
        Long templateId = parentId != null ? parentId : schedule.getId();
        if (templateId == null) {
            return;
        }
        
        // Find the last generated schedule (excluding the current schedule if it's already saved)
        List<AuditSchedule> children = repository.findAll().stream()
                .filter(a -> templateId.equals(a.getParentId()))
                .filter(a -> schedule.getId() == null || !a.getId().equals(schedule.getId()))
                .sorted((a1, a2) -> a2.getId().compareTo(a1.getId()))
                .toList();

        if (children.isEmpty()) {
            return;
        }
        
        AuditSchedule lastGen = children.get(0);

        
        if (schedule.getAuditorId() != null && schedule.getAuditorId().equals(lastGen.getAuditorId())) {
            int eligibleAuditorCount = countEligibleAuditors(schedule);
            if (eligibleAuditorCount > 1) {
                throw new RuntimeException("Validation Error: Consecutive assignment of the same Auditor \"" 
                        + schedule.getAuditor() + "\" is not allowed.");
            }
        }
        
        if (schedule.getAuditeeId() != null && schedule.getAuditeeId().equals(lastGen.getAuditeeId())) {
            int eligibleAuditeeCount = countEligibleAuditees(schedule);
            if (eligibleAuditeeCount > 1) {
                throw new RuntimeException("Validation Error: Consecutive assignment of the same Auditee \"" 
                        + schedule.getAuditee() + "\" is not allowed.");
            }
        }
    }

    private int countEligibleAuditors(AuditSchedule template) {
        String auditType = template.getAuditType();
        if (auditType == null || auditType.trim().isEmpty()) {
            return 0;
        }
        String cleanAuditType = auditType.trim().toUpperCase();
        String scheduleDept = template.getDepartment();
        
        return (int) employeeMasterRepository.findAll().stream()
                .filter(e -> e.getStatus() != null && "Active".equalsIgnoreCase(e.getStatus().getName()) && Boolean.TRUE.equals(e.getIsActive()))
                .filter(e -> "YES".equalsIgnoreCase(e.getIsAuditor()))
                .filter(e -> hasEligibilityType(e.getAuditorType(), cleanAuditType))
                .filter(e -> {
                    if (e.getDepartment() != null && scheduleDept != null) {
                        return !scheduleDept.trim().equalsIgnoreCase(e.getDepartment().getDepartmentName());
                    }
                    return true;
                })
                .count();
    }
    
    private int countEligibleAuditees(AuditSchedule template) {
        String auditType = template.getAuditType();
        if (auditType == null || auditType.trim().isEmpty()) {
            return 0;
        }
        String cleanAuditType = auditType.trim().toUpperCase();
        String scheduleDept = template.getDepartment();
        
        return (int) employeeMasterRepository.findAll().stream()
                .filter(e -> e.getStatus() != null && "Active".equalsIgnoreCase(e.getStatus().getName()) && Boolean.TRUE.equals(e.getIsActive()))
                .filter(e -> "YES".equalsIgnoreCase(e.getIsAuditee()))
                .filter(e -> hasEligibilityType(e.getAuditeeType(), cleanAuditType))
                .filter(e -> {
                    if (e.getDepartment() != null && scheduleDept != null) {
                        return scheduleDept.trim().equalsIgnoreCase(e.getDepartment().getDepartmentName());
                    }
                    return false;
                })
                .count();
    }

    private EmployeeMaster selectNextEligibleNcrApprover(AuditSchedule template, EmployeeMaster auditor, EmployeeMaster auditee) {
        String auditType = template.getAuditType();
        if (auditType == null || auditType.trim().isEmpty()) {
            return null;
        }
        String cleanAuditType = auditType.trim().toUpperCase();
        String scheduleDept = template.getDepartment();

        List<EmployeeMaster> allEmployees = employeeMasterRepository.findAll().stream()
                .filter(e -> e.getStatus() != null && "Active".equalsIgnoreCase(e.getStatus().getName()) && Boolean.TRUE.equals(e.getIsActive()))
                .toList();

        List<EmployeeMaster> eligibleNcrApprovers = allEmployees.stream()
                .filter(e -> "YES".equalsIgnoreCase(e.getIsNcrApprover()))
                .filter(e -> hasEligibilityType(e.getNcrApproverType(), cleanAuditType))
                .filter(e -> {
                    if (auditor != null && e.getId().equals(auditor.getId()))
                        return false;
                    if (auditee != null && e.getId().equals(auditee.getId()))
                        return false;
                    if (e.getDepartment() != null && scheduleDept != null) {
                        return !scheduleDept.trim().equalsIgnoreCase(e.getDepartment().getDepartmentName());
                    }
                    return true;
                })
                .sorted(java.util.Comparator.comparing(EmployeeMaster::getId))
                .toList();

        if (eligibleNcrApprovers.isEmpty()) {
            return auditor;
        }

        if (eligibleNcrApprovers.size() == 1) {
            return eligibleNcrApprovers.get(0);
        }

        Optional<AuditSchedule> lastGenOpt = repository.findFirstByParentIdOrderByIdDesc(template.getId());
        if (lastGenOpt.isEmpty() || lastGenOpt.get().getNcrApprovedById() == null) {
            return eligibleNcrApprovers.get(0);
        }

        Long lastNcrId = lastGenOpt.get().getNcrApprovedById();
        int lastIndex = -1;
        for (int i = 0; i < eligibleNcrApprovers.size(); i++) {
            if (eligibleNcrApprovers.get(i).getId().equals(lastNcrId)) {
                lastIndex = i;
                break;
            }
        }

        int nextIndex = (lastIndex + 1) % eligibleNcrApprovers.size();
        if (eligibleNcrApprovers.size() > 1 && eligibleNcrApprovers.get(nextIndex).getId().equals(lastNcrId)) {
            nextIndex = (nextIndex + 1) % eligibleNcrApprovers.size();
        }
        return eligibleNcrApprovers.get(nextIndex);
    }
}
