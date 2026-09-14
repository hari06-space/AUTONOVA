package com.autonoma.erp.modules.notebook.service;

import com.autonoma.erp.modules.notebook.entity.*;
import com.autonoma.erp.modules.notebook.repository.*;
import com.autonoma.erp.modules.notebook.dto.SkillManifest;
import com.autonoma.erp.modules.notebook.dto.OperationType;
import com.autonoma.erp.modules.notebook.dto.PermissionScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Service that reads AI entity registries, operations, fields, and
 * relationships
 * from the database and constructs runtime representations of the capabilities.
 *
 * It is the dynamic backbone of the BOS Business Capability Platform.
 */
@Service
public class EntityRegistryService {

    @Autowired
    private BosAiEntityRepository entityRepository;

    @Autowired
    private BosAiEntityFieldRepository fieldRepository;

    @Autowired
    private BosAiRelationshipRepository relationshipRepository;

    @Autowired
    private BosAiOperationRepository operationRepository;

    @Autowired
    private BosAiMetadataAuditRepository metadataAuditRepository;

    @Autowired
    private BosAiBusinessGraphRepository businessGraphRepository;

    // In-memory cache loaded from DB on startup
    private final Map<String, BosAiEntity> entities = new ConcurrentHashMap<>();
    private final Map<String, List<BosAiEntityField>> entityFields = new ConcurrentHashMap<>();
    private final Map<String, List<BosAiRelationship>> entityRelationships = new ConcurrentHashMap<>();
    private final Map<String, List<BosAiOperation>> entityOperations = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        reloadRegistry();
    }

    public synchronized void reloadRegistry() {
        System.out.println("[BOS-AI][RegistryService] Loading AI metadata registry from database...");

        entities.clear();
        entityFields.clear();
        entityRelationships.clear();
        entityOperations.clear();

        List<BosAiEntity> activeEntities = entityRepository.findByActiveStatus("Y");
        for (BosAiEntity ent : activeEntities) {
            entities.put(ent.getEntityCode().toUpperCase(), ent);

            // Load operations
            List<BosAiOperation> ops = operationRepository.findByEntityCodeAndActiveStatus(ent.getEntityCode(), "Y");
            entityOperations.put(ent.getEntityCode().toUpperCase(), ops);

            // Load fields
            List<BosAiEntityField> fields = fieldRepository.findByEntityCodeAndActiveStatus(ent.getEntityCode(), "Y");
            entityFields.put(ent.getEntityCode().toUpperCase(), fields);

            // Load relationships
            List<BosAiRelationship> rels = relationshipRepository.findByFromEntityAndActiveStatus(ent.getEntityCode(),
                    "Y");
            entityRelationships.put(ent.getEntityCode().toUpperCase(), new ArrayList<>(rels));
        }

        // Merge semantic relationships from the business graph
        try {
            List<BosAiBusinessGraph> graphList = businessGraphRepository.findByActiveStatus("Y");
            for (BosAiBusinessGraph graph : graphList) {
                String fromUpper = graph.getFromEntity().toUpperCase();
                String joinCol = parseJoinColumn(graph.getJoinCondition());
                if (joinCol == null)
                    continue;

                BosAiRelationship rel = new BosAiRelationship();
                rel.setFromEntity(graph.getFromEntity());
                rel.setToEntity(graph.getToEntity());
                rel.setCardinality("1:N");
                rel.setJoinColumn(joinCol);

                String toEntity = graph.getToEntity().toUpperCase();
                String expandName = toEntity.endsWith("S") ? toEntity
                        : (toEntity.endsWith("Y") ? toEntity.substring(0, toEntity.length() - 1) + "IES"
                                : toEntity + "S");
                rel.setExpandName(expandName);
                rel.setLabel(graph.getRelationType());
                rel.setActiveStatus("Y");
                rel.setMaxRows(50);

                List<BosAiRelationship> existing = entityRelationships.computeIfAbsent(fromUpper,
                        k -> new ArrayList<>());
                boolean duplicate = existing.stream()
                        .anyMatch(r -> r.getToEntity().equalsIgnoreCase(graph.getToEntity()));
                if (!duplicate) {
                    existing.add(rel);
                }
            }
        } catch (Exception e) {
            System.err.println("[WARN] Failed to load semantic business graph relationships: " + e.getMessage());
        }

        System.out.println(String.format(
                "[BOS-AI][RegistryService] Loaded %d active entities, %d operations, %d fields, and %d relationships (including semantic graph) from database.",
                entities.size(),
                entityOperations.values().stream().mapToInt(List::size).sum(),
                entityFields.values().stream().mapToInt(List::size).sum(),
                entityRelationships.values().stream().mapToInt(List::size).sum()));
    }

    private String parseJoinColumn(String joinCondition) {
        if (joinCondition == null)
            return null;
        int toIdx = joinCondition.toUpperCase().indexOf("TO.");
        if (toIdx >= 0) {
            String sub = joinCondition.substring(toIdx + 3).trim();
            int spaceIdx = sub.indexOf(' ');
            if (spaceIdx > 0) {
                return sub.substring(0, spaceIdx);
            }
            return sub;
        }
        return null;
    }

    /**
     * Seeds or upserts a SkillManifest into the database tables if not already
     * present.
     * Keeps code manifests in sync with DB table.
     */
    @Transactional
    public void registerManifest(SkillManifest manifest) {
        String code = manifest.entity().toUpperCase();

        // 1. Upsert Entity
        boolean isUpdate = entityRepository.findByEntityCode(code).isPresent();
        BosAiEntity entity = entityRepository.findByEntityCode(code)
                .orElseGet(() -> {
                    BosAiEntity newEntity = new BosAiEntity();
                    newEntity.setEntityCode(code);
                    newEntity.setCreatedBy("SUPER BOSS");
                    return newEntity;
                });

        entity.setDisplayName(manifest.entity() + " Entity");
        entity.setErpModule(manifest.erpModule());
        entity.setPageCodes(String.join(",", manifest.requiredPageCodes()));
        entity.setSynonyms(String.join("|", manifest.synonyms()));
        entity.setDefaultScope(manifest.defaultScope().name());
        entity.setActiveStatus("Y");
        entity = entityRepository.save(entity);

        // Record metadata audit trail
        try {
            metadataAuditRepository.logAuditNative(
                    "BOS_AI_ENTITY",
                    entity.getId() != null ? entity.getId() : 0L,
                    isUpdate ? "UPDATE" : "INSERT",
                    String.format("{\"entityCode\":\"%s\",\"displayName\":\"%s\",\"erpModule\":\"%s\",\"pageCodes\":\"%s\"}",
                            entity.getEntityCode(), entity.getDisplayName(), entity.getErpModule(), entity.getPageCodes()),
                    "SUPER BOSS"
            );
        } catch (Exception ex) {
            System.err.println("[BOS-AI][Registry] Could not save audit record for " + code + ": " + ex.getMessage());
        }

        // 2. Sync Operations
        List<BosAiOperation> existingOps = operationRepository.findByEntityCodeAndActiveStatus(code, "Y");
        Set<String> existingOpCodes = existingOps.stream().map(o -> o.getOperationCode().toUpperCase())
                .collect(Collectors.toSet());

        int order = 10;
        for (OperationType opType : manifest.supportedOperations()) {
            String opCode = opType.name();
            if (!existingOpCodes.contains(opCode)) {
                BosAiOperation op = new BosAiOperation();
                op.setEntityCode(code);
                op.setOperationCode(opCode);
                op.setDisplayName(opCode.substring(0, 1) + opCode.substring(1).toLowerCase());
                op.setRequiredScope(manifest.defaultScope().name());

                // Map default keywords
                if (opType == OperationType.COUNT)
                    op.setKeywords("how many|total|count|in number");
                else if (opType == OperationType.PENDING)
                    op.setKeywords("pending|open|not closed");
                else if (opType == OperationType.COMPLETED)
                    op.setKeywords("completed|closed|done");
                else
                    op.setKeywords(opCode.toLowerCase());

                op.setDisplayOrder(order);
                operationRepository.save(op);
                order += 10;
            }
        }
    }

    // Accessors
    public Optional<BosAiEntity> getEntity(String entityCode) {
        if (entityCode == null)
            return Optional.empty();
        return Optional.ofNullable(entities.get(entityCode.toUpperCase()));
    }

    public List<BosAiEntity> getAllEntities() {
        return new ArrayList<>(entities.values());
    }

    public List<BosAiEntityField> getFields(String entityCode) {
        if (entityCode == null)
            return Collections.emptyList();
        return entityFields.getOrDefault(entityCode.toUpperCase(), Collections.emptyList());
    }

    public List<BosAiRelationship> getRelationships(String entityCode) {
        if (entityCode == null)
            return Collections.emptyList();
        return entityRelationships.getOrDefault(entityCode.toUpperCase(), Collections.emptyList());
    }

    public List<BosAiOperation> getOperations(String entityCode) {
        if (entityCode == null)
            return Collections.emptyList();
        return entityOperations.getOrDefault(entityCode.toUpperCase(), Collections.emptyList());
    }
}
