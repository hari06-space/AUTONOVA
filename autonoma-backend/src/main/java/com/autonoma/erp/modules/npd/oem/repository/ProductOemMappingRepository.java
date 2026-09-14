package com.autonoma.erp.modules.npd.oem.repository;

import com.autonoma.erp.modules.npd.oem.entity.ProductOemMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductOemMappingRepository extends JpaRepository<ProductOemMapping, Long> {
    List<ProductOemMapping> findByStatus(Boolean status);

    boolean existsByPartNoIgnoreCase(String partNo);

    boolean existsByPartNoIgnoreCaseAndIdNot(String partNo, Long id);
}
