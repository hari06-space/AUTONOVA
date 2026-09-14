package com.autonoma.erp.modules.notebook.service;

import com.autonoma.erp.modules.notebook.dto.OperationType;
import com.autonoma.erp.modules.notebook.entity.BosAiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Resolves the OperationType from a user query.
 *
 * Uses a hybrid approach:
 *  1. Database-driven: checks keyword overrides in BOS_AI_OPERATIONS.
 *  2. Fallback: hardcoded priority keyword rules.
 */
@Service
public class OperationResolver {

    @Autowired
    private EntityRegistryService entityRegistryService;

    public OperationType resolveOperation(String query) {
        if (query == null || query.isBlank()) {
            return OperationType.LIST;
        }
        String lower = query.toLowerCase();

        // 1. Try DB-configured operation keywords from BOS_AI_OPERATIONS
        for (com.autonoma.erp.modules.notebook.entity.BosAiEntity entity : entityRegistryService.getAllEntities()) {
            List<BosAiOperation> ops = entityRegistryService.getOperations(entity.getEntityCode());
            for (BosAiOperation op : ops) {
                String keywordsStr = op.getKeywords();
                if (keywordsStr == null || keywordsStr.isBlank()) continue;

                String[] keywords = keywordsStr.split("\\|");
                for (String kw : keywords) {
                    String kwTrim = kw.trim().toLowerCase();
                    if (!kwTrim.isEmpty() && lower.contains(kwTrim)) {
                        try {
                            return OperationType.valueOf(op.getOperationCode().toUpperCase());
                        } catch (Exception e) {
                            // Ignored: invalid enum code in DB
                        }
                    }
                }
            }
        }

        // 2. Hardcoded fallbacks (ordered by specificity priority)
        
        // COUNT
        if (lower.contains("how many") || lower.contains("total")
                || lower.contains("in number") || lower.contains("count")
                || lower.contains("number of")) {
            return OperationType.COUNT;
        }

        // ANALYTICS
        if (lower.contains("analytics") || lower.contains("statistics") || lower.contains("stats")
                || lower.contains("trend") || lower.contains("breakdown") || lower.contains("report")
                || lower.contains("top department") || lower.contains("top dept")
                || lower.contains("overdue") || lower.contains("average closure")
                || lower.contains("avg closure") || lower.contains("most active")
                || lower.contains("highest pending") || lower.contains("monthly trend")) {
            return OperationType.ANALYTICS;
        }

        // PENDING
        if (lower.contains("pending") || lower.contains("open")
                || lower.contains("not closed") || lower.contains("not completed")
                || lower.contains("active") || lower.contains("in progress")
                || lower.contains("outstanding") || lower.contains("due today")) {
            return OperationType.PENDING;
        }

        // COMPLETED
        if (lower.contains("completed") || lower.contains("closed") || lower.contains("resolved")
                || lower.contains("done") || lower.contains("finished")
                || lower.contains("submitted")) {
            return OperationType.COMPLETED;
        }

        // SEARCH
        if (lower.contains("search") || lower.contains("find") || lower.contains("lookup")
                || lower.contains("where is") || lower.contains("who is")
                || lower.contains("show me") || lower.contains("get me")) {
            return OperationType.SEARCH;
        }

        // DETAIL
        if (lower.contains("detail") || lower.contains("profile") || lower.contains("specific")
                || lower.contains("information about") || lower.contains("info about")) {
            return OperationType.DETAIL;
        }

        // COMPARE
        if (lower.contains("compare") || lower.contains("versus") || lower.contains(" vs ")) {
            return OperationType.COMPARE;
        }

        // TIMELINE
        if (lower.contains("timeline") || lower.contains("history")) {
            return OperationType.TIMELINE;
        }

        // SUMMARY
        if (lower.contains("my ") || lower.contains("assigned to me") || lower.contains("for me")) {
            return OperationType.SUMMARY;
        }

        return OperationType.LIST;
    }
}
