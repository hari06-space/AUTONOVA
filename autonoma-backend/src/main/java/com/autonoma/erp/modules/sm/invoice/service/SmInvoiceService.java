package com.autonoma.erp.modules.sm.invoice.service;

import com.autonoma.erp.modules.sm.invoice.dto.SmInvoiceHeaderDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;

public interface SmInvoiceService {
    SmInvoiceHeaderDto createInvoice(SmInvoiceHeaderDto dto);
    SmInvoiceHeaderDto updateInvoice(Long id, SmInvoiceHeaderDto dto);
    SmInvoiceHeaderDto getInvoiceById(Long id);
    Page<SmInvoiceHeaderDto> getAllInvoices(Pageable pageable);
    Page<SmInvoiceHeaderDto> getAllInvoices(String docType, Pageable pageable);
    void deleteInvoice(Long id);
    Integer getAlreadyInvoicedQuantity(Long orderLineId, Long excludeInvoiceId);
    String generateInvoiceNo();
    String generateDocNo(String docType);
    SmInvoiceHeaderDto prepareInvoiceFromDcs(java.util.List<Long> dcIds);
}
