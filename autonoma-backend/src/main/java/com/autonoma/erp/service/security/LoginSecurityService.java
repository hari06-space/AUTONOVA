package com.autonoma.erp.service.security;

import com.autonoma.erp.dto.security.*;
import com.autonoma.erp.model.security.*;
import com.autonoma.erp.repository.security.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
public class LoginSecurityService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(LoginSecurityService.class);

    private static final Pattern IPV4_PATTERN = Pattern.compile(
            "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$");

    @Autowired
    private LoginAccessConfigRepository configRepository;

    @Autowired
    private AllowedIpRepository allowedIpRepository;

    @Autowired
    private AllowedDeviceRepository allowedDeviceRepository;

    @Autowired
    private LoginAccessLogRepository loginAccessLogRepository;

    @Autowired
    private LoginSecurityAuditRepository loginSecurityAuditRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.UserRepository userRepository;

    /**
     * Resolves the real client IP address from HttpServletRequest.
     */
    public String resolveClientIp(HttpServletRequest request) {
        if (request == null)
            return "0.0.0.0";
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            ip = "127.0.0.1";
        }
        return (ip != null && !ip.isBlank()) ? ip.trim() : "0.0.0.0";
    }

    /**
     * Centralized login access validation.
     */
    public SecurityValidationResult validateLoginAccess(
            HttpServletRequest request,
            String userId,
            Long companyId,
            String clientDeviceIdentifier,
            String clientMac) {
        String clientIp = resolveClientIp(request);
        String userAgent = (request != null) ? request.getHeader("User-Agent") : "";
        if (userAgent != null && userAgent.length() > 500) {
            userAgent = userAgent.substring(0, 500);
        }

        // Header fallback for device identifier & MAC
        if ((clientDeviceIdentifier == null || clientDeviceIdentifier.isBlank()) && request != null) {
            clientDeviceIdentifier = request.getHeader("X-Device-Identifier");
        }
        if ((clientMac == null || clientMac.isBlank()) && request != null) {
            clientMac = request.getHeader("X-Device-MAC");
        }

        final String finalDeviceId = (clientDeviceIdentifier != null) ? clientDeviceIdentifier.trim() : "";
        final String finalMac = (clientMac != null) ? clientMac.trim() : "";

        // If no company context is provided, allow pass-through
        if (companyId == null) {
            return SecurityValidationResult.allowed("NO_COMPANY_CONTEXT", clientIp, finalDeviceId, finalMac);
        }

        // Super Boss Bypass Rule: User Level 5 / SUPER BOSS bypasses all restrictions
        if (userId != null && !userId.isBlank()) {
            String uTrim = userId.trim();
            if ("SUPER BOSS".equalsIgnoreCase(uTrim)) {
                recordAccessLogAsync(userId, companyId, clientIp, finalDeviceId, finalMac, "NONE", "ALLOWED",
                        "SUPER_BOSS_BYPASS", userAgent);
                return SecurityValidationResult.allowed("SUPER_BOSS_BYPASS", clientIp, finalDeviceId, finalMac);
            }
            if (userRepository != null) {
                Optional<com.autonoma.erp.model.admin.UserCredential> userOpt = userRepository.findByUserId(uTrim);
                if (!userOpt.isPresent()) {
                    userOpt = userRepository.findByUserIdIgnoreCase(uTrim);
                }
                if (userOpt.isPresent() && userOpt.get().getUserLevel() != null && userOpt.get().getUserLevel() >= 5) {
                    recordAccessLogAsync(userId, companyId, clientIp, finalDeviceId, finalMac, "NONE", "ALLOWED",
                            "SUPER_BOSS_BYPASS", userAgent);
                    return SecurityValidationResult.allowed("SUPER_BOSS_BYPASS", clientIp, finalDeviceId, finalMac);
                }
            }
        }

        Optional<LoginAccessConfig> configOpt = configRepository.findByCompanyId(companyId);
        if (!configOpt.isPresent() || Boolean.FALSE.equals(configOpt.get().getSecurityEnabled())) {
            recordAccessLogAsync(userId, companyId, clientIp, finalDeviceId, finalMac, "NONE", "ALLOWED",
                    "SECURITY_DISABLED", userAgent);
            return SecurityValidationResult.allowed("SECURITY_DISABLED", clientIp, finalDeviceId, finalMac);
        }

        LoginAccessConfig config = configOpt.get();
        String method = config.getAccessControlMethod() != null ? config.getAccessControlMethod().toUpperCase() : "IP";

        boolean ipValid = true;
        boolean deviceValid = true;
        String failureReason = null;

        Date now = new Date();

        // 1. IP Validation
        if ("IP".equals(method) || "IP_DEVICE".equals(method)) {
            List<AllowedIp> activeIps = allowedIpRepository.findByCompanyIdAndStatus(companyId, true);
            boolean foundIpMatch = false;
            for (AllowedIp allowed : activeIps) {
                if (allowed.getIpAddress() != null && isIpMatch(clientIp, allowed.getIpAddress().trim())) {
                    if (isDateActive(allowed.getValidFrom(), allowed.getValidTo(), now)) {
                        foundIpMatch = true;
                        break;
                    }
                }
            }
            if (!foundIpMatch) {
                ipValid = false;
                failureReason = "IP_NOT_ALLOWED";
            }
        }

        // 2. Device Validation
        if ("DEVICE".equals(method) || "IP_DEVICE".equals(method)) {
            if (finalDeviceId.isEmpty()) {
                deviceValid = false;
                failureReason = (failureReason == null) ? "DEVICE_NOT_REGISTERED" : failureReason;
            } else {
                Optional<AllowedDevice> deviceOpt = allowedDeviceRepository
                        .findByCompanyIdAndDeviceIdentifier(companyId, finalDeviceId);
                if (!deviceOpt.isPresent()) {
                    deviceValid = false;
                    failureReason = (failureReason == null) ? "DEVICE_NOT_REGISTERED" : failureReason;
                } else {
                    AllowedDevice dev = deviceOpt.get();
                    if (!Boolean.TRUE.equals(dev.getStatus())) {
                        deviceValid = false;
                        failureReason = (failureReason == null) ? "DEVICE_INACTIVE" : failureReason;
                    } else if (!isDateActive(dev.getValidFrom(), dev.getValidTo(), now)) {
                        deviceValid = false;
                        failureReason = (failureReason == null) ? "DEVICE_EXPIRED" : failureReason;
                    } else if (dev.getUserId() != null && !dev.getUserId().isBlank() && userId != null
                            && !dev.getUserId().equalsIgnoreCase(userId.trim())) {
                        deviceValid = false;
                        failureReason = (failureReason == null) ? "USER_DEVICE_NOT_AUTHORIZED" : failureReason;
                    } else if (!finalMac.isEmpty() && dev.getMacAddress() != null && !dev.getMacAddress().isBlank()
                            && !dev.getMacAddress().equalsIgnoreCase(finalMac)) {
                        deviceValid = false;
                        failureReason = (failureReason == null) ? "MAC_MISMATCH" : failureReason;
                    }
                }
            }
        }

        boolean allowed = false;
        if ("IP".equals(method)) {
            allowed = ipValid;
        } else if ("DEVICE".equals(method)) {
            allowed = deviceValid;
        } else if ("IP_DEVICE".equals(method)) {
            allowed = ipValid && deviceValid;
            if (!allowed && failureReason == null) {
                failureReason = "IP_AND_DEVICE_MISMATCH";
            }
        }

        String logStatus = allowed ? "ALLOWED" : "BLOCKED";
        String logReason = allowed ? "SUCCESS" : failureReason;

        recordAccessLogAsync(userId, companyId, clientIp, finalDeviceId, finalMac, method, logStatus, logReason,
                userAgent);

        if (allowed) {
            return SecurityValidationResult.allowed("ACCESS_AUTHORIZED", clientIp, finalDeviceId, finalMac);
        } else {
            return SecurityValidationResult.blocked(failureReason != null ? failureReason : "ACCESS_RESTRICTED",
                    clientIp, finalDeviceId, finalMac);
        }
    }

    private boolean isIpMatch(String clientIp, String configuredIp) {
        if (clientIp == null || configuredIp == null)
            return false;
        if (clientIp.equalsIgnoreCase(configuredIp))
            return true;
        // Localhost mappings
        if (("127.0.0.1".equals(clientIp) || "localhost".equalsIgnoreCase(clientIp)) &&
                ("127.0.0.1".equals(configuredIp) || "localhost".equalsIgnoreCase(configuredIp))) {
            return true;
        }
        return false;
    }

    private boolean isDateActive(Date validFrom, Date validTo, Date now) {
        if (validFrom != null && now.before(validFrom))
            return false;
        if (validTo != null && now.after(validTo))
            return false;
        return true;
    }

    @Async
    public void recordAccessLogAsync(
            String userId, Long companyId, String ip, String deviceId, String mac,
            String method, String status, String reason, String userAgent) {
        try {
            LoginAccessLog logEntry = new LoginAccessLog();
            logEntry.setUserId(userId);
            logEntry.setUsername(userId);
            logEntry.setCompanyId(companyId);
            logEntry.setLoginDateTime(new Date());
            logEntry.setSourceIp(ip);
            logEntry.setDeviceIdentifier(deviceId);
            logEntry.setMacAddress(mac);
            logEntry.setAccessControlMethod(method);
            logEntry.setLoginStatus(status);
            logEntry.setFailureReason(reason);
            logEntry.setUserAgent(userAgent);
            logEntry.setCreatedDate(new Date());
            loginAccessLogRepository.save(logEntry);
        } catch (Exception e) {
            log.warn("Failed to record security access log asynchronously: {}", e.getMessage());
        }
    }

    // =========================================================================
    // CONFIGURATION MANAGEMENT
    // =========================================================================

    @Transactional(readOnly = true)
    public LoginSecurityConfigDTO getConfig(Long companyId) {
        LoginAccessConfig config = configRepository.findByCompanyId(companyId)
                .orElseGet(() -> {
                    LoginAccessConfig def = new LoginAccessConfig();
                    def.setCompanyId(companyId);
                    def.setSecurityEnabled(false);
                    def.setAccessControlMethod("IP");
                    def.setStatus(true);
                    def.setCreatedBy("SYSTEM");
                    def.setCreatedDate(new Date());
                    return configRepository.save(def);
                });

        long activeIps = allowedIpRepository.countByCompanyIdAndStatus(companyId, true);
        long activeDevices = allowedDeviceRepository.countByCompanyIdAndStatus(companyId, true);
        long blockedCount = loginAccessLogRepository.countByCompanyIdAndLoginStatusIgnoreCase(companyId, "BLOCKED");

        LoginSecurityConfigDTO result = new LoginSecurityConfigDTO();
        result.setId(config.getId());
        result.setCompanyId(config.getCompanyId());
        result.setSecurityEnabled(config.getSecurityEnabled());
        result.setAccessControlMethod(config.getAccessControlMethod());
        result.setStatus(config.getStatus());
        result.setActiveIpCount(activeIps);
        result.setActiveDeviceCount(activeDevices);
        result.setRecentBlockedCount(blockedCount);
        result.setCreatedBy(config.getCreatedBy());
        result.setCreatedDate(config.getCreatedDate());
        result.setUpdatedBy(config.getUpdatedBy());
        result.setUpdatedDate(config.getUpdatedDate());
        return result;
    }

    @Transactional
    public LoginSecurityConfigDTO updateConfig(
            Long companyId,
            LoginSecurityConfigDTO dto,
            String adminUser,
            String currentIp,
            String currentDeviceId) {
        LoginAccessConfig config = configRepository.findByCompanyId(companyId)
                .orElseGet(() -> {
                    LoginAccessConfig n = new LoginAccessConfig();
                    n.setCompanyId(companyId);
                    n.setCreatedBy(adminUser);
                    n.setCreatedDate(new Date());
                    return n;
                });

        boolean enabling = Boolean.TRUE.equals(dto.getSecurityEnabled())
                && !Boolean.TRUE.equals(config.getSecurityEnabled());
        String newMethod = dto.getAccessControlMethod() != null ? dto.getAccessControlMethod().toUpperCase() : "IP";

        // Admin lockout prevention check when enabling
        if (enabling || (Boolean.TRUE.equals(dto.getSecurityEnabled()))) {
            validateLockoutSafety(companyId, newMethod);
        }

        String oldEnabled = String.valueOf(config.getSecurityEnabled());
        String oldMethod = config.getAccessControlMethod();

        config.setSecurityEnabled(Boolean.TRUE.equals(dto.getSecurityEnabled()));
        config.setAccessControlMethod(newMethod);
        config.setStatus(true);
        config.setUpdatedBy(adminUser);
        config.setUpdatedDate(new Date());
        LoginAccessConfig saved = configRepository.save(config);

        // Audit Trail
        if (!Objects.equals(oldEnabled, String.valueOf(saved.getSecurityEnabled()))) {
            auditAction(companyId, saved.getSecurityEnabled() ? "LOGIN_SECURITY_ENABLED" : "LOGIN_SECURITY_DISABLED",
                    oldEnabled, String.valueOf(saved.getSecurityEnabled()), "Admin toggled login security", adminUser);
        }
        if (!Objects.equals(oldMethod, saved.getAccessControlMethod())) {
            auditAction(companyId, "ACCESS_METHOD_CHANGED", oldMethod, saved.getAccessControlMethod(),
                    "Admin changed access control method to " + saved.getAccessControlMethod(), adminUser);
        }

        return getConfig(companyId);
    }

    public void validateLockoutSafety(Long companyId, String method) {
        long activeIps = allowedIpRepository.countByCompanyIdAndStatus(companyId, true);
        long activeDevices = allowedDeviceRepository.countByCompanyIdAndStatus(companyId, true);

        if ("IP".equals(method) && activeIps == 0) {
            throw new IllegalArgumentException(
                    "Cannot enable IP-based Login Security. At least one active allowed IP address is required.");
        }
        if ("DEVICE".equals(method) && activeDevices == 0) {
            throw new IllegalArgumentException(
                    "Cannot enable Device-based Login Security. At least one active registered device is required.");
        }
        if ("IP_DEVICE".equals(method)) {
            if (activeIps == 0) {
                throw new IllegalArgumentException(
                        "Cannot enable IP + Device security. At least one active allowed IP is required.");
            }
            if (activeDevices == 0) {
                throw new IllegalArgumentException(
                        "Cannot enable IP + Device security. At least one active registered device is required.");
            }
        }
    }

    // =========================================================================
    // IP MANAGEMENT
    // =========================================================================

    @Transactional(readOnly = true)
    public List<AllowedIpDTO> getAllowedIps(Long companyId) {
        List<AllowedIp> list = allowedIpRepository.findByCompanyIdOrderByCreatedDateDesc(companyId);
        List<AllowedIpDTO> dtos = new ArrayList<>();
        for (AllowedIp ip : list) {
            dtos.add(toIpDTO(ip));
        }
        return dtos;
    }

    @Transactional
    public AllowedIpDTO saveAllowedIp(Long companyId, AllowedIpDTO dto, String adminUser) {
        if (dto.getIpAddress() == null || dto.getIpAddress().trim().isEmpty()) {
            throw new IllegalArgumentException("IP Address is mandatory");
        }
        String cleanIp = dto.getIpAddress().trim();
        validateIpFormat(cleanIp);

        AllowedIp ipEntity;
        boolean isNew = (dto.getId() == null);
        if (isNew) {
            // Check duplicates
            Optional<AllowedIp> existing = allowedIpRepository.findByCompanyIdAndIpAddress(companyId, cleanIp);
            if (existing.isPresent()) {
                throw new IllegalArgumentException(
                        "IP Address '" + cleanIp + "' is already configured for this company.");
            }
            ipEntity = new AllowedIp();
            ipEntity.setCompanyId(companyId);
            ipEntity.setCreatedBy(adminUser);
            ipEntity.setCreatedDate(new Date());
        } else {
            ipEntity = allowedIpRepository.findById(dto.getId())
                    .orElseThrow(() -> new NoSuchElementException("Allowed IP record not found"));
            if (!ipEntity.getCompanyId().equals(companyId)) {
                throw new SecurityException("Cross-company modification is prohibited");
            }
            ipEntity.setUpdatedBy(adminUser);
            ipEntity.setUpdatedDate(new Date());
        }

        ipEntity.setIpAddress(cleanIp);
        ipEntity.setDescription(dto.getDescription());
        ipEntity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);
        ipEntity.setValidFrom(dto.getValidFrom());
        ipEntity.setValidTo(dto.getValidTo());
        ipEntity.setRemarks(dto.getRemarks());

        AllowedIp saved = allowedIpRepository.save(ipEntity);
        auditAction(companyId, isNew ? "ALLOWED_IP_ADDED" : "ALLOWED_IP_MODIFIED",
                null, cleanIp, "Admin saved allowed IP: " + cleanIp, adminUser);

        return toIpDTO(saved);
    }

    @Transactional
    public void toggleAllowedIp(Long companyId, Long id, boolean active, String adminUser) {
        AllowedIp entity = allowedIpRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Allowed IP record not found"));
        if (!entity.getCompanyId().equals(companyId)) {
            throw new SecurityException("Cross-company modification is prohibited");
        }
        Boolean oldStatus = entity.getStatus();
        entity.setStatus(active);
        entity.setUpdatedBy(adminUser);
        entity.setUpdatedDate(new Date());
        allowedIpRepository.save(entity);

        auditAction(companyId, active ? "ALLOWED_IP_ACTIVATED" : "ALLOWED_IP_DEACTIVATED",
                String.valueOf(oldStatus), String.valueOf(active), "Toggled IP: " + entity.getIpAddress(), adminUser);
    }

    @Transactional
    public void deleteAllowedIp(Long companyId, Long id, String adminUser) {
        AllowedIp entity = allowedIpRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Allowed IP record not found"));
        if (!entity.getCompanyId().equals(companyId)) {
            throw new SecurityException("Cross-company modification is prohibited");
        }
        allowedIpRepository.delete(entity);
        auditAction(companyId, "ALLOWED_IP_DELETED", entity.getIpAddress(), null,
                "Deleted IP: " + entity.getIpAddress(), adminUser);
    }

    private void validateIpFormat(String ip) {
        if ("localhost".equalsIgnoreCase(ip) || "127.0.0.1".equals(ip) || "::1".equals(ip)) {
            return;
        }
        if (!IPV4_PATTERN.matcher(ip).matches() && !ip.contains(":")) {
            throw new IllegalArgumentException("Invalid IP address format: " + ip);
        }
    }

    // =========================================================================
    // DEVICE MANAGEMENT
    // =========================================================================

    @Transactional(readOnly = true)
    public List<AllowedDeviceDTO> getRegisteredDevices(Long companyId) {
        List<AllowedDevice> list = allowedDeviceRepository.findByCompanyIdOrderByCreatedDateDesc(companyId);
        List<AllowedDeviceDTO> dtos = new ArrayList<>();
        for (AllowedDevice dev : list) {
            dtos.add(toDeviceDTO(dev));
        }
        return dtos;
    }

    @Transactional
    public AllowedDeviceDTO registerDevice(Long companyId, AllowedDeviceDTO dto, String adminUser) {
        if (dto.getDeviceName() == null || dto.getDeviceName().trim().isEmpty()) {
            throw new IllegalArgumentException("Device Name is mandatory");
        }
        if (dto.getDeviceIdentifier() == null || dto.getDeviceIdentifier().trim().isEmpty()) {
            throw new IllegalArgumentException("Device Identifier is mandatory");
        }

        String cleanIdentifier = dto.getDeviceIdentifier().trim();
        AllowedDevice entity;
        boolean isNew = (dto.getId() == null);
        if (isNew) {
            Optional<AllowedDevice> existing = allowedDeviceRepository.findByCompanyIdAndDeviceIdentifier(companyId,
                    cleanIdentifier);
            if (existing.isPresent()) {
                throw new IllegalArgumentException("Device Identifier is already registered for this company.");
            }
            entity = new AllowedDevice();
            entity.setCompanyId(companyId);
            entity.setDeviceCode(
                    dto.getDeviceCode() != null && !dto.getDeviceCode().isBlank() ? dto.getDeviceCode().trim()
                            : generateDeviceCode(companyId));
            entity.setCreatedBy(adminUser);
            entity.setCreatedDate(new Date());
        } else {
            entity = allowedDeviceRepository.findById(dto.getId())
                    .orElseThrow(() -> new NoSuchElementException("Registered Device record not found"));
            if (!entity.getCompanyId().equals(companyId)) {
                throw new SecurityException("Cross-company modification is prohibited");
            }
            entity.setUpdatedBy(adminUser);
            entity.setUpdatedDate(new Date());
        }

        entity.setDeviceName(dto.getDeviceName().trim());
        entity.setDeviceIdentifier(cleanIdentifier);
        entity.setMacAddress(dto.getMacAddress() != null ? dto.getMacAddress().trim() : null);
        entity.setIpAddress(dto.getIpAddress() != null ? dto.getIpAddress().trim() : null);
        entity.setUserId(dto.getUserId() != null && !dto.getUserId().isBlank() ? dto.getUserId().trim() : null);
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);
        entity.setValidFrom(dto.getValidFrom());
        entity.setValidTo(dto.getValidTo());
        entity.setRemarks(dto.getRemarks());

        AllowedDevice saved = allowedDeviceRepository.save(entity);
        auditAction(companyId, isNew ? "DEVICE_REGISTERED" : "DEVICE_MODIFIED",
                null, entity.getDeviceName(), "Admin registered/modified device: " + entity.getDeviceName(), adminUser);

        return toDeviceDTO(saved);
    }

    @Transactional
    public void toggleDevice(Long companyId, Long id, boolean active, String adminUser) {
        AllowedDevice entity = allowedDeviceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Device record not found"));
        if (!entity.getCompanyId().equals(companyId)) {
            throw new SecurityException("Cross-company modification is prohibited");
        }
        Boolean oldStatus = entity.getStatus();
        entity.setStatus(active);
        entity.setUpdatedBy(adminUser);
        entity.setUpdatedDate(new Date());
        allowedDeviceRepository.save(entity);

        auditAction(companyId, active ? "DEVICE_ACTIVATED" : "DEVICE_DEACTIVATED",
                String.valueOf(oldStatus), String.valueOf(active), "Toggled Device: " + entity.getDeviceName(),
                adminUser);
    }

    @Transactional
    public void deleteDevice(Long companyId, Long id, String adminUser) {
        AllowedDevice entity = allowedDeviceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Device record not found"));
        if (!entity.getCompanyId().equals(companyId)) {
            throw new SecurityException("Cross-company modification is prohibited");
        }
        allowedDeviceRepository.delete(entity);
        auditAction(companyId, "DEVICE_DELETED", entity.getDeviceName(), null,
                "Deleted Device: " + entity.getDeviceName(), adminUser);
    }

    private String generateDeviceCode(Long companyId) {
        long count = allowedDeviceRepository.countByCompanyIdAndStatus(companyId, true) + 1;
        return String.format("DEV-%04d", count);
    }

    // =========================================================================
    // LOGS & CLIENT INFO
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<LoginAccessLogDTO> getLoginLogs(Long companyId, Date fromDate, Date toDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<LoginAccessLog> logPage;
        if (fromDate != null && toDate != null) {
            logPage = loginAccessLogRepository.findByCompanyIdAndLoginDateTimeBetweenOrderByLoginDateTimeDesc(companyId,
                    fromDate, toDate, pageable);
        } else {
            logPage = loginAccessLogRepository.findByCompanyIdOrderByLoginDateTimeDesc(companyId, pageable);
        }
        return logPage.map(this::toLogDTO);
    }

    @Transactional(readOnly = true)
    public List<LoginSecurityAudit> getSecurityAudits(Long companyId) {
        return loginSecurityAuditRepository.findTop100ByCompanyIdOrderByChangedDateDesc(companyId);
    }

    public ClientInfoDTO getClientInfo(HttpServletRequest request) {
        String ip = resolveClientIp(request);
        String userAgent = (request != null) ? request.getHeader("User-Agent") : "";
        String cleanUa = (userAgent != null) ? userAgent : "";
        String suggestedName = "Workstation (" + ip + ")";
        if (cleanUa.contains("Windows"))
            suggestedName = "Windows PC (" + ip + ")";
        else if (cleanUa.contains("Macintosh"))
            suggestedName = "MacBook (" + ip + ")";
        else if (cleanUa.contains("Linux"))
            suggestedName = "Linux Workstation (" + ip + ")";

        ClientInfoDTO clientInfo = new ClientInfoDTO();
        clientInfo.setClientIp(ip);
        clientInfo.setUserAgent(cleanUa);
        clientInfo.setSuggestedDeviceCode("DEV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        clientInfo.setSuggestedDeviceName(suggestedName);
        return clientInfo;
    }

    private void auditAction(Long companyId, String action, String oldValue, String newValue, String remarks,
            String changedBy) {
        try {
            LoginSecurityAudit audit = new LoginSecurityAudit();
            audit.setCompanyId(companyId);
            audit.setAction(action);
            audit.setOldValue(oldValue);
            audit.setNewValue(newValue);
            audit.setRemarks(remarks);
            audit.setChangedBy(changedBy != null ? changedBy : "SYSTEM");
            audit.setChangedDate(new Date());
            loginSecurityAuditRepository.save(audit);
        } catch (Exception e) {
            log.warn("Failed to record login security audit: {}", e.getMessage());
        }
    }

    // =========================================================================
    // DTO MAPPERS
    // =========================================================================

    private AllowedIpDTO toIpDTO(AllowedIp ip) {
        AllowedIpDTO dto = new AllowedIpDTO();
        dto.setId(ip.getId());
        dto.setCompanyId(ip.getCompanyId());
        dto.setIpAddress(ip.getIpAddress());
        dto.setDescription(ip.getDescription());
        dto.setStatus(ip.getStatus());
        dto.setValidFrom(ip.getValidFrom());
        dto.setValidTo(ip.getValidTo());
        dto.setRemarks(ip.getRemarks());
        dto.setCreatedBy(ip.getCreatedBy());
        dto.setCreatedDate(ip.getCreatedDate());
        dto.setUpdatedBy(ip.getUpdatedBy());
        dto.setUpdatedDate(ip.getUpdatedDate());
        return dto;
    }

    private AllowedDeviceDTO toDeviceDTO(AllowedDevice dev) {
        AllowedDeviceDTO dto = new AllowedDeviceDTO();
        dto.setId(dev.getId());
        dto.setCompanyId(dev.getCompanyId());
        dto.setDeviceCode(dev.getDeviceCode());
        dto.setDeviceName(dev.getDeviceName());
        dto.setDeviceIdentifier(dev.getDeviceIdentifier());
        dto.setMacAddress(dev.getMacAddress());
        dto.setIpAddress(dev.getIpAddress());
        dto.setUserId(dev.getUserId());
        dto.setStatus(dev.getStatus());
        dto.setValidFrom(dev.getValidFrom());
        dto.setValidTo(dev.getValidTo());
        dto.setRemarks(dev.getRemarks());
        dto.setCreatedBy(dev.getCreatedBy());
        dto.setCreatedDate(dev.getCreatedDate());
        dto.setUpdatedBy(dev.getUpdatedBy());
        dto.setUpdatedDate(dev.getUpdatedDate());
        return dto;
    }

    private LoginAccessLogDTO toLogDTO(LoginAccessLog logEntry) {
        LoginAccessLogDTO dto = new LoginAccessLogDTO();
        dto.setId(logEntry.getId());
        dto.setUserId(logEntry.getUserId());
        dto.setUsername(logEntry.getUsername());
        dto.setCompanyId(logEntry.getCompanyId());
        dto.setLoginDateTime(logEntry.getLoginDateTime());
        dto.setSourceIp(logEntry.getSourceIp());
        dto.setDeviceIdentifier(logEntry.getDeviceIdentifier());
        dto.setMacAddress(logEntry.getMacAddress());
        dto.setAccessControlMethod(logEntry.getAccessControlMethod());
        dto.setLoginStatus(logEntry.getLoginStatus());
        dto.setFailureReason(logEntry.getFailureReason());
        dto.setUserAgent(logEntry.getUserAgent());
        dto.setCreatedDate(logEntry.getCreatedDate());
        return dto;
    }
}
