package com.autonoma.erp.util;


import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

public class PayrollFormulaEvaluator {

    public static class Token {
        public enum Type {
            NUMBER, IDENTIFIER, SYMBOL
        }

        public final Type type;
        public final String value;

        public Token(Type type, String value) {
            this.type = type;
            this.value = value;
        }

        @Override
        public String toString() {
            return type + ":" + value;
        }
    }

    public static List<Token> tokenize(String input) {
        List<Token> tokens = new ArrayList<>();
        if (input == null || input.trim().isEmpty()) {
            return tokens;
        }

        int i = 0;
        int len = input.length();
        while (i < len) {
            char c = input.charAt(i);
            if (Character.isWhitespace(c)) {
                i++;
                continue;
            }

            // Dual-character symbols
            if (i + 1 < len) {
                String sub = input.substring(i, i + 2);
                if (sub.equals(">=") || sub.equals("<=") || sub.equals("==") || sub.equals("!=")) {
                    tokens.add(new Token(Token.Type.SYMBOL, sub));
                    i += 2;
                    continue;
                }
            }

            // Single-character symbols
            if (c == '+' || c == '-' || c == '*' || c == '/' || c == '(' || c == ')' || c == ',' || c == '>'
                    || c == '<') {
                tokens.add(new Token(Token.Type.SYMBOL, String.valueOf(c)));
                i++;
                continue;
            }

            // Numbers
            if (Character.isDigit(c) || c == '.') {
                StringBuilder sb = new StringBuilder();
                boolean hasDot = false;
                while (i < len && (Character.isDigit(input.charAt(i)) || input.charAt(i) == '.')) {
                    char nextChar = input.charAt(i);
                    if (nextChar == '.') {
                        if (hasDot) {
                            throw new IllegalArgumentException(
                                    "Invalid number format at index " + i + " in formula: " + input);
                        }
                        hasDot = true;
                    }
                    sb.append(nextChar);
                    i++;
                }
                tokens.add(new Token(Token.Type.NUMBER, sb.toString()));
                continue;
            }

            // Identifiers / Variables
            if (Character.isLetter(c) || c == '_') {
                StringBuilder sb = new StringBuilder();
                while (i < len && (Character.isLetterOrDigit(input.charAt(i)) || input.charAt(i) == '_')) {
                    sb.append(input.charAt(i));
                    i++;
                }
                tokens.add(new Token(Token.Type.IDENTIFIER, sb.toString()));
                continue;
            }

            throw new IllegalArgumentException(
                    "Unexpected character '" + c + "' at index " + i + " in formula: " + input);
        }

        return tokens;
    }

    private final List<Token> tokens;
    private final Map<String, BigDecimal> context;
    private int pos = 0;
    private boolean isValidation = false;

    private PayrollFormulaEvaluator(List<Token> tokens, Map<String, BigDecimal> context) {
        this.tokens = tokens;
        this.context = context != null ? context : new HashMap<>();
    }

    public static BigDecimal evaluate(String formula, Map<String, BigDecimal> context) {
        if (formula == null || formula.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }
        List<Token> tokens = tokenize(formula);
        PayrollFormulaEvaluator parser = new PayrollFormulaEvaluator(tokens, context);
        double result = parser.parseExpression();
        if (parser.pos < tokens.size()) {
            throw new IllegalArgumentException(
                    "Unexpected content at token " + tokens.get(parser.pos) + " in formula: " + formula);
        }
        return BigDecimal.valueOf(result).setScale(4, RoundingMode.HALF_UP).stripTrailingZeros();
    }

