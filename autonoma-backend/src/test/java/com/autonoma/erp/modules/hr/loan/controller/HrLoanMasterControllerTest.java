package com.autonoma.erp.modules.hr.loan.controller;

import com.autonoma.erp.modules.hr.loan.entity.HrLoanMaster;
import com.autonoma.erp.modules.hr.loan.repository.HrLoanMasterRepository;
import com.autonoma.erp.modules.hr.loan.repository.HrLoanIssueRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class HrLoanMasterControllerTest {

    @Mock
    private HrLoanMasterRepository loanMasterRepository;

    @Mock
    private HrLoanIssueRepository loanIssueRepository;

    @InjectMocks
    private HrLoanMasterController controller;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Test create loan when Min Limit equals Max Limit - Should be allowed")
    public void testCreateLoan_SameMinAndMaxLimit_Success() {
        HrLoanMaster loan = new HrLoanMaster();
        loan.setLoanCode("001");
        loan.setLoanName("PERSONAL LOAN");
        loan.setMinLimit(5000.0);
        loan.setMaxLimit(5000.0);

        when(loanMasterRepository.existsByLoanCode("001")).thenReturn(false);
        when(loanMasterRepository.existsByLoanNameIgnoreCase("PERSONAL LOAN")).thenReturn(false);
        when(loanMasterRepository.save(any(HrLoanMaster.class))).thenReturn(loan);

        ResponseEntity<?> response = controller.create(loan);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof HrLoanMaster);
    }

    @Test
    @DisplayName("Test create loan when Min Limit is greater than Max Limit - Should be rejected")
    public void testCreateLoan_MinLimitGreaterThanMaxLimit_Rejected() {
        HrLoanMaster loan = new HrLoanMaster();
        loan.setLoanCode("002");
        loan.setLoanName("BANK LOAN");
        loan.setMinLimit(10000.0);
        loan.setMaxLimit(5000.0);

        when(loanMasterRepository.existsByLoanCode("002")).thenReturn(false);
        when(loanMasterRepository.existsByLoanNameIgnoreCase("BANK LOAN")).thenReturn(false);

        ResponseEntity<?> response = controller.create(loan);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Min Limit cannot be greater than Max Limit.", response.getBody());
    }
}
