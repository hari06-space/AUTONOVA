package com.autonoma.erp.modules.qms.meeting.service;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMomMaster;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMomDetails;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMomReportHd;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMomReportDt;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMomMasterRepository;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMomReportRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class QmsMomReportService {

    @Autowired
    private QmsMomMasterRepository masterRepository;
    
    @Autowired
    private QmsMomReportRepository legacyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeMasterRepository employeeRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.BosUserPageAuthRepository bosUserPageAuthRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.BosPageRepository bosPageRepository;

    public List<QmsMomReportHd> getReports(String type, LocalDate fromDate, LocalDate toDate, String status, String process, String actionType, String actionValue) {
        List<QmsMomMaster> allMoms = masterRepository.findAll((Specification<QmsMomMaster>) (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (fromDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("momDate"), fromDate));
            }
            if (toDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("momDate"), toDate));
            }

            Join<QmsMomMaster, QmsMomDetails> detailsJoin = root.join("details", JoinType.INNER);

            if (status != null && !status.isEmpty() && !status.equalsIgnoreCase("ALL")) {
                predicates.add(criteriaBuilder.equal(detailsJoin.join("statusObj", JoinType.LEFT).get("name"), status));
            }

            if (process != null && !process.isEmpty() && !process.equalsIgnoreCase("ALL")) {
                if ("ACTION".equalsIgnoreCase(process)) {
                    predicates.add(criteriaBuilder.or(
                        criteriaBuilder.equal(detailsJoin.join("processTypeObj", JoinType.LEFT).get("code"), "ACTION"),
                        criteriaBuilder.and(
                            criteriaBuilder.isNull(detailsJoin.get("processTypeObj")),
                            criteriaBuilder.isNotNull(detailsJoin.get("assignedTo"))
                        )
                    ));
                } else if ("INFO".equalsIgnoreCase(process)) {
                    predicates.add(criteriaBuilder.or(
                        criteriaBuilder.equal(detailsJoin.join("processTypeObj", JoinType.LEFT).get("code"), "INFO"),
                        criteriaBuilder.and(
                            criteriaBuilder.isNull(detailsJoin.get("processTypeObj")),
                            criteriaBuilder.isNull(detailsJoin.get("assignedTo"))
                        )
                    ));
                } else {
                    predicates.add(criteriaBuilder.equal(detailsJoin.join("processTypeObj", JoinType.LEFT).get("code"), process));
                }
            }

            if (actionType != null && actionValue != null && !actionType.isEmpty() && !actionValue.isEmpty()) {
                if ("Assigned By".equalsIgnoreCase(actionType)) {
                    predicates.add(criteriaBuilder.equal(detailsJoin.get("assignedBy").get("employeeName"), actionValue));
                } else if ("Assigned To".equalsIgnoreCase(actionType)) {
                    predicates.add(criteriaBuilder.equal(detailsJoin.get("assignedTo").get("employeeName"), actionValue));
                }
            }

            query.distinct(true);
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        });

        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            return new ArrayList<>();
        }
        UserCredential user = userRepository.findByUserId(currentUserId).orElse(null);
        if (user == null) {
            return new ArrayList<>();
        }

        EmployeeMaster emp = user.getEmpId() != null ? employeeRepository.findById(user.getEmpId()).orElse(null) : null;
        String empName = emp != null && emp.getEmployeeName() != null ? emp.getEmployeeName().trim() : null;
        Long empDeptId = (emp != null && emp.getDepartment() != null) ? emp.getDepartment().getId() : null;

        boolean hasCompany = false;
        boolean hasManager = false;
        String origTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
            com.autonoma.erp.model.admin.BosPage page = bosPageRepository.findByPageCode("QM1360").orElse(null);
            if (page != null) {
                com.autonoma.erp.model.admin.BosUserPageAuth auth = bosUserPageAuthRepository.findByUserIdAndPageId(currentUserId, page.getPageId());
                if (auth != null) {
                    hasCompany = Integer.valueOf(1).equals(auth.getAdditional1());
                    hasManager = Integer.valueOf(1).equals(auth.getManager());
                }
            }
        } catch (Exception e) {
            // Safe fallback
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(origTenant);
        }

        String effectiveType = type;
        if (effectiveType == null || effectiveType.trim().isEmpty()) {
            if (hasCompany) {
                effectiveType = "Company";
            } else if (hasManager) {
                effectiveType = "Team";
            } else {
                effectiveType = "Mine";
            }
        } else {
            if ("Company".equalsIgnoreCase(effectiveType)) {
                if (!hasCompany) {
                    effectiveType = hasManager ? "Team" : "Mine";
                }
            } else if ("Team".equalsIgnoreCase(effectiveType)) {
                if (!hasManager) {
                    effectiveType = "Mine";
                }
            }
        }

        boolean isCompany = "Company".equalsIgnoreCase(effectiveType);
        boolean isTeam = "Team".equalsIgnoreCase(effectiveType);
        boolean isMine = "Mine".equalsIgnoreCase(effectiveType);

        List<QmsMomReportHd> filteredReports = new ArrayList<>();
        for (QmsMomMaster mom : allMoms) {
            
            boolean isCreatorOrApprover = isCompany 
                    || (mom.getCreatedBy() != null && mom.getCreatedBy().equalsIgnoreCase(currentUserId))
                    || (mom.getUpdatedBy() != null && mom.getUpdatedBy().equalsIgnoreCase(currentUserId));

            List<QmsMomDetails> detailsToShow = new ArrayList<>();
            if (mom.getDetails() != null) {
                for (QmsMomDetails dt : mom.getDetails()) {
                    boolean matchFilter = true;
                    if (status != null && !status.isEmpty() && !status.equalsIgnoreCase("ALL")) {
                        if (dt.getStatusObj() == null || dt.getStatusObj().getName() == null || !dt.getStatusObj().getName().equalsIgnoreCase(status)) {
                            matchFilter = false;
                        }
                    }
                    if (process != null && !process.isEmpty() && !process.equalsIgnoreCase("ALL")) {
                        String code = dt.getProcessType();
                        if (code == null || !code.equalsIgnoreCase(process)) {
                            matchFilter = false;
                        }
                    }

                    if (matchFilter) {
                        if (isCreatorOrApprover) {
                            detailsToShow.add(dt);
                        } else if (isTeam && empDeptId != null) {
                            boolean inTeam = false;
                            if (dt.getAssignedTo() != null && dt.getAssignedTo().getDepartment() != null && dt.getAssignedTo().getDepartment().getId().equals(empDeptId)) inTeam = true;
                            if (dt.getAssignedBy() != null && dt.getAssignedBy().getDepartment() != null && dt.getAssignedBy().getDepartment().getId().equals(empDeptId)) inTeam = true;
                            if (inTeam) detailsToShow.add(dt);
                        } else if (empName != null && dt.getAssignedTo() != null && dt.getAssignedTo().getEmployeeName() != null && dt.getAssignedTo().getEmployeeName().trim().equalsIgnoreCase(empName)) {
                            detailsToShow.add(dt);
                        } else if (empName != null && dt.getAssignedBy() != null && dt.getAssignedBy().getEmployeeName() != null && dt.getAssignedBy().getEmployeeName().trim().equalsIgnoreCase(empName)) {
                            detailsToShow.add(dt);
                        }
                    }
                }
            }

            if (!detailsToShow.isEmpty()) {
                QmsMomReportHd clone = new QmsMomReportHd();
                clone.setId(mom.getId());
                clone.setMeetingType(mom.getSchedule() != null && mom.getSchedule().getMeetingType() != null ? mom.getSchedule().getMeetingType().getMeetingName() : null);
                clone.setScheduleNo(mom.getSchedule() != null ? mom.getSchedule().getScheduleNo() : null);
                clone.setMeetingDate(mom.getMomDate());
                clone.setApprovedBy(mom.getUpdatedBy());
                
                LocalDateTime cDate = mom.getCreatedAt() != null ? new java.sql.Timestamp(mom.getCreatedAt().getTime()).toLocalDateTime() : LocalDateTime.now();
                LocalDateTime uDate = mom.getUpdatedAt() != null ? new java.sql.Timestamp(mom.getUpdatedAt().getTime()).toLocalDateTime() : cDate;
                
                clone.setApprovalDate(uDate); // fallback
                clone.setCreatedAt(cDate);
                clone.setUpdatedAt(uDate);
                clone.setCreatedBy(mom.getCreatedBy());
                clone.setUpdatedBy(mom.getUpdatedBy());
                clone.setIsActive(mom.getIsActive());
                
                List<QmsMomReportDt> mappedDetails = new ArrayList<>();
                for (QmsMomDetails dt : detailsToShow) {
                    QmsMomReportDt rdt = new QmsMomReportDt();
                    rdt.setId(dt.getId());
                    rdt.setMinutesNo(String.valueOf(dt.getId())); 
                    rdt.setDiscussedPoints(dt.getDiscussedPoint());
                    rdt.setAssignedBy(dt.getAssignedBy() != null ? dt.getAssignedBy().getEmployeeName() : null);
                    rdt.setAssignedTo(dt.getAssignedTo() != null ? dt.getAssignedTo().getEmployeeName() : null);
                    rdt.setStatus(dt.getStatus());
                    rdt.setActionStatus(dt.getActionStatus());
                    rdt.setProcessType(dt.getProcessType());
                    rdt.setCreatedBy(dt.getCreatedBy());
                    mappedDetails.add(rdt);
                }
                clone.setDetails(mappedDetails);
                filteredReports.add(clone);
            }
        }
        return filteredReports;
    }

    public void saveReport(QmsMomReportHd reportHd) {
        // We no longer save to the legacy table, but we keep the method so existing calls don't break.
        // legacyRepository.save(reportHd);
    }
}
