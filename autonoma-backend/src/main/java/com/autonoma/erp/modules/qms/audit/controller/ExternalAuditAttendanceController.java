package com.autonoma.erp.modules.qms.audit.controller;

import com.autonoma.erp.modules.qms.audit.entity.AuditAttendance;
import com.autonoma.erp.modules.qms.audit.entity.AuditSchedule;
import com.autonoma.erp.modules.qms.audit.repository.AuditAttendanceRepository;
import com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/qms/audit/external")
@Slf4j
public class ExternalAuditAttendanceController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ExternalAuditAttendanceController.class);

    private final AuditScheduleRepository auditScheduleRepository;
    private final AuditAttendanceRepository auditAttendanceRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public ExternalAuditAttendanceController(
            AuditScheduleRepository auditScheduleRepository,
            AuditAttendanceRepository auditAttendanceRepository) {
        this.auditScheduleRepository = auditScheduleRepository;
        this.auditAttendanceRepository = auditAttendanceRepository;
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateLink(@RequestParam String scheduleNo, @RequestParam String email) {
        try {
            if (scheduleNo == null || scheduleNo.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("valid", false, "message", "Missing schedule number."));
            }

            Optional<AuditSchedule> scheduleOpt = auditScheduleRepository.findByScheduleNo(scheduleNo.trim());
            if (scheduleOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("valid", false, "message", "Invalid schedule number: " + scheduleNo));
            }
            
            AuditSchedule schedule = scheduleOpt.get();
            String status = schedule.getStatus() != null ? schedule.getStatus().trim().toUpperCase() : "";
            if ("CLOSED".equals(status) || "CANCELLED".equals(status)) {
                return ResponseEntity.badRequest().body(Map.of("valid", false, "message", "This audit schedule is " + status.toLowerCase() + ". Attendance cannot be marked."));
            }

            // Verify if email matches external auditor / contact
            String externalName = schedule.getExternalName();
            String externalEmail = schedule.getExternalEmailId();

            if (schedule.getAuditeeDetails() != null) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(schedule.getAuditeeDetails());
                    if ((externalEmail == null || externalEmail.trim().isEmpty()) && node.has("externalEmailId")) {
                        externalEmail = node.get("externalEmailId").asText();
                    }
                    if ((externalEmail == null || externalEmail.trim().isEmpty()) && node.has("fromEmailToCustomer")) {
                        externalEmail = node.get("fromEmailToCustomer").asText();
                    }
                    if ((externalName == null || externalName.trim().isEmpty()) && node.has("externalName")) {
                        externalName = node.get("externalName").asText();
                    }
                } catch (Exception ignored) {}
            }

            if (externalName == null || externalName.trim().isEmpty()) {
                externalName = schedule.getAuditor() != null ? schedule.getAuditor() : "External Auditor";
            }

            // Check if already marked IN for external auditor
            List<AuditAttendance> attendances = auditAttendanceRepository.findByAuditSchId(schedule.getId());
            if (attendances == null || attendances.isEmpty()) {
                attendances = auditAttendanceRepository.findByAuditScheduleNo(schedule.getScheduleNo());
            }

            boolean alreadyMarkedIn = false;
            if (attendances != null) {
                for (AuditAttendance att : attendances) {
                    boolean isMatchingExt = (att.getEmployeeId() == null) ||
                            (att.getEmployeeCode() != null && email != null && att.getEmployeeCode().equalsIgnoreCase("EXT:" + email.trim())) ||
                            (att.getExternalName() != null && !att.getExternalName().trim().isEmpty());
                    if (isMatchingExt && att.getInTime() != null && !att.getInTime().trim().isEmpty()) {
                        alreadyMarkedIn = true;
                        break;
                    }
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("valid", true);
            response.put("scheduleNo", schedule.getScheduleNo());
            response.put("auditType", schedule.getAuditType());
            response.put("auditArea", schedule.getAuditArea());
            response.put("department", schedule.getDepartment());
            response.put("auditee", schedule.getAuditee());
            response.put("auditor", schedule.getAuditor());
            response.put("auditDate", schedule.getAuditDate());
            response.put("startTime", schedule.getStartTime());
            response.put("endTime", schedule.getEndTime());
            response.put("externalName", externalName);
            response.put("externalEmail", externalEmail != null ? externalEmail : email);
            response.put("alreadyMarkedIn", alreadyMarkedIn);
            response.put("linkExpired", alreadyMarkedIn);
            if (alreadyMarkedIn) {
                response.put("message", "This attendance link has expired because attendance has already been recorded.");
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error validating external link: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("valid", false, "message", "Server error validating attendance link."));
        }
    }

    @PostMapping("/mark-in")
    public ResponseEntity<?> markIn(@RequestBody Map<String, String> payload) {
        try {
            String scheduleNo = payload.get("scheduleNo");
            String email = payload.get("email");
            
            if (scheduleNo == null || email == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Missing schedule number or email."));
            }

            Optional<AuditSchedule> scheduleOpt = auditScheduleRepository.findByScheduleNo(scheduleNo.trim());
            if (scheduleOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid schedule number: " + scheduleNo));
            }
            
            AuditSchedule schedule = scheduleOpt.get();
            String status = schedule.getStatus() != null ? schedule.getStatus().trim().toUpperCase() : "";
            if ("CLOSED".equals(status) || "CANCELLED".equals(status)) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "This audit schedule is " + status.toLowerCase() + ". Attendance cannot be marked."));
            }

            String externalName = schedule.getExternalName();
            String externalEmail = schedule.getExternalEmailId();
            if (schedule.getAuditeeDetails() != null) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(schedule.getAuditeeDetails());
                    if ((externalName == null || externalName.trim().isEmpty()) && node.has("externalName")) {
                        externalName = node.get("externalName").asText();
                    }
                    if ((externalEmail == null || externalEmail.trim().isEmpty()) && node.has("externalEmailId")) {
                        externalEmail = node.get("externalEmailId").asText();
                    }
                } catch (Exception ignored) {}
            }
            if (externalName == null || externalName.trim().isEmpty()) {
                externalName = schedule.getAuditor() != null ? schedule.getAuditor() : "External Auditor";
            }

            // Check if already marked IN
            List<AuditAttendance> attendances = auditAttendanceRepository.findByAuditSchId(schedule.getId());
            if (attendances == null || attendances.isEmpty()) {
                attendances = auditAttendanceRepository.findByAuditScheduleNo(schedule.getScheduleNo());
            }

            AuditAttendance existingUnmarked = null;
            if (attendances != null) {
                for (AuditAttendance att : attendances) {
                    boolean isMatchingExt = (att.getEmployeeId() == null) ||
                            (att.getEmployeeCode() != null && att.getEmployeeCode().equalsIgnoreCase("EXT:" + email.trim())) ||
                            (att.getExternalName() != null && !att.getExternalName().trim().isEmpty());
                    if (isMatchingExt) {
                        if (att.getInTime() != null && !att.getInTime().trim().isEmpty()) {
                            Map<String, Object> resp = new HashMap<>();
                            resp.put("success", true);
                            resp.put("alreadyMarked", true);
                            resp.put("linkExpired", true);
                            resp.put("inTime", att.getInTime());
                            resp.put("externalName", externalName);
                            resp.put("scheduleNo", schedule.getScheduleNo());
                            resp.put("auditType", schedule.getAuditType());
                            resp.put("auditArea", schedule.getAuditArea());
                            resp.put("department", schedule.getDepartment());
                            resp.put("auditee", schedule.getAuditee());
                            resp.put("auditor", schedule.getAuditor());
                            resp.put("auditDate", schedule.getAuditDate());
                            resp.put("startTime", schedule.getStartTime());
                            resp.put("endTime", schedule.getEndTime());
                            resp.put("message", "This attendance link has expired because attendance has already been recorded.");
                            return ResponseEntity.ok(resp);
                        } else if (existingUnmarked == null) {
                            existingUnmarked = att;
                        }
                    }
                }
            }

            LocalTime nowTime = LocalTime.now(ZoneId.of("Asia/Kolkata"));
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("hh:mm a", java.util.Locale.ENGLISH);
            String formattedInTime = nowTime.format(formatter);

            if (existingUnmarked != null) {
                existingUnmarked.setInTime(formattedInTime);
                existingUnmarked.setAttendanceStatus("PRESENT");
                if (existingUnmarked.getExternalName() == null || existingUnmarked.getExternalName().trim().isEmpty()) {
                    existingUnmarked.setExternalName(externalName);
                }
                if (existingUnmarked.getName() == null || existingUnmarked.getName().trim().isEmpty()) {
                    existingUnmarked.setName(externalName);
                }
                auditAttendanceRepository.save(existingUnmarked);
            } else {
                AuditAttendance newAtt = new AuditAttendance();
                newAtt.setAuditSchedule(schedule);
                newAtt.setAuditSchId(schedule.getId());
                newAtt.setAuditScheduleNo(schedule.getScheduleNo());
                newAtt.setEmployeeCode("EXT:" + email.trim());
                newAtt.setEmployeeId(null);
                newAtt.setExternalName(externalName);
                newAtt.setName(externalName);
                newAtt.setInTime(formattedInTime);
                newAtt.setAttendanceStatus("PRESENT");
                auditAttendanceRepository.save(newAtt);
            }
            
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("alreadyMarked", false);
            resp.put("linkExpired", false);
            resp.put("inTime", formattedInTime);
            resp.put("externalName", externalName);
            resp.put("scheduleNo", schedule.getScheduleNo());
            resp.put("auditType", schedule.getAuditType());
            resp.put("auditArea", schedule.getAuditArea());
            resp.put("department", schedule.getDepartment());
            resp.put("auditee", schedule.getAuditee());
            resp.put("auditor", schedule.getAuditor());
            resp.put("auditDate", schedule.getAuditDate());
            resp.put("startTime", schedule.getStartTime());
            resp.put("endTime", schedule.getEndTime());
            resp.put("message", "Attendance marked successfully.");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Error marking in: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Server error while recording attendance."));
        }
    }

    private LocalTime parseTime(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) {
            return null;
        }
        try {
            String trimmed = timeStr.trim();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("hh:mm a", java.util.Locale.ENGLISH);
            return LocalTime.parse(trimmed, formatter);
        } catch (Exception e) {
            try {
                String formatted = timeStr.trim().replaceAll("(?i)(\\d{2}:\\d{2})\\s*(AM|PM)", "$1 $2");
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("hh:mm a", java.util.Locale.ENGLISH);
                return LocalTime.parse(formatted, formatter);
            } catch (Exception ex) {
                return null;
            }
        }
    }
}
