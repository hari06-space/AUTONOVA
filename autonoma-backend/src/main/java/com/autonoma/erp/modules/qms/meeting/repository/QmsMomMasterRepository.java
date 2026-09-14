package com.autonoma.erp.modules.qms.meeting.repository;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMomMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Repository;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

@Repository
@Transactional(readOnly = true, isolation = Isolation.READ_UNCOMMITTED)
public interface QmsMomMasterRepository
        extends JpaRepository<QmsMomMaster, Long>, JpaSpecificationExecutor<QmsMomMaster> {
    @Query("SELECT MAX(m.id) FROM QmsMomMaster m")
    Optional<Long> findMaxId();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT MAX(m.id) FROM QmsMomMaster m")
    Optional<Long> findMaxIdWithLock();

    Optional<QmsMomMaster> findByMomNo(String momNo);

    @Query("SELECT m FROM QmsMomMaster m " +
            "LEFT JOIN FETCH m.schedule s " +
            "LEFT JOIN FETCH s.meetingType " +
            "LEFT JOIN FETCH m.chairedBy " +
            "LEFT JOIN FETCH m.statusObj " +
            "ORDER BY m.id DESC")
    java.util.List<QmsMomMaster> findAllWithDetails();

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM QmsMomMaster m WHERE m.schedule.id = :scheduleId AND (:id IS NULL OR m.id <> :id)")
    boolean existsByScheduleIdAndIdNot(@org.springframework.data.repository.query.Param("scheduleId") Long scheduleId,
            @org.springframework.data.repository.query.Param("id") Long id);

    /**
     * Server-side paginated list query for the MOM list page.
     * All filtering is done at DB level with WITH (NOLOCK) to prevent read locks.
     * Returns only the fields needed for list display — no child collections
     * fetched.
     */
    @Query(value = "SELECT m.ID AS id, m.MOM_NO AS momNo, CONVERT(VARCHAR(10), m.MOM_DATE, 23) AS momDate, " +
            "       s.SCHEDULE_NO AS scheduleNo, mt.MEETING_NAME AS meetingTypeName, " +
            "       sm.NAME AS status, " +
            "       m.CREATED_BY AS createdUser, m.CREATED_DATE AS createdAt, " +
            "       m.UPDATED_BY AS updatedUser, m.UPDATED_DATE AS updatedAt, " +
            "       (SELECT COUNT(*) FROM QMS_MOM_DETAILS d WITH (NOLOCK) WHERE d.MOM_ID = m.ID) AS totalDetails, " +
            "       (SELECT COUNT(*) FROM QMS_MOM_DETAILS d WITH (NOLOCK) " +
            "            JOIN AD_STATUS_MASTER ds WITH (NOLOCK) ON ds.ID = d.STATUS " +
            "            WHERE d.MOM_ID = m.ID AND UPPER(ds.NAME) IN ('OPEN', 'UNRESOLVED')) AS openCount, " +
            "       (SELECT COUNT(*) FROM QMS_MOM_DETAILS d WITH (NOLOCK) " +
            "            JOIN AD_STATUS_MASTER ds WITH (NOLOCK) ON ds.ID = d.STATUS " +
            "            WHERE d.MOM_ID = m.ID AND UPPER(ds.NAME) IN ('CLOSED', 'VERIFIED')) AS closedCount, " +
            "       (SELECT COUNT(*) FROM QMS_MOM_DETAILS d WITH (NOLOCK) " +
            "            JOIN AD_STATUS_MASTER ds WITH (NOLOCK) ON ds.ID = d.STATUS " +
            "            WHERE d.MOM_ID = m.ID AND UPPER(ds.NAME) IN ('PENDING FOR VERIFY', 'PENDING FOR VERIFIED')) AS pendingCount, " +
            "       (SELECT COUNT(*) FROM QMS_MOM_DETAILS d WITH (NOLOCK) " +
            "            JOIN AD_STATUS_MASTER ds WITH (NOLOCK) ON ds.ID = d.STATUS " +
            "            WHERE d.MOM_ID = m.ID AND UPPER(ds.NAME) = 'CANCELLED') AS cancelledCount " +
            "FROM QMS_MOM_MASTER m WITH (NOLOCK) " +
            "LEFT JOIN QMS_MEETING_SCHEDULE s WITH (NOLOCK) ON s.ID = m.SCHEDULE_ID " +
            "LEFT JOIN QMS_MEETING_MASTER mt WITH (NOLOCK) ON mt.ID = s.MEETING_TYPE_ID " +
            "LEFT JOIN AD_STATUS_MASTER sm WITH (NOLOCK) ON sm.ID = m.STATUS " +
            "WHERE (:momNo IS NULL OR :momNo = '' OR (" +
            "       m.MOM_NO LIKE '%' + :momNo + '%' OR " +
            "       EXISTS (SELECT 1 FROM QMS_MOM_DETAILS md WITH (NOLOCK) WHERE md.MOM_ID = m.ID AND md.MIN_NO LIKE '%' + :momNo + '%') OR " +
            "       s.SCHEDULE_NO LIKE '%' + :momNo + '%' OR " +
            "       mt.MEETING_NAME LIKE '%' + :momNo + '%' OR " +
            "       sm.NAME LIKE '%' + :momNo + '%' OR " +
            "       m.CREATED_BY LIKE '%' + :momNo + '%' OR " +
            "       m.UPDATED_BY LIKE '%' + :momNo + '%' OR " +
            "       CONVERT(VARCHAR(10), m.MOM_DATE, 103) LIKE '%' + :momNo + '%' OR " +
            "       CONVERT(VARCHAR(10), m.MOM_DATE, 23) LIKE '%' + :momNo + '%')) " +
            "  AND (:startDate IS NULL OR CAST(m.MOM_DATE AS DATE) >= TRY_CAST(:startDate AS DATE)) " +
            "  AND (:endDate IS NULL OR CAST(m.MOM_DATE AS DATE) <= TRY_CAST(:endDate AS DATE)) " +
            "  AND (:status IS NULL OR :status = 'All' OR UPPER(sm.NAME) = UPPER(:status)) " +
            "ORDER BY m.ID DESC", countQuery = "SELECT COUNT(*) FROM QMS_MOM_MASTER m WITH (NOLOCK) " +
                    "LEFT JOIN QMS_MEETING_SCHEDULE s WITH (NOLOCK) ON s.ID = m.SCHEDULE_ID " +
                    "LEFT JOIN QMS_MEETING_MASTER mt WITH (NOLOCK) ON mt.ID = s.MEETING_TYPE_ID " +
                    "LEFT JOIN AD_STATUS_MASTER sm WITH (NOLOCK) ON sm.ID = m.STATUS " +
                    "WHERE (:momNo IS NULL OR :momNo = '' OR (" +
                    "       m.MOM_NO LIKE '%' + :momNo + '%' OR " +
                    "       EXISTS (SELECT 1 FROM QMS_MOM_DETAILS md WITH (NOLOCK) WHERE md.MOM_ID = m.ID AND md.MIN_NO LIKE '%' + :momNo + '%') OR " +
                    "       s.SCHEDULE_NO LIKE '%' + :momNo + '%' OR " +
                    "       mt.MEETING_NAME LIKE '%' + :momNo + '%' OR " +
                    "       sm.NAME LIKE '%' + :momNo + '%' OR " +
                    "       m.CREATED_BY LIKE '%' + :momNo + '%' OR " +
                    "       m.UPDATED_BY LIKE '%' + :momNo + '%' OR " +
                    "       CONVERT(VARCHAR(10), m.MOM_DATE, 103) LIKE '%' + :momNo + '%' OR " +
                    "       CONVERT(VARCHAR(10), m.MOM_DATE, 23) LIKE '%' + :momNo + '%')) " +
                    "  AND (:startDate IS NULL OR CAST(m.MOM_DATE AS DATE) >= TRY_CAST(:startDate AS DATE)) " +
                    "  AND (:endDate IS NULL OR CAST(m.MOM_DATE AS DATE) <= TRY_CAST(:endDate AS DATE)) " +
                    "  AND (:status IS NULL OR :status = 'All' OR UPPER(sm.NAME) = UPPER(:status))", nativeQuery = true)
    Page<java.util.Map<String, Object>> findMomListPaged(
            @org.springframework.data.repository.query.Param("momNo") String momNo,
            @org.springframework.data.repository.query.Param("startDate") String startDate,
            @org.springframework.data.repository.query.Param("endDate") String endDate,
            @org.springframework.data.repository.query.Param("status") String status,
            Pageable pageable);
}
