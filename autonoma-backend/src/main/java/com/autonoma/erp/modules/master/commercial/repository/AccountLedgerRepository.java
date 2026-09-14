package com.autonoma.erp.modules.master.commercial.repository;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountLedgerRepository extends JpaRepository<AccountLedger, Long> {
    
    // For vendor master fetching
    List<AccountLedger> findByIsSupplierTrueAndIsActiveTrue();

    @org.springframework.data.jpa.repository.Query("SELECT a FROM AccountLedger a WHERE (a.isSupplier = true OR LOWER(a.category) LIKE '%supplier%' OR LOWER(a.category) LIKE '%creditor%' OR LOWER(a.ledgerType) LIKE '%supplier%' OR LOWER(a.ledgerType) LIKE '%vendor%') AND (a.isActive IS NULL OR a.isActive = true)")
    List<AccountLedger> findActiveSuppliers();
    
    // For customer master fetching
    List<AccountLedger> findByIsCustomerTrueAndIsActiveTrue();

    @org.springframework.data.jpa.repository.Query("SELECT a FROM AccountLedger a WHERE (a.isCustomer = true OR LOWER(a.category) LIKE '%customer%' OR LOWER(a.category) LIKE '%debtor%' OR LOWER(a.ledgerType) LIKE '%customer%') AND (a.isActive IS NULL OR a.isActive = true)")
    List<AccountLedger> findActiveCustomers();
    
    // For customer master logic
    boolean existsByLedgerNameIgnoreCase(String name);
    boolean existsByLedgerNameIgnoreCaseAndIdNot(String name, Long id);
    Optional<AccountLedger> findByLedgerNameIgnoreCase(String name);
    
    // We map Customer Code to 'REGISTER_NO' for now if needed, or we just add a custom query
    // Wait, let's assume they want to use 'referenceCode' or 'registerNo' for the auto-generated code
    Optional<AccountLedger> findTopByCodeStartingWithOrderByCodeDesc(String prefix);
    Optional<AccountLedger> findByCode(String code);
    Optional<AccountLedger> findByCodeIgnoreCase(String code);

    // For finance and tax ledgers
    List<AccountLedger> findByLedgerTypeIgnoreCaseAndIsActiveTrue(String ledgerType);
    List<AccountLedger> findByLedgerTypeIgnoreCase(String ledgerType);
    List<AccountLedger> findByCategoryIn(List<String> categories);
}
