package com.autonoma.erp.modules.hr.employee.service;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeOrganization;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeTransfer;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeTransferRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeTypeMasterRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationRepository;
import com.autonoma.erp.modules.master.organization.repository.DivisionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmployeeTransferServiceTest {

    @Mock
    private EmployeeTransferRepository transferRepo;

    @Mock
    private EmployeeMasterRepository employeeRepo;

    @Mock
    private EmployeeTypeMasterRepository employeeTypeRepo;

    @Mock
    private DepartmentRepository departmentRepo;

    @Mock
    private DesignationRepository designationRepo;

    @Mock
    private DivisionRepository divisionRepo;

    @InjectMocks
    private EmployeeTransferService transferService;

    private EmployeeMaster testEmployee;
    private EmployeeOrganization testOrg;

    @BeforeEach
    void setUp() {
        testEmployee = new EmployeeMaster();
        testEmployee.setId(100L);
        testEmployee.setEmpCode("EMP100");
        testEmployee.setOldEmpCode("NT10L5-16025");
        testEmployee.setEmployeeName("SIVARAMAN R");
        testEmployee.setDepartmentId(10L);
        testEmployee.setDesignationId(20L);
        testEmployee.setUnitId(30L);
        testEmployee.setEmployeeTypeId(1L);

        testOrg = new EmployeeOrganization();
        testOrg.setEmployeeId(100L);
        testOrg.setDepartmentId(10L);
        testOrg.setDesignationId(20L);
        testOrg.setUnitId(30L);
        testOrg.setEmployeeTypeId(1L);
        testEmployee.setOrganization(testOrg);
    }

    @Test
    @DisplayName("saveTransfer - Immediate execution when revision date is today")
    void saveTransfer_ImmediateExecution_Success() {
        EmployeeTransfer input = new EmployeeTransfer();
        input.setEmployeeId(100L);
        input.setTransferDepartmentId(11L);
        input.setTransferDesignationId(21L);
        input.setExpectRevDate(new Date());

        when(employeeRepo.findById(100L)).thenReturn(Optional.of(testEmployee));
        when(transferRepo.findByEmployeeIdAndStatusAndIsActiveTrue(100L, "SCHEDULED")).thenReturn(Collections.emptyList());
        when(transferRepo.findLatestByEmployeeId(100L)).thenReturn(Optional.empty());
        when(transferRepo.save(any(EmployeeTransfer.class))).thenAnswer(i -> i.getArgument(0));

        EmployeeTransfer saved = transferService.saveTransfer(input);

        assertNotNull(saved);
        assertEquals("EXECUTED", saved.getStatus());
        assertEquals(11L, testEmployee.getDepartmentId());
        assertEquals(21L, testEmployee.getDesignationId());
        verify(employeeRepo, times(1)).save(testEmployee);
        verify(transferRepo, times(1)).save(saved);
    }

    @Test
    @DisplayName("saveTransfer - Scheduled status when revision date is in future")
    void saveTransfer_ScheduledExecution_Success() {
        Calendar futureCal = Calendar.getInstance();
        futureCal.add(Calendar.DAY_OF_MONTH, 10);

        EmployeeTransfer input = new EmployeeTransfer();
        input.setEmployeeId(100L);
        input.setTransferDepartmentId(12L);
        input.setExpectRevDate(futureCal.getTime());

        when(employeeRepo.findById(100L)).thenReturn(Optional.of(testEmployee));
        when(transferRepo.findByEmployeeIdAndStatusAndIsActiveTrue(100L, "SCHEDULED")).thenReturn(Collections.emptyList());
        when(transferRepo.findLatestByEmployeeId(100L)).thenReturn(Optional.empty());
        when(transferRepo.save(any(EmployeeTransfer.class))).thenAnswer(i -> i.getArgument(0));

        EmployeeTransfer saved = transferService.saveTransfer(input);

        assertNotNull(saved);
        assertEquals("SCHEDULED", saved.getStatus());
        // EmployeeMaster remains unchanged until effective date
        assertEquals(10L, testEmployee.getDepartmentId());
        verify(employeeRepo, never()).save(testEmployee);
    }

    @Test
    @DisplayName("saveTransfer - Throws exception if duplicate scheduled transfer exists")
    void saveTransfer_DuplicateScheduled_ThrowsException() {
        EmployeeTransfer pending = new EmployeeTransfer();
        pending.setStatus("SCHEDULED");

        EmployeeTransfer input = new EmployeeTransfer();
        input.setEmployeeId(100L);

        when(employeeRepo.findById(100L)).thenReturn(Optional.of(testEmployee));
        when(transferRepo.findByEmployeeIdAndStatusAndIsActiveTrue(100L, "SCHEDULED")).thenReturn(List.of(pending));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> transferService.saveTransfer(input));
        assertTrue(ex.getMessage().contains("already a SCHEDULED transfer pending"));
    }

    @Test
    @DisplayName("saveTransfer - Throws exception if new employee code belongs to another employee")
    void saveTransfer_DuplicateEmployeeCode_ThrowsException() {
        EmployeeMaster existingOther = new EmployeeMaster();
        existingOther.setId(999L);
        existingOther.setEmployeeName("JOHN DOE");

        EmployeeTransfer input = new EmployeeTransfer();
        input.setEmployeeId(100L);
        input.setTransOldEmpCode("TAKEN_CODE");

        when(employeeRepo.findById(100L)).thenReturn(Optional.of(testEmployee));
        when(transferRepo.findByEmployeeIdAndStatusAndIsActiveTrue(100L, "SCHEDULED")).thenReturn(Collections.emptyList());
        when(employeeRepo.findByOldEmpCode("TAKEN_CODE")).thenReturn(Optional.of(existingOther));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> transferService.saveTransfer(input));
        assertTrue(ex.getMessage().contains("already assigned to employee"));
    }

    @Test
    @DisplayName("processScheduledTransfers - Executes scheduled transfers whose revision date has arrived")
    void processScheduledTransfers_Success() {
        EmployeeTransfer scheduled = new EmployeeTransfer();
        scheduled.setId(1L);
        scheduled.setEmployeeId(100L);
        scheduled.setTransferDepartmentId(15L);
        scheduled.setStatus("SCHEDULED");
        scheduled.setExpectRevDate(new Date());

        when(transferRepo.findByStatusAndExpectRevDateLessThanEqualAndIsActiveTrue(eq("SCHEDULED"), any(Date.class)))
                .thenReturn(List.of(scheduled));
        when(employeeRepo.findById(100L)).thenReturn(Optional.of(testEmployee));

        transferService.processScheduledTransfers();

        assertEquals("EXECUTED", scheduled.getStatus());
        assertEquals(15L, testEmployee.getDepartmentId());
        verify(employeeRepo, times(1)).save(testEmployee);
        verify(transferRepo, times(1)).save(scheduled);
    }
}
