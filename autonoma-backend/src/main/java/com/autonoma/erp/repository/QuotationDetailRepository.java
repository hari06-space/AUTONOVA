package com.autonoma.erp.repository;

import com.autonoma.erp.model.QuotationDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationDetailRepository extends JpaRepository<QuotationDetail, Long> {
    List<QuotationDetail> findByQuotationHeadId(Long quotationHeadId);
    void deleteByQuotationHeadId(Long quotationHeadId);
}
