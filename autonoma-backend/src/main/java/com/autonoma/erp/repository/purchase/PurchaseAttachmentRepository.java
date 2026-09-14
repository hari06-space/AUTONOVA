package com.autonoma.erp.repository.purchase;

import com.autonoma.erp.model.purchase.PurchaseAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseAttachmentRepository extends JpaRepository<PurchaseAttachment, Long> {
    List<PurchaseAttachment> findByPageCodeAndRefIdAndActiveStatus(String pageCode, String refId, Integer activeStatus);
    List<PurchaseAttachment> findByPoHeadIdAndActiveStatus(Long poHeadId, Integer activeStatus);
}
