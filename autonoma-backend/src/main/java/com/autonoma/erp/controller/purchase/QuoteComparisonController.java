package com.autonoma.erp.controller.purchase;

import com.autonoma.erp.dto.purchase.comparison.QuoteComparisonDTO;
import com.autonoma.erp.service.purchase.comparison.QuoteComparisonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase/quote-comparison")
@RequiredArgsConstructor
public class QuoteComparisonController {

    private final QuoteComparisonService quoteComparisonService;

    @GetMapping("/division/{divisionId}")
    public ResponseEntity<List<QuoteComparisonDTO>> getAllComparisons(@PathVariable Long divisionId) {
        return ResponseEntity.ok(quoteComparisonService.getAllComparisons(divisionId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuoteComparisonDTO> getComparisonById(@PathVariable Long id) {
        return ResponseEntity.ok(quoteComparisonService.getComparisonById(id));
    }

    @PostMapping("/generate/{rfqId}")
    public ResponseEntity<QuoteComparisonDTO> generateComparison(@PathVariable Long rfqId, @RequestHeader("userId") String userId) {
        return ResponseEntity.ok(quoteComparisonService.createComparison(rfqId, userId));
    }

    @PostMapping("/{id}/lock")
    public ResponseEntity<QuoteComparisonDTO> lockComparison(@PathVariable Long id, @RequestHeader("userId") String userId, @RequestBody(required = false) QuoteComparisonDTO payload) {
        return ResponseEntity.ok(quoteComparisonService.lockComparison(id, userId, payload));
    }

    @PutMapping("/{id}/verify")
    public ResponseEntity<QuoteComparisonDTO> verifyComparison(
            @PathVariable Long id,
            @RequestHeader(value = "userId", required = false) String headerUserId,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        
        String userId = headerUserId != null ? headerUserId : com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        String remarks = body != null ? body.get("remarks") : "";
        return ResponseEntity.ok(quoteComparisonService.verifyComparison(id, userId, remarks));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComparison(@PathVariable Long id) {
        quoteComparisonService.deleteComparison(id);
        return ResponseEntity.noContent().build();
    }
}
