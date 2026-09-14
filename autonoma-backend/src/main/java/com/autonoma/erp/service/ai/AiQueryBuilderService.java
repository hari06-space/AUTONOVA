package com.autonoma.erp.service.ai;

import com.autonoma.erp.model.ai.BosAiColumnMetadata;
import com.autonoma.erp.model.ai.BosAiKnowledge;
import com.autonoma.erp.repository.ai.BosAiColumnMetadataRepository;
import com.autonoma.erp.repository.ai.BosAiKnowledgeRepository;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Builds and executes safe ERP data queries for AI responses.
 *
 * Security model:
 * - Only whitelisted tables from BOS_AI_KNOWLEDGE are queryable.
 * - All queries are constructed server-side; no raw SQL from user input.
 * - Column selection uses BOS_AI_COLUMN_METADATA for safe, known columns.
 * - Results are limited to prevent large data dumps.
 */
@Service
public class AiQueryBuilderService {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private BosAiKnowledgeRepository knowledgeRepository;

    @Autowired
    private BosAiColumnMetadataRepository columnMetadataRepository;

    @Autowired
    private GeminiService geminiService;

    private static final int MAX_RESULTS = 50;

    /**
     * Build a query plan from the user's question, then execute it.
     *
     * @param userQuestion The natural language query
     * @param module       The detected module
     * @param userId       The current user (for filtering tenant data)
     * @return QueryResult with data and metadata
     */
    public QueryResult buildAndExecute(String userQuestion, String module, String userId) {
        // 1. Get relevant tables for the module
        List<BosAiKnowledge> knowledgeEntries = module.equalsIgnoreCase("GENERAL")
            ? knowledgeRepository.findByIsActiveTrue()
            : knowledgeRepository.findByModuleNameIgnoreCaseAndIsActiveTrue(module);

        if (knowledgeEntries.isEmpty()) {
            return QueryResult.empty("No data sources available for module: " + module);
        }

        // 2. Ask AI to select the best table and filters based on the question
        String tableSelectionPrompt = buildTableSelectionPrompt(userQuestion, knowledgeEntries, userId);
        String tableDecision = geminiService.generateStructuredResponse(
            "You are an ERP data query planner. Return ONLY JSON.", tableSelectionPrompt);
            
        try {
            java.nio.file.Files.writeString(java.nio.file.Path.of("debug.txt"), "tableDecision: " + tableDecision + "\nprompt: " + tableSelectionPrompt);
        } catch (Exception e) {}
        System.out.println("AiQueryBuilderService - tableDecision: " + tableDecision);

        if (tableDecision != null && tableDecision.startsWith("Error")) {
            return QueryResult.empty(tableDecision);
        }

        String selectedTable = extractJsonString(tableDecision, "table");
        String filterHint    = extractJsonString(tableDecision, "filter");
        String sortHint      = extractJsonString(tableDecision, "sort");

        if (selectedTable == null || selectedTable.isBlank() || selectedTable.equalsIgnoreCase("null")) {
            return QueryResult.empty("Could not identify the relevant data table for your query. AI Response was: " + tableDecision);
        }

        // 3. Verify table is whitelisted
        boolean isWhitelisted = knowledgeEntries.stream()
            .anyMatch(k -> k.getTableName().equalsIgnoreCase(selectedTable));
        if (!isWhitelisted) {
            return QueryResult.empty("Access to table '" + selectedTable + "' is not permitted.");
        }

        // 4. Build safe native SQL using whitelisted columns only
        List<BosAiColumnMetadata> columns = columnMetadataRepository
            .findByTableNameIgnoreCaseAndIsActiveTrue(selectedTable);

        if (columns.isEmpty()) {
            // Fallback: count only
            return executeCountQuery(selectedTable);
        }

        // 5. Execute safe query
        return executeSafeQuery(selectedTable, columns, filterHint, sortHint, userId);
    }

    // ------------------------------------------------------------------
    // Private helpers
    // ------------------------------------------------------------------

    private String buildTableSelectionPrompt(String question, List<BosAiKnowledge> entries, String userId) {
        StringBuilder sb = new StringBuilder();
        sb.append("Current User ID: ").append(userId).append("\n");
        sb.append("User question: ").append(question).append("\n\n");
        sb.append("Available data tables:\n");
        for (BosAiKnowledge k : entries) {
            sb.append("- Table: ").append(k.getTableName())
              .append(", Description: ").append(k.getDescription());
            
            List<BosAiColumnMetadata> columns = columnMetadataRepository
                .findByTableNameIgnoreCaseAndIsActiveTrue(k.getTableName());
            if (!columns.isEmpty()) {
                String colNames = columns.stream()
                    .map(BosAiColumnMetadata::getColumnName)
                    .collect(Collectors.joining(", "));
                sb.append(", Columns: [").append(colNames).append("]");
            }
            sb.append("\n");
        }
        sb.append("\nReturn ONLY a raw JSON object like: {\"table\":\"TABLE_NAME\",\"filter\":\"column='value'\",\"sort\":\"column ASC\"}\n");
        sb.append("DO NOT wrap the response in ```json ``` markdown. Output ONLY the JSON string starting with {.");
        return sb.toString();
    }

