package com.autonoma.erp.modules.sm.sales.repository;

import com.autonoma.erp.modules.sm.sales.entity.SalesPriceMasterDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface SalesPriceMasterDetailRepository extends JpaRepository<SalesPriceMasterDetail, Long> {

    @Query("SELECT d FROM SalesPriceMasterDetail d JOIN d.priceMaster p " +
           "WHERE p.priceListType = 'CUSTOMER PRICE LIST' " +
           "AND p.customer.id = :customerId " +
           "AND d.product.id = :productId " +
           "AND d.status = 'ACTIVE' " +
           "AND (p.id != :currentPriceMasterId OR :currentPriceMasterId IS NULL)")
    List<SalesPriceMasterDetail> findActiveCustomerPriceDetails(@Param("customerId") Long customerId, 
                                                               @Param("productId") Long productId, 
                                                               @Param("currentPriceMasterId") Long currentPriceMasterId);

    @Query("SELECT d FROM SalesPriceMasterDetail d JOIN d.priceMaster p " +
           "WHERE p.priceListType = 'GENERAL PRICE LIST' " +
           "AND d.product.id = :productId " +
           "AND d.status = 'ACTIVE' " +
           "AND (p.id != :currentPriceMasterId OR :currentPriceMasterId IS NULL)")
    List<SalesPriceMasterDetail> findActiveGeneralPriceDetails(@Param("productId") Long productId, 
                                                              @Param("currentPriceMasterId") Long currentPriceMasterId);
}
