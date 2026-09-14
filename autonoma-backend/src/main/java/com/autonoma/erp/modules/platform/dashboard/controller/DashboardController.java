package com.autonoma.erp.modules.platform.dashboard.controller;

import com.autonoma.erp.modules.platform.dashboard.dto.DashboardResponseDto;
import com.autonoma.erp.modules.platform.dashboard.service.DashboardService;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * BOS Operational Monitoring Dashboard Controller.
 *
 * Endpoint: GET /api/dashboard/operational/widgets?fromDate=yyyy-MM-dd&toDate=yyyy-MM-dd
 *
 * Returns all permitted dashboard widgets for the logged-in user.
 * No @RequirePagePermission used here — page-level check is delegated to service
 * which gates each widget individually via BOS_USER_PAGE_AUTH.add_task_enable.
 *
 * Default date range: today (if not provided).
 */
@RestController
@RequestMapping("/api/dashboard/operational")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    /**
     * GET /api/dashboard/operational/widgets
     *
     * @param fromDate  Start date (yyyy-MM-dd). Defaults to today.
     * @param toDate    End date (yyyy-MM-dd). Defaults to today.
     * @return DashboardResponseDto containing all permission-gated widgets
     */
    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository empRepo;
    
    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository mapRepo;
    

    
    @GetMapping("/widgets")
    public ResponseEntity<DashboardResponseDto> getWidgets(
        @RequestParam(required = false) String fromDate,
        @RequestParam(required = false) String toDate,
        @RequestParam(required = false) String taskScope,
        @RequestParam(required = false) String memberId
    ) {
        String userId = SecurityUtils.getCurrentUserId();

        // Default to today if not provided
        String from = (fromDate != null && !fromDate.isBlank()) ? fromDate : LocalDate.now().toString();
        String to = (toDate != null && !toDate.isBlank()) ? toDate : LocalDate.now().toString();

        DashboardResponseDto response = dashboardService.buildDashboard(userId, from, to, taskScope, memberId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/dashboard/operational/widgets/stream
     *
     * @param fromDate  Start date (yyyy-MM-dd). Defaults to today.
     * @param toDate    End date (yyyy-MM-dd). Defaults to today.
     * @return SseEmitter for real-time dashboard updates
     */
    @GetMapping(value = "/widgets/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamWidgets(
        @RequestParam(required = false) String fromDate,
        @RequestParam(required = false) String toDate,
        @RequestParam(required = false) String taskScope,
        @RequestParam(required = false) String memberId,
        jakarta.servlet.http.HttpServletResponse response
    ) {
        // Prevent buffering in proxies (Nginx, Vite, etc.) and ensure SSE compatibility
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("X-Accel-Buffering", "no");

        String userId = SecurityUtils.getCurrentUserId();
        
        // 30 minutes timeout
        SseEmitter emitter = new SseEmitter(1800000L);

        // Default to today if not provided
        String from = (fromDate != null && !fromDate.isBlank()) ? fromDate : LocalDate.now().toString();
        String to = (toDate != null && !toDate.isBlank()) ? toDate : LocalDate.now().toString();

        dashboardService.streamDashboard(userId, from, to, taskScope, memberId, emitter);
        
        return emitter;
    }
}
