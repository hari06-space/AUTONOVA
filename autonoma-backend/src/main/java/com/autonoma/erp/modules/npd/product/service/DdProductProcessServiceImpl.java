package com.autonoma.erp.modules.npd.product.service;

import com.autonoma.erp.modules.npd.product.dto.DdProductProcessDto;
import com.autonoma.erp.modules.npd.product.dto.DdProductProcessMachineDto;
import com.autonoma.erp.modules.npd.product.dto.DdProductProcessToolDto;
import com.autonoma.erp.modules.npd.product.entity.DdProductProcess;
import com.autonoma.erp.modules.npd.product.entity.DdProductProcessMachine;
import com.autonoma.erp.modules.npd.product.entity.DdProductProcessTool;
import com.autonoma.erp.modules.npd.product.repository.DdProductProcessRepository;
import com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DdProductProcessServiceImpl implements DdProductProcessService {

    private final DdProductProcessRepository repository;
    private final ProductMasterRepository productMasterRepository;

    public DdProductProcessServiceImpl(DdProductProcessRepository repository, ProductMasterRepository productMasterRepository) {
        this.repository = repository;
        this.productMasterRepository = productMasterRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DdProductProcessDto> getAllProcesses() {
        return repository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DdProductProcessDto getProcessById(Long id) {
        return repository.findById(id)
                .map(this::toDto)
                .orElse(null);
    }

    @Override
    @Transactional
    public DdProductProcessDto createProcess(DdProductProcessDto dto) {
        DdProductProcess entity = new DdProductProcess();
        updateEntityFromDto(entity, dto);

        // Save parent and children
        DdProductProcess saved = repository.save(entity);
        return toDto(saved);
    }

    @Override
    @Transactional
    public DdProductProcessDto updateProcess(Long id, DdProductProcessDto dto) {
        DdProductProcess existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Process not found with id: " + id));

        // Validation for uniqueness
        String processCodeClean = dto.getProcessCode().trim();
        String processNameClean = dto.getProcessName().trim();
        if (repository.existsByProcessCodeIgnoreCaseAndIdNot(processCodeClean, id)) {
            throw new IllegalArgumentException("Process Code '" + processCodeClean + "' already exists.");
        }
        if (repository.existsByProcessNameIgnoreCaseAndIdNot(processNameClean, id)) {
            throw new IllegalArgumentException("Process Name '" + processNameClean + "' already exists.");
        }

        updateEntityFromDto(existing, dto);

        DdProductProcess saved = repository.save(existing);
        return toDto(saved);
    }

    @Override
    @Transactional
    public void deleteProcess(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Process not found with id: " + id);
        }
        repository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DdProductProcessDto> getProcessesByProductId(Long productId) {
        return repository.findByProductId(productId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void bulkSaveProcesses(com.autonoma.erp.modules.npd.product.dto.BulkProductProcessDto dto) {
        Long productId = dto.getProductId();
        if (productId == null) {
            throw new IllegalArgumentException("Product ID is required for bulk save.");
        }

        // Delete all existing for this product ID
        repository.deleteByProductId(productId);
        repository.flush();

        // Save new ones
        if (dto.getProcesses() != null) {
            for (DdProductProcessDto processDto : dto.getProcesses()) {
                processDto.setProductId(productId);
                DdProductProcess entity = new DdProductProcess();
                updateEntityFromDto(entity, processDto);
                repository.save(entity);
            }
        }
    }

    private void updateEntityFromDto(DdProductProcess entity, DdProductProcessDto dto) {
        if (dto.getProductId() == null) {
            throw new IllegalArgumentException("Part No (Product ID) is required.");
        }
        entity.setProductId(dto.getProductId());
        entity.setProcessCode(dto.getProcessCode().trim());
        entity.setProcessName(dto.getProcessName().trim());
        entity.setFlowImage(dto.getFlowImage());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);
        entity.setProcessWhere(dto.getProcessWhere() != null ? dto.getProcessWhere().trim() : null);
        entity.setOutputQty(dto.getOutputQty());
        entity.setOutputUom(dto.getOutputUom() != null ? dto.getOutputUom().trim() : null);
        entity.setAutoGrn(dto.getAutoGrn() != null ? dto.getAutoGrn() : false);
        entity.setAutoInspection(dto.getAutoInspection() != null ? dto.getAutoInspection() : false);
        entity.setProcessOutputWeight(dto.getProcessOutputWeight());
        entity.setDivision(dto.getDivision());

        // Differential Update for Machines (to avoid destructive cascade delete)
        List<DdProductProcessMachineDto> incomingMachines = dto.getMachines() != null ? dto.getMachines() : new ArrayList<>();
        Map<Long, DdProductProcessMachine> existingMachinesMap = entity.getMachines().stream()
                .filter(m -> m.getId() != null)
                .collect(Collectors.toMap(DdProductProcessMachine::getId, m -> m));

        Set<Long> incomingMachineIds = incomingMachines.stream()
                .map(DdProductProcessMachineDto::getId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        // 1. Remove orphaned machines
        List<DdProductProcessMachine> toRemoveMachines = entity.getMachines().stream()
                .filter(m -> m.getId() != null && !incomingMachineIds.contains(m.getId()))
                .collect(Collectors.toList());
        for (DdProductProcessMachine machine : toRemoveMachines) {
            entity.removeMachine(machine);
        }

        // 2. Add or update machines
        for (DdProductProcessMachineDto machineDto : incomingMachines) {
            if (machineDto.getId() != null && existingMachinesMap.containsKey(machineDto.getId())) {
                // In-place update of existing machine Category
                DdProductProcessMachine existingMachine = existingMachinesMap.get(machineDto.getId());
                existingMachine.setMachineCategoryId(machineDto.getMachineCategoryId());
            } else {
                // Create new machine mapping
                DdProductProcessMachine newMachine = new DdProductProcessMachine();
                newMachine.setMachineCategoryId(machineDto.getMachineCategoryId());
                entity.addMachine(newMachine);
            }
        }

        // Differential Update for Tools (to avoid destructive cascade delete)
        List<DdProductProcessToolDto> incomingTools = dto.getTools() != null ? dto.getTools() : new ArrayList<>();
        Map<Long, DdProductProcessTool> existingToolsMap = entity.getTools().stream()
                .filter(t -> t.getId() != null)
                .collect(Collectors.toMap(DdProductProcessTool::getId, t -> t));

        Set<Long> incomingToolIds = incomingTools.stream()
                .map(DdProductProcessToolDto::getId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        // 1. Remove orphaned tools
        List<DdProductProcessTool> toRemoveTools = entity.getTools().stream()
                .filter(t -> t.getId() != null && !incomingToolIds.contains(t.getId()))
                .collect(Collectors.toList());
        for (DdProductProcessTool tool : toRemoveTools) {
            entity.removeTool(tool);
        }

        // 2. Add or update tools
        for (DdProductProcessToolDto toolDto : incomingTools) {
            if (toolDto.getId() != null && existingToolsMap.containsKey(toolDto.getId())) {
                // In-place update of existing tool
                DdProductProcessTool existingTool = existingToolsMap.get(toolDto.getId());
                existingTool.setToolName(toolDto.getToolName().trim());
            } else {
                // Create new tool mapping
                DdProductProcessTool newTool = new DdProductProcessTool();
                newTool.setToolName(toolDto.getToolName().trim());
                entity.addTool(newTool);
            }
        }
    }

    private DdProductProcessDto toDto(DdProductProcess entity) {
        if (entity == null) return null;
        DdProductProcessDto dto = new DdProductProcessDto();
        dto.setId(entity.getId());
        dto.setProductId(entity.getProductId());
        
        if (entity.getProductId() != null) {
            productMasterRepository.findById(entity.getProductId())
                .ifPresent(p -> {
                    dto.setPartNo(p.getItemNo());
                    dto.setPartName(p.getItemName());
                    dto.setCategory(p.getItemCategory());
                    dto.setDrawingNo(p.getDrawingNo());
                });
        }

        dto.setProcessCode(entity.getProcessCode());
        dto.setProcessName(entity.getProcessName());
        dto.setFlowImage(entity.getFlowImage());
        dto.setStatus(entity.getStatus());
        dto.setProcessWhere(entity.getProcessWhere());
        dto.setOutputQty(entity.getOutputQty());
        dto.setOutputUom(entity.getOutputUom());
        dto.setAutoGrn(entity.getAutoGrn());
        dto.setAutoInspection(entity.getAutoInspection());
        dto.setProcessOutputWeight(entity.getProcessOutputWeight());
        dto.setDivision(entity.getDivision());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedAt(entity.getCreatedDate());
        dto.setUpdatedBy(entity.getUpdatedBy());
        dto.setUpdatedAt(entity.getUpdatedDate());

        dto.setMachines(entity.getMachines().stream()
                .map(this::toMachineDto)
                .collect(Collectors.toList()));

        dto.setTools(entity.getTools().stream()
                .map(this::toToolDto)
                .collect(Collectors.toList()));

        return dto;
    }

    private DdProductProcessMachineDto toMachineDto(DdProductProcessMachine machine) {
        DdProductProcessMachineDto dto = new DdProductProcessMachineDto();
        dto.setId(machine.getId());
        dto.setProcessId(machine.getProcessId());
        dto.setMachineCategoryId(machine.getMachineCategoryId());
        dto.setCreatedBy(machine.getCreatedBy());
        dto.setCreatedAt(machine.getCreatedDate());
        dto.setUpdatedBy(machine.getUpdatedBy());
        dto.setUpdatedAt(machine.getUpdatedDate());
        return dto;
    }

    private DdProductProcessToolDto toToolDto(DdProductProcessTool tool) {
        DdProductProcessToolDto dto = new DdProductProcessToolDto();
        dto.setId(tool.getId());
        dto.setProcessId(tool.getProcessId());
        dto.setToolName(tool.getToolName());
        dto.setCreatedBy(tool.getCreatedBy());
        dto.setCreatedAt(tool.getCreatedDate());
        dto.setUpdatedBy(tool.getUpdatedBy());
        dto.setUpdatedAt(tool.getUpdatedDate());
        return dto;
    }
}
