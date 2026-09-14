package com.autonoma.erp.modules.hr.attendance.repository;

import com.autonoma.erp.modules.hr.attendance.entity.HrAttendanceDailyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HrAttendanceDailyLogRepository extends JpaRepository<HrAttendanceDailyLog, Long> {

    List<HrAttendanceDailyLog> findByAttendanceDate(LocalDate date);

    Optional<HrAttendanceDailyLog> findByEmpIdAndAttendanceDate(Long empId, LocalDate date);

    List<HrAttendanceDailyLog> findByAttendanceDateBetween(LocalDate startDate, LocalDate endDate);

    boolean existsByEmpIdAndAttendanceDate(Long empId, LocalDate date);

    List<HrAttendanceDailyLog> findByEmpIdAndAttendanceDateBetween(Long empId, LocalDate startDate, LocalDate endDate);
}
