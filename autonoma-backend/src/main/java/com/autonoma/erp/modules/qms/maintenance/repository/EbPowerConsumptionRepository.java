package com.autonoma.erp.modules.qms.maintenance.repository;

import com.autonoma.erp.modules.qms.maintenance.entity.EbPowerConsumption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface EbPowerConsumptionRepository extends JpaRepository<EbPowerConsumption, Long> {
    List<EbPowerConsumption> findByStatus(String status);
    
    Optional<EbPowerConsumption> findFirstByMeterIdAndIsActiveTrueOrderByReadingDateDescIdDesc(Long meterId);
    
    Optional<EbPowerConsumption> findFirstByMeterIdOrderByReadingDateDescIdDesc(Long meterId);
    
    boolean existsByMeterIdAndReadingDateAndShiftAndIsActiveTrue(Long meterId, LocalDate readingDate, String shift);
    
    boolean existsByMeterIdAndReadingDateAndShiftAndIsActiveTrueAndIdNot(Long meterId, LocalDate readingDate, String shift, Long id);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM EbPowerConsumption e WHERE e.status = 'ACTIVE' OR e.isActive = true")
    List<EbPowerConsumption> findAllActive();
}
