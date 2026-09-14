package com.autonoma.erp.modules.master.finance.ledgergroup.repository;

import com.autonoma.erp.modules.master.finance.ledgergroup.entity.LedgerGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LedgerGroupRepository extends JpaRepository<LedgerGroup, Long> {
}
