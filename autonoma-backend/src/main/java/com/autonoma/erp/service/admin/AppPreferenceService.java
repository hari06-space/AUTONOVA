package com.autonoma.erp.service.admin;

import com.autonoma.erp.model.admin.AppPreference;
import com.autonoma.erp.repository.admin.AppPreferenceRepository;
import com.autonoma.erp.modules.platform.identity.repository.CliClientDatabaseConfigRepository;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;
import com.autonoma.erp.model.admin.CompanyCredential;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AppPreferenceService {

    @Autowired
    private AppPreferenceRepository repository;

    @Autowired(required = false)
    private CliClientDatabaseConfigRepository clientDatabaseConfigRepository;

    @Autowired(required = false)
    private CompanyCredentialService companyCredentialService;

    public List<AppPreference> findAll() {
        return repository.findAll();
    }

    public Optional<AppPreference> findById(Integer id) {
        return repository.findById(id);
    }

    public AppPreference save(AppPreference appPreference) {
        return repository.save(appPreference);
    }

    public void deleteById(Integer id) {
        repository.deleteById(id);
    }

    public AppPreference upsertByName(String prefName, String prefValue, String comments, String prefType) {
        Optional<AppPreference> existingOpt = repository.findByPrefName(prefName);
        AppPreference pref;
        if (existingOpt.isPresent()) {
            pref = existingOpt.get();
            pref.setPrefValue(prefValue);
            if (comments != null) pref.setComments(comments);
            if (prefType != null) pref.setPrefType(prefType);
            pref.setUpdatedDate(new java.util.Date());
            try {
                pref.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            } catch (Exception e) {
                pref.setUpdatedBy("SYSTEM");
            }
        } else {
            pref = new AppPreference();
            pref.setPrefName(prefName);
            pref.setPrefValue(prefValue);
            pref.setComments(comments);
            pref.setPrefType(prefType != null ? prefType : "HRA");
            pref.setCreatedDate(new java.util.Date());
            try {
                pref.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            } catch (Exception e) {
                pref.setCreatedBy("SYSTEM");
            }
        }
        return repository.save(pref);
    }

    public int getEsslSyncIntervalMinutes() {
        // 1. Try reading from Client Master (CliClientDatabaseConfig)
        try {
            if (clientDatabaseConfigRepository != null) {
                var configs = clientDatabaseConfigRepository.findAll();
                if (!configs.isEmpty()) {
                    for (var cfg : configs) {
                        if (cfg.getEsslSyncIntervalMinutes() != null) {
                            return Math.max(cfg.getEsslSyncIntervalMinutes(), 10);
                        }
                    }
                }
            }
        } catch (Exception e) {}

        try {
            if (companyCredentialService != null) {
                CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
                if (company != null && company.getEsslSyncIntervalMinutes() != null) {
                    return Math.max(company.getEsslSyncIntervalMinutes(), 10);
                }
            }
        } catch (Exception e) {}

        // 3. Fallback to AppPreference (Minimum 10 mins)
        try {
            Optional<AppPreference> pref = repository.findByPrefName("ESSL_SYNC_INTERVAL_MINUTES");
            if (pref.isPresent() && pref.get().getPrefValue() != null) {
                int mins = Integer.parseInt(pref.get().getPrefValue().trim());
                return Math.max(mins, 10);
            }
        } catch (Exception e) {}

        return 15;
    }

    public String getValue(String prefName, String defaultValue) {
        try {
            Optional<AppPreference> pref = repository.findByPrefName(prefName);
            if (pref.isPresent() && pref.get().getPrefValue() != null && !pref.get().getPrefValue().isBlank()) {
                return pref.get().getPrefValue().trim();
            }
        } catch (Exception e) {}
        return defaultValue;
    }

    public int getIntValue(String prefName, int defaultValue) {
        try {
            String val = getValue(prefName, null);
            if (val != null) {
                return Integer.parseInt(val);
            }
        } catch (Exception e) {}
        return defaultValue;
    }

    public boolean getBooleanValue(String prefName, boolean defaultValue) {
        try {
            String val = getValue(prefName, null);
            if (val != null) {
                return "yes".equalsIgnoreCase(val) || "true".equalsIgnoreCase(val) || "1".equals(val);
            }
        } catch (Exception e) {}
        return defaultValue;
    }
}
