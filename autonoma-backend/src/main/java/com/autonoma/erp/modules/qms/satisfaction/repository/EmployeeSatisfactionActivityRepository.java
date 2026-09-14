package com.autonoma.erp.modules.qms.satisfaction.repository;

import com.autonoma.erp.modules.qms.satisfaction.entity.EmployeeSatisfactionActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmployeeSatisfactionActivityRepository extends JpaRepository<EmployeeSatisfactionActivity, Long> {
    List<EmployeeSatisfactionActivity> findByEmployeeIdAndFeedbackCycleOrderByActivityDateAsc(Long employeeId, String feedbackCycle);
}
