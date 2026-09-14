package com.autonoma.erp.modules.hr.holiday.controller;

import com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster;
import com.autonoma.erp.modules.hr.holiday.service.HrHolidayMasterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class HrHolidayMasterControllerTest {

    @Mock
    private HrHolidayMasterService holidayService;

    @InjectMocks
    private HrHolidayMasterController holidayController;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Test GET /api/master/hr/holidays returns all holidays")
    public void testGetAllHolidays() {
        HrHolidayMaster h1 = new HrHolidayMaster();
        h1.setHolidayId(1L);
        h1.setHolidayName("New Year");
        h1.setFromDate(LocalDate.of(2026, 1, 1));

        when(holidayService.findAll()).thenReturn(Arrays.asList(h1));

        List<HrHolidayMaster> result = holidayController.getAll(null);
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("New Year", result.get(0).getHolidayName());
        verify(holidayService, times(1)).findAll();
    }

    @Test
    @DisplayName("Test POST /api/master/hr/holidays creates holiday successfully")
    public void testCreateHolidaySuccess() {
        HrHolidayMaster h = new HrHolidayMaster();
        h.setHolidayName("Republic Day");
        h.setFromDate(LocalDate.of(2026, 1, 26));

        HrHolidayMaster saved = new HrHolidayMaster();
        saved.setHolidayId(10L);
        saved.setHolidayName("Republic Day");
        saved.setFromDate(LocalDate.of(2026, 1, 26));

        when(holidayService.create(any(HrHolidayMaster.class))).thenReturn(saved);

        ResponseEntity<?> response = holidayController.create(h);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof HrHolidayMaster);
        assertEquals(10L, ((HrHolidayMaster) response.getBody()).getHolidayId());
    }

    @Test
    @DisplayName("Test POST /api/master/hr/holidays rejects duplicate holiday date")
    public void testCreateHolidayDuplicateDateRejection() {
        HrHolidayMaster h = new HrHolidayMaster();
        h.setHolidayName("Duplicate Day");
        h.setFromDate(LocalDate.of(2026, 1, 26));

        when(holidayService.create(any(HrHolidayMaster.class)))
                .thenThrow(new RuntimeException("A holiday already exists on date 2026-01-26. Duplicate holiday dates are not allowed."));

        ResponseEntity<?> response = holidayController.create(h);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Duplicate holiday dates are not allowed"));
    }

    @Test
    @DisplayName("Test PUT /api/master/hr/holidays/{id} updates holiday successfully")
    public void testUpdateHolidaySuccess() {
        HrHolidayMaster h = new HrHolidayMaster();
        h.setHolidayName("Independence Day");
        h.setFromDate(LocalDate.of(2026, 8, 15));

        HrHolidayMaster updated = new HrHolidayMaster();
        updated.setHolidayId(5L);
        updated.setHolidayName("Independence Day Updated");
        updated.setFromDate(LocalDate.of(2026, 8, 15));

        when(holidayService.update(eq(5L), any(HrHolidayMaster.class))).thenReturn(updated);

        ResponseEntity<?> response = holidayController.update(5L, h);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Independence Day Updated", ((HrHolidayMaster) response.getBody()).getHolidayName());
    }

    @Test
    @DisplayName("Test DELETE /api/master/hr/holidays/{id} deletes holiday successfully")
    public void testDeleteHolidaySuccess() {
        doNothing().when(holidayService).delete(5L);

        ResponseEntity<?> response = holidayController.delete(5L);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(holidayService, times(1)).delete(5L);
    }
}
