package com.autonoma.erp.modules.hr.attendance.service;

import com.autonoma.erp.model.OdEntry;
import com.autonoma.erp.modules.hr.attendance.dto.AttendanceDailyLogDTO;
import com.autonoma.erp.modules.hr.attendance.entity.HrAttendanceDailyLog;
import com.autonoma.erp.modules.hr.attendance.repository.HrAttendanceDailyLogRepository;
import com.autonoma.erp.modules.hr.attendance.repository.HrBiometricAttendanceRepository;
import com.autonoma.erp.modules.hr.attendance.repository.ShiftMasterRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.leave.entity.LeaveEntry;
import com.autonoma.erp.modules.hr.leave.repository.LeaveEntryRepository;
import com.autonoma.erp.modules.platform.identity.entity.PermissionEntry;
import com.autonoma.erp.modules.platform.identity.repository.PermissionEntryRepository;
import com.autonoma.erp.repository.OdEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AttendanceDailyLogServiceTest {

    @Mock
    private HrAttendanceDailyLogRepository dailyLogRepository;

    @Mock
    private HrBiometricAttendanceRepository biometricRepository;

    @Mock
    private ShiftMasterRepository shiftMasterRepository;

    @Mock
    private EmployeeMasterRepository employeeRepository;

    @Mock
    private OdEntryRepository odEntryRepository;

    @Mock
    private LeaveEntryRepository leaveEntryRepository;

    @Mock
    private PermissionEntryRepository permissionEntryRepository;

    @InjectMocks
    private AttendanceDailyLogService attendanceDailyLogService;

    private EmployeeMaster emp;
    private LocalDate testDate;

    @BeforeEach
    void setUp() {
        testDate = LocalDate.of(2026, 7, 31);

        emp = new EmployeeMaster();
        emp.setId(101L);
        emp.setEmpCode("NT1001");
        emp.setOldEmpCode("OLD-NT1001");
        emp.setEmployeeName("Vijay D");
    }

    @Test
    @DisplayName("Test 1: Worked duration < 50% shift hours automatically classifies as HD (Half Day)")
    void testCalculateMetrics_HalfDayClassification() {
        AttendanceDailyLogDTO dto = new AttendanceDailyLogDTO();
        dto.setInTime(LocalTime.of(9, 0));
        dto.setOutTime(LocalTime.of(12, 0)); // Worked 3 hours (180 mins) out of 8 hours (480 mins)
        dto.setShiftStartTime("09:00");
        dto.setShiftEndTime("18:00");

        AttendanceDailyLogDTO result = attendanceDailyLogService.calculateMetrics(dto);

        assertEquals(180, result.getDuration());
        assertEquals("HD", result.getAttType(), "Worked duration < 50% of shift hours must be classified as HD (Half Day)");
    }

    @Test
    @DisplayName("Test 2: Worked duration >= 50% shift hours classifies as Present")
    void testCalculateMetrics_FullDayPresentClassification() {
        AttendanceDailyLogDTO dto = new AttendanceDailyLogDTO();
        dto.setInTime(LocalTime.of(9, 0));
        dto.setOutTime(LocalTime.of(17, 0)); // Worked 8 hours (480 mins)
        dto.setShiftStartTime("09:00");
        dto.setShiftEndTime("18:00");

        AttendanceDailyLogDTO result = attendanceDailyLogService.calculateMetrics(dto);

        assertEquals(480, result.getDuration());
        assertEquals("Present", result.getAttType());
    }

    @Test
    @DisplayName("Test 3: Approved OD entry automatically overrides an existing Absent log")
    void testLoadDailyAttendance_ApprovedOdOverridesAbsentLog() {
        when(employeeRepository.findAll()).thenReturn(List.of(emp));
        when(biometricRepository.findByAttendanceDateBetween(testDate, testDate)).thenReturn(Collections.emptyList());

        // Existing log is Absent
        HrAttendanceDailyLog existingLog = new HrAttendanceDailyLog();
        existingLog.setId(500L);
        existingLog.setEmpId(101L);
        existingLog.setAttendanceDate(testDate);
        existingLog.setAttType("Absent");
        existingLog.setFromWhere("MANUAL");
        when(dailyLogRepository.findByAttendanceDate(testDate)).thenReturn(List.of(existingLog));

        // Approved OD Entry exists
        OdEntry od = new OdEntry();
        od.setEmployeeId(101L);
        od.setOdNumber("OD-26-00001");
        od.setPurposeOfOd("Client Site Inspection");
        od.setStatusId(10007L); // Verified / Approved
        when(odEntryRepository.findByDateRange(any(Date.class), any(Date.class))).thenReturn(List.of(od));

        List<AttendanceDailyLogDTO> result = attendanceDailyLogService.loadDailyAttendance(testDate);

        assertNotNull(result);
        assertEquals(1, result.size());
        AttendanceDailyLogDTO logDto = result.get(0);
        assertEquals("Present", logDto.getAttType());
        assertEquals("OD", logDto.getFromWhere());
        assertTrue(logDto.getRemarks().contains("Client Site Inspection"));
    }

    @Test
    @DisplayName("Test 4: Approved Leave entry automatically overrides an existing Absent log")
    void testLoadDailyAttendance_ApprovedLeaveOverridesAbsentLog() {
        when(employeeRepository.findAll()).thenReturn(List.of(emp));
        when(biometricRepository.findByAttendanceDateBetween(testDate, testDate)).thenReturn(Collections.emptyList());

        HrAttendanceDailyLog existingLog = new HrAttendanceDailyLog();
        existingLog.setId(501L);
        existingLog.setEmpId(101L);
        existingLog.setAttendanceDate(testDate);
        existingLog.setAttType("Absent");
        existingLog.setFromWhere("MANUAL");
        when(dailyLogRepository.findByAttendanceDate(testDate)).thenReturn(List.of(existingLog));

        // Approved Leave Entry exists
        LeaveEntry leave = new LeaveEntry();
        leave.setEmployeeId(101L);
        leave.setLeaveType("SL");
        leave.setReason("Medical Checkup");
        leave.setStatusId(10007L); // Approved
        when(leaveEntryRepository.findByDateRange(any(Date.class), any(Date.class))).thenReturn(List.of(leave));

        List<AttendanceDailyLogDTO> result = attendanceDailyLogService.loadDailyAttendance(testDate);

        assertNotNull(result);
        assertEquals(1, result.size());
        AttendanceDailyLogDTO logDto = result.get(0);
        assertEquals("SL", logDto.getAttType());
        assertEquals("LEAVE", logDto.getFromWhere());
        assertTrue(logDto.getRemarks().contains("Medical Checkup"));
    }

    @Test
    @DisplayName("Test 5: Approved Permission waives/deducts LOM (Late Coming) penalty minutes")
    void testLoadDailyAttendance_ApprovedPermissionWaivesLom() {
        when(employeeRepository.findAll()).thenReturn(List.of(emp));
        when(biometricRepository.findByAttendanceDateBetween(testDate, testDate)).thenReturn(Collections.emptyList());
        when(dailyLogRepository.findByAttendanceDate(testDate)).thenReturn(Collections.emptyList());

        // Approved Permission for 1.0 hour (60 minutes)
        PermissionEntry perm = new PermissionEntry();
        perm.setEmployeeId(101L);
        perm.setConsideredDuration(BigDecimal.valueOf(1.0));
        perm.setStatusId(10007L);
        when(permissionEntryRepository.findApprovedByDate(any(Date.class))).thenReturn(List.of(perm));

        List<AttendanceDailyLogDTO> result = attendanceDailyLogService.loadDailyAttendance(testDate);

        assertNotNull(result);
        assertEquals(1, result.size());
        AttendanceDailyLogDTO logDto = result.get(0);
        assertTrue(logDto.getRemarks().contains("[Permission Approved]"));
    }
}
