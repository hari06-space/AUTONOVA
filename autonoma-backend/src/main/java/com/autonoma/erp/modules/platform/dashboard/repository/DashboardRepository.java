package com.autonoma.erp.modules.platform.dashboard.repository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Repository
public class DashboardRepository {

  @Autowired
  private JdbcTemplate jdbcTemplate;

  private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

  // ────────────────────────────────────────────────────────────────────────────
  // MEETING WIDGETS
  // ────────────────────────────────────────────────────────────────────────────

  public Map<String, Object> getMeetingAttendance(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(COUNT(DISTINCT s.ID),0) AS totalCount,
          ISNULL(COUNT(DISTINCT CASE WHEN CAST(s.MEETING_DATE AS DATE) = CAST(DATEADD(MINUTE, 330, GETUTCDATE()) AS DATE) THEN s.ID END),0) AS todayCount,
          ISNULL(COUNT(DISTINCT CASE WHEN CAST(s.MEETING_DATE AS DATE) = CAST(DATEADD(MINUTE, 330, GETUTCDATE()) AS DATE) AND su.NAME = 'ABSENT' THEN s.ID END),0) AS absentCount,
          ISNULL(COUNT(DISTINCT CASE WHEN CAST(s.MEETING_DATE AS DATE) = CAST(DATEADD(MINUTE, 330, GETUTCDATE()) AS DATE) AND st.NAME IN ('OPEN','Open')
                                     AND (su.NAME IS NULL OR su.NAME IN ('PENDING', 'OPEN', 'Open'))
                                     AND (s.START_TIME IS NULL OR DATEADD(MINUTE, -10, TRY_CAST(CONCAT(FORMAT(s.MEETING_DATE, 'yyyy-MM-dd'), ' ', LEFT(s.START_TIME, 5)) AS DATETIME)) <= DATEADD(MINUTE, 330, GETUTCDATE()))
                                THEN s.ID END),0) AS pendingCount,
          ISNULL(COUNT(DISTINCT CASE WHEN CAST(s.MEETING_DATE AS DATE) = CAST(DATEADD(MINUTE, 330, GETUTCDATE()) AS DATE) AND st.NAME IN ('OPEN','Open')
                                     AND (su.NAME IS NULL OR su.NAME IN ('PENDING', 'OPEN', 'Open'))
                                     AND s.START_TIME IS NOT NULL AND DATEADD(MINUTE, -10, TRY_CAST(CONCAT(FORMAT(s.MEETING_DATE, 'yyyy-MM-dd'), ' ', LEFT(s.START_TIME, 5)) AS DATETIME)) > DATEADD(MINUTE, 330, GETUTCDATE())
                                THEN s.ID END),0) AS upcomingCount
        FROM QMS_MEETING_SCHEDULE s WITH (NOLOCK)
        INNER JOIN AD_USER_CREDENTIAL u WITH (NOLOCK) ON u.USER_ID = ?
        INNER JOIN HR_EMPLOYEE he WITH (NOLOCK) ON he.ID = u.EMP_ID
        LEFT JOIN QMS_MEETING_USER_ATTENDANCE ua WITH (NOLOCK) ON ua.SCHEDULE_ID = s.ID AND ua.EMPLOYEE_ID = he.ID
        LEFT JOIN AD_STATUS_MASTER st WITH (NOLOCK) ON st.ID = s.STATUS
        LEFT JOIN AD_STATUS_MASTER su WITH (NOLOCK) ON su.ID = ua.STATUS
        WHERE s.ID > 0
          AND CAST(s.MEETING_DATE AS DATE) <= CAST(? AS DATE)
          AND (s.CHAIRED_BY_ID IS NULL OR s.CHAIRED_BY_ID <> he.ID)
          AND (
              s.HOST_BY_ID = he.ID OR
              EXISTS (SELECT 1 FROM QMS_MEETING_SCHEDULE_PARTICIPANT p WITH (NOLOCK) WHERE p.SCHEDULE_ID = s.ID AND p.EMPLOYEE_ID = he.ID) OR
              EXISTS (SELECT 1 FROM QMS_MEETING_PARTICIPANT_MAPPING p2 WITH (NOLOCK) WHERE p2.SCHEDULE_ID = s.ID AND p2.EMPLOYEE_ID = he.ID) OR
              EXISTS (SELECT 1 FROM QMS_MEETING_USER_ATTENDANCE ua2 WITH (NOLOCK) WHERE ua2.SCHEDULE_ID = s.ID AND ua2.EMPLOYEE_ID = he.ID)
          )
        """;
    sql = applyScopeToSql(sql, taskScope, memberId, "u.USER_ID");
    return safeQueryForMap(sql, userId, to.format(FMT));
  }

  public Map<String, Object> getMeetingStatus(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(COUNT(CASE WHEN st.NAME = 'AMENDED' THEN s.ID END),0) AS amendedCount,
          ISNULL(COUNT(CASE WHEN st.NAME = 'AUTO CLOSED' THEN s.ID END),0) AS autoClosedCount,
          ISNULL(COUNT(CASE WHEN st.NAME = 'CANCELLED' THEN s.ID END),0) AS cancelledCount,
          ISNULL(COUNT(CASE WHEN st.NAME IN ('AUTO CLOSED','AMENDED','CANCELLED') THEN s.ID END),0) AS totalCount
        FROM QMS_MEETING_SCHEDULE s WITH (NOLOCK)
        INNER JOIN HR_EMPLOYEE he WITH (NOLOCK) ON he.ID = s.CHAIRED_BY_ID
        INNER JOIN AD_USER_CREDENTIAL u WITH (NOLOCK) ON u.EMP_ID = he.ID
        LEFT JOIN AD_STATUS_MASTER st WITH (NOLOCK) ON st.ID = s.STATUS
        WHERE s.ID > 0
          AND s.MEETING_DATE <= ?
          AND u.USER_ID = ?
        """;
    sql = applyScopeToSql(sql, taskScope, memberId, "u.USER_ID");
    return safeQueryForMap(sql, to.format(FMT), userId);
  }

  public Map<String, Object> getMeetingMinutes(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(COUNT(DISTINCT m.ID),0) AS totalCount,
          ISNULL(COUNT(DISTINCT CASE WHEN CAST(m.MOM_DATE AS DATE) = CAST(GETDATE() AS DATE) THEN m.ID END),0) AS todayCount,
          ISNULL(COUNT(DISTINCT CASE WHEN CAST(m.MOM_DATE AS DATE) = CAST(GETDATE() AS DATE) AND st.NAME IN ('OPEN', 'Open') THEN m.ID END),0) AS todayOpenCount,
          ISNULL(COUNT(DISTINCT CASE WHEN CAST(m.MOM_DATE AS DATE) = CAST(GETDATE() AS DATE) AND st.NAME = 'PENDING FOR APPROVAL' THEN m.ID END),0) AS todayPendingCount,
          ISNULL(COUNT(DISTINCT CASE WHEN CAST(m.MOM_DATE AS DATE) = CAST(GETDATE() AS DATE) AND st.NAME = 'CANCELLED' THEN m.ID END),0) AS todayCancelledCount,
          ISNULL(COUNT(DISTINCT CASE WHEN CAST(m.MOM_DATE AS DATE) = CAST(GETDATE() AS DATE) AND st.NAME = 'CLOSED' THEN m.ID END),0) AS todayClosedCount
        FROM QMS_MOM_MASTER m WITH (NOLOCK)
        INNER JOIN AD_USER_CREDENTIAL u WITH (NOLOCK) ON u.USER_ID = ?
        INNER JOIN HR_EMPLOYEE he WITH (NOLOCK) ON he.ID = u.EMP_ID
        LEFT JOIN AD_STATUS_MASTER st WITH (NOLOCK) ON st.ID = m.STATUS
        WHERE m.IS_ACTIVE = 1
          AND m.MOM_DATE <= ?
          AND (
              m.CHAIRED_BY_ID = he.ID OR
              m.CREATED_BY = u.USER_ID OR
              EXISTS (SELECT 1 FROM QMS_MEETING_SCHEDULE_PARTICIPANT p WITH (NOLOCK) WHERE p.SCHEDULE_ID = m.SCHEDULE_ID AND p.EMPLOYEE_ID = he.ID) OR
              EXISTS (SELECT 1 FROM QMS_MEETING_PARTICIPANT_MAPPING p2 WITH (NOLOCK) WHERE p2.SCHEDULE_ID = m.SCHEDULE_ID AND p2.EMPLOYEE_ID = he.ID) OR
              EXISTS (SELECT 1 FROM QMS_MEETING_USER_ATTENDANCE ua2 WITH (NOLOCK) WHERE ua2.SCHEDULE_ID = m.SCHEDULE_ID AND ua2.EMPLOYEE_ID = he.ID)
          )
        """;
    sql = applyScopeToSql(sql, taskScope, memberId, "u.USER_ID");
    return safeQueryForMap(sql, userId, to.format(FMT));
  }

  public Map<String, Object> getMeetingCloseMom(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(SUM(CASE WHEN (ISNULL(latestLog.NEW_STATUS, st.NAME) IS NULL OR LTRIM(RTRIM(UPPER(ISNULL(latestLog.NEW_STATUS, st.NAME)))) IN ('OPEN','UNRESOLVED','CREATED','')) THEN 1 ELSE 0 END), 0) AS totalCount,
          ISNULL(SUM(CASE WHEN CAST(m.MOM_DATE AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END),0) AS todayCount,
          ISNULL(SUM(CASE WHEN (ISNULL(latestLog.NEW_STATUS, st.NAME) IS NULL OR LTRIM(RTRIM(UPPER(ISNULL(latestLog.NEW_STATUS, st.NAME)))) IN ('OPEN','UNRESOLVED','CREATED',''))
                           AND d.TARGET_DATE IS NOT NULL AND CAST(d.TARGET_DATE AS DATE) < CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END),0) AS overdueCount,
          ISNULL(SUM(CASE WHEN (ISNULL(latestLog.NEW_STATUS, st.NAME) IS NULL OR LTRIM(RTRIM(UPPER(ISNULL(latestLog.NEW_STATUS, st.NAME)))) IN ('OPEN','UNRESOLVED','CREATED',''))
                           AND (d.TARGET_DATE IS NULL OR CAST(d.TARGET_DATE AS DATE) >= CAST(GETDATE() AS DATE)) THEN 1 ELSE 0 END),0) AS pendingCount,
          ISNULL(SUM(CASE WHEN LTRIM(RTRIM(UPPER(ISNULL(latestLog.NEW_STATUS, st.NAME)))) IN ('PENDING FOR VERIFY','PENDING FOR VERIFIED')
                            OR (LTRIM(RTRIM(UPPER(ISNULL(latestLog.NEW_STATUS, st.NAME)))) IN ('VERIFIED','CLOSED','ACCEPTED') AND d.VERIFIED_DATE IS NOT NULL AND CAST(d.VERIFIED_DATE AS DATE) = CAST(GETDATE() AS DATE))
                          THEN 1 ELSE 0 END),0) AS closedCount
        FROM QMS_MOM_DETAILS d WITH (NOLOCK)
        INNER JOIN QMS_MOM_MASTER m WITH (NOLOCK) ON m.ID = d.MOM_ID
        LEFT JOIN QMS_PROCESS_TYPE_MASTER ptm WITH (NOLOCK) ON ptm.ID = d.PROCESS_TYPE_ID
        LEFT JOIN AD_STATUS_MASTER st WITH (NOLOCK) ON st.ID = d.STATUS
        OUTER APPLY (
            SELECT TOP 1 l.NEW_STATUS
            FROM QMS_CLOSE_MOM_AND_VERIFY l WITH (NOLOCK)
            WHERE l.ACTION_ITEM_ID = d.ID
            ORDER BY l.ID DESC
        ) latestLog
        WHERE d.IS_ACTIVE = 1 AND m.IS_ACTIVE = 1
          AND d.ASSIGNED_TO_ID = (SELECT TOP 1 EMP_ID FROM AD_USER_CREDENTIAL WITH (NOLOCK) WHERE USER_ID = ?)
          AND (ptm.CODE IN ('ACTION', 'INFO') OR (d.PROCESS_TYPE_ID IS NULL AND d.ASSIGNED_TO_ID IS NOT NULL))
        """;
    sql = applyScopeToSql(sql, taskScope, memberId, "u.USER_ID");
    return safeQueryForMap(sql, userId);
  }

