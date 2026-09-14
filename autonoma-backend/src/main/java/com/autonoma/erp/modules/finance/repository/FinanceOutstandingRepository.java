package com.autonoma.erp.modules.finance.repository;

import com.autonoma.erp.modules.finance.entity.FinanceOutstanding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FinanceOutstandingRepository extends JpaRepository<FinanceOutstanding, Long>, JpaSpecificationExecutor<FinanceOutstanding> {

    List<FinanceOutstanding> findByPartyId(Long partyId);
    
    // To support multiple bills with the same number but different outstanding records
    // Usually, we pick the open one if we search by bill number.
    List<FinanceOutstanding> findByPartyIdAndPartyBillNo(Long partyId, String partyBillNo);
    
    List<FinanceOutstanding> findByDivisionId(Long divisionId);
    
    @Query("SELECT o FROM FinanceOutstanding o WHERE o.onAccount = true AND o.party.id = :partyId")
    List<FinanceOutstanding> findOnAccountByPartyId(@Param("partyId") Long partyId);
}
