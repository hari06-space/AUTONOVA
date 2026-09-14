package com.autonoma.erp.modules.qms.meeting.controller;

import com.autonoma.erp.modules.qms.meeting.dto.RuleMetadataDto;
import com.autonoma.erp.modules.qms.meeting.dto.RuleSimulationRequestDto;
import com.autonoma.erp.modules.qms.meeting.dto.RuleSimulationResultDto;
import com.autonoma.erp.modules.qms.meeting.entity.QmsScheduleRule;
import com.autonoma.erp.modules.qms.meeting.service.DynamicRuleEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/qms/schedule-rules")
@RequiredArgsConstructor
@Slf4j
public class QmsScheduleRuleController {

    private final DynamicRuleEngineService dynamicRuleEngineService;

    @GetMapping("/metadata")
    public ResponseEntity<RuleMetadataDto> getMetadata() {
        return ResponseEntity.ok(dynamicRuleEngineService.getRuleMetadata());
    }

    @GetMapping("/config/{configId}")
    public ResponseEntity<List<QmsScheduleRule>> getRulesForConfig(@PathVariable Long configId) {
        return ResponseEntity.ok(dynamicRuleEngineService.getRulesForConfig(configId));
    }

    @GetMapping("/meeting/{meetingId}")
    public ResponseEntity<List<QmsScheduleRule>> getRulesForMeeting(@PathVariable Long meetingId) {
        return ResponseEntity.ok(dynamicRuleEngineService.getRulesForMeeting(meetingId));
    }

    @PostMapping
    public ResponseEntity<QmsScheduleRule> saveRule(@RequestBody QmsScheduleRule rule) {
        return ResponseEntity.ok(dynamicRuleEngineService.saveRule(rule));
    }

    @PostMapping("/reorder")
    public ResponseEntity<Void> reorderPriorities(@RequestBody List<Map<String, Object>> priorityList) {
        dynamicRuleEngineService.reorderRulePriorities(priorityList);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/simulate")
    public ResponseEntity<RuleSimulationResultDto> simulateRules(@RequestBody RuleSimulationRequestDto request) {
        return ResponseEntity.ok(dynamicRuleEngineService.simulateRules(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable Long id) {
        dynamicRuleEngineService.deleteRule(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/by-name")
    public ResponseEntity<Void> deleteRuleByName(
            @RequestParam String ruleName,
            @RequestParam(required = false) Long meetingId,
            @RequestParam(required = false) Long configId) {
        dynamicRuleEngineService.deleteRuleByName(ruleName, meetingId, configId);
        return ResponseEntity.noContent().build();
    }
}
