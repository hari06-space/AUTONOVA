package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.ProductWindFarm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductWindFarmRepository extends JpaRepository<ProductWindFarm, Long> {

    boolean existsByWindFarmNameIgnoreCase(String windFarmName);

    boolean existsByWindFarmNameIgnoreCaseAndIdNot(String windFarmName, Long id);
}
