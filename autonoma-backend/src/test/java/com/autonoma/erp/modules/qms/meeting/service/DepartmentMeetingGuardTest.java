package com.autonoma.erp.modules.qms.meeting.service;

import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.hr.orgstructure.service.DepartmentService;
import org.junit.jupiter.api.*;
import org.mockito.*;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * TC-MTG-DEPT-01 through TC-MTG-DEPT-04
 * Tests DepartmentService.deleteDepartment() guard logic.
 * BUG-MTG-004: Verifies HTTP 400 (IllegalArgumentException) thrown instead of HTTP 500
 * when department is linked to a QMS Meeting or Audit Schedule.
 */
@DisplayName("DepartmentService – Meeting & Audit Guard Tests (BUG-MTG-004)")
class DepartmentMeetingGuardTest {

    @Mock private DepartmentRepository departmentRepository;
    @Mock private JdbcTemplate jdbcTemplate;
    @InjectMocks private DepartmentService service;

    @BeforeEach void setUp() { MockitoAnnotations.openMocks(this); }

    @Test
    @DisplayName("TC-MTG-DEPT-01: deleteDepartment throws user-friendly error when linked to a QMS Meeting")
    void deleteDepartment_linkedToMeeting_throwsIllegalArgument() {
        when(jdbcTemplate.queryForObject(
                contains("QMS_MEETING_DEPARTMENT_MAPPING"), eq(Integer.class), eq(1L)))
                .thenReturn(1);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.deleteDepartment(1L));

        assertTrue(ex.getMessage().contains("mapped to a Meeting"),
                "Error message should clearly state the Meeting mapping constraint");
        verify(departmentRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("TC-MTG-DEPT-02: deleteDepartment throws user-friendly error when linked to an Audit Schedule")
    void deleteDepartment_linkedToAuditSchedule_throwsIllegalArgument() {
        when(jdbcTemplate.queryForObject(
                contains("QMS_MEETING_DEPARTMENT_MAPPING"), eq(Integer.class), eq(2L)))
                .thenReturn(0);
        when(jdbcTemplate.queryForObject(
                contains("QMS_AUDIT_SCHEDULE"), eq(Integer.class), eq(2L)))
                .thenReturn(1);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.deleteDepartment(2L));

        assertTrue(ex.getMessage().contains("Audit Schedule"));
        verify(departmentRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("TC-MTG-DEPT-03: deleteDepartment throws user-friendly error when linked to Audit Criteria")
    void deleteDepartment_linkedToAuditCriteria_throwsIllegalArgument() {
        when(jdbcTemplate.queryForObject(
                contains("QMS_MEETING_DEPARTMENT_MAPPING"), eq(Integer.class), eq(3L)))
                .thenReturn(0);
        when(jdbcTemplate.queryForObject(
                contains("QMS_AUDIT_SCHEDULE"), eq(Integer.class), eq(3L)))
                .thenReturn(0);
        when(jdbcTemplate.queryForObject(
                contains("QMS_AUDIT_DEPARTMENT"), eq(Integer.class), eq(3L)))
                .thenReturn(2);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.deleteDepartment(3L));

        assertTrue(ex.getMessage().contains("Audit Criteria"));
        verify(departmentRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("TC-MTG-DEPT-04: deleteDepartment succeeds when department has no references")
    void deleteDepartment_noReferences_deletesSuccessfully() {
        when(jdbcTemplate.queryForObject(
                contains("QMS_MEETING_DEPARTMENT_MAPPING"), eq(Integer.class), eq(99L)))
                .thenReturn(0);
        when(jdbcTemplate.queryForObject(
                contains("QMS_AUDIT_SCHEDULE"), eq(Integer.class), eq(99L)))
                .thenReturn(0);
        when(jdbcTemplate.queryForObject(
                contains("QMS_AUDIT_DEPARTMENT"), eq(Integer.class), eq(99L)))
                .thenReturn(0);
        doNothing().when(departmentRepository).deleteById(99L);

        assertDoesNotThrow(() -> service.deleteDepartment(99L));
        verify(departmentRepository).deleteById(99L);
    }
}
