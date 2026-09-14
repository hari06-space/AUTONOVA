package com.autonoma.erp.service.purchase.inspection;

import com.autonoma.erp.dto.purchase.inspection.MaterialInspectionDTO;
import com.autonoma.erp.modules.qmc.aql.entity.AqlMaster;
import com.autonoma.erp.modules.qmc.aql.entity.AqlSamplingRule;
import com.autonoma.erp.modules.qmc.aql.repository.AqlMasterRepository;
import com.autonoma.erp.modules.qmc.inspectionspecification.entity.InspectionSpecification;
import com.autonoma.erp.modules.qmc.inspectionspecification.entity.InspectionSpecificationDetail;
import com.autonoma.erp.modules.qmc.inspectionspecification.repository.InspectionSpecificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

import jakarta.persistence.EntityManager;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.entity.ProductProcess;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TestReportService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TestReportService.class);

    private final InspectionSpecificationRepository specificationRepository;
    private final AqlMasterRepository aqlMasterRepository;
    private final EntityManager entityManager;

    public List<MaterialInspectionDTO> getTestReportParameters(Long itemId, BigDecimal grnQty) {
        log.info("Fetching Test Report parameters for item: {} with grnQty: {}", itemId, grnQty);
        List<MaterialInspectionDTO> dtoList = new ArrayList<>();

        // Log all specs for this item to debug why active spec isn't found
        List<InspectionSpecification> allSpecs = specificationRepository.findAll();
        for (InspectionSpecification s : allSpecs) {
            if (s.getItemId() != null && s.getItemId().equals(itemId)) {
                log.info("Found spec for item {}: id={}, status={}, effFrom={}, effTo={}",
                        itemId, s.getId(), s.getStatus(), s.getEffectiveFrom(), s.getEffectiveTo());
            }
        }

        // Find active Inspection Specification for this item
        List<InspectionSpecification> specList = specificationRepository.findActiveSpecificationForItem(itemId,
                java.time.LocalDate.now());
        log.info("Found {} active specs for item {} on date {}", specList == null ? 0 : specList.size(), itemId,
                java.time.LocalDate.now());
        if (specList == null || specList.isEmpty()) {
            log.warn("No active Inspection Specification found for item: {}", itemId);
            MaterialInspectionDTO debugDto = new MaterialInspectionDTO();
            debugDto.setParameterName("DEBUG: NO ACTIVE SPEC FOUND FOR ITEM " + itemId);
            dtoList.add(debugDto);
            return dtoList;
        }

        InspectionSpecification spec = specList.get(0);

        if (spec.getDetails() == null || spec.getDetails().isEmpty()) {
            MaterialInspectionDTO debugDto = new MaterialInspectionDTO();
            debugDto.setParameterName("DEBUG: SPEC HAS NO DETAILS");
            dtoList.add(debugDto);
            return dtoList;
        }

        try {
            for (InspectionSpecificationDetail detail : spec.getDetails()) {
                MaterialInspectionDTO dto = new MaterialInspectionDTO();
                dto.setSpecParameterId(detail.getId());
                dto.setParameterName(detail.getParameterName());
                dto.setUom(detail.getUomCode());
                dto.setMinVal(detail.getMinimumValue());
                dto.setMaxVal(detail.getMaximumValue());
                dto.setParameterCondition(detail.getParameterCondition());
                dto.setProcessId(detail.getProcessId());
                dto.setInstrumentId(detail.getInstrumentId());

                if (detail.getProcessId() != null) {
                    try {
                        ProductProcess proc = entityManager.find(ProductProcess.class, detail.getProcessId());
                        if (proc != null)
                            dto.setProcessName(proc.getProcessName());
                    } catch (Exception e) {
                    }
                }
                if (detail.getInstrumentId() != null) {
                    try {
                        ProductMaster pm = entityManager.find(ProductMaster.class, detail.getInstrumentId());
                        if (pm != null)
                            dto.setInstrumentName(pm.getItemName());
                    } catch (Exception e) {
                    }
                }
                Long resolvedAqlId = detail.getAqlMasterId() != null ? detail.getAqlMasterId() : spec.getAqlId();

                if (resolvedAqlId == null) {
                    try {
                        ProductMaster pm = entityManager.find(ProductMaster.class, itemId);
                        if (pm != null && pm.getItemGroup() != null) {
                            com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemGroup group = 
                                entityManager.find(com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemGroup.class, pm.getItemGroup());
                            if (group != null && group.getAqlId() != null) {
                                resolvedAqlId = group.getAqlId();
                                log.info("Fallback to ItemGroup AQL ID {} for item {}", resolvedAqlId, itemId);
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Failed to fetch AQL ID from ItemGroup fallback", e);
                    }
                }

                dto.setAqlId(resolvedAqlId);

                int sampleSize = 1; // Default to 1

                if (resolvedAqlId != null) {
                    Optional<AqlMaster> aqlOpt = aqlMasterRepository.findById(resolvedAqlId);
                    if (aqlOpt.isPresent()) {
                        AqlMaster aql = aqlOpt.get();
                        // Find the matching rule based on grnQty
                        int qty = grnQty != null ? grnQty.intValue() : 0;

                        Optional<AqlSamplingRule> matchingRule = aql.getSamplingRules().stream()
                                .filter(rule -> rule.getLotSizeFrom() <= qty && rule.getLotSizeTo() >= qty)
                                .findFirst();

                        if (matchingRule.isPresent()) {
                            sampleSize = matchingRule.get().getSampleSize();
                        } else {
                            log.warn("No AQL rule matched for grnQty {} on AQL {}", qty, aql.getId());
                        }
                    }
                }

                dto.setSampleSize(sampleSize);
                dtoList.add(dto);
            }
        } catch (Exception e) {
            log.error("Error in fetching test report parameters", e);
            MaterialInspectionDTO errDto = new MaterialInspectionDTO();
            errDto.setParameterName("ERROR: " + e.getMessage());
            dtoList.add(errDto);
        }

        return dtoList;
    }
}
