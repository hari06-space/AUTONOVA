/*
Organization: Autonoma ERP
Owner: Developer
Created At: 2026-09-05
Description: Engine for Recursive Multi-Level BOM Explosion & MAKE/BUY Classification
*/
package com.autonoma.erp.modules.production.plan.service;

import com.autonoma.erp.exception.BusinessException;
import com.autonoma.erp.modules.npd.bom.entity.BomMaster;
import com.autonoma.erp.modules.npd.bom.entity.BomProcess;
import com.autonoma.erp.modules.npd.bom.entity.BomProcessMaterial;
import com.autonoma.erp.modules.npd.bom.repository.BomMasterRepository;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository;
import com.autonoma.erp.modules.production.plan.dto.ProductionPlanTransDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class BomExplosionService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BomExplosionService.class);

    private final ProductMasterRepository productMasterRepository;
    private final BomMasterRepository bomMasterRepository;

    /**
     * Explodes a root product BOM recursively up to arbitrary depth with cycle detection.
     */
    @Transactional(readOnly = true)
    public ProductionPlanTransDto explodeProductBom(Long productId, BigDecimal requiredQty, Date requiredDate, Long sourceLineId) {
        ProductMaster rootProduct = productMasterRepository.findById(productId)
                .orElseThrow(() -> new BusinessException("Product not found with ID: " + productId));

        Set<Long> visited = new HashSet<>();
        List<String> pathNames = new ArrayList<>();

        return explodeRecursive(rootProduct, requiredQty, requiredDate, 0, null, sourceLineId, visited, pathNames);
    }

    private ProductionPlanTransDto explodeRecursive(ProductMaster product, BigDecimal grossQty, Date requiredDate,
                                                     int currentLevel, Long parentTransNo, Long sourceLineId,
                                                     Set<Long> visited, List<String> pathNames) {

        if (visited.contains(product.getId())) {
            pathNames.add(product.getItemName() != null ? product.getItemName() : product.getItemNo());
            String cyclePath = String.join(" -> ", pathNames);
            throw new BusinessException("Circular BOM reference detected: " + cyclePath);
        }

        visited.add(product.getId());
        pathNames.add(product.getItemName() != null ? product.getItemName() : product.getItemNo());

        // Find active BOM for product
        List<BomMaster> bomList = bomMasterRepository.findByProductId(product.getId());
        BomMaster activeBom = bomList.stream()
                .filter(b -> Boolean.TRUE.equals(b.getIsActive()))
                .findFirst()
                .orElse(bomList.isEmpty() ? null : bomList.get(0));

        // Determine MAKE vs BUY
        String itemType = classifyItemType(product);
        String requirementType = classifyRequirementType(product, activeBom, itemType);

        ProductionPlanTransDto node = ProductionPlanTransDto.builder()
                .productId(product.getId())
                .productCode(product.getItemNo())
                .productName(product.getItemName())
                .itemType(itemType)
                .requirementType(requirementType)
                .bomId(activeBom != null ? activeBom.getId() : null)
                .bomNo(activeBom != null ? activeBom.getBomNo() : null)
                .bomLevel(currentLevel)
                .grossQty(grossQty)
                .stockQty(BigDecimal.ZERO)
                .wipQty(BigDecimal.ZERO)
                .openProductionQty(BigDecimal.ZERO)
                .netQty(grossQty) // Will be netted by InventoryNettingService
                .uom(product.getUom() != null ? product.getUom() : "NOS")
                .requiredDate(requiredDate)
                .status("PENDING")
                .sourceLineId(sourceLineId)
                .children(new ArrayList<>())
                .build();

        // If product is a MAKE item and has an active BOM, explode its child materials recursively
        if ("PRODUCTION".equalsIgnoreCase(requirementType) && activeBom != null && activeBom.getProcesses() != null) {
            BigDecimal baseQty = (activeBom.getBaseQuantity() != null && activeBom.getBaseQuantity().compareTo(BigDecimal.ZERO) > 0)
                    ? activeBom.getBaseQuantity() : BigDecimal.ONE;

            for (BomProcess process : activeBom.getProcesses()) {
                if (process.getMaterials() == null) continue;
                for (BomProcessMaterial mat : process.getMaterials()) {
                    ProductMaster childProduct = mat.getInputProduct();
                    if (childProduct == null) continue;

                    BigDecimal matQtyPerUnit = mat.getQuantity() != null ? mat.getQuantity() : BigDecimal.ONE;

                    // Child Gross Qty = (Parent Gross Qty / Base Qty) * Child Mat Qty
                    BigDecimal childGrossQty = grossQty.divide(baseQty, 6, java.math.RoundingMode.HALF_UP)
                            .multiply(matQtyPerUnit);

                    Set<Long> childVisited = new HashSet<>(visited);
                    List<String> childPathNames = new ArrayList<>(pathNames);

                    ProductionPlanTransDto childNode = explodeRecursive(childProduct, childGrossQty, requiredDate,
                            currentLevel + 1, null, null, childVisited, childPathNames);

                    node.getChildren().add(childNode);
                }
            }
        }

        return node;
    }

    public String classifyItemType(ProductMaster product) {
        String invType = product.getInventoryType();
        String cat = product.getItemCategory();

        if (invType != null) {
            String upper = invType.toUpperCase();
            if (upper.contains("RAW") || upper.contains("RM")) return "RAW_MATERIAL";
            if (upper.contains("SUB") || upper.contains("SFG")) return "SUB_ASSEMBLY";
            if (upper.contains("BOUGHT") || upper.contains("BO")) return "BOUGHT_OUT";
            if (upper.contains("COMPONENT")) return "COMPONENT";
            if (upper.contains("PRODUCT") || upper.contains("FG") || upper.contains("FINISHED")) return "FINISHED_GOOD";
        }
        if (cat != null) {
            String upperCat = cat.toUpperCase();
            if (upperCat.contains("RAW") || upperCat.contains("RM")) return "RAW_MATERIAL";
            if (upperCat.contains("SUB") || upperCat.contains("SFG")) return "SUB_ASSEMBLY";
            if (upperCat.contains("BOUGHT") || upperCat.contains("BO")) return "BOUGHT_OUT";
        }

        List<BomMaster> boms = bomMasterRepository.findByProductId(product.getId());
        if (!boms.isEmpty()) {
            return "SUB_ASSEMBLY";
        }
        return "RAW_MATERIAL";
    }

    public String classifyRequirementType(ProductMaster product, BomMaster bom, String itemType) {
        if ("RAW_MATERIAL".equalsIgnoreCase(itemType) || "BOUGHT_OUT".equalsIgnoreCase(itemType)) {
            return "PROCUREMENT";
        }
        if (bom != null && Boolean.TRUE.equals(bom.getIsActive())) {
            return "PRODUCTION";
        }
        if ("FINISHED_GOOD".equalsIgnoreCase(itemType) || "SUB_ASSEMBLY".equalsIgnoreCase(itemType)) {
            return "PRODUCTION";
        }
        return "PROCUREMENT";
    }
}
