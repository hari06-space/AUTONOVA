package com.autonoma.erp.controller.purchase;

import com.autonoma.erp.dto.purchase.po.*;
import com.autonoma.erp.service.purchase.po.PurchaseOrderService;
import com.autonoma.erp.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/purchase-order")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @GetMapping("/division/{divisionId}")
    public ResponseEntity<List<PurchaseOrderListDTO>> getAllPos(@PathVariable Long divisionId) {
        return ResponseEntity.ok(purchaseOrderService.getAllPos(divisionId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrderHeadDTO> getPoById(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.getPoById(id));
    }

    @PostMapping("/preview")
    public ResponseEntity<PurchaseOrderHeadDTO> previewFromSource(@RequestBody PurchaseOrderSourceRequestDTO request) {
        return ResponseEntity.ok(purchaseOrderService.previewFromSource(request));
    }

    @PostMapping
    public ResponseEntity<PurchaseOrderHeadDTO> createPo(@RequestBody PurchaseOrderHeadDTO dto) {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(purchaseOrderService.createPo(dto, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PurchaseOrderHeadDTO> updatePo(@PathVariable Long id, @RequestBody PurchaseOrderHeadDTO dto) {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(purchaseOrderService.updatePo(id, dto, userId));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Map<String, String>> submitPo(@PathVariable Long id) {
        String userId = SecurityUtils.getCurrentUserId();
        purchaseOrderService.submitPo(id, userId);
        return ResponseEntity.ok(Map.of("message", "Purchase Order submitted successfully", "status", "SUBMITTED"));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<Map<String, String>> verifyPo(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String userId = SecurityUtils.getCurrentUserId();
        String remarks = body != null ? body.getOrDefault("remarks", "") : "";
        purchaseOrderService.verifyPo(id, userId, remarks);
        return ResponseEntity.ok(Map.of("message", "Purchase Order verified successfully", "status", "VERIFIED"));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, String>> rejectPo(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String userId = SecurityUtils.getCurrentUserId();
        String remarks = body != null ? body.getOrDefault("remarks", "") : "";
        purchaseOrderService.rejectPo(id, userId, remarks);
        return ResponseEntity.ok(Map.of("message", "Purchase Order rejected successfully", "status", "REJECTED"));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Map<String, String>> cancelPo(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String userId = SecurityUtils.getCurrentUserId();
        String reason = body != null ? body.getOrDefault("reason", "") : "";
        purchaseOrderService.cancelPo(id, userId, reason);
        return ResponseEntity.ok(Map.of("message", "Purchase Order cancelled successfully", "status", "CANCELLED"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletePo(@PathVariable Long id) {
        String userId = SecurityUtils.getCurrentUserId();
        purchaseOrderService.deletePo(id, userId);
        return ResponseEntity.ok(Map.of("message", "Purchase Order deleted successfully"));
    }

    @GetMapping("/pending-items/supplier/{supplierId}")
    public ResponseEntity<List<PurchaseOrderTransDTO>> getPendingItemsBySupplier(@PathVariable Long supplierId) {
        return ResponseEntity.ok(purchaseOrderService.getPendingItemsBySupplier(supplierId));
    }
}
