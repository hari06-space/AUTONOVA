package com.autonoma.erp.service.purchase.comparison.engine;

import com.autonoma.erp.model.QuoteComparisonScore;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class QuoteComparisonRankingEngine {

    public void rankSuppliers(List<QuoteComparisonScore> scores) {
        // Aggregate overall scores per supplier first
        // Apply Tie-Breaking Logic: 
        // 1. Overall Score (Descending)
        // 2. Lowest Cost
        // 3. Best Technical Score
        // 4. Best Delivery
        
        // This requires grouping scores by supplier and calculating the aggregates.
        // For simplicity in this placeholder:
        scores.sort(Comparator.comparing(QuoteComparisonScore::getCalculatedScore).reversed());
        
        int rank = 1;
        for (QuoteComparisonScore score : scores) {
            score.setOverallRank(rank++);
        }
    }
}
