package com.autonoma.erp.controller.ai;

import com.autonoma.erp.service.ai.AiAccessValidationService;
import com.autonoma.erp.service.ai.ExcelReportService;
import com.autonoma.erp.service.ai.PdfReportService;
import com.autonoma.erp.service.ai.WordReportService;

import com.autonoma.erp.service.ai.*;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * Autonoma AI Report Generation Controller.
 *
 * Endpoints:
 *   POST /api/ai/report/excel  – Download Excel (.xlsx)
 *   POST /api/ai/report/pdf   – Download PDF (.pdf)
 *   POST /api/ai/report/word  – Download Word (.docx)
 *
 * Request body:
 * {
 *   "title": "Sales Report",
 *   "headers": ["Customer", "Amount", "Date"],
 *   "rows": [[...], [...]],
 *   "module": "SALES"
 * }
 */
@RestController
@RequestMapping("/api/ai/report")
public class AiReportController {

    @Autowired private ExcelReportService excelService;
    @Autowired private PdfReportService   pdfService;
    @Autowired private WordReportService  wordService;
    @Autowired private AiAccessValidationService accessService;

    @PostMapping("/excel")
    public ResponseEntity<byte[]> downloadExcel(@RequestBody Map<String, Object> request)
            throws Exception {

        String userId = SecurityUtils.getCurrentUserId();
        String module = (String) request.getOrDefault("module", "GENERAL");

        AiAccessValidationService.AccessResult access = accessService.validateAccess(userId, module);
        if (!access.allowed()) {
            return ResponseEntity.status(403).build();
        }

        String title = (String) request.getOrDefault("title", "AURA Report");
        @SuppressWarnings("unchecked") List<String> headers = (List<String>) request.get("headers");
        @SuppressWarnings("unchecked") List<List<Object>> rows = (List<List<Object>>) request.get("rows");

        byte[] content = excelService.generateReport(title, headers != null ? headers : List.of(),
            rows != null ? rows : List.of());

        String filename = sanitizeFilename(title) + "_" + timestamp() + ".xlsx";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(content);
    }

    @PostMapping("/pdf")
    public ResponseEntity<byte[]> downloadPdf(@RequestBody Map<String, Object> request)
            throws Exception {

        String userId = SecurityUtils.getCurrentUserId();
        String module = (String) request.getOrDefault("module", "GENERAL");

        AiAccessValidationService.AccessResult access = accessService.validateAccess(userId, module);
        if (!access.allowed()) {
            return ResponseEntity.status(403).build();
        }

        String title = (String) request.getOrDefault("title", "AURA Report");
        @SuppressWarnings("unchecked") List<String> headers = (List<String>) request.get("headers");
        @SuppressWarnings("unchecked") List<List<Object>> rows = (List<List<Object>>) request.get("rows");

        byte[] content = pdfService.generateReport(title, headers != null ? headers : List.of(),
            rows != null ? rows : List.of());

        String filename = sanitizeFilename(title) + "_" + timestamp() + ".pdf";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.APPLICATION_PDF)
            .body(content);
    }

    @PostMapping("/word")
    public ResponseEntity<byte[]> downloadWord(@RequestBody Map<String, Object> request)
            throws Exception {

        String userId = SecurityUtils.getCurrentUserId();
        String module = (String) request.getOrDefault("module", "GENERAL");

        AiAccessValidationService.AccessResult access = accessService.validateAccess(userId, module);
        if (!access.allowed()) {
            return ResponseEntity.status(403).build();
        }

        String title = (String) request.getOrDefault("title", "AURA Report");
        @SuppressWarnings("unchecked") List<String> headers = (List<String>) request.get("headers");
        @SuppressWarnings("unchecked") List<List<Object>> rows = (List<List<Object>>) request.get("rows");

        byte[] content = wordService.generateReport(title, headers != null ? headers : List.of(),
            rows != null ? rows : List.of());

        String filename = sanitizeFilename(title) + "_" + timestamp() + ".docx";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
            .body(content);
    }

    private String sanitizeFilename(String title) {
        return title.replaceAll("[^a-zA-Z0-9_\\- ]", "")
                    .replaceAll("\\s+", "_")
                    .substring(0, Math.min(title.length(), 40));
    }

    private String timestamp() {
        return new SimpleDateFormat("yyyyMMdd_HHmm").format(new Date());
    }
}
