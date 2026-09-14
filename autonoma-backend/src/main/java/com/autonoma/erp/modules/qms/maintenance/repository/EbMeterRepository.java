package com.autonoma.erp.modules.qms.maintenance.repository;

import com.autonoma.erp.modules.qms.maintenance.entity.EbMeter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EbMeterRepository extends JpaRepository<EbMeter, Long> {
    List<EbMeter> findByStatus(String status);
    boolean existsByMeterNoIgnoreCase(String meterNo);
    boolean existsByMeterNoIgnoreCaseAndIdNot(String meterNo, Long id);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM EbMeter e WHERE e.status = 'ACTIVE' OR e.isActive = true")
    List<EbMeter> findAllActive();
}
