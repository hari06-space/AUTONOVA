package com.autonoma.erp.modules.sm.sales.controller;

import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.modules.sm.sales.entity.SmEnquiry;
import com.autonoma.erp.modules.sm.sales.entity.SmEnquiryPart;
import com.autonoma.erp.modules.sm.sales.service.SmEnquiryService;
import com.autonoma.erp.modules.sm.sales.repository.SmEnquiryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.autonoma.erp.security.RequirePagePermission;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/sm/enquiry")
@CrossOrigin(origins = "*")
@Tag(name = "SM - Enquiry", description = "Endpoints for managing Sales & Marketing Enquiries with OCR")
public class SmEnquiryController {

    @Autowired
    private com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository statusMasterRepository;

    @GetMapping("/statuses")
    public ResponseEntity<List<com.autonoma.erp.modules.platform.common.entity.StatusMaster>> getStatuses() {
        return ResponseEntity.ok(statusMasterRepository.findAll());
    }

    @Autowired
    private SmEnquiryService enquiryService;

    @Autowired
    private SmEnquiryRepository enquiryRepository;

    @Operation(summary = "Get all enquiries")
    @GetMapping
    public List<SmEnquiry> getAllEnquiries() {
        return enquiryService.getAllEnquiries();
    }

    @Operation(summary = "Get next auto-generated enquiry number")
    @GetMapping("/next-code")
    public ResponseEntity<Map<String, String>> getNextEnquiryCode() {
        Long maxId = enquiryRepository.findMaxId().orElse(0L);
        String nextCode = "ENQ-" + String.format("%05d", maxId + 1);
        Map<String, String> res = new java.util.HashMap<>();
        res.put("code", nextCode);
        return ResponseEntity.ok(res);
    }

