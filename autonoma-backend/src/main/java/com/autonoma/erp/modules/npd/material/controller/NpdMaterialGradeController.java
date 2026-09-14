package com.autonoma.erp.modules.npd.material.controller;

import com.autonoma.erp.modules.npd.material.entity.NpdMaterialGrade;
import com.autonoma.erp.modules.npd.material.service.NpdMaterialGradeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/npd/material-grades")
public class NpdMaterialGradeController {

    @Autowired
    private NpdMaterialGradeService service;

    @GetMapping
    public ResponseEntity<List<NpdMaterialGrade>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{code}")
    public ResponseEntity<NpdMaterialGrade> getByCode(@PathVariable String code) {
        return service.getByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<NpdMaterialGrade> create(@RequestBody NpdMaterialGrade materialGrade) {
        return new ResponseEntity<>(service.create(materialGrade), HttpStatus.CREATED);
    }

    @PutMapping("/{code}")
    public ResponseEntity<NpdMaterialGrade> update(@PathVariable String code, @RequestBody NpdMaterialGrade materialGrade) {
        return ResponseEntity.ok(service.update(code, materialGrade));
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        service.delete(code);
        return ResponseEntity.noContent().build();
    }
}
