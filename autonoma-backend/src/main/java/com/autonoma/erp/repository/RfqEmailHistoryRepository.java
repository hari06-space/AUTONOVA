package com.autonoma.erp.repository;

import com.autonoma.erp.model.RfqEmailHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RfqEmailHistoryRepository extends JpaRepository<RfqEmailHistory, Long> {
    List<RfqEmailHistory> findByRfqHeadIdOrderBySentDateDesc(Long rfqId);
    List<RfqEmailHistory> findByRfqHeadIdOrderByIdDesc(Long rfqId);
    Optional<RfqEmailHistory> findFirstByRfqHeadIdOrderBySentDateDesc(Long rfqId);

    @Query("SELECT COALESCE(MAX(h.attempt), 0) FROM RfqEmailHistory h WHERE h.rfqHead.id = :rfqId AND (:recipientEmail IS NOT NULL AND h.recipientEmail = :recipientEmail OR (:supplierId IS NOT NULL AND h.supplier.id = :supplierId))")
    Integer findMaxAttempt(@Param("rfqId") Long rfqId, 
                           @Param("supplierId") Long supplierId, 
                           @Param("recipientEmail") String recipientEmail);
}

