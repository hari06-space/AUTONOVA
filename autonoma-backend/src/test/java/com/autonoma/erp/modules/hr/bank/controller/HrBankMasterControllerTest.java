package com.autonoma.erp.modules.hr.bank.controller;

import com.autonoma.erp.modules.hr.bank.entity.HrBankMaster;
import com.autonoma.erp.modules.hr.bank.repository.HrBankMasterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class HrBankMasterControllerTest {

    @Mock
    private HrBankMasterRepository bankMasterRepository;

    @InjectMocks
    private HrBankMasterController controller;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Test getNextCode - returns next formatted 3-digit bank code")
    public void testGetNextCode() {
        when(bankMasterRepository.findMaxBankCodeAsInt()).thenReturn(Optional.of(3));
        ResponseEntity<String> response = controller.getNextCode();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("004", response.getBody());
    }

    @Test
    @DisplayName("Test getNextCode - handles empty repository gracefully")
    public void testGetNextCode_EmptyRepo() {
        when(bankMasterRepository.findMaxBankCodeAsInt()).thenReturn(Optional.empty());
        ResponseEntity<String> response = controller.getNextCode();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("001", response.getBody());
    }

    @Test
    @DisplayName("Test getAll - returns all bank entries")
    public void testGetAllBanks() {
        HrBankMaster b1 = new HrBankMaster();
        b1.setBankCode("001");
        b1.setBankName("HDFC");

        HrBankMaster b2 = new HrBankMaster();
        b2.setBankCode("002");
        b2.setBankName("ICICI");

        when(bankMasterRepository.findAll()).thenReturn(Arrays.asList(b1, b2));

        List<HrBankMaster> response = controller.getAll();
        assertEquals(2, response.size());
    }

    @Test
    @DisplayName("Test getById - returns bank entry when found")
    public void testGetById_Found() {
        HrBankMaster bank = new HrBankMaster();
        bank.setBankCode("001");
        bank.setBankName("HDFC");

        when(bankMasterRepository.findById(1L)).thenReturn(Optional.of(bank));

        ResponseEntity<HrBankMaster> response = controller.getById(1L);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("001", response.getBody().getBankCode());
    }

    @Test
    @DisplayName("Test getById - returns 404 when not found")
    public void testGetById_NotFound() {
        when(bankMasterRepository.findById(999L)).thenReturn(Optional.empty());

        ResponseEntity<HrBankMaster> response = controller.getById(999L);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    @DisplayName("Test create bank - Success")
    public void testCreateBank_Success() {
        HrBankMaster bank = new HrBankMaster();
        bank.setBankCode("001");
        bank.setBankName("HDFC BANK");
        bank.setAccountNo("50100234567890");
        bank.setAccountHolderName("AUTONOMA ENTERPRISES");
        bank.setIfscCode("HDFC0001234");
        bank.setAccountType("CURRENT");

        when(bankMasterRepository.existsByBankCode("001")).thenReturn(false);
        when(bankMasterRepository.existsByAccountNo("50100234567890")).thenReturn(false);
        when(bankMasterRepository.save(any(HrBankMaster.class))).thenReturn(bank);

        ResponseEntity<?> response = controller.create(bank);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof HrBankMaster);
    }

    @Test
    @DisplayName("Test create bank - Duplicate Account Number Rejected")
    public void testCreateBank_DuplicateAccount_Rejected() {
        HrBankMaster bank = new HrBankMaster();
        bank.setBankCode("002");
        bank.setBankName("ICICI BANK");
        bank.setAccountNo("50100234567890");
        bank.setAccountHolderName("AUTONOMA ENTERPRISES");
        bank.setIfscCode("ICIC0005678");

        when(bankMasterRepository.existsByBankCode("002")).thenReturn(false);
        when(bankMasterRepository.existsByAccountNo("50100234567890")).thenReturn(true);

        ResponseEntity<?> response = controller.create(bank);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Account number"));
    }

    @Test
    @DisplayName("Test update bank - Success")
    public void testUpdateBank_Success() {
        HrBankMaster existing = new HrBankMaster();
        existing.setBankCode("001");
        existing.setBankName("HDFC BANK");
        existing.setAccountNo("50100234567890");

        HrBankMaster updated = new HrBankMaster();
        updated.setBankCode("001");
        updated.setBankName("HDFC BANK UPDATED");
        updated.setAccountNo("50100234567890");

        when(bankMasterRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(bankMasterRepository.existsByAccountNoAndIdNot("50100234567890", 1L)).thenReturn(false);
        when(bankMasterRepository.save(any(HrBankMaster.class))).thenReturn(updated);

        ResponseEntity<?> response = controller.update(1L, updated);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("Test update bank - Not Found")
    public void testUpdateBank_NotFound() {
        HrBankMaster updated = new HrBankMaster();
        when(bankMasterRepository.findById(999L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.update(999L, updated);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    @DisplayName("Test delete bank - Success")
    public void testDeleteBank_Success() {
        HrBankMaster bank = new HrBankMaster();
        when(bankMasterRepository.findById(1L)).thenReturn(Optional.of(bank));
        doNothing().when(bankMasterRepository).delete(bank);

        ResponseEntity<?> response = controller.delete(1L);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(bankMasterRepository, times(1)).delete(bank);
    }
}
