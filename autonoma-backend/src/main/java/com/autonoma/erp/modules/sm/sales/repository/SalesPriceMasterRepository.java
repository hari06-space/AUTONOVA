package com.autonoma.erp.modules.sm.sales.repository;

import com.autonoma.erp.modules.sm.sales.entity.SalesPriceMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SalesPriceMasterRepository extends JpaRepository<SalesPriceMaster, Long>, JpaSpecificationExecutor<SalesPriceMaster> {
    Optional<SalesPriceMaster> findByPriceListNo(String priceListNo);

    @Query(value = "SELECT TOP 1 CAST(SUBSTRING(PRICE_LIST_NO, 4, 10) AS INT) FROM SALES_PRICE_LIST_MASTER ORDER BY PRICE_LIST_NO DESC", nativeQuery = true)
    Integer findMaxPriceListNumber();

    @Query(value = "SELECT COUNT(*) FROM SALES_PRICE_LIST_MASTER WHERE PRICE_LIST_NO LIKE :pattern", nativeQuery = true)
    Long countByPriceListNoLike(@Param("pattern") String pattern);
}
