package com.autonoma.erp.controller;

import com.autonoma.erp.model.VisitorGatePass;
import com.autonoma.erp.service.VisitorGatePassService;
import com.autonoma.erp.service.admin.EmailSendingService;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/order/visitor-gate-pass")
@CrossOrigin(origins = "*")
public class VisitorGatePassController {

    @Autowired
    private VisitorGatePassService service;

    @Autowired
    private EmailSendingService emailSendingService;

    @Autowired(required = false)
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @jakarta.annotation.PostConstruct
    public void autoFixTableColumns() {
        if (jdbcTemplate != null) {
            try { jdbcTemplate.execute("ALTER TABLE OM_VISITOR_GATE_PASS ALTER COLUMN CHECK_IN_IMG NVARCHAR(MAX)"); } catch (Exception ignored) {}
            try { jdbcTemplate.execute("ALTER TABLE OM_VISITOR_GATE_PASS ALTER COLUMN CHECK_OUT_IMG NVARCHAR(MAX)"); } catch (Exception ignored) {}
            try { jdbcTemplate.execute("ALTER TABLE OM_VISITOR_GATE_PASS ALTER COLUMN CAPTURE_FILE_NAME NVARCHAR(MAX)"); } catch (Exception ignored) {}
            try { jdbcTemplate.execute("ALTER TABLE OM_VISITOR_GATE_PASS ALTER COLUMN FILE_NAME NVARCHAR(MAX)"); } catch (Exception ignored) {}
        }
    }

