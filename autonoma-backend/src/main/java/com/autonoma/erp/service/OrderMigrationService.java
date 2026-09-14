package com.autonoma.erp.service;

import com.autonoma.erp.model.VisitorGatePass;
import com.autonoma.erp.repository.VisitorGatePassRepository;
import com.autonoma.erp.modules.qms.checklist.service.MasterChecklistMigrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderMigrationService {

    @Autowired(required = false)
    @Qualifier("secondaryJdbcTemplate")
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private VisitorGatePassRepository visitorGatePassRepository;

    @Transactional
    public String clearVisitorGatePass() {
        visitorGatePassRepository.deleteAllInBatch();
        return "Cleared all visitor gate pass records.";
    }

    private String getStringSafe(java.sql.ResultSet rs, String colName) {
        try {
            String val = rs.getString(colName);
            return (val != null) ? val.trim() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private java.sql.Timestamp getTimestampSafe(java.sql.ResultSet rs, String colName) {
        try {
            java.sql.Timestamp t = rs.getTimestamp(colName);
            return t;
        } catch (Exception e) {
            return null;
        }
    }

    private Integer getIntSafe(java.sql.ResultSet rs, String colName) {
        try {
            int val = rs.getInt(colName);
            if (!rs.wasNull())
                return val;
        } catch (Exception e) {
        }
        return null;
    }

    @Autowired
    private com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository statusMasterRepository;

    private Integer getStatusIdByName(String statusName) {
        if (statusName == null || statusName.isBlank())
            return null;
        try {
            return statusMasterRepository.findByNameIgnoreCase(statusName.trim())
                    .map(s -> s.getId() != null ? s.getId().intValue() : null)
                    .orElseGet(() -> {
                        com.autonoma.erp.modules.platform.common.entity.StatusMaster newStatus = new com.autonoma.erp.modules.platform.common.entity.StatusMaster();
                        newStatus.setName(statusName.trim().toUpperCase());
                        return statusMasterRepository.save(newStatus).getId().intValue();
                    });
        } catch (Exception e) {
            return null;
        }
    }

    private Integer mapStatus(String statusStr) {
        if (statusStr == null || statusStr.isBlank()) {
            return getStatusIdByName("OPEN");
        }
        String clean = statusStr.trim().toUpperCase();

        // 1. Check direct match in AD_STATUS_MASTER by name
        try {
            var existing = statusMasterRepository.findByNameIgnoreCase(clean);
            if (existing.isPresent() && existing.get().getId() != null) {
                return existing.get().getId().intValue();
            }
        } catch (Exception ignored) {}

        // 2. Check if statusStr is a numeric ID matching AD_STATUS_MASTER
        if (clean.matches("\\d+")) {
            try {
                Long id = Long.parseLong(clean);
                if (statusMasterRepository.existsById(id)) {
                    return id.intValue();
                }
            } catch (Exception ignored) {}
        }

        // 3. Fallback normalization to standard status names and fetch/create from AD_STATUS_MASTER
        String targetName = "OPEN";
        if (clean.contains("APPROV")) {
            targetName = "APPROVED";
        } else if (clean.contains("REJECT")) {
            targetName = "REJECTED";
        } else if (clean.contains("CANCEL")) {
            targetName = "CANCELLED";
        } else if (clean.contains("CHECKED_OUT") || clean.contains("CHECK OUT") || clean.contains("CLOSED")) {
            targetName = "CLOSED";
        } else if (clean.contains("CHECKED_IN") || clean.contains("CHECK IN")) {
            targetName = "CHECKED_IN";
        } else if (clean.contains("AUTO CLOSED")) {
            targetName = "AUTO CLOSED";
        } else if (clean.contains("OPEN")) {
            targetName = "OPEN";
        } else {
            targetName = clean;
        }

        return getStatusIdByName(targetName);
    }

    @Transactional
    public String migrateVisitorGatePass() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }

        String sql = "SELECT * FROM VISITOR_GATE_PASS";

        List<VisitorGatePass> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            VisitorGatePass entity = new VisitorGatePass();

            entity.setVisitorName(getStringSafe(rs, "VISITOR_NAME"));
            entity.setIsdCode(getStringSafe(rs, "ISD_CODE"));
            entity.setMobileNo(getStringSafe(rs, "MOBILE_NO"));
            entity.setAddress(getStringSafe(rs, "ADDRESS"));
            entity.setPersonToMeet(getStringSafe(rs, "PERSON_TO_MEET"));
            entity.setPurpose(getStringSafe(rs, "PURPOSE"));
            entity.setInTime(getTimestampSafe(rs, "IN_TIME"));
            entity.setOutTime(getTimestampSafe(rs, "OUT_TIME"));
            entity.setGatePassNo(getStringSafe(rs, "GATE_PASS_NO"));
            entity.setGatePassDate(getTimestampSafe(rs, "GATE_PASS_DATE"));

            String oldStatus = getStringSafe(rs, "STATUS");
            entity.setStatus(mapStatus(oldStatus));

            entity.setFoodAllowance(getStringSafe(rs, "FOOD_ALLOWANCE"));
            entity.setKit(getStringSafe(rs, "KIT"));
            entity.setPersonName(getStringSafe(rs, "PERSON_NAME"));

            Integer noOfPersons = getIntSafe(rs, "NO_OF_PERSONS");
            entity.setNoOfPersons(noOfPersons != null ? noOfPersons : 1);

            entity.setVisitorType(getStringSafe(rs, "VISITOR_TYPE"));
            entity.setFoodCategory(getStringSafe(rs, "FOOD_CATEGORY"));
            entity.setNormalFood(getStringSafe(rs, "NORMAL_FOOD"));
            entity.setFileName(getStringSafe(rs, "FILE_NAME"));
            entity.setVendorCode(getStringSafe(rs, "VENDOR_CODE"));
            entity.setEmailId(getStringSafe(rs, "EMAIL_ID"));
            entity.setVisitorDate(getTimestampSafe(rs, "VISITOR_DATE"));
            entity.setNewVendor(getStringSafe(rs, "NEW_VENDOR"));
            entity.setComments(getStringSafe(rs, "COMMENTS"));
            entity.setCancelReason(getStringSafe(rs, "CANCEL_REASON"));

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return entity;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped by user. Migrated 0 visitor gate pass records.";
        }

        int migratedCount = 0;
        if (!migratedList.isEmpty()) {
            visitorGatePassRepository.saveAll(migratedList);
            migratedCount = migratedList.size();
        }

        return "Successfully migrated " + migratedCount
                + " visitor gate pass records from VISITOR_GATE_PASS to OM_VISITOR_GATE_PASS.";
    }
}
