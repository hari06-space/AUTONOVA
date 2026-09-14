package com.autonoma.erp.modules.hr.petrol.controller;

import com.autonoma.erp.modules.hr.petrol.entity.HrPetrolAllowanceMaster;
import com.autonoma.erp.modules.hr.petrol.repository.HrPetrolAllowanceMasterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

public class HrPetrolAllowanceMasterControllerTest {

    @Mock
    private HrPetrolAllowanceMasterRepository repository;

    @InjectMocks
    private HrPetrolAllowanceMasterController controller;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Create slab for DIESEL from 0 to 100 succeeds with 200 OK")
    public void testCreateSlab_Diesel_0_to_100_Success() {
        HrPetrolAllowanceMaster allowance = new HrPetrolAllowanceMaster();
        allowance.setVehicleType("DIESEL");
        allowance.setFromRate(new BigDecimal("0.00"));
        allowance.setToRate(new BigDecimal("100.00"));
        allowance.setRateTwoWheeler(new BigDecimal("3.50"));
        allowance.setRateFourWheeler(new BigDecimal("7.00"));
        allowance.setIsActive(true);

        when(repository.existsOverlappingSlab(eq("DIESEL"), eq(new BigDecimal("0.00")), eq(new BigDecimal("100.00"))))
                .thenReturn(false);
        when(repository.save(any(HrPetrolAllowanceMaster.class))).thenReturn(allowance);

        ResponseEntity<?> response = controller.create(allowance);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof HrPetrolAllowanceMaster);
        HrPetrolAllowanceMaster saved = (HrPetrolAllowanceMaster) response.getBody();
        assertEquals("DIESEL", saved.getVehicleType());
    }

    @Test
    @DisplayName("Create slab for DIESEL from 50 to 120 is rejected with 400 Bad Request and overlap error message")
    public void testCreateSlab_Diesel_50_to_120_Rejected_With_OverlapError() {
        HrPetrolAllowanceMaster allowance = new HrPetrolAllowanceMaster();
        allowance.setVehicleType("DIESEL");
        allowance.setFromRate(new BigDecimal("50.00"));
        allowance.setToRate(new BigDecimal("120.00"));
        allowance.setRateTwoWheeler(new BigDecimal("3.50"));
        allowance.setRateFourWheeler(new BigDecimal("7.00"));
        allowance.setIsActive(true);

        when(repository.existsOverlappingSlab(eq("DIESEL"), eq(new BigDecimal("50.00")), eq(new BigDecimal("120.00"))))
                .thenReturn(true);

        ResponseEntity<?> response = controller.create(allowance);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("An allowance slab already exists for vehicle type 'DIESEL' overlapping with rate range 50.00 to 120.00.", response.getBody());
    }
}
