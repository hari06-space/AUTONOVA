package com.autonoma.erp.controller;

import com.autonoma.erp.dto.purchase.PurchaseRequestHeadDTO;
import com.autonoma.erp.dto.purchase.PurchaseRequestListDTO;
import com.autonoma.erp.dto.purchase.PurchaseRequestLifecycleDTO;
import com.autonoma.erp.service.PurchaseRequestService;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchase/pr")
public class PurchaseRequestController {

    @Autowired
    private PurchaseRequestService purchaseRequestService;

    @PostMapping
    public ResponseEntity<PurchaseRequestHeadDTO> create(@RequestBody PurchaseRequestHeadDTO dto) {
        String userId = SecurityUtils.getCurrentUserId();
        Long divisionId = SecurityUtils.getCurrentDivisionId();
        return ResponseEntity.ok(purchaseRequestService.createPurchaseRequest(dto, userId, divisionId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PurchaseRequestHeadDTO> update(@PathVariable Long id, @RequestBody PurchaseRequestHeadDTO dto) {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(purchaseRequestService.updatePurchaseRequest(id, dto, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseRequestHeadDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseRequestService.getPurchaseRequestById(id));
    }

    @GetMapping("/{id}/lifecycle")
    public ResponseEntity<PurchaseRequestLifecycleDTO> getLifecycle(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseRequestService.getPurchaseRequestLifecycle(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        purchaseRequestService.deletePurchaseRequest(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<PurchaseRequestListDTO>> search(
            @RequestParam(required = false) String prNo,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long plannerId,
            @RequestParam(required = false) Long statusId,
            @RequestParam(required = false, defaultValue = "false") boolean pendingPo) {
        Long divisionId = SecurityUtils.getCurrentDivisionId();
        return ResponseEntity.ok(purchaseRequestService.searchPurchaseRequests(prNo, departmentId, plannerId, statusId, divisionId, pendingPo));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Map<String, String>> submitForApproval(@PathVariable Long id) {
        String userId = SecurityUtils.getCurrentUserId();
        purchaseRequestService.submitForApproval(id, userId);
        return ResponseEntity.ok(Map.of("message", "Submitted for approval successfully"));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<Map<String, String>> verify(@PathVariable Long id) {
        String userId = SecurityUtils.getCurrentUserId();
        purchaseRequestService.approvePurchaseRequest(id, userId);
        return ResponseEntity.ok(Map.of("message", "Verified successfully"));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, String>> approve(@PathVariable Long id) {
        String userId = SecurityUtils.getCurrentUserId();
        purchaseRequestService.approvePurchaseRequest(id, userId);
        return ResponseEntity.ok(Map.of("message", "Verified successfully"));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, String>> reject(@PathVariable Long id) {
        String userId = SecurityUtils.getCurrentUserId();
        purchaseRequestService.rejectPurchaseRequest(id, userId);
        return ResponseEntity.ok(Map.of("message", "Rejected successfully"));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Map<String, String>> cancel(@PathVariable Long id) {
        String userId = SecurityUtils.getCurrentUserId();
        purchaseRequestService.cancelPurchaseRequest(id, userId);
        return ResponseEntity.ok(Map.of("message", "Cancelled successfully"));
    }

    @PostMapping("/trans/{transId}/verify")
    public ResponseEntity<Map<String, String>> verifyTransaction(@PathVariable Long transId) {
        String userId = SecurityUtils.getCurrentUserId();
        purchaseRequestService.approveTransactionItem(transId, userId);
        return ResponseEntity.ok(Map.of("message", "Item verified successfully"));
    }

    @PostMapping("/trans/{transId}/approve")
    public ResponseEntity<Map<String, String>> approveTransaction(@PathVariable Long transId) {
        String userId = SecurityUtils.getCurrentUserId();
        purchaseRequestService.approveTransactionItem(transId, userId);
        return ResponseEntity.ok(Map.of("message", "Item verified successfully"));
    }

    @PostMapping("/trans/{transId}/reject")
    public ResponseEntity<Map<String, String>> rejectTransaction(@PathVariable Long transId) {
        String userId = SecurityUtils.getCurrentUserId();
        purchaseRequestService.rejectTransactionItem(transId, userId);
        return ResponseEntity.ok(Map.of("message", "Item rejected successfully"));
    }
}
