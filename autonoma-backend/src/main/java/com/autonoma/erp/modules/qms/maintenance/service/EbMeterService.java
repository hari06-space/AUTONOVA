package com.autonoma.erp.modules.qms.maintenance.service;

import com.autonoma.erp.modules.qms.maintenance.entity.EbMeter;
import com.autonoma.erp.modules.qms.maintenance.repository.EbMeterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;

@Service
public class EbMeterService {

    private final EbMeterRepository repository;

    public EbMeterService(EbMeterRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public EbMeter createMeter(EbMeter meter) {
        if ("ACTIVE".equalsIgnoreCase(meter.getStatus())) {
            meter.setIsActive(true);
        } else {
            meter.setIsActive(false);
        }
        EbMeter saved = repository.save(meter);
        return repository.findById(saved.getId()).orElse(saved);
    }

    @Transactional
    public EbMeter updateMeter(EbMeter meter) {
        if ("ACTIVE".equalsIgnoreCase(meter.getStatus())) {
            meter.setIsActive(true);
        } else {
            meter.setIsActive(false);
        }
        EbMeter saved = repository.save(meter);
        return repository.findById(saved.getId()).orElse(saved);
    }

    @Transactional
    public void deleteMeter(Long id) {
        repository.deleteById(id);
    }

    @Transactional
    public void enforceSingleActiveMeter() {
        // No-op to allow multiple active meters
    }

    private void deactivateOtherMeters(Long currentId) {
        // No-op to allow multiple active meters
    }
}
