package com.autonoma.erp.repository.purchase.gateentry;

import com.autonoma.erp.model.purchase.gateentry.GateEntryVisitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GateEntryVisitorRepository extends JpaRepository<GateEntryVisitor, Long> {
    Optional<GateEntryVisitor> findByGateEntryHeadIdAndActiveStatus(Long gateEntryHeadId, Integer activeStatus);
}
