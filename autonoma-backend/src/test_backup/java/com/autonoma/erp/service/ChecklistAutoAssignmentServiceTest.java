package com.autonoma.erp.service;

import com.autonoma.erp.modules.hr.attendance.entity.HrDailyAttendance;
import com.autonoma.erp.modules.hr.attendance.repository.HrDailyAttendanceRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster;
import com.autonoma.erp.modules.hr.holiday.repository.HrHolidayMasterRepository;
import com.autonoma.erp.modules.hr.leave.entity.HrLeaveRequest;
import com.autonoma.erp.modules.hr.leave.repository.HrLeaveRequestRepository;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository;
import com.autonoma.erp.modules.platform.notification.service.NotificationService;
import com.autonoma.erp.modules.qms.checklist.repository.ChecklistAssignmentLogRepository;
import com.autonoma.erp.modules.qms.checklist.repository.ChecklistAssignmentRepository;
import com.autonoma.erp.modules.qms.checklist.repository.MasterChecklistRepository;
import com.autonoma.erp.modules.qms.checklist.service.ChecklistAutoAssignmentService;
import com.autonoma.erp.modules.qms.checklist.service.ChecklistService;
import com.autonoma.erp.repository.admin.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ChecklistAutoAssignmentServiceTest {

    @Mock
    EmployeeMasterRepository employeeMasterRepository;
    @Mock
    EmployeeManagerMappingRepository managerMappingRepository;
    @Mock
    MasterChecklistRepository masterRepo;
    @Mock
    ChecklistAssignmentRepository assignRepo;
    @Mock
    HrLeaveRequestRepository hrLeaveRequestRepository;
    @Mock
    HrHolidayMasterRepository hrHolidayMasterRepository;
    @Mock
    HrDailyAttendanceRepository hrDailyAttendanceRepository;
    @Mock
    ChecklistAssignmentLogRepository logRepo;
    @Mock
    StatusMasterRepository statusRepo;
    @Mock
    UserRepository userRepository;
    @Mock
    AppNotificationRepository notificationRepository;
    @Mock
    ChecklistService checklistService;
    @Mock
    NotificationService notificationService;

    @InjectMocks
    ChecklistAutoAssignmentService service;

    private static final Long EMP_ID = 100L;
    private static final LocalDate DATE = LocalDate.of(2026, 6, 10);

    private EmployeeMaster activeEmployee() {
        EmployeeMaster e = new EmployeeMaster();
        e.setId(EMP_ID);
        e.setEmpCode("E100");
        e.setEmployeeName("Puru");
        e.setIsActive(true);
        e.setStatus("Active");
        return e;
    }

    @BeforeEach
    void resetDefaults() {
        when(employeeMasterRepository.findById(EMP_ID)).thenReturn(Optional.of(activeEmployee()));
        when(hrDailyAttendanceRepository.findByEmpIdAndAttendanceDate(eq(EMP_ID), any())).thenReturn(Optional.empty());
        when(hrHolidayMasterRepository.findByHolidayDateAndIsActiveTrue(any())).thenReturn(Collections.emptyList());
        when(hrLeaveRequestRepository.findApprovedLeavesOnDate(eq(EMP_ID), any())).thenReturn(Collections.emptyList());
    }

    // ---- Scenario 1: Primary Present ----
    @Test
    void scenario1_present() {
        var r = service.isEmployeeAvailable(EMP_ID, DATE);
        assertThat(r.available).isTrue();
        assertThat(r.reason).isEqualTo("EMPLOYEE_AVAILABLE");
        assertThat(r.halfDay).isFalse();
    }

    // ---- Scenario: Employee Inactive ----
    @Test
    void scenarioEmployeeInactive() {
        EmployeeMaster e = activeEmployee();
        e.setIsActive(false);
        when(employeeMasterRepository.findById(EMP_ID)).thenReturn(Optional.of(e));
        var r = service.isEmployeeAvailable(EMP_ID, DATE);
        assertThat(r.available).isFalse();
        assertThat(r.reason).isEqualTo("EMPLOYEE_INACTIVE");
    }

    // ---- Scenario: Employee Resigned (exitDate passed) ----
    @Test
    void scenarioEmployeeResigned() {
        EmployeeMaster e = activeEmployee();
        e.setExitDate(toDate(DATE.minusDays(1)));
        when(employeeMasterRepository.findById(EMP_ID)).thenReturn(Optional.of(e));
        var r = service.isEmployeeAvailable(EMP_ID, DATE);
        assertThat(r.available).isFalse();
        assertThat(r.reason).isEqualTo("EMPLOYEE_RESIGNED");
    }

    @Test
    void scenarioResignedButRejoined() {
        EmployeeMaster e = activeEmployee();
        e.setExitDate(toDate(DATE.minusDays(10)));
        e.setRejoiningDate(toDate(DATE.minusDays(1)));
        when(employeeMasterRepository.findById(EMP_ID)).thenReturn(Optional.of(e));
        var r = service.isEmployeeAvailable(EMP_ID, DATE);
        assertThat(r.available).isTrue();
    }

    // ---- Scenario: Absent via Daily Attendance ----
    @Test
    void scenarioAbsentViaAttendance() {
        HrDailyAttendance att = new HrDailyAttendance();
        att.setStatus("ABSENT");
        when(hrDailyAttendanceRepository.findByEmpIdAndAttendanceDate(eq(EMP_ID), eq(DATE)))
                .thenReturn(Optional.of(att));
        var r = service.isEmployeeAvailable(EMP_ID, DATE);
        assertThat(r.available).isFalse();
        assertThat(r.reason).isEqualTo("EMPLOYEE_ABSENT");
    }

    @Test
    void scenarioWfhStillAvailable() {
        HrDailyAttendance att = new HrDailyAttendance();
        att.setStatus("WFH");
        when(hrDailyAttendanceRepository.findByEmpIdAndAttendanceDate(eq(EMP_ID), eq(DATE)))
                .thenReturn(Optional.of(att));
        var r = service.isEmployeeAvailable(EMP_ID, DATE);
        assertThat(r.available).isTrue();
    }

    // ---- Scenario: Company Holiday (applicable to all) ----
    @Test
    void scenarioCompanyHoliday() {
        HrHolidayMaster h = new HrHolidayMaster();
        h.setIsOptional(false);
        h.setIsActive(true);
        h.setApplicableTo("ALL");
        when(hrHolidayMasterRepository.findByHolidayDateAndIsActiveTrue(eq(DATE)))
                .thenReturn(List.of(h));
        var r = service.isEmployeeAvailable(EMP_ID, DATE);
        assertThat(r.available).isFalse();
        assertThat(r.reason).isEqualTo("EMPLOYEE_ON_HOLIDAY");
    }

    // ---- Scenario: Regional holiday NOT applicable to this employee's unit ----
    @Test
    void scenarioRegionalHolidayNotApplicable() {
        EmployeeMaster e = activeEmployee();
        e.setUnitId(99L);
        when(employeeMasterRepository.findById(EMP_ID)).thenReturn(Optional.of(e));
        HrHolidayMaster h = new HrHolidayMaster();
        h.setIsOptional(false);
        h.setIsActive(true);
        h.setApplicableTo("UNIT");
        h.setApplicableRefs("1,2,3");
        when(hrHolidayMasterRepository.findByHolidayDateAndIsActiveTrue(eq(DATE)))
                .thenReturn(List.of(h));
        var r = service.isEmployeeAvailable(EMP_ID, DATE);
        assertThat(r.available).isTrue();
    }

    // ---- Scenario: Regional holiday APPLICABLE to this employee's unit ----
    @Test
    void scenarioRegionalHolidayApplicable() {
        EmployeeMaster e = activeEmployee();
        e.setUnitId(2L);
        when(employeeMasterRepository.findById(EMP_ID)).thenReturn(Optional.of(e));
        HrHolidayMaster h = new HrHolidayMaster();
        h.setIsOptional(false);
        h.setIsActive(true);
        h.setApplicableTo("UNIT");
        h.setApplicableRefs("1,2,3");
        when(hrHolidayMasterRepository.findByHolidayDateAndIsActiveTrue(eq(DATE)))
                .thenReturn(List.of(h));
        var r = service.isEmployeeAvailable(EMP_ID, DATE);
        assertThat(r.available).isFalse();
        assertThat(r.reason).isEqualTo("EMPLOYEE_ON_HOLIDAY");
    }

    // ---- Scenario: Optional Holiday - employee did NOT opt in ----
    @Test
    void scenarioOptionalHolidayNotOptedIn() {
        HrHolidayMaster h = new HrHolidayMaster();
        h.setHolidayId(7L);
        h.setIsOptional(true);
        h.setIsActive(true);
        h.setApplicableTo("ALL");
        when(hrHolidayMasterRepository.findByHolidayDateAndIsActiveTrue(eq(DATE)))
                .thenReturn(List.of(h));
        var r = service.isEmployeeAvailable(EMP_ID, DATE);
        assertThat(r.available).isTrue();
    }

    // ---- Scenario: Optional Holiday - employee opted in via OH leave ----
    @Test
    void scenarioOptionalHolidayOptedIn() {
        HrHolidayMaster h = new HrHolidayMaster();
        h.setHolidayId(7L);
        h.setIsOptional(true);
        h.setIsActive(true);
        h.setApplicableTo("ALL");
        when(hrHolidayMasterRepository.findByHolidayDateAndIsActiveTrue(eq(DATE)))
                .thenReturn(List.of(h));

        HrLeaveRequest leave = new HrLeaveRequest();
        leave.setLeaveTypeName("Optional Holiday");
        leave.setHolidayId(7L);
        leave.setNumberOfDays(1.0);
        when(hrLeaveRequestRepository.findApprovedLeavesOnDate(eq(EMP_ID), eq(DATE)))
                .thenReturn(List.of(leave));

        var r = service.isEmployeeAvailable(EMP_ID, DATE);
        assertThat(r.available).isFalse();
        assertThat(r.reason).isEqualTo("EMPLOYEE_ON_OPTIONAL_HOLIDAY");
    }

    // ---- Scenario: Full-day approved leave ----
    @Test
    void scenarioFullDayLeave() {
        HrLeaveRequest leave = new HrLeaveRequest();
        leave.setLeaveTypeName("Casual Leave");
        leave.setNumberOfDays(1.0);
        when(hrLeaveRequestRepository.findApprovedLeavesOnDate(eq(EMP_ID), eq(DATE)))
                .thenReturn(List.of(leave));
        var r = service.isEmployeeAvailable(EMP_ID, DATE);
        assertThat(r.available).isFalse();
        assertThat(r.reason).isEqualTo("EMPLOYEE_ON_LEAVE");
        assertThat(r.halfDay).isFalse();
    }

    // ---- Scenario: Half-day leave keeps primary available, flagged ----
    @Test
    void scenarioHalfDayLeave() {
        HrLeaveRequest leave = new HrLeaveRequest();
        leave.setLeaveTypeName("Casual Leave");
        leave.setNumberOfDays(0.5);
        when(hrLeaveRequestRepository.findApprovedLeavesOnDate(eq(EMP_ID), eq(DATE)))
                .thenReturn(List.of(leave));
        var r = service.isEmployeeAvailable(EMP_ID, DATE);
        assertThat(r.available).isTrue();
        assertThat(r.halfDay).isTrue();
        assertThat(r.reason).isEqualTo("EMPLOYEE_HALF_DAY_LEAVE");
    }

    // ---- Scenario: Employee not yet joined ----
    @Test
    void scenarioNotYetJoined() {
        EmployeeMaster e = activeEmployee();
        e.setDateOfJoining(toDate(DATE.plusDays(5)));
        when(employeeMasterRepository.findById(EMP_ID)).thenReturn(Optional.of(e));
        var r = service.isEmployeeAvailable(EMP_ID, DATE);
        assertThat(r.available).isFalse();
        assertThat(r.reason).isEqualTo("EMPLOYEE_NOT_YET_JOINED");
    }

    // ---- Scenario: Employee not found ----
    @Test
    void scenarioEmployeeNotFound() {
        when(employeeMasterRepository.findById(EMP_ID)).thenReturn(Optional.empty());
        var r = service.isEmployeeAvailable(EMP_ID, DATE);
        assertThat(r.available).isFalse();
        assertThat(r.reason).isEqualTo("EMPLOYEE_NOT_FOUND");
    }

    private static Date toDate(LocalDate d) {
        return Date.from(d.atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant());
    }
}
