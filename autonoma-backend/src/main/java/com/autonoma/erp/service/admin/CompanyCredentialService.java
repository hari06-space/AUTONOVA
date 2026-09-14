package com.autonoma.erp.service.admin;

import com.autonoma.erp.config.TenantContextHolder;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.autonoma.erp.model.admin.AppPreference;
import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.repository.admin.AppPreferenceRepository;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import AppUtil.BosDocConstants;

@Service
@org.springframework.context.annotation.DependsOn("sqlMigrationRunner")
public class CompanyCredentialService {

    @Autowired
    private CompanyCredentialRepository repository;

    @Autowired
    private AppPreferenceRepository appPreferenceRepository;

    @Autowired
    private com.autonoma.erp.modules.master.organization.repository.DivisionRepository divisionRepository;

    @Autowired(required = false)
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            if (jdbcTemplate != null) {
                try {
                    jdbcTemplate.execute("IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_CLI_LICENSE_CLIENT' AND parent_object_id = OBJECT_ID('CLI_CLIENT_LICENSE')) ALTER TABLE CLI_CLIENT_LICENSE DROP CONSTRAINT FK_CLI_LICENSE_CLIENT;");
                    jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_CLI_LICENSE_COMPANY' AND parent_object_id = OBJECT_ID('CLI_CLIENT_LICENSE')) ALTER TABLE CLI_CLIENT_LICENSE ADD CONSTRAINT FK_CLI_LICENSE_COMPANY FOREIGN KEY (CLIENT_ID) REFERENCES AD_COMPANY_CREDENTIAL(id);");
                } catch (Exception ex) {
                    org.slf4j.LoggerFactory.getLogger(CompanyCredentialService.class).warn("[Startup] FK_CLI_LICENSE_CLIENT cleanup note: {}", ex.getMessage());
                }
            }
            com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
            java.util.List<CompanyCredential> all = repository.findAll();
            if (all.isEmpty()) {
                CompanyCredential defaultCred = new CompanyCredential();
                defaultCred.setCompanyName("Autonoma");
                defaultCred.setShortName("AUTONOMA");
                defaultCred.setClientCode("123456");
                defaultCred.setDbSourceName("AUTONOMA");
                defaultCred.setIsActive(true);
                repository.save(defaultCred);
                org.slf4j.LoggerFactory.getLogger(CompanyCredentialService.class).info("[Startup] Seeded default company credential (clientCode: 123456)");
            } else {
                for (CompanyCredential cred : all) {
                    if ("BOSDBSRC".equalsIgnoreCase(cred.getDbSourceName()) || cred.getDbSourceName() == null || cred.getDbSourceName().trim().isEmpty()) {
                        cred.setDbSourceName("AUTONOMA");
                        repository.save(cred);
                        org.slf4j.LoggerFactory.getLogger(CompanyCredentialService.class).info("[Startup] Automatically corrected legacy dbSourceName for company: {}", cred.getCompanyName());
                    }
                }
            }
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(CompanyCredentialService.class).error("[Startup] Failed to verify/correct company credentials", e);
        } finally {
            com.autonoma.erp.config.TenantContextHolder.clear();
        }
    }

    private Path getUploadDirectory() {
        String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
            // Priority 1: From CompanyCredential record
            List<CompanyCredential> all = repository.findAll();
            if (!all.isEmpty() && all.get(0).getDirectoryPath() != null
                    && !all.get(0).getDirectoryPath().trim().isEmpty()) {
                return Paths.get(all.get(0).getDirectoryPath().trim());
            }

            // Priority 2: From AppPreference
            Optional<AppPreference> pref = appPreferenceRepository.findByPrefName("FILE_LOCATION");
            if (pref.isPresent() && pref.get().getPrefValue() != null && !pref.get().getPrefValue().trim().isEmpty()) {
                return Paths.get(pref.get().getPrefValue().trim());
            }
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
        }

        // Fallback: Default uploads/company
        Path fallback = Paths
                .get(System.getProperty("user.dir") + File.separator + "uploads" + File.separator + "company");
        org.slf4j.LoggerFactory.getLogger(CompanyCredentialService.class).info("[UploadPath] Resolved directory: {}",
                fallback.toAbsolutePath());
        return fallback;
    }

    private final List<CompanyCredential> cachedCompanies = new java.util.concurrent.CopyOnWriteArrayList<>();
    private volatile long lastCompanyCacheTime = 0L;
    private static final long COMPANY_CACHE_TTL = 300_000L; // 5 minutes

    public List<CompanyCredential> findAll() {
        long now = System.currentTimeMillis();
        if (cachedCompanies.isEmpty() || (now - lastCompanyCacheTime) > COMPANY_CACHE_TTL) {
            refreshCompanyCache();
        }
        return cachedCompanies;
    }

    private synchronized void refreshCompanyCache() {
        String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
            List<CompanyCredential> fresh = repository.findAll();
            cachedCompanies.clear();
            cachedCompanies.addAll(fresh);
            lastCompanyCacheTime = System.currentTimeMillis();
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
        }
    }

    public Optional<CompanyCredential> findById(Long id) {
        if (id == null) return Optional.empty();
        return findAll().stream().filter(c -> id.equals(c.getId())).findFirst();
    }

    public CompanyCredential save(CompanyCredential company) {
        String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
            CompanyCredential saved = repository.save(company);
            refreshCompanyCache();
            return saved;
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
        }
    }

    public void deleteById(Long id) {
        String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
            repository.deleteById(id);
            refreshCompanyCache();
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
        }
    }

    /**
     * Saves uploaded file to the configured directory and returns the saved
     * filename.
     */
    public String saveUploadedFile(MultipartFile file, String subDir) throws IOException {
        Path uploadRoot = getUploadDirectory().toAbsolutePath().normalize();
        Path uploadPath = getUploadDirectory().resolve(subDir).normalize().toAbsolutePath();
        if (!uploadPath.startsWith(uploadRoot)) {
            throw new SecurityException("Access Denied: Path traversal attempt in upload path.");
        }
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            originalFilename = Paths.get(originalFilename).getFileName().toString();
        } else {
            originalFilename = "upload";
        }

        String baseName = originalFilename;
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf(".");
        if (dotIndex != -1) {
            baseName = originalFilename.substring(0, dotIndex);
            extension = originalFilename.substring(dotIndex);
        }

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String timestamp = LocalDateTime.now().format(dtf);
        String uniqueFilename = baseName + "_" + timestamp + extension;

        Path targetPath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        return uniqueFilename;
    }

    public Resource loadFileAsResource(String filename, String subDir) throws Exception {
        Path uploadRoot = getUploadDirectory().toAbsolutePath().normalize();
        Path filePath = getUploadDirectory().resolve(subDir).resolve(filename).normalize().toAbsolutePath();
        if (!filePath.startsWith(uploadRoot)) {
            throw new SecurityException("Access Denied: Path traversal attempt in loadFileAsResource.");
        }
        Resource resource = new UrlResource(filePath.toUri());
        if (resource.exists() || resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("Could not read file: " + filename);
        }
    }

    public Optional<CompanyCredential> findByClientCode(String clientCode) {
        String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
            if (clientCode == null || clientCode.trim().isEmpty()) {
                return repository.findFirstByOrderByIdAsc();
            }
            return repository.findFirstByClientCodeIgnoreCaseOrderByIdAsc(clientCode.trim());
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
        }
    }

    public Optional<CompanyCredential> getCompanyProfileForCurrentTenant() {
        Long divisionId = com.autonoma.erp.config.DivisionContextHolder.getDivisionId();
        if (divisionId != null && divisionRepository != null) {
            String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
            try {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                com.autonoma.erp.modules.master.organization.entity.Division division = divisionRepository.findById(divisionId).orElse(null);
                if (division != null && division.getCompanyId() != null) {
                    return repository.findById(division.getCompanyId());
                }
            } catch (Exception e) {
                // Ignore and fall back
            } finally {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
            }
        }

        String tenantId = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.trim().isEmpty() || AppUtil.AppConstants.DEFAULT_TENANT_ID.equalsIgnoreCase(tenantId) || AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME.equalsIgnoreCase(tenantId)) {
            tenantId = AppUtil.AppConstants.DEFAULT_CLIENT_CODE;
        }
        
        String cleanTenantId = tenantId.trim();
        Optional<CompanyCredential> companyOpt = findByClientCode(cleanTenantId);
        if (!companyOpt.isPresent()) {
            // Fallback: search by dbSourceName (since tenantId could be the database name like NUTECH_LIVE)
            companyOpt = findAll().stream()
                    .filter(c -> cleanTenantId.equalsIgnoreCase(c.getDbSourceName()))
                    .findFirst();
        }
        if (!companyOpt.isPresent()) {
            // Final fallback: return the first available company credential record in the database
            companyOpt = findAll().stream().findFirst();
        }
        return companyOpt;
    }
}
