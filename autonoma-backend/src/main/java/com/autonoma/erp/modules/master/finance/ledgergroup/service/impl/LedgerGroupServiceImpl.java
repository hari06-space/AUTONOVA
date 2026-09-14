package com.autonoma.erp.modules.master.finance.ledgergroup.service.impl;

import com.autonoma.erp.modules.master.finance.ledgergroup.dto.LedgerGroupDTO;
import com.autonoma.erp.modules.master.finance.ledgergroup.entity.LedgerGroup;
import com.autonoma.erp.modules.master.finance.ledgergroup.repository.LedgerGroupRepository;
import com.autonoma.erp.modules.master.finance.ledgergroup.service.LedgerGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LedgerGroupServiceImpl implements LedgerGroupService {

    @Autowired
    private LedgerGroupRepository repository;

    @Override
    public LedgerGroupDTO createLedgerGroup(LedgerGroupDTO dto) {
        final LedgerGroup entityToSave = mapToEntity(dto);
        if (entityToSave.getParentId() != null) {
            repository.findById(entityToSave.getParentId()).ifPresent(parent -> {
                entityToSave.setParentName(parent.getGroupName());
            });
        }
        LedgerGroup savedEntity = repository.save(entityToSave);
        return mapToDTO(savedEntity);
    }

    @Override
    public LedgerGroupDTO updateLedgerGroup(Long id, LedgerGroupDTO dto) {
        LedgerGroup entity = repository.findById(id).orElseThrow(() -> new RuntimeException("Ledger Group not found"));
        
        entity.setGroupName(dto.getGroupName());
        entity.setDescription(dto.getDescription());
        entity.setLevel(dto.getLevel());
        entity.setParentId(dto.getParentId());
        
        if (dto.getParentId() != null) {
            repository.findById(dto.getParentId()).ifPresent(parent -> {
                entity.setParentName(parent.getGroupName());
            });
        } else {
            entity.setParentName(null);
        }
        
        entity.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        
        LedgerGroup savedEntity = repository.save(entity);
        return mapToDTO(savedEntity);
    }

    @Override
    public LedgerGroupDTO getLedgerGroupById(Long id) {
        LedgerGroup entity = repository.findById(id).orElseThrow(() -> new RuntimeException("Ledger Group not found"));
        return mapToDTO(entity);
    }

    @Override
    public List<LedgerGroupDTO> getAllLedgerGroups() {
        return repository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public void deleteLedgerGroup(Long id) {
        repository.deleteById(id);
    }

    private LedgerGroup mapToEntity(LedgerGroupDTO dto) {
        LedgerGroup entity = new LedgerGroup();
        entity.setGroupName(dto.getGroupName());
        entity.setDescription(dto.getDescription());
        entity.setLevel(dto.getLevel());
        entity.setParentId(dto.getParentId());
        entity.setParentName(dto.getParentName());
        entity.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        return entity;
    }

    private LedgerGroupDTO mapToDTO(LedgerGroup entity) {
        LedgerGroupDTO dto = new LedgerGroupDTO();
        dto.setId(entity.getId());
        dto.setGroupName(entity.getGroupName());
        dto.setDescription(entity.getDescription());
        dto.setLevel(entity.getLevel());
        dto.setParentId(entity.getParentId());
        dto.setParentName(entity.getParentName());
        dto.setIsActive(entity.getIsActive());
        
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedDate(entity.getCreatedDate());
        dto.setUpdatedBy(entity.getUpdatedBy());
        dto.setUpdatedDate(entity.getUpdatedDate());
        
        return dto;
    }
}
