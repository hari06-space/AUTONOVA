package com.autonoma.erp.repository;

import com.autonoma.erp.model.VendorSatisfactionResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("hraVendorSatisfactionResponseRepository")
public interface VendorSatisfactionResponseRepository extends JpaRepository<VendorSatisfactionResponse, Long> {
    List<VendorSatisfactionResponse> findByMappingId(Long mappingId);
}
