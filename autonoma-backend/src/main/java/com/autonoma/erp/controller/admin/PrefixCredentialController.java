package com.autonoma.erp.controller.admin;


import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.model.admin.PrefixCredential;
import com.autonoma.erp.service.admin.PrefixCredentialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prefix-credentials")
public class PrefixCredentialController {

    @Autowired
    private PrefixCredentialService service;

    @GetMapping("/all")
    public List<PrefixCredential> getAllPrefixCredentials() {
        return service.getAllPrefixCredentials();
    }

    @GetMapping("/{accountYear}")
    public ResponseEntity<PrefixCredential> getPrefixCredentialById(@PathVariable String accountYear) {
        return service.getPrefixCredentialById(accountYear)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/create")


    @RequirePagePermission(pageCode = "AD1230", action = "write")
    public PrefixCredential createPrefixCredential(@RequestBody PrefixCredential credential) {
        return service.createPrefixCredential(credential);
    }

    @PutMapping("/update/{accountYear}")


    @RequirePagePermission(pageCode = "AD1230", action = "write")
    public ResponseEntity<PrefixCredential> updatePrefixCredential(
            @PathVariable String accountYear,
            @RequestBody PrefixCredential credential) {
        try {
            PrefixCredential updated = service.updatePrefixCredential(accountYear, credential);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{accountYear}")


    @RequirePagePermission(pageCode = "AD1230", action = "delete")
    public ResponseEntity<Void> deletePrefixCredential(@PathVariable String accountYear) {
        service.deletePrefixCredential(accountYear);
        return ResponseEntity.ok().build();
    }
}
