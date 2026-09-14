package com.autonoma.erp.modules.qmc.inspectionspecification.service;

import com.autonoma.erp.modules.qmc.inspectionspecification.entity.InspectionSpecification;
import com.autonoma.erp.modules.qmc.inspectionspecification.entity.InspectionSpecificationDetail;
import com.autonoma.erp.modules.qmc.inspectionspecification.repository.InspectionSpecificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InspectionSpecificationMigrationService {

    private final JdbcTemplate jdbcTemplate;
    private final InspectionSpecificationRepository repository;
    private final org.springframework.transaction.support.TransactionTemplate transactionTemplate;
    private final jakarta.persistence.EntityManager entityManager;

    @jakarta.annotation.PostConstruct
    public void printSchema() {
        try {
            log.info("========== quality_plan_dtl COLUMNS ==========");
            List<Map<String, Object>> columns = jdbcTemplate.queryForList(
                    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'quality_plan_dtl'");
            for (Map<String, Object> col : columns) {
                log.info("COLUMN: " + col.get("COLUMN_NAME"));
            }
            log.info("=============================================");
        } catch (Exception e) {
            log.warn("Could not fetch quality_plan_dtl schema info: {}", e.getMessage());
        }
    }

    public String migrateQualityPlan(String secondaryDbName) {
        String dbPrefix = (secondaryDbName != null && !secondaryDbName.trim().isEmpty()) ? secondaryDbName + ".dbo."
                : "";
        log.info("Starting migration of " + dbPrefix + "quality_plan to QMC_INSPECTION_SPECIFICATION...");

        try {
            String masterQuery = "SELECT qp.id, qp.item_id, qp.active, qp.created_datetime as date, qp.division_no, i.item_code " +
                    "FROM " + dbPrefix + "quality_plan qp " +
                    "LEFT JOIN " + dbPrefix + "items i ON qp.item_id = i.id";
            List<Map<String, Object>> masters = jdbcTemplate.queryForList(masterQuery);
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.start("inspectionSpecification", masters.size());

        List<Long> existingItemIds = jdbcTemplate.queryForList("SELECT ITEM_ID FROM QMC_INSPECTION_SPECIFICATION",
                Long.class);
        java.util.Set<Long> processedItemIds = new java.util.HashSet<>(existingItemIds);

        List<Map<String, Object>> productMaps = jdbcTemplate.queryForList("SELECT ID, ITEM_NO, ITEM_CODE, ITEM_NAME FROM NPD_PRODUCT_MASTER");
        java.util.Map<String, Long> itemNoToIdMap = new java.util.HashMap<>();
        java.util.Map<String, Long> itemNameToIdMap = new java.util.HashMap<>();
        final java.util.Set<Long> validProductIds = new java.util.HashSet<>();
        for (Map<String, Object> pMap : productMaps) {
            if (pMap.get("ID") != null) {
                Long pId = ((Number) pMap.get("ID")).longValue();
                validProductIds.add(pId);
                if (pMap.get("ITEM_NO") != null) {
                    itemNoToIdMap.put(pMap.get("ITEM_NO").toString().trim().toUpperCase(), pId);
                }
                if (pMap.get("ITEM_CODE") != null) {
                    itemNoToIdMap.put(pMap.get("ITEM_CODE").toString().trim().toUpperCase(), pId);
                }
                if (pMap.get("ITEM_NAME") != null) {
                    itemNameToIdMap.put(pMap.get("ITEM_NAME").toString().trim().toUpperCase(), pId);
                }
            }
        }

        // Pre-load source items table (id -> item_code / item_name / group_name)
        java.util.Map<Long, String> sourceItemIdToItemCodeMap = new java.util.HashMap<>();
        java.util.Map<Long, String> sourceItemIdToItemNameMap = new java.util.HashMap<>();
        java.util.Map<Long, String> sourceItemIdToGroupNameMap = new java.util.HashMap<>();
        try {
            String sourceItemsQuery = "SELECT id, item_code, item_name, group_name FROM " + dbPrefix + "items";
            List<Map<String, Object>> sItems = jdbcTemplate.queryForList(sourceItemsQuery);
            for (Map<String, Object> si : sItems) {
                if (si.get("id") != null) {
                    Long sId = ((Number) si.get("id")).longValue();
                    if (si.get("item_code") != null) {
                        sourceItemIdToItemCodeMap.put(sId, si.get("item_code").toString().trim());
                    }
                    if (si.get("item_name") != null) {
                        sourceItemIdToItemNameMap.put(sId, si.get("item_name").toString().trim());
                    }
                    if (si.get("group_name") != null) {
                        sourceItemIdToGroupNameMap.put(sId, si.get("group_name").toString().trim());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not query source items for instrument mapping: {}", e.getMessage());
        }

        Long tempStatusId = 1L;
        try {
            List<Long> sIds = jdbcTemplate.queryForList("SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'ACTIVE'", Long.class);
            if (!sIds.isEmpty() && sIds.get(0) != null) {
                tempStatusId = sIds.get(0);
            }
        } catch (Exception e) {
            log.warn("Failed to fetch ACTIVE status ID, defaulting to 1L");
        }
        final Long activeStatusId = tempStatusId;

        // 1. Pre-load NPD_PROCESS master
        List<Map<String, Object>> npdProcesses = jdbcTemplate.queryForList("SELECT ID, PROCESS_NAME, PROCESS_CD FROM NPD_PROCESS");
        java.util.Map<String, Long> processNameToNpdIdMap = new java.util.HashMap<>();
        java.util.Set<Long> validNpdProcessIds = new java.util.HashSet<>();
        for (Map<String, Object> p : npdProcesses) {
            if (p.get("ID") != null) {
                Long pId = ((Number) p.get("ID")).longValue();
                validNpdProcessIds.add(pId);
                if (p.get("PROCESS_NAME") != null) {
                    processNameToNpdIdMap.put(p.get("PROCESS_NAME").toString().trim().toUpperCase(), pId);
                }
                if (p.get("PROCESS_CD") != null) {
                    processNameToNpdIdMap.put(p.get("PROCESS_CD").toString().trim().toUpperCase(), pId);
                }
            }
        }

        // 2. Query source processmaster table and map source ID -> NPD_PROCESS ID by name (inserting if missing)
        java.util.Map<Long, Long> sourceProcessIdToNpdProcessIdMap = new java.util.HashMap<>();
        try {
            String sourceProcessQuery = "SELECT id, process_name, process_code FROM " + dbPrefix + "processmaster";
            List<Map<String, Object>> sourceProcesses = jdbcTemplate.queryForList(sourceProcessQuery);
            for (Map<String, Object> sp : sourceProcesses) {
                if (sp.get("id") != null) {
                    Long sId = ((Number) sp.get("id")).longValue();
                    String sName = sp.get("process_name") != null ? sp.get("process_name").toString().trim() : null;
                    String sCode = sp.get("process_code") != null ? sp.get("process_code").toString().trim() : null;

                    if (sName == null || sName.isEmpty() || sName.equalsIgnoreCase("--Select--")) {
                        continue;
                    }

                    String sNameUpper = sName.toUpperCase();
                    Long matchedNpdId = processNameToNpdIdMap.get(sNameUpper);
                    if (matchedNpdId == null && sCode != null) {
                        matchedNpdId = processNameToNpdIdMap.get(sCode.toUpperCase());
                    }

                    if (matchedNpdId == null) {
                        log.info("Process '{}' does not exist in NPD_PROCESS. Dynamically seeding...", sName);
                        try {
                            String procCode = sCode != null && !sCode.isEmpty() ? sCode : (sName.length() > 20 ? sName.substring(0, 17) + "..." : sName);
                            jdbcTemplate.update(
                                "INSERT INTO NPD_PROCESS (PROCESS_NAME, PROCESS_CD, STATUS, PROCESS_PROCEDURE_REQUIRED, CREATED_BY, CREATED_DATE) VALUES (?, ?, ?, ?, ?, ?)",
                                sName, procCode, true, false, "SUPER BOSS", new java.util.Date()
                            );
                            matchedNpdId = jdbcTemplate.queryForObject("SELECT @@IDENTITY", Long.class);
                            if (matchedNpdId != null) {
                                processNameToNpdIdMap.put(sNameUpper, matchedNpdId);
                                if (sCode != null) {
                                    processNameToNpdIdMap.put(sCode.toUpperCase(), matchedNpdId);
                                }
                                validNpdProcessIds.add(matchedNpdId);
                            }
                        } catch (Exception ex) {
                            log.error("Failed to dynamically seed process: " + sName + " | Error: " + ex.getMessage(), ex);
                        }
                    }

                    if (matchedNpdId != null) {
                        sourceProcessIdToNpdProcessIdMap.put(sId, matchedNpdId);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not query source processmaster: {}. Trying fallback.", e.getMessage());
            try {
                String fallbackProcessQuery = "SELECT id, process_name FROM " + dbPrefix + "processmaster";
                List<Map<String, Object>> sourceProcesses = jdbcTemplate.queryForList(fallbackProcessQuery);
                for (Map<String, Object> sp : sourceProcesses) {
                    if (sp.get("id") != null && sp.get("process_name") != null) {
                        Long sId = ((Number) sp.get("id")).longValue();
                        String sName = sp.get("process_name").toString().trim();
                        if (sName.isEmpty() || sName.equalsIgnoreCase("--Select--")) continue;
                        String sNameUpper = sName.toUpperCase();
                        Long matchedNpdId = processNameToNpdIdMap.get(sNameUpper);
                        if (matchedNpdId == null) {
                            log.info("Process '{}' does not exist in NPD_PROCESS (fallback). Dynamically seeding...", sName);
                            try {
                                String procCode = sName.length() > 20 ? sName.substring(0, 17) + "..." : sName;
                                jdbcTemplate.update(
                                    "INSERT INTO NPD_PROCESS (PROCESS_NAME, PROCESS_CD, STATUS, PROCESS_PROCEDURE_REQUIRED, CREATED_BY, CREATED_DATE) VALUES (?, ?, ?, ?, ?, ?)",
                                    sName, procCode, true, false, "SUPER BOSS", new java.util.Date()
                                );
                                matchedNpdId = jdbcTemplate.queryForObject("SELECT @@IDENTITY", Long.class);
                                if (matchedNpdId != null) {
                                    processNameToNpdIdMap.put(sNameUpper, matchedNpdId);
                                    validNpdProcessIds.add(matchedNpdId);
                                }
                            } catch (Exception ex) {
                                log.error("Failed to dynamically seed process (fallback): " + sName + " | Error: " + ex.getMessage(), ex);
                            }
                        }
                        if (matchedNpdId != null) {
                            sourceProcessIdToNpdProcessIdMap.put(sId, matchedNpdId);
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Fallback query for source processmaster also failed: {}", ex.getMessage());
            }
        }

        // 3. Pre-load valid FK references for details
        List<Long> aqlIds = jdbcTemplate.queryForList("SELECT ID FROM QMC_AQL_MASTER", Long.class);
        final java.util.Set<Long> validAqlIds = new java.util.HashSet<>(aqlIds);

        List<String> uomCodes = jdbcTemplate.queryForList("SELECT UOM_CODE FROM MST_UOM", String.class);
        final java.util.Set<String> validUomCodes = new java.util.HashSet<>();
        for (String u : uomCodes) {
            if (u != null) validUomCodes.add(u.trim().toUpperCase());
        }

        List<Long> reactionPlanIds = jdbcTemplate.queryForList("SELECT ID FROM NPD_REACTION_PLAN", Long.class);
        final java.util.Set<Long> validReactionPlanIds = new java.util.HashSet<>(reactionPlanIds);

        List<Map<String, Object>> existingRps = jdbcTemplate.queryForList("SELECT ID, REACTION_PLAN FROM NPD_REACTION_PLAN");
        final java.util.Map<String, Long> reactionPlanTextToIdMap = new java.util.HashMap<>();
        for (Map<String, Object> rp : existingRps) {
            if (rp.get("ID") != null && rp.get("REACTION_PLAN") != null) {
                reactionPlanTextToIdMap.put(rp.get("REACTION_PLAN").toString().trim().toUpperCase(), ((Number) rp.get("ID")).longValue());
            }
        }

        List<String> existingCms = jdbcTemplate.queryForList("SELECT CONTROL_METHOD FROM NPD_CONTROL_METHOD", String.class);
        final java.util.Set<String> controlMethodSet = new java.util.HashSet<>();
        for (String cm : existingCms) {
            if (cm != null) controlMethodSet.add(cm.trim().toUpperCase());
        }

        int count = 0;
        long specSequenceCounter = 1;
        
        for (Map<String, Object> oldMaster : masters) {
            try {
                final long currentSpecCode = specSequenceCounter;
                Boolean success = transactionTemplate.execute(status -> {
                    Long oldId = ((Number) oldMaster.get("id")).longValue();

                    String specCode = String.valueOf(currentSpecCode);
                    java.util.Date mDate = (oldMaster.get("date") instanceof java.util.Date)
                            ? (java.util.Date) oldMaster.get("date")
                            : null;
                    String oldItemCode = (oldMaster.get("item_code") != null) ? oldMaster.get("item_code").toString().trim() : null;
                    Boolean isActive = (Boolean) oldMaster.get("active");
                    Long statusId = activeStatusId;

                    if (oldItemCode == null || oldItemCode.isEmpty()) {
                        log.warn("Migration skipping quality_plan id {} because associated item_code is null or empty", oldId);
                        return false;
                    }
                    
                    Long itemId = itemNoToIdMap.get(oldItemCode.toUpperCase());
                    Long srcId = ((Number) oldMaster.get("item_id")).longValue();
                    String sourceGroupName = sourceItemIdToGroupNameMap.get(srcId);
                    
                    // Update item group if missing in NPD_PRODUCT_MASTER
                    if (itemId != null && sourceGroupName != null && !sourceGroupName.trim().isEmpty()) {
                        try {
                            jdbcTemplate.update("UPDATE NPD_PRODUCT_MASTER SET ITEM_GROUP = ? WHERE ID = ? AND (ITEM_GROUP IS NULL OR ITEM_GROUP = '')", sourceGroupName, itemId);
                        } catch (Exception ex) {
                            log.warn("Failed to update item group for product id {}: {}", itemId, ex.getMessage());
                        }
                    }
                    
                    if (itemId == null) {
                        log.info("Item code {} does not exist in NPD_PRODUCT_MASTER. Dynamically creating it...", oldItemCode);
                        String sourceItemName = sourceItemIdToItemNameMap.get(srcId);
                        if (sourceItemName == null || sourceItemName.isEmpty()) {
                            sourceItemName = oldItemCode;
                        }
                        
                        try {
                            List<Long> matchedIds = jdbcTemplate.queryForList("SELECT ID FROM NPD_PRODUCT_MASTER WHERE UPPER(TRIM(ITEM_NO)) = ?", Long.class, oldItemCode.toUpperCase());
                            if (!matchedIds.isEmpty() && matchedIds.get(0) != null) {
                                itemId = matchedIds.get(0);
                            } else {
                                final String insertProductSql = "INSERT INTO NPD_PRODUCT_MASTER (ITEM_CODE, ITEM_NO, ITEM_NAME, ITEM_GROUP, STATUS, IS_ACTIVE, INVENTORY_TYPE, CREATED_BY, CREATED_DATE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                                jdbcTemplate.update(insertProductSql, oldItemCode, oldItemCode, sourceItemName, sourceGroupName, "ACTIVE", 1, "PRODUCT", "SUPER BOSS", new java.util.Date());
                                itemId = jdbcTemplate.queryForObject("SELECT @@IDENTITY", Long.class);
                            }
                        } catch (Exception ex) {
                            log.error("Failed to dynamically create product item_code: " + oldItemCode + " | Error: " + ex.getMessage(), ex);
                        }
                        
                        if (itemId != null) {
                            itemNoToIdMap.put(oldItemCode.toUpperCase(), itemId);
                            validProductIds.add(itemId);
                        }
                    }
                    
                    if (itemId == null) {
                        log.warn("Migration skipping quality_plan id {} because item_code {} does not exist and could not be created in NPD_PRODUCT_MASTER", oldId, oldItemCode);
                        return false;
                    }

                    InspectionSpecification spec = repository.findByItemId(itemId).orElse(null);
                    boolean isNewSpec = (spec == null);
                    
                    if (isNewSpec) {
                        spec = repository.findBySpecificationCode(specCode)
                                .orElseGet(InspectionSpecification::new);
                        spec.setSpecificationCode(specCode);
                        spec.setSpecificationName(String.valueOf(itemId));
                        spec.setVersionNo(1);
                        spec.setEffectiveFrom(mDate != null ? new java.sql.Date(mDate.getTime()).toLocalDate()
                                : java.time.LocalDate.now());
                        spec.setItemId(itemId);
                        spec.setStatus(statusId);

                        Object divisionNo = oldMaster.get("division_no");
                        if (divisionNo != null && divisionNo instanceof Number) {
                            spec.setDivisionId(((Number) divisionNo).longValue());
                        }

                        spec.clearDetails();
                    }

                    String detailQuery = "SELECT id, qp_hdr_id, group_heading, paramater_name, paramater_alisa, " +
                            "process_id, process_name, inst_id, paramater_type, paramater_cond_name, min_uom_name, " +
                            "nominal, low_tolerance, upp_tolerance, min, max, reaction_plan, control_plan, " +
                            "incoming, process, final, [first], [line], [lastoff], [revalidation], [predispatchinspection], " +
                            "remarks, remarks2, remarks3, visual_name, sample_size, symbol_name, datum_ref " +
                            "FROM " + dbPrefix + "quality_plan_dtl WHERE qp_hdr_id = ?";
                    List<Map<String, Object>> oldDetails;
                    try {
                        oldDetails = jdbcTemplate.queryForList(detailQuery, oldId);
                    } catch (Exception ex) {
                        log.warn("Columns might be missing in quality_plan_dtl for id {}. Fallback to basic query.", oldId);
                        String fallbackQuery = "SELECT id, qp_hdr_id, group_heading, paramater_name, paramater_alisa, " +
                                "process_id, inst_id, nominal, low_tolerance, upp_tolerance, min, max, " +
                                "control_plan, remarks, remarks2, remarks3, visual_name, sample_size, symbol_name, datum_ref " +
                                "FROM " + dbPrefix + "quality_plan_dtl WHERE qp_hdr_id = ?";
                        oldDetails = jdbcTemplate.queryForList(fallbackQuery, oldId);
                    }

                    for (Map<String, Object> oldDtl : oldDetails) {
                        InspectionSpecificationDetail detail = new InspectionSpecificationDetail();

                        detail.setGroupHeading((String) oldDtl.get("group_heading"));

                        String paramName = (String) oldDtl.get("paramater_name");
                        detail.setParameterName(
                                paramName != null && !paramName.trim().isEmpty() ? paramName : "UNSPECIFIED");

                        detail.setParameterAlias((String) oldDtl.get("paramater_alisa"));

                        if (oldDtl.get("process_id") != null && oldDtl.get("process_id") instanceof Number) {
                            Long oldProcessId = ((Number) oldDtl.get("process_id")).longValue();
                            Long targetProcessId = sourceProcessIdToNpdProcessIdMap.get(oldProcessId);
                            if (targetProcessId != null) {
                                detail.setProcessId(targetProcessId);
                            } else if (validNpdProcessIds.contains(oldProcessId)) {
                                detail.setProcessId(oldProcessId);
                            } else {
                                detail.setProcessId(null);
                            }
                        } else {
                            String dtlProcName = oldDtl.get("process_name") != null ? oldDtl.get("process_name").toString().trim() : "";
                            if (!dtlProcName.isEmpty() && !dtlProcName.equalsIgnoreCase("--Select--")) {
                                Long matchedId = processNameToNpdIdMap.get(dtlProcName.toUpperCase());
                                detail.setProcessId(matchedId);
                            } else {
                                detail.setProcessId(null);
                            }
                        }
                            
                        if (oldDtl.get("inst_id") != null && oldDtl.get("inst_id") instanceof Number) {
                            Long oldInstId = ((Number) oldDtl.get("inst_id")).longValue();
                            String instItemCode = sourceItemIdToItemCodeMap.get(oldInstId);
                            String instItemName = sourceItemIdToItemNameMap.get(oldInstId);
                            Long targetInstId = null;
                            if (instItemCode != null) {
                                targetInstId = itemNoToIdMap.get(instItemCode.toUpperCase());
                            }
                            if (targetInstId == null && instItemName != null) {
                                targetInstId = itemNameToIdMap.get(instItemName.toUpperCase());
                            }
                            
                            // Dynamically create instrument if it doesn't exist in NPD_PRODUCT_MASTER
                            if (targetInstId == null && instItemCode != null && !instItemCode.isEmpty()) {
                                log.info("Instrument item code {} does not exist in NPD_PRODUCT_MASTER. Dynamically creating it...", instItemCode);
                                if (instItemName == null || instItemName.isEmpty()) {
                                    instItemName = instItemCode;
                                }
                                try {
                                    List<Long> matchedIds = jdbcTemplate.queryForList("SELECT ID FROM NPD_PRODUCT_MASTER WHERE UPPER(TRIM(ITEM_NO)) = ?", Long.class, instItemCode.toUpperCase());
                                    if (!matchedIds.isEmpty() && matchedIds.get(0) != null) {
                                        targetInstId = matchedIds.get(0);
                                    } else {
                                        final String insertProductSql = "INSERT INTO NPD_PRODUCT_MASTER (ITEM_CODE, ITEM_NO, ITEM_NAME, ITEM_GROUP, STATUS, IS_ACTIVE, INVENTORY_TYPE, CREATED_BY, CREATED_DATE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                                        String instGroupName = sourceItemIdToGroupNameMap.get(oldInstId);
                                        jdbcTemplate.update(insertProductSql, instItemCode, instItemCode, instItemName, instGroupName, "ACTIVE", 1, "Instruments", "SUPER BOSS", new java.util.Date());
                                        targetInstId = jdbcTemplate.queryForObject("SELECT @@IDENTITY", Long.class);
                                    }
                                    if (targetInstId != null) {
                                        itemNoToIdMap.put(instItemCode.toUpperCase(), targetInstId);
                                        validProductIds.add(targetInstId);
                                    }
                                } catch (Exception ex) {
                                    log.error("Failed to dynamically create instrument item_code: " + instItemCode + " | Error: " + ex.getMessage(), ex);
                                }
                            }
                            
                            if (targetInstId != null) {
                                detail.setInstrumentId(targetInstId);
                            } else if (validProductIds.contains(oldInstId)) {
                                detail.setInstrumentId(oldInstId);
                            } else {
                                detail.setInstrumentId(null);
                            }
                        } else {
                            detail.setInstrumentId(null);
                        }
                            
                        // Map parameterType and parameterCondition intelligently
                        String paramNameUpper = paramName != null ? paramName.toUpperCase() : "";
                        String condLegacy = oldDtl.get("paramater_cond_name") != null ? String.valueOf(oldDtl.get("paramater_cond_name")).trim() : "";
                        String targetType = "DIMENSIONAL";
                        String targetCond = "MIN_MAX";

                        if (condLegacy.equalsIgnoreCase("Visual") || paramNameUpper.contains("VISUAL") || paramNameUpper.contains("APPEARANCE")) {
                            targetType = "VISUAL";
                            targetCond = "VISUAL";
                        } else if (condLegacy.equalsIgnoreCase("minmax")) {
                            targetType = "DIMENSIONAL";
                            targetCond = "MIN_MAX";
                        } else if (condLegacy.equalsIgnoreCase("min")) {
                            targetType = "DIMENSIONAL";
                            targetCond = "MIN";
                        } else if (condLegacy.equalsIgnoreCase("max")) {
                            targetType = "DIMENSIONAL";
                            targetCond = "MAX";
                        } else if (condLegacy.equalsIgnoreCase("Angle")) {
                            targetType = "DIMENSIONAL";
                            targetCond = "ANGLE";
                        } else {
                            if (oldDtl.get("nominal") != null || oldDtl.get("min") != null || oldDtl.get("max") != null) {
                                targetType = "DIMENSIONAL";
                                targetCond = "MIN_MAX";
                            } else {
                                targetType = "OTHER";
                                targetCond = null;
                            }
                        }
                        detail.setParameterType(targetType);
                        detail.setParameterCondition(targetCond);
                        
                        if (oldDtl.get("min_uom_name") != null) {
                            String uomStr = String.valueOf(oldDtl.get("min_uom_name")).trim();
                            if (!uomStr.isEmpty() && !uomStr.equalsIgnoreCase("--Select--")) {
                                String uomUpper = uomStr.toUpperCase();
                                if (!validUomCodes.contains(uomUpper)) {
                                    log.info("UOM '{}' does not exist in MST_UOM. Dynamically creating it...", uomStr);
                                    try {
                                        List<String> matched = jdbcTemplate.queryForList("SELECT UOM_CODE FROM MST_UOM WHERE UPPER(TRIM(UOM_CODE)) = ?", String.class, uomUpper);
                                        if (matched.isEmpty()) {
                                            jdbcTemplate.update(
                                                "INSERT INTO MST_UOM (UOM_CODE, UOM_DESCRIPTION, STATUS, CREATED_BY, CREATED_DATE) VALUES (?, ?, ?, ?, ?)",
                                                uomStr, uomStr + " - Dynamically created during migration", "ACTIVE", "SUPER BOSS", new java.util.Date()
                                            );
                                        }
                                        validUomCodes.add(uomUpper);
                                    } catch (Exception ex) {
                                        log.error("Failed to dynamically create UOM: " + uomStr + " | Error: " + ex.getMessage(), ex);
                                    }
                                }
                                detail.setUomCode(uomStr);
                            } else {
                                detail.setUomCode(null);
                            }
                        } else {
                            detail.setUomCode(null);
                        }

                        detail.setNominalValue(toBigDecimal(oldDtl.get("nominal")));
                        detail.setLowerTolerance(toBigDecimal(oldDtl.get("low_tolerance")));
                        detail.setUpperTolerance(toBigDecimal(oldDtl.get("upp_tolerance")));
                        detail.setMinimumValue(toBigDecimal(oldDtl.get("min")));
                        detail.setMaximumValue(toBigDecimal(oldDtl.get("max")));

                        // Map reaction_plan text dynamically into NPD_REACTION_PLAN
                        String rpText = oldDtl.get("reaction_plan") != null ? String.valueOf(oldDtl.get("reaction_plan")).trim() : "";
                        if (!rpText.isEmpty()) {
                            String rpTruncated = rpText.length() > 200 ? rpText.substring(0, 197) + "..." : rpText;
                            String rpUpper = rpTruncated.toUpperCase();
                            Long rpId = reactionPlanTextToIdMap.get(rpUpper);
                            if (rpId == null) {
                                log.info("Reaction plan text '{}' does not exist in NPD_REACTION_PLAN. Dynamically creating it...", rpTruncated);
                                try {
                                    List<Long> matchedIds = jdbcTemplate.queryForList("SELECT ID FROM NPD_REACTION_PLAN WHERE UPPER(TRIM(REACTION_PLAN)) = ?", Long.class, rpUpper);
                                    if (!matchedIds.isEmpty() && matchedIds.get(0) != null) {
                                        rpId = matchedIds.get(0);
                                    } else {
                                        String shortName = rpTruncated.length() > 20 ? rpTruncated.substring(0, 17) + "..." : rpTruncated;
                                        final String insertRpSql = "INSERT INTO NPD_REACTION_PLAN (SHORT_NAME, REACTION_PLAN, STATUS, CREATED_BY, CREATED_DATE) VALUES (?, ?, ?, ?, ?)";
                                        jdbcTemplate.update(insertRpSql, shortName, rpTruncated, activeStatusId, "SUPER BOSS", new java.util.Date());
                                        rpId = jdbcTemplate.queryForObject("SELECT @@IDENTITY", Long.class);
                                    }
                                    if (rpId != null) {
                                        reactionPlanTextToIdMap.put(rpUpper, rpId);
                                    }
                                } catch (Exception ex) {
                                    log.error("Failed to dynamically create reaction plan: " + rpTruncated + " | Error: " + ex.getMessage(), ex);
                                }
                            }
                            if (rpId != null) {
                                detail.setReactionPlanId(rpId);
                            }
                        }

                        // Map control_plan text dynamically into NPD_CONTROL_METHOD
                        String cpText = oldDtl.get("control_plan") != null ? String.valueOf(oldDtl.get("control_plan")).trim() : "";
                        if (!cpText.isEmpty()) {
                            String cpTruncated = cpText.length() > 100 ? cpText.substring(0, 97) + "..." : cpText;
                            String cpUpper = cpTruncated.toUpperCase();
                            if (!controlMethodSet.contains(cpUpper)) {
                                log.info("Control method '{}' does not exist in NPD_CONTROL_METHOD. Dynamically creating it...", cpTruncated);
                                try {
                                    List<Long> matchedIds = jdbcTemplate.queryForList("SELECT ID FROM NPD_CONTROL_METHOD WHERE UPPER(TRIM(CONTROL_METHOD)) = ?", Long.class, cpUpper);
                                    if (matchedIds.isEmpty()) {
                                        jdbcTemplate.update(
                                            "INSERT INTO NPD_CONTROL_METHOD (CONTROL_METHOD, STATUS, CREATED_BY, CREATED_DATE) VALUES (?, ?, ?, ?)",
                                            cpTruncated, activeStatusId, "SUPER BOSS", new java.util.Date()
                                        );
                                    }
                                    controlMethodSet.add(cpUpper);
                                } catch (Exception ex) {
                                    log.error("Failed to dynamically create control method: " + cpTruncated + " | Error: " + ex.getMessage(), ex);
                                }
                            }
                            detail.setControlPlanName(cpTruncated);
                        } else {
                            detail.setControlPlanName(null);
                        }

                        List<String> stages = new java.util.ArrayList<>();
                        Object first = oldDtl.get("first");
                        Object line = oldDtl.get("line");
                        Object incoming = oldDtl.get("incoming");
                        Object process = oldDtl.get("process");
                        Object finalStage = oldDtl.get("final");
                        Object lastoff = oldDtl.get("lastoff");
                        Object revalidation = oldDtl.get("revalidation");
                        Object predispatch = oldDtl.get("predispatchinspection");
                        
                        if (first != null && (first.toString().equalsIgnoreCase("First") || first.toString().equalsIgnoreCase("true") || first.toString().equals("1")))
                            stages.add("\"FIRST\"");
                        if (line != null && (line.toString().equalsIgnoreCase("Line") || line.toString().equalsIgnoreCase("true") || line.toString().equals("1")))
                            stages.add("\"LINE\"");
                        if (incoming != null && (incoming.toString().equalsIgnoreCase("Incoming") || incoming.toString().equalsIgnoreCase("true") || incoming.toString().equals("1")))
                            stages.add("\"INCOMING\"");
                        if (process != null && (process.toString().equalsIgnoreCase("Process") || process.toString().equalsIgnoreCase("true") || process.toString().equals("1")))
                            stages.add("\"PROCESS\"");
                        if (finalStage != null && (finalStage.toString().equalsIgnoreCase("Final") || finalStage.toString().equalsIgnoreCase("true") || finalStage.toString().equals("1")))
                            stages.add("\"FINAL\"");
                        if (lastoff != null && (lastoff.toString().equalsIgnoreCase("Last Off") || lastoff.toString().equalsIgnoreCase("true") || lastoff.toString().equals("1")))
                            stages.add("\"LAST OFF\"");
                        if (revalidation != null && (revalidation.toString().equalsIgnoreCase("Revalidation") || revalidation.toString().equalsIgnoreCase("true") || revalidation.toString().equals("1")))
                            stages.add("\"REVALIDATION\"");
                        if (predispatch != null && (predispatch.toString().equalsIgnoreCase("Pre dispatch") || predispatch.toString().equalsIgnoreCase("true") || predispatch.toString().equals("1")))
                            stages.add("\"PRE DISPATCH\"");
                            
                        if (!stages.isEmpty()) {
                            detail.setInspectionStages("[" + String.join(",", stages) + "]");
                        }

                        detail.setRemarks1((String) oldDtl.get("remarks"));
                        detail.setRemarks2((String) oldDtl.get("remarks2"));
                        detail.setRemarks3((String) oldDtl.get("remarks3"));
                        
                        detail.setVisualName((String) oldDtl.get("visual_name"));
                        detail.setReference((String) oldDtl.get("datum_ref"));

                        // Map sample_size dynamically
                        if (oldDtl.containsKey("sample_size") && oldDtl.get("sample_size") != null) {
                            String sampleStr = oldDtl.get("sample_size").toString().trim();
                            if (!sampleStr.isEmpty() && !sampleStr.equalsIgnoreCase("--Select--") && !sampleStr.equals("0")) {
                                ParsedAql parsed = parseAqlString(sampleStr);
                                if (parsed != null) {
                                    Long aqlId = lookupOrInsertAql(parsed, activeStatusId);
                                    if (aqlId != null) {
                                        detail.setAqlMasterId(aqlId);
                                    } else {
                                        detail.setAqlMasterId(null);
                                    }
                                } else {
                                    detail.setAqlMasterId(null);
                                }
                            } else {
                                detail.setAqlMasterId(null);
                            }
                        }

                        if (oldDtl.containsKey("symbol_name")) {
                            detail.setReferenceImage((String) oldDtl.get("symbol_name"));
                        }

                        // Default to active since column doesn't exist in source DB
                        detail.setStatus(activeStatusId);

                        spec.addDetail(detail);
                    }

                    repository.save(spec);
                    return true;
                });

                if (Boolean.TRUE.equals(success)) {
                    count++;
                    specSequenceCounter++;
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.update("inspectionSpecification", count);
                }
            } catch (Exception e) {
                log.error("Failed to migrate quality_plan record: " + oldMaster + " | Error: " + e.getMessage(), e);
            } finally {
                entityManager.clear();
            }
        }

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete("inspectionSpecification");
        log.info("Migration completed. Successfully migrated {} records.", count);
        return String.format("Successfully migrated %d records", count);
        } catch (Exception e) {
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.fail("inspectionSpecification");
            log.error("Failed to migrate quality plans", e);
            throw new RuntimeException("Migration failed: " + e.getMessage(), e);
        }
    }

    private String getStatusName(Long id) {
        if (id == null)
            return "UNKNOWN";
        switch (id.intValue()) {
            case 1:
                return "ACTIVE";
            case 2:
                return "INACTIVE";
            case 3:
                return "DELETED";
            default:
                return "UNKNOWN";
        }
    }

    public List<Map<String, Object>> debugSchema(String secondaryDbName) {
        String dbName = (secondaryDbName != null && !secondaryDbName.trim().isEmpty()) ? secondaryDbName : "AT_NUTECH";
        String query = "SELECT TABLE_NAME, COLUMN_NAME FROM " + dbName
                + ".INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME LIKE '%quality%plan%'";
        return jdbcTemplate.queryForList(query);
    }

    @Transactional
    public String clearInspectionSpecifications() {
        log.info("Clearing QMC_INSPECTION_SPECIFICATION_DETAIL and QMC_INSPECTION_SPECIFICATION tables...");
        try {
            jdbcTemplate.execute("DELETE FROM QMC_INSPECTION_SPECIFICATION_DETAIL");
            jdbcTemplate.execute("DELETE FROM QMC_INSPECTION_SPECIFICATION");
            try {
                jdbcTemplate.execute("DBCC CHECKIDENT ('QMC_INSPECTION_SPECIFICATION_DETAIL', RESEED, 0)");
                jdbcTemplate.execute("DBCC CHECKIDENT ('QMC_INSPECTION_SPECIFICATION', RESEED, 0)");
            } catch (Exception e) {
                log.warn("Could not reseed identity counters: {}", e.getMessage());
            }
            return "Inspection specifications cleared successfully.";
        } catch (Exception e) {
            log.error("Failed to clear inspection specifications", e);
            throw new RuntimeException("Clear failed: " + e.getMessage(), e);
        }
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null)
            return null;
        if (val instanceof BigDecimal)
            return (BigDecimal) val;
        if (val instanceof Number)
            return BigDecimal.valueOf(((Number) val).doubleValue());
        try {
            return new BigDecimal(val.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private static class ParsedAql {
        String level = "Level II";
        String type = "Normal";
        java.math.BigDecimal value = new java.math.BigDecimal("2.5");
        String name;
    }

    private ParsedAql parseAqlString(String sampleStr) {
        String s = sampleStr.trim();
        ParsedAql parsed = new ParsedAql();
        
        try {
            // Case 1: AQL X.Y
            if (s.toUpperCase().startsWith("AQL")) {
                String numStr = s.substring(3).trim();
                java.math.BigDecimal val = new java.math.BigDecimal(numStr);
                parsed.value = val;
                if (val.compareTo(java.math.BigDecimal.ONE) == 0) {
                    parsed.level = "Level III";
                    parsed.type = "Tightened";
                } else {
                    parsed.level = "Level II";
                    parsed.type = "Normal";
                }
                parsed.name = String.format("%s Inspection, %s, AQL %s", parsed.type, parsed.level, numStr);
                return parsed;
            }
            
            // Case 2: Level S1 N, Level S3 R, etc.
            if (s.toUpperCase().startsWith("LEVEL")) {
                String[] parts = s.split("\\s+");
                if (parts.length >= 2) {
                    parsed.level = parts[0] + " " + parts[1];
                }
                if (parts.length >= 3) {
                    String tChar = parts[2].trim().toUpperCase();
                    if (tChar.equals("N") || tChar.equals("NORMAL")) {
                        parsed.type = "Normal";
                    } else if (tChar.equals("R") || tChar.equals("REDUCED")) {
                        parsed.type = "Reduced";
                    } else if (tChar.equals("T") || tChar.equals("TIGHTENED")) {
                        parsed.type = "Tightened";
                    }
                }
                parsed.value = new java.math.BigDecimal("2.5");
                parsed.name = String.format("%s Inspection, %s, AQL 2.5", parsed.type, parsed.level);
                return parsed;
            }
            
            // Case 3: Pure numeric
            java.math.BigDecimal val = new java.math.BigDecimal(s);
            parsed.value = val;
            parsed.level = "Level II";
            parsed.type = "Normal";
            parsed.name = String.format("Normal Inspection, Level II, AQL %s", s);
            return parsed;
        } catch (Exception e) {
            return null;
        }
    }

    private synchronized Long lookupOrInsertAql(ParsedAql parsed, Long activeStatusId) {
        try {
            List<Map<String, Object>> existing = jdbcTemplate.queryForList(
                "SELECT ID FROM QMC_AQL_MASTER WHERE INSPECTION_LEVEL = ? AND INSPECTION_TYPE = ? AND ABS(AQL_VALUE - ?) < 0.0001",
                parsed.level, parsed.type, parsed.value.doubleValue()
            );
            if (!existing.isEmpty() && existing.get(0).get("ID") != null) {
                return ((Number) existing.get(0).get("ID")).longValue();
            }
            
            String maxCode = jdbcTemplate.queryForObject(
                "SELECT MAX(AQL_CODE) FROM QMC_AQL_MASTER WHERE AQL_CODE LIKE 'AQL-%'",
                String.class
            );
            String nextCode = "AQL-0001";
            if (maxCode != null && maxCode.startsWith("AQL-")) {
                try {
                    int num = Integer.parseInt(maxCode.substring(4));
                    nextCode = String.format("AQL-%04d", num + 1);
                } catch (Exception e) {
                    nextCode = "AQL-0003";
                }
            }
            
            log.info("Creating new AQL Master: {} - {}", nextCode, parsed.name);
            
            jdbcTemplate.update(
                "INSERT INTO QMC_AQL_MASTER (AQL_CODE, AQL_NAME, INSPECTION_LEVEL, INSPECTION_TYPE, AQL_VALUE, REMARKS, STATUS, CREATED_BY, CREATED_DATE) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                nextCode, parsed.name, parsed.level, parsed.type, parsed.value,
                "Dynamically created during quality plan migration", activeStatusId, "SUPER BOSS", new java.util.Date()
            );
            
            Long newId = jdbcTemplate.queryForObject("SELECT @@IDENTITY", Long.class);
            return newId;
        } catch (Exception e) {
            log.error("Failed to lookup or insert AQL: " + parsed.name + " | Error: " + e.getMessage(), e);
            return null;
        }
    }
}
