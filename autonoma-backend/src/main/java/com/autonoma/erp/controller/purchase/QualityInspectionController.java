package com.autonoma.erp.controller.purchase;

import com.autonoma.erp.dto.purchase.inspection.QualityInspectionPayloadDTO;
import com.autonoma.erp.dto.purchase.inspection.QualityInspectionListDTO;
import com.autonoma.erp.service.purchase.inspection.QualityInspectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;
import com.autonoma.erp.service.purchase.inspection.TestReportService;
import com.autonoma.erp.dto.purchase.inspection.MaterialInspectionDTO;

@RestController
@RequestMapping("/api/purchase/quality-inspection")
public class QualityInspectionController {

    @Autowired
    private QualityInspectionService inspectionService;

    @Autowired
    private TestReportService testReportService;

    @GetMapping("/test-report/parameters")
    public ResponseEntity<List<MaterialInspectionDTO>> getTestReportParameters(
            @RequestParam Long itemId,
            @RequestParam BigDecimal grnQty) {
        return ResponseEntity.ok(testReportService.getTestReportParameters(itemId, grnQty));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<QualityInspectionListDTO>> search(
            @RequestParam(required = false) Long divisionId,
            @RequestParam(required = false) String qiNo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String grnNo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "grnId") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<QualityInspectionListDTO> result = inspectionService.search(divisionId, qiNo, startDate, endDate, grnNo, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<QualityInspectionPayloadDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(inspectionService.getById(id));
    }

    @PostMapping("/generate")
    public ResponseEntity<QualityInspectionPayloadDTO> generateFromGrn(
            @RequestParam Long grnId,
            @RequestParam Long divisionId,
            @RequestParam String userId) {
        return ResponseEntity.ok(inspectionService.generateFromGrn(grnId, divisionId, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QualityInspectionPayloadDTO> update(
            @PathVariable String id,
            @RequestBody QualityInspectionPayloadDTO dto,
            @RequestParam String userId) {
        dto.setId(id);
        return ResponseEntity.ok(inspectionService.save(dto, userId));
    }

    @PostMapping("/{id}/post")
    public ResponseEntity<QualityInspectionPayloadDTO> postInspection(
            @PathVariable String id,
            @RequestParam String userId) {
        return ResponseEntity.ok(inspectionService.postInspection(id, userId));
    }
}
