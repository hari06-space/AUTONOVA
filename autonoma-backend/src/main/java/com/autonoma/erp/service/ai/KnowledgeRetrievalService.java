package com.autonoma.erp.service.ai;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class KnowledgeRetrievalService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Retrieves relevant application knowledge based on module and keywords.
     * This acts as a lightweight SQL-based RAG.
     */
    public String retrieveContext(String module, List<String> keywords) {
        StringBuilder query = new StringBuilder("SELECT DESCRIPTION FROM BOS_AI_KNOWLEDGE WHERE 1=1");
        List<Object> params = new ArrayList<>();
        
        if (module != null && !module.equals("GENERAL")) {
            query.append(" AND MODULE_NAME = ?");
            params.add(module);
        }

        // Extremely simple keyword matching for "Poor Man's RAG"
        if (keywords != null && !keywords.isEmpty()) {
            query.append(" AND (");
            for (int i = 0; i < keywords.size(); i++) {
                if (i > 0) query.append(" OR ");
                query.append("(DESCRIPTION LIKE ? OR TABLE_NAME LIKE ?)");
                String pattern = "%" + keywords.get(i) + "%";
                params.add(pattern);
                params.add(pattern);
            }
            query.append(")");
        }

        try {
            List<String> results = jdbcTemplate.query(
                query.toString(),
                (rs, rowNum) -> rs.getString("DESCRIPTION"),
                params.toArray()
            );

            if (results.isEmpty()) {
                // Fallback: Just return everything in the module if keyword match fails
                if (module != null && !module.equals("GENERAL")) {
                    results = jdbcTemplate.query(
                        "SELECT DESCRIPTION FROM BOS_AI_KNOWLEDGE WHERE MODULE_NAME = ? AND TABLE_NAME LIKE 'FLOW_DOC_%'",
                        (rs, rowNum) -> rs.getString("DESCRIPTION"),
                        module
                    );
                }
            }
            
            if (results.isEmpty()) {
                // Final fallback: fetch general navigation info
                results = jdbcTemplate.query(
                    "SELECT DESCRIPTION FROM BOS_AI_KNOWLEDGE WHERE MODULE_NAME = 'GENERAL' AND TABLE_NAME LIKE 'FLOW_DOC_%'",
                    (rs, rowNum) -> rs.getString("DESCRIPTION")
                );
            }

            return String.join("\n\n---\n\n", results);

        } catch (Exception e) {
            System.err.println("Knowledge retrieval failed: " + e.getMessage());
            return "No relevant application flow documentation found.";
        }
    }
}
