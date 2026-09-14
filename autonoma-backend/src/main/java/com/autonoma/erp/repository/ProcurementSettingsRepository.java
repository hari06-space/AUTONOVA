package com.autonoma.erp.repository;

import com.autonoma.erp.model.ProcurementSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProcurementSettingsRepository extends JpaRepository<ProcurementSettings, Long> {
    Optional<ProcurementSettings> findByDivisionId(Long divisionId);
}
