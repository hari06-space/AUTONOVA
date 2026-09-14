package com.nutech.email.service;

import com.nutech.email.dto.ReviewDto.*;
import com.nutech.email.model.*;
import com.nutech.email.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReviewQueueService {

    private final ReviewQueueItemRepository reviewQueueRepository;
    private final MasterPartRepository masterPartRepository;
    private final CustomerPartMappingRepository mappingRepository;
    private final ProcessingRequestRepository processingRequestRepository;
    private final EmailProcessorService emailProcessorService;

    public List<ReviewQueueItemResponse> getPendingItems() {
        return reviewQueueRepository.findByStatusOrderByCreatedAtDesc(ReviewQueueItem.ReviewStatus.PENDING)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void resolveItem(ResolveRequest req, Long userId) {
        ReviewQueueItem item = reviewQueueRepository.findById(req.getReviewItemId())
                .orElseThrow(() -> new RuntimeException("Review item not found"));

        MasterPart masterPart;

        if (req.getNewPart() != null) {
            // Create new master part
            masterPart = MasterPart.builder()
                    .partCode(req.getNewPart().getPartCode())
                    .partName(req.getNewPart().getPartName())
                    .description(req.getNewPart().getDescription())
                    .category(req.getNewPart().getCategory())
                    .unitPrice(req.getNewPart().getUnitPrice() != null ? req.getNewPart().getUnitPrice() : BigDecimal.ZERO)
                    .uom(req.getNewPart().getUom() != null ? req.getNewPart().getUom() : "NOS")
                    .leadTimeDays(req.getNewPart().getLeadTimeDays() != null ? req.getNewPart().getLeadTimeDays() : 0)
                    .hsnCode(req.getNewPart().getHsnCode())
                    .gstRate(req.getNewPart().getGstRate() != null ? req.getNewPart().getGstRate() : new BigDecimal("18.00"))
                    .build();
            masterPart = masterPartRepository.save(masterPart);
            item.setStatus(ReviewQueueItem.ReviewStatus.NEW_PART_CREATED);
        } else {
            masterPart = masterPartRepository.findById(req.getMasterPartId())
                    .orElseThrow(() -> new RuntimeException("Master part not found"));
            item.setStatus(ReviewQueueItem.ReviewStatus.RESOLVED);
        }

        item.setResolvedMasterPart(masterPart);
        item.setResolvedByUserId(userId);
        item.setResolvedAt(LocalDateTime.now());
        item.setNotes(req.getNotes());
        reviewQueueRepository.save(item);

        // Save customer mapping for learning
        ProcessingRequest pr = item.getProcessingRequest();
        if (pr.getCustomer() != null) {
            if (!mappingRepository.existsByCustomerIdAndCustomerPartCode(
                    pr.getCustomer().getId(), item.getUnknownPartCode())) {
                mappingRepository.save(CustomerPartMapping.builder()
                        .customer(pr.getCustomer())
                        .customerPartCode(item.getUnknownPartCode())
                        .masterPart(masterPart)
                        .mappingSource(CustomerPartMapping.MappingSource.AI_REVIEWED)
                        .mappedByUserId(userId)
                        .notes(req.getNotes())
                        .build());
            }
        }

        // Check if all items for this processing request are resolved
        checkAndResumeProcessing(pr.getId());
    }

    private void checkAndResumeProcessing(Long processingRequestId) {
        List<ReviewQueueItem> allItems = reviewQueueRepository
                .findByProcessingRequestIdOrderByCreatedAtAsc(processingRequestId);

        boolean allResolved = allItems.stream()
                .allMatch(i -> i.getStatus() != ReviewQueueItem.ReviewStatus.PENDING);

        if (allResolved) {
            ProcessingRequest pr = processingRequestRepository.findById(processingRequestId).orElse(null);
            if (pr != null && pr.getStatus() == ProcessingRequest.ProcessingStatus.AWAITING_REVIEW) {
                List<PartResolutionService.ResolvedPartInfo> resolved = allItems.stream()
                        .filter(i -> i.getResolvedMasterPart() != null)
                        .map(i -> new PartResolutionService.ResolvedPartInfo(
                                i.getResolvedMasterPart(), i.getRequestedQuantity(), null))
                        .collect(Collectors.toList());

                emailProcessorService.resumeAfterReview(pr, resolved);
                log.info("All review items resolved for PR {}, resuming processing", processingRequestId);
            }
        }
    }

    private ReviewQueueItemResponse toResponse(ReviewQueueItem item) {
        return ReviewQueueItemResponse.builder()
                .id(item.getId())
                .processingRequestId(item.getProcessingRequest().getId())
                .emailSubject(item.getProcessingRequest().getEmailSubject())
                .emailFrom(item.getProcessingRequest().getEmailFrom())
                .unknownPartCode(item.getUnknownPartCode())
                .requestedQuantity(item.getRequestedQuantity())
                .surroundingContext(item.getSurroundingContext())
                .aiSuggestedPartCode(item.getAiSuggestedPart() != null ? item.getAiSuggestedPart().getPartCode() : null)
                .aiSuggestedPartName(item.getAiSuggestedPart() != null ? item.getAiSuggestedPart().getPartName() : null)
                .aiConfidence(item.getAiConfidence())
                .aiReasoning(item.getAiReasoning())
                .status(item.getStatus().name())
                .createdAt(item.getCreatedAt())
                .build();
    }
}
