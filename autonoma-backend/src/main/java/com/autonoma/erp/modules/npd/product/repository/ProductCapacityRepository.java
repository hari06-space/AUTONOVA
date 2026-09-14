package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.ProductCapacity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.autonoma.erp.modules.npd.product.entity.ProductCapacityId;

@Repository
public interface ProductCapacityRepository extends JpaRepository<ProductCapacity, ProductCapacityId> {


}
