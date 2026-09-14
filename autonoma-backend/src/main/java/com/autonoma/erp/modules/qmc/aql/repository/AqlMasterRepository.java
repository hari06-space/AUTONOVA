package com.autonoma.erp.modules.qmc.aql.repository;

import com.autonoma.erp.modules.qmc.aql.entity.AqlMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AqlMasterRepository extends JpaRepository<AqlMaster, Long> {
    
    Optional<AqlMaster> findByAqlCode(String aqlCode);
    
    @Query("SELECT MAX(a.id) FROM AqlMaster a")
    Long findMaxId();
}
