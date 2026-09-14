package com.autonoma.erp.controller.ai;

import com.autonoma.erp.service.ai.ExecutiveDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/executive")
public class ExecutiveDashboardController {

    @Autowired
    private ExecutiveDashboardService dashboardService;

    @GetMapping("/dashboard-data")
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        return ResponseEntity.ok(dashboardService.getDashboardData());
    }

    @GetMapping("/briefing")
    public ResponseEntity<Map<String, String>> getBriefing() {
        return ResponseEntity.ok(Map.of("briefing", dashboardService.generateAiBriefing()));
    }

    @GetMapping("/digest")
    public ResponseEntity<Map<String, Object>> getDigest(@RequestParam(defaultValue = "daily") String period) {
        return ResponseEntity.ok(dashboardService.getDigest(period));
    }

    @PostMapping("/approve")
    public ResponseEntity<Map<String, Object>> processApproval(@RequestBody Map<String, Object> body) {
        long id = ((Number) body.getOrDefault("id", 0L)).longValue();
        String action = (String) body.getOrDefault("action", "approve");
        String comments = (String) body.getOrDefault("comments", "");
        
        boolean success = dashboardService.processApproval(id, action, comments);
        return ResponseEntity.ok(Map.of(
            "success", success,
            "message", "Request successfully processed"
        ));
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> executeSmartSearch(@RequestParam String query) {
        return ResponseEntity.ok(dashboardService.executeSmartSearch(query));
    }

    /**
     * Server-Sent Events stream for real-time alerts.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAlerts() {
        SseEmitter emitter = new SseEmitter(300000L); // 5-minute timeout
        
        new Thread(() -> {
            try {
                // Initial connect notification
                emitter.send(SseEmitter.event()
                    .name("message")
                    .data(Map.of("type", "CONNECT", "message", "Connected to Operations Stream")));
                
                String[] alertTypes = {"Machine Breakdown", "Supplier Delay", "Material Shortage", "Approval Overdue", "Production Delay", "QC bay alert"};
                String[] alertMsgs = {
                    "CNC Spindle CNC-04 reported temp critical (72C)",
                    "Logistics truck for raw metal delayed by 24h at state toll gate",
                    "Raw copper sheet count dropped below minimum safety buffer (35 units)",
                    "Invoice authorization INV-993 pending for 14 hours",
                    "Line-2 packaging flow rate dropped to 65% target throughput",
                    "Inspect queue backlogged with 8 new assembly batches"
                };
                String[] alertLevels = {"CRITICAL", "WARNING", "CRITICAL", "INFO", "WARNING", "WARNING"};
                
                Random rand = new Random();
                for (int i = 0; i < 20; i++) {
                    // Send an alert every 12-20 seconds
                    Thread.sleep(12000 + rand.nextInt(8000));
                    int index = rand.nextInt(alertTypes.length);
                    
                    Map<String, String> payload = Map.of(
                        "type", alertTypes[index],
                        "message", alertMsgs[index],
                        "level", alertLevels[index],
                        "duration", "Just now"
                    );
                    
                    emitter.send(SseEmitter.event()
                        .name("alert")
                        .data(payload));
                }
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        }).start();
        
        return emitter;
    }
}
