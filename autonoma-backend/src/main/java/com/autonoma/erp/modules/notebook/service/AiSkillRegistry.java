package com.autonoma.erp.modules.notebook.service;

import com.autonoma.erp.modules.notebook.dto.OperationType;
import com.autonoma.erp.modules.notebook.dto.SkillManifest;
import com.autonoma.erp.modules.notebook.entity.BosAiEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Central registry of all BosEntitySkill implementations.
 *
 * It bridges compile-time BosEntitySkill classes with the database-driven
 * EntityRegistryService metadata, ensuring all skills are seeded in the DB
 * and runtime synonyms are resolved via database-managed tables.
 */
@Service
public class AiSkillRegistry {

    private final List<BosEntitySkill> allSkills;
    
    @Autowired
    private EntityRegistryService entityRegistryService;

    @Autowired
    private BusinessObjectLoader objectLoader;

    @Autowired
    private javax.sql.DataSource dataSource;

    /** Primary lookup: canonical entity name (upper case) → skill */
    private final Map<String, BosEntitySkill> entityMap = new ConcurrentHashMap<>();

    /** Module lookup: ERP module code → skill (for permission engine) */
    private final Map<String, BosEntitySkill> moduleMap = new ConcurrentHashMap<>();

    @Autowired
    public AiSkillRegistry(List<BosEntitySkill> skillList) {
        this.allSkills = skillList != null ? Collections.unmodifiableList(skillList) : List.of();
    }

    @PostConstruct
    public void init() {
        // 1. Seed DB from existing Java SkillManifest definitions
        for (BosEntitySkill skill : allSkills) {
            SkillManifest m = skill.manifest();
            entityMap.put(m.entity().toUpperCase(), skill);
            if (m.erpModule() != null) {
                moduleMap.put(m.erpModule().toUpperCase(), skill);
            }
            try {
                entityRegistryService.registerManifest(m);
            } catch (Exception e) {
                System.err.println("[BOS-AI][Registry] Failed to seed manifest for entity: " + m.entity() + ". Error: " + e.getMessage());
            }
        }

        // 2. Refresh EntityRegistryService to load all database-configured records
        entityRegistryService.reloadRegistry();

        System.out.println("[BOS-AI][Registry] Initialized " + allSkills.size() + " skills. Metadata loaded from DB registry.");
    }

    // ─── Lookups ──────────────────────────────────────────────────────────────

    /** Lookup by canonical entity name e.g. "CHECKLIST" */
    public BosEntitySkill getSkill(String entityName) {
        if (entityName == null) return null;
        String canonical = entityName.toUpperCase();
        BosEntitySkill custom = entityMap.get(canonical);
        if (custom != null) {
            return custom;
        }
        // Fallback: check if registered in DB, if so return a GenericEntitySkill
        return entityRegistryService.getEntity(canonical)
            .map(entity -> new GenericEntitySkill(entity, entityRegistryService, objectLoader, dataSource))
            .orElse(null);
    }

    /** Lookup by ERP module code e.g. "QMS_CHECKLIST" */
    public BosEntitySkill getSkillByModule(String moduleName) {
        if (moduleName == null) return null;
        String canonical = moduleName.toUpperCase();
        BosEntitySkill custom = moduleMap.get(canonical);
        if (custom != null) {
            return custom;
        }
        // Fallback: search entity with this module code in DB
        return entityRegistryService.getAllEntities().stream()
            .filter(e -> canonical.equals(e.getErpModule().toUpperCase()))
            .findFirst()
            .map(entity -> new GenericEntitySkill(entity, entityRegistryService, objectLoader, dataSource))
            .orElse(null);
    }

    /**
     * Synonym-based lookup driven by the database synonyms in BOS_AI_ENTITY.
     * Picks the best (longest) matching synonym.
     */
    public Optional<BosEntitySkill> findSkillBySynonym(String query) {
        if (query == null || query.isBlank()) return Optional.empty();
        String lower = query.toLowerCase();

        BosEntitySkill bestMatch = null;
        int bestLen = 0;

        for (BosAiEntity entity : entityRegistryService.getAllEntities()) {
            String synonymsStr = entity.getSynonyms();
            if (synonymsStr == null || synonymsStr.isBlank()) continue;

            String[] synonyms = synonymsStr.split("\\|");
            for (String synonym : synonyms) {
                String synLower = synonym.trim().toLowerCase();
                if (!synLower.isEmpty() && lower.contains(synLower) && synLower.length() > bestLen) {
                    BosEntitySkill skill = getSkill(entity.getEntityCode());
                    if (skill != null) {
                        bestLen = synLower.length();
                        bestMatch = skill;
                    }
                }
            }
        }
        return Optional.ofNullable(bestMatch);
    }

    // ─── Introspection ────────────────────────────────────────────────────────

    public Set<String> getAvailableEntities() {
        return entityMap.keySet();
    }

    public List<BosEntitySkill> getAllSkills() {
        return allSkills;
    }

    public Map<String, List<String>> getCapabilityMap() {
        Map<String, List<String>> cap = new LinkedHashMap<>();
        for (BosAiEntity entity : entityRegistryService.getAllEntities()) {
            List<String> ops = entityRegistryService.getOperations(entity.getEntityCode()).stream()
                .map(o -> o.getOperationCode())
                .collect(Collectors.toList());
            cap.put(entity.getEntityCode(), ops);
        }
        return cap;
    }

    /**
     * Returns the required page codes for permission checking.
     * Uses DB config if available, fallback to code manifest.
     */
    public Set<String> getAllRequiredPageCodes(String moduleName) {
        // Find entity associated with this ERP module in database
        Optional<BosAiEntity> opt = entityRegistryService.getAllEntities().stream()
            .filter(e -> moduleName.equalsIgnoreCase(e.getErpModule()))
            .findFirst();

        if (opt.isPresent() && opt.get().getPageCodes() != null && !opt.get().getPageCodes().isBlank()) {
            return Arrays.stream(opt.get().getPageCodes().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
        }

        // Fallback to code manifest
        BosEntitySkill skill = getSkillByModule(moduleName);
        if (skill == null || skill.manifest().requiredPageCodes() == null) return Set.of();
        return new LinkedHashSet<>(skill.manifest().requiredPageCodes());
    }
}
