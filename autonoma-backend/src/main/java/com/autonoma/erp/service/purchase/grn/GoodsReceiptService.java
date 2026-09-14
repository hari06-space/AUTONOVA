package com.autonoma.erp.service.purchase.grn;

import com.autonoma.erp.dto.purchase.grn.GoodsReceiptHeadDTO;
import com.autonoma.erp.dto.purchase.grn.GoodsReceiptListDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface GoodsReceiptService {
    Page<GoodsReceiptListDTO> search(Long divisionId, String grnNo, LocalDate startDate, LocalDate endDate, Long supplierId, String poNo, Pageable pageable);
    GoodsReceiptHeadDTO getById(Long id);
    GoodsReceiptHeadDTO previewFromGateEntry(Long gateEntryId, String userId);
    GoodsReceiptHeadDTO previewFromPurchaseOrder(Long poHeadId, String userId);
    GoodsReceiptHeadDTO save(GoodsReceiptHeadDTO dto, String userId);
    GoodsReceiptHeadDTO postGrn(Long id, String userId);
    GoodsReceiptHeadDTO cancelGrn(Long id, String userId);
    GoodsReceiptHeadDTO generateFromGateEntry(Long gateEntryId, String userId);
    void delete(Long id, String userId);
}
