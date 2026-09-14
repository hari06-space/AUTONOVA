package com.autonoma.erp.security.license;

import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

@Service
public class SystemStateVerifier {

    private static final Logger log = LoggerFactory.getLogger(SystemStateVerifier.class);

    private static LicensePayload verifiedPayload;

    public static LicensePayload getVerifiedPayload() {
        return verifiedPayload;
    }

    @Autowired
    private com.autonoma.erp.service.admin.CompanyCredentialService companyCredentialService;

    @Autowired
    private ConfigurableApplicationContext applicationContext;

    /**
     * Executes the license verification at application startup.
     */
    @PostConstruct
    public void onStartupCheck() {
        try {
            refreshContextState();
        } catch (Exception e) {
            log.error("License validation failed. System shutting down.");
            shutdownSystem();
        }
    }

    /**
     * Obfuscated license verification checkpoint.
     * Throws exception if license is invalid or expired.
     */
    public void refreshContextState() throws Exception {
        // 1. Bypass check if running in IDE, Maven, Gradle, or Unit Tests
        if (ExecutionEnvDetector.isDevOrBuildEnvironment()) {
            log.info("Development environment detected. Bypassing offline licensing checks.");
            return;
        }

        // 2. Load license.lic from working directory
        File licenseFile = new File("license.lic");
        if (!licenseFile.exists()) {
            log.warn("license.lic not found in working directory. Bypassing license check for local environment.");
            return;
        }

        byte[] licenseBytes;
        try {
            licenseBytes = Files.readAllBytes(licenseFile.toPath());
        } catch (IOException e) {
            log.error("Unable to read license configuration.");
            throw new SecurityException("License validation failed.");
        }

        // 3. Decrypt and verify digital signature
        LicensePayload payload;
        try {
            payload = CryptoEngine.decryptAndVerifyLicense(licenseBytes);
        } catch (Exception e) {
            log.error("Cryptographic verification of license failed:", e);
            throw new SecurityException("License validation failed.");
        }

        // 4. Validate Expiry Date
        if (payload.expiryDate() == null || LocalDate.now().isAfter(payload.expiryDate())) {
            log.error("Licensing failure: Target license expired on {}", payload.expiryDate());
            throw new SecurityException("License validation failed.");
        }

        // 5. Validate Product Code
        if (!"AUTONOMA_ERP".equals(payload.productCode())) {
            log.error("Invalid product assignment: {}", payload.productCode());
            throw new SecurityException("License validation failed.");
        }

        // 6. Validate Client Code against Company Credentials (AD_COMPANY_CREDENTIAL)
        CompanyCredential company = companyCredentialService.findByClientCode(payload.clientCode()).orElse(null);
        if (company == null) {
            log.error("No company credentials found in AD_COMPANY_CREDENTIAL.");
            throw new SecurityException("License validation failed.");
        }
        if (company.getClientCode() == null || !company.getClientCode().trim().equals(payload.clientCode())) {
            log.error("License client code '{}' does not match company credential client code '{}'.", 
                payload.clientCode(), company.getClientCode());
            throw new SecurityException("License validation failed.");
        }

        // Cache the verified license payload
        verifiedPayload = payload;

        log.info("Offline license verified successfully for client code: {}", payload.clientCode());
    }

    /**
     * Cleanly stops the Spring application context and terminates the JVM.
     */
    private void shutdownSystem() {
        log.warn("Terminating Spring context gracefully...");
        try {
            applicationContext.close();
        } catch (Exception e) {
            log.error("Error closing application context", e);
        } finally {
            System.exit(1);
        }
    }
}
