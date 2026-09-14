package com.autonoma.erp.service.purchase.purchasereturn;

import com.autonoma.erp.dto.purchase.purchasereturn.PurchaseReturnHeadDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SupplierReturnService {
    
    Page<PurchaseReturnHeadDTO> getAllReturns(Long divisionId, Pageable pageable);
    
    PurchaseReturnHeadDTO getReturnById(Long id);
    
    PurchaseReturnHeadDTO generateFromQi(Long divisionId, String qiNo, String returnType);
    
    PurchaseReturnHeadDTO saveReturn(PurchaseReturnHeadDTO dto, String username);
    
    PurchaseReturnHeadDTO postReturn(Long id, String username);
    
    PurchaseReturnHeadDTO cancelReturn(Long id, String username);
}
