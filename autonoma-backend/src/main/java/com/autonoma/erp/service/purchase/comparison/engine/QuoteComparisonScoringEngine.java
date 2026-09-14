package com.autonoma.erp.service.purchase.comparison.engine;

import com.autonoma.erp.enums.FormulaType;
import com.autonoma.erp.model.ProcurementScoringRule;
import com.autonoma.erp.model.QuoteComparisonMatrix;
import com.autonoma.erp.model.QuoteComparisonScore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class QuoteComparisonScoringEngine {

    private final QuoteComparisonFormulaEngine formulaEngine;

    public List<QuoteComparisonScore> generateScores(List<QuoteComparisonMatrix> snapshotMatrixList, List<ProcurementScoringRule> rules) {
        List<QuoteComparisonScore> scores = new ArrayList<>();
        
        // Pseudo-logic to iterate over rules and matrix rows to apply formulas
        for (ProcurementScoringRule rule : rules) {
            // Find best values across the matrix for the current rule if required (e.g. Lowest Price)
            BigDecimal bestValue = findBestValue(snapshotMatrixList, rule);

            for (QuoteComparisonMatrix matrix : snapshotMatrixList) {
                BigDecimal currentValue = extractValueFromMatrix(matrix, rule);
                BigDecimal calculatedScore = BigDecimal.ZERO;

                if (rule.getFormulaType() == FormulaType.LOWEST_IS_BEST) {
                    calculatedScore = formulaEngine.evaluateLowestIsBest(currentValue, bestValue, rule.getWeight());
                } else if (rule.getFormulaType() == FormulaType.HIGHEST_IS_BEST) {
                    calculatedScore = formulaEngine.evaluateHighestIsBest(currentValue, bestValue, rule.getWeight());
                } else if (rule.getFormulaType() == FormulaType.EXPRESSION) {
                    calculatedScore = formulaEngine.evaluateExpression(rule.getFormulaExpression(), currentValue, bestValue, rule.getWeight());
                }

                QuoteComparisonScore scoreRecord = new QuoteComparisonScore();
                scoreRecord.setComparisonMatrix(matrix);
                scoreRecord.setSupplierId(matrix.getSupplierId());
                scoreRecord.setScoreType("RULE_SCORE");
                scoreRecord.setRuleCode(rule.getRuleCode());
                scoreRecord.setValueNumeric(currentValue);
                scoreRecord.setAppliedWeight(rule.getWeight());
                scoreRecord.setCalculatedScore(calculatedScore);
                
                scores.add(scoreRecord);
            }
        }
        
        return scores;
    }

    private BigDecimal findBestValue(List<QuoteComparisonMatrix> snapshotMatrixList, ProcurementScoringRule rule) {
        // Find minimum or maximum based on rule
        return BigDecimal.TEN; // Placeholder
    }

    private BigDecimal extractValueFromMatrix(QuoteComparisonMatrix matrix, ProcurementScoringRule rule) {
        // Depending on rule code (e.g. "PRICE", "DELIVERY"), extract the value
        return BigDecimal.TEN; // Placeholder
    }
}
