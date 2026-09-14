package com.autonoma.erp.modules.hr.attendance.controller;

import com.autonoma.erp.modules.hr.attendance.entity.ShiftMaster;
import com.autonoma.erp.modules.hr.attendance.repository.ShiftMasterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class ShiftMasterControllerTest {

    @Mock
    private ShiftMasterRepository repository;

    @InjectMocks
    private ShiftMasterController controller;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Test GET /api/hr/shift-master returns ordered shift list")
    public void testGetAllShifts() {
        ShiftMaster s1 = new ShiftMaster();
        s1.setId(1L);
        s1.setShiftCode("SHIFT_GEN");
        s1.setShiftName("General Shift");
        s1.setStartTime("09:00");
        s1.setEndTime("17:00");

        when(repository.findAllByOrderByShiftCodeAsc()).thenReturn(Arrays.asList(s1));

        ResponseEntity<List<ShiftMaster>> response = controller.getAll();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("SHIFT_GEN", response.getBody().get(0).getShiftCode());
    }

    @Test
    @DisplayName("Test POST /api/hr/shift-master saves new shift successfully")
    public void testSaveNewShift() {
        ShiftMaster shift = new ShiftMaster();
        shift.setShiftCode("SHIFT_NIGHT");
        shift.setShiftName("Night Shift");
        shift.setStartTime("22:00");
        shift.setEndTime("06:00");
        shift.setBreakMinutes(0);
        shift.setStandardHours(new BigDecimal("8.00"));
        shift.setIsNightShift(true);

        when(repository.findByShiftCode("SHIFT_NIGHT")).thenReturn(Optional.empty());
        when(repository.save(any(ShiftMaster.class))).thenReturn(shift);

        ResponseEntity<?> response = controller.save(shift);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof ShiftMaster);
        ShiftMaster saved = (ShiftMaster) response.getBody();
        assertTrue(saved.getIsNightShift());
        assertEquals(new BigDecimal("8.00"), saved.getStandardHours());
    }

    @Test
    @DisplayName("Test DELETE /api/hr/shift-master/{id} deletes shift successfully")
    public void testDeleteShift() {
        when(repository.existsById(1L)).thenReturn(true);
        doNothing().when(repository).deleteById(1L);

        ResponseEntity<?> response = controller.delete(1L);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(repository, times(1)).deleteById(1L);
    }
}
