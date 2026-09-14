package com.autonoma.erp.modules.hr.asset.controller;

import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.hr.asset.entity.AssetGroup;
import com.autonoma.erp.modules.hr.asset.service.AssetGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/asset-group")
public class AssetGroupController {

    @Autowired
    private AssetGroupService service;

    @RequirePagePermission(pageCode = "M2510")
    @GetMapping
    public List<AssetGroup> getAll() {
        return service.getAll();
    }

    @RequirePagePermission(pageCode = "M2510")
    @GetMapping("/active")
    public List<AssetGroup> getActive() {
        return service.getActive();
    }

    @RequirePagePermission(pageCode = "M2510")
    @GetMapping("/{id}")
    public ResponseEntity<AssetGroup> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @RequirePagePermission(pageCode = "M2510")
    @PostMapping
    public AssetGroup create(@RequestBody AssetGroup entity) {
        return service.save(entity);
    }

    @RequirePagePermission(pageCode = "M2510")
    @PutMapping("/{id}")
    public ResponseEntity<AssetGroup> update(@PathVariable Long id, @RequestBody AssetGroup entity) {
        return service.findById(id)
                .map(existing -> {
                    existing.setGroupName(entity.getGroupName());
                    existing.setStatus(entity.getStatus());
                    return ResponseEntity.ok(service.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @RequirePagePermission(pageCode = "M2510")
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
