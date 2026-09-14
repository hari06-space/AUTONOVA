package com.autonoma.erp.controller.admin;


import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.model.admin.BosUserPageAuth;
import com.autonoma.erp.service.admin.BosUserPageAuthService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/user-page-auth")
@CrossOrigin
public class BosUserPageAuthController {

    @Autowired
    private BosUserPageAuthService authService;

    @GetMapping({"/{userId}/enabled-page-ids", "/enabled-page-ids/{userId}"})
    public ResponseEntity<Set<Integer>> getEnabledPageIdsByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(authService.getEnabledPageIdsByUserId(userId));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<BosUserPageAuth>> getAuthByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(authService.getAuthByUserId(userId));
    }

    @PostMapping("/save-all")


    @RequirePagePermission(pageCode = "AD1140", action = "write")
    public ResponseEntity<String> saveAll(@RequestBody List<BosUserPageAuth> auths) {
        authService.saveAll(auths);
        return ResponseEntity.ok("Authorizations saved successfully");
    }
}
