package com.autonoma.erp.modules.npd.inventory.service;

import com.autonoma.erp.modules.npd.inventory.entity.NpdInventoryType;
import com.autonoma.erp.modules.npd.inventory.repository.NpdInventoryTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class NpdInventoryTypeService {

    @Autowired
    private NpdInventoryTypeRepository repository;

    public List<NpdInventoryType> getAll() {
        return repository.findAll();
    }

    public Optional<NpdInventoryType> getByCode(String code) {
        return repository.findById(code);
    }

    public NpdInventoryType create(NpdInventoryType inventoryType) {
        if (repository.existsById(inventoryType.getCode())) {
            throw new IllegalArgumentException("Inventory Type Code already exists");
        }
        return repository.save(inventoryType);
    }

    public NpdInventoryType update(String code, NpdInventoryType inventoryType) {
        return repository.findById(code)
                .map(existing -> {
                    existing.setTypeName(inventoryType.getTypeName());
                    existing.setDescription(inventoryType.getDescription());
                    existing.setStatus(inventoryType.getStatus() != null ? inventoryType.getStatus() : existing.getStatus());
                    return repository.save(existing);
                })
                .orElseThrow(() -> new IllegalArgumentException("Inventory Type not found with Code " + code));
    }

    public void delete(String code) {
        if (!repository.existsById(code)) {
            throw new IllegalArgumentException("Inventory Type not found with Code " + code);
        }
        repository.deleteById(code);
    }
}
