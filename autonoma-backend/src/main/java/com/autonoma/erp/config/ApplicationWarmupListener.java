package com.autonoma.erp.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

/**
 * Fires once on startup after all beans are ready.
 * Runs a set of real queries that force:
 *  - HikariCP to open actual connections from the pool
 *  - SQL Server to cache query plans for the most common master-data tables
 *  - JPA metamodel to fully initialize
 *
 * and Employee Master edit pages after a cold server start.
 */
@Component
public class ApplicationWarmupListener implements ApplicationListener<ApplicationReadyEvent> {

    private static final Logger log = LoggerFactory.getLogger(ApplicationWarmupListener.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.service.EmployeeMasterService employeeMasterService;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        log.info("[Warmup] ApplicationReadyEvent received — starting background database warmup...");

        CompletableFuture.runAsync(() -> {
            try {
                long start = System.currentTimeMillis();

                // Sync all manager mappings to fix any numeric employee code collision issues
                try {
                    employeeMasterService.syncAllMappingsFromExistingColumns();
                    log.info("[Warmup] Synchronized employee manager mappings from existing master columns.");
                } catch (Exception e) {
                    log.warn("[Warmup] Failed to sync employee manager mappings: {}", e.getMessage());
                }

                // 1. Force HikariCP to create a real connection
                jdbcTemplate.queryForList("SELECT 1");

                // 2. Warm SQL Server query plan cache for the most-hit master tables
                String[] warmupQueries = {
                    "SELECT TOP 1 id, CODE, TYPE_NAME, STATUS FROM NPD_INVENTORY_TYPE",
                    "SELECT TOP 1 id, GROUP_NAME, STATUS FROM NPD_ITEM_GROUP",
                    "SELECT TOP 1 id, ITEM_TYPE, STATUS FROM NPD_ITEM_TYPE",
                    "SELECT TOP 1 id, SUB_TYPE, STATUS FROM NPD_ITEM_SUBTYPE",
                    "SELECT TOP 1 id, OEM_SHORT_NAME, STATUS FROM NPD_OEM",
                    "SELECT TOP 1 id, UOM, CAPACITY_VAL FROM NPD_CAPACITY",
                    "SELECT TOP 1 id, HSN_CODE FROM MST_HSN_MASTER",
                    "SELECT TOP 1 id, CODE, TYPE_NAME FROM NPD_MATERIAL_TYPE",
                    "SELECT TOP 1 id, CODE, GRADE_NAME FROM NPD_MATERIAL_GRADE",
                    "SELECT TOP 1 id, CODE, SHAPE_NAME FROM NPD_SHAPE_MASTER",
                    "SELECT TOP 1 id, CODE FROM NPD_MATERIAL_CONDITIONS",
                    "SELECT TOP 1 id, UOM_CODE, UOM_NAME FROM MST_UOM",
                    "SELECT TOP 1 id, MODEL_NO FROM NPD_MODEL",
                    "SELECT TOP 1 id, DIVISION_NAME FROM AD_DIVISION",
                    // HR master tables
                    "SELECT TOP 1 id, DEPARTMENT_NAME FROM HR_DEPARTMENT",
                    "SELECT TOP 1 id, DESIGNATION_NAME FROM HR_DESIGNATION",
                    "SELECT TOP 1 id, EMP_CODE, EMPLOYEE_NAME FROM HR_EMPLOYEE",
                    // Product master
                    "SELECT TOP 1 id, PART_NO, ITEM_NAME FROM NPD_PRODUCT_MASTER"
                };

                for (String q : warmupQueries) {
                    try {
                        jdbcTemplate.queryForList(q);
                    } catch (Exception ignored) {
                        // Table might not exist yet (first run before migrations) — safe to skip
                    }
                }

                log.info("[Warmup] Database warmup completed in {} ms.", (System.currentTimeMillis() - start));
            } catch (Exception e) {
                log.warn("[Warmup] Failed during warmup: {}", e.getMessage());
            }
        });
    }
}
