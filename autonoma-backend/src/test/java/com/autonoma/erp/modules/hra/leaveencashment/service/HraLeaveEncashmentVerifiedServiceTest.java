package com.autonoma.erp.modules.hra.leaveencashment.service;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeManagerMapping;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hra.leaveencashment.entity.HraLeaveEncashmentVerified;
import com.autonoma.erp.modules.hra.leaveencashment.repository.HraLeaveEncashmentVerifiedRepository;
import com.autonoma.erp.modules.platform.notification.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class HraLeaveEncashmentVerifiedServiceTest {

    @Mock
    private HraLeaveEncashmentVerifiedRepository repository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private NotificationService notificationService;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private EmployeeMasterRepository employeeRepository;

    @Mock
    private EmployeeManagerMappingRepository managerMappingRepository;

    @InjectMocks
    private HraLeaveEncashmentVerifiedService service;

    private EmployeeMaster employee;
    private EmployeeMaster manager;
    private EmployeeManagerMapping managerMapping;
    private HraLeaveEncashmentVerified record;

    @BeforeEach
    void setUp() {
        employee = new EmployeeMaster();
        employee.setId(100L);
        employee.setEmpCode("EMP001");
        employee.setEmployeeName("John Doe");

        manager = new EmployeeMaster();
        manager.setId(200L);
        manager.setEmpCode("MGR001");
        manager.setEmployeeName("Jane Smith");

        managerMapping = new EmployeeManagerMapping();
        managerMapping.setEmpId(100L);
        managerMapping.setVerticalHeadId(200L);

        record = new HraLeaveEncashmentVerified();
        record.setId(1L);
        record.setEncashmentYear(2026);
        record.setEmployee(employee);
        record.setEmpId("EMP001");
        record.setEmpName("John Doe");
        record.setCurrentEl(new BigDecimal("10"));
        record.setCurrentCl(new BigDecimal("5"));
        record.setSl(new BigDecimal("3"));
        record.setAl(new BigDecimal("2"));
        record.setPl(new BigDecimal("4"));
        record.setElEncashment(new BigDecimal("5"));
        record.setStatus("PENDING");
    }

    @Test
    @DisplayName("TC-01: Create Leave Encashment Entry -> Calculates total available encashment & sends SUBMIT notification to Vertical Head")
    void testCreateLeaveEncashment_SendsSubmitNotificationToManager() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(record));
        when(managerMappingRepository.findByEmpId(100L)).thenReturn(Optional.of(managerMapping));

        HraLeaveEncashmentVerified created = service.create(record);

        assertNotNull(created);
        assertEquals("PENDING", created.getStatus());
        assertEquals(new BigDecimal("5"), created.getElEncashment());

        // Verify total available leave sum (EL:10 + CL:5 + SL:3 + AL:2 + PL:4 = 24 days)
        BigDecimal totalAvailable = record.getCurrentEl()
                .add(record.getCurrentCl())
                .add(record.getSl())
                .add(record.getAl())
                .add(record.getPl());
        assertEquals(new BigDecimal("24"), totalAvailable);

        // Verify real-time notification sent to Vertical Head (ID: 200L)
        verify(notificationService, times(1)).notifyUserAboutLeaveEncashment(eq(200L), any(), eq("SUBMIT"), any());
    }

    @Test
    @DisplayName("TC-02: Verify Leave Encashment -> Updates status to VERIFIED & notifies Employee")
    void testVerifyLeaveEncashment_UpdatesStatusToVerifiedAndNotifiesEmployee() {
        when(repository.findById(1L)).thenReturn(Optional.of(record));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        HraLeaveEncashmentVerified verified = service.verify(1L, "Verified by Vertical Head");

        assertNotNull(verified);
        assertEquals("VERIFIED", verified.getStatus());
        assertEquals("Verified by Vertical Head", verified.getRemarks());

        // Verify notification sent to Employee (ID: 100L)
        verify(notificationService, times(1)).notifyUserAboutLeaveEncashment(eq(100L), any(), eq("VERIFY"), any());
    }

    @Test
    @DisplayName("TC-03: Reject Leave Encashment -> Sets status to REJECTED, saves JSON rejection history & notifies Employee")
    void testRejectLeaveEncashment_SavesRejectionHistoryAndNotifiesEmployee() {
        when(repository.findById(1L)).thenReturn(Optional.of(record));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        HraLeaveEncashmentVerified rejected = service.reject(1L, "Encashment days exceed team limit");

        assertNotNull(rejected);
        assertEquals("REJECTED", rejected.getStatus());
        assertEquals(1, rejected.getRevNo());

        // Verify notification sent to Employee with rejection remarks
        verify(notificationService, times(1)).notifyUserAboutLeaveEncashment(eq(100L), any(), eq("REJECT"), eq("Encashment days exceed team limit"));
    }

    @Test
    @DisplayName("TC-04: Resubmit Rejected Encashment -> Resets status to PENDING & sends RESUBMIT notification to Vertical Head")
    void testResubmitRejectedEncashment_ResetsStatusToPendingAndNotifiesManager() {
        record.setStatus("REJECTED");
        when(repository.findById(1L)).thenReturn(Optional.of(record));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(managerMappingRepository.findByEmpId(100L)).thenReturn(Optional.of(managerMapping));

        HraLeaveEncashmentVerified incoming = new HraLeaveEncashmentVerified();
        incoming.setEncashmentYear(2026);
        incoming.setEmployee(employee);
        incoming.setCurrentEl(new BigDecimal("10"));
        incoming.setCurrentCl(new BigDecimal("5"));
        incoming.setSl(new BigDecimal("3"));
        incoming.setAl(new BigDecimal("2"));
        incoming.setPl(new BigDecimal("4"));
        incoming.setElEncashment(new BigDecimal("3")); // Reduced requested days
        incoming.setRemarks("Updated requested days to 3");

        HraLeaveEncashmentVerified resubmitted = service.update(1L, incoming);

        assertNotNull(resubmitted);
        assertEquals("PENDING", resubmitted.getStatus());
        assertEquals(new BigDecimal("3"), resubmitted.getElEncashment());

        // Verify RESUBMIT notification sent to Vertical Head (ID: 200L)
        verify(notificationService, times(1)).notifyUserAboutLeaveEncashment(eq(200L), any(), eq("RESUBMIT"), any());
    }

    @Test
    @DisplayName("TC-05: Approve Leave Encashment -> Updates status to APPROVED & notifies Employee")
    void testApproveLeaveEncashment_UpdatesStatusToApprovedAndNotifiesEmployee() {
        record.setStatus("VERIFIED");
        when(repository.findById(1L)).thenReturn(Optional.of(record));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        HraLeaveEncashmentVerified approved = service.approve(1L, "Approved by HR");

        assertNotNull(approved);
        assertEquals("APPROVED", approved.getStatus());

        // Verify notification sent to Employee (ID: 100L)
        verify(notificationService, times(1)).notifyUserAboutLeaveEncashment(eq(100L), any(), eq("APPROVE"), any());
    }
}
