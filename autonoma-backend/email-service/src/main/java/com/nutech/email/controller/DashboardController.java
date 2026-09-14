package com.nutech.email.controller;

import com.nutech.email.dto.DashboardDto.*;
import com.nutech.email.model.ProcessingRequest;
import com.nutech.email.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ProcessingRequestRepository processingRequestRepository;
    private final QuotationRepository quotationRepository;
    private final InvoiceRepository invoiceRepository;
    private final MasterPartRepository masterPartRepository;
    private final CustomerRepository customerRepository;
    private final ReviewQueueItemRepository reviewQueueItemRepository;

    @GetMapping("/stats")
    public ResponseEntity<StatsResponse> getStats() {
        StatsResponse stats = StatsResponse.builder()
                .totalEmailsProcessed(processingRequestRepository.count())
                .pendingReviews(reviewQueueItemRepository.countByStatus(com.nutech.email.model.ReviewQueueItem.ReviewStatus.PENDING))
                .quotationsSent(quotationRepository.count())
                .invoicesSent(invoiceRepository.count())
                .totalMasterParts(masterPartRepository.count())
                .totalCustomers(customerRepository.count())
                .build();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/recent-requests")
    public ResponseEntity<List<ProcessingRequestResponse>> getRecentRequests() {
        List<ProcessingRequestResponse> recent = processingRequestRepository.findTop50ByOrderByCreatedAtDesc()
                .stream()
                .map(pr -> ProcessingRequestResponse.builder()
                        .id(pr.getId())
                        .emailSubject(pr.getEmailSubject())
                        .emailFrom(pr.getEmailFrom())
                        .intent(pr.getIntent().name())
                        .status(pr.getStatus().name())
                        .emailReceivedAt(pr.getEmailReceivedAt())
                        .createdAt(pr.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(recent);
    }
}
