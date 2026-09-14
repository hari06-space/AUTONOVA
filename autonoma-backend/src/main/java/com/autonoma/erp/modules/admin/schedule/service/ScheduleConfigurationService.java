package com.autonoma.erp.modules.admin.schedule.service;

import com.autonoma.erp.modules.admin.schedule.entity.ScheduleConfiguration;
import com.autonoma.erp.modules.admin.schedule.repository.ScheduleConfigurationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ScheduleConfigurationService {

    @Autowired
    private ScheduleConfigurationRepository repository;

    public List<ScheduleConfiguration> getAllConfigs() {
        return repository.findAll();
    }

    public ScheduleConfiguration updateConfig(Long id, ScheduleConfiguration updateData) {
        Optional<ScheduleConfiguration> existingOpt = repository.findById(id);
        if (existingOpt.isPresent()) {
            ScheduleConfiguration existing = existingOpt.get();
            java.time.LocalDateTime timeToSet = updateData.getSchedularTime();
            if (timeToSet == null) {
                timeToSet = java.time.LocalDateTime.of(2024, 1, 1, 4, 0); // Default to 4:00 AM
            }
            existing.setSchedularTime(timeToSet);
            existing.setFrequency(updateData.getFrequency());
            existing.setStatus(updateData.getStatus());
            return repository.save(existing);
        }
        return null; // Or throw ResourceNotFoundException
    }
}
