package com.autonoma.erp.modules.sm.sales.repository;

import com.autonoma.erp.modules.sm.sales.entity.SmQuotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SmQuotationRepository extends JpaRepository<SmQuotation, Long> {

    List<SmQuotation> findByStatus(Boolean status);

    @Query("SELECT MAX(q.id) FROM SmQuotation q")
    Optional<Long> findMaxId();

    boolean existsByQuotationNo(String quotationNo);
    boolean existsByQuotationNoAndIdNot(String quotationNo, Long id);
}
