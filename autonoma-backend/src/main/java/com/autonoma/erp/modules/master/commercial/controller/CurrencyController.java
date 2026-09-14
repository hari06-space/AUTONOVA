package com.autonoma.erp.modules.master.commercial.controller;


import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.master.commercial.entity.Currency;
import com.autonoma.erp.modules.master.commercial.repository.CurrencyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/currency")
@CrossOrigin(origins = "*")
public class CurrencyController {

    @Autowired
    private CurrencyRepository repository;

    @GetMapping
    public List<Currency> getAll() {
        return repository.findAll();
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M5230", action = "write")
    public ResponseEntity<?> create(@RequestBody Currency item) {
        if (repository.existsByCurrencyCodeIgnoreCase(item.getCurrencyCode())) {
            return ResponseEntity.badRequest().body("Currency Code already exists");
        }
        if (repository.existsByCurrencyNameIgnoreCase(item.getCurrencyName())) {
            return ResponseEntity.badRequest().body("Currency Name already exists");
        }
        return ResponseEntity.ok(repository.save(item));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M5230", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Currency item) {
        return repository.findById(id)
                .map(existing -> {
                    if (!existing.getCurrencyCode().equalsIgnoreCase(item.getCurrencyCode()) && repository.existsByCurrencyCodeIgnoreCase(item.getCurrencyCode())) {
                        return ResponseEntity.badRequest().body("Currency Code already exists");
                    }
                    if (!existing.getCurrencyName().equalsIgnoreCase(item.getCurrencyName()) && repository.existsByCurrencyNameIgnoreCase(item.getCurrencyName())) {
                        return ResponseEntity.badRequest().body("Currency Name already exists");
                    }
                    existing.setCurrencyCode(item.getCurrencyCode());
                    existing.setCurrencyName(item.getCurrencyName());
                    existing.setSymbol(item.getSymbol());
                    existing.setStatus(item.getStatus());
                    existing.setUpdatedBy(item.getUpdatedBy());
                    return ResponseEntity.ok(repository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")


    @RequirePagePermission(pageCode = "M5230", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
