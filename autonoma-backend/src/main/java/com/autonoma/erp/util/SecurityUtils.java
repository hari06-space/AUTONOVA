package com.autonoma.erp.util;

import com.autonoma.erp.config.TenantContextHolder;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class SecurityUtils {

    private static UserRepository userRepository;
    private static EmployeeMasterRepository employeeRepository;

    @Autowired
    public SecurityUtils(UserRepository userRepository, EmployeeMasterRepository employeeRepository) {
        SecurityUtils.userRepository = userRepository;
        SecurityUtils.employeeRepository = employeeRepository;
    }

    private static final java.util.concurrent.ConcurrentHashMap<String, String> usernameCasingCache = new java.util.concurrent.ConcurrentHashMap<>();
    private static final ThreadLocal<Boolean> IN_GET_USER_ID = ThreadLocal.withInitial(() -> false);

    public static void resolveAndCacheUsernameCasing(String rawUsername) {
        if (rawUsername == null || rawUsername.isEmpty()) {
            return;
        }
        String key = rawUsername.toLowerCase();
        if (usernameCasingCache.containsKey(key)) {
            return;
        }
        try {
            com.autonoma.erp.repository.admin.UserRepository userRepo = SpringContext
                    .getBean(com.autonoma.erp.repository.admin.UserRepository.class);
            if (userRepo != null) {
                String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
                java.util.Optional<com.autonoma.erp.model.admin.UserCredential> userOpt = java.util.Optional.empty();
                try {
                    com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                    userOpt = userRepo.findByUserId(rawUsername);
                    if (!userOpt.isPresent()) {
                        userOpt = userRepo.findByUserIdIgnoreCase(rawUsername);
                    }
                } finally {
                    com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
                }
                if (userOpt.isPresent()) {
                    usernameCasingCache.put(key, userOpt.get().getUserId());
                    return;
                }
            }
        } catch (Exception e) {
            // Ignore resolution errors
        }
        usernameCasingCache.put(key, rawUsername);
    }

    public static Long getCurrentDivisionId() {
        return com.autonoma.erp.config.DivisionContextHolder.getDivisionId();
    }

    public static String getCurrentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                Object principal = auth.getPrincipal();
                String username = null;

                if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                    username = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
                } else if (principal instanceof String) {
                    username = (String) principal;
                }

                if (username == null || username.trim().isEmpty()) {
                    SecurityContextHolder.clearContext();
                    throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException(
                            "User ID is empty. Session closed.");
                }

                String key = username.toLowerCase();
                String cached = usernameCasingCache.get(key);
                if (cached != null) {
                    return cached;
                }

                usernameCasingCache.put(key, username);
                return username;
            }
        } catch (org.springframework.security.core.AuthenticationException e) {
            throw e;
        } catch (Exception e) {
            // Log error
        }
        return null;
    }

    public static String getCurrentTenantId() {
        return com.autonoma.erp.config.TenantContextHolder.getTenantId();
    }

    public static void setCurrentTenantId(String tenantId) {
        com.autonoma.erp.config.TenantContextHolder.setTenantId(tenantId);
    }

    public static void clear() {
        com.autonoma.erp.config.TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    private static final java.util.concurrent.ConcurrentHashMap<String, String> employeeNameCache = new java.util.concurrent.ConcurrentHashMap<>();
    private static final java.util.concurrent.ConcurrentHashMap<String, String> employeeToUserCache = new java.util.concurrent.ConcurrentHashMap<>();

    public static String getUserIdFromEmployeeName(String empNameOrUserId) {
        if (empNameOrUserId == null || empNameOrUserId.trim().isEmpty()) {
            return empNameOrUserId;
        }
        String trimmed = empNameOrUserId.trim();
        String cached = employeeToUserCache.get(trimmed);
        if (cached != null) {
            return cached;
        }

        String resolved = trimmed;
        try {
            com.autonoma.erp.repository.admin.UserRepository userRepo = SpringContext
                    .getBean(com.autonoma.erp.repository.admin.UserRepository.class);
            if (userRepo != null) {
                String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
                boolean isUser = false;
                try {
                    com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                    isUser = userRepo.findByUserId(trimmed).isPresent() || userRepo.findByUserIdIgnoreCase(trimmed).isPresent();
                } finally {
                    com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
                }
                if (isUser) {
                    employeeToUserCache.put(trimmed, trimmed);
                    return trimmed;
                }
            }
        } catch (Exception ignored) {
        }

        try {
            com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository empRepo = SpringContext
                    .getBean(com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository.class);
            com.autonoma.erp.repository.admin.UserRepository userRepo = SpringContext
                    .getBean(com.autonoma.erp.repository.admin.UserRepository.class);
            if (empRepo != null && userRepo != null) {
                // 1. Try finding by unique empCode
                java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> empOpt = empRepo.findByEmpCodeIgnoreCase(trimmed);
                if (!empOpt.isPresent()) {
                    empOpt = empRepo.findByOldEmpCode(trimmed);
                }
                if (!empOpt.isPresent()) {
                    try {
                        long nId = Long.parseLong(trimmed);
                        empOpt = empRepo.findById(nId);
                    } catch (NumberFormatException ignored) {}
                }

                // 2. Fallback to name match only if unique resolution fails
                if (!empOpt.isPresent()) {
                    java.util.List<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> emps = empRepo.findAll()
                            .stream()
                            .filter(e -> trimmed.equalsIgnoreCase(e.getEmployeeName()))
                            .toList();
                    if (emps.size() == 1) {
                        empOpt = java.util.Optional.of(emps.get(0));
                    }
                }

                if (empOpt.isPresent()) {
                    Long empId = empOpt.get().getId();
                    String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
                    try {
                        com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                        java.util.List<com.autonoma.erp.model.admin.UserCredential> users = userRepo.findByEmpId(empId);
                        if (!users.isEmpty()) {
                            resolved = users.get(0).getUserId();
                        }
                    } finally {
                        com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
                    }
                }
            }
        } catch (Exception ignored) {
        }

        employeeToUserCache.put(trimmed, resolved);
        return resolved;
    }

    public static void clearCachedEmployeeName(String principalId) {
        if (principalId != null) {
            employeeNameCache.remove(principalId);
        }
    }

    public static void resolveAndCacheEmployeeName(String principalId) {
        if (principalId == null || principalId.isEmpty()) {
            return;
        }

        if (employeeNameCache.containsKey(principalId)) {
            return;
        }

        try {
            com.autonoma.erp.repository.admin.UserRepository userRepo = SpringContext
                    .getBean(com.autonoma.erp.repository.admin.UserRepository.class);
            com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository empRepo = SpringContext
                    .getBean(com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository.class);

            if (userRepo != null && empRepo != null) {
                String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
                java.util.Optional<com.autonoma.erp.model.admin.UserCredential> userOpt = java.util.Optional.empty();
                try {
                    com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                    userOpt = userRepo.findByUserId(principalId);
                    if (!userOpt.isPresent()) {
                        userOpt = userRepo.findByUserIdIgnoreCase(principalId);
                    }
                } finally {
                    com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
                }

                if (userOpt.isPresent()) {
                    Long empId = userOpt.get().getEmpId();
                    if (empId != null) {
                        java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> empOpt = empRepo
                                .findById(empId);
                        if (empOpt.isPresent()) {
                            employeeNameCache.put(principalId, empOpt.get().getEmployeeName());
                            return;
                        }
                    }
                }

                java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> empOpt = empRepo
                        .findByEmpCode(principalId);
                if (empOpt.isPresent()) {
                    employeeNameCache.put(principalId, empOpt.get().getEmployeeName());
                    return;
                }

                try {
                    Long empId = Long.parseLong(principalId);
                    empOpt = empRepo.findById(empId);
                    if (empOpt.isPresent()) {
                        employeeNameCache.put(principalId, empOpt.get().getEmployeeName());
                        return;
                    }
                } catch (NumberFormatException nfe) {
                    // Ignore
                }
            }
        } catch (Exception e) {
            // Ignore resolution errors
        }

        // Only cache the fallback if we have a valid tenant context (meaning the tenant
        // database was actually queried)
        String currentTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        if (currentTenant != null && !currentTenant.equalsIgnoreCase(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME) && !currentTenant.isEmpty()) {
            employeeNameCache.put(principalId, principalId);
        }
    }

    public static String getCurrentUserEmployeeNameNoQuery() {
        String principalId = getCurrentUserId();
        if (principalId == null) {
            return null;
        }
        String cached = employeeNameCache.get(principalId);
        if (cached == null || cached.equalsIgnoreCase(principalId)) {
            return principalId; // Return user ID directly without executing DB queries
        }
        return cached;
    }

    public static String getCurrentUserEmployeeName() {
        String principalId = getCurrentUserId();
        if (principalId == null) {
            return null;
        }
        String cached = employeeNameCache.get(principalId);
        if (cached == null) {
            resolveAndCacheEmployeeName(principalId);
            cached = employeeNameCache.get(principalId);
        }
        return cached != null ? cached : principalId;
    }

    public static String getCurrentUserDisplayName() {
        String empName = getCurrentUserEmployeeName();
        if (empName == null) {
            empName = getCurrentUserId();
        }
        // Normalize "Administrator" / "Admin istrator" to "Admin" for display
        // consistency
        if (empName != null
                && ("Administrator".equalsIgnoreCase(empName) || "Admin istrator".equalsIgnoreCase(empName))) {
            return "Admin";
        }
        return empName;
    }

    public static String getCurrentUserRole() {
        String userId = getCurrentUserId();
        if (userId == null) {
            return null;
        }
        if ("Admin".equalsIgnoreCase(userId)) {
            return "ADMIN";
        }
        try {
            com.autonoma.erp.repository.admin.UserRepository userRepo = SpringContext.getBean(com.autonoma.erp.repository.admin.UserRepository.class);
            com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository empRepo = SpringContext.getBean(com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository.class);
            if (userRepo != null && empRepo != null) {
                String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
                try {
                    com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                    Optional<com.autonoma.erp.model.admin.UserCredential> userOpt = userRepo.findByUserId(userId);
                    if (userOpt.isPresent()) {
                        Integer level = userOpt.get().getUserLevel();
                        if (level != null && level >= 1) {
                            return "ADMIN";
                        }
                        Long empId = userOpt.get().getEmpId();
                        if (empId != null) {
                            com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
                            Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> empOpt = empRepo.findById(empId);
                            if (empOpt.isPresent() && empOpt.get().getDepartment() != null) {
                                String deptName = empOpt.get().getDepartment().getDepartmentName();
                                if ("Human Resources".equalsIgnoreCase(deptName) || "HR".equalsIgnoreCase(deptName)) {
                                    return "HR";
                                }
                            }
                        }
                    }
                } finally {
                    com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
                }
            }
        } catch (Exception e) {}
        return "USER";
    }

    public static Long getCurrentUserEmpId() {
        String userId = getCurrentUserId();
        if (userId == null || userId.trim().isEmpty()) {
            return null;
        }
        try {
            com.autonoma.erp.repository.admin.UserRepository userRepo = SpringContext.getBean(com.autonoma.erp.repository.admin.UserRepository.class);
            com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository empRepo = SpringContext.getBean(com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository.class);
            
            if (userRepo != null) {
                String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
                Optional<UserCredential> userOpt = Optional.empty();
                try {
                    com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                    userOpt = userRepo.findByUserId(userId);
                    if (!userOpt.isPresent()) {
                        userOpt = userRepo.findByUserIdIgnoreCase(userId);
                    }
                } finally {
                    com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
                }

                if (userOpt.isPresent()) {
                    Long empId = userOpt.get().getEmpId();
                    if (empId != null) {
                        return empId;
                    }
                }
            }

            // Fallback: Look up EmployeeMaster strictly by empCode, oldEmpCode, or numeric ID
            if (empRepo != null) {
                String cleanUserId = userId.trim();
                Optional<EmployeeMaster> empOpt = empRepo.findByEmpCodeIgnoreCase(cleanUserId);
                if (!empOpt.isPresent()) {
                    empOpt = empRepo.findByOldEmpCode(cleanUserId);
                }
                if (!empOpt.isPresent()) {
                    try {
                        long parsedId = Long.parseLong(cleanUserId);
                        empOpt = empRepo.findById(parsedId);
                    } catch (NumberFormatException ignored) {}
                }

                if (empOpt.isPresent()) {
                    Long empId = empOpt.get().getId();
                    if (userRepo != null) {
                        String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
                        try {
                            com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                            Optional<UserCredential> uOpt = userRepo.findByUserId(userId);
                            if (uOpt.isPresent()) {
                                UserCredential uc = uOpt.get();
                                uc.setEmpId(empId);
                                userRepo.save(uc);
                            }
                        } finally {
                            com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
                        }
                    }
                    return empId;
                }
            }
        } catch (Exception e) {
            // Ignore resolution errors
        }
        return null;
    }
}
