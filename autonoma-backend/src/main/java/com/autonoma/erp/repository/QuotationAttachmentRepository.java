package com.autonoma.erp.repository;

import com.autonoma.erp.model.QuotationAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationAttachmentRepository extends JpaRepository<QuotationAttachment, Long> {
    List<QuotationAttachment> findByQuotationHeadId(Long quotationHeadId);
    void deleteByQuotationHeadId(Long quotationHeadId);
}
