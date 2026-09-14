package com.autonoma.erp.modules.qms.meeting.engine;

import com.autonoma.erp.modules.qms.meeting.entity.QmsScheduleRuleCondition;
import com.autonoma.erp.modules.qms.meeting.entity.QmsScheduleRuleGroup;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@Slf4j
public class RuleConditionEvaluator {

    public boolean evaluateGroup(QmsScheduleRuleGroup group, Map<String, Object> resolvedProperties) {
        if (group == null) return true;

        List<QmsScheduleRuleCondition> conditions = group.getConditions();
        List<QmsScheduleRuleGroup> childGroups = group.getChildGroups();

        if ((conditions == null || conditions.isEmpty()) && (childGroups == null || childGroups.isEmpty())) {
            return true;
        }

        boolean isAll = "ALL".equalsIgnoreCase(group.getLogicalOperator());
        Boolean conditionsResult = null;

        // Evaluate child conditions using per-condition logical operators
        if (conditions != null && !conditions.isEmpty()) {
            boolean currentVal = evaluateSingleCondition(conditions.get(0), resolvedProperties);
            for (int i = 1; i < conditions.size(); i++) {
                QmsScheduleRuleCondition cond = conditions.get(i);
                boolean singleRes = evaluateSingleCondition(cond, resolvedProperties);
                String op = cond.getLogicalOperator() != null ? cond.getLogicalOperator().toUpperCase() : (isAll ? "AND" : "OR");
                if ("OR".equals(op)) {
                    currentVal = currentVal || singleRes;
                } else {
                    currentVal = currentVal && singleRes;
                }
            }
            conditionsResult = currentVal;
        }

        // Evaluate child groups recursively
        Boolean childGroupsResult = null;
        if (childGroups != null && !childGroups.isEmpty()) {
            boolean currentVal = evaluateGroup(childGroups.get(0), resolvedProperties);
            for (int i = 1; i < childGroups.size(); i++) {
                boolean childRes = evaluateGroup(childGroups.get(i), resolvedProperties);
                if (isAll) {
                    currentVal = currentVal && childRes;
                } else {
                    currentVal = currentVal || childRes;
                }
            }
            childGroupsResult = currentVal;
        }

        if (conditionsResult != null && childGroupsResult != null) {
            return isAll ? (conditionsResult && childGroupsResult) : (conditionsResult || childGroupsResult);
        } else if (conditionsResult != null) {
            return conditionsResult;
        } else if (childGroupsResult != null) {
            return childGroupsResult;
        }

        return true;
    }

    public boolean evaluateSingleCondition(QmsScheduleRuleCondition condition, Map<String, Object> resolvedProperties) {
        if (condition == null || condition.getFieldCode() == null || condition.getOperatorCode() == null) {
            return true;
        }

        String fieldCode = condition.getFieldCode().toUpperCase().trim();
        String operatorCode = condition.getOperatorCode().toUpperCase().trim();
        String expectedVal = condition.getConditionValue();

        Object actualObj = resolvedProperties.get(fieldCode);
        if (actualObj == null) {
            actualObj = resolvedProperties.get(condition.getFieldCode());
        }

        String actualVal = actualObj != null ? String.valueOf(actualObj) : "";

        boolean result = evaluateOperator(operatorCode, actualVal, expectedVal, condition.getDataType());

        if ("NOT".equalsIgnoreCase(condition.getLogicalOperator())) {
            return !result;
        }

        return result;
    }

    private boolean evaluateOperator(String operatorCode, String actual, String expected, String dataType) {
        if (expected == null) expected = "";
        actual = actual != null ? actual.trim() : "";
        expected = expected.trim();

        switch (operatorCode) {
            case "EQUALS":
            case "EQUAL":
            case "=":
            case "IS":
                return actual.equalsIgnoreCase(expected);

            case "NOT_EQUALS":
            case "NOT_EQUAL":
            case "!=":
            case "IS_NOT":
                return !actual.equalsIgnoreCase(expected);

            case "CONTAINS":
                return actual.toLowerCase().contains(expected.toLowerCase());

            case "DOES_NOT_CONTAIN":
                return !actual.toLowerCase().contains(expected.toLowerCase());

            case "IN":
            case "INCLUDES":
                List<String> inList = parseList(expected);
                String finalActual = actual;
                return inList.stream().anyMatch(item -> item.equalsIgnoreCase(finalActual));

            case "NOT_IN":
            case "DOES_NOT_INCLUDE":
                List<String> notInList = parseList(expected);
                String finalActualNot = actual;
                return notInList.stream().noneMatch(item -> item.equalsIgnoreCase(finalActualNot));

            case "IS_TRUE":
            case "TRUE":
                return "true".equalsIgnoreCase(actual) || "yes".equalsIgnoreCase(actual) || "1".equalsIgnoreCase(actual);

            case "IS_FALSE":
            case "FALSE":
                return "false".equalsIgnoreCase(actual) || "no".equalsIgnoreCase(actual) || "0".equalsIgnoreCase(actual);

            case "GREATER_THAN":
            case ">":
                return compareNumbers(actual, expected) > 0;

            case "LESS_THAN":
            case "<":
                return compareNumbers(actual, expected) < 0;

            case "GREATER_THAN_OR_EQUAL":
            case ">=":
                return compareNumbers(actual, expected) >= 0;

            case "LESS_THAN_OR_EQUAL":
            case "<=":
                return compareNumbers(actual, expected) <= 0;

            case "BETWEEN":
                return checkBetween(actual, expected);

            case "BEFORE":
                return compareDates(actual, expected) < 0;

            case "AFTER":
                return compareDates(actual, expected) > 0;

            default:
                return actual.equalsIgnoreCase(expected);
        }
    }

    private List<String> parseList(String input) {
        if (input == null || input.trim().isEmpty()) return List.of();
        // Handle brackets like [1, 5] or "1, 5" or "Saturday, Sunday"
        String clean = input.replaceAll("[\\[\\]]", "");
        return Arrays.stream(clean.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private int compareNumbers(String actualStr, String expectedStr) {
        try {
            double actualNum = Double.parseDouble(actualStr);
            double expectedNum = Double.parseDouble(expectedStr);
            return Double.compare(actualNum, expectedNum);
        } catch (NumberFormatException e) {
            return actualStr.compareToIgnoreCase(expectedStr);
        }
    }

    private boolean checkBetween(String actualStr, String expectedStr) {
        List<String> parts = parseList(expectedStr);
        if (parts.size() < 2) return false;
        try {
            double actualNum = Double.parseDouble(actualStr);
            double min = Double.parseDouble(parts.get(0));
            double max = Double.parseDouble(parts.get(1));
            return actualNum >= min && actualNum <= max;
        } catch (NumberFormatException e) {
            return actualStr.compareToIgnoreCase(parts.get(0)) >= 0 && actualStr.compareToIgnoreCase(parts.get(1)) <= 0;
        }
    }

    private int compareDates(String actualStr, String expectedStr) {
        try {
            LocalDate d1 = LocalDate.parse(actualStr);
            LocalDate d2 = LocalDate.parse(expectedStr);
            return d1.compareTo(d2);
        } catch (Exception e) {
            return actualStr.compareToIgnoreCase(expectedStr);
        }
    }
}
