package com.autonoma.erp.modules.qms.audit.controller;

import com.autonoma.erp.modules.qms.audit.service.NcrOfiService;

import com.autonoma.erp.modules.qms.audit.entity.AuditObservationDetail;
import com.autonoma.erp.modules.qms.audit.repository.AuditObservationDetailRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.util.Date;
import java.util.List;
import java.util.Calendar;

@RestController
@RequestMapping("/api/qms/audit/ncr")
@CrossOrigin(origins = "*")
public class AuditNcrController {

    @Autowired
    private AuditObservationDetailRepository detailRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.service.NcrOfiService ncrOfiService;

    @GetMapping("/findings")
    public List<AuditObservationDetail> getAllFindings() {
        return detailRepository.findAllNcrAndOfi();
    }

    @PutMapping("/close/{id}")
    @RequirePagePermission(pageCode = "QM1240", action = "write")
    public ResponseEntity<?> closeNcr(@PathVariable Long id, @RequestBody AuditObservationDetail update) {
        return detailRepository.findById(id).map(detail -> {
            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("observationDetailId", id.intValue());
            payload.put("rootCause", update.getRootCause());
            payload.put("correctiveAction", update.getCorrectiveAction());
            payload.put("preventiveAction", update.getPreventiveAction());
            payload.put("targetDate", update.getTargetDate() != null ? new java.text.SimpleDateFormat("yyyy-MM-dd").format(update.getTargetDate()) : null);
            
            try {
                ncrOfiService.processNcrClosure(payload);
                return ResponseEntity.ok(detailRepository.findById(id).orElse(detail));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body(e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/approve/{id}")
    @RequirePagePermission(pageCode = "QM1250", action = "approval")
    public ResponseEntity<?> approveNcr(@PathVariable Long id) {
        try {
            ncrOfiService.approveNcr(id.intValue(), null);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/next-ncr-no")
    public String getNextNcrNo() {
        return generateNcrNo();
    }

    private String generateNcrNo() {
        AuditObservationDetail latest = detailRepository.findFirstByNcrNoIsNotNullOrderByNcrNoDesc();
        String yearSuffix = String.valueOf(Calendar.getInstance().get(Calendar.YEAR) % 100);
        String prefix = "NC-" + yearSuffix + "-";
        String oldPrefix = "NCR-" + yearSuffix + "-";
        
        if (latest == null) {
            return prefix + "0001";
        }

        // Support both old NCR- and new NC- prefixed records
        String latestNo = latest.getNcrNo();
        String numPart = null;
        if (latestNo.startsWith(prefix)) {
            numPart = latestNo.substring(prefix.length());
        } else if (latestNo.startsWith(oldPrefix)) {
            numPart = latestNo.substring(oldPrefix.length());
        }

        if (numPart == null) {
            return prefix + "0001";
        }
        
        try {
            int nextVal = Integer.parseInt(numPart) + 1;
            return prefix + String.format("%04d", nextVal);
        } catch (Exception e) {
            return prefix + "0001";
        }
    }
}
