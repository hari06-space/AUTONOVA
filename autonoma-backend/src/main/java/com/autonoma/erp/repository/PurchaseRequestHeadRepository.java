package com.autonoma.erp.repository;

import com.autonoma.erp.model.PurchaseRequestHead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PurchaseRequestHeadRepository extends JpaRepository<PurchaseRequestHead, Long>, JpaSpecificationExecutor<PurchaseRequestHead> {
    Optional<PurchaseRequestHead> findByPrNo(String prNo);
    boolean existsByPrNo(String prNo);
}
