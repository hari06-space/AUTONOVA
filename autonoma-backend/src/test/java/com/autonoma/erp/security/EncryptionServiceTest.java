package com.autonoma.erp.security;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class EncryptionServiceTest {

    @Test
    public void testEncryptionAndDecryption() {
        String key = "my_super_secret_test_key_minimum_length_16";
        EncryptionService encryptionService = new EncryptionService(key);

        String secret = "azure-client-secret-12345-abcde!";
        String encrypted = encryptionService.encrypt(secret);

        assertNotNull(encrypted);
        assertTrue(encrypted.startsWith("ENC:"));
        assertNotEquals(secret, encrypted);

        String decrypted = encryptionService.decrypt(encrypted);
        assertEquals(secret, decrypted);
    }

    @Test
    public void testDecryptionPlaintextFallback() {
        EncryptionService encryptionService = new EncryptionService("my_super_secret_test_key_minimum_length_16");

        String plaintext = "my-normal-plaintext-secret";
        String decrypted = encryptionService.decrypt(plaintext);
        assertEquals(plaintext, decrypted);

        String nullResult = encryptionService.decrypt(null);
        assertNull(nullResult);
    }

    @Test
    public void testUnconfiguredKeyThrowsException() {
        EncryptionService encryptionService = new EncryptionService("");

        assertFalse(encryptionService.isKeyConfigured());

        assertThrows(IllegalStateException.class, () -> {
            encryptionService.encrypt("secret");
        });

        assertThrows(IllegalStateException.class, () -> {
            encryptionService.decrypt("ENC:someBase64EncodedData");
        });
    }
}