    public static boolean validate(String formula, Set<String> variables) {
        if (formula == null || formula.trim().isEmpty()) {
            return false;
        }
        try {
            Map<String, BigDecimal> mockContext = new HashMap<>();
            if (variables != null) {
                for (String v : variables) {
                    if (v != null) mockContext.put(v.toUpperCase(), BigDecimal.ONE);
                }
            }
            // Add standard system variables
            mockContext.put("GROSS", BigDecimal.valueOf(30000));
            mockContext.put("BASIC", BigDecimal.valueOf(15000));
            mockContext.put("TOTAL_DAYS", BigDecimal.valueOf(30));
            mockContext.put("PRESENT_DAYS", BigDecimal.valueOf(30));
            mockContext.put("LOP_DAYS", BigDecimal.ONE);
            mockContext.put("LOM_DAYS", BigDecimal.ONE);
            mockContext.put("PAID_DAYS", BigDecimal.valueOf(30));
            mockContext.put("MONTH", BigDecimal.valueOf(6));
            mockContext.put("OT_HOURS", BigDecimal.valueOf(10));
            mockContext.put("OT_MINUTES", BigDecimal.valueOf(600));

            List<Token> tokens = tokenize(formula);
            PayrollFormulaEvaluator parser = new PayrollFormulaEvaluator(tokens, mockContext);
            parser.isValidation = true;
            double result = parser.parseExpression();
            if (parser.pos < tokens.size()) {
                return false;
            }
            return !Double.isNaN(result) && !Double.isInfinite(result);
        } catch (Exception e) {
            return false;
        }
    }

    private Token peek() {
        if (pos < tokens.size()) {
            return tokens.get(pos);
        }
        return null;
    }

    private Token consume() {
        if (pos < tokens.size()) {
            return tokens.get(pos++);
        }
        throw new IllegalStateException("Unexpected end of formula");
    }

    private void matchSymbol(String val) {
        Token t = consume();
        if (t.type != Token.Type.SYMBOL || !t.value.equals(val)) {
            throw new IllegalArgumentException("Expected symbol '" + val + "' but got " + t);
        }
    }

    private double parseExpression() {
        return parseComparison();
    }

    private double parseComparison() {
        double val = parseAdditive();
        Token next = peek();
        if (next != null && next.type == Token.Type.SYMBOL &&
                (next.value.equals(">") || next.value.equals("<") || next.value.equals(">=") ||
                        next.value.equals("<=") || next.value.equals("==") || next.value.equals("!="))) {
            Token op = consume();
            double right = parseAdditive();
            switch (op.value) {
                case ">":
                    return val > right ? 1.0 : 0.0;
                case "<":
                    return val < right ? 1.0 : 0.0;
                case ">=":
                    return val >= right ? 1.0 : 0.0;
                case "<=":
                    return val <= right ? 1.0 : 0.0;
                case "==":
                    return Math.abs(val - right) < 0.000001 ? 1.0 : 0.0;
                case "!=":
                    return Math.abs(val - right) >= 0.000001 ? 1.0 : 0.0;
            }
        }
        return val;
    }

    private double parseAdditive() {
        double val = parseMultiplicative();
        while (true) {
            Token next = peek();
            if (next != null && next.type == Token.Type.SYMBOL && (next.value.equals("+") || next.value.equals("-"))) {
                Token op = consume();
                double right = parseMultiplicative();
                if (op.value.equals("+")) {
                    val += right;
                } else {
                    val -= right;
                }
            } else {
                break;
            }
        }
        return val;
    }

    private double parseMultiplicative() {
        double val = parseUnary();
        while (true) {
            Token next = peek();
            if (next != null && next.type == Token.Type.SYMBOL && (next.value.equals("*") || next.value.equals("/"))) {
                Token op = consume();
                double right = parseUnary();
                if (op.value.equals("*")) {
                    val *= right;
                } else {
                    if (Math.abs(right) < 0.000001) {
                        throw new ArithmeticException("Division by zero in formula evaluation");
                    }
                    val /= right;
                }
            } else {
                break;
            }
        }
        return val;
    }

