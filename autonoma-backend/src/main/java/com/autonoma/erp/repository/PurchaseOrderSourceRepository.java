package com.autonoma.erp.repository;

import com.autonoma.erp.model.PurchaseOrderSource;
import com.autonoma.erp.enums.PoSourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseOrderSourceRepository extends JpaRepository<PurchaseOrderSource, Long> {

    List<PurchaseOrderSource> findByPurchaseOrderHeadId(Long poHeadId);

    @Query("SELECT COALESCE(SUM(s.convertedQty), 0) FROM PurchaseOrderSource s WHERE s.sourceType = :sourceType AND s.sourceHeadId = :sourceHeadId AND s.sourceTransId = :sourceTransId AND s.activeStatus = 1")
    java.math.BigDecimal sumConvertedQtyBySourceTransId(
        @Param("sourceType") PoSourceType sourceType,
        @Param("sourceHeadId") Long sourceHeadId,
        @Param("sourceTransId") Long sourceTransId
    );

    @Query("SELECT s FROM PurchaseOrderSource s WHERE s.sourceType = :sourceType AND s.sourceHeadId = :sourceHeadId AND s.activeStatus = 1")
    List<PurchaseOrderSource> findBySourceTypeAndSourceHeadId(
        @Param("sourceType") PoSourceType sourceType,
        @Param("sourceHeadId") Long sourceHeadId
    );
}
