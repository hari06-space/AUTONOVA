package com.autonoma.erp.controller.admin;

import AppUtil.AppConstants;
import com.autonoma.erp.model.admin.UserCompanyMapping;
import com.autonoma.erp.model.admin.UserDivisionMapping;
import com.autonoma.erp.repository.admin.UserCompanyMappingRepository;
import com.autonoma.erp.repository.admin.UserDivisionMappingRepository;

import com.autonoma.erp.modules.master.organization.service.DivisionService;

import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.modules.platform.files.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeMasterRepository employeeMasterRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private FileService fileService;

    @Autowired(required = false)
    private com.autonoma.erp.modules.platform.identity.service.EnterpriseClientValidationService enterpriseClientValidationService;

    @Autowired
    private com.autonoma.erp.service.admin.FaceDescriptorCacheService faceDescriptorCacheService;

    private ResponseEntity<?> checkUserQuota(boolean isActivating) {
        if (isActivating && enterpriseClientValidationService != null) {
            long activeUsersCount = userRepository.countActiveUsers();
            com.autonoma.erp.modules.platform.identity.dto.EnterpriseValidationResult result = enterpriseClientValidationService.validateUserLimit(activeUsersCount);
            if (result != null && !result.isValid() && "MAX_USERS_EXCEEDED".equals(result.getErrorCode())) {
                return ResponseEntity.badRequest().body(result.getMessage());
            }
        }
        return null;
    }

    private String getCurrentUserId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "SYSTEM";
    }

    private boolean isCurrentUserBossAdmin() {
        String userId = getCurrentUserId();
        return userRepository.findById(userId)
                .map(u -> u.getUserLevel() != null && u.getUserLevel() >= AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN)
                .orElse(false);
    }

    @GetMapping("/all")
    @RequirePagePermission(pageCode = "AD1130", action = "read")
    public ResponseEntity<List<UserCredential>> getAllUsers() {
        List<UserCredential> users = userRepository.findAll();
        // Password decryption logic omitted for security/simplicity as per existing
        // code but note it should handle properly
        return ResponseEntity.ok(users);
    }

    @PostMapping("/create")
    @RequirePagePermission(pageCode = "AD1130", action = "write")
    public ResponseEntity<?> createUser(@RequestBody UserCredential user) {
        if (user.getUserId() == null || user.getUserId().isEmpty()) {
            return ResponseEntity.badRequest().body("User ID cannot be empty");
        }
        if (userRepository.existsById(user.getUserId())) {
            return ResponseEntity.badRequest().body("User ID already exists");
        }

        boolean isCreatingActive = (user.getStatus() == null || user.getStatus() == 1) && (user.getIsActive() == null || Boolean.TRUE.equals(user.getIsActive()));
        ResponseEntity<?> quotaErr = checkUserQuota(isCreatingActive);
        if (quotaErr != null) {
            return quotaErr;
        }

        // Treat empId=0 as not provided (Number('') in JS returns 0)
        if (user.getEmpId() != null && user.getEmpId() == 0L) {
            user.setEmpId(null);
        }
        
        // Copy image from EmployeeMaster if available and no specific image provided
        if (user.getEmpId() != null && (user.getImgName() == null || user.getImgName().isEmpty())) {
            EmployeeMaster emp = employeeMasterRepository.findById(user.getEmpId()).orElse(null);
            if (emp != null && emp.getEmployeePhotoUpload() != null && !emp.getEmployeePhotoUpload().isEmpty()) {
                try {
                    java.nio.file.Path rootPath = fileService.getRootPath();
                    java.nio.file.Path sourcePath = rootPath.resolve(emp.getEmployeePhotoUpload());
                    if (java.nio.file.Files.exists(sourcePath)) {
                        String ext = "";
                        int dotIdx = emp.getEmployeePhotoUpload().lastIndexOf(".");
                        if (dotIdx >= 0) {
                            ext = emp.getEmployeePhotoUpload().substring(dotIdx);
                        }
                        String newFileName = "USER_PROFILE/" + java.util.UUID.randomUUID().toString() + ext;
                        java.nio.file.Path destPath = rootPath.resolve(newFileName);
                        java.nio.file.Files.createDirectories(destPath.getParent());
                        java.nio.file.Files.copy(sourcePath, destPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                        user.setImgName(newFileName);
                    }
                } catch (Exception e) {
                    org.slf4j.LoggerFactory.getLogger(UserController.class).error("Failed to copy employee photo to user credential", e);
                }
            }
        }

        // Sanitize userLevel to prevent mass assignment privilege escalation during creation.
        // userLevel can only be configured via the mappings endpoint which enforces authorization.
        user.setUserLevel(0);
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        } else {
            user.setPassword(passwordEncoder.encode(""));
        }
        
        // Ensure faceEmbeddings is saved if provided during creation
        if (user.getFaceEmbeddings() != null) {
            user.setFaceEmbeddings(user.getFaceEmbeddings());
        }

        // Duplicate Face Check
        if (user.getFaceEmbeddings() != null || user.getFaceDescriptor() != null) {
            double[][] frames = faceDescriptorCacheService.parseUserEmbeddings(user);
            if (frames != null && frames.length > 0) {
                // For new user creation, pass a dummy string for currentUserId since it hasn't been saved yet
                String duplicateUserId = faceDescriptorCacheService.findDuplicateUser(frames, "");
                if (duplicateUserId != null) {
                    Map<String, String> err = new HashMap<>();
                    err.put("message", "This face is already registered against User ID: " + duplicateUserId + ". Please clear it there first or use a different face.");
                    return ResponseEntity.status(400).body(err);
                }
            }
        }

        user.setCreatedDate(new Date());
        user.setCreatedBy(getCurrentUserId());
        UserCredential saved = userRepository.save(user);
        // Refresh face descriptor cache if face data was enrolled during creation
        if (saved.getFaceDescriptor() != null || saved.getFaceEmbeddings() != null) {
            faceDescriptorCacheService.refreshUser(saved.getUserId());
        }
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/update/{id}")


    @RequirePagePermission(pageCode = "AD1130", action = "write")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody UserCredential userDetails) {
        UserCredential user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        boolean wasInactive = (user.getStatus() != null && user.getStatus() == 0) || (user.getIsActive() != null && Boolean.FALSE.equals(user.getIsActive()));
        boolean isNowActive = (userDetails.getStatus() == null || userDetails.getStatus() == 1) && (userDetails.getIsActive() == null || Boolean.TRUE.equals(userDetails.getIsActive()));
        if (wasInactive && isNowActive) {
            ResponseEntity<?> quotaErr = checkUserQuota(true);
            if (quotaErr != null) {
                return quotaErr;
            }
        }
        
        if (user.getUserLevel() != null && user.getUserLevel() >= AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN) {
            if (!isCurrentUserBossAdmin()) {
                return ResponseEntity.status(403).body("Admins cannot modify Boss Admins");
            }
            // Prevent deactivating the last active Boss Admin
            if (userDetails.getStatus() != null && userDetails.getStatus() != 1 && (user.getStatus() == null || user.getStatus() == 1)) {
                long bossAdminCount = userRepository.countActiveBossAdmins(AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN);
                if (bossAdminCount <= 1) {
                    return ResponseEntity.badRequest().body("Cannot deactivate the last active Boss Admin of the system.");
                }
            }
        }

        // Delete old image if it's being replaced
        if (userDetails.getImgName() != null && !userDetails.getImgName().equals(user.getImgName())) {
            fileService.deleteFile(user.getImgName());
        }


        user.setStatus(userDetails.getStatus());
        user.setImgName(userDetails.getImgName());
        user.setFaceImage(userDetails.getFaceImage());
        user.setAuthMethod(userDetails.getAuthMethod());
        user.setFaceDescriptor(userDetails.getFaceDescriptor());
        user.setFaceEmbeddings(userDetails.getFaceEmbeddings());
        user.setAutoLogoutOnFaceAbsence(userDetails.getAutoLogoutOnFaceAbsence());
        // Persist face template version if provided (marks as FACE_API_V1 after quality hardening)
        if (userDetails.getFaceTemplateVersion() != null) {
            user.setFaceTemplateVersion(userDetails.getFaceTemplateVersion());
        }

        // Duplicate Face Check
        if (user.getFaceEmbeddings() != null || user.getFaceDescriptor() != null) {
            double[][] frames = faceDescriptorCacheService.parseUserEmbeddings(user);
            if (frames != null && frames.length > 0) {
                String duplicateUserId = faceDescriptorCacheService.findDuplicateUser(frames, user.getUserId());
                if (duplicateUserId != null) {
                    Map<String, String> err = new HashMap<>();
                    err.put("message", "This face is already registered against User ID: " + duplicateUserId + ". Please clear it there first or use a different face.");
                    return ResponseEntity.status(400).body(err);
                }
            }
        }

        // Only update empId if a valid (non-null, non-zero) value is provided
        // Number('') in JavaScript evaluates to 0, which is not a valid HR_EMPLOYEE ID
        Long newEmpId = userDetails.getEmpId();
        if (newEmpId != null && newEmpId != 0L) {
            user.setEmpId(newEmpId);
        }
        // If empId is 0 or null, keep the existing empId value (no change)

        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            // Prevent double-encoding if the frontend sends back the existing encrypted hash
            if (!userDetails.getPassword().equals(user.getPassword())) {
                user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
            }
        }

        user.setUpdatedBy(getCurrentUserId());
        user.setUpdatedDate(new Date());
        UserCredential saved = userRepository.save(user);
        // Invalidate and refresh this user's face descriptor cache entry
        // (only this user's entry — never rebuilds full cache)
        faceDescriptorCacheService.refreshUser(saved.getUserId());
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/check-duplicate-face")
    public ResponseEntity<?> checkDuplicateFace(@RequestBody Map<String, Object> payload) {
        try {
            String faceEmbeddingsJson = null;
            if (payload.containsKey("faceEmbeddings")) {
                Object obj = payload.get("faceEmbeddings");
                if (obj instanceof String) {
                    faceEmbeddingsJson = (String) obj;
                } else {
                    faceEmbeddingsJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(obj);
                }
            }
            String currentUserId = (String) payload.get("currentUserId");
            if (currentUserId == null) currentUserId = "";

            if (faceEmbeddingsJson != null && !faceEmbeddingsJson.isBlank()) {
                UserCredential tempUser = new UserCredential();
                tempUser.setFaceEmbeddings(faceEmbeddingsJson);
                double[][] frames = faceDescriptorCacheService.parseUserEmbeddings(tempUser);
                if (frames != null && frames.length > 0) {
                    String duplicateUserId = faceDescriptorCacheService.findDuplicateUser(frames, currentUserId);
                    if (duplicateUserId != null) {
                        Map<String, Object> res = new HashMap<>();
                        res.put("isDuplicate", true);
                        res.put("duplicateUserId", duplicateUserId);
                        return ResponseEntity.ok(res);
                    }
                }
            }
            Map<String, Object> res = new HashMap<>();
            res.put("isDuplicate", false);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error checking duplicate face");
        }
    }

    @PostMapping(value = "/upload-profile-pic", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequirePagePermission(pageCode = "AD1130", action = "write")
    public ResponseEntity<?> uploadProfilePic(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "previousFile", required = false) String previousFile) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Uploaded file is empty");
            }
            String contentType = file.getContentType();
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isEmpty()) {
                return ResponseEntity.badRequest().body("Invalid filename");
            }
            String ext = "";
            int dotIdx = originalFilename.lastIndexOf(".");
            if (dotIdx >= 0) {
                ext = originalFilename.substring(dotIdx + 1).toLowerCase();
            }
            if (!ext.equals("jpg") && !ext.equals("jpeg") && !ext.equals("png") && !ext.equals("gif") && !ext.equals("webp")) {
                return ResponseEntity.badRequest().body("Invalid file type. Only JPG, JPEG, PNG, GIF, and WEBP images are allowed.");
            }
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body("Invalid content type. File must be an image.");
            }

            if (previousFile != null && !previousFile.isEmpty()) {
                fileService.deleteFile(previousFile);
            }

            String relativePath = fileService.saveFile(file, "USER_PROFILE");
            Map<String, String> response = new HashMap<>();
            response.put("fileName", relativePath);
            response.put("message", "Profile picture uploaded successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping({ "/image/{*filename}", "/image" })
    public ResponseEntity<Resource> getImage(
            @PathVariable(required = false) String filename,
            @RequestParam(required = false) String fileNameParam) {
        try {
            String targetFile = filename != null ? filename : fileNameParam;
            if (targetFile == null || targetFile.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (targetFile.startsWith("/"))
                targetFile = targetFile.substring(1);

            Resource resource = fileService.loadFile(targetFile);
            String contentType = Files.probeContentType(resource.getFile().toPath());
            return ResponseEntity.ok()
                    .contentType(
                            MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "AD1130", action = "delete")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        UserCredential targetUser = userRepository.findById(id).orElse(null);
        if (targetUser != null && targetUser.getUserLevel() != null && targetUser.getUserLevel() >= AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN) {
            if (!isCurrentUserBossAdmin()) {
                return ResponseEntity.status(403).body("Admins cannot delete Boss Admins");
            }
            // Prevent deleting the last Boss Admin
            long bossAdminCount = userRepository.countActiveBossAdmins(AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN);
            if (bossAdminCount <= 1) {
                return ResponseEntity.badRequest().body("Cannot delete the last Boss Admin of the system.");
            }
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @Autowired
    private com.autonoma.erp.repository.admin.UserDivisionMappingRepository userDivisionMappingRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.UserCompanyMappingRepository userCompanyMappingRepository;

    @Autowired
    private com.autonoma.erp.modules.master.organization.service.DivisionService divisionService;

    @GetMapping("/{userId}/mappings")
    @RequirePagePermission(pageCode = "AD1130", action = "read")
    public ResponseEntity<?> getUserMappings(@PathVariable String userId) {
        java.util.List<Long> divIds = userDivisionMappingRepository.findByUserId(userId).stream()
                .map(com.autonoma.erp.model.admin.UserDivisionMapping::getDivisionId)
                .collect(java.util.stream.Collectors.toList());

        java.util.List<Long> compIds = userCompanyMappingRepository.findByUserId(userId).stream()
                .map(com.autonoma.erp.model.admin.UserCompanyMapping::getCompanyId)
                .collect(java.util.stream.Collectors.toList());

        UserCredential user = userRepository.findById(userId).orElse(null);
        Integer userLevel = (user != null && user.getUserLevel() != null) ? user.getUserLevel() : 0;

        Map<String, Object> result = new HashMap<>();
        result.put("mappedDivisionIds", divIds);
        result.put("mappedCompanyIds", compIds);
        result.put("userLevel", userLevel);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/all-mappings")
    @RequirePagePermission(pageCode = "AD1130", action = "read")
    public ResponseEntity<?> getAllUserMappings() {
        List<UserDivisionMapping> allDivMappings = userDivisionMappingRepository.findAll();
        List<UserCompanyMapping> allCompMappings = userCompanyMappingRepository.findAll();
        List<UserCredential> users = userRepository.findAll();

        Map<String, Map<String, Object>> result = new HashMap<>();
        for (UserCredential u : users) {
            String userId = u.getUserId();
            Map<String, Object> uMap = new HashMap<>();
            uMap.put("mappedDivisionIds", new java.util.ArrayList<Long>());
            uMap.put("mappedCompanyIds", new java.util.ArrayList<Long>());
            uMap.put("userLevel", u.getUserLevel() != null ? u.getUserLevel() : 0);
            result.put(userId, uMap);
        }

        for (UserDivisionMapping m : allDivMappings) {
            Map<String, Object> uMap = result.get(m.getUserId());
            if (uMap != null) {
                ((List<Long>) uMap.get("mappedDivisionIds")).add(m.getDivisionId());
            }
        }

        for (UserCompanyMapping m : allCompMappings) {
            Map<String, Object> uMap = result.get(m.getUserId());
            if (uMap != null) {
                ((List<Long>) uMap.get("mappedCompanyIds")).add(m.getCompanyId());
            }
        }

        return ResponseEntity.ok(result);
    }


    public static class UserMappingPayload {
        private java.util.List<Long> mappedDivisionIds;
        private Integer userLevel;

        public java.util.List<Long> getMappedDivisionIds() {
            return mappedDivisionIds;
        }

        public void setMappedDivisionIds(java.util.List<Long> mappedDivisionIds) {
            this.mappedDivisionIds = mappedDivisionIds;
        }

        public Integer getUserLevel() {
            return userLevel;
        }

        public void setUserLevel(Integer userLevel) {
            this.userLevel = userLevel;
        }
    }

    @PostMapping("/{userId}/mappings")


    @RequirePagePermission(pageCode = "AD1130", action = "write")
    public ResponseEntity<?> updateUserMappings(@PathVariable String userId, @RequestBody UserMappingPayload payload) {
        UserCredential user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        if (user.getUserLevel() != null && user.getUserLevel() >= AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN) {
            if (!isCurrentUserBossAdmin()) {
                return ResponseEntity.status(403).body("Admins cannot modify Boss Admins");
            }
            // Prevent demoting the last Boss Admin
            if (payload.getUserLevel() == null || payload.getUserLevel() < AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN) {
                long bossAdminCount = userRepository.countActiveBossAdmins(AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN);
                if (bossAdminCount <= 1) {
                    return ResponseEntity.badRequest().body("Cannot demote the last Boss Admin of the system.");
                }
            }
        }

        if (payload.getUserLevel() != null && payload.getUserLevel() >= AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN) {
            if (!isCurrentUserBossAdmin()) {
                return ResponseEntity.status(403).body("Admins cannot grant Boss Admin privileges");
            }
        }

        user.setUserLevel(payload.getUserLevel() != null ? payload.getUserLevel() : 0);
        userRepository.save(user);

        userDivisionMappingRepository.deleteByUserId(userId);
        userCompanyMappingRepository.deleteByUserId(userId);

        if (payload.getUserLevel() == null || payload.getUserLevel() == 0) {
            if (payload.getMappedDivisionIds() != null && !payload.getMappedDivisionIds().isEmpty()) {
                java.util.Set<Long> companyIds = new java.util.HashSet<>();

                for (Long divId : payload.getMappedDivisionIds()) {
                    com.autonoma.erp.model.admin.UserDivisionMapping divMapping = new com.autonoma.erp.model.admin.UserDivisionMapping();
                    divMapping.setUserId(userId);
                    divMapping.setDivisionId(divId);
                    divMapping.setCreatedBy(getCurrentUserId());
                    divMapping.setCreatedAt(new Date());
                    userDivisionMappingRepository.save(divMapping);

                    divisionService.findById(divId).ifPresent(div -> {
                        if (div.getCompanyId() != null) {
                            companyIds.add(div.getCompanyId());
                        }
                    });
                }

                for (Long compId : companyIds) {
                    com.autonoma.erp.model.admin.UserCompanyMapping compMapping = new com.autonoma.erp.model.admin.UserCompanyMapping();
                    compMapping.setUserId(userId);
                    compMapping.setCompanyId(compId);
                    userCompanyMappingRepository.save(compMapping);
                }
            }
        }

        Map<String, String> res = new HashMap<>();
        res.put("message", "User mappings updated successfully");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/generate-from-employees")
    @RequirePagePermission(pageCode = "AD1130", action = "write")
    public ResponseEntity<?> generateFromEmployees(@RequestBody List<Long> empIds) {
        if (empIds == null || empIds.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No employee IDs provided."));
        }

        int createdCount = 0;
        int skippedCount = 0;

        for (Long empId : empIds) {
            if (userRepository.existsByEmpId(empId)) {
                skippedCount++;
                continue;
            }

            ResponseEntity<?> quotaErr = checkUserQuota(true);
            if (quotaErr != null) {
                if (createdCount > 0) {
                    return ResponseEntity.ok(Map.of(
                        "message", "Credentials generated partially (" + createdCount + " created). " + quotaErr.getBody(),
                        "created", createdCount,
                        "skipped", skippedCount
                    ));
                }
                return quotaErr;
            }

            EmployeeMaster employee = employeeMasterRepository.findById(empId).orElse(null);
            if (employee == null) {
                skippedCount++;
                continue;
            }

            String rawEmpName = employee.getFirstName();
            if (rawEmpName == null || rawEmpName.trim().isEmpty()) {
                rawEmpName = employee.getEmployeeName();
            }
            if (rawEmpName == null || rawEmpName.trim().isEmpty()) {
                skippedCount++;
                continue;
            }

            String[] nameParts = rawEmpName.trim().split("\\s+");
            String firstIndex = nameParts[0].toUpperCase().replaceAll("[^A-Z0-9]", "");
            String fullName = rawEmpName.toUpperCase().replaceAll("[^A-Z0-9]", "");

            if (firstIndex.isEmpty()) {
                skippedCount++;
                continue;
            }

            String fatherInitial = "";
            String fatherName = employee.getFatherHusbandName();
            if (fatherName != null && !fatherName.trim().isEmpty()) {
                String cleanFather = fatherName.trim().toUpperCase().replaceAll("[^A-Z0-9]", "");
                if (!cleanFather.isEmpty()) {
                    fatherInitial = String.valueOf(cleanFather.charAt(0));
                }
            }

            String proposedId = firstIndex;
            boolean found = false;

            if (!userRepository.existsById(proposedId)) {
                found = true;
            }

            if (!found && !fullName.equals(firstIndex)) {
                proposedId = fullName;
                if (!userRepository.existsById(proposedId)) {
                    found = true;
                }
            }

            if (!found && !fatherInitial.isEmpty()) {
                proposedId = firstIndex + fatherInitial;
                if (!userRepository.existsById(proposedId)) {
                    found = true;
                }
            }

            String baseForIncremental = fullName + fatherInitial;
            if (!found && !fatherInitial.isEmpty() && !baseForIncremental.equals(firstIndex + fatherInitial)) {
                proposedId = baseForIncremental;
                if (!userRepository.existsById(proposedId)) {
                    found = true;
                }
            }

            if (!found) {
                int counter = 1;
                proposedId = baseForIncremental + counter;
                while (userRepository.existsById(proposedId)) {
                    counter++;
                    proposedId = baseForIncremental + counter;
                }
            }
            UserCredential user = new UserCredential();
            user.setUserId(proposedId);
            user.setEmpId(empId);
            user.setPassword(passwordEncoder.encode("123"));
            user.setStatus(1);
            user.setUserLevel(0);
            user.setCreatedDate(new Date());
            user.setCreatedBy(getCurrentUserId());
            user.setIsActive(true);
            user.setImgName(employee.getEmployeePhotoUpload());
            
            userRepository.save(user);
            createdCount++;
        }

        return ResponseEntity.ok(Map.of(
            "message", "Credentials generated successfully.",
            "created", createdCount,
            "skipped", skippedCount
        ));
    }

    public static class ChangePasswordRequest {
        private String oldPassword;
        private String newPassword;

        public String getOldPassword() { return oldPassword; }
        public void setOldPassword(String oldPassword) { this.oldPassword = oldPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        String userId = getCurrentUserId();
        if ("SYSTEM".equals(userId)) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized. Please login again."));
        }
        
        UserCredential user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.status(400).body(Map.of("message", "Incorrect old password entered."));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedBy(userId);
        user.setUpdatedDate(new Date());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    @PostMapping("/{id}/reset-password")
    @RequirePagePermission(pageCode = "AD1130", action = "write")
    public ResponseEntity<?> resetPassword(@PathVariable String id) {
        String currentUserId = getCurrentUserId();
        if ("SYSTEM".equals(currentUserId)) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized. Please login again."));
        }
        
        UserCredential currentUser = userRepository.findById(currentUserId).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Current user not found"));
        }
        
        Integer currentUserLevel = currentUser.getUserLevel() != null ? currentUser.getUserLevel() : 0;
        
        if (currentUserLevel != 1 && currentUserLevel != 5) {
            return ResponseEntity.status(403).body(Map.of("message", "You don't have access to reset passwords."));
        }
        
        UserCredential user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        Integer targetUserLevel = user.getUserLevel() != null ? user.getUserLevel() : 0;
        
        if (currentUserLevel == 1 && targetUserLevel != 0) {
            return ResponseEntity.status(403).body(Map.of("message", "You don't have access to reset password for this user level."));
        }

        // Generate a cryptographically secure random temporary password
        String tempPassword = java.util.UUID.randomUUID().toString().substring(0, 8);
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setUpdatedBy(currentUserId);
        user.setUpdatedDate(new Date());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully", "tempPassword", tempPassword));
    }
}
