package com.autonoma.erp.repository.purchase.purchasereturn;

import com.autonoma.erp.model.purchase.purchasereturn.PurchaseReturnTrans;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseReturnTransRepository extends JpaRepository<PurchaseReturnTrans, Long> {
    List<PurchaseReturnTrans> findByHeadId(Long headId);
}
