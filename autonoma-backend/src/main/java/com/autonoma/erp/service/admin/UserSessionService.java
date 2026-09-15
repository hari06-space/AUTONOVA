package com.autonoma.erp.service.admin;

import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.model.admin.UserSession;
import com.autonoma.erp.model.admin.UserSessionActivity;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;
import com.autonoma.erp.repository.admin.UserSessionActivityRepository;
import com.autonoma.erp.repository.admin.UserSessionRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.model.admin.UserCredential;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-03
 * Description: Production-ready service for Single Active User Session management,
 * lifecycle validation, atomic takeover, and real-time revocation.
 */
@Service
public class UserSessionService {

    private static final Logger log = LoggerFactory.getLogger(UserSessionService.class);

    // Fast in-memory cache for user last activity (epoch millis)
    private static final Map<String, Long> userLastSeenMap = new ConcurrentHashMap<>();
    // Fast in-memory cache for session last activity to throttle DB writes (session_id -> epoch millis)
    private static final Map<String, Long> sessionLastDbUpdateMap = new ConcurrentHashMap<>();
    // Fast in-memory blacklist/status cache for revoked sessions to deny access in sub-millisecond (sessionId -> status)
    private static final Map<String, String> sessionStatusCache = new ConcurrentHashMap<>();

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired
    private UserSessionActivityRepository userSessionActivityRepository;

    @Autowired
    private CompanyCredentialRepository companyCredentialRepository;

    @Autowired
    @Lazy
    private CompanyCredentialService companyCredentialService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeMasterRepository employeeMasterRepository;

    @Autowired
    private DataSource dataSource;

    @Autowired
    @Lazy
    private SimpMessagingTemplate messagingTemplate;

    public static class SessionValidationResult {
        private final boolean valid;
        private final String errorCode;
        private final String message;

        public SessionValidationResult(boolean valid, String errorCode, String message) {
            this.valid = valid;
            this.errorCode = errorCode;
            this.message = message;
        }

        public static SessionValidationResult success() {
            return new SessionValidationResult(true, null, "Session valid");
        }

        public static SessionValidationResult failure(String errorCode, String message) {
            return new SessionValidationResult(false, errorCode, message);
        }

        public boolean isValid() { return valid; }
        public String getErrorCode() { return errorCode; }
        public String getMessage() { return message; }
    }

    public static class ActiveSessionInfo {
        private String deviceName;
        private String ipAddress;
        private String networkIp;
        private String systemIp;
        private Date loginTime;
        private Date lastActivity;
        private String userId;
        private String deviceId;
        private Integer userLevel;

        public ActiveSessionInfo(String deviceName, String ipAddress, Date loginTime, Date lastActivity) {
            this.deviceName = deviceName;
            this.ipAddress = ipAddress;
            this.loginTime = loginTime;
            this.lastActivity = lastActivity;
            parseIpDetails(ipAddress);
        }

        public ActiveSessionInfo(String deviceName, String ipAddress, Date loginTime, Date lastActivity, String userId, String deviceId) {
            this.deviceName = deviceName;
            this.ipAddress = ipAddress;
            this.loginTime = loginTime;
            this.lastActivity = lastActivity;
            this.userId = userId;
            this.deviceId = deviceId;
            parseIpDetails(ipAddress);
        }

        public ActiveSessionInfo(String deviceName, String ipAddress, Date loginTime, Date lastActivity, String userId, String deviceId, Integer userLevel) {
            this.deviceName = deviceName;
            this.ipAddress = ipAddress;
            this.loginTime = loginTime;
            this.lastActivity = lastActivity;
            this.userId = userId;
            this.deviceId = deviceId;
            this.userLevel = userLevel;
            parseIpDetails(ipAddress);
        }

        private void parseIpDetails(String ip) {
            if (ip != null && ip.contains("|")) {
                String[] parts = ip.split("\\|");
                this.networkIp = parts[0].trim();
                this.systemIp = parts[1].trim();
            } else {
                this.networkIp = (ip != null && !ip.isBlank()) ? ip : "127.0.0.1";
                this.systemIp = (ip != null && !ip.isBlank()) ? ip : "192.168.1.100";
            }
        }

