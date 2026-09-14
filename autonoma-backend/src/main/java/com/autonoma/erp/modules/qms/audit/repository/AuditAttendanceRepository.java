package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.AuditAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuditAttendanceRepository extends JpaRepository<AuditAttendance, Long> {
    @Query("SELECT a FROM AuditAttendance a WHERE a.auditSchedule.scheduleNo = :auditScheduleNo")
    List<AuditAttendance> findByAuditScheduleNo(@Param("auditScheduleNo") String auditScheduleNo);

    @Query("SELECT a FROM AuditAttendance a JOIN a.employee e WHERE a.auditSchedule.scheduleNo = :auditScheduleNo AND (UPPER(e.empCode) = UPPER(:employeeCode) OR UPPER(e.oldEmpCode) = UPPER(:employeeCode))")
    Optional<AuditAttendance> findByAuditScheduleNoAndEmployeeCode(
        @Param("auditScheduleNo") String auditScheduleNo,
        @Param("employeeCode") String employeeCode
    );

    Optional<AuditAttendance> findByAuditSchIdAndEmployeeId(Long auditSchId, Long employeeId);

    List<AuditAttendance> findByAuditSchId(Long auditSchId);

    @Query("SELECT DISTINCT a FROM AuditAttendance a " +
           "LEFT JOIN FETCH a.auditSchedule s " +
           "LEFT JOIN FETCH a.employee e " +
           "WHERE (:considerDate = 'No' OR (a.createdDate IS NOT NULL AND a.createdDate BETWEEN :fromDate AND :toDate)) " +
           "ORDER BY a.id DESC")
    List<AuditAttendance> findAllWithFetch(
            @Param("considerDate") String considerDate,
            @Param("fromDate") java.util.Date fromDate,
            @Param("toDate") java.util.Date toDate);

    @Query("SELECT DISTINCT a FROM AuditAttendance a " +
           "LEFT JOIN FETCH a.auditSchedule s " +
           "LEFT JOIN FETCH a.employee e " +
           "WHERE a.employeeId IN :empIds " +
           "AND (:considerDate = 'No' OR (a.createdDate IS NOT NULL AND a.createdDate BETWEEN :fromDate AND :toDate)) " +
           "ORDER BY a.id DESC")
    List<AuditAttendance> findByEmpIdsWithFetch(
            @Param("empIds") java.util.Collection<Long> empIds,
            @Param("considerDate") String considerDate,
            @Param("fromDate") java.util.Date fromDate,
            @Param("toDate") java.util.Date toDate);
}

