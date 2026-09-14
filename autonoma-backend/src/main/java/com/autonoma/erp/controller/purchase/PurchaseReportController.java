package com.autonoma.erp.controller.purchase;

import com.autonoma.erp.dto.purchase.report.BatchTraceabilityDTO;
import com.autonoma.erp.dto.purchase.report.PurchaseOrderScheduleDTO;
import com.autonoma.erp.service.purchase.report.PurchaseReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports/purchase")
@RequiredArgsConstructor
public class PurchaseReportController {

    private final PurchaseReportService purchaseReportService;

    @GetMapping("/batch-traceability")
    public ResponseEntity<List<BatchTraceabilityDTO>> getBatchTraceabilityReport() {
        return ResponseEntity.ok(purchaseReportService.getBatchTraceabilityReport());
    }

    @GetMapping("/po-schedule")
    public ResponseEntity<List<PurchaseOrderScheduleDTO>> getPurchaseOrderSchedule() {
        return ResponseEntity.ok(purchaseReportService.getPurchaseOrderSchedule());
    }
}
