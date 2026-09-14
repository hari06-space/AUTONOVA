package com.autonoma.erp.modules.qms.meeting.controller;

import com.autonoma.erp.modules.qms.meeting.dto.MeetingConfigSummaryDTO;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingMaster;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingSchedule;
import com.autonoma.erp.modules.qms.meeting.entity.QmsScheduleMeetingConfig;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingMasterRepository;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingScheduleRepository;
import com.autonoma.erp.modules.qms.meeting.repository.QmsScheduleMeetingConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/qms/meeting-configs")
public class QmsScheduleMeetingConfigController {

    private final QmsScheduleMeetingConfigRepository configRepository;
    private final QmsMeetingMasterRepository meetingMasterRepository;
    private final QmsMeetingScheduleRepository scheduleRepository;
    private final com.autonoma.erp.modules.qms.meeting.service.QmsMeetingScheduleService scheduleService;

    @org.springframework.beans.factory.annotation.Autowired
    public QmsScheduleMeetingConfigController(
            QmsScheduleMeetingConfigRepository configRepository,
            QmsMeetingMasterRepository meetingMasterRepository,
            QmsMeetingScheduleRepository scheduleRepository,
            com.autonoma.erp.modules.qms.meeting.service.QmsMeetingScheduleService scheduleService) {
        this.configRepository = configRepository;
        this.meetingMasterRepository = meetingMasterRepository;
        this.scheduleRepository = scheduleRepository;
        this.scheduleService = scheduleService;
    }

