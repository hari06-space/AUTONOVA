package com.autonoma.erp.modules.npd.material.controller;

import com.autonoma.erp.modules.npd.material.entity.NpdMaterialType;
import com.autonoma.erp.modules.npd.material.service.NpdMaterialTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/npd/material-types")
public class NpdMaterialTypeController {

    @Autowired
    private NpdMaterialTypeService service;

    @GetMapping
    public ResponseEntity<List<NpdMaterialType>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{code}")
    public ResponseEntity<NpdMaterialType> getByCode(@PathVariable String code) {
        return service.getByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<NpdMaterialType> create(@RequestBody NpdMaterialType materialType) {
        return new ResponseEntity<>(service.create(materialType), HttpStatus.CREATED);
    }

    @PutMapping("/{code}")
    public ResponseEntity<NpdMaterialType> update(@PathVariable String code, @RequestBody NpdMaterialType materialType) {
        return ResponseEntity.ok(service.update(code, materialType));
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        service.delete(code);
        return ResponseEntity.noContent().build();
    }
}
