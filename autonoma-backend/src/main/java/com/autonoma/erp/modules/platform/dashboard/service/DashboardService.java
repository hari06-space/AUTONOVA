package com.autonoma.erp.modules.platform.dashboard.service;

import com.autonoma.erp.modules.platform.dashboard.dto.DashboardMetricDto;
import com.autonoma.erp.modules.platform.dashboard.dto.DashboardResponseDto;
import com.autonoma.erp.modules.platform.dashboard.dto.DashboardWidgetDto;
import com.autonoma.erp.modules.platform.dashboard.repository.DashboardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static com.autonoma.erp.modules.platform.dashboard.repository.DashboardRepository.getLong;

@Service
public class DashboardService {

        @Autowired
        private DashboardRepository dashboardRepository;

        @Autowired
        private com.autonoma.erp.modules.qms.checklist.service.ChecklistService checklistService;

        // Bounded executor: max 16 concurrent dashboard threads per JVM, prevents
        // connection-pool exhaustion during SSE burst traffic.
        private final ExecutorService virtualExecutor = new ThreadPoolExecutor(
                8, 16, 60L, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(100),
                new ThreadPoolExecutor.CallerRunsPolicy());

        // Registry: limits each user to 1 active SSE emitter
        private final ConcurrentHashMap<String, org.springframework.web.servlet.mvc.method.annotation.SseEmitter> activeEmitters = new ConcurrentHashMap<>();

        private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

        public DashboardResponseDto buildDashboard(String userId, String fromDateStr, String toDateStr, String taskScope, String memberId) {
                LocalDate today = LocalDate.now();
                String tempUserId = userId;
                String tempTaskScope = taskScope;
                if (memberId != null && !memberId.trim().isEmpty() && !"All".equalsIgnoreCase(memberId)) {
                        String memberUserId = dashboardRepository.getUserIdByEmpId(memberId);
                        if (memberUserId != null) {
                                tempUserId = memberUserId;
                                tempTaskScope = "Mine";
                        }
                }
                final String finalUserId = tempUserId;
                final String finalTaskScope = tempTaskScope;
                int userLevel = dashboardRepository.getUserLevel(finalUserId);

                List<CompletableFuture<List<DashboardWidgetDto>>> futures = List.of(
                                CompletableFuture.supplyAsync(
                                                () -> safeBuild("MEETING", () -> buildMeetingWidgets(finalUserId, today, today, userLevel, finalTaskScope, memberId)), virtualExecutor),
                                CompletableFuture.supplyAsync(
                                                () -> safeBuild("APPLICANT TRACKING SYSTEM (ATS)", () -> buildAtsWidgets(finalUserId, today, today, userLevel, finalTaskScope, memberId)), virtualExecutor),
                                CompletableFuture.supplyAsync(
                                                () -> safeBuild("AUDIT", () -> buildAuditWidgets(finalUserId, today, today, userLevel, finalTaskScope, memberId)), virtualExecutor),
                                CompletableFuture.supplyAsync(
                                                () -> safeBuild("CHECK LIST", () -> buildChecklistWidgets(finalUserId, today, today, userLevel, finalTaskScope, memberId)), virtualExecutor),
                                CompletableFuture.supplyAsync(
                                                () -> safeBuild("INDUCTION", () -> {
                                                        DashboardWidgetDto induction = buildInductionWidget(finalUserId, userLevel, finalTaskScope, memberId);
                                                        return induction != null ? List.of(induction) : Collections.emptyList();
                                                }), virtualExecutor),
                                CompletableFuture.supplyAsync(
                                                () -> safeBuild("QUOTATION", () -> buildQuotationWidgets(finalUserId, today, today, userLevel, finalTaskScope, memberId)), virtualExecutor),
                                CompletableFuture.supplyAsync(
                                                () -> safeBuild("FOLLOW UP", () -> buildFollowUpWidgets(finalUserId, userLevel, finalTaskScope, memberId)), virtualExecutor),
                                CompletableFuture.supplyAsync(
                                                () -> safeBuild("EMPLOYEE", () -> buildEmployeeWidgets(finalUserId, today, today, userLevel, finalTaskScope, memberId)), virtualExecutor),
                                CompletableFuture.supplyAsync(
                                                () -> safeBuild("OCR", () -> buildOcrWidgets(finalUserId, today, today, userLevel, finalTaskScope, memberId)), virtualExecutor),
                                CompletableFuture.supplyAsync(
                                                () -> safeBuild("PRICING", () -> buildPricingWidgets(finalUserId, userLevel, finalTaskScope, memberId)), virtualExecutor),
                                CompletableFuture.supplyAsync(
                                                () -> safeBuild("PLANNING", () -> buildPlanningWidgets(finalUserId, userLevel, finalTaskScope, memberId)), virtualExecutor),
                                CompletableFuture.supplyAsync(
                                                () -> safeBuild("PURCHASE", () -> buildPurchaseWidgets(finalUserId, userLevel, finalTaskScope, memberId)), virtualExecutor),
                                CompletableFuture.supplyAsync(
                                                () -> safeBuild("PRODUCTION", () -> buildProductionWidgets(finalUserId, userLevel, finalTaskScope, memberId)), virtualExecutor),
                                CompletableFuture.supplyAsync(
                                                () -> safeBuild("STORE", () -> buildStoreWidgets(finalUserId, userLevel, finalTaskScope, memberId)), virtualExecutor),
                                CompletableFuture.supplyAsync(
                                                () -> safeBuild("QUALITY", () -> buildQualityWidgets(finalUserId, userLevel, finalTaskScope, memberId)), virtualExecutor));

                List<DashboardWidgetDto> widgets = futures.stream()
                                .map(CompletableFuture::join)
                                .flatMap(List::stream)
                                .filter(Objects::nonNull)
                                .collect(Collectors.toList());

                DashboardResponseDto response = new DashboardResponseDto();
                if ("Mine".equals(finalTaskScope)) {
                    applyCurrentUserToUrls(widgets, finalUserId, userId);
                }
                response.setWidgets(widgets);
                response.setGeneratedAt(LocalDateTime.now().format(DT_FMT));
                response.setFromDate(today.toString());
                response.setToDate(today.toString());
                return response;
        }

