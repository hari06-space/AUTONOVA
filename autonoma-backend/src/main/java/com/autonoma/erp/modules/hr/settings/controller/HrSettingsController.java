package com.autonoma.erp.modules.hr.settings.controller;

import com.autonoma.erp.modules.hr.settings.entity.HrSettingMaster;
import com.autonoma.erp.modules.hr.settings.service.HrSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hr/settings")
@CrossOrigin(origins = "*", maxAge = 3600)
@Tag(name = "HRM - Policy & Settings", description = "Enterprise HR Policy and Settings Master Configuration")
public class HrSettingsController {

    @Autowired
    private HrSettingsService service;

    @GetMapping
    @Operation(summary = "Get current HR settings")
    public ResponseEntity<HrSettingMaster> getSettings() {
        return ResponseEntity.ok(service.getSettings());
    }

    @PostMapping
    @Operation(summary = "Save or update HR settings")
    public ResponseEntity<HrSettingMaster> saveSettings(@RequestBody HrSettingMaster settings) {
        return ResponseEntity.ok(service.saveSettings(settings));
    }
}
