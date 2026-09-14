package com.autonoma.erp.repository.purchase.gateentry;

import com.autonoma.erp.model.purchase.gateentry.GateEntryTrans;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GateEntryTransRepository extends JpaRepository<GateEntryTrans, Long> {
    List<GateEntryTrans> findByGateEntryHeadIdAndActiveStatus(Long gateEntryHeadId, Integer activeStatus);
}
