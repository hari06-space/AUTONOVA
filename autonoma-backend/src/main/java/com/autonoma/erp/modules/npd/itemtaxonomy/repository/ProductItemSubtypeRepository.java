package com.autonoma.erp.modules.npd.itemtaxonomy.repository;

import com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemSubtype;
import com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductItemSubtypeRepository extends JpaRepository<ProductItemSubtype, String> {

    List<ProductItemSubtype> findByStatus(Integer status);

    boolean existsByTypeAndSubTypeIgnoreCase(ProductItemType type, String subType);

    boolean existsByTypeAndSubTypeIgnoreCaseAndSubTypeNot(ProductItemType type, String subType, String id);
}
