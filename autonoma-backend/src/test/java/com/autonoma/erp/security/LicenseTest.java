package com.autonoma.erp.security;

import com.autonoma.erp.security.license.CryptoEngine;
import com.autonoma.erp.security.license.LicensePayload;
import org.junit.jupiter.api.Test;

import java.io.FileOutputStream;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.time.LocalDate;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

public class LicenseTest {

    @Test
    public void generateKeyPairAndTestLicense() throws Exception {
        // Generate RSA-2048 key pair
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();

        byte[] pubBytes = kp.getPublic().getEncoded();
        byte[] privBytes = kp.getPrivate().getEncoded();

        String pubB64 = Base64.getEncoder().encodeToString(pubBytes);
        String privB64 = Base64.getEncoder().encodeToString(privBytes);

        System.out.println("=== RSA PUBLIC KEY BASE64 ===");
        System.out.println(pubB64);
        System.out.println("=== RSA PRIVATE KEY BASE64 ===");
        System.out.println(privB64);

        // Test License Generation and Decryption/Verification
        LicensePayload payload = new LicensePayload("123456", "AUTONOMA_ERP", LocalDate.now().plusDays(30));
        byte[] licenseBytes = CryptoEngine.generateLicenseFile(payload, privBytes, pubBytes);

        assertNotNull(licenseBytes);

        LicensePayload decrypted = CryptoEngine.decryptAndVerifyLicense(licenseBytes, pubBytes);
        assertEquals(payload.clientCode(), decrypted.clientCode());
        assertEquals(payload.productCode(), decrypted.productCode());
        assertEquals(payload.expiryDate(), decrypted.expiryDate());
        System.out.println("License generation and validation test passed!");
    }
}
