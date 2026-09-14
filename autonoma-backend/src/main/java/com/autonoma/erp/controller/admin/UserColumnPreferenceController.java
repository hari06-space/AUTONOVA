package com.autonoma.erp.controller.admin;

import com.autonoma.erp.model.admin.UserColumnPreference;
import com.autonoma.erp.repository.admin.UserColumnPreferenceRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

@RestController
@RequestMapping("/api/user-column-preferences")
@CrossOrigin(origins = "*")
public class UserColumnPreferenceController {

    @Autowired
    private UserColumnPreferenceRepository repository;

    public String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "SYSTEM";
    }

    @GetMapping
    @Cacheable(value = "columnPreferences", key = "T(org.springframework.security.core.context.SecurityContextHolder).getContext().getAuthentication()?.name ?: 'SYSTEM'")
    public ResponseEntity<List<UserColumnPreference>> getPreferences() {
        String userId = getCurrentUserId();
        if ("SYSTEM".equals(userId)) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(repository.findAllByUserId(userId));
    }

    @PostMapping("/save")
    @Transactional
    @CacheEvict(value = "columnPreferences", key = "T(org.springframework.security.core.context.SecurityContextHolder).getContext().getAuthentication()?.name ?: 'SYSTEM'")
    public ResponseEntity<UserColumnPreference> savePreference(@RequestBody UserColumnPreference payload) {
        String userId = getCurrentUserId();
        if ("SYSTEM".equals(userId)) {
            return ResponseEntity.badRequest().build();
        }

        // 1. Basic Payload Validation
        if (payload.getPageKey() == null || payload.getPageKey().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (payload.getPreferenceValue() == null || payload.getPreferenceValue().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // 2. Server-side JSON & Content Validation
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(payload.getPreferenceValue());
            JsonNode visibleNode = root.get("visibleColumns");
            if (visibleNode == null || !visibleNode.isArray()) {
                return ResponseEntity.badRequest().build();
            }
            if (visibleNode.size() == 0) {
                return ResponseEntity.badRequest().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

        // 3. Upsert Logic
        Optional<UserColumnPreference> existingOpt = repository.findByUserIdAndPageKey(userId, payload.getPageKey());
        UserColumnPreference preference;
        if (existingOpt.isPresent()) {
            preference = existingOpt.get();
            preference.setPreferenceValue(payload.getPreferenceValue());
            preference.setUpdatedBy(userId);
            preference.setUpdatedAt(new Date());
        } else {
            preference = new UserColumnPreference();
            preference.setUserId(userId);
            preference.setPageKey(payload.getPageKey());
            preference.setPreferenceValue(payload.getPreferenceValue());
            preference.setCreatedBy(userId);
            preference.setCreatedAt(new Date());
            preference.setUpdatedBy(userId);
            preference.setUpdatedAt(new Date());
        }

        return ResponseEntity.ok(repository.save(preference));
    }

    @DeleteMapping("/{pageKey}")
    @Transactional
    @CacheEvict(value = "columnPreferences", key = "T(org.springframework.security.core.context.SecurityContextHolder).getContext().getAuthentication()?.name ?: 'SYSTEM'")
    public ResponseEntity<Void> deletePreference(@PathVariable String pageKey) {
        String userId = getCurrentUserId();
        if ("SYSTEM".equals(userId)) {
            return ResponseEntity.badRequest().build();
        }

        Optional<UserColumnPreference> existingOpt = repository.findByUserIdAndPageKey(userId, pageKey);
        if (existingOpt.isPresent()) {
            repository.delete(existingOpt.get());
        }
        return ResponseEntity.ok().build();
    }
}
