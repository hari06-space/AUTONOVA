package com.autonoma.erp.repository.purchase;

import com.autonoma.erp.model.PurchaseSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseScheduleRepository extends JpaRepository<PurchaseSchedule, Long> {
    List<PurchaseSchedule> findByPoId(Long poId);
}
