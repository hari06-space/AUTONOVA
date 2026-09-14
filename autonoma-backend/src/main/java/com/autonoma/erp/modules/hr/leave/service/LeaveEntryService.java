package com.autonoma.erp.modules.hr.leave.service;

import AppUtil.AppConstants;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.util.AttachmentUtil;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.leave.entity.LeaveEntry;
import com.autonoma.erp.modules.hr.leave.entity.LeaveMaster;
import com.autonoma.erp.modules.hr.leave.entity.LeaveTransaction;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.leave.repository.LeaveEntryRepository;
import com.autonoma.erp.modules.hr.leave.repository.LeaveMasterRepository;
import com.autonoma.erp.modules.hr.leave.repository.LeaveTransactionRepository;

import com.autonoma.erp.model.admin.AppPreference;
import com.autonoma.erp.repository.admin.AppPreferenceRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import com.autonoma.erp.modules.hr.leave.repository.HrLeaveRequestRepository;
import com.autonoma.erp.modules.induction.repository.HrAttachmentPathRepository;
import com.autonoma.erp.modules.qms.checklist.service.ChecklistAutoAssignmentService;
import com.autonoma.erp.modules.platform.notification.service.NotificationService;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;

import com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationLevelRepository;

@Service
public class LeaveEntryService {

    @Autowired
    private DesignationLevelRepository designationLevelRepo;

    @Autowired
    private LeaveEntryRepository leaveEntryRepo;

    @Autowired
    private LeaveMasterRepository leaveMasterRepo;

    @Autowired
    private EmployeeMasterRepository employeeRepo;

    @Autowired
    private LeaveTransactionRepository leaveTransRepo;

    @Autowired
    private com.autonoma.erp.service.admin.BosUserPageAuthService authService;

    @Autowired
    private AppPreferenceRepository preferenceRepo;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HrLeaveRequestRepository hrLeaveRequestRepo;
    
    @Autowired
    private HrAttachmentPathRepository attachmentRepo;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private ChecklistAutoAssignmentService checklistAutoAssignmentService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmployeeManagerMappingRepository managerMappingRepository;

    @Autowired(required = false)
    private com.autonoma.erp.modules.hr.settings.service.HrSettingsService hrSettingsService;

    @Autowired
    private StatusMasterRepository statusMasterRepo;

    @Autowired
    private com.autonoma.erp.repository.OdEntryRepository odEntryRepo;

    @Autowired
    private com.autonoma.erp.modules.platform.identity.repository.PermissionEntryRepository permissionEntryRepo;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository jobProfileRepo;

    /** Resolve the AD_STATUS_MASTER ID for a given status name (case-insensitive), creating it if not present. */
    public Long resolveStatusId(String name) {
        if (name == null || name.trim().isEmpty()) return null;
        String cleanName = name.trim();
        return statusMasterRepo.findByNameIgnoreCase(cleanName)
                .map(sm -> sm.getId())
                .orElseGet(() -> {
                    com.autonoma.erp.modules.platform.common.entity.StatusMaster sm = new com.autonoma.erp.modules.platform.common.entity.StatusMaster();
                    sm.setName(cleanName);
                    return statusMasterRepo.save(sm).getId();
                });
    }

    private boolean isLeaveEntryRejected(LeaveEntry e) {
        if (e == null) return false;
        String st = e.getStatus();
        if (st != null && st.toUpperCase().contains("REJECT")) {
            return true;
        }
        if (e.getRejectReason() != null && !e.getRejectReason().trim().isEmpty()) {
            return true;
        }
        if (e.getStatusMaster() != null && e.getStatusMaster().getName() != null) {
            if (e.getStatusMaster().getName().toUpperCase().contains("REJECT")) {
                return true;
            }
        }
        return false;
    }

    private boolean isHrLeaveRequestRejected(com.autonoma.erp.modules.hr.leave.entity.HrLeaveRequest r) {
        if (r == null) return false;
        String st = r.getStatus();
        if (st != null && (st.toUpperCase().contains("REJECT") || st.toUpperCase().contains("CANCEL"))) {
            return true;
        }
        if (r.getRejectionReason() != null && !r.getRejectionReason().trim().isEmpty()) {
            return true;
        }
        return false;
    }

