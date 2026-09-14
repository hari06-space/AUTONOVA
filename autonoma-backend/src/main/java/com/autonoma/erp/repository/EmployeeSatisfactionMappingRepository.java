package com.autonoma.erp.repository;

import com.autonoma.erp.model.EmployeeSatisfactionMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeSatisfactionMappingRepository extends JpaRepository<EmployeeSatisfactionMapping, Long> {

    Optional<EmployeeSatisfactionMapping> findByEmployeeIdAndFeedbackCycle(Long employeeId, String feedbackCycle);

    List<EmployeeSatisfactionMapping> findByFeedbackCycle(String feedbackCycle);

    List<EmployeeSatisfactionMapping> findByStatus(String status);

    List<EmployeeSatisfactionMapping> findByEmployeeIdAndStatusIn(Long employeeId, List<String> statuses);

    List<EmployeeSatisfactionMapping> findByEmployeeId(Long employeeId);
}
