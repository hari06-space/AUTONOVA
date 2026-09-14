package com.autonoma.erp.modules.hr.asset.repository;

import com.autonoma.erp.modules.hr.asset.entity.AssetMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AssetMasterRepository extends JpaRepository<AssetMaster, Long> {
    List<AssetMaster> findByAssetGroupAndIsActiveTrue(String assetGroup);
    List<AssetMaster> findByIsActiveTrue();
}
