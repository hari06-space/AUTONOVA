package com.autonoma.erp.modules.qms.meeting.repository;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMomDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

@Repository
@Transactional(readOnly = true, isolation = Isolation.READ_UNCOMMITTED)
public interface QmsMomDetailsRepository extends JpaRepository<QmsMomDetails, Long> {
       @Query("SELECT d FROM QmsMomDetails d " +
                     "JOIN FETCH d.mom m " +
                     "LEFT JOIN FETCH m.schedule s " +
                     "LEFT JOIN FETCH d.assignedBy ab " +
                     "LEFT JOIN FETCH d.assignedTo at " +
                     "LEFT JOIN FETCH d.processTypeObj pto " +
                     "LEFT JOIN FETCH d.statusObj " +
                     "LEFT JOIN FETCH d.pointTypeObj " +
                     "WHERE (pto.code = 'ACTION' OR pto.code = 'INFO' OR (pto IS NULL AND d.assignedTo IS NOT NULL)) " +
                     "AND d.isActive = true AND m.isActive = true")
       List<QmsMomDetails> findAllActions();

       @org.springframework.data.jpa.repository.Modifying
       @Query("UPDATE QmsMomDetails d SET d.assignedBy = :assignBy, d.assignedTo = :assignTo, d.targetDate = :targetDate, d.reassignComments = :reassignComments, d.updatedDate = CURRENT_TIMESTAMP WHERE d.id IN :ids")
       void updateReassignDetails(
                     @org.springframework.data.repository.query.Param("assignBy") com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster assignBy,
                     @org.springframework.data.repository.query.Param("assignTo") com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster assignTo,
                     @org.springframework.data.repository.query.Param("targetDate") java.time.LocalDate targetDate,
                     @org.springframework.data.repository.query.Param("reassignComments") String reassignComments,
                     @org.springframework.data.repository.query.Param("ids") List<Long> ids);

