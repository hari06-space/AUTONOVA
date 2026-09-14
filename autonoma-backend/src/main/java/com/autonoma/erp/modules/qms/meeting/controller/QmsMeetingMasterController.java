package com.autonoma.erp.modules.qms.meeting.controller;

import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingSchedule;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingScheduleRepository;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingMaster;
import com.autonoma.erp.modules.qms.meeting.service.QmsMeetingMasterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.util.List;

@RestController
@RequestMapping("/api/qms/meetings")
@CrossOrigin(origins = "*")
public class QmsMeetingMasterController {

    @Autowired
    private QmsMeetingMasterService service;

    @Autowired
    private com.autonoma.erp.repository.admin.UserRepository userRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingScheduleRepository scheduleRepository;

    @GetMapping("/today")
    public ResponseEntity<?> getTodayMeetings(
            @RequestParam(value = "date", required = false) 
            @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date) {
        
        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("message", "Authentication required"));
        }
        
        java.util.Optional<com.autonoma.erp.model.admin.UserCredential> userOpt = userRepository.findByUserId(userId);
        if (!userOpt.isPresent() || userOpt.get().getEmpId() == null) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        
        Long employeeId = userOpt.get().getEmpId();
        java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
        java.time.LocalDate targetDate = date != null ? date : today;
        
        if (targetDate.isBefore(today)) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        
        List<com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingSchedule> meetings = 
                scheduleRepository.findMeetingsForUserAndDate(employeeId, today); // Always search starting from today
        
        java.time.LocalTime nowTime = java.time.LocalTime.now(java.time.ZoneId.of("Asia/Kolkata"));
        List<com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingSchedule> filteredMeetings = new java.util.ArrayList<>();
        for (com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingSchedule meeting : meetings) {
            if (meeting.getMeetingDate().isEqual(targetDate)) {
                if (meeting.getMeetingDate().isEqual(today)) {
                    java.time.LocalTime startTime = meeting.getStartTime();
                    if (startTime != null) {
                        java.time.LocalTime visibleFrom = startTime.minusMinutes(10);
                        if (nowTime.isBefore(visibleFrom)) {
                            continue;
                        }
                    }
                }
                filteredMeetings.add(meeting);
            }
        }
        
        return ResponseEntity.ok(filteredMeetings);
    }

    @GetMapping
    public List<QmsMeetingMaster> getAllMeetings() {
        return service.getAllMeetings();
    }

    @GetMapping("/{id}")
    public ResponseEntity<QmsMeetingMaster> getMeetingById(@PathVariable Integer id) {
        return service.getMeetingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M1310", action = "write")
    public QmsMeetingMaster createMeeting(@RequestBody QmsMeetingMaster meeting) {
        return service.saveMeeting(meeting);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M1310", action = "write")
    public ResponseEntity<QmsMeetingMaster> updateMeeting(@PathVariable Integer id, @RequestBody QmsMeetingMaster meeting) {
        return service.getMeetingById(id)
                .map(existing -> {
                    meeting.setId(id);
                    return ResponseEntity.ok(service.saveMeeting(meeting));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M1310", action = "delete")
    public ResponseEntity<Void> deleteMeeting(@PathVariable Integer id) {
        service.deleteMeeting(id);
        return ResponseEntity.ok().build();
    }
}
