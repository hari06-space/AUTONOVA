package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.PurchaseRequestHeadDTO;
import com.autonoma.erp.dto.purchase.PurchaseRequestListDTO;
import com.autonoma.erp.dto.purchase.PurchaseRequestLifecycleDTO;
import java.util.List;

public interface PurchaseRequestService {
    PurchaseRequestHeadDTO createPurchaseRequest(PurchaseRequestHeadDTO dto, String userId, Long divisionId);
    PurchaseRequestHeadDTO updatePurchaseRequest(Long id, PurchaseRequestHeadDTO dto, String userId);
    PurchaseRequestHeadDTO getPurchaseRequestById(Long id);
    void deletePurchaseRequest(Long id);
    
    // Workflow actions
    void submitForApproval(Long id, String userId);
    void approvePurchaseRequest(Long id, String userId);
    void rejectPurchaseRequest(Long id, String userId);
    void cancelPurchaseRequest(Long id, String userId);
    
    void approveTransactionItem(Long transId, String userId);
    void rejectTransactionItem(Long transId, String userId);
    
    List<PurchaseRequestListDTO> searchPurchaseRequests(String prNo, Long departmentId, Long plannerId, Long statusId, Long divisionId, boolean pendingPo);
    
    PurchaseRequestLifecycleDTO getPurchaseRequestLifecycle(Long prId);
}
