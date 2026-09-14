package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.ProductBundleDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductBundleDetailRepository extends JpaRepository<ProductBundleDetail, Long> {
    
    List<ProductBundleDetail> findByBundleMasterIdAndIsActiveTrue(Long bundleId);

    @Query("SELECT d.id FROM ProductBundleDetail d WHERE d.bundleMaster.id = :bundleId")
    List<Long> findIdsByBundleMasterId(@Param("bundleId") Long bundleId);
}

