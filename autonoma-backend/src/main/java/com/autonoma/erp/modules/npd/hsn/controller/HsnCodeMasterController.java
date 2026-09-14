package com.autonoma.erp.modules.npd.hsn.controller;

import com.autonoma.erp.modules.npd.hsn.entity.HsnCodeMaster;
import com.autonoma.erp.modules.npd.hsn.service.HsnCodeMasterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/hsn-codes")
public class HsnCodeMasterController {

    @Autowired
    private HsnCodeMasterService service;

    @GetMapping
    public ResponseEntity<List<HsnCodeMaster>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{code}")
    public ResponseEntity<HsnCodeMaster> getByCode(@PathVariable String code) {
        return service.getByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<HsnCodeMaster> create(@RequestBody HsnCodeMaster hsnCodeMaster) {
        return new ResponseEntity<>(service.create(hsnCodeMaster), HttpStatus.CREATED);
    }

    @PutMapping("/{code}")
    public ResponseEntity<HsnCodeMaster> update(@PathVariable String code, @RequestBody HsnCodeMaster hsnCodeMaster) {
        return ResponseEntity.ok(service.update(code, hsnCodeMaster));
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        service.delete(code);
        return ResponseEntity.noContent().build();
    }
}
