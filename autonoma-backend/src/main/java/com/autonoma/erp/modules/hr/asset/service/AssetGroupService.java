package com.autonoma.erp.modules.hr.asset.service;

import com.autonoma.erp.modules.hr.asset.entity.AssetGroup;
import com.autonoma.erp.modules.hr.asset.repository.AssetGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AssetGroupService {

    @Autowired
    private AssetGroupRepository repository;

    public List<AssetGroup> getAll() {
        return repository.findAll();
    }

    public List<AssetGroup> getActive() {
        return repository.findByStatus(true);
    }

    public AssetGroup save(AssetGroup entity) {
        return repository.save(entity);
    }

    public Optional<AssetGroup> findById(Long id) {
        return repository.findById(id);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