  public Map<String, Object> getMeetingVerifyMom(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(COUNT(DISTINCT d.ID),0) AS totalCount,
          ISNULL(COUNT(DISTINCT CASE WHEN CAST(DATEADD(DAY, 1, d.TARGET_DATE) AS DATE) = CAST(DATEADD(MINUTE, 330, GETUTCDATE()) AS DATE) THEN d.ID END),0) AS todayCount,
          ISNULL(COUNT(DISTINCT CASE WHEN CAST(DATEADD(DAY, 1, d.TARGET_DATE) AS DATE) < CAST(DATEADD(MINUTE, 330, GETUTCDATE()) AS DATE) THEN d.ID END),0) AS overdueCount,
          ISNULL(COUNT(DISTINCT CASE WHEN CAST(DATEADD(DAY, 1, d.TARGET_DATE) AS DATE) > CAST(DATEADD(MINUTE, 330, GETUTCDATE()) AS DATE) THEN d.ID END),0) AS openCount
        FROM QMS_MOM_DETAILS d WITH (NOLOCK)
        INNER JOIN QMS_MOM_MASTER m WITH (NOLOCK) ON m.ID = d.MOM_ID
        INNER JOIN HR_EMPLOYEE c WITH (NOLOCK) ON d.ASSIGNED_BY_ID = c.ID
        INNER JOIN AD_USER_CREDENTIAL u WITH (NOLOCK) ON u.EMP_ID = c.ID
        LEFT JOIN AD_STATUS_MASTER st WITH (NOLOCK) ON st.ID = d.STATUS
        LEFT JOIN QMS_PROCESS_TYPE_MASTER ptm WITH (NOLOCK) ON ptm.ID = d.PROCESS_TYPE_ID
        OUTER APPLY (
            SELECT TOP 1 a.NEW_STATUS
            FROM QMS_CLOSE_MOM_AND_VERIFY a WITH (NOLOCK)
            WHERE a.ACTION_ITEM_ID = d.ID
            ORDER BY a.ID DESC
        ) latestLog
        WHERE u.USER_ID = ?
          AND d.IS_ACTIVE = 1
          AND m.IS_ACTIVE = 1
          AND (ptm.CODE IN ('ACTION', 'INFO') OR (d.PROCESS_TYPE_ID IS NULL AND d.ASSIGNED_TO_ID IS NOT NULL))
          AND UPPER(ISNULL(latestLog.NEW_STATUS, st.NAME)) IN ('PENDING FOR APPROVAL', 'PENDING FOR VERIFY', 'PENDING FOR VERIFIED', 'PENDING_FOR_VERIFIED', 'PENDING_FOR_VERIFY')
        """;

    return safeQueryForMap(sql, userId);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // AUDIT WIDGETS
  // ────────────────────────────────────────────────────────────────────────────

  public Map<String, Object> getAuditAttendance(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(COUNT(DISTINCT a.ID),0) AS totalCount,
          ISNULL(COUNT(DISTINCT CASE WHEN CAST(a.SCHEDULE_DATE AS DATE) = CAST(GETDATE() AS DATE) THEN a.ID END),0) AS todayCount,
          ISNULL(COUNT(DISTINCT CASE WHEN a.STATUS ='RESCHEDULE' AND CAST(a.UPDATED_DATE AS DATE) = CAST(GETDATE() AS DATE) THEN a.ID END),0) AS rescheduleCount,
          ISNULL(COUNT(DISTINCT CASE WHEN a.STATUS IN ('OPEN', 'RESCHEDULE') THEN a.ID END),0) AS pendingCount,
          ISNULL(COUNT(DISTINCT CASE WHEN a.STATUS ='CLOSED' AND CAST(a.UPDATED_DATE AS DATE) = CAST(GETDATE() AS DATE) THEN a.ID END),0) AS closedCount
        FROM QMS_AUDIT_SCHEDULE a WITH (NOLOCK)
        INNER JOIN HR_EMPLOYEE d WITH (NOLOCK) ON d.ID = a.AUDITEE_ID
        INNER JOIN AD_USER_CREDENTIAL u WITH (NOLOCK) ON u.EMP_ID = d.ID
        WHERE u.USER_ID = ?
          AND (a.IS_ACTIVE IS NULL OR a.IS_ACTIVE = 1)
          AND a.SCHEDULE_DATE <= ?
        """;
    sql = applyScopeToSql(sql, taskScope, memberId, "u.USER_ID");
    return safeQueryForMap(sql, userId, to.format(FMT));
  }

