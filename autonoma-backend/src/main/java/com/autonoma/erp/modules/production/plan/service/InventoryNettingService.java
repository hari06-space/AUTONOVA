/*
Organization: Autonoma ERP
Owner: Developer
Created At: 2026-09-05
Description: Service for Inventory, Stock, WIP Netting & Requirement Aggregation
*/
package com.autonoma.erp.modules.production.plan.service;

import com.autonoma.erp.modules.production.plan.dto.ProductionPlanSummaryDto;
import com.autonoma.erp.modules.production.plan.dto.ProductionPlanTransDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class InventoryNettingService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(InventoryNettingService.class);

    private final JdbcTemplate jdbcTemplate;

    /**
     * Applies Stock / WIP / Open Production netting recursively across the tree
     * and generates an aggregated MRP Summary.
     */
    @Transactional(readOnly = true)
    public List<ProductionPlanSummaryDto> applyNettingAndBuildSummary(List<ProductionPlanTransDto> rootTrees) {
        // Collect all product IDs in the tree
        Set<Long> productIds = new HashSet<>();
        collectProductIds(rootTrees, productIds);

        if (productIds.isEmpty()) {
            return new ArrayList<>();
        }

        // Batch query current stock from ITEM_TRANSACTION
        Map<Long, BigDecimal> stockMap = fetchBatchCurrentStock(productIds);

        // Apply netting recursively across all tree nodes
        for (ProductionPlanTransDto root : rootTrees) {
            netNodeRecursive(root, stockMap);
        }

        // Aggregate summary by Product ID + Requirement Type
        return aggregateRequirementSummary(rootTrees, stockMap);
    }

    private void collectProductIds(List<ProductionPlanTransDto> nodes, Set<Long> productIds) {
        for (ProductionPlanTransDto n : nodes) {
            if (n.getProductId() != null) {
                productIds.add(n.getProductId());
            }
            if (n.getChildren() != null && !n.getChildren().isEmpty()) {
                collectProductIds(n.getChildren(), productIds);
            }
        }
    }

    private Map<Long, BigDecimal> fetchBatchCurrentStock(Set<Long> productIds) {
        Map<Long, BigDecimal> stockMap = new HashMap<>();
        if (productIds == null || productIds.isEmpty()) return stockMap;

        String inClause = String.join(",", productIds.stream().map(String::valueOf).toArray(String[]::new));
        String sql = "SELECT PRODUCT_ID, COALESCE(SUM(QTY_IN - QTY_OUT), 0) as CURRENT_STOCK " +
                "FROM ITEM_TRANSACTION WITH (NOLOCK) " +
                "WHERE PRODUCT_ID IN (" + inClause + ") AND (IS_REJECTION = 0 OR IS_REJECTION IS NULL) " +
                "GROUP BY PRODUCT_ID";

        try {
            jdbcTemplate.query(sql, rs -> {
                Long pid = rs.getLong("PRODUCT_ID");
                BigDecimal stock = rs.getBigDecimal("CURRENT_STOCK");
                stockMap.put(pid, stock != null ? stock : BigDecimal.ZERO);
            });
        } catch (Exception e) {
            log.error("Error fetching batch current stock", e);
        }

        return stockMap;
    }

    private void netNodeRecursive(ProductionPlanTransDto node, Map<Long, BigDecimal> stockMap) {
        BigDecimal availableStock = stockMap.getOrDefault(node.getProductId(), BigDecimal.ZERO);
        node.setStockQty(availableStock);
        node.setWipQty(BigDecimal.ZERO);
        node.setOpenProductionQty(BigDecimal.ZERO);

        // Net Qty = MAX(0, Gross Qty - Stock Qty - WIP Qty - Open Production Qty)
        BigDecimal totalAvailable = availableStock.add(node.getWipQty()).add(node.getOpenProductionQty());
        BigDecimal net = node.getGrossQty().subtract(totalAvailable);
        node.setNetQty(net.compareTo(BigDecimal.ZERO) > 0 ? net : BigDecimal.ZERO);

        if (node.getChildren() != null) {
            for (ProductionPlanTransDto child : node.getChildren()) {
                netNodeRecursive(child, stockMap);
            }
        }
    }

    private List<ProductionPlanSummaryDto> aggregateRequirementSummary(List<ProductionPlanTransDto> rootTrees, Map<Long, BigDecimal> stockMap) {
        Map<String, ProductionPlanSummaryDto> summaryMap = new LinkedHashMap<>();

        List<ProductionPlanTransDto> allNodes = new ArrayList<>();
        collectAllNodes(rootTrees, allNodes);

        for (ProductionPlanTransDto n : allNodes) {
            String key = n.getProductId() + "_" + n.getRequirementType();
            ProductionPlanSummaryDto existing = summaryMap.get(key);

            if (existing == null) {
                BigDecimal stock = stockMap.getOrDefault(n.getProductId(), BigDecimal.ZERO);
                existing = ProductionPlanSummaryDto.builder()
                        .productId(n.getProductId())
                        .productCode(n.getProductCode())
                        .productName(n.getProductName())
                        .itemType(n.getItemType())
                        .requirementType(n.getRequirementType())
                        .totalGrossQty(n.getGrossQty())
                        .stockQty(stock)
                        .wipQty(BigDecimal.ZERO)
                        .openProductionQty(BigDecimal.ZERO)
                        .netQty(BigDecimal.ZERO) // Will calculate after summing gross
                        .uom(n.getUom())
                        .requiredDate(n.getRequiredDate())
                        .bomId(n.getBomId())
                        .bomNo(n.getBomNo())
                        .status("PENDING")
                        .build();
                summaryMap.put(key, existing);
            } else {
                existing.setTotalGrossQty(existing.getTotalGrossQty().add(n.getGrossQty()));
            }
        }

        // Calculate aggregated Net Qty for each unique item requirement
        for (ProductionPlanSummaryDto s : summaryMap.values()) {
            BigDecimal totalAvail = s.getStockQty().add(s.getWipQty()).add(s.getOpenProductionQty());
            BigDecimal net = s.getTotalGrossQty().subtract(totalAvail);
            s.setNetQty(net.compareTo(BigDecimal.ZERO) > 0 ? net : BigDecimal.ZERO);
        }

        return new ArrayList<>(summaryMap.values());
    }

    private void collectAllNodes(List<ProductionPlanTransDto> nodes, List<ProductionPlanTransDto> collector) {
        for (ProductionPlanTransDto n : nodes) {
            collector.add(n);
            if (n.getChildren() != null && !n.getChildren().isEmpty()) {
                collectAllNodes(n.getChildren(), collector);
            }
        }
    }
}
