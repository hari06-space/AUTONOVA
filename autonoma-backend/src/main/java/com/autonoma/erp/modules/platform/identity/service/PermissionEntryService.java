package com.autonoma.erp.modules.platform.identity.service;

import com.autonoma.erp.modules.platform.identity.entity.PermissionEntry;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.platform.identity.repository.PermissionEntryRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.modules.platform.notification.entity.AppNotification;
import com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository;
import com.autonoma.erp.service.admin.AuditTrailService;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;

@Service
public class PermissionEntryService {

    @Autowired
    private PermissionEntryRepository permissionEntryRepo;

    @Autowired
    private EmployeeMasterRepository employeeRepo;

    @Autowired
    private EmployeeManagerMappingRepository employeeManagerMappingRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private AppNotificationRepository appNotificationRepo;

    @Autowired
    private AuditTrailService auditTrailService;

    @Autowired
    private com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository statusMasterRepo;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private com.autonoma.erp.modules.hr.leave.repository.LeaveEntryRepository leaveEntryRepo;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private com.autonoma.erp.repository.OdEntryRepository odEntryRepo;

    @Autowired(required = false)
    private com.autonoma.erp.repository.admin.AppPreferenceRepository appPreferenceRepo;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private com.autonoma.erp.service.admin.BosUserPageAuthService authService;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository jobProfileRepo;

    private Long resolveStatusId(String statusName, Long defaultId) {
        if (statusName == null || statusName.isBlank()) return defaultId;
        return statusMasterRepo.findByNameIgnoreCase(statusName.trim())
                .map(com.autonoma.erp.modules.platform.common.entity.StatusMaster::getId)
                .orElse(defaultId);
    }

