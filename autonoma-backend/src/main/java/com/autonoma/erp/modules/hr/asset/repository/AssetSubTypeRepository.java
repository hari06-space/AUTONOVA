package com.autonoma.erp.modules.hr.asset.repository;

import com.autonoma.erp.modules.hr.asset.entity.AssetSubType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetSubTypeRepository extends JpaRepository<AssetSubType, Long> {

    @Query("SELECT s FROM AssetSubType s LEFT JOIN FETCH s.assetGroup LEFT JOIN FETCH s.assetType ORDER BY s.id")
    List<AssetSubType> findAllWithRelations();

    @Query("SELECT s FROM AssetSubType s LEFT JOIN FETCH s.assetGroup LEFT JOIN FETCH s.assetType WHERE s.status = true ORDER BY s.id")
    List<AssetSubType> findActiveWithRelations();

    // Legacy derived queries
    List<AssetSubType> findByGroupId(Long groupId);
    List<AssetSubType> findByTypeId(Long typeId);
    List<AssetSubType> findByStatus(Boolean status);
}