  public Map<String, Object> getAuditCloseNcr(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(COUNT(DISTINCT CASE WHEN COALESCE(r.NCR_STATUS, 'PENDING') IN ('PENDING', 'UNRESOLVED', 'OPEN') THEN a.ID END), 0) AS totalCount,
          ISNULL(COUNT(DISTINCT CASE WHEN CAST(COALESCE(r.CREATED_DATE, a.CREATED_DATE, b.CREATED_DATE) AS DATE) = CAST(GETDATE() AS DATE) THEN a.ID END), 0) AS todayCount,
          ISNULL(COUNT(DISTINCT CASE WHEN COALESCE(r.NCR_STATUS, 'PENDING') IN ('PENDING', 'UNRESOLVED', 'OPEN') AND a.TARGET_DATE IS NOT NULL AND CAST(a.TARGET_DATE AS DATE) < CAST(GETDATE() AS DATE) THEN a.ID END), 0) AS overdueCount,
          ISNULL(COUNT(DISTINCT CASE WHEN COALESCE(r.NCR_STATUS, 'PENDING') IN ('PENDING', 'UNRESOLVED', 'OPEN') AND (a.TARGET_DATE IS NULL OR CAST(a.TARGET_DATE AS DATE) >= CAST(GETDATE() AS DATE)) THEN a.ID END), 0) AS pendingCount,
          ISNULL(COUNT(DISTINCT CASE WHEN COALESCE(r.NCR_STATUS, 'PENDING') IN ('CLOSED', 'COMPLETED', 'VERIFIED') AND CAST(COALESCE(r.UPDATED_DATE, a.UPDATED_DATE) AS DATE) = CAST(GETDATE() AS DATE) THEN a.ID END), 0) AS closedCount
        FROM QMS_AUDIT_OBSERVATION_DETAIL a WITH (NOLOCK)
        INNER JOIN QMS_AUDIT_OBSERVATION b WITH (NOLOCK) ON a.OBSERVATION_ID = b.ID
        LEFT JOIN QMS_NCR_REWORK_LOG r WITH (NOLOCK) ON r.OBSERVATION_DETAIL_ID = a.ID AND r.REWORK_NO = (SELECT MAX(r2.REWORK_NO) FROM QMS_NCR_REWORK_LOG r2 WITH (NOLOCK) WHERE r2.OBSERVATION_DETAIL_ID = a.ID)
        INNER JOIN QMS_AUDIT_SCHEDULE s WITH (NOLOCK) ON b.AUDIT_SCHEDULE_NO = s.SCHEDULE_NO
        INNER JOIN HR_EMPLOYEE d WITH (NOLOCK) ON d.ID = COALESCE(b.AUDITEE_ID, s.AUDITEE_ID)
        INNER JOIN AD_USER_CREDENTIAL u WITH (NOLOCK) ON u.EMP_ID = d.ID
        WHERE u.USER_ID = ?
          AND (s.IS_ACTIVE IS NULL OR s.IS_ACTIVE = 1)
          AND a.OBSERVATION_STATUS IN ('NC', 'NCR', 'OFI')
          AND COALESCE(r.CREATED_DATE, a.CREATED_DATE, b.CREATED_DATE) <= ?
        """;
    sql = applyScopeToSql(sql, taskScope, memberId, "u.USER_ID");
    return safeQueryForMap(sql, userId, to.format(FMT));
  }

  public Map<String, Object> getAuditVerifyNcr(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(COUNT(DISTINCT CASE WHEN COALESCE(r.VERIFY_STATUS, a.APPROVAL_STATUS, 'PENDING') IN ('PENDING FOR VERIFY', 'PENDING FOR APPROVAL', 'PENDING_APPROVAL') THEN a.ID END), 0) AS totalCount,
          ISNULL(COUNT(DISTINCT CASE WHEN COALESCE(r.VERIFY_STATUS, a.APPROVAL_STATUS, 'PENDING') IN ('PENDING FOR VERIFY', 'PENDING FOR APPROVAL', 'PENDING_APPROVAL') AND CAST(COALESCE(r.UPDATED_DATE, a.UPDATED_DATE, b.OBSERVATION_DATE) AS DATE) = CAST(GETDATE() AS DATE) THEN a.ID END), 0) AS todayCount,
          ISNULL(COUNT(DISTINCT CASE WHEN COALESCE(r.VERIFY_STATUS, a.APPROVAL_STATUS, 'PENDING') IN ('PENDING FOR VERIFY', 'PENDING FOR APPROVAL', 'PENDING_APPROVAL') AND a.TARGET_DATE IS NOT NULL AND CAST(a.TARGET_DATE AS DATE) < CAST(GETDATE() AS DATE) THEN a.ID END), 0) AS overdueCount,
          ISNULL(COUNT(DISTINCT CASE WHEN COALESCE(r.VERIFY_STATUS, a.APPROVAL_STATUS, 'PENDING') IN ('PENDING FOR VERIFY', 'PENDING FOR APPROVAL', 'PENDING_APPROVAL') AND (a.TARGET_DATE IS NULL OR CAST(a.TARGET_DATE AS DATE) >= CAST(GETDATE() AS DATE)) THEN a.ID END), 0) AS pendingCount
        FROM QMS_AUDIT_OBSERVATION_DETAIL a WITH (NOLOCK)
        INNER JOIN QMS_AUDIT_OBSERVATION b WITH (NOLOCK) ON a.OBSERVATION_ID = b.ID
        LEFT JOIN QMS_NCR_REWORK_LOG r WITH (NOLOCK) ON r.OBSERVATION_DETAIL_ID = a.ID AND r.REWORK_NO = (SELECT MAX(r2.REWORK_NO) FROM QMS_NCR_REWORK_LOG r2 WITH (NOLOCK) WHERE r2.OBSERVATION_DETAIL_ID = a.ID)
        INNER JOIN QMS_AUDIT_SCHEDULE s WITH (NOLOCK) ON b.AUDIT_SCHEDULE_NO = s.SCHEDULE_NO
        INNER JOIN HR_EMPLOYEE e WITH (NOLOCK) ON e.ID = COALESCE(s.NCR_APPROVED_BY_ID, s.AUDITOR_ID)
        INNER JOIN AD_USER_CREDENTIAL u WITH (NOLOCK) ON u.EMP_ID = e.ID
        WHERE u.USER_ID = ?
          AND (s.IS_ACTIVE IS NULL OR s.IS_ACTIVE = 1)
          AND a.OBSERVATION_STATUS IN ('NC', 'NCR', 'OFI')
        """;
    sql = applyScopeToSql(sql, taskScope, memberId, "u.USER_ID");
    return safeQueryForMap(sql, userId);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CHECK LIST WIDGETS
  // ────────────────────────────────────────────────────────────────────────────

  public Map<String, Object> getChecklistMasterVerify(String userId, int userLevel, String taskScope, String memberId) {
    String sql = """
        SELECT
          COUNT(a.ID) AS totalCount,
          ISNULL(SUM(CASE WHEN vs.NAME = 'VERIFIED' THEN 1 ELSE 0 END),0) AS closedCount,
          ISNULL(SUM(CASE WHEN (auth.add_task_enable = 1 OR ? = 5) AND (vs.NAME = 'TO BE VERIFIED' OR a.VERIFY_STATUS IS NULL) THEN 1 ELSE 0 END),0) AS openCount,
          ISNULL(SUM(CASE WHEN vs.NAME = 'REJECTED' THEN 1 ELSE 0 END),0) AS overdueCount
        FROM QMS_CHECKLIST_MASTER a WITH (NOLOCK)
        LEFT JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON s.ID = a.STATUS
        LEFT JOIN AD_STATUS_MASTER vs WITH (NOLOCK) ON vs.ID = a.VERIFY_STATUS
        LEFT JOIN BOS_PAGES pg WITH (NOLOCK) ON pg.PAGE_CODE = 'M1210'
        LEFT JOIN BOS_USER_PAGE_AUTH auth WITH (NOLOCK) ON auth.PAGE_ID = pg.PAGE_ID AND auth.USER_ID = ?
        WHERE s.NAME = 'ACTIVE'
        """;
    sql = applyScopeToSql(sql, taskScope, memberId, "u.USER_ID");
    return safeQueryForMap(sql, userLevel, userId);
  }

  public Map<String, Object> getChecklistRejected(String userId, int userLevel, String taskScope, String memberId) {
    String sql = """
        SELECT
          COUNT(a.ID) AS totalCount,
          0 AS overdueCount,
          ISNULL(SUM(CASE WHEN (auth.add_task_enable = 1 OR ? = 5) THEN 1 ELSE 0 END),0) AS openCount,
          0 AS closedCount
        FROM QMS_CHECKLIST_MASTER a WITH (NOLOCK)
        LEFT JOIN AD_STATUS_MASTER vs WITH (NOLOCK) ON vs.ID = a.VERIFY_STATUS
        LEFT JOIN BOS_PAGES pg WITH (NOLOCK) ON pg.PAGE_CODE = 'M1210'
        LEFT JOIN BOS_USER_PAGE_AUTH auth WITH (NOLOCK) ON auth.PAGE_ID = pg.PAGE_ID AND auth.USER_ID = ?
        WHERE vs.NAME = 'REJECTED'
        """;
    return safeQueryForMap(sql, userLevel, userId);
  }

  public Map<String, Object> getChecklistAssign(String userId, int userLevel, String taskScope, String memberId) {
    String sql = """
        SELECT
          COUNT(a.ID) AS totalCount,
          ISNULL(SUM(CASE WHEN b.CHECKLIST_ID IS NOT NULL THEN 1 ELSE 0 END),0) AS closedCount,
          ISNULL(SUM(CASE WHEN (auth.add_task_enable = 1 OR ? = 5) AND b.CHECKLIST_ID IS NULL THEN 1 ELSE 0 END),0) AS openCount,
          0 AS overdueCount
        FROM QMS_CHECKLIST_MASTER a WITH (NOLOCK)
        LEFT JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON s.ID = a.STATUS
        LEFT JOIN AD_STATUS_MASTER vs WITH (NOLOCK) ON vs.ID = a.VERIFY_STATUS
        LEFT JOIN BOS_PAGES pg WITH (NOLOCK) ON pg.PAGE_CODE = 'QM1110'
        LEFT JOIN BOS_USER_PAGE_AUTH auth WITH (NOLOCK) ON auth.PAGE_ID = pg.PAGE_ID AND auth.USER_ID = ?
        LEFT JOIN (SELECT CHECKLIST_ID FROM QMS_CHECKLIST_ASSIGNMENT WITH (NOLOCK) GROUP BY CHECKLIST_ID) b ON a.ID = b.CHECKLIST_ID
        WHERE vs.NAME = 'VERIFIED' AND s.NAME = 'ACTIVE'
        """;
    return safeQueryForMap(sql, userLevel, userId);
  }

  public Map<String, Object> getChecklistClose(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(SUM(CASE WHEN st.NAME = 'PENDING' THEN 1 ELSE 0 END),0) AS pendingCount,
          ISNULL(SUM(CASE WHEN st.NAME = 'UNRESOLVED' THEN 1 ELSE 0 END),0) AS unresolvedCount
        FROM QMS_CHECKLIST_CLOSED a WITH (NOLOCK)
        INNER JOIN AD_USER_CREDENTIAL u WITH (NOLOCK) ON (
          a.ASSIGNED_TO = u.USER_ID
          OR a.ASSIGNED_TO = CAST(u.EMP_ID AS VARCHAR)
          OR a.ASSIGNED_TO = (SELECT TOP 1 EMP_CODE FROM HR_EMPLOYEE WITH (NOLOCK) WHERE ID = u.EMP_ID)
        )
        LEFT JOIN AD_STATUS_MASTER st WITH (NOLOCK) ON st.ID = a.STATUS_ID
        WHERE u.USER_ID = ? AND a.CHECKLIST_DATE <= ?
        """;
    return safeQueryForMap(sql, userId, to.format(FMT));
  }

  public Map<String, Object> getChecklistVerify(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(SUM(CASE WHEN st.NAME ='PENDING FOR VERIFIED' THEN 1 ELSE 0 END),0) AS verifyPending,
          ISNULL(SUM(CASE WHEN st.NAME ='REJECTED' THEN 1 ELSE 0 END),0) AS rejectedCount
        FROM QMS_CHECKLIST_CLOSED a WITH (NOLOCK)
        INNER JOIN QMS_CHECKLIST_MASTER m WITH (NOLOCK) ON a.CHECKLIST_ID = m.ID
        INNER JOIN AD_USER_CREDENTIAL u WITH (NOLOCK) ON u.USER_ID = ?
        LEFT JOIN AD_STATUS_MASTER st WITH (NOLOCK) ON st.ID = a.STATUS_ID
        WHERE st.NAME IN ('PENDING FOR VERIFIED', 'REJECTED')
          AND (m.PRIMARY_EMPLOYEE_ID = u.EMP_ID OR m.SECONDARY_EMPLOYEE_ID = u.EMP_ID OR m.TERTIARY_EMPLOYEE_ID = u.EMP_ID)
          AND a.UPDATED_DATE <= ?
        """;
    sql = applyScopeToSql(sql, taskScope, memberId, "u.USER_ID");
    return safeQueryForMap(sql, userId, to.format(FMT));
  }

  public Map<String, Object> getChecklistAcknowledgement(String userId, String taskScope, String memberId) {
    boolean isCompanyScope = "Company".equalsIgnoreCase(taskScope) || "All".equalsIgnoreCase(taskScope);
    String sql;
    if (isCompanyScope) {
      sql = """
          SELECT
            COUNT(a.ID) AS totalCount,
            ISNULL(SUM(CASE WHEN a.ACK_STATUS = 'PENDING' THEN 1 ELSE 0 END), 0) AS pendingCount,
            ISNULL(SUM(CASE WHEN a.ACK_STATUS = 'ACCEPTED' THEN 1 ELSE 0 END), 0) AS acceptedCount,
            ISNULL(SUM(CASE WHEN a.ACK_STATUS = 'REJECTED' THEN 1 ELSE 0 END), 0) AS rejectedCount
          FROM QMS_CHECKLIST_ACKNOWLEDGEMENT a WITH (NOLOCK)
          """;
      return safeQueryForMap(sql);
    } else {
      sql = """
          SELECT
            COUNT(a.ID) AS totalCount,
            ISNULL(SUM(CASE WHEN a.ACK_STATUS = 'PENDING' THEN 1 ELSE 0 END), 0) AS pendingCount,
            ISNULL(SUM(CASE WHEN a.ACK_STATUS = 'ACCEPTED' THEN 1 ELSE 0 END), 0) AS acceptedCount,
            ISNULL(SUM(CASE WHEN a.ACK_STATUS = 'REJECTED' THEN 1 ELSE 0 END), 0) AS rejectedCount
          FROM QMS_CHECKLIST_ACKNOWLEDGEMENT a WITH (NOLOCK)
          LEFT JOIN AD_USER_CREDENTIAL u WITH (NOLOCK) ON (UPPER(u.USER_ID) = UPPER(?) OR CAST(u.EMP_ID AS VARCHAR) = ?)
          WHERE (
            a.NEW_ASSIGNEE_ID = u.EMP_ID
            OR a.OLD_ASSIGNEE_ID = u.EMP_ID
            OR UPPER(a.REASSIGNED_BY) = UPPER(u.USER_ID)
            OR UPPER(a.CREATED_BY) = UPPER(u.USER_ID)
            OR UPPER(a.REASSIGNED_BY) = UPPER(?)
            OR UPPER(a.CREATED_BY) = UPPER(?)
          )
          """;
      return safeQueryForMap(sql, userId, userId, userId, userId);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // HR / EMPLOYEES WIDGETS
  // ────────────────────────────────────────────────────────────────────────────

  public Map<String, Object> getLeave(String userId, LocalDate from, LocalDate to, String taskScope, String memberId) {
    String sql = """
        SELECT
          COALESCE(SUM(CASE WHEN lr.VERIFIED_BY IS NULL AND DATEADD(DAY,-1,lr.FROM_DATE) < ? THEN 1 ELSE 0 END),0) AS overdueCount,
          COUNT(*) AS todayCount,
          COALESCE(SUM(CASE WHEN lr.VERIFIED_BY IS NULL THEN 1 ELSE 0 END),0) AS pendingCount,
          SUM(CASE WHEN lr.VERIFIED_BY IS NOT NULL AND (lr.REJECT_REASON IS NULL OR lr.REJECT_REASON = '') THEN 1 ELSE 0 END) AS verifiedCount
        FROM HR_LEAVE_DETAILS lr WITH (NOLOCK)
        INNER JOIN HR_EMPLOYEE emp WITH (NOLOCK) ON lr.EMPLOYEE_ID = emp.ID
        INNER JOIN HR_EMPLOYEE_MANAGER_MAPPING map WITH (NOLOCK) ON map.EMP_ID = emp.ID
        INNER JOIN HR_EMPLOYEE mgr WITH (NOLOCK) ON mgr.ID = map.HOME_MANAGER_ID
        INNER JOIN AD_USER_CREDENTIAL u WITH (NOLOCK) ON u.EMP_ID = mgr.ID
        WHERE DATEADD(DAY,-1,lr.FROM_DATE) <= ?
          AND u.USER_ID = ?
        """;
    sql = applyScopeToSql(sql, taskScope, memberId, "u.USER_ID");
    return safeQueryForMap(sql, from.format(FMT), to.format(FMT), userId);
  }

  public Map<String, Object> getLoan(String userId, String taskScope, String memberId) {
    String sql = """
        SELECT
          COALESCE(SUM(CASE WHEN st.name = 'PENDING' THEN 1 ELSE 0 END),0) AS pendingCount
        FROM HR_LOAN_APPLICATION la WITH (NOLOCK)
        INNER JOIN HR_EMPLOYEE emp WITH (NOLOCK) ON emp.EMP_CODE = la.EMP_CODE
        INNER JOIN HR_EMPLOYEE_MANAGER_MAPPING map WITH (NOLOCK) ON map.EMP_ID = emp.ID
        INNER JOIN HR_EMPLOYEE mgr WITH (NOLOCK) ON mgr.ID = map.HOME_MANAGER_ID
        INNER JOIN AD_USER_CREDENTIAL u WITH (NOLOCK) ON u.EMP_ID = mgr.ID
        left join AD_STATUS_MASTER st WITH (NOLOCK) on st.ID=la.STATUS
        WHERE u.USER_ID = ?
        """;
    sql = applyScopeToSql(sql, taskScope, memberId, "u.USER_ID");
    return safeQueryForMap(sql, userId);
  }

  public Map<String, Object> getPermission(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(SUM(CASE WHEN st.NAME = 'PENDING APPROVAL' THEN 1 ELSE 0 END ),0) AS todayCount,
          ISNULL(SUM(CASE WHEN st.NAME = 'APPROVED' THEN 1 ELSE 0 END),0) AS verifiedCount,
          COALESCE(SUM(CASE WHEN st.NAME = 'PENDING APPROVAL' THEN 1 ELSE 0 END),0) AS pendingCount,
          ISNULL(SUM(CASE WHEN st.NAME = 'REJECTED' THEN 1 ELSE 0 END),0) AS rejectedCount
        FROM HR_PERMISSION_DETAILS a WITH (NOLOCK)
        INNER JOIN HR_EMPLOYEE b WITH (NOLOCK) ON a.EMPLOYEE_ID = b.ID
        INNER JOIN HR_EMPLOYEE_MANAGER_MAPPING map WITH (NOLOCK) ON map.EMP_ID = b.ID
        INNER JOIN HR_EMPLOYEE c WITH (NOLOCK) ON c.ID = map.HOME_MANAGER_ID
        INNER JOIN AD_USER_CREDENTIAL u WITH (NOLOCK) ON u.EMP_ID = c.ID
        left join AD_STATUS_MASTER st WITH (NOLOCK) on st.ID=a.STATUS_ID
        WHERE st.NAME != 'CREATED'
          AND u.USER_ID = ?
          AND a.CREATED_DATE >= ?
        """;
    sql = applyScopeToSql(sql, taskScope, memberId, "u.USER_ID");
    return safeQueryForMap(sql, userId, from.format(FMT));
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ATS / RECRUITMENT WIDGETS
  // ────────────────────────────────────────────────────────────────────────────

  public Map<String, Object> getAtsInterviewProcess(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(SUM(CASE WHEN CAST(a.INTERVIEW_DATE AS DATE) < ? AND (CASE WHEN su.NAME='PENDING' THEN 'PENDING' WHEN ISNULL(su.NAME,'N/A')!='PENDING' AND sa.NAME='PENDING' THEN 'WAITING FOR PROCESS' ELSE sa.NAME END) IN ('PENDING', 'WAITING FOR PROCESS') THEN 1 ELSE 0 END),0) AS overdueCount,
          ISNULL(SUM(CASE WHEN CAST(a.INTERVIEW_DATE AS DATE) >= ? AND CAST(a.INTERVIEW_DATE AS DATE) <= ? AND (CASE WHEN su.NAME='PENDING' THEN 'PENDING' WHEN ISNULL(su.NAME,'N/A')!='PENDING' AND sa.NAME='PENDING' THEN 'WAITING FOR PROCESS' ELSE sa.NAME END)='WAITING FOR PROCESS' THEN 1 ELSE 0 END),0) AS waitingCount,
          ISNULL(SUM(CASE WHEN CAST(a.INTERVIEW_DATE AS DATE) >= ? AND CAST(a.INTERVIEW_DATE AS DATE) <= ? AND (CASE WHEN su.NAME='PENDING' THEN 'PENDING' WHEN ISNULL(su.NAME,'N/A')!='PENDING' AND sa.NAME='PENDING' THEN 'WAITING FOR PROCESS' ELSE sa.NAME END)='PENDING' THEN 1 ELSE 0 END),0) AS pendingCount
        FROM HR_APPLICANT_INTERVIEW a WITH (NOLOCK)
        LEFT JOIN HR_APPLICANT_INTERVIEW ee WITH (NOLOCK) ON a.EMPLOYEE_ID = ee.EMPLOYEE_ID
        LEFT JOIN AD_STATUS_MASTER st WITH (NOLOCK) ON (st.ID = TRY_CAST(ee.STATUS AS BIGINT) OR st.NAME = CAST(ee.STATUS AS VARCHAR(50)))
        AND TRY_CAST(ee.SCREENING_LEVEL AS INT) = (TRY_CAST(a.SCREENING_LEVEL AS INT) - 1) AND st.NAME='ACTIVE'
        LEFT JOIN AD_STATUS_MASTER su WITH (NOLOCK) ON (su.ID = TRY_CAST(ee.INTERVIEW_STATUS AS BIGINT) OR su.NAME = CAST(ee.INTERVIEW_STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER sa WITH (NOLOCK) ON (sa.ID = TRY_CAST(a.INTERVIEW_STATUS AS BIGINT) OR sa.NAME = CAST(a.INTERVIEW_STATUS AS VARCHAR(50)))
        WHERE st.NAME='ACTIVE'
          AND CAST(a.INTERVIEW_DATE AS DATE) <= ?
          AND a.INTERVIEW_PERSON = ?
          AND sa.NAME != 'SELECTED'
        """;
    return safeQueryForMap(sql,
        from.format(FMT),
        from.format(FMT), to.format(FMT),
        from.format(FMT), to.format(FMT),
        to.format(FMT),
        userId);
  }

  public Map<String, Object> getAtsCallLetter(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(SUM(CASE WHEN st.NAME = 'PENDING' OR e.CALL_STATUS IS NULL THEN 1 ELSE 0 END), 0) AS pendingCount,
          ISNULL(SUM(CASE WHEN st.NAME IN ('TO BE VERIFIED', 'TO BE VERIFY') THEN 1 ELSE 0 END), 0) AS toBeVerifiedCount
        FROM HR_EMPLOYEE e WITH (NOLOCK)
        LEFT JOIN AD_STATUS_MASTER st WITH (NOLOCK) ON (st.ID = TRY_CAST(e.CALL_STATUS AS BIGINT) OR st.NAME = CAST(e.CALL_STATUS AS VARCHAR(50)))
        WHERE e.FROMWHERE = 'ATS' AND e.APPLICANT_CODE IS NOT NULL
          AND ISNULL(e.IS_ACTIVE, 1) = 1
        """;
    return safeQueryForMap(sql);
  }

  public Map<String, Object> getAtsInterviewSchedule(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          (SELECT COUNT(ID) FROM HR_APPLICANT_INTERVIEW WITH (NOLOCK)) AS totalCount,
          ISNULL(SUM(CASE WHEN UPPER(cs.NAME) = 'VERIFIED' AND UPPER(is_status.NAME) = 'PENDING' 
            AND active_interviews.emp_id IS NULL
          THEN 1 ELSE 0 END), 0) AS pendingCount
        FROM HR_EMPLOYEE e WITH (NOLOCK)
        LEFT JOIN AD_STATUS_MASTER cs WITH (NOLOCK) ON (cs.ID = TRY_CAST(e.CALL_STATUS AS BIGINT) OR cs.NAME = CAST(e.CALL_STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER os WITH (NOLOCK) ON (os.ID = TRY_CAST(e.STATUS AS BIGINT) OR os.NAME = CAST(e.STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER is_status WITH (NOLOCK) ON (is_status.ID = TRY_CAST(e.INTERVIEW_STATUS AS BIGINT) OR is_status.NAME = CAST(e.INTERVIEW_STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER ats_overall WITH (NOLOCK) ON (ats_overall.ID = TRY_CAST(e.ATS_OVERALL_STATUS AS BIGINT) OR ats_overall.NAME = CAST(e.ATS_OVERALL_STATUS AS VARCHAR(50)))
        OUTER APPLY (
            SELECT TOP 1 hai.EMPLOYEE_ID AS emp_id
            FROM HR_APPLICANT_INTERVIEW hai WITH (NOLOCK)
            WHERE hai.EMPLOYEE_ID = e.ID
              AND ISNULL(hai.IS_ACTIVE, 1) = 1
              AND UPPER(ISNULL(hai.STATUS, 'ACTIVE')) = 'ACTIVE'
        ) active_interviews
        WHERE e.FROMWHERE = 'ATS' AND e.APPLICANT_CODE IS NOT NULL
          AND ISNULL(e.IS_ACTIVE, 1) = 1
          AND UPPER(ISNULL(os.NAME, '')) NOT IN ('REJECTED', 'CANCELLED')
          AND UPPER(ISNULL(ats_overall.NAME, '')) NOT IN ('REJECTED', 'CANCELLED')
        """;
    return safeQueryForMap(sql);
  }

  public Map<String, Object> getAtsOfferLetter(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(SUM(CASE WHEN UPPER(cs.NAME) = 'VERIFIED' AND UPPER(is_status.NAME) = 'SELECTED' AND UPPER(os.NAME) = 'PENDING' THEN 1 ELSE 0 END), 0) AS pendingCount
        FROM HR_EMPLOYEE e WITH (NOLOCK)
        LEFT JOIN AD_STATUS_MASTER cs WITH (NOLOCK) ON (cs.ID = TRY_CAST(e.CALL_STATUS AS BIGINT) OR cs.NAME = CAST(e.CALL_STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER is_status WITH (NOLOCK) ON (is_status.ID = TRY_CAST(e.INTERVIEW_STATUS AS BIGINT) OR is_status.NAME = CAST(e.INTERVIEW_STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER os WITH (NOLOCK) ON (os.ID = TRY_CAST(e.OFFER_STATUS AS BIGINT) OR os.NAME = CAST(e.OFFER_STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER ats_overall WITH (NOLOCK) ON (ats_overall.ID = TRY_CAST(e.ATS_OVERALL_STATUS AS BIGINT) OR ats_overall.NAME = CAST(e.ATS_OVERALL_STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER overall_status WITH (NOLOCK) ON (overall_status.ID = TRY_CAST(e.STATUS AS BIGINT) OR overall_status.NAME = CAST(e.STATUS AS VARCHAR(50)))
        WHERE e.FROMWHERE = 'ATS' AND e.APPLICANT_CODE IS NOT NULL
          AND ISNULL(e.IS_ACTIVE, 1) = 1
          AND UPPER(ISNULL(overall_status.NAME, '')) NOT IN ('REJECTED', 'CANCELLED')
          AND UPPER(ISNULL(ats_overall.NAME, '')) NOT IN ('REJECTED', 'CANCELLED')
        """;
    return safeQueryForMap(sql);
  }

  public Map<String, Object> getAtsVerification(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(SUM(CASE WHEN UPPER(cs.NAME) = 'VERIFIED' AND UPPER(is_status.NAME) = 'SELECTED' AND UPPER(os.NAME) = 'VERIFIED' AND UPPER(vs.NAME) = 'PENDING' THEN 1 ELSE 0 END), 0) AS pendingCount
        FROM HR_EMPLOYEE e WITH (NOLOCK)
        LEFT JOIN AD_STATUS_MASTER cs WITH (NOLOCK) ON (cs.ID = TRY_CAST(e.CALL_STATUS AS BIGINT) OR cs.NAME = CAST(e.CALL_STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER is_status WITH (NOLOCK) ON (is_status.ID = TRY_CAST(e.INTERVIEW_STATUS AS BIGINT) OR is_status.NAME = CAST(e.INTERVIEW_STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER os WITH (NOLOCK) ON (os.ID = TRY_CAST(e.OFFER_STATUS AS BIGINT) OR os.NAME = CAST(e.OFFER_STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER vs WITH (NOLOCK) ON (vs.ID = TRY_CAST(e.VERIFICATION_STATUS AS BIGINT) OR vs.NAME = CAST(e.VERIFICATION_STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER ats_overall WITH (NOLOCK) ON (ats_overall.ID = TRY_CAST(e.ATS_OVERALL_STATUS AS BIGINT) OR ats_overall.NAME = CAST(e.ATS_OVERALL_STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER overall_status WITH (NOLOCK) ON (overall_status.ID = TRY_CAST(e.STATUS AS BIGINT) OR overall_status.NAME = CAST(e.STATUS AS VARCHAR(50)))
        WHERE e.FROMWHERE = 'ATS' AND e.APPLICANT_CODE IS NOT NULL
          AND ISNULL(e.IS_ACTIVE, 1) = 1
          AND UPPER(ISNULL(overall_status.NAME, '')) NOT IN ('REJECTED', 'CANCELLED')
          AND UPPER(ISNULL(ats_overall.NAME, '')) NOT IN ('REJECTED', 'CANCELLED')
        """;
    return safeQueryForMap(sql);
  }

  public Map<String, Object> getAtsOnboarding(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(SUM(CASE WHEN UPPER(cs.NAME) = 'VERIFIED' AND UPPER(is_status.NAME) = 'SELECTED' AND UPPER(os.NAME) = 'VERIFIED' AND UPPER(vs.NAME) = 'VERIFIED' AND (UPPER(overall_status.NAME) = 'PENDING' OR UPPER(ats_overall.NAME) = 'PENDING') THEN 1 ELSE 0 END), 0) AS pendingCount
        FROM HR_EMPLOYEE e WITH (NOLOCK)
        LEFT JOIN AD_STATUS_MASTER cs WITH (NOLOCK) ON (cs.ID = TRY_CAST(e.CALL_STATUS AS BIGINT) OR cs.NAME = CAST(e.CALL_STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER is_status WITH (NOLOCK) ON (is_status.ID = TRY_CAST(e.INTERVIEW_STATUS AS BIGINT) OR is_status.NAME = CAST(e.INTERVIEW_STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER os WITH (NOLOCK) ON (os.ID = TRY_CAST(e.OFFER_STATUS AS BIGINT) OR os.NAME = CAST(e.OFFER_STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER vs WITH (NOLOCK) ON (vs.ID = TRY_CAST(e.VERIFICATION_STATUS AS BIGINT) OR vs.NAME = CAST(e.VERIFICATION_STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER overall_status WITH (NOLOCK) ON (overall_status.ID = TRY_CAST(e.STATUS AS BIGINT) OR overall_status.NAME = CAST(e.STATUS AS VARCHAR(50)))
        LEFT JOIN AD_STATUS_MASTER ats_overall WITH (NOLOCK) ON (ats_overall.ID = TRY_CAST(e.ATS_OVERALL_STATUS AS BIGINT) OR ats_overall.NAME = CAST(e.ATS_OVERALL_STATUS AS VARCHAR(50)))
        WHERE e.FROMWHERE = 'ATS' AND e.APPLICANT_CODE IS NOT NULL
          AND ISNULL(e.IS_ACTIVE, 1) = 1
          AND UPPER(ISNULL(overall_status.NAME, '')) NOT IN ('REJECTED', 'CANCELLED')
          AND UPPER(ISNULL(ats_overall.NAME, '')) NOT IN ('REJECTED', 'CANCELLED')
        """;
    return safeQueryForMap(sql);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SALES / QUOTATION WIDGETS
  // ────────────────────────────────────────────────────────────────────────────

  public Map<String, Object> getQuotationPending(String userId, LocalDate from, LocalDate to, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          ISNULL(SUM(CASE WHEN DATEADD(DAY, 1, a.CREATED_DATE) < ? THEN 1 ELSE 0 END), 0) AS overdueCount,
          COUNT(*) AS todayCount,
          COUNT(*) + ISNULL(SUM(CASE WHEN DATEADD(DAY, 1, a.CREATED_DATE) < ? THEN 1 ELSE 0 END), 0) AS pendingCount
        FROM SALES_QUOTATION_HEADER a WITH (NOLOCK)
        WHERE (a.QUOTATION_STATUS IS NULL OR a.QUOTATION_STATUS != 24)
          AND a.CREATED_BY = ?
          AND DATEADD(DAY,1,a.CREATED_DATE) <= ?
        """;
    return safeQueryForMap(sql, from.format(FMT), from.format(FMT), userId, to.format(FMT));
  }

  // ────────────────────────────────────────────────────────────────────────────
  // OCR WIDGETS
  // ────────────────────────────────────────────────────────────────────────────

  public Map<String, Object> getOcrEnquiry(String userId, LocalDate from, LocalDate to, int userLevel, String taskScope,
      String memberId) {
    String sql = """
        SELECT
          COUNT(a.ID) AS totalCount,
          SUM(CASE WHEN a.STATUS IS NULL OR a.STATUS = 1 THEN 1 ELSE 0 END) AS openCount,
          0 AS abandonedCount
        FROM SALES_ENQUIRY_HEADER a WITH (NOLOCK)
        WHERE a.ENQUIRY_DATE <= ? AND (a.CREATED_BY = ? OR ? = 5)
        """;
    return safeQueryForMap(sql, to.format(FMT), userId, userLevel);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PERMISSION CHECK
  // ────────────────────────────────────────────────────────────────────────────

  public boolean hasWidgetPermission(String userId, String pageCode, int userLevel) {
    if (userLevel >= 5) {
      return true;
    }
    if (userLevel >= 1) {
      if (pageCode != null && (pageCode.equals("AD1210") || pageCode.equals("AD1220")
          || pageCode.equals("AD1230") || pageCode.equals("AD1240"))) {
        // Drop down to DB check for Super BOS(S) pages
      } else {
        return true;
      }
    }

    String sql = """
        SELECT ISNULL(MAX(CASE WHEN (a.ENABLE = 1 OR a.ADD_TASK_ENABLE = 1 OR a.READ_ACS = 1) THEN 1 ELSE 0 END), 0)
        FROM BOS_USER_PAGE_AUTH a WITH (NOLOCK)
        JOIN BOS_PAGES p WITH (NOLOCK) ON a.PAGE_ID = p.PAGE_ID
        WHERE (UPPER(a.USER_ID) = UPPER(?) OR LOWER(a.USER_ID) = LOWER(?)) AND p.PAGE_CODE = ? AND (p.ENABLED = 1 OR p.ENABLED IS NULL)
        """;
    try {
      Integer permitted = jdbcTemplate.queryForObject(sql, Integer.class, userId, userId, pageCode);
      return permitted != null && permitted == 1;
    } catch (Exception e) {
      System.err.println("hasWidgetPermission failed for " + userId + " / " + pageCode + ": " + e.getMessage());
      return false;
    }
  }

  public boolean hasWidgetActionPermission(String userId, String pageCode, int userLevel, String actionColumn) {
    if (userLevel >= 5) {
      return true;
    }
    String sql = "SELECT ISNULL(MAX(CASE WHEN (a.ENABLE = 1 AND a.ADD_TASK_ENABLE = 1 AND a." + actionColumn + " = 1) THEN 1 ELSE 0 END), 0) " +
        "FROM BOS_USER_PAGE_AUTH a WITH (NOLOCK) " +
        "JOIN BOS_PAGES p WITH (NOLOCK) ON a.PAGE_ID = p.PAGE_ID " +
        "WHERE (UPPER(a.USER_ID) = UPPER(?) OR LOWER(a.USER_ID) = LOWER(?)) AND p.PAGE_CODE = ? AND (p.ENABLED = 1 OR p.ENABLED IS NULL)";
    try {
      Integer permitted = jdbcTemplate.queryForObject(sql, Integer.class, userId, userId, pageCode);
      return permitted != null && permitted == 1;
    } catch (Exception e) {
      System.err.println("hasWidgetActionPermission failed for " + userId + " / " + pageCode + ": " + e.getMessage());
      return false;
    }
  }

  public long getPurchaseRequestCountByStatus(String userId, int userLevel, String statusName) {
    String sql = "SELECT COUNT(DISTINCT h.ID) " +
                 "FROM PP_PURCHASE_REQUEST_HEAD h WITH (NOLOCK) " +
                 "INNER JOIN PP_PURCHASE_REQUEST_TRANS t WITH (NOLOCK) ON t.PR_REF_ID = h.ID " +
                 "INNER JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON (s.ID = TRY_CAST(CAST(t.STATUS_ID AS VARCHAR(50)) AS BIGINT) OR UPPER(TRIM(s.NAME)) = UPPER(TRIM(CAST(t.STATUS_ID AS VARCHAR(100))))) " +
                 "WHERE h.STATUS = 1 AND UPPER(s.NAME) = ? ";
    if (userLevel < 5) {
        sql += " AND (h.CREATED_BY = ? OR CAST(t.APPROVER_ID AS VARCHAR) = (SELECT TOP 1 EMP_ID FROM AD_USER_CREDENTIAL WITH (NOLOCK) WHERE USER_ID = ?))";
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class, statusName.toUpperCase(), userId, userId);
            return count != null ? count : 0L;
        } catch (Exception e) {
            // System.err.println("Error in getPurchaseRequestCountByStatus: " + e.getMessage());
            return 0L;
        }
    } else {
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class, statusName.toUpperCase());
            return count != null ? count : 0L;
        } catch (Exception e) {
            // System.err.println("Error in getPurchaseRequestCountByStatus Admin: " + e.getMessage());
            return 0L;
        }
    }
  }
  
  public long getPurchaseRequestTotalCount(String userId, int userLevel) {
    String sql = "SELECT COUNT(DISTINCT h.ID) " +
                 "FROM PP_PURCHASE_REQUEST_HEAD h WITH (NOLOCK) " +
                 "LEFT JOIN PP_PURCHASE_REQUEST_TRANS t WITH (NOLOCK) ON t.PR_REF_ID = h.ID " +
                 "WHERE h.STATUS = 1 ";
    if (userLevel < 5) {
        sql += " AND (h.CREATED_BY = ? OR CAST(t.APPROVER_ID AS VARCHAR) = (SELECT TOP 1 EMP_ID FROM AD_USER_CREDENTIAL WITH (NOLOCK) WHERE USER_ID = ?))";
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class, userId, userId);
            return count != null ? count : 0L;
        } catch (Exception e) {
            // System.err.println("Error in getPurchaseRequestTotalCount: " + e.getMessage());
            return 0L;
        }
    } else {
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            // System.err.println("Error in getPurchaseRequestTotalCount Admin: " + e.getMessage());
            return 0L;
        }
    }
  }

  public long getPendingQuotationRequestCount(String userId, int userLevel) {
    String sql = "SELECT COUNT(DISTINCT h.ID) " +
                 "FROM PP_PURCHASE_REQUEST_HEAD h WITH (NOLOCK) " +
                 "INNER JOIN PP_PURCHASE_REQUEST_TRANS t WITH (NOLOCK) ON t.PR_REF_ID = h.ID " +
                 "INNER JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON (s.ID = TRY_CAST(CAST(t.STATUS_ID AS VARCHAR(50)) AS BIGINT) OR UPPER(TRIM(s.NAME)) = UPPER(TRIM(CAST(t.STATUS_ID AS VARCHAR(100))))) " +
                 "WHERE h.STATUS = 1 AND UPPER(s.NAME) IN ('VERIFIED', 'APPROVED') " +
                 "AND NOT EXISTS (SELECT 1 FROM PP_RFQ_HEAD rfq WITH (NOLOCK) WHERE rfq.PR_REF_ID = h.ID) " +
                 "AND NOT EXISTS (SELECT 1 FROM PP_PURCHASE_ORDER_TRANS pot WITH (NOLOCK) WHERE pot.ITEM_ID = t.ITEM_ID) ";
                 
    if (userLevel < 5) {
        sql += " AND (h.CREATED_BY = ? OR CAST(t.APPROVER_ID AS VARCHAR) = (SELECT TOP 1 EMP_ID FROM AD_USER_CREDENTIAL WITH (NOLOCK) WHERE USER_ID = ?))";
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class, userId, userId);
            return count != null ? count : 0L;
        } catch (Exception e) {
            // System.err.println("Error in getPendingQuotationRequestCount: " + e.getMessage());
            return 0L;
        }
    } else {
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            // System.err.println("Error in getPendingQuotationRequestCount Admin: " + e.getMessage());
            return 0L;
        }
    }
  }

  public long getPendingRfqSubmissionCount(String userId, int userLevel) {
    String sql = "SELECT COUNT(DISTINCT h.ID) " +
                 "FROM PP_RFQ_HEAD h WITH (NOLOCK) " +
                 "INNER JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON (s.ID = TRY_CAST(CAST(h.STATUS_ID AS VARCHAR(50)) AS BIGINT) OR UPPER(TRIM(s.NAME)) = UPPER(TRIM(CAST(h.STATUS_ID AS VARCHAR(100))))) " +
                 "WHERE UPPER(s.NAME) = 'DRAFT' ";
                 
    if (userLevel < 5) {
        sql += " AND h.CREATED_BY = ? ";
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class, userId);
            return count != null ? count : 0L;
        } catch (Exception e) {
            System.err.println("Error in getPendingRfqSubmissionCount: " + e.getMessage());
            return 0L;
        }
    } else {
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            System.err.println("Error in getPendingRfqSubmissionCount Admin: " + e.getMessage());
            return 0L;
        }
    }
  }

  public long getPendingSupplierQuotationCount(String userId, int userLevel) {
    String sql = "SELECT COUNT(rs.ID) " +
                 "FROM PP_RFQ_SUPPLIER rs WITH (NOLOCK) " +
                 "INNER JOIN PP_RFQ_HEAD rfq WITH (NOLOCK) ON rfq.ID = rs.RFQ_REF_ID " +
                 "WHERE rs.EMAIL_SENT = 1 " +
                 "AND NOT EXISTS (SELECT 1 FROM PP_QUOTATION_HEAD q WITH (NOLOCK) WHERE q.RFQ_REF_ID = rs.RFQ_REF_ID AND q.SUPPLIER_ID = rs.SUPPLIER_ID) ";
                 
    if (userLevel < 5) {
        sql += " AND rfq.CREATED_BY = ? ";
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class, userId);
            return count != null ? count : 0L;
        } catch (Exception e) {
            System.err.println("Error in getPendingSupplierQuotationCount: " + e.getMessage());
            return 0L;
        }
    } else {
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            System.err.println("Error in getPendingSupplierQuotationCount Admin: " + e.getMessage());
            return 0L;
        }
    }
  }

  public long getTotalSupplierQuotationCount(String userId, int userLevel) {
    String sql = "SELECT COUNT(DISTINCT q.ID) FROM PP_QUOTATION_HEAD q WITH (NOLOCK) ";
                 
    if (userLevel < 5) {
        sql += " WHERE q.CREATED_BY = ? ";
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class, userId);
            return count != null ? count : 0L;
        } catch (Exception e) {
            System.err.println("Error in getTotalSupplierQuotationCount: " + e.getMessage());
            return 0L;
        }
    } else {
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            System.err.println("Error in getTotalSupplierQuotationCount Admin: " + e.getMessage());
            return 0L;
        }
    }
  }

  public long getPendingQuotationComparisonCount(String userId, int userLevel) {
    String sql = "SELECT COUNT(DISTINCT n.RFQ_ID) " +
                 "FROM PP_QUOTATION_NEGOTIATION_HEAD n WITH (NOLOCK) " +
                 "WHERE NOT EXISTS (SELECT 1 FROM PP_QUOTE_COMPARISON_HEAD c WITH (NOLOCK) WHERE c.RFQ_ID = n.RFQ_ID) ";
                 
    if (userLevel < 5) {
        sql += " AND n.CREATED_BY = ? ";
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class, userId);
            return count != null ? count : 0L;
        } catch (Exception e) {
            // System.err.println("Error in getPendingQuotationComparisonCount: " + e.getMessage());
            return 0L;
        }
    } else {
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            // System.err.println("Error in getPendingQuotationComparisonCount Admin: " + e.getMessage());
            return 0L;
        }
    }
  }

  public long getTotalQuotationComparisonCount(String userId, int userLevel) {
    String sql = "SELECT COUNT(DISTINCT c.ID) FROM PP_QUOTE_COMPARISON_HEAD c WITH (NOLOCK) ";
                 
    if (userLevel < 5) {
        sql += " WHERE c.CREATED_BY = ? ";
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class, userId);
            return count != null ? count : 0L;
        } catch (Exception e) {
            // System.err.println("Error in getTotalQuotationComparisonCount: " + e.getMessage());
            return 0L;
        }
    } else {
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            // System.err.println("Error in getTotalQuotationComparisonCount Admin: " + e.getMessage());
            return 0L;
        }
    }
  }

  public long getPendingPurchaseOrderCount(String userId, int userLevel) {
    String sql = "SELECT COUNT(DISTINCT h.ID) " +
                 "FROM PP_PURCHASE_REQUEST_HEAD h WITH (NOLOCK) " +
                 "INNER JOIN PP_PURCHASE_REQUEST_TRANS t WITH (NOLOCK) ON t.PR_REF_ID = h.ID " +
                 "INNER JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON (s.ID = TRY_CAST(CAST(t.STATUS_ID AS VARCHAR(50)) AS BIGINT) OR UPPER(TRIM(s.NAME)) = UPPER(TRIM(CAST(t.STATUS_ID AS VARCHAR(100))))) " +
                 "WHERE UPPER(TRIM(s.NAME)) IN ('VERIFIED', 'APPROVED') " +
                 "AND NOT EXISTS ( " +
                 "  SELECT 1 FROM PP_PURCHASE_ORDER_SOURCE pos WITH (NOLOCK) " +
                 "  INNER JOIN PP_PURCHASE_ORDER_HEAD po WITH (NOLOCK) ON po.ID = pos.PO_HEAD_ID " +
                 "  WHERE po.ACTIVE_STATUS = 1 " +
                 "  AND ( " +
                 "      (pos.SOURCE_TYPE = 'PURCHASE_REQUEST' AND pos.SOURCE_HEAD_ID = h.ID) " +
                 "      OR (pos.SOURCE_TYPE = 'SUPPLIER_QUOTATION' AND pos.SOURCE_HEAD_ID IN (SELECT q.ID FROM PP_QUOTATION_HEAD q WITH (NOLOCK) JOIN PP_RFQ_HEAD rfq WITH (NOLOCK) ON q.RFQ_REF_ID = rfq.ID WHERE rfq.PR_REF_ID = h.ID)) " +
                 "      OR (pos.SOURCE_TYPE = 'QUOTATION_COMPARISON' AND pos.SOURCE_HEAD_ID IN (SELECT c.ID FROM PP_QUOTE_COMPARISON_HEAD c WITH (NOLOCK) JOIN PP_RFQ_HEAD rfq WITH (NOLOCK) ON c.RFQ_ID = rfq.ID WHERE rfq.PR_REF_ID = h.ID)) " +
                 "  ) " +
                 ") ";

    if (userLevel < 5) {
        sql += " AND h.CREATED_BY = ? ";
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class, userId);
            return count != null ? count : 0L;
        } catch (Exception e) {
            // System.err.println("Error in getPendingPurchaseOrderCount: " + e.getMessage());
            return 0L;
        }
    } else {
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            // System.err.println("Error in getPendingPurchaseOrderCount Admin: " + e.getMessage());
            return 0L;
        }
    }
  }

  public long getPurchaseOrderCountByStatus(String userId, int userLevel, String... statuses) {
    if (statuses == null || statuses.length == 0) return 0L;
    String placeholders = String.join(",", Collections.nCopies(statuses.length, "?"));
    String sql = "SELECT COUNT(DISTINCT h.ID) " +
                 "FROM PP_PURCHASE_ORDER_HEAD h WITH (NOLOCK) " +
                 "INNER JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON (s.ID = TRY_CAST(CAST(h.STATUS_ID AS VARCHAR(50)) AS BIGINT) OR UPPER(TRIM(s.NAME)) = UPPER(TRIM(CAST(h.STATUS_ID AS VARCHAR(100))))) " +
                 "WHERE UPPER(TRIM(s.NAME)) IN (" + placeholders + ") AND h.ACTIVE_STATUS = 1 ";

    List<Object> params = new ArrayList<>();
    for (String status : statuses) {
        params.add(status.toUpperCase().trim());
    }

    if (userLevel < 5) {
        sql += " AND h.CREATED_BY = ? ";
        params.add(userId);
    }

    try {
        Long count = jdbcTemplate.queryForObject(sql, Long.class, params.toArray());
        return count != null ? count : 0L;
    } catch (Exception e) {
        // System.err.println("Error in getPurchaseOrderCountByStatus: " + e.getMessage());
        return 0L;
    }
  }

  public long getPendingQuoteNegotiationCount(String userId, int userLevel) {
    String sql = "SELECT COUNT(DISTINCT q.ID) " +
                 "FROM PP_QUOTATION_HEAD q WITH (NOLOCK) " +
                 "LEFT JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON (s.ID = TRY_CAST(CAST(q.STATUS_ID AS VARCHAR(50)) AS BIGINT) OR UPPER(TRIM(s.NAME)) = UPPER(TRIM(CAST(q.STATUS_ID AS VARCHAR(100))))) " +
                 "LEFT JOIN AD_STATUS_MASTER ts WITH (NOLOCK) ON (ts.ID = TRY_CAST(CAST(q.TECHNICAL_STATUS_ID AS VARCHAR(50)) AS BIGINT) OR UPPER(TRIM(ts.NAME)) = UPPER(TRIM(CAST(q.TECHNICAL_STATUS_ID AS VARCHAR(100))))) " +
                 "WHERE (UPPER(s.NAME) IN ('VERIFIED', 'APPROVED') OR UPPER(ts.NAME) IN ('VERIFIED', 'APPROVED')) " +
                 "AND NOT EXISTS (SELECT 1 FROM PP_QUOTATION_NEGOTIATION_HEAD qn WITH (NOLOCK) WHERE qn.QUOTATION_ID = q.ID) ";
                 
    if (userLevel < 5) {
        sql += " AND q.CREATED_BY = ? ";
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class, userId);
            return count != null ? count : 0L;
        } catch (Exception e) {
            // System.err.println("Error in getPendingQuoteNegotiationCount: " + e.getMessage());
            return 0L;
        }
    } else {
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            // System.err.println("Error in getPendingQuoteNegotiationCount Admin: " + e.getMessage());
            return 0L;
        }
    }
  }

  public long getTotalQuoteNegotiationCount(String userId, int userLevel) {
    String sql = "SELECT COUNT(DISTINCT qn.ID) FROM PP_QUOTATION_NEGOTIATION_HEAD qn WITH (NOLOCK) ";
                 
    if (userLevel < 5) {
        sql += " WHERE qn.CREATED_BY = ? ";
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class, userId);
            return count != null ? count : 0L;
        } catch (Exception e) {
            // System.err.println("Error in getTotalQuoteNegotiationCount: " + e.getMessage());
            return 0L;
        }
    } else {
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            // System.err.println("Error in getTotalQuoteNegotiationCount Admin: " + e.getMessage());
            return 0L;
        }
    }
  }

  public long getSupplierQuotationCountByStatus(String userId, int userLevel, String... statusNames) {
    if (statusNames == null || statusNames.length == 0) return 0;
    
    StringBuilder statusPlaceholders = new StringBuilder();
    for(int i=0; i<statusNames.length; i++) {
        statusPlaceholders.append("?");
        if(i < statusNames.length - 1) statusPlaceholders.append(",");
    }

    String sql = "SELECT COUNT(DISTINCT q.ID) " +
                 "FROM PP_QUOTATION_HEAD q WITH (NOLOCK) " +
                 "INNER JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON (s.ID = TRY_CAST(CAST(q.STATUS_ID AS VARCHAR(50)) AS BIGINT) OR UPPER(TRIM(s.NAME)) = UPPER(TRIM(CAST(q.STATUS_ID AS VARCHAR(100))))) " +
                 "LEFT JOIN AD_STATUS_MASTER ts WITH (NOLOCK) ON (ts.ID = TRY_CAST(CAST(q.TECHNICAL_STATUS_ID AS VARCHAR(50)) AS BIGINT) OR UPPER(TRIM(ts.NAME)) = UPPER(TRIM(CAST(q.TECHNICAL_STATUS_ID AS VARCHAR(100))))) " +
                 "WHERE UPPER(s.NAME) IN (" + statusPlaceholders + ") " +
                 "AND (ts.ID IS NULL OR UPPER(ts.NAME) NOT IN ('VERIFIED', 'APPROVED')) ";
                 
    java.util.List<Object> params = new java.util.ArrayList<>();
    for(String s : statusNames) {
        params.add(s.toUpperCase());
    }

    if (userLevel < 5) {
        sql += " AND q.CREATED_BY = ? ";
        params.add(userId);
    } 

    try {
        Long count = jdbcTemplate.queryForObject(sql, Long.class, params.toArray());
        return count != null ? count : 0L;
    } catch (Exception e) {
        System.err.println("Error in getSupplierQuotationCountByStatus: " + e.getMessage());
        return 0L;
    }
  }

  public int getUserLevel(String userId) {
    String sql = "SELECT ISNULL(USER_LEVEL, 0) FROM AD_USER_CREDENTIAL WITH (NOLOCK) WHERE USER_ID = ?";
    try {
      Integer level = jdbcTemplate.queryForObject(sql, Integer.class, userId);
      // System.out.println("level==>" + level);
      return level != null ? level : 0;
    } catch (Exception e) {
      System.err.println("getUserLevel failed for " + userId + ": " + e.getMessage());
      return 0;
    }
  }

  public String getUserIdByEmpId(String empId) {
    String sql = "SELECT TOP 1 USER_ID FROM AD_USER_CREDENTIAL WITH (NOLOCK) WHERE EMP_ID = ?";
    try {
      return jdbcTemplate.queryForObject(sql, String.class, empId);
    } catch (Exception e) {
      return null;
    }
  }

  private String applyScopeToSql(String sql, String taskScope, String memberId, String userColumn) {
    if (taskScope == null || "Mine".equalsIgnoreCase(taskScope)) {
      return sql;
    }

    boolean hasSpecificMember = memberId != null && !memberId.trim().isEmpty() && !"All".equalsIgnoreCase(memberId);
    String targetColumn = userColumn.contains("USER_ID") ? userColumn.replace("USER_ID", "EMP_ID") : userColumn;

    // For Company scope, if memberId is selected, filter by it, else remove the
    // user filter
    if ("Company".equalsIgnoreCase(taskScope)) {
      if (hasSpecificMember) {
        return sql.replace(userColumn + " = ?",
            "(? IS NOT NULL AND " + targetColumn + " = '" + memberId.replace("'", "''") + "')");
      } else {
        return sql.replace(userColumn + " = ?", "(? IS NOT NULL)");
      }
    }

    // For Team scope, if memberId is selected, filter by it, else show team data
    if ("Team".equalsIgnoreCase(taskScope)) {
      if (hasSpecificMember) {
        return sql.replace(userColumn + " = ?",
            "(? IS NOT NULL AND " + targetColumn + " = '" + memberId.replace("'", "''") + "')");
      } else {
        // In a real scenario, this would check HR_EMPLOYEE_REPORTING hierarchy.
        // For now, defaulting to Company logic minus specific member or a subquery.
        return sql.replace(userColumn + " = ?", "(? IS NOT NULL /* Add team subquery logic here */)");
      }
    }

    return sql;
  }

  private Map<String, Object> safeQueryForMap(String sql, Object... params) {
    try {
      Map<String, Object> result = jdbcTemplate.queryForMap(sql, params);
      return result != null ? result : new HashMap<>();
    } catch (Exception e) {
      log.error("❌ [Dashboard SQL Error] Failed to execute query:\nSQL: {}\nParams: {}", sql, Arrays.toString(params), e);
      System.err.println("❌ [Dashboard SQL Error]: " + e.getMessage());
      e.printStackTrace();
      return new HashMap<>();
    }
  }

  public static long getLong(Map<String, Object> map, String key) {
    if (map == null)
      return 0L;
    Object val = map.get(key);
    if (val == null)
      return 0L;
    if (val instanceof Number)
      return ((Number) val).longValue();
    try {
      return Long.parseLong(val.toString());
    } catch (Exception e) {
      return 0L;
    }
  }

  public long getPendingGateEntryCount(String userId, int userLevel, String period) {
    String sql = "SELECT COUNT(DISTINCT h.ID) " +
                 "FROM PP_PURCHASE_ORDER_HEAD h WITH (NOLOCK) " +
                 "INNER JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON (s.ID = TRY_CAST(CAST(h.STATUS_ID AS VARCHAR(50)) AS BIGINT) OR UPPER(TRIM(s.NAME)) = UPPER(TRIM(CAST(h.STATUS_ID AS VARCHAR(100))))) " +
                 "WHERE UPPER(TRIM(s.NAME)) IN ('VERIFIED', 'APPROVED', 'RELEASED', 'PARTIALLY RECEIVED') " +
                 "AND h.ACTIVE_STATUS = 1 " +
                 "AND NOT EXISTS (SELECT 1 FROM PP_GATE_ENTRY_SOURCE gs WITH(NOLOCK) INNER JOIN PP_GATE_ENTRY_HEAD gh WITH(NOLOCK) ON gh.ID = gs.GATE_ENTRY_HEAD_ID WHERE (gs.SOURCE_TYPE = 'PO' OR gs.SOURCE_TYPE = 'PURCHASE_ORDER') AND gs.SOURCE_HEAD_ID = h.ID AND gs.ACTIVE_STATUS = 1 AND gh.ACTIVE_STATUS = 1) ";

    if ("TODAY".equalsIgnoreCase(period)) {
        sql += " AND CAST(h.EXPECTED_DELIVERY_DATE AS DATE) = CAST(GETUTCDATE() AS DATE) ";
    } else if ("OVERDUE".equalsIgnoreCase(period)) {
        sql += " AND CAST(h.EXPECTED_DELIVERY_DATE AS DATE) < CAST(GETUTCDATE() AS DATE) ";
    }

    if (userLevel < 5) {
        sql += " AND h.CREATED_BY = ? ";
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class, userId);
            return count != null ? count : 0L;
        } catch (Exception e) {
            System.err.println("Error in getPendingGateEntryCount: " + e.getMessage());
            return 0L;
        }
    } else {
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            System.err.println("Error in getPendingGateEntryCount Admin: " + e.getMessage());
            return 0L;
        }
    }
  }

  public long getPendingGrnCount(String userId, int userLevel) {
    String sql = "SELECT COUNT(DISTINCT h.ID) " +
                 "FROM PP_GATE_ENTRY_HEAD h WITH (NOLOCK) " +
                 "WHERE h.ACTIVE_STATUS = 1 " +
                 "AND NOT EXISTS (SELECT 1 FROM PP_GOODS_RECEIPT_HEAD grn WITH (NOLOCK) WHERE grn.GATE_ENTRY_HEAD_ID = h.ID) ";

    if (userLevel < 5) {
        sql += " AND h.CREATED_BY = ? ";
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class, userId);
            return count != null ? count : 0L;
        } catch (Exception e) {
            System.err.println("Error in getPendingGrnCount: " + e.getMessage());
            return 0L;
        }
    } else {
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            System.err.println("Error in getPendingGrnCount Admin: " + e.getMessage());
            return 0L;
        }
    }
  }

  public long getPendingQiCount(String userId, int userLevel) {
    String sql = "SELECT COUNT(DISTINCT h.ID) " +
                 "FROM PP_GOODS_RECEIPT_HEAD h WITH (NOLOCK) " +
                 "WHERE NOT EXISTS (SELECT 1 FROM PP_QUALITY_INSPECTION_HEAD qi WITH (NOLOCK) WHERE qi.GRN_HEAD_ID = h.ID) ";

    if (userLevel < 5) {
        sql += " AND h.CREATED_BY = ? ";
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class, userId);
            return count != null ? count : 0L;
        } catch (Exception e) {
            System.err.println("Error in getPendingQiCount: " + e.getMessage());
            return 0L;
        }
    } else {
        try {
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            System.err.println("Error in getPendingQiCount Admin: " + e.getMessage());
            return 0L;
        }
    }
  }
}
