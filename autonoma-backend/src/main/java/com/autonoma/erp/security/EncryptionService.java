package com.autonoma.erp.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class EncryptionService {

    private static final Logger log = LoggerFactory.getLogger(EncryptionService.class);
    
    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128; // in bits
    private static final String PREFIX = "ENC:";

    private final SecretKeySpec secretKey;

    public EncryptionService(@Value("${app.security.encryption-key:}") String rawKey) {
        if (rawKey == null || rawKey.trim().isEmpty()) {
            log.warn("Encryption key is not set or empty. Encryption operations will fail.");
            this.secretKey = null;
        } else {
            try {
                // Securely derive a 256-bit key from the passphrase using SHA-256
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] keyBytes = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
                this.secretKey = new SecretKeySpec(keyBytes, ALGORITHM);
                log.info("Secure 256-bit AES key initialized successfully.");
            } catch (Exception e) {
                log.error("Failed to initialize encryption key: {}", e.getMessage(), e);
                throw new IllegalStateException("Failed to initialize EncryptionService key", e);
            }
        }
    }

    /**
     * Checks if the encryption key is configured.
     */
    public boolean isKeyConfigured() {
        return secretKey != null;
    }

    /**
     * Encrypts a plaintext string and returns it prefixed with 'ENC:' and Base64-encoded.
     */
    public String encrypt(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        if (secretKey == null) {
            throw new IllegalStateException("Encryption key is not configured. Cannot encrypt data.");
        }
        try {
            // Generate a secure random IV
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);

            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // Combine IV and ciphertext: [IV (12 bytes)][Ciphertext (varying)]
            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);

            // Encode to Base64 and add the ENC: prefix
            return PREFIX + Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            log.error("Encryption failed: {}", e.getMessage());
            throw new RuntimeException("Encryption failed", e);
        }
    }

    /**
     * Decrypts an encrypted string starting with 'ENC:'.
     * If the input is null, empty, or does not start with 'ENC:', it returns the input as-is (plaintext fallback).
     */
    public String decrypt(String encryptedText) {
        if (encryptedText == null || !encryptedText.startsWith(PREFIX)) {
            return encryptedText; // Plaintext fallback
        }
        if (secretKey == null) {
            throw new IllegalStateException("Encryption key is not configured. Cannot decrypt data.");
        }
        try {
            // Remove PREFIX and decode Base64
            String base64Ciphertext = encryptedText.substring(PREFIX.length());
            byte[] combined = Base64.getDecoder().decode(base64Ciphertext);

            if (combined.length < GCM_IV_LENGTH) {
                throw new IllegalArgumentException("Invalid encrypted payload size.");
            }

            // Split IV and ciphertext
            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] ciphertext = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);
            System.arraycopy(combined, GCM_IV_LENGTH, ciphertext, 0, ciphertext.length);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);

            byte[] decryptedBytes = cipher.doFinal(ciphertext);
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Decryption failed: {}", e.getMessage());
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
