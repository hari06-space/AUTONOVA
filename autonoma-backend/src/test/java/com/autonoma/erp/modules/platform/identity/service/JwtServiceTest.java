package com.autonoma.erp.modules.platform.identity.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    public void setUp() {
        jwtService = new JwtService();
        jwtService.init();
    }

    @Test
    public void testGenerateAndValidateToken() {
        String token = jwtService.generateToken("SUPER_ADMIN");
        assertNotNull(token);
        assertTrue(token.length() > 0);

        String username = jwtService.extractUsername(token);
        assertEquals("SUPER_ADMIN", username);

        assertTrue(jwtService.validateToken(token, "SUPER_ADMIN"));
    }
}
