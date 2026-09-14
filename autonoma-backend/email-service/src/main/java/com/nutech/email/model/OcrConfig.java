package com.nutech.email.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "AD_OCR_CONFIG")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OcrConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "OCR_TENANT_ID")
    private String ocrTenantId;

    @Column(name = "OCR_CLIENT_ID")
    private String ocrClientId;

    @Column(name = "OCR_CLIENT_SECRET")
    private String ocrClientSecret;

    @Column(name = "OCR_SHARED_MAILBOX")
    private String ocrSharedMailbox;

    @Column(name = "OCR_PROCESSED_FOLDER")
    private String ocrProcessedFolder;

    @Column(name = "ACCESS_TOKEN")
    private String accessToken;

    @Column(name = "REFRESH_TOKEN")
    private String refreshToken;

    @Column(name = "COMPANY_CREDENTIAL_ID")
    private Long companyCredentialId;

    @Column(name = "EXPIRES_AT")
    @Temporal(TemporalType.TIMESTAMP)
    private Date expiresAt;

    @Column(name = "ACTIVE_EMAIL_PROVIDER", columnDefinition = "NVARCHAR(50)")
    private String activeEmailProvider = "OUTLOOK";

    @Column(name = "PROVIDER_CONFIGS_JSON", columnDefinition = "NVARCHAR(MAX)")
    private String providerConfigsJson;

    @Transient
    private static final com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

    @SuppressWarnings("unchecked")
    private String getProviderProperty(String key) {
        if (providerConfigsJson == null || providerConfigsJson.trim().isEmpty()) {
            return null;
        }
        try {
            java.util.Map<String, Object> map = mapper.readValue(providerConfigsJson, java.util.Map.class);
            if (map != null && activeEmailProvider != null) {
                java.util.Map<String, Object> providerMap = (java.util.Map<String, Object>) map.get(activeEmailProvider.toUpperCase());
                if (providerMap != null) {
                    Object val = providerMap.get(key);
                    return val != null ? String.valueOf(val) : null;
                }
            }
        } catch (Exception e) {
            // Fallback
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private void setProviderProperty(String key, Object value) {
        try {
            java.util.Map<String, Object> map;
            if (providerConfigsJson == null || providerConfigsJson.trim().isEmpty()) {
                map = new java.util.HashMap<>();
            } else {
                map = mapper.readValue(providerConfigsJson, java.util.Map.class);
                map = new java.util.HashMap<>(map);
            }
            String providerKey = activeEmailProvider != null ? activeEmailProvider.toUpperCase() : "OUTLOOK";
            java.util.Map<String, Object> providerMap = (java.util.Map<String, Object>) map.get(providerKey);
            if (providerMap == null) {
                providerMap = new java.util.HashMap<>();
            } else {
                providerMap = new java.util.HashMap<>(providerMap);
            }
            if (value == null) {
                providerMap.remove(key);
            } else {
                providerMap.put(key, value);
            }
            map.put(providerKey, providerMap);
            this.providerConfigsJson = mapper.writeValueAsString(map);
        } catch (Exception e) {
            // Fallback
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCompanyCredentialId() { return companyCredentialId; }
    public void setCompanyCredentialId(Long companyCredentialId) { this.companyCredentialId = companyCredentialId; }

    public String getActiveEmailProvider() { return activeEmailProvider; }
    public void setActiveEmailProvider(String activeEmailProvider) { this.activeEmailProvider = activeEmailProvider; }
    public String getProviderConfigsJson() { return providerConfigsJson; }
    public void setProviderConfigsJson(String providerConfigsJson) { this.providerConfigsJson = providerConfigsJson; }

    public String getOcrTenantId() {
        if (activeEmailProvider == null || "OUTLOOK".equalsIgnoreCase(activeEmailProvider)) {
            return ocrTenantId;
        }
        return getProviderProperty("tenantId");
    }
    public void setOcrTenantId(String ocrTenantId) {
        if (activeEmailProvider == null || "OUTLOOK".equalsIgnoreCase(activeEmailProvider)) {
            this.ocrTenantId = ocrTenantId;
        } else {
            setProviderProperty("tenantId", ocrTenantId);
        }
    }

    public String getOcrClientId() {
        if (activeEmailProvider == null || "OUTLOOK".equalsIgnoreCase(activeEmailProvider)) {
            return ocrClientId;
        }
        return getProviderProperty("clientId");
    }
    public void setOcrClientId(String ocrClientId) {
        if (activeEmailProvider == null || "OUTLOOK".equalsIgnoreCase(activeEmailProvider)) {
            this.ocrClientId = ocrClientId;
        } else {
            setProviderProperty("clientId", ocrClientId);
        }
    }

    public String getOcrClientSecret() {
        if (activeEmailProvider == null || "OUTLOOK".equalsIgnoreCase(activeEmailProvider)) {
            return ocrClientSecret;
        }
        return getProviderProperty("clientSecret");
    }
    public void setOcrClientSecret(String ocrClientSecret) {
        if (activeEmailProvider == null || "OUTLOOK".equalsIgnoreCase(activeEmailProvider)) {
            this.ocrClientSecret = ocrClientSecret;
        } else {
            setProviderProperty("clientSecret", ocrClientSecret);
        }
    }

    public String getOcrSharedMailbox() {
        if (activeEmailProvider == null || "OUTLOOK".equalsIgnoreCase(activeEmailProvider)) {
            return ocrSharedMailbox;
        }
        return getProviderProperty("sharedMailbox");
    }
    public void setOcrSharedMailbox(String ocrSharedMailbox) {
        if (activeEmailProvider == null || "OUTLOOK".equalsIgnoreCase(activeEmailProvider)) {
            this.ocrSharedMailbox = ocrSharedMailbox;
        } else {
            setProviderProperty("sharedMailbox", ocrSharedMailbox);
        }
    }

    public String getOcrProcessedFolder() {
        if (activeEmailProvider == null || "OUTLOOK".equalsIgnoreCase(activeEmailProvider)) {
            return ocrProcessedFolder;
        }
        return getProviderProperty("processedFolder");
    }
    public void setOcrProcessedFolder(String ocrProcessedFolder) {
        if (activeEmailProvider == null || "OUTLOOK".equalsIgnoreCase(activeEmailProvider)) {
            this.ocrProcessedFolder = ocrProcessedFolder;
        } else {
            setProviderProperty("processedFolder", ocrProcessedFolder);
        }
    }

    public String getAccessToken() {
        if (activeEmailProvider == null || "OUTLOOK".equalsIgnoreCase(activeEmailProvider)) {
            return accessToken;
        }
        return getProviderProperty("accessToken");
    }
    public void setAccessToken(String accessToken) {
        if (activeEmailProvider == null || "OUTLOOK".equalsIgnoreCase(activeEmailProvider)) {
            this.accessToken = accessToken;
        } else {
            setProviderProperty("accessToken", accessToken);
        }
    }

    public String getRefreshToken() {
        if (activeEmailProvider == null || "OUTLOOK".equalsIgnoreCase(activeEmailProvider)) {
            return refreshToken;
        }
        return getProviderProperty("refreshToken");
    }
    public void setRefreshToken(String refreshToken) {
        if (activeEmailProvider == null || "OUTLOOK".equalsIgnoreCase(activeEmailProvider)) {
            this.refreshToken = refreshToken;
        } else {
            setProviderProperty("refreshToken", refreshToken);
        }
    }

    public Date getExpiresAt() {
        if (activeEmailProvider == null || "OUTLOOK".equalsIgnoreCase(activeEmailProvider)) {
            return expiresAt;
        }
        String val = getProviderProperty("expiresAt");
        if (val == null) return null;
        try {
            return new Date(Long.parseLong(val));
        } catch (Exception e) {
            try {
                return mapper.getDateFormat().parse(val);
            } catch (Exception ex) {
                return null;
            }
        }
    }
    public void setExpiresAt(Date expiresAt) {
        if (activeEmailProvider == null || "OUTLOOK".equalsIgnoreCase(activeEmailProvider)) {
            this.expiresAt = expiresAt;
        } else {
            setProviderProperty("expiresAt", expiresAt != null ? expiresAt.getTime() : null);
        }
    }
}
