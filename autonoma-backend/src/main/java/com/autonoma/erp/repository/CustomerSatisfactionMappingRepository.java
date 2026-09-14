package com.autonoma.erp.repository;

import com.autonoma.erp.model.CustomerSatisfactionMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerSatisfactionMappingRepository extends JpaRepository<CustomerSatisfactionMapping, Long> {
    List<CustomerSatisfactionMapping> findByCustomerIdAndStatusIn(Long customerId, List<String> statuses);
    Optional<CustomerSatisfactionMapping> findByCustomerIdAndFeedbackCycle(Long customerId, String feedbackCycle);
    List<CustomerSatisfactionMapping> findByFeedbackCycle(String feedbackCycle);
}
