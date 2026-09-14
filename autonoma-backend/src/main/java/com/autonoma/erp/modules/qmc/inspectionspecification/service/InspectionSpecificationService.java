package com.autonoma.erp.modules.qmc.inspectionspecification.service;

import com.autonoma.erp.modules.master.admin.entity.MstUom;
import com.autonoma.erp.modules.master.admin.repository.MstUomRepository;
import com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemGroup;
import com.autonoma.erp.modules.npd.itemtaxonomy.repository.ProductItemGroupRepository;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.modules.qmc.aql.entity.AqlMaster;
import com.autonoma.erp.modules.qmc.aql.repository.AqlMasterRepository;
import com.autonoma.erp.modules.qmc.inspectionspecification.dto.InspectionSpecificationDetailDto;
import com.autonoma.erp.modules.qmc.inspectionspecification.dto.InspectionSpecificationDto;
import com.autonoma.erp.modules.qmc.inspectionspecification.entity.InspectionSpecification;
import com.autonoma.erp.modules.qmc.inspectionspecification.entity.InspectionSpecificationDetail;
import com.autonoma.erp.modules.qmc.inspectionspecification.repository.InspectionSpecificationRepository;
import com.autonoma.erp.modules.npd.product.entity.NpdReactionPlan;
import com.autonoma.erp.modules.npd.product.entity.ProductProcess;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InspectionSpecificationService {

    private final InspectionSpecificationRepository repository;
    private final ProductMasterRepository productMasterRepository;
    private final ProductItemGroupRepository productItemGroupRepository;
    private final AqlMasterRepository aqlMasterRepository;
    private final MstUomRepository uomRepository;
    private final StatusMasterRepository statusMasterRepository;
    private final EntityManager entityManager;

    // ─────────────────────────────────────────────────────────
    // LIST
    // ─────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<InspectionSpecificationDto> getAll(String search, Long itemId, Long statusId, Pageable pageable) {
        return repository.searchAll(search, itemId, statusId, pageable)
                .map(this::mapToListDto);
    }

    // ─────────────────────────────────────────────────────────
    // GET BY ID (with details)
    // ─────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public InspectionSpecificationDto getById(Long id) {
        InspectionSpecification entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inspection Specification not found with ID: " + id));
        return mapToFullDto(entity);
    }

    // ─────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────
    @Transactional
    public InspectionSpecificationDto create(InspectionSpecificationDto dto) {
        validateHeader(dto, null);
        validateDetails(dto.getDetails());

        Long activeStatusId = getOrCreateStatusId("ACTIVE");

        InspectionSpecification entity = new InspectionSpecification();

        // Auto-generate specification code IS0001, IS0002 ...
        Long maxId = repository.findMaxId();
        long nextId = (maxId != null ? maxId : 0) + 1;
        entity.setSpecificationCode(String.format("IS%04d", nextId));

        mapDtoToEntity(dto, entity);
        entity.setStatus(activeStatusId);
        entity.setCreatedBy(getCurrentUser());
        entity.setCreatedDate(new Date());

        processDetails(dto, entity, activeStatusId);

        InspectionSpecification saved = repository.save(entity);
        return mapToFullDto(saved);
    }

    // ─────────────────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────────────────
    @Transactional
    public InspectionSpecificationDto update(Long id, InspectionSpecificationDto dto) {
        InspectionSpecification entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inspection Specification not found with ID: " + id));

        validateHeader(dto, id);
        validateDetails(dto.getDetails());

        Long activeStatusId = getOrCreateStatusId("ACTIVE");

        mapDtoToEntity(dto, entity);
        if (dto.getStatus() != null) {
            entity.setStatus(dto.getStatus());
        }
        entity.setUpdatedBy(getCurrentUser());
        entity.setUpdatedDate(new Date());

        // Replace all details
        entity.clearDetails();
        processDetails(dto, entity, activeStatusId);

        InspectionSpecification saved = repository.save(entity);
        return mapToFullDto(saved);
    }

    // ─────────────────────────────────────────────────────────
    // TOGGLE STATUS
    // ─────────────────────────────────────────────────────────
    @Transactional
    public void toggleStatus(Long id) {
        InspectionSpecification entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inspection Specification not found with ID: " + id));

        Long activeId = getOrCreateStatusId("ACTIVE");
        Long inactiveId = getOrCreateStatusId("INACTIVE");
        entity.setStatus(entity.getStatus().equals(activeId) ? inactiveId : activeId);
        entity.setUpdatedBy(getCurrentUser());
        entity.setUpdatedDate(new Date());
        repository.save(entity);
    }

    // ─────────────────────────────────────────────────────────
    // INCOMING INSPECTION READINESS
    // ─────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public InspectionSpecificationDto getActiveSpecificationForItem(Long itemId, LocalDate inspectionDate) {
        List<InspectionSpecification> specs = repository.findActiveSpecificationForItem(itemId, inspectionDate);
        if (specs.isEmpty()) {
            throw new RuntimeException("No active Inspection Specification found for item ID: " + itemId + " on date: " + inspectionDate);
        }
        return mapToFullDto(specs.get(0));
    }

    // ─────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────
    private void validateHeader(InspectionSpecificationDto dto, Long excludeId) {
        if (!StringUtils.hasText(dto.getSpecificationName())) {
            throw new RuntimeException("Specification Name is required.");
        }
        if (dto.getItemId() == null) {
            throw new RuntimeException("Item is required.");
        }
        // Validate item exists
        productMasterRepository.findById(dto.getItemId())
                .orElseThrow(() -> new RuntimeException("Selected Item does not exist."));

        if (dto.getVersionNo() == null || dto.getVersionNo() < 1) {
            dto.setVersionNo(1);
        }
        if (dto.getEffectiveFrom() != null && dto.getEffectiveTo() != null) {
            if (dto.getEffectiveFrom().isAfter(dto.getEffectiveTo())) {
                throw new RuntimeException("Effective From date cannot be after Effective To date.");
            }
        }

        // Date overlap validation for same item
        List<InspectionSpecification> overlaps = repository.findOverlappingSpecifications(
                dto.getItemId(), dto.getEffectiveFrom(), dto.getEffectiveTo(), excludeId);
        if (!overlaps.isEmpty()) {
            InspectionSpecification overlap = overlaps.get(0);
            throw new RuntimeException(
                "Date overlap detected with existing specification: "
                + overlap.getSpecificationCode()
                + " (V" + overlap.getVersionNo() + "). "
                + "Please choose a non-overlapping effective date range."
            );
        }
    }

    private void validateDetails(List<InspectionSpecificationDetailDto> details) {
        if (details == null || details.isEmpty()) return;

        for (int i = 0; i < details.size(); i++) {
            InspectionSpecificationDetailDto d = details.get(i);
            if (!StringUtils.hasText(d.getParameterName())) {
                throw new RuntimeException("Parameter Name is required at row " + (i + 1));
            }
            if (d.getSequenceNo() == null || d.getSequenceNo() < 1) {
                throw new RuntimeException("Sequence No must be >= 1 at row " + (i + 1));
            }
            // Measurement validation
            if (d.getMinimumValue() != null && d.getMaximumValue() != null) {
                if (d.getMinimumValue().compareTo(d.getMaximumValue()) > 0) {
                    throw new RuntimeException("Minimum cannot exceed Maximum at row " + (i + 1) + " (" + d.getParameterName() + ")");
                }
            }
            // AQL validation
            if (d.getAqlMasterId() != null) {
                AqlMaster aql = aqlMasterRepository.findById(d.getAqlMasterId())
                        .orElseThrow(() -> new RuntimeException("AQL Master not found: ID " + d.getAqlMasterId()));
                if (aql.getStatus() == null || aql.getStatus() == 0L) {
                    throw new RuntimeException("AQL '" + aql.getAqlName() + "' is inactive. Only active AQL configurations can be assigned.");
                }
            }
            // UOM required for measurable conditions
            if (d.getParameterCondition() != null && !d.getParameterCondition().equalsIgnoreCase("VISUAL")) {
                // UOM is recommended but not strictly enforced here to allow flexibility
            }
        }
    }

    // ─────────────────────────────────────────────────────────
    // MAPPING
    // ─────────────────────────────────────────────────────────
    private void mapDtoToEntity(InspectionSpecificationDto dto, InspectionSpecification entity) {
        entity.setSpecificationName(dto.getSpecificationName());
        entity.setItemId(dto.getItemId());
        entity.setVersionNo(dto.getVersionNo() != null ? dto.getVersionNo() : 1);
        entity.setEffectiveFrom(dto.getEffectiveFrom());
        entity.setEffectiveTo(dto.getEffectiveTo());
        entity.setRemarks(dto.getRemarks());

        Long targetAqlId = dto.getAqlId();
        if (targetAqlId == null && dto.getItemId() != null) {
            productMasterRepository.findById(dto.getItemId()).ifPresent(pm -> {
                if (StringUtils.hasText(pm.getItemGroup())) {
                    productItemGroupRepository.findByGroupName(pm.getItemGroup().trim()).ifPresent(pig -> {
                        if (pig.getAqlId() != null) {
                            entity.setAqlId(pig.getAqlId());
                        }
                    });
                }
            });
        } else {
            entity.setAqlId(targetAqlId);
        }
    }

    private void processDetails(InspectionSpecificationDto dto, InspectionSpecification entity, Long activeStatusId) {
        if (dto.getDetails() == null) return;
        for (InspectionSpecificationDetailDto dDto : dto.getDetails()) {
            InspectionSpecificationDetail d = new InspectionSpecificationDetail();
            d.setSequenceNo(dDto.getSequenceNo() != null ? dDto.getSequenceNo() : 1);
            d.setGroupHeading(dDto.getGroupHeading());
            d.setParameterName(dDto.getParameterName());
            d.setParameterAlias(dDto.getParameterAlias());
            d.setProcessId(dDto.getProcessId());
            d.setInstrumentId(dDto.getInstrumentId());
            d.setAqlMasterId(dDto.getAqlMasterId());
            d.setParameterType(dDto.getParameterType());
            d.setParameterCondition(dDto.getParameterCondition());
            d.setUomCode(dDto.getUomCode());
            d.setNominalValue(dDto.getNominalValue());
            d.setLowerTolerance(dDto.getLowerTolerance());
            d.setUpperTolerance(dDto.getUpperTolerance());
            d.setMinimumValue(dDto.getMinimumValue());
            d.setMaximumValue(dDto.getMaximumValue());
            d.setReactionPlanId(dDto.getReactionPlanId());
            d.setControlPlanName(dDto.getControlPlanName());
            d.setInspectionStages(dDto.getInspectionStages());
            d.setRemarks1(dDto.getRemarks1());
            d.setRemarks2(dDto.getRemarks2());
            d.setRemarks3(dDto.getRemarks3());
            d.setReferenceImage(dDto.getReferenceImage());
            d.setStatus(dDto.getStatus() != null ? dDto.getStatus() : activeStatusId);
            d.setCreatedBy(getCurrentUser());
            d.setCreatedDate(new Date());
            entity.addDetail(d);
        }
    }

    /**
     * Lightweight DTO for list page (no details loaded)
     */
    private InspectionSpecificationDto mapToListDto(InspectionSpecification entity) {
        InspectionSpecificationDto dto = new InspectionSpecificationDto();
        dto.setId(entity.getId());
        dto.setSpecificationCode(entity.getSpecificationCode());
        dto.setSpecificationName(entity.getSpecificationName());
        dto.setItemId(entity.getItemId());
        dto.setVersionNo(entity.getVersionNo());
        dto.setEffectiveFrom(entity.getEffectiveFrom());
        dto.setEffectiveTo(entity.getEffectiveTo());
        dto.setStatus(entity.getStatus());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedDate(entity.getCreatedDate());
        dto.setUpdatedBy(entity.getUpdatedBy());
        dto.setUpdatedDate(entity.getUpdatedDate());
        dto.setParameterCount((int) entity.getDetails().size());

        // Enrich with item info
        final String[] itemGroupHolder = new String[1];
        productMasterRepository.findById(entity.getItemId()).ifPresent(pm -> {
            dto.setItemNo(pm.getItemNo());
            dto.setItemName(pm.getItemName());
            dto.setItemGroup(pm.getItemGroup());
            itemGroupHolder[0] = pm.getItemGroup();
        });

        // Resolve AQL Master info (from entity or item group)
        Long aqlIdToResolve = entity.getAqlId();
        if (aqlIdToResolve == null && itemGroupHolder[0] != null) {
            productItemGroupRepository.findByGroupName(itemGroupHolder[0].trim()).ifPresent(pig -> {
                if (pig.getAqlId() != null) {
                    resolveAqlInfo(dto, pig.getAqlId());
                }
            });
        } else if (aqlIdToResolve != null) {
            resolveAqlInfo(dto, aqlIdToResolve);
        }

        // Status name
        statusMasterRepository.findById(entity.getStatus()).ifPresent(sm ->
            dto.setStatusName(sm.getName())
        );

        return dto;
    }

    private void resolveAqlInfo(InspectionSpecificationDto dto, Long aqlId) {
        dto.setAqlId(aqlId);
        aqlMasterRepository.findById(aqlId).ifPresent(aql -> {
            dto.setAqlCode(aql.getAqlCode());
            dto.setAqlName(aql.getAqlName());
            dto.setAqlValue(aql.getAqlValue());
            dto.setInspectionLevel(aql.getInspectionLevel());
            dto.setInspectionType(aql.getInspectionType());
        });
    }

    /**
     * Full DTO for edit page (with details)
     */
    private InspectionSpecificationDto mapToFullDto(InspectionSpecification entity) {
        InspectionSpecificationDto dto = mapToListDto(entity);

        List<InspectionSpecificationDetailDto> detailDtos = entity.getDetails().stream()
            .map(this::mapDetailToDto)
            .collect(Collectors.toList());
        dto.setDetails(detailDtos);
        return dto;
    }

    private InspectionSpecificationDetailDto mapDetailToDto(InspectionSpecificationDetail d) {
        InspectionSpecificationDetailDto dto = new InspectionSpecificationDetailDto();
        dto.setId(d.getId());
        dto.setSpecificationId(d.getSpecification() != null ? d.getSpecification().getId() : null);
        dto.setSequenceNo(d.getSequenceNo());
        dto.setGroupHeading(d.getGroupHeading());
        dto.setParameterName(d.getParameterName());
        dto.setParameterAlias(d.getParameterAlias());
        dto.setProcessId(d.getProcessId());
        dto.setInstrumentId(d.getInstrumentId());
        dto.setAqlMasterId(d.getAqlMasterId());
        dto.setParameterType(d.getParameterType());
        dto.setParameterCondition(d.getParameterCondition());
        dto.setUomCode(d.getUomCode());
        dto.setNominalValue(d.getNominalValue());
        dto.setLowerTolerance(d.getLowerTolerance());
        dto.setUpperTolerance(d.getUpperTolerance());
        dto.setMinimumValue(d.getMinimumValue());
        dto.setMaximumValue(d.getMaximumValue());
        dto.setReactionPlanId(d.getReactionPlanId());
        dto.setControlPlanName(d.getControlPlanName());
        dto.setInspectionStages(d.getInspectionStages());
        dto.setRemarks1(d.getRemarks1());
        dto.setRemarks2(d.getRemarks2());
        dto.setRemarks3(d.getRemarks3());
        dto.setReferenceImage(d.getReferenceImage());
        dto.setStatus(d.getStatus());

        // Enrich AQL info
        if (d.getAqlMasterId() != null) {
            aqlMasterRepository.findById(d.getAqlMasterId()).ifPresent(aql -> {
                dto.setAqlCode(aql.getAqlCode());
                dto.setAqlName(aql.getAqlName());
                dto.setAqlInspectionLevel(aql.getInspectionLevel());
                dto.setAqlInspectionType(aql.getInspectionType());
                dto.setAqlValue(aql.getAqlValue());
                dto.setSamplingRuleCount(aql.getSamplingRules().size());
            });
        }

        // Enrich process name
        if (d.getProcessId() != null) {
            try {
                ProductProcess proc = entityManager.find(ProductProcess.class, d.getProcessId());
                if (proc != null) dto.setProcessName(proc.getProcessName());
            } catch (Exception e) {
                log.debug("Could not find process {}", d.getProcessId());
            }
        }

        // Enrich UOM description
        if (StringUtils.hasText(d.getUomCode())) {
            uomRepository.findById(d.getUomCode()).ifPresent(uom ->
                dto.setUomName(uom.getUomDescription())
            );
        }

        // Enrich reaction plan
        if (d.getReactionPlanId() != null) {
            try {
                NpdReactionPlan rp = entityManager.find(NpdReactionPlan.class, d.getReactionPlanId());
                if (rp != null) dto.setReactionPlanName(rp.getReactionPlan());
            } catch (Exception e) {
                log.debug("Could not find reaction plan {}", d.getReactionPlanId());
            }
        }

        // Enrich instrument name
        if (d.getInstrumentId() != null) {
            productMasterRepository.findById(d.getInstrumentId()).ifPresent(pm ->
                dto.setInstrumentName(pm.getItemName())
            );
        }

        return dto;
    }

    // ─────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────
    private Long getOrCreateStatusId(String name) {
        Optional<StatusMaster> opt = statusMasterRepository.findByNameIgnoreCase(name);
        if (opt.isPresent()) return opt.get().getId();
        StatusMaster sm = new StatusMaster();
        sm.setName(name.toUpperCase());
        return statusMasterRepository.save(sm).getId();
    }

    private String getCurrentUser() {
        try {
            return com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
            return "system";
        }
    }
}
