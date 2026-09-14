package com.autonoma.erp.modules.notebook.service;

import com.autonoma.erp.modules.notebook.dto.BusinessObject;
import com.autonoma.erp.modules.notebook.entity.BosAiEntity;
import com.autonoma.erp.modules.notebook.entity.BosAiEntityField;
import com.autonoma.erp.modules.notebook.entity.BosAiRelationship;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.util.*;

/**
 * Generic object loader for the Business Capability Platform.
 * Loads business objects and their relationships dynamically based on metadata.
 */
@Service
public class BusinessObjectLoader {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private EntityRegistryService entityRegistryService;

    @Autowired
    private com.autonoma.erp.service.admin.BosUserPageAuthService pageAuthService;

    /**
     * Loads a single BusinessObject by its ID or human-readable identifier.
     */
    public Optional<BusinessObject> load(String entityCode, Object key, com.autonoma.erp.modules.notebook.dto.AiPermissionContext permCtx, String... expands) {
        BosAiEntity entity = entityRegistryService.getEntity(entityCode).orElse(null);
        if (entity == null || entity.getDbTable() == null) {
            return Optional.empty();
        }

        List<BosAiEntityField> fields = entityRegistryService.getFields(entityCode);
        if (fields.isEmpty()) {
            return Optional.empty();
        }

        // Build list of columns to select
        StringBuilder selectCols = new StringBuilder();
        List<String> colNames = new ArrayList<>();
        for (BosAiEntityField f : fields) {
            if ("Y".equals(f.getVisible())) {
                String dbCol = f.getDbColumn() != null ? f.getDbColumn() : f.getFieldCode();
                colNames.add(dbCol);
                if (selectCols.length() > 0) selectCols.append(", ");
                selectCols.append(dbCol);
            }
        }
        // Always include ID column
        String idCol = entity.getIdColumn() != null ? entity.getIdColumn() : "ID";
        if (!colNames.contains(idCol)) {
            if (selectCols.length() > 0) selectCols.append(", ");
            selectCols.append(idCol);
        }

        // Check if entity has division or company columns for RLS filtering
        boolean hasDivisionCol = false;
        boolean hasCompanyCol = false;
        for (BosAiEntityField f : fields) {
            String colName = f.getDbColumn() != null ? f.getDbColumn() : f.getFieldCode();
            if ("DIVISION_ID".equalsIgnoreCase(colName)) hasDivisionCol = true;
            if ("COMPANY_ID".equalsIgnoreCase(colName)) hasCompanyCol = true;
        }

        // Construct query: SELECT [cols] FROM [table] WITH (NOLOCK) WHERE ([id_col] = ? OR [identifier_col] = ?)
        String table = entity.getDbTable();
        String identifierCol = entity.getIdentifierCol();

        StringBuilder query = new StringBuilder("SELECT ");
        query.append(selectCols).append(" FROM ").append(table).append(" WITH (NOLOCK) WHERE (");
        query.append(idCol).append(" = ? ");
        if (identifierCol != null && !identifierCol.isBlank()) {
            query.append(" OR ").append(identifierCol).append(" = ? ");
        }
        query.append(")");

        if (hasDivisionCol && permCtx != null && permCtx.divisionId() != null) {
            query.append(" AND DIVISION_ID = ? ");
        }
        if (hasCompanyCol && permCtx != null && permCtx.companyId() != null) {
            query.append(" AND COMPANY_ID = ? ");
        }

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(query.toString())) {

            ps.setQueryTimeout(5); // Enforce execution timeout to prevent resource starvation

            // Bind parameters
            int paramIdx = 1;
            ps.setString(paramIdx++, key.toString());
            if (identifierCol != null && !identifierCol.isBlank()) {
                ps.setString(paramIdx++, key.toString());
            }
            if (hasDivisionCol && permCtx != null && permCtx.divisionId() != null) {
                ps.setObject(paramIdx++, permCtx.divisionId());
            }
            if (hasCompanyCol && permCtx != null && permCtx.companyId() != null) {
                ps.setObject(paramIdx++, permCtx.companyId());
            }

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Object actualId = rs.getObject(idCol);
                    BusinessObject obj = new BusinessObject(entityCode, actualId);

                    // Map fields with security filtering
                    for (BosAiEntityField f : fields) {
                        if ("Y".equals(f.getVisible())) {
                            // Strip sensitive fields if user lacks specific page access
                            if ("Y".equals(f.getSensitive()) && f.getRequiredPage() != null && !f.getRequiredPage().isBlank()) {
                                if (permCtx == null || !pageAuthService.hasPermission(permCtx.userId(), f.getRequiredPage(), "read")) {
                                    continue; // Unauthorized: omit this sensitive field from response
                                }
                            }
                            String dbCol = f.getDbColumn() != null ? f.getDbColumn() : f.getFieldCode();
                            Object val = rs.getObject(dbCol);
                            obj.addField(f.getFieldCode(), val);
                        }
                    }

                    // Handle expansions (initiate loop check set)
                    if (expands != null && expands.length > 0) {
                        Set<String> visited = new HashSet<>();
                        visited.add(entityCode.toUpperCase());
                        loadExpansions(conn, obj, entityCode, actualId, permCtx, expands, visited);
                    }

                    return Optional.of(obj);
                }
            }
        } catch (Exception e) {
            System.err.println(String.format(
                "[BOS-AI][Loader] Error loading entity %s key=%s. Error: %s",
                entityCode, key, e.getMessage()
            ));
        }

        return Optional.empty();
    }

    private void loadExpansions(Connection conn, BusinessObject parentObj, String entityCode, Object parentId, 
                                com.autonoma.erp.modules.notebook.dto.AiPermissionContext permCtx, String[] expands, Set<String> visited) {
        List<BosAiRelationship> relations = entityRegistryService.getRelationships(entityCode);
        
        // Group expansions by prefix: "ORDERS.INVOICES" -> direct expand "ORDERS", child expand "INVOICES"
        Map<String, List<String>> groupedExpands = new HashMap<>();
        for (String exp : expands) {
            if (exp == null || exp.isBlank()) continue;
            int dotIdx = exp.indexOf('.');
            if (dotIdx > 0) {
                String parentPart = exp.substring(0, dotIdx).toUpperCase();
                String childPart = exp.substring(dotIdx + 1);
                groupedExpands.computeIfAbsent(parentPart, k -> new ArrayList<>()).add(childPart);
            } else {
                groupedExpands.computeIfAbsent(exp.toUpperCase(), k -> new ArrayList<>());
            }
        }

        for (BosAiRelationship rel : relations) {
            String expandName = rel.getExpandName();
            if (expandName == null) continue;
            String expandUpper = expandName.toUpperCase();
            if (!groupedExpands.containsKey(expandUpper)) continue;

            // Load child entity metadata
            String childEntityCode = rel.getToEntity();
            
            // Loop check: if child entity is already visited in this path, abort to prevent stack overflow
            if (visited.contains(childEntityCode.toUpperCase())) {
                continue;
            }

            BosAiEntity childEntity = entityRegistryService.getEntity(childEntityCode).orElse(null);
            
            String childTable = childEntity != null ? childEntity.getDbTable() : null;
            if (childTable == null) {
                childTable = childEntityCode;
            }

            String joinCol = rel.getJoinColumn();
            if (joinCol == null) continue;

            List<BosAiEntityField> childFields = entityRegistryService.getFields(childEntityCode);
            
            // RLS checking for child table
            boolean hasChildDivision = false;
            boolean hasChildCompany = false;
            for (BosAiEntityField f : childFields) {
                String colName = f.getDbColumn() != null ? f.getDbColumn() : f.getFieldCode();
                if ("DIVISION_ID".equalsIgnoreCase(colName)) hasChildDivision = true;
                if ("COMPANY_ID".equalsIgnoreCase(colName)) hasChildCompany = true;
            }

            // Construct child query: SELECT TOP [limit] * FROM [childTable] WITH (NOLOCK) WHERE [joinCol] = ? [AND RLS filters]
            StringBuilder sql = new StringBuilder("SELECT ");
            int maxRows = rel.getMaxRows() != null ? rel.getMaxRows() : 20; // Default limit clamp to prevent OOM
            sql.append("TOP ").append(maxRows).append(" * FROM ").append(childTable).append(" WITH (NOLOCK) WHERE ").append(joinCol).append(" = ?");

            if (hasChildDivision && permCtx != null && permCtx.divisionId() != null) {
                sql.append(" AND DIVISION_ID = ?");
            }
            if (hasChildCompany && permCtx != null && permCtx.companyId() != null) {
                sql.append(" AND COMPANY_ID = ?");
            }

            try (PreparedStatement ps = conn.prepareStatement(sql.toString())) {
                ps.setQueryTimeout(5); // Enforce timeout on nested query execution
                
                int paramIdx = 1;
                ps.setObject(paramIdx++, parentId);
                if (hasChildDivision && permCtx != null && permCtx.divisionId() != null) {
                    ps.setObject(paramIdx++, permCtx.divisionId());
                }
                if (hasChildCompany && permCtx != null && permCtx.companyId() != null) {
                    ps.setObject(paramIdx++, permCtx.companyId());
                }

                try (ResultSet rs = ps.executeQuery()) {
                    ResultSetMetaData md = rs.getMetaData();
                    int cols = md.getColumnCount();
                    List<BusinessObject> list = new ArrayList<>();
                    
                    int count = 0;
                    while (rs.next()) {
                        count++;
                        Object childId = null;
                        try { childId = rs.getObject("ID"); } catch (Exception e) {}
                        if (childId == null) childId = count;

                        BusinessObject childObj = new BusinessObject(childEntityCode, childId);
                        
                        // Map fields with security filtering (if field metadata exists)
                        if (!childFields.isEmpty()) {
                            for (BosAiEntityField f : childFields) {
                                if ("Y".equals(f.getVisible())) {
                                    if ("Y".equals(f.getSensitive()) && f.getRequiredPage() != null && !f.getRequiredPage().isBlank()) {
                                        if (permCtx == null || !pageAuthService.hasPermission(permCtx.userId(), f.getRequiredPage(), "read")) {
                                            continue;
                                        }
                                    }
                                    String dbCol = f.getDbColumn() != null ? f.getDbColumn() : f.getFieldCode();
                                    try {
                                        childObj.addField(f.getFieldCode(), rs.getObject(dbCol));
                                    } catch (Exception e) {
                                        // Column might not exist in child table projection
                                    }
                                }
                            }
                        } else {
                            // Fallback to raw metadata mapping when field registry is empty
                            for (int i = 1; i <= cols; i++) {
                                childObj.addField(md.getColumnName(i), rs.getObject(i));
                            }
                        }
                        
                        // Recursive loading for sub-expansions
                        List<String> childExpandsList = groupedExpands.get(expandUpper);
                        if (childExpandsList != null && !childExpandsList.isEmpty()) {
                            String[] childExpands = childExpandsList.toArray(new String[0]);
                            Set<String> nextVisited = new HashSet<>(visited);
                            nextVisited.add(childEntityCode.toUpperCase());
                            loadExpansions(conn, childObj, childEntityCode, childId, permCtx, childExpands, nextVisited);
                        }

                        list.add(childObj);
                    }
                    parentObj.addExpansion(expandName, list);
                }
            } catch (Exception e) {
                System.err.println(String.format(
                    "[BOS-AI][Loader] Expansion failed for relation %s -> %s: %s",
                    entityCode, childEntityCode, e.getMessage()
                ));
            }
        }
    }
}

