package com.autonoma.erp.modules.qmc.aql.service;

import com.autonoma.erp.modules.qmc.aql.dto.AqlMasterDto;
import com.autonoma.erp.modules.qmc.aql.dto.AqlSamplingRuleDto;
import com.autonoma.erp.modules.qmc.aql.entity.AqlMaster;
import com.autonoma.erp.modules.qmc.aql.entity.AqlSamplingRule;
import com.autonoma.erp.modules.qmc.aql.repository.AqlMasterRepository;
import com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemGroup;
import com.autonoma.erp.modules.npd.itemtaxonomy.repository.ProductItemGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AqlMasterService {

    private final AqlMasterRepository aqlMasterRepository;
    private final ProductItemGroupRepository productItemGroupRepository;

    @Transactional(readOnly = true)
    public Page<AqlMasterDto> getAllAqlMasters(Pageable pageable, String search) {
        // Simple search for demonstration, normally would use Specifications
        Page<AqlMaster> page = aqlMasterRepository.findAll(pageable);
        return page.map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public AqlMasterDto getAqlMasterById(Long id) {
        AqlMaster aqlMaster = aqlMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AQL Master not found with ID: " + id));
        return mapToDto(aqlMaster);
    }

    @Transactional
    public AqlMasterDto createAqlMaster(AqlMasterDto dto, String username) {
        validateDto(dto);
        validateSamplingRules(dto.getSamplingRules());

        AqlMaster aqlMaster = new AqlMaster();
        
        // Auto-generate AQL Code
        Long maxId = aqlMasterRepository.findMaxId();
        long nextId = (maxId != null ? maxId : 0) + 1;
        aqlMaster.setAqlCode(String.format("AQL%04d", nextId));

        mapDtoToEntity(dto, aqlMaster);
        
        aqlMaster.setCreatedBy(username != null ? username : "system");
        aqlMaster.setCreatedDate(new Date());
        aqlMaster.setStatus(dto.getStatus() != null ? dto.getStatus() : 1L); // Default Active

        processSamplingRules(dto, aqlMaster, username, true);

        AqlMaster saved = aqlMasterRepository.save(aqlMaster);
        syncItemGroups(saved.getId(), dto.getItemGroups());

        return mapToDto(saved);
    }

    @Transactional
    public AqlMasterDto updateAqlMaster(Long id, AqlMasterDto dto, String username) {
        AqlMaster aqlMaster = aqlMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AQL Master not found with ID: " + id));

        validateDto(dto);
        validateSamplingRules(dto.getSamplingRules());

        mapDtoToEntity(dto, aqlMaster);
        
        aqlMaster.setUpdatedBy(username != null ? username : "system");
        aqlMaster.setUpdatedDate(new Date());
        if (dto.getStatus() != null) {
            aqlMaster.setStatus(dto.getStatus());
        }

        aqlMaster.getSamplingRules().clear();
        processSamplingRules(dto, aqlMaster, username, false);

        AqlMaster saved = aqlMasterRepository.save(aqlMaster);
        syncItemGroups(saved.getId(), dto.getItemGroups());

        return mapToDto(saved);
    }

    @Transactional
    public void toggleStatus(Long id, String username) {
        AqlMaster aqlMaster = aqlMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AQL Master not found with ID: " + id));
        
        aqlMaster.setStatus(aqlMaster.getStatus() == 1L ? 0L : 1L);
        aqlMaster.setUpdatedBy(username != null ? username : "system");
        aqlMaster.setUpdatedDate(new Date());
        aqlMasterRepository.save(aqlMaster);
    }

    private void validateDto(AqlMasterDto dto) {
        if (!StringUtils.hasText(dto.getAqlName())) throw new RuntimeException("AQL Name is mandatory");
        if (!StringUtils.hasText(dto.getInspectionLevel())) throw new RuntimeException("Inspection Level is mandatory");
        if (!StringUtils.hasText(dto.getInspectionType())) throw new RuntimeException("Inspection Type is mandatory");
        if (dto.getAqlValue() == null) throw new RuntimeException("AQL Value is mandatory");
    }

    private void validateSamplingRules(List<AqlSamplingRuleDto> rules) {
        if (rules == null || rules.isEmpty()) return;

        for (int i = 0; i < rules.size(); i++) {
            AqlSamplingRuleDto rule = rules.get(i);
            if (rule.getLotSizeFrom() == null || rule.getLotSizeTo() == null || rule.getSampleSize() == null ||
                rule.getAcceptanceQty() == null || rule.getRejectionQty() == null) {
                throw new RuntimeException("All sampling rule fields are mandatory");
            }
            if (rule.getLotSizeFrom() > rule.getLotSizeTo()) {
                throw new RuntimeException("Lot Size From cannot exceed Lot Size To");
            }
            if (rule.getSampleSize() <= 0) {
                throw new RuntimeException("Sample Size must be greater than zero");
            }
            if (rule.getAcceptanceQty() > rule.getSampleSize()) {
                throw new RuntimeException("Acceptance Quantity cannot exceed Sample Size");
            }

            // Check for overlaps with subsequent rules
            for (int j = i + 1; j < rules.size(); j++) {
                AqlSamplingRuleDto nextRule = rules.get(j);
                if ((rule.getLotSizeFrom() <= nextRule.getLotSizeTo()) && (rule.getLotSizeTo() >= nextRule.getLotSizeFrom())) {
                    throw new RuntimeException("Overlapping or duplicate lot size ranges detected: " +
                            rule.getLotSizeFrom() + "-" + rule.getLotSizeTo() + " and " +
                            nextRule.getLotSizeFrom() + "-" + nextRule.getLotSizeTo());
                }
            }
        }
    }

    private void processSamplingRules(AqlMasterDto dto, AqlMaster entity, String username, boolean isNew) {
        if (dto.getSamplingRules() != null) {
            for (AqlSamplingRuleDto ruleDto : dto.getSamplingRules()) {
                AqlSamplingRule rule = new AqlSamplingRule();
                rule.setLotSizeFrom(ruleDto.getLotSizeFrom());
                rule.setLotSizeTo(ruleDto.getLotSizeTo());
                rule.setSampleSize(ruleDto.getSampleSize());
                rule.setAcceptanceQty(ruleDto.getAcceptanceQty());
                rule.setRejectionQty(ruleDto.getRejectionQty());
                
                rule.setCreatedBy(username != null ? username : "system");
                rule.setCreatedDate(new Date());
                
                entity.addSamplingRule(rule);
            }
        }
    }

    private void syncItemGroups(Long aqlId, List<String> itemGroupNames) {
        if (itemGroupNames == null) return;
        List<ProductItemGroup> currentLinked = productItemGroupRepository.findByAqlId(aqlId);
        for (ProductItemGroup group : currentLinked) {
            if (!itemGroupNames.contains(group.getGroupName())) {
                group.setAqlId(null);
                productItemGroupRepository.save(group);
            }
        }
        for (String groupName : itemGroupNames) {
            productItemGroupRepository.findByGroupName(groupName).ifPresent(group -> {
                group.setAqlId(aqlId);
                productItemGroupRepository.save(group);
            });
        }
    }

    private void mapDtoToEntity(AqlMasterDto dto, AqlMaster entity) {
        entity.setAqlName(dto.getAqlName());
        entity.setInspectionLevel(dto.getInspectionLevel());
        entity.setInspectionType(dto.getInspectionType());
        entity.setAqlValue(dto.getAqlValue());
        entity.setRemarks(dto.getRemarks());
    }

    private AqlMasterDto mapToDto(AqlMaster entity) {
        AqlMasterDto dto = new AqlMasterDto();
        dto.setId(entity.getId());
        dto.setAqlCode(entity.getAqlCode());
        dto.setAqlName(entity.getAqlName());
        dto.setInspectionLevel(entity.getInspectionLevel());
        dto.setInspectionType(entity.getInspectionType());
        dto.setAqlValue(entity.getAqlValue());
        dto.setRemarks(entity.getRemarks());
        dto.setStatus(entity.getStatus());
        dto.setStatusName(entity.getStatus() != null && entity.getStatus() == 1L ? "ACTIVE" : "INACTIVE");

        List<ProductItemGroup> linkedGroups = productItemGroupRepository.findByAqlId(entity.getId());
        dto.setItemGroups(linkedGroups.stream().map(ProductItemGroup::getGroupName).collect(Collectors.toList()));

        List<AqlSamplingRuleDto> ruleDtos = entity.getSamplingRules().stream().map(rule -> {
            AqlSamplingRuleDto ruleDto = new AqlSamplingRuleDto();
            ruleDto.setId(rule.getId());
            ruleDto.setAqlMasterId(entity.getId());
            ruleDto.setLotSizeFrom(rule.getLotSizeFrom());
            ruleDto.setLotSizeTo(rule.getLotSizeTo());
            ruleDto.setSampleSize(rule.getSampleSize());
            ruleDto.setAcceptanceQty(rule.getAcceptanceQty());
            ruleDto.setRejectionQty(rule.getRejectionQty());
            return ruleDto;
        }).collect(Collectors.toList());
        
        dto.setSamplingRules(ruleDtos);
        return dto;
    }
}