       @Query(value = "SELECT d.ID AS id, m.ID AS momId, m.MOM_NO AS momNo, d.MIN_NO AS minNo, CONVERT(VARCHAR(10), m.MOM_DATE, 23) AS momDate, "
                     +
                     "       s.SCHEDULE_NO AS scheduleNo, d.DISCUSSED_POINT AS discussedPoint, pt.CODE AS pointType, " +
                     "       (SELECT STRING_AGG(mm.MATERIAL_ID, ',') FROM QMS_MOM_DETAILS_MATERIAL_MAPPING mm WITH (NOLOCK) WHERE mm.MOM_DETAIL_ID = d.ID) AS materialList, "
                     +
                     "       ISNULL(pr.CODE, CASE WHEN d.ASSIGNED_TO_ID IS NOT NULL THEN 'ACTION' ELSE 'INFO' END) AS processType, "
                     +
                     "       ab.EMPLOYEE_NAME AS assignedBy, at.EMPLOYEE_NAME AS assignedTo, " +
                     "       ISNULL(v.ASSIGNED_TO_ID, d.ASSIGNED_TO_ID) AS assignedToId, " +
                     "       ISNULL(v.ASSIGNED_BY_ID, d.ASSIGNED_BY_ID) AS assignedById, " +
                     "       CONVERT(VARCHAR(10), d.TARGET_DATE, 23) AS targetDate, " +
                     "       CONVERT(VARCHAR(10), d.REVIEW_DATE, 23) AS reviewDate, " +
                     "       d.ATTACHMENT_REQUIRED AS attachmentRequired, " +
                     "       COALESCE(v.NEW_STATUS, sm.NAME, 'OPEN') AS status, " +
                     "       COALESCE(v.ACTION_TAKEN, d.ACTION_TAKEN) AS actionTaken, " +
                     "       COALESCE(v.ACTION_OBSERVATION, d.ACTION_OBSERVATION) AS actionObservation, " +
                     "       COALESCE(v.REJECTION_REMARKS, d.CANCEL_REMARKS) AS cancelRemarks, " +
                     "       COALESCE(v.ATTACHMENT_INFO, d.ATTACHMENT_INFO) AS attachmentInfo, " +
                     "       d.CREATED_DATE AS createdAt, d.CREATED_BY AS createdBy, " +
                     "       d.ACTION_STATUS AS actionStatus, d.SUBMITTED_BY AS submittedBy, d.SUBMITTED_DATE AS submittedDate, "
                     +
                     "       d.VERIFIED_BY AS verifiedBy, d.VERIFIED_DATE AS verifiedDate, " +
                     "       d.REJECTED_BY AS rejectedBy, d.REJECTED_DATE AS rejectedDate, " +
                     "       d.REJECTION_REMARKS AS rejectionRemarks, d.LAST_RESUBMITTED_DATE AS lastResubmittedDate, "
                     +
                     "       d.REV_NO AS revNo, d.REJECTED_COUNT AS rejectedCount " +
                     "FROM QMS_MOM_DETAILS d WITH (NOLOCK) " +
                     "JOIN QMS_MOM_MASTER m WITH (NOLOCK) ON m.ID = d.MOM_ID " +
                     "LEFT JOIN QMS_MEETING_SCHEDULE s WITH (NOLOCK) ON s.ID = m.SCHEDULE_ID " +
                     "LEFT JOIN QMS_POINT_TYPE_MASTER pt WITH (NOLOCK) ON pt.ID = d.POINT_TYPE_ID " +
                     "LEFT JOIN QMS_PROCESS_TYPE_MASTER pr WITH (NOLOCK) ON pr.ID = d.PROCESS_TYPE_ID " +
                     "LEFT JOIN HR_EMPLOYEE ab WITH (NOLOCK) ON ab.ID = d.ASSIGNED_BY_ID " +
                     "LEFT JOIN HR_EMPLOYEE at WITH (NOLOCK) ON at.ID = d.ASSIGNED_TO_ID " +
                     "LEFT JOIN AD_STATUS_MASTER sm WITH (NOLOCK) ON sm.ID = d.STATUS " +
                     "OUTER APPLY ( " +
                     "    SELECT TOP 1 v1.NEW_STATUS, v1.ACTION_TAKEN, v1.ACTION_OBSERVATION, v1.REJECTION_REMARKS, v1.ATTACHMENT_INFO, v1.ASSIGNED_TO_ID, v1.ASSIGNED_BY_ID "
                     +
                     "    FROM QMS_CLOSE_MOM_AND_VERIFY v1 WITH (NOLOCK) " +
                     "    WHERE v1.ACTION_ITEM_ID = d.ID " +
                     "      AND ( " +
                     "           :pageCode = 'QM1340' " +
                     "           OR ISNULL(pr.CODE, CASE WHEN d.ASSIGNED_TO_ID IS NOT NULL THEN 'ACTION' ELSE 'INFO' END) <> 'INFO' " +
                     "           OR v1.ASSIGNED_TO_ID = :userEmpId " +
                     "      ) " +
                     "    ORDER BY CASE WHEN :memberId IS NOT NULL AND :memberId > 0 AND (v1.ASSIGNED_TO_ID = :memberId OR v1.ASSIGNED_BY_ID = :memberId) THEN 1 WHEN :userEmpId IS NOT NULL AND :userEmpId > 0 AND (v1.ASSIGNED_TO_ID = :userEmpId OR v1.ASSIGNED_BY_ID = :userEmpId) THEN 2 ELSE 3 END, v1.ID DESC " +
                     ") v " +
                     "WHERE d.IS_ACTIVE = 1 AND m.IS_ACTIVE = 1 " +
                     "  AND (:memberId IS NULL OR :memberId <= 0 OR ISNULL(v.ASSIGNED_TO_ID, d.ASSIGNED_TO_ID) = :memberId OR ISNULL(v.ASSIGNED_BY_ID, d.ASSIGNED_BY_ID) = :memberId) "
                     +
                     "  AND (:pageCode <> 'QM1340' OR ( " +
                     "       :scope = 'Company' OR :isCompany = 1 OR " +
                     "       (:scope = 'Team' AND ( " +
                     "            ISNULL(v.ASSIGNED_TO_ID, d.ASSIGNED_TO_ID) = :userEmpId OR " +
                     "            ISNULL(v.ASSIGNED_BY_ID, d.ASSIGNED_BY_ID) = :userEmpId OR " +
                     "            ISNULL(v.ASSIGNED_TO_ID, d.ASSIGNED_TO_ID) IN (SELECT eo.EMPLOYEE_ID FROM HR_EMPLOYEE_ORGANIZATION eo WITH (NOLOCK) WHERE eo.DEPARTMENT_ID = (SELECT eo2.DEPARTMENT_ID FROM HR_EMPLOYEE_ORGANIZATION eo2 WITH (NOLOCK) WHERE eo2.EMPLOYEE_ID = :userEmpId)) OR " +
                     "            ISNULL(v.ASSIGNED_BY_ID, d.ASSIGNED_BY_ID) IN (SELECT eo.EMPLOYEE_ID FROM HR_EMPLOYEE_ORGANIZATION eo WITH (NOLOCK) WHERE eo.DEPARTMENT_ID = (SELECT eo2.DEPARTMENT_ID FROM HR_EMPLOYEE_ORGANIZATION eo2 WITH (NOLOCK) WHERE eo2.EMPLOYEE_ID = :userEmpId)) "
                     +
                     "       )) OR " +
                     "       ISNULL(v.ASSIGNED_TO_ID, d.ASSIGNED_TO_ID) = :userEmpId " +
                     "  )) " +
                     "  AND (:pageCode <> 'QM1350' OR ( " +
                     "       UPPER(COALESCE(v.NEW_STATUS, sm.NAME, 'OPEN')) NOT IN ('OPEN', 'CREATED', 'CANCELLED') " +
                     "       AND ( " +
                     "            :scope = 'Company' OR :isCompany = 1 OR " +
                     "            (:scope = 'Team' AND ( " +
                     "                 ISNULL(v.ASSIGNED_BY_ID, d.ASSIGNED_BY_ID) = :userEmpId OR " +
                     "                 ISNULL(v.ASSIGNED_TO_ID, d.ASSIGNED_TO_ID) = :userEmpId OR " +
                     "                 ISNULL(v.ASSIGNED_BY_ID, d.ASSIGNED_BY_ID) IN (SELECT eo.EMPLOYEE_ID FROM HR_EMPLOYEE_ORGANIZATION eo WITH (NOLOCK) WHERE eo.DEPARTMENT_ID = (SELECT eo2.DEPARTMENT_ID FROM HR_EMPLOYEE_ORGANIZATION eo2 WITH (NOLOCK) WHERE eo2.EMPLOYEE_ID = :userEmpId)) OR " +
                     "                 ISNULL(v.ASSIGNED_TO_ID, d.ASSIGNED_TO_ID) IN (SELECT eo.EMPLOYEE_ID FROM HR_EMPLOYEE_ORGANIZATION eo WITH (NOLOCK) WHERE eo.DEPARTMENT_ID = (SELECT eo2.DEPARTMENT_ID FROM HR_EMPLOYEE_ORGANIZATION eo2 WITH (NOLOCK) WHERE eo2.EMPLOYEE_ID = :userEmpId)) "
                     +
                     "            )) OR " +
                     "            ISNULL(v.ASSIGNED_BY_ID, d.ASSIGNED_BY_ID) = :userEmpId " +
                     "       ) " +
                     "  )) " +
                     "  AND (:status IS NULL OR :status = '' OR :status = 'All' OR " +
                     "       EXISTS ( " +
                     "           SELECT 1 FROM STRING_SPLIT(:status, ',') st " +
                     "           WHERE UPPER(COALESCE(v.NEW_STATUS, sm.NAME, 'OPEN')) = UPPER(TRIM(st.value)) " +
                     "              OR (UPPER(TRIM(st.value)) IN ('OPEN', 'UNRESOLVED') AND UPPER(COALESCE(v.NEW_STATUS, sm.NAME, 'OPEN')) IN ('OPEN', 'UNRESOLVED', 'CREATED')) "
                     +
                     "              OR (UPPER(TRIM(st.value)) LIKE '%PENDING%' AND UPPER(COALESCE(v.NEW_STATUS, sm.NAME, 'OPEN')) LIKE '%PENDING%') "
                     +
                     "              OR (UPPER(TRIM(st.value)) IN ('VERIFIED', 'ACCEPTED', 'APPROVED') AND UPPER(COALESCE(v.NEW_STATUS, sm.NAME, 'OPEN')) IN ('VERIFIED', 'ACCEPTED', 'APPROVED')) "
                     +
                     "              OR (UPPER(TRIM(st.value)) = 'REJECTED' AND UPPER(COALESCE(v.NEW_STATUS, sm.NAME, 'OPEN')) = 'REJECTED') "
                     +
                     "              OR (UPPER(TRIM(st.value)) = 'CLOSED' AND UPPER(COALESCE(v.NEW_STATUS, sm.NAME, 'OPEN')) IN ('CLOSED', 'CANCELLED')) "
                     +
                     "       ) " +
                     "  ) " +
                     "  AND (:dashboardFilter IS NULL OR :dashboardFilter = '' OR ( " +
                     "       (:dashboardFilter = 'today' AND (CAST(m.MOM_DATE AS DATE) = CAST(GETDATE() AS DATE) OR CAST(d.TARGET_DATE AS DATE) = CAST(GETDATE() AS DATE))) OR " +
                     "       (:dashboardFilter = 'overdue' AND ( " +
                     "           (:pageCode = 'QM1350' AND d.TARGET_DATE IS NOT NULL AND CAST(d.TARGET_DATE AS DATE) < CAST(GETDATE() AS DATE)) " +
                     "           OR (:pageCode <> 'QM1350' AND (COALESCE(v.NEW_STATUS, sm.NAME) IS NULL OR UPPER(COALESCE(v.NEW_STATUS, sm.NAME)) IN ('OPEN','UNRESOLVED','CREATED','')) AND d.TARGET_DATE IS NOT NULL AND CAST(d.TARGET_DATE AS DATE) < CAST(GETDATE() AS DATE)) " +
                     "       )) OR " +
                     "       (:dashboardFilter = 'pending' AND ( " +
                     "           (:pageCode = 'QM1350' AND (d.TARGET_DATE IS NULL OR CAST(d.TARGET_DATE AS DATE) >= CAST(GETDATE() AS DATE))) " +
                     "           OR (:pageCode <> 'QM1350' AND (COALESCE(v.NEW_STATUS, sm.NAME) IS NULL OR UPPER(COALESCE(v.NEW_STATUS, sm.NAME)) IN ('OPEN','UNRESOLVED','CREATED','')) AND (d.TARGET_DATE IS NULL OR CAST(d.TARGET_DATE AS DATE) >= CAST(GETDATE() AS DATE))) " +
                     "       )) OR " +
                     "       (:dashboardFilter = 'closed' AND UPPER(COALESCE(v.NEW_STATUS, sm.NAME)) IN ('VERIFIED','CLOSED','ACCEPTED')) " +
                     "  )) " +
                     "  AND (:search IS NULL OR :search = '' OR " +
                     "       (:searchBy = 'momNo' AND (m.MOM_NO LIKE '%' + :search + '%' OR d.MIN_NO LIKE '%' + :search + '%')) OR " +
                     "       (:searchBy <> 'momNo' AND (m.MOM_NO LIKE '%' + :search + '%' OR d.MIN_NO LIKE '%' + :search + '%' OR d.DISCUSSED_POINT LIKE '%' + :search + '%'))) " +
                     "  AND (:considerDate = 0 OR (m.MOM_DATE >= TRY_CAST(:startDate AS DATE) AND m.MOM_DATE <= TRY_CAST(:endDate AS DATE))) " +
                     "ORDER BY d.ID DESC", countQuery = "SELECT COUNT(*) " +
                                   "FROM QMS_MOM_DETAILS d WITH (NOLOCK) " +
                                   "JOIN QMS_MOM_MASTER m WITH (NOLOCK) ON m.ID = d.MOM_ID " +
                                   "LEFT JOIN QMS_PROCESS_TYPE_MASTER pr WITH (NOLOCK) ON pr.ID = d.PROCESS_TYPE_ID " +
                                   "LEFT JOIN AD_STATUS_MASTER sm WITH (NOLOCK) ON sm.ID = d.STATUS " +
                                   "OUTER APPLY ( " +
                                   "    SELECT TOP 1 v1.NEW_STATUS, v1.ASSIGNED_TO_ID, v1.ASSIGNED_BY_ID " +
                                   "    FROM QMS_CLOSE_MOM_AND_VERIFY v1 WITH (NOLOCK) " +
                                   "    WHERE v1.ACTION_ITEM_ID = d.ID " +
                                   "      AND ( " +
                                   "           :pageCode = 'QM1340' " +
                                   "           OR ISNULL((SELECT pr.CODE FROM QMS_PROCESS_TYPE_MASTER pr WITH (NOLOCK) WHERE pr.ID = d.PROCESS_TYPE_ID), CASE WHEN d.ASSIGNED_TO_ID IS NOT NULL THEN 'ACTION' ELSE 'INFO' END) <> 'INFO' " +
                                   "           OR v1.ASSIGNED_TO_ID = :userEmpId " +
                                   "      ) " +
                                   "    ORDER BY CASE WHEN :memberId IS NOT NULL AND :memberId > 0 AND (v1.ASSIGNED_TO_ID = :memberId OR v1.ASSIGNED_BY_ID = :memberId) THEN 1 WHEN :userEmpId IS NOT NULL AND :userEmpId > 0 AND (v1.ASSIGNED_TO_ID = :userEmpId OR v1.ASSIGNED_BY_ID = :userEmpId) THEN 2 ELSE 3 END, v1.ID DESC " +
                                   ") v " +
                                   "WHERE d.IS_ACTIVE = 1 AND m.IS_ACTIVE = 1 " +
                                   "  AND (:memberId IS NULL OR :memberId <= 0 OR ISNULL(v.ASSIGNED_TO_ID, d.ASSIGNED_TO_ID) = :memberId OR ISNULL(v.ASSIGNED_BY_ID, d.ASSIGNED_BY_ID) = :memberId) "
                                   +
                                   "  AND (:pageCode <> 'QM1340' OR ( " +
                                   "       :scope = 'Company' OR :isCompany = 1 OR " +
                                   "       (:scope = 'Team' AND ( " +
                                   "            ISNULL(v.ASSIGNED_TO_ID, d.ASSIGNED_TO_ID) = :userEmpId OR " +
                                   "            ISNULL(v.ASSIGNED_BY_ID, d.ASSIGNED_BY_ID) = :userEmpId OR " +
                                   "            ISNULL(v.ASSIGNED_TO_ID, d.ASSIGNED_TO_ID) IN (SELECT eo.EMPLOYEE_ID FROM HR_EMPLOYEE_ORGANIZATION eo WITH (NOLOCK) WHERE eo.DEPARTMENT_ID = (SELECT eo2.DEPARTMENT_ID FROM HR_EMPLOYEE_ORGANIZATION eo2 WITH (NOLOCK) WHERE eo2.EMPLOYEE_ID = :userEmpId)) OR " +
                                   "            ISNULL(v.ASSIGNED_BY_ID, d.ASSIGNED_BY_ID) IN (SELECT eo.EMPLOYEE_ID FROM HR_EMPLOYEE_ORGANIZATION eo WITH (NOLOCK) WHERE eo.DEPARTMENT_ID = (SELECT eo2.DEPARTMENT_ID FROM HR_EMPLOYEE_ORGANIZATION eo2 WITH (NOLOCK) WHERE eo2.EMPLOYEE_ID = :userEmpId)) "
                                   +
                                   "       )) OR " +
                                   "       ISNULL(v.ASSIGNED_TO_ID, d.ASSIGNED_TO_ID) = :userEmpId " +
                                   "  )) " +
                                   "  AND (:pageCode <> 'QM1350' OR ( " +
                                   "       UPPER(COALESCE(v.NEW_STATUS, sm.NAME, 'OPEN')) NOT IN ('OPEN', 'CREATED', 'CANCELLED') "
                                   +
                                   "       AND ( " +
                                   "            :scope = 'Company' OR :isCompany = 1 OR " +
                                   "            (:scope = 'Team' AND ( " +
                                   "                 ISNULL(v.ASSIGNED_BY_ID, d.ASSIGNED_BY_ID) = :userEmpId OR " +
                                   "                 ISNULL(v.ASSIGNED_TO_ID, d.ASSIGNED_TO_ID) = :userEmpId OR " +
                                   "                 ISNULL(v.ASSIGNED_BY_ID, d.ASSIGNED_BY_ID) IN (SELECT eo.EMPLOYEE_ID FROM HR_EMPLOYEE_ORGANIZATION eo WITH (NOLOCK) WHERE eo.DEPARTMENT_ID = (SELECT eo2.DEPARTMENT_ID FROM HR_EMPLOYEE_ORGANIZATION eo2 WITH (NOLOCK) WHERE eo2.EMPLOYEE_ID = :userEmpId)) OR " +
                                   "                 ISNULL(v.ASSIGNED_TO_ID, d.ASSIGNED_TO_ID) IN (SELECT eo.EMPLOYEE_ID FROM HR_EMPLOYEE_ORGANIZATION eo WITH (NOLOCK) WHERE eo.DEPARTMENT_ID = (SELECT eo2.DEPARTMENT_ID FROM HR_EMPLOYEE_ORGANIZATION eo2 WITH (NOLOCK) WHERE eo2.EMPLOYEE_ID = :userEmpId)) "
                                   +
                                   "            )) OR " +
                                   "            ISNULL(v.ASSIGNED_BY_ID, d.ASSIGNED_BY_ID) = :userEmpId " +
                                   "       ) " +
                                   "  )) " +
                                   "  AND (:status IS NULL OR :status = '' OR :status = 'All' OR " +
                                   "       EXISTS ( " +
                                   "           SELECT 1 FROM STRING_SPLIT(:status, ',') st " +
                                   "           WHERE UPPER(COALESCE(v.NEW_STATUS, sm.NAME, 'OPEN')) = UPPER(TRIM(st.value)) "
                                   +
                                   "              OR (UPPER(TRIM(st.value)) IN ('OPEN', 'UNRESOLVED') AND UPPER(COALESCE(v.NEW_STATUS, sm.NAME, 'OPEN')) IN ('OPEN', 'UNRESOLVED', 'CREATED')) "
                                   +
                                   "              OR (UPPER(TRIM(st.value)) LIKE '%PENDING%' AND UPPER(COALESCE(v.NEW_STATUS, sm.NAME, 'OPEN')) LIKE '%PENDING%') "
                                   +
                                   "              OR (UPPER(TRIM(st.value)) IN ('VERIFIED', 'ACCEPTED', 'APPROVED') AND UPPER(COALESCE(v.NEW_STATUS, sm.NAME, 'OPEN')) IN ('VERIFIED', 'ACCEPTED', 'APPROVED')) "
                                   +
                                   "              OR (UPPER(TRIM(st.value)) = 'REJECTED' AND UPPER(COALESCE(v.NEW_STATUS, sm.NAME, 'OPEN')) = 'REJECTED') "
                                   +
                                   "              OR (UPPER(TRIM(st.value)) = 'CLOSED' AND UPPER(COALESCE(v.NEW_STATUS, sm.NAME, 'OPEN')) IN ('CLOSED', 'CANCELLED')) "
                                   +
                                   "       ) " +
                                   "  ) " +
                                   "  AND (:dashboardFilter IS NULL OR :dashboardFilter = '' OR ( " +
                                   "       (:dashboardFilter = 'today' AND (CAST(m.MOM_DATE AS DATE) = CAST(GETDATE() AS DATE) OR CAST(d.TARGET_DATE AS DATE) = CAST(GETDATE() AS DATE))) OR " +
                                   "       (:dashboardFilter = 'overdue' AND ( " +
                                   "           (:pageCode = 'QM1350' AND d.TARGET_DATE IS NOT NULL AND CAST(d.TARGET_DATE AS DATE) < CAST(GETDATE() AS DATE)) " +
                                   "           OR (:pageCode <> 'QM1350' AND (COALESCE(v.NEW_STATUS, sm.NAME) IS NULL OR UPPER(COALESCE(v.NEW_STATUS, sm.NAME)) IN ('OPEN','UNRESOLVED','CREATED','')) AND d.TARGET_DATE IS NOT NULL AND CAST(d.TARGET_DATE AS DATE) < CAST(GETDATE() AS DATE)) " +
                                   "       )) OR " +
                                   "       (:dashboardFilter = 'pending' AND ( " +
                                   "           (:pageCode = 'QM1350' AND (d.TARGET_DATE IS NULL OR CAST(d.TARGET_DATE AS DATE) >= CAST(GETDATE() AS DATE))) " +
                                   "           OR (:pageCode <> 'QM1350' AND (COALESCE(v.NEW_STATUS, sm.NAME) IS NULL OR UPPER(COALESCE(v.NEW_STATUS, sm.NAME)) IN ('OPEN','UNRESOLVED','CREATED','')) AND (d.TARGET_DATE IS NULL OR CAST(d.TARGET_DATE AS DATE) >= CAST(GETDATE() AS DATE))) " +
                                   "       )) OR " +
                                   "       (:dashboardFilter = 'closed' AND UPPER(COALESCE(v.NEW_STATUS, sm.NAME)) IN ('VERIFIED','CLOSED','ACCEPTED')) " +
                                   "  )) " +
                                   "  AND (:search IS NULL OR :search = '' OR " +
                                   "       (:searchBy = 'momNo' AND (m.MOM_NO LIKE '%' + :search + '%' OR d.MIN_NO LIKE '%' + :search + '%')) OR " +
                                   "       (:searchBy <> 'momNo' AND (m.MOM_NO LIKE '%' + :search + '%' OR d.MIN_NO LIKE '%' + :search + '%' OR d.DISCUSSED_POINT LIKE '%' + :search + '%'))) " +
                                   "  AND (:considerDate = 0 OR (m.MOM_DATE >= TRY_CAST(:startDate AS DATE) AND m.MOM_DATE <= TRY_CAST(:endDate AS DATE)))", nativeQuery = true)
       org.springframework.data.domain.Page<java.util.Map<String, Object>> findActionSummaryPaged(
                     @org.springframework.data.repository.query.Param("pageCode") String pageCode,
                     @org.springframework.data.repository.query.Param("scope") String scope,
                     @org.springframework.data.repository.query.Param("isCompany") int isCompany,
                     @org.springframework.data.repository.query.Param("userEmpId") Long userEmpId,
                     @org.springframework.data.repository.query.Param("memberId") Long memberId,
                     @org.springframework.data.repository.query.Param("status") String status,
                     @org.springframework.data.repository.query.Param("search") String search,
                     @org.springframework.data.repository.query.Param("searchBy") String searchBy,
                     @org.springframework.data.repository.query.Param("considerDate") int considerDate,
                     @org.springframework.data.repository.query.Param("startDate") String startDate,
                     @org.springframework.data.repository.query.Param("endDate") String endDate,
                     @org.springframework.data.repository.query.Param("dashboardFilter") String dashboardFilter,
                     org.springframework.data.domain.Pageable pageable);
}