    private static final ThreadLocal<SimpleDateFormat> sdf = ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));

    public List<LeaveEntry> getAllLeaveEntries() {
        return leaveEntryRepo.findByIsActiveTrueOrderByDateDesc();
    }

    public List<LeaveEntry> getFilteredVerificationList(String scope) {
        if (scope == null || scope.trim().isEmpty()) {
            scope = "Mine";
        }

        String currentUserId = SecurityUtils.getCurrentUserId();
        Long currentEmployeeId = userRepository.findById(currentUserId)
                .map(UserCredential::getEmpId)
                .orElse(0L);

        if ("Mine".equalsIgnoreCase(scope)) {
            return leaveEntryRepo.findByEmployeeIdAndIsActiveTrue(currentEmployeeId);
        } else if ("My Team".equalsIgnoreCase(scope)) {
            List<Long> teamMemberIds = managerMappingRepository.findReporteeEmpIdsByManagerId(currentEmployeeId);
            if (teamMemberIds.isEmpty()) {
                return List.of();
            }
            return leaveEntryRepo.findByEmployeeIdInAndIsActiveTrue(teamMemberIds);
        } else if ("My Company".equalsIgnoreCase(scope)) {
            return leaveEntryRepo.findByIsActiveTrueOrderByDateDesc();
        } else {
            throw new RuntimeException("Invalid request scope: " + scope);
        }
    }

    /**
     * Get Employee details and current leave balances.
     */
    public Map<String, Object> getEmployeeDetailsWithBalances(Long employeeId) {
        EmployeeMaster emp = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        Map<String, Object> details = new HashMap<>();
        details.put("employeeName", emp.getEmployeeName());
        String empCode = emp.getEmpCode();
        if (empCode == null || empCode.trim().isEmpty()) {
            empCode = emp.getOldEmpCode();
        }
        details.put("empCode", empCode != null ? empCode.trim() : "");
        details.put("oldEmpCode", emp.getOldEmpCode() != null ? emp.getOldEmpCode().trim() : "");
        details.put("department", emp.getDepartment() != null ? emp.getDepartment().getDepartmentName() : "N/A");
        details.put("designation", emp.getDesignation() != null ? emp.getDesignation().getDesignationName() : "N/A");
        details.put("dateOfJoining", emp.getDateOfJoining());
        details.put("employeePhotoUpload", emp.getEmployeePhotoUpload());

        Long empLevelId = emp.getEmpLevelId();
        Double ltaLimit = null;
        String levelName = null;
        if (empLevelId != null) {
            Optional<DesignationLevel> dlOpt = designationLevelRepo.findById(empLevelId);
            if (dlOpt.isPresent()) {
                ltaLimit = dlOpt.get().getLtaLimit();
                levelName = dlOpt.get().getLevel();
            }
        }
        if (ltaLimit == null && emp.getDesignation() != null && emp.getDesignation().getSubCategoryLevel() != null) {
            String catLvl = emp.getDesignation().getSubCategoryLevel().trim();
            Optional<DesignationLevel> dlOpt = designationLevelRepo.findByLevel(catLvl);
            if (dlOpt.isPresent()) {
                ltaLimit = dlOpt.get().getLtaLimit();
                levelName = dlOpt.get().getLevel();
            }
        }
        details.put("ltaLimit", ltaLimit);
        details.put("levelName", levelName);

        Optional<LeaveMaster> lmOpt = leaveMasterRepo.findByEmployeeIdAndStatus(employeeId, true);
        Map<String, BigDecimal> balances = new HashMap<>();
        if (lmOpt.isPresent()) {
            LeaveMaster lm = lmOpt.get();
            balances.put("EL", lm.getEl());
            balances.put("CL", lm.getCl());
            balances.put("SL", lm.getSl());
            balances.put("AL", lm.getAl());
            balances.put("PL", lm.getPl());
            balances.put("LOP", BigDecimal.ZERO);
        } else {
            balances.put("EL", BigDecimal.ZERO);
            balances.put("CL", BigDecimal.ZERO);
            balances.put("SL", BigDecimal.ZERO);
            balances.put("AL", BigDecimal.ZERO);
            balances.put("PL", BigDecimal.ZERO);
            balances.put("LOP", BigDecimal.ZERO);
        }
        details.put("balances", balances);

        return details;
    }



    /**
     * Calculate dates list and validate leave balance without saving.
     */
    public Map<String, Object> checkLeaveAvailability(Long employeeId, String leaveType, Date fromDate, Date toDate, String halfDay) {
        List<DateInfo> proposedDates = calculateProposedLeaveDates(employeeId, fromDate, toDate, halfDay);
        
        BigDecimal totalQty = BigDecimal.ZERO;
        int sandwichCount = 0;
        List<Map<String, Object>> dateList = new ArrayList<>();
        
        for (DateInfo dInfo : proposedDates) {
            totalQty = totalQty.add(dInfo.noOfDays);
            if (dInfo.isSandwichSunday) {
                sandwichCount++;
            }
            
            Map<String, Object> dateMap = new HashMap<>();
            dateMap.put("date", sdf.get().format(dInfo.date));
            dateMap.put("noOfDays", dInfo.noOfDays);
            dateMap.put("isSandwichSunday", dInfo.isSandwichSunday);
            dateList.add(dateMap);
        }

        // Fetch employee available balance
        LeaveMaster lm = getOrCreateLeaveMaster(employeeId);
        BigDecimal availableBalance = BigDecimal.ZERO;
        boolean sufficient = false;
        // LOP and WFH do not require leave balance checks
        if ("WFH".equalsIgnoreCase(leaveType) || "LOP".equalsIgnoreCase(leaveType)) {
            sufficient = true;
            availableBalance = null;
        } else {
            availableBalance = getBalanceForType(lm, leaveType);
            sufficient = availableBalance.compareTo(totalQty) >= 0;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("availableBalance", ("WFH".equalsIgnoreCase(leaveType) || "LOP".equalsIgnoreCase(leaveType)) ? null : availableBalance);
        result.put("noOfDays", totalQty);
        result.put("sandwichDays", sandwichCount);
        result.put("sufficient", sufficient);
        result.put("dates", dateList);
        result.put("employeeDetails", getEmployeeDetailsWithBalances(employeeId));

        return result;
    }

    /**
     * Save Leave Entry records and debit from LeaveMaster.
     */
    @Transactional
    public List<LeaveEntry> saveLeaveEntry(Long employeeId, String leaveType, Date fromDate, Date toDate, String halfDay, String reason, String filePaths) {
        return saveLeaveEntry(employeeId, leaveType, fromDate, toDate, halfDay, reason, filePaths, "HRA");
    }

    @Transactional
    public List<LeaveEntry> saveLeaveEntry(Long employeeId, String leaveType, Date fromDate, Date toDate, String halfDay, String reason, String filePaths, String source) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new RuntimeException("Reason is required and cannot be empty.");
        }
        EmployeeMaster emp = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        if (jobProfileRepo != null) {
            Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile> jobProfileOpt = jobProfileRepo.findByEmployeeId(employeeId);
            if (jobProfileOpt.isPresent()) {
                String leaveAllowed = jobProfileOpt.get().getLeaveAllowed();
                if ("NO".equalsIgnoreCase(leaveAllowed) || "false".equalsIgnoreCase(leaveAllowed)) {
                    throw new RuntimeException("Leave application is disabled for this employee in Employee Master.");
                }
            }
        }

        // Standard Backdated Rule: Employees/Managers can apply for up to 3 past days. Beyond 3 days requires ADD1 permission.
        Calendar todayCal = Calendar.getInstance();
        clearTimeFields(todayCal);

        Calendar limit = Calendar.getInstance();
        limit.add(Calendar.DAY_OF_MONTH, -3);
        clearTimeFields(limit);

        Calendar fromCal = Calendar.getInstance();
        fromCal.setTime(fromDate);
        clearTimeFields(fromCal);

        if (fromCal.before(limit)) {
            String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            boolean isAdmin = false;
            if (currentUserId == null || "SYSTEM".equals(currentUserId)) {
                isAdmin = true;
            } else {
                isAdmin = authService.hasPermission(currentUserId, "M2390", "additional1")
                        || authService.hasPermission(currentUserId, "HA1390", "additional1");
            }
            if (!isAdmin) {
                throw new RuntimeException("Leave application date cannot be more than 3 days in the past.");
            }
        }
        fromDate = fromCal.getTime();

        Calendar toCal = Calendar.getInstance();
        toCal.setTime(toDate);
        clearTimeFields(toCal);
        toDate = toCal.getTime();

        Calendar leaveStart = Calendar.getInstance();
        leaveStart.setTime(fromDate);
        clearTimeFields(leaveStart);

        // 1. Calculate proposed dates including sandwich Sundays
        List<DateInfo> proposedDates = calculateProposedLeaveDates(employeeId, fromDate, toDate, halfDay);
        if (proposedDates.isEmpty()) {
            throw new RuntimeException("No leave dates calculated for the given range.");
        }

        BigDecimal totalQty = BigDecimal.ZERO;
        for (DateInfo dInfo : proposedDates) {
            totalQty = totalQty.add(dInfo.noOfDays);
        }

        // 2. Fetch and check available balance in LeaveMaster
        LeaveMaster lm = null;
        if (!"WFH".equalsIgnoreCase(leaveType) && !"LOP".equalsIgnoreCase(leaveType)) {
            lm = getOrCreateLeaveMaster(employeeId);

            BigDecimal availableBalance = getBalanceForType(lm, leaveType);
            if (availableBalance.compareTo(totalQty) < 0) {
                throw new RuntimeException("Insufficient leave balance. Available: " + availableBalance + " day(s), Required: " + totalQty + " day(s).");
            }
        }

        com.autonoma.erp.util.AttendanceOccupancyUtil.DayOccupancy reqLeaveOcc = com.autonoma.erp.util.AttendanceOccupancyUtil.getLeaveOccupancy(halfDay);

        // 3. Check internal Leave overlaps (with Half-Day compatibility)
        List<LeaveEntry> allEmployeeEntries = leaveEntryRepo.findByEmployeeIdAndIsActiveTrue(employeeId);
        if (allEmployeeEntries != null && !allEmployeeEntries.isEmpty()) {
            SimpleDateFormat dFmt = new SimpleDateFormat("dd-MMM-yyyy");
            for (LeaveEntry e : allEmployeeEntries) {
                if (isLeaveEntryRejected(e)) {
                    continue;
                }
                if (e.getFromDate() != null && e.getToDate() != null) {
                    if (!e.getFromDate().after(toDate) && !e.getToDate().before(fromDate)) {
                        com.autonoma.erp.util.AttendanceOccupancyUtil.DayOccupancy exLeaveOcc = com.autonoma.erp.util.AttendanceOccupancyUtil.getLeaveOccupancy(e.getHalfDay());
                        if (com.autonoma.erp.util.AttendanceOccupancyUtil.checkOccupancyConflict(exLeaveOcc, reqLeaveOcc)) {
                            String clashDate = dFmt.format(e.getFromDate());
                            throw new RuntimeException("An active Leave application (" + exLeaveOcc.getLabel() + ") already exists on " + clashDate + ". Cannot apply for Leave (" + reqLeaveOcc.getLabel() + ") on the same half-day.");
                        }
                    }
                }
            }
        }

        LocalDate fromLocalDate = fromDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        LocalDate toLocalDate = toDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        List<com.autonoma.erp.modules.hr.leave.entity.HrLeaveRequest> requestOverlaps = hrLeaveRequestRepo.findConflictingRequests(employeeId, fromLocalDate, toLocalDate);
        if (requestOverlaps != null && !requestOverlaps.isEmpty()) {
            List<com.autonoma.erp.modules.hr.leave.entity.HrLeaveRequest> activeReqOverlaps = requestOverlaps.stream()
                    .filter(r -> !isHrLeaveRequestRejected(r))
                    .toList();
            if (!activeReqOverlaps.isEmpty()) {
                throw new RuntimeException("Overlapping approved/pending leave request already exists in the requested range.");
            }
        }

        // Cross-module validation: Check active OD applications (with Half-Day compatibility)
        List<com.autonoma.erp.model.OdEntry> existingOds = odEntryRepo.findByEmployeeId(employeeId);
        if (existingOds != null && !existingOds.isEmpty()) {
            SimpleDateFormat dFmt = new SimpleDateFormat("dd-MMM-yyyy");
            for (com.autonoma.erp.model.OdEntry od : existingOds) {
                String st = od.getStatus() != null ? od.getStatus().trim() : "";
                if (st.equalsIgnoreCase("Rejected") || st.equalsIgnoreCase("Reject") || st.equalsIgnoreCase("Cancelled")) {
                    continue;
                }
                if (od.getOdFromDateTime() != null && od.getOdToDateTime() != null) {
                    Calendar odStart = Calendar.getInstance();
                    odStart.setTime(od.getOdFromDateTime());
                    clearTimeFields(odStart);
                    Calendar odEnd = Calendar.getInstance();
                    odEnd.setTime(od.getOdToDateTime());
                    clearTimeFields(odEnd);

                    if (!odStart.getTime().after(toDate) && !odEnd.getTime().before(fromDate)) {
                        com.autonoma.erp.util.AttendanceOccupancyUtil.DayOccupancy exOdOcc = com.autonoma.erp.util.AttendanceOccupancyUtil.getOdOccupancy(od.getOdFromDateTime(), od.getOdToDateTime());
                        if (com.autonoma.erp.util.AttendanceOccupancyUtil.checkOccupancyConflict(exOdOcc, reqLeaveOcc)) {
                            String clashDate = dFmt.format(odStart.getTime());
                            throw new RuntimeException("An active On Duty (OD) application (" + exOdOcc.getLabel() + ") already exists on " + clashDate + ". Cannot apply for Leave (" + reqLeaveOcc.getLabel() + ") on the same half-day.");
                        }
                    }
                }
            }
        }

        // Cross-module validation: Check active Permission applications (with Half-Day compatibility)
        List<com.autonoma.erp.modules.platform.identity.entity.PermissionEntry> existingPermissions = permissionEntryRepo.findByEmployeeIdOrderByPermissionDateDesc(employeeId);
        if (existingPermissions != null && !existingPermissions.isEmpty()) {
            SimpleDateFormat dFmt = new SimpleDateFormat("dd-MMM-yyyy");
            for (com.autonoma.erp.modules.platform.identity.entity.PermissionEntry perm : existingPermissions) {
                String st = perm.getStatus() != null ? perm.getStatus().trim() : "";
                if (st.equalsIgnoreCase("Rejected") || st.equalsIgnoreCase("Reject") || st.equalsIgnoreCase("Cancelled")) {
                    continue;
                }
                if (perm.getPermissionDate() != null) {
                    Calendar pCal = Calendar.getInstance();
                    pCal.setTime(perm.getPermissionDate());
                    clearTimeFields(pCal);
                    Date pDate = pCal.getTime();

                    if (!pDate.before(fromDate) && !pDate.after(toDate)) {
                        com.autonoma.erp.util.AttendanceOccupancyUtil.DayOccupancy exPermOcc = com.autonoma.erp.util.AttendanceOccupancyUtil.getPermissionOccupancy(perm.getFromTime(), perm.getToTime());
                        if (com.autonoma.erp.util.AttendanceOccupancyUtil.checkOccupancyConflict(exPermOcc, reqLeaveOcc)) {
                            String clashDate = dFmt.format(pDate);
                            throw new RuntimeException("An active Permission application (" + exPermOcc.getLabel() + ") already exists on " + clashDate + ". Cannot apply for Leave (" + reqLeaveOcc.getLabel() + ") on the same half-day.");
                        }
                    }
                }
            }
        }

        // 4. Save leave entries
        List<LeaveEntry> savedEntries = new ArrayList<>();
        Calendar cal = Calendar.getInstance();
        
        List<DateInfo> mainRangeDates = new ArrayList<>();
        List<DateInfo> outsideSundays = new ArrayList<>();
        
        for (DateInfo dInfo : proposedDates) {
            if (dInfo.date.compareTo(fromDate) >= 0 && dInfo.date.compareTo(toDate) <= 0) {
                mainRangeDates.add(dInfo);
            } else {
                if (dInfo.isSandwichSunday) {
                    outsideSundays.add(dInfo);
                }
            }
        }
        
        // Group main range dates by month/year (using LinkedHashMap to maintain chronological order)
        Map<String, List<DateInfo>> groupedByMonth = new LinkedHashMap<>();
        for (DateInfo dInfo : mainRangeDates) {
            cal.setTime(dInfo.date);
            int year = cal.get(Calendar.YEAR);
            int month = cal.get(Calendar.MONTH);
            String key = year + "_" + month;
            groupedByMonth.computeIfAbsent(key, k -> new ArrayList<>()).add(dInfo);
        }

        for (Map.Entry<String, List<DateInfo>> entry : groupedByMonth.entrySet()) {
            List<DateInfo> monthDates = entry.getValue();
            if (monthDates.isEmpty()) {
                continue;
            }

            Date groupFromDate = monthDates.get(0).date;
            Date groupToDate = monthDates.get(monthDates.size() - 1).date;
            BigDecimal groupNoOfDays = BigDecimal.ZERO;

            for (DateInfo d : monthDates) {
                groupNoOfDays = groupNoOfDays.add(d.noOfDays);
                if (d.date.before(groupFromDate)) {
                    groupFromDate = d.date;
                }
                if (d.date.after(groupToDate)) {
                    groupToDate = d.date;
                }
            }

            cal.setTime(groupFromDate);
            String monthName = cal.getDisplayName(Calendar.MONTH, Calendar.LONG, Locale.ENGLISH);
            int year = cal.get(Calendar.YEAR);

            LeaveEntry mainEntry = new LeaveEntry();
            mainEntry.setEmployeeId(employeeId);
            mainEntry.setLeaveType(leaveType);
            mainEntry.setHalfDay(halfDay);
            mainEntry.setFromDate(groupFromDate);
            mainEntry.setToDate(groupToDate);
            mainEntry.setNoOfDays(groupNoOfDays);
            mainEntry.setReason(reason);
            mainEntry.setFilePaths(filePaths);
            
            if ("SELF_CARE".equalsIgnoreCase(source)) {
                mainEntry.setStatus("Pending to Verify");
                mainEntry.setWhereFrom("Employee Self Care");
                mainEntry.setStatusId(resolveStatusId("Pending to Verify"));
            } else {
                mainEntry.setStatus("Pending to Verify");
                mainEntry.setWhereFrom("HR Leave Entry");
                mainEntry.setStatusId(resolveStatusId("Pending to Verify"));
            }
            mainEntry.setVerifiedBy(null);
            mainEntry.setVerifiedDate(null);
            
            LeaveEntry savedMain = leaveEntryRepo.save(mainEntry);
            savedEntries.add(savedMain);
            saveAttachments(savedMain.getId(), filePaths);
        }
        
        for (DateInfo dInfo : outsideSundays) {
            cal.setTime(dInfo.date);
            String monthName = cal.getDisplayName(Calendar.MONTH, Calendar.LONG, Locale.ENGLISH);
            int year = cal.get(Calendar.YEAR);

            LeaveEntry sunEntry = new LeaveEntry();
            sunEntry.setEmployeeId(employeeId);
            sunEntry.setLeaveType(leaveType);
            sunEntry.setHalfDay("No");
            sunEntry.setFromDate(dInfo.date);
            sunEntry.setToDate(dInfo.date);
            sunEntry.setNoOfDays(dInfo.noOfDays);
            sunEntry.setReason("Sandwich Leave (Sunday)");
            
            if ("SELF_CARE".equalsIgnoreCase(source)) {
                sunEntry.setStatus("Pending for verify");
                sunEntry.setWhereFrom("Employee Self Care");
            } else {
                sunEntry.setStatus("Pending to Verify");
                sunEntry.setWhereFrom("HR Leave Entry");
            }
            sunEntry.setVerifiedBy(null);
            sunEntry.setVerifiedDate(null);
            
            savedEntries.add(leaveEntryRepo.save(sunEntry));
        }

        // 5. Debit LeaveMaster balance
        if (!"WFH".equalsIgnoreCase(leaveType) && !"LOP".equalsIgnoreCase(leaveType) && lm != null) {
            debitLeaveMasterBalance(lm, leaveType, totalQty);
            leaveMasterRepo.save(lm);

            // 6. Log transaction
            LeaveTransaction trans = new LeaveTransaction();
            trans.setEmployeeId(employeeId);
            trans.setTransactionDate(new Date());
            trans.setTransactionType("DEBIT");
            trans.setLeaveType(leaveType);
            trans.setCrQty(BigDecimal.ZERO);
            trans.setDrQty(totalQty);
            trans.setAvlQty(getBalanceForType(lm, leaveType));
            trans.setRemarks("Leave taken: " + leaveType + " from " + sdf.get().format(fromDate) + " to " + sdf.get().format(toDate));
            leaveTransRepo.save(trans);
        }

        // Trigger QMS checklist reassignments asynchronously to avoid blocking the save response
        org.springframework.scheduling.annotation.AsyncResult.forValue(null);
        new Thread(() -> {
            try {
                checklistAutoAssignmentService.runReassignmentCheckForOpenAssignments();
            } catch (Exception ex) {
                // Log but do not fail the save operation
            }
        }).start();

        if (!"SELF_CARE".equalsIgnoreCase(source)) {
            try {
                notificationService.notifyUserAboutLeaveCreated(employeeId, leaveType, sdf.get().format(fromDate), sdf.get().format(toDate));
            } catch (Exception e) {
                // Log and ignore to prevent transaction rollback if notification fails
            }
        }

        return savedEntries;
    }

    /**
     * Deactivate a Leave Entry, restore balance, and trigger self-healing sandwich deactivations.
     */
    @Transactional
    public void deleteLeaveEntry(Long id) {
        LeaveEntry entry = leaveEntryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave Entry record not found with ID: " + id));

        if (!entry.getIsActive()) {
            return; // Already deleted
        }

        // Deactivate this entry
        entry.setIsActive(false);
        leaveEntryRepo.save(entry);

        // Credit the quantity back to LeaveMaster
        if (!"WFH".equalsIgnoreCase(entry.getLeaveType()) && !"LOP".equalsIgnoreCase(entry.getLeaveType())) {
            Long empId = entry.getEmployeeId();
            LeaveMaster lm = getOrCreateLeaveMaster(empId);

            creditLeaveMasterBalance(lm, entry.getLeaveType(), entry.getNoOfDays());
            leaveMasterRepo.save(lm);

            // Log transaction
            LeaveTransaction trans = new LeaveTransaction();
            trans.setEmployeeId(empId);
            trans.setTransactionDate(new Date());
            trans.setTransactionType("CREDIT");
            trans.setLeaveType(entry.getLeaveType());
            trans.setCrQty(entry.getNoOfDays());
            trans.setDrQty(BigDecimal.ZERO);
            trans.setAvlQty(getBalanceForType(lm, entry.getLeaveType()));
            trans.setRemarks("Cancelled leave from " + sdf.get().format(entry.getFromDate()) + " to " + sdf.get().format(entry.getToDate()));
            leaveTransRepo.save(trans);
        }

        // Trigger self-healing sandwich cleanups for Sundays
        checkAndCancelInvalidSandwichSundays(entry.getEmployeeId());

        // Trigger QMS checklist reassignments asynchronously for the employee's returning status
        new Thread(() -> {
            try {
                checklistAutoAssignmentService.runReassignmentCheckForOpenAssignments();
            } catch (Exception ex) {
                // Ignore to avoid impacting the delete transaction
            }
        }).start();
    }

    /**
     * Auto-cancel any Sunday sandwich entries that are no longer flanked by active leaves on Sat & Mon.
     */
    private void checkAndCancelInvalidSandwichSundays(Long employeeId) {
        List<LeaveEntry> activeEntries = leaveEntryRepo.findByEmployeeIdAndIsActiveTrue(employeeId);
        
        // Build set of active dates (excluding Sundays) for flanking check
        Set<String> activeNonSundays = new HashSet<>();
        List<LeaveEntry> sundaySandwiches = new ArrayList<>();
        Calendar cal = Calendar.getInstance();

        for (LeaveEntry e : activeEntries) {
            if (isLeaveEntryRejected(e)) {
                continue; // Ignore rejected leave entries
            }
            Date fromD = e.getFromDate();
            Date toD = e.getToDate();
            
            if (e.getReason() != null && e.getReason().contains("Sandwich Leave")) {
                sundaySandwiches.add(e);
            } else {
                Calendar curr = Calendar.getInstance();
                curr.setTime(fromD);
                Calendar end = Calendar.getInstance();
                end.setTime(toD);
                while (!curr.after(end)) {
                    if (curr.get(Calendar.DAY_OF_WEEK) != Calendar.SUNDAY) {
                        activeNonSundays.add(sdf.get().format(curr.getTime()));
                    }
                    curr.add(Calendar.DAY_OF_MONTH, 1);
                }
            }
        }

        // Check each Sunday sandwich entry
        for (LeaveEntry sunEntry : sundaySandwiches) {
            Date sundayDate = sunEntry.getFromDate();
            
            // Sat (Sunday - 1 day)
            cal.setTime(sundayDate);
            cal.add(Calendar.DAY_OF_MONTH, -1);
            String satStr = sdf.get().format(cal.getTime());
            
            // Mon (Sunday + 1 day)
            cal.setTime(sundayDate);
            cal.add(Calendar.DAY_OF_MONTH, 1);
            String monStr = sdf.get().format(cal.getTime());

            // If Saturday or Monday is no longer active, Sunday is not sandwiched anymore
            if (!activeNonSundays.contains(satStr) || !activeNonSundays.contains(monStr)) {
                // Deactivate this Sunday entry
                sunEntry.setIsActive(false);
                sunEntry.setReason(sunEntry.getReason() + " - Auto cancelled (sandwich broken)");
                leaveEntryRepo.save(sunEntry);

                // Restore available balance
                if (!"WFH".equalsIgnoreCase(sunEntry.getLeaveType())) {
                    LeaveMaster lm = getOrCreateLeaveMaster(employeeId);
                    if (lm != null) {
                        creditLeaveMasterBalance(lm, sunEntry.getLeaveType(), sunEntry.getNoOfDays());
                        leaveMasterRepo.save(lm);

                        // Log ledger transaction
                        LeaveTransaction trans = new LeaveTransaction();
                        trans.setEmployeeId(employeeId);
                        trans.setTransactionDate(new Date());
                        trans.setTransactionType("CREDIT");
                        trans.setLeaveType(sunEntry.getLeaveType());
                        trans.setCrQty(sunEntry.getNoOfDays());
                        trans.setDrQty(BigDecimal.ZERO);
                        trans.setAvlQty(getBalanceForType(lm, sunEntry.getLeaveType()));
                        trans.setRemarks("Sandwich broken - Auto cancelled Sunday: " + sdf.get().format(sundayDate));
                        leaveTransRepo.save(trans);
                    }
                }
            }
        }
    }

    /**
     * Compute the list of dates for the proposed leave.
     */
    private List<DateInfo> calculateProposedLeaveDates(Long employeeId, Date fromDate, Date toDate, String halfDay) {
        List<DateInfo> list = new ArrayList<>();
        
        Calendar start = Calendar.getInstance();
        start.setTime(fromDate);
        clearTimeFields(start);

        Calendar end = Calendar.getInstance();
        end.setTime(toDate);
        clearTimeFields(end);

        if (start.after(end)) {
            return list;
        }

        // Get a set of existing active leave dates (formatted as yyyy-MM-dd)
        List<LeaveEntry> activeEntries = leaveEntryRepo.findByEmployeeIdAndIsActiveTrue(employeeId);
        Set<String> allActiveLeaveDates = new HashSet<>();
        for (LeaveEntry e : activeEntries) {
            if (isLeaveEntryRejected(e)) {
                continue; // Ignore rejected leave entries
            }
            Date fromD = e.getFromDate();
            Date toD = e.getToDate();
            Calendar curr = Calendar.getInstance();
            curr.setTime(fromD);
            Calendar entryEnd = Calendar.getInstance();
            entryEnd.setTime(toD);
            while (!curr.after(entryEnd)) {
                allActiveLeaveDates.add(sdf.get().format(curr.getTime()));
                curr.add(Calendar.DAY_OF_MONTH, 1);
            }
        }

        // Collect all non-Sunday proposed dates in the range
        List<Date> requestedNonSundays = new ArrayList<>();
        Set<String> requestDatesSet = new HashSet<>();
        Calendar current = (Calendar) start.clone();
        
        while (!current.after(end)) {
            if (current.get(Calendar.DAY_OF_WEEK) != Calendar.SUNDAY) {
                Date d = current.getTime();
                requestedNonSundays.add(d);
                requestDatesSet.add(sdf.get().format(d));
            }
            current.add(Calendar.DAY_OF_MONTH, 1);
        }

        // If range was just Sundays (unlikely, but possible), requestedNonSundays is empty
        // Combined leave date lookup (DB + current request)
        Set<String> combinedLeaveDates = new HashSet<>(allActiveLeaveDates);
        combinedLeaveDates.addAll(requestDatesSet);

        // Fetch sandwich preference
        Optional<AppPreference> prefOpt = preferenceRepo.findByPrefName("SANDWICH_LEAVE");
        boolean isSandwichEnabled = prefOpt.isPresent() && "yes".equalsIgnoreCase(prefOpt.get().getPrefValue());

        // Process requested non-Sunday dates
        boolean isHalfDay = "yes".equalsIgnoreCase(halfDay) || "morning".equalsIgnoreCase(halfDay) || "afternoon".equalsIgnoreCase(halfDay) || "evening".equalsIgnoreCase(halfDay);
        BigDecimal regularNoOfDays = isHalfDay ? new BigDecimal("0.5") : BigDecimal.ONE;

        for (Date d : requestedNonSundays) {
            list.add(new DateInfo(d, regularNoOfDays, false));
        }

        // Find and process sandwiched Sundays
        if (isSandwichEnabled) {
            // Sundays can lie in range [fromDate - 1 day, toDate + 1 day]
            Calendar rangeStart = (Calendar) start.clone();
            rangeStart.add(Calendar.DAY_OF_MONTH, -1);
            
            Calendar rangeEnd = (Calendar) end.clone();
            rangeEnd.add(Calendar.DAY_OF_MONTH, 1);

            Calendar checkCal = (Calendar) rangeStart.clone();
            while (!checkCal.after(rangeEnd)) {
                if (checkCal.get(Calendar.DAY_OF_WEEK) == Calendar.SUNDAY) {
                    Date sunday = checkCal.getTime();
                    
                    // Check Saturday (Sunday - 1 day) and Monday (Sunday + 1 day)
                    Calendar satCal = (Calendar) checkCal.clone();
                    satCal.add(Calendar.DAY_OF_MONTH, -1);
                    String satStr = sdf.get().format(satCal.getTime());

                    Calendar monCal = (Calendar) checkCal.clone();
                    monCal.add(Calendar.DAY_OF_MONTH, 1);
                    String monStr = sdf.get().format(monCal.getTime());

                    if (combinedLeaveDates.contains(satStr) && combinedLeaveDates.contains(monStr)) {
                        // Sandwich Sunday is active!
                        // Ensure we don't duplicate Sunday if it's already an active leave entry
                        if (!allActiveLeaveDates.contains(sdf.get().format(sunday))) {
                            list.add(new DateInfo(sunday, BigDecimal.ONE, true));
                        }
                    }
                }
                checkCal.add(Calendar.DAY_OF_MONTH, 1);
            }
        }

        // Sort by date chronologically
        list.sort(Comparator.comparing(d -> d.date));
        return list;
    }

    public void creditBackBalance(LeaveEntry entry) {
        if ("WFH".equalsIgnoreCase(entry.getLeaveType())) {
            return;
        }
        Long empId = entry.getEmployeeId();
        LeaveMaster lm = getOrCreateLeaveMaster(empId);
        creditLeaveMasterBalance(lm, entry.getLeaveType(), entry.getNoOfDays());
        leaveMasterRepo.save(lm);

        // Log transaction
        LeaveTransaction trans = new LeaveTransaction();
        trans.setEmployeeId(empId);
        trans.setTransactionDate(new Date());
        trans.setTransactionType("CREDIT");
        trans.setLeaveType(entry.getLeaveType());
        trans.setCrQty(entry.getNoOfDays());
        trans.setDrQty(BigDecimal.ZERO);
        trans.setAvlQty(getBalanceForType(lm, entry.getLeaveType()));
        trans.setRemarks("Rejected leave from " + sdf.get().format(entry.getFromDate()) + " to " + sdf.get().format(entry.getToDate()));
        leaveTransRepo.save(trans);
    }

    private void clearTimeFields(Calendar cal) {
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
    }

    private BigDecimal getBalanceForType(LeaveMaster lm, String leaveType) {
        switch (leaveType.toUpperCase()) {
            case "EL": return lm.getEl();
            case "CL": return lm.getCl();
            case "SL": return lm.getSl();
            case "AL": return lm.getAl();
            case "PL": return lm.getPl();
            case "LOP": return BigDecimal.ZERO;
            default: throw new RuntimeException("Unknown leave type: " + leaveType);
        }
    }

    private void debitLeaveMasterBalance(LeaveMaster lm, String leaveType, BigDecimal qty) {
        switch (leaveType.toUpperCase()) {
            case "EL": lm.setEl(lm.getEl().subtract(qty)); break;
            case "CL": lm.setCl(lm.getCl().subtract(qty)); break;
            case "SL": lm.setSl(lm.getSl().subtract(qty)); break;
            case "AL": lm.setAl(lm.getAl().subtract(qty)); break;
            case "PL": lm.setPl(lm.getPl().subtract(qty)); break;
            case "LOP": break; // Loss of Pay does not affect leave balances
            default: throw new RuntimeException("Unknown leave type: " + leaveType);
        }
    }

    private void creditLeaveMasterBalance(LeaveMaster lm, String leaveType, BigDecimal qty) {
        switch (leaveType.toUpperCase()) {
            case "EL": lm.setEl(lm.getEl().add(qty)); break;
            case "CL": lm.setCl(lm.getCl().add(qty)); break;
            case "SL": lm.setSl(lm.getSl().add(qty)); break;
            case "AL": lm.setAl(lm.getAl().add(qty)); break;
            case "PL": lm.setPl(lm.getPl().add(qty)); break;
            case "LOP": break; // Loss of Pay does not affect leave balances
            default: throw new RuntimeException("Unknown leave type: " + leaveType);
        }
    }

    private static class DateInfo {
        Date date;
        BigDecimal noOfDays;
        boolean isSandwichSunday;

        DateInfo(Date date, BigDecimal noOfDays, boolean isSandwichSunday) {
            this.date = date;
            this.noOfDays = noOfDays;
            this.isSandwichSunday = isSandwichSunday;
        }
    }

    public List<Long> getEmployeeIdsOnLeave(Date date) {
        if (date == null) return Collections.emptyList();
        return leaveEntryRepo.findEmployeeIdsOnLeaveOnDate(date);
    }

    private void saveAttachments(Long leaveEntryId, String filePaths) {
        attachmentRepo.deleteByPageCodeAndRefIdAndDocType("M2390", leaveEntryId, "LEAVE_ENTRY_ATTACHMENT");
        if (filePaths != null && !filePaths.trim().isEmpty()) {
            String currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            if (currentUser == null) currentUser = "SYSTEM";
            List<String> paths = AttachmentUtil.parseFileList(filePaths);
            for (String filePath : paths) {
                if (filePath.trim().isEmpty()) continue;
                com.autonoma.erp.modules.induction.entity.HrAttachmentPath path = new com.autonoma.erp.modules.induction.entity.HrAttachmentPath();
                path.setPageCode("M2390");
                path.setRefId(leaveEntryId);
                path.setDocType("LEAVE_ENTRY_ATTACHMENT");
                path.setPath(filePath.trim());
                String fileName = filePath.trim();
                if (fileName.contains("/")) {
                    fileName = fileName.substring(fileName.lastIndexOf("/") + 1);
                }
                path.setFileName(fileName);
                path.setCreatedBy(currentUser);
                path.setCreatedDate(new Date());
                attachmentRepo.save(path);
            }
        }
    }

    private LeaveMaster getOrCreateLeaveMaster(Long employeeId) {
        return leaveMasterRepo.findByEmployeeIdAndStatus(employeeId, true)
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
                    return leaveMasterRepo.save(newLm);
                });
    }
}
