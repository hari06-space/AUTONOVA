package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.ProductBundleMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductBundleMasterRepository extends JpaRepository<ProductBundleMaster, Long>, JpaSpecificationExecutor<ProductBundleMaster> {
    
    List<ProductBundleMaster> findByIsActiveTrue();
    
    boolean existsByBundleCode(String bundleCode);
}
