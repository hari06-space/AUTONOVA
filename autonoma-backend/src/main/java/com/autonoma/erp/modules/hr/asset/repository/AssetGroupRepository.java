package com.autonoma.erp.modules.hr.asset.repository;

import com.autonoma.erp.modules.hr.asset.entity.AssetGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetGroupRepository extends JpaRepository<AssetGroup, Long> {
    List<AssetGroup> findByStatus(Boolean status);
    java.util.Optional<AssetGroup> findByGroupNameIgnoreCase(String groupName);
}
