package com.autonoma.erp.modules.platform.files.service;

import com.autonoma.erp.model.admin.AppPreference;
import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.repository.admin.AppPreferenceRepository;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import AppUtil.BosDocConstants;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.autonoma.erp.modules.platform.files.entity.FileAttachmentMetadata;
import com.autonoma.erp.modules.platform.files.repository.FileAttachmentMetadataRepository;

@Service
public class FileService {

    @Autowired
    private com.autonoma.erp.service.admin.CompanyCredentialService companyCredentialService;

    @Autowired
    private AppPreferenceRepository prefRepo;

    @Autowired
    private com.autonoma.erp.modules.platform.files.repository.FileAttachmentMetadataRepository fileAttachmentMetadataRepository;

    @Autowired
    private com.autonoma.erp.modules.platform.files.repository.FileAttachmentMetadataRepository metadataRepo;

    @Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private com.autonoma.erp.modules.platform.docsearch.service.DocumentSearchService documentSearchService;

    /**
     * Resolves the root upload directory based on configuration.
     *
     * Priority order:
     * 1. Company Profile → directoryPath (License & Configuration field)
     * 2. App Preferences → FILE_LOCATION
     * 3. OS-specific fallback (BOS_DOCUMENTS next to autonoma-backend on Mac/Linux,
     * D:\BOS_DOCUMENTS on Windows)
     */
    public Path getRootPath() {
        String os = System.getProperty("os.name").toLowerCase();
        Path resolvedPath = null;

        // ── Priority 1: Company Profile directoryPath ──────────────────────
        try {
            CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
            if (company != null) {
                String pathStr = company.getDirectoryPath();
                if (pathStr != null && !pathStr.trim().isEmpty()) {
                    resolvedPath = sanitizePath(pathStr.trim(), os);
                }
            }
        } catch (Exception ignored) {
        }

        // ── Priority 2: App Preferences FILE_LOCATION ──────────────────────
        if (resolvedPath == null) {
            try {
                Optional<AppPreference> pref = prefRepo.findByPrefName("FILE_LOCATION");
                if (pref.isPresent() && pref.get().getPrefValue() != null
                        && !pref.get().getPrefValue().trim().isEmpty()) {
                    resolvedPath = sanitizePath(pref.get().getPrefValue().trim(), os);
                }
            } catch (Exception ignored) {
            }
        }

        // ── Priority 3: OS-specific fallback ───────────────────────────────
        if (resolvedPath == null) {
            if (os.contains("win")) {
                Path dPath = Paths.get("D:\\BOS_DOCUMENTS").toAbsolutePath();
                if (Files.exists(dPath) || (dPath.getRoot() != null && Files.exists(dPath.getRoot()))) {
                    try {
                        Files.createDirectories(dPath);
                        resolvedPath = dPath;
                    } catch (IOException ignored) {
                    }
                }
            }
            if (resolvedPath == null) {
                if (Files.exists(Paths.get("autonoma-backend/BOS_DOCUMENTS"))) {
                    resolvedPath = Paths.get("autonoma-backend/BOS_DOCUMENTS").toAbsolutePath().normalize();
                } else if (Files.exists(Paths.get("BOS_DOCUMENTS"))) {
                    resolvedPath = Paths.get("BOS_DOCUMENTS").toAbsolutePath().normalize();
                } else if (Files.exists(Paths.get("autonoma-backend"))) {
                    resolvedPath = Paths.get("autonoma-backend/BOS_DOCUMENTS").toAbsolutePath().normalize();
                } else {
                    resolvedPath = Paths.get("BOS_DOCUMENTS").toAbsolutePath().normalize();
                }
            }
        }

        // ── Ensure directory exists ─────────────────────────────────────────
        try {
            Files.createDirectories(resolvedPath);
        } catch (IOException e) {
            resolvedPath = Paths.get(System.getProperty("java.io.tmpdir"), "BOS_DOCUMENTS");
            try {
                Files.createDirectories(resolvedPath);
            } catch (IOException ignored) {
            }
        }

        return resolvedPath;
    }

    /**
     * Converts a configured path string into a usable absolute Path.
     * Handles cross-platform scenarios: Windows paths used on Mac/Linux have
     * their drive letter stripped so BOS_DOCUMENTS resolves correctly.
     */
    private Path sanitizePath(String pathStr, String os) {
        if (!os.contains("win") && pathStr.matches("^[A-Za-z]:[/\\\\].*")) {
            // Strip Windows drive letter (e.g. "D:\\BOS_DOCUMENTS" → "BOS_DOCUMENTS")
            String stripped = pathStr.replaceFirst("^[A-Za-z]:[/\\\\]+", "");
            stripped = stripped.replace("\\\\", "/").replace("\\", "/");
            return Paths.get(stripped).toAbsolutePath().normalize();
        }
        pathStr = pathStr.replace("\\\\", java.io.File.separator).replace("\\", java.io.File.separator);
        return Paths.get(pathStr).toAbsolutePath().normalize();
    }

    /**
     * Saves a file into a module-specific subdirectory.
     * 
     * @param file   - The multipart file
     * @param module - The module name (mapped via BosDocConstants)
     * @returns The relative path (e.g. "QMS/uuid_name.pdf")
     */
    public String saveFile(MultipartFile file, String module) throws IOException {
        return saveFile(file, module, null, null);
    }