    public Long getCurrentEmployeeId() {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            return 0L;
        }
        return userRepo.findByUserId(currentUserId)
                .map(UserCredential::getEmpId)
                .orElse(0L);
    }

    public List<PermissionEntry> getFilteredEntries(String scope) {
        if (scope == null || scope.trim().isEmpty()) {
            scope = "Mine";
        }

        Long currentEmployeeId = getCurrentEmployeeId();

        if ("Mine".equalsIgnoreCase(scope)) {
            if (currentEmployeeId == null || currentEmployeeId == 0L) {
                return permissionEntryRepo.findAllByOrderByPermissionDateDesc();
            }
            return permissionEntryRepo.findByEmployeeIdOrderByPermissionDateDesc(currentEmployeeId)
                    .stream()
                    .filter(e -> !("Manager Request".equalsIgnoreCase(e.getRequestType()) && "Pending for Verify".equalsIgnoreCase(e.getStatus())))
                    .collect(Collectors.toList());
        } else if ("My Team".equalsIgnoreCase(scope)) {
            if (currentEmployeeId == null || currentEmployeeId == 0L) {
                return permissionEntryRepo.findAllByOrderByPermissionDateDesc();
            }
            List<Long> teamMemberIds = employeeManagerMappingRepo.findReporteeEmpIdsByManagerId(currentEmployeeId);
            if (teamMemberIds.isEmpty()) {
                return permissionEntryRepo.findAllByOrderByPermissionDateDesc();
            }
            return permissionEntryRepo.findByEmployeeIdInOrderByPermissionDateDesc(teamMemberIds);
        } else if ("My Company".equalsIgnoreCase(scope)) {
            return permissionEntryRepo.findAllByOrderByPermissionDateDesc();
        } else {
            return permissionEntryRepo.findAllByOrderByPermissionDateDesc();
        }
    }

    public List<PermissionEntry> getAllPermissionEntries() {
        return permissionEntryRepo.findAllByOrderByPermissionDateDesc();
    }

    public PermissionEntry getPermissionEntryById(Long id) {
        return permissionEntryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission entry not found with ID: " + id));
    }

    @Transactional
    public PermissionEntry savePermissionEntry(PermissionEntry entry) {
        // Fetch employee to ensure they exist and set their name
        EmployeeMaster emp = employeeRepo.findById(entry.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + entry.getEmployeeId()));
        entry.setEmployeeName(emp.getEmployeeName());
        entry.setEmployeeCode(emp.getEmpCode());

        if (jobProfileRepo != null) {
            var jobProfileOpt = jobProfileRepo.findByEmployeeId(entry.getEmployeeId());
            if (jobProfileOpt.isPresent()) {
                String permAllowed = jobProfileOpt.get().getPermissionRequest();
                if ("NO".equalsIgnoreCase(permAllowed) || "false".equalsIgnoreCase(permAllowed)) {
                    throw new RuntimeException("Permission application is disabled for this employee in Employee Master.");
                }
            }
        }

        Long currentEmployeeId = getCurrentEmployeeId();
        if (entry.getEmployeeId() != null && entry.getEmployeeId().equals(currentEmployeeId)) {
            entry.setRequestType("Self Request");
        } else {
            entry.setRequestType("Manager Request");
        }

        if (entry.getWhereFrom() == null || entry.getWhereFrom().isBlank() || "HR Permission Details".equalsIgnoreCase(entry.getWhereFrom())) {
            entry.setWhereFrom("Self Request".equals(entry.getRequestType()) ? "Employee Self Care" : "HRA Module");
        }

        if (entry.getStatusId() == null) {
            entry.setStatusId(resolveStatusId("PENDING FOR VERIFY", 10022L));
        }

        if (entry.getPermissionDate() != null) {
            java.util.Calendar cal = java.util.Calendar.getInstance();
            cal.setTime(entry.getPermissionDate());
            entry.setMonth(new java.text.SimpleDateFormat("MMMM").format(entry.getPermissionDate()));
            entry.setYear(cal.get(java.util.Calendar.YEAR));

            boolean isSelfCareRequest = "Self Request".equalsIgnoreCase(entry.getRequestType())
                || "Employee Self Care".equalsIgnoreCase(entry.getWhereFrom())
                || "Employee Self Care".equalsIgnoreCase(entry.getFromWhere());

            if (isSelfCareRequest) {
                java.util.Calendar today = java.util.Calendar.getInstance();
                today.set(java.util.Calendar.HOUR_OF_DAY, 0);
                today.set(java.util.Calendar.MINUTE, 0);
                today.set(java.util.Calendar.SECOND, 0);
                today.set(java.util.Calendar.MILLISECOND, 0);

                java.util.Calendar permCal = java.util.Calendar.getInstance();
                permCal.setTime(entry.getPermissionDate());
                permCal.set(java.util.Calendar.HOUR_OF_DAY, 0);
                permCal.set(java.util.Calendar.MINUTE, 0);
                permCal.set(java.util.Calendar.SECOND, 0);
                permCal.set(java.util.Calendar.MILLISECOND, 0);

                if (permCal.before(today)) {
                    throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "Past dates are not allowed. Please select today or a future date."
                    );
                }
            }
        }

        // Explicitly set audit fields so NOT NULL constraint is never violated
        // even if @PrePersist SecurityUtils call fails in JPA context
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            throw new RuntimeException("No authenticated user session found. Cannot save Permission Entry.");
        }
        if (entry.getId() == null) {
            // New record — set created fields
            entry.setCreatedBy(currentUserId);
            entry.setCreatedDate(new Date());
        }
        entry.setUpdatedBy(currentUserId);
        entry.setUpdatedDate(new Date());

        // Calculate actual and considered durations based on FromTime and ToTime
        calculateDurations(entry);

        // Validate constraints
        validateConstraints(entry);

        PermissionEntry savedEntry = permissionEntryRepo.save(entry);

        return savedEntry;
    }

    @Transactional
    public PermissionEntry updatePermissionEntry(Long id, PermissionEntry updatedEntry) {
        PermissionEntry existing = permissionEntryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission entry not found with ID: " + id));

        // Lock verified or completed entries
        String existingStatus = existing.getStatus() != null ? existing.getStatus().toUpperCase() : "";
        if (existingStatus.contains("VERIFIED") || 
            existingStatus.contains("APPROVED") || 
            existingStatus.contains("ACCEPTED") || 
            existingStatus.contains("REJECT") || 
            existingStatus.contains("CANCEL")) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST,
                "Verified or finalized permission requests cannot be modified."
            );
        }

        // Fetch employee to ensure they exist and update employee details
        EmployeeMaster emp = employeeRepo.findById(updatedEntry.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + updatedEntry.getEmployeeId()));
        
        existing.setEmployeeId(updatedEntry.getEmployeeId());
        existing.setEmployeeName(emp.getEmployeeName());
        existing.setEmployeeCode(emp.getEmpCode());
        existing.setPermissionDate(updatedEntry.getPermissionDate());
        existing.setFromTime(updatedEntry.getFromTime());
        existing.setToTime(updatedEntry.getToTime());
        existing.setReason(updatedEntry.getReason());

        Long currentEmployeeId = getCurrentEmployeeId();
        if (existing.getEmployeeId() != null && existing.getEmployeeId().equals(currentEmployeeId)) {
            existing.setRequestType("Self Request");
        } else {
            existing.setRequestType("Manager Request");
        }
        
        // Editable parameter: status
        if (updatedEntry.getStatusId() != null) {
            existing.setStatusId(updatedEntry.getStatusId());
        } else if (updatedEntry.getStatus() != null && !updatedEntry.getStatus().trim().isEmpty()) {
            existing.setStatusId(resolveStatusId(updatedEntry.getStatus(), 10022L));
        }

        if (updatedEntry.getRejectionReason() != null) {
            existing.setRejectionReason(updatedEntry.getRejectionReason());
        }

        // Calculate actual and considered durations based on FromTime and ToTime
        calculateDurations(existing);

        // Validate constraints (with exclusion of current record ID)
        validateConstraints(existing);

        PermissionEntry savedEntry = permissionEntryRepo.save(existing);

        return savedEntry;
    }

    @Transactional
    public void cancelPermissionEntry(Long id) {
        PermissionEntry entry = permissionEntryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission entry not found with ID: " + id));

        if ("Accepted".equalsIgnoreCase(entry.getStatus()) || 
            "Approved".equalsIgnoreCase(entry.getStatus()) || 
            "Rejected".equalsIgnoreCase(entry.getStatus()) || 
            "Cancelled".equalsIgnoreCase(entry.getStatus())) {
            throw new RuntimeException("Cannot cancel a completed permission request.");
        }

        entry.setStatusId(resolveStatusId("CANCELLED", 5L));
        permissionEntryRepo.save(entry);

    }

    @Transactional
    public PermissionEntry approveEntry(Long id) {
        PermissionEntry entry = permissionEntryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission entry not found with ID: " + id));

        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new RuntimeException("No authenticated user session found.");
        }

        // Lock completed entries
        if ("Approved".equalsIgnoreCase(entry.getStatus()) || 
            "Accepted".equalsIgnoreCase(entry.getStatus()) || 
            "Rejected".equalsIgnoreCase(entry.getStatus()) || 
            "Cancelled".equalsIgnoreCase(entry.getStatus())) {
            throw new RuntimeException("Cannot approve a completed permission request.");
        }

        // Update fields
        entry.setStatusId(resolveStatusId("VERIFIED", 10009L));
        entry.setVerifiedBy(currentUserId);
        entry.setVerifiedDate(new Date());
        
        PermissionEntry savedEntry = permissionEntryRepo.save(entry);

        // Notify employee
        try {
            AppNotification notif = new AppNotification();
            notif.setRecipientEmpId(savedEntry.getEmployeeId());
            notif.setTitle("Permission Request Approved");
            notif.setMessage("Your permission request has been approved.");
            notif.setLinkUrl("/hra/attendance/permission-entry");
            appNotificationRepo.save(notif);
        } catch (Exception e) {
            System.err.println("Failed to send approval notification: " + e.getMessage());
        }

        // Audit Trail
        try {
            auditTrailService.saveAuditTrailAsync(
                    "Approved",
                    "HR_PERMISSION_DETAILS",
                    savedEntry.getId().toString(),
                    "Pending for Verify",
                    "Approved",
                    "Permission request approved",
                    currentUserId,
                    "Permission Verification"
            );
        } catch (Exception e) {
            System.err.println("Failed to write approval audit log: " + e.getMessage());
        }



        return savedEntry;
    }

    @Transactional
    public PermissionEntry rejectEntry(Long id, String comments) {
        if (comments == null || comments.trim().isEmpty()) {
            throw new RuntimeException("Rejection reason is mandatory.");
        }

        PermissionEntry entry = permissionEntryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission entry not found with ID: " + id));

        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new RuntimeException("No authenticated user session found.");
        }

        // Lock completed entries
        if ("Approved".equalsIgnoreCase(entry.getStatus()) || 
            "Accepted".equalsIgnoreCase(entry.getStatus()) || 
            "Rejected".equalsIgnoreCase(entry.getStatus()) || 
            "Cancelled".equalsIgnoreCase(entry.getStatus())) {
            throw new RuntimeException("Cannot reject a completed permission request.");
        }

        // Update fields
        Long rejStatusId = resolveStatusId("REJECTED", 9L);
        entry.setStatusId(rejStatusId);
        if (rejStatusId != null) {
            statusMasterRepo.findById(rejStatusId).ifPresent(entry::setStatusMaster);
        }
        entry.setRejectionComment(comments);
        entry.setRejectionReason(comments); // keep rejectionReason in sync as well
        entry.setVerifiedBy(currentUserId);
        entry.setVerifiedDate(new Date());

        PermissionEntry savedEntry = permissionEntryRepo.save(entry);

        // Notify employee
        try {
            AppNotification notif = new AppNotification();
            notif.setRecipientEmpId(savedEntry.getEmployeeId());
            notif.setTitle("Permission Request Rejected");
            notif.setMessage("Your permission request has been rejected.");
            notif.setLinkUrl("/hra/attendance/permission-entry");
            appNotificationRepo.save(notif);
        } catch (Exception e) {
            System.err.println("Failed to send rejection notification: " + e.getMessage());
        }

        // Audit Trail
        try {
            auditTrailService.saveAuditTrailAsync(
                    "Rejected",
                    "HR_PERMISSION_DETAILS",
                    savedEntry.getId().toString(),
                    "Pending for Verify",
                    "Rejected",
                    comments,
                    currentUserId,
                    "Permission Verification"
            );
        } catch (Exception e) {
            System.err.println("Failed to write rejection audit log: " + e.getMessage());
        }



        return savedEntry;
    }

    private int parseTimeToMinutes(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) {
            throw new RuntimeException("Time is required.");
        }
        String clean = timeStr.trim().toUpperCase();
        boolean isPm = clean.contains("PM");
        boolean isAm = clean.contains("AM");
        
        String timePart = clean.replace("AM", "").replace("PM", "").trim();
        String[] parts = timePart.split(":");
        int h = Integer.parseInt(parts[0].trim());
        int m = Integer.parseInt(parts[1].trim());
        
        if (isAm || isPm) {
            if (h == 12) {
                h = 0;
            }
            if (isPm) {
                h += 12;
            }
        }
        return h * 60 + m;
    }

    private void calculateDurations(PermissionEntry entry) {
        if (entry.getFromTime() == null || entry.getFromTime().trim().isEmpty() ||
            entry.getToTime() == null || entry.getToTime().trim().isEmpty()) {
            throw new RuntimeException("From Time and To Time are required.");
        }

        try {
            int fromMin = parseTimeToMinutes(entry.getFromTime());
            int toMin = parseTimeToMinutes(entry.getToTime());
            
            int diffMin = toMin - fromMin;
            if (diffMin <= 0) {
                throw new RuntimeException("To Time must be after From Time.");
            }

            double actualHours = diffMin / 60.0;
            String actualDuration;
            
            if (diffMin < 60) {
                actualDuration = diffMin + " Mins";
            } else {
                long hours = Math.round(actualHours);
                actualDuration = hours + " Hour" + (hours > 1 ? "s" : "");
            }

            // Use actual hours as considered hours
            double consideredHours = actualHours;

            entry.setActualDuration(actualDuration);
            entry.setConsideredDuration(BigDecimal.valueOf(consideredHours));
        } catch (Exception e) {
            if (e instanceof RuntimeException) {
                throw (RuntimeException) e;
            }
            throw new RuntimeException("Invalid time format. Expected 'HH:mm' or 'hh:mm AM/PM'.");
        }
    }

    private void validateConstraints(PermissionEntry entry) {
        if (entry.getPermissionDate() == null) {
            throw new RuntimeException("Permission Date is required.");
        }

        Calendar cal = Calendar.getInstance();
        cal.setTime(entry.getPermissionDate());
        int year = cal.get(Calendar.YEAR);
        String month = new java.text.SimpleDateFormat("MMMM", Locale.ENGLISH).format(entry.getPermissionDate());

        entry.setMonth(month);
        entry.setYear(year);

        // Standard 3-day backdated rule: Users can apply up to 3 days back. Beyond 3 days requires ADD1 permission. Present and future dates are allowed.
        Calendar cutoff = Calendar.getInstance();
        cutoff.set(Calendar.HOUR_OF_DAY, 0);
        cutoff.set(Calendar.MINUTE, 0);
        cutoff.set(Calendar.SECOND, 0);
        cutoff.set(Calendar.MILLISECOND, 0);
        cutoff.add(Calendar.DAY_OF_MONTH, -3);

        Calendar permCal = Calendar.getInstance();
        permCal.setTime(entry.getPermissionDate());
        permCal.set(Calendar.HOUR_OF_DAY, 0);
        permCal.set(Calendar.MINUTE, 0);
        permCal.set(Calendar.SECOND, 0);
        permCal.set(Calendar.MILLISECOND, 0);

        if (permCal.before(cutoff)) {
            String currentUserId = SecurityUtils.getCurrentUserId();
            boolean isAdmin = false;
            if (currentUserId == null || "SYSTEM".equals(currentUserId)) {
                isAdmin = true;
            } else if (authService != null) {
                isAdmin = authService.hasPermission(currentUserId, "M2390", "additional1")
                        || authService.hasPermission(currentUserId, "HA1390", "additional1");
            }
            if (!isAdmin) {
                throw new RuntimeException("Permission application date cannot be more than 3 days in the past.");
            }
        }

        // Fetch records in that calendar month and year (excluding current entry if editing)
        List<PermissionEntry> existingList;
        if (entry.getId() == null) {
            existingList = permissionEntryRepo.findByEmployeeIdAndYearAndMonthAndIsActiveTrue(
                    entry.getEmployeeId(), year, month);
        } else {
            existingList = permissionEntryRepo.findByEmployeeIdAndYearAndMonthAndIsActiveTrueAndIdNot(
                    entry.getEmployeeId(), year, month, entry.getId());
        }

        // 1. Frequency Check: Max active permission requests per month (configurable via PERMISSION_MAX_REQUESTS_MONTH)
        int maxRequests = 2;
        int maxMinutes = 120;
        try {
            if (appPreferenceRepo != null) {
                var reqPref = appPreferenceRepo.findByPrefName("PERMISSION_MAX_REQUESTS_MONTH");
                if (reqPref.isPresent() && reqPref.get().getPrefValue() != null && !reqPref.get().getPrefValue().trim().isEmpty()) {
                    maxRequests = Integer.parseInt(reqPref.get().getPrefValue().trim());
                }
                var minPref = appPreferenceRepo.findByPrefName("PERMISSION_MAX_MINUTES_MONTH");
                if (minPref.isPresent() && minPref.get().getPrefValue() != null && !minPref.get().getPrefValue().trim().isEmpty()) {
                    maxMinutes = Integer.parseInt(minPref.get().getPrefValue().trim());
                }
            }
        } catch (Exception e) { /* use defaults */ }

        BigDecimal maxHours = BigDecimal.valueOf(maxMinutes).divide(BigDecimal.valueOf(60), 2, java.math.RoundingMode.HALF_UP);

        long activeCount = existingList.stream()
                .filter(p -> !"Cancelled".equalsIgnoreCase(p.getStatus()) && !"Rejected".equalsIgnoreCase(p.getStatus()))
                .count();

        // 2. Duration Check: Max cumulative ConsideredDuration (configurable via PERMISSION_MAX_MINUTES_MONTH)
        BigDecimal existingConsidered = BigDecimal.ZERO;
        for (PermissionEntry p : existingList) {
            if (!"Cancelled".equalsIgnoreCase(p.getStatus()) && !"Rejected".equalsIgnoreCase(p.getStatus())) {
                existingConsidered = existingConsidered.add(p.getConsideredDuration());
            }
        }
        BigDecimal totalConsidered = existingConsidered.add(entry.getConsideredDuration());

        // Check both limits and provide specific error messages
        if (activeCount >= maxRequests && totalConsidered.compareTo(maxHours) > 0) {
            throw new RuntimeException("You have exhausted your monthly permission quota.");
        }
        if (activeCount >= maxRequests) {
            throw new RuntimeException("Maximum " + maxRequests + " permission requests allowed per month.");
        }
        if (totalConsidered.compareTo(maxHours) > 0) {
            throw new RuntimeException("Monthly permission hour limit exceeded. Maximum " + maxMinutes + " minutes (" + maxHours.toPlainString() + " hours) allowed per month.");
        }


        // 3. Chronological Overlap Check on the same date for active permissions
        List<PermissionEntry> sameDateEntries = permissionEntryRepo.findByEmployeeIdAndPermissionDate(
                entry.getEmployeeId(), entry.getPermissionDate());
        
        int newFrom = parseTimeToMinutes(entry.getFromTime());
        int newTo = parseTimeToMinutes(entry.getToTime());

        for (PermissionEntry p : sameDateEntries) {
            if (entry.getId() != null && entry.getId().equals(p.getId())) {
                continue;
            }
            if ("Cancelled".equalsIgnoreCase(p.getStatus()) || "Rejected".equalsIgnoreCase(p.getStatus())) {
                continue;
            }
            int existingFrom = parseTimeToMinutes(p.getFromTime());
            int existingTo = parseTimeToMinutes(p.getToTime());
            if (newFrom < existingTo && newTo > existingFrom) {
                throw new RuntimeException("Overlap detected: A permission already exists for this time slot.");
            }
        }

        com.autonoma.erp.util.AttendanceOccupancyUtil.DayOccupancy reqPermOcc = com.autonoma.erp.util.AttendanceOccupancyUtil.getPermissionOccupancy(entry.getFromTime(), entry.getToTime());

        // 4. Cross-module validation: Check active Leave entries for the same employee (with Half-Day compatibility)
        if (leaveEntryRepo != null && entry.getEmployeeId() != null && entry.getPermissionDate() != null) {
            Calendar pCal = Calendar.getInstance();
            pCal.setTime(entry.getPermissionDate());
            pCal.set(Calendar.HOUR_OF_DAY, 0);
            pCal.set(Calendar.MINUTE, 0);
            pCal.set(Calendar.SECOND, 0);
            pCal.set(Calendar.MILLISECOND, 0);
            Date cleanPDate = pCal.getTime();

            List<com.autonoma.erp.modules.hr.leave.entity.LeaveEntry> leaves = leaveEntryRepo.findByEmployeeIdAndIsActiveTrue(entry.getEmployeeId());
            if (leaves != null && !leaves.isEmpty()) {
                java.text.SimpleDateFormat dFmt = new java.text.SimpleDateFormat("dd-MMM-yyyy");
                for (com.autonoma.erp.modules.hr.leave.entity.LeaveEntry l : leaves) {
                    String st = l.getStatus() != null ? l.getStatus().trim() : "";
                    if (st.equalsIgnoreCase("Rejected") || st.equalsIgnoreCase("Reject") || st.equalsIgnoreCase("Cancelled") || (l.getRejectReason() != null && !l.getRejectReason().isBlank())) {
                        continue;
                    }
                    if (l.getFromDate() != null && l.getToDate() != null) {
                        Calendar lStart = Calendar.getInstance();
                        lStart.setTime(l.getFromDate());
                        lStart.set(Calendar.HOUR_OF_DAY, 0);
                        lStart.set(Calendar.MINUTE, 0);
                        lStart.set(Calendar.SECOND, 0);
                        lStart.set(Calendar.MILLISECOND, 0);

                        Calendar lEnd = Calendar.getInstance();
                        lEnd.setTime(l.getToDate());
                        lEnd.set(Calendar.HOUR_OF_DAY, 23);
                        lEnd.set(Calendar.MINUTE, 59);
                        lEnd.set(Calendar.SECOND, 59);
                        lEnd.set(Calendar.MILLISECOND, 999);

                        if (!cleanPDate.before(lStart.getTime()) && !cleanPDate.after(lEnd.getTime())) {
                            com.autonoma.erp.util.AttendanceOccupancyUtil.DayOccupancy exLeaveOcc = com.autonoma.erp.util.AttendanceOccupancyUtil.getLeaveOccupancy(l.getHalfDay());
                            if (com.autonoma.erp.util.AttendanceOccupancyUtil.checkOccupancyConflict(exLeaveOcc, reqPermOcc)) {
                                String clashDate = dFmt.format(cleanPDate);
                                throw new RuntimeException("An active Leave application (" + exLeaveOcc.getLabel() + ") already exists on " + clashDate + ". Cannot apply for Permission (" + reqPermOcc.getLabel() + ") on the same half-day.");
                            }
                        }
                    }
                }
            }
        }

        // 5. Cross-module validation: Check active OD entries for the same employee (with Half-Day compatibility)
        if (odEntryRepo != null && entry.getEmployeeId() != null && entry.getPermissionDate() != null) {
            Calendar pCal = Calendar.getInstance();
            pCal.setTime(entry.getPermissionDate());
            pCal.set(Calendar.HOUR_OF_DAY, 0);
            pCal.set(Calendar.MINUTE, 0);
            pCal.set(Calendar.SECOND, 0);
            pCal.set(Calendar.MILLISECOND, 0);
            Date cleanPDate = pCal.getTime();

            List<com.autonoma.erp.model.OdEntry> ods = odEntryRepo.findByEmployeeId(entry.getEmployeeId());
            if (ods != null && !ods.isEmpty()) {
                java.text.SimpleDateFormat dFmt = new java.text.SimpleDateFormat("dd-MMM-yyyy");
                for (com.autonoma.erp.model.OdEntry od : ods) {
                    String st = od.getStatus() != null ? od.getStatus().trim() : "";
                    if (st.equalsIgnoreCase("Rejected") || st.equalsIgnoreCase("Reject") || st.equalsIgnoreCase("Cancelled")) {
                        continue;
                    }
                    if (od.getOdFromDateTime() != null && od.getOdToDateTime() != null) {
                        Calendar odStart = Calendar.getInstance();
                        odStart.setTime(od.getOdFromDateTime());
                        odStart.set(Calendar.HOUR_OF_DAY, 0);
                        odStart.set(Calendar.MINUTE, 0);
                        odStart.set(Calendar.SECOND, 0);
                        odStart.set(Calendar.MILLISECOND, 0);

                        Calendar odEnd = Calendar.getInstance();
                        odEnd.setTime(od.getOdToDateTime());
                        odEnd.set(Calendar.HOUR_OF_DAY, 23);
                        odEnd.set(Calendar.MINUTE, 59);
                        odEnd.set(Calendar.SECOND, 59);
                        odEnd.set(Calendar.MILLISECOND, 999);

                        if (!cleanPDate.before(odStart.getTime()) && !cleanPDate.after(odEnd.getTime())) {
                            com.autonoma.erp.util.AttendanceOccupancyUtil.DayOccupancy exOdOcc = com.autonoma.erp.util.AttendanceOccupancyUtil.getOdOccupancy(od.getOdFromDateTime(), od.getOdToDateTime());
                            if (com.autonoma.erp.util.AttendanceOccupancyUtil.checkOccupancyConflict(exOdOcc, reqPermOcc)) {
                                String clashDate = dFmt.format(cleanPDate);
                                throw new RuntimeException("An active On Duty (OD) application (" + exOdOcc.getLabel() + ") already exists on " + clashDate + ". Cannot apply for Permission (" + reqPermOcc.getLabel() + ") on the same half-day.");
                            }
                        }
                    }
                }
            }
        }
    }

    private boolean isRejectedOrCancelled(PermissionEntry p) {
        if (p == null) return false;
        String statusName = p.getStatus();
        if (statusName != null && !statusName.trim().isEmpty()) {
            String lower = statusName.toLowerCase().trim();
            if (lower.contains("reject") || lower.contains("cancel")) {
                return true;
            }
        }
        if (p.getStatusMaster() != null && p.getStatusMaster().getName() != null) {
            String lower = p.getStatusMaster().getName().toLowerCase().trim();
            if (lower.contains("reject") || lower.contains("cancel")) {
                return true;
            }
        }
        if (p.getStatusId() != null) {
            Long sId = p.getStatusId();
            StatusMaster sm = statusMasterRepo.findById(sId).orElse(null);
            if (sm != null && sm.getName() != null) {
                String lower = sm.getName().toLowerCase().trim();
                if (lower.contains("reject") || lower.contains("cancel")) {
                    return true;
                }
            }
        }
        if (p.getRejectionReason() != null && !p.getRejectionReason().trim().isEmpty()) {
            return true;
        }
        if (p.getRejectionComment() != null && !p.getRejectionComment().trim().isEmpty()) {
            return true;
        }
        return false;
    }

    public double getConsumedDuration(Long employeeId, Date date, Long excludeId) {
        if (employeeId == null || date == null) {
            return 0.0;
        }
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        int year = cal.get(Calendar.YEAR);
        String month = new java.text.SimpleDateFormat("MMMM", Locale.ENGLISH).format(date);

        List<PermissionEntry> existingList;
        if (excludeId == null) {
            existingList = permissionEntryRepo.findByEmployeeIdAndYearAndMonthAndIsActiveTrue(
                    employeeId, year, month);
        } else {
            existingList = permissionEntryRepo.findByEmployeeIdAndYearAndMonthAndIsActiveTrueAndIdNot(
                    employeeId, year, month, excludeId);
        }

        double total = 0.0;
        for (PermissionEntry p : existingList) {
            if (!isRejectedOrCancelled(p)) {
                if (p.getConsideredDuration() != null) {
                    total += p.getConsideredDuration().doubleValue();
                }
            }
        }
        return total;
    }

    public java.util.Map<String, Object> getMonthlyUsage(Long employeeId, Date date, Long excludeId) {
        int maxRequests = 2;
        int maxMinutes = 120;
        try {
            if (appPreferenceRepo != null) {
                var reqPref = appPreferenceRepo.findByPrefName("PERMISSION_MAX_REQUESTS_MONTH");
                if (reqPref.isPresent() && reqPref.get().getPrefValue() != null && !reqPref.get().getPrefValue().trim().isEmpty()) {
                    maxRequests = Integer.parseInt(reqPref.get().getPrefValue().trim());
                }
                var minPref = appPreferenceRepo.findByPrefName("PERMISSION_MAX_MINUTES_MONTH");
                if (minPref.isPresent() && minPref.get().getPrefValue() != null && !minPref.get().getPrefValue().trim().isEmpty()) {
                    maxMinutes = Integer.parseInt(minPref.get().getPrefValue().trim());
                }
            }
        } catch (Exception e) {}

        java.util.Map<String, Object> usage = new java.util.HashMap<>();
        if (employeeId == null || date == null) {
            usage.put("usedRequests", 0);
            usage.put("maxRequests", maxRequests);
            usage.put("usedMinutes", 0);
            usage.put("maxMinutes", maxMinutes);
            usage.put("remainingMinutes", maxMinutes);
            return usage;
        }

        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        int year = cal.get(Calendar.YEAR);
        String month = new java.text.SimpleDateFormat("MMMM", Locale.ENGLISH).format(date);

        List<PermissionEntry> existingList;
        if (excludeId == null) {
            existingList = permissionEntryRepo.findByEmployeeIdAndYearAndMonthAndIsActiveTrue(
                    employeeId, year, month);
        } else {
            existingList = permissionEntryRepo.findByEmployeeIdAndYearAndMonthAndIsActiveTrueAndIdNot(
                    employeeId, year, month, excludeId);
        }

        long activeCount = 0;
        double totalHours = 0.0;
        for (PermissionEntry p : existingList) {
            if (!isRejectedOrCancelled(p)) {
                activeCount++;
                if (p.getConsideredDuration() != null) {
                    totalHours += p.getConsideredDuration().doubleValue();
                }
            }
        }

        int usedMinutes = (int) Math.round(totalHours * 60);
        int remainingMinutes = Math.max(0, maxMinutes - usedMinutes);

        usage.put("usedRequests", (int) activeCount);
        usage.put("maxRequests", maxRequests);
        usage.put("usedMinutes", usedMinutes);
        usage.put("maxMinutes", maxMinutes);
        usage.put("remainingMinutes", remainingMinutes);
        return usage;
    }
}
