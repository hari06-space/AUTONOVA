package com.autonoma.erp.service.admin;

import AppUtil.AppConstants;

import com.autonoma.erp.model.admin.BosPage;
import com.autonoma.erp.model.admin.BosUserPageAuth;
import com.autonoma.erp.repository.admin.BosPageRepository;
import com.autonoma.erp.repository.admin.BosUserPageAuthRepository;
import com.autonoma.erp.repository.admin.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class BosUserPageAuthService {

    @Autowired
    private BosUserPageAuthRepository authRepository;

    @Autowired
    private BosPageRepository pageRepository;

    @Autowired
    private UserRepository userRepository;

    // Cache user permissions: lowercase(userId) -> UserPermissionEntry (5 minutes TTL)
    private final ConcurrentHashMap<String, UserPermissionEntry> permissionCache = new ConcurrentHashMap<>();

    // Cache page definitions: lowercase(pageCode) -> BosPage (15 minutes TTL)
    private final ConcurrentHashMap<String, PageCacheEntry> pageCache = new ConcurrentHashMap<>();

    private static final long PERMISSION_CACHE_TTL = 300_000L; // 5 minutes
    private static final long PAGE_CACHE_TTL = 900_000L;       // 15 minutes

    private static class PageCacheEntry {
        final long timestamp;
        final BosPage page;

        PageCacheEntry(BosPage page) {
            this.timestamp = System.currentTimeMillis();
            this.page = page;
        }

        boolean isExpired() {
            return (System.currentTimeMillis() - timestamp) > PAGE_CACHE_TTL;
        }
    }

    private static class UserActionPermission {
        final boolean enabled;
        final boolean read;
        final boolean write;
        final boolean delete;
        final boolean export;
        final boolean approval;
        final boolean manager;
        final boolean additional1;
        final boolean additional2;

        UserActionPermission(BosUserPageAuth a) {
            this.enabled = a != null && a.getEnable() != null && a.getEnable() == 1;
            this.read = a != null && a.getReadAcs() != null && a.getReadAcs() == 1;
            this.write = a != null && a.getWrite() != null && a.getWrite() == 1;
            this.delete = a != null && a.getDeleteAcs() != null && a.getDeleteAcs() == 1;
            this.export = a != null && a.getExport() != null && a.getExport() == 1;
            this.approval = a != null && a.getApproval() != null && a.getApproval() == 1;
            this.manager = a != null && a.getManager() != null && a.getManager() == 1;
            this.additional1 = a != null && a.getAdditional1() != null && a.getAdditional1() == 1;
            this.additional2 = a != null && a.getAdditional2() != null && a.getAdditional2() == 1;
        }

        boolean hasAction(String action) {
            if (!enabled) return false;
            return switch (action.toLowerCase()) {
                case "read" -> read;
                case "write" -> write;
                case "delete" -> delete;
                case "export" -> export;
                case "approval" -> approval;
                case "manager" -> manager;
                case "additional1" -> additional1;
                case "additional2" -> additional2;
                default -> false;
            };
        }
    }

    private static class UserPermissionEntry {
        final long timestamp;
        final String exactUserId;
        final Map<String, UserActionPermission> permissionsByPageCode; // lowercase(pageCode) -> permission

        UserPermissionEntry(String exactUserId, Map<String, UserActionPermission> permissionsByPageCode) {
            this.timestamp = System.currentTimeMillis();
            this.exactUserId = exactUserId;
            this.permissionsByPageCode = permissionsByPageCode;
        }

        boolean isExpired() {
            return (System.currentTimeMillis() - timestamp) > PERMISSION_CACHE_TTL;
        }
    }

    /**
     * Resolve exact case-sensitive User ID with direct indexed queries instead of full-table scan.
     */
    private String resolveExactUserId(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return userId;
        }
        return userRepository.findByUserId(userId)
                .map(u -> u.getUserId())
                .orElseGet(() -> userRepository.findByUserIdIgnoreCase(userId)
                        .map(u -> u.getUserId())
                        .orElse(userId));
    }

    /**
     * Invalidate all cached permissions (e.g. after admin updates permissions).
     */
    public void invalidatePermissionCache() {
        permissionCache.clear();
        pageCache.clear();
        pagesByIdCache.clear();
        pagesByIdCacheTime = 0L;
    }

    /**
     * Invalidate cached permissions for a specific user.
     */
    public void invalidateUserPermissionCache(String userId) {
        if (userId != null) {
            permissionCache.remove(userId.toLowerCase());
        }
    }

    @Transactional(readOnly = true)
    public List<BosUserPageAuth> getAuthByUserId(String userId) {
        String exactUserId = resolveExactUserId(userId);

        List<BosPage> allPages = pageRepository.findAll();
        List<BosUserPageAuth> userAuths = authRepository.findByUserId(exactUserId);

        Map<Integer, BosUserPageAuth> authMap = userAuths.stream()
                .collect(Collectors.toMap(BosUserPageAuth::getPageId, a -> a, (p1, p2) -> p1));

        List<BosUserPageAuth> result = new ArrayList<>();
        for (BosPage page : allPages) {
            // Skip sidebar group-collapse entries — they are navigation UI helpers
            String pageName = page.getPageName();
            if (pageName != null && (pageName.toLowerCase().endsWith("collapse")
                    || pageName.toLowerCase().endsWith("trans collapse"))) {
                continue;
            }

            BosUserPageAuth auth = authMap.get(page.getPageId());
            if (auth == null) {
                auth = new BosUserPageAuth();
                auth.setUserId(exactUserId);
                auth.setPageId(page.getPageId());
                auth.setModId(page.getModule() != null ? page.getModule().getModuleId() : null);
                auth.setSubModId(page.getSubModule() != null ? page.getSubModule().getSubModId() : null);
                auth.setEnable(0);
                auth.setReadAcs(0);
                auth.setWrite(0);
                auth.setDeleteAcs(0);
                auth.setExport(0);
                auth.setApproval(0);
                auth.setManager(0);
                auth.setAdditional1(0);
                auth.setAdditional2(0);
                auth.setAddTaskEnable(0);
            }

            auth.setPage(page);
            result.add(auth);
        }
        return result;
    }

    @Transactional
    public void saveAll(List<BosUserPageAuth> auths) {
        String currentUser = null;
        try {
            currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {
        }

        // Verify if currentUser exists in DB and get the exact case-sensitive User ID
        java.util.Optional<com.autonoma.erp.model.admin.UserCredential> userOpt = userRepository
                .findByUserId(currentUser);
        String exactCurrentUser = userOpt.isPresent() ? userOpt.get().getUserId() : null;

        java.util.Date now = new java.util.Date();

        for (BosUserPageAuth auth : auths) {
            if (auth.getModId() == null || auth.getSubModId() == null) {
                BosPage page = pageRepository.findById(auth.getPageId()).orElse(null);
                if (page != null) {
                    if (auth.getModId() == null && page.getModule() != null) {
                        auth.setModId(page.getModule().getModuleId());
                    }
                    if (auth.getSubModId() == null && page.getSubModule() != null) {
                        auth.setSubModId(page.getSubModule().getSubModId());
                    }
                }
            }

            if (auth.getModId() == null) {
                auth.setModId(0); // safeguard for not-null column MOD_ID
            }

            if (auth.getAddTaskEnable() == null)
                auth.setAddTaskEnable(0);
            if (auth.getEnable() == null)
                auth.setEnable(0);
            if (auth.getReadAcs() == null)
                auth.setReadAcs(0);
            if (auth.getWrite() == null)
                auth.setWrite(0);
            if (auth.getDeleteAcs() == null)
                auth.setDeleteAcs(0);
            if (auth.getExport() == null)
                auth.setExport(0);
            if (auth.getApproval() == null)
                auth.setApproval(0);
            if (auth.getManager() == null)
                auth.setManager(0);
            if (auth.getAdditional1() == null)
                auth.setAdditional1(0);
            if (auth.getAdditional2() == null)
                auth.setAdditional2(0);

            BosUserPageAuth existing = authRepository.findByUserIdAndPageId(auth.getUserId(), auth.getPageId());
            String safeUser = exactCurrentUser != null ? exactCurrentUser : auth.getUserId();

            if (existing != null) {
                existing.setSubModId(auth.getSubModId());
                existing.setModId(auth.getModId());
                existing.setEnable(auth.getEnable());
                existing.setReadAcs(auth.getReadAcs());
                existing.setWrite(auth.getWrite());
                existing.setDeleteAcs(auth.getDeleteAcs());
                existing.setExport(auth.getExport());
                existing.setApproval(auth.getApproval());
                existing.setManager(auth.getManager());
                existing.setAdditional1(auth.getAdditional1());
                existing.setAdditional2(auth.getAdditional2());
                existing.setAddTaskEnable(auth.getAddTaskEnable());
                existing.setUpdatedBy(safeUser);
                existing.setUpdatedDate(now);
                authRepository.save(existing);
            } else {
                auth.setCreatedBy(safeUser);
                auth.setCreatedDate(now);
                auth.setUpdatedBy(safeUser);
                auth.setUpdatedDate(now);
                authRepository.save(auth);
            }
        }

        // Invalidate in-memory permission cache immediately upon save
        invalidatePermissionCache();
    }

    /**
     * Check if a user has a specific permission on a page.
     * High-performance, O(1) in-memory cached lookup. ZERO database queries on warm cache.
     *
     * @param userId   The user ID
     * @param pageCode The page code (e.g., "M3110")
     * @param action   The permission type: "read", "write", "delete", "export", "approval", etc.
     * @return true if the user has the requested permission
     */
    public boolean hasPermission(String userId, String pageCode, String action) {
        if (userId == null || pageCode == null || action == null) {
            return false;
        }

        // Users with userLevel >= 5 (BOS Admin / Super Admin) have full access to all pages and actions
        String exactUserId = resolveExactUserId(userId);
        if (exactUserId != null) {
            java.util.Optional<com.autonoma.erp.model.admin.UserCredential> userOpt = userRepository.findByUserId(exactUserId);
            if (userOpt.isPresent() && userOpt.get().getUserLevel() != null && userOpt.get().getUserLevel() >= 5) {
                return true;
            }
        }

        String userKey = userId.trim().toLowerCase();
        UserPermissionEntry userEntry = permissionCache.get(userKey);

        if (userEntry == null || userEntry.isExpired()) {
            userEntry = loadUserPermissionEntry(userId);
            if (userEntry != null) {
                permissionCache.put(userKey, userEntry);
            } else {
                return false;
            }
        }

        String pageKey = pageCode.trim().toLowerCase();
        UserActionPermission perm = userEntry.permissionsByPageCode.get(pageKey);
        if (perm == null) {
            return false;
        }

        return perm.hasAction(action);
    }

    /**
     * Retrieve all page codes for which the user has a specific permission (e.g., "export").
     * Returns null for Super Admin (userLevel >= 5), indicating unrestricted access.
     * Returns empty set if user has no export permissions on any page.
     */
    public Set<String> getAllowedPageCodes(String userId, String action) {
        if (userId == null || userId.trim().isEmpty()) {
            return Collections.emptySet();
        }

        String exactUserId = resolveExactUserId(userId);
        if (exactUserId != null) {
            java.util.Optional<com.autonoma.erp.model.admin.UserCredential> userOpt = userRepository.findByUserId(exactUserId);
            if (userOpt.isPresent() && userOpt.get().getUserLevel() != null && userOpt.get().getUserLevel() >= 5) {
                return null; // Unrestricted superadmin
            }
        }

        String userKey = userId.trim().toLowerCase();
        UserPermissionEntry userEntry = permissionCache.get(userKey);
        if (userEntry == null || userEntry.isExpired()) {
            userEntry = loadUserPermissionEntry(userId);
            if (userEntry != null) {
                permissionCache.put(userKey, userEntry);
            } else {
                return Collections.emptySet();
            }
        }

        Set<String> allowed = new HashSet<>();
        if (userEntry.permissionsByPageCode != null) {
            for (Map.Entry<String, UserActionPermission> entry : userEntry.permissionsByPageCode.entrySet()) {
                if (entry.getKey() != null && entry.getValue() != null && entry.getValue().hasAction(action)) {
                    allowed.add(entry.getKey().toUpperCase());
                }
            }
        }
        return allowed;
    }

    private final Map<Integer, BosPage> pagesByIdCache = new ConcurrentHashMap<>();
    private volatile long pagesByIdCacheTime = 0L;

    private Map<Integer, BosPage> getPagesByIdMap() {
        long now = System.currentTimeMillis();
        if (pagesByIdCache.isEmpty() || (now - pagesByIdCacheTime) > PAGE_CACHE_TTL) {
            synchronized (pagesByIdCache) {
                if (pagesByIdCache.isEmpty() || (now - pagesByIdCacheTime) > PAGE_CACHE_TTL) {
                    pagesByIdCache.clear();
                    pageRepository.findAll().forEach(p -> {
                        if (p.getPageId() != null) {
                            pagesByIdCache.put(p.getPageId(), p);
                        }
                    });
                    pagesByIdCacheTime = System.currentTimeMillis();
                }
            }
        }
        return pagesByIdCache;
    }

    private UserPermissionEntry loadUserPermissionEntry(String userId) {
        String exactUserId = resolveExactUserId(userId);
        if (exactUserId == null) {
            return null;
        }

        // 1. Fetch user page authorizations in ONE indexed query
        List<BosUserPageAuth> auths = authRepository.findByUserId(exactUserId);

        // 2. Use cached pages map
        Map<Integer, BosPage> pagesById = getPagesByIdMap();

        Map<String, UserActionPermission> permMap = new ConcurrentHashMap<>();

        for (BosUserPageAuth auth : auths) {
            if (auth.getPageId() != null) {
                BosPage page = pagesById.get(auth.getPageId());
                if (page != null && page.getPageCode() != null) {
                    if (page.getEnabled() != null && page.getEnabled() == 1) {
                        permMap.put(page.getPageCode().trim().toLowerCase(), new UserActionPermission(auth));
                    }
                }
            }
        }

        return new UserPermissionEntry(exactUserId, permMap);
    }

    public Set<Integer> getEnabledPageIdsByUserId(String userId) {
        String exactUserId = resolveExactUserId(userId);
        return authRepository.findEnabledPageIdsByUserId(exactUserId);
    }
}

