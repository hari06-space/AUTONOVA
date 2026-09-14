package com.autonoma.erp.modules.npd.material.controller;

import com.autonoma.erp.modules.npd.material.entity.NpdShapeMaster;
import com.autonoma.erp.modules.npd.material.service.NpdShapeMasterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/npd/shapes")
public class NpdShapeMasterController {

    @Autowired
    private NpdShapeMasterService service;

    @GetMapping
    public ResponseEntity<List<NpdShapeMaster>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{code}")
    public ResponseEntity<NpdShapeMaster> getByCode(@PathVariable String code) {
        return service.getByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<NpdShapeMaster> create(@RequestBody NpdShapeMaster shapeMaster) {
        return new ResponseEntity<>(service.create(shapeMaster), HttpStatus.CREATED);
    }

    @PutMapping("/{code}")
    public ResponseEntity<NpdShapeMaster> update(@PathVariable String code, @RequestBody NpdShapeMaster shapeMaster) {
        return ResponseEntity.ok(service.update(code, shapeMaster));
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        service.delete(code);
        return ResponseEntity.noContent().build();
    }
}
