package com.autonoma.erp.modules.npd.material.controller;

import com.autonoma.erp.modules.npd.material.entity.MaterialCondition;
import com.autonoma.erp.modules.npd.material.service.MaterialConditionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/npd/material/conditions")
@CrossOrigin(origins = "*")
public class MaterialConditionController {

    @Autowired
    private MaterialConditionService service;

    @GetMapping
    public List<MaterialCondition> getAll() {
        return service.findAll();
    }

    @GetMapping("/{code}")
    public ResponseEntity<MaterialCondition> getById(@PathVariable String code) {
        return service.findById(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody MaterialCondition entity) {
        try {
            return ResponseEntity.ok(service.save(entity));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{code}")
    public ResponseEntity<?> update(@PathVariable String code, @RequestBody MaterialCondition entity) {
        try {
            return ResponseEntity.ok(service.update(code, entity));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        service.delete(code);
        return ResponseEntity.ok().build();
    }
}
