package com.autonoma.erp.controller.admin;

import AppUtil.AppConstants;
import com.autonoma.erp.config.DivisionContextHolder;
import com.autonoma.erp.config.TenantContextHolder;
import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.model.admin.UserCompanyMapping;
import com.autonoma.erp.model.admin.UserDivisionMapping;
import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.master.organization.service.DivisionService;

import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.modules.platform.identity.service.JwtService;
import com.autonoma.erp.modules.platform.files.service.FileService;
import com.autonoma.erp.service.admin.CompanyCredentialService;
import com.autonoma.erp.service.admin.UserSessionService;
import com.autonoma.erp.service.admin.TenantDataSourceService;
import com.autonoma.erp.repository.admin.UserCompanyMappingRepository;
import com.autonoma.erp.repository.admin.UserDivisionMappingRepository;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;

import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.List;
import java.util.ArrayList;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/account")
public class AuthController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthController.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Autowired
    private com.autonoma.erp.service.admin.FaceAuthService faceAuthService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CompanyCredentialService companyService;

    @Autowired
    private UserSessionService userSessionService;

    @Autowired
    private com.autonoma.erp.modules.master.organization.service.DivisionService divisionService;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeMasterRepository;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private com.autonoma.erp.modules.platform.notification.service.NotificationService notificationService;

    @Autowired
    private com.autonoma.erp.repository.admin.UserCompanyMappingRepository userCompanyMappingRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.UserDivisionMappingRepository userDivisionMappingRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.CompanyCredentialRepository companyCredentialRepository;

    @Autowired(required = false)
    private com.autonoma.erp.modules.platform.identity.service.EnterpriseClientValidationService enterpriseClientValidationService;

    @Autowired
    private com.autonoma.erp.service.admin.FaceDescriptorCacheService faceDescriptorCacheService;

    @Autowired
    private com.autonoma.erp.service.security.LoginSecurityService loginSecurityService;

    @PostMapping("/verify-company-code")
    public ResponseEntity<?> verifyCompanyCode(@RequestBody Map<String, String> payload) {
        String code = payload.get("code") != null ? payload.get("code").trim() : (payload.get("clientCode") != null ? payload.get("clientCode").trim() : "");
        if (code.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "message", "Company code is required"));
        }

        com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
        Optional<CompanyCredential> compOpt = companyCredentialRepository.findFirstByClientCodeIgnoreCaseOrderByIdAsc(code);
        if (!compOpt.isPresent()) {
            // Check by ID or fallback
            try {
                Long compId = Long.parseLong(code);
                compOpt = companyCredentialRepository.findById(compId);
            } catch (Exception ignored) {}
        }

        if (compOpt.isPresent()) {
            CompanyCredential comp = compOpt.get();
            List<Division> divisions = divisionService.getActiveDivisionsByCompany(comp.getId());
            Map<String, Object> resp = new HashMap<>();
            resp.put("valid", true);
            resp.put("companyId", comp.getId());
            resp.put("companyName", comp.getCompanyName());
            resp.put("shortName", comp.getShortName());
            resp.put("clientCode", comp.getClientCode() != null ? comp.getClientCode() : code);
            resp.put("logoFileName", comp.getLogoFileName());
            resp.put("dbSourceName", comp.getDbSourceName() != null ? comp.getDbSourceName() : "AUTONOMA");
            resp.put("divisions", divisions);
            return ResponseEntity.ok(resp);
        }

        return ResponseEntity.status(404).body(Map.of("valid", false, "message", "Invalid 6-digit Company Code"));
    }

    @GetMapping("/company-by-code/{code}")
    public ResponseEntity<?> getCompanyByCode(@PathVariable("code") String code) {
        Map<String, String> payload = new HashMap<>();
        payload.put("code", code);
        return verifyCompanyCode(payload);
    }

    @GetMapping("/check-credentials")
    public ResponseEntity<?> checkCredentialsGet() {
        return ResponseEntity.status(org.springframework.http.HttpStatus.METHOD_NOT_ALLOWED)
                .body(Map.of("message",
                        "Request method 'GET' is not supported for check-credentials. Use 'POST' with a JSON request body containing 'username' and 'password' instead."));
    }

    @PostMapping("/check-credentials")
    public ResponseEntity<?> checkCredentials(@RequestBody LoginRequest loginRequest) {
        // Step 0: Centralized Client License Validation BEFORE evaluating user
        // credentials
        if (enterpriseClientValidationService != null) {
            com.autonoma.erp.modules.platform.identity.dto.EnterpriseValidationResult valResult = enterpriseClientValidationService
                    .validateClient();
            if (!valResult.isValid()) {
                log.error("[Login] License/Client validation failed before authentication. Error: {}",
                        valResult.getMessage());
                Map<String, String> error = new HashMap<>();
                error.put("message", valResult.getMessage());
                error.put("errorCode", valResult.getErrorCode());
                return ResponseEntity.status(403).body(error);
            }
        }

        // Step 1: Validate credentials from master database
        com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
        String usernameInput = loginRequest.getUsername() != null ? loginRequest.getUsername().trim() : "";
        Optional<UserCredential> userOpt = userRepository.findByUserId(usernameInput);
        if (!userOpt.isPresent()) {
            userOpt = userRepository.findAll().stream()
                    .filter(u -> u.getUserId().equalsIgnoreCase(usernameInput))
                    .findFirst();
        }

        // Fallback to tenant-specific database if user is not found in AUTONOMA
        if (!userOpt.isPresent() && loginRequest.getTenantId() != null && !loginRequest.getTenantId().trim().isEmpty() && !loginRequest.getTenantId().trim().equalsIgnoreCase("AUTONOMA")) {
            try {
                tenantDataSourceService.createTenantDataSource(loginRequest.getTenantId().trim());
                com.autonoma.erp.config.TenantContextHolder.setTenantId(loginRequest.getTenantId().trim());
                userOpt = userRepository.findByUserId(usernameInput);
                if (!userOpt.isPresent()) {
                    userOpt = userRepository.findAll().stream()
                            .filter(u -> u.getUserId().equalsIgnoreCase(usernameInput))
                            .findFirst();
                }
            } catch (Exception e) {
                // Ignore and remain empty
            } finally {
                // Switch back to AUTONOMA context for the rest of the method's initial checks
                com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
            }
        }

        if (userOpt.isPresent() && passwordEncoder.matches(loginRequest.getPassword(), userOpt.get().getPassword())) {
            UserCredential user = userOpt.get();
            if (user.getStatus() != null && user.getStatus() != 1) {
                return ResponseEntity.status(403).body(Map.of("message", "Account is inactive"));
            }

            // Validate Preferred Auth Method
            if (user.getAuthMethod() != null && "FACE".equalsIgnoreCase(user.getAuthMethod())) {
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Password login is disabled for this account. Please use Face ID."));
            }

            // Step 2: Fetch mapped companies and divisions
            java.util.List<Map<String, Object>> matches = new java.util.ArrayList<>();

            java.util.List<com.autonoma.erp.model.admin.UserCompanyMapping> compMappings = userCompanyMappingRepository
                    .findByUserId(user.getUserId());

            java.util.List<com.autonoma.erp.model.admin.UserDivisionMapping> divMappings = userDivisionMappingRepository
                    .findByUserId(user.getUserId());

            boolean isSuperUser = "SUPER BOSS".equalsIgnoreCase(user.getUserId()) || (user.getUserLevel() != null
                    && user.getUserLevel() >= AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN);

            if (isSuperUser) {
                // Super Users get everything regardless of mappings
                java.util.List<com.autonoma.erp.model.admin.CompanyCredential> allCompanies = companyCredentialRepository
                        .findAll();
                for (com.autonoma.erp.model.admin.CompanyCredential company : allCompanies) {
                    java.util.List<com.autonoma.erp.modules.master.organization.entity.Division> divisions = divisionService
                            .getActiveDivisionsByCompany(company.getId());
                    Map<String, Object> match = new HashMap<>();
                    match.put("company", company);
                    match.put("divisions", divisions);
                    matches.add(match);
                }
            } else {
                java.util.Set<Long> mappedDivIds = divMappings.stream()
                        .map(com.autonoma.erp.model.admin.UserDivisionMapping::getDivisionId)
                        .collect(java.util.stream.Collectors.toSet());

                for (com.autonoma.erp.model.admin.UserCompanyMapping mapping : compMappings) {
                    companyCredentialRepository.findById(mapping.getCompanyId()).ifPresent(company -> {
                        java.util.List<com.autonoma.erp.modules.master.organization.entity.Division> divisions = divisionService
                                .getActiveDivisionsByCompany(company.getId())
                                .stream()
                                .filter(d -> mappedDivIds.contains(d.getId()))
                                .collect(java.util.stream.Collectors.toList());

                        Map<String, Object> match = new HashMap<>();
                        match.put("company", company);
                        match.put("divisions", divisions);
                        matches.add(match);
                    });
                }
            }

            if (matches.isEmpty() && !isSuperUser) {
                // Self-healing fallback: If no mappings exist, auto-map to the default company
                // and its active divisions
                java.util.List<com.autonoma.erp.model.admin.CompanyCredential> allCompanies = companyCredentialRepository
                        .findAll();
                if (!allCompanies.isEmpty()) {
                    com.autonoma.erp.model.admin.CompanyCredential defaultComp = allCompanies.get(0);
                    java.util.List<com.autonoma.erp.modules.master.organization.entity.Division> divisions = divisionService
                            .getActiveDivisionsByCompany(defaultComp.getId());

                    try {
                        com.autonoma.erp.model.admin.UserCompanyMapping compMapping = new com.autonoma.erp.model.admin.UserCompanyMapping();
                        compMapping.setUserId(user.getUserId());
                        compMapping.setCompanyId(defaultComp.getId());
                        userCompanyMappingRepository.save(compMapping);

                        for (com.autonoma.erp.modules.master.organization.entity.Division div : divisions) {
                            com.autonoma.erp.model.admin.UserDivisionMapping divMapping = new com.autonoma.erp.model.admin.UserDivisionMapping();
                            divMapping.setUserId(user.getUserId());
                            divMapping.setDivisionId(div.getId());
                            divMapping.setCreatedBy("SUPER BOSS");
                            divMapping.setCreatedAt(new java.util.Date());
                            userDivisionMappingRepository.save(divMapping);
                        }
                    } catch (Exception ex) {
                        // ignore constraint violations
                    }

                    Map<String, Object> match = new HashMap<>();
                    match.put("company", defaultComp);
                    match.put("divisions", divisions);
                    matches.add(match);
                } else {
                    return ResponseEntity.status(403)
                            .body(Map.of("message", "No companies or divisions assigned to this user."));
                }
            }

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            if (isSuperUser) {
                headers.add("X-Is-Bos-Admin", "1");
                headers.add("Access-Control-Expose-Headers", "X-Is-Bos-Admin");
            }

            // Single Active Session check (if not already confirmed takeover)
            if (!Boolean.TRUE.equals(loginRequest.getConfirmTakeover())) {
                Long targetCompId = matches.isEmpty() ? null : ((com.autonoma.erp.model.admin.CompanyCredential) matches.get(0).get("company")).getId();
                Optional<com.autonoma.erp.service.admin.UserSessionService.ActiveSessionInfo> existingSessionOpt =
                        userSessionService.checkActiveSession(user.getUserId(), targetCompId);
                if (existingSessionOpt.isPresent()) {
                    com.autonoma.erp.service.admin.UserSessionService.ActiveSessionInfo info = existingSessionOpt.get();
                    Map<String, Object> conflictResp = new HashMap<>();
                    conflictResp.put("errorCode", "ALREADY_LOGGED_IN");
                    conflictResp.put("message", "User is already logged in on another system.");
                    Map<String, Object> sessMap = new HashMap<>();
                    sessMap.put("deviceName", info.getDeviceName() != null ? info.getDeviceName() : "System");
                    sessMap.put("ipAddress", info.getIpAddress() != null ? info.getIpAddress() : "");
                    sessMap.put("networkIp", info.getNetworkIp() != null ? info.getNetworkIp() : "127.0.0.1");
                    sessMap.put("systemIp", info.getSystemIp() != null ? info.getSystemIp() : "192.168.1.100");
                    sessMap.put("loginTime", info.getLoginTime());
                    sessMap.put("lastActivity", info.getLastActivity());
                    sessMap.put("userId", info.getUserId());
                    sessMap.put("deviceId", info.getDeviceId());
                    sessMap.put("userLevel", info.getUserLevel());
                    conflictResp.put("existingSession", sessMap);
                    return ResponseEntity.status(409).body(conflictResp);
                }
            }

            return new ResponseEntity<>(matches, headers, org.springframework.http.HttpStatus.OK);
        }

        return ResponseEntity.status(401).body(Map.of("message", "Invalid User ID or Password"));
    }

    @GetMapping("/switch-options")
    public ResponseEntity<?> getSwitchOptions() {
        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");

        java.util.List<Map<String, Object>> matches = new java.util.ArrayList<>();

        java.util.List<com.autonoma.erp.model.admin.UserCompanyMapping> compMappings = userCompanyMappingRepository
                .findByUserId(userId);

        java.util.List<com.autonoma.erp.model.admin.UserDivisionMapping> divMappings = userDivisionMappingRepository
                .findByUserId(userId);

        com.autonoma.erp.model.admin.UserCredential user = userRepository.findByUserId(userId).orElse(null);
        boolean isSuperUser = (user != null && ("SUPER BOSS".equalsIgnoreCase(user.getUserId())
                || (user.getUserLevel() != null && user.getUserLevel() >= AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN)));

        if (isSuperUser) {
            // Super Users get everything regardless of mappings
            java.util.List<com.autonoma.erp.model.admin.CompanyCredential> allCompanies = companyCredentialRepository
                    .findAll();
            for (com.autonoma.erp.model.admin.CompanyCredential company : allCompanies) {
                java.util.List<com.autonoma.erp.modules.master.organization.entity.Division> divisions = divisionService
                        .getActiveDivisionsByCompany(company.getId());
                Map<String, Object> match = new HashMap<>();
                match.put("company", company);
                match.put("divisions", divisions);
                matches.add(match);
            }
        } else {
            java.util.Set<Long> mappedDivIds = divMappings.stream()
                    .map(com.autonoma.erp.model.admin.UserDivisionMapping::getDivisionId)
                    .collect(java.util.stream.Collectors.toSet());

            for (com.autonoma.erp.model.admin.UserCompanyMapping mapping : compMappings) {
                companyCredentialRepository.findById(mapping.getCompanyId()).ifPresent(company -> {
                    java.util.List<com.autonoma.erp.modules.master.organization.entity.Division> divisions = divisionService
                            .getActiveDivisionsByCompany(company.getId())
                            .stream()
                            .filter(d -> mappedDivIds.contains(d.getId()))
                            .collect(java.util.stream.Collectors.toList());

                    Map<String, Object> match = new HashMap<>();
                    match.put("company", company);
                    match.put("divisions", divisions);
                    matches.add(match);
                });
            }
        }

        return ResponseEntity.ok(matches);
    }

    @Autowired
    private TenantDataSourceService tenantDataSourceService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        // First check in AUTONOMA database (Master database)
        com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
        
        // Find user by userId
        String usernameInput = loginRequest.getUsername() != null ? loginRequest.getUsername().trim() : "";
        Optional<UserCredential> userOpt = userRepository.findByUserId(usernameInput);
        if (!userOpt.isPresent()) {
            // Case-insensitive fallback
            userOpt = userRepository.findAll().stream()
                    .filter(u -> u.getUserId().equalsIgnoreCase(usernameInput))
                    .findFirst();
        }

        // Fallback to tenant-specific database if user is not found in AUTONOMA
        if (!userOpt.isPresent() && loginRequest.getTenantId() != null && !loginRequest.getTenantId().trim().isEmpty() && !loginRequest.getTenantId().trim().equalsIgnoreCase("AUTONOMA")) {
            try {
                tenantDataSourceService.createTenantDataSource(loginRequest.getTenantId().trim());
                com.autonoma.erp.config.TenantContextHolder.setTenantId(loginRequest.getTenantId().trim());
                userOpt = userRepository.findByUserId(usernameInput);
                if (!userOpt.isPresent()) {
                    userOpt = userRepository.findAll().stream()
                            .filter(u -> u.getUserId().equalsIgnoreCase(usernameInput))
                            .findFirst();
                }
            } catch (Exception e) {
                // Ignore and remain empty
            } finally {
                // Switch back to AUTONOMA context for the rest of the method's initial checks
                com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
            }
        }

        if (userOpt.isPresent()) {
            UserCredential user = userOpt.get();

            // Validate Password
            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {

                // Validate Status (assuming 1 is Active)
                if (user.getStatus() != null && user.getStatus() != 1) {
                    Map<String, String> error = new HashMap<>();
                    error.put("message", "Account is inactive");
                    return ResponseEntity.status(403).body(error);
                }

                // Validate Preferred Auth Method
                if (user.getAuthMethod() != null && "FACE".equalsIgnoreCase(user.getAuthMethod())) {
                    Map<String, String> error = new HashMap<>();
                    error.put("message", "Password login is disabled for this account. Please use Face ID.");
                    return ResponseEntity.status(403).body(error);
                }

                java.util.List<com.autonoma.erp.model.admin.CompanyCredential> companyConfigs = companyCredentialRepository
                        .findAll();
                boolean allowDuplicateScreens = false;
                boolean allowRightClick = true;
                if (!companyConfigs.isEmpty()) {
                    com.autonoma.erp.model.admin.CompanyCredential config = companyConfigs.get(0);
                    allowDuplicateScreens = Boolean.TRUE.equals(config.getAllowDuplicateScreens());
                    allowRightClick = config.getAllowRightClick() == null
                            || Boolean.TRUE.equals(config.getAllowRightClick());
                }

                // ── Login Access Security Validation (IP / Device Restriction) ──
                boolean isSuperBoss = (user != null && ("SUPER BOSS".equalsIgnoreCase(user.getUserId())
                        || (user.getUserLevel() != null && user.getUserLevel() >= 5)));

                if (!isSuperBoss) {
                    Long targetCompanyId = null;
                    if (loginRequest.getTenantId() != null && !loginRequest.getTenantId().trim().isEmpty() && !"AUTONOMA".equalsIgnoreCase(loginRequest.getTenantId().trim())) {
                        targetCompanyId = companyConfigs.stream()
                                .filter(c -> loginRequest.getTenantId().trim().equalsIgnoreCase(c.getDbSourceName()))
                                .map(com.autonoma.erp.model.admin.CompanyCredential::getId)
                                .findFirst().orElse(null);
                    }
                    if (targetCompanyId == null && !companyConfigs.isEmpty()) {
                        targetCompanyId = companyConfigs.get(0).getId();
                    }

                    com.autonoma.erp.dto.security.SecurityValidationResult secVal = loginSecurityService.validateLoginAccess(
                            request, user.getUserId(), targetCompanyId, loginRequest.getDeviceIdentifier(), loginRequest.getMacAddress()
                    );
                    if (!secVal.isAllowed()) {
                        Map<String, String> error = new HashMap<>();
                        error.put("message", secVal.getUserMessage());
                        return ResponseEntity.status(403).body(error);
                    }
                }

                // Apply Tenant and Division context dynamically
                String effectiveTenantId = loginRequest.getTenantId();
                Long effectiveDivisionId = loginRequest.getDivisionId();

                if (loginRequest.getClientCode() != null && !loginRequest.getClientCode().trim().isEmpty()) {
                    String reqCode = loginRequest.getClientCode().trim();
                    Optional<com.autonoma.erp.model.admin.CompanyCredential> matchedComp = companyCredentialRepository
                            .findFirstByClientCodeIgnoreCaseOrderByIdAsc(reqCode);
                    if (!matchedComp.isPresent()) {
                        // Check if numeric ID matches
                        try {
                            Long cId = Long.parseLong(reqCode);
                            matchedComp = companyCredentialRepository.findById(cId);
                        } catch (Exception ignored) {}
                    }

                    if (!matchedComp.isPresent()) {
                        Map<String, String> error = new HashMap<>();
                        error.put("message", "Invalid Company Code: " + reqCode);
                        return ResponseEntity.status(400).body(error);
                    }

                    com.autonoma.erp.model.admin.CompanyCredential comp = matchedComp.get();

                    // Strictly validate that this user is assigned to this company (unless SUPER BOSS / Admin level)
                    if (!isSuperBoss) {
                        java.util.List<com.autonoma.erp.model.admin.UserCompanyMapping> userComps = userCompanyMappingRepository.findByUserId(user.getUserId());
                        if (!userComps.isEmpty()) {
                            boolean isUserMappedToComp = userComps.stream().anyMatch(m -> comp.getId().equals(m.getCompanyId()));
                            if (!isUserMappedToComp) {
                                Map<String, String> error = new HashMap<>();
                                error.put("message", "User '" + user.getUserId() + "' does not belong to company: " + comp.getCompanyName() + " (" + reqCode + ")");
                                return ResponseEntity.status(403).body(error);
                            }
                        }
                    }

                    if (effectiveTenantId == null || effectiveTenantId.trim().isEmpty() || "AUTONOMA".equalsIgnoreCase(effectiveTenantId)) {
                        if (comp.getDbSourceName() != null && !comp.getDbSourceName().trim().isEmpty()) {
                            effectiveTenantId = comp.getDbSourceName().trim();
                        }
                    }
                    if (effectiveDivisionId == null) {
                        java.util.List<com.autonoma.erp.modules.master.organization.entity.Division> divs = divisionService
                                .getActiveDivisionsByCompany(comp.getId());
                        if (!divs.isEmpty()) {
                            effectiveDivisionId = divs.get(0).getId();
                        }
                    }
                }

                Long tenantEmpId = user.getEmpId();
                if (effectiveTenantId != null && !effectiveTenantId.trim().isEmpty()) {
                    try {
                        tenantDataSourceService.createTenantDataSource(effectiveTenantId.trim());
                        com.autonoma.erp.config.TenantContextHolder.setTenantId(effectiveTenantId.trim());
                        Optional<UserCredential> tenantUserOpt = userRepository.findByUserId(user.getUserId());
                        if (tenantUserOpt.isPresent()) {
                            tenantEmpId = tenantUserOpt.get().getEmpId();
                        } else {
                            tenantEmpId = null;
                        }
                    } catch (Exception e) {
                        com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
                    }
                }
                if (effectiveDivisionId != null) {
                    com.autonoma.erp.config.DivisionContextHolder.setDivisionId(effectiveDivisionId);
                }

                // Check Single Active Session policy
                Long resolvedCompId = null;
                if (!companyConfigs.isEmpty()) {
                    resolvedCompId = companyConfigs.get(0).getId();
                }
                if (!Boolean.TRUE.equals(loginRequest.getConfirmTakeover())) {
                    Optional<com.autonoma.erp.service.admin.UserSessionService.ActiveSessionInfo> existingSessionOpt =
                            userSessionService.checkActiveSession(user.getUserId(), resolvedCompId);
                    if (existingSessionOpt.isPresent()) {
                        com.autonoma.erp.service.admin.UserSessionService.ActiveSessionInfo info = existingSessionOpt.get();
                        Map<String, Object> conflictResp = new HashMap<>();
                        conflictResp.put("errorCode", "ALREADY_LOGGED_IN");
                        conflictResp.put("message", "User is already logged in on another system.");
                        Map<String, Object> sessMap = new HashMap<>();
                        sessMap.put("deviceName", info.getDeviceName() != null ? info.getDeviceName() : "System");
                        sessMap.put("ipAddress", info.getIpAddress() != null ? info.getIpAddress() : "");
                        sessMap.put("networkIp", info.getNetworkIp() != null ? info.getNetworkIp() : "127.0.0.1");
                        sessMap.put("systemIp", info.getSystemIp() != null ? info.getSystemIp() : "192.168.1.100");
                        sessMap.put("loginTime", info.getLoginTime());
                        sessMap.put("lastActivity", info.getLastActivity());
                        sessMap.put("userId", info.getUserId());
                        sessMap.put("deviceId", info.getDeviceId());
                        sessMap.put("userLevel", info.getUserLevel());
                        conflictResp.put("existingSession", sessMap);
                        return ResponseEntity.status(409).body(conflictResp);
                    }
                }

                // Record / Takeover Session
                com.autonoma.erp.model.admin.UserSession userSession;
                if (Boolean.TRUE.equals(loginRequest.getConfirmTakeover())) {
                    userSession = userSessionService.confirmTakeoverSession(user.getUserId(), request, request.getHeader("User-Agent"), loginRequest.getDeviceIdentifier(), null);
                } else {
                    userSession = userSessionService.recordLogin(user.getUserId(), request, request.getHeader("User-Agent"), loginRequest.getDeviceIdentifier(), null);
                }

                String token = jwtService.generateToken(user.getUserId(), userSession != null ? userSession.getSessionId() : null);

                // Pre-resolve and cache employee name immediately on successful authentication
                com.autonoma.erp.util.SecurityUtils.resolveAndCacheEmployeeName(user.getUserId());

                Map<String, Object> response = new HashMap<>();
                response.put("serviceToken", token);
                response.put("allowDuplicateScreens", allowDuplicateScreens);
                response.put("allowRightClick", allowRightClick);

                // Map to the format the frontend expects
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getUserId());
                userMap.put("userId", user.getUserId());
                userMap.put("username", user.getUserId());
                userMap.put("email", user.getUserId());
                userMap.put("empId", tenantEmpId);

                String empName = tenantEmpId != null ? "Employee " + tenantEmpId : user.getUserId();
                if (tenantEmpId != null) {
                    java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> empOpt = employeeMasterRepository
                            .findById(tenantEmpId);
                    if (empOpt.isPresent()) {
                        com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp = empOpt.get();
                        empName = emp.getEmployeeName();
                        userMap.put("empCode", emp.getEmpCode());
                        userMap.put("departmentName",
                                emp.getDepartment() != null ? emp.getDepartment().getDepartmentName() : "");
                        userMap.put("designationName",
                                emp.getDesignation() != null ? emp.getDesignation().getDesignationName() : "");
                        userMap.put("employeePhotoUpload", emp.getEmployeePhotoUpload());
                        userMap.put("employeeCode", emp.getEmpCode());
                        if (emp.getOfficeMail() != null && !emp.getOfficeMail().isEmpty()) {
                            userMap.put("email", emp.getOfficeMail());
                        }
                    } else {
                        userMap.put("departmentName", "System");
                        userMap.put("designationName", "Administrator");
                    }
                } else {
                    userMap.put("departmentName", "System");
                    userMap.put("designationName", "Administrator");
                }
                userMap.put("name", empName);
                userMap.put("role", "ADMIN");
                userMap.put("imgName", user.getImgName());
                userMap.put("userLevel", user.getUserLevel());
                java.util.List<String> enabledModules = java.util.Arrays.asList("dashboard", "masters", "hrms", "sales",
                        "purchase", "production", "storelogistics", "finance", "designdev", "maintenance", "qms", "qmt",
                        "orderMenu", "reports", "employeeselfcare", "admin", "support", "client-monitoring");
                userMap.put("enabledModules", enabledModules);

                enrichUserMapWithTenantInfo(userMap, effectiveTenantId, effectiveDivisionId);

                response.put("user", userMap);

                return ResponseEntity.ok(response);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Invalid password");
                return ResponseEntity.status(401).body(error);
            }
        }

        Map<String, String> error = new HashMap<>();
        error.put("message", "User not found");
        return ResponseEntity.status(401).body(error);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String xTenantId,
            @RequestHeader(value = "X-Division-ID", required = false) Long xDivisionId) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);
        try {
            String userId = jwtService.extractUsername(token);
            return userRepository.findByUserId(userId)
                    .map(user -> {
                        Map<String, Object> userMap = new HashMap<>();
                        userMap.put("id", user.getUserId());
                        userMap.put("userId", user.getUserId());
                        userMap.put("username", user.getUserId());
                        userMap.put("email", user.getUserId());

                        Long resolvedEmpId = user.getEmpId();
                        if (resolvedEmpId == null) {
                            if ("SUPER BOSS".equalsIgnoreCase(user.getUserId()) || "admin".equalsIgnoreCase(user.getUserId())
                                    || (user.getUserLevel() != null && user.getUserLevel() >= 5)) {
                                resolvedEmpId = notificationService.getSuperBossEmpId();
                            }
                        }
                        userMap.put("empId", resolvedEmpId);

                        String empName = resolvedEmpId != null ? "Employee " + resolvedEmpId : user.getUserId();
                        if (resolvedEmpId != null) {
                            java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> empOpt = employeeMasterRepository
                                    .findById(resolvedEmpId);
                            if (empOpt.isPresent()) {
                                com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp = empOpt.get();
                                empName = emp.getEmployeeName();
                                userMap.put("empCode", emp.getEmpCode());
                                userMap.put("departmentName",
                                        emp.getDepartment() != null ? emp.getDepartment().getDepartmentName() : "");
                                userMap.put("designationName",
                                        emp.getDesignation() != null ? emp.getDesignation().getDesignationName() : "");
                                userMap.put("employeePhotoUpload", emp.getEmployeePhotoUpload());
                                userMap.put("employeeCode", emp.getEmpCode());
                                if (emp.getOfficeMail() != null && !emp.getOfficeMail().isEmpty()) {
                                    userMap.put("email", emp.getOfficeMail());
                                }
                            } else {
                                userMap.put("departmentName", "System");
                                userMap.put("designationName", "Administrator");
                            }
                        } else {
                            userMap.put("departmentName", "System");
                            userMap.put("designationName", "Administrator");
                        }
                        userMap.put("name", empName);
                        userMap.put("role", "ADMIN");
                        userMap.put("imgName", user.getImgName());
                        userMap.put("userLevel", user.getUserLevel());
                        userMap.put("autoLogoutOnFaceAbsence", user.getAutoLogoutOnFaceAbsence());
                        java.util.List<String> enabledModulesMe = java.util.Arrays.asList("dashboard", "masters",
                                "hrms", "sales", "purchase", "production", "storelogistics", "finance", "designdev",
                                "maintenance", "qms", "qmt", "orderMenu", "reports", "employeeselfcare", "admin",
                                "support", "client-monitoring");
                        userMap.put("enabledModules", enabledModulesMe);

                        enrichUserMapWithTenantInfo(userMap, xTenantId, xDivisionId);

                        Map<String, Object> resp = new HashMap<>();
                        resp.put("user", userMap);
                        java.util.List<com.autonoma.erp.model.admin.CompanyCredential> configs = companyCredentialRepository
                                .findAll();
                        if (!configs.isEmpty()) {
                            resp.put("allowDuplicateScreens",
                                    Boolean.TRUE.equals(configs.get(0).getAllowDuplicateScreens()));
                            resp.put("allowRightClick", configs.get(0).getAllowRightClick() == null
                                    || Boolean.TRUE.equals(configs.get(0).getAllowRightClick()));
                        } else {
                            resp.put("allowDuplicateScreens", false);
                            resp.put("allowRightClick", true);
                        }
                        return ResponseEntity.ok(resp);
                    })
                    .orElse(ResponseEntity.status(401).build());
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid token");
        }
    }

    @GetMapping("/license-status")
    public ResponseEntity<?> getLicenseStatus() {
        com.autonoma.erp.modules.platform.identity.dto.EnterpriseValidationResult valResult = enterpriseClientValidationService != null
                ? enterpriseClientValidationService.validateClient()
                : com.autonoma.erp.modules.platform.identity.dto.EnterpriseValidationResult.builder().valid(true).message("Validation bypassed").build();
        Map<String, Object> status = new HashMap<>();

        java.util.List<com.autonoma.erp.model.admin.CompanyCredential> configs = companyService.findAll();
        if (!configs.isEmpty()) {
            com.autonoma.erp.model.admin.CompanyCredential config = configs.get(0);
            status.put("clientCode", config.getClientCode());
            status.put("licExpiryDate", config.getLicExpiryDate());
            status.put("licExpRemainderDays", config.getLicExpRemainderDays());
        }

        status.put("isValid", valResult.isValid());
        status.put("isExpired", !valResult.isValid() && "LICENSE_EXPIRED".equals(valResult.getErrorCode()));
        status.put("isWarningPeriod", valResult.isWarning());
        status.put("warningMessage", valResult.getWarningMessage());
        status.put("daysLeft", valResult.getDaysRemaining());
        status.put("clientName", valResult.getClientName());
        status.put("message", valResult.getMessage());

        return ResponseEntity.ok(status);
    }

    private void enrichUserMapWithTenantInfo(Map<String, Object> userMap, String tenantId, Long divisionId) {
        final String resolvedTenantId;
        if (tenantId == null || tenantId.trim().isEmpty() || "AUTONOMA".equalsIgnoreCase(tenantId)) {
            resolvedTenantId = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        } else {
            resolvedTenantId = tenantId;
        }

        final Long resolvedDivisionId;
        if (divisionId == null) {
            resolvedDivisionId = com.autonoma.erp.config.DivisionContextHolder.getDivisionId();
        } else {
            resolvedDivisionId = divisionId;
        }

        if (resolvedTenantId != null && !resolvedTenantId.trim().isEmpty()) {
            userMap.put("tenantId", resolvedTenantId);
            // Switch to Master context to fetch company list safely
            String currentTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
            com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
            companyService.findAll().stream()
                    .filter(c -> resolvedTenantId.equalsIgnoreCase(c.getDbSourceName()))
                    .findFirst()
                    .ifPresent(c -> userMap.put("companyName", c.getCompanyName()));
            // Restore current tenant
            if (currentTenant != null) {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(currentTenant);
            } else {
                com.autonoma.erp.config.TenantContextHolder.clear();
            }
        }

        if (resolvedDivisionId != null) {
            userMap.put("divisionId", resolvedDivisionId);
            divisionService.findByIdAndTenant(resolvedDivisionId, resolvedTenantId)
                    .ifPresent(d -> userMap.put("divisionName", d.getDivisionName()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody(required = false) Map<String, String> body,
                                    @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String sessionId = null;
        String userId = body != null ? body.get("userId") : null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                sessionId = jwtService.extractSessionId(token);
                if (userId == null) {
                    userId = jwtService.extractUsername(token);
                }
            } catch (Exception ignored) {}
        }
        userSessionService.recordLogout(sessionId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/session/heartbeat")
    public ResponseEntity<?> sessionHeartbeat(HttpServletRequest request,
                                              @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("errorCode", "SESSION_NOT_FOUND", "message", "Authorization header missing"));
        }
        String token = authHeader.substring(7);
        try {
            String username = jwtService.extractUsername(token);
            String sessionId = jwtService.extractSessionId(token);
            com.autonoma.erp.service.admin.UserSessionService.SessionValidationResult result =
                    userSessionService.heartbeat(sessionId, username);
            if (!result.isValid()) {
                return ResponseEntity.status(401).body(Map.of("errorCode", result.getErrorCode(), "message", result.getMessage()));
            }
            return ResponseEntity.ok(Map.of("status", "ACTIVE", "message", "Heartbeat acknowledged"));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("errorCode", "SESSION_EXPIRED", "message", "Invalid token"));
        }
    }

    @Autowired
    private FileService fileService;

    private byte[] getFaceImageBytes(String faceImage) {
        if (faceImage == null || faceImage.isEmpty()) {
            return null;
        }
        try {
            if (faceImage.startsWith("data:image") || faceImage.length() > 500) {
                String base64 = faceImage;
                if (base64.contains(",")) {
                    base64 = base64.split(",")[1];
                }
                return java.util.Base64.getDecoder().decode(base64.trim());
            } else {
                org.springframework.core.io.Resource resource = fileService.loadFile(faceImage);
                try (java.io.InputStream is = resource.getInputStream()) {
                    return is.readAllBytes();
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to load/decode face image: " + e.getMessage());
            return null;
        }
    }

    @PostMapping("/check-face")
    public ResponseEntity<?> checkFace(@RequestBody FaceLoginRequest loginRequest, HttpServletRequest request) {
        String usernameInput = loginRequest.getUsername();
        String incomingDescriptor = loginRequest.getFaceDescriptor();
        String faceImageBase64 = loginRequest.getFaceImage();

        boolean hasDescriptor = incomingDescriptor != null && !incomingDescriptor.isBlank();
        boolean hasImage = faceImageBase64 != null && !faceImageBase64.isBlank();

        if (!hasDescriptor && !hasImage) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Face data (descriptor or image) is missing.");
            return ResponseEntity.status(400).body(error);
        }

        com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");

        // Decode legacy image bytes only if no descriptor present
        byte[] webcamImageBytes = null;
        if (!hasDescriptor && hasImage) {
            try {
                String clean = faceImageBase64.contains(",") ? faceImageBase64.split(",")[1] : faceImageBase64;
                webcamImageBytes = java.util.Base64.getDecoder().decode(clean.trim());
            } catch (Exception e) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Invalid image format.");
                return ResponseEntity.status(400).body(error);
            }
        }

        final byte[] finalWebcamBytes = webcamImageBytes;
        UserCredential matchedUser = null;

        double[] incomingDescArray = null;
        if (hasDescriptor) {
            incomingDescArray = parseDescriptor(incomingDescriptor);
        }

        if (usernameInput != null && !usernameInput.trim().isEmpty()) {
            Optional<UserCredential> userOpt = userRepository.findByUserId(usernameInput);
            if (!userOpt.isPresent()) {
                userOpt = userRepository.findAll().stream()
                        .filter(u -> u.getUserId().equalsIgnoreCase(usernameInput))
                        .findFirst();
            }
            if (userOpt.isPresent()) {
                UserCredential user = userOpt.get();
                if (user.getStatus() != null && user.getStatus() != 1) {
                    Map<String, String> error = new HashMap<>();
                    error.put("message", "Account is inactive");
                    return ResponseEntity.status(403).body(error);
                }
                boolean matched = false;
                // 1. Try embeddings comparison (new multi-template)
                if (hasDescriptor && incomingDescArray != null) {
                    List<double[]> storedEmbeddings = parseEmbeddings(user.getFaceEmbeddings());
                    if (storedEmbeddings == null || storedEmbeddings.isEmpty()) {
                        // fallback to faceDescriptor
                        double[] stored = parseDescriptor(user.getFaceDescriptor());
                        if (stored != null) {
                            storedEmbeddings = new ArrayList<>();
                            storedEmbeddings.add(stored);
                        }
                    }
                    if (storedEmbeddings != null && !storedEmbeddings.isEmpty()) {
                        double minDistance = Double.MAX_VALUE;
                        for (double[] stored : storedEmbeddings) {
                            double dist = euclideanDistance(incomingDescArray, stored);
                            if (dist < minDistance) {
                                minDistance = dist;
                            }
                        }
                        if (minDistance <= FACE_MATCH_THRESHOLD) {
                            matched = true;
                        }
                        // NOTE: /check-face uses simple threshold-only matching (no margin)
                        // because it is a pre-check for company/division selection, not
                        // the final security gate. The final gate is /face-login.
                    }
                }
                // Legacy pixel comparison DISABLED: unreliable and security-insecure.
                // Users enrolled without descriptors must re-enroll using face registration.
                if (matched)
                    matchedUser = user;
            }
        } else {
            // No username â€” scan all active users
            java.util.List<UserCredential> allUsers = userRepository.findAll();
            for (UserCredential user : allUsers) {
                if (user.getStatus() == null || user.getStatus() != 1)
                    continue;
                boolean matched = false;
                if (hasDescriptor && incomingDescArray != null) {
                    List<double[]> storedEmbeddings = parseEmbeddings(user.getFaceEmbeddings());
                    if (storedEmbeddings == null || storedEmbeddings.isEmpty()) {
                        double[] stored = parseDescriptor(user.getFaceDescriptor());
                        if (stored != null) {
                            storedEmbeddings = new ArrayList<>();
                            storedEmbeddings.add(stored);
                        }
                    }
                    if (storedEmbeddings != null && !storedEmbeddings.isEmpty()) {
                        double minDistance = Double.MAX_VALUE;
                        for (double[] stored : storedEmbeddings) {
                            double dist = euclideanDistance(incomingDescArray, stored);
                            if (dist < minDistance) minDistance = dist;
                        }
                        if (minDistance <= FACE_MATCH_THRESHOLD) {
                            matched = true;
                        }
                    }
                }
                if (matched) {
                    matchedUser = user;
                    break;
                }
            }
        }

        if (matchedUser != null) {
            // Detect legacy template enrollment (enrolled before quality hardening)
            boolean isLegacyTemplate = matchedUser.getFaceTemplateVersion() == null
                    || "LEGACY".equalsIgnoreCase(matchedUser.getFaceTemplateVersion());
            // Validate Preferred Auth Method
            if (matchedUser.getAuthMethod() != null && "PASSWORD".equalsIgnoreCase(matchedUser.getAuthMethod())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Face ID login is disabled for this account. Please use Password login.");
                return ResponseEntity.status(403).body(error);
            }

            java.util.List<Map<String, Object>> matches = new java.util.ArrayList<>();

            java.util.List<com.autonoma.erp.model.admin.UserCompanyMapping> compMappings = userCompanyMappingRepository
                    .findByUserId(matchedUser.getUserId());

            java.util.List<com.autonoma.erp.model.admin.UserDivisionMapping> divMappings = userDivisionMappingRepository
                    .findByUserId(matchedUser.getUserId());

            boolean isSuperUser = "admin".equalsIgnoreCase(matchedUser.getUserId())
                    || (matchedUser.getUserLevel() != null
                            && matchedUser.getUserLevel() >= AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN);

            if (isSuperUser) {
                java.util.List<com.autonoma.erp.model.admin.CompanyCredential> allCompanies = companyCredentialRepository
                        .findAll();
                for (com.autonoma.erp.model.admin.CompanyCredential company : allCompanies) {
                    java.util.List<com.autonoma.erp.modules.master.organization.entity.Division> divisions = divisionService
                            .getActiveDivisionsByCompany(company.getId());
                    Map<String, Object> match = new HashMap<>();
                    match.put("company", company);
                    match.put("divisions", divisions);
                    matches.add(match);
                }
            } else {
                java.util.Set<Long> mappedDivIds = divMappings.stream()
                        .map(com.autonoma.erp.model.admin.UserDivisionMapping::getDivisionId)
                        .collect(java.util.stream.Collectors.toSet());

                for (com.autonoma.erp.model.admin.UserCompanyMapping mapping : compMappings) {
                    companyCredentialRepository.findById(mapping.getCompanyId()).ifPresent(company -> {
                        java.util.List<com.autonoma.erp.modules.master.organization.entity.Division> divisions = divisionService
                                .getActiveDivisionsByCompany(company.getId())
                                .stream()
                                .filter(d -> mappedDivIds.contains(d.getId()))
                                .collect(java.util.stream.Collectors.toList());

                        Map<String, Object> match = new HashMap<>();
                        match.put("company", company);
                        match.put("divisions", divisions);
                        matches.add(match);
                    });
                }
            }

            if (matches.isEmpty() && !isSuperUser) {
                java.util.List<com.autonoma.erp.model.admin.CompanyCredential> allCompanies = companyCredentialRepository
                        .findAll();
                if (!allCompanies.isEmpty()) {
                    com.autonoma.erp.model.admin.CompanyCredential defaultComp = allCompanies.get(0);
                    java.util.List<com.autonoma.erp.modules.master.organization.entity.Division> divisions = divisionService
                            .getActiveDivisionsByCompany(defaultComp.getId());

                    try {
                        com.autonoma.erp.model.admin.UserCompanyMapping compMapping = new com.autonoma.erp.model.admin.UserCompanyMapping();
                        compMapping.setUserId(matchedUser.getUserId());
                        compMapping.setCompanyId(defaultComp.getId());
                        userCompanyMappingRepository.save(compMapping);

                        for (com.autonoma.erp.modules.master.organization.entity.Division div : divisions) {
                            com.autonoma.erp.model.admin.UserDivisionMapping divMapping = new com.autonoma.erp.model.admin.UserDivisionMapping();
                            divMapping.setUserId(matchedUser.getUserId());
                            divMapping.setDivisionId(div.getId());
                            divMapping.setCreatedBy("admin");
                            divMapping.setCreatedAt(new java.util.Date());
                            userDivisionMappingRepository.save(divMapping);
                        }
                    } catch (Exception ex) {
                    }

                    Map<String, Object> match = new HashMap<>();
                    match.put("company", defaultComp);
                    match.put("divisions", divisions);
                    matches.add(match);
                }
            }

            Map<String, Object> bodyResult = new HashMap<>();
            bodyResult.put("matches", matches);
            bodyResult.put("userId", matchedUser.getUserId());

            return ResponseEntity.ok()
                    .header("x-is-bos-admin", isSuperUser ? "1" : "0")
                    .body(bodyResult);
        }

        Map<String, String> error = new HashMap<>();
        error.put("message", "Facial recognition verification failed. Face does not match any registered user.");
        faceAuthService.logAuthAttempt(loginRequest.getUsername(), "FAILED", "Face verification failed", null, request);
        return ResponseEntity.status(401).body(error);
    }

    @PostMapping("/face-login")
    public ResponseEntity<?> faceLogin(@RequestBody FaceLoginRequest loginRequest, HttpServletRequest request) {
        long startTime = System.currentTimeMillis();
        String usernameInput = loginRequest.getUsername();
        com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");

        // Extract and validate multi-frame descriptors
        double[][] frames = loginRequest.extractFaceDescriptors(OBJECT_MAPPER);

        // ZERO SILENT FALLBACK: Face login strictly requires at least 3 valid frames.
        // Single-frame login is completely disabled to prevent false acceptances.
        if (frames == null || frames.length < 3) {
            log.warn("[FaceLogin] REJECTED: only {}/3 frames provided for user '{}'",
                    frames != null ? frames.length : 0, usernameInput != null ? usernameInput : "anonymous");
            Map<String, String> error = new HashMap<>();
            error.put("message", "Multi-frame verification requires 3 captured face frames. Single-frame login is disabled for security.");
            return ResponseEntity.status(400).body(error);
        }

        log.info("[FaceLogin] received frames = {}", frames.length);
        log.info("[FaceLogin] multi-frame verification started");

        // ── STEP 1: Secure Multi-Frame Face Matching (User-Level Top-1/Top-2 with Margin) ──
        com.autonoma.erp.service.admin.FaceDescriptorCacheService.MatchResult matchResult;

        if (usernameInput != null && !usernameInput.trim().isEmpty()) {
            // 1:1 multi-frame verification
            matchResult = faceDescriptorCacheService.verifyUserMultiFrame(
                    usernameInput.trim(), frames, FACE_MATCH_THRESHOLD, FACE_MIN_MARGIN);
        } else {
            // 1:N multi-frame global scan identification
            matchResult = faceDescriptorCacheService.findMatchMultiFrame(
                    frames, FACE_MATCH_THRESHOLD, FACE_MIN_MARGIN);
        }

        long matchTime = System.currentTimeMillis() - startTime;

        if (matchResult.rejected) {
            log.warn("[FaceLogin] Secure reject in {}ms — reason: {}", matchTime, matchResult.rejectReason);
            faceAuthService.logAuthAttempt(usernameInput, "FAILED", matchResult.rejectReason, null, request);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Face not recognized. Please look directly at the camera and try again.");
            return ResponseEntity.status(401).body(error);
        }

        String matchedUserId = matchResult.userId;
        log.info("[FaceLogin] Secure match found in {}ms: user='{}' dist={} margin={}",
                matchTime, matchedUserId,
                String.format("%.4f", matchResult.bestDistance),
                String.format("%.4f", matchResult.margin));

        Optional<UserCredential> userOpt = userRepository.findByUserId(matchedUserId);
        UserCredential matchedUser = userOpt.orElse(null);

        if (matchedUser != null) {
            UserCredential user = matchedUser;
            boolean isLegacyTemplate = user.getFaceTemplateVersion() == null
                    || "LEGACY".equalsIgnoreCase(user.getFaceTemplateVersion());

            if (user.getAuthMethod() != null && "PASSWORD_ONLY".equalsIgnoreCase(user.getAuthMethod())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Face ID login is disabled for this account. Please use Password login.");
                return ResponseEntity.status(403).body(error);
            }

            if (user.getStatus() != null && user.getStatus() != 1) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Account is inactive");
                return ResponseEntity.status(403).body(error);
            }

            java.util.List<com.autonoma.erp.model.admin.CompanyCredential> configs = companyCredentialRepository.findAll();
            boolean allowDuplicateScreensFace = false;
            boolean allowRightClickFace = true;
            if (!configs.isEmpty()) {
                com.autonoma.erp.model.admin.CompanyCredential config = configs.get(0);
                allowDuplicateScreensFace = Boolean.TRUE.equals(config.getAllowDuplicateScreens());
                allowRightClickFace = config.getAllowRightClick() == null || Boolean.TRUE.equals(config.getAllowRightClick());
            }

            com.autonoma.erp.modules.platform.identity.dto.EnterpriseValidationResult valResult =
                    enterpriseClientValidationService != null ? enterpriseClientValidationService.validateClient()
                    : com.autonoma.erp.modules.platform.identity.dto.EnterpriseValidationResult.builder().valid(true).message("Validation bypassed").build();
            if (!valResult.isValid()) {
                log.error("[FaceLogin] License/Client validation failed for user '{}': {}", user.getUserId(), valResult.getMessage());
                Map<String, String> error = new HashMap<>();
                error.put("message", valResult.getMessage());
                error.put("errorCode", valResult.getErrorCode());
                return ResponseEntity.status(403).body(error);
            }

            boolean isSuperBoss = (user != null && ("SUPER BOSS".equalsIgnoreCase(user.getUserId())
                    || (user.getUserLevel() != null && user.getUserLevel() >= 5)));

            if (!isSuperBoss) {
                Long targetCompanyId = null;
                if (loginRequest.getTenantId() != null && !loginRequest.getTenantId().trim().isEmpty() && !"AUTONOMA".equalsIgnoreCase(loginRequest.getTenantId().trim())) {
                    targetCompanyId = configs.stream()
                            .filter(c -> loginRequest.getTenantId().trim().equalsIgnoreCase(c.getDbSourceName()))
                            .map(com.autonoma.erp.model.admin.CompanyCredential::getId)
                            .findFirst().orElse(null);
                }
                if (targetCompanyId == null && !configs.isEmpty()) {
                    targetCompanyId = configs.get(0).getId();
                }

                com.autonoma.erp.dto.security.SecurityValidationResult secVal = loginSecurityService.validateLoginAccess(
                        request, user.getUserId(), targetCompanyId, loginRequest.getDeviceIdentifier(), loginRequest.getMacAddress()
                );
                if (!secVal.isAllowed()) {
                    Map<String, String> error = new HashMap<>();
                    error.put("message", secVal.getUserMessage());
                    return ResponseEntity.status(403).body(error);
                }
            }

            if (loginRequest.getTenantId() != null && !loginRequest.getTenantId().trim().isEmpty()) {
                try {
                    tenantDataSourceService.createTenantDataSource(loginRequest.getTenantId().trim());
                    com.autonoma.erp.config.TenantContextHolder.setTenantId(loginRequest.getTenantId().trim());
                } catch (Exception e) {
                    com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
                }
            }
            if (loginRequest.getDivisionId() != null) {
                com.autonoma.erp.config.DivisionContextHolder.setDivisionId(loginRequest.getDivisionId());
            }

            // Check Single Active Session policy for Face Login
            Long resolvedCompId = null;
            if (!configs.isEmpty()) {
                resolvedCompId = configs.get(0).getId();
            }
            if (!Boolean.TRUE.equals(loginRequest.getConfirmTakeover())) {
                Optional<com.autonoma.erp.service.admin.UserSessionService.ActiveSessionInfo> existingSessionOpt =
                        userSessionService.checkActiveSession(user.getUserId(), resolvedCompId);
                if (existingSessionOpt.isPresent()) {
                    com.autonoma.erp.service.admin.UserSessionService.ActiveSessionInfo info = existingSessionOpt.get();
                    Map<String, Object> conflictResp = new HashMap<>();
                    conflictResp.put("errorCode", "ALREADY_LOGGED_IN");
                    conflictResp.put("message", "User is already logged in on another system.");
                    Map<String, Object> sessMap = new HashMap<>();
                    sessMap.put("deviceName", info.getDeviceName() != null ? info.getDeviceName() : "System");
                    sessMap.put("ipAddress", info.getIpAddress() != null ? info.getIpAddress() : "");
                    sessMap.put("networkIp", info.getNetworkIp() != null ? info.getNetworkIp() : "127.0.0.1");
                    sessMap.put("systemIp", info.getSystemIp() != null ? info.getSystemIp() : "192.168.1.100");
                    sessMap.put("loginTime", info.getLoginTime());
                    sessMap.put("lastActivity", info.getLastActivity());
                    sessMap.put("userId", info.getUserId());
                    sessMap.put("deviceId", info.getDeviceId());
                    sessMap.put("userLevel", info.getUserLevel());
                    conflictResp.put("existingSession", sessMap);
                    return ResponseEntity.status(409).body(conflictResp);
                }
            }

            com.autonoma.erp.model.admin.UserSession userSession;
            if (Boolean.TRUE.equals(loginRequest.getConfirmTakeover())) {
                userSession = userSessionService.confirmTakeoverSession(user.getUserId(), request, request.getHeader("User-Agent"), loginRequest.getDeviceIdentifier(), null);
            } else {
                userSession = userSessionService.recordLogin(user.getUserId(), request, request.getHeader("User-Agent"), loginRequest.getDeviceIdentifier(), null);
            }

            String token = jwtService.generateToken(user.getUserId(), userSession != null ? userSession.getSessionId() : null);
            com.autonoma.erp.util.SecurityUtils.resolveAndCacheEmployeeName(user.getUserId());

            boolean isSuperUser = "admin".equalsIgnoreCase(user.getUserId())
                    || (user.getUserLevel() != null && user.getUserLevel() >= AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN);

            java.util.List<Map<String, Object>> matches = new java.util.ArrayList<>();
            java.util.List<com.autonoma.erp.model.admin.UserCompanyMapping> compMappings =
                    userCompanyMappingRepository.findByUserId(user.getUserId());
            java.util.List<com.autonoma.erp.model.admin.UserDivisionMapping> divMappings =
                    userDivisionMappingRepository.findByUserId(user.getUserId());

            if (isSuperUser) {
                java.util.List<com.autonoma.erp.model.admin.CompanyCredential> allCompanies = companyCredentialRepository.findAll();
                for (com.autonoma.erp.model.admin.CompanyCredential company : allCompanies) {
                    java.util.List<com.autonoma.erp.modules.master.organization.entity.Division> divisions =
                            divisionService.getActiveDivisionsByCompany(company.getId());
                    Map<String, Object> match = new HashMap<>();
                    match.put("company", company);
                    match.put("divisions", divisions);
                    matches.add(match);
                }
            } else {
                java.util.Set<Long> mappedDivIds = divMappings.stream()
                        .map(com.autonoma.erp.model.admin.UserDivisionMapping::getDivisionId)
                        .collect(java.util.stream.Collectors.toSet());
                for (com.autonoma.erp.model.admin.UserCompanyMapping mapping : compMappings) {
                    companyCredentialRepository.findById(mapping.getCompanyId()).ifPresent(company -> {
                        java.util.List<com.autonoma.erp.modules.master.organization.entity.Division> divisions =
                                divisionService.getActiveDivisionsByCompany(company.getId())
                                        .stream()
                                        .filter(d -> mappedDivIds.contains(d.getId()))
                                        .collect(java.util.stream.Collectors.toList());
                        Map<String, Object> match = new HashMap<>();
                        match.put("company", company);
                        match.put("divisions", divisions);
                        matches.add(match);
                    });
                }
                if (matches.isEmpty()) {
                    java.util.List<com.autonoma.erp.model.admin.CompanyCredential> allCompanies = companyCredentialRepository.findAll();
                    if (!allCompanies.isEmpty()) {
                        com.autonoma.erp.model.admin.CompanyCredential defaultComp = allCompanies.get(0);
                        java.util.List<com.autonoma.erp.modules.master.organization.entity.Division> divisions =
                                divisionService.getActiveDivisionsByCompany(defaultComp.getId());
                        try {
                            com.autonoma.erp.model.admin.UserCompanyMapping compMapping = new com.autonoma.erp.model.admin.UserCompanyMapping();
                            compMapping.setUserId(user.getUserId());
                            compMapping.setCompanyId(defaultComp.getId());
                            userCompanyMappingRepository.save(compMapping);
                            for (com.autonoma.erp.modules.master.organization.entity.Division div : divisions) {
                                com.autonoma.erp.model.admin.UserDivisionMapping divMapping = new com.autonoma.erp.model.admin.UserDivisionMapping();
                                divMapping.setUserId(user.getUserId());
                                divMapping.setDivisionId(div.getId());
                                divMapping.setCreatedBy("admin");
                                divMapping.setCreatedAt(new java.util.Date());
                                userDivisionMappingRepository.save(divMapping);
                            }
                        } catch (Exception ex) { }
                        Map<String, Object> match = new HashMap<>();
                        match.put("company", defaultComp);
                        match.put("divisions", divisions);
                        matches.add(match);
                    }
                }
            }

            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getUserId());
            userMap.put("email", user.getUserId());
            userMap.put("empId", user.getEmpId());

            String empName = "Employee " + user.getEmpId();
            if (user.getEmpId() != null) {
                java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> empOpt =
                        employeeMasterRepository.findById(user.getEmpId());
                if (empOpt.isPresent()) {
                    com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp = empOpt.get();
                    empName = emp.getEmployeeName();
                    userMap.put("departmentName", emp.getDepartment() != null ? emp.getDepartment().getDepartmentName() : "");
                    userMap.put("designationName", emp.getDesignation() != null ? emp.getDesignation().getDesignationName() : "");
                    userMap.put("employeePhotoUpload", emp.getEmployeePhotoUpload());
                    userMap.put("employeeCode", emp.getEmpCode());
                    if (emp.getOfficeMail() != null && !emp.getOfficeMail().isEmpty()) {
                        userMap.put("email", emp.getOfficeMail());
                    }
                }
            }
            userMap.put("name", empName);
            userMap.put("role", "ADMIN");
            userMap.put("imgName", user.getImgName());
            userMap.put("userLevel", user.getUserLevel());
            userMap.put("autoLogoutOnFaceAbsence", user.getAutoLogoutOnFaceAbsence());
            userMap.put("faceDescriptor", user.getFaceDescriptor());

            enrichUserMapWithTenantInfo(userMap, loginRequest.getTenantId(), loginRequest.getDivisionId());

            Map<String, Object> response = new HashMap<>();
            response.put("serviceToken", token);
            response.put("allowDuplicateScreens", allowDuplicateScreensFace);
            response.put("allowRightClick", allowRightClickFace);
            response.put("user", userMap);
            response.put("userId", user.getUserId());
            response.put("matches", matches); 
            response.put("faceReenrollmentRecommended", isLegacyTemplate);

            long totalTime = System.currentTimeMillis() - startTime;
            log.info("[FaceLogin] Authentication SUCCESS for user '{}' in {}ms (legacy={} dist={} margin={})",
                    user.getUserId(), totalTime, isLegacyTemplate,
                    String.format("%.4f", matchResult.bestDistance),
                    String.format("%.4f", matchResult.margin));

            faceAuthService.logAuthAttempt(user.getUserId(), "SUCCESS", "Face login successful", null, request);

            boolean finalIsSuperUser = isSuperUser;
            return ResponseEntity.ok()
                    .header("x-is-bos-admin", finalIsSuperUser ? "1" : "0")
                    .body(response);
        }

        Map<String, String> error = new HashMap<>();
        error.put("message", "Face not recognized. Please look directly at the camera and try again.");
        faceAuthService.logAuthAttempt(usernameInput, "FAILED", "Face verification failed â€” no cache match", null, request);
        return ResponseEntity.status(401).body(error);
    }


    // â”€â”€â”€ Face Descriptor (Embedding) Comparison â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * Parse a JSON descriptor string "[0.1, 0.2, ...]" into a double array.
     */
    private double[] parseDescriptor(String json) {
        if (json == null || json.isBlank())
            return null;
        try {
            return OBJECT_MAPPER.readValue(json, double[].class);
        } catch (Exception e) {
            System.err.println("[FaceAuth] Failed to parse descriptor: " + e.getMessage());
            return null;
        }
    }

    private List<double[]> parseEmbeddings(String json) {
        if (json == null || json.isBlank())
            return null;
        try {
            // The frontend sends an array of objects: [{descriptor: [...], quality: 98,
            // pose: "front"}, ...]
            List<Map<String, Object>> objects = OBJECT_MAPPER.readValue(json, new TypeReference<List<Map<String, Object>>>() {
            });
            List<double[]> embeddings = new ArrayList<>();

            for (Map<String, Object> obj : objects) {
                if (obj.containsKey("descriptor")) {
                    Object descObj = obj.get("descriptor");
                    if (descObj instanceof List) {
                        List<Number> numList = (List<Number>) descObj;
                        double[] arr = new double[numList.size()];
                        for (int i = 0; i < numList.size(); i++) {
                            arr[i] = numList.get(i).doubleValue();
                        }
                        embeddings.add(arr);
                    }
                }
            }
            return embeddings.isEmpty() ? null : embeddings;
        } catch (Exception e) {
            System.err.println("[FaceAuth] Failed to parse embeddings: " + e.getMessage());
            return null;
        }
    }

    /**
     * Euclidean distance between two 128-D face descriptors.
     * Distance â‰¤ 0.6 â†’ same person (face-api.js industry standard).
     */
    private double euclideanDistance(double[] d1, double[] d2) {
        if (d1 == null || d2 == null || d1.length != d2.length)
            return Double.MAX_VALUE;
        double sum = 0;
        for (int i = 0; i < d1.length; i++) {
            double diff = d1[i] - d2[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }

    // ── Face Auth Security Constants (starting values — calibrate against your enrolled users) ──
    //
    // FACE_MATCH_THRESHOLD: Maximum euclidean distance accepted as a match.
    //   Reduced from 0.60 (library default) to 0.42 (enterprise security grade).
    //   Lower = stricter. Calibrate by measuring intra-user and inter-user distances
    //   on your actual enrolled population and camera setup.
    //
    // FACE_MIN_MARGIN: Minimum required gap between Top-1 user score and Top-2 user score.
    //   If the gap is below this value, the match is ambiguous → REJECTED.
    //   Prevents wrong-user login when two users have similar face distances.
    private static final double FACE_MATCH_THRESHOLD = 0.50;
    private static final double FACE_MIN_MARGIN = 0.02;

    /**
     * @deprecated Internal helper preserved for check-face/check-credentials path.
     *             New face-login uses FaceDescriptorCacheService.findMatchSecure().
     */
    @Deprecated
    private boolean compareDescriptors(String incomingJson, String storedJson) {
        double[] incoming = parseDescriptor(incomingJson);
        double[] stored = parseDescriptor(storedJson);
        if (incoming == null || stored == null) return false;
        double dist = euclideanDistance(incoming, stored);
        return dist <= FACE_MATCH_THRESHOLD;
    }

    /**
     * Legacy pixel-level comparison â€” kept as fallback for users who enrolled
     * before the descriptor upgrade. Less accurate but still functional.
     */
    private boolean compareFaces(byte[] webcamImageBytes, byte[] storedImageBytes) {
        try {
            java.awt.image.BufferedImage webcamImg = javax.imageio.ImageIO
                    .read(new java.io.ByteArrayInputStream(webcamImageBytes));
            java.awt.image.BufferedImage storedImg = javax.imageio.ImageIO
                    .read(new java.io.ByteArrayInputStream(storedImageBytes));
            if (webcamImg == null || storedImg == null)
                return false;
            java.awt.image.BufferedImage webcamResized = resizeImage(webcamImg, 64, 64);
            java.awt.image.BufferedImage storedResized = resizeImage(storedImg, 64, 64);
            long diffSum = 0;
            for (int y = 0; y < 64; y++) {
                for (int x = 0; x < 64; x++) {
                    int rw = webcamResized.getRGB(x, y), rs = storedResized.getRGB(x, y);
                    int gw = (int) (0.299 * ((rw >> 16) & 0xff) + 0.587 * ((rw >> 8) & 0xff) + 0.114 * (rw & 0xff));
                    int gs = (int) (0.299 * ((rs >> 16) & 0xff) + 0.587 * ((rs >> 8) & 0xff) + 0.114 * (rs & 0xff));
                    diffSum += Math.abs(gw - gs);
                }
            }
            double avgDiff = (double) diffSum / (64 * 64);
            System.out.println("[FaceAuth][Legacy] Pixel diff: " + avgDiff);
            return avgDiff <= 70.0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private java.awt.image.BufferedImage resizeImage(java.awt.image.BufferedImage src, int w, int h) {
        java.awt.image.BufferedImage dst = new java.awt.image.BufferedImage(w, h,
                java.awt.image.BufferedImage.TYPE_BYTE_GRAY);
        java.awt.Graphics2D g = dst.createGraphics();
        g.drawImage(src, 0, 0, w, h, null);
        g.dispose();
        return dst;
    }
}

class LoginRequest {
    private String username;
    private String password;
    private String clientCode;
    private String tenantId;
    private Long divisionId;
    private String deviceIdentifier;
    private String macAddress;

    public String getUsername() {
        if (username != null && !username.trim().isEmpty()) return username;
        return "";
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setEmail(String email) {
        if (this.username == null || this.username.trim().isEmpty()) {
            this.username = email;
        }
    }

    public void setUserId(String userId) {
        if (this.username == null || this.username.trim().isEmpty()) {
            this.username = userId;
        }
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getClientCode() {
        return clientCode;
    }

    public void setClientCode(String clientCode) {
        this.clientCode = clientCode;
    }

    public void setCompanyCode(String companyCode) {
        this.clientCode = companyCode;
    }

    public void setCode(String code) {
        this.clientCode = code;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public Long getDivisionId() {
        return divisionId;
    }

    public void setDivisionId(Long divisionId) {
        this.divisionId = divisionId;
    }

    public String getDeviceIdentifier() {
        return deviceIdentifier;
    }

    public void setDeviceIdentifier(String deviceIdentifier) {
        this.deviceIdentifier = deviceIdentifier;
    }

    public void setDeviceId(String deviceId) {
        this.deviceIdentifier = deviceId;
    }

    public String getMacAddress() {
        return macAddress;
    }

    public void setMacAddress(String macAddress) {
        this.macAddress = macAddress;
    }

    public void setMac(String mac) {
        this.macAddress = mac;
    }

    private Boolean confirmTakeover = false;

    public Boolean getConfirmTakeover() {
        return confirmTakeover;
    }

    public void setConfirmTakeover(Boolean confirmTakeover) {
        this.confirmTakeover = confirmTakeover;
    }

    public void setForceLogin(Boolean forceLogin) {
        this.confirmTakeover = forceLogin;
    }
}

class FaceLoginRequest {
    private String username;
    private String faceImage;
    private String clientCode;
    private String tenantId;
    private Long divisionId;
    /** Single 128-D descriptor (backward compat / single-frame fallback). */
    private String faceDescriptor;
    /**
     * Multi-frame descriptors — preferred for security.
     * Each element is one 128-D descriptor JSON string from a separate captured frame.
     * Backend uses median aggregate + Top-1/Top-2 margin across all frames.
     */
    private Object faceDescriptors;
    private String deviceIdentifier;
    private String macAddress;
    private Boolean confirmTakeover = false;

    public Boolean getConfirmTakeover() {
        return confirmTakeover;
    }

    public void setConfirmTakeover(Boolean confirmTakeover) {
        this.confirmTakeover = confirmTakeover;
    }

    public void setForceLogin(Boolean forceLogin) {
        this.confirmTakeover = forceLogin;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFaceImage() {
        return faceImage;
    }

    public void setFaceImage(String faceImage) {
        this.faceImage = faceImage;
    }

    public String getClientCode() {
        return clientCode;
    }

    public void setClientCode(String clientCode) {
        this.clientCode = clientCode;
    }

    public void setCompanyCode(String companyCode) {
        this.clientCode = companyCode;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public Long getDivisionId() {
        return divisionId;
    }

    public void setDivisionId(Long divisionId) {
        this.divisionId = divisionId;
    }

    public String getFaceDescriptor() {
        return faceDescriptor;
    }

    public void setFaceDescriptor(String faceDescriptor) {
        this.faceDescriptor = faceDescriptor;
    }

    public Object getFaceDescriptors() {
        return faceDescriptors;
    }

    public void setFaceDescriptors(Object faceDescriptors) {
        this.faceDescriptors = faceDescriptors;
    }

    /**
     * Extracts and validates the 128-D multi-frame descriptors array.
     * Supports:
     * - List of List<Number> (raw JSON array of number arrays: [[0.1,...], [0.2,...]])
     * - List of String (JSON-encoded descriptor strings)
     * - Single JSON string representing an array of arrays
     *
     * Returns an array of double[128] arrays.
     */
    public double[][] extractFaceDescriptors(com.fasterxml.jackson.databind.ObjectMapper mapper) {
        java.util.List<double[]> result = new java.util.ArrayList<>();

        if (faceDescriptors != null) {
            if (faceDescriptors instanceof java.util.List) {
                java.util.List<?> list = (java.util.List<?>) faceDescriptors;
                for (Object item : list) {
                    if (item instanceof java.util.List) {
                        java.util.List<?> numList = (java.util.List<?>) item;
                        if (numList.size() == 128) {
                            double[] arr = new double[128];
                            for (int i = 0; i < 128; i++) {
                                arr[i] = ((Number) numList.get(i)).doubleValue();
                            }
                            result.add(arr);
                        }
                    } else if (item instanceof String) {
                        try {
                            double[] arr = mapper.readValue((String) item, double[].class);
                            if (arr != null && arr.length == 128) {
                                result.add(arr);
                            }
                        } catch (Exception ignored) {}
                    } else if (item instanceof double[]) {
                        double[] arr = (double[]) item;
                        if (arr.length == 128) result.add(arr);
                    }
                }
            } else if (faceDescriptors instanceof String) {
                try {
                    java.util.List<?> list = mapper.readValue((String) faceDescriptors, java.util.List.class);
                    for (Object item : list) {
                        if (item instanceof java.util.List) {
                            java.util.List<?> numList = (java.util.List<?>) item;
                            if (numList.size() == 128) {
                                double[] arr = new double[128];
                                for (int i = 0; i < 128; i++) {
                                    arr[i] = ((Number) numList.get(i)).doubleValue();
                                }
                                result.add(arr);
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }
        }

        return result.toArray(new double[0][]);
    }

    public String getDeviceIdentifier() {
        return deviceIdentifier;
    }

    public void setDeviceIdentifier(String deviceIdentifier) {
        this.deviceIdentifier = deviceIdentifier;
    }

    public void setDeviceId(String deviceId) {
        this.deviceIdentifier = deviceId;
    }

    public String getMacAddress() {
        return macAddress;
    }

    public void setMacAddress(String macAddress) {
        this.macAddress = macAddress;
    }

    public void setMac(String mac) {
        this.macAddress = mac;
    }

    public void setEmail(String email) {
        this.username = email;
    }
}
