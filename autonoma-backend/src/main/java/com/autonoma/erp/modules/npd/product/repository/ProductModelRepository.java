package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.ProductModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductModelRepository extends JpaRepository<ProductModel, String> {
    List<ProductModel> findByStatus(Boolean status);

    boolean existsByModelNoIgnoreCase(String modelNo);
}
