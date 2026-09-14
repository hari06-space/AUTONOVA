package com.autonoma.erp.security;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class EncryptionKeyValidator {

    private static final Logger log = LoggerFactory.getLogger(EncryptionKeyValidator.class);

    private final EncryptionService encryptionService;
    private final String rawKey;

    @Autowired
    public EncryptionKeyValidator(EncryptionService encryptionService, 
                                  @Value("${app.security.encryption-key:}") String rawKey) {
        this.encryptionService = encryptionService;
        this.rawKey = rawKey;
    }

    @PostConstruct
    public void validateKeyOnStartup() {
        log.info("Starting enterprise security encryption key validation...");
        if (!encryptionService.isKeyConfigured()) {
            log.error("CRITICAL SECURITY ERROR: The property 'app.security.encryption-key' is not configured! Aborting startup.");
            throw new IllegalStateException("Encryption key 'app.security.encryption-key' is missing. Security policy prohibits starting without encryption key.");
        }
        if (rawKey.trim().length() < 16) {
            log.error("CRITICAL SECURITY ERROR: The property 'app.security.encryption-key' is too short! It must be at least 16 characters. Aborting startup.");
            throw new IllegalStateException("Encryption key is too weak. Ensure it is at least 16 characters long.");
        }
        log.info("Encryption key validation passed successfully.");
    }
}
