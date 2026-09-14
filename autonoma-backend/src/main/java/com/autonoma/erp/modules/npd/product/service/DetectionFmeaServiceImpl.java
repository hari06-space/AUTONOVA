package com.autonoma.erp.modules.npd.product.service;

import com.autonoma.erp.modules.npd.product.dto.DetectionFmeaDto;
import com.autonoma.erp.modules.npd.product.entity.DetectionFmea;
import com.autonoma.erp.modules.npd.product.repository.DetectionFmeaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DetectionFmeaServiceImpl implements DetectionFmeaService {

    private final DetectionFmeaRepository repository;

    public DetectionFmeaServiceImpl(DetectionFmeaRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DetectionFmeaDto> getAll() {
        return repository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DetectionFmeaDto getById(Long id) {
        return repository.findById(id)
                .map(this::toDto)
                .orElse(null);
    }

    @Override
    @Transactional
    public DetectionFmeaDto create(DetectionFmeaDto dto) {
        if (repository.existsByDetectionIgnoreCase(dto.getDetection().trim())) {
            throw new IllegalArgumentException("Detection '" + dto.getDetection() + "' already exists.");
        }
        DetectionFmea entity = new DetectionFmea();
        entity.setDetection(dto.getDetection().trim());
        entity.setCriteria(dto.getCriteria().trim());
        entity.setDetectionMethod(dto.getDetectionMethod().trim());
        entity.setAAvail(dto.getAAvail() != null ? dto.getAAvail() : false);
        entity.setBAvail(dto.getBAvail() != null ? dto.getBAvail() : false);
        entity.setCAvail(dto.getCAvail() != null ? dto.getCAvail() : false);
        entity.setRank(dto.getRank());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);

        DetectionFmea saved = repository.save(entity);
        return toDto(saved);
    }

    @Override
    @Transactional
    public DetectionFmeaDto update(Long id, DetectionFmeaDto dto) {
        DetectionFmea existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Record not found with id: " + id));

        if (repository.existsByDetectionIgnoreCaseAndIdNot(dto.getDetection().trim(), id)) {
            throw new IllegalArgumentException("Detection '" + dto.getDetection() + "' already exists.");
        }

        existing.setDetection(dto.getDetection().trim());
        existing.setCriteria(dto.getCriteria().trim());
        existing.setDetectionMethod(dto.getDetectionMethod().trim());
        
        // BUG-002 Fix: Only update boolean values if explicitly provided in request body (non-null in DTO)
        if (dto.getAAvail() != null) {
            existing.setAAvail(dto.getAAvail());
        }
        if (dto.getBAvail() != null) {
            existing.setBAvail(dto.getBAvail());
        }
        if (dto.getCAvail() != null) {
            existing.setCAvail(dto.getCAvail());
        }

        existing.setRank(dto.getRank());
        existing.setStatus(dto.getStatus() != null ? dto.getStatus() : true);

        DetectionFmea saved = repository.save(existing);
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

    private DetectionFmeaDto toDto(DetectionFmea entity) {
        if (entity == null) return null;
        DetectionFmeaDto dto = new DetectionFmeaDto();
        dto.setId(entity.getId());
        dto.setDetection(entity.getDetection());
        dto.setCriteria(entity.getCriteria());
        dto.setDetectionMethod(entity.getDetectionMethod());
        dto.setAAvail(entity.getAAvail());
        dto.setBAvail(entity.getBAvail());
        dto.setCAvail(entity.getCAvail());
        dto.setRank(entity.getRank());
        dto.setStatus(entity.getStatus());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedAt(entity.getCreatedDate());
        dto.setUpdatedBy(entity.getUpdatedBy());
        dto.setUpdatedAt(entity.getUpdatedDate());
        return dto;
    }
}
