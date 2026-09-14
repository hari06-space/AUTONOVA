package com.autonoma.erp.modules.hra.leaveencashment.service;

import com.autonoma.erp.modules.hra.leaveencashment.entity.HraLeaveEncashmentVerified;
import com.autonoma.erp.modules.hra.leaveencashment.repository.HraLeaveEncashmentVerifiedRepository;
import com.autonoma.erp.modules.platform.notification.service.NotificationService;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import java.sql.Timestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeManagerMapping;

@Slf4j
@Service
public class HraLeaveEncashmentVerifiedService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(HraLeaveEncashmentVerifiedService.class);

    private final HraLeaveEncashmentVerifiedRepository repository;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;
    private final JdbcTemplate jdbcTemplate;
    private final EmployeeMasterRepository employeeRepository;
    private final EmployeeManagerMappingRepository managerMappingRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public HraLeaveEncashmentVerifiedService(
            HraLeaveEncashmentVerifiedRepository repository,
            ObjectMapper objectMapper,
            NotificationService notificationService,
            JdbcTemplate jdbcTemplate,
            EmployeeMasterRepository employeeRepository,
            EmployeeManagerMappingRepository managerMappingRepository) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
        this.jdbcTemplate = jdbcTemplate;
        this.employeeRepository = employeeRepository;
        this.managerMappingRepository = managerMappingRepository;
    }

    @Transactional(readOnly = true)
    public List<HraLeaveEncashmentVerified> getAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<HraLeaveEncashmentVerified> getByYear(Integer year) {
        return repository.findByEncashmentYear(year);
    }

    @Transactional(readOnly = true)
    public List<HraLeaveEncashmentVerified> getByEmployeeId(Long employeeId) {
        return repository.findByEmployeeId(employeeId);
    }

    @Transactional(readOnly = true)
    public HraLeaveEncashmentVerified getById(Long id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Leave encashment record not found"));
    }

    @Transactional
    public HraLeaveEncashmentVerified create(HraLeaveEncashmentVerified record) {
        if (record.getId() == null) {
            record.setStatus("PENDING");
        }
        snapshotEmployeeDetails(record);
        computePerDaySalary(record);
        record.setIsActive(true);

        String sql = "INSERT INTO HRA_LEAVE_ENCASHMENT_VERIFIED (" +
            "ENCASHMENT_YEAR, EMPLOYEE_ID, EMP_ID, EMP_NAME, CURRENT_EL, CURRENT_CL, PREV_YRS_EL, PREV_YRS_CL, " +
            "EL_ENCASHMENT, CL_ENCASHMENT, BASIC_SALARY, PER_DAY_SALARY, ENCASHMENT_AMOUNT, STATUS, " +
            "CREATED_BY, CREATED_DATE, IS_ACTIVE) " +
            "OUTPUT INSERTED.id " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) currentUserId = "SYSTEM";

        Long newId = jdbcTemplate.queryForObject(sql, Long.class, 
            record.getEncashmentYear() != null ? record.getEncashmentYear() : 0,
            record.getEmployee() != null ? record.getEmployee().getId() : null,
            record.getEmpId(),
            record.getEmpName(),
            record.getCurrentEl() != null ? record.getCurrentEl() : BigDecimal.ZERO,
            record.getCurrentCl() != null ? record.getCurrentCl() : BigDecimal.ZERO,
            record.getPrevYrsEl() != null ? record.getPrevYrsEl() : BigDecimal.ZERO,
            record.getPrevYrsCl() != null ? record.getPrevYrsCl() : BigDecimal.ZERO,
            record.getElEncashment() != null ? record.getElEncashment() : BigDecimal.ZERO,
            record.getClEncashment() != null ? record.getClEncashment() : BigDecimal.ZERO,
            record.getBasicSalary() != null ? record.getBasicSalary() : BigDecimal.ZERO,
            record.getPerDaySalary() != null ? record.getPerDaySalary() : BigDecimal.ZERO,
            record.getEncashmentAmount() != null ? record.getEncashmentAmount() : BigDecimal.ZERO,
            record.getStatus(),
            currentUserId,
            new Timestamp(System.currentTimeMillis()),
            true
        );

        record.setId(newId);
        HraLeaveEncashmentVerified saved = repository.findById(record.getId()).orElse(record);

        try {
            if (saved.getEmployee() != null && saved.getEmployee().getId() != null) {
                Long vhEmpId = getVerticalHeadEmpId(saved.getEmployee().getId());
                if (vhEmpId != null) {
                    notificationService.notifyUserAboutLeaveEncashment(vhEmpId, saved, "SUBMIT", null);
                }
            }
        } catch (Exception e) {
            log.error("Failed to send SUBMIT notification for leave encashment", e);
        }

        return saved;
    }

    @Transactional
    public HraLeaveEncashmentVerified update(Long id, HraLeaveEncashmentVerified incoming) {
        HraLeaveEncashmentVerified existing = getById(id);
        if ("APPROVED".equals(existing.getStatus())) throw new RuntimeException("Cannot edit APPROVED record.");
        boolean wasRejected = "REJECTED".equals(existing.getStatus());
        if (wasRejected) existing.setStatus("PENDING");
        existing.setEncashmentYear(incoming.getEncashmentYear());

        existing.setEmployee(incoming.getEmployee());
        snapshotEmployeeDetails(existing);
        existing.setCurrentEl(incoming.getCurrentEl());
        existing.setCurrentCl(incoming.getCurrentCl());
        existing.setSl(incoming.getSl());
        existing.setAl(incoming.getAl());
        existing.setPl(incoming.getPl());
        existing.setPrevYrsEl(incoming.getPrevYrsEl());
        existing.setPrevYrsCl(incoming.getPrevYrsCl());
        existing.setElEncashment(incoming.getElEncashment());
        existing.setClEncashment(incoming.getClEncashment());
        existing.setBasicSalary(incoming.getBasicSalary());
        existing.setPerDaySalary(incoming.getPerDaySalary());
        existing.setEncashmentAmount(incoming.getEncashmentAmount());
        existing.setRemarks(incoming.getRemarks());
        computePerDaySalary(existing);
        HraLeaveEncashmentVerified saved = repository.save(existing);

        if (wasRejected) {
            try {
                if (saved.getEmployee() != null && saved.getEmployee().getId() != null) {
                    Long vhEmpId = getVerticalHeadEmpId(saved.getEmployee().getId());
                    if (vhEmpId != null) {
                        notificationService.notifyUserAboutLeaveEncashment(vhEmpId, saved, "RESUBMIT", null);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to send RESUBMIT notification for leave encashment", e);
            }
        }

        return saved;
    }

    @Transactional
    public HraLeaveEncashmentVerified approve(Long id, String remarks) {
        HraLeaveEncashmentVerified existing = getById(id);
        existing.setStatus("APPROVED");
        if (remarks != null && !remarks.isBlank()) existing.setRemarks(remarks.trim());
        HraLeaveEncashmentVerified saved = repository.save(existing);

        try {
            if (saved.getEmployee() != null && saved.getEmployee().getId() != null) {
                notificationService.notifyUserAboutLeaveEncashment(saved.getEmployee().getId(), saved, "APPROVE", null);
            }
        } catch (Exception e) {
            log.error("Failed to send APPROVE notification for leave encashment", e);
        }

        return saved;
    }

    @Transactional
    public HraLeaveEncashmentVerified reject(Long id, String remarks) {
        HraLeaveEncashmentVerified existing = getById(id);
        existing.setStatus("REJECTED");
        existing.setRejectedBy(SecurityUtils.getCurrentUserId());
        existing.setRejectedDate(LocalDateTime.now());
        
        Integer currentRevNo = existing.getRevNo() != null ? existing.getRevNo() : 0;
        existing.setRevNo(currentRevNo + 1);

        try {
            List<Map<String, Object>> history = new ArrayList<>();
            if (existing.getRejectionComment() != null && !existing.getRejectionComment().trim().isEmpty()) {
                try {
                    List<Map<String, Object>> parsed = objectMapper.readValue(
                        existing.getRejectionComment(), 
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class)
                    );
                    if (parsed != null) history.addAll(parsed);
                } catch (Exception e) {
                    log.warn("Could not parse existing rejection history: {}", e.getMessage());
                }
            }

            history.add(Map.of(
                "revNo", existing.getRevNo(),
                "remarks", remarks != null ? remarks : "",
                "rejectedBy", existing.getRejectedBy() != null ? existing.getRejectedBy() : "Unknown",
                "rejectedAt", existing.getRejectedDate().toString()
            ));

            existing.setRejectionComment(objectMapper.writeValueAsString(history));
        } catch (Exception e) {
            log.error("Error creating rejection history JSON", e);
            existing.setRejectionComment(remarks);
        }

        HraLeaveEncashmentVerified saved = repository.save(existing);

        try {
            if (saved.getEmployee() != null && saved.getEmployee().getId() != null) {
                notificationService.notifyUserAboutLeaveEncashment(saved.getEmployee().getId(), saved, "REJECT", remarks);
            }
        } catch (Exception e) {
            log.error("Failed to send REJECT notification for leave encashment", e);
        }

        return saved;
    }

    @Transactional
    public HraLeaveEncashmentVerified verify(Long id, String remarks) {
        HraLeaveEncashmentVerified existing = getById(id);
        existing.setStatus("VERIFIED");
        existing.setVerifiedBy(SecurityUtils.getCurrentUserId());
        existing.setVerifiedDate(LocalDateTime.now());
        if (remarks != null) existing.setRemarks(remarks.trim());
        HraLeaveEncashmentVerified saved = repository.save(existing);

        try {
            if (saved.getEmployee() != null && saved.getEmployee().getId() != null) {
                notificationService.notifyUserAboutLeaveEncashment(saved.getEmployee().getId(), saved, "VERIFY", null);
            }
        } catch (Exception e) {
            log.error("Failed to send VERIFY notification for leave encashment", e);
        }

        return saved;
    }

    private Long getVerticalHeadEmpId(Long empId) {
        if (empId == null) return null;
        return managerMappingRepository.findByEmpId(empId)
                .map(m -> m.getVerticalHeadId() != null ? m.getVerticalHeadId() : m.getHomeManagerId())
                .orElse(null);
    }

    @Transactional
    public void softDelete(Long id) {
        HraLeaveEncashmentVerified existing = getById(id);
        existing.setIsActive(false);
        repository.save(existing);
    }

    private void snapshotEmployeeDetails(HraLeaveEncashmentVerified record) {
        if (record.getEmployee() != null && record.getEmployee().getId() != null) {
            EmployeeMaster emp = employeeRepository.findById(record.getEmployee().getId()).orElse(null);
            if (emp != null) {
                String code = (emp.getOldEmpCode() != null && !emp.getOldEmpCode().trim().isEmpty())
                        ? emp.getOldEmpCode().trim()
                        : emp.getEmpCode();
                record.setEmpId(code);
                record.setEmpName(emp.getEmployeeName());
            }
        }
    }

    private void computePerDaySalary(HraLeaveEncashmentVerified record) {
        if (record.getBasicSalary() != null && record.getBasicSalary().compareTo(BigDecimal.ZERO) > 0 && 
           (record.getPerDaySalary() == null || record.getPerDaySalary().compareTo(BigDecimal.ZERO) == 0)) {
            record.setPerDaySalary(record.getBasicSalary().divide(BigDecimal.valueOf(26), 2, RoundingMode.HALF_UP));
        }
    }
}
