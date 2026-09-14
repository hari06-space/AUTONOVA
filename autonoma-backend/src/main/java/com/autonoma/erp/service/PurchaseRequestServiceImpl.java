package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.PurchaseRequestHeadDTO;
import com.autonoma.erp.dto.purchase.PurchaseRequestTransDTO;
import com.autonoma.erp.dto.purchase.PurchaseRequestListDTO;
import com.autonoma.erp.dto.purchase.PurchaseRequestLifecycleDTO;
import com.autonoma.erp.model.PurchaseRequestHead;
import com.autonoma.erp.model.PurchaseRequestTrans;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.repository.PurchaseRequestHeadRepository;
import com.autonoma.erp.repository.PurchaseRequestTransRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.model.admin.UserCredential;

@Service
public class PurchaseRequestServiceImpl implements PurchaseRequestService {

    @Autowired
    private PurchaseRequestHeadRepository headRepository;

    @Autowired
    private PurchaseRequestTransRepository transRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public PurchaseRequestHeadDTO createPurchaseRequest(PurchaseRequestHeadDTO dto, String userId, Long divisionId) {
        PurchaseRequestHead head = new PurchaseRequestHead();
        
        // Generate PR No
        String prNo = generatePrNo(dto.getDepartmentId(), dto.getPrDate());
        head.setPrNo(prNo);
        head.setPrDate(dto.getPrDate());
        head.setDepartment(entityManager.getReference(Department.class, dto.getDepartmentId()));
        head.setPlanner(entityManager.getReference(EmployeeMaster.class, dto.getPlannerId()));
        head.setPrFrom(dto.getPrFrom() != null ? dto.getPrFrom() : "REGULAR");
        head.setRemarks(dto.getRemarks());
        head.setDivision(entityManager.getReference(Division.class, divisionId));
        
        head.setCreatedUser(String.valueOf(userId));
        head.setCreatedDate(new Date());

        head = headRepository.save(head);

        List<PurchaseRequestTrans> transactions = new ArrayList<>();
        StatusMaster draftStatus = getStatusByName("Draft");

        for (PurchaseRequestTransDTO transDto : dto.getTransactions()) {
            PurchaseRequestTrans trans = new PurchaseRequestTrans();
            trans.setPurchaseRequestHead(head);
            trans.setItem(entityManager.getReference(ProductMaster.class, transDto.getItemId()));
            trans.setUom(transDto.getUom());
            trans.setPrice(transDto.getPrice());
            trans.setReqQty(transDto.getReqQty());
            trans.setReqDate(transDto.getReqDate());
            trans.setAmount(transDto.getPrice().multiply(transDto.getReqQty()));
            trans.setRemarks(transDto.getRemarks());
            if (transDto.getApproverId() != null) {
                trans.setApprover(entityManager.getReference(EmployeeMaster.class, transDto.getApproverId()));
            }
            trans.setApprovalStatus(draftStatus);
            trans.setDivision(entityManager.getReference(Division.class, divisionId));
            trans.setCreatedUser(String.valueOf(userId));
            trans.setCreatedDate(new Date());
            transactions.add(trans);
        }
        
        transRepository.saveAll(transactions);
        return getPurchaseRequestById(head.getId());
    }

