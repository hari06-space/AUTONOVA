package com.autonoma.erp.repository;

import com.autonoma.erp.model.VendorSatisfactionMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorSatisfactionMappingRepository extends JpaRepository<VendorSatisfactionMapping, Long> {
    List<VendorSatisfactionMapping> findByVendorIdAndStatusIn(Long vendorId, List<String> statuses);
    List<VendorSatisfactionMapping> findByStatus(String status);
}
