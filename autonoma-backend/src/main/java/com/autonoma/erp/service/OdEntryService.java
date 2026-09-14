package com.autonoma.erp.service;

import com.autonoma.erp.model.OdEntry;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.repository.OdEntryRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class OdEntryService {

    private final OdEntryRepository repository;
    private final EmployeeMasterRepository employeeRepository;
    private final com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository statusMasterRepo;

    @org.springframework.beans.factory.annotation.Autowired
    public OdEntryService(
            OdEntryRepository repository,
            EmployeeMasterRepository employeeRepository,
            com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository statusMasterRepo) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.statusMasterRepo = statusMasterRepo;
    }

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.autonoma.erp.modules.hr.leave.repository.LeaveEntryRepository leaveEntryRepo;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.autonoma.erp.modules.platform.identity.repository.PermissionEntryRepository permissionEntryRepo;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.autonoma.erp.modules.hr.attendance.repository.HrAttendanceDailyLogRepository dailyLogRepository;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.autonoma.erp.repository.admin.AppPreferenceRepository appPreferenceRepo;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.autonoma.erp.service.admin.BosUserPageAuthService authService;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository jobProfileRepo;

    private Long resolveStatusId(String statusName, Long defaultId) {
        if (statusName == null || statusName.isBlank()) return defaultId;
        return statusMasterRepo.findByNameIgnoreCase(statusName.trim())
                .map(com.autonoma.erp.modules.platform.common.entity.StatusMaster::getId)
                .orElse(defaultId);
    }

    public List<OdEntry> getAll() {
        return repository.findAllByOrderByIdAsc();
    }

    public OdEntry getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OD Entry not found."));
    }

    @Transactional
    public OdEntry save(OdEntry entry) {
        // Find employee name
        employeeRepository.findById(entry.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee not found."));

        if (jobProfileRepo != null) {
            var jobProfileOpt = jobProfileRepo.findByEmployeeId(entry.getEmployeeId());
            if (jobProfileOpt.isPresent()) {
                String odAllowed = jobProfileOpt.get().getOdAllowed();
                if ("NO".equalsIgnoreCase(odAllowed) || "false".equalsIgnoreCase(odAllowed)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "On-Duty (OD) application is disabled for this employee in Employee Master.");
                }
            }
        }

        // Default nullable fields to empty strings to satisfy NOT NULL constraints
        if (entry.getVehicleType() == null || entry.getVehicleType().isBlank()) entry.setVehicleType("NA");
        if (entry.getFromLocation() == null || entry.getFromLocation().isBlank()) entry.setFromLocation("");
        if (entry.getToLocation() == null || entry.getToLocation().isBlank()) entry.setToLocation("");

        if (entry.getDistance() == null) {
            entry.setDistance(BigDecimal.ZERO);
        }

        boolean isSelfCareOd = "Employee Self Care".equalsIgnoreCase(entry.getWhereFrom())
            || "Employee Self Care".equalsIgnoreCase(entry.getFromWhere());

        if (isSelfCareOd) {
            java.util.Calendar cutoffDate = java.util.Calendar.getInstance();
            cutoffDate.set(java.util.Calendar.HOUR_OF_DAY, 0);
            cutoffDate.set(java.util.Calendar.MINUTE, 0);
            cutoffDate.set(java.util.Calendar.SECOND, 0);
            cutoffDate.set(java.util.Calendar.MILLISECOND, 0);
            cutoffDate.add(java.util.Calendar.DAY_OF_MONTH, -3);

            if (entry.getOdFromDateTime() != null) {
                java.util.Calendar fromCal = java.util.Calendar.getInstance();
                fromCal.setTime(entry.getOdFromDateTime());
                fromCal.set(java.util.Calendar.HOUR_OF_DAY, 0);
                fromCal.set(java.util.Calendar.MINUTE, 0);
                fromCal.set(java.util.Calendar.SECOND, 0);
                fromCal.set(java.util.Calendar.MILLISECOND, 0);

                if (fromCal.before(cutoffDate)) {
                    String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                    boolean isAdmin = false;
                    if (currentUserId == null || "SYSTEM".equals(currentUserId)) {
                        isAdmin = true;
                    } else if (authService != null) {
                        isAdmin = authService.hasPermission(currentUserId, "M2390", "additional1")
                                || authService.hasPermission(currentUserId, "HA1390", "additional1");
                    }
                    if (!isAdmin) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OD application date cannot be more than 3 days in the past.");
                    }
                }
            }
        }

        // Explicitly set audit fields to prevent NOT NULL constraint violation
        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No authenticated user session found.");
        }

        // Cross-module validation & duplicate OD check (with Half-Day compatibility)
        if (entry.getEmployeeId() != null && entry.getOdFromDateTime() != null) {
            Date newFrom = entry.getOdFromDateTime();
            Date newTo = entry.getOdToDateTime() != null ? entry.getOdToDateTime() : newFrom;
            com.autonoma.erp.util.AttendanceOccupancyUtil.DayOccupancy reqOdOcc = com.autonoma.erp.util.AttendanceOccupancyUtil.getOdOccupancy(newFrom, newTo);

            // 1. Check existing OD entries
            List<OdEntry> existingOds = repository.findByEmployeeId(entry.getEmployeeId());
            if (existingOds != null && !existingOds.isEmpty()) {
                java.text.SimpleDateFormat dFmt = new java.text.SimpleDateFormat("dd-MMM-yyyy");
                for (OdEntry existing : existingOds) {
                    if (entry.getId() != null && entry.getId().equals(existing.getId())) {
                        continue;
                    }
                    String st = existing.getStatus() != null ? existing.getStatus().trim() : "";
                    if (st.equalsIgnoreCase("Rejected") || st.equalsIgnoreCase("Reject") || st.equalsIgnoreCase("Cancelled")) {
                        continue;
                    }
                    Date exFrom = existing.getOdFromDateTime();
                    Date exTo = existing.getOdToDateTime() != null ? existing.getOdToDateTime() : exFrom;
                    if (exFrom != null && exTo != null) {
                        java.util.Calendar odStart = java.util.Calendar.getInstance();
                        odStart.setTime(exFrom);
                        odStart.set(java.util.Calendar.HOUR_OF_DAY, 0); odStart.set(java.util.Calendar.MINUTE, 0); odStart.set(java.util.Calendar.SECOND, 0); odStart.set(java.util.Calendar.MILLISECOND, 0);

                        java.util.Calendar odEnd = java.util.Calendar.getInstance();
                        odEnd.setTime(exTo);
                        odEnd.set(java.util.Calendar.HOUR_OF_DAY, 23); odEnd.set(java.util.Calendar.MINUTE, 59); odEnd.set(java.util.Calendar.SECOND, 59); odEnd.set(java.util.Calendar.MILLISECOND, 999);

                        if (!odStart.getTime().after(newTo) && !odEnd.getTime().before(newFrom)) {
                            com.autonoma.erp.util.AttendanceOccupancyUtil.DayOccupancy exOdOcc = com.autonoma.erp.util.AttendanceOccupancyUtil.getOdOccupancy(exFrom, exTo);
                            if (com.autonoma.erp.util.AttendanceOccupancyUtil.checkOccupancyConflict(exOdOcc, reqOdOcc)) {
                                String clashDate = dFmt.format(odStart.getTime());
                                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An active On Duty (OD) application (" + exOdOcc.getLabel() + ") already exists on " + clashDate + ". Cannot apply for OD (" + reqOdOcc.getLabel() + ") on the same half-day.");
                            }
                        }
                    }
                }
            }

            // 2. Check active Leave entries (with Half-Day compatibility)
            if (leaveEntryRepo != null) {
                List<com.autonoma.erp.modules.hr.leave.entity.LeaveEntry> leaves = leaveEntryRepo.findByEmployeeIdAndIsActiveTrue(entry.getEmployeeId());
                if (leaves != null && !leaves.isEmpty()) {
                    java.text.SimpleDateFormat dFmt = new java.text.SimpleDateFormat("dd-MMM-yyyy");
                    for (com.autonoma.erp.modules.hr.leave.entity.LeaveEntry l : leaves) {
                        String st = l.getStatus() != null ? l.getStatus().trim() : "";
                        if (st.equalsIgnoreCase("Rejected") || st.equalsIgnoreCase("Reject") || st.equalsIgnoreCase("Cancelled") || (l.getRejectReason() != null && !l.getRejectReason().isBlank())) {
                            continue;
                        }
                        if (l.getFromDate() != null && l.getToDate() != null) {
                            java.util.Calendar lStart = java.util.Calendar.getInstance();
                            lStart.setTime(l.getFromDate());
                            lStart.set(java.util.Calendar.HOUR_OF_DAY, 0); lStart.set(java.util.Calendar.MINUTE, 0); lStart.set(java.util.Calendar.SECOND, 0); lStart.set(java.util.Calendar.MILLISECOND, 0);

                            java.util.Calendar lEnd = java.util.Calendar.getInstance();
                            lEnd.setTime(l.getToDate());
                            lEnd.set(java.util.Calendar.HOUR_OF_DAY, 23); lEnd.set(java.util.Calendar.MINUTE, 59); lEnd.set(java.util.Calendar.SECOND, 59); lEnd.set(java.util.Calendar.MILLISECOND, 999);

                            if (!lStart.getTime().after(newTo) && !lEnd.getTime().before(newFrom)) {
                                com.autonoma.erp.util.AttendanceOccupancyUtil.DayOccupancy exLeaveOcc = com.autonoma.erp.util.AttendanceOccupancyUtil.getLeaveOccupancy(l.getHalfDay());
                                if (com.autonoma.erp.util.AttendanceOccupancyUtil.checkOccupancyConflict(exLeaveOcc, reqOdOcc)) {
                                    String clashDate = dFmt.format(lStart.getTime());
                                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An active Leave application (" + exLeaveOcc.getLabel() + ") already exists on " + clashDate + ". Cannot apply for On Duty (OD) (" + reqOdOcc.getLabel() + ") on the same half-day.");
                                }
                            }
                        }
                    }
                }
            }

            // 3. Check active Permission entries (with Half-Day compatibility)
            if (permissionEntryRepo != null) {
                List<com.autonoma.erp.modules.platform.identity.entity.PermissionEntry> permissions = permissionEntryRepo.findByEmployeeIdOrderByPermissionDateDesc(entry.getEmployeeId());
                if (permissions != null && !permissions.isEmpty()) {
                    java.text.SimpleDateFormat dFmt = new java.text.SimpleDateFormat("dd-MMM-yyyy");
                    for (com.autonoma.erp.modules.platform.identity.entity.PermissionEntry p : permissions) {
                        String st = p.getStatus() != null ? p.getStatus().trim() : "";
                        if (st.equalsIgnoreCase("Rejected") || st.equalsIgnoreCase("Reject") || st.equalsIgnoreCase("Cancelled")) {
                            continue;
                        }
                        if (p.getPermissionDate() != null) {
                            java.util.Calendar pCal = java.util.Calendar.getInstance();
                            pCal.setTime(p.getPermissionDate());
                            pCal.set(java.util.Calendar.HOUR_OF_DAY, 0); pCal.set(java.util.Calendar.MINUTE, 0); pCal.set(java.util.Calendar.SECOND, 0); pCal.set(java.util.Calendar.MILLISECOND, 0);

                            if (!pCal.getTime().before(newFrom) && !pCal.getTime().after(newTo)) {
                                com.autonoma.erp.util.AttendanceOccupancyUtil.DayOccupancy exPermOcc = com.autonoma.erp.util.AttendanceOccupancyUtil.getPermissionOccupancy(p.getFromTime(), p.getToTime());
                                if (com.autonoma.erp.util.AttendanceOccupancyUtil.checkOccupancyConflict(exPermOcc, reqOdOcc)) {
                                    String clashDate = dFmt.format(pCal.getTime());
                                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An active Permission application (" + exPermOcc.getLabel() + ") already exists on " + clashDate + ". Cannot apply for On Duty (OD) (" + reqOdOcc.getLabel() + ") on the same half-day.");
                                }
                            }
                        }
                    }
                }
            }
        }

        // Generate OD number if new
        if (entry.getId() == null) {
            entry.setOdNumber(generateNextODNumber());
            entry.setStatusId(resolveStatusId("Pending to Verify", 10008L));
            if (entry.getWhereFrom() == null || entry.getWhereFrom().isBlank()) {
                entry.setWhereFrom("HR OD Details");
            }
            entry.setCreatedBy(currentUserId);
            entry.setCreatedDate(new java.util.Date());
        }
        entry.setUpdatedBy(currentUserId);
        entry.setUpdatedDate(new java.util.Date());

        return repository.save(entry);
    }

    @Transactional
    public List<OdEntry> saveBatch(OdEntry template, List<Long> employeeIds) {
        if (employeeIds == null || employeeIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one employee must be selected.");
        }

        List<OdEntry> created = new ArrayList<>();
        for (Long empId : employeeIds) {
            OdEntry entry = new OdEntry();
            entry.setEmployeeId(empId);
            entry.setOdFromDateTime(template.getOdFromDateTime());
            entry.setOdToDateTime(template.getOdToDateTime());
            entry.setVisitType(template.getVisitType());
            entry.setVehicleType(template.getVehicleType());
            entry.setPurposeOfOd(template.getPurposeOfOd());
            entry.setFromLocation(template.getFromLocation());
            entry.setToLocation(template.getToLocation());
            entry.setDistance(template.getDistance());
            entry.setWhereFrom(template.getWhereFrom() != null && !template.getWhereFrom().isBlank() ? template.getWhereFrom() : "HR OD Details");

            created.add(save(entry));
            repository.flush();
        }
        return created;
    }

    @Transactional(readOnly = true)
    public List<OdEntry> getByEmployeeId(Long employeeId) {
        return repository.findByEmployeeId(employeeId);
    }

    @Transactional
    public OdEntry update(Long id, OdEntry details) {
        OdEntry existing = getById(id);

        // Lockout constraint: Closed, Approved, or Rejected records are read-only
        if ("Closed".equalsIgnoreCase(existing.getStatus()) 
                || "Approved".equalsIgnoreCase(existing.getStatus()) 
                || "Rejected".equalsIgnoreCase(existing.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "This On Duty entry is " + existing.getStatus() + " and cannot be modified.");
        }

        // Update fields
        existing.setOdFromDateTime(details.getOdFromDateTime());
        existing.setOdToDateTime(details.getOdToDateTime());
        existing.setVisitType(details.getVisitType());
        existing.setVehicleType(details.getVehicleType());
        existing.setPurposeOfOd(details.getPurposeOfOd());
        existing.setFromLocation(details.getFromLocation());
        existing.setToLocation(details.getToLocation());
        existing.setDistance(details.getDistance() != null ? details.getDistance() : BigDecimal.ZERO);
        if (details.getStatusId() != null) {
            existing.setStatusId(details.getStatusId());
        } else if (details.getStatus() != null && !details.getStatus().isBlank()) {
            existing.setStatusId(resolveStatusId(details.getStatus(), 10008L));
        }
        if (details.getWhereFrom() != null && !details.getWhereFrom().isBlank()) {
            existing.setWhereFrom(details.getWhereFrom());
        }

        return repository.save(existing);
    }

    @Transactional
    public OdEntry verify(Long id, String status, String remarks) {
        OdEntry existing = getById(id);

        // Validation: Must be in a pending status to verify (accept both variants)
        String existingStatus = existing.getStatus() == null ? "" : existing.getStatus().trim();
        boolean isPending = existingStatus.equalsIgnoreCase("Pending for Verify")
                || existingStatus.equalsIgnoreCase("Pending to Verify")
                || existingStatus.equalsIgnoreCase("Pending");
        if (!isPending) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Only Pending OD entries can be verified. Current status: " + existingStatus);
        }

        if (!"Approved".equalsIgnoreCase(status) && !"Rejected".equalsIgnoreCase(status) && !"Verified".equalsIgnoreCase(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification status: " + status);
        }

        if ("Rejected".equalsIgnoreCase(status) && (remarks == null || remarks.trim().isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Remarks are mandatory when rejecting.");
        }

        existing.setStatusId(resolveStatusId(status, "Verified".equalsIgnoreCase(status) ? 10009L : ("Approved".equalsIgnoreCase(status) ? 10007L : 9L)));
        existing.setRejectionReason(remarks);

        String verifierId = "System";
        try {
            verifierId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        existing.setVerifiedBy(verifierId);
        existing.setVerifiedDate(new Date());

        OdEntry saved = repository.save(existing);
        if ("Approved".equalsIgnoreCase(status) || "Verified".equalsIgnoreCase(status)) {
            syncApprovedOdToDailyLog(saved);
        }
        return saved;
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(OdEntryService.class);

    private void syncApprovedOdToDailyLog(OdEntry entry) {
        if (entry == null || entry.getEmployeeId() == null || entry.getOdFromDateTime() == null || entry.getOdToDateTime() == null || dailyLogRepository == null) {
            return;
        }
        try {
            java.time.LocalDate startDate = entry.getOdFromDateTime().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            java.time.LocalDate endDate = entry.getOdToDateTime().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();

            for (java.time.LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
                Optional<com.autonoma.erp.modules.hr.attendance.entity.HrAttendanceDailyLog> existingLogOpt =
                        dailyLogRepository.findByEmpIdAndAttendanceDate(entry.getEmployeeId(), d);

                com.autonoma.erp.modules.hr.attendance.entity.HrAttendanceDailyLog logRecord;
                if (existingLogOpt.isPresent()) {
                    logRecord = existingLogOpt.get();
                    // Allow override if MANUAL entry was marked as Absent
                    if ("MANUAL".equalsIgnoreCase(logRecord.getFromWhere()) && !"Absent".equalsIgnoreCase(logRecord.getAttType())) {
                        continue;
                    }
                } else {
                    logRecord = new com.autonoma.erp.modules.hr.attendance.entity.HrAttendanceDailyLog();
                    logRecord.setAttendanceDate(d);
                    logRecord.setEmpId(entry.getEmployeeId());
                    logRecord.setCreatedBy("SYSTEM");
                }

                logRecord.setAttType("Present");
                logRecord.setFromWhere("OD");
                String purpose = entry.getPurposeOfOd() != null && !entry.getPurposeOfOd().trim().isEmpty()
                        ? entry.getPurposeOfOd().trim()
                        : "Official Duty";
                logRecord.setRemarks("OD: " + purpose);
                logRecord.setUpdatedBy("SYSTEM");
                dailyLogRepository.save(logRecord);
            }
        } catch (Exception e) {
            log.error("Failed to sync approved OD entry to attendance daily log: {}", e.getMessage());
        }
    }

    public String getNextODNumber() {
        return generateNextODNumber();
    }

    private String generateNextODNumber() {
        try {
            String year = String.valueOf(java.time.Year.now().getValue()).substring(2);
            String prefix = "OD-" + year + "-";
            
            Optional<OdEntry> lastEntry = repository.findTopByOdNumberStartingWithOrderByOdNumberDesc(prefix);
            
            if (lastEntry.isEmpty()) {
                return prefix + "00001";
            }
            
            String lastCode = lastEntry.get().getOdNumber();
            String[] parts = lastCode.split("-");
            if (parts.length < 3) return prefix + "00001";
            
            int lastNum = Integer.parseInt(parts[2]);
            return String.format("%s%05d", prefix, lastNum + 1);
        } catch (Exception e) {
            e.printStackTrace();
            String year = String.valueOf(java.time.Year.now().getValue()).substring(2);
            return "OD-" + year + "-00001";
        }
    }
}
