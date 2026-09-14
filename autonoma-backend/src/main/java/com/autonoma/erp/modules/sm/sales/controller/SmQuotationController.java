package com.autonoma.erp.modules.sm.sales.controller;

import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.sm.sales.entity.SmQuotation;
import com.autonoma.erp.modules.sm.sales.service.SmQuotationService;
import com.autonoma.erp.modules.sm.sales.repository.SmQuotationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/sm/quotation")
@CrossOrigin(origins = "*")
@Tag(name = "SM - Quotation", description = "Endpoints for managing Sales & Marketing Quotations with OCR")
public class SmQuotationController {

    @Autowired
    private SmQuotationService quotationService;

    @Autowired
    private SmQuotationRepository quotationRepository;

    @Operation(summary = "Get all quotations")
    @GetMapping
    public List<SmQuotation> getAllQuotations() {
        return quotationService.getAllQuotations();
    }

    @Operation(summary = "Get next auto-generated quotation number")
    @GetMapping("/next-code")
    public ResponseEntity<Map<String, String>> getNextQuotationCode() {
        String nextCode = "";
        try {
            nextCode = quotationService.generateQuotationNo();
        } catch (Exception e) {
            nextCode = "Pending Configuration";
        }
        Map<String, String> res = new HashMap<>();
        res.put("code", nextCode);
        return ResponseEntity.ok(res);
    }

    @Operation(summary = "Get quotations by customer and product")
    @GetMapping("/by-product")
    public List<SmQuotation> getQuotationsByProduct(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String productName,
            @RequestParam(required = false) String partNo) {
        return quotationService.getQuotationsByCustomerAndProduct(customerId, productId, productName, partNo);
    }

    @Operation(summary = "Get quotation by ID")
    @GetMapping("/{id}")
    public ResponseEntity<SmQuotation> getQuotationById(@PathVariable Long id) {
        return quotationService.getQuotationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Create a new quotation")
    @RequirePagePermission(pageCode = "SM1140", action = "write")
    @PostMapping
    public ResponseEntity<?> createQuotation(@RequestBody SmQuotation quotation) {
        if (quotationRepository.existsByQuotationNo(quotation.getQuotationNo())) {
            return ResponseEntity.badRequest().body("Quotation Number already exists!");
        }
        
        if (quotation.getNeedsVerification() != null && quotation.getNeedsVerification()) {
            quotation.setQuotationStatus(7L); // Pending for Verified
        } else if (quotation.getNeedsVerification() != null && !quotation.getNeedsVerification()) {
            quotation.setQuotationStatus(24L); // VERIFIED
        } else {
            quotation.setQuotationStatus(34L); // Draft
        }
        
        return ResponseEntity.ok(quotationService.saveQuotation(quotation));
    }

    @Operation(summary = "Update an existing quotation")
    @RequirePagePermission(pageCode = "SM1140", action = "write")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateQuotation(@PathVariable Long id, @RequestBody SmQuotation quotationDetails) {
        if (quotationRepository.existsByQuotationNoAndIdNot(quotationDetails.getQuotationNo(), id)) {
            return ResponseEntity.badRequest().body("Quotation Number already exists!");
        }
        return quotationRepository.findById(id)
                .map(quotation -> {
                    quotation.setQuotationNo(quotationDetails.getQuotationNo());
                    quotation.setQuotationDate(quotationDetails.getQuotationDate());
                    quotation.setCustomerId(quotationDetails.getCustomerId());
                    quotation.setRfqMode(quotationDetails.getRfqMode());
                    quotation.setRequestDate(quotationDetails.getRequestDate());
                    quotation.setRemarks(quotationDetails.getRemarks());
                    
                    if (quotationDetails.getNeedsVerification() != null && quotationDetails.getNeedsVerification()) {
                        quotation.setQuotationStatus(7L); // Pending for Verified
                    } else if (quotationDetails.getNeedsVerification() != null && !quotationDetails.getNeedsVerification()) {
                        quotation.setQuotationStatus(24L); // VERIFIED
                    } else {
                        quotation.setQuotationStatus(quotationDetails.getQuotationStatus());
                    }
                    
                    quotation.setAttachments(quotationDetails.getAttachments());
                    quotation.setStatus(quotationDetails.getStatus());
                    quotation.setRemarks(quotationDetails.getRemarks());
                    quotation.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
                    quotation.setUpdatedDate(new java.util.Date());
if (quotation.getParts() != null) {
                        quotation.getParts().clear();
                        if (quotationDetails.getParts() != null) {
                            for (com.autonoma.erp.modules.sm.sales.entity.SmQuotationDetail part : quotationDetails.getParts()) {
                                part.setId(null); // Prevent detached entity exception on re-insert
                                part.setQuotationId(quotation.getId());
                                quotation.getParts().add(part);
                            }
                        }
                    } else {
                        if (quotationDetails.getParts() != null) {
                            for (com.autonoma.erp.modules.sm.sales.entity.SmQuotationDetail part : quotationDetails.getParts()) {
                                part.setId(null);
                                part.setQuotationId(quotation.getId());
                            }
                        }
                        quotation.setParts(quotationDetails.getParts());
                    }
                    
                    return ResponseEntity.ok(quotationService.saveQuotation(quotation));

                }).orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Delete a quotation")
    @RequirePagePermission(pageCode = "SM1140", action = "delete")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuotation(@PathVariable Long id) {
        quotationService.deleteQuotation(id);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Verify or reject a quotation")
    @RequirePagePermission(pageCode = "SM1140", action = "write")
    @PutMapping("/{id}/{action}")
    public ResponseEntity<SmQuotation> verifyQuotation(
            @PathVariable Long id,
            @PathVariable String action,
            @RequestBody java.util.Map<String, String> body,
            @RequestAttribute(value = "user_name", required = false) String userName) {
        
        if (!action.equals("verify") && !action.equals("reject")) {
            return ResponseEntity.badRequest().build();
        }
        
        String remarks = body.get("remarks");
        String updatedBy = userName != null ? userName : "Admin";
        
        SmQuotation updatedQuotation = quotationService.verifyQuotation(id, action, remarks, updatedBy);
        return ResponseEntity.ok(updatedQuotation);
    }
}
