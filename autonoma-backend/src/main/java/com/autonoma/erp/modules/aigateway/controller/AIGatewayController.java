package com.autonoma.erp.modules.aigateway.controller;

import com.autonoma.erp.modules.aigateway.service.BOSAiGateway;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/support/aigateway")
@Tag(name = "AI - Gateway Controller", description = "Endpoints for orchestrating AI queries, evaluating security bounds, and verifying access scopes")
public class AIGatewayController {

    @Autowired
    private BOSAiGateway aiGateway;

    @PostMapping("/query")
    @Operation(summary = "Process User Prompt Through AI Gateway", description = "Performs context checks, intent classification, permission scopes, and retrieves allowable tool configurations.")
    public ResponseEntity<?> processQuery(@RequestBody Map<String, String> payload) {
        String prompt = payload.get("prompt");
        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Prompt is required");
        }

        try {
            BOSAiGateway.GatewayResult result = aiGateway.processRequest(prompt);
            return ResponseEntity.ok(result);
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(se.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error processing request: " + e.getMessage());
        }
    }
}
