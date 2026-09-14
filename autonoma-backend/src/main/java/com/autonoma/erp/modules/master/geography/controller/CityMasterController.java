package com.autonoma.erp.modules.master.geography.controller;

import com.autonoma.erp.modules.master.geography.entity.CityMaster;
import com.autonoma.erp.modules.master.geography.service.CityMasterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/city")
@CrossOrigin(origins = "*")
public class CityMasterController {

    @Autowired
    private CityMasterService service;

    @GetMapping
    public List<CityMaster> getAll() {
        return service.findAll();
    }

    @GetMapping("/{code}")
    public ResponseEntity<CityMaster> getById(@PathVariable String code) {
        return service.findById(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CityMaster entity) {
        try {
            return ResponseEntity.ok(service.save(entity));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{code}")
    public ResponseEntity<?> update(@PathVariable String code, @RequestBody CityMaster entity) {
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
