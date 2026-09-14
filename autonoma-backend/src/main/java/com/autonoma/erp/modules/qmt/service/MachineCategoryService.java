package com.autonoma.erp.modules.qmt.service;

import com.autonoma.erp.modules.qmt.entity.MachineCategory;
import com.autonoma.erp.modules.qmt.repository.MachineCategoryRepository;
import com.autonoma.erp.modules.qmt.repository.MachineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class MachineCategoryService {

    @Autowired
    private MachineCategoryRepository repository;

    @Autowired
    private MachineRepository machineRepository;

    public List<MachineCategory> getAllCategories() {
        return repository.findAll();
    }

    public Optional<MachineCategory> getCategoryById(Long id) {
        if (id == null) return Optional.empty();
        return repository.findById(id);
    }

    @Transactional
    public MachineCategory createCategory(MachineCategory category) {
        validateCategory(category, null);
        return repository.save(category);
    }

    @Transactional
    public MachineCategory updateCategory(Long id, MachineCategory details) {
        if (id == null) {
            throw new IllegalArgumentException("ID is mandatory.");
        }
        MachineCategory existing = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Machine category not found with ID: " + id));

        validateCategory(details, id);

        existing.setCategoryName(details.getCategoryName().trim());
        existing.setOeeRequired(details.getOeeRequired());
        existing.setSeqNo(details.getSeqNo());
        existing.setCategoryPrefix(details.getCategoryPrefix().trim().toUpperCase());
        existing.setStatus(details.getStatus());

        return repository.save(existing);
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (id == null) return;
        
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Machine category not found with ID: " + id);
        }
        
        // Check if there are machines mapped to this category (Note: QMT_MACHINE no longer references MachineCategory directly after redesign)
        
        repository.deleteById(id);
    }

    private void validateCategory(MachineCategory category, Long id) {
        // Validate Category ID for new records
        if (id == null) {
            if (category.getId() == null) {
                throw new IllegalArgumentException("Category ID is required.");
            }
            if (category.getId() <= 0) {
                throw new IllegalArgumentException("Category ID must be a positive integer.");
            }
            if (repository.existsById(category.getId())) {
                throw new IllegalArgumentException("Category ID already exists.");
            }
        }

        // Validate Category Name
        if (category.getCategoryName() == null || category.getCategoryName().trim().isEmpty()) {
            throw new IllegalArgumentException("Category Name is required.");
        }
        String name = category.getCategoryName().trim();
        if (name.length() < 3) {
            throw new IllegalArgumentException("Category Name must be at least 3 characters.");
        }
        
        boolean nameExists = (id == null) 
            ? repository.existsByCategoryNameIgnoreCase(name)
            : repository.existsByCategoryNameIgnoreCaseAndIdNot(name, id);
        if (nameExists) {
            throw new IllegalArgumentException("Category Name already exists.");
        }

        // Validate Category Prefix
        if (category.getCategoryPrefix() == null || category.getCategoryPrefix().trim().isEmpty()) {
            throw new IllegalArgumentException("Category Prefix is required.");
        }
        String prefix = category.getCategoryPrefix().trim().toUpperCase();
        if (prefix.length() > 5) {
            throw new IllegalArgumentException("Category Prefix must not exceed 5 characters.");
        }
        
        boolean prefixExists = (id == null)
            ? repository.existsByCategoryPrefixIgnoreCase(prefix)
            : repository.existsByCategoryPrefixIgnoreCaseAndIdNot(prefix, id);
        if (prefixExists) {
            throw new IllegalArgumentException("Category Prefix already exists.");
        }

        // Validate Seq No
        if (category.getSeqNo() == null) {
            throw new IllegalArgumentException("Sequence number is required.");
        }

        // Validate OEE Req
        if (category.getOeeRequired() == null) {
            throw new IllegalArgumentException("OEE Req is required.");
        }

        // Validate Status
        if (category.getStatus() == null) {
            throw new IllegalArgumentException("Status is required.");
        }
    }
}
