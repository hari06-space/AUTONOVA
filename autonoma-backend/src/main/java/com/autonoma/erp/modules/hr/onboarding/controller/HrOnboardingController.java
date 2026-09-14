package com.autonoma.erp.modules.hr.onboarding.controller;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.onboarding.entity.*;
import com.autonoma.erp.modules.hr.onboarding.repository.*;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.util.SecurityUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/hr/onboarding")
@CrossOrigin(origins = "*", maxAge = 3600)
@Slf4j
public class HrOnboardingController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(HrOnboardingController.class);

    @Autowired
    private HrOnboardOfferLetterRepository offerLetterRepository;

    @Autowired
    private HrOnboardAppointmentOrderRepository appointmentOrderRepository;

    @Autowired
    private HrOnboardRelievingOrderRepository relievingOrderRepository;

    @Autowired
    private EmployeeMasterRepository employeeMasterRepository;

    @Autowired
    private StatusMasterRepository statusMasterRepository;

    // Helper method to resolve status name to ID
    private Long resolveStatusId(String statusName) {
        if (statusName == null || statusName.trim().isEmpty()) {
            statusName = "Pending";
        }
        final String searchName = statusName.trim();
        Optional<StatusMaster> statusOpt = statusMasterRepository.findByName(searchName);
        if (statusOpt.isPresent()) {
            return statusOpt.get().getId();
        }
        // Case insensitive fallback
        return statusMasterRepository.findAll().stream()
                .filter(s -> s.getName().equalsIgnoreCase(searchName))
                .findFirst()
                .map(StatusMaster::getId)
                .orElseGet(() -> {
                    // Try "Pending" as ultimate fallback
                    return statusMasterRepository.findByName("Pending")
                            .map(StatusMaster::getId)
                            .orElse(1L);
                });
    }

    // ==========================================
    // OFFER LETTERS
    // ==========================================

    @GetMapping("/offer-letters")
    public List<HrOnboardOfferLetter> getAllOfferLetters() {
        log.info("Fetching all onboarding Offer Letters");
        return offerLetterRepository.findAll();
    }

    @GetMapping("/offer-letters/{id}")
    public ResponseEntity<HrOnboardOfferLetter> getOfferLetterById(@PathVariable Long id) {
        return offerLetterRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/offer-letters")
    public ResponseEntity<?> createOfferLetter(@RequestBody Map<String, Object> payload) {
        log.info("Creating Offer Letter: {}", payload);
        try {
            HrOnboardOfferLetter offer = new HrOnboardOfferLetter();
            offer.setEmployeeId(Long.valueOf(payload.get("employeeId").toString()));
            offer.setDocumentReferenceNumber(payload.get("documentReferenceNumber").toString());
            offer.setDepartmentId(Long.valueOf(payload.get("departmentId").toString()));
            
            // Handle date
            if (payload.get("issueDate") != null) {
                offer.setIssueDate(new Date(Long.parseLong(payload.get("issueDate").toString())));
            } else {
                offer.setIssueDate(new Date());
            }

            offer.setDocumentContent((String) payload.get("documentContent"));
            
            String statusName = (String) payload.get("approvalStatus");
            offer.setApprovalStatusId(resolveStatusId(statusName));

            HrOnboardOfferLetter saved = offerLetterRepository.save(offer);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Error creating Offer Letter", e);
            return ResponseEntity.badRequest().body("Failed to create offer letter: " + e.getMessage());
        }
    }

    @PutMapping("/offer-letters/{id}")
    public ResponseEntity<?> updateOfferLetter(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        log.info("Updating Offer Letter ID {}: {}", id, payload);
        return offerLetterRepository.findById(id).map(offer -> {
            try {
                offer.setEmployeeId(Long.valueOf(payload.get("employeeId").toString()));
                offer.setDocumentReferenceNumber(payload.get("documentReferenceNumber").toString());
                offer.setDepartmentId(Long.valueOf(payload.get("departmentId").toString()));

                if (payload.get("issueDate") != null) {
                    offer.setIssueDate(new Date(Long.parseLong(payload.get("issueDate").toString())));
                }
                
                offer.setDocumentContent((String) payload.get("documentContent"));
                
                String statusName = (String) payload.get("approvalStatus");
                offer.setApprovalStatusId(resolveStatusId(statusName));

                HrOnboardOfferLetter saved = offerLetterRepository.save(offer);
                return ResponseEntity.ok(saved);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Failed to update: " + e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/offer-letters/{id}")
    public ResponseEntity<?> deleteOfferLetter(@PathVariable Long id) {
        log.info("Deleting Offer Letter ID: {}", id);
        return offerLetterRepository.findById(id).map(offer -> {
            offerLetterRepository.delete(offer);
            return ResponseEntity.ok(Map.of("message", "Offer Letter deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ==========================================
    // APPOINTMENT ORDERS
    // ==========================================

    @GetMapping("/appointment-orders")
    public List<HrOnboardAppointmentOrder> getAllAppointmentOrders() {
        log.info("Fetching all onboarding Appointment Orders");
        return appointmentOrderRepository.findAll();
    }

    @GetMapping("/appointment-orders/{id}")
    public ResponseEntity<HrOnboardAppointmentOrder> getAppointmentOrderById(@PathVariable Long id) {
        return appointmentOrderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/appointment-orders")
    public ResponseEntity<?> createAppointmentOrder(@RequestBody Map<String, Object> payload) {
        log.info("Creating Appointment Order: {}", payload);
        try {
            HrOnboardAppointmentOrder appt = new HrOnboardAppointmentOrder();
            appt.setEmployeeId(Long.valueOf(payload.get("employeeId").toString()));
            appt.setDocumentReferenceNumber(payload.get("documentReferenceNumber").toString());
            appt.setDepartmentId(Long.valueOf(payload.get("departmentId").toString()));
            appt.setDesignationId(Long.valueOf(payload.get("designationId").toString()));

            if (payload.get("joiningDate") != null) {
                appt.setJoiningDate(new Date(Long.parseLong(payload.get("joiningDate").toString())));
            } else {
                appt.setJoiningDate(new Date());
            }

            appt.setDocumentContent((String) payload.get("documentContent"));

            String statusName = (String) payload.get("status");
            appt.setStatusId(resolveStatusId(statusName));

            HrOnboardAppointmentOrder saved = appointmentOrderRepository.save(appt);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Error creating Appointment Order", e);
            return ResponseEntity.badRequest().body("Failed to create appointment order: " + e.getMessage());
        }
    }

    @PutMapping("/appointment-orders/{id}")
    public ResponseEntity<?> updateAppointmentOrder(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        log.info("Updating Appointment Order ID {}: {}", id, payload);
        return appointmentOrderRepository.findById(id).map(appt -> {
            try {
                appt.setEmployeeId(Long.valueOf(payload.get("employeeId").toString()));
                appt.setDocumentReferenceNumber(payload.get("documentReferenceNumber").toString());
                appt.setDepartmentId(Long.valueOf(payload.get("departmentId").toString()));
                appt.setDesignationId(Long.valueOf(payload.get("designationId").toString()));

                if (payload.get("joiningDate") != null) {
                    appt.setJoiningDate(new Date(Long.parseLong(payload.get("joiningDate").toString())));
                }

                appt.setDocumentContent((String) payload.get("documentContent"));

                String statusName = (String) payload.get("status");
                appt.setStatusId(resolveStatusId(statusName));

                HrOnboardAppointmentOrder saved = appointmentOrderRepository.save(appt);
                return ResponseEntity.ok(saved);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Failed to update: " + e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/appointment-orders/{id}")
    public ResponseEntity<?> deleteAppointmentOrder(@PathVariable Long id) {
        log.info("Deleting Appointment Order ID: {}", id);
        return appointmentOrderRepository.findById(id).map(appt -> {
            appointmentOrderRepository.delete(appt);
            return ResponseEntity.ok(Map.of("message", "Appointment Order deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ==========================================
    // RELIEVING ORDERS
    // ==========================================

    @GetMapping("/relieving-orders")
    public List<HrOnboardRelievingOrder> getAllRelievingOrders() {
        log.info("Fetching all onboarding Relieving Orders");
        return relievingOrderRepository.findAll();
    }

    @GetMapping("/relieving-orders/{id}")
    public ResponseEntity<HrOnboardRelievingOrder> getRelievingOrderById(@PathVariable Long id) {
        return relievingOrderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/relieving-orders")
    public ResponseEntity<?> createRelievingOrder(@RequestBody Map<String, Object> payload) {
        log.info("Creating Relieving Order: {}", payload);
        try {
            HrOnboardRelievingOrder rel = new HrOnboardRelievingOrder();
            rel.setEmployeeId(Long.valueOf(payload.get("employeeId").toString()));
            rel.setDocumentReferenceNumber(payload.get("documentReferenceNumber").toString());
            rel.setDepartmentId(Long.valueOf(payload.get("departmentId").toString()));

            if (payload.get("resignationDate") != null) {
                rel.setResignationDate(new Date(Long.parseLong(payload.get("resignationDate").toString())));
            } else {
                rel.setResignationDate(new Date());
            }

            if (payload.get("lastWorkingDay") != null) {
                rel.setLastWorkingDay(new Date(Long.parseLong(payload.get("lastWorkingDay").toString())));
            } else {
                rel.setLastWorkingDay(new Date());
            }

            rel.setDocumentContent((String) payload.get("documentContent"));

            String statusName = (String) payload.get("status");
            rel.setStatusId(resolveStatusId(statusName));

            HrOnboardRelievingOrder saved = relievingOrderRepository.save(rel);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Error creating Relieving Order", e);
            return ResponseEntity.badRequest().body("Failed to create relieving order: " + e.getMessage());
        }
    }

    @PutMapping("/relieving-orders/{id}")
    public ResponseEntity<?> updateRelievingOrder(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        log.info("Updating Relieving Order ID {}: {}", id, payload);
        return relievingOrderRepository.findById(id).map(rel -> {
            try {
                rel.setEmployeeId(Long.valueOf(payload.get("employeeId").toString()));
                rel.setDocumentReferenceNumber(payload.get("documentReferenceNumber").toString());
                rel.setDepartmentId(Long.valueOf(payload.get("departmentId").toString()));

                if (payload.get("resignationDate") != null) {
                    rel.setResignationDate(new Date(Long.parseLong(payload.get("resignationDate").toString())));
                }
                if (payload.get("lastWorkingDay") != null) {
                    rel.setLastWorkingDay(new Date(Long.parseLong(payload.get("lastWorkingDay").toString())));
                }

                rel.setDocumentContent((String) payload.get("documentContent"));

                String statusName = (String) payload.get("status");
                rel.setStatusId(resolveStatusId(statusName));

                HrOnboardRelievingOrder saved = relievingOrderRepository.save(rel);
                return ResponseEntity.ok(saved);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Failed to update: " + e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/relieving-orders/{id}")
    public ResponseEntity<?> deleteRelievingOrder(@PathVariable Long id) {
        log.info("Deleting Relieving Order ID: {}", id);
        return relievingOrderRepository.findById(id).map(rel -> {
            relievingOrderRepository.delete(rel);
            return ResponseEntity.ok(Map.of("message", "Relieving Order deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
