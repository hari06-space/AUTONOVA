package com.autonoma.erp.security.license;

import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/internal-licensing")
public class VendorAuthController {

    private static final Logger log = LoggerFactory.getLogger(VendorAuthController.class);

    @Value("${vendor.security.admin-username:vendoradmin}")
    private String adminUsername;

    @Value("${vendor.security.admin-password:JCROS1BTQiMj}")
    private String adminPassword;

    // Thread-safe map to store active vendor session tokens
    private static final Set<String> activeSessions = ConcurrentHashMap.newKeySet();

    @Autowired
    private CompanyCredentialRepository companyCredentialRepository;

    /**
     * Authenticate vendor admin.
     */
    @PostMapping("/auth")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(java.nio.charset.StandardCharsets.UTF_8));

            String actualPassword = adminPassword;
            try {
                actualPassword = new String(Base64.getDecoder().decode(adminPassword), StandardCharsets.UTF_8);
            } catch (Exception e) {
                // Fallback to plain text if not valid Base64
            }
            byte[] actualHash = digest.digest(actualPassword.getBytes(StandardCharsets.UTF_8));

            if ("vendoradmin".equals(username) && java.security.MessageDigest.isEqual(hash, actualHash)) {
                String token = UUID.randomUUID().toString();
                activeSessions.add(token);

                Map<String, String> response = new HashMap<>();
                response.put("token", token);
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            log.error("Failed to authenticate vendor: {}", e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("error", "Invalid vendor credentials."));
    }

    /**
     * Revoke vendor admin session.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "X-Vendor-Token", required = false) String token) {
        if (token != null) {
            activeSessions.remove(token);
        }
        return ResponseEntity.ok().build();
    }

    @Autowired(required = false)
    private com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository statusMasterRepository;

    private String resolveStatusName(Long statusId) {
        if (statusId != null && statusMasterRepository != null) {
            return statusMasterRepository.findById(statusId)
                    .map(com.autonoma.erp.modules.platform.common.entity.StatusMaster::getName)
                    .orElse("ACTIVE");
        }
        return "ACTIVE";
    }

    /**
     * Lists active clients.
     */
    @GetMapping("/clients")
    public ResponseEntity<?> listClients(@RequestHeader(value = "X-Vendor-Token", required = false) String token) {
        if (token == null || !activeSessions.contains(token)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied.");
        }

        List<CompanyCredential> clients = companyCredentialRepository.findAll();
        List<Map<String, Object>> responseList = new ArrayList<>();

        for (CompanyCredential c : clients) {
            Map<String, Object> map = new HashMap<>();
            map.put("clientName", c.getCompanyName());
            map.put("clientCode", c.getClientCode());
            map.put("productCode", "AUTONOMA_ERP");
            map.put("status", Boolean.TRUE.equals(c.getIsActive()) ? "ACTIVE" : "INACTIVE");
            responseList.add(map);
        }

        return ResponseEntity.ok(responseList);
    }

    /**
     * Generates and downloads the license.lic file.
     */
    @PostMapping(value = "/generate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> generateLicense(
            @RequestHeader(value = "X-Vendor-Token", required = false) String token,
            @RequestParam("clientCode") String clientCode,
            @RequestParam("productCode") String productCode,
            @RequestParam("expiryDate") String expiryDateStr,
            @RequestParam("privateKeyFile") MultipartFile privateKeyFile,
            @RequestParam(value = "privateKeyPassword", required = false) String privateKeyPassword) {

        if (token == null || !activeSessions.contains(token)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied.");
        }

        byte[] rawKeyBytes = null;
        try {
            rawKeyBytes = privateKeyFile.getBytes();
            String keyStr = new String(rawKeyBytes, StandardCharsets.UTF_8).trim();

            // Extract binary payload if PEM
            if (keyStr.contains("-----BEGIN")) {
                String pem = keyStr
                        .replaceAll("-----BEGIN.*PRIVATE KEY-----", "")
                        .replaceAll("-----END.*PRIVATE KEY-----", "")
                        .replaceAll("\\s+", "");
                rawKeyBytes = Base64.getDecoder().decode(pem);
            }

            // Handle password encrypted private key if needed
            if (privateKeyPassword != null && !privateKeyPassword.trim().isEmpty()) {
                try {
                    javax.crypto.EncryptedPrivateKeyInfo epki = new javax.crypto.EncryptedPrivateKeyInfo(rawKeyBytes);
                    javax.crypto.spec.PBEKeySpec pbeSpec = new javax.crypto.spec.PBEKeySpec(
                            privateKeyPassword.toCharArray());
                    String algName = epki.getAlgName();
                    javax.crypto.SecretKeyFactory skf = javax.crypto.SecretKeyFactory.getInstance(algName);
                    javax.crypto.SecretKey pbeKey = skf.generateSecret(pbeSpec);
                    javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance(algName);
                    cipher.init(javax.crypto.Cipher.DECRYPT_MODE, pbeKey, epki.getAlgParameters());
                    byte[] decryptedBytes = epki.getKeySpec(cipher).getEncoded();

                    // Wipe rawKeyBytes and replace
                    CryptoEngine.wipeMemory(rawKeyBytes);
                    rawKeyBytes = decryptedBytes;
                    pbeSpec.clearPassword();
                } catch (Exception ex) {
                    log.error("Failed to decrypt private key: {}", ex.getMessage());
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("Failed to decrypt private key. Incorrect password?");
                }
            }

            LocalDate expiryDate = LocalDate.parse(expiryDateStr);
            LicensePayload payload = new LicensePayload(clientCode, productCode, expiryDate);

            // Generate binary file
            byte[] licenseLicBytes = CryptoEngine.generateLicenseFile(payload, rawKeyBytes);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"license.lic\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(licenseLicBytes);

        } catch (Exception e) {
            log.error("Error generating license: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        } finally {
            CryptoEngine.wipeMemory(rawKeyBytes);
        }
    }
}
