package com.autonoma.erp.modules.hr.orgstructure.controller;

import com.autonoma.erp.util.SecurityUtils;


import com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel;
import com.autonoma.erp.modules.hr.orgstructure.entity.LevelMaster;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationLevelRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.LevelMasterRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/master/hr/designation-levels")
@CrossOrigin(origins = "*")
public class DesignationLevelController {

    @Autowired
    private DesignationLevelRepository designationLevelRepository;

    @Autowired
    private LevelMasterRepository levelMasterRepository;

    private void syncToLevelMaster(String levelName) {
        if (levelName == null || levelName.trim().isEmpty()) return;
        boolean exists = levelMasterRepository.findAll().stream()
                .anyMatch(l -> l.getLevelName().equalsIgnoreCase(levelName.trim()));
        if (!exists) {
            LevelMaster lm = new LevelMaster(levelName.trim());
            lm.setIsActive(true);
            levelMasterRepository.save(lm);
        }
    }

    private void syncLevelUpdate(String oldLevelName, String newLevelName) {
        if (oldLevelName == null || newLevelName == null) return;
        levelMasterRepository.findAll().stream()
                .filter(l -> l.getLevelName().equalsIgnoreCase(oldLevelName.trim()))
                .findFirst()
                .ifPresent(l -> {
                    l.setLevelName(newLevelName.trim());
                    levelMasterRepository.save(l);
                });
    }

    private void deleteFromLevelMaster(String levelName) {
        if (levelName == null) return;
        levelMasterRepository.findAll().stream()
                .filter(l -> l.getLevelName().equalsIgnoreCase(levelName.trim()))
                .findFirst()
                .ifPresent(levelMasterRepository::delete);
    }

    @GetMapping("/next-screening-level")
    public ResponseEntity<Integer> getNextScreeningLevel() {
        try {
            return ResponseEntity.ok(designationLevelRepository.findMaxScreeningLevel().orElse(0) + 1);
        } catch (Exception e) {
            return ResponseEntity.ok(1);
        }
    }

    @GetMapping
    public List<DesignationLevel> getAll() {
        return designationLevelRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DesignationLevel> getById(@PathVariable Long id) {
        return designationLevelRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M2250", action = "write")
    public ResponseEntity<?> create(@RequestBody DesignationLevel level) {
        if (designationLevelRepository.existsByLevel(level.getLevel())) {
            return ResponseEntity.badRequest().body("Designation level already exists");
        }
        if (level.getCreatedBy() == null)
            level.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        DesignationLevel saved = designationLevelRepository.save(level);
        syncToLevelMaster(saved.getLevel());
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M2250", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody DesignationLevel levelDetails) {
        Optional<DesignationLevel> existingOpt = designationLevelRepository.findById(id);
        if (existingOpt.isEmpty() && levelDetails.getLevel() != null) {
            existingOpt = designationLevelRepository.findByLevel(levelDetails.getLevel().trim());
        }
        if (existingOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Designation level not found for ID: " + id);
        }

        DesignationLevel level = existingOpt.get();
        String oldLevelName = level.getLevel() != null ? level.getLevel().trim() : "";
        String newLevelName = levelDetails.getLevel() != null ? levelDetails.getLevel().trim() : "";
        if (!oldLevelName.equalsIgnoreCase(newLevelName) && designationLevelRepository.existsByLevel(newLevelName)) {
            return ResponseEntity.badRequest().body("Designation level already exists");
        }

        level.setLevel(newLevelName);
        level.setBasic(levelDetails.getBasic());
        level.setDa(levelDetails.getDa());
        level.setHra(levelDetails.getHra());
        level.setScreeningLevel(levelDetails.getScreeningLevel());
        level.setMinLimit(levelDetails.getMinLimit());
        level.setMaxLimit(levelDetails.getMaxLimit());
        level.setLtaLimit(levelDetails.getLtaLimit());

        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        level.setUpdatedBy(userId != null ? userId : "System");

        DesignationLevel saved = designationLevelRepository.save(level);
        syncLevelUpdate(oldLevelName, saved.getLevel());
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M2250", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return designationLevelRepository.findById(id)
                .map(level -> {
                    designationLevelRepository.delete(level);
                    deleteFromLevelMaster(level.getLevel());
                    return ResponseEntity.ok().build();
                }).orElse(ResponseEntity.notFound().build());
    }
}

