package com.autonoma.erp.modules.hr.asset.controller;

import com.autonoma.erp.modules.hr.asset.entity.AssetMaster;
import com.autonoma.erp.modules.hr.asset.repository.AssetMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/master/assets")
@CrossOrigin(origins = "*")
public class AssetMasterController {

    @Autowired
    private AssetMasterRepository repository;

    @GetMapping
    public List<AssetMaster> getAllActive(@RequestParam(value = "group", required = false) String group) {
        if (group != null && !group.trim().isEmpty()) {
            return repository.findByAssetGroupAndIsActiveTrue(group.trim());
        }
        return repository.findByIsActiveTrue();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetMaster> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
