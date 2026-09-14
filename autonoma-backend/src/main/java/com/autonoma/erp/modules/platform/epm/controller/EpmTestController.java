package com.autonoma.erp.modules.platform.epm.controller;

import com.autonoma.erp.modules.platform.epm.service.PerformanceEngineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/epm/test")
public class EpmTestController {

    private final PerformanceEngineService engineService;

    @org.springframework.beans.factory.annotation.Autowired
    public EpmTestController(PerformanceEngineService engineService) {
        this.engineService = engineService;
    }

    @PostMapping("/simulate")
    public ResponseEntity<String> simulateTransaction(
            @RequestParam Long userId,
            @RequestParam String type,
            @RequestParam Long points,
            @RequestParam String reason) {
        
        // Simulate a transaction being passed to the engine
        engineService.recordTransaction(userId, type, "TEST-" + System.currentTimeMillis(), 1L, points, reason);
        
        return ResponseEntity.ok("Simulated transaction successfully processed.");
    }
}
