/*
Organization: Autonoma ERP
Owner: Developer
Created At: 2026-09-05
Description: Service for Production Planning Workflow, Tree Lineage Persistence & Execution Integrations
*/
package com.autonoma.erp.modules.production.plan.service;

import com.autonoma.erp.exception.BusinessException;
import com.autonoma.erp.model.PurchaseRequestHead;
import com.autonoma.erp.model.PurchaseRequestTrans;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.master.organization.repository.DivisionRepository;
import com.autonoma.erp.modules.npd.bom.entity.BomMaster;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository;
import com.autonoma.erp.modules.production.plan.dto.*;
import com.autonoma.erp.modules.production.plan.entity.ProductionPlanHead;
import com.autonoma.erp.modules.production.plan.entity.ProductionPlanTrans;
import com.autonoma.erp.modules.production.plan.repository.ProductionPlanHeadRepository;
import com.autonoma.erp.modules.production.plan.repository.ProductionPlanTransRepository;
import com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderDetail;
import com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderHeader;
import com.autonoma.erp.modules.sm.sales.repository.SmCustomerOrderHeaderRepository;
import com.autonoma.erp.repository.PurchaseRequestHeadRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProductionPlanService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ProductionPlanService.class);

    private final ProductionPlanHeadRepository planHeadRepository;
    private final ProductionPlanTransRepository planTransRepository;
    private final ProductMasterRepository productMasterRepository;
    private final SmCustomerOrderHeaderRepository salesOrderRepository;
    private final DivisionRepository divisionRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeMasterRepository employeeRepository;
    private final UserRepository userRepository;
    private final PurchaseRequestHeadRepository purchaseRequestHeadRepository;
    private final BomExplosionService bomExplosionService;
    private final InventoryNettingService inventoryNettingService;
    private final JdbcTemplate jdbcTemplate;

    /**
     * Get list of source documents available for planning.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAvailableSources(String sourceType) {
        List<Map<String, Object>> sources = new ArrayList<>();
        if ("SALES_ORDER".equalsIgnoreCase(sourceType) || sourceType == null) {
            List<SmCustomerOrderHeader> orders = salesOrderRepository.findAll();
            for (SmCustomerOrderHeader so : orders) {
                Optional<ProductionPlanHead> activePlan = planHeadRepository.findActivePlanForSource("SALES_ORDER", so.getId());
                Map<String, Object> map = new HashMap<>();
                map.put("sourceId", so.getId());
                map.put("sourceNo", so.getOrderNo());
                map.put("sourceDate", so.getOrderDate());
                map.put("hasActivePlan", activePlan.isPresent());
                map.put("activePlanNo", activePlan.map(ProductionPlanHead::getPlanNo).orElse(null));
                map.put("status", activePlan.map(ProductionPlanHead::getStatus).orElse("UNPLANNED"));
                sources.add(map);
            }
        }
        return sources;
    }

    /**
     * Get items in a source document along with pending quantities.
     */
    @Transactional(readOnly = true)
    public List<SourceItemDto> getSourceItems(String sourceType, Long sourceId) {
        List<SourceItemDto> result = new ArrayList<>();
        if ("SALES_ORDER".equalsIgnoreCase(sourceType) && sourceId != null) {
            SmCustomerOrderHeader order = salesOrderRepository.findById(sourceId)
                    .orElseThrow(() -> new BusinessException("Sales Order not found with ID: " + sourceId));

            if (order.getOrderDetails() != null) {
                for (SmCustomerOrderDetail dtl : order.getOrderDetails()) {
                    String partNo = dtl.getPartNo();
                    ProductMaster product = null;
                    if (partNo != null && !partNo.trim().isEmpty()) {
                        product = productMasterRepository.findByItemNo(partNo.trim()).orElse(null);
                        if (product == null) {
                            product = productMasterRepository.findByItemCode(partNo.trim()).orElse(null);
                        }
                    }

                    BigDecimal sourceQty = dtl.getQty() != null ? BigDecimal.valueOf(dtl.getQty()) : BigDecimal.ZERO;

                    BigDecimal alreadyPlanned = BigDecimal.ZERO;
                    try {
                        String sql = "SELECT COALESCE(SUM(t.GROSS_QTY), 0) FROM PP_PRODUCTION_PLAN_TRANS t WITH (NOLOCK) " +
                                "JOIN PP_PRODUCTION_PLAN_HEAD h WITH (NOLOCK) ON t.PLAN_NO = h.PLAN_NO " +
                                "WHERE h.SOURCE_TYPE = 'SALES_ORDER' AND h.SOURCE_ID = ? AND t.SOURCE_LINE_ID = ? AND h.STATUS <> 'CANCELLED'";
                        BigDecimal sum = jdbcTemplate.queryForObject(sql, BigDecimal.class, sourceId, dtl.getId());
                        if (sum != null) alreadyPlanned = sum;
                    } catch (Exception ignored) {}

                    BigDecimal pendingQty = sourceQty.subtract(alreadyPlanned);
                    if (pendingQty.compareTo(BigDecimal.ZERO) < 0) pendingQty = BigDecimal.ZERO;

                    result.add(SourceItemDto.builder()
                            .sourceLineId(dtl.getId())
                            .productId(product != null ? product.getId() : null)
                            .productCode(product != null ? product.getItemNo() : dtl.getPartNo())
                            .productName(product != null ? product.getItemName() : dtl.getPartName())
                            .uom(dtl.getUom() != null ? dtl.getUom() : (product != null ? product.getUom() : "NOS"))
                            .sourceQty(sourceQty)
                            .alreadyPlannedQty(alreadyPlanned)
                            .alreadyProducedQty(BigDecimal.ZERO)
                            .pendingQty(pendingQty)
                            .planQty(pendingQty)
                            .requiredDate(new Date())
                            .build());
                }
            }
        }
        return result;
    }

    /**
     * Preview BOM Explosion, Stock Netting & Requirement Summary before saving.
     */
    @Transactional(readOnly = true)
    public ProductionPlanHeadDto calculatePreview(ProductionPlanPreviewRequestDto request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessException("At least one product item must be selected for production planning.");
        }

        List<ProductionPlanTransDto> rootTrees = new ArrayList<>();

        for (ProductionPlanPreviewRequestDto.PlanItemInput item : request.getItems()) {
            if (item.getProductId() == null || item.getPlanQty() == null || item.getPlanQty().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            Date reqDate = item.getRequiredDate() != null ? item.getRequiredDate() : new Date();
            ProductionPlanTransDto tree = bomExplosionService.explodeProductBom(
                    item.getProductId(), item.getPlanQty(), reqDate, item.getSourceLineId());
            rootTrees.add(tree);
        }

        List<ProductionPlanSummaryDto> summary = inventoryNettingService.applyNettingAndBuildSummary(rootTrees);

        BigDecimal totalPlanned = BigDecimal.ZERO;
        BigDecimal totalProd = BigDecimal.ZERO;
        BigDecimal totalProc = BigDecimal.ZERO;
        BigDecimal totalShortage = BigDecimal.ZERO;

        for (ProductionPlanTransDto root : rootTrees) {
            totalPlanned = totalPlanned.add(root.getGrossQty());
        }

        for (ProductionPlanSummaryDto s : summary) {
            if ("PRODUCTION".equalsIgnoreCase(s.getRequirementType())) {
                totalProd = totalProd.add(s.getNetQty());
            } else {
                totalProc = totalProc.add(s.getNetQty());
            }
            totalShortage = totalShortage.add(s.getNetQty());
        }

        Long rootProductId = request.getProductId();
        if (rootProductId == null && request.getItems() != null && !request.getItems().isEmpty()) {
            rootProductId = request.getItems().stream()
                    .map(ProductionPlanPreviewRequestDto.PlanItemInput::getProductId)
                    .filter(Objects::nonNull)
                    .findFirst().orElse(null);
        }
        ProductMaster rootProduct = null;
        if (rootProductId != null) {
            rootProduct = productMasterRepository.findById(rootProductId).orElse(null);
        }

        return ProductionPlanHeadDto.builder()
                .planDate(new Date())
                .productId(rootProduct != null ? rootProduct.getId() : null)
                .productCode(rootProduct != null ? rootProduct.getItemNo() : null)
                .productName(rootProduct != null ? rootProduct.getItemName() : null)
                .productUom(rootProduct != null ? rootProduct.getUom() : null)
                .sourceType(request.getSourceType() != null ? request.getSourceType() : "MANUAL")
                .sourceId(request.getSourceId())
                .sourceNo(request.getSourceNo())
                .divisionId(request.getDivisionId())
                .priority(request.getPriority() != null ? request.getPriority() : "MEDIUM")
                .status("DRAFT")
                .remarks(request.getRemarks())
                .totalPlannedQty(totalPlanned)
                .totalProductionQty(totalProd)
                .totalProcurementQty(totalProc)
                .totalShortageQty(totalShortage)
                .transactions(rootTrees)
                .requirementSummary(summary)
                .build();
    }

    /**
     * Create a production plan with multi-level tree lineage and status guards.
     */
    @Transactional
    public ProductionPlanHeadDto createPlan(ProductionPlanPreviewRequestDto request) {
        String sourceType = request.getSourceType() != null ? request.getSourceType() : "MANUAL";
        Long sourceId = request.getSourceId();

        // 1. Enforce 1-Source -> 1-Active-Plan Rule
        if (!"MANUAL".equalsIgnoreCase(sourceType) && sourceId != null) {
            Optional<ProductionPlanHead> activePlan = planHeadRepository.findActivePlanForSource(sourceType, sourceId);
            if (activePlan.isPresent()) {
                throw new BusinessException("An active Production Plan (Plan No: " + activePlan.get().getPlanNo() +
                        ") already exists for source " + sourceType + " (ID: " + sourceId + "). Duplicate active plans are not allowed.");
            }
        }

        // 2. Validate pending quantities for source items
        if ("SALES_ORDER".equalsIgnoreCase(sourceType) && sourceId != null) {
            List<SourceItemDto> sourceItems = getSourceItems(sourceType, sourceId);
            Map<Long, BigDecimal> pendingByLine = sourceItems.stream()
                    .filter(s -> s.getSourceLineId() != null)
                    .collect(Collectors.toMap(SourceItemDto::getSourceLineId, SourceItemDto::getPendingQty, (a, b) -> a));

            for (ProductionPlanPreviewRequestDto.PlanItemInput item : request.getItems()) {
                if (item.getSourceLineId() != null) {
                    BigDecimal pending = pendingByLine.getOrDefault(item.getSourceLineId(), BigDecimal.ZERO);
                    if (item.getPlanQty().compareTo(pending) > 0) {
                        throw new BusinessException("Plan quantity (" + item.getPlanQty() +
                                ") exceeds pending quantity (" + pending + ") for line ID: " + item.getSourceLineId());
                    }
                }
            }
        }

        // 3. Perform explosion & netting preview
        ProductionPlanHeadDto preview = calculatePreview(request);

        // 4. Persist Head entity
        String currentUserIdStr = SecurityUtils.getCurrentUserId() != null ? String.valueOf(SecurityUtils.getCurrentUserId()) : "1";

        Long rootProductId = request.getProductId();
        if (rootProductId == null && request.getItems() != null && !request.getItems().isEmpty()) {
            rootProductId = request.getItems().stream()
                    .map(ProductionPlanPreviewRequestDto.PlanItemInput::getProductId)
                    .filter(Objects::nonNull)
                    .findFirst().orElse(null);
        }
        ProductMaster rootProduct = null;
        if (rootProductId != null) {
            rootProduct = productMasterRepository.findById(rootProductId).orElse(null);
        }

        ProductionPlanHead head = ProductionPlanHead.builder()
                .planDate(new Date())
                .product(rootProduct)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .sourceNo(request.getSourceNo())
                .divisionId(request.getDivisionId())
                .priority(request.getPriority() != null ? request.getPriority() : "MEDIUM")
                .status("DRAFT")
                .remarks(request.getRemarks())
                .build();
        head.setCreatedUser(currentUserIdStr);
        head.setCreatedDate(new Date());
        head.setUpdatedUser(currentUserIdStr);
        head.setUpdatedDate(new Date());

        head = planHeadRepository.save(head);

        // 5. Recursively persist transactions preserving PARENT_TRANS_NO lineage
        for (ProductionPlanTransDto rootDto : preview.getTransactions()) {
            saveTransactionRecursive(head, rootDto, null, currentUserIdStr);
        }

        return getPlanByNo(head.getPlanNo());
    }

    private void saveTransactionRecursive(ProductionPlanHead head, ProductionPlanTransDto dto, Long parentTransNo, String userIdStr) {
        ProductMaster product = productMasterRepository.findById(dto.getProductId())
                .orElseThrow(() -> new BusinessException("Product not found ID: " + dto.getProductId()));

        BomMaster bom = null;
        if (dto.getBomId() != null) {
            bom = jdbcTemplate.query("SELECT ID FROM NPD_BOM_MASTER WHERE ID = ?", (rs, rowNum) -> {
                BomMaster b = new BomMaster();
                b.setId(rs.getLong("ID"));
                return b;
            }, dto.getBomId()).stream().findFirst().orElse(null);
        }

        ProductionPlanTrans trans = ProductionPlanTrans.builder()
                .productionPlanHead(head)
                .parentTransNo(parentTransNo)
                .sourceLineId(dto.getSourceLineId())
                .product(product)
                .itemType(dto.getItemType())
                .requirementType(dto.getRequirementType())
                .bom(bom)
                .bomVersionId(dto.getBomVersionId())
                .bomLevel(dto.getBomLevel() != null ? dto.getBomLevel() : 0)
                .grossQty(dto.getGrossQty())
                .stockQty(dto.getStockQty())
                .wipQty(dto.getWipQty())
                .openProductionQty(dto.getOpenProductionQty())
                .netQty(dto.getNetQty())
                .uom(dto.getUom())
                .requiredDate(dto.getRequiredDate())
                .status("PENDING")
                .build();
        trans.setCreatedUser(userIdStr);
        trans.setCreatedDate(new Date());
        trans.setUpdatedUser(userIdStr);
        trans.setUpdatedDate(new Date());

        trans = planTransRepository.save(trans);

        if (dto.getChildren() != null) {
            for (ProductionPlanTransDto childDto : dto.getChildren()) {
                saveTransactionRecursive(head, childDto, trans.getPlanTransNo(), userIdStr);
            }
        }
    }

    /**
     * Fetch complete Production Plan detail including hierarchical tree & aggregated summary.
     */
    @Transactional(readOnly = true)
    public ProductionPlanHeadDto getPlanByNo(Long planNo) {
        ProductionPlanHead head = planHeadRepository.findById(planNo)
                .orElseThrow(() -> new BusinessException("Production Plan not found with Plan No: " + planNo));

        List<ProductionPlanTrans> allTrans = planTransRepository.findByProductionPlanHeadPlanNoOrderByPlanTransNoAsc(planNo);

        Map<Long, ProductionPlanTransDto> dtoMap = new LinkedHashMap<>();
        for (ProductionPlanTrans t : allTrans) {
            ProductionPlanTransDto dto = ProductionPlanTransDto.builder()
                    .planTransNo(t.getPlanTransNo())
                    .planNo(head.getPlanNo())
                    .parentTransNo(t.getParentTransNo())
                    .sourceLineId(t.getSourceLineId())
                    .productId(t.getProduct() != null ? t.getProduct().getId() : null)
                    .productCode(t.getProduct() != null ? t.getProduct().getItemNo() : null)
                    .productName(t.getProduct() != null ? t.getProduct().getItemName() : null)
                    .itemType(t.getItemType())
                    .requirementType(t.getRequirementType())
                    .bomId(t.getBom() != null ? t.getBom().getId() : null)
                    .bomNo(t.getBom() != null ? t.getBom().getBomNo() : null)
                    .bomVersionId(t.getBomVersionId())
                    .bomLevel(t.getBomLevel())
                    .grossQty(t.getGrossQty())
                    .stockQty(t.getStockQty())
                    .wipQty(t.getWipQty())
                    .openProductionQty(t.getOpenProductionQty())
                    .netQty(t.getNetQty())
                    .uom(t.getUom())
                    .requiredDate(t.getRequiredDate())
                    .status(t.getStatus())
                    .children(new ArrayList<>())
                    .build();
            dtoMap.put(t.getPlanTransNo(), dto);
        }

        List<ProductionPlanTransDto> rootTrees = new ArrayList<>();
        for (ProductionPlanTransDto dto : dtoMap.values()) {
            if (dto.getParentTransNo() == null) {
                rootTrees.add(dto);
            } else {
                ProductionPlanTransDto parent = dtoMap.get(dto.getParentTransNo());
                if (parent != null) {
                    parent.getChildren().add(dto);
                } else {
                    rootTrees.add(dto);
                }
            }
        }

        Set<Long> productIds = dtoMap.values().stream().map(ProductionPlanTransDto::getProductId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, BigDecimal> stockMap = new HashMap<>();
        if (!productIds.isEmpty()) {
            String inClause = String.join(",", productIds.stream().map(String::valueOf).toArray(String[]::new));
            try {
                jdbcTemplate.query("SELECT PRODUCT_ID, COALESCE(SUM(QTY_IN - QTY_OUT), 0) as CURRENT_STOCK FROM ITEM_TRANSACTION WITH (NOLOCK) WHERE PRODUCT_ID IN (" + inClause + ") AND (IS_REJECTION = 0 OR IS_REJECTION IS NULL) GROUP BY PRODUCT_ID",
                        rs -> {
                            stockMap.put(rs.getLong("PRODUCT_ID"), rs.getBigDecimal("CURRENT_STOCK"));
                        });
            } catch (Exception ignored) {}
        }

        List<ProductionPlanSummaryDto> summary = inventoryNettingService.applyNettingAndBuildSummary(rootTrees);

        BigDecimal totalPlanned = BigDecimal.ZERO;
        BigDecimal totalProd = BigDecimal.ZERO;
        BigDecimal totalProc = BigDecimal.ZERO;
        BigDecimal totalShortage = BigDecimal.ZERO;

        for (ProductionPlanTransDto root : rootTrees) {
            totalPlanned = totalPlanned.add(root.getGrossQty());
        }

        for (ProductionPlanSummaryDto s : summary) {
            if ("PRODUCTION".equalsIgnoreCase(s.getRequirementType())) {
                totalProd = totalProd.add(s.getNetQty());
            } else {
                totalProc = totalProc.add(s.getNetQty());
            }
            totalShortage = totalShortage.add(s.getNetQty());
        }

        return ProductionPlanHeadDto.builder()
                .planNo(head.getPlanNo())
                .planDate(head.getPlanDate())
                .productId(head.getProduct() != null ? head.getProduct().getId() : null)
                .productCode(head.getProduct() != null ? head.getProduct().getItemNo() : null)
                .productName(head.getProduct() != null ? head.getProduct().getItemName() : null)
                .productUom(head.getProduct() != null ? head.getProduct().getUom() : null)
                .sourceType(head.getSourceType())
                .sourceId(head.getSourceId())
                .sourceNo(head.getSourceNo())
                .divisionId(head.getDivisionId())
                .priority(head.getPriority())
                .status(head.getStatus())
                .remarks(head.getRemarks())
                .createdBy(head.getCreatedUser())
                .createdDate(head.getCreatedDate())
                .updatedBy(head.getUpdatedUser())
                .updatedDate(head.getUpdatedDate())
                .totalPlannedQty(totalPlanned)
                .totalProductionQty(totalProd)
                .totalProcurementQty(totalProc)
                .totalShortageQty(totalShortage)
                .transactions(rootTrees)
                .requirementSummary(summary)
                .build();
    }

    /**
     * Get all Production Plans for list UI.
     */
    @Transactional(readOnly = true)
    public List<ProductionPlanHeadDto> getAllPlans() {
        List<ProductionPlanHead> heads = planHeadRepository.findAllByOrderByPlanNoDesc();
        List<ProductionPlanHeadDto> dtos = new ArrayList<>();
        for (ProductionPlanHead h : heads) {
            dtos.add(ProductionPlanHeadDto.builder()
                    .planNo(h.getPlanNo())
                    .planDate(h.getPlanDate())
                    .productId(h.getProduct() != null ? h.getProduct().getId() : null)
                    .productCode(h.getProduct() != null ? h.getProduct().getItemNo() : null)
                    .productName(h.getProduct() != null ? h.getProduct().getItemName() : null)
                    .productUom(h.getProduct() != null ? h.getProduct().getUom() : null)
                    .sourceType(h.getSourceType())
                    .sourceId(h.getSourceId())
                    .sourceNo(h.getSourceNo())
                    .divisionId(h.getDivisionId())
                    .priority(h.getPriority())
                    .status(h.getStatus())
                    .remarks(h.getRemarks())
                    .createdBy(h.getCreatedUser())
                    .createdDate(h.getCreatedDate())
                    .build());
        }
        return dtos;
    }

    /**
     * Release a Production Plan.
     */
    @Transactional
    public ProductionPlanHeadDto releasePlan(Long planNo) {
        ProductionPlanHead head = planHeadRepository.findById(planNo)
                .orElseThrow(() -> new BusinessException("Production Plan not found with Plan No: " + planNo));

        if ("CANCELLED".equalsIgnoreCase(head.getStatus()) || "COMPLETED".equalsIgnoreCase(head.getStatus())) {
            throw new BusinessException("Cannot release Production Plan in status: " + head.getStatus());
        }

        String currentUserIdStr = SecurityUtils.getCurrentUserId() != null ? String.valueOf(SecurityUtils.getCurrentUserId()) : "1";
        head.setStatus("RELEASED");
        head.setUpdatedUser(currentUserIdStr);
        head.setUpdatedDate(new Date());
        planHeadRepository.save(head);

        List<ProductionPlanTrans> trans = planTransRepository.findByProductionPlanHeadPlanNoOrderByPlanTransNoAsc(planNo);
        for (ProductionPlanTrans t : trans) {
            t.setStatus("RELEASED");
            planTransRepository.save(t);
        }

        return getPlanByNo(planNo);
    }

    /**
     * Cancel a Production Plan.
     */
    @Transactional
    public ProductionPlanHeadDto cancelPlan(Long planNo) {
        ProductionPlanHead head = planHeadRepository.findById(planNo)
                .orElseThrow(() -> new BusinessException("Production Plan not found with Plan No: " + planNo));

        if ("COMPLETED".equalsIgnoreCase(head.getStatus())) {
            throw new BusinessException("Completed Production Plan cannot be cancelled.");
        }

        String currentUserIdStr = SecurityUtils.getCurrentUserId() != null ? String.valueOf(SecurityUtils.getCurrentUserId()) : "1";
        head.setStatus("CANCELLED");
        head.setUpdatedUser(currentUserIdStr);
        head.setUpdatedDate(new Date());
        planHeadRepository.save(head);

        List<ProductionPlanTrans> trans = planTransRepository.findByProductionPlanHeadPlanNoOrderByPlanTransNoAsc(planNo);
        for (ProductionPlanTrans t : trans) {
            t.setStatus("CANCELLED");
            planTransRepository.save(t);
        }

        return getPlanByNo(planNo);
    }

    /**
     * Generate Purchase Requests from Procurement Requirements of a Production Plan.
     */
    @Transactional
    public Map<String, Object> generatePurchaseRequests(Long planNo, List<Long> productIds) {
        ProductionPlanHead head = planHeadRepository.findById(planNo)
                .orElseThrow(() -> new BusinessException("Production Plan not found with Plan No: " + planNo));

        ProductionPlanHeadDto planDto = getPlanByNo(planNo);
        List<ProductionPlanSummaryDto> procReqs = planDto.getRequirementSummary().stream()
                .filter(s -> "PROCUREMENT".equalsIgnoreCase(s.getRequirementType()) && s.getNetQty().compareTo(BigDecimal.ZERO) > 0)
                .collect(Collectors.toList());

        if (productIds != null && !productIds.isEmpty()) {
            procReqs = procReqs.stream().filter(s -> productIds.contains(s.getProductId())).collect(Collectors.toList());
        }

        if (procReqs.isEmpty()) {
            throw new BusinessException("No net procurement requirements with shortage found for this plan.");
        }

        String currentUserIdStr = SecurityUtils.getCurrentUserId() != null ? String.valueOf(SecurityUtils.getCurrentUserId()) : "1";
        EmployeeMaster planner = employeeRepository.findAll().stream().findFirst().orElse(null);
        Department dept = departmentRepository.findAll().stream().findFirst().orElse(null);
        Division division = divisionRepository.findAll().stream().findFirst().orElse(null);

        String prNo = "PR-PP-" + planNo + "-" + (System.currentTimeMillis() % 10000);

        PurchaseRequestHead prHead = new PurchaseRequestHead();
        prHead.setPrNo(prNo);
        prHead.setPrDate(new Date());
        prHead.setDepartment(dept);
        prHead.setPlanner(planner);
        prHead.setPrFrom("PRODUCTION_PLAN");
        prHead.setRemarks("Auto-generated from Production Plan PP-" + planNo);
        prHead.setStatus(true);
        prHead.setDivision(division);
        prHead.setCreatedUser(currentUserIdStr);
        prHead.setCreatedDate(new Date());

        List<PurchaseRequestTrans> prTransList = new ArrayList<>();
        for (ProductionPlanSummaryDto req : procReqs) {
            PurchaseRequestTrans prt = new PurchaseRequestTrans();
            prt.setPurchaseRequestHead(prHead);
            prt.setItem(productMasterRepository.findById(req.getProductId()).orElse(null));
            prt.setReqQty(req.getNetQty());
            prt.setUom(req.getUom() != null ? req.getUom() : "NOS");
            prt.setReqDate(req.getRequiredDate() != null ? req.getRequiredDate() : new Date());
            prt.setRemarks("Production Plan PP-" + planNo);
            prt.setCreatedUser(currentUserIdStr);
            prt.setCreatedDate(new Date());
            prTransList.add(prt);
        }
        prHead.setTransactions(prTransList);

        prHead = purchaseRequestHeadRepository.save(prHead);

        Map<String, Object> res = new HashMap<>();
        res.put("prId", prHead.getId());
        res.put("prNo", prHead.getPrNo());
        res.put("itemCount", prTransList.size());
        res.put("message", "Successfully generated Purchase Request " + prHead.getPrNo() + " with " + prTransList.size() + " item(s).");
        return res;
    }
}
