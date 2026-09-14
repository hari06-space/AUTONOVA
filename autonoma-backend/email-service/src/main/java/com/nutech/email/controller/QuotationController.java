package com.nutech.email.controller;

import com.nutech.email.dto.DashboardDto.*;
import com.nutech.email.model.Quotation;
import com.nutech.email.model.QuotationLine;
import com.nutech.email.repository.QuotationRepository;
import com.nutech.email.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/quotations")
@RequiredArgsConstructor
public class QuotationController {

    private final QuotationRepository quotationRepository;
    private final DocumentService documentService;

    @GetMapping
    public ResponseEntity<List<QuotationResponse>> getAll() {
        List<QuotationResponse> quotations = quotationRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(quotations);
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuotationResponse> getById(@PathVariable Long id) {
        return quotationRepository.findById(id)
                .map(q -> ResponseEntity.ok(toResponse(q)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quotation not found"));

        byte[] pdfBytes = documentService.renderQuotationPdf(quotation);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.builder("attachment")
                .filename(quotation.getQuotationNumber() + ".pdf").build());
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest request) {
        return quotationRepository.findById(id).map(q -> {
            q.setStatus(Quotation.QuotationStatus.valueOf(request.getStatus()));
            quotationRepository.save(q);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    private QuotationResponse toResponse(Quotation q) {
        return QuotationResponse.builder()
                .id(q.getId())
                .quotationNumber(q.getQuotationNumber())
                .customerName(q.getCustomer() != null ? q.getCustomer().getName() : "Unknown")
                .customerEmail(q.getCustomer() != null ? q.getCustomer().getEmail() : "")
                .quotationDate(q.getQuotationDate())
                .validUntil(q.getValidUntil())
                .totalAmount(q.getTotalAmount())
                .status(q.getStatus().name())
                .createdAt(q.getCreatedAt())
                .lines(q.getLines().stream().map(l -> LineItem.builder()
                        .partCode(l.getMasterPart() != null ? l.getMasterPart().getPartCode() : "")
                        .partName(l.getMasterPart() != null ? l.getMasterPart().getPartName() : "")
                        .quantity(l.getQuantity())
                        .unitPrice(l.getUnitPrice())
                        .lineTotal(l.getLineTotal())
                        .build()).collect(Collectors.toList()))
                .build();
    }

    @lombok.Data
    public static class StatusUpdateRequest {
        private String status;
    }
}
