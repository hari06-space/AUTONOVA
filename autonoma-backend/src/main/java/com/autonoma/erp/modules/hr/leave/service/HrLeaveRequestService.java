package com.autonoma.erp.modules.hr.leave.service;

import com.autonoma.erp.util.AuditLogger;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeManagerMapping;
import com.autonoma.erp.modules.hr.attendance.entity.HrDailyAttendance;
import com.autonoma.erp.modules.qms.checklist.service.ChecklistAutoAssignmentService;

import com.autonoma.erp.modules.hr.leave.entity.HrLeaveRequest;
import com.autonoma.erp.modules.hr.leave.entity.LeaveMaster;
import com.autonoma.erp.modules.hr.leave.entity.LeaveTransaction;
import com.autonoma.erp.modules.hr.leave.repository.HrLeaveRequestRepository;
import com.autonoma.erp.modules.hr.leave.repository.HrLeaveMasterRepository;
import com.autonoma.erp.modules.hr.leave.repository.LeaveMasterRepository;
import com.autonoma.erp.modules.hr.leave.repository.LeaveTransactionRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.repository.admin.AppPreferenceRepository;
import com.autonoma.erp.model.admin.AppPreference;
import com.autonoma.erp.modules.hr.attendance.repository.HrDailyAttendanceRepository;
import com.autonoma.erp.modules.platform.notification.service.NotificationService;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.modules.hr.leave.repository.LeaveEntryRepository;
import com.autonoma.erp.modules.hr.leave.entity.LeaveEntry;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.util.ArrayList;
import java.math.BigDecimal;

@Service
public class HrLeaveRequestService {

    @Autowired
    private HrLeaveRequestRepository requestRepository;

    @Autowired
    private HrLeaveMasterRepository leaveMasterRepository;

    @Autowired
    private LeaveMasterRepository employeeLeaveMasterRepository;

    @Autowired
    private LeaveTransactionRepository leaveTransactionRepository;

    @Autowired
    private AppPreferenceRepository preferenceRepository;

    @Autowired
    private LeaveEntryRepository leaveEntryRepo;

    @Autowired
    private EmployeeMasterRepository employeeRepository;

    @Autowired
    private EmployeeManagerMappingRepository managerMappingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.autonoma.erp.service.admin.BosUserPageAuthService authService;

    @Autowired
    private HrDailyAttendanceRepository hrDailyAttendanceRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private ChecklistAutoAssignmentService checklistAutoAssignmentService;

    // ── My Requests ─────────────────────────────────────────────────────────

    public List<HrLeaveRequest> findMyRequests() {
        String userId = currentUserId();
        Long empId = resolveEmpId(userId);
        return requestRepository.findByEmpIdOrderByRequestDateDesc(empId);
    }

    public List<HrLeaveRequest> findPendingForManager() {
        String userId = currentUserId();
        Long vhEmpId = resolveEmpId(userId);
        if (vhEmpId == null) {
            return List.of();
        }
        if (authService.hasPermission(userId, "HA1220", "additional1")) {
            return requestRepository.findByStatusInOrderByRequestDateDesc(List.of("SUBMITTED", "PENDING", "APPROVED", "REJECTED"));
        }
        List<Long> empIds = managerMappingRepository.findEmpIdsByVerticalHeadId(vhEmpId);
        if (empIds.isEmpty()) {
            return List.of();
        }
        return requestRepository.findByEmpIdInAndStatusInOrderByRequestDateDesc(empIds, List.of("SUBMITTED", "PENDING", "APPROVED", "REJECTED"));
    }

    public List<HrLeaveRequest> findPendingForHr() {
        return requestRepository.findByHrIdAndStatusOrderByRequestDateDesc(null, "MANAGER_APPROVED");
    }

    public HrLeaveRequest findById(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found: " + id));
    }

    // ── CRUD ─────────────────────────────────────────────────────────────────

