package com.autonoma.erp.repository.purchase.gateentry;

import com.autonoma.erp.model.purchase.gateentry.GateEntrySource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GateEntrySourceRepository extends JpaRepository<GateEntrySource, Long> {
    List<GateEntrySource> findByGateEntryHeadIdAndActiveStatus(Long gateEntryHeadId, Integer activeStatus);
}
