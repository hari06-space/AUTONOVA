package com.autonoma.erp.service.purchase.report;

import com.autonoma.erp.dto.purchase.report.BatchTraceabilityDTO;
import com.autonoma.erp.dto.purchase.report.PurchaseOrderScheduleDTO;
import com.autonoma.erp.repository.purchase.report.PurchaseReportRepository;
import com.autonoma.erp.repository.purchase.report.PurchaseOrderScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PurchaseReportService {

    private final PurchaseReportRepository purchaseReportRepository;
    private final PurchaseOrderScheduleRepository purchaseOrderScheduleRepository;

    public List<BatchTraceabilityDTO> getBatchTraceabilityReport() {
        log.info("Fetching batch traceability report data");
        return purchaseReportRepository.getBatchTraceabilityReport();
    }

    public List<PurchaseOrderScheduleDTO> getPurchaseOrderSchedule() {
        log.info("Fetching purchase order schedule data");
        return purchaseOrderScheduleRepository.getPurchaseOrderSchedule();
    }
}