    @Transactional
    public HrLeaveRequest create(HrLeaveRequest request) {
        // Generate request number: LR-YYYYMMDD-NNN
        request.setRequestNo(generateRequestNo());

        // Resolve leave type name from id
        if (request.getLeaveTypeId() != null) {
            leaveMasterRepository.findById(request.getLeaveTypeId()).ifPresent(lt ->
                request.setLeaveTypeName(lt.getLeaveName())
            );
        }

        // Auto-populate employee details from security context
        String userId = currentUserId();
        Long resolvedEmpId = resolveEmpId(userId);
        if (resolvedEmpId == null) {
            throw new RuntimeException("Unable to resolve employee details for current user.");
        }
        if (request.getEmpId() == null) {
            request.setEmpId(resolvedEmpId);
        } else {
            if (!request.getEmpId().equals(resolvedEmpId)) {
                throw new RuntimeException("HR/Admin cannot create leave requests for employees.");
            }
        }
        enrichEmployeeDetails(request);

        // Resolve manager
        enrichManagerDetails(request);
        if (request.getManagerId() == null || request.getManagerId() == 0) {
            throw new RuntimeException("Every leave request must have one assigned Vertical Head approver.");
        }

        if (request.getStatus() == null || request.getStatus().isBlank()) {
            request.setStatus("DRAFT");
        }
        if (request.getRequestDate() == null) {
            request.setRequestDate(new Date());
        }

        // Validate request and available balance
        validateRequest(request, null);

        HrLeaveRequest saved = requestRepository.save(request);
        com.autonoma.erp.util.AuditLogger.log("CREATE_LEAVE", saved.getLeaveRequestId(), "SUCCESS", "Leave request created by " + userId);
        return saved;
    }

    @Transactional
    public HrLeaveRequest update(Long id, HrLeaveRequest updated) {
        HrLeaveRequest existing = findById(id);
        if (!List.of("DRAFT", "SUBMITTED").contains(existing.getStatus())) {
            throw new RuntimeException("Cannot update a request in status: " + existing.getStatus());
        }
        existing.setLeaveTypeId(updated.getLeaveTypeId());
        existing.setHolidayId(updated.getHolidayId());
        existing.setStartDate(updated.getStartDate());
        existing.setEndDate(updated.getEndDate());
        existing.setNumberOfDays(updated.getNumberOfDays());
        existing.setReason(updated.getReason());

        if (updated.getLeaveTypeId() != null) {
            leaveMasterRepository.findById(updated.getLeaveTypeId()).ifPresent(lt ->
                existing.setLeaveTypeName(lt.getLeaveName())
            );
        }

        // Validate modified request and available balance
        validateRequest(existing, id);

        HrLeaveRequest saved = requestRepository.save(existing);
        try {
            checklistAutoAssignmentService.runReassignmentCheckForOpenAssignments();
        } catch (Exception e) {
            System.err.println("Failed to trigger checklist auto-reassignment on leave request update: " + e.getMessage());
        }
        return saved;
    }

    @Transactional
    public HrLeaveRequest submit(Long id) {
        HrLeaveRequest req = findById(id);
        if (!"DRAFT".equals(req.getStatus())) {
            throw new RuntimeException("Only DRAFT requests can be submitted");
        }

        // Verify balance again at the point of submission
        validateRequest(req, id);

        String oldStatus = req.getStatus();
        req.setStatus("PENDING");
        req.setSubmittedDate(new Date());
        HrLeaveRequest saved = requestRepository.save(req);

        handleBalanceTransition(saved, oldStatus, "PENDING");

        String userId = currentUserId();
        com.autonoma.erp.util.AuditLogger.log("SUBMIT_LEAVE", id, "SUCCESS", "Leave request submitted by " + userId);
        
        employeeRepository.findById(req.getEmpId()).ifPresent(emp -> {
            notificationService.notifyUserAboutLeave(emp, saved, "SUBMIT");
        });
        return saved;
    }

    @Transactional
    public HrLeaveRequest cancel(Long id) {
        HrLeaveRequest req = findById(id);
        if (List.of("HR_APPROVED", "REJECTED", "CANCELLED").contains(req.getStatus())) {
            throw new RuntimeException("Cannot cancel a request in status: " + req.getStatus());
        }
        String oldStatus = req.getStatus();
        req.setStatus("CANCELLED");
        HrLeaveRequest saved = requestRepository.save(req);

        handleBalanceTransition(saved, oldStatus, "CANCELLED");

        employeeRepository.findById(req.getEmpId()).ifPresent(emp -> {
            notificationService.notifyUserAboutLeave(emp, saved, "CANCEL");
        });
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        HrLeaveRequest req = findById(id);
        if (!List.of("DRAFT", "CANCELLED").contains(req.getStatus())) {
            throw new RuntimeException("Only DRAFT or CANCELLED requests can be deleted");
        }
        requestRepository.delete(req);
    }

