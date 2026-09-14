package com.autonoma.erp.modules.npd.itemtaxonomy.repository;

import com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductItemGroupRepository extends JpaRepository<ProductItemGroup, String> {
    Optional<ProductItemGroup> findByGroupName(String groupName);
    List<ProductItemGroup> findByAqlId(Long aqlId);
}
