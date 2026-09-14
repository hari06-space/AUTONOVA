package com.autonoma.erp.modules.notebook.service;

import com.autonoma.erp.modules.notebook.dto.OperationType;
import com.autonoma.erp.modules.notebook.dto.PermissionScope;
import com.autonoma.erp.modules.notebook.dto.SkillManifest;
import com.autonoma.erp.modules.notebook.dto.ToolRequest;
import com.autonoma.erp.modules.notebook.dto.ToolResult;

/**
 * Contract for every BOS AI domain entity skill.
 *
 * Each implementation must provide a manifest() describing:
 *  - which entity it handles
 *  - which ERP module it belongs to
 *  - which page codes govern access
 *  - which operations it supports
 *  - which synonyms should route queries here
 *
 * The platform discovers ALL capabilities from manifests automatically.
 * No hardcoded mappings anywhere in EntityResolver, AiPermissionEngine, or AiQueryPlanner.
 */
public interface BosEntitySkill {

    /**
     * Self-describing metadata. This is the single source of truth for
     * entity name, module, page codes, supported operations, and synonyms.
     */
    SkillManifest manifest();

    /**
     * Execute the business query and return a structured result.
     */
    ToolResult execute(ToolRequest request);

    // ─── Default Implementations (derived from manifest) ──────────────────────

    /** Entity name derived from manifest — e.g. "CHECKLIST" */
    default String entity() {
        return manifest().entity();
    }

    /** Whether this skill can handle the given operation type */
    default boolean supports(OperationType operation) {
        return manifest().supportedOperations().contains(operation);
    }

    /** Default permission scope from manifest */
    default PermissionScope requiredScope() {
        return manifest().defaultScope();
    }
}
