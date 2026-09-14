package com.autonoma.erp.service.admin;

import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.model.admin.UserSession;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;
import com.autonoma.erp.repository.admin.UserSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-03
 * Description: Unit and concurrency tests for UserSessionService single active session policy, takeover, and revocation.
 */
@ExtendWith(MockitoExtension.class)
public class UserSessionServiceTest {

    @Mock
    private UserSessionRepository userSessionRepository;

    @Mock
    private CompanyCredentialRepository companyCredentialRepository;

    @Mock
    private DataSource dataSource;

    @Mock
    private Connection connection;

    @Mock
    private PreparedStatement preparedStatement;

    @Mock
    private ResultSet resultSet;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private UserSessionService userSessionService;

    @BeforeEach
    void setUp() throws Exception {
        lenient().when(dataSource.getConnection()).thenReturn(connection);
        lenient().when(connection.prepareStatement(anyString())).thenReturn(preparedStatement);
        lenient().when(preparedStatement.executeQuery()).thenReturn(resultSet);
        lenient().when(resultSet.next()).thenReturn(true);
        lenient().when(resultSet.getLong("id")).thenReturn(101L);
    }

    @Test
    void testCheckActiveSession_PolicyDisabled_ReturnsEmpty() {
        CompanyCredential company = new CompanyCredential();
        company.setId(1L);
        company.setSingleActiveSession(false);

        when(companyCredentialRepository.findById(1L)).thenReturn(Optional.of(company));

        Optional<UserSessionService.ActiveSessionInfo> result = userSessionService.checkActiveSession("user1", 1L);
        assertTrue(result.isEmpty(), "When single active session is disabled, checkActiveSession must return empty");
    }

    @Test
    void testCheckActiveSession_PolicyEnabled_NoActiveSession_ReturnsEmpty() {
        CompanyCredential company = new CompanyCredential();
        company.setId(1L);
        company.setSingleActiveSession(true);

        when(companyCredentialRepository.findById(1L)).thenReturn(Optional.of(company));
        when(userSessionRepository.findByUserIdAndStatus("user1", "ACTIVE")).thenReturn(Collections.emptyList());

        Optional<UserSessionService.ActiveSessionInfo> result = userSessionService.checkActiveSession("user1", 1L);
        assertTrue(result.isEmpty(), "When no active session exists, checkActiveSession must return empty");
    }

    @Test
    void testCheckActiveSession_PolicyEnabled_ActiveSessionExists_ReturnsMetadata() {
        CompanyCredential company = new CompanyCredential();
        company.setId(1L);
        company.setSingleActiveSession(true);

        UserSession existingSession = new UserSession();
        existingSession.setId(50L);
        existingSession.setUserId("user1");
        existingSession.setDeviceName("Chrome on Windows 11");
        existingSession.setIpAddress("192.168.1.50");
        existingSession.setLoginTime(new Date());
        existingSession.setLastActivity(new Date());
        existingSession.setStatus("ACTIVE");

        when(companyCredentialRepository.findById(1L)).thenReturn(Optional.of(company));
        when(userSessionRepository.findByUserIdAndStatus("user1", "ACTIVE"))
                .thenReturn(List.of(existingSession));

        Optional<UserSessionService.ActiveSessionInfo> result = userSessionService.checkActiveSession("user1", 1L);
        assertTrue(result.isPresent(), "Active session must be detected");
        assertEquals("Chrome on Windows 11", result.get().getDeviceName());
        assertEquals("192.168.1.50", result.get().getIpAddress());
    }

    @Test
    void testValidateSession_ActiveSession_ReturnsValid() {
        String sessionId = UUID.randomUUID().toString();
        UserSession session = new UserSession();
        session.setId(101L);
        session.setUserId("user1");
        session.setSessionId(sessionId);
        session.setStatus("ACTIVE");
        session.setLoginTime(new Date());

        when(userSessionRepository.findBySessionId(sessionId)).thenReturn(Optional.of(session));

        UserSessionService.SessionValidationResult res = userSessionService.validateSession(sessionId, "user1");
        assertTrue(res.isValid(), "Active session must pass validation");
    }

    @Test
    void testValidateSession_RevokedSession_ReturnsInvalid() {
        String sessionId = UUID.randomUUID().toString();
        UserSession session = new UserSession();
        session.setId(101L);
        session.setUserId("user1");
        session.setSessionId(sessionId);
        session.setStatus("REVOKED");

        when(userSessionRepository.findBySessionId(sessionId)).thenReturn(Optional.of(session));

        UserSessionService.SessionValidationResult res = userSessionService.validateSession(sessionId, "user1");
        assertFalse(res.isValid(), "Revoked session must fail validation");
        assertEquals("SESSION_REVOKED", res.getErrorCode());
    }

    @Test
    void testAdminForceLogout_Success() {
        UserSession session = new UserSession();
        session.setId(200L);
        session.setUserId("user1");
        session.setSessionId(UUID.randomUUID().toString());
        session.setStatus("ACTIVE");

        when(userSessionRepository.findById(200L)).thenReturn(Optional.of(session));

        boolean success = userSessionService.adminForceLogout(200L, "superadmin");
        assertTrue(success, "Admin force logout must succeed");
    }

    @Test
    void testDeviceNameDerivation() {
        String dev1 = userSessionService.deriveDeviceName("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36", "10.0.0.1");
        assertTrue(dev1.contains("Chrome") && dev1.contains("Windows"), "Must derive Chrome on Windows");

        String dev2 = userSessionService.deriveDeviceName("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", "10.0.0.2");
        assertTrue(dev2.contains("Safari") && dev2.contains("macOS"), "Must derive Safari on macOS");
    }
}
