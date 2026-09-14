package com.autonoma.erp.modules.npd.product.service;

import com.autonoma.erp.modules.npd.product.dto.SeverityFmeaDto;
import com.autonoma.erp.modules.npd.product.entity.SeverityFmea;
import com.autonoma.erp.modules.npd.product.repository.SeverityFmeaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SeverityFmeaServiceImpl implements SeverityFmeaService {

    private final SeverityFmeaRepository repository;

    public SeverityFmeaServiceImpl(SeverityFmeaRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SeverityFmeaDto> getAll() {
        return repository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SeverityFmeaDto getById(Long id) {
        return repository.findById(id)
                .map(this::toDto)
                .orElse(null);
    }

    @Override
    @Transactional
    public SeverityFmeaDto create(SeverityFmeaDto dto) {
        if (repository.existsBySeverityEffectIgnoreCase(dto.getSeverityEffect().trim())) {
            throw new IllegalArgumentException("Severity Effect '" + dto.getSeverityEffect() + "' already exists.");
        }
        SeverityFmea entity = new SeverityFmea();
        entity.setSeverityEffect(dto.getSeverityEffect().trim());
        entity.setCustomerEffect(dto.getCustomerEffect().trim());
        entity.setManufacturingEffect(dto.getManufacturingEffect().trim());
        entity.setRank(dto.getRank());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);

        SeverityFmea saved = repository.save(entity);
        return toDto(saved);
    }

    @Override
    @Transactional
    public SeverityFmeaDto update(Long id, SeverityFmeaDto dto) {
        SeverityFmea existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Record not found with id: " + id));

        if (repository.existsBySeverityEffectIgnoreCaseAndIdNot(dto.getSeverityEffect().trim(), id)) {
            throw new IllegalArgumentException("Severity Effect '" + dto.getSeverityEffect() + "' already exists.");
        }

        existing.setSeverityEffect(dto.getSeverityEffect().trim());
        existing.setCustomerEffect(dto.getCustomerEffect().trim());
        existing.setManufacturingEffect(dto.getManufacturingEffect().trim());
        existing.setRank(dto.getRank());
        existing.setStatus(dto.getStatus() != null ? dto.getStatus() : true);

        SeverityFmea saved = repository.save(existing);
        return toDto(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Record not found with id: " + id);
        }
        repository.deleteById(id);
    }

    private SeverityFmeaDto toDto(SeverityFmea entity) {
        if (entity == null) return null;
        SeverityFmeaDto dto = new SeverityFmeaDto();
        dto.setId(entity.getId());
        dto.setSeverityEffect(entity.getSeverityEffect());
        dto.setCustomerEffect(entity.getCustomerEffect());
        dto.setManufacturingEffect(entity.getManufacturingEffect());
        dto.setRank(entity.getRank());
        dto.setStatus(entity.getStatus());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedAt(entity.getCreatedDate());
        dto.setUpdatedBy(entity.getUpdatedBy());
        dto.setUpdatedAt(entity.getUpdatedDate());
        return dto;
    }
}
