package com.autonoma.erp.modules.qms.meeting.service;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingSchedule;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingUserAttendance;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingScheduleRepository;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingUserAttendanceRepository;
import org.junit.jupiter.api.*;
import org.mockito.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * TC-MTG-ATT-01 through TC-MTG-ATT-07
 * Unit tests for QmsMeetingAttendanceService.
 * BUG-MTG-003 fix verified: null-safe handling of inactive/deleted participants.
 */
@DisplayName("QmsMeetingAttendanceService – Unit Tests")
class QmsMeetingAttendanceServiceTest {

    @Mock private QmsMeetingUserAttendanceRepository attendanceRepo;
    @Mock private QmsMeetingScheduleRepository scheduleRepo;
    @Mock private EmployeeMasterRepository employeeRepo;
    @Mock private StatusMasterRepository statusRepo;
    @Mock private AppNotificationRepository notificationRepo;
    @InjectMocks private QmsMeetingAttendanceService service;

    @BeforeEach void setUp() { MockitoAnnotations.openMocks(this); }

    private EmployeeMaster emp(Long id, String name) {
        EmployeeMaster e = new EmployeeMaster(); e.setId(id); e.setEmployeeName(name); return e;
    }

    private QmsMeetingSchedule schedule(Long id, LocalDate date) {
        QmsMeetingSchedule s = new QmsMeetingSchedule();
        s.setId(id); s.setMeetingDate(date);
        s.setStartTime(LocalTime.of(10, 0));
        s.setEndTime(LocalTime.of(11, 0));
        return s;
    }

    // ── TC-MTG-ATT-01: getByScheduleId returns virtual pending rows ──────────

