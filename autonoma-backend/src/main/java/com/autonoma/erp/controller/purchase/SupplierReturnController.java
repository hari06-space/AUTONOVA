package com.autonoma.erp.controller.purchase;

import com.autonoma.erp.dto.purchase.purchasereturn.PurchaseReturnHeadDTO;
import com.autonoma.erp.service.purchase.purchasereturn.SupplierReturnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchase/supplier-return")
public class SupplierReturnController {

    @Autowired
    private SupplierReturnService supplierReturnService;

    @GetMapping
    public ResponseEntity<?> getAllReturns(
            @RequestParam Long divisionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(supplierReturnService.getAllReturns(divisionId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReturnById(@PathVariable Long id) {
        return ResponseEntity.ok(supplierReturnService.getReturnById(id));
    }

    @GetMapping("/generate")
    public ResponseEntity<?> generateFromQi(
            @RequestParam Long divisionId, 
            @RequestParam String qiNo,
            @RequestParam String returnType) {
        return ResponseEntity.ok(supplierReturnService.generateFromQi(divisionId, qiNo, returnType));
    }

    @PostMapping
    public ResponseEntity<?> saveReturn(@RequestBody PurchaseReturnHeadDTO dto, Authentication auth) {
        return ResponseEntity.ok(supplierReturnService.saveReturn(dto, auth.getName()));
    }

    @PostMapping("/{id}/post")
    public ResponseEntity<?> postReturn(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(supplierReturnService.postReturn(id, auth.getName()));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelReturn(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(supplierReturnService.cancelReturn(id, auth.getName()));
    }
}
