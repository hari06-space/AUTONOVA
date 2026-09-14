package com.autonoma.erp.repository;

import com.autonoma.erp.model.SupplierPerformance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SupplierPerformanceRepository extends JpaRepository<SupplierPerformance, Long> {
    Optional<SupplierPerformance> findBySupplierId(Long supplierId);
    boolean existsBySupplierId(Long supplierId);
}
