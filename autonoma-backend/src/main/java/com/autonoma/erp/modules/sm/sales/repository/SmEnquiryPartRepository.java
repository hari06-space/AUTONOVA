package com.autonoma.erp.modules.sm.sales.repository;

import com.autonoma.erp.modules.sm.sales.entity.SmEnquiryPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmEnquiryPartRepository extends JpaRepository<SmEnquiryPart, Long> {
    List<SmEnquiryPart> findByEnquiryId(Long enquiryId);
}