    // ── GET paginated list ────────────────────────────────────────────────────
    @GetMapping
    @RequirePagePermission(pageCode = "OM1000", action = "read")
    public ResponseEntity<?> getAll(
            @RequestParam(defaultValue = "0")  int    page,
            @RequestParam(defaultValue = "10") int    size,
            @RequestParam(required = false)    String status,
            @RequestParam(required = false)    String visitorType,
            @RequestParam(required = false)    String foodAllowance,
            @RequestParam(required = false)    String fromDate,
            @RequestParam(required = false)    String toDate,
            @RequestParam(required = false)    String searchValue,
            @RequestParam(required = false)    String gatePassNo,
            @RequestParam(required = false)    String taskScope) {
        try {
            Page<VisitorGatePass> result = service.findAll(
                    status, visitorType, foodAllowance, fromDate, toDate, searchValue, gatePassNo, taskScope, page, size);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── GET latest by mobile number ───────────────────────────────────────────
    @GetMapping("/latest-by-mobile")
    public ResponseEntity<?> getLatestByMobile(@RequestParam String mobileNo) {
        try {
            VisitorGatePass pass = service.findLatestByMobileNo(mobileNo);
            if (pass == null) {
                return ResponseEntity.ok(Map.of());
            }
            return ResponseEntity.ok(pass);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── GET photo info by mobile number ───────────────────────────────────────
    @GetMapping("/photo-info-by-mobile")
    public ResponseEntity<?> getPhotoInfoByMobile(@RequestParam String mobileNo) {
        try {
            Map<String, Object> photoInfo = service.findPhotoInfoByMobileNo(mobileNo);
            return ResponseEntity.ok(photoInfo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── GET by Gate Pass No ───────────────────────────────────────────────────
    @GetMapping("/by-no")
    public ResponseEntity<?> getByGatePassNo(@RequestParam String gatePassNo) {
        try {
            VisitorGatePass pass = service.findByGatePassNo(gatePassNo);
            if (pass == null) {
                return ResponseEntity.status(404).body(Map.of("message", "No Gate Pass found with number: " + gatePassNo));
            }
            return ResponseEntity.ok(pass);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── GET suggestions by Gate Pass No prefix/search ───────────────────────
    @GetMapping("/suggestions")
    public ResponseEntity<?> getSuggestions(@RequestParam String q) {
        try {
            List<VisitorGatePass> list = service.searchByGatePassNo(q);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── POST Check In ────────────────────────────────────────────────────────
    @PostMapping("/{id}/check-in")
    public ResponseEntity<?> checkIn(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> req) {
        try {
            String checkInBy = req != null ? (String) req.get("checkInBy") : null;
            String checkInImg = req != null ? (String) req.get("checkInImg") : null;
            if (checkInBy == null || checkInBy.isBlank()) {
                checkInBy = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            }
            VisitorGatePass updated = service.checkIn(id, checkInBy, checkInImg);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── POST Check Out ───────────────────────────────────────────────────────
    @PostMapping("/{id}/check-out")
    public ResponseEntity<?> checkOut(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> req) {
        try {
            String checkOutBy = req != null ? (String) req.get("checkOutBy") : null;
            String checkOutImg = req != null ? (String) req.get("checkOutImg") : null;
            if (checkOutBy == null || checkOutBy.isBlank()) {
                checkOutBy = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            }
            VisitorGatePass updated = service.checkOut(id, checkOutBy, checkOutImg);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── GET next auto-generated gate pass number ──────────────────────────────────
    @GetMapping("/next-no")
    @RequirePagePermission(pageCode = "OM1000", action = "read")
    public ResponseEntity<?> getNextNo() {
        try {
            String nextNo = service.generateGatePassNo(new Date());
            return ResponseEntity.ok(Map.of("gatePassNo", nextNo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── POST Send Visitor Gate Pass Email ──────────────────────────────────────────
    @PostMapping("/send-email")
    @RequirePagePermission(pageCode = "OM1000", action = "read")
    public ResponseEntity<?> sendVisitorPassEmail(@RequestBody Map<String, Object> req) {
        try {
            String to = (String) req.get("to");
            String subject = (String) req.get("subject");
            String htmlBody = (String) req.get("htmlBody");
            String pdfBase64 = (String) req.get("pdfBase64");
            String fileName = (String) req.getOrDefault("fileName", "Visitor_Gate_Pass.pdf");

            if (to == null || to.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Recipient email is required"));
            }

            List<Map<String, Object>> attachments = new ArrayList<>();
            if (pdfBase64 != null && !pdfBase64.isBlank()) {
                String cleanBase64 = pdfBase64.contains(",") ? pdfBase64.split(",")[1] : pdfBase64;
                byte[] pdfBytes = Base64.getDecoder().decode(cleanBase64);
                Map<String, Object> att = new HashMap<>();
                att.put("fileName", fileName);
                att.put("content", pdfBytes);
                attachments.add(att);
            }

            // Dispatch email sending in async thread so controller responds instantly to UI
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    emailSendingService.sendEmailWithAttachments(to, null, null, subject, htmlBody, attachments, true);
                } catch (Exception ex) {
                    System.err.println("[VisitorGatePassEmail] Async mail delivery notice: " + ex.getMessage());
                }
            });

            return ResponseEntity.ok(Map.of("message", "Visitor Pass Email dispatched successfully to " + to));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── GET by ID ─────────────────────────────────────────────────────────────
    @GetMapping("/{id}")
    @RequirePagePermission(pageCode = "OM1000", action = "read")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.findById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── POST create ───────────────────────────────────────────────────────────
    @PostMapping
    @RequirePagePermission(pageCode = "OM1000", action = "write")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> req) {
        try {
            VisitorGatePass pass = mapToEntity(req);
            return ResponseEntity.ok(service.create(pass));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── PUT update ────────────────────────────────────────────────────────────
    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "OM1000", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        try {
            VisitorGatePass pass = mapToEntity(req);
            return ResponseEntity.ok(service.update(id, pass));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── Map request body → entity ─────────────────────────────────────────────
    private VisitorGatePass mapToEntity(Map<String, Object> req) {
        VisitorGatePass p = new VisitorGatePass();
        p.setVisitorName(str(req, "visitorName"));
        p.setVisitorType(str(req, "visitorType"));
        p.setIsdCode(str(req, "isdCode"));
        p.setMobileNo(str(req, "mobileNo"));
        p.setEmailId(str(req, "emailId"));
        p.setAddress(str(req, "address"));
        p.setVendorCode(str(req, "vendorCode"));
        p.setNewVendor(str(req, "newVendor"));
        p.setPersonToMeet(str(req, "personToMeet"));
        p.setPersonName(str(req, "personName"));
        p.setPurpose(str(req, "purpose"));
        p.setPurposeComments(str(req, "purposeComments"));
        p.setFoodAllowance(str(req, "foodAllowance"));
        p.setFoodCategory(str(req, "foodCategory"));
        p.setNormalFood(str(req, "normalFood"));
        p.setKit(str(req, "kit"));
        p.setComments(str(req, "comments"));
        p.setCancelReason(str(req, "cancelReason"));
        p.setGatePassType(str(req, "gatePassType"));
        p.setCheckInImg(str(req, "checkInImg"));
        p.setCheckOutImg(str(req, "checkOutImg"));
        p.setCheckInBy(str(req, "checkInBy"));
        p.setCheckOutBy(str(req, "checkOutBy"));

        // status: frontend sends string ("OPEN","APPROVED"…) → convert to dynamic status ID from AD_STATUS_MASTER
        String statusStr = str(req, "status");
        p.setStatus(service.resolveStatusToInt(statusStr));

        // noOfPersons
        if (req.get("noOfPersons") != null) {
            try { p.setNoOfPersons(Integer.parseInt(req.get("noOfPersons").toString())); }
            catch (Exception ignored) {}
        }

        // visitorDate (date string "yyyy-MM-dd" → Date)
        p.setVisitorDate(parseDate(str(req, "visitorDate")));

        // inTime / outTime — stored as datetime in DB; frontend sends "HH:mm" or "hh:mm a" strings
        p.setInTime(parseTime(p.getVisitorDate(), str(req, "inTime")));
        p.setOutTime(parseTime(p.getVisitorDate(), str(req, "outTime")));
        p.setCheckInTime(parseTime(p.getVisitorDate(), str(req, "checkInTime")));
        p.setCheckOutTime(parseTime(p.getVisitorDate(), str(req, "checkOutTime")));

        return p;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private String str(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return null;
        if (val instanceof Map) {
            Map<?, ?> m = (Map<?, ?>) val;
            if (m.get("path") != null) return m.get("path").toString();
            if (m.get("fileName") != null) return m.get("fileName").toString();
            if (m.get("file") != null) return m.get("file").toString();
        }
        String s = val.toString().trim();
        if (s.isBlank() || s.equalsIgnoreCase("null") || s.equalsIgnoreCase("undefined")) return null;
        if (s.startsWith("{path=") && s.contains("}")) {
            int endIdx = s.indexOf(",");
            if (endIdx == -1 || endIdx > s.indexOf("}")) endIdx = s.indexOf("}");
            s = s.substring(6, endIdx).trim();
        }
        return s;
    }

    private Date parseDate(String val) {
        if (val == null || val.isBlank()) return null;
        val = val.trim();
        try {
            if (val.contains("T")) {
                java.time.Instant instant = java.time.Instant.parse(val);
                java.time.ZonedDateTime zdt = instant.atZone(java.time.ZoneId.systemDefault());
                return Date.from(zdt.toLocalDate().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant());
            }
        } catch (Exception ignored) {}

        try {
            if (val.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
                return new SimpleDateFormat("yyyy-MM-dd").parse(val);
            }
        } catch (Exception ignored) {}

        try {
            if (val.matches("^\\d{2}/\\d{2}/\\d{4}$")) {
                return new SimpleDateFormat("dd/MM/yyyy").parse(val);
            }
        } catch (Exception ignored) {}

        try {
            return new SimpleDateFormat("yyyy-MM-dd").parse(val);
        } catch (Exception e) {
            try {
                return new SimpleDateFormat("dd/MM/yyyy").parse(val);
            } catch (Exception ex) {
                return null;
            }
        }
    }

    private Date parseTime(Date baseDate, String timeStr) {
        if (timeStr == null || timeStr.isBlank()) return null;
        timeStr = timeStr.trim();
        if (timeStr.contains("T") && timeStr.length() > 10) {
            try {
                return Date.from(java.time.Instant.parse(timeStr));
            } catch (Exception ignored) {}
        }
        try {
            Date parsedTime = new SimpleDateFormat("hh:mm a").parse(timeStr.toUpperCase());
            return mergeDateAndTime(baseDate, parsedTime);
        } catch (Exception e) {
            try {
                Date parsedTime = new SimpleDateFormat("HH:mm").parse(timeStr);
                return mergeDateAndTime(baseDate, parsedTime);
            } catch (Exception ex) {
                try {
                    return new SimpleDateFormat("yyyy-MM-dd'T'HH:mm").parse(timeStr);
                } catch (Exception ex2) {
                    return null;
                }
            }
        }
    }

    private Date mergeDateAndTime(Date baseDate, Date parsedTime) {
        java.util.Calendar timeCal = java.util.Calendar.getInstance();
        timeCal.setTime(parsedTime);

        java.util.Calendar baseCal = java.util.Calendar.getInstance();
        if (baseDate != null) {
            baseCal.setTime(baseDate);
        }
        baseCal.set(java.util.Calendar.HOUR_OF_DAY, timeCal.get(java.util.Calendar.HOUR_OF_DAY));
        baseCal.set(java.util.Calendar.MINUTE, timeCal.get(java.util.Calendar.MINUTE));
        baseCal.set(java.util.Calendar.SECOND, 0);
        baseCal.set(java.util.Calendar.MILLISECOND, 0);
        return baseCal.getTime();
    }
}
