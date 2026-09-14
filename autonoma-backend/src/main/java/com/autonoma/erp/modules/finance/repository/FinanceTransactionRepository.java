package com.autonoma.erp.modules.finance.repository;

import com.autonoma.erp.modules.finance.entity.FinanceTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FinanceTransactionRepository extends JpaRepository<FinanceTransaction, Long>, JpaSpecificationExecutor<FinanceTransaction> {

    List<FinanceTransaction> findByBillOutstandingId(Long billOutstandingId);
    
    List<FinanceTransaction> findByPartyId(Long partyId);
    
    List<FinanceTransaction> findByPartyBillNo(String partyBillNo);
    
    boolean existsByRefIdAndTransType(Integer refId, String transType);
    
    boolean existsByVrNoAndTransType(String vrNo, String transType);
}
