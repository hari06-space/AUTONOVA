package com.autonoma.erp.modules.hr.attendance.repository;

import com.autonoma.erp.modules.hr.attendance.entity.HrCanteenLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface HrCanteenLogRepository extends JpaRepository<HrCanteenLog, Long> {
    List<HrCanteenLog> findAllByOrderByLogDateDesc();
    Optional<HrCanteenLog> findByEmployeeIdAndLogDate(Long employeeId, LocalDateTime logDate);
    List<HrCanteenLog> findByLogDateBetween(LocalDateTime startDateTime, LocalDateTime endDateTime);
    List<HrCanteenLog> findByEmployeeIdAndLogDateBetween(Long employeeId, LocalDateTime startDateTime, LocalDateTime endDateTime);
}
