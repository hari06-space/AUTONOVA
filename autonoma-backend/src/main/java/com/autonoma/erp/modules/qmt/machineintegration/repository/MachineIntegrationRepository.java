package com.autonoma.erp.modules.qmt.machineintegration.repository;

import com.autonoma.erp.modules.qmt.machineintegration.entity.MachineIntegration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MachineIntegrationRepository extends JpaRepository<MachineIntegration, Long> {
    Optional<MachineIntegration> findByMachineIdRef(Long machineIdRef);
    List<MachineIntegration> findByScheduleEnabledTrueAndActiveTrue();
    List<MachineIntegration> findByReadScheduleEnabledTrueAndActiveTrue();
}
