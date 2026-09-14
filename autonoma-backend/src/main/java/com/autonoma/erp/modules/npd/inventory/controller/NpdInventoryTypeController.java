package com.autonoma.erp.modules.npd.inventory.controller;

import com.autonoma.erp.modules.npd.inventory.entity.NpdInventoryType;
import com.autonoma.erp.modules.npd.inventory.service.NpdInventoryTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/npd/inventory-types")
public class NpdInventoryTypeController {

    @Autowired
    private NpdInventoryTypeService service;

    @GetMapping
    public ResponseEntity<List<NpdInventoryType>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{code}")
    public ResponseEntity<NpdInventoryType> getByCode(@PathVariable String code) {
        return service.getByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<NpdInventoryType> create(@RequestBody NpdInventoryType inventoryType) {
        return new ResponseEntity<>(service.create(inventoryType), HttpStatus.CREATED);
    }

    @PutMapping("/{code}")
    public ResponseEntity<NpdInventoryType> update(@PathVariable String code, @RequestBody NpdInventoryType inventoryType) {
        return ResponseEntity.ok(service.update(code, inventoryType));
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        service.delete(code);
        return ResponseEntity.noContent().build();
    }
}
