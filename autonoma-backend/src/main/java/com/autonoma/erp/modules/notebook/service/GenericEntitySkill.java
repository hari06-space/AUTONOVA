package com.autonoma.erp.modules.notebook.service;

import com.autonoma.erp.modules.notebook.dto.*;
import com.autonoma.erp.modules.notebook.entity.BosAiEntity;
import com.autonoma.erp.modules.notebook.entity.BosAiEntityField;
import com.autonoma.erp.modules.notebook.entity.BosAiOperation;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Generic domain skill for entities managed completely by metadata.
 * Requires zero Java code to add a new entity to the AI platform.
 */
public class GenericEntitySkill implements BosEntitySkill {

    private final BosAiEntity entity;
    private final EntityRegistryService registryService;
    private final BusinessObjectLoader loader;
    private final DataSource dataSource;

    public GenericEntitySkill(BosAiEntity entity, EntityRegistryService registryService, BusinessObjectLoader loader, DataSource dataSource) {
        this.entity = entity;
        this.registryService = registryService;
        this.loader = loader;
        this.dataSource = dataSource;
    }

    @Override
    public SkillManifest manifest() {
        // Build manifest dynamically from DB configuration
        List<OperationType> ops = registryService.getOperations(entity.getEntityCode()).stream()
            .map(o -> {
                try { return OperationType.valueOf(o.getOperationCode().toUpperCase()); }
                catch (Exception e) { return OperationType.LIST; }
            })
            .collect(Collectors.toList());

        List<String> synonyms = entity.getSynonyms() != null 
            ? List.of(entity.getSynonyms().split("\\|")) 
            : List.of(entity.getEntityCode().toLowerCase());

        return new SkillManifest(
            entity.getEntityCode(),
            entity.getErpModule(),
            entity.getPageCodes() != null ? List.of(entity.getPageCodes().split(",")) : List.of(),
            ops,
            PermissionScope.valueOf(entity.getDefaultScope()),
            synonyms,
            List.of("list " + entity.getDisplayName().toLowerCase())
        );
    }

