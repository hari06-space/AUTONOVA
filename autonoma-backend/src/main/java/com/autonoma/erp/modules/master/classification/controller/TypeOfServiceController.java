package com.autonoma.erp.modules.master.classification.controller;


import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.master.classification.entity.TypeOfService;
import com.autonoma.erp.modules.master.classification.repository.TypeOfServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/type-of-service")
@CrossOrigin(origins = "*")
public class TypeOfServiceController {

    @Autowired
    private TypeOfServiceRepository repository;

    @GetMapping
    public List<TypeOfService> getAll() {
        return repository.findAll();
    }

    @PostMapping
    @RequirePagePermission(pageCode = "SM1150", action = "write")
    public ResponseEntity<?> create(@RequestBody TypeOfService item) {
        if (repository.existsByServiceNameIgnoreCase(item.getServiceName())) {
            return ResponseEntity.badRequest().body("Type of Service Name already exists");
        }
        return ResponseEntity.ok(repository.save(item));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "SM1150", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody TypeOfService item) {
        return repository.findById(id)
                .map(existing -> {
                    if (!existing.getServiceName().equalsIgnoreCase(item.getServiceName()) && repository.existsByServiceNameIgnoreCase(item.getServiceName())) {
                        return ResponseEntity.badRequest().body("Type of Service Name already exists");
                    }
                    existing.setServiceName(item.getServiceName());
                    existing.setDescription(item.getDescription());
                    existing.setStatus(item.getStatus());
                    existing.setUpdatedBy(item.getUpdatedBy());
                    return ResponseEntity.ok(repository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")


    @RequirePagePermission(pageCode = "SM1150", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