        public String getDeviceName() { return deviceName; }
        public String getIpAddress() { return ipAddress; }
        public String getNetworkIp() { return networkIp; }
        public String getSystemIp() { return systemIp; }
        public Date getLoginTime() { return loginTime; }
        public Date getLastActivity() { return lastActivity; }
        public String getUserId() { return userId; }
        public String getDeviceId() { return deviceId; }
        public Integer getUserLevel() { return userLevel; }
    }

    public void updateLastSeen(String userId) {
        if (userId != null) {
            userLastSeenMap.put(userId, System.currentTimeMillis());
        }
    }

    /**
     * Checks if Single Active Session policy is enabled for company and if an active session exists.
     * Returns the existing active session details if concurrent login is blocked.
     */
    public Optional<ActiveSessionInfo> checkActiveSession(String userId, Long companyId) {
        if (userId == null || userId.isBlank()) {
            return Optional.empty();
        }

        boolean isSingleActiveSessionEnabled = false;
        Optional<CompanyCredential> compOpt = Optional.empty();
        if (companyCredentialService != null) {
            if (companyId != null) {
                compOpt = companyCredentialService.findById(companyId);
            }
            if (!compOpt.isPresent()) {
                compOpt = companyCredentialService.getCompanyProfileForCurrentTenant();
            }
        }
        if (!compOpt.isPresent() && companyCredentialRepository != null) {
            if (companyId != null) {
                compOpt = companyCredentialRepository.findById(companyId);
            }
            if (!compOpt.isPresent()) {
                List<CompanyCredential> companies = companyCredentialRepository.findAll();
                if (!companies.isEmpty()) {
                    compOpt = Optional.of(companies.get(0));
                }
            }
        }

        if (compOpt.isPresent()) {
            isSingleActiveSessionEnabled = Boolean.TRUE.equals(compOpt.get().getSingleActiveSession());
        }

        log.info("[SessionCheck] isSingleActiveSessionEnabled={} for user={}", isSingleActiveSessionEnabled, userId);

        if (!isSingleActiveSessionEnabled) {
            return Optional.empty();
        }

        // Query active sessions for this user
        List<UserSession> activeSessions = userSessionRepository.findByUserIdAndStatus(userId, "ACTIVE");
        if (activeSessions != null && !activeSessions.isEmpty()) {
            long now = System.currentTimeMillis();
            long inactivityThresholdMillis = 3 * 60 * 1000; // 3 minutes inactivity threshold (heartbeat is sent every 30s)

            List<UserSession> trulyActiveSessions = new ArrayList<>();
            for (UserSession s : activeSessions) {
                Date lastAct = s.getLastActivity() != null ? s.getLastActivity() : s.getLoginTime();
                if (lastAct != null && (now - lastAct.getTime()) > inactivityThresholdMillis) {
                    // Stale session (browser closed / dead connection) - automatically expire in DB & cache
                    updateSessionStatusJdbc(s.getId(), "EXPIRED", new Date(), "INACTIVITY_TIMEOUT", null);
                    if (s.getSessionId() != null) {
                        sessionStatusCache.put(s.getSessionId(), "EXPIRED");
                    }
                    log.info("[Session] Automatically expired stale session id={} for user={}", s.getId(), userId);
                } else {
                    trulyActiveSessions.add(s);
                }
            }

            if (!trulyActiveSessions.isEmpty()) {
                UserSession existing = trulyActiveSessions.get(0);
                String devName = existing.getDeviceName();
                if (devName == null || devName.isBlank()) {
                    devName = deriveDeviceName(existing.getUserAgent(), existing.getIpAddress());
                }
                Date lastAct = existing.getLastActivity() != null ? existing.getLastActivity() : existing.getLoginTime();
                Integer uLevel = 0;
                if (userRepository != null && existing.getUserId() != null) {
                    Optional<UserCredential> uc = userRepository.findByUserIdIgnoreCase(existing.getUserId());
                    if (uc.isPresent() && uc.get().getUserLevel() != null) {
                        uLevel = uc.get().getUserLevel();
                    }
                }
                return Optional.of(new ActiveSessionInfo(devName, existing.getIpAddress(), existing.getLoginTime(), lastAct, existing.getUserId(), existing.getDeviceId(), uLevel));
            }
        }

        return Optional.empty();
    }

