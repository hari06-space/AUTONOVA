package com.autonoma.erp.modules.platform.identity.controller;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Lightweight health / ping endpoint.
 *
 * Used by the frontend Footer component to measure approximate network
 * round-trip time and derive a rough bandwidth estimate.
 * The response is intentionally tiny (< 100 bytes) and must NEVER be cached.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> ping() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header("Pragma", "no-cache")
                .body(Map.of(
                        "status", "UP",
                        "ts", System.currentTimeMillis()
                ));
    }
}
