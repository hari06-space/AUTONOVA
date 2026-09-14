package com.autonoma.erp.modules.hr.attendance.repository;

import com.autonoma.erp.modules.hr.attendance.entity.HrBiometricAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HrBiometricAttendanceRepository extends JpaRepository<HrBiometricAttendance, Long> {
    @Query("SELECT ba FROM HrBiometricAttendance ba LEFT JOIN FETCH ba.employee LEFT JOIN FETCH ba.shift ORDER BY ba.attendanceDate DESC")
    List<HrBiometricAttendance> findAllByOrderByAttendanceDateDesc();

    Optional<HrBiometricAttendance> findByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);

    @Query("SELECT ba FROM HrBiometricAttendance ba LEFT JOIN FETCH ba.employee LEFT JOIN FETCH ba.shift WHERE ba.attendanceDate BETWEEN :startDate AND :endDate")
    List<HrBiometricAttendance> findByAttendanceDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    Optional<HrBiometricAttendance> findFirstByOrderByAttendanceDateDesc();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM HrBiometricAttendance ba WHERE ba.employeeId NOT IN (SELECT e.id FROM EmployeeMaster e WHERE UPPER(TRIM(e.status.name)) = 'ACTIVE' AND e.empCode IS NOT NULL)")
    void deleteInvalidAttendanceRecords();
}
