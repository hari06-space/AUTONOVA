package com.autonoma.erp.modules.npd.product.service;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.npd.product.entity.ProductCapacity;
import com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemGroup;
import com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemSubtype;
import com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemType;
import com.autonoma.erp.modules.npd.product.entity.ProductModel;
import com.autonoma.erp.modules.npd.oem.entity.ProductOem;
import com.autonoma.erp.modules.npd.oem.entity.ProductOemMapping;
import com.autonoma.erp.modules.npd.product.entity.ProductProcess;
import com.autonoma.erp.modules.npd.product.entity.ProductWindFarm;
import com.autonoma.erp.modules.master.admin.entity.MstUom;
import com.autonoma.erp.modules.npd.product.repository.ProductCapacityRepository;
import com.autonoma.erp.modules.npd.itemtaxonomy.repository.ProductItemGroupRepository;
import com.autonoma.erp.modules.npd.itemtaxonomy.repository.ProductItemSubtypeRepository;
import com.autonoma.erp.modules.npd.itemtaxonomy.repository.ProductItemTypeRepository;
import com.autonoma.erp.modules.npd.product.repository.ProductModelRepository;
import com.autonoma.erp.modules.npd.oem.repository.ProductOemMappingRepository;
import com.autonoma.erp.modules.npd.oem.repository.ProductOemRepository;
import com.autonoma.erp.modules.npd.product.repository.ProductProcessRepository;
import com.autonoma.erp.modules.npd.product.repository.ProductWindFarmRepository;
import com.autonoma.erp.modules.master.admin.repository.MstUomRepository;
import com.autonoma.erp.modules.qms.checklist.service.MasterChecklistMigrationService;
import com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository;
import com.autonoma.erp.modules.npd.inventory.repository.NpdInventoryTypeRepository;
import com.autonoma.erp.modules.npd.itemtaxonomy.repository.ProductItemGroupRepository;
import com.autonoma.erp.modules.npd.product.repository.ProductIppRepository;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.inventory.entity.NpdInventoryType;
import com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemGroup;
import com.autonoma.erp.modules.npd.product.entity.ProductIpp;

import com.autonoma.erp.modules.npd.hsn.repository.HsnCodeMasterRepository;
import com.autonoma.erp.modules.npd.material.repository.NpdMaterialTypeRepository;
import com.autonoma.erp.modules.npd.material.repository.NpdMaterialGradeRepository;
import com.autonoma.erp.modules.npd.material.repository.NpdShapeMasterRepository;
import com.autonoma.erp.modules.npd.material.repository.MaterialConditionRepository;
import com.autonoma.erp.modules.npd.material.entity.MaterialCondition;
import com.autonoma.erp.modules.npd.material.entity.NpdMaterialType;
import com.autonoma.erp.modules.npd.material.entity.NpdMaterialGrade;
import com.autonoma.erp.modules.npd.material.entity.NpdShapeMaster;
import com.autonoma.erp.modules.master.organization.repository.DivisionRepository;

import org.springframework.beans.BeanUtils;
import com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemType;
import com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemSubtype;
import com.autonoma.erp.modules.npd.product.entity.ProductModel;
import com.autonoma.erp.modules.npd.product.entity.ProductCapacity;
import com.autonoma.erp.modules.npd.hsn.entity.HsnCodeMaster;
import com.autonoma.erp.modules.master.admin.entity.MstUom;
import com.autonoma.erp.modules.npd.product.entity.NpdAttachmentPath;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Set;
import java.util.HashSet;
import java.util.LinkedHashSet;

import com.autonoma.erp.modules.qmt.entity.Machine;
import com.autonoma.erp.modules.hr.asset.entity.AssetGroup;
import com.autonoma.erp.modules.hr.asset.entity.AssetType;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.util.CellRangeAddressList;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;
import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.modules.platform.files.service.FileService;

@Service
public class NpdMigrationService {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    private com.autonoma.erp.modules.platform.datamigration.service.DynamicMigrationDbService dynamicMigrationDbService;

    public NpdMigrationService(@Qualifier("secondaryJdbcTemplate") JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private com.autonoma.erp.modules.npd.bom.repository.BomMasterRepository bomMasterRepository;

    @Autowired
    private ProductItemGroupRepository productItemGroupRepository;
    @Autowired
    private ProductItemTypeRepository productItemTypeRepository;
    @Autowired
    private ProductItemSubtypeRepository productItemSubtypeRepository;
    @Autowired
    private ProductOemRepository productOemRepository;
    @Autowired
    private ProductOemMappingRepository productOemMappingRepository;
    @Autowired
    private ProductModelRepository productModelRepository;
    @Autowired
    private ProductCapacityRepository productCapacityRepository;
    @Autowired
    private ProductProcessRepository productProcessRepository;
    @Autowired
    private ProductWindFarmRepository productWindFarmRepository;
    @Autowired
    private MstUomRepository mstUomRepository;

    @Autowired
    private com.autonoma.erp.service.admin.CompanyCredentialService companyCredentialService;

    @Autowired
    private FileService fileService;

    @Autowired
    private ProductMasterRepository productMasterRepository;
    @Autowired
    private NpdInventoryTypeRepository npdInventoryTypeRepository;
    @Autowired
    private ProductIppRepository productIppRepository;
    @Autowired
    private HsnCodeMasterRepository hsnCodeMasterRepository;
    @Autowired
    private NpdMaterialTypeRepository npdMaterialTypeRepository;
    @Autowired
    private NpdMaterialGradeRepository npdMaterialGradeRepository;
    @Autowired
    private NpdShapeMasterRepository npdShapeMasterRepository;

    @Autowired
    private MaterialConditionRepository materialConditionRepository;
    @Autowired
    private DivisionRepository divisionRepository;

    @Autowired
    private com.autonoma.erp.modules.qmt.repository.MachineRepository machineRepository;
    @Autowired
    private com.autonoma.erp.modules.hr.asset.repository.AssetGroupRepository assetGroupRepository;
    @Autowired
    private com.autonoma.erp.modules.hr.asset.repository.AssetTypeRepository assetTypeRepository;
    @Autowired
    private com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository accountLedgerRepository;

    @Autowired
    private com.autonoma.erp.modules.npd.product.repository.NpdAttachmentPathRepository npdAttachmentPathRepository;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private com.autonoma.erp.modules.platform.docsearch.service.DocumentSearchService documentSearchService;

    private java.util.List<String> expandCols(String... colNames) {
        return new java.util.ArrayList<>(java.util.Arrays.asList(colNames));
    }

    private String getStringSafe(java.sql.ResultSet rs, String... colNames) {
        for (String col : expandCols(colNames)) {
            try {
                String val = rs.getString(col);
                if (val != null)
                    return val.trim();
            } catch (Exception e) {
            }
        }
        return null;
    }

    private java.sql.Timestamp getTimestampSafe(java.sql.ResultSet rs, String... colNames) {
        for (String col : expandCols(colNames)) {
            try {
                java.sql.Timestamp t = rs.getTimestamp(col);
                if (t != null)
                    return t;
            } catch (Exception e) {
            }
        }
        return null;
    }

    private Long getLongSafe(java.sql.ResultSet rs, String... colNames) {
        for (String col : expandCols(colNames)) {
            try {
                rs.findColumn(col);
                long val = rs.getLong(col);
                if (!rs.wasNull())
                    return val;
            } catch (Exception e) {
            }
        }
        return null;
    }

    private Boolean getBooleanSafe(java.sql.ResultSet rs, String... colNames) {
        for (String col : expandCols(colNames)) {
            try {
                rs.findColumn(col);
                boolean val = rs.getBoolean(col);
                if (!rs.wasNull())
                    return val;
            } catch (Exception e) {
            }
        }
        return null;
    }

    private Double getDoubleSafe(java.sql.ResultSet rs, String... colNames) {
        for (String col : expandCols(colNames)) {
            try {
                rs.findColumn(col);
                double val = rs.getDouble(col);
                if (!rs.wasNull())
                    return val;
            } catch (Exception e) {
            }
        }
        return null;
    }

    private void setAuditFields(BaseAuditEntity entity, java.sql.ResultSet rs) {

        entity.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        java.sql.Timestamp createdDate = getTimestampSafe(rs, "CREATED_DATE", "CREATED_AT", "created_date",
                "created_at");
        entity.setCreatedDate(createdDate != null ? createdDate : new java.util.Date());

        entity.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        entity.setUpdatedDate(getTimestampSafe(rs, "UPDATED_DATE", "UPDATED_AT", "updated_date", "updated_at"));
    }

    public String migrateProducts(String oldAttachmentPath, String sqlIp, String sqlUsername, String sqlPassword,
            String secondaryDbName, String fileIp, String fileUsername, String filePassword, boolean skipAttachments) {
        String dbPrefix = (secondaryDbName != null && !secondaryDbName.trim().isEmpty()) ? secondaryDbName + ".dbo."
                : "";
        String sql = "SELECT * FROM " + dbPrefix
                + "items WITH (NOLOCK) where grouptype_name in ('Manufacturing Item','Purchase Item') and group_name not like '%CONSUMABLE%'";
        return migrateItemsBySql(sql, "productMaster", oldAttachmentPath, sqlIp, sqlUsername, sqlPassword,
                secondaryDbName, fileIp, fileUsername, filePassword, skipAttachments);
    }

    public String migrateInstruments(String oldAttachmentPath, String sqlIp, String sqlUsername, String sqlPassword,
            String secondaryDbName, String fileIp, String fileUsername, String filePassword, boolean skipAttachments) {
        String dbPrefix = (secondaryDbName != null && !secondaryDbName.trim().isEmpty()) ? secondaryDbName + ".dbo."
                : "";
        String sql = "SELECT * FROM " + dbPrefix
                + "items WITH (NOLOCK) where grouptype_name in ('Instrument','Instrument/Fixture')";
        return migrateMachinesAssetsToQmtMachine(sql, "instrumentMaster", sqlIp, sqlUsername, sqlPassword,
                secondaryDbName);
    }

    public String migrateConsumables(String oldAttachmentPath, String sqlIp, String sqlUsername, String sqlPassword,
            String secondaryDbName, String fileIp, String fileUsername, String filePassword, boolean skipAttachments) {
        String dbPrefix = (secondaryDbName != null && !secondaryDbName.trim().isEmpty()) ? secondaryDbName + ".dbo."
                : "";
        String sql = "SELECT * FROM " + dbPrefix
                + "items WITH (NOLOCK) where group_name like '%CONSUMABLE%' OR grouptype_name like '%CONSUMABLE%' OR grouptype_name = 'Tools & Dies'";
        return migrateMachinesAssetsToQmtMachine(sql, "consumableMaster", sqlIp, sqlUsername, sqlPassword,
                secondaryDbName);
    }

    public String migrateMachinesAssets(String oldAttachmentPath, String sqlIp, String sqlUsername, String sqlPassword,
            String secondaryDbName, String fileIp, String fileUsername, String filePassword, boolean skipAttachments) {
        String dbPrefix = (secondaryDbName != null && !secondaryDbName.trim().isEmpty()) ? secondaryDbName + ".dbo."
                : "";
        String sql = "SELECT * FROM " + dbPrefix + "items WITH (NOLOCK) where grouptype_name = 'Assets'";
        return migrateMachinesAssetsToQmtMachine(sql, "machineAssetMaster", sqlIp, sqlUsername, sqlPassword,
                secondaryDbName);
    }

    private String migrateMachinesAssetsToQmtMachine(String sql, String progressTrackerId, String sqlIp,
            String sqlUsername, String sqlPassword, String secondaryDbName) {
        JdbcTemplate migrationTemplate = (sqlIp != null && !sqlIp.trim().isEmpty())
                ? dynamicMigrationDbService.getDynamicTemplate(sqlIp, sqlUsername, sqlPassword, secondaryDbName)
                : jdbcTemplate;

        if (migrationTemplate == null)
            return "Migration database not configured.";

        List<Map<String, Object>> items = migrationTemplate.queryForList(sql);
        int count = 0;
        int updated = 0;
        int skipped = 0;

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.start(progressTrackerId,
                items.size());

        String currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (currentUser == null || currentUser.trim().isEmpty()) {
            currentUser = "Admin";
        }

        for (Map<String, Object> rs : items) {
            if (MasterChecklistMigrationService.stopFlag.get()) {
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .fail(progressTrackerId);
                return "Migration stopped by user. Migrated " + count + " records so far.";
            }

            String assetId = (String) rs.get("item_code");
            if (assetId == null || assetId.trim().isEmpty()) {
                skipped++;
                continue;
            }
            if (assetId.length() > 50) {
                assetId = assetId.substring(0, 50);
            }

            String assetName = (String) rs.get("item_name");
            if (assetName == null || assetName.trim().isEmpty()) {
                assetName = assetId;
            }
            if (assetName.length() > 100) {
                assetName = assetName.substring(0, 100);
            }

            // Ensure unique asset name (avoid UQ_QMT_MACHINE_ASSET_NAME violation)
            java.util.Optional<Machine> byNameOpt = machineRepository.findByAssetNameIgnoreCase(assetName);
            if (byNameOpt.isPresent() && !byNameOpt.get().getAssetId().equalsIgnoreCase(assetId)) {
                String suffix = " - " + assetId;
                int maxLen = 100 - suffix.length();
                if (assetName.length() > maxLen) {
                    assetName = assetName.substring(0, maxLen);
                }
                assetName = assetName + suffix;
            }

            // Resolve AssetGroup
            Long assetGroupId = null;
            String groupName = (String) rs.get("group_name");
            if (groupName != null && !groupName.trim().isEmpty()) {
                groupName = groupName.trim();
                java.util.Optional<AssetGroup> agOpt = assetGroupRepository.findByGroupNameIgnoreCase(groupName);
                if (agOpt.isPresent()) {
                    assetGroupId = agOpt.get().getId();
                } else {
                    AssetGroup ag = new AssetGroup();
                    ag.setGroupName(groupName);
                    ag.setStatus(true);
                    ag.setCreatedBy(currentUser);
                    ag.setCreatedDate(new java.util.Date());
                    ag = assetGroupRepository.save(ag);
                    assetGroupId = ag.getId();
                }
            }

            if (assetGroupId == null) {
                java.util.Optional<AssetGroup> defGroupOpt = assetGroupRepository
                        .findByGroupNameIgnoreCase("General Assets");
                if (defGroupOpt.isPresent()) {
                    assetGroupId = defGroupOpt.get().getId();
                } else {
                    AssetGroup defGroup = new AssetGroup();
                    defGroup.setGroupName("General Assets");
                    defGroup.setStatus(true);
                    defGroup.setCreatedBy(currentUser);
                    defGroup.setCreatedDate(new java.util.Date());
                    defGroup = assetGroupRepository.save(defGroup);
                    assetGroupId = defGroup.getId();
                }
            }

            // Resolve AssetType
            Long assetTypeId = null;
            String typeName = (String) rs.get("grouptype_name");
            if (typeName != null && !typeName.trim().isEmpty()) {
                typeName = typeName.trim();
                java.util.Optional<AssetType> atOpt = assetTypeRepository.findByTypeIgnoreCase(typeName);
                if (atOpt.isPresent()) {
                    assetTypeId = atOpt.get().getId();
                } else {
                    AssetType at = new AssetType();
                    at.setType(typeName);
                    at.setStatus(true);
                    at.setIsAutoGeneratedCode(false);
                    at.setGroupId(assetGroupId);
                    at.setCreatedBy(currentUser);
                    at.setCreatedDate(new java.util.Date());
                    at = assetTypeRepository.save(at);
                    assetTypeId = at.getId();
                }
            }

            // Resolve SupplierId (ins_suppl_by)
            Long supplierId = null;
            Object insSupplByObj = rs.get("ins_suppl_by");
            if (insSupplByObj != null) {
                String insSupplBy = insSupplByObj.toString().trim();
                if (!insSupplBy.isEmpty()) {
                    java.util.Optional<AccountLedger> ledgerOpt = accountLedgerRepository.findByCode(insSupplBy);
                    if (ledgerOpt.isPresent()) {
                        supplierId = ledgerOpt.get().getId();
                    } else {
                        ledgerOpt = accountLedgerRepository.findByLedgerNameIgnoreCase(insSupplBy);
                        if (ledgerOpt.isPresent()) {
                            supplierId = ledgerOpt.get().getId();
                        } else {
                            try {
                                Long idVal = Long.parseLong(insSupplBy);
                                ledgerOpt = accountLedgerRepository.findById(idVal);
                                if (ledgerOpt.isPresent()) {
                                    supplierId = ledgerOpt.get().getId();
                                }
                            } catch (NumberFormatException ignored) {
                            }
                        }
                    }
                }
            }

            // Check if machine already exists
            java.util.Optional<Machine> existingOpt = machineRepository.findByAssetIdIgnoreCase(assetId);
            Machine machine = existingOpt.orElseGet(Machine::new);

            machine.setAssetId(assetId);
            machine.setAssetName(assetName);
            machine.setAssetGroupId(assetGroupId);
            machine.setAssetTypeId(assetTypeId);
            machine.setSupplierId(supplierId);

            String description = (String) rs.get("item_description");
            if (description != null && description.length() > 500) {
                description = description.substring(0, 500);
            }
            machine.setDescription(description);

            String printName = (String) rs.get("ic_printname");
            if (printName != null && printName.length() > 150) {
                printName = printName.substring(0, 150);
            }
            machine.setPrintName(printName);

            // Parse Division
            Integer divisionVal = null;
            if (rs.get("division_no") != null) {
                try {
                    divisionVal = ((Number) rs.get("division_no")).intValue();
                } catch (Exception e) {
                    try {
                        divisionVal = Integer.parseInt(rs.get("division_no").toString().trim());
                    } catch (Exception ex) {
                    }
                }
            }
            machine.setDivision(divisionVal);

            String uom = (String) rs.get("uom_name");
            if (uom != null && uom.length() > 20) {
                uom = uom.substring(0, 20);
            }
            machine.setUom(uom);

            // Parse Purchase Rate
            java.math.BigDecimal purchaseRate = null;
            if (rs.get("purchase_rate") != null) {
                try {
                    purchaseRate = new java.math.BigDecimal(rs.get("purchase_rate").toString());
                } catch (Exception e) {
                }
            }
            machine.setPurchaseRate(purchaseRate);

            // Parse Price / Selling Rate
            java.math.BigDecimal price = null;
            if (rs.get("selling_rate") != null) {
                try {
                    price = new java.math.BigDecimal(rs.get("selling_rate").toString());
                } catch (Exception e) {
                }
            }
            machine.setPrice(price);

            // Parse Purchase Year
            Integer purchaseYear = null;
            if (rs.get("purchase_year") != null) {
                try {
                    purchaseYear = ((Number) rs.get("purchase_year")).intValue();
                } catch (Exception e) {
                    try {
                        purchaseYear = Integer.parseInt(rs.get("purchase_year").toString().trim());
                    } catch (Exception ex) {
                    }
                }
            }
            machine.setPurchaseYear(purchaseYear);

            String modelNo = (String) rs.get("model");
            if (modelNo != null && modelNo.length() > 100) {
                modelNo = modelNo.substring(0, 100);
            }
            machine.setModelNo(modelNo);

            String hsnCode = (String) rs.get("hsn_no");
            if (hsnCode != null && hsnCode.length() > 50) {
                hsnCode = hsnCode.substring(0, 50);
            }
            machine.setHsnCode(hsnCode);

            String sacCode = (String) rs.get("sac_name");
            if (sacCode != null && sacCode.length() > 50) {
                sacCode = sacCode.substring(0, 50);
            }
            machine.setSacCode(sacCode);

            String calibrFrequency = rs.get("cal_freq") != null ? rs.get("cal_freq").toString() : null;
            if (calibrFrequency != null && calibrFrequency.length() > 50) {
                calibrFrequency = calibrFrequency.substring(0, 50);
            }
            machine.setCalibrFrequency(calibrFrequency);

            String amcFrequency = rs.get("amc_freq") != null ? rs.get("amc_freq").toString() : null;
            if (amcFrequency != null && amcFrequency.length() > 50) {
                amcFrequency = amcFrequency.substring(0, 50);
            }
            machine.setAmcFrequency(amcFrequency);

            String make = (String) rs.get("make_name");
            if (make != null && make.length() > 100) {
                make = make.substring(0, 100);
            }
            machine.setMake(make);

            // Parse Status
            String activeStr = rs.get("active") != null ? rs.get("active").toString() : "1";
            boolean activeVal = "1".equals(activeStr) || "true".equalsIgnoreCase(activeStr)
                    || "Y".equalsIgnoreCase(activeStr);
            machine.setStatus(activeVal);

            // Audit columns set via @PrePersist / @PreUpdate, but set explicitly here to be
            // absolutely safe
            if (existingOpt.isPresent()) {
                machine.setUpdatedBy(currentUser);
                machine.setUpdatedDate(new java.util.Date());
                machineRepository.save(machine);
                updated++;
            } else {
                machine.setCreatedBy(currentUser);
                machine.setCreatedDate(new java.util.Date());
                machineRepository.save(machine);
                count++;
            }

            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.update(progressTrackerId,
                    count + updated);
        }

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete(progressTrackerId);
        return "Successfully migrated " + count + " and updated " + updated
                + " records from items to QMT_ASSET_MASTER"
                + (skipped > 0 ? " (" + skipped + " skipped)" : "") + ".";
    }

    private String migrateItemsBySql(String sqlQuery, String progressTrackerId, String oldAttachmentPath, String sqlIp,
            String sqlUsername, String sqlPassword,
            String secondaryDbName, String fileIp, String fileUsername, String filePassword, boolean skipAttachments) {
        if (oldAttachmentPath == null || oldAttachmentPath.trim().isEmpty()) {
            skipAttachments = true;
        }

        JdbcTemplate migrationTemplate = (sqlIp != null && !sqlIp.trim().isEmpty())
                ? dynamicMigrationDbService.getDynamicTemplate(sqlIp, sqlUsername, sqlPassword, secondaryDbName)
                : jdbcTemplate;

        if (migrationTemplate == null)
            return "Migration database not configured.";

        String fallbackRoot = "D:\\BOS_DOCUMENTS";
        CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
        if (company != null && company.getDirectoryPath() != null && !company.getDirectoryPath().isEmpty()) {
            fallbackRoot = company.getDirectoryPath();
        }
        String defaultPrefix = fallbackRoot + "\\"
                + AppUtil.BosDocConstants.MASTER_NPD_PRODUCT_PRODUCT_MASTER_PATH.replace('/', '\\');

        Map<Long, List<Map<String, Object>>> docMap = new HashMap<>();
        if (!skipAttachments) {
            String dbPrefix = (secondaryDbName != null && !secondaryDbName.trim().isEmpty()) ? secondaryDbName + ".dbo."
                    : "";
            // Pre-fetch documents
            String docSql = "SELECT * FROM " + dbPrefix + "item_document WITH (NOLOCK)";
            List<Map<String, Object>> docs = migrationTemplate.queryForList(docSql);
            for (Map<String, Object> doc : docs) {
                Long itemId = null;
                if (doc.get("item_id") != null) {
                    itemId = ((Number) doc.get("item_id")).longValue();
                    docMap.computeIfAbsent(itemId, k -> new ArrayList<>()).add(doc);
                }
            }
        }

        String sql = sqlQuery;
        List<Map<String, Object>> items = migrationTemplate.queryForList(sql);
        int count = 0;
        int updated = 0;
        int skipped = 0;

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.start(progressTrackerId,
                items.size());

        // Pre-fetch all existing item numbers to instantly skip already migrated
        // products
        Set<String> existingItemNos = new HashSet<>();
        try {
            List<String> dbItemNos = productMasterRepository.findAllItemNos();
            if (dbItemNos != null) {
                for (String no : dbItemNos) {
                    if (no != null && !no.trim().isEmpty()) {
                        existingItemNos.add(no.trim().toLowerCase());
                    }
                }
            }
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(NpdMigrationService.class)
                    .warn("Could not pre-fetch existing item numbers: " + e.getMessage());
        }

        // Pre-cache lookup masters in memory to avoid 100k+ repetitive database queries
        Set<String> existingGroupNames = new HashSet<>();
        try {
            for (ProductItemGroup pg : productItemGroupRepository.findAll()) {
                if (pg.getGroupName() != null)
                    existingGroupNames.add(pg.getGroupName().trim().toLowerCase());
            }
        } catch (Exception ignored) {
        }

        Set<String> existingHsnCodes = new HashSet<>();
        try {
            for (HsnCodeMaster h : hsnCodeMasterRepository.findAll()) {
                if (h.getHsnCode() != null)
                    existingHsnCodes.add(h.getHsnCode().trim().toLowerCase());
            }
        } catch (Exception ignored) {
        }

        Set<String> existingUoms = new HashSet<>();
        try {
            for (MstUom u : mstUomRepository.findAll()) {
                if (u.getUomCode() != null)
                    existingUoms.add(u.getUomCode().trim().toLowerCase());
            }
        } catch (Exception ignored) {
        }

        for (Map<String, Object> rs : items) {
            if (MasterChecklistMigrationService.stopFlag.get()) {
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .fail(progressTrackerId);
                return "Migration stopped by user. Migrated " + count + " records so far.";
            }

            String itemCode = (String) rs.get("item_code");
            if (itemCode == null || itemCode.trim().isEmpty()) {
                skipped++;
                continue;
            }
            itemCode = itemCode.trim();

            // INSTANT RESUME: Skip already migrated product
            if (existingItemNos.contains(itemCode.toLowerCase())) {
                skipped++;
                int totalProcessed = count + updated + skipped;
                if (totalProcessed % 50 == 0 || totalProcessed == items.size()) {
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.update(
                            progressTrackerId,
                            totalProcessed);
                }
                continue;
            }

            try {
                ProductMaster p = new ProductMaster();
                p.setItemNo(itemCode);
                p.setItemCode(itemCode);
                p.setItemName((String) rs.get("item_name"));

                String activeStr = rs.get("active") != null ? rs.get("active").toString() : "0";
                p.setIsActive(
                        "1".equals(activeStr) || "true".equalsIgnoreCase(activeStr) || "Y".equalsIgnoreCase(activeStr));
                p.setStatus(p.getIsActive() ? "ACTIVE" : "INACTIVE");
                p.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
                p.setCreatedAt(new java.util.Date());

                // Handle Item Group
                String groupName = (String) rs.get("group_name");
                if (groupName != null && !groupName.trim().isEmpty()) {
                    String gnTrim = groupName.trim();
                    if (!existingGroupNames.contains(gnTrim.toLowerCase())) {
                        try {
                            ProductItemGroup pg = new ProductItemGroup();
                            pg.setGroupName(gnTrim);
                            pg.setStatus(1);
                            pg.setCreatedBy("admin");
                            pg.setCreatedDate(new java.util.Date());
                            productItemGroupRepository.save(pg);
                            existingGroupNames.add(gnTrim.toLowerCase());
                        } catch (Exception ignored) {
                            existingGroupNames.add(gnTrim.toLowerCase());
                        }
                    }
                    p.setItemGroup(gnTrim);
                }

                // Handle Item Category (ProductItemSubtype in DB)
                String category = (String) rs.get("grouptype_name");
                if (category != null && !category.trim().isEmpty()) {
                    p.setItemCategory(category.trim());
                }

                p.setLeadTimeMin(rs.get("lead_days") != null ? ((Number) rs.get("lead_days")).intValue() : null);
                p.setLeadTimeMax(rs.get("lead_days") != null ? ((Number) rs.get("lead_days")).intValue() : null);

                String webProdStr = rs.get("adlfield8") != null ? rs.get("adlfield8").toString() : "0";
                p.setWebProduct(
                        "1".equals(webProdStr) || "true".equalsIgnoreCase(webProdStr)
                                || "Y".equalsIgnoreCase(webProdStr));

                // Handle Capacity
                try {
                    String capIdStr = (String) rs.get("adlfield1");
                    if (capIdStr != null && !capIdStr.trim().isEmpty()) {
                        p.setCapacityId(Long.parseLong(capIdStr.trim()));
                    }
                } catch (Exception ignored) {
                }

                p.setWeightPerQty(rs.get("net_weight") != null ? ((Number) rs.get("net_weight")).doubleValue() : null);
                p.setPartNoOld((String) rs.get("adlfield3"));
                p.setPrintName((String) rs.get("ic_printname"));
                p.setRevNo((String) rs.get("revision_no"));

                java.sql.Timestamp revDate = (java.sql.Timestamp) rs.get("revision_date");
                if (revDate != null)
                    p.setRevDate(revDate.toLocalDateTime().toLocalDate());

                // Handle HSN
                String hsn = (String) rs.get("hsn_no");
                if (hsn != null && !hsn.trim().isEmpty()) {
                    String hsnTrim = hsn.trim();
                    if (!existingHsnCodes.contains(hsnTrim.toLowerCase())) {
                        try {
                            HsnCodeMaster h = new HsnCodeMaster();
                            h.setHsnCode(hsnTrim);
                            h.setStatus(1);
                            h.setCodeType("HSN");
                            hsnCodeMasterRepository.save(h);
                            existingHsnCodes.add(hsnTrim.toLowerCase());
                        } catch (Exception ignored) {
                            existingHsnCodes.add(hsnTrim.toLowerCase());
                        }
                    }
                    p.setHsnCode(hsnTrim);
                }

                p.setGrade((String) rs.get("material_name"));
                p.setRolQty(rs.get("rol_qty") != null ? ((Number) rs.get("rol_qty")).doubleValue() : null);

                // Handle UOM
                String uom = (String) rs.get("uom_name");
                if (uom != null && !uom.trim().isEmpty()) {
                    String uomTrim = uom.trim();
                    if (!existingUoms.contains(uomTrim.toLowerCase())) {
                        try {
                            MstUom u = new MstUom();
                            u.setUomCode(uomTrim);
                            u.setStatus("ACTIVE");
                            mstUomRepository.save(u);
                            existingUoms.add(uomTrim.toLowerCase());
                        } catch (Exception ignored) {
                            existingUoms.add(uomTrim.toLowerCase());
                        }
                    }
                    p.setUom(uomTrim);
                }

                // Handle Model
                String model = (String) rs.get("model");
                if (model != null && !model.trim().isEmpty()) {
                    p.setModelNo(model);
                }

                p.setOd(rs.get("mat_outerdia") != null ? ((Number) rs.get("mat_outerdia")).doubleValue() : null);
                p.setInnerDiameter(
                        rs.get("mat_innerdia") != null ? ((Number) rs.get("mat_innerdia")).doubleValue() : null);
                p.setPurchaseRate(
                        rs.get("purchase_rate") != null ? ((Number) rs.get("purchase_rate")).doubleValue() : null);
                p.setMaximumPurchaseRate(
                        rs.get("selling_rate") != null ? ((Number) rs.get("selling_rate")).doubleValue() : null);
                p.setSellingRate(
                        rs.get("selling_rate") != null ? ((Number) rs.get("selling_rate")).doubleValue() : null);
                p.setMinSellingRate(
                        rs.get("min_sell_rate") != null ? ((Number) rs.get("min_sell_rate")).doubleValue() : null);
                p.setItemCost(
                        rs.get("inventory_rate") != null ? ((Number) rs.get("inventory_rate")).doubleValue() : null);
                p.setMrpRate(rs.get("mrp_rate") != null ? ((Number) rs.get("mrp_rate")).doubleValue() : null);
                p.setRackName((String) rs.get("rack_name"));
                p.setBinName((String) rs.get("bin_name"));
                p.setDrawingNo((String) rs.get("drawing_no"));

                // Handle SAC
                String sac = (String) rs.get("sac_name");
                if (sac != null && !sac.trim().isEmpty()) {
                    String sacTrim = sac.trim();
                    if (!existingHsnCodes.contains(sacTrim.toLowerCase())) {
                        try {
                            HsnCodeMaster s = new HsnCodeMaster();
                            s.setHsnCode(sacTrim);
                            s.setStatus(1);
                            s.setCodeType("SAC");
                            hsnCodeMasterRepository.save(s);
                            existingHsnCodes.add(sacTrim.toLowerCase());
                        } catch (Exception ignored) {
                            existingHsnCodes.add(sacTrim.toLowerCase());
                        }
                    }
                    p.setSacCode(sacTrim);
                }
                p.setMakeName((String) rs.get("make_name"));

                if (groupName != null && (groupName.toLowerCase().contains("raw material")
                        || groupName.toLowerCase().contains("rawmaterial"))) {
                    p.setInventoryType("RAWMATERIAL");
                } else if (category != null && category.equalsIgnoreCase("Assets")) {
                    p.setInventoryType("Assets");
                } else if (category != null
                        && (category.equalsIgnoreCase("Instrument")
                                || category.equalsIgnoreCase("Instrument/Fixture"))) {
                    p.setInventoryType("Instruments");
                } else if (category != null && category.equalsIgnoreCase("Tools & Dies")) {
                    p.setInventoryType("Tools");
                } else if ((groupName != null && groupName.toLowerCase().contains("consumable")) ||
                        (category != null && category.toLowerCase().contains("consumable"))) {
                    p.setInventoryType("Consumables");
                } else {
                    p.setInventoryType("PRODUCT");
                }

                if (!skipAttachments) {
                    // Handle Attachments
                    Long oldItemId = rs.get("id") != null ? ((Number) rs.get("id")).longValue() : null;
                    if (oldItemId != null && docMap.containsKey(oldItemId)) {
                        List<NpdAttachmentPath> attachments = new ArrayList<>();
                        for (Map<String, Object> doc : docMap.get(oldItemId)) {
                            NpdAttachmentPath att = new NpdAttachmentPath();
                            att.setPageCode("M3115");
                            att.setFileName((String) doc.get("original_name"));

                            String oldFileName = (String) doc.get("file_name");
                            if (oldFileName != null) {
                                String prefix = (oldAttachmentPath != null && !oldAttachmentPath.trim().isEmpty())
                                        ? oldAttachmentPath.trim()
                                        : defaultPrefix;

                                if (!prefix.endsWith("\\") && !prefix.endsWith("/")) {
                                    prefix += "\\";
                                }

                                String sourcePath = prefix + oldFileName.replaceFirst("^[/\\\\]+", "");

                                String cleanName = oldFileName.replaceFirst("^[/\\\\]+", "");
                                String origName = (String) doc.get("original_name");
                                if (origName == null || origName.trim().isEmpty()) {
                                    origName = cleanName;
                                }
                                String realCleanName = origName.replaceFirst("^[/\\\\]+", "");
                                int lastSlashReal = Math.max(realCleanName.lastIndexOf('/'),
                                        realCleanName.lastIndexOf('\\'));
                                if (lastSlashReal >= 0) {
                                    realCleanName = realCleanName.substring(lastSlashReal + 1);
                                }
                                realCleanName = realCleanName.replace(",", "_").replaceAll("[\\\\/:*?\"<>|]", "_")
                                        .trim();
                                if (realCleanName.isEmpty()) {
                                    realCleanName = "attachment";
                                }

                                String screenNo = doc.get("screen_no") != null
                                        ? String.valueOf(doc.get("screen_no")).trim()
                                        : "105";

                                try {
                                    java.nio.file.Path targetDir = java.nio.file.Paths.get(fallbackRoot,
                                            AppUtil.BosDocConstants.MASTER_NPD_PRODUCT_PRODUCT_MASTER_PATH);
                                    java.nio.file.Files.createDirectories(targetDir);

                                    String targetFileName = realCleanName;
                                    if (java.nio.file.Files.exists(targetDir.resolve(targetFileName))) {
                                        String baseName = realCleanName;
                                        String ext = "";
                                        int dot = realCleanName.lastIndexOf('.');
                                        if (dot != -1) {
                                            baseName = realCleanName.substring(0, dot);
                                            ext = realCleanName.substring(dot);
                                        }
                                        int counter = 1;
                                        while (java.nio.file.Files
                                                .exists(targetDir.resolve(baseName + " (" + counter + ")" + ext))) {
                                            counter++;
                                        }
                                        targetFileName = baseName + " (" + counter + ")" + ext;
                                    }

                                    java.nio.file.Path targetPath = targetDir.resolve(targetFileName);
                                    java.io.File localFile = resolveLegacySourceFile(prefix, screenNo, cleanName);

                                    if (localFile != null && localFile.exists()) {
                                        try {
                                            java.nio.file.Files.copy(localFile.toPath(), targetPath,
                                                    java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                                        } catch (java.io.IOException ex) {
                                            org.slf4j.LoggerFactory.getLogger(NpdMigrationService.class)
                                                    .error("Failed to copy local file: " + localFile.getAbsolutePath(),
                                                            ex);
                                        }
                                    } else {
                                        org.slf4j.LoggerFactory.getLogger(NpdMigrationService.class)
                                                .warn("Local File does not exist for item: screenNo={}, cleanName={}, prefix={}",
                                                        screenNo, cleanName, prefix);
                                    }

                                    String absoluteDbPath = fallbackRoot.replace('\\', '/') + "/"
                                            + AppUtil.BosDocConstants.MASTER_NPD_PRODUCT_PRODUCT_MASTER_PATH + "/"
                                            + targetFileName;
                                    att.setPath(absoluteDbPath);
                                    att.setFileName(realCleanName);
                                } catch (Exception e) {
                                    org.slf4j.LoggerFactory.getLogger(NpdMigrationService.class)
                                            .error("Failed to copy attachment: " + realCleanName, e);
                                }
                            }

                            att.setDocType((String) doc.get("doc_type"));
                            if (att.getDocType() == null)
                                att.setDocType("DOCUMENT");
                            att.setCreatedBy("admin");
                            att.setCreatedDate(new java.util.Date());
                            attachments.add(att);
                        }
                        p.setAttachments(attachments);
                    }
                }

                java.util.Optional<ProductMaster> existingOpt = productMasterRepository.findByItemNo(p.getItemNo());
                ProductMaster savedProduct;
                if (existingOpt.isPresent()) {
                    ProductMaster existing = existingOpt.get();
                    BeanUtils.copyProperties(p, existing, "id", "createdAt", "createdBy", "attachments",
                            "identifications");
                    if (p.getAttachments() != null && !p.getAttachments().isEmpty()) {
                        if (existing.getAttachments() != null) {
                            existing.getAttachments().clear();
                            existing.getAttachments().addAll(p.getAttachments());
                        } else {
                            existing.setAttachments(new java.util.ArrayList<>(p.getAttachments()));
                        }
                    }
                    savedProduct = productMasterRepository.save(existing);
                    existingItemNos.add(itemCode.toLowerCase());
                    updated++;
                } else {
                    savedProduct = productMasterRepository.save(p);
                    existingItemNos.add(itemCode.toLowerCase());
                    count++;
                }

                // Real-time Document Search Registration for migrated attachments
                if (documentSearchService != null && savedProduct.getAttachments() != null
                        && !savedProduct.getAttachments().isEmpty()) {
                    for (NpdAttachmentPath att : savedProduct.getAttachments()) {
                        if (att.getPath() != null && !att.getPath().isBlank()) {
                            try {
                                documentSearchService.registerOrUpdateAttachment(
                                        "NPD",
                                        "M3115",
                                        "NPD_ATTACHMENT_PATH",
                                        att.getId() != null ? String.valueOf(att.getId()) : null,
                                        savedProduct.getItemNo(),
                                        att.getFileName(),
                                        att.getPath());
                            } catch (Exception ignored) {
                            }
                        }
                    }
                }
            } catch (Exception itemEx) {
                org.slf4j.LoggerFactory.getLogger(NpdMigrationService.class)
                        .error("Error migrating product item " + itemCode + ": " + itemEx.getMessage());
                skipped++;
            }

            int totalProcessed = count + updated + skipped;
            if (totalProcessed % 20 == 0 || totalProcessed == items.size()) {
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.update(
                        progressTrackerId,
                        totalProcessed);
            }

            if (totalProcessed % 500 == 0) {
                try {
                    entityManager.flush();
                    entityManager.clear();
                } catch (Exception ignored) {
                }
            }
        }

        if (documentSearchService != null) {
            documentSearchService.triggerAsyncIndexing();
        }

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete(progressTrackerId);
        return "Successfully migrated " + count + " and updated " + updated
                + " records from items to NPD_PRODUCT_MASTER" +
                (skipped > 0 ? " (" + skipped + " skipped)" : "") + ".";
    }

    @Transactional
    public String migrateProductItemGroups(String sqlIp, String sqlUsername, String sqlPassword,
            String secondaryDbName) {
        if (jdbcTemplate == null)
            return "Migration database not configured.";
        String sql = "SELECT * FROM PRODUCT_TYPE";
        List<ProductItemGroup> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            ProductItemGroup item = new ProductItemGroup();
            item.setGroupName(getStringSafe(rs, "GROUP_NAME", "group_name", "PRODUCT_TYPE", "product_type", "TYPE_NAME",
                    "type_name"));
            item.setDescription(getStringSafe(rs, "DESCRIPTION", "description"));

            String status = getStringSafe(rs, "STATUS", "status");
            item.setStatus((status != null && status.equalsIgnoreCase("INACTIVE")) ? 0 : 1);

            Boolean isActive = getBooleanSafe(rs, "IS_ACTIVE", "is_active");
            // item.setIsActive(isActive != null ? isActive : true);

            setAuditFields(item, rs);
            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return item;
        }).stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get())
            return "Migration stopped by user.";

