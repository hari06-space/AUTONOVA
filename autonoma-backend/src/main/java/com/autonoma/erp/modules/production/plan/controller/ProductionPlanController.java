/*
Organization: Autonoma ERP
Owner: Developer
Created At: 2026-09-05
Description: REST Controller for Production Plan Module
*/
package com.autonoma.erp.modules.production.plan.controller;

import com.autonoma.erp.modules.production.plan.dto.*;
import com.autonoma.erp.modules.production.plan.service.ProductionPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/production-plans")
@RequiredArgsConstructor
public class ProductionPlanController {

    private final ProductionPlanService productionPlanService;

    @GetMapping
    public ResponseEntity<List<ProductionPlanHeadDto>> getAllPlans() {
        return ResponseEntity.ok(productionPlanService.getAllPlans());
    }

    @GetMapping("/{planNo}")
    public ResponseEntity<ProductionPlanHeadDto> getPlanByNo(@PathVariable Long planNo) {
        return ResponseEntity.ok(productionPlanService.getPlanByNo(planNo));
    }

    @GetMapping("/sources")
    public ResponseEntity<List<Map<String, Object>>> getAvailableSources(
            @RequestParam(required = false, defaultValue = "SALES_ORDER") String sourceType) {
        return ResponseEntity.ok(productionPlanService.getAvailableSources(sourceType));
    }

    @GetMapping("/source-items")
    public ResponseEntity<List<SourceItemDto>> getSourceItems(
            @RequestParam(required = false, defaultValue = "SALES_ORDER") String sourceType,
            @RequestParam Long sourceId) {
        return ResponseEntity.ok(productionPlanService.getSourceItems(sourceType, sourceId));
    }

    @PostMapping("/calculate-preview")
    public ResponseEntity<ProductionPlanHeadDto> calculatePreview(@RequestBody ProductionPlanPreviewRequestDto request) {
        return ResponseEntity.ok(productionPlanService.calculatePreview(request));
    }

    @PostMapping
    public ResponseEntity<ProductionPlanHeadDto> createPlan(@RequestBody ProductionPlanPreviewRequestDto request) {
        return ResponseEntity.ok(productionPlanService.createPlan(request));
    }

    @PostMapping("/{planNo}/release")
    public ResponseEntity<ProductionPlanHeadDto> releasePlan(@PathVariable Long planNo) {
        return ResponseEntity.ok(productionPlanService.releasePlan(planNo));
    }

    @PostMapping("/{planNo}/cancel")
    public ResponseEntity<ProductionPlanHeadDto> cancelPlan(@PathVariable Long planNo) {
        return ResponseEntity.ok(productionPlanService.cancelPlan(planNo));
    }

    @PostMapping("/{planNo}/generate-purchase-requests")
    public ResponseEntity<Map<String, Object>> generatePurchaseRequests(
            @PathVariable Long planNo,
            @RequestBody(required = false) List<Long> productIds) {
        return ResponseEntity.ok(productionPlanService.generatePurchaseRequests(planNo, productIds));
    }
}
