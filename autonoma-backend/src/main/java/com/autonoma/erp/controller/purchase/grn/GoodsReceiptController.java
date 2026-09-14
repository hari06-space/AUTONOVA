package com.autonoma.erp.controller.purchase.grn;

import com.autonoma.erp.dto.purchase.grn.GoodsReceiptHeadDTO;
import com.autonoma.erp.dto.purchase.grn.GoodsReceiptListDTO;
import com.autonoma.erp.service.purchase.grn.GoodsReceiptService;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/purchase/grn")
public class GoodsReceiptController {

    @Autowired
    private GoodsReceiptService grnService;

    @GetMapping("/search")
    public ResponseEntity<Page<GoodsReceiptListDTO>> search(
            @RequestParam Long divisionId,
            @RequestParam(required = false) String grnNo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String poNo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(grnService.search(divisionId, grnNo, startDate, endDate, supplierId, poNo, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GoodsReceiptHeadDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(grnService.getById(id));
    }

    @GetMapping("/preview/gate-entry/{gateEntryId}")
    public ResponseEntity<GoodsReceiptHeadDTO> previewFromGateEntry(
            @PathVariable Long gateEntryId,
            @RequestHeader(value = "userId", required = false) String headerUserId) {
        String userId = headerUserId != null ? headerUserId : SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(grnService.previewFromGateEntry(gateEntryId, userId));
    }

    @GetMapping("/preview/purchase-order/{poHeadId}")
    public ResponseEntity<GoodsReceiptHeadDTO> previewFromPurchaseOrder(
            @PathVariable Long poHeadId,
            @RequestHeader(value = "userId", required = false) String headerUserId) {
        String userId = headerUserId != null ? headerUserId : SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(grnService.previewFromPurchaseOrder(poHeadId, userId));
    }

    @PostMapping
    public ResponseEntity<GoodsReceiptHeadDTO> create(
            @RequestBody GoodsReceiptHeadDTO dto,
            @RequestHeader(value = "userId", required = false) String headerUserId) {
        String userId = headerUserId != null ? headerUserId : SecurityUtils.getCurrentUserId();
        dto.setId(null);
        return ResponseEntity.ok(grnService.save(dto, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoodsReceiptHeadDTO> update(
            @PathVariable Long id,
            @RequestBody GoodsReceiptHeadDTO dto,
            @RequestHeader(value = "userId", required = false) String headerUserId) {
        String userId = headerUserId != null ? headerUserId : SecurityUtils.getCurrentUserId();
        dto.setId(id);
        return ResponseEntity.ok(grnService.save(dto, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader(value = "userId", required = false) String headerUserId) {
        String userId = headerUserId != null ? headerUserId : SecurityUtils.getCurrentUserId();
        grnService.delete(id, userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/post")
    public ResponseEntity<GoodsReceiptHeadDTO> postGrn(
            @PathVariable Long id,
            @RequestHeader(value = "userId", required = false) String headerUserId) {
        String userId = headerUserId != null ? headerUserId : SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(grnService.postGrn(id, userId));
    }

    @PostMapping("/generate/gate-entry/{gateEntryId}")
    public ResponseEntity<GoodsReceiptHeadDTO> generateFromGateEntry(
            @PathVariable Long gateEntryId,
            @RequestHeader(value = "userId", required = false) String headerUserId) {
        String userId = headerUserId != null ? headerUserId : SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(grnService.generateFromGateEntry(gateEntryId, userId));
    }
}