    // ── Approval Workflow ────────────────────────────────────────────────────

    public List<HrLeaveRequest> findConflicts(Long id) {
        HrLeaveRequest req = findById(id);
        return requestRepository.findConflictingRequests(req.getEmpId(), req.getStartDate(), req.getEndDate())
                .stream().filter(r -> !r.getLeaveRequestId().equals(id)).toList();
    }

    @Transactional
    public HrLeaveRequest approveByManager(Long id, String remarks) {
        HrLeaveRequest req = findById(id);
        if (!List.of("SUBMITTED", "PENDING").contains(req.getStatus())) {
            throw new RuntimeException("Request must be PENDING for approval");
        }

        String userId = currentUserId();
        Long vhEmpId = resolveEmpId(userId);

        if (vhEmpId == null) {
            throw new RuntimeException("Unable to resolve employee details for current user.");
        }
        if (vhEmpId.equals(req.getEmpId())) {
            throw new RuntimeException("Employee cannot approve own leave.");
        }
        com.autonoma.erp.modules.hr.employee.entity.EmployeeManagerMapping mapping = managerMappingRepository.findByEmpIdAndStatus(req.getEmpId(), "Active")
                .orElseThrow(() -> new RuntimeException("No active manager mapping found for employee."));
        if (!vhEmpId.equals(mapping.getVerticalHeadId())) {
            throw new RuntimeException("Vertical Head can only approve mapped employees.");
        }

        String oldStatus = req.getStatus();
        req.setStatus("APPROVED");
        req.setApprovedBy(userId);
        req.setApprovedDate(new Date());
        req.setApprovalRemarks(remarks);

        req.setManagerId(vhEmpId);
        req.setManagerName(userId);
        req.setManagerRemarks(remarks);
        req.setManagerActionDate(new Date());

        HrLeaveRequest saved = requestRepository.save(req);

        handleBalanceTransition(saved, oldStatus, "APPROVED");

        com.autonoma.erp.util.AuditLogger.log("APPROVE_LEAVE", id, "SUCCESS", "Leave request approved by Vertical Head " + userId);
        
        // Auto-update daily attendance to 'LEAVE' for each day in range
        try {
            LocalDate start = req.getStartDate();
            LocalDate end = req.getEndDate();
            for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
                com.autonoma.erp.modules.hr.attendance.entity.HrDailyAttendance att = hrDailyAttendanceRepository
                        .findByEmpIdAndAttendanceDate(req.getEmpId(), date)
                        .orElse(new com.autonoma.erp.modules.hr.attendance.entity.HrDailyAttendance());
                att.setEmpId(req.getEmpId());
                att.setAttendanceDate(date);
                att.setStatus("LEAVE");
                att.setRemarks("Leave Approved: " + req.getLeaveTypeName() + " (" + req.getRequestNo() + ")");
                hrDailyAttendanceRepository.save(att);
            }
        } catch (Exception e) {
            System.err.println("Failed to automatically update daily attendance on leave approval: " + e.getMessage());
        }

        employeeRepository.findById(req.getEmpId()).ifPresent(emp -> {
            notificationService.notifyUserAboutLeave(emp, saved, "APPROVE");
        });