        public void streamDashboard(String userId, String fromDateStr, String toDateStr, String taskScope, String memberId,
                        org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter) {
                java.util.concurrent.atomic.AtomicBoolean isActive = new java.util.concurrent.atomic.AtomicBoolean(true);

                Thread virtualThread = Thread.ofVirtual().unstarted(() -> {
                        try {
                                // Allow Spring MVC to fully initialize and flush the HTTP response headers
                                Thread.sleep(500);
                                while (isActive.get() && !Thread.currentThread().isInterrupted()) {
                                        // Send clear signal at the start of a refresh cycle
                                        try {
                                                synchronized (emitter) {
                                                        emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter
                                                                .event().data(Map.of("type", "CLEAR")));
                                                        System.out.println("SSE: Sent CLEAR");
                                                }
                                        } catch (IllegalStateException e) {
                                                System.out.println("SSE client disconnected before first event");
                                                isActive.set(false);
                                                break;
                                        }

                                        LocalDate today = LocalDate.now();
                                        String tempUserId = userId;
                String tempTaskScope = taskScope;
                if (memberId != null && !memberId.trim().isEmpty() && !"All".equalsIgnoreCase(memberId)) {
                        String memberUserId = dashboardRepository.getUserIdByEmpId(memberId);
                        if (memberUserId != null) {
                                tempUserId = memberUserId;
                                tempTaskScope = "Mine";
                        }
                }
                final String finalUserId = tempUserId;
                final String finalTaskScope = tempTaskScope;
                int userLevel = dashboardRepository.getUserLevel(finalUserId);

                                        List<CompletableFuture<Void>> futures = List.of(
                                                        CompletableFuture.runAsync(() -> sendWidgets(emitter,
                                                                        safeBuild("MEETING", () -> buildMeetingWidgets(finalUserId, today, today, userLevel, finalTaskScope, memberId))), virtualExecutor),
                                                        CompletableFuture.runAsync(() -> sendWidgets(emitter,
                                                                        safeBuild("APPLICANT TRACKING SYSTEM (ATS)", () -> buildAtsWidgets(finalUserId, today, today, userLevel, finalTaskScope, memberId))), virtualExecutor),
                                                        CompletableFuture.runAsync(() -> sendWidgets(emitter,
                                                                        safeBuild("AUDIT", () -> buildAuditWidgets(finalUserId, today, today, userLevel, finalTaskScope, memberId))), virtualExecutor),
                                                        CompletableFuture.runAsync(() -> sendWidgets(emitter,
                                                                        safeBuild("CHECK LIST", () -> buildChecklistWidgets(finalUserId, today, today, userLevel, finalTaskScope, memberId))), virtualExecutor),
                                                        CompletableFuture.runAsync(() -> {
                                                                List<DashboardWidgetDto> widgets = safeBuild("INDUCTION", () -> {
                                                                        DashboardWidgetDto induction = buildInductionWidget(
                                                                                        finalUserId, userLevel, finalTaskScope, memberId);
                                                                        return induction != null
                                                                                        ? List.of(induction)
                                                                                        : Collections.emptyList();
                                                                });
                                                                sendWidgets(emitter, widgets);
                                                        }, virtualExecutor),
                                                        CompletableFuture.runAsync(() -> sendWidgets(emitter,
                                                                        safeBuild("QUOTATION", () -> buildQuotationWidgets(finalUserId, today, today, userLevel, finalTaskScope, memberId))), virtualExecutor),
                                                        CompletableFuture.runAsync(() -> sendWidgets(emitter,
                                                                        safeBuild("FOLLOW UP", () -> buildFollowUpWidgets(finalUserId, userLevel, finalTaskScope, memberId))), virtualExecutor),
                                                        CompletableFuture.runAsync(() -> sendWidgets(emitter,
                                                                        safeBuild("EMPLOYEE", () -> buildEmployeeWidgets(finalUserId, today, today, userLevel, finalTaskScope, memberId))), virtualExecutor),
                                                        CompletableFuture.runAsync(() -> sendWidgets(emitter,
                                                                        safeBuild("OCR", () -> buildOcrWidgets(finalUserId, today, today, userLevel, finalTaskScope, memberId))), virtualExecutor),
                                                        CompletableFuture.runAsync(() -> sendWidgets(emitter,
                                                                        safeBuild("PRICING", () -> buildPricingWidgets(finalUserId, userLevel, finalTaskScope, memberId))), virtualExecutor),
                                                        CompletableFuture.runAsync(() -> sendWidgets(emitter,
                                                                        safeBuild("PLANNING", () -> buildPlanningWidgets(finalUserId, userLevel, finalTaskScope, memberId))), virtualExecutor),
                                                        CompletableFuture.runAsync(() -> sendWidgets(emitter,
                                                                        safeBuild("PURCHASE", () -> buildPurchaseWidgets(finalUserId, userLevel, finalTaskScope, memberId))), virtualExecutor),
                                                        CompletableFuture.runAsync(() -> sendWidgets(emitter,
                                                                        safeBuild("PRODUCTION", () -> buildProductionWidgets(finalUserId, userLevel, finalTaskScope, memberId))), virtualExecutor),
                                                        CompletableFuture.runAsync(() -> sendWidgets(emitter,
                                                                        safeBuild("STORE", () -> buildStoreWidgets(finalUserId, userLevel, finalTaskScope, memberId))), virtualExecutor),
                                                        CompletableFuture.runAsync(() -> sendWidgets(emitter,
                                                                        safeBuild("QUALITY", () -> buildQualityWidgets(finalUserId, userLevel, finalTaskScope, memberId))), virtualExecutor)
                                        );

                                        // Wait for all to finish this cycle before sleeping
                                        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
                                        System.out.println("SSE: Finished all queries");

                                        // Sleep before next refresh cycle
                                        Thread.sleep(60000);
                                }
                        } catch (InterruptedException e) {
                                // Thread was interrupted (emitter finished/timeout/error), exit gracefully
                        } catch (Exception e) {
                                isActive.set(false);
                                if (isClientDisconnect(e)) {
                                        System.out.println("SSE stream completed (client disconnected).");
                                } else {
                                        System.err.println("Dashboard stream error: " + e.getMessage());
                                }
                                try {
                                        emitter.complete();
                                } catch (Exception ignored) {}
                        }
                });

                emitter.onCompletion(() -> {
                        isActive.set(false);
                        virtualThread.interrupt();
                });
                emitter.onTimeout(() -> {
                        isActive.set(false);
                        virtualThread.interrupt();
                });
                emitter.onError((e) -> {
                        isActive.set(false);
                        virtualThread.interrupt();
                });

