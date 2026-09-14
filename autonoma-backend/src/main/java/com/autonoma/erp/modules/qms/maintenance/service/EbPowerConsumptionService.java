package com.autonoma.erp.modules.qms.maintenance.service;

import com.autonoma.erp.modules.qms.maintenance.entity.EbPowerConsumption;
import com.autonoma.erp.modules.qms.maintenance.repository.EbPowerConsumptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EbPowerConsumptionService {

    private final EbPowerConsumptionRepository repository;

    public EbPowerConsumptionService(EbPowerConsumptionRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public EbPowerConsumption createConsumption(EbPowerConsumption consumption) {
        // Find all active consumptions and deactivate them
        List<EbPowerConsumption> activeConsumptions = repository.findAllActive();
        for (EbPowerConsumption active : activeConsumptions) {
            active.setStatus("INACTIVE");
            active.setIsActive(false);
            repository.save(active);
        }

        // Save the new record as Active
        consumption.setStatus("ACTIVE");
        consumption.setIsActive(true);

        return repository.save(consumption);
    }

    @Transactional
    public EbPowerConsumption updateConsumption(EbPowerConsumption consumption) {
        if ("ACTIVE".equalsIgnoreCase(consumption.getStatus())) {
            // Deactivate all OTHER active consumptions
            List<EbPowerConsumption> activeConsumptions = repository.findAllActive();
            for (EbPowerConsumption active : activeConsumptions) {
                if (!active.getId().equals(consumption.getId())) {
                    active.setStatus("INACTIVE");
                    active.setIsActive(false);
                    repository.save(active);
                }
            }
            consumption.setIsActive(true);
        } else {
            consumption.setIsActive(false);
        }
        return repository.save(consumption);
    }
}
