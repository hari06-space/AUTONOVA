package com.autonoma.erp.service.purchase.comparison.engine;

import com.autonoma.erp.model.QuoteComparisonScore;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class QuoteComparisonRecommendationEngine {

    public Map<String, Object> generateRecommendation(List<QuoteComparisonScore> rankedScores) {
        // Find the top ranked supplier
        QuoteComparisonScore topScore = rankedScores.stream()
                .filter(s -> s.getOverallRank() != null && s.getOverallRank() == 1)
                .findFirst()
                .orElse(null);

        Map<String, Object> recommendation = new HashMap<>();
        recommendation.put("algorithmVersion", "1.0");

        if (topScore != null) {
            topScore.setIsRecommended(true);
            recommendation.put("supplierId", topScore.getSupplierId());
            recommendation.put("decision", "RECOMMENDED");
            recommendation.put("confidence", 95.0); // Example calculation
            recommendation.put("score", topScore.getCalculatedScore());
            
            // Build reasons
            recommendation.put("reasons", List.of(
                    Map.of("code", "HIGHEST_OVERALL", "message", "Highest Overall Score", "weight", 100)
            ));
        } else {
            recommendation.put("decision", "NO_RECOMMENDATION");
        }

        return recommendation;
    }
}
