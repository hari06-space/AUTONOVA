package com.autonoma.erp.modules.finance.controller;

import com.autonoma.erp.modules.finance.dto.FinancePostingDTO;
import com.autonoma.erp.modules.finance.dto.OutstandingBalanceDTO;
import com.autonoma.erp.modules.finance.entity.FinanceOutstanding;
import com.autonoma.erp.modules.finance.entity.FinanceTransaction;
import com.autonoma.erp.modules.finance.repository.FinanceOutstandingRepository;
import com.autonoma.erp.modules.finance.repository.FinanceTransactionRepository;
import com.autonoma.erp.modules.finance.service.FinancePostingService;
import com.autonoma.erp.modules.finance.service.FinanceReportService;
import com.autonoma.erp.modules.finance.dto.FinanceOutstandingReportDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
public class FinanceController {

    private final FinancePostingService postingService;
    private final FinanceTransactionRepository transactionRepository;
    private final FinanceOutstandingRepository outstandingRepository;
    private final FinanceReportService reportService;

    @PostMapping("/payment/{billOutstandingId}")
    public ResponseEntity<Void> postPayment(
            @PathVariable Long billOutstandingId,
            @RequestBody FinancePostingDTO dto) {
        // Typically user ID is injected via security context, but we trust the DTO for now
        postingService.postPayment(dto, billOutstandingId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/payment/on-account")
    public ResponseEntity<Void> postOnAccountPayment(@RequestBody FinancePostingDTO dto) {
        postingService.postOnAccountPayment(dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/outstanding/{billOutstandingId}/balance")
    public ResponseEntity<OutstandingBalanceDTO> getBalance(@PathVariable Long billOutstandingId) {
        return ResponseEntity.ok(postingService.calculateOutstanding(billOutstandingId));
    }

    // Server-side paginated report for Transactions
    @GetMapping("/transaction/report")
    public ResponseEntity<Page<FinanceTransaction>> getTransactionReport(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fromDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date toDate,
            @RequestParam(required = false) String transType,
            @RequestParam(required = false) Long partyId,
            @RequestParam(required = false) String vrNo,
            @RequestParam(required = false) String partyBillNo,
            Pageable pageable) {
        return ResponseEntity.ok(reportService.getTransactionReport(fromDate, toDate, transType, partyId, vrNo, partyBillNo, pageable));
    }
    
    @GetMapping("/transaction/report/summary")
    public ResponseEntity<Map<String, Object>> getTransactionSummary(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fromDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date toDate,
            @RequestParam(required = false) String transType,
            @RequestParam(required = false) Long partyId,
            @RequestParam(required = false) String vrNo,
            @RequestParam(required = false) String partyBillNo) {
        return ResponseEntity.ok(reportService.getTransactionSummary(fromDate, toDate, transType, partyId, vrNo, partyBillNo));
    }

    // Server-side paginated report for Outstandings
    @GetMapping("/outstanding/report")
    public ResponseEntity<Page<FinanceOutstandingReportDTO>> getOutstandingReport(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date asOnDate,
            @RequestParam(required = false) Long partyId,
            @RequestParam(required = false) String billNo,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date dueDate,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return ResponseEntity.ok(reportService.getOutstandingReport(asOnDate, partyId, billNo, dueDate, status, pageable));
    }
    
    @GetMapping("/outstanding/report/summary")
    public ResponseEntity<Map<String, Object>> getOutstandingSummary(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date asOnDate,
            @RequestParam(required = false) Long partyId,
            @RequestParam(required = false) String billNo,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date dueDate,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(reportService.getOutstandingSummary(asOnDate, partyId, billNo, dueDate, status));
    }
    
    @GetMapping("/outstanding/report/aging")
    public ResponseEntity<Map<String, Object>> getAgingSummary(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date asOnDate,
            @RequestParam(required = false) Long partyId,
            @RequestParam(required = false) String billNo,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date dueDate,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(reportService.getAgingSummary(asOnDate, partyId, billNo, dueDate, status));
    }
    
    // Settlement History for a Bill
    @GetMapping("/outstanding/{billOutstandingId}/history")
    public ResponseEntity<List<FinanceTransaction>> getSettlementHistory(@PathVariable Long billOutstandingId) {
        return ResponseEntity.ok(transactionRepository.findByBillOutstandingId(billOutstandingId));
    }
}
