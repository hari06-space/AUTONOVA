package com.autonoma.erp.repository;

import com.autonoma.erp.model.InternalCustomerSatisfactionResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InternalCustomerSatisfactionResponseRepository extends JpaRepository<InternalCustomerSatisfactionResponse, Long> {

    List<InternalCustomerSatisfactionResponse> findByMappingId(Long mappingId);

    List<InternalCustomerSatisfactionResponse> findByMappingEmployeeIdAndMappingFeedbackCycle(Long employeeId, String feedbackCycle);
}
