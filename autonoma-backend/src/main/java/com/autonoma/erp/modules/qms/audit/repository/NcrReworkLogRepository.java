package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.NcrReworkLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NcrReworkLogRepository extends JpaRepository<NcrReworkLog, Integer> {

        Optional<NcrReworkLog> findByObservationDetailId(Long observationDetailId);

        Optional<NcrReworkLog> findTopByObservationDetailIdOrderByReworkNoDesc(Long observationDetailId);

        void deleteByObservationDetailId(Long observationDetailId);

        /**
         * Fetch NCR/OFI findings from QMS_NCR_REWORK_LOG joined with observation +
         * schedule
         * to resolve the Auditee for Mine/Team/Company scope filtering.
         *
         * Returns a flat projection: [log, detail, observation, schedule]
         * Using native SQL for performance (avoids N+1 through multiple lazy-loaded
         * chains).
         */
        @Query(value = "SELECT DISTINCT " +
                        "  COALESCE(rl.ID, d.ID)        AS logId, " +
                        "  d.ID                         AS observationDetailId, " +
                        "  obs.ID                       AS observationId, " +
                        "  obs.AUDIT_SCHEDULE_NO        AS auditScheduleNo, " +
                        "  sch.ID                       AS auditScheduleDbId, " +
                        "  COALESCE(rl.CLAUSE, d.CLAUSE) AS clause, " +
                        "  (SELECT TOP 1 ac.ID FROM QMS_AUDIT_CRITERIA ac WITH (NOLOCK) WHERE ac.SEQ_NO = COALESCE(sc.SEQ_NO, d.SEQ_NO) AND ac.IS_ACTIVE = 1) AS criteriaId, "
                        +
                        "  COALESCE(sc.CRITERIA_DETAILS, rl.CRITERIA, d.CRITERIA_DETAILS) AS criteriaDetails, " +
                        "  COALESCE(rl.STATUS, d.OBSERVATION_STATUS) AS observationStatus, " +
                        "  COALESCE(rl.REMARKS, d.COMMENTS) AS remarks, " +
                        "  rl.ATTACHMENT                AS attachmentPath, " +
                        "  COALESCE(rl.NCR_STATUS, 'PENDING') AS workflowStatus, " +
                        "  COALESCE(rl.VERIFY_STATUS, d.APPROVAL_STATUS, 'PENDING') AS approvalStatus, " +
                        "  COALESCE(rl.REWORK_STATUS, 'PENDING') AS reworkStatus, " +
                        "  sch.DEPARTMENT_ID            AS departmentId, " +
                        "  COALESCE(rl.CREATED_DATE, d.CREATED_DATE, obs.CREATED_DATE) AS createdDate, " +
                        "  COALESCE(rl.NCR_NO, d.NCR_NO) AS ncrNo, " +
                        "  COALESCE(sc.SEQ_NO, d.SEQ_NO) AS seqNo, " +
                        "  d.OBSERVATION_STATUS         AS detailObservationStatus, " +
                        "  d.ATTACHMENT_REQ             AS attachmentReq, " +
                        "  COALESCE(rl.ROOT_CAUSE, d.ROOT_CAUSE) AS rootCause, " +
                        "  COALESCE(rl.CORRECTIVE_ACTION, d.CORRECTIVE_ACTION) AS correctiveAction, " +
                        "  COALESCE(rl.PREVENTIVE_ACTION, d.PREVENTIVE_ACTION) AS preventiveAction, " +
                        "  d.TARGET_DATE                AS targetDate, " +
                        "  d.CLOSED_DATE                AS closedDate, " +
                        "  d.CANCEL_REMARKS             AS cancelRemarks, " +
                        "  d.REV_NO                     AS revNo, " +
                        "  obs.OBSERVATION_NO           AS observationNo, " +
                        "  obs.OBSERVATION_DATE         AS observationDate, " +
                        "  obs.AUDIT_SCHEDULE_NO        AS obsAuditScheduleNo, " +
                        "  sch.DEPARTMENT_ID            AS obsDepartmentId, " +
                        "  sch.AUDITOR_ID               AS auditorId, " +
                        "  sch.NCR_APPROVED_BY_ID       AS ncrApprovedById, " +
                        "  COALESCE(obs.AUDITEE_ID, sch.AUDITEE_ID) AS auditeeId, " +
                        "  COALESCE(emp_auditee.EMPLOYEE_NAME, CONCAT(emp_auditee.FIRST_NAME,' ',emp_auditee.LAST_NAME)) AS auditeeName, "
                        +
                        "  COALESCE(emp_auditee.EMP_CODE, '')        AS auditeeCode, " +
                        "  COALESCE(emp_auditor.EMPLOYEE_NAME, CONCAT(emp_auditor.FIRST_NAME,' ',emp_auditor.LAST_NAME), sch.EXTERNAL_NAME, sch.CONTACT_NAME) AS auditorName, "
                        +
                        "  COALESCE(emp_auditor.EMP_CODE, '')        AS auditorCode, " +
                        "  COALESCE(emp_ncr.EMPLOYEE_NAME, CONCAT(emp_ncr.FIRST_NAME,' ',emp_ncr.LAST_NAME)) AS ncrApprovedByName, "
                        +
                        "  COALESCE(emp_ncr.EMP_CODE, '')            AS ncrApprovedByCode, " +
                        "  dept.DEPARTMENT_NAME         AS departmentName, " +
                        "  at.AUDIT_TYPE                AS auditType " +
                        "FROM QMS_AUDIT_OBSERVATION obs WITH (NOLOCK) " +
                        "JOIN QMS_AUDIT_OBSERVATION_DETAIL d WITH (NOLOCK) ON d.OBSERVATION_ID = obs.ID " +
                        "LEFT JOIN QMS_NCR_REWORK_LOG rl WITH (NOLOCK) ON rl.OBSERVATION_DETAIL_ID = d.ID AND rl.REWORK_NO = (SELECT MAX(r2.REWORK_NO) FROM QMS_NCR_REWORK_LOG r2 WITH (NOLOCK) WHERE r2.OBSERVATION_DETAIL_ID = d.ID) "
                        +
                        "JOIN QMS_AUDIT_SCHEDULE sch WITH (NOLOCK) ON sch.SCHEDULE_NO = obs.AUDIT_SCHEDULE_NO " +
                        "LEFT JOIN QMS_AUDIT_SCHEDULE_CRITERIA sc WITH (NOLOCK) ON sc.AUDIT_SCHEDULE_ID = sch.ID AND (sc.SEQ_NO = d.SEQ_NO OR (d.SEQ_NO IS NULL AND sc.CLAUSE = d.CLAUSE)) "
                        +
                        "LEFT JOIN HR_EMPLOYEE emp_auditee WITH (NOLOCK) ON emp_auditee.ID = COALESCE(obs.AUDITEE_ID, sch.AUDITEE_ID) "
                        +
                        "LEFT JOIN HR_EMPLOYEE emp_auditor WITH (NOLOCK) ON emp_auditor.ID = sch.AUDITOR_ID " +
                        "LEFT JOIN HR_EMPLOYEE emp_ncr WITH (NOLOCK) ON emp_ncr.ID = sch.NCR_APPROVED_BY_ID " +
                        "LEFT JOIN HR_DEPARTMENT dept WITH (NOLOCK) ON dept.ID = COALESCE(rl.DEPARTMENT_ID, sch.DEPARTMENT_ID) "
                        +
                        "LEFT JOIN QMS_AUDIT_TYPE at WITH (NOLOCK) ON at.ID = sch.AUDIT_TYPE_ID " +
                        "WHERE (sch.IS_ACTIVE IS NULL OR sch.IS_ACTIVE = 1) " +
                        "  AND (:loggedInEmployeeId IS NULL OR 1=1) " +
                        "  AND d.OBSERVATION_STATUS IN ('NC', 'NCR', 'OFI') " +
                        "  AND (:observationStatus IS NULL OR :observationStatus = 'All' " +
                        "       OR d.OBSERVATION_STATUS = :observationStatus " +
                        "       OR (:observationStatus = 'NC' AND d.OBSERVATION_STATUS = 'NCR')) " +
                        "  AND (:workflowStatus IS NULL OR :workflowStatus = 'All' OR CONCAT(',', UPPER(:workflowStatus), ',') LIKE CONCAT('%,', UPPER(COALESCE(rl.NCR_STATUS, 'PENDING')), ',%')) "
                        +
                        "  AND (:considerDate = 'No' OR (obs.OBSERVATION_DATE >= :fromDate AND obs.OBSERVATION_DATE <= :toDate)) "
                        +
                        "  AND (:dashboardFilter IS NULL OR :dashboardFilter = '' OR ( " +
                        "       (:dashboardFilter = 'today' AND CAST(COALESCE(rl.CREATED_DATE, d.CREATED_DATE, obs.CREATED_DATE) AS DATE) = CAST(GETDATE() AS DATE)) OR "
                        +
                        "       (:dashboardFilter = 'overdue' AND d.TARGET_DATE IS NOT NULL AND CAST(d.TARGET_DATE AS DATE) < CAST(GETDATE() AS DATE)) OR "
                        +
                        "       (:dashboardFilter = 'pending' AND (d.TARGET_DATE IS NULL OR CAST(d.TARGET_DATE AS DATE) >= CAST(GETDATE() AS DATE))) "
                        +
                        "  )) " +
                        "  AND (:query IS NULL OR obs.OBSERVATION_NO LIKE CONCAT('%', :query, '%') " +
                        "       OR obs.AUDIT_SCHEDULE_NO LIKE CONCAT('%', :query, '%')) " +
                        "ORDER BY obs.OBSERVATION_DATE DESC, obs.OBSERVATION_NO DESC", nativeQuery = true)
        List<Object[]> findReworkLogFindings(
                        @Param("loggedInEmployeeId") Long loggedInEmployeeId,
                        @Param("observationStatus") String observationStatus,
                        @Param("workflowStatus") String workflowStatus,
                        @Param("considerDate") String considerDate,
                        @Param("fromDate") java.util.Date fromDate,
                        @Param("toDate") java.util.Date toDate,
                        @Param("query") String query,
                        @Param("dashboardFilter") String dashboardFilter);

        /**
         * Fetch NCR/OFI findings from QMS_NCR_REWORK_LOG for the Verification page.
         * Filters by rl.VERIFY_STATUS ('Pending For Verify', 'VERIFIED', 'REJECTED').
         * Column order is IDENTICAL to findReworkLogFindings so mapReworkRowToDto can
         * be reused.
         */
        @Query(value = "SELECT DISTINCT " +
                        "  COALESCE(rl.ID, d.ID)        AS logId, " +
                        "  d.ID                         AS observationDetailId, " +
                        "  obs.ID                       AS observationId, " +
                        "  obs.AUDIT_SCHEDULE_NO        AS auditScheduleNo, " +
                        "  sch.ID                       AS auditScheduleDbId, " +
                        "  rl.CLAUSE                    AS clause, " +
                        "  (SELECT TOP 1 ac.ID FROM QMS_AUDIT_CRITERIA ac WITH (NOLOCK) WHERE ac.SEQ_NO = COALESCE(sc.SEQ_NO, d.SEQ_NO) AND ac.IS_ACTIVE = 1) AS criteriaId, "
                        +
                        "  COALESCE(sc.CRITERIA_DETAILS, rl.CRITERIA, d.CRITERIA_DETAILS) AS criteriaDetails, " +
                        "  rl.STATUS                    AS observationStatus, " +
                        "  rl.REMARKS                   AS remarks, " +
                        "  rl.ATTACHMENT                AS attachmentPath, " +
                        "  rl.NCR_STATUS                AS workflowStatus, " +
                        "  rl.VERIFY_STATUS             AS approvalStatus, " +
                        "  rl.REWORK_STATUS             AS reworkStatus, " +
                        "  sch.DEPARTMENT_ID            AS departmentId, " +
                        "  rl.CREATED_DATE              AS createdDate, " +
                        "  COALESCE(rl.NCR_NO, d.NCR_NO) AS ncrNo, " +
                        "  COALESCE(sc.SEQ_NO, d.SEQ_NO) AS seqNo, " +
                        "  d.OBSERVATION_STATUS         AS detailObservationStatus, " +
                        "  d.ATTACHMENT_REQ             AS attachmentReq, " +
                        "  d.ROOT_CAUSE                 AS rootCause, " +
                        "  d.CORRECTIVE_ACTION          AS correctiveAction, " +
                        "  d.PREVENTIVE_ACTION          AS preventiveAction, " +
                        "  d.TARGET_DATE                AS targetDate, " +
                        "  d.CLOSED_DATE                AS closedDate, " +
                        "  d.CANCEL_REMARKS             AS cancelRemarks, " +
                        "  d.REV_NO                     AS revNo, " +
                        "  obs.OBSERVATION_NO           AS observationNo, " +
                        "  obs.OBSERVATION_DATE         AS observationDate, " +
                        "  obs.AUDIT_SCHEDULE_NO        AS obsAuditScheduleNo, " +
                        "  sch.DEPARTMENT_ID            AS obsDepartmentId, " +
                        "  sch.AUDITOR_ID               AS auditorId, " +
                        "  sch.NCR_APPROVED_BY_ID       AS ncrApprovedById, " +
                        "  COALESCE(obs.AUDITEE_ID, sch.AUDITEE_ID) AS auditeeId, " +
                        "  COALESCE(emp_auditee.EMPLOYEE_NAME, CONCAT(emp_auditee.FIRST_NAME,' ',emp_auditee.LAST_NAME)) AS auditeeName, "
                        +
                        "  COALESCE(emp_auditee.EMP_CODE, '')        AS auditeeCode, " +
                        "  COALESCE(emp_auditor.EMPLOYEE_NAME, CONCAT(emp_auditor.FIRST_NAME,' ',emp_auditor.LAST_NAME), sch.EXTERNAL_NAME, sch.CONTACT_NAME) AS auditorName, "
                        +
                        "  COALESCE(emp_auditor.EMP_CODE, '')        AS auditorCode, " +
                        "  COALESCE(emp_ncr.EMPLOYEE_NAME, CONCAT(emp_ncr.FIRST_NAME,' ',emp_ncr.LAST_NAME)) AS ncrApprovedByName, "
                        +
                        "  COALESCE(emp_ncr.EMP_CODE, '')            AS ncrApprovedByCode, " +
                        "  dept.DEPARTMENT_NAME         AS departmentName, " +
                        "  at.AUDIT_TYPE                AS auditType " +
                        "FROM QMS_AUDIT_OBSERVATION obs WITH (NOLOCK) " +
                        "JOIN QMS_AUDIT_OBSERVATION_DETAIL d WITH (NOLOCK) ON d.OBSERVATION_ID = obs.ID " +
                        "JOIN QMS_NCR_REWORK_LOG rl WITH (NOLOCK) ON rl.OBSERVATION_DETAIL_ID = d.ID AND rl.REWORK_NO = (SELECT MAX(r2.REWORK_NO) FROM QMS_NCR_REWORK_LOG r2 WITH (NOLOCK) WHERE r2.OBSERVATION_DETAIL_ID = d.ID) "
                        +
                        "JOIN QMS_AUDIT_SCHEDULE sch WITH (NOLOCK) ON sch.SCHEDULE_NO = obs.AUDIT_SCHEDULE_NO " +
                        "LEFT JOIN QMS_AUDIT_SCHEDULE_CRITERIA sc WITH (NOLOCK) ON sc.AUDIT_SCHEDULE_ID = sch.ID AND (sc.SEQ_NO = d.SEQ_NO OR (d.SEQ_NO IS NULL AND sc.CLAUSE = d.CLAUSE)) "
                        +
                        "LEFT JOIN HR_EMPLOYEE emp_auditee WITH (NOLOCK) ON emp_auditee.ID = COALESCE(obs.AUDITEE_ID, sch.AUDITEE_ID) "
                        +
                        "LEFT JOIN HR_EMPLOYEE emp_auditor WITH (NOLOCK) ON emp_auditor.ID = sch.AUDITOR_ID " +
                        "LEFT JOIN HR_EMPLOYEE emp_ncr WITH (NOLOCK) ON emp_ncr.ID = sch.NCR_APPROVED_BY_ID " +
                        "LEFT JOIN HR_DEPARTMENT dept WITH (NOLOCK) ON dept.ID = COALESCE(rl.DEPARTMENT_ID, sch.DEPARTMENT_ID) "
                        +
                        "LEFT JOIN QMS_AUDIT_TYPE at WITH (NOLOCK) ON at.ID = sch.AUDIT_TYPE_ID " +
                        "WHERE (sch.IS_ACTIVE IS NULL OR sch.IS_ACTIVE = 1) " +
                        "  AND d.OBSERVATION_STATUS IN ('NC', 'NCR', 'OFI') " +
                        "  AND (:verifyStatus IS NULL OR :verifyStatus = 'All' OR UPPER(rl.VERIFY_STATUS) = UPPER(:verifyStatus)) "
                        +
                        "  AND (:observationStatus IS NULL OR :observationStatus = 'All' " +
                        "       OR d.OBSERVATION_STATUS = :observationStatus " +
                        "       OR (:observationStatus = 'NC' AND d.OBSERVATION_STATUS = 'NCR')) " +
                        "  AND (:considerDate = 'No' OR (obs.OBSERVATION_DATE >= :fromDate AND obs.OBSERVATION_DATE <= :toDate)) "
                        +
                        "  AND (:query IS NULL OR obs.OBSERVATION_NO LIKE CONCAT('%', :query, '%') " +
                        "       OR obs.AUDIT_SCHEDULE_NO LIKE CONCAT('%', :query, '%') " +
                        "       OR d.NCR_NO LIKE CONCAT('%', :query, '%')) " +
                        "ORDER BY obs.OBSERVATION_DATE DESC, obs.OBSERVATION_NO DESC", nativeQuery = true)
        List<Object[]> findVerifyFindings(
                        @Param("verifyStatus") String verifyStatus,
                        @Param("observationStatus") String observationStatus,
                        @Param("considerDate") String considerDate,
                        @Param("fromDate") java.util.Date fromDate,
                        @Param("toDate") java.util.Date toDate,
                        @Param("query") String query);
}
