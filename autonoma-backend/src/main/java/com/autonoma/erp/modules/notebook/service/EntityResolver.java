package com.autonoma.erp.modules.notebook.service;

import com.autonoma.erp.modules.notebook.dto.IntentResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Resolves the canonical entity name from a user query.
 *
 * Uses AiSkillRegistry.findSkillBySynonym() — driven entirely by SkillManifest synonyms.
 * No hardcoded keyword maps here. Adding a new entity = declare synonyms in its manifest.
 *
 * Resolution order:
 *  1. Registry synonym match (longest wins)
 *  2. Intent module fallback
 *  3. "GENERAL"
 */
@Service
public class EntityResolver {

    @Autowired
    private AiSkillRegistry skillRegistry;

    public String resolveEntity(String query, IntentResult intent) {

        // 1. Try synonym match from registry (longest synonym wins = most specific)
        String entity = skillRegistry.findSkillBySynonym(query)
            .map(s -> s.manifest().entity())
            .orElse(null);

        if (entity != null) return entity;

        // 2. Fallback: derive from intent's detected modules via module map
        if (intent.detectedModules() != null && !intent.detectedModules().isEmpty()) {
            String firstMod = intent.detectedModules().iterator().next();
            BosEntitySkill modSkill = skillRegistry.getSkillByModule(firstMod);
            if (modSkill != null) return modSkill.manifest().entity();
        }

        // 3. Final fallback
        return "GENERAL";
    }
}
