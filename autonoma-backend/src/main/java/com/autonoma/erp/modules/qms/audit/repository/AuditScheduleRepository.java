package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.AuditSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

@Repository
public interface AuditScheduleRepository extends JpaRepository<AuditSchedule, Long> {
        java.util.Optional<AuditSchedule> findFirstByOrderByScheduleNoDesc();

        @Query("SELECT s FROM AuditSchedule s "
                        + "LEFT JOIN s.auditorEntity auditor "
                        + "LEFT JOIN s.auditeeEntity auditee "
                        + "WHERE s.status IN ('OPEN','RESCHEDULE') AND s.isActive = true AND ("
                        + "(:empId IS NOT NULL AND (s.auditorId = :empId OR s.auditeeId = :empId)) OR "
                        + "(:empCode IS NOT NULL AND :empCode <> '' AND (LOWER(auditor.empCode) LIKE CONCAT('%', LOWER(:empCode), '%') OR LOWER(auditee.empCode) LIKE CONCAT('%', LOWER(:empCode), '%'))) OR "
                        + "(:empName IS NOT NULL AND :empName <> '' AND (LOWER(auditor.employeeName) LIKE CONCAT('%', LOWER(:empName), '%') OR LOWER(auditee.employeeName) LIKE CONCAT('%', LOWER(:empName), '%')))"
                        + ")")
        java.util.List<AuditSchedule> findOpenSchedulesForUser(
                        @Param("empId") Long empId,
                        @Param("empCode") String empCode,
                        @Param("empName") String empName);

        @Query("SELECT s FROM AuditSchedule s WHERE s.isActive = true AND (s.status = 'OPEN' OR s.status = 'RESCHEDULE')")
        java.util.List<AuditSchedule> findAllOpenActive();

        @Query("SELECT s FROM AuditSchedule s WHERE s.isActive = true AND (s.status = 'OPEN' OR s.status = 'RESCHEDULE') AND (s.auditorId IN :empIds OR s.auditeeId IN :empIds)")
        java.util.List<AuditSchedule> findAllOpenActiveForTeam(@Param("empIds") java.util.List<Long> empIds);

        /**
         * Returns OPEN schedules where:
         * 1. The user is the Auditor (s.auditorId = :empId)
         * 2. The user has already checked attendance (a record exists in
         * QMS_AUDIT_ATTENDANCE for this schedule+employee)
         */
        @Query("SELECT s FROM AuditSchedule s " +
                        "WHERE s.isActive = true AND (s.status = 'OPEN' OR s.status = 'RESCHEDULE') " +
                        "AND (s.auditorId = :empId OR s.auditeeId = :empId OR s.ncrApprovedById = :empId OR s.auditorId IS NULL) " +
                        "AND EXISTS (SELECT 1 FROM AuditAttendance att WHERE att.auditSchId = s.id)")
        java.util.List<AuditSchedule> findOpenAuditorSchedulesWithAttendance(@Param("empId") Long empId);

        @Query("SELECT a FROM AuditSchedule a WHERE a.scheduleNo LIKE CONCAT(:prefix, '%') ORDER BY CAST(SUBSTRING(a.scheduleNo, :startIndex) as integer) DESC")
        java.util.List<AuditSchedule> findLatestScheduleNo(@Param("prefix") String prefix,
                        @Param("startIndex") int startIndex, Pageable pageable);

        java.util.Optional<AuditSchedule> findByScheduleNo(String scheduleNo);

        java.util.List<AuditSchedule> findByScheduleNoIn(java.util.Collection<String> scheduleNos);

        java.util.Optional<AuditSchedule> findByScheduleNoIgnoreCase(String scheduleNo);

        java.util.List<AuditSchedule> findByConfigId(Long configId);

        java.util.List<AuditSchedule> findByConfigIdOrderByIdDesc(Long configId);

        @Query(value = "SELECT a.* FROM QMS_AUDIT_SCHEDULE a WITH (NOLOCK) WHERE 1 = 1 " +
                        "AND (:status IS NULL OR a.status = :status) " +
                        "AND (:search IS NULL OR CONTAINS(a.search_text, :search)) " +
                        "ORDER BY a.id DESC", nativeQuery = true)
        Slice<AuditSchedule> findByFiltersFts(@Param("status") String status, @Param("search") String search,
                        Pageable pageable);