    /**
     * Derive human-readable device/browser name from user-agent and IP.
     */
    public String deriveDeviceName(String userAgent, String ipAddress) {
        if (userAgent == null || userAgent.isBlank()) {
            return ipAddress != null ? "Client (" + ipAddress + ")" : "Unknown System";
        }
        String ua = userAgent;
        String os = "Unknown OS";
        if (ua.contains("Windows NT 10.0")) os = "Windows 10/11";
        else if (ua.contains("Windows")) os = "Windows";
        else if (ua.contains("Macintosh") || ua.contains("Mac OS")) os = "macOS";
        else if (ua.contains("iPhone") || ua.contains("iPad")) os = "iOS Device";
        else if (ua.contains("Android")) os = "Android Device";
        else if (ua.contains("Linux")) os = "Linux";

        String browser = "Browser";
        if (ua.contains("Edg/")) browser = "Edge";
        else if (ua.contains("Chrome/")) browser = "Chrome";
        else if (ua.contains("Firefox/")) browser = "Firefox";
        else if (ua.contains("Safari/") && !ua.contains("Chrome/")) browser = "Safari";

        return browser + " on " + os;
    }

    /**
     * Extract client Network connection IP endpoint (remote IP / proxy / gateway).
     */
    public String extractNetworkIpAddress(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("X-Real-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("X-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("CF-Connecting-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }
        return ipAddress != null ? ipAddress : "127.0.0.1";
    }

    /**
     * Extract client local System LAN Machine IP (from X-System-IP header).
     */
    public String extractSystemIpAddress(HttpServletRequest request) {
        if (request == null) return "192.168.1.100";
        String systemIp = request.getHeader("X-System-IP");
        if (systemIp != null && !systemIp.isBlank() && !"127.0.0.1".equals(systemIp) && !"localhost".equalsIgnoreCase(systemIp)) {
            return systemIp.trim();
        }
        return "192.168.1.100";
    }

    /**
     * Extract client IP address safely combining Network IP and System IP.
     */
    public String extractIpAddress(HttpServletRequest request) {
        String networkIp = extractNetworkIpAddress(request);
        String systemIp = extractSystemIpAddress(request);
        return networkIp + " | " + systemIp;
    }

    /**
     * Record a new active login session with unique sessionId.
     */
    public synchronized UserSession recordLogin(String userId, HttpServletRequest request, String userAgent, String deviceIdentifier, String customDeviceName) {
        String combinedIp = extractIpAddress(request);
        String networkIp = extractNetworkIpAddress(request);
        String reqCustomDeviceName = request != null ? request.getHeader("X-Custom-Device-Name") : null;
        String deviceName = (customDeviceName != null && !customDeviceName.isBlank())
                ? customDeviceName
                : ((reqCustomDeviceName != null && !reqCustomDeviceName.isBlank())
                        ? reqCustomDeviceName
                        : deriveDeviceName(userAgent, networkIp));
        String deviceId = deviceIdentifier != null && !deviceIdentifier.isBlank()
                ? deviceIdentifier
                : UUID.randomUUID().toString();

        String sessionId = UUID.randomUUID().toString();
        Date now = new Date();

        Long newId = insertSessionJdbc(userId, sessionId, deviceId, deviceName, combinedIp, userAgent, now, now, "ACTIVE");

        UserSession session = new UserSession();
        session.setId(newId);
        session.setUserId(userId);
        session.setSessionId(sessionId);
        session.setDeviceId(deviceId);
        session.setDeviceName(deviceName);
        session.setIpAddress(combinedIp);
        session.setUserAgent(userAgent != null && userAgent.length() > 500 ? userAgent.substring(0, 500) : userAgent);
        session.setLoginTime(now);
        session.setLastActivity(now);
        session.setStatus("ACTIVE");

        sessionStatusCache.put(sessionId, "ACTIVE");
        sessionLastDbUpdateMap.put(sessionId, now.getTime());
        updateLastSeen(userId);

        log.info("[Session] Created new ACTIVE session id={} sessionId={} for user={}", newId, sessionId, userId);
        return session;
    }

    /**
     * Atomically revokes existing active sessions (for non-Level 5 users) and creates a new active session for the user.
     * For Level 5 users (Super Admin / Boss level users), previous active sessions are preserved to allow multi-device access.
     */
    @Transactional
    public synchronized UserSession confirmTakeoverSession(String userId, HttpServletRequest request, String userAgent, String deviceIdentifier, String customDeviceName) {
        log.info("[Session] Performing session takeover/login for user={}", userId);

        // Check if user is Level 5 (Super Admin / Boss level user)
        boolean isLevel5User = false;
        if (userId != null && userRepository != null) {
            Optional<UserCredential> uOpt = userRepository.findByUserIdIgnoreCase(userId);
            if (uOpt.isPresent() && uOpt.get().getUserLevel() != null && uOpt.get().getUserLevel() >= 5) {
                isLevel5User = true;
            }
        }

        if (isLevel5User) {
            log.info("[Session] User '{}' is Level 5 Super Admin - preserving existing active sessions and recording additional active session.", userId);
            // Level 5 Super Admins are allowed unlimited concurrent sessions: DO NOT revoke previous active sessions!
            return recordLogin(userId, request, userAgent, deviceIdentifier, customDeviceName);
        }

        // 1. Revoke all active sessions for this user (for non-Level 5 users)
        List<UserSession> activeSessions = userSessionRepository.findByUserIdAndStatus(userId, "ACTIVE");
        Date now = new Date();
        if (activeSessions != null && !activeSessions.isEmpty()) {
            for (UserSession s : activeSessions) {
                updateSessionStatusJdbc(s.getId(), "REVOKED", now, "NEW_LOGIN", null);
                if (s.getSessionId() != null) {
                    sessionStatusCache.put(s.getSessionId(), "REVOKED");
                }
                log.info("[Session] Revoked previous session id={} sessionId={} for user={}", s.getId(), s.getSessionId(), userId);
            }
        }

        // 2. Publish real-time STOMP notification to revoke old system sessions
        UserSession revokedSession = (activeSessions != null && !activeSessions.isEmpty()) ? activeSessions.get(0) : null;
        notifySessionRevoked(userId, "NEW_LOGIN", "Your session has been terminated because your account was logged in from another system.", revokedSession);

        // 3. Create new active session
        return recordLogin(userId, request, userAgent, deviceIdentifier, customDeviceName);
    }

    /**
     * Validates session per API request.
     * Uses in-memory cache for sub-millisecond check and throttles DB activity updates.
     */
    public SessionValidationResult validateSession(String sessionId, String userId) {
        if (sessionId == null || sessionId.isBlank()) {
            // Legacy / backward compat: if no sessionId in token, fallback to user active check
            if (userId != null && !userId.isBlank()) {
                return isSessionValid(userId) ? SessionValidationResult.success()
                        : SessionValidationResult.failure("SESSION_EXPIRED", "Session has expired.");
            }
            return SessionValidationResult.failure("SESSION_NOT_FOUND", "Session ID missing.");
        }

        // Check cache first for rapid rejection of revoked/expired sessions
        String cachedStatus = sessionStatusCache.get(sessionId);
        if (cachedStatus != null && !"ACTIVE".equalsIgnoreCase(cachedStatus)) {
            return SessionValidationResult.failure("SESSION_REVOKED", "Your session has been terminated.");
        }

        // Verify in DB if not in cache or periodically
        Optional<UserSession> sessionOpt = userSessionRepository.findBySessionId(sessionId);
        if (!sessionOpt.isPresent()) {
            sessionStatusCache.put(sessionId, "NOT_FOUND");
            return SessionValidationResult.failure("SESSION_NOT_FOUND", "Session not found.");
        }

        UserSession session = sessionOpt.get();
        if (!"ACTIVE".equalsIgnoreCase(session.getStatus())) {
            sessionStatusCache.put(sessionId, session.getStatus());
            return SessionValidationResult.failure("SESSION_REVOKED", "Your session is no longer active (" + session.getStatus() + ").");
        }

        // Active session: update in-memory last seen and throttle DB update
        long now = System.currentTimeMillis();
        userLastSeenMap.put(session.getUserId(), now);
        sessionStatusCache.put(sessionId, "ACTIVE");

        Long lastDbUpdate = sessionLastDbUpdateMap.get(sessionId);
        if (lastDbUpdate == null || (now - lastDbUpdate) > 30000) { // 30 seconds throttle
            sessionLastDbUpdateMap.put(sessionId, now);
            updateSessionLastActivityJdbc(session.getId(), new Date(now));
        }

        return SessionValidationResult.success();
    }

    /**
     * Heartbeat endpoint handler.
     */
    public SessionValidationResult heartbeat(String sessionId, String userId) {
        if (sessionId == null || sessionId.isBlank()) {
            if (userId != null) {
                updateLastSeen(userId);
                return SessionValidationResult.success();
            }
            return SessionValidationResult.failure("SESSION_NOT_FOUND", "Session ID missing.");
        }

        SessionValidationResult res = validateSession(sessionId, userId);
        if (res.isValid()) {
            long now = System.currentTimeMillis();
            sessionLastDbUpdateMap.put(sessionId, now);
            Optional<UserSession> sessionOpt = userSessionRepository.findBySessionId(sessionId);
            sessionOpt.ifPresent(userSession -> updateSessionLastActivityJdbc(userSession.getId(), new Date(now)));
        }
        return res;
    }

    /**
     * Normal manual logout handler.
     */
    public void recordLogout(String sessionId, String userId) {
        Date now = new Date();
        if (sessionId != null && !sessionId.isBlank()) {
            sessionStatusCache.put(sessionId, "LOGGED_OUT");
            Optional<UserSession> sessionOpt = userSessionRepository.findBySessionId(sessionId);
            if (sessionOpt.isPresent()) {
                updateSessionStatusJdbc(sessionOpt.get().getId(), "LOGGED_OUT", now, "NORMAL_LOGOUT", null);
            }
        } else if (userId != null && !userId.isBlank()) {
            Optional<UserSession> sessionOpt = userSessionRepository.findTopByUserIdAndStatusOrderByLoginTimeDesc(userId, "ACTIVE");
            if (sessionOpt.isPresent()) {
                sessionStatusCache.put(sessionOpt.get().getSessionId(), "LOGGED_OUT");
                updateSessionStatusJdbc(sessionOpt.get().getId(), "LOGGED_OUT", now, "NORMAL_LOGOUT", null);
            }
        }
        if (userId != null) {
            recordPageExit(userId);
            userLastSeenMap.remove(userId);
        }
    }

    /**
     * Admin force logout handler.
     */
    @Transactional
    public boolean adminForceLogout(Long id, String adminUserId) {
        Optional<UserSession> sessionOpt = userSessionRepository.findById(id);
        if (!sessionOpt.isPresent()) {
            return false;
        }

        UserSession session = sessionOpt.get();
        Date now = new Date();
        updateSessionStatusJdbc(session.getId(), "REVOKED", now, "ADMIN_FORCE_LOGOUT", adminUserId);

        if (session.getSessionId() != null) {
            sessionStatusCache.put(session.getSessionId(), "REVOKED");
        }

        log.info("[Session] Admin '{}' force-logged out session id={} user='{}'", adminUserId, id, session.getUserId());

        // Notify user in real-time
        notifySessionRevoked(session.getUserId(), "ADMIN_FORCE_LOGOUT", "Your session has been terminated by an administrator.", session);
        return true;
    }

    /**
     * Push real-time session revocation STOMP message.
     */
    private void notifySessionRevoked(String userId, String reason, String message, UserSession revokedSession) {
        try {
            if (messagingTemplate != null && userId != null) {
                Map<String, Object> payload = new HashMap<>();
                payload.put("type", "SESSION_REVOKED");
                payload.put("reason", reason);
                payload.put("userId", userId);
                payload.put("message", message);
                payload.put("timestamp", new Date());
                if (revokedSession != null) {
                    payload.put("deviceName", revokedSession.getDeviceName());
                    payload.put("ipAddress", revokedSession.getIpAddress());
                    payload.put("deviceId", revokedSession.getDeviceId());
                }

                // Broadcast to global-updates & user-specific topic
                messagingTemplate.convertAndSend("/topic/global-updates", payload);
                messagingTemplate.convertAndSend("/topic/session-events/" + userId, payload);
                messagingTemplate.convertAndSendToUser(userId, "/queue/session-events", payload);
                log.info("[Session] Pushed real-time revocation event for user={} with device={}", userId, revokedSession != null ? revokedSession.getDeviceName() : "");
            }
        } catch (Exception e) {
            log.warn("[Session] Could not send STOMP revocation notification: {}", e.getMessage());
        }
    }

    /**
     * Background scheduler to cleanup inactive sessions.
     * Default timeout: 30 minutes (or configurable).
     */
    @Scheduled(fixedRate = 60000)
    public void cleanupInactiveSessions() {
        try {
            List<UserSession> activeSessions = userSessionRepository.findByStatus("ACTIVE");
            long now = System.currentTimeMillis();
            long timeoutMillis = 30 * 60 * 1000; // 30 minutes

            for (UserSession session : activeSessions) {
                if (session == null) continue;
                String userId = session.getUserId();
                Date lastActivity = session.getLastActivity() != null ? session.getLastActivity() : session.getLoginTime();

                boolean isExpired = false;
                if (lastActivity != null && (now - lastActivity.getTime() > timeoutMillis)) {
                    isExpired = true;
                }

                if (isExpired) {
                    Date expiryDate = new Date(lastActivity != null ? lastActivity.getTime() : now);
                    updateSessionStatusJdbc(session.getId(), "EXPIRED", expiryDate, "SESSION_EXPIRED", null);
                    if (session.getSessionId() != null) {
                        sessionStatusCache.put(session.getSessionId(), "EXPIRED");
                    }
                    if (userId != null) {
                        recordPageExit(userId);
                        userLastSeenMap.remove(userId);
                    }
                    log.info("[Session] Expired stale session id={} user='{}'", session.getId(), userId);
                }
            }
        } catch (Exception e) {
            log.error("[Session] Error in cleanup scheduler: {}", e.getMessage());
        }
    }

    /**
     * Get active sessions for Admin Active Session Management screen.
     */
    public List<Map<String, Object>> getActiveSessionsList() {
        List<UserSession> activeSessions = userSessionRepository.findByStatusOrderByLoginTimeDesc("ACTIVE");
        List<Map<String, Object>> result = new ArrayList<>();

        for (UserSession s : activeSessions) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("userId", s.getUserId());
            map.put("ipAddress", s.getIpAddress());
            map.put("deviceName", s.getDeviceName() != null ? s.getDeviceName() : deriveDeviceName(s.getUserAgent(), s.getIpAddress()));
            map.put("loginTime", s.getLoginTime());
            map.put("lastActivity", s.getLastActivity() != null ? s.getLastActivity() : s.getLoginTime());
            map.put("status", s.getStatus());

            // Resolve employee name safely
            String empName = s.getUserId();
            try {
                Optional<UserCredential> userOpt = userRepository.findByUserId(s.getUserId());
                if (userOpt.isPresent() && userOpt.get().getEmpId() != null) {
                    Optional<EmployeeMaster> empOpt = employeeMasterRepository.findById(userOpt.get().getEmpId());
                    if (empOpt.isPresent()) {
                        empName = empOpt.get().getEmployeeName();
                    }
                }
            } catch (Exception ignored) {}
            map.put("employeeName", empName);

            result.add(map);
        }
        return result;
    }

    // ─── Raw JDBC Helpers for High Reliability & Zero GeneratedKeys Issue ───

    private Long insertSessionJdbc(String userId, String sessionId, String deviceId, String deviceName,
                                  String ipAddress, String userAgent, Date loginTime, Date lastActivity, String status) {
        try (Connection conn = dataSource.getConnection()) {
            String insertSql = "INSERT INTO AD_USER_SESSION_AUDIT (USER_ID, SESSION_ID, DEVICE_ID, DEVICE_NAME, IP_ADDRESS, USER_AGENT, LOGIN_TIME, LAST_ACTIVITY, SESSION_STATUS, CREATED_BY, CREATED_DATE) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                ps.setString(1, userId != null && userId.length() > 50 ? userId.substring(0, 50) : userId);
                ps.setString(2, sessionId != null && sessionId.length() > 100 ? sessionId.substring(0, 100) : sessionId);
                ps.setString(3, deviceId != null && deviceId.length() > 100 ? deviceId.substring(0, 100) : deviceId);
                ps.setString(4, deviceName != null && deviceName.length() > 500 ? deviceName.substring(0, 500) : deviceName);
                ps.setString(5, ipAddress != null && ipAddress.length() > 500 ? ipAddress.substring(0, 500) : ipAddress);
                ps.setString(6, userAgent != null && userAgent.length() > 1000 ? userAgent.substring(0, 1000) : userAgent);
                ps.setTimestamp(7, new java.sql.Timestamp(loginTime.getTime()));
                ps.setTimestamp(8, new java.sql.Timestamp(lastActivity.getTime()));
                ps.setString(9, status);
                ps.setString(10, userId != null && userId.length() > 50 ? userId.substring(0, 50) : userId);
                ps.setTimestamp(11, new java.sql.Timestamp(loginTime.getTime()));
                ps.executeUpdate();
            }
            try (PreparedStatement ps2 = conn.prepareStatement("SELECT SCOPE_IDENTITY() AS id");
                 ResultSet rs = ps2.executeQuery()) {
                if (rs.next()) {
                    return rs.getLong("id");
                }
            }
        } catch (Exception e) {
            log.error("[Session] insertSessionJdbc error: {}", e.getMessage());
        }
        return null;
    }