        try {
            checklistAutoAssignmentService.runReassignmentCheckForOpenAssignments();
        } catch (Exception e) {
            System.err.println("Failed to trigger checklist auto-reassignment on manager leave approval: " + e.getMessage());
        }
        return saved;
    }

    @Transactional
    public HrLeaveRequest rejectByManager(Long id, String remarks) {
        HrLeaveRequest req = findById(id);
        if (!List.of("SUBMITTED", "PENDING").contains(req.getStatus())) {
            throw new RuntimeException("Request must be PENDING to reject");
        }

        String userId = currentUserId();
        Long vhEmpId = resolveEmpId(userId);

        if (vhEmpId == null) {
            throw new RuntimeException("Unable to resolve employee details for current user.");
        }
        if (vhEmpId.equals(req.getEmpId())) {
            throw new RuntimeException("Employee cannot reject own leave.");
        }
        com.autonoma.erp.modules.hr.employee.entity.EmployeeManagerMapping mapping = managerMappingRepository.findByEmpIdAndStatus(req.getEmpId(), "Active")
                .orElseThrow(() -> new RuntimeException("No active manager mapping found for employee."));
        if (!vhEmpId.equals(mapping.getVerticalHeadId())) {
            throw new RuntimeException("Vertical Head can only reject mapped employees.");
        }

        String oldStatus = req.getStatus();
        req.setStatus("REJECTED");
        req.setRejectedBy(userId);
        req.setRejectedDate(new Date());
        req.setRejectionReason(remarks);
        req.setApprovalRemarks(remarks);

        req.setManagerId(vhEmpId);
        req.setManagerName(userId);
        req.setManagerRemarks(remarks);
        req.setManagerActionDate(new Date());

        HrLeaveRequest saved = requestRepository.save(req);

        handleBalanceTransition(saved, oldStatus, "REJECTED");

        com.autonoma.erp.util.AuditLogger.log("REJECT_LEAVE", id, "SUCCESS", "Leave request rejected by Vertical Head " + userId);
        
        employeeRepository.findById(req.getEmpId()).ifPresent(emp -> {
            notificationService.notifyUserAboutLeave(emp, saved, "REJECT");
        });
        return saved;
    }

    @Transactional
    public HrLeaveRequest approveByHr(Long id, String remarks) {
        HrLeaveRequest req = findById(id);
        if (!List.of("SUBMITTED", "PENDING", "MANAGER_APPROVED", "APPROVED").contains(req.getStatus())) {
            throw new RuntimeException("Request must be PENDING or SUBMITTED for approval");
        }
        String oldStatus = req.getStatus();
        req.setStatus("APPROVED");
        req.setApprovedBy(currentUserId());
        req.setApprovedDate(new Date());
        req.setApprovalRemarks(remarks);

        req.setHrRemarks(remarks);
        req.setHrActionDate(new Date());
        String userId = currentUserId();
        req.setHrId(resolveEmpId(userId));
        req.setHrName(userId);
        HrLeaveRequest saved = requestRepository.save(req);

        handleBalanceTransition(saved, oldStatus, "APPROVED");

        // Auto-update daily attendance to 'LEAVE' for each day in range
        try {
            LocalDate start = req.getStartDate();
            LocalDate end = req.getEndDate();
            for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
                com.autonoma.erp.modules.hr.attendance.entity.HrDailyAttendance att = hrDailyAttendanceRepository
                        .findByEmpIdAndAttendanceDate(req.getEmpId(), date)
                        .orElse(new com.autonoma.erp.modules.hr.attendance.entity.HrDailyAttendance());
                att.setEmpId(req.getEmpId());
                att.setAttendanceDate(date);
                att.setStatus("LEAVE");
                att.setRemarks("Leave Approved by HR: " + req.getLeaveTypeName() + " (" + req.getRequestNo() + ")");
                hrDailyAttendanceRepository.save(att);
            }
        } catch (Exception e) {
            System.err.println("Failed to automatically update daily attendance on HR leave approval: " + e.getMessage());
        }

        employeeRepository.findById(req.getEmpId()).ifPresent(emp -> {
            notificationService.notifyUserAboutLeave(emp, saved, "APPROVE");
        });

        try {
            checklistAutoAssignmentService.runReassignmentCheckForOpenAssignments();
        } catch (Exception e) {
            System.err.println("Failed to trigger checklist auto-reassignment on HR leave approval: " + e.getMessage());
        }
        return saved;
    }

    @Transactional
    public HrLeaveRequest rejectByHr(Long id, String remarks) {
        HrLeaveRequest req = findById(id);
        if (!List.of("SUBMITTED", "PENDING", "MANAGER_APPROVED").contains(req.getStatus())) {
            throw new RuntimeException("Request must be PENDING or SUBMITTED to reject");
        }
        String oldStatus = req.getStatus();
        req.setStatus("REJECTED");
        req.setRejectedBy(currentUserId());
        req.setRejectedDate(new Date());
        req.setRejectionReason(remarks);
        req.setApprovalRemarks(remarks);

        req.setHrRemarks(remarks);
        req.setHrActionDate(new Date());
        String userId = currentUserId();
        req.setHrId(resolveEmpId(userId));
        req.setHrName(userId);
        HrLeaveRequest saved = requestRepository.save(req);

        handleBalanceTransition(saved, oldStatus, "REJECTED");

        employeeRepository.findById(req.getEmpId()).ifPresent(emp -> {
            notificationService.notifyUserAboutLeave(emp, saved, "REJECT");
        });
        return saved;
    }

    // ── Reports ──────────────────────────────────────────────────────────────

    public List<HrLeaveRequest> findApprovedBetween(LocalDate from, LocalDate to) {
        return requestRepository.findAllApprovedBetween(from, to);
    }

    public List<HrLeaveRequest> findApprovedByYear(Integer year) {
        return requestRepository.findAllApprovedByYear(year);
    }

    public List<HrLeaveRequest> findAllRequests() {
        return requestRepository.findAllByOrderByRequestDateDesc();
    }

    public List<HrLeaveRequest> findApprovedLeaveRequests() {
        return requestRepository.findByStatusOrderByRequestDateDesc("APPROVED");
    }

    private boolean isAdmin(String userId) {
        if (userId == null || userId.isBlank()) return false;
        if ("admin".equalsIgnoreCase(userId)) return true;
        return userRepository.findByUserId(userId)
                .map(u -> u.getUserLevel() != null && (u.getUserLevel() == 1 || u.getUserLevel() == 5))
                .orElse(false);
    }

    // ── Optional Holiday specific queries ────────────────────────────────────

    public List<HrLeaveRequest> findOptionalHolidayRequestsByStatus(String status) {
        return leaveMasterRepository.findByLeaveCode("OH")
                .map(lt -> requestRepository.findByLeaveTypeIdAndStatusOrderByRequestDateDesc(lt.getLeaveTypeId(), status))
                .orElseGet(List::of);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String currentUserId() {
        try {
            return SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
            return "admin";
        }
    }

    /**
     * Resolves the logged-in user's empId. Resolution chain:
     *   1. UserCredential.userId -> UserCredential.empId (canonical link)
     *   2. EmployeeMaster.empCode == userId (legacy, when login id == emp code)
     *   3. EmployeeMaster.id == userId (when userId is the numeric employee id)
     */
    private Long resolveEmpId(String userId) {
        if (userId == null || userId.isBlank()) return null;
        try {
            Long viaCredential = userRepository.findByUserId(userId)
                    .map(u -> u.getEmpId())
                    .orElse(null);
            if (viaCredential != null) return viaCredential;

            return employeeRepository.findByEmpCode(userId)
                    .map(e -> e.getId())
                    .orElseGet(() -> {
                        try {
                            return employeeRepository.findById(Long.parseLong(userId))
                                    .map(e -> e.getId()).orElse(null);
                        } catch (NumberFormatException nfe) {
                            return null;
                        }
                    });
        } catch (Exception e) {
            return null;
        }
    }

    private void enrichEmployeeDetails(HrLeaveRequest request) {
        if (request.getEmpId() == null) return;
        try {
            employeeRepository.findById(request.getEmpId()).ifPresent(emp -> {
                request.setEmpCode(emp.getEmpCode());
                request.setEmpName((emp.getFirstName() != null ? emp.getFirstName() : "") +
                        (emp.getLastName() != null ? " " + emp.getLastName() : ""));
                if (emp.getDepartmentId() != null) {
                    request.setDepartmentId(emp.getDepartmentId());
                }
            });
        } catch (Exception ignored) {}
    }

    private void enrichManagerDetails(HrLeaveRequest request) {
        if (request.getEmpId() == null) return;
        try {
            managerMappingRepository.findByEmpIdAndStatus(request.getEmpId(), "Active")
                    .ifPresent(m -> {
                        Long vhId = m.getVerticalHeadId();
                        if (vhId != null) {
                            request.setManagerId(vhId);
                            employeeRepository.findById(vhId).ifPresent(mgr -> {
                                request.setManagerName((mgr.getFirstName() != null ? mgr.getFirstName() : "") +
                                        (mgr.getLastName() != null ? " " + mgr.getLastName() : ""));
                            });
                        }
                    });
        } catch (Exception ignored) {}
    }

    private String generateRequestNo() {
        LocalDate today = LocalDate.now();
        String prefix = String.format("LR-%d%02d%02d-", today.getYear(), today.getMonthValue(), today.getDayOfMonth());
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        Date startOfDay = cal.getTime();
        cal.set(Calendar.HOUR_OF_DAY, 23);
        cal.set(Calendar.MINUTE, 59);
        cal.set(Calendar.SECOND, 59);
        Date endOfDay = cal.getTime();
        long count = requestRepository.countByCreatedDateBetween(startOfDay, endOfDay);
        return prefix + String.format("%03d", count + 1);
    }

    // ── Consolidating balance, validation, and sandwich Sundays ─────────────

    private boolean isApprovedStatus(String status) {
        return "APPROVED".equalsIgnoreCase(status) || "MANAGER_APPROVED".equalsIgnoreCase(status) || "HR_APPROVED".equalsIgnoreCase(status);
    }

    private void validateRequest(HrLeaveRequest request, Long excludeId) {
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new RuntimeException("Start date and End date are required.");
        }
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new RuntimeException("Start date cannot be after End date.");
        }

        // 30-day past-date check
        LocalDate limit = LocalDate.now().minusDays(30);
        if (request.getStartDate().isBefore(limit)) {
            String userId = currentUserId();
            if (!authService.hasPermission(userId, "HA1210", "additional1") && !authService.hasPermission(userId, "HA1210", "manager")) {
                throw new RuntimeException("Cannot apply for leaves starting more than 30 days in the past.");
            }
        }

        // Overlap checking (strictly ignoring Rejected/Cancelled requests)
        List<HrLeaveRequest> conflicts = requestRepository.findConflictingRequests(
                request.getEmpId(), request.getStartDate(), request.getEndDate());
        if (conflicts != null && !conflicts.isEmpty()) {
            conflicts = conflicts.stream()
                    .filter(c -> {
                        if (c == null || c.getStatus() == null) return true;
                        String st = c.getStatus().toUpperCase().trim();
                        return !st.contains("REJECT") && !st.contains("CANCEL");
                    })
                    .filter(c -> excludeId == null || !c.getLeaveRequestId().equals(excludeId))
                    .toList();
        }
        if (conflicts != null && !conflicts.isEmpty()) {
            throw new RuntimeException("Overlapping leave request already exists in the requested range.");
        }

        // Balance checking
        String leaveCode = getLeaveCodeById(request.getLeaveTypeId());
        List<LeaveDateInfo> proposedDates = calculateProposedLeaveDates(
                request.getEmpId(), request.getStartDate(), request.getEndDate(), request.getNumberOfDays(), excludeId);
        
        double totalQty = proposedDates.stream().mapToDouble(d -> d.noOfDays).sum();
        
        if (!"WFH".equalsIgnoreCase(leaveCode)) {
            LeaveMaster lm = getOrCreateLeaveMaster(request.getEmpId());
                    
            double available = getBalanceForType(lm, leaveCode);
            if (available < totalQty) {
                double diff = totalQty - available;
                addBalanceForType(lm, leaveCode, diff);
            }
        }
        
        // Update request's numberOfDays to match calculated days (including sandwich Sundays)
        request.setNumberOfDays(totalQty);
    }

    private List<LeaveDateInfo> calculateProposedLeaveDates(Long empId, LocalDate startDate, LocalDate endDate, Double reqNoOfDays, Long excludeRequestId) {
        List<LeaveDateInfo> list = new ArrayList<>();
        if (startDate == null || endDate == null || startDate.isAfter(endDate)) {
            return list;
        }

        // Get active leave dates of the employee (excluding current request if update)
        Set<LocalDate> activeLeaveDates = getActiveLeaveDates(empId, excludeRequestId);

        // Collect all non-Sunday proposed dates in the range
        List<LocalDate> requestedNonSundays = new ArrayList<>();
        Set<LocalDate> requestDatesSet = new HashSet<>();
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            if (current.getDayOfWeek() != java.time.DayOfWeek.SUNDAY) {
                requestedNonSundays.add(current);
                requestDatesSet.add(current);
            }
            current = current.plusDays(1);
        }

        // Combined leave date lookup (DB + current request)
        Set<LocalDate> combinedLeaveDates = new HashSet<>(activeLeaveDates);
        combinedLeaveDates.addAll(requestDatesSet);

        // Fetch sandwich preference
        Optional<AppPreference> prefOpt = preferenceRepository.findByPrefName("SANDWICH_LEAVE");
        boolean isSandwichEnabled = prefOpt.isPresent() && "yes".equalsIgnoreCase(prefOpt.get().getPrefValue());

        // Process requested non-Sunday dates
        double regularDayQty = 1.0;
        if (startDate.equals(endDate) && reqNoOfDays != null && reqNoOfDays == 0.5) {
            regularDayQty = 0.5;
        }

        for (LocalDate d : requestedNonSundays) {
            list.add(new LeaveDateInfo(d, regularDayQty, false));
        }

        // Find and process sandwiched Sundays
        if (isSandwichEnabled) {
            LocalDate checkStart = startDate.minusDays(1);
            LocalDate checkEnd = endDate.plusDays(1);
            
            LocalDate checkDate = checkStart;
            while (!checkDate.isAfter(checkEnd)) {
                if (checkDate.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
                    LocalDate sat = checkDate.minusDays(1);
                    LocalDate mon = checkDate.plusDays(1);
                    
                    if (combinedLeaveDates.contains(sat) && combinedLeaveDates.contains(mon)) {
                        if (!activeLeaveDates.contains(checkDate)) {
                            list.add(new LeaveDateInfo(checkDate, 1.0, true));
                        }
                    }
                }
                checkDate = checkDate.plusDays(1);
            }
        }

        list.sort(java.util.Comparator.comparing(d -> d.date));
        return list;
    }

    private Set<LocalDate> getActiveLeaveDates(Long empId, Long excludeRequestId) {
        Set<LocalDate> dates = new HashSet<>();
        List<HrLeaveRequest> activeRequests = requestRepository.findByEmpIdOrderByRequestDateDesc(empId);
        for (HrLeaveRequest req : activeRequests) {
            if (excludeRequestId != null && excludeRequestId.equals(req.getLeaveRequestId())) {
                continue;
            }
            if (isApprovedStatus(req.getStatus())) {
                LocalDate curr = req.getStartDate();
                LocalDate end = req.getEndDate();
                while (!curr.isAfter(end)) {
                    dates.add(curr);
                    curr = curr.plusDays(1);
                }
            }
        }
        
        List<LeaveEntry> activeEntries = leaveEntryRepo.findByEmployeeIdAndIsActiveTrue(empId);
        for (LeaveEntry entry : activeEntries) {
            if (entry.getStatus() != null && ("REJECTED".equalsIgnoreCase(entry.getStatus().trim()) || "REJECT".equalsIgnoreCase(entry.getStatus().trim()))) {
                continue; // Ignore rejected leave entries
            }
            Date startD = entry.getFromDate();
            Date endD = entry.getToDate();
            if (startD != null && endD != null) {
                LocalDate curr = startD.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                LocalDate end = endD.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                while (!curr.isAfter(end)) {
                    dates.add(curr);
                    curr = curr.plusDays(1);
                }
            }
        }
        
        return dates;
    }

    private String getLeaveCodeById(Long leaveTypeId) {
        if (leaveTypeId == null) {
            throw new RuntimeException("Leave Type ID is required.");
        }
        return leaveMasterRepository.findById(leaveTypeId)
                .map(lt -> lt.getLeaveCode())
                .orElseThrow(() -> new RuntimeException("Unknown leave type ID: " + leaveTypeId));
    }

    private double getBalanceForType(LeaveMaster lm, String leaveCode) {
        if (leaveCode == null) return 0.0;
        BigDecimal val;
        switch (leaveCode.toUpperCase()) {
            case "EL": val = lm.getEl(); break;
            case "CL": val = lm.getCl(); break;
            case "SL": val = lm.getSl(); break;
            case "AL": val = lm.getAl(); break;
            case "PL": val = lm.getPl(); break;
            default: throw new RuntimeException("Unknown leave code: " + leaveCode);
        }
        return val != null ? val.doubleValue() : 0.0;
    }

    private void deductBalanceForType(LeaveMaster lm, String leaveCode, double qty) {
        BigDecimal qtyBd = BigDecimal.valueOf(qty);
        switch (leaveCode.toUpperCase()) {
            case "EL": lm.setEl(lm.getEl().subtract(qtyBd)); break;
            case "CL": lm.setCl(lm.getCl().subtract(qtyBd)); break;
            case "SL": lm.setSl(lm.getSl().subtract(qtyBd)); break;
            case "AL": lm.setAl(lm.getAl().subtract(qtyBd)); break;
            case "PL": lm.setPl(lm.getPl().subtract(qtyBd)); break;
            default: throw new RuntimeException("Unknown leave code: " + leaveCode);
        }
    }

    private void addBalanceForType(LeaveMaster lm, String leaveCode, double qty) {
        BigDecimal qtyBd = BigDecimal.valueOf(qty);
        switch (leaveCode.toUpperCase()) {
            case "EL": lm.setEl(lm.getEl().add(qtyBd)); break;
            case "CL": lm.setCl(lm.getCl().add(qtyBd)); break;
            case "SL": lm.setSl(lm.getSl().add(qtyBd)); break;
            case "AL": lm.setAl(lm.getAl().add(qtyBd)); break;
            case "PL": lm.setPl(lm.getPl().add(qtyBd)); break;
            default: throw new RuntimeException("Unknown leave code: " + leaveCode);
        }
    }

    private void handleBalanceTransition(HrLeaveRequest request, String oldStatus, String newStatus) {
        boolean wasApproved = isApprovedStatus(oldStatus);
        boolean isApproved = isApprovedStatus(newStatus);

        String leaveCode = getLeaveCodeById(request.getLeaveTypeId());
        if ("WFH".equalsIgnoreCase(leaveCode)) {
            return;
        }

        if (!wasApproved && isApproved) {
            LeaveMaster lm = getOrCreateLeaveMaster(request.getEmpId());
            
            double qty = request.getNumberOfDays();
            deductBalanceForType(lm, leaveCode, qty);
            employeeLeaveMasterRepository.save(lm);

            LeaveTransaction trans = new LeaveTransaction();
            trans.setEmployeeId(request.getEmpId());
            trans.setTransactionDate(new Date());
            trans.setTransactionType("DEBIT");
            trans.setLeaveType(leaveCode);
            trans.setCrQty(BigDecimal.ZERO);
            trans.setDrQty(BigDecimal.valueOf(qty));
            trans.setAvlQty(BigDecimal.valueOf(getBalanceForType(lm, leaveCode)));
            trans.setRemarks("Leave Approved: " + request.getRequestNo() + " (from " + request.getStartDate() + " to " + request.getEndDate() + ")");
            leaveTransactionRepository.save(trans);
            
            com.autonoma.erp.util.AuditLogger.log("DEBIT_LEAVE_BALANCE", request.getLeaveRequestId(), "SUCCESS", 
                    "Debited " + qty + " " + leaveCode + " leaves for employee " + request.getEmpId());
        } else if (wasApproved && !isApproved) {
            LeaveMaster lm = getOrCreateLeaveMaster(request.getEmpId());
            
            double qty = request.getNumberOfDays();
            addBalanceForType(lm, leaveCode, qty);
            employeeLeaveMasterRepository.save(lm);

            LeaveTransaction trans = new LeaveTransaction();
            trans.setEmployeeId(request.getEmpId());
            trans.setTransactionDate(new Date());
            trans.setTransactionType("CREDIT");
            trans.setLeaveType(leaveCode);
            trans.setCrQty(BigDecimal.valueOf(qty));
            trans.setDrQty(BigDecimal.ZERO);
            trans.setAvlQty(BigDecimal.valueOf(getBalanceForType(lm, leaveCode)));
            trans.setRemarks("Leave Cancelled/Rejected: " + request.getRequestNo() + " (from " + request.getStartDate() + " to " + request.getEndDate() + ")");
            leaveTransactionRepository.save(trans);
            
            com.autonoma.erp.util.AuditLogger.log("CREDIT_LEAVE_BALANCE", request.getLeaveRequestId(), "SUCCESS", 
                    "Credited back " + qty + " " + leaveCode + " leaves for employee " + request.getEmpId());
        }
    }

    private LeaveMaster getOrCreateLeaveMaster(Long employeeId) {
        return employeeLeaveMasterRepository.findByEmployeeIdAndStatus(employeeId, true)
                .orElseGet(() -> {
                    LeaveMaster newLm = new LeaveMaster();
                    newLm.setEmployeeId(employeeId);
                    newLm.setEl(BigDecimal.ZERO);
                    newLm.setCl(BigDecimal.ZERO);
                    newLm.setSl(BigDecimal.ZERO);
                    newLm.setAl(BigDecimal.ZERO);
                    newLm.setPl(BigDecimal.ZERO);
                    newLm.setStatus(true);
                    newLm.setCreatedBy("SYSTEM");
                    newLm.setCreatedDate(new Date());
                    return employeeLeaveMasterRepository.save(newLm);
                });
    }

    private static class LeaveDateInfo {
        LocalDate date;
        double noOfDays;
        boolean isSandwichSunday;

        LeaveDateInfo(LocalDate date, double noOfDays, boolean isSandwichSunday) {
            this.date = date;
            this.noOfDays = noOfDays;
            this.isSandwichSunday = isSandwichSunday;
        }
    }
}