    private double parseUnary() {
        Token next = peek();
        if (next != null && next.type == Token.Type.SYMBOL && next.value.equals("-")) {
            consume();
            return -parseUnary();
        } else if (next != null && next.type == Token.Type.SYMBOL && next.value.equals("+")) {
            consume();
            return parseUnary();
        }
        return parsePrimary();
    }

    private double parsePrimary() {
        Token t = consume();
        if (t.type == Token.Type.NUMBER) {
            return Double.parseDouble(t.value);
        }

        if (t.type == Token.Type.SYMBOL && t.value.equals("(")) {
            double val = parseExpression();
            matchSymbol(")");
            return val;
        }

        if (t.type == Token.Type.IDENTIFIER) {
            Token next = peek();
            if (next != null && next.type == Token.Type.SYMBOL && next.value.equals("(")) {
                // Function Call
                consume(); // consume '('
                String func = t.value.toUpperCase();
                switch (func) {
                    case "IF": {
                        double cond = parseExpression();
                        matchSymbol(",");
                        double trueVal = parseExpression();
                        matchSymbol(",");
                        double falseVal = parseExpression();
                        matchSymbol(")");
                        return Math.abs(cond) >= 0.000001 ? trueVal : falseVal;
                    }
                    case "MIN": {
                        double minVal = parseExpression();
                        while (true) {
                            Token check = peek();
                            if (check != null && check.type == Token.Type.SYMBOL && check.value.equals(",")) {
                                consume(); // consume ','
                                minVal = Math.min(minVal, parseExpression());
                            } else {
                                break;
                            }
                        }
                        matchSymbol(")");
                        return minVal;
                    }
                    case "MAX": {
                        double maxVal = parseExpression();
                        while (true) {
                            Token check = peek();
                            if (check != null && check.type == Token.Type.SYMBOL && check.value.equals(",")) {
                                consume(); // consume ','
                                maxVal = Math.max(maxVal, parseExpression());
                            } else {
                                break;
                            }
                        }
                        matchSymbol(")");
                        return maxVal;
                    }
                    case "SUM": {
                        double sumVal = parseExpression();
                        while (true) {
                            Token check = peek();
                            if (check != null && check.type == Token.Type.SYMBOL && check.value.equals(",")) {
                                consume(); // consume ','
                                sumVal += parseExpression();
                            } else {
                                break;
                            }
                        }
                        matchSymbol(")");
                        return sumVal;
                    }
                    case "ROUND": {
                        double a = parseExpression();
                        int scale = 0;
                        Token check = peek();
                        if (check != null && check.type == Token.Type.SYMBOL && check.value.equals(",")) {
                            consume(); // consume ','
                            scale = (int) parseExpression();
                        }
                        matchSymbol(")");
                        BigDecimal bd = BigDecimal.valueOf(a).setScale(scale, RoundingMode.HALF_UP);
                        return bd.doubleValue();
                    }
                    case "CEIL": {
                        double a = parseExpression();
                        matchSymbol(")");
                        return Math.ceil(a);
                    }
                    case "FLOOR": {
                        double a = parseExpression();
                        matchSymbol(")");
                        return Math.floor(a);
                    }
                    case "ABS": {
                        double a = parseExpression();
                        matchSymbol(")");
                        return Math.abs(a);
                    }
                    default:
                        throw new IllegalArgumentException("Unknown function name: " + func);
                }
            } else {
                // Variable Lookup
                String varName = t.value;
                BigDecimal val = context.get(varName);
                if (val == null) {
                    // Try case-insensitive lookup
                    for (Map.Entry<String, BigDecimal> entry : context.entrySet()) {
                        if (entry.getKey().equalsIgnoreCase(varName)) {
                            val = entry.getValue();
                            break;
                        }
                    }
                }
                if (val == null) {
                    if (isValidation) {
                        return 1.0;
                    }
                    throw new IllegalArgumentException("Undefined variable '" + varName + "' in formula context");
                }
                return val.doubleValue();
            }
        }

        throw new IllegalArgumentException("Unexpected token in primary parsing: " + t);
    }
}