    /**
     * Saves a file into a module-specific subdirectory and auto-registers with DocumentSearch.
     * 
     * @param file     - The multipart file
     * @param module   - The module name (mapped via BosDocConstants)
     * @param pageCode - Optional page code for document search
     * @param refId    - Optional reference ID (e.g. Item No, PO Number)
     * @returns The relative path (e.g. "QMS/uuid_name.pdf")
     */
    public String saveFile(MultipartFile file, String module, String pageCode, String refId) throws IOException {
        String subDir = resolveSubDir(module);
        Path rootPath = getRootPath();
        Path targetDir = rootPath.resolve(subDir);

        if (!Files.exists(targetDir)) {
            Files.createDirectories(targetDir);
        }

        String rawName = file.getOriginalFilename();
        String cleanName = "file";
        if (rawName != null) {
            cleanName = rawName;
            int lastBackslash = cleanName.lastIndexOf('\\');
            if (lastBackslash != -1) {
                cleanName = cleanName.substring(lastBackslash + 1);
            }
            int lastSlash = cleanName.lastIndexOf('/');
            if (lastSlash != -1) {
                cleanName = cleanName.substring(lastSlash + 1);
            }
            // Sanitize commas and invalid filesystem characters
            cleanName = cleanName.replace(",", "_").replaceAll("[\\\\/:*?\"<>|]", "_").trim();
            if (cleanName.isEmpty()) {
                cleanName = "file";
            }
        }

        String fileName = cleanName;
        Path targetPath = targetDir.resolve(fileName);
        if (Files.exists(targetPath)) {
            String baseName = cleanName;
            String extension = "";
            int dotIndex = cleanName.lastIndexOf('.');
            if (dotIndex != -1) {
                baseName = cleanName.substring(0, dotIndex);
                extension = cleanName.substring(dotIndex);
            }
            int counter = 1;
            while (Files.exists(targetDir.resolve(baseName + " (" + counter + ")" + extension))) {
                counter++;
            }
            fileName = baseName + " (" + counter + ")" + extension;
            targetPath = targetDir.resolve(fileName);
        }

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        String storagePath = subDir + "/" + fileName;
        Long metaId = null;
        try {
            Optional<FileAttachmentMetadata> existingMeta = fileAttachmentMetadataRepository.findByStoragePath(storagePath);
            FileAttachmentMetadata meta;
            if (existingMeta.isPresent()) {
                meta = existingMeta.get();
                meta.setOriginalFileName(cleanName);
                meta.setActiveStatus(true);
            } else {
                meta = FileAttachmentMetadata.builder()
                        .storagePath(storagePath)
                        .originalFileName(cleanName)
                        .activeStatus(true)
                        .build();
            }
            FileAttachmentMetadata savedMeta = fileAttachmentMetadataRepository.save(meta);
            if (savedMeta != null) {
                metaId = savedMeta.getId();
            }
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(FileService.class)
                    .error("Failed to save file metadata for " + storagePath, e);
        }

        // Automatic Global Document Search Registration & Indexing
        if (documentSearchService != null) {
            try {
                String derivedModuleCode = documentSearchService.deriveModuleFromPath(module != null ? module : subDir);
                String derivedPageCode = (pageCode != null && !pageCode.isBlank())
                        ? pageCode
                        : documentSearchService.derivePageFromPath(subDir);
                documentSearchService.registerOrUpdateAttachment(
                        derivedModuleCode,
                        derivedPageCode,
                        "FILE_ATTACHMENT_METADATA",
                        metaId != null ? String.valueOf(metaId) : java.util.UUID.randomUUID().toString().substring(0, 8),
                        refId,
                        cleanName,
                        storagePath
                );
                documentSearchService.triggerAsyncIndexing();
            } catch (Exception ex) {
                org.slf4j.LoggerFactory.getLogger(FileService.class)
                        .warn("DocumentSearch auto-registration failed for {}: {}", storagePath, ex.getMessage());
            }
        }

        return storagePath;
    }

    /**
     * Resolves the original filename for a given storage path.
     */
    public String getOriginalFileNameForPath(String storagePath) {
        if (storagePath == null || storagePath.trim().isEmpty()) {
            return null;
        }

        String normalizedPath = storagePath.trim();
        if (normalizedPath.startsWith("/")) {
            normalizedPath = normalizedPath.substring(1);
        }

        try {
            Optional<FileAttachmentMetadata> meta = fileAttachmentMetadataRepository.findByStoragePath(normalizedPath);
            if (meta.isPresent()) {
                return meta.get().getOriginalFileName();
            }
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(FileService.class)
                    .warn("Failed to find file metadata for path: " + normalizedPath, e);
        }

        // Fallback for legacy files: return the filename segment from the path
        int lastSlash = normalizedPath.lastIndexOf('/');
        int lastBackslash = normalizedPath.lastIndexOf('\\');
        int pathSeparatorIndex = Math.max(lastSlash, lastBackslash);
        return (pathSeparatorIndex != -1) ? normalizedPath.substring(pathSeparatorIndex + 1) : normalizedPath;
    }

