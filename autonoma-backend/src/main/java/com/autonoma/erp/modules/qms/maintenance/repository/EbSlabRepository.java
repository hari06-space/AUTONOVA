package com.autonoma.erp.modules.qms.maintenance.repository;

import com.autonoma.erp.modules.qms.maintenance.entity.EbSlab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EbSlabRepository extends JpaRepository<EbSlab, Long> {
    List<EbSlab> findByEffectFromOrderBySeqNo(LocalDate effectFrom);
    boolean existsByEffectFrom(LocalDate effectFrom);

    @Query("SELECT e FROM EbSlab e WHERE e.status = 'ACTIVE' OR e.isActive = true")
    List<EbSlab> findAllActive();
}
