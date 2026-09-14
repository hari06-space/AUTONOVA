package com.autonoma.erp.repository;

import com.autonoma.erp.model.EmployeeSatisfactionResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository("hraEmployeeSatisfactionResponseRepository")
public interface EmployeeSatisfactionResponseRepository extends JpaRepository<EmployeeSatisfactionResponse, Long> {

    List<EmployeeSatisfactionResponse> findByMappingId(Long mappingId);

    List<EmployeeSatisfactionResponse> findByEmployeeIdAndMappingFeedbackCycle(Long employeeId, String feedbackCycle);
}
