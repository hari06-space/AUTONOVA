package com.autonoma.erp.repository;

import com.autonoma.erp.model.EmployeeSatisfactionReminderLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmployeeSatisfactionReminderLogRepository extends JpaRepository<EmployeeSatisfactionReminderLog, Long> {

    List<EmployeeSatisfactionReminderLog> findByMappingId(Long mappingId);

    List<EmployeeSatisfactionReminderLog> findByEmployeeIdOrderByReminderDateDesc(Long employeeId);
}