    @Override
    @Transactional
    public PurchaseRequestHeadDTO updatePurchaseRequest(Long id, PurchaseRequestHeadDTO dto, String userId) {
        PurchaseRequestHead head = headRepository.findById(id).orElseThrow(() -> new RuntimeException("PR not found"));
        
        // Only allow editing if it's not approved/cancelled etc.
        // Verify that already Approved or Rejected transaction items are not being modified or deleted.
        List<PurchaseRequestTrans> existingTrans = transRepository.findByPurchaseRequestHeadId(id);
        for (PurchaseRequestTrans trans : existingTrans) {
            if (trans.getApprovalStatus() != null) {
                String statusName = trans.getApprovalStatus().getName();
                if ("Approved".equalsIgnoreCase(statusName) || "Rejected".equalsIgnoreCase(statusName)) {
                    PurchaseRequestTransDTO incomingDto = null;
                    if (dto.getTransactions() != null) {
                        for (PurchaseRequestTransDTO t : dto.getTransactions()) {
                            if (t.getId() != null && t.getId().equals(trans.getId())) {
                                incomingDto = t;
                                break;
                            }
                        }
                    }
                    
                    if (incomingDto == null) {
                        throw new RuntimeException("Cannot delete an item that has already been " + statusName + ".");
                    }
                    
                    boolean modified = !trans.getItem().getId().equals(incomingDto.getItemId())
                        || trans.getPrice().compareTo(incomingDto.getPrice()) != 0
                        || trans.getReqQty().compareTo(incomingDto.getReqQty()) != 0
                        || !trans.getUom().equals(incomingDto.getUom())
                        || (trans.getReqDate() != null && incomingDto.getReqDate() != null && trans.getReqDate().getTime() != incomingDto.getReqDate().getTime())
                        || (trans.getRemarks() != null && !trans.getRemarks().equals(incomingDto.getRemarks()))
                        || (trans.getRemarks() == null && incomingDto.getRemarks() != null && !incomingDto.getRemarks().trim().isEmpty());
                    
                    if (modified) {
                        throw new RuntimeException("Cannot modify an item that has already been " + statusName + ".");
                    }
                }
            }
        }
        
        head.setPrDate(dto.getPrDate());
        head.setDepartment(entityManager.getReference(Department.class, dto.getDepartmentId()));
        head.setPlanner(entityManager.getReference(EmployeeMaster.class, dto.getPlannerId()));
        head.setPrFrom(dto.getPrFrom());
        head.setRemarks(dto.getRemarks());
        head.setUpdatedUser(String.valueOf(userId));
        head.setUpdatedDate(new Date());
        
        head.getTransactions().clear();
        
        List<PurchaseRequestTrans> transactions = new ArrayList<>();
        StatusMaster status = getStatusByName("Draft");

        for (PurchaseRequestTransDTO transDto : dto.getTransactions()) {
            PurchaseRequestTrans trans = new PurchaseRequestTrans();
            trans.setPurchaseRequestHead(head);
            trans.setItem(entityManager.getReference(ProductMaster.class, transDto.getItemId()));
            trans.setUom(transDto.getUom());
            trans.setPrice(transDto.getPrice());
            trans.setReqQty(transDto.getReqQty());
            trans.setReqDate(transDto.getReqDate());
            trans.setAmount(transDto.getPrice().multiply(transDto.getReqQty()));
            trans.setRemarks(transDto.getRemarks());
            if (transDto.getApproverId() != null) {
                trans.setApprover(entityManager.getReference(EmployeeMaster.class, transDto.getApproverId()));
            }
            if (transDto.getApprovedDate() != null) {
                trans.setApprovedDate(transDto.getApprovedDate());
            }
            if (transDto.getStatusId() != null) {
                trans.setApprovalStatus(entityManager.getReference(StatusMaster.class, transDto.getStatusId()));
            } else {
                trans.setApprovalStatus(status);
            }
            trans.setDivision(head.getDivision());
            trans.setCreatedUser(head.getCreatedUser());
            trans.setCreatedDate(head.getCreatedDate());
            trans.setUpdatedUser(String.valueOf(userId));
            trans.setUpdatedDate(new Date());
            transactions.add(trans);
        }
        
        head.getTransactions().addAll(transactions);
        headRepository.save(head);
        
        return getPurchaseRequestById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseRequestHeadDTO getPurchaseRequestById(Long id) {
        PurchaseRequestHead head = headRepository.findById(id).orElseThrow(() -> new RuntimeException("PR not found"));
        return mapToDto(head);
    }

    @Override
    @Transactional
    public void deletePurchaseRequest(Long id) {
        Integer rfqCount = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM PP_RFQ_HEAD WHERE PR_REF_ID = ?", Integer.class, id);
        if (rfqCount != null && rfqCount > 0) {
            throw new RuntimeException("Cannot delete Purchase Request because an RFQ has already been raised for it.");
        }

        List<PurchaseRequestTrans> transactions = transRepository.findByPurchaseRequestHeadId(id);
        for (PurchaseRequestTrans trans : transactions) {
            if (trans.getApprovalStatus() != null) {
                String statusName = trans.getApprovalStatus().getName();
                if (!"Draft".equalsIgnoreCase(statusName)) {
                    throw new RuntimeException("Cannot delete Purchase Request. It is no longer in Draft status.");
                }
            }
        }
        
        transRepository.deleteByPurchaseRequestHeadId(id);
        headRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void submitForApproval(Long id, String userId) {
        try {
            updateTransactionStatuses(id, "Pending", userId);
        } catch (Exception e) {
            updateTransactionStatuses(id, "Pending Approval", userId);
        }
    }

    @Override
    @Transactional
    public void approvePurchaseRequest(Long id, String userId) {
        updateTransactionStatuses(id, "Verified", userId);
    }

    @Override
    @Transactional
    public void rejectPurchaseRequest(Long id, String userId) {
        updateTransactionStatuses(id, "Rejected", userId);
    }

    @Override
    @Transactional
    public void cancelPurchaseRequest(Long id, String userId) {
        updateTransactionStatuses(id, "Cancelled", userId);
    }

    @Override
    @Transactional
    public void approveTransactionItem(Long transId, String userId) {
        PurchaseRequestTrans trans = transRepository.findById(transId)
            .orElseThrow(() -> new RuntimeException("Transaction not found"));
        trans.setApprovalStatus(getStatusByName("Verified"));
        trans.setApprovedDate(new Date());
        trans.setUpdatedUser(userId);
        trans.setUpdatedDate(new Date());
        
        // Update the actual approver to the person who clicked approve
        try {
            Long empId = null;
            try {
                empId = Long.parseLong(userId); 
            } catch (NumberFormatException e) {
                java.util.Optional<UserCredential> userOpt = userRepository.findByUserId(userId);
                if (userOpt.isPresent()) {
                    empId = userOpt.get().getEmpId();
                }
            }
            if (empId != null) {
                trans.setApprover(entityManager.getReference(EmployeeMaster.class, empId));
            }
        } catch (Exception e) {
            // ignore if unable to set approver
        }
        
        transRepository.save(trans);
    }

    @Override
    @Transactional
    public void rejectTransactionItem(Long transId, String userId) {
        PurchaseRequestTrans trans = transRepository.findById(transId)
            .orElseThrow(() -> new RuntimeException("Transaction not found"));
        trans.setApprovalStatus(getStatusByName("Rejected"));
        trans.setUpdatedUser(userId);
        trans.setUpdatedDate(new Date());
        transRepository.save(trans);
    }

    @Override
    public List<PurchaseRequestListDTO> searchPurchaseRequests(String prNo, Long departmentId, Long plannerId, Long statusId, Long divisionId, boolean pendingPo) {
        StringBuilder sql = new StringBuilder(
            "WITH FilteredPR AS (" +
            "SELECT h.ID, h.PR_NO, h.PR_DATE, h.DEPARTMENT_ID, d.DEPARTMENT_NAME, h.PLANNERR_ID, p.EMPLOYEE_NAME AS PLANNER_NAME, h.REMARKS, h.STATUS " +
            "FROM PP_PURCHASE_REQUEST_HEAD h " +
            "JOIN HR_DEPARTMENT d ON h.DEPARTMENT_ID = d.ID " +
            "JOIN HR_EMPLOYEE p ON h.PLANNERR_ID = p.ID " +
            "WHERE h.DIVISION = ?"
        );
        List<Object> params = new ArrayList<>();
        params.add(divisionId);

        if (prNo != null && !prNo.isEmpty()) {
            sql.append(" AND h.PR_NO LIKE ?");
            params.add("%" + prNo + "%");
        }
        if (departmentId != null) {
            sql.append(" AND h.DEPARTMENT_ID = ?");
            params.add(departmentId);
        }
        if (pendingPo) {
            sql.append(" AND h.ID NOT IN (SELECT pos.SOURCE_HEAD_ID FROM PP_PURCHASE_ORDER_SOURCE pos JOIN PP_PURCHASE_ORDER_HEAD po ON pos.PO_HEAD_ID = po.ID WHERE pos.SOURCE_TYPE = 'PURCHASE_REQUEST' AND po.ACTIVE_STATUS = 1 AND po.STATUS_ID NOT IN (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'CANCELLED'))");
            sql.append(" AND h.STATUS = 1 ");
        }

        sql.append("), " +
            "TransAgg AS (" +
            "SELECT t.PR_REF_ID, COUNT(t.ID) AS TOTAL_ITEMS, SUM(t.AMOUNT) AS TOTAL_AMOUNT, " +
            "SUM(CASE WHEN UPPER(sm.NAME) IN ('VERIFIED', 'APPROVED') THEN 1 ELSE 0 END) AS APPROVED_ITEMS_COUNT, " +
            "CASE " +
            "WHEN COUNT(t.ID) = 0 THEN 'Draft' " +
            "WHEN SUM(CASE WHEN UPPER(sm.NAME) IN ('PENDING', 'PENDING APPROVAL') THEN 1 ELSE 0 END) > 0 THEN 'Pending' " +
            "WHEN SUM(CASE WHEN UPPER(sm.NAME) = 'REJECTED' THEN 1 ELSE 0 END) > 0 THEN 'Rejected' " +
            "WHEN SUM(CASE WHEN UPPER(sm.NAME) = 'DRAFT' THEN 1 ELSE 0 END) > 0 THEN 'Draft' " +
            "WHEN SUM(CASE WHEN UPPER(sm.NAME) IN ('VERIFIED', 'APPROVED') THEN 1 ELSE 0 END) = COUNT(t.ID) THEN 'Verified' " +
            "ELSE MAX(sm.NAME) END AS WORKFLOW_STATUS " +
            "FROM PP_PURCHASE_REQUEST_TRANS t " +
            "INNER JOIN FilteredPR f ON t.PR_REF_ID = f.ID " +
            "LEFT JOIN AD_STATUS_MASTER sm ON t.STATUS_ID = sm.ID " +
            "GROUP BY t.PR_REF_ID" +
            "), " +
            "RfqRanked AS (" +
            "SELECT r.PR_REF_ID, r.ID AS RFQ_ID, r.RFQ_NO, sm.NAME AS RFQ_STATUS, " +
            "ROW_NUMBER() OVER(PARTITION BY r.PR_REF_ID ORDER BY r.ID DESC) as rn " +
            "FROM PP_RFQ_HEAD r " +
            "INNER JOIN FilteredPR f ON r.PR_REF_ID = f.ID " +
            "LEFT JOIN AD_STATUS_MASTER sm ON r.STATUS_ID = sm.ID" +
            "), " +
            "RfqAgg AS (" +
            "SELECT PR_REF_ID, RFQ_ID, RFQ_NO, RFQ_STATUS FROM RfqRanked WHERE rn = 1" +
            ") " +
            "SELECT f.ID, f.PR_NO, f.PR_DATE, f.DEPARTMENT_ID, f.DEPARTMENT_NAME, f.PLANNERR_ID, f.PLANNER_NAME, f.REMARKS, f.STATUS, " +
            "COALESCE(t.TOTAL_ITEMS, 0) AS TOTAL_ITEMS, " +
            "COALESCE(t.TOTAL_AMOUNT, 0) AS TOTAL_AMOUNT, " +
            "COALESCE(t.APPROVED_ITEMS_COUNT, 0) AS APPROVED_ITEMS_COUNT, " +
            "COALESCE(t.WORKFLOW_STATUS, 'Draft') AS WORKFLOW_STATUS, " +
            "r.RFQ_ID, r.RFQ_NO, r.RFQ_STATUS, " +
            "CASE " +
            "WHEN EXISTS (SELECT 1 FROM PP_PURCHASE_ORDER_SOURCE pos JOIN PP_PURCHASE_ORDER_HEAD po ON pos.PO_HEAD_ID = po.ID WHERE po.ACTIVE_STATUS = 1 AND ((pos.SOURCE_TYPE = 'SUPPLIER_QUOTATION' AND pos.SOURCE_HEAD_ID IN (SELECT q.ID FROM PP_QUOTATION_HEAD q JOIN PP_RFQ_HEAD rfq ON q.RFQ_REF_ID = rfq.ID WHERE rfq.PR_REF_ID = f.ID)) OR (pos.SOURCE_TYPE = 'QUOTATION_COMPARISON' AND pos.SOURCE_HEAD_ID IN (SELECT c.ID FROM PP_QUOTE_COMPARISON_HEAD c JOIN PP_RFQ_HEAD rfq ON c.RFQ_ID = rfq.ID WHERE rfq.PR_REF_ID = f.ID)))) THEN 'PO Issued' " +
            "WHEN EXISTS (SELECT 1 FROM PP_QUOTE_COMPARISON_HEAD qc JOIN PP_RFQ_HEAD rfq ON qc.RFQ_ID = rfq.ID WHERE rfq.PR_REF_ID = f.ID) THEN 'Comparison Done' " +
            "WHEN EXISTS (SELECT 1 FROM PP_QUOTATION_NEGOTIATION_HEAD qn JOIN PP_RFQ_HEAD rfq ON qn.RFQ_ID = rfq.ID WHERE rfq.PR_REF_ID = f.ID) THEN 'Under Negotiation' " +
            "WHEN EXISTS (SELECT 1 FROM PP_QUOTATION_HEAD q JOIN PP_RFQ_HEAD rfq ON q.RFQ_REF_ID = rfq.ID WHERE rfq.PR_REF_ID = f.ID) THEN 'Quotations Received' " +
            "WHEN r.RFQ_ID IS NOT NULL THEN 'RFQ Issued' " +
            "ELSE 'Pending' END AS TRACKING_STATUS " +
            "FROM FilteredPR f " +
            "LEFT JOIN TransAgg t ON f.ID = t.PR_REF_ID " +
            "LEFT JOIN RfqAgg r ON f.ID = r.PR_REF_ID " +
            "ORDER BY f.ID DESC"
        );
        
        return jdbcTemplate.query(sql.toString(), params.toArray(), (rs, rowNum) -> {
            PurchaseRequestListDTO dto = new PurchaseRequestListDTO();
            dto.setId(rs.getLong("ID"));
            dto.setPrNo(rs.getString("PR_NO"));
            dto.setPrDate(rs.getDate("PR_DATE"));
            dto.setDepartmentId(rs.getLong("DEPARTMENT_ID"));
            dto.setDepartmentName(rs.getString("DEPARTMENT_NAME"));
            dto.setPlannerId(rs.getLong("PLANNERR_ID"));
            dto.setPlannerName(rs.getString("PLANNER_NAME"));
            dto.setRemarks(rs.getString("REMARKS"));
            dto.setStatus(rs.getBoolean("STATUS"));
            dto.setTotalItems(rs.getInt("TOTAL_ITEMS"));
            dto.setTotalAmount(rs.getBigDecimal("TOTAL_AMOUNT"));
            dto.setWorkflowStatus(rs.getString("WORKFLOW_STATUS"));
            dto.setApprovedItemsCount(rs.getInt("APPROVED_ITEMS_COUNT"));
            dto.setRfqId(rs.getLong("RFQ_ID") == 0 ? null : rs.getLong("RFQ_ID"));
            dto.setRfqNo(rs.getString("RFQ_NO"));
            dto.setRfqStatus(rs.getString("RFQ_STATUS"));
            dto.setTrackingStatus(rs.getString("TRACKING_STATUS"));
            return dto;
        });
    }

    private void updateTransactionStatuses(Long headId, String statusName, String userId) {
        StatusMaster status = getStatusByName(statusName);
        List<PurchaseRequestTrans> transactions = transRepository.findByPurchaseRequestHeadId(headId);
        
        Long empId = null;
        if (userId != null) {
            try {
                empId = Long.parseLong(userId);
            } catch (NumberFormatException e) {
                java.util.Optional<UserCredential> userOpt = userRepository.findByUserId(userId);
                if (userOpt.isPresent()) {
                    empId = userOpt.get().getEmpId();
                }
            }
        }
        
        for (PurchaseRequestTrans trans : transactions) {
            trans.setApprovalStatus(status);
            if ("Verified".equalsIgnoreCase(statusName) || "Approved".equalsIgnoreCase(statusName)) {
                trans.setApprovedDate(new Date());
            }
            // Update approver for Verify, Approve or Reject
            if (empId != null && ("Verified".equalsIgnoreCase(statusName) || "Approved".equalsIgnoreCase(statusName) || "Rejected".equalsIgnoreCase(statusName))) {
                trans.setApprover(entityManager.getReference(EmployeeMaster.class, empId));
            }
        }
        transRepository.saveAll(transactions);
    }

    private String getAccountYear(java.util.Date documentDate) {
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.setTime(documentDate != null ? documentDate : new java.util.Date());
        int year = cal.get(java.util.Calendar.YEAR);
        int month = cal.get(java.util.Calendar.MONTH);
        
        if (month < 3) {
            return (year - 1) + "-" + year;
        } else {
            return year + "-" + (year + 1);
        }
    }

    private String generatePrNo(Long departmentId, java.util.Date documentDate) {
        String basePrefix = "";
        String baseSuffix = "";
        Integer digits = null;
        String accountYear = getAccountYear(documentDate);
        
        try {
            var prefixData = jdbcTemplate.queryForMap("SELECT PR_PREFIX, PR_SUFFIX, PR_DIGIT FROM AD_PREFIX_CREDENTIALS WHERE ACCOUNT_YEAR = ?", accountYear);
            if (prefixData.get("PR_PREFIX") != null) {
                basePrefix = (String) prefixData.get("PR_PREFIX");
            }
            if (prefixData.get("PR_SUFFIX") != null) {
                baseSuffix = (String) prefixData.get("PR_SUFFIX");
            }
            if (prefixData.get("PR_DIGIT") != null) {
                digits = ((Number) prefixData.get("PR_DIGIT")).intValue();
            }
        } catch(org.springframework.dao.EmptyResultDataAccessException e) {
            throw new RuntimeException("Prefix Credentials not configured for Account Year " + accountYear + ".");
        }
        
        if ((basePrefix == null || basePrefix.trim().isEmpty()) && (baseSuffix == null || baseSuffix.trim().isEmpty())) {
            throw new RuntimeException("Both Prefix and Suffix cannot be empty for Purchase Request.");
        }
        if (digits == null || digits <= 0) {
            throw new RuntimeException("Digit must be configured for Purchase Request.");
        }
        
        StringBuilder prefixBuilder = new StringBuilder();
        if (basePrefix != null && !basePrefix.trim().isEmpty()) {
            prefixBuilder.append(basePrefix.trim());
        }
        String finalPrefix = prefixBuilder.toString().replaceAll("/+", "/");
        String finalSuffix = (baseSuffix != null) ? baseSuffix.trim().replaceAll("/+", "/") : "";
        
        String searchPattern = finalPrefix + "%" + finalSuffix;
        
        String lastPr = null;
        try {
            lastPr = jdbcTemplate.queryForObject("SELECT TOP 1 PR_NO FROM PP_PURCHASE_REQUEST_HEAD WHERE PR_NO LIKE ? ORDER BY ID DESC", String.class, searchPattern);
        } catch(Exception e) {}
        
        int nextNum = 1;
        if (lastPr != null) {
            try {
                String numStr = lastPr;
                if (!finalPrefix.isEmpty() && numStr.startsWith(finalPrefix)) {
                    numStr = numStr.substring(finalPrefix.length());
                }
                if (!finalSuffix.isEmpty() && numStr.endsWith(finalSuffix)) {
                    numStr = numStr.substring(0, numStr.length() - finalSuffix.length());
                }
                nextNum = Integer.parseInt(numStr) + 1;
            } catch(Exception e) {}
        }
        
        return finalPrefix + String.format("%0" + digits + "d", nextNum) + finalSuffix;
    }

    private StatusMaster getStatusByName(String name) {
        try {
            Long id = jdbcTemplate.queryForObject("SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE UPPER(LTRIM(RTRIM(NAME))) = UPPER(LTRIM(RTRIM(?)))", Long.class, name);
            return entityManager.getReference(StatusMaster.class, id);
        } catch(Exception e) {
            throw new RuntimeException("Status not found: " + name);
        }
    }

    private PurchaseRequestHeadDTO mapToDto(PurchaseRequestHead head) {
        PurchaseRequestHeadDTO dto = new PurchaseRequestHeadDTO();
        dto.setId(head.getId());
        dto.setPrNo(head.getPrNo());
        dto.setPrDate(head.getPrDate());
        dto.setDepartmentId(head.getDepartment().getId());
        dto.setDepartmentName(head.getDepartment().getDepartmentName());
        dto.setPlannerId(head.getPlanner().getId());
        dto.setPlannerName(head.getPlanner().getEmployeeName());
        dto.setPrFrom(head.getPrFrom());
        dto.setRemarks(head.getRemarks());
        dto.setStatus(head.getStatus());
        
        try {
            var rfqData = jdbcTemplate.queryForMap(
                "SELECT TOP 1 rfq.RFQ_NO, sm.NAME AS RFQ_STATUS FROM PP_RFQ_HEAD rfq " +
                "LEFT JOIN AD_STATUS_MASTER sm ON rfq.STATUS_ID = sm.ID " +
                "WHERE rfq.PR_REF_ID = ? ORDER BY rfq.ID DESC", head.getId());
            if (rfqData != null) {
                dto.setRfqNo((String) rfqData.get("RFQ_NO"));
                dto.setRfqStatus((String) rfqData.get("RFQ_STATUS"));
            }
        } catch (Exception e) {
            // Ignore if no RFQ found
        }
        
        List<PurchaseRequestTrans> transactions = transRepository.findByPurchaseRequestHeadId(head.getId());
        dto.setTransactions(transactions.stream().map(t -> {
            PurchaseRequestTransDTO tdto = new PurchaseRequestTransDTO();
            tdto.setId(t.getId());
            tdto.setItemId(t.getItem().getId());
            tdto.setItemCode(t.getItem().getItemCode());
            tdto.setItemName(t.getItem().getItemName());
            if (t.getItem().getAttachments() != null) {
                String imgPath = t.getItem().getAttachments().stream()
                    .map(com.autonoma.erp.modules.npd.product.entity.NpdAttachmentPath::getPath)
                    .filter(p -> p != null && (p.toLowerCase().endsWith(".jpg") || p.toLowerCase().endsWith(".jpeg") || p.toLowerCase().endsWith(".png") || p.toLowerCase().endsWith(".gif")))
                    .findFirst()
                    .orElse(null);
                tdto.setProductImage(imgPath);
            }
            tdto.setUom(t.getUom());
            tdto.setPrice(t.getPrice());
            tdto.setReqQty(t.getReqQty());
            tdto.setReqDate(t.getReqDate());
            tdto.setAmount(t.getAmount());
            tdto.setRemarks(t.getRemarks());
            if (t.getApprover() != null) {
                tdto.setApproverId(t.getApprover().getId());
                tdto.setApproverName(t.getApprover().getEmployeeName());
            }
            if (t.getApprovalStatus() != null) {
                tdto.setStatusId(t.getApprovalStatus().getId());
                tdto.setStatusName(t.getApprovalStatus().getName());
            }
            tdto.setApprovedDate(t.getApprovedDate());
            return tdto;
        }).collect(Collectors.toList()));
        
        return dto;
    }
    @Override
    @Transactional(readOnly = true)
    public PurchaseRequestLifecycleDTO getPurchaseRequestLifecycle(Long prId) {
        PurchaseRequestLifecycleDTO dto = new PurchaseRequestLifecycleDTO();
        dto.setPrId(prId);

        // Fetch PR Details
        try {
            var prData = jdbcTemplate.queryForMap(
                "SELECT PR_NO, PR_DATE, CREATED_BY, CREATED_DATE FROM PP_PURCHASE_REQUEST_HEAD pr WHERE pr.ID = ?", prId);
            dto.setPrNo((String) prData.get("PR_NO"));
            dto.setPrDate((Date) prData.get("PR_DATE"));
            dto.setPrCreatedBy((String) prData.get("CREATED_BY"));
            dto.setPrCreatedDate((Date) prData.get("CREATED_DATE"));
            String status = jdbcTemplate.queryForObject(
                "SELECT CASE " +
                "WHEN COUNT(*) = 0 THEN 'Draft' " +
                "WHEN SUM(CASE WHEN sm.NAME = 'Pending Approval' THEN 1 ELSE 0 END) > 0 THEN 'Pending Approval' " +
                "WHEN SUM(CASE WHEN sm.NAME = 'Rejected' THEN 1 ELSE 0 END) > 0 THEN 'Rejected' " +
                "WHEN SUM(CASE WHEN sm.NAME = 'Draft' THEN 1 ELSE 0 END) > 0 THEN 'Draft' " +
                "WHEN SUM(CASE WHEN sm.NAME = 'Approved' THEN 1 ELSE 0 END) = COUNT(*) THEN 'Verified' " +
                "ELSE MAX(sm.NAME) END " +
                "FROM PP_PURCHASE_REQUEST_TRANS t JOIN AD_STATUS_MASTER sm ON t.STATUS_ID = sm.ID WHERE t.PR_REF_ID = ?", 
                String.class, prId);
            dto.setPrStatus(status);

            // Fetch verifier info if verified
            if ("Verified".equals(status)) {
                try {
                    var verifierData = jdbcTemplate.queryForMap(
                        "SELECT TOP 1 e.EMPLOYEE_NAME, t.APPROVED_DATE FROM PP_PURCHASE_REQUEST_TRANS t " +
                        "LEFT JOIN HR_EMPLOYEE e ON t.APPROVER_ID = e.ID " +
                        "WHERE t.PR_REF_ID = ? AND t.APPROVED_DATE IS NOT NULL " +
                        "ORDER BY t.APPROVED_DATE DESC", prId);
                    dto.setPrVerifierName((String) verifierData.get("EMPLOYEE_NAME"));
                    dto.setPrVerifiedDate((Date) verifierData.get("APPROVED_DATE"));
                } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            throw new RuntimeException("PR not found for tracking");
        }

        // Fetch RFQs
        List<PurchaseRequestLifecycleDTO.RfqLifecycleDTO> rfqs = jdbcTemplate.query(
            "SELECT rfq.ID, rfq.RFQ_NO, rfq.RFQ_DATE, rfq.CREATED_BY, rfq.CREATED_DATE, sm.NAME AS STATUS_NAME FROM PP_RFQ_HEAD rfq " +
            "LEFT JOIN AD_STATUS_MASTER sm ON rfq.STATUS_ID = sm.ID " +
            "WHERE rfq.PR_REF_ID = ? ORDER BY rfq.ID ASC",
            new Object[]{prId},
            (rs, rowNum) -> {
                PurchaseRequestLifecycleDTO.RfqLifecycleDTO rfq = new PurchaseRequestLifecycleDTO.RfqLifecycleDTO();
                rfq.setRfqId(rs.getLong("ID"));
                rfq.setRfqNo(rs.getString("RFQ_NO"));
                rfq.setRfqDate(rs.getDate("RFQ_DATE"));
                rfq.setRfqStatus(rs.getString("STATUS_NAME"));
                rfq.setCreatedBy(rs.getString("CREATED_BY"));
                rfq.setCreatedDate(rs.getTimestamp("CREATED_DATE"));
                return rfq;
            }
        );
        dto.setRfqs(rfqs);

        // Fetch children for each RFQ
        for (PurchaseRequestLifecycleDTO.RfqLifecycleDTO rfq : rfqs) {
            // Quotations
            List<PurchaseRequestLifecycleDTO.QuotationLifecycleDTO> quotes = jdbcTemplate.query(
                "SELECT q.ID, q.QUOTATION_NO, q.QUOTATION_DATE, q.CREATED_BY, q.CREATED_DATE, sm.NAME AS STATUS_NAME, v.LEDGER_NAME AS VENDOR_NAME " +
                "FROM PP_QUOTATION_HEAD q " +
                "LEFT JOIN AD_STATUS_MASTER sm ON q.STATUS_ID = sm.ID " +
                "LEFT JOIN FA_ACCOUNT_LEDGER v ON q.SUPPLIER_ID = v.ID " +
                "WHERE q.RFQ_REF_ID = ? ORDER BY q.ID ASC",
                new Object[]{rfq.getRfqId()},
                (rs, rowNum) -> {
                    PurchaseRequestLifecycleDTO.QuotationLifecycleDTO quote = new PurchaseRequestLifecycleDTO.QuotationLifecycleDTO();
                    quote.setQuotationId(rs.getLong("ID"));
                    quote.setQuotationNo(rs.getString("QUOTATION_NO"));
                    quote.setQuotationDate(rs.getDate("QUOTATION_DATE"));
                    quote.setQuotationStatus(rs.getString("STATUS_NAME"));
                    quote.setSupplierName(rs.getString("VENDOR_NAME"));
                    quote.setCreatedBy(rs.getString("CREATED_BY"));
                    quote.setCreatedDate(rs.getTimestamp("CREATED_DATE"));
                    return quote;
                }
            );
            rfq.setQuotations(quotes);

            try {
                List<PurchaseRequestLifecycleDTO.NegotiationLifecycleDTO> negotiations = jdbcTemplate.query(
                    "SELECT n.ID, n.NEGOTIATION_NO, n.NEGOTIATION_DATE, n.NEGOTIATION_ROUND, n.CREATED_BY, n.CREATED_DATE, sm.NAME AS STATUS_NAME " +
                    "FROM PP_QUOTATION_NEGOTIATION_HEAD n " +
                    "LEFT JOIN AD_STATUS_MASTER sm ON n.STATUS_ID = sm.ID " +
                    "WHERE n.RFQ_ID = ? ORDER BY n.ID ASC",
                    new Object[]{rfq.getRfqId()},
                    (rs, rowNum) -> {
                        PurchaseRequestLifecycleDTO.NegotiationLifecycleDTO neg = new PurchaseRequestLifecycleDTO.NegotiationLifecycleDTO();
                        neg.setNegotiationId(rs.getLong("ID"));
                        neg.setNegotiationNo(rs.getString("NEGOTIATION_NO"));
                        neg.setNegotiationDate(rs.getDate("NEGOTIATION_DATE"));
                        neg.setNegotiationRound(rs.getInt("NEGOTIATION_ROUND"));
                        neg.setNegotiationStatus(rs.getString("STATUS_NAME"));
                        neg.setCreatedBy(rs.getString("CREATED_BY"));
                        neg.setCreatedDate(rs.getTimestamp("CREATED_DATE"));
                        return neg;
                    }
                );
                rfq.setNegotiations(negotiations);
            } catch (Exception e) {}

            try {
                List<PurchaseRequestLifecycleDTO.ComparisonLifecycleDTO> comparisons = jdbcTemplate.query(
                    "SELECT c.ID, c.COMPARISON_NO, c.COMPARISON_DATE, c.CREATED_BY, c.CREATED_DATE, sm.NAME AS STATUS_NAME " +
                    "FROM PP_QUOTE_COMPARISON_HEAD c " +
                    "LEFT JOIN AD_STATUS_MASTER sm ON c.STATUS_ID = sm.ID " +
                    "WHERE c.RFQ_ID = ? ORDER BY c.ID ASC",
                    new Object[]{rfq.getRfqId()},
                    (rs, rowNum) -> {
                        PurchaseRequestLifecycleDTO.ComparisonLifecycleDTO comp = new PurchaseRequestLifecycleDTO.ComparisonLifecycleDTO();
                        comp.setComparisonId(rs.getLong("ID"));
                        comp.setComparisonNo(rs.getString("COMPARISON_NO"));
                        comp.setComparisonDate(rs.getDate("COMPARISON_DATE"));
                        comp.setComparisonStatus(rs.getString("STATUS_NAME"));
                        comp.setCreatedBy(rs.getString("CREATED_BY"));
                        comp.setCreatedDate(rs.getTimestamp("CREATED_DATE"));
                        return comp;
                    }
                );
                rfq.setComparisons(comparisons);
            } catch (Exception e) {}

            try {
                List<PurchaseRequestLifecycleDTO.PurchaseOrderLifecycleDTO> purchaseOrders = jdbcTemplate.query(
                    "SELECT DISTINCT po.ID, po.PO_NO, po.PO_DATE, po.CREATED_BY, po.CREATED_DATE, sm.NAME AS STATUS_NAME, v.LEDGER_NAME AS VENDOR_NAME " +
                    "FROM PP_PURCHASE_ORDER_HEAD po " +
                    "JOIN PP_PURCHASE_ORDER_SOURCE pos ON po.ID = pos.PO_HEAD_ID " +
                    "LEFT JOIN AD_STATUS_MASTER sm ON po.STATUS_ID = sm.ID " +
                    "LEFT JOIN FA_ACCOUNT_LEDGER v ON po.SUPPLIER_ID = v.ID " +
                    "WHERE po.ACTIVE_STATUS = 1 AND ((pos.SOURCE_TYPE = 'SUPPLIER_QUOTATION' AND pos.SOURCE_HEAD_ID IN (SELECT q.ID FROM PP_QUOTATION_HEAD q WHERE q.RFQ_REF_ID = ?)) " +
                    "OR (pos.SOURCE_TYPE = 'QUOTATION_COMPARISON' AND pos.SOURCE_HEAD_ID IN (SELECT c.ID FROM PP_QUOTE_COMPARISON_HEAD c WHERE c.RFQ_ID = ?))) " +
                    "ORDER BY po.ID ASC",
                    new Object[]{rfq.getRfqId(), rfq.getRfqId()},
                    (rs, rowNum) -> {
                        PurchaseRequestLifecycleDTO.PurchaseOrderLifecycleDTO po = new PurchaseRequestLifecycleDTO.PurchaseOrderLifecycleDTO();
                        po.setPoId(rs.getLong("ID"));
                        po.setPoNo(rs.getString("PO_NO"));
                        po.setPoDate(rs.getDate("PO_DATE"));
                        po.setPoStatus(rs.getString("STATUS_NAME"));
                        po.setSupplierName(rs.getString("VENDOR_NAME"));
                        po.setCreatedBy(rs.getString("CREATED_BY"));
                        po.setCreatedDate(rs.getTimestamp("CREATED_DATE"));
                        return po;
                    }
                );
                rfq.setPurchaseOrders(purchaseOrders);

                // For each PO, fetch downstream documents
                for (PurchaseRequestLifecycleDTO.PurchaseOrderLifecycleDTO po : purchaseOrders) {
                    try {
                        List<PurchaseRequestLifecycleDTO.GateEntryLifecycleDTO> gateEntries = jdbcTemplate.query(
                            "SELECT g.ID, g.GATE_ENTRY_NO, g.GATE_ENTRY_DATE, g.CREATED_BY, g.CREATED_DATE, sm.NAME AS STATUS_NAME " +
                            "FROM PP_GATE_ENTRY_HEAD g " +
                            "JOIN PP_GATE_ENTRY_SOURCE s ON g.ID = s.GATE_ENTRY_HEAD_ID " +
                            "LEFT JOIN AD_STATUS_MASTER sm ON g.STATUS_ID = sm.ID " +
                            "WHERE g.ACTIVE_STATUS = 1 AND s.ACTIVE_STATUS = 1 AND s.SOURCE_TYPE = 'PO' AND s.SOURCE_HEAD_ID = ? ORDER BY g.ID ASC",
                            new Object[]{po.getPoId()},
                            (rs, rowNum) -> {
                                PurchaseRequestLifecycleDTO.GateEntryLifecycleDTO ge = new PurchaseRequestLifecycleDTO.GateEntryLifecycleDTO();
                                ge.setGateEntryId(rs.getLong("ID"));
                                ge.setGateEntryNo(rs.getString("GATE_ENTRY_NO"));
                                ge.setGateEntryDate(rs.getDate("GATE_ENTRY_DATE"));
                                ge.setGateEntryStatus(rs.getString("STATUS_NAME"));
                                ge.setCreatedBy(rs.getString("CREATED_BY"));
                                ge.setCreatedDate(rs.getTimestamp("CREATED_DATE"));
                                return ge;
                            }
                        );
                        po.setGateEntries(gateEntries);

                        // For each Gate Entry, fetch Incoming Inspections & GRNs
                        for (PurchaseRequestLifecycleDTO.GateEntryLifecycleDTO ge : gateEntries) {
                            
                            // Incoming Inspections


                            // GRNs
                            try {
                                List<PurchaseRequestLifecycleDTO.GrnLifecycleDTO> grns = jdbcTemplate.query(
                                    "SELECT g.ID, g.GRN_NO, g.GRN_DATE, g.CREATED_BY, g.CREATED_DATE, sm.NAME AS STATUS_NAME " +
                                    "FROM PP_GOODS_RECEIPT_HEAD g " +
                                    "LEFT JOIN AD_STATUS_MASTER sm ON g.STATUS_ID = sm.ID " +
                                    "WHERE g.GATE_ENTRY_HEAD_ID = ? ORDER BY g.ID ASC",
                                    new Object[]{ge.getGateEntryId()},
                                    (rs, rowNum) -> {
                                        PurchaseRequestLifecycleDTO.GrnLifecycleDTO grn = new PurchaseRequestLifecycleDTO.GrnLifecycleDTO();
                                        grn.setGrnId(rs.getLong("ID"));
                                        grn.setGrnNo(rs.getString("GRN_NO"));
                                        grn.setGrnDate(rs.getDate("GRN_DATE"));
                                        grn.setGrnStatus(rs.getString("STATUS_NAME"));
                                        grn.setCreatedBy(rs.getString("CREATED_BY"));
                                        grn.setCreatedDate(rs.getTimestamp("CREATED_DATE"));
                                        return grn;
                                    }
                                );
                                ge.setGrns(grns);
                            } catch (Exception e) {}
                        }
                    } catch (Exception e) {}
                }
            } catch (Exception e) {}
        }

        return dto;
    }
}
