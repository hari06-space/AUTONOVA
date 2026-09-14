package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.ProductIpp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

@Repository
public interface ProductIppRepository extends JpaRepository<ProductIpp, Long> {
    @Query("SELECT p FROM ProductIpp p WHERE p.customerId = :customerId AND " +
           "((:partNo IS NULL AND p.partNo IS NULL) OR p.partNo = :partNo)")
    Optional<ProductIpp> findByCustomerIdAndPartNo(@Param("customerId") Long customerId, @Param("partNo") String partNo);
}
