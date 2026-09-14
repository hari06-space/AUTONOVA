package com.autonoma.erp.modules.qmt.service;

import com.autonoma.erp.modules.qmt.entity.Machine;
import com.autonoma.erp.modules.qmt.entity.MachineCriterialSpare;
import com.autonoma.erp.modules.qmt.repository.MachineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class MachineService {

    @Autowired
    private MachineRepository repository;

    public List<Machine> getAllMachines() {
        return repository.findAll();
    }

    public List<com.autonoma.erp.modules.qmt.dto.MachineListDTO> getAllMachinesProjected() {
        return repository.findAllProjected();
    }

    public Optional<Machine> getMachineById(Long id) {
        if (id == null) return Optional.empty();
        return repository.findById(id);
    }

    public Optional<Machine> getMachineByAssetId(String assetId) {
        if (assetId == null || assetId.trim().isEmpty()) return Optional.empty();
        return repository.findByAssetIdIgnoreCase(assetId.trim());
    }

    @Transactional
    public Machine createMachine(Machine machine) {
        validateMachine(machine, null);
        
        if (machine.getCriterialSpares() != null) {
            for (MachineCriterialSpare spare : machine.getCriterialSpares()) {
                spare.setMachine(machine);
            }
        }
        return repository.save(machine);
    }

    @Transactional
    public Machine updateMachine(Long id, Machine updatedMachine) {
        Machine existingMachine = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Machine not found with ID " + id));

        validateMachine(updatedMachine, id);

        existingMachine.setAssetGroupId(updatedMachine.getAssetGroupId());
        existingMachine.setAssetTypeId(updatedMachine.getAssetTypeId());
        existingMachine.setAssetId(updatedMachine.getAssetId());
        existingMachine.setAssetName(updatedMachine.getAssetName());
        existingMachine.setDescription(updatedMachine.getDescription());
        existingMachine.setPrintName(updatedMachine.getPrintName());
        existingMachine.setDivision(updatedMachine.getDivision());
        existingMachine.setUom(updatedMachine.getUom());
        existingMachine.setSeqNo(updatedMachine.getSeqNo());
        existingMachine.setPurchaseRate(updatedMachine.getPurchaseRate());
        existingMachine.setPrice(updatedMachine.getPrice());
        existingMachine.setSupplierId(updatedMachine.getSupplierId());
        existingMachine.setSupplyDate(updatedMachine.getSupplyDate());
        existingMachine.setPurchaseYear(updatedMachine.getPurchaseYear());
        existingMachine.setWarrantyAvail(updatedMachine.getWarrantyAvail());
        existingMachine.setWarrantyExpiryDate(updatedMachine.getWarrantyExpiryDate());
        existingMachine.setOwnerType(updatedMachine.getOwnerType());
        existingMachine.setOwnerId(updatedMachine.getOwnerId());
        existingMachine.setAssetSpec(updatedMachine.getAssetSpec());
        existingMachine.setModelNo(updatedMachine.getModelNo());
        existingMachine.setSerialNo(updatedMachine.getSerialNo());
        existingMachine.setCapacity(updatedMachine.getCapacity());
        existingMachine.setDimension(updatedMachine.getDimension());
        existingMachine.setPower(updatedMachine.getPower());
        existingMachine.setHsnCode(updatedMachine.getHsnCode());
        existingMachine.setSacCode(updatedMachine.getSacCode());
        existingMachine.setIpAddress(updatedMachine.getIpAddress());
        existingMachine.setPortNo(updatedMachine.getPortNo());
        existingMachine.setCalibrFrequency(updatedMachine.getCalibrFrequency());
        existingMachine.setLastCalibrDate(updatedMachine.getLastCalibrDate());
        existingMachine.setNextCalibrDate(updatedMachine.getNextCalibrDate());
        existingMachine.setAmcFrequency(updatedMachine.getAmcFrequency());
        existingMachine.setLastAmcDate(updatedMachine.getLastAmcDate());
        existingMachine.setNextAmcDate(updatedMachine.getNextAmcDate());
        existingMachine.setDepreciationPercentage(updatedMachine.getDepreciationPercentage());
        existingMachine.setDepreciationMethod(updatedMachine.getDepreciationMethod());
        existingMachine.setAssetLife(updatedMachine.getAssetLife());
        existingMachine.setOeeReq(updatedMachine.getOeeReq());
        existingMachine.setMake(updatedMachine.getMake());
        existingMachine.setRemarks(updatedMachine.getRemarks());
        existingMachine.setStatus(updatedMachine.getStatus());
        existingMachine.setUpdatedBy(updatedMachine.getUpdatedBy());

        // Update criterial spares
        existingMachine.getCriterialSpares().clear();
        if (updatedMachine.getCriterialSpares() != null) {
            for (MachineCriterialSpare spare : updatedMachine.getCriterialSpares()) {
                spare.setMachine(existingMachine);
                existingMachine.getCriterialSpares().add(spare);
            }
        }

        return repository.save(existingMachine);
    }

    @Transactional
    public void deleteMachine(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Machine not found with ID " + id);
        }
        repository.deleteById(id);
    }
    
    private void validateMachine(Machine machine, Long currentId) {
        if (machine.getAssetId() == null || machine.getAssetId().trim().isEmpty()) {
            throw new IllegalArgumentException("Asset ID is mandatory.");
        }
        machine.setAssetId(machine.getAssetId().trim().toUpperCase());

        if (currentId == null) {
            if (repository.existsByAssetIdIgnoreCase(machine.getAssetId())) {
                throw new IllegalArgumentException("Asset with ID " + machine.getAssetId() + " already exists.");
            }
        } else {
            if (repository.existsByAssetIdIgnoreCaseAndIdNot(machine.getAssetId(), currentId)) {
                throw new IllegalArgumentException("Asset with ID " + machine.getAssetId() + " already exists.");
            }
        }

        if (machine.getAssetName() == null || machine.getAssetName().trim().isEmpty()) {
            throw new IllegalArgumentException("Asset Name is mandatory.");
        }
        machine.setAssetName(machine.getAssetName().trim());

        if (currentId == null) {
            if (repository.existsByAssetNameIgnoreCase(machine.getAssetName())) {
                throw new IllegalArgumentException("Asset with name " + machine.getAssetName() + " already exists.");
            }
        } else {
            if (repository.existsByAssetNameIgnoreCaseAndIdNot(machine.getAssetName(), currentId)) {
                throw new IllegalArgumentException("Asset with name " + machine.getAssetName() + " already exists.");
            }
        }
    }
}
