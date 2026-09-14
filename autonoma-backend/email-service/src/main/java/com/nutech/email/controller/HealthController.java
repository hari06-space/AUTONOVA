package com.nutech.email.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HealthController {

    private final DataSource dataSource;
    private final com.nutech.email.integration.GraphMailService graphMailService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        boolean dbUp = false;
        try (Connection conn = dataSource.getConnection()) {
            dbUp = conn.isValid(2);
        } catch (Exception ignored) {}

        boolean graphUp = false;
        try {
            graphMailService.fetchRecentEmails(1);
            graphUp = true;
        } catch (Exception ignored) {}

        return ResponseEntity.ok(Map.of(
                "status", (dbUp && graphUp) ? "UP" : "DEGRADED",
                "timestamp", LocalDateTime.now().toString(),
                "database", dbUp ? "connected" : "disconnected",
                "graphApi", graphUp ? "connected" : "disconnected",
                "service", "Nutech Email Processing Backend",
                "version", "1.0.0"
        ));
    }
}
