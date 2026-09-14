package com.autonoma.erp.controller;

import com.autonoma.erp.dto.purchase.QuotationHeadDTO;
import com.autonoma.erp.dto.purchase.QuotationListDTO;
import com.autonoma.erp.service.QuotationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/quotation")
public class QuotationController {

    private final QuotationService service;

    @org.springframework.beans.factory.annotation.Autowired
    public QuotationController(QuotationService service) {
        this.service = service;
    }

    @GetMapping("/division/{divisionId}")
    public ResponseEntity<List<QuotationListDTO>> getAllQuotations(@PathVariable Long divisionId) {
        return ResponseEntity.ok(service.getAllQuotations(divisionId));
    }

    @GetMapping("/rfq/{rfqId}")
    public ResponseEntity<List<QuotationListDTO>> getQuotationsByRfq(@PathVariable Long rfqId) {
        return ResponseEntity.ok(service.getQuotationsByRfq(rfqId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuotationHeadDTO> getQuotationById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getQuotationById(id));
    }

    @PostMapping
    public ResponseEntity<QuotationHeadDTO> saveQuotation(@RequestBody QuotationHeadDTO dto) {
        return ResponseEntity.ok(service.saveQuotation(dto));
    }

    @PutMapping("/{id}/technical-evaluate")
    public ResponseEntity<Void> evaluateTechnicalStatus(@PathVariable Long id, @RequestParam String status) {
        service.evaluateTechnicalStatus(id, status);
        return ResponseEntity.ok().build();
    }
}
