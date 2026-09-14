package com.autonoma.erp.modules.master.organization.service;

import com.autonoma.erp.config.TenantContextHolder;

import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.modules.master.organization.repository.DivisionRepository;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DivisionService {

    @Autowired
    private DivisionRepository divisionRepository;

    @Autowired
    private com.autonoma.erp.service.admin.CompanyCredentialService companyCredentialService;

    @Autowired
    private com.autonoma.erp.service.admin.TenantDataSourceService tenantDataSourceService;

    @Autowired
    private javax.sql.DataSource dataSource;

    @Autowired(required = false)
    private com.autonoma.erp.modules.platform.identity.service.EnterpriseClientValidationService enterpriseClientValidationService;

    private void checkBranchQuota(boolean isActivating) {
        if (isActivating && enterpriseClientValidationService != null) {
            long activeBranchesCount = divisionRepository.findAll().stream()
                    .filter(d -> Boolean.TRUE.equals(d.getStatus()) && (d.getIsActive() == null || Boolean.TRUE.equals(d.getIsActive())))
                    .count();
            com.autonoma.erp.modules.platform.identity.dto.EnterpriseValidationResult result = enterpriseClientValidationService.validateBranchLimit(activeBranchesCount);
            if (result != null && !result.isValid() && "MAX_BRANCHES_EXCEEDED".equals(result.getErrorCode())) {
                throw new IllegalArgumentException(result.getMessage());
            }
        }
    }

    // ── Helper to retrieve the currently logged-in user identifier (userId) ────
    private String getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName(); // Maps to ad_user_credential.user_id
        }
        return "admin"; // Fallback for tests/initialization flows
    }

    // ── Build a companyId → companyName lookup map from Company Master ─────────
    private Map<Long, String> buildCompanyNameMap() {
        return companyCredentialService.findAll().stream()
                .collect(Collectors.toMap(
                        c -> c.getId(),
                        CompanyCredential::getCompanyName,
                        (a, b) -> a // keep first on duplicate key
                ));
    }

    // ── Enrich a single division with company name from Company Master ─────────
    private void enrichCompanyName(Division division, Map<Long, String> nameMap) {
        if (division.getCompanyId() != null) {
            division.setCompanyName(nameMap.getOrDefault(division.getCompanyId(), ""));
        }
    }

    // ── Helper to resolve the database tenant ID for a company ────────────────
    private String getTenantIdForCompany(Long companyId) {
        String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
            Optional<CompanyCredential> compOpt = companyCredentialService.findById(companyId);
            if (compOpt.isPresent() && compOpt.get().getDbSourceName() != null && !compOpt.get().getDbSourceName().trim().isEmpty()) {
                return compOpt.get().getDbSourceName().trim();
            }
        } catch (Exception e) {
            // Ignore and fallback
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
        }
        return "AUTONOMA";
    }

    // ── Helper to map JDBC ResultSet row to Division entity ──────────────────
    private Division mapRowToDivision(java.sql.ResultSet rs) throws java.sql.SQLException {
        Division d = new Division();
        d.setId(rs.getLong("id"));
        d.setCompanyId(rs.getLong("COMPANY_ID"));
        d.setDivisionName(rs.getString("DIVISION_NAME"));
        
        try {
            d.setStatus(rs.getBoolean("STATUS"));
        } catch (Exception e) {
            d.setStatus(true);
        }
        
        try {
            d.setIsActive(rs.getBoolean("IS_ACTIVE"));
        } catch (Exception e) {
            d.setIsActive(true);
        }
        
        d.setDescription(rs.getString("DESCRIPTION"));
        d.setAddress(rs.getString("ADDRESS"));
        d.setCity(rs.getString("CITY"));
        d.setState(rs.getString("STATE"));
        d.setCountry(rs.getString("COUNTRY"));
        d.setPincode(rs.getString("PINCODE"));
        d.setGstIn(rs.getString("GST_IN"));
        
        int stateCode = rs.getInt("STATE_CODE");
        if (!rs.wasNull()) {
            d.setStateCode(stateCode);
        }
        
        int seq = rs.getInt("SEQUENCE_NO");
        if (!rs.wasNull()) {
            d.setSequenceNo(seq);
        }
        
        d.setMobileNo(rs.getString("MOBILE_NO"));
        d.setPanNo(rs.getString("PAN_NO"));
        d.setPfNo(rs.getString("PF_NO"));
        d.setEsiNo(rs.getString("ESI_NO"));
        d.setIeCode(rs.getString("IE_CODE"));
        d.setCinNo(rs.getString("CIN_NO"));
        d.setEmailId(rs.getString("EMAIL_ID"));
        d.setWebsite(rs.getString("WEBSITE"));
        d.setEwaybillUserName(rs.getString("EWAYBILL_USER_NAME"));
        d.setEwaybillPassword(rs.getString("EWAYBILL_PASSWORD"));
        d.setGstUserName(rs.getString("GST_USER_NAME"));
        d.setEinvoiceUserName(rs.getString("EINVOICE_USER_NAME"));
        d.setEinvoicePassword(rs.getString("EINVOICE_PASSWORD"));
        d.setMapLink(rs.getString("MAP_LINK"));
        d.setLatitude(rs.getString("LATITUDE"));
        d.setLongitude(rs.getString("LONGITUDE"));
        return d;
    }

    // ── JDBC-based fetch to bypass OpenEntityManagerInViewFilter session cache ──
    private List<Division> fetchDivisionsFromTenantDb(String tenantId, Long companyId, Boolean activeOnly) {
        List<Division> list = new java.util.ArrayList<>();
        if (tenantId == null || tenantId.trim().isEmpty()) {
            tenantId = "AUTONOMA";
        }
        
        javax.sql.DataSource targetDs = null;
        if (dataSource instanceof com.autonoma.erp.config.DynamicRoutingDataSource) {
            com.autonoma.erp.config.DynamicRoutingDataSource routingDs = (com.autonoma.erp.config.DynamicRoutingDataSource) dataSource;
            if (!routingDs.containsDataSource(tenantId)) {
                try {
                    tenantDataSourceService.createTenantDataSource(tenantId);
                } catch (Exception e) {
                    // Ignore
                }
            }
            targetDs = routingDs.getDataSource(tenantId);
        }
        
        if (targetDs == null) {
            targetDs = dataSource;
        }
        
        String sql = "SELECT * FROM AD_DIVISION WHERE COMPANY_ID = ? AND IS_ACTIVE = 1";
        if (activeOnly) {
            sql += " AND STATUS = 1";
        }
        
        try (java.sql.Connection conn = targetDs.getConnection();
             java.sql.PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, companyId);
            try (java.sql.ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRowToDivision(rs));
                }
            }
        } catch (Exception e) {
            System.err.println("[DivisionService] Failed to query divisions from tenant DB: " + tenantId + ", error: " + e.getMessage());
        }
        
        if (list.isEmpty()) {
            try (java.sql.Connection conn = targetDs.getConnection();
                 java.sql.PreparedStatement ps = conn.prepareStatement("SELECT * FROM AD_DIVISION WHERE COMPANY_ID = 1 AND IS_ACTIVE = 1" + (activeOnly ? " AND STATUS = 1" : ""))) {
                try (java.sql.ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        list.add(mapRowToDivision(rs));
                    }
                }
            } catch (Exception e) {
                // Ignore
            }
        }
        
        return list;
    }

    // ── Next sequence number ──────────────────────────────────────────────────
    public int getNextSequenceNo() {
        String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
            return divisionRepository.findMaxSequenceNo().orElse(0) + 1;
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
        }
    }

    // ── Fetch all divisions — company name joined from Company Master ──────────
    public List<Division> getAllDivisions() {
        String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
            Map<Long, String> nameMap = buildCompanyNameMap();
            List<CompanyCredential> companies = companyCredentialService.findAll();
            java.util.List<Division> allDivisions = new java.util.ArrayList<>();
            for (CompanyCredential company : companies) {
                String dbSourceName = company.getDbSourceName();
                if (dbSourceName == null || dbSourceName.trim().isEmpty()) {
                    dbSourceName = "AUTONOMA";
                }
                try {
                    List<Division> divisions = fetchDivisionsFromTenantDb(dbSourceName.trim(), company.getId(), false);
                    divisions.forEach(d -> {
                        d.setCompanyId(company.getId());
                        enrichCompanyName(d, nameMap);
                        allDivisions.add(d);
                    });
                } catch (Exception e) {
                    // Ignore and continue
                }
            }
            return allDivisions;
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
        }
    }

    // ── Fetch divisions scoped to a company ───────────────────────────────────
    public List<Division> getDivisionsByCompany(Long companyId) {
        String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        Map<Long, String> nameMap;
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
            nameMap = buildCompanyNameMap();
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
        }

        String targetTenant = getTenantIdForCompany(companyId);
        List<Division> divisions = fetchDivisionsFromTenantDb(targetTenant, companyId, false);
        divisions.forEach(d -> enrichCompanyName(d, nameMap));
        return divisions;
    }

    // ── Fetch active divisions for a company (login / selection screens) ──────
    public List<Division> getActiveDivisionsByCompany(Long companyId) {
        String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        Map<Long, String> nameMap;
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
            nameMap = buildCompanyNameMap();
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
        }

        String targetTenant = getTenantIdForCompany(companyId);
        List<Division> divisions = fetchDivisionsFromTenantDb(targetTenant, companyId, true);
        divisions.forEach(d -> enrichCompanyName(d, nameMap));
        return divisions;
    }

    // ── Create ────────────────────────────────────────────────────────────────
    public Division createDivision(Division division) {
        String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        final String finalTargetTenant = (division.getCompanyId() != null)
                ? getTenantIdForCompany(division.getCompanyId())
                : "AUTONOMA";

        try {
            if (!"AUTONOMA".equalsIgnoreCase(finalTargetTenant)) {
                try {
                    tenantDataSourceService.createTenantDataSource(finalTargetTenant);
                } catch (Exception e) {
                    // Ignore
                }
            }
            com.autonoma.erp.config.TenantContextHolder.setTenantId(finalTargetTenant);
            if (division.getStatus() == null) {
                division.setStatus(Boolean.TRUE);
            }

            boolean isCreatingActive = Boolean.TRUE.equals(division.getStatus()) && (division.getIsActive() == null || Boolean.TRUE.equals(division.getIsActive()));
            checkBranchQuota(isCreatingActive);

            String loggedInUser = getCurrentUser();
            if (division.getCreatedBy() == null || division.getCreatedBy().isBlank()) {
                division.setCreatedBy(loggedInUser);
            }
            division.setCreatedDate(new Date());

            Division saved = divisionRepository.save(division);

            Map<Long, String> nameMap;
            try {
                com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
                nameMap = buildCompanyNameMap();
            } finally {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(finalTargetTenant);
            }
            enrichCompanyName(saved, nameMap);
            return saved;
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
        }
    }

    // ── Update ────────────────────────────────────────────────────────────────
    public Optional<Division> updateDivision(Long id, Division details) {
        String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        final String finalTargetTenant = (details.getCompanyId() != null)
                ? getTenantIdForCompany(details.getCompanyId())
                : "AUTONOMA";

        try {
            if (!"AUTONOMA".equalsIgnoreCase(finalTargetTenant)) {
                try {
                    tenantDataSourceService.createTenantDataSource(finalTargetTenant);
                } catch (Exception e) {
                    // Ignore
                }
            }
            com.autonoma.erp.config.TenantContextHolder.setTenantId(finalTargetTenant);
            return divisionRepository.findById(id).map(existing -> {
                boolean wasInactive = Boolean.FALSE.equals(existing.getStatus()) || Boolean.FALSE.equals(existing.getIsActive());
                boolean isNowActive = (details.getStatus() == null || Boolean.TRUE.equals(details.getStatus())) && (details.getIsActive() == null || Boolean.TRUE.equals(details.getIsActive()));
                if (wasInactive && isNowActive) {
                    checkBranchQuota(true);
                }

                existing.setDivisionName(details.getDivisionName());
                existing.setDescription(details.getDescription());
                existing.setAddress(details.getAddress());
                existing.setCity(details.getCity());
                existing.setState(details.getState());
                existing.setCountry(details.getCountry());
                existing.setPincode(details.getPincode());
                existing.setGstIn(details.getGstIn());
                existing.setStateCode(details.getStateCode());
                existing.setSequenceNo(details.getSequenceNo());
                existing.setMobileNo(details.getMobileNo());
                existing.setPanNo(details.getPanNo());
                existing.setPfNo(details.getPfNo());
                existing.setEsiNo(details.getEsiNo());
                existing.setIeCode(details.getIeCode());
                existing.setCinNo(details.getCinNo());
                existing.setEmailId(details.getEmailId());
                existing.setWebsite(details.getWebsite());
                existing.setEwaybillUserName(details.getEwaybillUserName());
                existing.setEwaybillPassword(details.getEwaybillPassword());
                existing.setGstUserName(details.getGstUserName());
                existing.setEinvoiceUserName(details.getEinvoiceUserName());
                existing.setEinvoicePassword(details.getEinvoicePassword());
                existing.setMapLink(details.getMapLink());
                existing.setLatitude(details.getLatitude());
                existing.setLongitude(details.getLongitude());
                if (details.getStatus() != null)
                    existing.setStatus(details.getStatus());

                existing.setUpdatedBy(getCurrentUser());
                existing.setUpdatedDate(new Date());

                if (details.getCompanyId() != null) {
                    existing.setCompanyId(details.getCompanyId());
                }

                Division saved = divisionRepository.save(existing);

                Map<Long, String> nameMap;
                try {
                    com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
                    nameMap = buildCompanyNameMap();
                } finally {
                    com.autonoma.erp.config.TenantContextHolder.setTenantId(finalTargetTenant);
                }
                enrichCompanyName(saved, nameMap);
                return saved;
            });
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    public void deleteDivision(Long id) {
        divisionRepository.deleteById(id);
    }

    // ── Find by ID ────────────────────────────────────────────────────────────
    public Optional<Division> findById(Long id) {
        return divisionRepository.findById(id);
    }

    public Optional<Division> findByIdAndTenant(Long id, String tenantId) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            tenantId = "AUTONOMA";
        }
        
        javax.sql.DataSource targetDs = null;
        if (dataSource instanceof com.autonoma.erp.config.DynamicRoutingDataSource) {
            com.autonoma.erp.config.DynamicRoutingDataSource routingDs = (com.autonoma.erp.config.DynamicRoutingDataSource) dataSource;
            if (!routingDs.containsDataSource(tenantId)) {
                try {
                    tenantDataSourceService.createTenantDataSource(tenantId);
                } catch (Exception e) {
                    // Ignore
                }
            }
            targetDs = routingDs.getDataSource(tenantId);
        }
        
        if (targetDs == null) {
            targetDs = dataSource;
        }
        
        String sql = "SELECT * FROM AD_DIVISION WHERE id = ?";
        try (java.sql.Connection conn = targetDs.getConnection();
             java.sql.PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (java.sql.ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToDivision(rs));
                }
            }
        } catch (Exception e) {
            System.err.println("[DivisionService] Failed to query division by id from tenant DB: " + tenantId + ", error: " + e.getMessage());
        }
        return Optional.empty();
    }
}
