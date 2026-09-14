package com.nutech.email.service;

import com.nutech.email.dto.AiDto.*;
import com.nutech.email.integration.AiClient;
import com.nutech.email.model.*;
import com.nutech.email.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class PartResolutionService {

    private final MasterPartRepository masterPartRepository;
    private final CustomerPartMappingRepository mappingRepository;
    private final ReviewQueueItemRepository reviewQueueRepository;
    private final AiClient aiClient;

    @Value("${ai.confidence-threshold:0.90}")
    private double confidenceThreshold;

    /**
     * Resolves extracted parts against master parts and customer mappings.
     * Returns a list of resolved parts and creates review queue items for unresolved ones.
     */
    @Transactional
    public ResolutionResult resolveParts(List<ExtractedPart> extractedParts,
                                          Customer customer,
                                          ProcessingRequest processingRequest) {
        List<ResolvedPartInfo> resolved = new ArrayList<>();
        List<ReviewQueueItem> pendingReview = new ArrayList<>();

        for (ExtractedPart ep : extractedParts) {
            String code = ep.getPartCode().trim().toUpperCase();

            // Step 1: Direct lookup in master_part
            Optional<MasterPart> directMatch = masterPartRepository.findByPartCodeIgnoreCase(code);
            if (directMatch.isPresent()) {
                resolved.add(new ResolvedPartInfo(directMatch.get(), ep.getQuantity(), ep));
                log.debug("Part '{}' found directly in master_part", code);
                continue;
            }

            // Step 2: Check customer_part_mapping
            Optional<CustomerPartMapping> mapping = mappingRepository
                    .findByCustomerIdAndCustomerPartCode(customer.getId(), code);
            if (mapping.isPresent()) {
                resolved.add(new ResolvedPartInfo(mapping.get().getMasterPart(), ep.getQuantity(), ep));
                log.debug("Part '{}' resolved via customer mapping -> {}", code,
                          mapping.get().getMasterPart().getPartCode());
                continue;
            }

            // Step 3: AI suggestion
            try {
                List<MasterPart> allParts = masterPartRepository.findByIsActiveTrue();
                PartMatchSuggestion suggestion = aiClient.suggestPartMatch(code, ep.getSurroundingContext(), allParts)
                        .get(); // block — we're already in a transactional context

                MasterPart suggestedPart = null;
                if (suggestion.getSuggestedPartCode() != null) {
                    suggestedPart = masterPartRepository.findByPartCodeIgnoreCase(suggestion.getSuggestedPartCode())
                            .orElse(null);
                }

                if (suggestedPart != null && suggestion.getConfidence() >= confidenceThreshold) {
                    // Auto-map with high confidence
                    CustomerPartMapping newMapping = CustomerPartMapping.builder()
                            .customer(customer)
                            .customerPartCode(code)
                            .masterPart(suggestedPart)
                            .mappingSource(CustomerPartMapping.MappingSource.AI_AUTO)
                            .aiConfidence(BigDecimal.valueOf(suggestion.getConfidence()))
                            .build();
                    mappingRepository.save(newMapping);

                    resolved.add(new ResolvedPartInfo(suggestedPart, ep.getQuantity(), ep));
                    log.info("Part '{}' auto-mapped to '{}' (confidence: {})",
                             code, suggestedPart.getPartCode(), suggestion.getConfidence());
                } else {
                    // Low confidence — queue for human review
                    ReviewQueueItem item = ReviewQueueItem.builder()
                            .processingRequest(processingRequest)
                            .unknownPartCode(code)
                            .requestedQuantity(ep.getQuantity())
                            .surroundingContext(ep.getSurroundingContext())
                            .aiSuggestedPart(suggestedPart)
                            .aiConfidence(BigDecimal.valueOf(suggestion.getConfidence()))
                            .aiReasoning(suggestion.getReasoning())
                            .status(ReviewQueueItem.ReviewStatus.PENDING)
                            .build();
                    reviewQueueRepository.save(item);
                    pendingReview.add(item);
                    log.info("Part '{}' queued for human review (AI confidence: {})", code, suggestion.getConfidence());
                }
            } catch (Exception e) {
                // If AI fails, still queue for review
                ReviewQueueItem item = ReviewQueueItem.builder()
                        .processingRequest(processingRequest)
                        .unknownPartCode(code)
                        .requestedQuantity(ep.getQuantity())
                        .surroundingContext(ep.getSurroundingContext())
                        .aiReasoning("AI suggestion failed: " + e.getMessage())
                        .status(ReviewQueueItem.ReviewStatus.PENDING)
                        .build();
                reviewQueueRepository.save(item);
                pendingReview.add(item);
                log.error("AI suggestion failed for '{}', queued for review: {}", code, e.getMessage());
            }
        }

        return new ResolutionResult(resolved, pendingReview);
    }

    // ── Inner classes ──
    public record ResolvedPartInfo(MasterPart masterPart, Integer quantity, ExtractedPart original) {}
    public record ResolutionResult(List<ResolvedPartInfo> resolved, List<ReviewQueueItem> pendingReview) {
        public boolean allResolved() {
            return pendingReview.isEmpty();
        }
    }
}
