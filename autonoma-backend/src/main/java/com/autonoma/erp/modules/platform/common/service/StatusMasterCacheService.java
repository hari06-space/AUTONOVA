package com.autonoma.erp.modules.platform.common.service;

import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class StatusMasterCacheService {

    @Autowired
    private StatusMasterRepository statusMasterRepository;

    private final Map<String, StatusMaster> nameCache = new ConcurrentHashMap<>();
    private final Map<Long, StatusMaster> idCache = new ConcurrentHashMap<>();
    private volatile long lastRefreshTime = 0L;
    private static final long TTL = 1800_000L; // 30 minutes

    public StatusMaster getStatusByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }
        checkAndRefresh();
        String key = name.trim().toUpperCase();
        StatusMaster cached = nameCache.get(key);
        if (cached != null) {
            return cached;
        }

        // Database lookup on cache miss
        Optional<StatusMaster> opt = statusMasterRepository.findFirstByNameIgnoreCase(name.trim());
        if (opt.isPresent()) {
            StatusMaster s = opt.get();
            nameCache.put(key, s);
            if (s.getId() != null) {
                idCache.put(s.getId(), s);
            }
            return s;
        }
        return null;
    }

    public Integer getStatusIdByName(String name) {
        StatusMaster status = getStatusByName(name);
        return status != null && status.getId() != null ? status.getId().intValue() : null;
    }

    public StatusMaster getStatusById(Long id) {
        if (id == null) return null;
        checkAndRefresh();
        StatusMaster cached = idCache.get(id);
        if (cached != null) return cached;

        Optional<StatusMaster> opt = statusMasterRepository.findById(id);
        if (opt.isPresent()) {
            StatusMaster s = opt.get();
            idCache.put(id, s);
            if (s.getName() != null) {
                nameCache.put(s.getName().trim().toUpperCase(), s);
            }
            return s;
        }
        return null;
    }

    public synchronized StatusMaster getOrCreateStatus(String name) {
        StatusMaster existing = getStatusByName(name);
        if (existing != null) {
            return existing;
        }

        StatusMaster newStatus = new StatusMaster();
        newStatus.setName(name.trim());
        StatusMaster saved = statusMasterRepository.save(newStatus);
        invalidateCache();
        return saved;
    }

    public synchronized void invalidateCache() {
        nameCache.clear();
        idCache.clear();
        lastRefreshTime = 0L;
    }

    private void checkAndRefresh() {
        long now = System.currentTimeMillis();
        if (nameCache.isEmpty() || (now - lastRefreshTime) > TTL) {
            synchronized (this) {
                if (nameCache.isEmpty() || (now - lastRefreshTime) > TTL) {
                    nameCache.clear();
                    idCache.clear();
                    statusMasterRepository.findAll().forEach(s -> {
                        if (s.getName() != null) {
                            nameCache.put(s.getName().trim().toUpperCase(), s);
                        }
                        if (s.getId() != null) {
                            idCache.put(s.getId(), s);
                        }
                    });
                    lastRefreshTime = System.currentTimeMillis();
                }
            }
        }
    }
}
