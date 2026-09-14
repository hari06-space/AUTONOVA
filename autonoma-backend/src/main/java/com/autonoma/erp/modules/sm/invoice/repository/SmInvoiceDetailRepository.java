package com.autonoma.erp.modules.sm.invoice.repository;

import com.autonoma.erp.modules.sm.invoice.entity.SmInvoiceDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmInvoiceDetailRepository extends JpaRepository<SmInvoiceDetail, Long> {

    @Query("SELECT COALESCE(SUM(d.qty), 0) FROM SmInvoiceDetail d " +
           "WHERE d.salesOrderLineId = :orderLineId " +
           "AND (:excludeInvoiceId IS NULL OR d.invoiceHeader.id <> :excludeInvoiceId)")
    Integer getAlreadyInvoicedQuantity(
            @Param("orderLineId") Long orderLineId,
            @Param("excludeInvoiceId") Long excludeInvoiceId);

    List<SmInvoiceDetail> findByInvoiceHeaderId(Long invoiceHeaderId);
}
