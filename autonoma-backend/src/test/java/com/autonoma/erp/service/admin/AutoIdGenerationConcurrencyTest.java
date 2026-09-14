package com.autonoma.erp.service.admin;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Date;
import java.util.Calendar;
import java.util.List;
import java.util.ArrayList;
import java.util.Collections;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest
public class AutoIdGenerationConcurrencyTest {

    @Autowired
    private AutoIdGenerationService autoIdGenerationService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void testConcurrentFirstTimeInitializations() throws Exception {
        // Clean up
        jdbcTemplate.update("DELETE FROM AD_PREFIX_CREDENTIALS WHERE ACCOUNT_YEAR = '2026-2027'");
        jdbcTemplate.update("DELETE FROM AD_DOCUMENT_SEQUENCE WHERE ACCOUNT_YEAR = '2026-2027'");

        // Setup configuration
        jdbcTemplate.update("INSERT INTO AD_PREFIX_CREDENTIALS (ACCOUNT_YEAR, STATUS, ATS_PREFIX, ATS_DIGIT, CREATED_BY, CREATED_DATE) VALUES ('2026-2027', 1, 'ATS-', 3, 'JUnit', GETDATE())");

        Calendar cal = Calendar.getInstance();
        cal.set(2026, Calendar.AUGUST, 5);
        Date testDate = cal.getTime();

        int numThreads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        List<String> results = Collections.synchronizedList(new ArrayList<>());
        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < numThreads; i++) {
            futures.add(executor.submit(() -> {
                try {
                    String code = autoIdGenerationService.generateNextCode("ATS_APPLICANT", testDate, "JUnit-Concurrent");
                    results.add(code);
                } catch (Exception e) {
                    System.err.println("Concurrent generation error: " + e.getMessage());
                }
            }));
        }

        for (Future<?> f : futures) {
            f.get();
        }

        executor.shutdown();
        executor.awaitTermination(5, TimeUnit.SECONDS);

        // Verify that we got exactly 10 unique codes from ATS-001 to ATS-010
        assertEquals(numThreads, results.size());
        
        // Assert no duplicates
        long uniqueCount = results.stream().distinct().count();
        assertEquals(numThreads, uniqueCount, "Should have no duplicate generated codes!");

        // Assert all expected values exist
        for (int i = 1; i <= numThreads; i++) {
            String expected = String.format("ATS-%03d", i);
            assertTrue(results.contains(expected), "Should contain " + expected);
        }
        
        // Clean up
        jdbcTemplate.update("DELETE FROM AD_PREFIX_CREDENTIALS WHERE ACCOUNT_YEAR = '2026-2027'");
        jdbcTemplate.update("DELETE FROM AD_DOCUMENT_SEQUENCE WHERE ACCOUNT_YEAR = '2026-2027'");
    }
}