        @Query(value = "SELECT a.* FROM QMS_AUDIT_SCHEDULE a WITH (NOLOCK) WHERE 1 = 1 " +
                        "AND (:status IS NULL OR a.status = :status) " +
                        "AND (:search IS NULL OR a.search_text LIKE '%' + :search + '%') " +
                        "ORDER BY a.id DESC", nativeQuery = true)
        Slice<AuditSchedule> findByFiltersLike(@Param("status") String status, @Param("search") String search,
                        Pageable pageable);

        @Query(value = "SELECT a.* FROM QMS_AUDIT_SCHEDULE a WITH (NOLOCK) WHERE 1 = 1 " +
                        "AND (:status IS NULL OR a.status = :status) " +
                        "AND (:search IS NULL OR CONTAINS(a.search_text, :search)) " +
                        "ORDER BY a.id DESC", nativeQuery = true)
        java.util.List<AuditSchedule> findByFiltersFtsList(@Param("status") String status,
                        @Param("search") String search);

        @Query(value = "SELECT a.* FROM QMS_AUDIT_SCHEDULE a WITH (NOLOCK) WHERE 1 = 1 " +
                        "AND (:status IS NULL OR a.status = :status) " +
                        "AND (:search IS NULL OR a.search_text LIKE '%' + :search + '%') " +
                        "ORDER BY a.id DESC", nativeQuery = true)
        java.util.List<AuditSchedule> findByFiltersLikeList(@Param("status") String status,
                        @Param("search") String search);

        @Query(value = "SELECT a.* FROM QMS_AUDIT_SCHEDULE a WITH (NOLOCK) WHERE (a.auditee_id = :userId OR a.auditor_id = :userId OR a.ncr_approved_by_id = :userId) "
                        +
                        "AND a.audit_date = :currentDate " +
                        "AND a.start_time IS NOT NULL AND a.start_time <> '' " +
                        "AND DATEADD(MINUTE, -10, CAST(CONCAT(FORMAT(a.audit_date, 'yyyy-MM-dd'), ' ', a.start_time) AS DATETIME)) <= :currentDateTime "
                        +
                        "AND (a.end_time IS NULL OR a.end_time = '' OR CAST(CONCAT(FORMAT(a.audit_date, 'yyyy-MM-dd'), ' ', a.end_time) AS DATETIME) >= :currentDateTime) "
                        +
                        "AND a.is_active = 1 " +
                        "AND (a.status IS NULL OR (a.status <> 'CANCELLED' AND a.status <> 'CLOSED' AND a.status <> 'AUTO CLOSED')) " +
                        "AND NOT EXISTS (SELECT 1 FROM QMS_AUDIT_ATTENDANCE xx WHERE xx.AUDIT_SCH_ID = a.ID AND xx.EMPLOYEE_ID = :userId)", nativeQuery = true)
        java.util.List<AuditSchedule> findOpenSchedulesForAttendanceNative(
                        @Param("userId") Long userId,
                        @Param("currentDate") java.time.LocalDate currentDate,
                        @Param("currentDateTime") java.time.LocalDateTime currentDateTime);

        @Query("SELECT s FROM AuditSchedule s WHERE (s.status = 'OPEN' OR s.status = 'RESCHEDULE') AND s.isActive = true AND ("
                        + "s.auditorId = :empId OR s.auditeeId = :empId OR s.ncrApprovedById = :empId)")
        java.util.List<AuditSchedule> findEligibleSchedulesForAttendance(@Param("empId") Long empId);

        java.util.Optional<AuditSchedule> findFirstByParentIdOrderByIdDesc(Long parentId);

        boolean existsByParentIdAndAuditDate(Long parentId, java.util.Date auditDate);

        java.util.Optional<AuditSchedule> findByParentIdAndAuditDate(Long parentId, java.util.Date auditDate);

        java.util.List<AuditSchedule> findByParentId(Long parentId);
}

