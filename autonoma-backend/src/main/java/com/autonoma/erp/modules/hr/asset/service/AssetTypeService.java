package com.autonoma.erp.modules.hr.asset.service;

import com.autonoma.erp.modules.hr.asset.entity.AssetType;
import com.autonoma.erp.modules.hr.asset.repository.AssetTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AssetTypeService {

    @Autowired
    private AssetTypeRepository repository;

    @Transactional(readOnly = true)
    public List<AssetType> getAll() {
        return repository.findAllWithGroup();
    }

    @Transactional(readOnly = true)
    public List<AssetType> getActive() {
        return repository.findActiveWithGroup();
    }

    @Transactional(readOnly = true)
    public List<AssetType> getByGroupId(Long groupId) {
        return repository.findByGroupIdWithGroup(groupId);
    }

    public AssetType save(AssetType entity) {
        return repository.save(entity);
    }

    public Optional<AssetType> findById(Long id) {
        return repository.findById(id);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