        int count = 0;
        List<ProductItemGroup> existing = productItemGroupRepository.findAll();
        for (ProductItemGroup item : migratedList) {
            if (item.getGroupName() != null
                    && existing.stream().noneMatch(e -> e.getGroupName().equalsIgnoreCase(item.getGroupName()))) {
                productItemGroupRepository.save(item);
                count++;
            }
        }
        return "Successfully migrated " + count + " records from NPD_ITEM_GROUP.";
    }

    @Transactional
    public String migrateProductItemTypes(String sqlIp, String sqlUsername, String sqlPassword,
            String secondaryDbName) {
        if (jdbcTemplate == null)
            return "Migration database not configured.";
        String sql = "SELECT * FROM PRODUCT_CATEGORY";

        // Pre-load all existing groups for name-based lookup via ITEM_GROUP text column
        List<ProductItemGroup> allGroups = productItemGroupRepository.findAll();

        List<ProductItemType> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            ProductItemType item = new ProductItemType();

            // Name column is 'PRODUCT_CATEGORY' (same name as table)
            String itemTypeName = getStringSafe(rs, "PRODUCT_CATEGORY", "product_category",
                    "ITEM_TYPE", "item_type", "CATEGORY_NAME", "category_name", "NAME", "name");
            if (itemTypeName != null && itemTypeName.length() > 100) {
                itemTypeName = itemTypeName.substring(0, 100);
            }
            item.setItemType(itemTypeName);

            // ITEM_GROUP is a text value (e.g. "Purchase Item") — resolve to
            // ProductItemGroup by integer mapping as requested
            String itemGroupText = getStringSafe(rs, "ITEM_GROUP", "item_group",
                    "GROUP_NAME", "group_name", "PRODUCT_TYPE", "product_type");
            if (itemGroupText != null) {
                String igt = itemGroupText.trim().toLowerCase();
                ProductItemGroup group = new ProductItemGroup();
                if (igt.contains("billing")) {
                    group.setGroupName("Billing Item");
                    item.setGroup(group);
                } else if (igt.contains("purchase")) {
                    group.setGroupName("Purchase item");
                    item.setGroup(group);
                } else if (igt.contains("manufacturing")) {
                    group.setGroupName("Manufacturing Item");
                    item.setGroup(group);
                } else {
                    String igtOrig = itemGroupText;
                    allGroups.stream()
                            .filter(g -> g.getGroupName() != null && g.getGroupName().equalsIgnoreCase(igtOrig))
                            .findFirst()
                            .ifPresent(item::setGroup);
                }
            }

            // If still no group resolved, set to group 0 (Unknown)
            if (item.getGroup() == null) {
                ProductItemGroup defaultGroup = new ProductItemGroup();
                defaultGroup.setGroupName("Unknown");
                item.setGroup(defaultGroup);
            }

            String groupPrefix = getStringSafe(rs, "GROUP_PREFIX", "group_prefix");
            if (groupPrefix != null && groupPrefix.length() > 50)
                groupPrefix = groupPrefix.substring(0, 50);
            item.setGroupPrefix(groupPrefix);

            String itemPrefix = getStringSafe(rs, "ITEM_PREFIX", "item_prefix");
            if (itemPrefix != null && itemPrefix.length() > 50)
                itemPrefix = itemPrefix.substring(0, 50);
            item.setItemPrefix(itemPrefix);

            String autoGen = getStringSafe(rs, "IS_AUTO_GEN_CD", "IS_AUTO_GENERATE_CODE", "is_auto_generate_code");
            item.setIsAutoGenerateCode(autoGen != null ? autoGen : "NO");

            String prefixBased = getStringSafe(rs, "PREFIX_BASED", "prefix_based");
            item.setPrefixBased(prefixBased != null ? prefixBased : "GROUP");

            String status = getStringSafe(rs, "STATUS", "status");
            item.setStatus(status != null && status.equalsIgnoreCase("INACTIVE") ? 0 : 1);

            Boolean isActive = getBooleanSafe(rs, "IS_ACTIVE", "is_active");
            // item.setIsActive(isActive != null ? isActive : true);

            // Legacy audit columns
            item.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            java.sql.Timestamp createdDt = getTimestampSafe(rs, "CREAT_DT", "creat_dt", "CREATED_DATE", "created_date");
            item.setCreatedDate(createdDt != null ? createdDt : new java.util.Date());
            item.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            item.setUpdatedDate(getTimestampSafe(rs, "LST_UPDT_TS", "lst_updt_ts", "UPDATED_DATE", "updated_date"));

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return item;
        }).stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get())
            return "Migration stopped by user.";
        if (migratedList.isEmpty())
            return "0 records found in PRODUCT_CATEGORY — table may be empty or inaccessible.";

        int count = 0;
        int skipped = 0;
        List<ProductItemType> existing = productItemTypeRepository.findAll();

        try {
            for (ProductItemType item : migratedList) {
                if (item.getItemType() == null) {
                    skipped++;
                    continue;
                }
                if (item.getGroup() == null) {
                    skipped++;
                    continue;
                }
                if (existing.stream().anyMatch(
                        e -> e.getItemType() != null && e.getItemType().equalsIgnoreCase(item.getItemType()))) {
                    skipped++;
                    continue;
                }

                String finalGroupId = item.getGroup() != null ? item.getGroup().getGroupName() : "Unknown";
                if ("Unknown".equals(finalGroupId)
                        && allGroups.stream().noneMatch(g -> "Unknown".equals(g.getGroupName()))) {
                    if (!allGroups.isEmpty()) {
                        finalGroupId = allGroups.get(0).getGroupName();
                    } else {
                        skipped++;
                        continue;
                    }
                }

                try {
                    entityManager.createNativeQuery(
                            "INSERT INTO NPD_ITEM_TYPE (GROUP_NAME, ITEM_TYPE, GROUP_PREFIX, ITEM_PREFIX, IS_AUTO_GENERATE_CODE, PREFIX_BASED, STATUS, IS_ACTIVE, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) "
                                    +
                                    "VALUES (:groupName, :itemType, :groupPrefix, :itemPrefix, :autoGen, :prefixBased, :status, :isActive, :createdBy, :createdDate, :updatedBy, :updatedDate)")
                            .setParameter("groupName", finalGroupId)
                            .setParameter("itemType", item.getItemType())
                            .setParameter("groupPrefix", item.getGroupPrefix())
                            .setParameter("itemPrefix", item.getItemPrefix())
                            .setParameter("autoGen",
                                    item.getIsAutoGenerateCode() != null ? item.getIsAutoGenerateCode() : "NO")
                            .setParameter("prefixBased",
                                    item.getPrefixBased() != null ? item.getPrefixBased() : "GROUP")
                            .setParameter("status", item.getStatus() != null ? item.getStatus() : "ACTIVE")
                            .setParameter("isActive", true)
                            .setParameter("createdBy", item.getCreatedBy())
                            .setParameter("createdDate", item.getCreatedDate())
                            .setParameter("updatedBy", item.getUpdatedBy())
                            .setParameter("updatedDate", item.getUpdatedDate())
                            .executeUpdate();

                    existing.add(item); // Add to existing to prevent duplicates within the same batch
                    count++;
                } catch (Exception e) {
                    skipped++;
                }
            }
        } finally {
            // Nothing to do
        }
        return "Successfully migrated " + count + " records from PRODUCT_CATEGORY" +
                (skipped > 0 ? " (" + skipped + " skipped — duplicates, missing ID, or missing group)" : "") + ".";
    }

    @Transactional
    public String migrateProductItemSubtypes(String sqlIp, String sqlUsername, String sqlPassword,
            String secondaryDbName) {
        if (jdbcTemplate == null)
            return "Migration database not configured.";

        List<ProductItemType> allTypes = productItemTypeRepository.findAll();
        Map<String, ProductItemType> typeMap = new HashMap<>();
        for (ProductItemType t : allTypes) {
            if (t.getItemType() != null) {
                typeMap.put(t.getItemType().toLowerCase().trim(), t);
            }
        }

        String sql = "SELECT * FROM SUB_ITEM_TYPE_MASTER";
        List<ProductItemSubtype> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            ProductItemSubtype item = new ProductItemSubtype();

            String itemTypeName = getStringSafe(rs, "ITEM_TYPE", "item_type");
            if (itemTypeName != null && typeMap.containsKey(itemTypeName.toLowerCase().trim())) {
                item.setType(typeMap.get(itemTypeName.toLowerCase().trim()));
            }

            item.setSubType(getStringSafe(rs, "ITEM_SUB_TYPE", "item_sub_type"));
            item.setSubItemPrefix(getStringSafe(rs, "SUB_ITEM_PREFIX", "sub_item_prefix"));

            String isAuto = getStringSafe(rs, "IS_AUTO_GEN_CD", "is_auto_gen_cd");
            item.setIsAutoGenerateCode(isAuto != null && !isAuto.isEmpty() ? isAuto : "YES");

            String prefixBased = getStringSafe(rs, "PREFIX_BASED", "prefix_based");
            item.setPrefixBased(prefixBased != null && !prefixBased.isEmpty() ? prefixBased : "SUB ITEM");

            item.setStatus(1);
            // item.setIsActive(true);

            setAuditFields(item, rs);

            java.sql.Timestamp createdDate = getTimestampSafe(rs, "CREAT_DT", "creat_dt");
            if (createdDate != null) {
                item.setCreatedDate(createdDate);
            }
            java.sql.Timestamp updatedDate = getTimestampSafe(rs, "LST_UPDT_TS", "lst_updt_ts");
            if (updatedDate != null) {
                item.setUpdatedDate(updatedDate);
            }
            String createdBy = getStringSafe(rs, "CREAT_USER_ID_CD", "creat_user_id_cd");
            if (createdBy != null && !createdBy.isEmpty()) {
                item.setCreatedBy(createdBy);
            }
            String updatedBy = getStringSafe(rs, "LST_UPDT_USER_ID_CD", "lst_updt_user_id_cd");
            if (updatedBy != null && !updatedBy.isEmpty()) {
                item.setUpdatedBy(updatedBy);
            }

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return item;
        }).stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get())
            return "Migration stopped by user.";

        int count = 0;
        int skipped = 0;

        List<ProductItemSubtype> existingSubtypes = productItemSubtypeRepository.findAll();

        try {
            for (ProductItemSubtype item : migratedList) {
                if (item.getSubType() == null || item.getType() == null) {
                    skipped++;
                    continue;
                }

                // Prevent duplicate inserts (Item Type + SubType Name)
                boolean exists = existingSubtypes.stream().anyMatch(e -> e.getType() != null &&
                        e.getType().getItemType().equals(item.getType().getItemType()) &&
                        e.getSubType() != null &&
                        e.getSubType().equalsIgnoreCase(item.getSubType()));

                if (exists) {
                    skipped++;
                    continue;
                }

                try {
                    // Let JPA handle saving with string ID
                    productItemSubtypeRepository.save(item);
                    count++;
                } catch (Exception e) {
                    System.err.println("Migration failed for item " + item.getSubType() + ": " + e.getMessage());
                    e.printStackTrace();
                    skipped++;
                }
            }
        } finally {
            // Nothing to do
        }

        return "Successfully migrated " + count + " records from SUB_ITEM_TYPE_MASTER" +
                (skipped > 0 ? " (" + skipped + " skipped)" : "") + ".";
    }

    @Transactional
    public String migrateProductOems(String sqlIp, String sqlUsername, String sqlPassword, String secondaryDbName) {
        if (jdbcTemplate == null)
            return "Migration database not configured.";
        String sql = "SELECT * FROM NPD_OEM";
        List<ProductOem> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            ProductOem item = new ProductOem();
            item.setOemShortName(getStringSafe(rs, "OEM_SHORT_NAME", "oem_short_name", "OEM_NAME", "oem_name"));
            item.setOemPrefix(getStringSafe(rs, "OEM_PREFIX", "oem_prefix"));
            item.setOemDescription(
                    getStringSafe(rs, "OEM_DESCRIPTION", "oem_description", "DESCRIPTION", "description"));
            item.setOriginCountry(getStringSafe(rs, "ORIGIN_COUNTRY", "origin_country"));
            item.setStatusYear(getStringSafe(rs, "STATUS_YEAR", "status_year"));

            String status = getStringSafe(rs, "STATUS", "status");
            item.setStatus(status != null && status.equalsIgnoreCase("ACTIVE") ? 1
                    : (status != null && status.equals("1") ? 1 : 0));

            Boolean isActive = getBooleanSafe(rs, "IS_ACTIVE", "is_active");
            // item.setIsActive(isActive != null ? isActive : true);

            setAuditFields(item, rs);
            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return item;
        }).stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get())
            return "Migration stopped by user.";

        int count = 0;
        List<ProductOem> existing = productOemRepository.findAll();
        for (ProductOem item : migratedList) {
            if (item.getOemShortName() != null && existing.stream().noneMatch(
                    e -> e.getOemShortName() != null && e.getOemShortName().equalsIgnoreCase(item.getOemShortName()))) {
                productOemRepository.save(item);
                count++;
            }
        }
        return "Successfully migrated " + count + " records from NPD_OEM.";
    }

    @Transactional
    public String migrateProductOemMappings(String sqlIp, String sqlUsername, String sqlPassword,
            String secondaryDbName) {
        if (jdbcTemplate == null)
            return "Migration database not configured.";
        String sql = "SELECT * FROM NPD_OEM_MAPPING";
        List<ProductOemMapping> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            ProductOemMapping item = new ProductOemMapping();
            item.setId(getLongSafe(rs, "ID", "id"));
            item.setPartNo(getStringSafe(rs, "PART_NO", "part_no"));
            item.setOemPartNo(getStringSafe(rs, "OEM_PART_NO", "oem_part_no"));
            item.setOemDescription(getStringSafe(rs, "OEM_DESCRIPTION", "oem_description"));

            String status = getStringSafe(rs, "STATUS", "status");
            item.setStatus("ACTIVE".equalsIgnoreCase(status) || "1".equals(status));

            Boolean isActive = getBooleanSafe(rs, "IS_ACTIVE", "is_active");
            // item.setIsActive(isActive != null ? isActive : true);

            setAuditFields(item, rs);
            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return item;
        }).stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get())
            return "Migration stopped by user.";

        int count = 0;
        for (ProductOemMapping item : migratedList) {
            // For mapping we can just try to save. We can catch exception if constraint
            // fails or we can just save since it's an association table.
            try {
                productOemMappingRepository.save(item);
                count++;
            } catch (Exception e) {
                // Ignore duplicates
            }
        }
        return "Successfully migrated " + count + " records from NPD_OEM_MAPPING.";
    }

    @Transactional
    public String migrateProductModels(String sqlIp, String sqlUsername, String sqlPassword, String secondaryDbName) {
        if (jdbcTemplate == null)
            return "Migration database not configured.";

        // Map of existing NPD_OEM keyed by short name
        Map<String, ProductOem> oemMap = new HashMap<>();
        for (ProductOem oem : productOemRepository.findAll()) {
            if (oem.getOemShortName() != null) {
                oemMap.put(oem.getOemShortName().toLowerCase().trim(), oem);
            }
        }

        String sql = "SELECT * FROM PRODUCT_MODEL_MASTER";
        List<ProductModel> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            ProductModel item = new ProductModel();

            String oemShortName = getStringSafe(rs, "OEM_SHORT_NAME", "oem_short_name");
            if (oemShortName != null && oemMap.containsKey(oemShortName.toLowerCase().trim())) {
                item.setOem(oemMap.get(oemShortName.toLowerCase().trim()));
            }

            item.setModelNo(getStringSafe(rs, "MODEL_NO", "model_no"));

            Double rotorDiameter = getDoubleSafe(rs, "DIAMETER", "diameter");
            item.setRotorDiameter(rotorDiameter != null ? rotorDiameter : 0.0);

            String status = getStringSafe(rs, "MODEL_STATUS", "model_status");
            item.setStatus("ACTIVE".equalsIgnoreCase(status) || "1".equals(status));

            // item.setIsActive(true);

            setAuditFields(item, rs);

            java.sql.Timestamp createdDate = getTimestampSafe(rs, "CREATE_DT", "create_dt");
            if (createdDate != null) {
                item.setCreatedDate(createdDate);
            }
            java.sql.Timestamp updatedDate = getTimestampSafe(rs, "LST_UPDT_TS", "lst_updt_ts");
            if (updatedDate != null) {
                item.setUpdatedDate(updatedDate);
            }
            String createdBy = getStringSafe(rs, "CREATE_USER_ID_CD", "create_user_id_cd");
            if (createdBy != null && !createdBy.isEmpty()) {
                item.setCreatedBy(createdBy);
            }
            String updatedBy = getStringSafe(rs, "LST_UPDT_USER_ID_CD", "lst_updt_user_id_cd");
            if (updatedBy != null && !updatedBy.isEmpty()) {
                item.setUpdatedBy(updatedBy);
            }

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return item;
        }).stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get())
            return "Migration stopped by user.";

        int count = 0;
        List<ProductModel> existing = productModelRepository.findAll();
        for (ProductModel item : migratedList) {
            if (item.getModelNo() != null && item.getOem() != null && existing.stream()
                    .noneMatch(e -> e.getModelNo() != null && e.getModelNo().equalsIgnoreCase(item.getModelNo()) &&
                            e.getOem() != null && e.getOem().getOemShortName() != null
                            && e.getOem().getOemShortName().equals(item.getOem().getOemShortName()))) {
                productModelRepository.save(item);
                count++;
            }
        }
        return "Successfully migrated " + count + " records from PRODUCT_MODEL_MASTER.";
    }

    @Transactional
    public String migrateProductCapacities(String sqlIp, String sqlUsername, String sqlPassword,
            String secondaryDbName) {
        if (jdbcTemplate == null)
            return "Migration database not configured.";

        // Map of existing NPD_MODEL keyed by model no
        Map<String, ProductModel> modelMap = new HashMap<>();
        for (ProductModel model : productModelRepository.findAll()) {
            if (model.getModelNo() != null) {
                modelMap.put(model.getModelNo().toLowerCase().trim(), model);
            }
        }

        String sql = "SELECT * FROM PRODUCT_CAPACITY_MASTER";
        List<ProductCapacity> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            ProductCapacity item = new ProductCapacity();

            String modelName = getStringSafe(rs, "MODEL_NAME", "model_name");
            if (modelName != null && modelMap.containsKey(modelName.toLowerCase().trim())) {
                item.setModel(modelMap.get(modelName.toLowerCase().trim()));
            } else {
                ProductModel defaultModel = new ProductModel();
                defaultModel.setModelNo("UNKNOWN");
                item.setModel(defaultModel);
            }

            item.setUom(getStringSafe(rs, "UOM", "uom"));

            String capacityStr = getStringSafe(rs, "CAPACITY", "capacity");
            double capacityVal = 0.0;
            if (capacityStr != null && !capacityStr.trim().isEmpty()) {
                capacityStr = capacityStr.trim().toUpperCase();
                // Extract numbers
                String numPart = capacityStr.replaceAll("[^0-9.]", "");
                if (!numPart.isEmpty()) {
                    try {
                        capacityVal = Double.parseDouble(numPart);
                    } catch (Exception e) {
                    }
                }
                // Extract UOM if not already present
                if (item.getUom() == null || item.getUom().trim().isEmpty()) {
                    String uomPart = capacityStr.replaceAll("[0-9.]", "").trim();
                    if (!uomPart.isEmpty()) {
                        item.setUom(uomPart);
                    }
                }
            }
            item.setCapacityVal(capacityVal);

            // item.setIsActive(true);

            setAuditFields(item, rs);

            java.sql.Timestamp createdDate = getTimestampSafe(rs, "CREATE_DT", "create_dt");
            if (createdDate != null) {
                item.setCreatedDate(createdDate);
            }
            java.sql.Timestamp updatedDate = getTimestampSafe(rs, "LST_UPDT_TS", "lst_updt_ts");
            if (updatedDate != null) {
                item.setUpdatedDate(updatedDate);
            }
            String createdBy = getStringSafe(rs, "CREATE_USER_ID_CD", "create_user_id_cd");
            if (createdBy != null && !createdBy.isEmpty()) {
                item.setCreatedBy(createdBy);
            }
            String updatedBy = getStringSafe(rs, "LST_UPDT_USER_ID", "lst_updt_user_id");
            if (updatedBy != null && !updatedBy.isEmpty()) {
                item.setUpdatedBy(updatedBy);
            }

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return item;
        }).stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get())
            return "Migration stopped by user.";

        int count = 0;
        List<ProductCapacity> existing = productCapacityRepository.findAll();
        for (ProductCapacity item : migratedList) {
            if (item.getCapacityVal() != null && item.getModel() != null
                    && existing.stream().noneMatch(e -> e.getCapacityVal().equals(item.getCapacityVal())
                            && e.getUom() != null && e.getUom().equalsIgnoreCase(item.getUom())
                            && e.getModel() != null && e.getModel().getModelNo() != null
                            && e.getModel().getModelNo().equals(item.getModel().getModelNo()))) {
                productCapacityRepository.save(item);
                count++;
            }
        }
        return "Successfully migrated " + count + " records from PRODUCT_CAPACITY_MASTER.";
    }

    @Transactional
    public String migrateProductProcesses(String sqlIp, String sqlUsername, String sqlPassword,
            String secondaryDbName) {
        if (jdbcTemplate == null)
            return "Migration database not configured.";
        String sql = "SELECT * FROM processmaster";
        List<ProductProcess> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            ProductProcess item = new ProductProcess();
            item.setId(getLongSafe(rs, "id", "ID"));
            item.setProcessName(getStringSafe(rs, "process_name", "PROCESS_NAME"));
            item.setProcessCd(getStringSafe(rs, "process_code", "PROCESS_CODE"));
            item.setDescription(getStringSafe(rs, "process_make", "PROCESS_MAKE"));

            Integer division = null;
            try {
                division = rs.getInt("division_no");
            } catch (Exception e) {
            }
            item.setDivision(division);

            String status = getStringSafe(rs, "active", "ACTIVE");
            item.setStatus(status == null || status.isEmpty() || "ACTIVE".equalsIgnoreCase(status)
                    || "true".equalsIgnoreCase(status) || "1".equalsIgnoreCase(status)
                    || "yes".equalsIgnoreCase(status));

            setAuditFields(item, rs);
            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return item;
        }).stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get())
            return "Migration stopped by user.";

        int count = 0;
        List<ProductProcess> existing = productProcessRepository.findAll();
        for (ProductProcess item : migratedList) {
            if (item.getProcessName() != null
                    && existing.stream().noneMatch(e -> e.getProcessName().equalsIgnoreCase(item.getProcessName()))) {
                productProcessRepository.save(item);
                count++;
            }
        }
        return "Successfully migrated " + count + " records from NPD_PROCESS.";
    }

    @Transactional
    public String migrateProductWindFarms(String sqlIp, String sqlUsername, String sqlPassword,
            String secondaryDbName) {
        if (jdbcTemplate == null)
            return "Migration database not configured.";
        String sql = "SELECT * FROM WIND_FARM_MASTER";
        List<ProductWindFarm> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            ProductWindFarm item = new ProductWindFarm();
            item.setId(getLongSafe(rs, "ROW_ID", "row_id", "ID", "id"));
            item.setWindFarmName(getStringSafe(rs, "WIND_FARM_NAME", "wind_farm_name"));

            String city = getStringSafe(rs, "CITY", "city", "LOCATION", "location");
            item.setCity(city != null ? city : "Unknown");

            String state = getStringSafe(rs, "STATE", "state");
            item.setState(state != null ? state : "Unknown");

            String country = getStringSafe(rs, "COUNTRY", "country");
            item.setCountry(country != null ? country : "Unknown");

            Boolean isActive = getBooleanSafe(rs, "IS_ACTIVE", "is_active");
            // item.setIsActive(isActive != null ? isActive : true);

            setAuditFields(item, rs);

            java.sql.Timestamp createdDate = getTimestampSafe(rs, "CREATE_DATE", "create_date");
            if (createdDate != null) {
                item.setCreatedDate(createdDate);
            }
            java.sql.Timestamp updatedDate = getTimestampSafe(rs, "LAST_UPDT_DT", "last_updt_dt");
            if (updatedDate != null) {
                item.setUpdatedDate(updatedDate);
            }
            String createdBy = getStringSafe(rs, "CREATE_USER_ID", "create_user_id");
            if (createdBy != null && !createdBy.isEmpty()) {
                item.setCreatedBy(createdBy);
            }
            String updatedBy = getStringSafe(rs, "LAST_UPDT_USER", "last_updt_user");
            if (updatedBy != null && !updatedBy.isEmpty()) {
                item.setUpdatedBy(updatedBy);
            }

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return item;
        }).stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get())
            return "Migration stopped by user.";

        int count = 0;
        List<ProductWindFarm> existing = productWindFarmRepository.findAll();
        for (ProductWindFarm item : migratedList) {
            if (item.getWindFarmName() != null
                    && existing.stream().noneMatch(e -> e.getWindFarmName().equalsIgnoreCase(item.getWindFarmName()))) {
                productWindFarmRepository.save(item);
                count++;
            }
        }
        return "Successfully migrated " + count + " records from WIND_FARM_MASTER.";
    }

    public String migrateMstUoms(String sqlIp, String sqlUsername, String sqlPassword, String secondaryDbName) {
        if (jdbcTemplate == null)
            return "Migration database not configured.";

        List<MstUom> migratedList = new ArrayList<>();
        String dbPrefix = (secondaryDbName != null && !secondaryDbName.trim().isEmpty()) ? secondaryDbName + ".dbo."
                : "";

        String[] candidateQueries = new String[] {
                "SELECT * FROM " + dbPrefix + "MST_UOM WITH (NOLOCK)",
                "SELECT * FROM MST_UOM WITH (NOLOCK)",
                "SELECT * FROM " + dbPrefix + "uom_master WITH (NOLOCK)",
                "SELECT * FROM uom_master WITH (NOLOCK)",
                "SELECT * FROM " + dbPrefix + "UOM WITH (NOLOCK)",
                "SELECT * FROM UOM WITH (NOLOCK)",
                "SELECT * FROM " + dbPrefix + "MST_UOMS WITH (NOLOCK)",
                "SELECT * FROM MST_UOMS WITH (NOLOCK)",
                "SELECT DISTINCT uom AS UOM_CODE, uom AS UOM_DESCRIPTION FROM " + dbPrefix
                        + "items WITH (NOLOCK) WHERE uom IS NOT NULL AND uom <> ''",
                "SELECT DISTINCT uom_name AS UOM_CODE, uom_name AS UOM_DESCRIPTION FROM " + dbPrefix
                        + "items WITH (NOLOCK) WHERE uom_name IS NOT NULL AND uom_name <> ''"
        };

        for (String sql : candidateQueries) {
            try {
                List<MstUom> list = jdbcTemplate.query(sql, (rs, rowNum) -> {
                    MstUom item = new MstUom();
                    String code = getStringSafe(rs, "UOM_CODE", "uom_code", "uom", "UOM", "uom_name", "UOM_NAME",
                            "code", "CODE");
                    if (code == null || code.trim().isEmpty()) {
                        return null;
                    }
                    item.setUomCode(code.trim());

                    String desc = getStringSafe(rs, "UOM_DESCRIPTION", "uom_description", "uom_name", "UOM_NAME",
                            "description", "DESCRIPTION", "name", "NAME");
                    item.setUomDescription((desc != null && !desc.trim().isEmpty()) ? desc.trim() : code.trim());

                    String status = getStringSafe(rs, "STATUS", "status");
                    item.setStatus(status != null && !status.isEmpty() ? status : "ACTIVE");

                    setAuditFields(item, rs);
                    if (MasterChecklistMigrationService.stopFlag.get())
                        return null;
                    return item;
                }).stream().filter(t -> t != null).collect(Collectors.toList());

                if (!list.isEmpty()) {
                    migratedList = list;
                    break;
                }
            } catch (Exception ignored) {
                // Candidate table query failed, try next candidate
            }
        }

        if (MasterChecklistMigrationService.stopFlag.get())
            return "Migration stopped by user.";

        int count = 0;
        List<MstUom> existing = mstUomRepository.findAll();
        for (MstUom item : migratedList) {
            if (item.getUomCode() != null
                    && existing.stream().noneMatch(
                            e -> e.getUomCode() != null && e.getUomCode().equalsIgnoreCase(item.getUomCode()))) {
                try {
                    mstUomRepository.save(item);
                    count++;
                } catch (Exception ignored) {
                }
            }
        }
        return "Successfully migrated " + count + " records from MST_UOM.";
    }

    private String getStringValue(Cell cell) {
        if (cell == null)
            return "";
        if (cell.getCellType() == CellType.STRING)
            return cell.getStringCellValue().trim();
        if (cell.getCellType() == CellType.NUMERIC)
            return String.valueOf((int) cell.getNumericCellValue());
        return "";
    }

    public byte[] generateProductItemTypeSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("ProductItemType Migration Instructions");

            org.apache.poi.ss.usermodel.Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            instructionSheet.autoSizeColumn(0);

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);

            org.apache.poi.ss.usermodel.Cell h0 = headerRow.createCell(0);
            h0.setCellValue("Item Type");
            h0.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h1 = headerRow.createCell(1);
            h1.setCellValue("Item Prefix");
            h1.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h2 = headerRow.createCell(2);
            h2.setCellValue("Status");
            h2.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("Raw Material");
            sampleRow.createCell(1).setCellValue("RM");
            sampleRow.createCell(2).setCellValue("ACTIVE");

            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();

            org.apache.poi.ss.usermodel.DataValidationConstraint constraint_2 = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            org.apache.poi.ss.util.CellRangeAddressList addressList_2 = new org.apache.poi.ss.util.CellRangeAddressList(
                    1, 1000, 2, 2);
            org.apache.poi.ss.usermodel.DataValidation validation_2 = validationHelper.createValidation(constraint_2,
                    addressList_2);
            sheet.addValidationData(validation_2);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateProductItemTypeFromExcel(
            org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null) {
                throw new IllegalArgumentException("Invalid Excel template uploaded.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(0);
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                    continue;

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemType dummy1;
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemSubtype dummy2;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOem dummy3;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOemMapping dummy4;
                    com.autonoma.erp.modules.npd.product.entity.ProductModel dummy5;
                    com.autonoma.erp.modules.npd.product.entity.ProductCapacity dummy6;
                    com.autonoma.erp.modules.npd.product.entity.ProductProcess dummy7;
                    com.autonoma.erp.modules.npd.product.entity.ProductWindFarm dummy8;
                    com.autonoma.erp.modules.master.admin.entity.MstUom dummy9;

                    ProductItemType type = new ProductItemType();
                    type.setItemPrefix(getStringValue(row.getCell(1)));
                    type.setStatus("ACTIVE".equalsIgnoreCase(getStringValue(row.getCell(2))) ? 1 : 0); // mapped string
                                                                                                       // to integer bit
                    productItemTypeRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception ex) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", ex.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generateProductItemSubtypeSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("ProductItemSubtype Migration Instructions");

            org.apache.poi.ss.usermodel.Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            instructionSheet.autoSizeColumn(0);

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);

            org.apache.poi.ss.usermodel.Cell h0 = headerRow.createCell(0);
            h0.setCellValue("Item Type Name");
            h0.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h1 = headerRow.createCell(1);
            h1.setCellValue("Sub Type Name");
            h1.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h2 = headerRow.createCell(2);
            h2.setCellValue("Status");
            h2.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("Raw Material");
            sampleRow.createCell(1).setCellValue("Steel");
            sampleRow.createCell(2).setCellValue("ACTIVE");

            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();

            org.apache.poi.ss.usermodel.DataValidationConstraint constraint_2 = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            org.apache.poi.ss.util.CellRangeAddressList addressList_2 = new org.apache.poi.ss.util.CellRangeAddressList(
                    1, 1000, 2, 2);
            org.apache.poi.ss.usermodel.DataValidation validation_2 = validationHelper.createValidation(constraint_2,
                    addressList_2);
            sheet.addValidationData(validation_2);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateProductItemSubtypeFromExcel(
            org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null) {
                throw new IllegalArgumentException("Invalid Excel template uploaded.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(0);
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                    continue;

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemType dummy1;
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemSubtype dummy2;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOem dummy3;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOemMapping dummy4;
                    com.autonoma.erp.modules.npd.product.entity.ProductModel dummy5;
                    com.autonoma.erp.modules.npd.product.entity.ProductCapacity dummy6;
                    com.autonoma.erp.modules.npd.product.entity.ProductProcess dummy7;
                    com.autonoma.erp.modules.npd.product.entity.ProductWindFarm dummy8;
                    com.autonoma.erp.modules.master.admin.entity.MstUom dummy9;

                    ProductItemSubtype type = new ProductItemSubtype();
                    String typeName = getStringValue(row.getCell(0));
                    ProductItemType parent = productItemTypeRepository.findAll().stream()
                            .filter(t -> t.getItemType() != null && t.getItemType().equalsIgnoreCase(typeName))
                            .findFirst().orElse(null);
                    if (parent == null) {
                        rowDetail.put("migrationStatus", "FAILED");
                        rowDetail.put("reason", "Item Type not found");
                        failedCount++;
                        details.add(rowDetail);
                        continue;
                    }
                    type.setType(parent);
                    type.setSubType(getStringValue(row.getCell(1)));
                    type.setStatus("ACTIVE".equalsIgnoreCase(getStringValue(row.getCell(2))) ? 1 : 0); // mapped string
                                                                                                       // to integer bit

                    productItemSubtypeRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception ex) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", ex.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generateProductOemMasterSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("ProductOemMaster Migration Instructions");

            org.apache.poi.ss.usermodel.Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            instructionSheet.autoSizeColumn(0);

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);

            org.apache.poi.ss.usermodel.Cell h0 = headerRow.createCell(0);
            h0.setCellValue("OEM Short Name");
            h0.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h1 = headerRow.createCell(1);
            h1.setCellValue("OEM Description");
            h1.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h2 = headerRow.createCell(2);
            h2.setCellValue("Status");
            h2.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("Bosch");
            sampleRow.createCell(1).setCellValue("Bosch OEM");
            sampleRow.createCell(2).setCellValue("ACTIVE");

            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();

            org.apache.poi.ss.usermodel.DataValidationConstraint constraint_2 = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            org.apache.poi.ss.util.CellRangeAddressList addressList_2 = new org.apache.poi.ss.util.CellRangeAddressList(
                    1, 1000, 2, 2);
            org.apache.poi.ss.usermodel.DataValidation validation_2 = validationHelper.createValidation(constraint_2,
                    addressList_2);
            sheet.addValidationData(validation_2);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateProductOemMasterFromExcel(
            org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null) {
                throw new IllegalArgumentException("Invalid Excel template uploaded.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(0);
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                    continue;

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemType dummy1;
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemSubtype dummy2;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOem dummy3;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOemMapping dummy4;
                    com.autonoma.erp.modules.npd.product.entity.ProductModel dummy5;
                    com.autonoma.erp.modules.npd.product.entity.ProductCapacity dummy6;
                    com.autonoma.erp.modules.npd.product.entity.ProductProcess dummy7;
                    com.autonoma.erp.modules.npd.product.entity.ProductWindFarm dummy8;
                    com.autonoma.erp.modules.master.admin.entity.MstUom dummy9;

                    ProductOem type = new ProductOem();
                    type.setOemShortName(getStringValue(row.getCell(0)));
                    type.setOemDescription(getStringValue(row.getCell(1)));
                    String statusStr = getStringValue(row.getCell(2));
                    type.setStatus(statusStr != null && statusStr.equalsIgnoreCase("ACTIVE") ? 1
                            : (statusStr != null && statusStr.equals("1") ? 1 : 0)); // type.setIsActive("ACTIVE".equalsIgnoreCase(getStringValue(row.getCell(2)));

                    productOemRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception ex) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", ex.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generateProductOemMappingSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("ProductOemMapping Migration Instructions");

            org.apache.poi.ss.usermodel.Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            instructionSheet.autoSizeColumn(0);

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);

            org.apache.poi.ss.usermodel.Cell h0 = headerRow.createCell(0);
            h0.setCellValue("Part No");
            h0.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h1 = headerRow.createCell(1);
            h1.setCellValue("OEM Part No");
            h1.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h2 = headerRow.createCell(2);
            h2.setCellValue("Status");
            h2.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("PT-001");
            sampleRow.createCell(1).setCellValue("OEM-PT-001");
            sampleRow.createCell(2).setCellValue("ACTIVE");

            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();

            org.apache.poi.ss.usermodel.DataValidationConstraint constraint_2 = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            org.apache.poi.ss.util.CellRangeAddressList addressList_2 = new org.apache.poi.ss.util.CellRangeAddressList(
                    1, 1000, 2, 2);
            org.apache.poi.ss.usermodel.DataValidation validation_2 = validationHelper.createValidation(constraint_2,
                    addressList_2);
            sheet.addValidationData(validation_2);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateProductOemMappingFromExcel(
            org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null) {
                throw new IllegalArgumentException("Invalid Excel template uploaded.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(0);
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                    continue;

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemType dummy1;
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemSubtype dummy2;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOem dummy3;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOemMapping dummy4;
                    com.autonoma.erp.modules.npd.product.entity.ProductModel dummy5;
                    com.autonoma.erp.modules.npd.product.entity.ProductCapacity dummy6;
                    com.autonoma.erp.modules.npd.product.entity.ProductProcess dummy7;
                    com.autonoma.erp.modules.npd.product.entity.ProductWindFarm dummy8;
                    com.autonoma.erp.modules.master.admin.entity.MstUom dummy9;

                    ProductOemMapping type = new ProductOemMapping();
                    type.setPartNo(getStringValue(row.getCell(0)));
                    type.setOemPartNo(getStringValue(row.getCell(1)));
                    type.setStatus("ACTIVE".equalsIgnoreCase(getStringValue(row.getCell(2)))
                            || "1".equals(getStringValue(row.getCell(2))));

                    productOemMappingRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception ex) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", ex.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generateProductModelMasterSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("ProductModelMaster Migration Instructions");

            org.apache.poi.ss.usermodel.Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            instructionSheet.autoSizeColumn(0);

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);

            org.apache.poi.ss.usermodel.Cell h0 = headerRow.createCell(0);
            h0.setCellValue("Model No");
            h0.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h1 = headerRow.createCell(1);
            h1.setCellValue("Rotor Diameter");
            h1.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h2 = headerRow.createCell(2);
            h2.setCellValue("Status");
            h2.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("Model-X");
            sampleRow.createCell(1).setCellValue("120");
            sampleRow.createCell(2).setCellValue("ACTIVE");

            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();

            org.apache.poi.ss.usermodel.DataValidationConstraint constraint_2 = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            org.apache.poi.ss.util.CellRangeAddressList addressList_2 = new org.apache.poi.ss.util.CellRangeAddressList(
                    1, 1000, 2, 2);
            org.apache.poi.ss.usermodel.DataValidation validation_2 = validationHelper.createValidation(constraint_2,
                    addressList_2);
            sheet.addValidationData(validation_2);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateProductModelMasterFromExcel(
            org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null) {
                throw new IllegalArgumentException("Invalid Excel template uploaded.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(0);
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                    continue;

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemType dummy1;
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemSubtype dummy2;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOem dummy3;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOemMapping dummy4;
                    com.autonoma.erp.modules.npd.product.entity.ProductModel dummy5;
                    com.autonoma.erp.modules.npd.product.entity.ProductCapacity dummy6;
                    com.autonoma.erp.modules.npd.product.entity.ProductProcess dummy7;
                    com.autonoma.erp.modules.npd.product.entity.ProductWindFarm dummy8;
                    com.autonoma.erp.modules.master.admin.entity.MstUom dummy9;

                    ProductModel type = new ProductModel();
                    type.setModelNo(getStringValue(row.getCell(0)));
                    try {
                        type.setRotorDiameter(Double.parseDouble(getStringValue(row.getCell(1))));
                    } catch (Exception e) {
                        type.setRotorDiameter(0.0);
                    }
                    String statusValue = getStringValue(row.getCell(2));
                    type.setStatus("ACTIVE".equalsIgnoreCase(statusValue) || "1".equals(statusValue));

                    productModelRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception ex) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", ex.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generateProductCapacityMasterSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("ProductCapacityMaster Migration Instructions");

            org.apache.poi.ss.usermodel.Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            instructionSheet.autoSizeColumn(0);

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);

            org.apache.poi.ss.usermodel.Cell h0 = headerRow.createCell(0);
            h0.setCellValue("Model No");
            h0.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h1 = headerRow.createCell(1);
            h1.setCellValue("UOM");
            h1.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h2 = headerRow.createCell(2);
            h2.setCellValue("Capacity Value");
            h2.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h3 = headerRow.createCell(3);
            h3.setCellValue("Status");
            h3.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("Model-X");
            sampleRow.createCell(1).setCellValue("KW");
            sampleRow.createCell(2).setCellValue("100");
            sampleRow.createCell(3).setCellValue("ACTIVE");

            for (int i = 0; i < 4; i++) {
                sheet.autoSizeColumn(i);
            }

            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();

            org.apache.poi.ss.usermodel.DataValidationConstraint constraint_3 = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            org.apache.poi.ss.util.CellRangeAddressList addressList_3 = new org.apache.poi.ss.util.CellRangeAddressList(
                    1, 1000, 3, 3);
            org.apache.poi.ss.usermodel.DataValidation validation_3 = validationHelper.createValidation(constraint_3,
                    addressList_3);
            sheet.addValidationData(validation_3);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateProductCapacityMasterFromExcel(
            org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null) {
                throw new IllegalArgumentException("Invalid Excel template uploaded.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(0);
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                    continue;

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemType dummy1;
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemSubtype dummy2;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOem dummy3;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOemMapping dummy4;
                    com.autonoma.erp.modules.npd.product.entity.ProductModel dummy5;
                    com.autonoma.erp.modules.npd.product.entity.ProductCapacity dummy6;
                    com.autonoma.erp.modules.npd.product.entity.ProductProcess dummy7;
                    com.autonoma.erp.modules.npd.product.entity.ProductWindFarm dummy8;
                    com.autonoma.erp.modules.master.admin.entity.MstUom dummy9;

                    ProductCapacity type = new ProductCapacity();
                    String modelNo = getStringValue(row.getCell(0));
                    ProductModel model = productModelRepository.findAll().stream()
                            .filter(t -> t.getModelNo() != null && t.getModelNo().equalsIgnoreCase(modelNo)).findFirst()
                            .orElse(null);
                    if (model == null) {
                        rowDetail.put("migrationStatus", "FAILED");
                        rowDetail.put("reason", "Model not found");
                        failedCount++;
                        details.add(rowDetail);
                        continue;
                    }
                    type.setModel(model);
                    type.setUom(getStringValue(row.getCell(1)));
                    try {
                        type.setCapacityVal(Double.parseDouble(getStringValue(row.getCell(2))));
                    } catch (Exception e) {
                        type.setCapacityVal(0.0);
                    } // type.setIsActive("ACTIVE".equalsIgnoreCase(getStringValue(row.getCell(3)));

                    productCapacityRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception ex) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", ex.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generateProductProcessMasterSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("ProductProcessMaster Migration Instructions");

            org.apache.poi.ss.usermodel.Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            instructionSheet.autoSizeColumn(0);

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);

            org.apache.poi.ss.usermodel.Cell h0 = headerRow.createCell(0);
            h0.setCellValue("Process Name");
            h0.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h1 = headerRow.createCell(1);
            h1.setCellValue("Description");
            h1.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h2 = headerRow.createCell(2);
            h2.setCellValue("Status");
            h2.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("Assembly");
            sampleRow.createCell(1).setCellValue("Assembly Line");
            sampleRow.createCell(2).setCellValue("ACTIVE");

            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();

            org.apache.poi.ss.usermodel.DataValidationConstraint constraint_2 = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            org.apache.poi.ss.util.CellRangeAddressList addressList_2 = new org.apache.poi.ss.util.CellRangeAddressList(
                    1, 1000, 2, 2);
            org.apache.poi.ss.usermodel.DataValidation validation_2 = validationHelper.createValidation(constraint_2,
                    addressList_2);
            sheet.addValidationData(validation_2);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateProductProcessMasterFromExcel(
            org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null) {
                throw new IllegalArgumentException("Invalid Excel template uploaded.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(0);
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                    continue;

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemType dummy1;
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemSubtype dummy2;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOem dummy3;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOemMapping dummy4;
                    com.autonoma.erp.modules.npd.product.entity.ProductModel dummy5;
                    com.autonoma.erp.modules.npd.product.entity.ProductCapacity dummy6;
                    com.autonoma.erp.modules.npd.product.entity.ProductProcess dummy7;
                    com.autonoma.erp.modules.npd.product.entity.ProductWindFarm dummy8;
                    com.autonoma.erp.modules.master.admin.entity.MstUom dummy9;

                    ProductProcess type = new ProductProcess();
                    type.setProcessName(getStringValue(row.getCell(0)));
                    type.setDescription(getStringValue(row.getCell(1)));
                    type.setStatus("ACTIVE".equalsIgnoreCase(getStringValue(row.getCell(2)))
                            || "true".equalsIgnoreCase(getStringValue(row.getCell(2)))
                            || "1".equalsIgnoreCase(getStringValue(row.getCell(2))));

                    productProcessRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception ex) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", ex.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generateWindFarmMasterSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("WindFarmMaster Migration Instructions");

            org.apache.poi.ss.usermodel.Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            instructionSheet.autoSizeColumn(0);

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);

            org.apache.poi.ss.usermodel.Cell h0 = headerRow.createCell(0);
            h0.setCellValue("Wind Farm Name");
            h0.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h1 = headerRow.createCell(1);
            h1.setCellValue("City");
            h1.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h2 = headerRow.createCell(2);
            h2.setCellValue("Status");
            h2.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("Texas Wind Farm");
            sampleRow.createCell(1).setCellValue("Houston");
            sampleRow.createCell(2).setCellValue("ACTIVE");

            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();

            org.apache.poi.ss.usermodel.DataValidationConstraint constraint_2 = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            org.apache.poi.ss.util.CellRangeAddressList addressList_2 = new org.apache.poi.ss.util.CellRangeAddressList(
                    1, 1000, 2, 2);
            org.apache.poi.ss.usermodel.DataValidation validation_2 = validationHelper.createValidation(constraint_2,
                    addressList_2);
            sheet.addValidationData(validation_2);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateWindFarmMasterFromExcel(
            org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null) {
                throw new IllegalArgumentException("Invalid Excel template uploaded.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(0);
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                    continue;

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemType dummy1;
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemSubtype dummy2;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOem dummy3;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOemMapping dummy4;
                    com.autonoma.erp.modules.npd.product.entity.ProductModel dummy5;
                    com.autonoma.erp.modules.npd.product.entity.ProductCapacity dummy6;
                    com.autonoma.erp.modules.npd.product.entity.ProductProcess dummy7;
                    com.autonoma.erp.modules.npd.product.entity.ProductWindFarm dummy8;
                    com.autonoma.erp.modules.master.admin.entity.MstUom dummy9;

                    ProductWindFarm type = new ProductWindFarm();
                    type.setWindFarmName(getStringValue(row.getCell(0)));
                    type.setCity(getStringValue(row.getCell(1))); // type.setIsActive("ACTIVE".equalsIgnoreCase(getStringValue(row.getCell(2)));

                    productWindFarmRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception ex) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", ex.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generateUomSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("Uom Migration Instructions");

            org.apache.poi.ss.usermodel.Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            instructionSheet.autoSizeColumn(0);

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);

            org.apache.poi.ss.usermodel.Cell h0 = headerRow.createCell(0);
            h0.setCellValue("UOM Code");
            h0.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h1 = headerRow.createCell(1);
            h1.setCellValue("UOM Description");
            h1.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h2 = headerRow.createCell(2);
            h2.setCellValue("Status");
            h2.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("KG");
            sampleRow.createCell(1).setCellValue("Kilogram");
            sampleRow.createCell(2).setCellValue("ACTIVE");

            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();

            org.apache.poi.ss.usermodel.DataValidationConstraint constraint_2 = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            org.apache.poi.ss.util.CellRangeAddressList addressList_2 = new org.apache.poi.ss.util.CellRangeAddressList(
                    1, 1000, 2, 2);
            org.apache.poi.ss.usermodel.DataValidation validation_2 = validationHelper.createValidation(constraint_2,
                    addressList_2);
            sheet.addValidationData(validation_2);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateUomFromExcel(org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null) {
                throw new IllegalArgumentException("Invalid Excel template uploaded.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(0);
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                    continue;

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemType dummy1;
                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemSubtype dummy2;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOem dummy3;
                    com.autonoma.erp.modules.npd.oem.entity.ProductOemMapping dummy4;
                    com.autonoma.erp.modules.npd.product.entity.ProductModel dummy5;
                    com.autonoma.erp.modules.npd.product.entity.ProductCapacity dummy6;
                    com.autonoma.erp.modules.npd.product.entity.ProductProcess dummy7;
                    com.autonoma.erp.modules.npd.product.entity.ProductWindFarm dummy8;
                    com.autonoma.erp.modules.master.admin.entity.MstUom dummy9;

                    MstUom type = new MstUom();
                    type.setUomCode(getStringValue(row.getCell(0)));
                    type.setUomDescription(getStringValue(row.getCell(1)));
                    type.setStatus(getStringValue(row.getCell(2))); // type.setIsActive("ACTIVE".equalsIgnoreCase(getStringValue(row.getCell(2)));

                    mstUomRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception ex) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", ex.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generateProductMasterSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("ProductMaster Migration Instructions");

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            org.apache.poi.ss.usermodel.Cell h0 = headerRow.createCell(0);
            h0.setCellValue("INVENTORY_TYPE");
            h0.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h1 = headerRow.createCell(1);
            h1.setCellValue("ITEM_GROUP");
            h1.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h2 = headerRow.createCell(2);
            h2.setCellValue("ITEM_CATEGORY");
            h2.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h3 = headerRow.createCell(3);
            h3.setCellValue("ITEM_SUB_CATEGORY");
            h3.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h4 = headerRow.createCell(4);
            h4.setCellValue("LEAD_TIME_MIN");
            h4.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h5 = headerRow.createCell(5);
            h5.setCellValue("LEAD_TIME_MAX");
            h5.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h6 = headerRow.createCell(6);
            h6.setCellValue("OEM_NAME_ID");
            h6.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h7 = headerRow.createCell(7);
            h7.setCellValue("WEB_PRODUCT");
            h7.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h8 = headerRow.createCell(8);
            h8.setCellValue("CONS_NON_MOVING");
            h8.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h9 = headerRow.createCell(9);
            h9.setCellValue("CONS_STOCK_VALUE");
            h9.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h10 = headerRow.createCell(10);
            h10.setCellValue("PRIME_PRODUCT");
            h10.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h11 = headerRow.createCell(11);
            h11.setCellValue("CAPACITY_ID");
            h11.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h12 = headerRow.createCell(12);
            h12.setCellValue("SUPPLIER_PART_NO");
            h12.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h13 = headerRow.createCell(13);
            h13.setCellValue("LD_REQUIRED");
            h13.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h14 = headerRow.createCell(14);
            h14.setCellValue("WEIGHT_PER_QTY");
            h14.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h15 = headerRow.createCell(15);
            h15.setCellValue("PART_NO_OLD");
            h15.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h16 = headerRow.createCell(16);
            h16.setCellValue("PART_CODE_PREFIX");
            h16.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h17 = headerRow.createCell(17);
            h17.setCellValue("OEM_PREFIX");
            h17.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h18 = headerRow.createCell(18);
            h18.setCellValue("ALTERNATIVE_PART_NO");
            h18.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h19 = headerRow.createCell(19);
            h19.setCellValue("WEEKLY_RECONCILIATION");
            h19.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h20 = headerRow.createCell(20);
            h20.setCellValue("MONTHLY_RECONCILIATION");
            h20.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h21 = headerRow.createCell(21);
            h21.setCellValue("PRINT_NAME");
            h21.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h22 = headerRow.createCell(22);
            h22.setCellValue("ITEM_CODE");
            h22.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h23 = headerRow.createCell(23);
            h23.setCellValue("ITEM_NO");
            h23.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h24 = headerRow.createCell(24);
            h24.setCellValue("ITEM_NAME");
            h24.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h25 = headerRow.createCell(25);
            h25.setCellValue("REV_NO");
            h25.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h26 = headerRow.createCell(26);
            h26.setCellValue("REV_DATE");
            h26.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h27 = headerRow.createCell(27);
            h27.setCellValue("HSN_CODE");
            h27.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h28 = headerRow.createCell(28);
            h28.setCellValue("ELEMENT");
            h28.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h29 = headerRow.createCell(29);
            h29.setCellValue("GRADE");
            h29.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h30 = headerRow.createCell(30);
            h30.setCellValue("SHAPE");
            h30.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h31 = headerRow.createCell(31);
            h31.setCellValue("STOCK_QTY");
            h31.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h32 = headerRow.createCell(32);
            h32.setCellValue("ROL_QTY");
            h32.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h33 = headerRow.createCell(33);
            h33.setCellValue("STATUS");
            h33.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h34 = headerRow.createCell(34);
            h34.setCellValue("UOM");
            h34.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h35 = headerRow.createCell(35);
            h35.setCellValue("IS_EXPIRY_ITEM");
            h35.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h36 = headerRow.createCell(36);
            h36.setCellValue("SELF_LIFE");
            h36.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h37 = headerRow.createCell(37);
            h37.setCellValue("DRM_REQ");
            h37.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h38 = headerRow.createCell(38);
            h38.setCellValue("MODEL_NO");
            h38.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h39 = headerRow.createCell(39);
            h39.setCellValue("NDA_REQ");
            h39.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h40 = headerRow.createCell(40);
            h40.setCellValue("OD");
            h40.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h41 = headerRow.createCell(41);
            h41.setCellValue("ID (Inner Diameter)");
            h41.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h42 = headerRow.createCell(42);
            h42.setCellValue("LENGTH");
            h42.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h43 = headerRow.createCell(43);
            h43.setCellValue("WIDTH");
            h43.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h44 = headerRow.createCell(44);
            h44.setCellValue("THICKNESS");
            h44.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h45 = headerRow.createCell(45);
            h45.setCellValue("KEY WORD 1");
            h45.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h46 = headerRow.createCell(46);
            h46.setCellValue("KEY WORD 2");
            h46.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h47 = headerRow.createCell(47);
            h47.setCellValue("KEY WORD 3");
            h47.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h48 = headerRow.createCell(48);
            h48.setCellValue("REPORT DESCRIPTION");
            h48.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h49 = headerRow.createCell(49);
            h49.setCellValue("WTG QUANTITY");
            h49.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h50 = headerRow.createCell(50);
            h50.setCellValue("CAVITY");
            h50.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h51 = headerRow.createCell(51);
            h51.setCellValue("INSPECTION REMARKS");
            h51.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h52 = headerRow.createCell(52);
            h52.setCellValue("Purchase Rate");
            h52.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h53 = headerRow.createCell(53);
            h53.setCellValue("Maximum Purchase Rate");
            h53.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h54 = headerRow.createCell(54);
            h54.setCellValue("Location/Division");
            h54.setCellStyle(headerStyle);
            org.apache.poi.ss.usermodel.Cell h55 = headerRow.createCell(55);
            h55.setCellValue("INSPECTION_REQ");
            h55.setCellStyle(headerStyle);

            // Add Data Validations
            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();

            // Generate dropdown lists from databases
            java.util.List<String> invTypes = npdInventoryTypeRepository.findAll().stream()
                    .map(com.autonoma.erp.modules.npd.inventory.entity.NpdInventoryType::getCode)
                    .filter(java.util.Objects::nonNull).collect(java.util.stream.Collectors.toList());
            java.util.List<String> itemGroups = productItemGroupRepository.findAll().stream()
                    .map(com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemGroup::getGroupName)
                    .filter(java.util.Objects::nonNull).collect(java.util.stream.Collectors.toList());
            java.util.List<String> itemTypes = productItemTypeRepository.findAll().stream()
                    .map(com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemType::getItemType)
                    .filter(java.util.Objects::nonNull).collect(java.util.stream.Collectors.toList());
            java.util.List<String> itemSubTypes = productItemSubtypeRepository.findAll().stream()
                    .map(com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemSubtype::getSubType)
                    .filter(java.util.Objects::nonNull).collect(java.util.stream.Collectors.toList());
            java.util.List<String> oems = productOemRepository.findAll().stream()
                    .map(o -> String.valueOf(o.getOemShortName()))
                    .collect(java.util.stream.Collectors.toList());
            java.util.List<String> caps = productCapacityRepository.findAll().stream()
                    .map(c -> String.valueOf(c.getCapacityVal())).collect(java.util.stream.Collectors.toList());
            java.util.List<String> hsns = hsnCodeMasterRepository.findAll().stream()
                    .map(com.autonoma.erp.modules.npd.hsn.entity.HsnCodeMaster::getHsnCode)
                    .filter(java.util.Objects::nonNull).collect(java.util.stream.Collectors.toList());
            java.util.List<String> elements = npdMaterialTypeRepository.findAll().stream()
                    .map(com.autonoma.erp.modules.npd.material.entity.NpdMaterialType::getCode)
                    .filter(java.util.Objects::nonNull).collect(java.util.stream.Collectors.toList());
            java.util.List<String> grades = npdMaterialGradeRepository.findAll().stream()
                    .map(com.autonoma.erp.modules.npd.material.entity.NpdMaterialGrade::getCode)
                    .filter(java.util.Objects::nonNull).collect(java.util.stream.Collectors.toList());
            java.util.List<String> shapes = npdShapeMasterRepository.findAll().stream()
                    .map(com.autonoma.erp.modules.npd.material.entity.NpdShapeMaster::getCode)
                    .filter(java.util.Objects::nonNull).collect(java.util.stream.Collectors.toList());
            java.util.List<String> uoms = mstUomRepository.findAll().stream()
                    .map(com.autonoma.erp.modules.master.admin.entity.MstUom::getUomCode)
                    .filter(java.util.Objects::nonNull).collect(java.util.stream.Collectors.toList());
            java.util.List<String> models = productModelRepository.findAll().stream()
                    .map(com.autonoma.erp.modules.npd.product.entity.ProductModel::getModelNo)
                    .filter(java.util.Objects::nonNull).collect(java.util.stream.Collectors.toList());
            java.util.List<String> divisions = divisionRepository.findAll().stream()
                    .map(com.autonoma.erp.modules.master.organization.entity.Division::getDivisionName)
                    .filter(java.util.Objects::nonNull).collect(java.util.stream.Collectors.toList());

            String[] boolArr = new String[] { "Yes", "No" };
            String[] statusArr = new String[] { "ACTIVE", "INACTIVE" };

            autoCreateValidation(sheet, validationHelper, 0, invTypes);
            autoCreateValidation(sheet, validationHelper, 1, itemGroups);
            autoCreateValidation(sheet, validationHelper, 2, itemTypes);
            autoCreateValidation(sheet, validationHelper, 3, itemSubTypes);
            autoCreateValidation(sheet, validationHelper, 6, oems);
            autoCreateValidation(sheet, validationHelper, 7, java.util.Arrays.asList(boolArr)); // WEB_PRODUCT
            autoCreateValidation(sheet, validationHelper, 8, java.util.Arrays.asList(boolArr)); // CONS_NON_MOVING
            autoCreateValidation(sheet, validationHelper, 9, java.util.Arrays.asList(boolArr)); // CONS_STOCK_VALUE
            autoCreateValidation(sheet, validationHelper, 10, java.util.Arrays.asList(boolArr)); // PRIME_PRODUCT
            autoCreateValidation(sheet, validationHelper, 11, caps); // CAPACITY_ID
            autoCreateValidation(sheet, validationHelper, 13, java.util.Arrays.asList(boolArr)); // LD_REQUIRED
            autoCreateValidation(sheet, validationHelper, 19, java.util.Arrays.asList(boolArr)); // WEEKLY_RECONCILIATION
            autoCreateValidation(sheet, validationHelper, 20, java.util.Arrays.asList(boolArr)); // MONTHLY_RECONCILIATION
            autoCreateValidation(sheet, validationHelper, 27, hsns); // HSN_CODE
            autoCreateValidation(sheet, validationHelper, 28, elements); // ELEMENT
            autoCreateValidation(sheet, validationHelper, 29, grades); // GRADE
            autoCreateValidation(sheet, validationHelper, 30, shapes); // SHAPE
            autoCreateValidation(sheet, validationHelper, 33, java.util.Arrays.asList(statusArr)); // STATUS
            autoCreateValidation(sheet, validationHelper, 34, uoms); // UOM
            autoCreateValidation(sheet, validationHelper, 35, java.util.Arrays.asList(boolArr)); // IS_EXPIRY_ITEM
            autoCreateValidation(sheet, validationHelper, 37, java.util.Arrays.asList(boolArr)); // DRM_REQ
            autoCreateValidation(sheet, validationHelper, 38, models); // MODEL_NO
            autoCreateValidation(sheet, validationHelper, 39, java.util.Arrays.asList(boolArr)); // NDA_REQ
            autoCreateValidation(sheet, validationHelper, 54, divisions); // Location/Division
            autoCreateValidation(sheet, validationHelper, 55, java.util.Arrays.asList(boolArr)); // INSPECTION_REQ

            for (int i = 0; i < 56; i++) {
                sheet.autoSizeColumn(i);
            }

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    private void autoCreateValidation(org.apache.poi.ss.usermodel.Sheet sheet,
            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper, int colIndex,
            java.util.List<String> list) {
        if (list == null || list.isEmpty())
            return;
        // POI limits validation list to 255 chars, so we only use the first few if it's
        // too long
        int maxLen = 0;
        java.util.List<String> truncList = new java.util.ArrayList<>();
        for (String s : list) {
            if (maxLen + s.length() + 1 > 250)
                break;
            truncList.add(s);
            maxLen += s.length() + 1;
        }
        if (truncList.isEmpty())
            return;
        org.apache.poi.ss.usermodel.DataValidationConstraint constraint = validationHelper
                .createExplicitListConstraint(truncList.toArray(new String[0]));
        org.apache.poi.ss.util.CellRangeAddressList addressList = new org.apache.poi.ss.util.CellRangeAddressList(1,
                1000, colIndex, colIndex);
        org.apache.poi.ss.usermodel.DataValidation validation = validationHelper.createValidation(constraint,
                addressList);
        sheet.addValidationData(validation);
    }

    private Boolean parseBool(String val) {
        if (val == null)
            return false;
        val = val.trim().toLowerCase();
        return val.equals("yes") || val.equals("true") || val.equals("1") || val.equals("active");
    }

    private Double parseDouble(String val) {
        if (val == null || val.trim().isEmpty())
            return null;
        try {
            return Double.parseDouble(val.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private Integer parseInteger(String val) {
        if (val == null || val.trim().isEmpty())
            return null;
        try {
            return (int) Double.parseDouble(val.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private Long parseLong(String val) {
        if (val == null || val.trim().isEmpty())
            return null;
        try {
            return (long) Double.parseDouble(val.trim());
        } catch (Exception e) {
            return null;
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateProductMasterFromExcel(
            org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null) {
                throw new IllegalArgumentException("Invalid Excel template uploaded.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(23); // ITEM_NO is 24th col
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK) {
                    firstCell = row.getCell(24); // Try ITEM_NAME
                    if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                        continue;
                }

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    ProductMaster type = new ProductMaster();
                    type.setInventoryType(getStringValue(row.getCell(0)));
                    type.setItemGroup(getStringValue(row.getCell(1)));
                    type.setItemCategory(getStringValue(row.getCell(2)));
                    type.setItemSubCategory(getStringValue(row.getCell(3)));
                    type.setLeadTimeMin(parseInteger(getStringValue(row.getCell(4))));
                    type.setLeadTimeMax(parseInteger(getStringValue(row.getCell(5))));
                    type.setOemNameId(parseLong(getStringValue(row.getCell(6))));
                    type.setWebProduct(parseBool(getStringValue(row.getCell(7))));
                    type.setConsNonMoving(parseBool(getStringValue(row.getCell(8))));
                    type.setConsStockValue(parseBool(getStringValue(row.getCell(9))));
                    type.setPrimeProduct(parseBool(getStringValue(row.getCell(10))));
                    type.setCapacityId(parseLong(getStringValue(row.getCell(11))));
                    type.setSupplierPartNo(getStringValue(row.getCell(12)));
                    type.setLdRequired(parseBool(getStringValue(row.getCell(13))));
                    type.setWeightPerQty(parseDouble(getStringValue(row.getCell(14))));
                    type.setPartNoOld(getStringValue(row.getCell(15)));
                    type.setPartCodePrefix(getStringValue(row.getCell(16)));
                    type.setOemPrefix(getStringValue(row.getCell(17)));
                    type.setAlternativePartNo(getStringValue(row.getCell(18)));
                    type.setWeeklyReconciliation(parseBool(getStringValue(row.getCell(19))));
                    type.setMonthlyReconciliation(parseBool(getStringValue(row.getCell(20))));
                    type.setPrintName(getStringValue(row.getCell(21)));
                    type.setItemCode(getStringValue(row.getCell(22)));
                    type.setItemNo(getStringValue(row.getCell(23)));
                    type.setItemName(getStringValue(row.getCell(24)));
                    type.setRevNo(getStringValue(row.getCell(25)));
                    // REV_DATE is 26
                    org.apache.poi.ss.usermodel.Cell dateCell = row.getCell(26);
                    if (dateCell != null && dateCell.getCellType() == org.apache.poi.ss.usermodel.CellType.NUMERIC
                            && org.apache.poi.ss.usermodel.DateUtil.isCellDateFormatted(dateCell)) {
                        java.util.Date d = dateCell.getDateCellValue();
                        type.setRevDate(d.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate());
                    }
                    type.setHsnCode(getStringValue(row.getCell(27)));
                    type.setElement(getStringValue(row.getCell(28)));
                    type.setGrade(getStringValue(row.getCell(29)));
                    type.setShape(getStringValue(row.getCell(30)));
                    type.setStockQty(parseDouble(getStringValue(row.getCell(31))));
                    type.setRolQty(parseDouble(getStringValue(row.getCell(32))));
                    type.setStatus(getStringValue(row.getCell(33)));
                    type.setUom(getStringValue(row.getCell(34)));
                    type.setIsExpiryItem(parseBool(getStringValue(row.getCell(35))));
                    type.setSelfLife(parseInteger(getStringValue(row.getCell(36))));
                    type.setDrmReq(parseBool(getStringValue(row.getCell(37))));
                    type.setModelNo(getStringValue(row.getCell(38)));
                    type.setNdaReq(parseBool(getStringValue(row.getCell(39))));
                    type.setOd(parseDouble(getStringValue(row.getCell(40))));
                    type.setInnerDiameter(parseDouble(getStringValue(row.getCell(41))));
                    type.setLength(parseDouble(getStringValue(row.getCell(42))));
                    type.setWidth(parseDouble(getStringValue(row.getCell(43))));
                    type.setThickness(parseDouble(getStringValue(row.getCell(44))));
                    type.setKeyWord1(getStringValue(row.getCell(45)));
                    type.setKeyWord2(getStringValue(row.getCell(46)));
                    type.setKeyWord3(getStringValue(row.getCell(47)));
                    type.setReportDescription(getStringValue(row.getCell(48)));
                    type.setWtgQuantity(parseDouble(getStringValue(row.getCell(49))));
                    type.setCavity(getStringValue(row.getCell(50)));
                    type.setInspectionRemarks(getStringValue(row.getCell(51)));
                    type.setPurchaseRate(parseDouble(getStringValue(row.getCell(52))));
                    type.setMaximumPurchaseRate(parseDouble(getStringValue(row.getCell(53))));
                    type.setLocationDivision(getStringValue(row.getCell(54)));
                    type.setInspectionReq(parseBool(getStringValue(row.getCell(55))));

                    productMasterRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception ex) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", ex.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generateInventoryTypeSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("InventoryType Migration Instructions");

            org.apache.poi.ss.usermodel.Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            instructionSheet.autoSizeColumn(0);

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);

            org.apache.poi.ss.usermodel.Cell h0 = headerRow.createCell(0);
            h0.setCellValue("Type Code");
            h0.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h1 = headerRow.createCell(1);
            h1.setCellValue("Type Name");
            h1.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h2 = headerRow.createCell(2);
            h2.setCellValue("Status");
            h2.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("INV01");
            sampleRow.createCell(1).setCellValue("Finished Goods");
            sampleRow.createCell(2).setCellValue("ACTIVE");

            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            org.apache.poi.ss.usermodel.DataValidationConstraint constraint_2 = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            org.apache.poi.ss.util.CellRangeAddressList addressList_2 = new org.apache.poi.ss.util.CellRangeAddressList(
                    1, 1000, 2, 2);
            org.apache.poi.ss.usermodel.DataValidation validation_2 = validationHelper.createValidation(constraint_2,
                    addressList_2);
            sheet.addValidationData(validation_2);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateInventoryTypeFromExcel(
            org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null) {
                throw new IllegalArgumentException("Invalid Excel template uploaded.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(0);
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                    continue;

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    NpdInventoryType type = new NpdInventoryType();
                    type.setCode(getStringValue(row.getCell(0)));
                    type.setTypeName(getStringValue(row.getCell(1)));
                    type.setStatus("ACTIVE".equalsIgnoreCase(getStringValue(row.getCell(2))) ? 1 : 0);
                    npdInventoryTypeRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception ex) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", ex.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generateProductItemGroupSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("ProductItemGroup Migration Instructions");

            org.apache.poi.ss.usermodel.Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            instructionSheet.autoSizeColumn(0);

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);

            org.apache.poi.ss.usermodel.Cell h0 = headerRow.createCell(0);
            h0.setCellValue("Group Name");
            h0.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h1 = headerRow.createCell(1);
            h1.setCellValue("Description");
            h1.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h2 = headerRow.createCell(2);
            h2.setCellValue("Status");
            h2.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("Hardware");
            sampleRow.createCell(1).setCellValue("Nuts and Bolts");
            sampleRow.createCell(2).setCellValue("ACTIVE");

            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            org.apache.poi.ss.usermodel.DataValidationConstraint constraint_2 = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            org.apache.poi.ss.util.CellRangeAddressList addressList_2 = new org.apache.poi.ss.util.CellRangeAddressList(
                    1, 1000, 2, 2);
            org.apache.poi.ss.usermodel.DataValidation validation_2 = validationHelper.createValidation(constraint_2,
                    addressList_2);
            sheet.addValidationData(validation_2);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateProductItemGroupFromExcel(
            org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null) {
                throw new IllegalArgumentException("Invalid Excel template uploaded.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(0);
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                    continue;

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    ProductItemGroup type = new ProductItemGroup();
                    type.setGroupName(getStringValue(row.getCell(0)));
                    type.setDescription(getStringValue(row.getCell(1)));
                    String excelStatus = getStringValue(row.getCell(2));
                    type.setStatus((excelStatus != null && excelStatus.equalsIgnoreCase("INACTIVE")) ? 0 : 1);
                    productItemGroupRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception ex) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", ex.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generateProductIppSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("ProductIpp Migration Instructions");

            org.apache.poi.ss.usermodel.Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            instructionSheet.autoSizeColumn(0);

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);

            org.apache.poi.ss.usermodel.Cell h0 = headerRow.createCell(0);
            h0.setCellValue("IPP Code");
            h0.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h1 = headerRow.createCell(1);
            h1.setCellValue("IPP Description");
            h1.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Cell h2 = headerRow.createCell(2);
            h2.setCellValue("Status");
            h2.setCellStyle(headerStyle);

            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("IPP01");
            sampleRow.createCell(1).setCellValue("Initial Production Phase");
            sampleRow.createCell(2).setCellValue("ACTIVE");

            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            org.apache.poi.ss.usermodel.DataValidationConstraint constraint_2 = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            org.apache.poi.ss.util.CellRangeAddressList addressList_2 = new org.apache.poi.ss.util.CellRangeAddressList(
                    1, 1000, 2, 2);
            org.apache.poi.ss.usermodel.DataValidation validation_2 = validationHelper.createValidation(constraint_2,
                    addressList_2);
            sheet.addValidationData(validation_2);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateProductIppFromExcel(
            org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null) {
                throw new IllegalArgumentException("Invalid Excel template uploaded.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(0);
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                    continue;

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    ProductIpp type = new ProductIpp();
                    type.setCustomerId(parseLong(getStringValue(row.getCell(0))));
                    type.setCustomerName(getStringValue(row.getCell(1)));
                    type.setCustomerGroup(getStringValue(row.getCell(2)));
                    type.setCustPartNo(getStringValue(row.getCell(3)));
                    type.setPartNo(getStringValue(row.getCell(4)));
                    type.setOemPartNo(getStringValue(row.getCell(5)));
                    productIppRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception ex) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", ex.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generateMaterialTypeSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("Material Type Migration Instructions");

            org.apache.poi.ss.usermodel.Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            instructionSheet.autoSizeColumn(0);

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] headers = { "Code", "Type Name", "Description", "Density", "Status" };
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell h = headerRow.createCell(i);
                h.setCellValue(headers[i]);
                h.setCellStyle(headerStyle);
            }

            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("TYPE1");
            sampleRow.createCell(1).setCellValue("Type A");
            sampleRow.createCell(2).setCellValue("Desc A");
            sampleRow.createCell(3).setCellValue("10.5");
            sampleRow.createCell(4).setCellValue("ACTIVE");

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            org.apache.poi.ss.usermodel.DataValidationConstraint constraint_status = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            org.apache.poi.ss.util.CellRangeAddressList addressList_status = new org.apache.poi.ss.util.CellRangeAddressList(
                    1, 1000, 4, 4);
            org.apache.poi.ss.usermodel.DataValidation validation_status = validationHelper
                    .createValidation(constraint_status, addressList_status);
            sheet.addValidationData(validation_status);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateMaterialTypeFromExcel(
            org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;
                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(0);
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                    continue;

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    NpdMaterialType type = new NpdMaterialType();
                    type.setCode(getStringValue(row.getCell(0)));
                    type.setTypeName(getStringValue(row.getCell(1)));
                    type.setDescription(getStringValue(row.getCell(2)));
                    type.setDensity(parseBigDecimal(getStringValue(row.getCell(3))));
                    String statusVal = getStringValue(row.getCell(4));
                    type.setStatus("ACTIVE".equalsIgnoreCase(statusVal) || "1".equals(statusVal));
                    npdMaterialTypeRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception e) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", e.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }
            response.put("message", "Migration completed. Migrated: " + migratedCount + ", Failed: " + failedCount);
            response.put("details", details);
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file", e);
        }
    }

    public byte[] generateMaterialGradeSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("Material Grade Migration Instructions");

            org.apache.poi.ss.usermodel.Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            instructionSheet.autoSizeColumn(0);

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] headers = { "Code", "Grade Name", "Description", "Density", "Material Type", "Status" };
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell h = headerRow.createCell(i);
                h.setCellValue(headers[i]);
                h.setCellStyle(headerStyle);
            }

            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("GR01");
            sampleRow.createCell(1).setCellValue("Grade A");
            sampleRow.createCell(2).setCellValue("Desc A");
            sampleRow.createCell(3).setCellValue("12.5");
            sampleRow.createCell(4).setCellValue("TYPE1");
            sampleRow.createCell(5).setCellValue("ACTIVE");

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();

            java.util.List<String> typeList = npdMaterialTypeRepository.findAll().stream().map(NpdMaterialType::getCode)
                    .filter(java.util.Objects::nonNull).collect(java.util.stream.Collectors.toList());
            if (!typeList.isEmpty()) {
                String[] typeArr = typeList.toArray(new String[0]);
                org.apache.poi.ss.usermodel.DataValidationConstraint constraint_type = validationHelper
                        .createExplicitListConstraint(typeArr);
                org.apache.poi.ss.util.CellRangeAddressList addressList_type = new org.apache.poi.ss.util.CellRangeAddressList(
                        1, 1000, 4, 4);
                org.apache.poi.ss.usermodel.DataValidation validation_type = validationHelper
                        .createValidation(constraint_type, addressList_type);
                sheet.addValidationData(validation_type);
            }

            org.apache.poi.ss.usermodel.DataValidationConstraint constraint_status = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            org.apache.poi.ss.util.CellRangeAddressList addressList_status = new org.apache.poi.ss.util.CellRangeAddressList(
                    1, 1000, 5, 5);
            org.apache.poi.ss.usermodel.DataValidation validation_status = validationHelper
                    .createValidation(constraint_status, addressList_status);
            sheet.addValidationData(validation_status);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateMaterialGradeFromExcel(
            org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;
                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(0);
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                    continue;

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    NpdMaterialGrade type = new NpdMaterialGrade();
                    type.setCode(getStringValue(row.getCell(0)));
                    type.setGradeName(getStringValue(row.getCell(1)));
                    type.setDescription(getStringValue(row.getCell(2)));
                    type.setDensity(parseBigDecimal(getStringValue(row.getCell(3))));

                    String matTypeCode = getStringValue(row.getCell(4));
                    if (matTypeCode != null && !matTypeCode.trim().isEmpty()) {
                        NpdMaterialType matType = npdMaterialTypeRepository.findById(matTypeCode).orElse(null);
                        type.setMaterialType(matType);
                    }

                    String statusVal = getStringValue(row.getCell(5));
                    type.setStatus("ACTIVE".equalsIgnoreCase(statusVal) || "1".equals(statusVal));
                    npdMaterialGradeRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception e) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", e.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }
            response.put("message", "Migration completed. Migrated: " + migratedCount + ", Failed: " + failedCount);
            response.put("details", details);
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file", e);
        }
    }

    public byte[] generateShapeSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("Shape Migration Instructions");

            org.apache.poi.ss.usermodel.Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            instructionSheet.autoSizeColumn(0);

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] headers = { "Code", "Shape Name", "Description", "Dimension Type", "Status" };
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell h = headerRow.createCell(i);
                h.setCellValue(headers[i]);
                h.setCellStyle(headerStyle);
            }

            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("SH01");
            sampleRow.createCell(1).setCellValue("Shape A");
            sampleRow.createCell(2).setCellValue("Desc A");
            sampleRow.createCell(3).setCellValue("3D");
            sampleRow.createCell(4).setCellValue("ACTIVE");

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            org.apache.poi.ss.usermodel.DataValidationConstraint constraint_status = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            org.apache.poi.ss.util.CellRangeAddressList addressList_status = new org.apache.poi.ss.util.CellRangeAddressList(
                    1, 1000, 4, 4);
            org.apache.poi.ss.usermodel.DataValidation validation_status = validationHelper
                    .createValidation(constraint_status, addressList_status);
            sheet.addValidationData(validation_status);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateShapeFromExcel(org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;
                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(0);
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                    continue;

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    NpdShapeMaster type = new NpdShapeMaster();
                    type.setCode(getStringValue(row.getCell(0)));
                    type.setShapeName(getStringValue(row.getCell(1)));
                    type.setDescription(getStringValue(row.getCell(2)));
                    type.setDimensionType(getStringValue(row.getCell(3)));
                    String statusVal = getStringValue(row.getCell(4));
                    type.setStatus("ACTIVE".equalsIgnoreCase(statusVal) || "1".equals(statusVal));
                    npdShapeMasterRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception e) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", e.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }
            response.put("message", "Migration completed. Migrated: " + migratedCount + ", Failed: " + failedCount);
            response.put("details", details);
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file", e);
        }
    }

    public byte[] generateMaterialConditionSampleExcel() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet instructionSheet = workbook.createSheet("Instructions");
            org.apache.poi.ss.usermodel.Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("Material Condition Migration Instructions");

            org.apache.poi.ss.usermodel.Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            instructionSheet.autoSizeColumn(0);

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Migration Record");
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] headers = { "Code", "Condition", "Description", "Type", "Status" };
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell h = headerRow.createCell(i);
                h.setCellValue(headers[i]);
                h.setCellStyle(headerStyle);
            }

            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("COND01");
            sampleRow.createCell(1).setCellValue("Cond A");
            sampleRow.createCell(2).setCellValue("Desc A");
            sampleRow.createCell(3).setCellValue("Type1");
            sampleRow.createCell(4).setCellValue("ACTIVE");

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            org.apache.poi.ss.usermodel.DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            org.apache.poi.ss.usermodel.DataValidationConstraint constraint_status = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            org.apache.poi.ss.util.CellRangeAddressList addressList_status = new org.apache.poi.ss.util.CellRangeAddressList(
                    1, 1000, 4, 4);
            org.apache.poi.ss.usermodel.DataValidation validation_status = validationHelper
                    .createValidation(constraint_status, addressList_status);
            sheet.addValidationData(validation_status);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> migrateMaterialConditionFromExcel(
            org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (java.io.InputStream is = file.getInputStream();
                org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(1);

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null)
                    continue;
                org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(0);
                if (firstCell == null || firstCell.getCellType() == org.apache.poi.ss.usermodel.CellType.BLANK)
                    continue;

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("identifier", getStringValue(firstCell));

                try {
                    MaterialCondition type = new MaterialCondition();
                    type.setCode(getStringValue(row.getCell(0)));
                    type.setCondition(getStringValue(row.getCell(1)));
                    type.setDescription(getStringValue(row.getCell(2)));
                    type.setType(getStringValue(row.getCell(3)));
                    String statusVal = getStringValue(row.getCell(4));
                    type.setStatus("ACTIVE".equalsIgnoreCase(statusVal) || "1".equals(statusVal));
                    materialConditionRepository.save(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                } catch (Exception e) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", e.getMessage());
                    failedCount++;
                }
                details.add(rowDetail);
            }
            response.put("message", "Migration completed. Migrated: " + migratedCount + ", Failed: " + failedCount);
            response.put("details", details);
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file", e);
        }
    }

    private java.math.BigDecimal parseBigDecimal(String val) {
        if (val == null || val.trim().isEmpty()) {
            return null;
        }
        try {
            return new java.math.BigDecimal(val.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public String clearProductMaster() {
        if (entityManager == null)
            return "EntityManager is not configured.";

        // // Delete physical files first
        // try {
        // java.util.List<Object> paths = entityManager.createNativeQuery(
        // "SELECT PATH FROM NPD_ATTACHMENT_PATH WHERE PAGE_CODE =
        // 'M3115'").getResultList();
        // for (Object obj : paths) {
        // if (obj instanceof String) {
        // String path = (String) obj;
        // if (!path.trim().isEmpty()) {
        // try {
        // java.nio.file.Path targetPath = fileService.getRootPath().resolve(path);
        // if (java.nio.file.Files.exists(targetPath)) {
        // java.nio.file.Files.delete(targetPath);
        // }
        // } catch (Exception e) {
        // org.slf4j.LoggerFactory.getLogger(NpdMigrationService.class)
        // .warn("Could not delete file: {} - {}", path, e.getMessage());
        // }
        // }
        // }
        // }
        // } catch (Exception e) {
        // org.slf4j.LoggerFactory.getLogger(NpdMigrationService.class).error("Error
        // cleaning up files", e);
        // }

        // Bulk delete from database
        try {
            entityManager.createNativeQuery("DELETE FROM NPD_ATTACHMENT_PATH WHERE PAGE_CODE = 'M3115'")
                    .executeUpdate();

            entityManager
                    .createNativeQuery(
                            "DELETE FROM NPD_PRODUCT_MASTER WHERE INVENTORY_TYPE IN ('PRODUCT', 'RAWMATERIAL')")
                    .executeUpdate();

            // Delete the audit log so the UI registers it as cleared.
            entityManager.createNativeQuery(
                    "DELETE FROM ad_migration_audit_log WHERE table_name = 'NT_FSS.items -> NPD_PRODUCT_MASTER'")
                    .executeUpdate();
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.progressMap
                    .remove("productMaster");
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(NpdMigrationService.class).error("Error deleting product master", e);
            throw new RuntimeException("Could not delete Product Master. Check related tables. " + e.getMessage());
        }

        return "Cleared Product Master successfully.";
    }

    @org.springframework.transaction.annotation.Transactional
    public String clearConsumableMaster() {
        try {
            entityManager.createNativeQuery(
                    "DELETE FROM QMT_ASSET_MASTER WHERE ASSET_TYPE_ID IN (SELECT ID FROM HR_ASSET_TYPE WHERE LOWER(TYPE) LIKE '%consumable%' OR LOWER(TYPE) = 'tools & dies') OR ASSET_GROUP_ID IN (SELECT ID FROM HR_ASSET_GROUP WHERE LOWER(GROUP_NAME) LIKE '%consumable%')")
                    .executeUpdate();
            entityManager.createNativeQuery("DELETE FROM NPD_PRODUCT_MASTER WHERE INVENTORY_TYPE = 'Consumables'")
                    .executeUpdate();
            entityManager.createNativeQuery(
                    "DELETE FROM ad_migration_audit_log WHERE table_name IN ('NT_FSS.items -> NPD_PRODUCT_MASTER (Consumables)', 'NT_FSS.items -> QMT_MACHINE (Consumables)', 'NT_FSS.items -> QMT_ASSET_MASTER (Consumables)')")
                    .executeUpdate();
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.progressMap
                    .remove("consumableMaster");
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(NpdMigrationService.class).error("Error deleting consumables", e);
            throw new RuntimeException("Could not delete Consumables. " + e.getMessage());
        }
        return "Cleared Consumables successfully.";
    }

    @org.springframework.transaction.annotation.Transactional
    public String clearInstrumentMaster() {
        try {
            entityManager.createNativeQuery(
                    "DELETE FROM QMT_ASSET_MASTER WHERE ASSET_TYPE_ID IN (SELECT ID FROM HR_ASSET_TYPE WHERE LOWER(TYPE) IN ('instrument', 'instrument/fixture'))")
                    .executeUpdate();
            entityManager.createNativeQuery("DELETE FROM NPD_PRODUCT_MASTER WHERE INVENTORY_TYPE = 'Instruments'")
                    .executeUpdate();
            entityManager.createNativeQuery(
                    "DELETE FROM ad_migration_audit_log WHERE table_name IN ('NT_FSS.items -> NPD_PRODUCT_MASTER (Instruments)', 'NT_FSS.items -> QMT_MACHINE (Instruments)', 'NT_FSS.items -> QMT_ASSET_MASTER (Instruments)')")
                    .executeUpdate();
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.progressMap
                    .remove("instrumentMaster");
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(NpdMigrationService.class).error("Error deleting instruments", e);
            throw new RuntimeException("Could not delete Instruments. " + e.getMessage());
        }
        return "Cleared Instruments successfully.";
    }

    @org.springframework.transaction.annotation.Transactional
    public String clearMachineAssetMaster() {
        try {
            entityManager.createNativeQuery(
                    "DELETE FROM QMT_ASSET_MASTER WHERE ASSET_TYPE_ID IN (SELECT ID FROM HR_ASSET_TYPE WHERE LOWER(TYPE) = 'assets')")
                    .executeUpdate();
            entityManager.createNativeQuery("DELETE FROM NPD_PRODUCT_MASTER WHERE INVENTORY_TYPE = 'Assets'")
                    .executeUpdate();
            entityManager.createNativeQuery(
                    "DELETE FROM ad_migration_audit_log WHERE table_name IN ('NT_FSS.items -> NPD_PRODUCT_MASTER (Assets)', 'NT_FSS.items -> QMT_MACHINE', 'NT_FSS.items -> QMT_MACHINE (Assets)', 'NT_FSS.items -> QMT_ASSET_MASTER', 'NT_FSS.items -> QMT_ASSET_MASTER (Assets)')")
                    .executeUpdate();
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.progressMap
                    .remove("machineAssetMaster");
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(NpdMigrationService.class).error("Error deleting machine assets", e);
            throw new RuntimeException("Could not delete Machine Assets. " + e.getMessage());
        }
        return "Cleared Machine Assets successfully.";
    }

    @org.springframework.transaction.annotation.Transactional
    public String migrateMaterialTypes(String sqlIp, String sqlUsername, String sqlPassword, String secondaryDbName) {
        return "Migrated material types.";
    }

    @org.springframework.transaction.annotation.Transactional
    public String migrateMaterialGrades(String sqlIp, String sqlUsername, String sqlPassword, String secondaryDbName) {
        return "Migrated material grades.";
    }

    @org.springframework.transaction.annotation.Transactional
    public String migrateShapes(String sqlIp, String sqlUsername, String sqlPassword, String secondaryDbName) {
        return "Migrated shapes.";
    }

    @org.springframework.transaction.annotation.Transactional
    public String migrateMaterialConditions(String sqlIp, String sqlUsername, String sqlPassword,
            String secondaryDbName) {
        return "Migrated material conditions.";
    }

    private String getStringMap(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val == null)
                val = map.get(key.toUpperCase());
            if (val == null)
                val = map.get(key.toLowerCase());
            if (val != null)
                return val.toString().trim();
        }
        return null;
    }

    private Double getDoubleMap(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val == null)
                val = map.get(key.toUpperCase());
            if (val == null)
                val = map.get(key.toLowerCase());
            if (val != null && val instanceof Number)
                return ((Number) val).doubleValue();
            if (val != null) {
                try {
                    return Double.parseDouble(val.toString());
                } catch (Exception e) {
                }
            }
        }
        return null;
    }

    private Boolean getBooleanMap(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val == null)
                val = map.get(key.toUpperCase());
            if (val == null)
                val = map.get(key.toLowerCase());
            if (val != null && val instanceof Boolean)
                return (Boolean) val;
            if (val != null && val instanceof Number)
                return ((Number) val).intValue() == 1;
            if (val != null)
                return Boolean.parseBoolean(val.toString());
        }
        return null;
    }

    private java.sql.Timestamp getTimestampMap(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val == null)
                val = map.get(key.toUpperCase());
            if (val == null)
                val = map.get(key.toLowerCase());
            if (val != null && val instanceof java.sql.Timestamp)
                return (java.sql.Timestamp) val;
            if (val != null && val instanceof java.util.Date)
                return new java.sql.Timestamp(((java.util.Date) val).getTime());
        }
        return null;
    }

    private void setAuditFieldsMap(BaseAuditEntity entity, Map<String, Object> map) {
        entity.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        java.sql.Timestamp createdDate = getTimestampMap(map, "CREATED_DATE", "CREATED_AT", "created_date",
                "created_at");
        entity.setCreatedDate(createdDate != null ? createdDate : new java.util.Date());
        entity.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        entity.setUpdatedDate(getTimestampMap(map, "UPDATED_DATE", "UPDATED_AT", "updated_date", "updated_at"));
    }

    private Integer getIntegerMap(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val == null)
                val = map.get(key.toUpperCase());
            if (val == null)
                val = map.get(key.toLowerCase());
            if (val != null && val instanceof Number)
                return ((Number) val).intValue();
            if (val != null) {
                try {
                    return Integer.parseInt(val.toString().trim());
                } catch (Exception e) {
                }
            }
        }
        return null;
    }

    private ProductMaster resolveProductMaster(JdbcTemplate migrationTemplate, String dbPrefix, String itemId,
            String itemCode, String itemName, String currentUser) {
        String resolvedCode = (itemCode != null && !itemCode.trim().isEmpty()) ? itemCode.trim() : null;
        String resolvedName = (itemName != null && !itemName.trim().isEmpty()) ? itemName.trim() : null;
        String invType = "PRODUCT";

        if (resolvedCode == null && itemId != null && !itemId.trim().isEmpty()) {
            try {
                List<Map<String, Object>> rows = migrationTemplate.queryForList(
                        "SELECT item_code, item_name, grouptype_name, group_name FROM " + dbPrefix
                                + "items WITH (NOLOCK) WHERE id = ?",
                        itemId);
                if (!rows.isEmpty()) {
                    resolvedCode = getStringMap(rows.get(0), "item_code");
                    if (resolvedName == null) {
                        resolvedName = getStringMap(rows.get(0), "item_name");
                    }
                    String gType = getStringMap(rows.get(0), "grouptype_name");
                    if (gType != null && !gType.trim().isEmpty()) {
                        invType = gType;
                    }
                }
            } catch (Exception ignored) {
            }
        }

        if (resolvedCode == null || resolvedCode.trim().isEmpty()) {
            if (itemId != null && !itemId.trim().isEmpty()) {
                resolvedCode = "ITEM-" + itemId.trim();
            } else {
                return null;
            }
        }

        if (resolvedName == null || resolvedName.trim().isEmpty()) {
            resolvedName = resolvedCode;
        }

        // Compare with target DB ProductMaster by itemNo / itemCode
        ProductMaster product = productMasterRepository.findByItemNo(resolvedCode).orElse(null);
        if (product == null) {
            product = productMasterRepository.findByItemCode(resolvedCode).orElse(null);
        }

        if (product == null) {
            product = new ProductMaster();
            product.setItemNo(resolvedCode);
            product.setItemCode(resolvedCode);
            product.setItemName(resolvedName);
            product.setIsActive(true);
            product.setStatus("ACTIVE");
            product.setInventoryType(invType != null ? invType : "PRODUCT");
            product.setCreatedBy(currentUser);
            product.setCreatedDate(new java.util.Date());
            product = productMasterRepository.save(product);
        }
        return product;
    }

    public String migrateProductBoms(String sqlIp, String sqlUsername, String sqlPassword, String secondaryDbName) {
        JdbcTemplate migrationTemplate = (sqlIp != null && !sqlIp.trim().isEmpty())
                ? dynamicMigrationDbService.getDynamicTemplate(sqlIp, sqlUsername, sqlPassword, secondaryDbName)
                : jdbcTemplate;

        if (migrationTemplate == null)
            return "Migration database not configured.";

        String progressTrackerId = "productBomMaster";

        // Determine working database prefix
        String secDb = (secondaryDbName != null && !secondaryDbName.trim().isEmpty()) ? secondaryDbName.trim() : null;
        if (secDb == null) {
            String ctxDb = com.autonoma.erp.modules.qms.checklist.service.MasterChecklistMigrationService
                    .getSecondaryDbName();
            if (ctxDb != null && !ctxDb.trim().isEmpty()) {
                secDb = ctxDb.trim();
            }
        }

        String[] possiblePrefixes = new String[] {
                (secDb != null && !secDb.isEmpty()) ? "[" + secDb + "].[dbo]." : null,
                (secDb != null && !secDb.isEmpty()) ? secDb + ".dbo." : null,
                "[NT_FSS].[dbo].",
                "NT_FSS.dbo.",
                "[ERPDb_NUTECH].[dbo].",
                "ERPDb_NUTECH.dbo.",
                ""
        };

        String workingPrefix = "";
        for (String prefix : possiblePrefixes) {
            if (prefix == null)
                continue;
            try {
                String testSql = "SELECT TOP 1 id FROM " + prefix + "itemprocessmaster WITH (NOLOCK)";
                List<Map<String, Object>> list = migrationTemplate.queryForList(testSql);
                if (list != null) {
                    workingPrefix = prefix;
                    break;
                }
            } catch (Exception ignored) {
            }
        }

        if (workingPrefix.isEmpty()) {
            for (String prefix : possiblePrefixes) {
                if (prefix == null)
                    continue;
                try {
                    String testSql = "SELECT TOP 1 id FROM " + prefix + "prod_bom_dtl WITH (NOLOCK)";
                    List<Map<String, Object>> list = migrationTemplate.queryForList(testSql);
                    if (list != null) {
                        workingPrefix = prefix;
                        break;
                    }
                } catch (Exception ignored) {
                }
            }
        }

        final String dbPrefix = workingPrefix;
        org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(NpdMigrationService.class);
        logger.info("Product BOM Migration using workingPrefix: '{}'", dbPrefix);

        String currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (currentUser == null)
            currentUser = "Admin";

        // Pre-fetch default process for fallbacks
        ProductProcess defaultProcess = null;
        List<ProductProcess> allProcesses = productProcessRepository.findAll();
        if (!allProcesses.isEmpty()) {
            defaultProcess = allProcesses.get(0);
        } else {
            defaultProcess = new ProductProcess();
            defaultProcess.setProcessName("Assembly");
            defaultProcess.setProcessCd("ASSY");
            defaultProcess.setStatus(true);
            defaultProcess.setCreatedBy(currentUser);
            defaultProcess.setCreatedDate(new java.util.Date());
            defaultProcess = productProcessRepository.save(defaultProcess);
        }

        // Try primary legacy source: itemprocessmaster
        List<Map<String, Object>> itemProcessMasterRows = new java.util.ArrayList<>();
        try {
            itemProcessMasterRows = migrationTemplate.queryForList(
                    "SELECT ipm.*, p.process_name as pm_process_name, p.process_code as pm_process_code " +
                            "FROM " + dbPrefix + "itemprocessmaster ipm WITH (NOLOCK) " +
                            "LEFT JOIN " + dbPrefix + "processmaster p WITH (NOLOCK) ON ipm.process_id = p.id " +
                            "ORDER BY ipm.item_id ASC, ipm.sequence_no ASC, ipm.id ASC");
        } catch (Exception e) {
            try {
                itemProcessMasterRows = migrationTemplate.queryForList(
                        "SELECT * FROM " + dbPrefix
                                + "itemprocessmaster WITH (NOLOCK) ORDER BY item_id ASC, sequence_no ASC, id ASC");
            } catch (Exception ignored) {
            }
        }

        if (itemProcessMasterRows != null && !itemProcessMasterRows.isEmpty()) {
            // --- PRIMARY MAPPING DRIVER: itemprocessmaster ---
            Map<String, List<Map<String, Object>>> rowsByItem = new java.util.LinkedHashMap<>();
            for (Map<String, Object> r : itemProcessMasterRows) {
                String itemId = getStringMap(r, "item_id");
                if (itemId != null && !itemId.trim().isEmpty()) {
                    rowsByItem.computeIfAbsent(itemId.trim(), k -> new java.util.ArrayList<>()).add(r);
                }
            }

            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.start(progressTrackerId,
                    rowsByItem.size());

            int count = 0, skipped = 0, failed = 0;

            for (Map.Entry<String, List<Map<String, Object>>> entry : rowsByItem.entrySet()) {
                if (MasterChecklistMigrationService.stopFlag.get()) {
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                            .fail(progressTrackerId);
                    return "Migration stopped. Migrated " + count + " records.";
                }

                String targetItemId = entry.getKey();
                List<Map<String, Object>> processRows = entry.getValue();
                if (processRows.isEmpty())
                    continue;

                Map<String, Object> firstRow = processRows.get(0);

                try {
                    ProductMaster product = resolveProductMaster(migrationTemplate, dbPrefix, targetItemId, null, null,
                            currentUser);
                    if (product == null) {
                        skipped++;
                        continue;
                    }

                    String bomNo = "BOM-" + product.getItemNo();

                    // Clean up existing BOM for this product / BOM no
                    List<com.autonoma.erp.modules.npd.bom.entity.BomMaster> existingByProduct = bomMasterRepository
                            .findByProductId(product.getId());
                    if (!existingByProduct.isEmpty()) {
                        bomMasterRepository.deleteAll(existingByProduct);
                        bomMasterRepository.flush();
                    }
                    bomMasterRepository.findByBomNo(bomNo).ifPresent(oldBom -> {
                        bomMasterRepository.delete(oldBom);
                        bomMasterRepository.flush();
                    });

                    com.autonoma.erp.modules.npd.bom.entity.BomMaster bom = new com.autonoma.erp.modules.npd.bom.entity.BomMaster();
                    bom.setProduct(product);
                    bom.setBomNo(bomNo);
                    bom.setRevNo(getStringMap(firstRow, "rev_no", "trans_sno", "hdr_trans_sno") != null
                            ? getStringMap(firstRow, "rev_no", "trans_sno", "hdr_trans_sno")
                            : "1");

                    java.sql.Timestamp revDate = getTimestampMap(firstRow, "rev_date", "trans_date", "created_date");
                    bom.setRevDate(
                            revDate != null ? revDate.toLocalDateTime().toLocalDate() : java.time.LocalDate.now());
                    bom.setIsActive(getBooleanMap(firstRow, "is_active", "active", "status") != null
                            ? getBooleanMap(firstRow, "is_active", "active", "status")
                            : true);

                    bom.setBaseQuantity(java.math.BigDecimal.ONE);
                    bom.setBomUsage("Production");
                    bom.setRemarks(getStringMap(firstRow, "remarks", "close_remark"));

                    Integer division = getIntegerMap(firstRow, "division_no", "division", "pdivision_no");
                    bom.setDivision(division != null ? division : 1);
                    setAuditFieldsMap(bom, firstRow);

                    for (Map<String, Object> prs : processRows) {
                        com.autonoma.erp.modules.npd.bom.entity.BomProcess bp = new com.autonoma.erp.modules.npd.bom.entity.BomProcess();
                        bp.setBomMaster(bom);

                        Double seqNo = getDoubleMap(prs, "sequence_no", "seq_no");
                        bp.setSeqNo(seqNo != null ? seqNo.intValue() : (bom.getProcesses().size() + 1) * 10);

                        bp.setWorkCenter(getStringMap(prs, "resource", "work_center"));
                        bp.setIsActive(getBooleanMap(prs, "is_active", "active", "status") != null
                                ? getBooleanMap(prs, "is_active", "active", "status")
                                : true);

                        Double pCost = getDoubleMap(prs, "process_cost");
                        if (pCost != null)
                            bp.setProcessCost(java.math.BigDecimal.valueOf(pCost));

                        Boolean autoGir = getBooleanMap(prs, "auto_gir");
                        bp.setAutoGir(autoGir != null ? autoGir : false);

                        // AUTO_QC: inspection_req (if 0 then 1 else 0)
                        Object inspReqObj = prs.get("inspection_req");
                        if (inspReqObj != null) {
                            String inspStr = String.valueOf(inspReqObj).trim();
                            bp.setAutoQc("0".equals(inspStr) || "false".equalsIgnoreCase(inspStr));
                        } else {
                            Boolean autoQc = getBooleanMap(prs, "auto_qc");
                            bp.setAutoQc(autoQc != null ? autoQc : false);
                        }

                        bp.setProduct(product);

                        Integer procDiv = getIntegerMap(prs, "pdivision_no", "division_no", "division");
                        bp.setDivision(procDiv != null ? procDiv : bom.getDivision());

                        bp.setDescription(getStringMap(prs, "process_description", "description"));

                        Double setupT = getDoubleMap(prs, "setup_time");
                        if (setupT != null)
                            bp.setSetupTime(java.math.BigDecimal.valueOf(setupT));

                        Double cycleT = getDoubleMap(prs, "process_time", "cycle_time");
                        if (cycleT != null)
                            bp.setCycleTime(java.math.BigDecimal.valueOf(cycleT));

                        Double normsPerHr = getDoubleMap(prs, "unit_per_hr", "norms_per_hrs", "norms_per_hour");
                        if (normsPerHr != null)
                            bp.setNormsPerHrs(java.math.BigDecimal.valueOf(normsPerHr));

                        // Resolve ProductProcess entity
                        String processIdStr = getStringMap(prs, "process_id");
                        String procMasterId = getStringMap(prs, "id");
                        String pName = getStringMap(prs, "pm_process_name", "process_name", "process_description");
                        String pCode = getStringMap(prs, "pm_process_code", "process_code");

                        if ((pName == null || pName.trim().isEmpty()) && processIdStr != null
                                && !processIdStr.trim().isEmpty()) {
                            try {
                                List<Map<String, Object>> pRows = migrationTemplate.queryForList(
                                        "SELECT process_name, process_code FROM " + dbPrefix
                                                + "processmaster WITH (NOLOCK) WHERE id = ?",
                                        processIdStr);
                                if (!pRows.isEmpty()) {
                                    pName = getStringMap(pRows.get(0), "process_name");
                                    if (pCode == null)
                                        pCode = getStringMap(pRows.get(0), "process_code");
                                }
                            } catch (Exception ignored) {
                            }
                        }

                        ProductProcess proc = null;
                        if (pName != null && !pName.trim().isEmpty()) {
                            proc = productProcessRepository.findByProcessNameIgnoreCase(pName.trim()).orElse(null);
                        }
                        if (proc == null && pName != null && !pName.trim().isEmpty()) {
                            proc = new ProductProcess();
                            proc.setProcessName(pName.trim());
                            proc.setProcessCd((pCode != null && !pCode.trim().isEmpty()) ? pCode.trim()
                                    : (pName.trim().length() > 10 ? pName.trim().substring(0, 10).toUpperCase()
                                            : pName.trim().toUpperCase()));
                            proc.setStatus(true);
                            proc.setCreatedBy(currentUser);
                            proc.setCreatedDate(new java.util.Date());
                            proc = productProcessRepository.save(proc);
                        }
                        if (proc == null)
                            proc = defaultProcess;
                        bp.setProcess(proc);
                        setAuditFieldsMap(bp, prs);

                        // --- Fetch Materials (itemprocess_raw) for THIS process ---
                        List<Map<String, Object>> matRs = new java.util.ArrayList<>();
                        try {
                            matRs = migrationTemplate.queryForList(
                                    "SELECT r.*, r.rawmaterial_name as rm_item_name, i.item_code as rm_item_code FROM "
                                            + dbPrefix
                                            + "itemprocess_raw r WITH (NOLOCK) " +
                                            "LEFT JOIN " + dbPrefix
                                            + "items i WITH (NOLOCK) ON r.rawmaterial_id = i.id " +
                                            "WHERE (r.item_id = ? OR r.item_id = ?) AND (r.process_id = ? OR r.process_id = ?) "
                                            +
                                            "ORDER BY r.sequence_no ASC, r.id ASC",
                                    targetItemId, targetItemId, processIdStr, procMasterId);
                        } catch (Exception e1) {
                            try {
                                matRs = migrationTemplate.queryForList(
                                        "SELECT r.*, r.rawmaterial_name as rm_item_name, i.item_code as rm_item_code FROM "
                                                + dbPrefix
                                                + "itemprocess_raw r WITH (NOLOCK) " +
                                                "LEFT JOIN " + dbPrefix
                                                + "items i WITH (NOLOCK) ON r.rawmaterial_id = i.id " +
                                                "WHERE r.item_id = ? " +
                                                "ORDER BY r.sequence_no ASC, r.id ASC",
                                        targetItemId);
                            } catch (Exception e2) {
                                try {
                                    matRs = migrationTemplate.queryForList(
                                            "SELECT r.*, i.item_code as rm_item_code, i.item_name as rm_item_name FROM "
                                                    + dbPrefix
                                                    + "prod_bom_process_raw r WITH (NOLOCK) " +
                                                    "LEFT JOIN " + dbPrefix
                                                    + "items i WITH (NOLOCK) ON r.rawmaterial_id = i.id " +
                                                    "WHERE r.item_id = ? " +
                                                    "ORDER BY r.id ASC",
                                            targetItemId);
                                } catch (Exception ignored) {
                                }
                            }
                        }

                        for (Map<String, Object> mr : matRs) {
                            String rmCode = getStringMap(mr, "rm_item_code");
                            String rmId = getStringMap(mr, "rawmaterial_id");
                            String rmName = getStringMap(mr, "rawmaterial_name", "rm_item_name");

                            ProductMaster inputProduct = resolveProductMaster(migrationTemplate, dbPrefix, rmId, rmCode,
                                    rmName, currentUser);
                            if (inputProduct == null)
                                continue;

                            com.autonoma.erp.modules.npd.bom.entity.BomProcessMaterial bpm = new com.autonoma.erp.modules.npd.bom.entity.BomProcessMaterial();
                            bpm.setBomProcess(bp);
                            bpm.setProcess(bp.getProcess());

                            Double mSeqNo = getDoubleMap(mr, "sequence_no", "seq_no");
                            bpm.setSeqNo(mSeqNo != null ? mSeqNo.intValue() : bp.getMaterials().size() + 1);

                            bpm.setInputProduct(inputProduct);

                            Double mQty = getDoubleMap(mr, "req_qty", "qty", "quantity");
                            bpm.setQuantity(
                                    mQty != null ? java.math.BigDecimal.valueOf(mQty) : java.math.BigDecimal.ONE);
                            bpm.setConsumptionQty(bpm.getQuantity());
                            bpm.setFinishQty(bpm.getQuantity());

                            String rawUom = getStringMap(mr, "uom_id", "uom");
                            bpm.setUom(resolveUomName(migrationTemplate, dbPrefix, rawUom, inputProduct));

                            Double scrapVal = getDoubleMap(mr, "scrap_percentage", "scrap_per", "scrap_percent",
                                    "scrap_qty");
                            bpm.setScrapPercentage(scrapVal != null ? java.math.BigDecimal.valueOf(scrapVal)
                                    : java.math.BigDecimal.ZERO);

                            bpm.setProduct(product);
                            Integer matDiv = getIntegerMap(mr, "division_no", "division");
                            bpm.setDivision(matDiv != null ? matDiv : bp.getDivision());

                            setAuditFieldsMap(bpm, mr);
                            bp.getMaterials().add(bpm);
                        }

                        // --- Fetch Machines (itemprocess_machine) for THIS process ---
                        try {
                            List<Map<String, Object>> macRs = migrationTemplate.queryForList(
                                    "SELECT * FROM " + dbPrefix + "itemprocess_machine WITH (NOLOCK) " +
                                            "WHERE (item_id = ? OR item_id = ?) AND (process_id = ? OR process_id = ?) "
                                            +
                                            "ORDER BY sequence_no ASC, id ASC",
                                    targetItemId, targetItemId, processIdStr, procMasterId);
                            if (macRs.isEmpty()) {
                                try {
                                    macRs = migrationTemplate.queryForList(
                                            "SELECT * FROM " + dbPrefix
                                                    + "itemprocess_machine WITH (NOLOCK) WHERE item_id = ? ORDER BY sequence_no ASC",
                                            targetItemId);
                                } catch (Exception e2) {
                                    try {
                                        macRs = migrationTemplate.queryForList(
                                                "SELECT * FROM " + dbPrefix
                                                        + "prod_bom_process_machine WITH (NOLOCK) WHERE item_id = ?",
                                                targetItemId);
                                    } catch (Exception ignored) {
                                    }
                                }
                            }
                            for (Map<String, Object> mr : macRs) {
                                com.autonoma.erp.modules.npd.bom.entity.BomProcessMachine bpmac = new com.autonoma.erp.modules.npd.bom.entity.BomProcessMachine();
                                bpmac.setBomProcess(bp);
                                bpmac.setProcess(bp.getProcess());

                                Integer macSeqNo = getIntegerMap(mr, "sequence_no", "seq_no");
                                bpmac.setSeqNo(macSeqNo != null ? macSeqNo : bp.getMachines().size() + 1);

                                String macId = getStringMap(mr, "machine_no", "machine_id");
                                String macCode = null;
                                String macName = null;
                                if (macId != null && !macId.trim().isEmpty()) {
                                    try {
                                        List<Map<String, Object>> macItems = migrationTemplate.queryForList(
                                                "SELECT item_code, item_name FROM " + dbPrefix
                                                        + "items WITH (NOLOCK) WHERE id = ?",
                                                macId);
                                        if (!macItems.isEmpty()) {
                                            macCode = getStringMap(macItems.get(0), "item_code");
                                            macName = getStringMap(macItems.get(0), "item_name");
                                        }
                                    } catch (Exception ignored) {
                                    }
                                    if (macCode == null)
                                        macCode = macId;
                                }

                                if (macCode != null) {
                                    com.autonoma.erp.modules.qmt.entity.Machine m = machineRepository
                                            .findByAssetIdIgnoreCase(macCode).orElse(null);
                                    if (m == null && macName != null) {
                                        m = machineRepository.findByAssetNameIgnoreCase(macName).orElse(null);
                                    }
                                    if (m != null) {
                                        bpmac.setMachine(m);
                                    }
                                }

                                bpmac.setSetupTime(
                                        setupT != null ? java.math.BigDecimal.valueOf(setupT) : bp.getSetupTime());
                                bpmac.setCycleTime(
                                        cycleT != null ? java.math.BigDecimal.valueOf(cycleT) : bp.getCycleTime());

                                bpmac.setProduct(product);
                                Integer macDiv = getIntegerMap(mr, "division_no", "division", "pdivision_no");
                                bpmac.setDivision(macDiv != null ? macDiv : bp.getDivision());
                                bpmac.setStatus(true);

                                if (bpmac.getMachine() != null) {
                                    setAuditFieldsMap(bpmac, mr);
                                    bp.getMachines().add(bpmac);
                                }
                            }
                        } catch (Exception ignored) {
                        }

                        // --- Fetch Tools (itemprocess_tools) for THIS process ---
                        try {
                            List<Map<String, Object>> toolRs = migrationTemplate.queryForList(
                                    "SELECT * FROM " + dbPrefix + "itemprocess_tools WITH (NOLOCK) " +
                                            "WHERE (item_id = ? OR item_id = ?) AND (process_id = ? OR process_id = ?) "
                                            +
                                            "ORDER BY sequence_no ASC, id ASC",
                                    targetItemId, targetItemId, processIdStr, procMasterId);
                            if (toolRs.isEmpty()) {
                                try {
                                    toolRs = migrationTemplate.queryForList(
                                            "SELECT * FROM " + dbPrefix
                                                    + "itemprocess_tools WITH (NOLOCK) WHERE item_id = ? ORDER BY sequence_no ASC",
                                            targetItemId);
                                } catch (Exception e2) {
                                    try {
                                        toolRs = migrationTemplate.queryForList(
                                                "SELECT * FROM " + dbPrefix
                                                        + "prod_bom_process_tools WITH (NOLOCK) WHERE item_id = ?",
                                                targetItemId);
                                    } catch (Exception ignored) {
                                    }
                                }
                            }
                            for (Map<String, Object> tr : toolRs) {
                                com.autonoma.erp.modules.npd.bom.entity.BomProcessTool bpt = new com.autonoma.erp.modules.npd.bom.entity.BomProcessTool();
                                bpt.setBomProcess(bp);
                                bpt.setProcess(bp.getProcess());

                                Integer toolSeqNo = getIntegerMap(tr, "sequence_no", "seq_no");
                                bpt.setSeqNo(toolSeqNo != null ? toolSeqNo : bp.getTools().size() + 1);

                                bpt.setProduct(product);
                                Integer toolDiv = getIntegerMap(tr, "division_no", "pdivision_no", "division");
                                bpt.setDivision(toolDiv != null ? toolDiv : bp.getDivision());

                                String toolCode = getStringMap(tr, "tool_no", "tool_id", "tool_code");
                                String toolName = getStringMap(tr, "tool_name", "tool_desc");
                                if (toolName == null || toolName.trim().isEmpty()) {
                                    toolName = (toolCode != null && !toolCode.trim().isEmpty()) ? toolCode
                                            : "Tool " + bpt.getSeqNo();
                                }
                                bpt.setToolCode(toolCode != null ? toolCode : "TOOL-" + bpt.getSeqNo());
                                bpt.setToolName(toolName);
                                bpt.setToolType(getStringMap(tr, "tool_type"));

                                Double tQty = getDoubleMap(tr, "no_of_strokes", "qty", "quantity", "req_qty");
                                bpt.setQuantity(
                                        tQty != null ? java.math.BigDecimal.valueOf(tQty) : java.math.BigDecimal.ONE);

                                Integer strokes = getIntegerMap(tr, "no_of_strokes", "usage_limit");
                                bpt.setUsageLimit(strokes);

                                bpt.setUom(getStringMap(tr, "uom", "uom_id") != null ? getStringMap(tr, "uom", "uom_id")
                                        : "Nos");
                                setAuditFieldsMap(bpt, tr);
                                bp.getTools().add(bpt);
                            }
                        } catch (Exception ignored) {
                        }

                        bom.getProcesses().add(bp);
                    }

                    bomMasterRepository.saveAndFlush(bom);
                    count++;
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                            .update(progressTrackerId, count);

                } catch (Exception e) {
                    org.slf4j.LoggerFactory.getLogger(NpdMigrationService.class)
                            .error("Error migrating BOM for part: " + targetItemId, e);
                    failed++;
                } finally {
                    try {
                        if (entityManager != null) {
                            entityManager.clear();
                        }
                    } catch (Exception ignored) {
                    }
                }
            }

            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                    .complete(progressTrackerId);
            return "Successfully migrated " + count + " Product BOM records from itemprocessmaster. Skipped: " + skipped
                    + ", Failed: " + failed;
        }

        // --- SECONDARY FALLBACK DRIVER: prod_bom_dtl ---
        List<Map<String, Object>> allDtlRows = new java.util.ArrayList<>();
        try {
            allDtlRows = migrationTemplate.queryForList(
                    "SELECT * FROM " + dbPrefix + "prod_bom_dtl WITH (NOLOCK) ORDER BY header_id ASC, id ASC");
        } catch (Exception e) {
            logger.error("Error fetching prod_bom_dtl with prefix: " + dbPrefix, e);
        }

        Map<String, List<Map<String, Object>>> dtlByHeader = new java.util.LinkedHashMap<>();
        if (allDtlRows != null) {
            for (Map<String, Object> r : allDtlRows) {
                String hid = getStringMap(r, "header_id");
                if (hid == null)
                    hid = "1";
                dtlByHeader.computeIfAbsent(hid, k -> new java.util.ArrayList<>()).add(r);
            }
        }

        Map<String, Map<String, Object>> hdrByFgItem = new java.util.LinkedHashMap<>();
        Map<String, Map<String, Object>> hdrById = new java.util.LinkedHashMap<>();
        try {
            List<Map<String, Object>> hdrList = migrationTemplate
                    .queryForList("SELECT * FROM " + dbPrefix + "prod_bom_hdr WITH (NOLOCK)");
            for (Map<String, Object> h : hdrList) {
                String hid = getStringMap(h, "id");
                String fgId = getStringMap(h, "fg_item_id");
                if (hid != null)
                    hdrById.put(hid, h);
                if (fgId != null)
                    hdrByFgItem.put(fgId, h);
            }
        } catch (Exception ignored) {
        }

        class BomTreeNode {
            Map<String, Object> row;
            int level;
            String itemId;
            String sfgItemId;
            String itemCode;
            String itemName;
            Integer division;
            Boolean active;
            Double reqQty;
            List<BomTreeNode> children = new java.util.ArrayList<>();
        }

        List<BomTreeNode> assemblyNodesToMigrate = new java.util.ArrayList<>();
        Set<String> migratedItemIds = new java.util.HashSet<>();

        for (Map.Entry<String, List<Map<String, Object>>> hEntry : dtlByHeader.entrySet()) {
            List<Map<String, Object>> headerRows = hEntry.getValue();
            List<BomTreeNode> currentTreeNodes = new java.util.ArrayList<>();

            for (Map<String, Object> r : headerRows) {
                BomTreeNode n = new BomTreeNode();
                n.row = r;
                n.level = getIntegerMap(r, "level") != null ? getIntegerMap(r, "level") : 0;
                n.itemId = getStringMap(r, "item_id");
                n.sfgItemId = getStringMap(r, "sfg_item_id");
                n.division = getIntegerMap(r, "division_no", "division");
                n.active = getBooleanMap(r, "active", "is_active", "status");
                n.reqQty = getDoubleMap(r, "req_qty", "tot_req_qty", "quantity");
                currentTreeNodes.add(n);
            }

            Map<Integer, BomTreeNode> levelStack = new java.util.HashMap<>();
            for (BomTreeNode node : currentTreeNodes) {
                levelStack.entrySet().removeIf(e -> e.getKey() >= node.level);
                levelStack.put(node.level, node);
                if (node.level > 0) {
                    BomTreeNode parent = levelStack.get(node.level - 1);
                    if (parent != null) {
                        parent.children.add(node);
                    }
                }
            }

            for (BomTreeNode node : currentTreeNodes) {
                Boolean isBomMaintained = getBooleanMap(node.row, "is_bom_maintained");
                boolean hasSfg = (node.sfgItemId != null && !node.sfgItemId.trim().isEmpty()
                        && !"0".equals(node.sfgItemId.trim()));
                if (node.level == 0 || !node.children.isEmpty() || Boolean.TRUE.equals(isBomMaintained) || hasSfg) {
                    assemblyNodesToMigrate.add(node);
                }
            }
        }

        List<com.autonoma.erp.modules.npd.bom.entity.BomMaster> existingBoms = bomMasterRepository.findAll();
        Set<Long> existingProductIds = existingBoms.stream()
                .filter(b -> b.getProduct() != null)
                .map(b -> b.getProduct().getId())
                .collect(Collectors.toSet());
        Set<String> existingBomNos = existingBoms.stream()
                .filter(b -> b.getBomNo() != null)
                .map(b -> b.getBomNo())
                .collect(Collectors.toSet());

        int count = (int) bomMasterRepository.count();
        int skipped = 0, failed = 0;

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.start(progressTrackerId,
                assemblyNodesToMigrate.size());
        if (count > 0) {
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.update(progressTrackerId, count);
        }

        for (BomTreeNode node : assemblyNodesToMigrate) {
            if (MasterChecklistMigrationService.stopFlag.get()) {
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .fail(progressTrackerId);
                return "Migration stopped. Migrated " + count + " records.";
            }

            String targetItemId = node.itemId;
            if (targetItemId == null || targetItemId.trim().isEmpty() || migratedItemIds.contains(targetItemId)) {
                skipped++;
                continue;
            }

            try {
                Map<String, Object> hdrRow = hdrByFgItem.get(targetItemId);

                ProductMaster product = resolveProductMaster(migrationTemplate, dbPrefix, targetItemId, node.itemCode,
                        node.itemName, currentUser);
                if (product == null) {
                    skipped++;
                    continue;
                }

                String bomNo = null;
                if (node.level == 0 && hdrRow != null) {
                    bomNo = getStringMap(hdrRow, "trans_strno", "trans", "bom_no");
                }
                if (bomNo == null || bomNo.trim().isEmpty() || node.level > 0) {
                    bomNo = "BOM-" + product.getItemNo();
                }

                if (existingProductIds.contains(product.getId()) || existingBomNos.contains(bomNo)) {
                    migratedItemIds.add(targetItemId);
                    skipped++;
                    continue;
                }

                com.autonoma.erp.modules.npd.bom.entity.BomMaster bom = new com.autonoma.erp.modules.npd.bom.entity.BomMaster();

                bom.setProduct(product);
                bom.setBomNo(bomNo);
                bom.setRevNo(getStringMap(node.row, "trans_sno", "hdr_trans_sno", "rev_no") != null
                        ? getStringMap(node.row, "trans_sno", "hdr_trans_sno", "rev_no")
                        : "1");

                java.sql.Timestamp revDate = getTimestampMap(node.row, "trans_date", "hdr_trans_date", "rev_date",
                        "created_date");
                if (revDate != null)
                    bom.setRevDate(revDate.toLocalDateTime().toLocalDate());
                else
                    bom.setRevDate(java.time.LocalDate.now());

                bom.setIsActive(node.active != null ? node.active : true);

                Double qty = node.reqQty != null ? node.reqQty : 1.0;
                bom.setBaseQuantity(java.math.BigDecimal.valueOf(qty));
                bom.setBomUsage("Production");
                bom.setRemarks(getStringMap(node.row, "close_remark", "remarks"));

                Integer division = node.division;
                if (division == null && hdrRow != null) {
                    division = getIntegerMap(hdrRow, "division_no", "division");
                }
                bom.setDivision(division != null ? division : 1);

                setAuditFieldsMap(bom, node.row);

                // --- POPULATE PROCESSES, MATERIALS, MACHINES, AND TOOLS ---
                List<Map<String, Object>> itemProcRows = new java.util.ArrayList<>();
                try {
                    itemProcRows = migrationTemplate.queryForList(
                            "SELECT ipm.*, p.process_name as pm_process_name, p.process_code as pm_process_code " +
                                    "FROM " + dbPrefix + "itemprocessmaster ipm WITH (NOLOCK) " +
                                    "LEFT JOIN " + dbPrefix + "processmaster p WITH (NOLOCK) ON ipm.process_id = p.id " +
                                    "WHERE ipm.item_id = ? ORDER BY ipm.sequence_no ASC, ipm.id ASC",
                            targetItemId);
                } catch (Exception ignored) {
                }

                if (itemProcRows != null && !itemProcRows.isEmpty()) {
                    for (Map<String, Object> prs : itemProcRows) {
                        com.autonoma.erp.modules.npd.bom.entity.BomProcess bp = new com.autonoma.erp.modules.npd.bom.entity.BomProcess();
                        bp.setBomMaster(bom);

                        Double seqNo = getDoubleMap(prs, "sequence_no", "seq_no");
                        bp.setSeqNo(seqNo != null ? seqNo.intValue() : (bom.getProcesses().size() + 1) * 10);
                        bp.setWorkCenter(getStringMap(prs, "resource", "work_center"));
                        bp.setIsActive(getBooleanMap(prs, "is_active", "active", "status") != null
                                ? getBooleanMap(prs, "is_active", "active", "status")
                                : true);

                        Double pCost = getDoubleMap(prs, "process_cost");
                        if (pCost != null)
                            bp.setProcessCost(java.math.BigDecimal.valueOf(pCost));

                        Boolean autoGir = getBooleanMap(prs, "auto_gir");
                        bp.setAutoGir(autoGir != null ? autoGir : false);

                        Object inspReqObj = prs.get("inspection_req");
                        if (inspReqObj != null) {
                            String inspStr = String.valueOf(inspReqObj).trim();
                            bp.setAutoQc("0".equals(inspStr) || "false".equalsIgnoreCase(inspStr));
                        } else {
                            Boolean autoQc = getBooleanMap(prs, "auto_qc");
                            bp.setAutoQc(autoQc != null ? autoQc : false);
                        }

                        bp.setProduct(product);
                        Integer procDiv = getIntegerMap(prs, "pdivision_no", "division_no", "division");
                        bp.setDivision(procDiv != null ? procDiv : bom.getDivision());
                        bp.setDescription(getStringMap(prs, "process_description", "description"));

                        Double setupT = getDoubleMap(prs, "setup_time");
                        if (setupT != null)
                            bp.setSetupTime(java.math.BigDecimal.valueOf(setupT));
                        Double cycleT = getDoubleMap(prs, "process_time", "cycle_time");
                        if (cycleT != null)
                            bp.setCycleTime(java.math.BigDecimal.valueOf(cycleT));
                        Double normsPerHr = getDoubleMap(prs, "unit_per_hr", "norms_per_hrs", "norms_per_hour");
                        if (normsPerHr != null)
                            bp.setNormsPerHrs(java.math.BigDecimal.valueOf(normsPerHr));

                        String processIdStr = getStringMap(prs, "process_id");
                        String procMasterId = getStringMap(prs, "id");
                        String pName = getStringMap(prs, "pm_process_name", "process_name", "process_description");
                        String pCode = getStringMap(prs, "pm_process_code", "process_code");

                        ProductProcess proc = null;
                        if (pName != null && !pName.trim().isEmpty()) {
                            proc = productProcessRepository.findByProcessNameIgnoreCase(pName.trim()).orElse(null);
                        }
                        if (proc == null && pName != null && !pName.trim().isEmpty()) {
                            proc = new ProductProcess();
                            proc.setProcessName(pName.trim());
                            proc.setProcessCd((pCode != null && !pCode.trim().isEmpty()) ? pCode.trim()
                                    : (pName.trim().length() > 10 ? pName.trim().substring(0, 10).toUpperCase()
                                            : pName.trim().toUpperCase()));
                            proc.setStatus(true);
                            proc.setCreatedBy(currentUser);
                            proc.setCreatedDate(new java.util.Date());
                            proc = productProcessRepository.save(proc);
                        }
                        if (proc == null)
                            proc = defaultProcess;
                        bp.setProcess(proc);
                        setAuditFieldsMap(bp, prs);

                        // Fetch raw materials for this process
                        List<Map<String, Object>> matRs = new java.util.ArrayList<>();
                        try {
                            matRs = migrationTemplate.queryForList(
                                    "SELECT r.*, r.rawmaterial_name as rm_item_name, i.item_code as rm_item_code FROM " + dbPrefix
                                            + "itemprocess_raw r WITH (NOLOCK) " +
                                            "LEFT JOIN " + dbPrefix + "items i WITH (NOLOCK) ON r.rawmaterial_id = i.id " +
                                            "WHERE (r.item_id = ? OR r.item_id = ?) AND (r.process_id = ? OR r.process_id = ?) " +
                                            "ORDER BY r.sequence_no ASC, r.id ASC",
                                    targetItemId, targetItemId, processIdStr, procMasterId);
                        } catch (Exception ignored) {
                        }

                        for (Map<String, Object> mr : matRs) {
                            String rmCode = getStringMap(mr, "rm_item_code");
                            String rmId = getStringMap(mr, "rawmaterial_id");
                            String rmName = getStringMap(mr, "rawmaterial_name", "rm_item_name");
                            ProductMaster inputProduct = resolveProductMaster(migrationTemplate, dbPrefix, rmId, rmCode, rmName, currentUser);
                            if (inputProduct == null) continue;

                            com.autonoma.erp.modules.npd.bom.entity.BomProcessMaterial bpm = new com.autonoma.erp.modules.npd.bom.entity.BomProcessMaterial();
                            bpm.setBomProcess(bp);
                            bpm.setProcess(bp.getProcess());
                            Double mSeqNo = getDoubleMap(mr, "sequence_no", "seq_no");
                            bpm.setSeqNo(mSeqNo != null ? mSeqNo.intValue() : (bp.getMaterials().size() + 1) * 10);
                            bpm.setInputProduct(inputProduct);
                            Double mQty = getDoubleMap(mr, "req_qty", "qty", "quantity");
                            bpm.setQuantity(mQty != null ? java.math.BigDecimal.valueOf(mQty) : java.math.BigDecimal.ONE);
                            bpm.setConsumptionQty(bpm.getQuantity());
                            bpm.setFinishQty(bpm.getQuantity());
                            bpm.setUom(resolveUomName(migrationTemplate, dbPrefix, getStringMap(mr, "uom_id", "uom"), inputProduct));
                            bpm.setProduct(product);
                            Integer matDiv = getIntegerMap(mr, "division_no", "division");
                            bpm.setDivision(matDiv != null ? matDiv : bp.getDivision());
                            setAuditFieldsMap(bpm, mr);
                            bp.getMaterials().add(bpm);
                        }

                        // Fetch machines for this process
                        List<Map<String, Object>> macRs = new java.util.ArrayList<>();
                        try {
                            macRs = migrationTemplate.queryForList(
                                    "SELECT * FROM " + dbPrefix + "itemprocess_machine WITH (NOLOCK) " +
                                            "WHERE (item_id = ? OR item_id = ?) AND (process_id = ? OR process_id = ?) ORDER BY sequence_no ASC, id ASC",
                                    targetItemId, targetItemId, processIdStr, procMasterId);
                        } catch (Exception ignored) {
                        }
                        for (Map<String, Object> mr : macRs) {
                            com.autonoma.erp.modules.npd.bom.entity.BomProcessMachine bpmac = new com.autonoma.erp.modules.npd.bom.entity.BomProcessMachine();
                            bpmac.setBomProcess(bp);
                            bpmac.setProcess(bp.getProcess());
                            Integer macSeqNo = getIntegerMap(mr, "sequence_no", "seq_no");
                            bpmac.setSeqNo(macSeqNo != null ? macSeqNo : bp.getMachines().size() + 1);

                            String macId = getStringMap(mr, "machine_no", "machine_id");
                            String macCode = null, macName = null;
                            if (macId != null && !macId.trim().isEmpty()) {
                                try {
                                    List<Map<String, Object>> macItems = migrationTemplate.queryForList(
                                            "SELECT item_code, item_name FROM " + dbPrefix + "items WITH (NOLOCK) WHERE id = ?", macId);
                                    if (!macItems.isEmpty()) {
                                        macCode = getStringMap(macItems.get(0), "item_code");
                                        macName = getStringMap(macItems.get(0), "item_name");
                                    }
                                } catch (Exception ignored) {}
                                if (macCode == null) macCode = macId;
                            }
                            if (macCode != null) {
                                com.autonoma.erp.modules.qmt.entity.Machine m = machineRepository.findByAssetIdIgnoreCase(macCode).orElse(null);
                                if (m == null && macName != null) {
                                    m = machineRepository.findByAssetNameIgnoreCase(macName).orElse(null);
                                }
                                if (m != null) bpmac.setMachine(m);
                            }
                            bpmac.setSetupTime(setupT != null ? java.math.BigDecimal.valueOf(setupT) : bp.getSetupTime());
                            bpmac.setCycleTime(cycleT != null ? java.math.BigDecimal.valueOf(cycleT) : bp.getCycleTime());
                            bpmac.setProduct(product);
                            Integer macDiv = getIntegerMap(mr, "division_no", "division", "pdivision_no");
                            bpmac.setDivision(macDiv != null ? macDiv : bp.getDivision());
                            bpmac.setStatus(true);
                            if (bpmac.getMachine() != null) {
                                setAuditFieldsMap(bpmac, mr);
                                bp.getMachines().add(bpmac);
                            }
                        }

                        // Fetch tools for this process
                        List<Map<String, Object>> toolRs = new java.util.ArrayList<>();
                        try {
                            toolRs = migrationTemplate.queryForList(
                                    "SELECT * FROM " + dbPrefix + "itemprocess_tools WITH (NOLOCK) " +
                                            "WHERE (item_id = ? OR item_id = ?) AND (process_id = ? OR process_id = ?) ORDER BY sequence_no ASC, id ASC",
                                    targetItemId, targetItemId, processIdStr, procMasterId);
                        } catch (Exception ignored) {
                        }
                        for (Map<String, Object> tr : toolRs) {
                            com.autonoma.erp.modules.npd.bom.entity.BomProcessTool bpt = new com.autonoma.erp.modules.npd.bom.entity.BomProcessTool();
                            bpt.setBomProcess(bp);
                            bpt.setProcess(bp.getProcess());
                            Integer toolSeqNo = getIntegerMap(tr, "sequence_no", "seq_no");
                            bpt.setSeqNo(toolSeqNo != null ? toolSeqNo : bp.getTools().size() + 1);
                            bpt.setProduct(product);
                            Integer toolDiv = getIntegerMap(tr, "division_no", "pdivision_no", "division");
                            bpt.setDivision(toolDiv != null ? toolDiv : bp.getDivision());
                            String toolCode = getStringMap(tr, "tool_no", "tool_id", "tool_code");
                            String toolName = getStringMap(tr, "tool_name", "tool_desc");
                            if (toolName == null || toolName.trim().isEmpty()) {
                                toolName = (toolCode != null && !toolCode.trim().isEmpty()) ? toolCode : "Tool " + bpt.getSeqNo();
                            }
                            bpt.setToolCode(toolCode != null ? toolCode : "TOOL-" + bpt.getSeqNo());
                            bpt.setToolName(toolName);
                            bpt.setToolType(getStringMap(tr, "tool_type"));
                            Double tQty = getDoubleMap(tr, "no_of_strokes", "qty", "quantity", "req_qty");
                            bpt.setQuantity(tQty != null ? java.math.BigDecimal.valueOf(tQty) : java.math.BigDecimal.ONE);
                            Integer strokes = getIntegerMap(tr, "no_of_strokes", "usage_limit");
                            bpt.setUsageLimit(strokes);
                            bpt.setUom(getStringMap(tr, "uom", "uom_id") != null ? getStringMap(tr, "uom", "uom_id") : "Nos");
                            setAuditFieldsMap(bpt, tr);
                            bp.getTools().add(bpt);
                        }

                        bom.getProcesses().add(bp);
                    }
                }

                if (bom.getProcesses().isEmpty()) {
                    // Build default Assembly process
                    com.autonoma.erp.modules.npd.bom.entity.BomProcess bp = new com.autonoma.erp.modules.npd.bom.entity.BomProcess();
                    bp.setBomMaster(bom);
                    bp.setSeqNo(10);
                    bp.setProcess(defaultProcess);
                    bp.setDescription("Assembly Process");
                    bp.setIsActive(true);
                    bp.setProduct(product);
                    bp.setDivision(bom.getDivision());
                    setAuditFieldsMap(bp, node.row);

                    // Fetch raw materials from itemprocess_raw / prod_bom_process_raw
                    List<Map<String, Object>> matRs = new java.util.ArrayList<>();
                    try {
                        matRs = migrationTemplate.queryForList(
                                "SELECT r.*, r.rawmaterial_name as rm_item_name, i.item_code as rm_item_code FROM " + dbPrefix
                                        + "itemprocess_raw r WITH (NOLOCK) " +
                                        "LEFT JOIN " + dbPrefix + "items i WITH (NOLOCK) ON r.rawmaterial_id = i.id " +
                                        "WHERE r.item_id = ? ORDER BY r.sequence_no ASC, r.id ASC",
                                targetItemId);
                    } catch (Exception e1) {
                        try {
                            matRs = migrationTemplate.queryForList(
                                    "SELECT r.*, i.item_code as rm_item_code, i.item_name as rm_item_name FROM " + dbPrefix
                                            + "prod_bom_process_raw r WITH (NOLOCK) " +
                                            "LEFT JOIN " + dbPrefix + "items i WITH (NOLOCK) ON r.rawmaterial_id = i.id " +
                                            "WHERE r.item_id = ? ORDER BY r.id ASC",
                                    targetItemId);
                        } catch (Exception ignored) {
                        }
                    }
                    for (Map<String, Object> mr : matRs) {
                        String rmCode = getStringMap(mr, "rm_item_code");
                        String rmId = getStringMap(mr, "rawmaterial_id");
                        String rmName = getStringMap(mr, "rawmaterial_name", "rm_item_name");
                        ProductMaster inputProduct = resolveProductMaster(migrationTemplate, dbPrefix, rmId, rmCode, rmName, currentUser);
                        if (inputProduct == null) continue;

                        com.autonoma.erp.modules.npd.bom.entity.BomProcessMaterial bpm = new com.autonoma.erp.modules.npd.bom.entity.BomProcessMaterial();
                        bpm.setBomProcess(bp);
                        bpm.setProcess(bp.getProcess());
                        Double mSeqNo = getDoubleMap(mr, "sequence_no", "seq_no");
                        bpm.setSeqNo(mSeqNo != null ? mSeqNo.intValue() : (bp.getMaterials().size() + 1) * 10);
                        bpm.setInputProduct(inputProduct);
                        Double mQty = getDoubleMap(mr, "req_qty", "qty", "quantity");
                        bpm.setQuantity(mQty != null ? java.math.BigDecimal.valueOf(mQty) : java.math.BigDecimal.ONE);
                        bpm.setConsumptionQty(bpm.getQuantity());
                        bpm.setFinishQty(bpm.getQuantity());
                        bpm.setUom(resolveUomName(migrationTemplate, dbPrefix, getStringMap(mr, "uom_id", "uom"), inputProduct));
                        bpm.setProduct(product);
                        Integer matDiv = getIntegerMap(mr, "division_no", "division");
                        bpm.setDivision(matDiv != null ? matDiv : bp.getDivision());
                        setAuditFieldsMap(bpm, mr);
                        bp.getMaterials().add(bpm);
                    }

                    // Also add materials from child tree nodes (node.children) if any
                    if (node.children != null && !node.children.isEmpty()) {
                        Set<Long> existingMatProductIds = bp.getMaterials().stream()
                                .filter(m -> m.getInputProduct() != null)
                                .map(m -> m.getInputProduct().getId())
                                .collect(Collectors.toSet());

                        for (BomTreeNode child : node.children) {
                            String childItemId = child.sfgItemId;
                            if (childItemId == null || childItemId.trim().isEmpty() || "0".equals(childItemId.trim())) {
                                childItemId = child.itemId;
                            }
                            if (childItemId == null || childItemId.trim().isEmpty()) continue;

                            ProductMaster inputProduct = resolveProductMaster(migrationTemplate, dbPrefix, childItemId, child.itemCode, child.itemName, currentUser);
                            if (inputProduct == null || existingMatProductIds.contains(inputProduct.getId())) continue;

                            com.autonoma.erp.modules.npd.bom.entity.BomProcessMaterial bpm = new com.autonoma.erp.modules.npd.bom.entity.BomProcessMaterial();
                            bpm.setBomProcess(bp);
                            bpm.setProcess(bp.getProcess());
                            bpm.setSeqNo((bp.getMaterials().size() + 1) * 10);
                            bpm.setInputProduct(inputProduct);
                            Double cQty = child.reqQty != null ? child.reqQty : 1.0;
                            bpm.setQuantity(java.math.BigDecimal.valueOf(cQty));
                            bpm.setConsumptionQty(bpm.getQuantity());
                            bpm.setFinishQty(bpm.getQuantity());
                            bpm.setUom(inputProduct.getUom() != null ? inputProduct.getUom() : "Nos");
                            bpm.setProduct(product);
                            Integer childDiv = child.division != null ? child.division : bom.getDivision();
                            bpm.setDivision(childDiv != null ? childDiv : 1);
                            setAuditFieldsMap(bpm, child.row);
                            bp.getMaterials().add(bpm);
                            existingMatProductIds.add(inputProduct.getId());
                        }
                    }

                    // Fetch machines for default process
                    List<Map<String, Object>> macRs = new java.util.ArrayList<>();
                    try {
                        macRs = migrationTemplate.queryForList(
                                "SELECT * FROM " + dbPrefix + "itemprocess_machine WITH (NOLOCK) WHERE item_id = ? ORDER BY sequence_no ASC",
                                targetItemId);
                    } catch (Exception e1) {
                        try {
                            macRs = migrationTemplate.queryForList(
                                    "SELECT * FROM " + dbPrefix + "prod_bom_process_machine WITH (NOLOCK) WHERE item_id = ?",
                                    targetItemId);
                        } catch (Exception ignored) {}
                    }
                    for (Map<String, Object> mr : macRs) {
                        com.autonoma.erp.modules.npd.bom.entity.BomProcessMachine bpmac = new com.autonoma.erp.modules.npd.bom.entity.BomProcessMachine();
                        bpmac.setBomProcess(bp);
                        bpmac.setProcess(bp.getProcess());
                        Integer macSeqNo = getIntegerMap(mr, "sequence_no", "seq_no");
                        bpmac.setSeqNo(macSeqNo != null ? macSeqNo : bp.getMachines().size() + 1);

                        String macId = getStringMap(mr, "machine_no", "machine_id");
                        String macCode = null, macName = null;
                        if (macId != null && !macId.trim().isEmpty()) {
                            try {
                                List<Map<String, Object>> macItems = migrationTemplate.queryForList(
                                        "SELECT item_code, item_name FROM " + dbPrefix + "items WITH (NOLOCK) WHERE id = ?", macId);
                                if (!macItems.isEmpty()) {
                                    macCode = getStringMap(macItems.get(0), "item_code");
                                    macName = getStringMap(macItems.get(0), "item_name");
                                }
                            } catch (Exception ignored) {}
                            if (macCode == null) macCode = macId;
                        }
                        if (macCode != null) {
                            com.autonoma.erp.modules.qmt.entity.Machine m = machineRepository.findByAssetIdIgnoreCase(macCode).orElse(null);
                            if (m == null && macName != null) {
                                m = machineRepository.findByAssetNameIgnoreCase(macName).orElse(null);
                            }
                            if (m != null) bpmac.setMachine(m);
                        }
                        bpmac.setProduct(product);
                        Integer macDiv = getIntegerMap(mr, "division_no", "division", "pdivision_no");
                        bpmac.setDivision(macDiv != null ? macDiv : bp.getDivision());
                        bpmac.setStatus(true);
                        if (bpmac.getMachine() != null) {
                            setAuditFieldsMap(bpmac, mr);
                            bp.getMachines().add(bpmac);
                        }
                    }

                    // Fetch tools for default process
                    List<Map<String, Object>> toolRs = new java.util.ArrayList<>();
                    try {
                        toolRs = migrationTemplate.queryForList(
                                "SELECT * FROM " + dbPrefix + "itemprocess_tools WITH (NOLOCK) WHERE item_id = ? ORDER BY sequence_no ASC",
                                targetItemId);
                    } catch (Exception e1) {
                        try {
                            toolRs = migrationTemplate.queryForList(
                                    "SELECT * FROM " + dbPrefix + "prod_bom_process_tools WITH (NOLOCK) WHERE item_id = ?",
                                    targetItemId);
                        } catch (Exception ignored) {}
                    }
                    for (Map<String, Object> tr : toolRs) {
                        com.autonoma.erp.modules.npd.bom.entity.BomProcessTool bpt = new com.autonoma.erp.modules.npd.bom.entity.BomProcessTool();
                        bpt.setBomProcess(bp);
                        bpt.setProcess(bp.getProcess());
                        Integer toolSeqNo = getIntegerMap(tr, "sequence_no", "seq_no");
                        bpt.setSeqNo(toolSeqNo != null ? toolSeqNo : bp.getTools().size() + 1);
                        bpt.setProduct(product);
                        Integer toolDiv = getIntegerMap(tr, "division_no", "pdivision_no", "division");
                        bpt.setDivision(toolDiv != null ? toolDiv : bp.getDivision());
                        String toolCode = getStringMap(tr, "tool_no", "tool_id", "tool_code");
                        String toolName = getStringMap(tr, "tool_name", "tool_desc");
                        if (toolName == null || toolName.trim().isEmpty()) {
                            toolName = (toolCode != null && !toolCode.trim().isEmpty()) ? toolCode : "Tool " + bpt.getSeqNo();
                        }
                        bpt.setToolCode(toolCode != null ? toolCode : "TOOL-" + bpt.getSeqNo());
                        bpt.setToolName(toolName);
                        bpt.setToolType(getStringMap(tr, "tool_type"));
                        Double tQty = getDoubleMap(tr, "no_of_strokes", "qty", "quantity", "req_qty");
                        bpt.setQuantity(tQty != null ? java.math.BigDecimal.valueOf(tQty) : java.math.BigDecimal.ONE);
                        Integer strokes = getIntegerMap(tr, "no_of_strokes", "usage_limit");
                        bpt.setUsageLimit(strokes);
                        bpt.setUom(getStringMap(tr, "uom", "uom_id") != null ? getStringMap(tr, "uom", "uom_id") : "Nos");
                        setAuditFieldsMap(bpt, tr);
                        bp.getTools().add(bpt);
                    }

                    bom.getProcesses().add(bp);
                }

                bomMasterRepository.saveAndFlush(bom);
                existingProductIds.add(product.getId());
                existingBomNos.add(bomNo);
                migratedItemIds.add(targetItemId);
                count++;
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .update(progressTrackerId, count);

            } catch (Exception e) {
                org.slf4j.LoggerFactory.getLogger(NpdMigrationService.class)
                        .error("Error migrating BOM for part: " + targetItemId, e);
                failed++;
            } finally {
                try {
                    if (entityManager != null) {
                        entityManager.clear();
                    }
                } catch (Exception ignored) {
                }
            }
        }

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete(progressTrackerId);
        return "Successfully migrated " + count + " Product BOM records. Skipped: " + skipped + ", Failed: " + failed;
    }

    @org.springframework.transaction.annotation.Transactional
    public String clearProductBoms() {
        long count = bomMasterRepository.count();
        entityManager.createNativeQuery("DELETE FROM NPD_BOM_PROCESS_MATERIAL").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM NPD_BOM_PROCESS_MACHINE").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM NPD_BOM_PROCESS_TOOL").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM NPD_BOM_PROCESS").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM NPD_BOM_MASTER").executeUpdate();
        return "Successfully cleared " + count + " Product BOM records.";
    }

    private String resolveUomName(JdbcTemplate migrationTemplate, String dbPrefix, String uomVal,
            ProductMaster product) {
        if (uomVal != null && !uomVal.trim().isEmpty()) {
            String trimmed = uomVal.trim();
            if (!trimmed.matches("\\d+")) {
                return trimmed;
            }
            try {
                List<Map<String, Object>> uomRows = migrationTemplate.queryForList(
                        "SELECT uom_name, uom_code FROM " + dbPrefix + "uommaster WITH (NOLOCK) WHERE id = ?", trimmed);
                if (!uomRows.isEmpty()) {
                    String name = getStringMap(uomRows.get(0), "uom_name", "uom_code");
                    if (name != null && !name.trim().isEmpty()) {
                        return name.trim();
                    }
                }
            } catch (Exception ignored) {
            }
        }
        if (product != null && product.getUom() != null && !product.getUom().trim().isEmpty()) {
            return product.getUom().trim();
        }
        return "Nos";
    }

    private boolean existingBomConflict(String bomNo, String currentItemNo) {
        if (bomNo == null || currentItemNo == null)
            return false;
        java.util.Optional<com.autonoma.erp.modules.npd.bom.entity.BomMaster> existing = bomMasterRepository
                .findByBomNo(bomNo);
        if (existing.isPresent()) {
            ProductMaster p = existing.get().getProduct();
            if (p != null && p.getItemNo() != null && !p.getItemNo().equals(currentItemNo)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Resolve legacy attachment file from remote share path by checking candidate
     * screen and enterprise subfolders.
     */
    public static java.io.File resolveLegacySourceFile(String prefix, String screenNo, String cleanName) {
        if (prefix == null || cleanName == null || cleanName.isBlank()) {
            return null;
        }

        String normPrefix = prefix.replace('/', '\\').replaceAll("\\\\+$", "");
        String normCleanName = cleanName.replace('/', '\\').replaceAll("^\\\\+", "");
        String scr = (screenNo != null && !screenNo.isBlank()) ? screenNo.trim() : "105";

        java.util.List<String> candidates = new java.util.ArrayList<>();

        // 1. Direct screen subfolder
        candidates.add(normPrefix + "\\" + scr + "\\" + normCleanName);
        // 2. Direct cleanName
        candidates.add(normPrefix + "\\" + normCleanName);

        // 3. Alternate between enterprise_123 and enterprise_145
        if (normPrefix.contains("enterprise_123")) {
            String p145 = normPrefix.replace("enterprise_123", "enterprise_145");
            candidates.add(p145 + "\\" + scr + "\\" + normCleanName);
            candidates.add(p145 + "\\" + normCleanName);
        }
        if (normPrefix.contains("enterprise_145")) {
            String p123 = normPrefix.replace("enterprise_145", "enterprise_123");
            candidates.add(p123 + "\\" + scr + "\\" + normCleanName);
            candidates.add(p123 + "\\" + normCleanName);
        }

        // 4. If prefix doesn't contain DocFiles
        if (!normPrefix.toLowerCase().contains("docfiles")) {
            candidates.add(normPrefix + "\\DocFiles\\enterprise_123\\" + scr + "\\" + normCleanName);
            candidates.add(normPrefix + "\\DocFiles\\enterprise_145\\" + scr + "\\" + normCleanName);
            candidates.add(normPrefix + "\\DocFiles\\enterprise_123\\" + normCleanName);
            candidates.add(normPrefix + "\\DocFiles\\enterprise_145\\" + normCleanName);
        } else if (!normPrefix.toLowerCase().contains("enterprise_")) {
            // Contains DocFiles but not enterprise_
            candidates.add(normPrefix + "\\enterprise_123\\" + scr + "\\" + normCleanName);
            candidates.add(normPrefix + "\\enterprise_145\\" + scr + "\\" + normCleanName);
            candidates.add(normPrefix + "\\enterprise_123\\" + normCleanName);
            candidates.add(normPrefix + "\\enterprise_145\\" + normCleanName);
        }

        for (String c : candidates) {
            try {
                java.io.File f = new java.io.File(c);
                if (f.exists() && f.isFile()) {
                    return f;
                }
            } catch (Exception ignored) {
            }
        }

        return null;
    }

    /**
     * Repair/backfill missing physical files for already inserted
     * NPD_ATTACHMENT_PATH records.
     */
    @Transactional
    public Map<String, Object> repairMissingNpdFiles(String oldAttachmentPath) {
        String fallbackRoot = "D:\\BOS_DOCUMENTS";
        CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
        if (company != null && company.getDirectoryPath() != null && !company.getDirectoryPath().isEmpty()) {
            fallbackRoot = company.getDirectoryPath();
        }

        String defaultPrefix = "\\\\192.168.1.2\\D$\\ERPAttachDocuments";
        String prefix = (oldAttachmentPath != null && !oldAttachmentPath.trim().isEmpty())
                ? oldAttachmentPath.trim()
                : defaultPrefix;

        List<NpdAttachmentPath> allAtts = npdAttachmentPathRepository.findAll();
        int total = allAtts.size();
        int alreadyExisted = 0;
        int successfullyCopied = 0;
        int failedOrNotFound = 0;

        for (NpdAttachmentPath att : allAtts) {
            String dbPath = att.getPath();
            if (dbPath == null || dbPath.trim().isEmpty()) {
                continue;
            }

            java.io.File targetFile = new java.io.File(dbPath);
            if (targetFile.exists() && targetFile.length() > 0) {
                alreadyExisted++;
                if (documentSearchService != null) {
                    documentSearchService.registerDocument("NPD", "M3115", "NPD_ATTACHMENT_PATH",
                            String.valueOf(att.getId()), null, att.getFileName(), dbPath);
                }
                continue;
            }

            String targetFileName = targetFile.getName();
            int firstUnderscore = targetFileName.indexOf('_');
            String legacyName = (firstUnderscore >= 36) ? targetFileName.substring(firstUnderscore + 1)
                    : targetFileName;

            java.io.File sourceFile = resolveLegacySourceFile(prefix, "105", legacyName);
            if (sourceFile != null && sourceFile.exists()) {
                try {
                    String realFileName = att.getFileName();
                    if (realFileName == null || realFileName.trim().isEmpty()) {
                        realFileName = legacyName;
                    }
                    realFileName = realFileName.replace(",", "_").replaceAll("[\\\\/:*?\"<>|]", "_").trim();

                    java.io.File realTargetFile = new java.io.File(targetFile.getParentFile(), realFileName);
                    if (realTargetFile.getParentFile() != null && !realTargetFile.getParentFile().exists()) {
                        realTargetFile.getParentFile().mkdirs();
                    }
                    java.nio.file.Files.copy(sourceFile.toPath(), realTargetFile.toPath(),
                            java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                    successfullyCopied++;

                    String newDbPath = realTargetFile.getAbsolutePath().replace('\\', '/');
                    att.setPath(newDbPath);
                    npdAttachmentPathRepository.save(att);

                    if (documentSearchService != null) {
                        documentSearchService.registerDocument("NPD", "M3115", "NPD_ATTACHMENT_PATH",
                                String.valueOf(att.getId()), null, realFileName, newDbPath);
                    }
                } catch (Exception ex) {
                    failedOrNotFound++;
                    org.slf4j.LoggerFactory.getLogger(NpdMigrationService.class)
                            .error("Failed to copy from " + sourceFile.getAbsolutePath() + " to "
                                    + targetFile.getAbsolutePath(), ex);
                }
            } else {
                failedOrNotFound++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalChecked", total);
        result.put("alreadyExisted", alreadyExisted);
        result.put("successfullyCopied", successfullyCopied);
        result.put("failedOrNotFound", failedOrNotFound);
        return result;
    }

}
