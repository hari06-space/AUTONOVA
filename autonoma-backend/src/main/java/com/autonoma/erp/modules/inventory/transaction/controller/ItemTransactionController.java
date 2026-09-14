package com.autonoma.erp.modules.inventory.transaction.controller;

import com.autonoma.erp.modules.inventory.transaction.dto.CurrentStockReportDto;
import com.autonoma.erp.modules.inventory.transaction.dto.ItemTransactionDto;
import com.autonoma.erp.modules.inventory.transaction.dto.StockLedgerReportDto;
import com.autonoma.erp.modules.inventory.transaction.service.ItemTransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/inventory/transaction")
public class ItemTransactionController {

    @Autowired
    private ItemTransactionService service;

    @PostMapping
    public ResponseEntity<ItemTransactionDto> createTransaction(@RequestBody ItemTransactionDto dto) {
        return ResponseEntity.ok(service.createTransaction(dto));
    }

    @PostMapping("/{id}/post")
    public ResponseEntity<ItemTransactionDto> postTransaction(@PathVariable Long id) {
        return ResponseEntity.ok(service.postTransaction(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ItemTransactionDto> cancelTransaction(@PathVariable Long id) {
        return ResponseEntity.ok(service.cancelTransaction(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemTransactionDto> getTransactionById(@PathVariable Long id) {
        ItemTransactionDto dto = service.getTransactionById(id);
        if (dto != null) {
            return ResponseEntity.ok(dto);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping
    public ResponseEntity<Page<ItemTransactionDto>> getAllTransactions(
            @RequestParam Long divisionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(service.getAllTransactions(divisionId, pageable));
    }

    @GetMapping("/reports/current-stock")
    public ResponseEntity<Page<CurrentStockReportDto>> getCurrentStockReport(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String inventoryType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(service.getCurrentStockReport(productId, inventoryType, pageable));
    }

    @GetMapping("/reports/stock-ledger")
    public ResponseEntity<List<StockLedgerReportDto>> getStockLedgerReport(
            @RequestParam Long divisionId,
            @RequestParam Long productId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(service.getStockLedgerReport(divisionId, productId, startDate, endDate));
    }

    @GetMapping("/reports/rejection-stock")
    public ResponseEntity<Page<ItemTransactionDto>> getRejectionStockReport(
            @RequestParam Long divisionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(service.getRejectionStockReport(divisionId, pageable));
    }

    @GetMapping("/reports/stock-movement")
    public ResponseEntity<Page<ItemTransactionDto>> getStockMovementReport(
            @RequestParam Long divisionId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(service.getStockMovementReport(divisionId, startDate, endDate, pageable));
    }
}
