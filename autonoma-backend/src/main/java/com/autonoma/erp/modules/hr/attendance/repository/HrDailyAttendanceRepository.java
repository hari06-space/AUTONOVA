package com.autonoma.erp.modules.hr.attendance.repository;

import com.autonoma.erp.modules.hr.attendance.entity.HrDailyAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

@Repository
public interface HrDailyAttendanceRepository extends JpaRepository<HrDailyAttendance, Long> {

    Optional<HrDailyAttendance> findByEmpIdAndAttendanceDate(Long empId, LocalDate attendanceDate);
    List<HrDailyAttendance> findByAttendanceDateBetween(LocalDate startDate, LocalDate endDate);
}
