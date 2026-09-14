package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.SatisfactionReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SatisfactionReminderRepository extends JpaRepository<SatisfactionReminder, Long> {
    List<SatisfactionReminder> findBySatisfactionType(String satisfactionType);
}
