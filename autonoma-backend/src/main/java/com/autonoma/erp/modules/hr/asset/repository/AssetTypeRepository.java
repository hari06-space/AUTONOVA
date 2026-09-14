package com.autonoma.erp.modules.hr.asset.repository;

import com.autonoma.erp.modules.hr.asset.entity.AssetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetTypeRepository extends JpaRepository<AssetType, Long> {

    @Query("SELECT t FROM AssetType t LEFT JOIN FETCH t.assetGroup ORDER BY t.id")
    List<AssetType> findAllWithGroup();

    @Query("SELECT t FROM AssetType t LEFT JOIN FETCH t.assetGroup WHERE t.status = true ORDER BY t.id")
    List<AssetType> findActiveWithGroup();

    @Query("SELECT t FROM AssetType t LEFT JOIN FETCH t.assetGroup WHERE t.groupId = :groupId ORDER BY t.id")
    List<AssetType> findByGroupIdWithGroup(@Param("groupId") Long groupId);

    // Legacy derived queries (still used by internal service methods)
    List<AssetType> findByGroupId(Long groupId);
    List<AssetType> findByStatus(Boolean status);
    java.util.Optional<AssetType> findByTypeIgnoreCase(String type);
}
