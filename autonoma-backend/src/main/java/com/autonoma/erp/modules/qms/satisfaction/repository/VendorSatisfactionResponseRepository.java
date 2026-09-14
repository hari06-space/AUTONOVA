package com.autonoma.erp.modules.qms.satisfaction.repository;

import com.autonoma.erp.modules.qms.satisfaction.entity.VendorSatisfactionResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository("qmsVendorSatisfactionResponseRepository")
public interface VendorSatisfactionResponseRepository extends JpaRepository<VendorSatisfactionResponse, Long> {
    List<VendorSatisfactionResponse> findByVendorIdAndFeedbackCycle(Long vendorId, String feedbackCycle);
}
