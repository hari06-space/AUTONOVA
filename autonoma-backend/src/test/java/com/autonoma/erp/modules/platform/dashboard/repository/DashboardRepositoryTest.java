package com.autonoma.erp.modules.platform.dashboard.repository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class DashboardRepositoryTest {

    @Autowired
    private DashboardRepository dashboardRepository;

    @Test
    @DisplayName("Test Meeting Attendance query performance and non-null result")
    public void testGetMeetingAttendance() {
        long start = System.currentTimeMillis();
        Map<String, Object> result = dashboardRepository.getMeetingAttendance("admin", LocalDate.now(), LocalDate.now(), "Mine", null);
        long duration = System.currentTimeMillis() - start;
        assertNotNull(result, "Result map should not be null");
        assertTrue(duration < 2000, "Query should complete under 2000ms, took: " + duration + "ms");
    }

    @Test
    @DisplayName("Test Meeting Minutes query performance and non-null result")
    public void testGetMeetingMinutes() {
        long start = System.currentTimeMillis();
        Map<String, Object> result = dashboardRepository.getMeetingMinutes("admin", LocalDate.now(), LocalDate.now(), "Mine", null);
        long duration = System.currentTimeMillis() - start;
        assertNotNull(result, "Result map should not be null");
        assertTrue(duration < 2000, "Query should complete under 2000ms, took: " + duration + "ms");
    }

    @Test
    @DisplayName("Test Meeting Close MOM query performance and non-null result")
    public void testGetMeetingCloseMom() {
        long start = System.currentTimeMillis();
        Map<String, Object> result = dashboardRepository.getMeetingCloseMom("admin", LocalDate.now(), LocalDate.now(), "Mine", null);
        long duration = System.currentTimeMillis() - start;
        assertNotNull(result, "Result map should not be null");
        assertTrue(duration < 2000, "Query should complete under 2000ms, took: " + duration + "ms");
    }

    @Test
    @DisplayName("Test Audit Attendance query performance and non-null result")
    public void testGetAuditAttendance() {
        long start = System.currentTimeMillis();
        Map<String, Object> result = dashboardRepository.getAuditAttendance("admin", LocalDate.now(), LocalDate.now(), "Mine", null);
        long duration = System.currentTimeMillis() - start;
        assertNotNull(result, "Result map should not be null");
        assertTrue(duration < 2000, "Query should complete under 2000ms, took: " + duration + "ms");
    }

    @Test
    @DisplayName("Test Checklist Master Verify query performance and non-null result")
    public void testGetChecklistMasterVerify() {
        long start = System.currentTimeMillis();
        Map<String, Object> result = dashboardRepository.getChecklistMasterVerify("admin", 5, "Mine", null);
        long duration = System.currentTimeMillis() - start;
        assertNotNull(result, "Result map should not be null");
        assertTrue(duration < 2000, "Query should complete under 2000ms, took: " + duration + "ms");
    }
}
