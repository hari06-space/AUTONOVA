package com.autonoma.erp.modules.hr.asset.service;

import com.autonoma.erp.modules.hr.asset.entity.AssetSubType;
import com.autonoma.erp.modules.hr.asset.repository.AssetSubTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AssetSubTypeService {

    @Autowired
    private AssetSubTypeRepository repository;

    @Transactional(readOnly = true)
    public List<AssetSubType> getAll() {
        return repository.findAllWithRelations();
    }

    @Transactional(readOnly = true)
    public List<AssetSubType> getActive() {
        return repository.findActiveWithRelations();
    }

    public List<AssetSubType> getByGroupId(Long groupId) {
        return repository.findByGroupId(groupId);
    }

    public List<AssetSubType> getByTypeId(Long typeId) {
        return repository.findByTypeId(typeId);
    }

    public AssetSubType save(AssetSubType entity) {
        return repository.save(entity);
    }

    public Optional<AssetSubType> findById(Long id) {
        return repository.findById(id);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
