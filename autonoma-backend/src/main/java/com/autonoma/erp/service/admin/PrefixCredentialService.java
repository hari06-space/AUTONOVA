package com.autonoma.erp.service.admin;

import com.autonoma.erp.model.admin.PrefixCredential;
import com.autonoma.erp.repository.admin.PrefixCredentialRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class PrefixCredentialService {

    @Autowired
    private PrefixCredentialRepository repository;

    private final List<PrefixCredential> cachedPrefixes = new CopyOnWriteArrayList<>();
    private volatile long lastCacheTime = 0L;
    private static final long CACHE_TTL = 300_000L; // 5 minutes

    public List<PrefixCredential> getAllPrefixCredentials() {
        long now = System.currentTimeMillis();
        if (cachedPrefixes.isEmpty() || (now - lastCacheTime) > CACHE_TTL) {
            refreshCache();
        }
        return cachedPrefixes;
    }

    private synchronized void refreshCache() {
        List<PrefixCredential> fresh = repository.findAll();
        cachedPrefixes.clear();
        cachedPrefixes.addAll(fresh);
        lastCacheTime = System.currentTimeMillis();
    }

    public Optional<PrefixCredential> getPrefixCredentialById(String accountYear) {
        return getAllPrefixCredentials().stream()
                .filter(p -> p.getAccountYear() != null && p.getAccountYear().equalsIgnoreCase(accountYear))
                .findFirst();
    }

    public PrefixCredential createPrefixCredential(PrefixCredential credential) {
        credential.setCreatedDate(new Date());
        if (credential.getStatus() == null) {
            credential.setStatus(1);
        }
        PrefixCredential saved = repository.save(credential);
        refreshCache();
        return saved;
    }

    public PrefixCredential updatePrefixCredential(String accountYear, PrefixCredential credentialDetails) {
        return repository.findById(accountYear).map(credential -> {
            BeanUtils.copyProperties(credentialDetails, credential, "accountYear", "createdBy", "createdDate");
            credential.setUpdatedDate(new Date());
            PrefixCredential saved = repository.save(credential);
            refreshCache();
            return saved;
        }).orElseThrow(() -> new RuntimeException("PrefixCredential not found for account year: " + accountYear));
    }

    public void deletePrefixCredential(String accountYear) {
        repository.deleteById(accountYear);
        refreshCache();
    }
}

