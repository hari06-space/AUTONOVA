package com.autonoma.erp.modules.qms.meeting.controller;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingMaster;
import com.autonoma.erp.modules.qms.meeting.service.QmsMeetingMasterService;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingScheduleRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import org.junit.jupiter.api.*;
import org.mockito.*;
import org.springframework.http.ResponseEntity;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * TC-MTG-CTRL-01 through TC-MTG-CTRL-06
 * Controller-layer unit tests for QmsMeetingMasterController.
 * Validates HTTP behaviour: GET all, GET by id, POST create,
 * PUT update, DELETE delete, and 404 on not-found.
 */
@DisplayName("QmsMeetingMasterController – Unit Tests")
class QmsMeetingMasterControllerTest {

    @Mock private QmsMeetingMasterService service;
    @Mock private UserRepository userRepository;
    @Mock private QmsMeetingScheduleRepository scheduleRepository;
    @InjectMocks private QmsMeetingMasterController controller;

    @BeforeEach void setUp() { MockitoAnnotations.openMocks(this); }

    private QmsMeetingMaster meeting(Integer id, String name) {
        QmsMeetingMaster m = new QmsMeetingMaster();
        m.setId(id); m.setMeetingName(name); m.setMeetingPrefix("QSR");
        m.setMeetingDescription("A".repeat(160)); m.setIsActive(true);
        return m;
    }

    @Test @DisplayName("TC-MTG-CTRL-01: GET /api/qms/meetings returns all meeting masters")
    void getAllMeetings_returnsListOf2() {
        when(service.getAllMeetings()).thenReturn(List.of(meeting(1,"QMS"), meeting(2,"HR")));
        List<QmsMeetingMaster> result = controller.getAllMeetings();
        assertEquals(2, result.size());
    }

    @Test @DisplayName("TC-MTG-CTRL-02: GET /api/qms/meetings/{id} returns 200 when found")
    void getMeetingById_found_returns200() {
        when(service.getMeetingById(1)).thenReturn(Optional.of(meeting(1,"QMS")));
        ResponseEntity<QmsMeetingMaster> response = controller.getMeetingById(1);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("QMS", response.getBody().getMeetingName());
    }

    @Test @DisplayName("TC-MTG-CTRL-03: GET /api/qms/meetings/{id} returns 404 when not found")
    void getMeetingById_notFound_returns404() {
        when(service.getMeetingById(999)).thenReturn(Optional.empty());
        ResponseEntity<QmsMeetingMaster> response = controller.getMeetingById(999);
        assertEquals(404, response.getStatusCode().value());
    }

    @Test @DisplayName("TC-MTG-CTRL-04: POST /api/qms/meetings creates and returns new meeting")
    void createMeeting_returns201() {
        QmsMeetingMaster input = meeting(null, "QUALITY SYSTEM REVIEW");
        QmsMeetingMaster saved = meeting(7, "QUALITY SYSTEM REVIEW");
        when(service.saveMeeting(any())).thenReturn(saved);

        QmsMeetingMaster result = controller.createMeeting(input);

        assertNotNull(result);
        assertEquals(7, result.getId());
        verify(service, times(1)).saveMeeting(any());
    }

    @Test @DisplayName("TC-MTG-CTRL-05: PUT /api/qms/meetings/{id} updates and returns 200")
    void updateMeeting_returns200() {
        QmsMeetingMaster existing = meeting(3,"OLD");
        QmsMeetingMaster updated = meeting(3,"NEW");
        when(service.getMeetingById(3)).thenReturn(Optional.of(existing));
        when(service.saveMeeting(any())).thenReturn(updated);

        ResponseEntity<QmsMeetingMaster> response = controller.updateMeeting(3, updated);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("NEW", response.getBody().getMeetingName());
    }

    @Test @DisplayName("TC-MTG-CTRL-06: DELETE /api/qms/meetings/{id} returns 200 on success")
    void deleteMeeting_returns200() {
        doNothing().when(service).deleteMeeting(5);
        ResponseEntity<Void> response = controller.deleteMeeting(5);
        assertEquals(200, response.getStatusCode().value());
        verify(service, times(1)).deleteMeeting(5);
    }
}