    /**
     * Resolves the clean original filename for a stored path.
     * Looks up FILE_ATTACHMENT_METADATA first; if missing (legacy files),
     * automatically strips the 36-character UUID prefix.
     */
    public String getOriginalFileName(String storagePath) {
        if (storagePath == null || storagePath.trim().isEmpty()) {
            return "attachment";
        }
        String cleanPath = storagePath.trim();

        // 1. Check Metadata DB
        try {
            Optional<com.autonoma.erp.modules.platform.files.entity.FileAttachmentMetadata> meta = metadataRepo
                    .findByStoragePath(cleanPath);
            if (meta.isPresent() && meta.get().getOriginalFileName() != null
                    && !meta.get().getOriginalFileName().trim().isEmpty()) {
                return meta.get().getOriginalFileName().trim();
            }
        } catch (Exception ignored) {
        }

        // 2. Fallback for legacy files: Extract filename component and strip 36-char
        // UUID prefix
        String filenameOnly = cleanPath;
        int lastSlash = Math.max(cleanPath.lastIndexOf('/'), cleanPath.lastIndexOf('\\'));
        if (lastSlash != -1) {
            filenameOnly = cleanPath.substring(lastSlash + 1);
        }

        // Strip standard 36-char UUID prefix (8-4-4-4-12 + "_") e.g.
        // 550e8400-e29b-41d4-a716-446655440000_
        if (filenameOnly.matches("^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}_.*")) {
            return filenameOnly.substring(37);
        }

        return filenameOnly;
    }

