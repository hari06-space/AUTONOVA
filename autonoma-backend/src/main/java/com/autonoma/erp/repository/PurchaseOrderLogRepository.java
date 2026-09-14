package com.autonoma.erp.repository;

import com.autonoma.erp.model.PurchaseOrderLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseOrderLogRepository extends JpaRepository<PurchaseOrderLog, Long> {

    List<PurchaseOrderLog> findByPoHeadIdOrderByEventDateDesc(Long poHeadId);
}
