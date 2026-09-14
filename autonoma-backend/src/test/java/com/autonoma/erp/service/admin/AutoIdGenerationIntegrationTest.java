package com.autonoma.erp.service.admin;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Date;
import java.util.Calendar;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
public class AutoIdGenerationIntegrationTest {

    @Autowired
    private AutoIdGenerationService autoIdGenerationService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    public void setUp() {
        // Clean up settings/data for testing
        jdbcTemplate.update("DELETE FROM AD_PREFIX_CREDENTIALS WHERE ACCOUNT_YEAR IN ('2025-2026', '2026-2027', '2027-2028')");
        jdbcTemplate.update("DELETE FROM AD_DOCUMENT_SEQUENCE WHERE ACCOUNT_YEAR IN ('2025-2026', '2026-2027', '2027-2028')");
    }

    @Test
    @Transactional
    public void testGetAccountYear() {
        // Test April-March calculation
        // 05-Aug-2026 -> 2026-2027 (month index 7)
        Calendar cal = Calendar.getInstance();
        cal.set(2026, Calendar.AUGUST, 5);
        assertEquals("2026-2027", autoIdGenerationService.getAccountYear(cal.getTime()));

        // 15-Feb-2027 -> 2026-2027 (month index 1)
        cal.set(2027, Calendar.FEBRUARY, 15);
        assertEquals("2026-2027", autoIdGenerationService.getAccountYear(cal.getTime()));
        
        // 15-Mar-2026 -> 2025-2026 (month index 2)
        cal.set(2026, Calendar.MARCH, 15);
        assertEquals("2025-2026", autoIdGenerationService.getAccountYear(cal.getTime()));
    }

    @Test
    @Transactional
    public void testMissingConfiguration() {
        // Setup empty db -> should throw configuration missing error
        Exception exception = assertThrows(RuntimeException.class, () -> {
            autoIdGenerationService.previewNextCode("ATS_APPLICANT", new Date());
        });
        assertTrue(exception.getMessage().contains("Applicant ID generation is not configured"));
    }

    @Test
    @Transactional
    public void testInactiveConfiguration() {
        // Insert inactive config (status = 0)
        jdbcTemplate.update("INSERT INTO AD_PREFIX_CREDENTIALS (ACCOUNT_YEAR, STATUS, ATS_PREFIX, ATS_DIGIT, CREATED_BY, CREATED_DATE) VALUES ('2026-2027', 0, 'ATS-', 3, 'JUnit', GETDATE())");
        
        Calendar cal = Calendar.getInstance();
        cal.set(2026, Calendar.AUGUST, 5);
        
        Exception exception = assertThrows(RuntimeException.class, () -> {
            autoIdGenerationService.previewNextCode("ATS_APPLICANT", cal.getTime());
        });
        assertTrue(exception.getMessage().contains("disabled"));
    }

    @Test
    @Transactional
    public void testPrefixAndSuffixAndSeparatorSupport() {
        // 1. Prefix only: ATS-, Digits = 3
        jdbcTemplate.update("INSERT INTO AD_PREFIX_CREDENTIALS (ACCOUNT_YEAR, STATUS, ATS_PREFIX, ATS_SUFFIX, ATS_DIGIT, CREATED_BY, CREATED_DATE) VALUES ('2026-2027', 1, 'ATS-', '', 3, 'JUnit', GETDATE())");
        Calendar cal = Calendar.getInstance();
        cal.set(2026, Calendar.AUGUST, 5);
        
        String preview1 = autoIdGenerationService.previewNextCode("ATS_APPLICANT", cal.getTime());
        assertEquals("ATS-001", preview1);
        
        // 2. Prefix + suffix + custom separators: AP/ and /NWP, Digits = 5
        jdbcTemplate.update("UPDATE AD_PREFIX_CREDENTIALS SET ATS_PREFIX = 'AP/', ATS_SUFFIX = '/NWP', ATS_DIGIT = 5 WHERE ACCOUNT_YEAR = '2026-2027'");
        String preview2 = autoIdGenerationService.previewNextCode("ATS_APPLICANT", cal.getTime());
        assertEquals("AP/00001/NWP", preview2);
    }

