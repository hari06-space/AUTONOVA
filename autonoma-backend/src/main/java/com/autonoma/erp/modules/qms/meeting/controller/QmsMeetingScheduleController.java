package com.autonoma.erp.modules.qms.meeting.controller;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingSchedule;
import com.autonoma.erp.modules.qms.meeting.service.QmsMeetingScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import jakarta.validation.Valid;
import com.autonoma.erp.security.RequirePagePermission;

@RestController
@RequestMapping("/api/qms/meeting-schedules")
@CrossOrigin(origins = "*")
public class QmsMeetingScheduleController {
    private final QmsMeetingScheduleService service;

    @org.springframework.beans.factory.annotation.Autowired
    public QmsMeetingScheduleController(QmsMeetingScheduleService service) {
        this.service = service;
    }

    @GetMapping("/unallocated-resources")
    public ResponseEntity<?> getUnallocatedResources() {
        return ResponseEntity.ok(service.getUnallocatedResources());
    }

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "searchValue", required = false) String searchValue,
            @RequestParam(name = "searchBy", required = false) String searchBy,
            @RequestParam(name = "scheduleNo", required = false) String scheduleNo,
            @RequestParam(name = "meetingTypeId", required = false) Long meetingTypeId,
            @RequestParam(name = "meetingType", required = false) String meetingType,
            @RequestParam(name = "createdAtFrom", required = false) String createdAtFrom,
            @RequestParam(name = "createdAtTo", required = false) String createdAtTo,
            @RequestParam(name = "considerDate", required = false, defaultValue = "No") String considerDate,
            @RequestParam(name = "meetingDateFrom", required = false) String meetingDateFrom,
            @RequestParam(name = "meetingDateTo", required = false) String meetingDateTo,
            @RequestParam(name = "meetingDateConsider", required = false, defaultValue = "No") String meetingDateConsider,
            @RequestParam(name = "includeDraft", required = false, defaultValue = "false") Boolean includeDraft,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "maxResult", required = false) Integer maxResult,
            @RequestParam(name = "taskScope", required = false) String taskScope,
            @RequestParam(name = "currentUser", required = false) String currentUser,
            @RequestParam(name = "memberId", required = false) Long memberId) {
        if (page == null && size == null) {
            return ResponseEntity.ok(service.searchMeetingSchedulesList(status, searchValue, searchBy, scheduleNo, meetingTypeId, meetingType, createdAtFrom, createdAtTo, considerDate, meetingDateFrom, meetingDateTo, meetingDateConsider, includeDraft, maxResult, taskScope, currentUser, memberId));
        }
        int cleanPage = page != null ? page : 0;
        int cleanSize = size != null ? size : 10;
        int cappedSize = Math.min(cleanSize, 100);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(cleanPage, cappedSize);
        return ResponseEntity.ok(service.searchMeetingSchedules(status, searchValue, searchBy, scheduleNo, meetingTypeId, meetingType, createdAtFrom, createdAtTo, considerDate, meetingDateFrom, meetingDateTo, meetingDateConsider, includeDraft, pageable, taskScope, currentUser, memberId));
    }

    @GetMapping("/active")
    public List<QmsMeetingSchedule> getActive() {
        return service.getActiveSchedules();
    }

    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<QmsMeetingSchedule> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getScheduleById(id));
    }

    @PostMapping
    @RequirePagePermission(pageCode = "QM1310", action = "write")
    public ResponseEntity<QmsMeetingSchedule> create(@Valid @RequestBody QmsMeetingSchedule schedule) {
        return ResponseEntity.ok(service.saveSchedule(schedule));
    }

    @PutMapping("/{id:[0-9]+}")
    @RequirePagePermission(pageCode = "QM1310", action = "write")
    public ResponseEntity<QmsMeetingSchedule> update(@PathVariable Long id, @Valid @RequestBody QmsMeetingSchedule schedule) {
        schedule.setId(id);
        return ResponseEntity.ok(service.saveSchedule(schedule));
    }

    @DeleteMapping("/{id:[0-9]+}")
    @RequirePagePermission(pageCode = "QM1310", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.deleteSchedule(id);
            return ResponseEntity.noContent().build();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Cannot delete this schedule because it is actively linked to existing Meeting Minutes (MOM) records. Please delete the associated MOMs first."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Failed to delete schedule: " + e.getMessage()));
        }
    }

    @GetMapping("/eligible-employees")
    public ResponseEntity<List<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster>> getEligibleEmployees(
            @RequestParam("meetingTypeId") Integer meetingTypeId,
            @RequestParam(name = "role", required = false) String role,
            @RequestParam(name = "departmentIds", required = false) List<Long> departmentIds) {
        return ResponseEntity.ok(service.getEligibleEmployees(meetingTypeId, role, departmentIds));
    }

    @PostMapping("/enter-meeting")
    public ResponseEntity<QmsMeetingSchedule> enterMeeting(
            @RequestParam(name = "scheduleNo", required = false) String scheduleNo,
            @RequestParam(name = "scheduleId", required = false) Long scheduleId) {
        if (scheduleId != null) {
            return ResponseEntity.ok(service.closeScheduleById(scheduleId));
        } else if (scheduleNo != null && !scheduleNo.trim().isEmpty()) {
            return ResponseEntity.ok(service.closeScheduleByNo(scheduleNo));
        } else {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/close-by-no/{scheduleNo}")
    public ResponseEntity<QmsMeetingSchedule> closeByScheduleNo(@PathVariable String scheduleNo) {
        return ResponseEntity.ok(service.closeScheduleByNo(scheduleNo));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<QmsMeetingSchedule> cancelSchedule(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> payload) {
        String reason = payload != null ? payload.get("reason") : null;
        return ResponseEntity.ok(service.cancelSchedule(id, reason));
    }

    @PostMapping("/bulk-cancel")
    public ResponseEntity<?> bulkCancelSchedules(
            @RequestBody java.util.Map<String, Object> payload) {
        @SuppressWarnings("unchecked")
        List<Integer> idsInt = (List<Integer>) payload.get("ids");
        String reason = (String) payload.get("reason");
        if (idsInt != null && !idsInt.isEmpty()) {
            List<Long> ids = idsInt.stream().map(Long::valueOf).collect(java.util.stream.Collectors.toList());
            service.cancelSchedules(ids, reason);
        }
        return ResponseEntity.ok(java.util.Map.of("message", "Schedules cancelled successfully"));
    }

    @GetMapping("/today-alarms")
    public ResponseEntity<?> getTodayAlarms(@RequestParam(required = false) Long employeeId) {
        Long empId = employeeId != null ? employeeId : com.autonoma.erp.util.SecurityUtils.getCurrentUserEmpId();
        return ResponseEntity.ok(service.getTodayUpcomingAlarmsForEmployee(empId));
    }

    @GetMapping("/pending-reminders")
    public ResponseEntity<?> getPendingReminders() {
        Long empId = com.autonoma.erp.util.SecurityUtils.getCurrentUserEmpId();
        return ResponseEntity.ok(service.getPendingRemindersForEmployee(empId));
    }

    @PostMapping("/{scheduleId}/acknowledge-reminder")
    public ResponseEntity<?> acknowledgeReminder(@PathVariable Long scheduleId) {
        Long empId = com.autonoma.erp.util.SecurityUtils.getCurrentUserEmpId();
        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        boolean success = service.acknowledgeReminder(scheduleId, empId, userId);
        return ResponseEntity.ok(java.util.Map.of("success", success, "message", "Reminder acknowledged successfully"));
    }
}

