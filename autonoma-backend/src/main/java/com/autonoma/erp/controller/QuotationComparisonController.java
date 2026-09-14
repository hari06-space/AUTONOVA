package com.autonoma.erp.controller;

import com.autonoma.erp.dto.purchase.ComparisonDecisionDTO;
import com.autonoma.erp.dto.purchase.QuotationComparisonDTO;
import com.autonoma.erp.service.DynamicScoringService;
import com.autonoma.erp.service.ComparisonDecisionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/quotation-comparison")
public class QuotationComparisonController {

    private final DynamicScoringService scoringService;
    private final ComparisonDecisionService decisionService;

    @org.springframework.beans.factory.annotation.Autowired
    public QuotationComparisonController(DynamicScoringService scoringService, ComparisonDecisionService decisionService) {
        this.scoringService = scoringService;
        this.decisionService = decisionService;
    }

    @GetMapping("/generate/rfq/{rfqId}/division/{divisionId}")
    public ResponseEntity<QuotationComparisonDTO> generateComparison(@PathVariable Long rfqId, @PathVariable Long divisionId) {
        return ResponseEntity.ok(scoringService.compareQuotations(rfqId, divisionId));
    }

    @GetMapping("/decision/rfq/{rfqId}")
    public ResponseEntity<ComparisonDecisionDTO> getDecision(@PathVariable Long rfqId) {
        ComparisonDecisionDTO dto = decisionService.getDecisionByRfq(rfqId);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.noContent().build();
    }

    @PostMapping("/decision")
    public ResponseEntity<ComparisonDecisionDTO> saveDecision(@RequestBody ComparisonDecisionDTO dto) {
        return ResponseEntity.ok(decisionService.saveDecision(dto));
    }

    @PostMapping("/decision/{id}/approve")
    public ResponseEntity<Void> approveDecision(@PathVariable Long id) {
        decisionService.approveDecision(id);
        return ResponseEntity.ok().build();
    }
}
