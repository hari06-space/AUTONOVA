package com.autonoma.erp.modules.notebook.dto;

import java.util.List;

/**
 * Self-describing metadata for every BosEntitySkill.
 *
 * The platform uses this manifest to:
 *  - Auto-build synonym lookup in AiSkillRegistry
 *  - Resolve page codes for permission checks (replacing ModulePageResolver hardcoding)
 *  - Determine which OperationTypes each skill can handle
 *  - Discover capabilities without touching any platform code
 *
 * To add a new domain entity to the AI: create a BosEntitySkill that implements manifest().
 * No other file needs to change.
 */
public record SkillManifest(

    /** Canonical entity identifier, e.g. "CHECKLIST", "EMPLOYEE" */
    String entity,

    /** ERP module code matching AiPermissionEngine module names, e.g. "QMS_CHECKLIST" */
    String erpModule,

    /** BOS page codes that grant access to this entity's data */
    List<String> requiredPageCodes,

    /** All OperationTypes this skill can handle */
    List<OperationType> supportedOperations,

    /** Default permission scope if not overridden by context */
    PermissionScope defaultScope,

    /**
     * Natural-language synonyms the AI should recognize as this entity.
     * Used by AiSkillRegistry to build the synonym lookup map.
     * Longer, more specific synonyms must appear before shorter ones.
     */
    List<String> synonyms,

    /** Example questions this skill can answer — used for introspection and documentation */
    List<String> exampleQueries
) {}