    @Test
    @Transactional
    public void testSequenceIncrementAndPreviewNoConsumption() {
        jdbcTemplate.update("INSERT INTO AD_PREFIX_CREDENTIALS (ACCOUNT_YEAR, STATUS, ATS_PREFIX, ATS_DIGIT, CREATED_BY, CREATED_DATE) VALUES ('2026-2027', 1, 'ATS-', 3, 'JUnit', GETDATE())");
        Calendar cal = Calendar.getInstance();
        cal.set(2026, Calendar.AUGUST, 5);

        // Preview should not consume sequence (multiple calls return same preview)
        String preview1 = autoIdGenerationService.previewNextCode("ATS_APPLICANT", cal.getTime());
        String preview2 = autoIdGenerationService.previewNextCode("ATS_APPLICANT", cal.getTime());
        assertEquals("ATS-001", preview1);
        assertEquals("ATS-001", preview2);

        // Authoritative generation consumes sequence
        String code1 = autoIdGenerationService.generateNextCode("ATS_APPLICANT", cal.getTime(), "JUnit");
        assertEquals("ATS-001", code1);

        // Next preview should be ATS-002
        String preview3 = autoIdGenerationService.previewNextCode("ATS_APPLICANT", cal.getTime());
        assertEquals("ATS-002", preview3);

        // Next authoritative should be ATS-002
        String code2 = autoIdGenerationService.generateNextCode("ATS_APPLICANT", cal.getTime(), "JUnit");
        assertEquals("ATS-002", code2);
    }

    @Test
    @Transactional
    public void testSequenceOverflow() {
        jdbcTemplate.update("INSERT INTO AD_PREFIX_CREDENTIALS (ACCOUNT_YEAR, STATUS, ATS_PREFIX, ATS_DIGIT, CREATED_BY, CREATED_DATE) VALUES ('2026-2027', 1, 'ATS-', 2, 'JUnit', GETDATE())");
        
        Calendar cal = Calendar.getInstance();
        cal.set(2026, Calendar.AUGUST, 5);

        // Force sequence to 99
        jdbcTemplate.update("INSERT INTO AD_DOCUMENT_SEQUENCE (ACCOUNT_YEAR, DOCUMENT_TYPE, CURRENT_NUMBER, CREATED_BY, CREATED_DATE) VALUES ('2026-2027', 'ATS_APPLICANT', 99, 'JUnit', GETDATE())");

        // Generating next (100) should throw sequence overflow exception
        Exception exception = assertThrows(RuntimeException.class, () -> {
            autoIdGenerationService.generateNextCode("ATS_APPLICANT", cal.getTime(), "JUnit");
        });
        assertTrue(exception.getMessage().contains("limit exceeded"));
    }

    @Test
    @Transactional
    public void testFinancialYearTransitionAndSamePrefix() {
        // Setup two years with the same prefix
        jdbcTemplate.update("INSERT INTO AD_PREFIX_CREDENTIALS (ACCOUNT_YEAR, STATUS, ATS_PREFIX, ATS_DIGIT, CREATED_BY, CREATED_DATE) VALUES ('2026-2027', 1, 'ATS-', 3, 'JUnit', GETDATE())");
        jdbcTemplate.update("INSERT INTO AD_PREFIX_CREDENTIALS (ACCOUNT_YEAR, STATUS, ATS_PREFIX, ATS_DIGIT, CREATED_BY, CREATED_DATE) VALUES ('2027-2028', 1, 'ATS-', 3, 'JUnit', GETDATE())");

        Calendar cal1 = Calendar.getInstance();
        cal1.set(2026, Calendar.AUGUST, 5); // 2026-2027
        
        Calendar cal2 = Calendar.getInstance();
        cal2.set(2027, Calendar.AUGUST, 5); // 2027-2028

        // Year 1 code 1
        String code1 = autoIdGenerationService.generateNextCode("ATS_APPLICANT", cal1.getTime(), "JUnit");
        assertEquals("ATS-001", code1);

        // Transition to Year 2: sequence must restart at 1
        String code2 = autoIdGenerationService.generateNextCode("ATS_APPLICANT", cal2.getTime(), "JUnit");
        assertEquals("ATS-001", code2);

        // Back to Year 1: should continue Year 1 sequence
        String code3 = autoIdGenerationService.generateNextCode("ATS_APPLICANT", cal1.getTime(), "JUnit");
        assertEquals("ATS-002", code3);
    }
}
