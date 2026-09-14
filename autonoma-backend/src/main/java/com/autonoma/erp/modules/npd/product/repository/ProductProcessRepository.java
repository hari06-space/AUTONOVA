package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.ProductProcess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductProcessRepository extends JpaRepository<ProductProcess, Long> {

    List<ProductProcess> findByStatus(Boolean status);

    boolean existsByProcessNameIgnoreCase(String processName);

    boolean existsByProcessNameIgnoreCaseAndIdNot(String processName, Long id);

    java.util.Optional<ProductProcess> findByProcessNameIgnoreCase(String processName);
}
