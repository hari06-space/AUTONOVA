package com.autonoma.erp.modules.qms.audit.service;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository;
import com.autonoma.erp.modules.qms.audit.entity.AuditAttendance;
import com.autonoma.erp.modules.qms.audit.entity.AuditSchedule;
import com.autonoma.erp.modules.qms.audit.repository.AuditAttendanceRepository;
import com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("AuditAttendanceService – Unit Tests")
class AuditAttendanceServiceTest {

    @Mock private AuditAttendanceRepository attendanceRepository;
    @Mock private AuditScheduleRepository scheduleRepository;
    @Mock private AppNotificationRepository appNotificationRepository;
    @Mock private EmployeeMasterRepository employeeMasterRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private AuditAttendanceService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("SUPER BOSS", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private Date toDate(LocalDate localDate) {
        return Date.from(localDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
    }

    @Test
    @DisplayName("TC-AUD-ATT-01: saveAttendance marks PRESENT when within 10-minute grace window")
    void saveAttendance_withinGraceWindow_marksPresent() {
        AuditSchedule schedule = new AuditSchedule();
        schedule.setId(100L);
        schedule.setScheduleNo("AUD-2026-001");
        schedule.setAuditDate(toDate(LocalDate.now()));
        schedule.setStartTime("10:00");
        schedule.setStatus("SCHEDULED");

        when(scheduleRepository.findByScheduleNoIgnoreCase("AUD-2026-001")).thenReturn(Optional.of(schedule));
        when(attendanceRepository.findByAuditScheduleNoAndEmployeeCode(any(), any())).thenReturn(Optional.empty());
        when(attendanceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AuditAttendance attendance = new AuditAttendance();
        attendance.setAuditScheduleNo("AUD-2026-001");
        attendance.setEmployeeCode("EMP001");
        attendance.setName("Eashwar Auditor");
        attendance.setInTime("10:05");

        AuditAttendance result = service.saveAttendance(attendance);

        assertNotNull(result);
        assertEquals("PRESENT", result.getAttendanceStatus());
    }

    @Test
    @DisplayName("TC-AUD-ATT-02: saveAttendance marks LATE when in-time is beyond 10-minute grace window (10:15)")
    void saveAttendance_beyondGraceWindow_marksLate() {
        AuditSchedule schedule = new AuditSchedule();
        schedule.setId(100L);
        schedule.setScheduleNo("AUD-2026-001");
        schedule.setAuditDate(toDate(LocalDate.now()));
        schedule.setStartTime("10:00");
        schedule.setStatus("SCHEDULED");

        when(scheduleRepository.findByScheduleNoIgnoreCase("AUD-2026-001")).thenReturn(Optional.of(schedule));
        when(attendanceRepository.findByAuditScheduleNoAndEmployeeCode(any(), any())).thenReturn(Optional.empty());
        when(attendanceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AuditAttendance attendance = new AuditAttendance();
        attendance.setAuditScheduleNo("AUD-2026-001");
        attendance.setEmployeeCode("EMP001");
        attendance.setName("Eashwar Auditor");
        attendance.setInTime("10:15");

        AuditAttendance result = service.saveAttendance(attendance);

        assertNotNull(result);
        assertEquals("LATE", result.getAttendanceStatus());
    }

    @Test
    @DisplayName("TC-AUD-ATT-03: saveAttendance rejects check-in if schedule is closed")
    void saveAttendance_closedSchedule_throwsException() {
        AuditSchedule schedule = new AuditSchedule();
        schedule.setId(100L);
        schedule.setScheduleNo("AUD-2026-001");
        schedule.setStatus("CLOSED");

        when(scheduleRepository.findByScheduleNoIgnoreCase("AUD-2026-001")).thenReturn(Optional.of(schedule));

        AuditAttendance attendance = new AuditAttendance();
        attendance.setAuditScheduleNo("AUD-2026-001");
        attendance.setEmployeeCode("EMP001");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.saveAttendance(attendance));
        assertTrue(ex.getMessage().contains("Cannot mark or modify attendance for a closed"));
    }
}
