package com.autonoma.erp.repository;

import com.autonoma.erp.model.VendorSatisfactionReminderLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorSatisfactionReminderLogRepository extends JpaRepository<VendorSatisfactionReminderLog, Long> {
    List<VendorSatisfactionReminderLog> findByMappingId(Long mappingId);
}
