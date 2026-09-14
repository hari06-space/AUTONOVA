package com.autonoma.erp.modules.npd.packing.repository;

import com.autonoma.erp.modules.npd.packing.entity.PackingProcedureHeader;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PackingProcedureHeaderRepository extends JpaRepository<PackingProcedureHeader, Long> {
    List<PackingProcedureHeader> findByIsActiveTrue();
    Optional<PackingProcedureHeader> findByDocNoAndIsActiveTrue(String docNo);
    List<PackingProcedureHeader> findByDocNoOrderByRevNoDesc(String docNo);
    Optional<PackingProcedureHeader> findByProductIdAndProcessIdAndIsActiveTrue(Long productId, Long processId);
    
    @Query("SELECT COUNT(DISTINCT p.docNo) FROM PackingProcedureHeader p")
    long countDistinctDocNos();
}
