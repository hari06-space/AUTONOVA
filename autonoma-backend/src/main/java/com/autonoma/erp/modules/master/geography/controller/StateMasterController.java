package com.autonoma.erp.modules.master.geography.controller;


import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.master.geography.entity.StateMaster;
import com.autonoma.erp.modules.master.geography.repository.StateMasterRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/states")
@Tag(name = "State Master", description = "State Master Management APIs")
public class StateMasterController {

    @Autowired
    private StateMasterRepository repository;

    @GetMapping
    public List<StateMaster> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<StateMaster> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping


    @RequirePagePermission(pageCode = "M5260", action = "write")
    public StateMaster create(@RequestBody StateMaster item) {
        return repository.save(item);
    }

    @PutMapping("/{id}")


    @RequirePagePermission(pageCode = "M5260", action = "write")
    public ResponseEntity<StateMaster> update(@PathVariable Long id, @RequestBody StateMaster item) {
        return repository.findById(id)
                .map(existing -> {
                    item.setId(id);
                    item.setCreatedBy(existing.getCreatedBy());
                    item.setCreatedDate(existing.getCreatedDate());
                    return ResponseEntity.ok(repository.save(item));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")


    @RequirePagePermission(pageCode = "M5260", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
