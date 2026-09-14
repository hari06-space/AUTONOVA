package com.autonoma.erp.modules.platform.dbquery.service;

import com.autonoma.erp.modules.platform.dbquery.dto.DbQueryRequest;
import com.autonoma.erp.modules.platform.dbquery.dto.DbQueryResponse;
import com.autonoma.erp.modules.platform.dbquery.dto.DbQueryResultDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.Statement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DbQueryService {

    @Autowired
    private JdbcTemplate jdbcTemplate;


    public List<String> getAllTableNames() {
        String query = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME";
        List<Map<String, Object>> results = jdbcTemplate.queryForList(query);
        return results.stream()
                .map(row -> (String) row.get("TABLE_NAME"))
                .collect(Collectors.toList());
    }

    public Map<String, List<Map<String, Object>>> getTablesAndColumns() {
        String query = "SELECT t.name AS TABLE_NAME, c.name AS COLUMN_NAME, type_name(c.user_type_id) + CASE WHEN type_name(c.user_type_id) IN ('varchar', 'nvarchar', 'char', 'nchar') THEN '(' + CASE WHEN c.max_length = -1 THEN 'MAX' ELSE CAST(CASE WHEN type_name(c.user_type_id) LIKE 'n%' THEN c.max_length / 2 ELSE c.max_length END AS VARCHAR) END + ')' ELSE '' END AS DATA_TYPE, CAST(CASE WHEN EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id WHERE ic.object_id = c.object_id AND ic.column_id = c.column_id AND i.is_primary_key = 1) THEN 1 ELSE 0 END AS BIT) AS IS_PRIMARY_KEY, CAST(CASE WHEN fk.parent_object_id IS NOT NULL THEN 1 ELSE 0 END AS BIT) AS IS_FOREIGN_KEY, CAST(CASE WHEN EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id WHERE ic.object_id = c.object_id AND ic.column_id = c.column_id AND i.is_primary_key = 0) THEN 1 ELSE 0 END AS BIT) AS IS_INDEXED, CAST(CASE WHEN c.is_nullable = 0 THEN 1 ELSE 0 END AS BIT) AS IS_NOT_NULL, OBJECT_NAME(fk.referenced_object_id) AS REFERENCED_TABLE, ref_c.name AS REFERENCED_COLUMN FROM sys.tables t JOIN sys.columns c ON t.object_id = c.object_id LEFT JOIN sys.foreign_key_columns fk ON fk.parent_object_id = c.object_id AND fk.parent_column_id = c.column_id LEFT JOIN sys.columns ref_c ON fk.referenced_object_id = ref_c.object_id AND fk.referenced_column_id = ref_c.column_id ORDER BY t.name, c.column_id";
        
        List<Map<String, Object>> results = jdbcTemplate.queryForList(query);
        Map<String, List<Map<String, Object>>> tableColumns = new LinkedHashMap<>();
        
        for (Map<String, Object> row : results) {
            String tableName = (String) row.get("TABLE_NAME");
            Map<String, Object> colDetails = new LinkedHashMap<>();
            colDetails.put("name", row.get("COLUMN_NAME"));
            colDetails.put("type", row.get("DATA_TYPE"));
            colDetails.put("isPk", Boolean.TRUE.equals(row.get("IS_PRIMARY_KEY")));
            colDetails.put("isFk", Boolean.TRUE.equals(row.get("IS_FOREIGN_KEY")));
            colDetails.put("isIndexed", Boolean.TRUE.equals(row.get("IS_INDEXED")));
            colDetails.put("isNotNull", Boolean.TRUE.equals(row.get("IS_NOT_NULL")));
            colDetails.put("refTable", row.get("REFERENCED_TABLE"));
            colDetails.put("refCol", row.get("REFERENCED_COLUMN"));
            
            tableColumns.computeIfAbsent(tableName, k -> new ArrayList<>()).add(colDetails);
        }
        return tableColumns;
    }

    @Autowired
    private com.autonoma.erp.modules.platform.dbquery.repository.DbSavedQueryRepository dbSavedQueryRepository;

    public com.autonoma.erp.modules.platform.dbquery.entity.DbSavedQuery saveQuery(String queryName, String queryText, String userId) {
        com.autonoma.erp.modules.platform.dbquery.entity.DbSavedQuery savedQuery = new com.autonoma.erp.modules.platform.dbquery.entity.DbSavedQuery();
        savedQuery.setQueryName(queryName);
        savedQuery.setQueryText(queryText);
        savedQuery.setCreatedBy(userId);
        return dbSavedQueryRepository.save(savedQuery);
    }

    public List<com.autonoma.erp.modules.platform.dbquery.entity.DbSavedQuery> getSavedQueries(String userId) {
        return dbSavedQueryRepository.findByCreatedUserAndIsActiveTrueOrderByIdDesc(userId);
    }

    public void deleteSavedQuery(Integer id, String userId) {
        com.autonoma.erp.modules.platform.dbquery.entity.DbSavedQuery query =
            dbSavedQueryRepository.findByIdAndCreatedUserAndIsActiveTrue(id, userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Query not found or access denied"));
        query.setIsActive(false);
        dbSavedQueryRepository.save(query);
    }

    public DbQueryResponse executeQuery(String sql) {
        try {
            return jdbcTemplate.execute((ConnectionCallback<DbQueryResponse>) conn -> {
                try (Statement stmt = conn.createStatement()) {
                    boolean hasResults = stmt.execute(sql);
                    List<DbQueryResultDto> resultsList = new ArrayList<>();
                    
                    while (true) {
                        if (hasResults) {
                            try (ResultSet rs = stmt.getResultSet()) {
                                ResultSetMetaData meta = rs.getMetaData();
                                int colCount = meta.getColumnCount();
                                List<String> columns = new ArrayList<>();
                                for (int i = 1; i <= colCount; i++) {
                                    columns.add(meta.getColumnLabel(i));
                                }
                                List<Map<String, Object>> data = new ArrayList<>();
                                while (rs.next()) {
                                    Map<String, Object> row = new LinkedHashMap<>();
                                    for (int i = 1; i <= colCount; i++) {
                                        String colName = meta.getColumnLabel(i);
                                        row.put(colName, rs.getObject(i));
                                    }
                                    data.add(row);
                                }
                                resultsList.add(new DbQueryResultDto(true, data, columns, 0));
                            }
                        } else {
                            int updateCount = stmt.getUpdateCount();
                            if (updateCount == -1) {
                                break;
                            }
                            resultsList.add(new DbQueryResultDto(false, null, null, updateCount));
                        }
                        hasResults = stmt.getMoreResults();
                    }
                    
                    if (resultsList.isEmpty()) {
                        return new DbQueryResponse(true, "Query executed successfully.", null, 0, null, resultsList);
                    }
                    
                    DbQueryResultDto first = resultsList.get(0);
                    if (first.isSelect()) {
                        return new DbQueryResponse(true, "Query executed successfully.", first.getData(), 0, first.getColumns(), resultsList);
                    } else {
                        return new DbQueryResponse(true, "Query executed successfully. " + first.getRowsAffected() + " rows affected.", null, first.getRowsAffected(), null, resultsList);
                    }
                }
            });
        } catch (Exception e) {
            return new DbQueryResponse(false, e.getMessage(), null, 0, null, null);
        }
    }
}


