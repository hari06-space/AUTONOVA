package com.autonoma.erp.repository.purchase.gateentry;

import com.autonoma.erp.model.purchase.gateentry.GateEntryAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GateEntryAttachmentRepository extends JpaRepository<GateEntryAttachment, Long> {
    List<GateEntryAttachment> findByGateEntryHeadIdAndActiveStatus(Long gateEntryHeadId, Integer activeStatus);
}