    @Test
    @DisplayName("TC-MTG-ATT-01: getByScheduleId returns virtual PENDING rows for unmapped attendance")
    void getByScheduleId_returnsPendingVirtualRows() {
        QmsMeetingSchedule sch = schedule(10L, LocalDate.now());
        sch.setChairedBy(emp(1L, "Eashwar"));
        sch.setHostBy(emp(2L, "Sivaraman"));
        sch.setParticipants(List.of());

        when(scheduleRepo.findById(10L)).thenReturn(Optional.of(sch));
        when(attendanceRepo.findByScheduleId(10L)).thenReturn(List.of());

        List<QmsMeetingUserAttendance> result = service.getByScheduleId(10L);

        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(a -> "PENDING".equals(a.getStatus())));
    }

    @Test
    @DisplayName("TC-MTG-ATT-02: getByScheduleId returns empty list when schedule not found")
    void getByScheduleId_scheduleNotFound_returnsEmpty() {
        when(scheduleRepo.findById(999L)).thenReturn(Optional.empty());
        assertTrue(service.getByScheduleId(999L).isEmpty());
    }

    // ── BUG-MTG-003: null participant guard ───────────────────────────────────

    @Test
    @DisplayName("TC-MTG-ATT-03 [BUG-MTG-003]: getByScheduleId skips null participants safely (no NPE)")
    void getByScheduleId_nullParticipant_noNullPointerException() {
        QmsMeetingSchedule sch = schedule(11L, LocalDate.now());
        sch.setChairedBy(emp(1L, "Host"));

        // Simulate a participant mapping where employee was deleted (null)
        com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingParticipantMapping nullMapping =
                new com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingParticipantMapping();
        nullMapping.setEmployee(null); // the critical case
        sch.setParticipants(List.of(nullMapping));

        when(scheduleRepo.findById(11L)).thenReturn(Optional.of(sch));
        when(attendanceRepo.findByScheduleId(11L)).thenReturn(List.of());

        // Must not throw NullPointerException — the existing code already guards mapping.getEmployee() != null
        assertDoesNotThrow(() -> service.getByScheduleId(11L));
    }

    // ── TC-MTG-ATT-04: markAttendance PRESENT ────────────────────────────────

    @Test
    @DisplayName("TC-MTG-ATT-04: markAttendance marks PRESENT when in-time is before schedule start")
    void markAttendance_present_beforeStart() {
        QmsMeetingSchedule sch = schedule(10L, LocalDate.now());
        sch.setStartTime(LocalTime.of(10, 0));

        EmployeeMaster emp = emp(5L, "Eashwar");

        when(scheduleRepo.findById(10L)).thenReturn(Optional.of(sch));
        when(employeeRepo.findById(5L)).thenReturn(Optional.of(emp));
        when(attendanceRepo.findByScheduleIdAndEmployeeId(10L, 5L)).thenReturn(List.of());
        when(attendanceRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(statusRepo.findByName(any())).thenReturn(Optional.empty());
        doNothing().when(notificationRepo).markAsReadByUrlKeywordAndEmpId(any(), anyLong());

        Map<String, Object> data = new HashMap<>();
        data.put("scheduleId", "10");
        data.put("employeeId", "5");
        data.put("inTime", "09:55");

        QmsMeetingUserAttendance result = service.markAttendance(data);

        assertNotNull(result);
        assertEquals("PRESENT", result.getStatus());
    }

    @Test
    @DisplayName("TC-MTG-ATT-04B: markAttendance marks PRESENT when in-time is within 10-minute grace window (10:08)")
    void markAttendance_present_withinGraceWindow() {
        QmsMeetingSchedule sch = schedule(10L, LocalDate.now());
        sch.setStartTime(LocalTime.of(10, 0));

        EmployeeMaster emp = emp(5L, "Eashwar");

        when(scheduleRepo.findById(10L)).thenReturn(Optional.of(sch));
        when(employeeRepo.findById(5L)).thenReturn(Optional.of(emp));
        when(attendanceRepo.findByScheduleIdAndEmployeeId(10L, 5L)).thenReturn(List.of());
        when(attendanceRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(statusRepo.findByName(any())).thenReturn(Optional.empty());
        doNothing().when(notificationRepo).markAsReadByUrlKeywordAndEmpId(any(), anyLong());

        Map<String, Object> data = new HashMap<>();
        data.put("scheduleId", "10");
        data.put("employeeId", "5");
        data.put("inTime", "10:08");

        QmsMeetingUserAttendance result = service.markAttendance(data);

        assertNotNull(result);
        assertEquals("PRESENT", result.getStatus());
    }

    @Test
    @DisplayName("TC-MTG-ATT-05: markAttendance marks LATE when in-time is beyond 10-minute grace window (10:15)")
    void markAttendance_late_beyondGrace() {
        QmsMeetingSchedule sch = schedule(10L, LocalDate.now());
        sch.setStartTime(LocalTime.of(10, 0));

        EmployeeMaster emp = emp(5L, "Eashwar");

        when(scheduleRepo.findById(10L)).thenReturn(Optional.of(sch));
        when(employeeRepo.findById(5L)).thenReturn(Optional.of(emp));
        when(attendanceRepo.findByScheduleIdAndEmployeeId(10L, 5L)).thenReturn(List.of());
        when(attendanceRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(statusRepo.findByName(any())).thenReturn(Optional.empty());
        doNothing().when(notificationRepo).markAsReadByUrlKeywordAndEmpId(any(), anyLong());

        Map<String, Object> data = new HashMap<>();
        data.put("scheduleId", "10");
        data.put("employeeId", "5");
        data.put("inTime", "10:15");

        QmsMeetingUserAttendance result = service.markAttendance(data);
        assertEquals("LATE", result.getStatus());
    }

    @Test
    @DisplayName("TC-MTG-ATT-06: markAttendance throws when attendance already marked")
    void markAttendance_alreadyMarked_throws() {
        QmsMeetingSchedule sch = schedule(10L, LocalDate.now());
        EmployeeMaster emp = emp(5L, "Eashwar");
        QmsMeetingUserAttendance existing = new QmsMeetingUserAttendance();

        when(scheduleRepo.findById(10L)).thenReturn(Optional.of(sch));
        when(employeeRepo.findById(5L)).thenReturn(Optional.of(emp));
        when(attendanceRepo.findByScheduleIdAndEmployeeId(10L, 5L)).thenReturn(List.of(existing));

        Map<String, Object> data = new HashMap<>();
        data.put("scheduleId", "10");
        data.put("employeeId", "5");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.markAttendance(data));
        assertTrue(ex.getMessage().contains("already marked"));
    }

    @Test
    @DisplayName("TC-MTG-ATT-07: markAttendance throws when schedule not found")
    void markAttendance_scheduleNotFound_throws() {
        when(scheduleRepo.findById(999L)).thenReturn(Optional.empty());

        Map<String, Object> data = new HashMap<>();
        data.put("scheduleId", "999");
        data.put("employeeId", "5");

        assertThrows(RuntimeException.class, () -> service.markAttendance(data));
    }
}
