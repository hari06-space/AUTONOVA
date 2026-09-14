package com.autonoma.erp.repository.purchase.purchasereturn;

import com.autonoma.erp.model.purchase.purchasereturn.PurchaseReturnHead;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface PurchaseReturnHeadRepository extends JpaRepository<PurchaseReturnHead, Long> {

    @Query("SELECT COUNT(h) > 0 FROM PurchaseReturnHead h WHERE h.division.id = :divisionId AND h.returnNo = :returnNo AND h.id <> :excludeId")
    boolean existsByDivisionIdAndReturnNoAndIdNot(@Param("divisionId") Long divisionId, @Param("returnNo") String returnNo, @Param("excludeId") Long excludeId);

    @Query("SELECT COUNT(h) > 0 FROM PurchaseReturnHead h WHERE h.division.id = :divisionId AND h.returnNo = :returnNo")
    boolean existsByDivisionIdAndReturnNo(@Param("divisionId") Long divisionId, @Param("returnNo") String returnNo);
}