    @Operation(summary = "Get enquiry by ID")
    @GetMapping("/{id}")
    public ResponseEntity<SmEnquiry> getEnquiryById(@PathVariable Long id) {
        return enquiryService.getEnquiryById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Create a new enquiry")
    @RequirePagePermission(pageCode = "SM1120", action = "write")
    @PostMapping
    public ResponseEntity<SmEnquiry> createEnquiry(@RequestBody SmEnquiry enquiry) {
        return ResponseEntity.ok(enquiryService.saveEnquiry(enquiry));
    }

    @Operation(summary = "Update an existing enquiry")
    @RequirePagePermission(pageCode = "SM1120", action = "write")
    @PutMapping("/{id}")
    public ResponseEntity<SmEnquiry> updateEnquiry(@PathVariable Long id, @RequestBody SmEnquiry enquiryDetails) {
        return enquiryRepository.findById(id)
                .map(enquiry -> {
                    if ("Pending Configuration".equals(enquiryDetails.getEnquiryNo())) {
                        throw new RuntimeException(
                                "Cannot save Enquiry with 'Pending Configuration' number. Please configure the Prefix/Suffix in Prefix Credentials.");
                    }
                    enquiry.setEnquiryNo(enquiryDetails.getEnquiryNo());
                    enquiry.setEnquiryDate(enquiryDetails.getEnquiryDate());
                    enquiry.setRfqMode(enquiryDetails.getRfqMode());
                    enquiry.setCustomerId(enquiryDetails.getCustomerId());
                    enquiry.setTargetDate(enquiryDetails.getTargetDate());
                    enquiry.setSalType(enquiryDetails.getSalType());
                    enquiry.setSource(enquiryDetails.getSource());
                    enquiry.setPriority(enquiryDetails.getPriority());
                    enquiry.setRemarks(enquiryDetails.getRemarks());
                    enquiry.setAttachments(enquiryDetails.getAttachments());
                    enquiry.setStatus(enquiryDetails.getStatus());

                    // Update parts collection
                    if (enquiryDetails.getParts() != null) {
                        List<SmEnquiryPart> existingParts = enquiry.getParts();
                        List<SmEnquiryPart> incomingParts = enquiryDetails.getParts();

                        // Remove parts that are not in incomingParts
                        if (existingParts != null) {
                            existingParts.removeIf(existing -> incomingParts.stream().noneMatch(
                                    incoming -> incoming.getId() != null && incoming.getId().equals(existing.getId())));
                        }

                        // Update existing or add new
                        for (SmEnquiryPart incoming : incomingParts) {
                            if (incoming.getId() != null && existingParts != null) {
                                // Find existing and update its fields
                                existingParts.stream()
                                        .filter(e -> e.getId().equals(incoming.getId()))
                                        .findFirst()
                                        .ifPresent(existing -> {
                                            existing.setPartNoId(incoming.getPartNoId());
                                            existing.setReqQty(incoming.getReqQty());
                                            existing.setCommerciallyFeasible(incoming.getCommerciallyFeasible());
                                            existing.setTechnicallyFeasible(incoming.getTechnicallyFeasible());
                                            existing.setAssignTo(incoming.getAssignTo());
                                            existing.setStatus(incoming.getStatus());
                                        });
                            } else {
                                // Add new part
                                incoming.setEnquiryId(enquiry.getId());
                                if (existingParts != null) {
                                    existingParts.add(incoming);
                                } else {
                                    enquiry.setParts(new java.util.ArrayList<>(List.of(incoming)));
                                }
                            }
                        }
                    } else {
                        if (enquiry.getParts() != null) {
                            enquiry.getParts().clear();
                        }
                    }

                    enquiry.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
                    return ResponseEntity.ok(enquiryService.saveEnquiry(enquiry));
                }).orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Delete an enquiry")
    @RequirePagePermission(pageCode = "SM1120", action = "delete")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEnquiry(@PathVariable Long id) {
        enquiryService.deleteEnquiry(id);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Bulk assign parts to employee")
    @PostMapping("/assign")
    public ResponseEntity<Void> bulkAssignParts(@RequestBody Map<String, Object> payload) {
        List<Integer> ids = (List<Integer>) payload.get("partIds");
        List<Long> partIds = ids.stream().map(Integer::longValue).toList();
        String employeeId = (String) payload.get("employeeId");
        String department = (String) payload.get("department");
        enquiryService.bulkAssignParts(partIds, employeeId, department, new java.util.Date());
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Bulk update feasibility of parts")
    @PostMapping("/feasibility")
    public ResponseEntity<Void> bulkUpdateFeasibility(@RequestBody Map<String, Object> payload) {
        List<Integer> ids = (List<Integer>) payload.get("partIds");
        List<Long> partIds = ids.stream().map(Integer::longValue).toList();
        String commercial = (String) payload.get("commercial");
        String technical = (String) payload.get("technical");
        enquiryService.bulkUpdatePartsFeasibility(partIds, commercial, technical);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Send email notification for enquiry")
    @PostMapping("/send-email")
    public ResponseEntity<Map<String, Object>> sendEmail(@RequestBody Map<String, String> payload) {
        String to = payload.get("to");
        String cc = payload.get("cc");
        String subject = payload.get("subject");
        String body = payload.get("body");
        boolean sent = enquiryService.sendEnquiryEmail(to, cc, subject, body);
        Map<String, Object> res = new HashMap<>();
        res.put("success", sent);
        return ResponseEntity.ok(res);
    }

    @Operation(summary = "Upload and parse Excel parts file")
    @PostMapping("/upload-excel")
    public ResponseEntity<List<SmEnquiryPart>> uploadExcel(@RequestParam("file") MultipartFile file) {
        List<SmEnquiryPart> parts = enquiryService.parseExcelFile(file);
        return ResponseEntity.ok(parts);
    }

    @Operation(summary = "Get dashboard statistics for enquiries")
    @GetMapping("/dashboard-stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEnquiries", enquiryService.countAll());
        // stats.put("openEnquiries", enquiryService.countByStatus(true));
        // stats.put("closedEnquiries", enquiryService.countByStatus(false));
        stats.put("openEnquiries", 0);
        stats.put("closedEnquiries", 0);
        stats.put("inProgressEnquiries", 0);
        return ResponseEntity.ok(stats);
    }
}
