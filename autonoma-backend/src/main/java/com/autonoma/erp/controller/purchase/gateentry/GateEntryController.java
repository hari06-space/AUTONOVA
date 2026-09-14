package com.autonoma.erp.controller.purchase.gateentry;

import com.autonoma.erp.dto.purchase.gateentry.GateEntryHeadDTO;
import com.autonoma.erp.dto.purchase.gateentry.GateEntryListDTO;
import com.autonoma.erp.service.purchase.gateentry.GateEntryService;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/purchase/gate-entry")
public class GateEntryController {

    private final GateEntryService gateEntryService;

    public GateEntryController(GateEntryService gateEntryService) {
        this.gateEntryService = gateEntryService;
    }

    private String getUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping
    public ResponseEntity<?> createGateEntry(@RequestBody GateEntryHeadDTO dto) {
        GateEntryHeadDTO created = gateEntryService.createGateEntry(dto, getUsername());
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateGateEntry(
            @PathVariable Long id, @RequestBody GateEntryHeadDTO dto) {
        GateEntryHeadDTO updated = gateEntryService.updateGateEntry(id, dto, getUsername());
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getGateEntry(@PathVariable Long id) {
        GateEntryHeadDTO dto = gateEntryService.getGateEntryById(id);
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGateEntry(@PathVariable Long id) {
        gateEntryService.deleteGateEntry(id, getUsername());
        return ResponseEntity.ok(Map.of("message", "Gate Entry deleted successfully"));
    }

    @GetMapping("/list/{divisionId}")
    public ResponseEntity<?> getGateEntryList(
            @PathVariable Long divisionId, Pageable pageable) {
        Page<GateEntryListDTO> list = gateEntryService.getGateEntryList(divisionId, pageable);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/{id}/action/{action}")
    public ResponseEntity<?> processAction(
            @PathVariable Long id, @PathVariable String action) {
        GateEntryHeadDTO updated = gateEntryService.processAction(id, action, getUsername());
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}/allowed-actions")
    public ResponseEntity<?> getAllowedActions(@PathVariable Long id) {
        List<String> actions = gateEntryService.getNextAllowedActions(id);
        return ResponseEntity.ok(actions);
    }

    @GetMapping("/sources/open-pos")
    public ResponseEntity<?> getOpenPOsForSource() {
        Long divisionId = SecurityUtils.getCurrentDivisionId();
        List<Map<String, Object>> pos = gateEntryService.getOpenPOsForSource(divisionId);
        return ResponseEntity.ok(pos);
    }

    @GetMapping("/sources/po/{poId}")
    public ResponseEntity<?> getPoDetailsForGateEntry(@PathVariable Long poId) {
        return ResponseEntity.ok(gateEntryService.getPoDetailsForGateEntry(poId));
    }
}
