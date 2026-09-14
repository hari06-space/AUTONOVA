package com.autonoma.erp.modules.sm.sales.controller;

import com.autonoma.erp.modules.sm.sales.entity.SmQuotationFollowUp;
import com.autonoma.erp.modules.sm.sales.service.SmQuotationFollowUpService;
import com.autonoma.erp.security.RequirePagePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sm/quotation-follow-up")
@CrossOrigin(origins = "*")
@Tag(name = "SM - Quotation Follow Up", description = "Endpoints for managing Quotation Follow Ups")
public class SmQuotationFollowUpController {

    @Autowired
    private SmQuotationFollowUpService followUpService;

    @Operation(summary = "Get all quotation follow ups")
    @GetMapping
    public List<SmQuotationFollowUp> getAllFollowUps() {
        return followUpService.getAllFollowUps();
    }

    @Operation(summary = "Get quotation follow ups by quotation ID")
    @GetMapping("/quotation/{quotationId}")
    public List<SmQuotationFollowUp> getFollowUpsByQuotationId(@PathVariable Long quotationId) {
        return followUpService.getFollowUpsByQuotationId(quotationId);
    }

    @Operation(summary = "Get follow up by ID")
    @GetMapping("/{id}")
    public ResponseEntity<SmQuotationFollowUp> getFollowUpById(@PathVariable Long id) {
        return followUpService.getFollowUpById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Create a new quotation follow up")
    @RequirePagePermission(pageCode = "SM1140", action = "write")
    @PostMapping
    public ResponseEntity<SmQuotationFollowUp> createFollowUp(@RequestBody SmQuotationFollowUp followUp) {
        return ResponseEntity.ok(followUpService.saveFollowUp(followUp));
    }

    @Operation(summary = "Update an existing quotation follow up")
    @RequirePagePermission(pageCode = "SM1140", action = "write")
    @PutMapping("/{id}")
    public ResponseEntity<SmQuotationFollowUp> updateFollowUp(@PathVariable Long id, @RequestBody SmQuotationFollowUp followUpDetails) {
        return followUpService.getFollowUpById(id)
                .map(followUp -> {
                    followUp.setQuotationId(followUpDetails.getQuotationId());
                    followUp.setCustomerId(followUpDetails.getCustomerId());
                    followUp.setPartId(followUpDetails.getPartId());
                    followUp.setFollowMode(followUpDetails.getFollowMode());
                    followUp.setFollowType(followUpDetails.getFollowType());
                    followUp.setComments(followUpDetails.getComments());
                    followUp.setFollowUpDate(followUpDetails.getFollowUpDate());
                    followUp.setAttachmentPath(followUpDetails.getAttachmentPath());
                    followUp.setStatus(followUpDetails.getStatus());
                    return ResponseEntity.ok(followUpService.saveFollowUp(followUp));
                }).orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Delete a quotation follow up")
    @RequirePagePermission(pageCode = "SM1140", action = "delete")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFollowUp(@PathVariable Long id) {
        followUpService.deleteFollowUp(id);
        return ResponseEntity.ok().build();
    }
}
