package com.autonoma.erp.service.admin;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class DynamicQueryBuilderService {

    @Autowired
    private EntityManager entityManager;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> executeQuery(String entityName, String selectedFieldsJson, String filterJson) {
        try {
            // 1. Parse selected fields
            List<Map<String, String>> selectedFields = objectMapper.readValue(selectedFieldsJson, 
                    new TypeReference<List<Map<String, String>>>() {});
            
            if (selectedFields == null || selectedFields.isEmpty()) {
                throw new IllegalArgumentException("No fields selected for query.");
            }

            // 2. Build JPQL Select Clause
            StringBuilder jpql = new StringBuilder("SELECT ");
            for (int i = 0; i < selectedFields.size(); i++) {
                String fieldName = selectedFields.get(i).get("fieldName");
                jpql.append("e.").append(fieldName);
                if (i < selectedFields.size() - 1) {
                    jpql.append(", ");
                }
            }
            
            jpql.append(" FROM ").append(entityName).append(" e WHERE 1=1 ");
            
            // 3. Parse and append filters
            Map<String, Object> params = new HashMap<>();
            if (filterJson != null && !filterJson.trim().isEmpty() && !filterJson.equals("[]")) {
                List<Map<String, Object>> filters = objectMapper.readValue(filterJson, 
                        new TypeReference<List<Map<String, Object>>>() {});
                
                int paramCounter = 0;
                for (Map<String, Object> filter : filters) {
                    String field = (String) filter.get("field");
                    String op = (String) filter.get("op");
                    Object val = filter.get("value");
                    
                    if (field == null || op == null) continue;
                    
                    jpql.append(" AND ");
                    paramCounter = appendFilterJpql(jpql, field, op, val, paramCounter, params);
                }
            }
            
            // 4. Create and parameterize Query
            Query query = entityManager.createQuery(jpql.toString());
            for (Map.Entry<String, Object> entry : params.entrySet()) {
                query.setParameter(entry.getKey(), entry.getValue());
            }
            
            // 5. Run and fetch results
            List<Object> rawResults = query.getResultList();
            List<Map<String, Object>> results = new ArrayList<>();
            
            for (Object rowObj : rawResults) {
                Map<String, Object> rowMap = new LinkedHashMap<>();
                if (selectedFields.size() == 1) {
                    String fieldName = selectedFields.get(0).get("fieldName");
                    String customHeader = selectedFields.get(0).getOrDefault("customHeader", fieldName);
                    if (customHeader == null || customHeader.trim().isEmpty()) {
                        customHeader = fieldName;
                    }
                    rowMap.put(customHeader, rowObj);
                } else {
                    Object[] row = (Object[]) rowObj;
                    for (int i = 0; i < selectedFields.size(); i++) {
                        String fieldName = selectedFields.get(i).get("fieldName");
                        String customHeader = selectedFields.get(i).getOrDefault("customHeader", fieldName);
                        if (customHeader == null || customHeader.trim().isEmpty()) {
                            customHeader = fieldName;
                        }
                        rowMap.put(customHeader, row[i]);
                    }
                }
                results.add(rowMap);
            }
            
            return results;
        } catch (Exception e) {
            throw new RuntimeException("Failed to build or execute dynamic query: " + e.getMessage(), e);
        }
    }

    private int appendFilterJpql(StringBuilder jpql, String field, String op, Object val, int counter, Map<String, Object> params) {
        String paramName = "p" + counter;
        switch (op.toUpperCase()) {
            case "EQUAL":
                jpql.append("e.").append(field).append(" = :").append(paramName);
                params.put(paramName, val);
                counter++;
                break;
            case "NOT_EQUAL":
                jpql.append("e.").append(field).append(" != :").append(paramName);
                params.put(paramName, val);
                counter++;
                break;
            case "GREATER_THAN":
                jpql.append("e.").append(field).append(" > :").append(paramName);
                params.put(paramName, val);
                counter++;
                break;
            case "LESS_THAN":
                jpql.append("e.").append(field).append(" < :").append(paramName);
                params.put(paramName, val);
                counter++;
                break;
            case "CONTAINS":
                jpql.append("e.").append(field).append(" LIKE :").append(paramName);
                params.put(paramName, "%" + val + "%");
                counter++;
                break;
            case "STARTS_WITH":
                jpql.append("e.").append(field).append(" LIKE :").append(paramName);
                params.put(paramName, val + "%");
                counter++;
                break;
            case "ENDS_WITH":
                jpql.append("e.").append(field).append(" LIKE :").append(paramName);
                params.put(paramName, "%" + val);
                counter++;
                break;
            case "IS_NULL":
                jpql.append("e.").append(field).append(" IS NULL");
                break;
            case "IS_NOT_NULL":
                jpql.append("e.").append(field).append(" IS NOT NULL");
                break;
            case "BETWEEN":
                String paramName2 = "p" + (counter + 1);
                jpql.append("e.").append(field).append(" BETWEEN :").append(paramName).append(" AND :").append(paramName2);
                if (val instanceof List && ((List<?>) val).size() >= 2) {
                    params.put(paramName, ((List<?>) val).get(0));
                    params.put(paramName2, ((List<?>) val).get(1));
                } else {
                    params.put(paramName, val);
                    params.put(paramName2, val);
                }
                counter += 2;
                break;
            default:
                jpql.append("e.").append(field).append(" = :").append(paramName);
                params.put(paramName, val);
                counter++;
                break;
        }
        return counter;
    }
}
