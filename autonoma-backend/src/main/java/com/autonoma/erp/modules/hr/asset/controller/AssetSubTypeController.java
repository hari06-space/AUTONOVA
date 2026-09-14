package com.autonoma.erp.modules.hr.asset.controller;

import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.hr.asset.entity.AssetSubType;
import com.autonoma.erp.modules.hr.asset.service.AssetSubTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/asset-sub-type")
public class AssetSubTypeController {

    @Autowired
    private AssetSubTypeService service;

    @RequirePagePermission(pageCode = "M2530")
    @GetMapping
    public List<AssetSubType> getAll() {
        return service.getAll();
    }

    @RequirePagePermission(pageCode = "M2530")
    @GetMapping("/active")
    public List<AssetSubType> getActive() {
        return service.getActive();
    }

    @RequirePagePermission(pageCode = "M2530")
    @GetMapping("/group/{groupId}")
    public List<AssetSubType> getByGroupId(@PathVariable Long groupId) {
        return service.getByGroupId(groupId);
    }

    @RequirePagePermission(pageCode = "M2530")
    @GetMapping("/type/{typeId}")
    public List<AssetSubType> getByTypeId(@PathVariable Long typeId) {
        return service.getByTypeId(typeId);
    }

    @RequirePagePermission(pageCode = "M2530")
    @GetMapping("/{id}")
    public ResponseEntity<AssetSubType> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @RequirePagePermission(pageCode = "M2530")
    @PostMapping
    public AssetSubType create(@RequestBody AssetSubType entity) {
        return service.save(entity);
    }

    @RequirePagePermission(pageCode = "M2530")
    @PutMapping("/{id}")
    public ResponseEntity<AssetSubType> update(@PathVariable Long id, @RequestBody AssetSubType entity) {
        return service.findById(id)
                .map(existing -> {
                    existing.setGroupId(entity.getGroupId());
                    existing.setTypeId(entity.getTypeId());
                    existing.setSubTypeName(entity.getSubTypeName());
                    existing.setStatus(entity.getStatus());
                    return ResponseEntity.ok(service.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @RequirePagePermission(pageCode = "M2530")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return service.findById(id)
                .map(existing -> {
                    service.delete(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
