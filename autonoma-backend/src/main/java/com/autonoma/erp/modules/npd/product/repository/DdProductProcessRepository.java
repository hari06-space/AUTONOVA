package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.DdProductProcess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DdProductProcessRepository extends JpaRepository<DdProductProcess, Long> {

    List<DdProductProcess> findByStatus(Boolean status);

    boolean existsByProcessCodeIgnoreCase(String processCode);

    boolean existsByProcessCodeIgnoreCaseAndIdNot(String processCode, Long id);

    boolean existsByProcessNameIgnoreCase(String processName);

    boolean existsByProcessNameIgnoreCaseAndIdNot(String processName, Long id);

    List<DdProductProcess> findByProductId(Long productId);
    void deleteByProductId(Long productId);
}