    @Override
    public ToolResult execute(ToolRequest request) {
        // Enforce page authorization check
        boolean hasModule = request.permissionContext().canAccessModule(entity.getErpModule());
        if (!hasModule && !request.permissionContext().isPrivileged()) {
            return ToolResult.denied(entity.getEntityCode(), entity.getDisplayName());
        }

        switch (request.operation()) {
            case DETAIL -> {
                String queryStr = request.parameters().getOrDefault("query", "").toString();
                String key = extractKey(queryStr);
                if (key.isEmpty()) {
                    return ToolResult.error("DETAIL operation requires an identifier key.");
                }
                // Determine what child collections to expand dynamically from DB relations
                String[] expansions = registryService.getRelationships(entity.getEntityCode()).stream()
                    .map(r -> r.getExpandName())
                    .filter(name -> name != null && !name.isEmpty())
                    .toArray(String[]::new);

                Optional<BusinessObject> obj = loader.load(entity.getEntityCode(), key, request.permissionContext(), expansions);
                if (obj.isEmpty()) {
                    return ToolResult.noData(entity.getEntityCode(), "DETAIL");
                }
                return ToolResult.of(entity.getEntityCode(), "DETAIL", entity.getDisplayName() + " detail report", obj.get());
            }

            case COUNT -> {
                String sql = "SELECT COUNT(*) FROM " + entity.getDbTable() + " WITH (NOLOCK)";
                try (Connection conn = dataSource.getConnection();
                     PreparedStatement ps = conn.prepareStatement(sql);
                     ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        int count = rs.getInt(1);
                        return ToolResult.count(entity.getEntityCode(), "COUNT", count, null);
                    }
                } catch (Exception e) {
                    return ToolResult.error("Failed to execute COUNT query: " + e.getMessage());
                }
                return ToolResult.noData(entity.getEntityCode(), "COUNT");
            }

            case LIST, SEARCH -> {
                // Get visible fields
                List<BosAiEntityField> fields = registryService.getFields(entity.getEntityCode());
                List<String> cols = fields.stream()
                    .filter(f -> "Y".equals(f.getVisible()))
                    .map(f -> f.getDbColumn() != null ? f.getDbColumn() : f.getFieldCode())
                    .collect(Collectors.toList());

                if (cols.isEmpty()) {
                    cols.add(entity.getIdColumn() != null ? entity.getIdColumn() : "ID");
                }

                StringBuilder sql = new StringBuilder("SELECT TOP 20 ");
                sql.append(String.join(", ", cols)).append(" FROM ").append(entity.getDbTable()).append(" WITH (NOLOCK)");

                // If SEARCH, build WHERE clause for searchable fields
                String queryStr = request.parameters().getOrDefault("query", "").toString();
                String keyword = extractKey(queryStr);
                if (request.operation() == OperationType.SEARCH && !keyword.isEmpty()) {
                    List<String> searchableCols = fields.stream()
                        .filter(f -> "Y".equals(f.getSearchable()))
                        .map(f -> f.getDbColumn() != null ? f.getDbColumn() : f.getFieldCode())
                        .collect(Collectors.toList());

                    if (!searchableCols.isEmpty()) {
                        sql.append(" WHERE ");
                        List<String> filters = new ArrayList<>();
                        for (String c : searchableCols) {
                            filters.add(c + " LIKE ?");
                        }
                        sql.append(String.join(" OR ", filters));
                    }
                }

                try (Connection conn = dataSource.getConnection();
                     PreparedStatement ps = conn.prepareStatement(sql.toString())) {
                    
                    if (request.operation() == OperationType.SEARCH && !keyword.isEmpty()) {
                        List<String> searchableCols = fields.stream()
                            .filter(f -> "Y".equals(f.getSearchable()))
                            .map(f -> f.getDbColumn() != null ? f.getDbColumn() : f.getFieldCode())
                            .collect(Collectors.toList());
                        for (int i = 1; i <= searchableCols.size(); i++) {
                            ps.setString(i, "%" + keyword + "%");
                        }
                    }

                    try (ResultSet rs = ps.executeQuery()) {
                        StringBuilder sb = new StringBuilder();
                        int rows = 0;
                        while (rs.next()) {
                            rows++;
                            sb.append(String.format("[%d] ", rows));
                            for (String col : cols) {
                                sb.append(col).append("=").append(rs.getObject(col)).append(" | ");
                            }
                            sb.append("\n");
                        }
                        if (rows == 0) {
                            return ToolResult.noData(entity.getEntityCode(), request.operation().name());
                        }
                        return ToolResult.of(entity.getEntityCode(), request.operation().name(), entity.getDisplayName() + " List", sb.toString());
                    }
                } catch (Exception e) {
                    return ToolResult.error("Failed to execute LIST query: " + e.getMessage());
                }
            }

            default -> {
                return ToolResult.error("Operation " + request.operation() + " not implemented for generic entity skill.");
            }
        }
    }

    private String extractKey(String query) {
        if (query == null || query.isBlank()) return "";
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\b(\\d+)\\b").matcher(query);
        if (m.find()) return m.group(1);
        
        java.util.Set<String> stopwords = java.util.Set.of(
            "show", "get", "what", "who", "checklist", "employee", "customer",
            "machine", "audit", "detail", "is", "for", "the", "this", "find",
            "search", "list", "view", "report", "info", "information", "status",
            "details", "pending", "completed", "closed", "open", "active", "inactive",
            "yaru", "yar", "iruka", "irukanga", "la", "me", "please", "with", "from",
            "in", "at", "on", "by", "of", "and", "or", "a", "an", "to"
        );
        
        String bestWord = "";
        java.util.regex.Matcher m2 = java.util.regex.Pattern.compile("\\b([A-Za-z0-9\\-]+)\\b").matcher(query);
        while (m2.find()) {
            String word = m2.group(1);
            String wLower = word.toLowerCase();
            if (stopwords.contains(wLower)) {
                continue;
            }
            if (word.matches(".*\\d.*") || word.equals(word.toUpperCase())) {
                return word;
            }
            if (word.length() > bestWord.length()) {
                bestWord = word;
            }
        }
        return bestWord;
    }
}
