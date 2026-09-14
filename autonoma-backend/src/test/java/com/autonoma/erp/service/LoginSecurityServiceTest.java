package com.autonoma.erp.service;

import com.autonoma.erp.dto.security.AllowedDeviceDTO;
import com.autonoma.erp.dto.security.AllowedIpDTO;
import com.autonoma.erp.dto.security.LoginSecurityConfigDTO;
import com.autonoma.erp.dto.security.SecurityValidationResult;
import com.autonoma.erp.model.security.AllowedDevice;
import com.autonoma.erp.model.security.AllowedIp;
import com.autonoma.erp.model.security.LoginAccessConfig;
import com.autonoma.erp.model.security.LoginSecurityAudit;
import com.autonoma.erp.repository.security.*;
import com.autonoma.erp.service.security.LoginSecurityService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class LoginSecurityServiceTest {

    @Mock
    private LoginAccessConfigRepository configRepository;

    @Mock
    private AllowedIpRepository allowedIpRepository;

    @Mock
    private AllowedDeviceRepository allowedDeviceRepository;

    @Mock
    private LoginAccessLogRepository loginAccessLogRepository;

    @Mock
    private LoginSecurityAuditRepository loginSecurityAuditRepository;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private LoginSecurityService loginSecurityService;

    private final Long COMPANY_A = 1L;
    private final Long COMPANY_B = 2L;

    @BeforeEach
    void setUp() {
        when(request.getHeader("User-Agent")).thenReturn("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
        when(request.getRemoteAddr()).thenReturn("192.168.1.100");
    }

    // =========================================================================
    // TEST 1: Security OFF -> ALLOWED
    // =========================================================================
    @Test
    void test1_SecurityOff_LoginAllowed() {
        LoginAccessConfig config = new LoginAccessConfig();
        config.setCompanyId(COMPANY_A);
        config.setSecurityEnabled(false);

        when(configRepository.findByCompanyId(COMPANY_A)).thenReturn(Optional.of(config));

        SecurityValidationResult result = loginSecurityService.validateLoginAccess(
                request, "admin", COMPANY_A, "DEV-UNKNOWN", null
        );

        assertTrue(result.isAllowed());
        assertEquals("SECURITY_DISABLED", result.getReason());
    }

    // =========================================================================
    // TEST 2: IP Mode + Allowed IP -> ALLOWED
    // =========================================================================
    @Test
    void test2_IpMode_AllowedIp_Success() {
        LoginAccessConfig config = new LoginAccessConfig();
        config.setCompanyId(COMPANY_A);
        config.setSecurityEnabled(true);
        config.setAccessControlMethod("IP");

        AllowedIp allowedIp = new AllowedIp();
        allowedIp.setCompanyId(COMPANY_A);
        allowedIp.setIpAddress("192.168.1.100");
        allowedIp.setStatus(true);

        when(configRepository.findByCompanyId(COMPANY_A)).thenReturn(Optional.of(config));
        when(allowedIpRepository.findByCompanyIdAndStatus(COMPANY_A, true))
                .thenReturn(Collections.singletonList(allowedIp));

        SecurityValidationResult result = loginSecurityService.validateLoginAccess(
                request, "admin", COMPANY_A, null, null
        );

        assertTrue(result.isAllowed());
        assertEquals("ACCESS_AUTHORIZED", result.getReason());
    }

    // =========================================================================
    // TEST 3: IP Mode + Unknown IP -> BLOCKED
    // =========================================================================
    @Test
    void test3_IpMode_UnknownIp_Blocked() {
        LoginAccessConfig config = new LoginAccessConfig();
        config.setCompanyId(COMPANY_A);
        config.setSecurityEnabled(true);
        config.setAccessControlMethod("IP");

        AllowedIp allowedIp = new AllowedIp();
        allowedIp.setCompanyId(COMPANY_A);
        allowedIp.setIpAddress("10.0.0.50"); // Different from 192.168.1.100
        allowedIp.setStatus(true);

        when(configRepository.findByCompanyId(COMPANY_A)).thenReturn(Optional.of(config));
        when(allowedIpRepository.findByCompanyIdAndStatus(COMPANY_A, true))
                .thenReturn(Collections.singletonList(allowedIp));

        SecurityValidationResult result = loginSecurityService.validateLoginAccess(
                request, "admin", COMPANY_A, null, null
        );

        assertFalse(result.isAllowed());
        assertEquals("IP_NOT_ALLOWED", result.getReason());
        assertTrue(result.getUserMessage().contains("ACCESS DENIED"));
    }

    // =========================================================================
    // TEST 4: IP Mode + Inactive IP -> BLOCKED
    // =========================================================================
    @Test
    void test4_IpMode_InactiveIp_Blocked() {
        LoginAccessConfig config = new LoginAccessConfig();
        config.setCompanyId(COMPANY_A);
        config.setSecurityEnabled(true);
        config.setAccessControlMethod("IP");

        when(configRepository.findByCompanyId(COMPANY_A)).thenReturn(Optional.of(config));
        // Repository returns only ACTIVE items, so active list is empty
        when(allowedIpRepository.findByCompanyIdAndStatus(COMPANY_A, true))
                .thenReturn(Collections.emptyList());

        SecurityValidationResult result = loginSecurityService.validateLoginAccess(
                request, "admin", COMPANY_A, null, null
        );

        assertFalse(result.isAllowed());
        assertEquals("IP_NOT_ALLOWED", result.getReason());
    }

    // =========================================================================
    // TEST 5: Device Mode + Registered Active Device -> ALLOWED
    // =========================================================================
    @Test
    void test5_DeviceMode_RegisteredDevice_Success() {
        LoginAccessConfig config = new LoginAccessConfig();
        config.setCompanyId(COMPANY_A);
        config.setSecurityEnabled(true);
        config.setAccessControlMethod("DEVICE");

        AllowedDevice dev = new AllowedDevice();
        dev.setCompanyId(COMPANY_A);
        dev.setDeviceIdentifier("DEV-TOKEN-12345");
        dev.setStatus(true);

        when(configRepository.findByCompanyId(COMPANY_A)).thenReturn(Optional.of(config));
        when(allowedDeviceRepository.findByCompanyIdAndDeviceIdentifier(COMPANY_A, "DEV-TOKEN-12345"))
                .thenReturn(Optional.of(dev));

        SecurityValidationResult result = loginSecurityService.validateLoginAccess(
                request, "admin", COMPANY_A, "DEV-TOKEN-12345", null
        );

        assertTrue(result.isAllowed());
        assertEquals("ACCESS_AUTHORIZED", result.getReason());
    }

    // =========================================================================
    // TEST 6: Device Mode + Unregistered Device -> BLOCKED
    // =========================================================================
    @Test
    void test6_DeviceMode_UnregisteredDevice_Blocked() {
        LoginAccessConfig config = new LoginAccessConfig();
        config.setCompanyId(COMPANY_A);
        config.setSecurityEnabled(true);
        config.setAccessControlMethod("DEVICE");

        when(configRepository.findByCompanyId(COMPANY_A)).thenReturn(Optional.of(config));
        when(allowedDeviceRepository.findByCompanyIdAndDeviceIdentifier(COMPANY_A, "DEV-UNKNOWN"))
                .thenReturn(Optional.empty());

        SecurityValidationResult result = loginSecurityService.validateLoginAccess(
                request, "admin", COMPANY_A, "DEV-UNKNOWN", null
        );

        assertFalse(result.isAllowed());
        assertEquals("DEVICE_NOT_REGISTERED", result.getReason());
    }

    // =========================================================================
    // TEST 7: Device Mode + Inactive Device -> BLOCKED
    // =========================================================================
    @Test
    void test7_DeviceMode_InactiveDevice_Blocked() {
        LoginAccessConfig config = new LoginAccessConfig();
        config.setCompanyId(COMPANY_A);
        config.setSecurityEnabled(true);
        config.setAccessControlMethod("DEVICE");

        AllowedDevice dev = new AllowedDevice();
        dev.setCompanyId(COMPANY_A);
        dev.setDeviceIdentifier("DEV-TOKEN-12345");
        dev.setStatus(false);

        when(configRepository.findByCompanyId(COMPANY_A)).thenReturn(Optional.of(config));
        when(allowedDeviceRepository.findByCompanyIdAndDeviceIdentifier(COMPANY_A, "DEV-TOKEN-12345"))
                .thenReturn(Optional.of(dev));

        SecurityValidationResult result = loginSecurityService.validateLoginAccess(
                request, "admin", COMPANY_A, "DEV-TOKEN-12345", null
        );

        assertFalse(result.isAllowed());
        assertEquals("DEVICE_INACTIVE", result.getReason());
    }

    // =========================================================================
    // TEST 8: IP + Device Mode + Both Valid -> ALLOWED
    // =========================================================================
    @Test
    void test8_IpAndDevice_BothValid_Success() {
        LoginAccessConfig config = new LoginAccessConfig();
        config.setCompanyId(COMPANY_A);
        config.setSecurityEnabled(true);
        config.setAccessControlMethod("IP_DEVICE");

        AllowedIp allowedIp = new AllowedIp();
        allowedIp.setCompanyId(COMPANY_A);
        allowedIp.setIpAddress("192.168.1.100");
        allowedIp.setStatus(true);

        AllowedDevice dev = new AllowedDevice();
        dev.setCompanyId(COMPANY_A);
        dev.setDeviceIdentifier("DEV-TOKEN-12345");
        dev.setStatus(true);

        when(configRepository.findByCompanyId(COMPANY_A)).thenReturn(Optional.of(config));
        when(allowedIpRepository.findByCompanyIdAndStatus(COMPANY_A, true))
                .thenReturn(Collections.singletonList(allowedIp));
        when(allowedDeviceRepository.findByCompanyIdAndDeviceIdentifier(COMPANY_A, "DEV-TOKEN-12345"))
                .thenReturn(Optional.of(dev));

        SecurityValidationResult result = loginSecurityService.validateLoginAccess(
                request, "admin", COMPANY_A, "DEV-TOKEN-12345", null
        );

        assertTrue(result.isAllowed());
        assertEquals("ACCESS_AUTHORIZED", result.getReason());
    }

    // =========================================================================
    // TEST 9: IP Valid + Device Invalid -> BLOCKED
    // =========================================================================
    @Test
    void test9_IpValid_DeviceInvalid_Blocked() {
        LoginAccessConfig config = new LoginAccessConfig();
        config.setCompanyId(COMPANY_A);
        config.setSecurityEnabled(true);
        config.setAccessControlMethod("IP_DEVICE");

        AllowedIp allowedIp = new AllowedIp();
        allowedIp.setCompanyId(COMPANY_A);
        allowedIp.setIpAddress("192.168.1.100");
        allowedIp.setStatus(true);

        when(configRepository.findByCompanyId(COMPANY_A)).thenReturn(Optional.of(config));
        when(allowedIpRepository.findByCompanyIdAndStatus(COMPANY_A, true))
                .thenReturn(Collections.singletonList(allowedIp));
        when(allowedDeviceRepository.findByCompanyIdAndDeviceIdentifier(COMPANY_A, "DEV-UNKNOWN"))
                .thenReturn(Optional.empty());

        SecurityValidationResult result = loginSecurityService.validateLoginAccess(
                request, "admin", COMPANY_A, "DEV-UNKNOWN", null
        );

        assertFalse(result.isAllowed());
        assertEquals("DEVICE_NOT_REGISTERED", result.getReason());
    }

    // =========================================================================
    // TEST 10: IP Invalid + Device Valid -> BLOCKED
    // =========================================================================
    @Test
    void test10_IpInvalid_DeviceValid_Blocked() {
        LoginAccessConfig config = new LoginAccessConfig();
        config.setCompanyId(COMPANY_A);
        config.setSecurityEnabled(true);
        config.setAccessControlMethod("IP_DEVICE");

        AllowedDevice dev = new AllowedDevice();
        dev.setCompanyId(COMPANY_A);
        dev.setDeviceIdentifier("DEV-TOKEN-12345");
        dev.setStatus(true);

        when(configRepository.findByCompanyId(COMPANY_A)).thenReturn(Optional.of(config));
        when(allowedIpRepository.findByCompanyIdAndStatus(COMPANY_A, true))
                .thenReturn(Collections.emptyList());
        when(allowedDeviceRepository.findByCompanyIdAndDeviceIdentifier(COMPANY_A, "DEV-TOKEN-12345"))
                .thenReturn(Optional.of(dev));

        SecurityValidationResult result = loginSecurityService.validateLoginAccess(
                request, "admin", COMPANY_A, "DEV-TOKEN-12345", null
        );

        assertFalse(result.isAllowed());
        assertEquals("IP_NOT_ALLOWED", result.getReason());
    }

    // =========================================================================
    // TEST 11: Lockout Prevention: Reject Enabling IP Security when 0 Active IPs
    // =========================================================================
    @Test
    void test11_LockoutPrevention_RejectWhenZeroActiveIps() {
        when(allowedIpRepository.countByCompanyIdAndStatus(COMPANY_A, true)).thenReturn(0L);

        LoginSecurityConfigDTO dto = LoginSecurityConfigDTO.builder()
                .securityEnabled(true)
                .accessControlMethod("IP")
                .build();

        assertThrows(IllegalArgumentException.class, () -> {
            loginSecurityService.updateConfig(COMPANY_A, dto, "admin", "192.168.1.100", "DEV-01");
        });
    }

    // =========================================================================
    // TEST 12: Multi-Company Isolation: Company A rules do not allow Company B
    // =========================================================================
    @Test
    void test12_MultiCompanyIsolation() {
        LoginAccessConfig configB = new LoginAccessConfig();
        configB.setCompanyId(COMPANY_B);
        configB.setSecurityEnabled(true);
        configB.setAccessControlMethod("IP");

        // Company B has allowed IP: 10.0.0.1
        AllowedIp ipB = new AllowedIp();
        ipB.setCompanyId(COMPANY_B);
        ipB.setIpAddress("10.0.0.1");
        ipB.setStatus(true);

        when(configRepository.findByCompanyId(COMPANY_B)).thenReturn(Optional.of(configB));
        when(allowedIpRepository.findByCompanyIdAndStatus(COMPANY_B, true))
                .thenReturn(Collections.singletonList(ipB));

        // Company A IP 192.168.1.100 tries to login to Company B -> should be BLOCKED
        SecurityValidationResult result = loginSecurityService.validateLoginAccess(
                request, "userB", COMPANY_B, null, null
        );

        assertFalse(result.isAllowed());
        assertEquals("IP_NOT_ALLOWED", result.getReason());
    }

    // =========================================================================
    // TEST 13: Configuration Change Audited
    // =========================================================================
    @Test
    void test13_ConfigChange_CreatesAudit() {
        LoginAccessConfig existing = new LoginAccessConfig();
        existing.setId(1L);
        existing.setCompanyId(COMPANY_A);
        existing.setSecurityEnabled(false);
        existing.setAccessControlMethod("IP");

        when(configRepository.findByCompanyId(COMPANY_A)).thenReturn(Optional.of(existing));
        when(allowedIpRepository.countByCompanyIdAndStatus(COMPANY_A, true)).thenReturn(2L);
        when(configRepository.save(any(LoginAccessConfig.class))).thenAnswer(i -> i.getArgument(0));

        LoginSecurityConfigDTO updateDto = LoginSecurityConfigDTO.builder()
                .securityEnabled(true)
                .accessControlMethod("IP")
                .build();

        loginSecurityService.updateConfig(COMPANY_A, updateDto, "admin", "192.168.1.100", "DEV-01");

        verify(loginSecurityAuditRepository, atLeastOnce()).save(any(LoginSecurityAudit.class));
    }
}
