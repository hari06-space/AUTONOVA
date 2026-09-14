package com.autonoma.erp.repository;

import com.autonoma.erp.model.InternalCustomerSatisfactionMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InternalCustomerSatisfactionMappingRepository extends JpaRepository<InternalCustomerSatisfactionMapping, Long> {

    Optional<InternalCustomerSatisfactionMapping> findByEmployeeIdAndFeedbackCycle(Long employeeId, String feedbackCycle);

    List<InternalCustomerSatisfactionMapping> findByFeedbackCycle(String feedbackCycle);

    List<InternalCustomerSatisfactionMapping> findByStatus(String status);

    List<InternalCustomerSatisfactionMapping> findByEmployeeIdAndStatusIn(Long employeeId, List<String> statuses);

    List<InternalCustomerSatisfactionMapping> findByEmployeeId(Long employeeId);
}
