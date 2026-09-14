package com.autonoma.erp.modules.npd.itemtaxonomy.repository;

import com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductItemTypeRepository extends JpaRepository<ProductItemType, String> {
    List<ProductItemType> findByGroupGroupName(String groupName);
    Optional<ProductItemType> findByGroupGroupNameAndItemType(String groupName, String itemType);
}