    @GetMapping
    public ResponseEntity<List<MeetingConfigSummaryDTO>> getAllConfigs() {
        List<QmsScheduleMeetingConfig> configs = configRepository.findAll();
        List<MeetingConfigSummaryDTO> result = new ArrayList<>();

        for (QmsScheduleMeetingConfig config : configs) {
            MeetingConfigSummaryDTO dto = new MeetingConfigSummaryDTO();
            dto.setId(config.getId());
            dto.setStatus(config.getStatus() != null ? config.getStatus() : false);

            // Fetch meeting details
            if (config.getMeetingTypeId() != null) {
                Optional<QmsMeetingMaster> meetingOpt = meetingMasterRepository.findById(config.getMeetingTypeId().intValue());
                if (meetingOpt.isPresent()) {
                    QmsMeetingMaster meeting = meetingOpt.get();
                    dto.setMeetingType(meeting.getMeetingName());
                    dto.setAgenda(meeting.getMeetingAgenda());
                    dto.setDescription(meeting.getMeetingDescription());
                }
            } else if (config.getMeetingId() != null) {
                // Fallback to meetingId if meetingTypeId is null
                Optional<QmsMeetingMaster> meetingOpt = meetingMasterRepository.findById(config.getMeetingId().intValue());
                if (meetingOpt.isPresent()) {
                    QmsMeetingMaster meeting = meetingOpt.get();
                    dto.setMeetingType(meeting.getMeetingName());
                    dto.setAgenda(meeting.getMeetingAgenda());
                    dto.setDescription(meeting.getMeetingDescription());
                }
            }

            // Fetch latest created schedule for this config
            boolean skipConfig = false;
            java.util.List<QmsMeetingSchedule> allSchedules = scheduleRepository.findByConfigIdOrderByIdDesc(config.getId());
            java.util.List<QmsMeetingSchedule> schedules = new java.util.ArrayList<>();
            if (allSchedules != null) {
                for (QmsMeetingSchedule s : allSchedules) {
                    if (s.getRevNo() == null || s.getRevNo() == 0) {
                        schedules.add(s);
                    }
                }
            }
            if (schedules != null && !schedules.isEmpty()) {
                QmsMeetingSchedule latestSched = schedules.get(0);
                String st = latestSched.getStatus();
                if ("SHORT CLOSED".equalsIgnoreCase(st) || "CANCELLED".equalsIgnoreCase(st)) {
                    skipConfig = true;
                } else {
                    dto.setScheduleId(latestSched.getScheduleNo());
                    dto.setSubject(latestSched.getSubject());
                    if (latestSched.getHostBy() != null) dto.setHost(latestSched.getHostBy().getEmployeeName());
                    if (latestSched.getChairedBy() != null) dto.setHead(latestSched.getChairedBy().getEmployeeName());
                    if (latestSched.getParticipants() != null && !latestSched.getParticipants().isEmpty()) {
                        List<String> pNames = latestSched.getParticipants().stream()
                            .map(p -> p.getEmployee() != null ? p.getEmployee().getEmployeeName() : null)
                            .filter(java.util.Objects::nonNull).toList();
                        dto.setParticipants(!pNames.isEmpty() ? String.join(", ", pNames) : latestSched.getParticipants().size() + " Participant(s)");
                    }
                    if (latestSched.getDepartments() != null && !latestSched.getDepartments().isEmpty()) {
                        List<String> dNames = latestSched.getDepartments().stream()
                            .map(d -> d.getDepartment() != null ? d.getDepartment().getDepartmentName() : null)
                            .filter(java.util.Objects::nonNull).toList();
                        dto.setDepartment(!dNames.isEmpty() ? String.join(", ", dNames) : latestSched.getDepartments().size() + " Department(s)");
                    }
                }
            } else if (config.getMeetingId() != null) {
                Optional<QmsMeetingSchedule> schedOpt = scheduleRepository.findById(config.getMeetingId());
                if (schedOpt.isPresent()) {
                    QmsMeetingSchedule sched = schedOpt.get();
                    String st = sched.getStatus();
                    if ("SHORT CLOSED".equalsIgnoreCase(st) || "CANCELLED".equalsIgnoreCase(st)) {
                        skipConfig = true;
                    } else {
                        dto.setScheduleId(sched.getScheduleNo());
                        dto.setSubject(sched.getSubject());
                        if (sched.getHostBy() != null) dto.setHost(sched.getHostBy().getEmployeeName());
                        if (sched.getChairedBy() != null) dto.setHead(sched.getChairedBy().getEmployeeName());
                        dto.setTime((config.getStartTime() != null ? config.getStartTime().toString() : "") + (config.getEndTime() != null ? " - " + config.getEndTime().toString() : ""));
                        if (sched.getParticipants() != null && !sched.getParticipants().isEmpty()) {
                            List<String> pNames = sched.getParticipants().stream()
                                .map(p -> p.getEmployee() != null ? p.getEmployee().getEmployeeName() : null)
                                .filter(java.util.Objects::nonNull).toList();
                            dto.setParticipants(!pNames.isEmpty() ? String.join(", ", pNames) : sched.getParticipants().size() + " Participant(s)");
                        }
                        if (sched.getDepartments() != null && !sched.getDepartments().isEmpty()) {
                            List<String> dNames = sched.getDepartments().stream()
                                .map(d -> d.getDepartment() != null ? d.getDepartment().getDepartmentName() : null)
                                .filter(java.util.Objects::nonNull).toList();
                            dto.setDepartment(!dNames.isEmpty() ? String.join(", ", dNames) : sched.getDepartments().size() + " Department(s)");
                        }
                    }
                }
            }

            if (!skipConfig) {
                result.add(dto);
            }
        }

        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id, @RequestBody java.util.Map<String, Boolean> body) {
        Optional<QmsScheduleMeetingConfig> opt = configRepository.findById(id);
        if (opt.isPresent()) {
            QmsScheduleMeetingConfig config = opt.get();
            Boolean newStatus = body.get("status");
            config.setStatus(newStatus != null ? newStatus : false);
            configRepository.save(config);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/migrate-schedules")
    public ResponseEntity<?> migrateSchedules(@RequestBody(required = false) java.util.Map<String, Object> body) {
        try {
            scheduleService.migratePreviousSchedules();
            return ResponseEntity.ok(java.util.Map.of("message", "Schedules migrated successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/delete-all")
    public ResponseEntity<?> deleteAllMeetingConfigs() {
        try {
            scheduleService.deleteAllMeetingConfigs();
            return ResponseEntity.ok(java.util.Map.of("message", "All meeting configurations deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", e.getMessage()));
        }
    }
}
