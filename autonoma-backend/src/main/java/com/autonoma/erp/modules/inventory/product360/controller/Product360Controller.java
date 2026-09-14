package com.autonoma.erp.modules.inventory.product360.controller;

import com.autonoma.erp.modules.inventory.product360.dto.Product360SummaryDto;
import com.autonoma.erp.modules.inventory.product360.dto.ProductSearchDto;
import com.autonoma.erp.modules.inventory.product360.service.Product360Service;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/product-360")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class Product360Controller {

    private final Product360Service product360Service;

    @GetMapping("/search")
    public ResponseEntity<List<ProductSearchDto>> searchProducts(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "50") int limit) {
        return ResponseEntity.ok(product360Service.searchProducts(query, limit));
    }

    @PostMapping(value = "/search-by-image", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<ProductSearchDto>> searchProductsByImage(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.ok(product360Service.searchProductsByImage(file));
    }

    @GetMapping("/divisions")
    public ResponseEntity<List<Map<String, Object>>> getDivisions() {
        return ResponseEntity.ok(product360Service.getDivisions());
    }

    @GetMapping("/summary")
    public ResponseEntity<Product360SummaryDto> getSummary(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long divisionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(product360Service.getProduct360Summary(productId, divisionId, startDate, endDate));
    }

    @GetMapping("/drilldown/routing-cards")
    public ResponseEntity<List<Map<String, Object>>> getRoutingCards(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long divisionId) {
        return ResponseEntity.ok(product360Service.getRoutingCardsDrilldown(productId, divisionId));
    }

    @GetMapping("/drilldown/process-wip")
    public ResponseEntity<List<Map<String, Object>>> getProcessWip(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long divisionId) {
        return ResponseEntity.ok(product360Service.getProcessWipDrilldown(productId, divisionId));
    }

    @GetMapping("/drilldown/material-shortage")
    public ResponseEntity<List<Map<String, Object>>> getMaterialShortage(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long divisionId) {
        return ResponseEntity.ok(product360Service.getMaterialShortageDrilldown(productId, divisionId));
    }

    @GetMapping("/drilldown/purchase-pipeline")
    public ResponseEntity<List<Map<String, Object>>> getPurchasePipeline(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long divisionId,
            @RequestParam(required = false, defaultValue = "ALL") String pipelineType) {
        return ResponseEntity.ok(product360Service.getPurchasePipelineDrilldown(productId, divisionId, pipelineType));
    }

    @GetMapping("/drilldown/quality-inspection")
    public ResponseEntity<List<Map<String, Object>>> getQualityInspection(
            @RequestParam(required = false) Long productId) {
        return ResponseEntity.ok(product360Service.getQualityInspectionDrilldown(productId));
    }

    @GetMapping("/drilldown/reservations")
    public ResponseEntity<List<Map<String, Object>>> getReservations(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long divisionId) {
        return ResponseEntity.ok(product360Service.getReservationsDrilldown(productId, divisionId));
    }

    @GetMapping("/drilldown/stock-details")
    public ResponseEntity<List<Map<String, Object>>> getStockDetails(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long divisionId) {
        return ResponseEntity.ok(product360Service.getStockDetailsDrilldown(productId, divisionId));
    }

    @GetMapping("/drilldown/batches")
    public ResponseEntity<List<Map<String, Object>>> getBatchDetailsDrilldown(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long divisionId) {
        return ResponseEntity.ok(product360Service.getBatchDetails(productId, divisionId));
    }

    @GetMapping("/batches")
    public ResponseEntity<List<Map<String, Object>>> getBatchDetails(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long divisionId) {
        return ResponseEntity.ok(product360Service.getBatchDetails(productId, divisionId));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<Map<String, Object>>> getItemTransactions(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long divisionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false, defaultValue = "ALL") String transCategory) {
        return ResponseEntity.ok(product360Service.getItemTransactions(productId, divisionId, fromDate, toDate, transCategory));
    }
}