    private void updateSessionStatusJdbc(Long id, String status, Date logoutTime, String logoutReason, String forcedByUserId) {
        if (id == null) return;
        String sql = "UPDATE AD_USER_SESSION_AUDIT SET SESSION_STATUS = ?, LOGOUT_TIME = ?, LOGOUT_REASON = ?, FORCED_BY_USER_ID = ?, UPDATED_DATE = ? WHERE ID = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setTimestamp(2, logoutTime != null ? new java.sql.Timestamp(logoutTime.getTime()) : null);
            ps.setString(3, logoutReason);
            ps.setString(4, forcedByUserId);
            ps.setTimestamp(5, new java.sql.Timestamp(System.currentTimeMillis()));
            ps.setLong(6, id);
            ps.executeUpdate();
        } catch (Exception e) {
            log.error("[Session] updateSessionStatusJdbc error: {}", e.getMessage());
        }
    }

    private void updateSessionLastActivityJdbc(Long id, Date lastActivity) {
        if (id == null) return;
        String sql = "UPDATE AD_USER_SESSION_AUDIT SET LAST_ACTIVITY = ? WHERE ID = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setTimestamp(1, new java.sql.Timestamp(lastActivity.getTime()));
            ps.setLong(2, id);
            ps.executeUpdate();
        } catch (Exception e) {
            log.error("[Session] updateSessionLastActivityJdbc error: {}", e.getMessage());
        }
    }

    // ─── Backward Compatibility Navigation Tracking ───

    public void recordPageEntry(String userId, String pageName, String pageUrl) {
        recordPageExit(userId);
        UserSessionActivity activity = new UserSessionActivity();
        activity.setUserId(userId);
        activity.setPageName(pageName);
        activity.setPageUrl(pageUrl);
        activity.setEntryTime(new Date());
        activity.setIsIdle(false);
        activity.setIdleTimeMs(0L);
        userSessionActivityRepository.save(activity);
    }

    public void recordPageExit(String userId) {
        Optional<UserSessionActivity> activityOpt = userSessionActivityRepository
                .findTopByUserIdAndExitTimeIsNullOrderByEntryTimeDesc(userId);
        if (activityOpt.isPresent()) {
            UserSessionActivity activity = activityOpt.get();
            Date now = new Date();
            activity.setExitTime(now);
            activity.setDurationMs(now.getTime() - activity.getEntryTime().getTime());
            userSessionActivityRepository.save(activity);
        }
    }

    public List<UserSessionActivity> getAllNavigation() {
        return userSessionActivityRepository.findAll();
    }

    public List<UserSessionActivity> getUserNavigation(String userId) {
        return userSessionActivityRepository.findAllByUserIdOrderByEntryTimeDesc(userId);
    }

    public boolean isSessionValid(String userId) {
        return userSessionRepository.findTopByUserIdAndStatusOrderByLoginTimeDesc(userId, "ACTIVE").isPresent();
    }

    public void terminateSession(String userId) {
        recordLogout(null, userId);
    }

    public List<UserSession> getAllSessions() {
        return userSessionRepository.findAll();
    }
}
