package com.autonoma.erp.modules.platform.dbquery.controller;

import com.autonoma.erp.modules.platform.dbquery.dto.DbQueryRequest;
import com.autonoma.erp.modules.platform.dbquery.dto.DbQueryResponse;
import com.autonoma.erp.modules.platform.dbquery.entity.DbSavedQuery;
import com.autonoma.erp.modules.platform.dbquery.service.DbQueryService;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/db-query")
public class DbQueryController {

    @Autowired
    private DbQueryService dbQueryService;

    /**
     * List all available table names in the current schema.
     * Requires AD1240 read permission.
     */
    @GetMapping("/tables")
    @RequirePagePermission(pageCode = "AD1240", action = "read")
    public ResponseEntity<List<String>> getTables() {
        return ResponseEntity.ok(dbQueryService.getAllTableNames());
    }

    /**
     * Retrieve full table + column schema for the current database.
     * Requires AD1240 read permission.
     */
    @GetMapping("/schema")
    @RequirePagePermission(pageCode = "AD1240", action = "read")
    public ResponseEntity<Map<String, List<Map<String, Object>>>> getSchema() {
        return ResponseEntity.ok(dbQueryService.getTablesAndColumns());
    }

    /**
     * Save a named query for later re-use.
     * Requires AD1240 write permission.
     */
    @PostMapping("/saved")
    @RequirePagePermission(pageCode = "AD1240", action = "write")
    public ResponseEntity<DbSavedQuery> saveQuery(@RequestBody Map<String, String> payload) {
        String queryName = payload.get("queryName");
        String queryText = payload.get("queryText");
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(dbQueryService.saveQuery(queryName, queryText, userId));
    }

    /**
     * List saved queries visible to the authenticated user.
     */
    @GetMapping("/saved")
    @RequirePagePermission(pageCode = "AD1240", action = "read")
    public ResponseEntity<List<DbSavedQuery>> getSavedQueries() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(dbQueryService.getSavedQueries(userId));
    }

    /**
     * Delete a saved query owned by the authenticated user.
     * Ownership is validated in the service layer (IDOR protection).
     */
    @DeleteMapping("/saved/{id}")
    @RequirePagePermission(pageCode = "AD1240", action = "delete")
    public ResponseEntity<Void> deleteSavedQuery(@PathVariable Integer id) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        dbQueryService.deleteSavedQuery(id, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Execute arbitrary SQL query.
     * Requires AD1240 write permission.
     */
    @PostMapping("/execute")
    @RequirePagePermission(pageCode = "AD1240", action = "write")
    public ResponseEntity<DbQueryResponse> executeQuery(@RequestBody DbQueryRequest payload) {
        return ResponseEntity.ok(dbQueryService.executeQuery(payload.getQuery()));
    }
}
