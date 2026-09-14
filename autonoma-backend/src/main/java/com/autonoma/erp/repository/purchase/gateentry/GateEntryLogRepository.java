package com.autonoma.erp.repository.purchase.gateentry;

import com.autonoma.erp.model.purchase.gateentry.GateEntryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GateEntryLogRepository extends JpaRepository<GateEntryLog, Long> {
    List<GateEntryLog> findByGateEntryHeadIdOrderByCreatedDateDesc(Long gateEntryHeadId);
}
