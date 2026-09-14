package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.SeverityFmea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeverityFmeaRepository extends JpaRepository<SeverityFmea, Long> {

    List<SeverityFmea> findByStatus(Boolean status);

    boolean existsBySeverityEffectIgnoreCase(String severityEffect);

    boolean existsBySeverityEffectIgnoreCaseAndIdNot(String severityEffect, Long id);

    Optional<SeverityFmea> findBySeverityEffectIgnoreCase(String severityEffect);
}
