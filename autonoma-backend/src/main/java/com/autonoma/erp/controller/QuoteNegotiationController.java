package com.autonoma.erp.controller;

import com.autonoma.erp.dto.purchase.QuoteNegotiationHeadDTO;
import com.autonoma.erp.dto.purchase.QuoteNegotiationListDTO;
import com.autonoma.erp.service.QuoteNegotiationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/purchase/negotiation")
@Slf4j
public class QuoteNegotiationController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(QuoteNegotiationController.class);

    @Autowired
    private QuoteNegotiationService service;

    @GetMapping("/division/{divisionId}")
    public ResponseEntity<List<QuoteNegotiationListDTO>> getAllNegotiations(@PathVariable Long divisionId) {
        log.info("Fetching all quote negotiations for division: {}", divisionId);
        return ResponseEntity.ok(service.getAllNegotiations(divisionId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuoteNegotiationHeadDTO> getNegotiationById(@PathVariable Long id) {
        log.info("Fetching quote negotiation by id: {}", id);
        return ResponseEntity.ok(service.getNegotiationById(id));
    }
    
    @GetMapping("/quotation/{quotationId}")
    public ResponseEntity<QuoteNegotiationHeadDTO> getNegotiationByQuotationId(@PathVariable Long quotationId) {
        log.info("Fetching quote negotiation by quotation id: {}", quotationId);
        QuoteNegotiationHeadDTO dto = service.getNegotiationByQuotationId(quotationId);
        if (dto != null) {
            return ResponseEntity.ok(dto);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/init/{quotationId}")
    public ResponseEntity<QuoteNegotiationHeadDTO> initializeNegotiation(
            @PathVariable Long quotationId,
            @RequestParam(required = false, defaultValue = "1") Long buyerId) {
        log.info("Initializing quote negotiation for quotation id: {}, buyer id: {}", quotationId, buyerId);
        return ResponseEntity.ok(service.initializeNegotiation(quotationId, buyerId));
    }

    @PostMapping
    public ResponseEntity<QuoteNegotiationHeadDTO> saveNegotiation(
            @RequestBody QuoteNegotiationHeadDTO dto,
            @RequestHeader(value = "userId", defaultValue = "SYSTEM") String userId) {
        log.info("Saving quote negotiation");
        return ResponseEntity.ok(service.saveNegotiation(dto, userId));
    }

    @PutMapping("/{id}/status/{statusId}")
    public ResponseEntity<QuoteNegotiationHeadDTO> updateStatus(
            @PathVariable Long id,
            @PathVariable Long statusId,
            @RequestBody(required = false) String remarks,
            @RequestHeader(value = "userId", defaultValue = "SYSTEM") String userId) {
        log.info("Updating status for negotiation id: {}", id);
        return ResponseEntity.ok(service.updateNegotiationStatus(id, statusId, remarks, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNegotiation(@PathVariable Long id) {
        log.info("Deleting quote negotiation id: {}", id);
        service.deleteNegotiation(id);
        return ResponseEntity.ok().build();
    }
}
