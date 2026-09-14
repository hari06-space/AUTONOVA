package com.autonoma.erp.controller;

import com.autonoma.erp.dto.purchase.ProcurementSettingsDTO;
import com.autonoma.erp.service.ProcurementSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/procurement-settings")
public class ProcurementSettingsController {

    private final ProcurementSettingsService service;

    @org.springframework.beans.factory.annotation.Autowired
    public ProcurementSettingsController(ProcurementSettingsService service) {
        this.service = service;
    }

    @GetMapping("/division/{divisionId}")
    public ResponseEntity<ProcurementSettingsDTO> getSettings(@PathVariable Long divisionId) {
        return ResponseEntity.ok(service.getSettingsByDivision(divisionId));
    }

    @PostMapping
    public ResponseEntity<ProcurementSettingsDTO> saveSettings(@RequestBody ProcurementSettingsDTO dto) {
        return ResponseEntity.ok(service.saveOrUpdateSettings(dto));
    }
}
