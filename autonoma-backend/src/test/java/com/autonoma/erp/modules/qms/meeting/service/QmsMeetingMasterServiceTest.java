package com.autonoma.erp.modules.qms.meeting.service;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingMaster;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingMasterRepository;
import com.autonoma.erp.modules.qms.meeting.repository.QmsAttachmentPathRepository;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingScheduleRepository;
import org.junit.jupiter.api.*;
import org.mockito.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("QmsMeetingMasterService – Unit Tests")
class QmsMeetingMasterServiceTest {

    @Mock private QmsMeetingMasterRepository repository;
    @Mock private StatusMasterRepository statusRepo;
    @Mock private EmployeeMasterRepository employeeMasterRepo;
    @Mock private QmsAttachmentPathRepository attachmentRepository;
    @Mock private QmsMeetingScheduleRepository scheduleRepository;
    @InjectMocks private QmsMeetingMasterService service;

    @BeforeEach void setUp() { MockitoAnnotations.openMocks(this); }

    private QmsMeetingMaster meeting(Integer id, String name, String prefix) {
        QmsMeetingMaster m = new QmsMeetingMaster();
        m.setId(id); m.setMeetingName(name); m.setMeetingPrefix(prefix);
        m.setMeetingDescription("A".repeat(160)); m.setMeetingAgenda("Review"); m.setIsActive(true);
        return m;
    }
    private StatusMaster active() { StatusMaster s = new StatusMaster(); s.setId(1L); s.setName("ACTIVE"); return s; }

    @Test @DisplayName("TC-MTG-MASTER-01: getAllMeetings returns all records")
    void getAllMeetings_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(meeting(1,"QMS","Q"), meeting(2,"HR","H")));
        when(attachmentRepository.findByPageCodeAndRefId(any(), anyLong())).thenReturn(List.of());
        assertEquals(2, service.getAllMeetings().size());
    }

    @Test @DisplayName("TC-MTG-MASTER-02: getAllMeetings returns empty list")
    void getAllMeetings_empty() {
        when(repository.findAll()).thenReturn(Collections.emptyList());
        assertTrue(service.getAllMeetings().isEmpty());
    }

    @Test @DisplayName("TC-MTG-MASTER-03: getMeetingById returns present for valid id")
    void getMeetingById_found() {
        when(repository.findById(1)).thenReturn(Optional.of(meeting(1,"QSR","QSR")));
        when(attachmentRepository.findByPageCodeAndRefId(any(), anyLong())).thenReturn(List.of());
        assertTrue(service.getMeetingById(1).isPresent());
    }

    @Test @DisplayName("TC-MTG-MASTER-04: getMeetingById returns empty for non-existent id")
    void getMeetingById_notFound() {
        when(repository.findById(999)).thenReturn(Optional.empty());
        assertFalse(service.getMeetingById(999).isPresent());
    }

    @Test @DisplayName("TC-MTG-MASTER-05: saveMeeting creates with valid data and employee mappings")
    void createMeeting_success() {
        QmsMeetingMaster input = meeting(null, "QUALITY SYSTEM REVIEW", "QSR");
        input.setEmployeeId("101,102");
        QmsMeetingMaster saved = meeting(5, "QUALITY SYSTEM REVIEW", "QSR");
        saved.setEmployeeMappings(new ArrayList<>());
        EmployeeMaster e1 = new EmployeeMaster(); e1.setId(101L);
        EmployeeMaster e2 = new EmployeeMaster(); e2.setId(102L);
        when(repository.existsByMeetingNameIgnoreCase("QUALITY SYSTEM REVIEW")).thenReturn(false);
        when(repository.saveAndFlush(any())).thenReturn(saved);
        when(statusRepo.findByName("ACTIVE")).thenReturn(Optional.of(active()));
        when(employeeMasterRepo.findById(101L)).thenReturn(Optional.of(e1));
        when(employeeMasterRepo.findById(102L)).thenReturn(Optional.of(e2));
        when(attachmentRepository.findByPageCodeAndRefId(any(), anyLong())).thenReturn(List.of());
        QmsMeetingMaster result = service.saveMeeting(input);
        assertNotNull(result);
        assertEquals(5, result.getId());
    }

    @Test @DisplayName("TC-MTG-MASTER-06: saveMeeting rejects duplicate name on create")
    void createMeeting_duplicateName_throws() {
        QmsMeetingMaster input = meeting(null, "QUALITY REVIEW", "QR");
        when(repository.existsByMeetingNameIgnoreCase("QUALITY REVIEW")).thenReturn(true);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.saveMeeting(input));
        assertTrue(ex.getMessage().contains("already exists"));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test @DisplayName("TC-MTG-MASTER-07: saveMeeting silently skips invalid employee IDs")
    void createMeeting_invalidEmployeeId_skipped() {
        QmsMeetingMaster input = meeting(null, "LOGISTICS REVIEW", "LR");
        input.setEmployeeId("abc,999");
        QmsMeetingMaster saved = meeting(6, "LOGISTICS REVIEW", "LR");
        saved.setEmployeeMappings(new ArrayList<>());
        when(repository.existsByMeetingNameIgnoreCase("LOGISTICS REVIEW")).thenReturn(false);
        when(repository.saveAndFlush(any())).thenReturn(saved);
        when(statusRepo.findByName("ACTIVE")).thenReturn(Optional.of(active()));
        when(employeeMasterRepo.findById(999L)).thenReturn(Optional.empty());
        when(attachmentRepository.findByPageCodeAndRefId(any(), anyLong())).thenReturn(List.of());
        assertDoesNotThrow(() -> service.saveMeeting(input));
    }

    @Test @DisplayName("TC-MTG-MASTER-08: saveMeeting rejects update when name collides with another record")
    void updateMeeting_duplicateName_throws() {
        QmsMeetingMaster input = meeting(3, "MANAGEMENT REVIEW", "MR");
        when(repository.existsByMeetingNameIgnoreCaseAndIdNot("MANAGEMENT REVIEW", 3)).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () -> service.saveMeeting(input));
    }

    @Test @DisplayName("TC-MTG-MASTER-09: deleteMeeting succeeds when not referenced in schedule")
    void deleteMeeting_success() {
        when(scheduleRepository.existsByMeetingType_Id(10)).thenReturn(false);
        doNothing().when(repository).deleteEmployeeMappingsByMeetingId(10);
        doNothing().when(attachmentRepository).deleteByPageCodeAndRefId(any(), anyLong());
        doNothing().when(repository).deleteById(10);
        assertDoesNotThrow(() -> service.deleteMeeting(10));
        verify(repository).deleteById(10);// Integer OK
    }

    @Test @DisplayName("TC-MTG-MASTER-10: deleteMeeting throws when meeting referenced in schedule")
    void deleteMeeting_referencedInSchedule_throws() {
        when(scheduleRepository.existsByMeetingType_Id(5)).thenReturn(true);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.deleteMeeting(5));
        assertTrue(ex.getMessage().contains("referenced in a schedule"));
        verify(repository, never()).deleteById(any());
    }
}