    private QueryResult executeSafeQuery(String table, List<BosAiColumnMetadata> columns,
                                         String filterHint, String sortHint, String userId) {
        try {
            // Build SELECT clause from whitelisted columns only
            String selectCols = columns.stream()
                .map(c -> c.getColumnName())
                .collect(Collectors.joining(", "));

            StringBuilder sql = new StringBuilder("SELECT TOP ")
                .append(MAX_RESULTS).append(" ")
                .append(selectCols)
                .append(" FROM ").append(table);

            // Safe filter: only allow IS_ACTIVE/STATUS filters
            if (filterHint != null && !filterHint.isBlank()) {
                // Sanitize: allow alphanumeric, underscore, =, space, digits, single quote, <, >, %, ., -, @
                // To support unicode (e.g., Tamil text), we add \\p{L} for any letter, \\p{N} for any number
                String safeFilter = filterHint.replaceAll("[^\\p{L}\\p{N}_=\\s'<>%\\.\\-@]", "");
                if (!safeFilter.isBlank()) {
                    sql.append(" WHERE ").append(safeFilter);
                }
            }

            if (sortHint != null && !sortHint.isBlank()) {
                String safeSort = sortHint.replaceAll("[^a-zA-Z0-9_ ]", "").trim();
                if (!safeSort.equalsIgnoreCase("DESC") && !safeSort.equalsIgnoreCase("ASC") && !safeSort.isEmpty()) {
                    if (safeSort.toUpperCase().endsWith("DESC") || safeSort.toUpperCase().endsWith("ASC")) {
                        sql.append(" ORDER BY ").append(safeSort);
                    } else {
                        sql.append(" ORDER BY ").append(safeSort).append(" DESC");
                    }
                }
            }

            @SuppressWarnings("unchecked")
            List<Object[]> rows = entityManager.createNativeQuery(sql.toString()).getResultList();

            List<String> headers = columns.stream()
                .map(BosAiColumnMetadata::getBusinessName)
                .collect(Collectors.toList());

            List<List<Object>> data = new ArrayList<>();
            for (Object[] row : rows) {
                data.add(Arrays.asList(row));
            }

            return new QueryResult(true, headers, data, table, rows.size(), null);

        } catch (Exception e) {
            return QueryResult.empty("Failed to retrieve data: " + e.getMessage());
        }
    }

    private QueryResult executeCountQuery(String table) {
        try {
            Object count = entityManager
                .createNativeQuery("SELECT COUNT(*) FROM " + table)
                .getSingleResult();
            return new QueryResult(true, List.of("Count"), List.of(List.of(count)), table, 1, null);
        } catch (Exception e) {
            return QueryResult.empty("Could not count records in " + table);
        }
    }

    private String extractJsonString(String json, String key) {
        try {
            // Find start of JSON object in case there's leading markdown
            int startIdx = json.indexOf('{');
            int endIdx = json.lastIndexOf('}');
            if (startIdx >= 0 && endIdx > startIdx) {
                String cleanJson = json.substring(startIdx, endIdx + 1);
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                mapper.configure(com.fasterxml.jackson.core.JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true);
                mapper.configure(com.fasterxml.jackson.core.JsonParser.Feature.ALLOW_SINGLE_QUOTES, true);
                com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(cleanJson);
                if (root.has(key) && !root.get(key).isNull()) {
                    return root.get(key).asText();
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing JSON: " + e.getMessage());
        }
        
        // Fallback using Regex
        try {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("\"" + key + "\"\\s*:\\s*\"([^\"]+)\"").matcher(json);
            if (m.find()) {
                return m.group(1);
            }
        } catch (Exception e) {}
        
        return null;
    }

    // ------------------------------------------------------------------

    public record QueryResult(
        boolean success,
        List<String> headers,
        List<List<Object>> rows,
        String tableName,
        int rowCount,
        String errorMessage
    ) {
        static QueryResult empty(String message) {
            return new QueryResult(false, List.of(), List.of(), null, 0, message);
        }
    }
}
