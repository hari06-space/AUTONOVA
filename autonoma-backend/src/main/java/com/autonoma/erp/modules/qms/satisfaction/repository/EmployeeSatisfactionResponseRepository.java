package com.autonoma.erp.modules.qms.satisfaction.repository;

import com.autonoma.erp.modules.qms.satisfaction.entity.EmployeeSatisfactionResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository("qmsEmployeeSatisfactionResponseRepository")
public interface EmployeeSatisfactionResponseRepository extends JpaRepository<EmployeeSatisfactionResponse, Long> {
    List<EmployeeSatisfactionResponse> findByEmployeeIdAndFeedbackCycle(Long employeeId, String feedbackCycle);
}
