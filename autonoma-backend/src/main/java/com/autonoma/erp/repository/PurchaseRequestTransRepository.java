package com.autonoma.erp.repository;

import com.autonoma.erp.model.PurchaseRequestTrans;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PurchaseRequestTransRepository extends JpaRepository<PurchaseRequestTrans, Long> {
    List<PurchaseRequestTrans> findByPurchaseRequestHeadId(Long headId);
    void deleteByPurchaseRequestHeadId(Long headId);
}
