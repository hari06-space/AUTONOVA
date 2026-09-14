package com.autonoma.erp.service.admin;

import com.autonoma.erp.model.admin.AppPreference;
import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.repository.admin.AppPreferenceRepository;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import AppUtil.BosDocConstants;

@Service
public class UserService {

    @Autowired
    private CompanyCredentialService companyCredentialService;

    @Autowired
    private AppPreferenceRepository appPreferenceRepository;

    private Path getUploadDirectory() {
        // Priority 1: From CompanyCredential record (shared root)
        CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
        if (company != null && company.getDirectoryPath() != null
                && !company.getDirectoryPath().trim().isEmpty()) {
            return Paths.get(company.getDirectoryPath().trim());
        }

        // Priority 2: From AppPreference
        Optional<AppPreference> pref = appPreferenceRepository.findByPrefName("FILE_LOCATION");
        if (pref.isPresent() && pref.get().getPrefValue() != null && !pref.get().getPrefValue().trim().isEmpty()) {
            return Paths.get(pref.get().getPrefValue().trim());
        }

        // Fallback: Default uploads
        return Paths.get(System.getProperty("user.dir") + File.separator + "uploads");
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

    /**
     * Deletes a file from the configured directory.
     */
    public boolean deleteFile(String filename, String subDir) {
        if (filename == null || filename.isEmpty() || "null".equalsIgnoreCase(filename))
            return false;
        try {
            Path uploadRoot = getUploadDirectory().toAbsolutePath().normalize();
            Path filePath = getUploadDirectory().resolve(subDir).resolve(filename).normalize().toAbsolutePath();
            if (!filePath.startsWith(uploadRoot)) {
                throw new SecurityException("Access Denied: Path traversal attempt in deleteFile.");
            }
            return Files.deleteIfExists(filePath);
        } catch (Exception e) {
            System.err.println("Failed to delete file: " + filename + ". " + e.getMessage());
            return false;
        }
    }
}