                virtualThread.start();
        }

        private boolean isClientDisconnect(Throwable t) {
                while (t != null) {
                        if (t instanceof java.io.IOException ||
                                t instanceof IllegalStateException ||
                                t.getClass().getSimpleName().contains("ClientAbortException") ||
                                t.getClass().getSimpleName().contains("AsyncRequestNotUsableException") ||
                                (t.getMessage() != null && (
                                        t.getMessage().contains("Broken pipe") ||
                                        t.getMessage().contains("aborted by the software") ||
                                        t.getMessage().contains("connection reset") ||
                                        t.getMessage().contains("Client disconnected") ||
                                        t.getMessage().contains("ServletOutputStream failed to flush")
                                ))) {
                                return true;
                        }
                        t = t.getCause();
                }
                return false;
        }

        private List<DashboardWidgetDto> applyCurrentUserToUrls(List<DashboardWidgetDto> widgets, String effectiveUserId, String originalUserId) {
                if (effectiveUserId != null && !effectiveUserId.equals(originalUserId) && widgets != null) {
                        for (DashboardWidgetDto widget : widgets) {
                                if (widget.getMetrics() != null) {
                                        for (DashboardMetricDto metric : widget.getMetrics()) {
                                                if (metric.getNavigateUrl() != null && !metric.getNavigateUrl().isEmpty()) {
                                                        String url = metric.getNavigateUrl();
                                                        url += (url.contains("?") ? "&" : "?") + "currentUser=" + effectiveUserId;
                                                        metric.setNavigateUrl(url);
                                                }
                                        }
                                }
                        }
                }
                return widgets;
        }

        private void sendWidgets(org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter,
                        List<DashboardWidgetDto> widgets) {
                if (widgets == null || widgets.isEmpty())
                        return;
                try {
                        synchronized (emitter) {
                                emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event()
                                                .data(Map.of("type", "WIDGETS", "widgets", widgets)));
                        }
                } catch (Exception e) {
                        if (isClientDisconnect(e)) {
                                // Client disconnected (page refreshed or navigated away), silently exit
                                return;
                        }
                        System.err.println("Failed to send widget data: " + e.getMessage());
                }
        }

        private List<DashboardWidgetDto> safeBuild(String type, java.util.function.Supplier<List<DashboardWidgetDto>> supplier) {
                try {
                        return supplier.get();
                } catch (Exception e) {
                        System.err.println("Dashboard build failed for " + type + ": " + e.getMessage());
                        e.printStackTrace();
                        return List.of(errorWidget(type, "Error loading " + type + " data"));
                }
        }

        private DashboardWidgetDto errorWidget(String type, String message) {
                DashboardWidgetDto widget = new DashboardWidgetDto();
                widget.setReportType(type);
                widget.setReportSubType("ERROR");
                widget.setDisplayName(message);
                widget.setIconName("IconAlertTriangle");
                widget.setPermitted(true);
                widget.setMetrics(List.of(new DashboardMetricDto("Status", 0, "danger", null)));
                return widget;
        }

        private List<DashboardWidgetDto> buildMeetingWidgets(String userId, LocalDate from, LocalDate to,
                        int userLevel, String taskScope, String memberId) {
                List<DashboardWidgetDto> list = new ArrayList<>();

                if (dashboardRepository.hasWidgetPermission(userId, "QM1320", userLevel)) {
                        Map<String, Object> att = dashboardRepository.getMeetingAttendance(userId, from, to, taskScope, memberId);
                        list.add(new DashboardWidgetDto("MEETING", "ATTENDANCE", "Meeting Attendance", "IconCalendarEvent",
                                        "/qms/meeting-attendance",
                                        List.of(
                                                        metric("Total", getLong(att, "upcomingCount") + getLong(att, "pendingCount"), "info",
                                                                        "/qms/meeting-attendance"),
                                                        metric("Today", getLong(att, "todayCount"), "info",
                                                                        "/qms/meeting-attendance?dashboardFilter=today"),
                                                        metric("Upcoming", getLong(att, "upcomingCount"), "info",
                                                                        "/qms/meeting-attendance?dashboardFilter=upcoming"),
                                                        metric("Absent", getLong(att, "absentCount"), "danger",
                                                                        "/qms/meeting-attendance?dashboardFilter=absent"),
                                                        metric("Pending", getLong(att, "pendingCount"), "warning",
                                                                        "/qms/meeting-attendance?dashboardFilter=pending"))));
                }

                // Meeting Status widget removed as per user request

                if (dashboardRepository.hasWidgetPermission(userId, "QM1330", userLevel)) {
                        Map<String, Object> minutes = dashboardRepository.getMeetingMinutes(userId, from, to, taskScope, memberId);
                        list.add(new DashboardWidgetDto("MEETING", "MINUTES", "Meeting MOM", "IconNotes", "/qms/minutesofmeeting",
                                        List.of(
                                                        metric("Total", getLong(minutes, "todayCount"), "info",
                                                                        "/qms/minutesofmeeting"),
                                                        metric("Today", getLong(minutes, "todayCount"), "info",
                                                                        "/qms/minutesofmeeting?dashboardFilter=today"),
                                                        metric("Open", getLong(minutes, "todayOpenCount"), "default",
                                                                        "/qms/minutesofmeeting?dashboardFilter=open"),
                                                        metric("Pending For Approval", getLong(minutes, "todayPendingCount"), "warning",
                                                                        "/qms/minutesofmeeting?dashboardFilter=pendingForApproval"),
                                                        metric("Cancelled", getLong(minutes, "todayCancelledCount"), "danger",
                                                                        "/qms/minutesofmeeting?dashboardFilter=cancelled"),
                                                        metric("Closed", getLong(minutes, "todayClosedCount"), "success",
                                                                        "/qms/minutesofmeeting?dashboardFilter=closed"))));
                }

                boolean closeMomPerm = dashboardRepository.hasWidgetPermission(userId, "QM1340", userLevel);
                if (closeMomPerm) {
                        try {
                                Map<String, Object> close = dashboardRepository.getMeetingCloseMom(userId, from, to, taskScope, memberId);
                                list.add(new DashboardWidgetDto("MEETING", "CLOSE MOM", "Close MOM", "IconCheckbox",
                                                "/qms/close-mom",
                                                List.of(
                                                                metric("Total", getLong(close, "totalCount"), "info",
                                                                                "/qms/close-mom"),
                                                                metric("Today", getLong(close, "todayCount"), "info",
                                                                                "/qms/close-mom?dashboardFilter=today"),
                                                                metric("Overdue", getLong(close, "overdueCount"), "danger",
                                                                                "/qms/close-mom?dashboardFilter=overdue"),
                                                                metric("Pending", getLong(close, "pendingCount"), "warning",
                                                                                "/qms/close-mom?dashboardFilter=pending"),
                                                                metric("Closed", getLong(close, "closedCount"), "success",
                                                                                "/qms/close-mom?dashboardFilter=closed"))));
                        } catch (Exception ex) {
                                System.err.println("DEBUG QM1340 ERROR: " + ex.getMessage());
                                ex.printStackTrace();
                        }
                }

                if (dashboardRepository.hasWidgetPermission(userId, "QM1350", userLevel)) {
                        Map<String, Object> verify = dashboardRepository.getMeetingVerifyMom(userId, from, to, taskScope, memberId);
                        list.add(new DashboardWidgetDto("MEETING", "VERIFY MOM", "Verify MOM", "IconShieldCheck",
                                        "/qms/mom-approval",
                                        List.of(
                                                        metric("Total", getLong(verify, "totalCount"), "info",
                                                                        "/qms/mom-approval"),
                                                        metric("Today", getLong(verify, "todayCount"), "info",
                                                                        "/qms/mom-approval?dashboardFilter=today"),
                                                        metric("Overdue", getLong(verify, "overdueCount"), "danger",
                                                                        "/qms/mom-approval?dashboardFilter=overdue"),
                                                        metric("Pending", getLong(verify, "openCount"), "warning",
                                                                        "/qms/mom-approval?dashboardFilter=pending"))));
                }

                return list;
        }

        private List<DashboardWidgetDto> buildAtsWidgets(String userId, LocalDate from, LocalDate to, int userLevel, String taskScope, String memberId) {
                boolean permitted = dashboardRepository.hasWidgetPermission(userId, "HA1110", userLevel);
                if (!permitted)
                        return Collections.emptyList();

                List<DashboardWidgetDto> list = new ArrayList<>();

                Map<String, Object> callLetterStats = dashboardRepository.getAtsCallLetter(userId, from, to, taskScope, memberId);
                long pendingVal = getLong(callLetterStats, "pendingCount");
                long toBeVerifiedVal = getLong(callLetterStats, "toBeVerifiedCount");
                long totalVal = pendingVal + toBeVerifiedVal;

                list.add(new DashboardWidgetDto("APPLICANT TRACKING SYSTEM (ATS)", "CALL LETTER", "Call Letter",
                                "IconMail",
                                "/hra/ats",
                                List.of(
                                                metric("Total", totalVal, "primary", "/hra/ats?dashboardFilter=callLetterTotal"),
                                                metric("Pending", pendingVal, "info", "/hra/ats?dashboardFilter=callLetterPending"),
                                                metric("To Be Verify", toBeVerifiedVal, "warning", "/hra/ats?dashboardFilter=callLetterToBeVerify"))));

                Map<String, Object> is = dashboardRepository.getAtsInterviewSchedule(userId, from, to, taskScope, memberId);
                long isPendingVal = getLong(is, "pendingCount");
                long isTotalVal = isPendingVal;
                list.add(new DashboardWidgetDto("APPLICANT TRACKING SYSTEM (ATS)", "INTERVIEW SCHEDULE",
                                "Interview Schedule",
                                "IconCalendar", "/hra/ats",
                                List.of(
                                                metric("Total", isTotalVal, "primary", "/hra/ats?dashboardFilter=interviewScheduleTotal"),
                                                metric("Pending", isPendingVal, "info", "/hra/ats?dashboardFilter=interviewSchedulePending"))));

                Map<String, Object> ip = dashboardRepository.getAtsInterviewProcess(userId, from, to, taskScope, memberId);
                long ipOverdueVal = getLong(ip, "overdueCount");
                long ipWaitingVal = getLong(ip, "waitingCount");
                long ipPendingVal = getLong(ip, "pendingCount");
                long ipTotalVal = ipOverdueVal + ipWaitingVal + ipPendingVal;
                list.add(new DashboardWidgetDto("APPLICANT TRACKING SYSTEM (ATS)", "INTERVIEW PROCESS",
                                "Interview Process",
                                "IconUserSearch", "/hra/ats/interview-process",
                                List.of(
                                                metric("Total", ipTotalVal, "primary", "/hra/ats/interview-process?dashboardFilter=interviewProcessTotal"),
                                                metric("Overdue", ipOverdueVal, "danger", "/hra/ats/interview-process?dashboardFilter=interviewProcessOverdue"),
                                                metric("Waiting For Process", ipWaitingVal, "warning", "/hra/ats/interview-process?dashboardFilter=interviewProcessWaiting"),
                                                metric("Pending", ipPendingVal, "warning", "/hra/ats/interview-process?dashboardFilter=interviewProcessPending"))));

                Map<String, Object> ol = dashboardRepository.getAtsOfferLetter(userId, from, to, taskScope, memberId);
                long olPendingVal = getLong(ol, "pendingCount");
                long olTotalVal = olPendingVal;
                list.add(new DashboardWidgetDto("APPLICANT TRACKING SYSTEM (ATS)", "OFFER LETTER", "Offer Letter",
                                "IconFileText", "/hra/ats",
                                List.of(
                                                metric("Total", olTotalVal, "primary", "/hra/ats?dashboardFilter=offerLetterTotal"),
                                                metric("Pending", olPendingVal, "info", "/hra/ats?dashboardFilter=offerLetterPending"))));

                Map<String, Object> ver = dashboardRepository.getAtsVerification(userId, from, to, taskScope, memberId);
                long verPendingVal = getLong(ver, "pendingCount");
                long verTotalVal = verPendingVal;
                list.add(new DashboardWidgetDto("APPLICANT TRACKING SYSTEM (ATS)", "VERIFICATION", "Verification",
                                "IconShield",
                                "/hra/ats",
                                List.of(
                                                metric("Total", verTotalVal, "primary", "/hra/ats?dashboardFilter=verificationTotal"),
                                                metric("Pending", verPendingVal, "info", "/hra/ats?dashboardFilter=verificationPending"))));

                Map<String, Object> ob = dashboardRepository.getAtsOnboarding(userId, from, to, taskScope, memberId);
                long obPendingVal = getLong(ob, "pendingCount");
                long obTotalVal = obPendingVal;
                list.add(new DashboardWidgetDto("APPLICANT TRACKING SYSTEM (ATS)", "ONBOARDING", "Onboarding",
                                "IconUserCheck",
                                "/hra/ats",
                                List.of(
                                                metric("Total", obTotalVal, "primary", "/hra/ats?dashboardFilter=onboardingTotal"),
                                                metric("Pending", obPendingVal, "info", "/hra/ats?dashboardFilter=onboardingPending"))));

                return list;
        }

  private List<DashboardWidgetDto> buildAuditWidgets(String userId, LocalDate from, LocalDate to, int userLevel, String taskScope, String memberId) {
    List<DashboardWidgetDto> list = new ArrayList<>();

    if (dashboardRepository.hasWidgetPermission(userId, "QM1210", userLevel)) {
      Map<String, Object> att = dashboardRepository.getAuditAttendance(userId, from, to, taskScope, memberId);
      long attToday = getLong(att, "todayCount");
      long attReschedule = getLong(att, "rescheduleCount");
      long attPending = getLong(att, "pendingCount");
      long attClosed = getLong(att, "closedCount");
      list.add(new DashboardWidgetDto("AUDIT", "ATTENDANCE", "Audit Schedule", "IconClipboardList",
          "/qms/audit/schedule",
          List.of(
              metric("Total", attToday + attReschedule + attPending + attClosed, "info", "/qms/audit/schedule"),
              metric("Today", attToday, "info", "/qms/audit/schedule?dashboardFilter=today"),
              metric("Re-Schedule", attReschedule, "warning", "/qms/audit/schedule?dashboardFilter=reschedule"),
              metric("Pending", attPending, "warning", "/qms/audit/schedule?dashboardFilter=pending"),
              metric("Closed", attClosed, "success", "/qms/audit/schedule?dashboardFilter=closed"))));
    }

    if (dashboardRepository.hasWidgetPermission(userId, "QM1240", userLevel)) {
      Map<String, Object> close = dashboardRepository.getAuditCloseNcr(userId, from, to, taskScope, memberId);
      long closeToday = getLong(close, "todayCount");
      long closeOverdue = getLong(close, "overdueCount");
      long closePending = getLong(close, "pendingCount");
      long closeClosed = getLong(close, "closedCount");
      list.add(new DashboardWidgetDto("AUDIT", "CLOSE NCR", "Close NCR", "IconAlertTriangle",
          "/qms/audit/ncr/close",
          List.of(
              metric("Total", closeOverdue + closePending, "info", "/qms/audit/ncr/close"),
              metric("Today", closeToday, "info", "/qms/audit/ncr/close?dashboardFilter=today&status=PENDING"),
              metric("Overdue", closeOverdue, "danger", "/qms/audit/ncr/close?dashboardFilter=overdue&status=PENDING"),
              metric("Pending", closePending, "warning", "/qms/audit/ncr/close?dashboardFilter=pending&status=PENDING,UNRESOLVED"),
              metric("Closed", closeClosed, "success", "/qms/audit/ncr/close?status=VERIFIED"))));
    }

    if (dashboardRepository.hasWidgetPermission(userId, "QM1250", userLevel)) {
      Map<String, Object> verify = dashboardRepository.getAuditVerifyNcr(userId, from, to, taskScope, memberId);
      long verifyToday = getLong(verify, "todayCount");
      long verifyOverdue = getLong(verify, "overdueCount");
      long verifyPending = getLong(verify, "pendingCount");
      list.add(new DashboardWidgetDto("AUDIT", "VERIFY NCR", "Verify NCR", "IconShieldCheck",
          "/qms/audit/ncr/approval",
          List.of(
              metric("Total", verifyOverdue + verifyPending, "info", "/qms/audit/ncr/approval"),
              metric("Today", verifyToday, "info", "/qms/audit/ncr/approval?dashboardFilter=today&status=PENDING FOR VERIFY"),
              metric("Overdue", verifyOverdue, "danger", "/qms/audit/ncr/approval?dashboardFilter=overdue&status=PENDING FOR VERIFY"),
              metric("Pending", verifyPending, "warning", "/qms/audit/ncr/approval?dashboardFilter=pending&status=PENDING FOR VERIFY"))));
    }

    return list;
  }

        private List<DashboardWidgetDto> buildChecklistWidgets(String userId, LocalDate from, LocalDate to,
                        int userLevel, String taskScope, String memberId) {
                List<DashboardWidgetDto> list = new ArrayList<>();

                if (dashboardRepository.hasWidgetPermission(userId, "QM1110", userLevel)) {
                        Map<String, Object> mv = dashboardRepository.getChecklistMasterVerify(userId, userLevel, taskScope, memberId);
                        long totalMasterVerify = getLong(mv, "openCount") + getLong(mv, "overdueCount");
                        
                        list.add(new DashboardWidgetDto("CHECK LIST", "MASTER VERIFY", "Master Verify", "IconChecks",
                                        "/qms/checklist/verify",
                                        List.of(
                                                        metric("Total", getLong(mv, "openCount"), "info", "/qms/checklist/verify?status=To Be Verified"),
                                                        metric("To Be Verified", getLong(mv, "openCount"), "warning", "/qms/checklist/verify?status=To Be Verified"),
                                                        metric("Rejected", getLong(mv, "overdueCount"), "danger", "/qms/checklist/verify?status=Rejected"))));
                }

                if (dashboardRepository.hasWidgetPermission(userId, "M1210", userLevel)) {
                        Map<String, Object> asgn = dashboardRepository.getChecklistAssign(userId, userLevel, taskScope, memberId);
                        long totalAssignment = getLong(asgn, "openCount");
                        list.add(new DashboardWidgetDto("CHECK LIST", "ASSIGNMENT", "CheckList Assign", "IconClipboardList",
                                        "/master/qms/checklist/master",
                                        List.of(
                                                        metric("Total", totalAssignment, "info", "/master/qms/checklist/master?status=Active&verifyStatus=Verified"),
                                                        metric("Unassigned", getLong(asgn, "openCount"), "warning", "/master/qms/checklist/master?taskStatus=Unassigned&status=Active&verifyStatus=Verified"))));
                }

                java.util.Date queryFromDate = java.util.Date.from(from.atStartOfDay().atZone(java.time.ZoneId.of("Asia/Kolkata")).toInstant());
                java.util.Date queryToDate = java.util.Date.from(to.atTime(23, 59, 59).atZone(java.time.ZoneId.of("Asia/Kolkata")).toInstant());

                if (dashboardRepository.hasWidgetPermission(userId, "QM1120", userLevel)) {
                        long todayTotalCount = checklistService.getClosedChecklistsDirect(null, "All", null, queryFromDate, queryToDate, null,
                            null, null, "Verified", taskScope, userId, false, false, null, "Yes", null,
                            null, null, null, null, null, null, null,
                            org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();

                        long todayPendingCount = checklistService.getClosedChecklistsDirect(null, "Pending", null, queryFromDate, queryToDate, null,
                            null, null, "Verified", taskScope, userId, false, false, null, "Yes", null,
                            null, null, null, null, null, null, null,
                            org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();
                        
                        java.util.Date yesterdayEnd = new java.util.Date(queryFromDate.getTime() - 1);
                        
                        long overdueCount = checklistService.getClosedChecklistsDirect(null, "Pending", null, null, yesterdayEnd, null,
                            null, null, "Verified", taskScope, userId, false, false, null, "Yes", null,
                            null, null, null, null, null, null, null,
                            org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();
                        
                        long totalClose = todayPendingCount + overdueCount;
                        
                        list.add(new DashboardWidgetDto("CHECK LIST", "CLOSE", "Close CheckList", "IconCircleCheck",
                                        "/qms/checklist/close-renewal",
                                        List.of(
                                                        metric("Total", totalClose, "info", "/qms/checklist/close-renewal"),
                                                        metric("Today", todayTotalCount, "info", "/qms/checklist/close-renewal?dashboardFilter=today"),
                                                        metric("Pending", todayPendingCount, "warning", "/qms/checklist/close-renewal?dashboardFilter=todayPending"),
                                                        metric("Overdue", overdueCount, "danger", "/qms/checklist/close-renewal?dashboardFilter=overdue"))));
                }

                if (dashboardRepository.hasWidgetPermission(userId, "QM1130", userLevel)) {
                        long verifyPendingCountAll = checklistService.getAssignments(null, "Pending for Verified", null, null, null, null,
                            null, null, null, taskScope, userId, "QM1130", false, false, "YES", null, null, null, null, null, null, null, null, null,
                            org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();

                        long rejectedCount = checklistService.getAssignments(null, "Rejected", null, null, null, null,
                            null, null, null, taskScope, userId, "QM1130", false, false, "YES", null, null, null, null, null, null, null, null, null,
                            org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();

                        java.util.Date twoDaysAgoEnd = java.util.Date.from(from.minusDays(2).atTime(23, 59, 59).atZone(java.time.ZoneId.of("Asia/Kolkata")).toInstant());

                        long overdueVerifyCount = checklistService.getAssignments(null, "Pending for Verified", null, null, twoDaysAgoEnd, null,
                            null, null, null, taskScope, userId, "QM1130", false, false, "YES", "Yes", null, null, null, null, null, null, null, null,
                            org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();

                        long recentVerifyPendingCount = Math.max(0, verifyPendingCountAll - overdueVerifyCount);
                        long totalVerify = recentVerifyPendingCount + overdueVerifyCount; 

                        list.add(new DashboardWidgetDto("CHECK LIST", "VERIFY", "Close Checklist Verify", "IconShieldCheck",
                                        "/qms/checklist/renewal-verify",
                                        List.of(
                                                        metric("Total", totalVerify, "info", "/qms/checklist/renewal-verify?dashboardFilter=totalVerify"),
                                                        metric("pending For Verified", recentVerifyPendingCount, "warning",
                                                                        "/qms/checklist/renewal-verify?dashboardFilter=recentVerifyPending"),
                                                        metric("Overdue", overdueVerifyCount, "danger", "/qms/checklist/renewal-verify?dashboardFilter=overdueVerify"),
                                                        metric("Rejected", rejectedCount, "danger", "/qms/checklist/renewal-verify?statuses=Rejected"))));
                }

                if (dashboardRepository.hasWidgetPermission(userId, "QM1150", userLevel) || dashboardRepository.hasWidgetPermission(userId, "QM1120", userLevel)) {
                        Map<String, Object> ackMap = dashboardRepository.getChecklistAcknowledgement(userId, taskScope, memberId);
                        long totalAck = getLong(ackMap, "totalCount");
                        long pendingAck = getLong(ackMap, "pendingCount");
                        long acceptedAck = getLong(ackMap, "acceptedCount");
                        long rejectedAck = getLong(ackMap, "rejectedCount");

                        if (pendingAck > 0 || userLevel >= 5 || "SUPER BOSS".equalsIgnoreCase(userId)) {
                                list.add(new DashboardWidgetDto("CHECK LIST", "ACKNOWLEDGEMENT", "Checklist Acknowledgement", "IconUserCheck",
                                                "/qms/checklist/acknowledgement",
                                                List.of(
                                                                metric("Total", pendingAck, "info", "/qms/checklist/acknowledgement?ackStatus=PENDING"),
                                                                metric("Pending", pendingAck, "warning", "/qms/checklist/acknowledgement?ackStatus=PENDING"),
                                                                metric("Accepted", acceptedAck, "success", "/qms/checklist/acknowledgement?ackStatus=ACCEPTED"),
                                                                metric("Rejected", rejectedAck, "danger", "/qms/checklist/acknowledgement?ackStatus=REJECTED"))));
                        }
                }

                return list;
        }

        private DashboardWidgetDto buildInductionWidget(String userId, int userLevel, String taskScope, String memberId) {
                boolean permitted = dashboardRepository.hasWidgetPermission(userId, "HA1410", userLevel);
                if (!permitted)
                        return DashboardWidgetDto.unpermitted("INDUCTION", "SCHEDULE PENDING", "Induction Schedule");

                return new DashboardWidgetDto("INDUCTION", "SCHEDULE PENDING", "Induction Schedule", "IconBook",
                                "/hra/ats/induction-assignment",
                                List.of(
                                                metric("Partially Completed", 0, "warning", null),
                                                metric("ReSchedule", 0, "danger", null),
                                                metric("Assign Induction", 0, "info", null),
                                                metric("Training Given", 0, "success", null)));
        }

        private List<DashboardWidgetDto> buildQuotationWidgets(String userId, LocalDate from, LocalDate to,
                        int userLevel, String taskScope, String memberId) {
                boolean permitted = dashboardRepository.hasWidgetPermission(userId, "SM1140", userLevel);
                if (!permitted)
                        return Collections.emptyList();

                List<DashboardWidgetDto> list = new ArrayList<>();

                Map<String, Object> qp = dashboardRepository.getQuotationPending(userId, from, to, taskScope, memberId);
                list.add(
                                new DashboardWidgetDto("QUOTATION", "PENDING", "Quotation Pending", "IconFileInvoice",
                                                "/sm/quotations",
                                                List.of(
                                                                metric("Overdue", getLong(qp, "overdueCount"), "danger",
                                                                                "/sm/quotations?status=OVERDUE"),
                                                                metric("Today's", getLong(qp, "todayCount"), "info",
                                                                                "/sm/quotations?status=TODAY"),
                                                                metric("Pending", getLong(qp, "pendingCount"),
                                                                                "warning", "/sm/quotations?status=PENDING"))));

                return list;
        }

        private List<DashboardWidgetDto> buildFollowUpWidgets(String userId, int userLevel, String taskScope, String memberId) {
                boolean permitted = dashboardRepository.hasWidgetPermission(userId, "SM1140", userLevel);
                if (!permitted)
                        return Collections.emptyList();

                List<DashboardWidgetDto> list = new ArrayList<>();

                list.add(new DashboardWidgetDto("FOLLOW UP", "NOT YET START", "Followup Setup", "IconPhoneCall",
                                "/sm/quotations",
                                List.of(
                                                metric("Pending", 0, "warning", null))));

                list.add(
                                new DashboardWidgetDto("FOLLOW UP", "PENDING", "Followup Process", "IconPhoneCalling",
                                                "/sm/quotations",
                                                List.of(
                                                                metric("Overdue", 0, "danger", null),
                                                                metric("Today's", 0, "info", null),
                                                                metric("Pending", 0, "warning", null))));

                return list;
        }

        private List<DashboardWidgetDto> buildEmployeeWidgets(String userId, LocalDate from, LocalDate to,
                        int userLevel, String taskScope, String memberId) {
                List<DashboardWidgetDto> list = new ArrayList<>();

                // LEAVE
                if (dashboardRepository.hasWidgetPermission(userId, "M2390", userLevel)) {
                        Map<String, Object> lv = dashboardRepository.getLeave(userId, from, to, taskScope, memberId);
                        list.add(
                                        new DashboardWidgetDto("EMPLOYEE'S", "LEAVE", "Leave Approvals", "IconBeach",
                                                        "/hra/leave-requests",
                                                        List.of(
                                                                        metric("Overdue", getLong(lv, "overdueCount"),
                                                                                        "danger", "/hra/leave-requests?status=OVERDUE"),
                                                                        metric("Today's", getLong(lv, "todayCount"),
                                                                                        "info", "/hra/leave-requests?status=TODAY"),
                                                                        metric("Pending", getLong(lv, "pendingCount"),
                                                                                        "warning", "/hra/leave-requests?status=PENDING APPROVAL,PENDING FOR VERIFY"),
                                                                        metric("Verified", getLong(lv, "verifiedCount"),
                                                                                        "success", "/hra/leave-requests?status=APPROVED"))));
                } else {
                        list.add(DashboardWidgetDto.unpermitted("EMPLOYEE'S", "LEAVE", "Leave Approvals"));
                }

                // LOAN
                if (dashboardRepository.hasWidgetPermission(userId, "QM1410", userLevel)) {
                        Map<String, Object> ln = dashboardRepository.getLoan(userId, taskScope, memberId);
                        list.add(new DashboardWidgetDto("EMPLOYEE'S", "LOAN", "Loan Approvals", "IconCash", "/hra/payroll/loan-verification",
                                        List.of(
                                                        metric("Pending Approval", getLong(ln, "pendingCount"),
                                                                        "warning", "/hra/payroll/loan-verification?status=PENDING FOR VERIFIED"))));
                } else {
                        list.add(DashboardWidgetDto.unpermitted("EMPLOYEE'S", "LOAN", "Loan Approvals"));
                }

                // PERMISSION
                if (dashboardRepository.hasWidgetPermission(userId, "HA1310", userLevel)) {
                        Map<String, Object> pm = dashboardRepository.getPermission(userId, from, to, taskScope, memberId);
                        list.add(new DashboardWidgetDto("EMPLOYEE'S", "PERMISSION", "Permission Requests", "IconClock",
                                        "/hra/attendance/permission-verification",
                                        List.of(
                                                        metric("Today's", getLong(pm, "todayCount"), "info", "/hra/attendance/permission-verification?status=TODAY"),
                                                        metric("Pending", getLong(pm, "pendingCount"), "warning", "/hra/attendance/permission-verification?status=PENDING"),
                                                        metric("Verified", getLong(pm, "verifiedCount"), "success",
                                                                        "/hra/attendance/permission-verification?status=APPROVED"),
                                                        metric("Rejected", getLong(pm, "rejectedCount"), "danger",
                                                                        "/hra/attendance/permission-verification?status=REJECTED"))));
                } else {
                        list.add(DashboardWidgetDto.unpermitted("EMPLOYEE'S", "PERMISSION", "Permission Requests"));
                }

                return list;
        }

        private List<DashboardWidgetDto> buildOcrWidgets(String userId, LocalDate from, LocalDate to, int userLevel, String taskScope, String memberId) {
                boolean permitted = dashboardRepository.hasWidgetPermission(userId, "SM1120", userLevel);
                if (!permitted)
                        return Collections.emptyList();

                List<DashboardWidgetDto> list = new ArrayList<>();

                Map<String, Object> ocr = dashboardRepository.getOcrEnquiry(userId, from, to, userLevel, taskScope, memberId);
                list.add(new DashboardWidgetDto("OCR", "WORK ITEM", "OCR Monitoring", "IconEye", "/sm/enquiries",
                                List.of(
                                                metric("Abandoned", getLong(ocr, "abandonedCount"), "danger", null),
                                                metric("Pending Mapping", getLong(ocr, "openCount"), "warning",
                                                                null))));

                list.add(new DashboardWidgetDto("OCR", "ENQUIRY", "OCR Enquiry Processing", "IconSearch",
                                "/sm/enquiries",
                                List.of(
                                                metric("Assign Pending", getLong(ocr, "openCount"), "warning", null),
                                                metric("Assigned Pending", 0, "info", null))));

                list.add(new DashboardWidgetDto("OCR", "QUOTATION", "OCR Quotation Processing", "IconFileInvoice",
                                "/sm/quotations",
                                List.of(
                                                metric("Mail Pending", 0, "warning", null),
                                                metric("Waiting Approval", 0, "info", null))));

                list.add(new DashboardWidgetDto("OCR", "SALES ORDER", "OCR Sales Order", "IconShoppingCart", null,
                                List.of(
                                                metric("Waiting Approval", 0, "warning", null),
                                                metric("Open Items", 0, "info", null))));

                return list;
        }

        private List<DashboardWidgetDto> buildPricingWidgets(String userId, int userLevel, String taskScope, String memberId) {
                boolean permitted = dashboardRepository.hasWidgetPermission(userId, "SM1130", userLevel);
                if (!permitted)
                        return Collections.emptyList();

                List<DashboardWidgetDto> list = new ArrayList<>();

                list.add(new DashboardWidgetDto("PRICING", "GPL", "Global Price List (GPL)", "IconTag",
                                "/sm/price-master",
                                List.of(
                                                metric("GPL Pending", 0, "warning", null),
                                                metric("GPL Expired", 0, "danger", null))));

                list.add(new DashboardWidgetDto("PRICING", "CPL", "Customer Price List (CPL)", "IconTags",
                                "/sm/price-master",
                                List.of(
                                                metric("CPL Pending", 0, "warning", null),
                                                metric("CPL Expired", 0, "danger", null))));

                return list;
        }

        private List<DashboardWidgetDto> buildPlanningWidgets(String userId, int userLevel, String taskScope, String memberId) {
                return List.of(
                                new DashboardWidgetDto("PLANNING", "MRP", "MRP Planning", "IconReport", null,
                                                List.of(
                                                                metric("Pending Sale Order", 0, "info", null),
                                                                metric("Pending Inventory", 0, "warning", null),
                                                                metric("Pending ROL", 0, "danger", null))),
                                new DashboardWidgetDto("PLANNING", "TEMP", "PO Shortages", "IconPackage", null,
                                                List.of(
                                                                metric("PO Shortages", 0, "danger", null),
                                                                metric("PR Shortages", 0, "warning", null))));
        }

        private List<DashboardWidgetDto> buildPurchaseWidgets(String userId, int userLevel, String taskScope, String memberId) {
                
                boolean hasPrWrite = dashboardRepository.hasWidgetActionPermission(userId, "PP0104", userLevel, "WRITE");
                boolean hasPrApprove = dashboardRepository.hasWidgetActionPermission(userId, "PP0104", userLevel, "APPROVAL");
                
                long prDraft = 0;
                if (hasPrWrite) {
                    prDraft = dashboardRepository.getPurchaseRequestCountByStatus(userId, userLevel, "DRAFT");
                }
                
                long prPendingApproval = 0;
                if (hasPrApprove) {
                    prPendingApproval = dashboardRepository.getPurchaseRequestCountByStatus(userId, userLevel, "PENDING APPROVAL");
                }

                long prTotal = prDraft + prPendingApproval;

                boolean hasQrWrite = dashboardRepository.hasWidgetActionPermission(userId, "PP0105", userLevel, "WRITE");
                long qrPending = 0;
                long qrPendingRfqSubmission = 0;
                if (hasQrWrite) {
                    qrPending = dashboardRepository.getPendingQuotationRequestCount(userId, userLevel);
                    qrPendingRfqSubmission = dashboardRepository.getPendingRfqSubmissionCount(userId, userLevel);
                }
                long qrTotal = qrPending + qrPendingRfqSubmission;

                boolean hasSqWrite = dashboardRepository.hasWidgetActionPermission(userId, "PP0106", userLevel, "WRITE");
                boolean hasSqApprove = dashboardRepository.hasWidgetActionPermission(userId, "PP0106", userLevel, "APPROVAL");
                
                long sqPending = 0;
                long sqAwaitingVerification = 0;
                long sqTotal = 0;
                
                if (hasSqWrite) {
                    sqPending = dashboardRepository.getPendingSupplierQuotationCount(userId, userLevel);
                }
                
                if (hasSqApprove) {
                    sqAwaitingVerification = dashboardRepository.getSupplierQuotationCountByStatus(userId, userLevel, "DRAFT", "PENDING FOR VERIFIED", "PENDING FOR VERIFY", "PENDING VERIFICATION", "PENDING APPROVAL");
                }
                
                sqTotal = sqPending + sqAwaitingVerification;

                boolean hasQnWrite = dashboardRepository.hasWidgetActionPermission(userId, "PP0107", userLevel, "WRITE");
                long qnPending = 0;
                long qnTotal = 0;
                if (hasQnWrite) {
                    qnPending = dashboardRepository.getPendingQuoteNegotiationCount(userId, userLevel);
                    qnTotal = qnPending;
                }

                boolean hasQcWrite = dashboardRepository.hasWidgetActionPermission(userId, "PP0108", userLevel, "WRITE");
                long qcPending = 0;
                long qcTotal = 0;
                if (hasQcWrite) {
                    qcPending = dashboardRepository.getPendingQuotationComparisonCount(userId, userLevel);
                    qcTotal = qcPending;
                }

                boolean hasPoWrite = dashboardRepository.hasWidgetActionPermission(userId, "PP0100", userLevel, "WRITE");
                boolean hasPoApprove = dashboardRepository.hasWidgetActionPermission(userId, "PP0100", userLevel, "APPROVAL");
                long poPending = 0;
                long poAwaitingVerificationReq = 0;
                long poAwaitingVerification = 0;
                long poTotal = 0;
                
                if (hasPoWrite) {
                    poPending = dashboardRepository.getPendingPurchaseOrderCount(userId, userLevel);
                    poAwaitingVerificationReq = dashboardRepository.getPurchaseOrderCountByStatus(userId, userLevel, "DRAFT");
                }
                
                if (hasPoApprove) {
                    poAwaitingVerification = dashboardRepository.getPurchaseOrderCountByStatus(userId, userLevel, "SUBMITTED", "PENDING FOR VERIFIED", "PENDING FOR VERIFY", "PENDING VERIFICATION", "PENDING APPROVAL", "PENDING FOR APPROVAL", "PENDING TO VERIFY");
                }
                
                poTotal = poPending + poAwaitingVerificationReq + poAwaitingVerification;
                boolean hasGeWrite = dashboardRepository.hasWidgetActionPermission(userId, "PP0102", userLevel, "WRITE");
                long geToday = 0;
                long geOverdue = 0;
                long geTotal = 0;

                if (hasGeWrite) {
                    geToday = dashboardRepository.getPendingGateEntryCount(userId, userLevel, "TODAY");
                    geOverdue = dashboardRepository.getPendingGateEntryCount(userId, userLevel, "OVERDUE");
                    geTotal = geToday + geOverdue;
                }

                boolean hasGrnWrite = dashboardRepository.hasWidgetActionPermission(userId, "PP0110", userLevel, "WRITE");
                long grnPending = 0;
                long grnTotal = 0;

                if (hasGrnWrite) {
                    grnPending = dashboardRepository.getPendingGrnCount(userId, userLevel);
                    grnTotal = grnPending;
                }

                boolean hasQiWrite = dashboardRepository.hasWidgetActionPermission(userId, "PP0111", userLevel, "WRITE");
                long qiPending = 0;
                long qiTotal = 0;

                if (hasQiWrite) {
                    qiPending = dashboardRepository.getPendingQiCount(userId, userLevel);
                    qiTotal = qiPending;
                }

                return List.of(
                                new DashboardWidgetDto("PURCHASE", "PR", "PURCHASE REQUEST", "IconReceipt", "/purchase/pr/list",
                                                List.of(
                                                                metric("Total", prTotal, "info", "/purchase/pr/list"),
                                                                metric("Awaiting Submission", prDraft, "warning", "/purchase/pr/list"),
                                                                metric("Awaiting Verification", prPendingApproval, "warning", "/purchase/pr/list"))),
                                new DashboardWidgetDto("PURCHASE", "QR", "QUOTATION REQUEST", "IconFileDescription", "/purchase/rfq/list",
                                                List.of(
                                                                metric("Total", qrTotal, "info", "/purchase/rfq/list"),
                                                                metric("Pending", qrPending, "warning", "/purchase/rfq/list"),
                                                                metric("Pending RFQ Submission", qrPendingRfqSubmission, "warning", "/purchase/rfq/list"))),
                                new DashboardWidgetDto("PURCHASE", "SQ", "SUPPLIER QUOTATION", "IconFileInvoice", "/purchase/quotation/list",
                                                List.of(
                                                                metric("Total", sqTotal, "info", "/purchase/quotation/list"),
                                                                metric("Awaiting Quotation", sqPending, "warning", "/purchase/quotation/list"),
                                                                metric("Awaiting Verification", sqAwaitingVerification, "warning", "/purchase/quotation/list"))),
                                new DashboardWidgetDto("PURCHASE", "QN", "QUOTE NEGOTIATION", "IconMessage2", "/purchase/negotiation/list",
                                                List.of(
                                                                metric("Total", qnTotal, "info", "/purchase/negotiation/list"),
                                                                metric("Pending", qnPending, "warning", "/purchase/negotiation/list"))),
                                new DashboardWidgetDto("PURCHASE", "QC", "QUOTATION COMPARISON", "IconChartBar", "/purchase/comparison",
                                                List.of(
                                                                metric("Total", qcTotal, "info", "/purchase/comparison"),
                                                                metric("Pending", qcPending, "warning", "/purchase/comparison"))),
                                new DashboardWidgetDto("PURCHASE", "PO", "PURCHASE ORDER", "IconShoppingCart", "/purchase/po",
                                                List.of(
                                                                metric("Total", poTotal, "info", "/purchase/po"),
                                                                metric("Awaiting Purchase Order", poPending, "warning", "/purchase/po"),
                                                                metric("Awaiting Verification Request", poAwaitingVerificationReq, "warning", "/purchase/po"),
                                                                metric("Awaiting Verification", poAwaitingVerification, "warning", "/purchase/po"))),
                                new DashboardWidgetDto("PURCHASE", "GE", "WAITING FOR GATE ENTRY", "IconTruck", null,
                                                List.of(
                                                                metric("Total", geTotal, "info", null),
                                                                metric("Today", geToday, "warning", null),
                                                                metric("Overdue", geOverdue, "danger", null))),
                                new DashboardWidgetDto("PURCHASE", "GRN", "GOODS RECEIPT NOTE", "IconPackage", null,
                                                List.of(
                                                                metric("Total", grnTotal, "info", null),
                                                                metric("Pending", grnPending, "warning", null))),
                                new DashboardWidgetDto("PURCHASE", "QI", "QUALITY INSPECTION", "IconShieldCheck", null,
                                                List.of(
                                                                metric("Total", qiTotal, "info", null),
                                                                metric("Pending", qiPending, "warning", null))));
        }

        private List<DashboardWidgetDto> buildProductionWidgets(String userId, int userLevel, String taskScope, String memberId) {
                return List.of(
                                new DashboardWidgetDto("PRODUCTION", "ROUTE SHEET", "Route Sheets & WIP", "IconRoute",
                                                null,
                                                List.of(
                                                                metric("Overdue Pending", 0, "danger", null),
                                                                metric("WIP Overdue Pending", 0, "warning", null),
                                                                metric("Route Sheet Pending", 0, "info", null),
                                                                metric("WIP Pending", 0, "info", null))),
                                new DashboardWidgetDto("PRODUCTION", "IDLE / OEE MONITOR", "Machine OEE & Idle Time",
                                                "IconCpu", null,
                                                List.of(
                                                                metric("Machine OEE (Prorata)", 0, "info", null),
                                                                metric("Machine Idle", 0, "danger", null))));
        }

        private List<DashboardWidgetDto> buildStoreWidgets(String userId, int userLevel, String taskScope, String memberId) {
                return List.of(
                                new DashboardWidgetDto("STORE", "PURCHASE", "Store PO & JO GRN", "IconForklift", null,
                                                List.of(
                                                                metric("GRN Pending - PO", 0, "warning", null),
                                                                metric("GRN Pending - JO", 0, "info", null))),
                                new DashboardWidgetDto("STORE", "PRODUCTION", "Packing & Materials", "IconBox", null,
                                                List.of(
                                                                metric("Packing Entry", 0, "info", null),
                                                                metric("Material Issue Pending", 0, "warning", null))),
                                new DashboardWidgetDto("STORE", "SALES", "Sales Dispatch", "IconTruck", null,
                                                List.of(
                                                                metric("Dispatch / ACK Pending", 0, "warning", null))),
                                new DashboardWidgetDto("STORE", "COMMON", "Store DC & Stock Transfer", "IconExchange",
                                                null,
                                                List.of(
                                                                metric("DC Request (Return)", 0, "info", null),
                                                                metric("DC Request (Non-Return)", 0, "info", null),
                                                                metric("Stock Transfer", 0, "warning", null),
                                                                metric("ACK Pending / Dispatch", 0, "danger", null))),
                                new DashboardWidgetDto("STORE", "TRACKING", "Delivery Tracking", "IconMapPin", null,
                                                List.of(
                                                                metric("Tracking Issue", 0, "danger", null),
                                                                metric("In-Transit", 0, "success", null))),
                                new DashboardWidgetDto("STORE", "AUDIT", "Store Stock Audit", "IconArchive", null,
                                                List.of(
                                                                metric("Stock Audit (Reconcil)", 0, "warning", null))));
        }

        private List<DashboardWidgetDto> buildQualityWidgets(String userId, int userLevel, String taskScope, String memberId) {
                return List.of(
                                new DashboardWidgetDto("QUALITY", "PURCHASE", "Quality PO & JO Inspection",
                                                "IconCircleCheck", null,
                                                List.of(
                                                                metric("Inspection Pending - PO", 0, "warning", null),
                                                                metric("Rejection - PO", 0, "danger", null),
                                                                metric("Inspection Pending - JO", 0, "warning", null),
                                                                metric("Rejection - JO", 0, "danger", null))),
                                new DashboardWidgetDto("QUALITY", "PRODUCTION", "Production Inspection & Rework",
                                                "IconReportAnalytics",
                                                null,
                                                List.of(
                                                                metric("Report Pending", 0, "warning", null),
                                                                metric("Production Rework", 0, "warning", null),
                                                                metric("Production Reject", 0, "danger", null))));
        }

        private DashboardMetricDto metric(String label, long value, String status, String url) {
                return new DashboardMetricDto(label, value, status, url);
        }

        private LocalDate parseDate(String dateStr, LocalDate defaultDate) {
                if (dateStr == null || dateStr.isBlank())
                        return defaultDate;
                try {
                        return LocalDate.parse(dateStr.trim(), DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                } catch (Exception e) {
                        return defaultDate;
                }
        }
}
/* test */