    /**
     * Resolves a file for viewing/downloading.
     *
     * Handles two path formats stored in DB:
     * - Relative (new): "QMS/Checklist/uuid_file.pdf" → resolved under
     * getRootPath()
     * - Absolute (legacy): "D:\\BOS_DOCUMENTS\\Master\\QMS\\..." → used directly
     * (sanitized for OS)
     *
     * @param relativePath - The path as stored in the DB
     */
    public Resource loadFile(String relativePath) throws java.io.FileNotFoundException, MalformedURLException {
        String os = System.getProperty("os.name").toLowerCase();
        Path file;

        String decodedPath = relativePath;
        try {
            decodedPath = java.net.URLDecoder.decode(relativePath, java.nio.charset.StandardCharsets.UTF_8.name());
        } catch (Exception ignored) {
        }

        // Detect legacy absolute paths (Windows-style absolute or Unix absolute)
        boolean isAbsolute = decodedPath.matches("^[A-Za-z]:[/\\\\].*") || decodedPath.startsWith("/");
        if (isAbsolute) {
            // Sanitize and use directly — no root prefix
            file = sanitizePath(decodedPath, os);
        } else {
            file = getRootPath().resolve(decodedPath).normalize();
        }

        Path resolvedRoot = getRootPath().toAbsolutePath().normalize();
        Path fileAbsolute = file.toAbsolutePath().normalize();

        // Fallback: If file does not exist, search in sibling directories of
        // resolvedRoot
        if (!isAbsolute && !Files.exists(fileAbsolute)) {
            Path parentOfRoot = resolvedRoot.getParent();
            if (parentOfRoot != null && Files.exists(parentOfRoot)) {
                try (java.util.stream.Stream<Path> siblings = Files.list(parentOfRoot)) {
                    for (Path sibling : (Iterable<Path>) siblings::iterator) {
                        if (Files.isDirectory(sibling) && !sibling.equals(resolvedRoot)) {
                            Path fallbackFile = sibling.resolve(decodedPath).normalize();
                            if (Files.exists(fallbackFile)) {
                                file = fallbackFile;
                                resolvedRoot = sibling.toAbsolutePath().normalize();
                                fileAbsolute = file.toAbsolutePath().normalize();
                                break;
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        }

        // ── Security check ──────────────────────────────────────────────────
        boolean isAuthorized = fileAbsolute.startsWith(resolvedRoot);

        if (!isAuthorized) {
            throw new SecurityException("Access Denied: Path traversal or unauthorized directory access attempt.");
        }

        Resource resource = new UrlResource(file.toUri());
        if (resource.exists() || resource.isReadable()) {
            return resource;
        }

        // Fallback for company profile files: if decodedPath has no directory
        // components,
        // search under the "Company Profile" subdirectory.
        if (!decodedPath.contains("/") && !decodedPath.contains("\\")) {
            Path companyProfileFile = getRootPath().resolve("Company Profile").resolve(decodedPath).normalize();
            Resource compResource = new UrlResource(companyProfileFile.toUri());
            if (compResource.exists() || compResource.isReadable()) {
                return compResource;
            }
        }

        // Fuzzy space and encoding resolution in the expected parent directory first
        Path parentDir = file.getParent();
        if (parentDir != null && Files.exists(parentDir)) {
            Path foundInParent = findFileInDirectoryFuzzy(parentDir, file.getFileName().toString());
            if (foundInParent != null) {
                Resource fuzzyResource = new UrlResource(foundInParent.toUri());
                if (fuzzyResource.exists() || fuzzyResource.isReadable()) {
                    return fuzzyResource;
                }
            }
        }

        // Recursive fuzzy resolution fallback in configured root
        Path fuzzyFile = findFileFuzzy(getRootPath(), file.getFileName().toString());
        if (fuzzyFile != null) {
            Resource fuzzyResource = new UrlResource(fuzzyFile.toUri());
            if (fuzzyResource.exists() || fuzzyResource.isReadable()) {
                return fuzzyResource;
            }
        }

        // Dynamic Old Attachment Path fallback: fetched from UI input ('Old Attachment Path (Network Folder)') or preferences
        String configuredOldPath = com.autonoma.erp.modules.qms.checklist.service.MasterChecklistMigrationService.getSecondaryAttachmentPath();
        if (configuredOldPath == null || configuredOldPath.trim().isEmpty()) {
            try {
                Optional<AppPreference> pref = prefRepo.findByPrefName("OLD_ATTACHMENT_PATH");
                if (pref.isPresent() && pref.get().getPrefValue() != null && !pref.get().getPrefValue().trim().isEmpty()) {
                    configuredOldPath = pref.get().getPrefValue().trim();
                }
            } catch (Exception ignored) {}
        }
        if (configuredOldPath == null || configuredOldPath.trim().isEmpty()) {
            configuredOldPath = "D:\\ERPCommon-NuTech";
        }

        Path baseOldRoot = sanitizePath(configuredOldPath, os);
        if (Files.exists(baseOldRoot)) {
            List<Path> legacyRoots = new java.util.ArrayList<>();
            Path erpimage = baseOldRoot.resolve("erpimage");
            if (Files.exists(erpimage)) {
                legacyRoots.add(erpimage.resolve("EmpkycDts"));
                legacyRoots.add(erpimage.resolve("EmpEducation"));
                legacyRoots.add(erpimage.resolve("EmpExperienceDts"));
                legacyRoots.add(erpimage.resolve("IMAGE"));
                legacyRoots.add(erpimage.resolve("EMP ACTIVITY"));
                legacyRoots.add(erpimage.resolve("INDUCTION"));
                legacyRoots.add(erpimage.resolve("HRMS"));
                legacyRoots.add(erpimage);
            }
            legacyRoots.add(baseOldRoot);

            for (Path legacyRoot : legacyRoots) {
                if (Files.exists(legacyRoot)) {
                    Path fuzzyLegacy = findFileFuzzy(legacyRoot, file.getFileName().toString());
                    if (fuzzyLegacy != null) {
                        Resource legacyResource = new UrlResource(fuzzyLegacy.toUri());
                        if (legacyResource.exists() || legacyResource.isReadable()) {
                            return legacyResource;
                        }
                    }
                }
            }
        }

        throw new java.io.FileNotFoundException("File not found: " + decodedPath);
    }

    private Path findFileInDirectoryFuzzy(Path dir, String filename) {
        try {
            String cleanName = filename;
            if (filename.contains("_")) {
                String[] parts = filename.split("_", 2);
                if (parts.length > 1 && parts[0].length() >= 32) {
                    cleanName = parts[1];
                }
            }
            final String targetClean = cleanName.toLowerCase();
            try (java.util.stream.Stream<Path> stream = Files.list(dir)) {
                return stream
                        .filter(Files::isRegularFile)
                        .filter(p -> {
                            String name = p.getFileName().toString();
                            if (name.contains("_")) {
                                String[] parts = name.split("_", 2);
                                if (parts.length > 1 && parts[0].length() >= 32) {
                                    name = parts[1];
                                }
                            }
                            return name.toLowerCase().equals(targetClean);
                        })
                        .findFirst()
                        .orElse(null);
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private Path findFileFuzzy(Path root, String filename) {
        if (root == null || !Files.exists(root)) {
            return null;
        }
        String cleanName = filename;
        if (filename.contains("_")) {
            String[] parts = filename.split("_", 2);
            if (parts.length > 1 && parts[0].length() >= 32) {
                cleanName = parts[1];
            }
        }
        final String targetClean = cleanName.toLowerCase();
        return safeFuzzySearch(root, targetClean);
    }

    private Path safeFuzzySearch(Path dir, String targetClean) {
        try (java.util.stream.Stream<Path> stream = Files.list(dir)) {
            List<Path> subDirs = new java.util.ArrayList<>();
            for (Path p : (Iterable<Path>) stream::iterator) {
                if (Files.isRegularFile(p)) {
                    String name = p.getFileName().toString();
                    if (name.contains("_")) {
                        String[] parts = name.split("_", 2);
                        if (parts.length > 1 && parts[0].length() >= 32) {
                            name = parts[1];
                        }
                    }
                    if (name.toLowerCase().equals(targetClean)) {
                        return p;
                    }
                } else if (Files.isDirectory(p)) {
                    subDirs.add(p);
                }
            }
            for (Path subDir : subDirs) {
                Path found = safeFuzzySearch(subDir, targetClean);
                if (found != null) {
                    return found;
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    /**
     * Deletes a file based on its relative path.
     */
    public boolean deleteFile(String relativePath) {
        if (relativePath == null || relativePath.isEmpty())
            return false;
        try {
            String decodedPath = relativePath;
            try {
                decodedPath = java.net.URLDecoder.decode(relativePath, java.nio.charset.StandardCharsets.UTF_8.name());
            } catch (Exception ignored) {
            }
            Path file = getRootPath().resolve(decodedPath).normalize();
            Path resolvedRoot = getRootPath().toAbsolutePath().normalize();
            Path fileAbsolute = file.toAbsolutePath().normalize();
            if (!fileAbsolute.startsWith(resolvedRoot)) {
                throw new SecurityException("Access Denied: Path traversal attempt in deleteFile.");
            }
            return Files.deleteIfExists(file);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Maps module strings to BosDocConstants.
     * Supports both top-level modules and sub-module granularity.
     */
    private String resolveSubDir(String module) {
        if (module == null)
            return BosDocConstants.DEFAULT_DOC_PATH;

        switch (module.toUpperCase()) {
            // ─── 3-Level Menu Hierarchical Mappings ────────────────────────

            // --- MASTER Module ---
            case "MASTER_HR_EMPLOYEE_EMPLOYEE_MASTER":
            case "HRA_PROFILE":
                return BosDocConstants.MASTER_HR_EMPLOYEE_EMPLOYEE_MASTER_PATH;
            case "HRA_PROFILE_IMAGE":
                return BosDocConstants.MASTER_HR_EMPLOYEE_EMPLOYEE_IMAGE_PATH;
            case "HRA_SIGNATURE":
                return BosDocConstants.MASTER_HR_EMPLOYEE_EMPLOYEE_SIGNATURE_PATH;
            case "HRA_EDUCATION":
                return BosDocConstants.MASTER_HR_EMPLOYEE_EMPLOYEE_EDUCATION_PATH;
            case "HRA_EXPERIENCE":
            case "HRA_RESUME":
            case "HRA_PAYSLIP":
                return BosDocConstants.MASTER_HR_EMPLOYEE_EMPLOYEE_EXPERIENCE_PATH;
            case "HRA_KYC":
                return BosDocConstants.MASTER_HR_EMPLOYEE_EMPLOYEE_KYC_PATH;
            case "HRA_SKILLS":
                return BosDocConstants.MASTER_HR_EMPLOYEE_EMPLOYEE_SKILLS_PATH;
            case "HRA_FITNESS":
                return BosDocConstants.MASTER_HR_EMPLOYEE_EMPLOYEE_FITNESS_PATH;
            case "HRA_NDA":
                return BosDocConstants.MASTER_HR_EMPLOYEE_EMPLOYEE_NDA_PATH;
            case "MASTER_HR_ATS_APPLICATION_TRACKING_SYSTEM":
                return BosDocConstants.MASTER_HR_ATS_APPLICATION_TRACKING_SYSTEM_PATH;
            case "MASTER_HR_ATS_INTERVIEW_CRITERIA_MASTER":
                return BosDocConstants.MASTER_HR_ATS_INTERVIEW_CRITERIA_MASTER_PATH;
            case "MASTER_HR_ATS_EMAIL_CONTENT_MASTER":
                return BosDocConstants.MASTER_HR_ATS_EMAIL_CONTENT_MASTER_PATH;
            case "MASTER_HR_ATS_APPLICANT_VERIFICATION_CRITERIA":
                return BosDocConstants.MASTER_HR_ATS_APPLICANT_VERIFICATION_CRITERIA_PATH;
            case "MASTER_HR_ATS_INDUCTION_CRITERIA":
                return BosDocConstants.MASTER_HR_ATS_INDUCTION_CRITERIA_PATH;
            case "MASTER_HR_EMPLOYEE_EMPLOYEE_TYPE":
                return BosDocConstants.MASTER_HR_EMPLOYEE_EMPLOYEE_TYPE_PATH;
            case "MASTER_HR_EMPLOYEE_DEPARTMENT":
                return BosDocConstants.MASTER_HR_EMPLOYEE_DEPARTMENT_PATH;
            case "MASTER_HR_EMPLOYEE_DESIGNATION":
                return BosDocConstants.MASTER_HR_EMPLOYEE_DESIGNATION_PATH;
            case "MASTER_HR_EMPLOYEE_LEVEL":
                return BosDocConstants.MASTER_HR_EMPLOYEE_LEVEL_PATH;
            case "MASTER_HR_EMPLOYEE_GRADE":
                return BosDocConstants.MASTER_HR_EMPLOYEE_GRADE_PATH;
            case "MASTER_HR_PAYROLL_HOLIDAY":
                return BosDocConstants.MASTER_HR_PAYROLL_HOLIDAY_PATH;
            case "MASTER_HR_PAYROLL_BANK_DETAILS":
                return BosDocConstants.MASTER_HR_PAYROLL_BANK_DETAILS_PATH;
            case "MASTER_HR_PAYROLL_SHIFT":
                return BosDocConstants.MASTER_HR_PAYROLL_SHIFT_PATH;
            case "MASTER_HR_PAYROLL_LOAN_MASTER":
                return BosDocConstants.MASTER_HR_PAYROLL_LOAN_MASTER_PATH;
            case "MASTER_HR_PAYROLL_LEAVE_MASTER":
                return BosDocConstants.MASTER_HR_PAYROLL_LEAVE_MASTER_PATH;
            case "MASTER_HR_PAYROLL_PERMISSION_MASTER":
                return BosDocConstants.MASTER_HR_PAYROLL_PERMISSION_MASTER_PATH;
            case "MASTER_HR_PAYROLL_PETROL_ALLOWANCE":
                return BosDocConstants.MASTER_HR_PAYROLL_PETROL_ALLOWANCE_PATH;
            case "MASTER_HR_PAYROLL_POLICY_MASTER":
                return BosDocConstants.MASTER_HR_PAYROLL_POLICY_MASTER_PATH;

            case "MASTER_QMS_CHECKLIST_CHECK_LIST_MASTER":
                return BosDocConstants.MASTER_QMS_CHECKLIST_CHECK_LIST_MASTER_PATH;
            case "MASTER_QMS_AUDIT_AUDIT_AREA_ZONE":
                return BosDocConstants.MASTER_QMS_AUDIT_AUDIT_AREA_ZONE_PATH;
            case "MASTER_QMS_AUDIT_AUDIT_TYPE":
                return BosDocConstants.MASTER_QMS_AUDIT_AUDIT_TYPE_PATH;
            case "MASTER_QMS_AUDIT_AUDIT_CRITERIA":
                return BosDocConstants.MASTER_QMS_AUDIT_AUDIT_CRITERIA_PATH;
            case "MASTER_QMS_MEETING_MEETING_MASTER":
            case "MEETING_MASTER":
                return BosDocConstants.MASTER_QMS_MEETING_MEETING_MASTER_PATH;
            case "MASTER_QMS_MEETING_UNNAMED_PAGE":
                return BosDocConstants.MASTER_QMS_MEETING_UNNAMED_PAGE_PATH;

            case "MASTER_NPD_PRODUCT_PRODUCT_ITEM_GROUP":
                return BosDocConstants.MASTER_NPD_PRODUCT_PRODUCT_ITEM_GROUP_PATH;
            case "MASTER_NPD_PRODUCT_PRODUCT_ITEM_TYPE":
                return BosDocConstants.MASTER_NPD_PRODUCT_PRODUCT_ITEM_TYPE_PATH;
            case "MASTER_NPD_PRODUCT_PRODUCT_ITEM_SUB_TYPE":
                return BosDocConstants.MASTER_NPD_PRODUCT_PRODUCT_ITEM_SUB_TYPE_PATH;
            case "MASTER_NPD_PRODUCT_PRODUCT_OEM_MASTER":
                return BosDocConstants.MASTER_NPD_PRODUCT_PRODUCT_OEM_MASTER_PATH;
            case "MASTER_NPD_PRODUCT_PRODUCT_OEM_MAPPING":
                return BosDocConstants.MASTER_NPD_PRODUCT_PRODUCT_OEM_MAPPING_PATH;
            case "MASTER_NPD_PRODUCT_PRODUCT_MODEL_MASTER":
                return BosDocConstants.MASTER_NPD_PRODUCT_PRODUCT_MODEL_MASTER_PATH;
            case "MASTER_NPD_PRODUCT_PRODUCT_CAPACITY_MASTER":
                return BosDocConstants.MASTER_NPD_PRODUCT_PRODUCT_CAPACITY_MASTER_PATH;
            case "MASTER_NPD_PRODUCT_PRODUCT_PROCESS_MASTER":
                return BosDocConstants.MASTER_NPD_PRODUCT_PRODUCT_PROCESS_MASTER_PATH;
            case "MASTER_NPD_PRODUCT_PRODUCT_MASTER":
            case "PRODUCT_MASTER":
                return BosDocConstants.MASTER_NPD_PRODUCT_PRODUCT_MASTER_PATH;
            case "MASTER_NPD_WIND_FARM_MASTER":
                return BosDocConstants.MASTER_NPD_WIND_FARM_MASTER_PATH;
            case "MASTER_NPD_UOM":
                return BosDocConstants.MASTER_NPD_UOM_PATH;

            case "MASTER_VENDOR_MASTER":
            case "SALES_SUPPLIER":
            case "SALES_SUPPLIERS":
                return BosDocConstants.MASTER_VENDOR_MASTER_PATH;

            case "MASTER_SALES_CRM_CUSTOMER_SATISFACTION_CRITERIA":
                return BosDocConstants.MASTER_SALES_CRM_CUSTOMER_SATISFACTION_CRITERIA_PATH;
            case "MASTER_SALES_CRM_CONTACT_MASTER":
                return BosDocConstants.MASTER_SALES_CRM_CONTACT_MASTER_PATH;
            case "MASTER_SALES_CRM_CUSTOMER_MASTER":
            case "SALES_CUSTOMER":
                return BosDocConstants.MASTER_SALES_CRM_CUSTOMER_MASTER_PATH;
            case "MASTER_SALES_CRM_CUSTOMER_POTENTIAL":
                return BosDocConstants.MASTER_SALES_CRM_CUSTOMER_POTENTIAL_PATH;

            case "MASTER_SALES_LOGISTICS_PAYMENT_TERMS":
                return BosDocConstants.MASTER_SALES_LOGISTICS_PAYMENT_TERMS_PATH;
            case "MASTER_SALES_LOGISTICS_DELIVERY_TERMS":
                return BosDocConstants.MASTER_SALES_LOGISTICS_DELIVERY_TERMS_PATH;
            case "MASTER_SALES_LOGISTICS_CURRENCY":
                return BosDocConstants.MASTER_SALES_LOGISTICS_CURRENCY_PATH;
            case "MASTER_SALES_LOGISTICS_UNIT_OF_MEASUREMENT":
                return BosDocConstants.MASTER_SALES_LOGISTICS_UNIT_OF_MEASUREMENT_PATH;
            case "MASTER_SALES_LOGISTICS_COUNTRY_MASTER":
                return BosDocConstants.MASTER_SALES_LOGISTICS_COUNTRY_MASTER_PATH;
            case "MASTER_SALES_LOGISTICS_STATE_MASTER":
                return BosDocConstants.MASTER_SALES_LOGISTICS_STATE_MASTER_PATH;
            case "MASTER_SALES_LOGISTICS_SEGMENT":
                return BosDocConstants.MASTER_SALES_LOGISTICS_SEGMENT_PATH;
            case "MASTER_SALES_LOGISTICS_SUB_SEGMENT":
                return BosDocConstants.MASTER_SALES_LOGISTICS_SUB_SEGMENT_PATH;
            case "MASTER_SALES_LOGISTICS_MODE_OF_DESPATCH":
                return BosDocConstants.MASTER_SALES_LOGISTICS_MODE_OF_DESPATCH_PATH;
            case "MASTER_SALES_LOGISTICS_FREIGHT":
                return BosDocConstants.MASTER_SALES_LOGISTICS_FREIGHT_PATH;

            // --- HRA Module ---
            case "HRA_INDUCTION_INDUCTION_PENDING":
                return BosDocConstants.HRA_INDUCTION_INDUCTION_PENDING_PATH;
            case "HRA_INDUCTION_INDUCTION_TRAINING":
                return BosDocConstants.HRA_INDUCTION_INDUCTION_TRAINING_PATH;
            case "HRA_INDUCTION_INDUCTION_TRAINEE":
                return BosDocConstants.HRA_INDUCTION_INDUCTION_TRAINEE_PATH;

            // --- SALES & MARKETING Module ---
            case "SALES_MARKETING_OCR_ENQUIRY_DASHBOARD":
                return BosDocConstants.SALES_MARKETING_OCR_ENQUIRY_DASHBOARD_PATH;
            case "SALES_MARKETING_OCR_ENQUIRY":
            case "SALES_ENQUIRY":
                return BosDocConstants.SALES_MARKETING_OCR_ENQUIRY_PATH;
            case "SALES_MARKETING_OCR_PRICE_MASTER":
                return BosDocConstants.SALES_MARKETING_OCR_PRICE_MASTER_PATH;
            case "SALES_MARKETING_OCR_QUOTATION":
            case "SALES_QUOTATION":
                return BosDocConstants.SALES_MARKETING_OCR_QUOTATION_PATH;

            // --- QUALITY MANAGEMENT SYSTEMS Module ---
            case "QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CHECKLIST_VERIFY":
                return BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CHECKLIST_VERIFY_PATH;
            case "QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CLOSE_CHECKLIST_RENEWAL":
            case "QMS_CHECKLIST":
                return BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CLOSE_CHECKLIST_RENEWAL_PATH;
            case "QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CHECKLIST_RENEWAL_VERIFY":
                return BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CHECKLIST_RENEWAL_VERIFY_PATH;
            case "QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CHECKLIST_RENEWAL_REPORT":
                return BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CHECKLIST_RENEWAL_REPORT_PATH;

            case "QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_SCHEDULE":
            case "QMS_AUDIT":
                return BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_SCHEDULE_PATH;
            case "QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_USER_ATTENDANCE":
                return BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_USER_ATTENDANCE_PATH;
            case "QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_OBSERVATION":
            case "QMS_AUDIT_OBSERVATION":
                return BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_OBSERVATION_PATH;
            case "QUALITY_MANAGEMENT_SYSTEMS_AUDIT_CLOSE_NC_OFI":
            case "QMS_NCR":
                return BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_AUDIT_CLOSE_NC_OFI_PATH;
            case "QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_NC_OFI_APPROVAL":
                return BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_NC_OFI_APPROVAL_PATH;
            case "QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_REPORT":
                return BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_REPORT_PATH;

            case "QUALITY_MANAGEMENT_SYSTEMS_MEETING_MEETING_SCHEDULE":
                return BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_MEETING_MEETING_SCHEDULE_PATH;
            case "QUALITY_MANAGEMENT_SYSTEMS_MEETING_MEETING_USER_ATTENDANCE":
                return BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_MEETING_MEETING_USER_ATTENDANCE_PATH;
            case "QUALITY_MANAGEMENT_SYSTEMS_MEETING_MINUTES_OF_MEETING":
                return BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_MEETING_MINUTES_OF_MEETING_PATH;
            case "QUALITY_MANAGEMENT_SYSTEMS_MEETING_CLOSE_MOM":
                return BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_MEETING_CLOSE_MOM_PATH;
            case "QUALITY_MANAGEMENT_SYSTEMS_MEETING_MOM_APPROVAL":
                return BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_MEETING_MOM_APPROVAL_PATH;

            // --- ADMIN Module ---
            case "ADMIN_BOS_COMPANY_PROFILE":
            case "COMPANY_PROFILE":
                return BosDocConstants.ADMIN_BOS_COMPANY_PROFILE_PATH;
            case "ADMIN_BOS_DIVISIONS_UNITS":
                return BosDocConstants.ADMIN_BOS_DIVISIONS_UNITS_PATH;
            case "ADMIN_BOS_USER_CREDENTIALS":
            case "USER_PROFILE":
                return BosDocConstants.ADMIN_BOS_USER_CREDENTIALS_PATH;
            case "ADMIN_BOS_USER_ACCESS":
                return BosDocConstants.ADMIN_BOS_USER_ACCESS_PATH;
            case "ADMIN_BOS_AUDIT_TRAIL":
                return BosDocConstants.ADMIN_BOS_AUDIT_TRAIL_PATH;
            case "ADMIN_BOS_USER_SESSION_ANALYTICS":
                return BosDocConstants.ADMIN_BOS_USER_SESSION_ANALYTICS_PATH;
            case "ADMIN_BOS_FILE_TRACEABILITY_HUB":
            case "TRACEABILITY":
                return BosDocConstants.ADMIN_BOS_FILE_TRACEABILITY_HUB_PATH;
            case "ADMIN_BOS_OLD_DATA_MIGRATION":
                return BosDocConstants.ADMIN_BOS_OLD_DATA_MIGRATION_PATH;
            case "ADMIN_BOS_ORGANIZATION_CHART":
                return BosDocConstants.ADMIN_BOS_ORGANIZATION_CHART_PATH;

            case "ADMIN_SUPER_BUSINESS_AUTHORIZATION":
                return BosDocConstants.ADMIN_SUPER_BUSINESS_AUTHORIZATION_PATH;
            case "ADMIN_SUPER_APP_PREFERENCE":
                return BosDocConstants.ADMIN_SUPER_APP_PREFERENCE_PATH;
            case "ADMIN_SUPER_PREFIX_SUFFIX_CREDENTIALS":
                return BosDocConstants.ADMIN_SUPER_PREFIX_SUFFIX_CREDENTIALS_PATH;
            case "ADMIN_SUPER_SESSION_MONITORING":
                return BosDocConstants.ADMIN_SUPER_SESSION_MONITORING_PATH;

            // --- DASHBOARD Module ---
            case "DASHBOARD_CHAT_UPLOADS":
            case "CHAT_UPLOAD":
            case "CHAT_UPLOADS":
                return BosDocConstants.DASHBOARD_CHAT_UPLOADS_PATH;
            case "DASHBOARD_CHAT_VOICES":
            case "CHAT_VOICE":
            case "CHAT_VOICES":
                return BosDocConstants.DASHBOARD_CHAT_VOICES_PATH;

            // --- SUPPORT Module ---
            case "SUPPORT_TICKET_ATTACHMENTS":
            case "SUPPORT":
            case "SUPPORT_TEMP_ATTACHMENT":
            case "SUPPORT_TEMP_ATTACHMENTS":
                return BosDocConstants.SUPPORT_TICKET_ATTACHMENTS_PATH;
            case "SUPPORT_MY_REQUESTS":
                return BosDocConstants.SUPPORT_MY_REQUESTS_PATH;
            case "SUPPORT_REQUESTS_FOR_ME":
                return BosDocConstants.SUPPORT_REQUESTS_FOR_ME_PATH;

            // --- Generic Fallbacks ---
            case "QMS":
                return BosDocConstants.QMS_DOC_PATH;
            case "HRA":
                return BosDocConstants.HRA_DOC_PATH;
            case "FINANCE":
                return BosDocConstants.FINANCE_DOC_PATH;
            case "PRODUCTION":
                return BosDocConstants.PRODUCTION_DOC_PATH;
            case "PURCHASE":
            case "PURCHASE_GATE_ENTRY":
            case "GATE_ENTRY":
                return BosDocConstants.PURCHASE_GATE_ENTRY_PATH;
            case "SALES":
                return BosDocConstants.SALES_DOC_PATH;
            case "MAINTENANCE":
                return BosDocConstants.MAINTENANCE_DOC_PATH;
            case "QUALITY":
                return BosDocConstants.QUALITY_DOC_PATH;
            case "MASTER_PLATFORM_SECURITY_ADMIN_USERS":
                return BosDocConstants.MASTER_PLATFORM_SECURITY_ADMIN_USERS_PATH;

            case "SM_ENQUIRY":
                return BosDocConstants.SALES_MARKETING_ENQUIRY_PATH;
            case "SM_QUOTATION":
                return BosDocConstants.SALES_MARKETING_QUOTATION_PATH;
            case "SM_PRICE_MASTER":
                return BosDocConstants.SALES_MARKETING_PRICE_MASTER_PATH;

            case "ASSETS":
                return BosDocConstants.ASSETS_DOC_PATH;
            case "NPD":
                return BosDocConstants.NPD_DOC_PATH;
            case "STORES":
                return BosDocConstants.STORES_DOC_PATH;
            case "OCR":
                return BosDocConstants.OCR_DOC_PATH;

            case "ORDER_MATERIAL_VISITOR_GATE_PASS":
            case "VISITOR_GATE_PASS":
                return BosDocConstants.ORDER_MATERIAL_VISITOR_GATE_PASS_PATH;

            case "VENDOR_ATTACHMENTS":
                return "MASTER/Vendor/Customer";

            default:
                return BosDocConstants.DEFAULT_DOC_PATH;
        }
    }
}
