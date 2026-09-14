package com.autonoma.erp.modules.npd.packing.repository;

import com.autonoma.erp.modules.npd.packing.entity.ProcessProductMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProcessProductMappingRepository extends JpaRepository<ProcessProductMapping, Long> {
    List<ProcessProductMapping> findByProcessId(Long processId);
    boolean existsByProcessIdAndProductId(Long processId, Long productId);
    void deleteByProcessIdAndProductId(Long processId, Long productId);
}
