package com.autonoma.erp.modules.qms.meeting.service;

import com.autonoma.erp.modules.qms.meeting.dto.QmsMomSummaryReportDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.util.SecurityUtils;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class QmsMomSummaryReportService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.BosUserPageAuthRepository bosUserPageAuthRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.BosPageRepository bosPageRepository;

    public List<QmsMomSummaryReportDto> getSummaryReport(String type, LocalDate fromDate, LocalDate toDate,
                                                         String considerDate, String department,
                                                         String employeeName, String status) {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            return new ArrayList<>();
        }
        UserCredential user = userRepository.findByUserId(currentUserId).orElse(null);
        if (user == null) {
            return new ArrayList<>();
        }

        boolean hasCompany = false;
        boolean hasManager = false;
        String origTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
            com.autonoma.erp.model.admin.BosPage page = bosPageRepository.findByPageCode("QM1370").orElse(null);
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

        Long empDeptId = null;
        if (isTeam && user.getEmpId() != null) {
            try {
                empDeptId = jdbcTemplate.queryForObject(
                    "SELECT TOP 1 DEPARTMENT_ID FROM HR_EMPLOYEE_ORGANIZATION WHERE EMPLOYEE_ID = ?", 
                    Long.class, user.getEmpId()
                );
            } catch (Exception ignored) {}
        }

        StringBuilder sql = new StringBuilder();
        List<Object> params = new ArrayList<>();

        sql.append("SELECT ");
        sql.append("  e.EMP_CODE, ");
        sql.append("  e.EMPLOYEE_NAME, ");
        sql.append("  COUNT(*) AS total_points, ");
        sql.append("  SUM(CASE WHEN UPPER(s.NAME) IN ('CLOSED','ACCEPTED','VERIFIED','AUTO CLOSED','COMPLETED') THEN 1 ELSE 0 END) AS closed_count, ");
        sql.append("  SUM(CASE WHEN UPPER(s.NAME) = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count, ");
        sql.append("  SUM(CASE WHEN UPPER(s.NAME) IN ('PENDING FOR VERIFIED', 'PENDING FOR ACCEPTED') THEN 1 ELSE 0 END) AS pending_approval_count, ");
        sql.append("  SUM(CASE WHEN UPPER(s.NAME) = 'OPEN' THEN 1 ELSE 0 END) AS open_count, ");
        sql.append("  SUM(CASE WHEN UPPER(s.NAME) NOT IN ('CLOSED','ACCEPTED','VERIFIED','AUTO CLOSED','COMPLETED','CANCELLED','PENDING FOR VERIFIED','PENDING FOR ACCEPTED','OPEN') THEN 1 ELSE 0 END) AS unresolved_count, ");
        // Overdue counts (target_date < today AND status not closed/cancelled)
        sql.append("  SUM(CASE WHEN d.TARGET_DATE IS NOT NULL AND d.TARGET_DATE < GETDATE() AND UPPER(s.NAME) IN ('PENDING FOR VERIFIED', 'PENDING FOR ACCEPTED') THEN 1 ELSE 0 END) AS overdue_pending, ");
        sql.append("  SUM(CASE WHEN d.TARGET_DATE IS NOT NULL AND d.TARGET_DATE < GETDATE() AND UPPER(s.NAME) NOT IN ('CLOSED','ACCEPTED','VERIFIED','AUTO CLOSED','COMPLETED','CANCELLED','PENDING FOR VERIFIED','PENDING FOR ACCEPTED','OPEN') THEN 1 ELSE 0 END) AS overdue_unresolved, ");
        sql.append("  SUM(CASE WHEN d.TARGET_DATE IS NOT NULL AND d.TARGET_DATE < GETDATE() AND UPPER(s.NAME) = 'OPEN' THEN 1 ELSE 0 END) AS overdue_open, ");
        // Average overdue days
        sql.append("  AVG(CASE WHEN d.TARGET_DATE IS NOT NULL AND d.TARGET_DATE < GETDATE() AND UPPER(s.NAME) NOT IN ('CLOSED','ACCEPTED','VERIFIED','AUTO CLOSED','COMPLETED','CANCELLED') THEN CAST(DATEDIFF(day, d.TARGET_DATE, GETDATE()) AS FLOAT) END) AS avg_overdue_days ");

        sql.append("FROM QMS_MOM_DETAILS d ");
        sql.append("JOIN QMS_MOM_MASTER m ON d.MOM_ID = m.id ");
        sql.append("JOIN HR_EMPLOYEE e ON d.ASSIGNED_TO_ID = e.id ");
        sql.append("LEFT JOIN AD_STATUS_MASTER s ON d.STATUS = s.ID ");

        // Conditionally join department tables
        boolean hasDeptFilter = department != null && !department.isBlank();
        if (hasDeptFilter) {
            sql.append("JOIN HR_EMPLOYEE_ORGANIZATION eo ON eo.EMPLOYEE_ID = e.id ");
            sql.append("JOIN HR_DEPARTMENT dept ON eo.DEPARTMENT_ID = dept.id ");
        }

        sql.append("WHERE d.IS_ACTIVE = 1 AND m.IS_ACTIVE = 1 AND e.STATUS = (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'ACTIVE') ");

        if (isTeam && empDeptId != null) {
            sql.append("AND (");
            sql.append("  EXISTS (SELECT 1 FROM HR_EMPLOYEE_ORGANIZATION o WHERE o.EMPLOYEE_ID = d.ASSIGNED_TO_ID AND o.DEPARTMENT_ID = ?) ");
            sql.append("  OR EXISTS (SELECT 1 FROM HR_EMPLOYEE_ORGANIZATION o WHERE o.EMPLOYEE_ID = d.ASSIGNED_BY_ID AND o.DEPARTMENT_ID = ?) ");
            sql.append(") ");
            params.add(empDeptId);
            params.add(empDeptId);
        } else if (!isCompany || isMine) { // Mine
            if (user.getEmpId() == null) {
                return new ArrayList<>();
            }
            sql.append("AND (e.id = ? OR d.ASSIGNED_BY_ID = ?) ");
            params.add(user.getEmpId());
            params.add(user.getEmpId());
        }

        if ("Yes".equalsIgnoreCase(considerDate) && fromDate != null && toDate != null) {
            sql.append("AND m.MOM_DATE BETWEEN ? AND ? ");
            params.add(java.sql.Date.valueOf(fromDate));
            params.add(java.sql.Date.valueOf(toDate));
        }
        if (hasDeptFilter) {
            sql.append("AND dept.DEPARTMENT_NAME LIKE ? ");
            params.add("%" + department + "%");
        }
        if (employeeName != null && !employeeName.isBlank()) {
            sql.append("AND e.EMPLOYEE_NAME LIKE ? ");
            params.add("%" + employeeName + "%");
        }
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            sql.append("AND s.NAME = ? ");
            params.add(status);
        }

        sql.append("GROUP BY e.EMP_CODE, e.EMPLOYEE_NAME ");
        sql.append("ORDER BY e.EMPLOYEE_NAME");

        AtomicInteger counter = new AtomicInteger(0);
        return jdbcTemplate.query(sql.toString(), params.toArray(), (rs, rowNum) -> {
            int totalPoints = rs.getInt("total_points");
            int closedCount = rs.getInt("closed_count");
            int cancelledCount = rs.getInt("cancelled_count");
            int pendingCount = rs.getInt("pending_approval_count");
            int openCount = rs.getInt("open_count");
            int unresolvedCount = rs.getInt("unresolved_count");
            int overduePending = rs.getInt("overdue_pending");
            int overdueUnresolved = rs.getInt("overdue_unresolved");
            int overdueOpen = rs.getInt("overdue_open");
            int totalOverdue = overduePending + overdueUnresolved + overdueOpen;
            double avgDays = rs.getDouble("avg_overdue_days");
            if (rs.wasNull()) avgDays = 0.0;

            double reward = totalPoints > 0 ? (closedCount * 100.0 / totalPoints) : 0.0;
            double penalty = totalPoints > 0 ? (totalOverdue * 100.0 / totalPoints) : 0.0;
            double finalScore = reward - penalty;

            return QmsMomSummaryReportDto.builder()
                .slNo(counter.incrementAndGet())
                .employeeCode(rs.getString("EMP_CODE"))
                .employeeName(rs.getString("EMPLOYEE_NAME"))
                .totalPoints(totalPoints)
                .closed(closedCount)
                .cancelled(cancelledCount)
                .pendingApproval(pendingCount)
                .unresolved(unresolvedCount)
                .open(openCount)
                .overduePendingApproval(overduePending)
                .overdueUnresolved(overdueUnresolved)
                .overdueOpen(overdueOpen)
                .totalOverdueCount(totalOverdue)
                .avgOverdueDays(Math.round(avgDays * 100.0) / 100.0)
                .rewardScore(Math.round(reward * 100.0) / 100.0)
                .penaltyScore(Math.round(penalty * 100.0) / 100.0)
                .finalScore(Math.round(finalScore * 100.0) / 100.0)
                .build();
        });
    }
}
