package com.autonoma.erp.service.purchase.comparison.engine;

import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class QuoteComparisonFormulaEngine {

    private final ExpressionParser parser = new SpelExpressionParser();

    public BigDecimal evaluateExpression(String expression, BigDecimal currentValue, BigDecimal bestValue, BigDecimal weight) {
        if (expression == null || expression.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }

        StandardEvaluationContext context = new StandardEvaluationContext();
        // Variables that can be used in formulas:
        context.setVariable("current", currentValue != null ? currentValue.doubleValue() : 0.0);
        context.setVariable("best", bestValue != null ? bestValue.doubleValue() : 0.0);
        context.setVariable("weight", weight != null ? weight.doubleValue() : 0.0);

        try {
            Double result = parser.parseExpression(expression).getValue(context, Double.class);
            if (result != null) {
                return BigDecimal.valueOf(result).setScale(4, RoundingMode.HALF_UP);
            }
        } catch (Exception e) {
            // Log error, fallback to 0
        }
        return BigDecimal.ZERO;
    }

    public BigDecimal evaluateLowestIsBest(BigDecimal currentValue, BigDecimal lowestValue, BigDecimal weight) {
        if (currentValue == null || currentValue.compareTo(BigDecimal.ZERO) == 0 || lowestValue == null || weight == null) {
            return BigDecimal.ZERO;
        }
        // (lowest / current) * weight
        return lowestValue.divide(currentValue, 4, RoundingMode.HALF_UP).multiply(weight);
    }

    public BigDecimal evaluateHighestIsBest(BigDecimal currentValue, BigDecimal highestValue, BigDecimal weight) {
        if (highestValue == null || highestValue.compareTo(BigDecimal.ZERO) == 0 || currentValue == null || weight == null) {
            return BigDecimal.ZERO;
        }
        // (current / highest) * weight
        return currentValue.divide(highestValue, 4, RoundingMode.HALF_UP).multiply(weight);
    }
}
