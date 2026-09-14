package com.autonoma.erp.service;

import com.autonoma.erp.model.VisitorGatePass;
import com.autonoma.erp.repository.VisitorGatePassRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

@Service
public class VisitorGatePassService {

    @Autowired
    private VisitorGatePassRepository repo;

    @Autowired
    private com.autonoma.erp.service.admin.PrefixCredentialService prefixCredentialService;

    @Autowired
    private com.autonoma.erp.modules.platform.common.service.StatusMasterCacheService statusMasterCacheService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired(required = false)
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeMasterRepository;

    @Autowired(required = false)
    private com.autonoma.erp.repository.admin.UserRepository userRepository;

    // ── Helper to dynamically get or create Status ID from AD_STATUS_MASTER ──────
    public Integer getStatusIdByName(String statusName) {
        if (statusName == null || statusName.isBlank())
            return null;
        try {
            return statusMasterCacheService.getStatusIdByName(statusName.trim());
        } catch (Exception e) {
            return null;
        }
    }

    public Integer resolveStatusToInt(String s) {
        if (s == null || s.isBlank())
            return null;
        try {
            String upper = s.trim().toUpperCase();
            String normalizedStatus = switch (upper) {
                case "APPROVED" -> "APPROVED";
                case "REJECTED" -> "REJECTED";
                case "CANCELLED" -> "CANCELLED";
                case "CHECKED_OUT", "CHECK OUT", "CLOSED" -> "CLOSED";
                case "CHECKED_IN", "CHECK IN" -> "CHECKED_IN";
                case "AUTO CLOSED" -> "AUTO CLOSED";
                default -> upper;
            };
            return getStatusIdByName(normalizedStatus);
        } catch (Exception e) {
            return 0;
        }
    }

    // ── Filtered paginated list ───────────────────────────────────────────────
    public Page<VisitorGatePass> findAll(String status, String visitorType, String foodAllowance,
            String fromDate, String toDate, String searchValue, String gatePassNo, String taskScope,
            int page, int size) {
        Integer statusInt = (status != null && !status.isBlank()) ? resolveStatusToInt(status) : null;
        Date from = parseDate(fromDate);
        Date to = parseToEndOfDay(toDate);

        java.util.Set<String> allowedPersons = null;
        if (taskScope != null && !taskScope.isBlank() && !"Company".equalsIgnoreCase(taskScope) && !"All".equalsIgnoreCase(taskScope)) {
            final java.util.Set<String> allowedPersonsSet = new java.util.HashSet<>();
            String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            if (currentUserId != null && !currentUserId.isBlank()) {
                allowedPersonsSet.add(currentUserId.toLowerCase().trim());
                if (userRepository != null) {
                    userRepository.findByUserId(currentUserId).ifPresent(u -> {
                        if (u.getUserId() != null) allowedPersonsSet.add(u.getUserId().toLowerCase().trim());
                        if (u.getEmpId() != null && employeeMasterRepository != null) {
                            employeeMasterRepository.findById(u.getEmpId()).ifPresent(emp -> {
                                if (emp.getEmployeeName() != null) allowedPersonsSet.add(emp.getEmployeeName().toLowerCase().trim());
                                if (emp.getEmpCode() != null) allowedPersonsSet.add(emp.getEmpCode().toLowerCase().trim());
                            });
                        }
                    });
                }
                if (employeeMasterRepository != null && allowedPersonsSet.size() <= 1) {
                    employeeMasterRepository.findByEmpCodeOrName(currentUserId).ifPresent(emp -> {
                        if (emp.getEmployeeName() != null) allowedPersonsSet.add(emp.getEmployeeName().toLowerCase().trim());
                        if (emp.getEmpCode() != null) allowedPersonsSet.add(emp.getEmpCode().toLowerCase().trim());
                    });
                }
            }
            if (!allowedPersonsSet.isEmpty()) {
                allowedPersons = allowedPersonsSet;
            }
        }

        return repo.findByFilters(
                statusInt,
                nullIfBlank(visitorType),
                nullIfBlank(foodAllowance),
                from, to,
                nullIfBlank(searchValue),
                nullIfBlank(gatePassNo),
                allowedPersons,
                PageRequest.of(page, size));
    }

    public Page<VisitorGatePass> findAll(String status, String visitorType, String foodAllowance,
            String fromDate, String toDate, String searchValue, String gatePassNo,
            int page, int size) {
        return findAll(status, visitorType, foodAllowance, fromDate, toDate, searchValue, gatePassNo, null, page, size);
    }

    // ── Get by ID ─────────────────────────────────────────────────────────────
    public VisitorGatePass findById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Visitor Gate Pass not found with ID: " + id));
    }

    // ── Get latest by mobile number ───────────────────────────────────────────
    public VisitorGatePass findLatestByMobileNo(String mobileNo) {
        if (mobileNo == null || mobileNo.isBlank())
            return null;
        String digits = mobileNo.replaceAll("[^0-9]", "");
        if (digits.length() > 10) {
            digits = digits.substring(digits.length() - 10);
        }
        if (digits.isEmpty())
            return null;
        java.util.List<VisitorGatePass> list = repo.findLatestByMobileDigits(digits);
        return list.isEmpty() ? null : list.get(0);
    }

    // ── Get photo info by mobile number with 6-month threshold check ────────
    public java.util.Map<String, Object> findPhotoInfoByMobileNo(String mobileNo) {
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        if (mobileNo == null || mobileNo.isBlank()) {
            result.put("isPhotoMandatory", true);
            return result;
        }
        String digits = mobileNo.replaceAll("[^0-9]", "");
        if (digits.length() > 10) {
            digits = digits.substring(digits.length() - 10);
        }
        if (digits.isEmpty()) {
            result.put("isPhotoMandatory", true);
            return result;
        }

        java.util.List<VisitorGatePass> list = repo.findLatestWithImageByMobileDigits(digits);
        if (list.isEmpty()) {
            result.put("isPhotoMandatory", true);
            return result;
        }

        VisitorGatePass pass = list.get(0);
        String img = pass.getCheckInImg() != null && !pass.getCheckInImg().isBlank()
                ? pass.getCheckInImg()
                : pass.getCheckOutImg();

        Date imgDate = pass.getCheckInTime() != null ? pass.getCheckInTime()
                : (pass.getCheckOutTime() != null ? pass.getCheckOutTime()
                        : (pass.getVisitorDate() != null ? pass.getVisitorDate() : pass.getCreatedDate()));

        if (img == null || img.isBlank() || imgDate == null) {
            result.put("isPhotoMandatory", true);
            return result;
        }

        Calendar now = Calendar.getInstance();
        Calendar past = Calendar.getInstance();
        past.setTime(imgDate);

        int yearDiff = now.get(Calendar.YEAR) - past.get(Calendar.YEAR);
        int monthDiff = now.get(Calendar.MONTH) - past.get(Calendar.MONTH);
        int totalMonths = yearDiff * 12 + monthDiff;

        if (now.get(Calendar.DAY_OF_MONTH) < past.get(Calendar.DAY_OF_MONTH)) {
            totalMonths--;
        }

        boolean isMandatory = totalMonths >= 6;

        result.put("photoUrl", img);
        result.put("lastPhotoDate", new SimpleDateFormat("dd/MM/yyyy").format(imgDate));
        result.put("monthsElapsed", Math.max(0, totalMonths));
        result.put("isPhotoMandatory", isMandatory);
        result.put("latestPassId", pass.getId());
        return result;
    }

    // ── Get by Gate Pass No ───────────────────────────────────────────────────
    public VisitorGatePass findByGatePassNo(String gatePassNo) {
        if (gatePassNo == null || gatePassNo.isBlank())
            return null;
        return repo.findByGatePassNoExact(gatePassNo.trim()).orElse(null);
    }

    // ── Search Gate Pass No Suggestions ────────────────────────────────────────
    public java.util.List<VisitorGatePass> searchByGatePassNo(String q) {
        if (q == null || q.isBlank())
            return java.util.Collections.emptyList();
        java.util.List<VisitorGatePass> list = repo.findTop10ByGatePassNoContainingIgnoreCaseOrderByIdDesc(q.trim());
        Integer closedId = getStatusIdByName("CLOSED");
        Integer cancelledId = getStatusIdByName("CANCELLED");
        Integer rejectedId = getStatusIdByName("REJECTED");
        Integer autoClosedId = getStatusIdByName("AUTO CLOSED");

        return list.stream().filter(pass -> {
            if (pass.getStatus() == null)
                return true;
            Integer s = pass.getStatus();
            if (closedId != null && s.equals(closedId))
                return false;
            if (cancelledId != null && s.equals(cancelledId))
                return false;
            if (rejectedId != null && s.equals(rejectedId))
                return false;
            if (autoClosedId != null && s.equals(autoClosedId))
                return false;
            if (pass.getStatusLabel() != null) {
                String label = pass.getStatusLabel().trim().toUpperCase();
                if (label.contains("CLOSED") || label.contains("CANCEL") || label.contains("REJECT"))
                    return false;
            }
            return true;
        }).collect(java.util.stream.Collectors.toList());
    }

    // ── Perform Check In ─────────────────────────────────────────────────────
    @Transactional
    public VisitorGatePass checkIn(Long id, String checkInBy, String checkInImg) {
        VisitorGatePass existing = findById(id);
        existing.setCheckInTime(new Date());
        if (checkInBy != null && !checkInBy.isBlank()) {
            existing.setCheckInBy(checkInBy);
        }
        if (checkInImg != null && !checkInImg.isBlank()) {
            existing.setCheckInImg(checkInImg);
        }
        Integer checkedInStatusId = getStatusIdByName("CHECKED-IN");
        if (checkedInStatusId == null) {
            checkedInStatusId = getStatusIdByName("CHECKED_IN");
        }
        if (checkedInStatusId != null) {
            existing.setStatus(checkedInStatusId);
        }
        return repo.save(existing);
    }

    // ── Perform Check Out ────────────────────────────────────────────────────
    @Transactional
    public VisitorGatePass checkOut(Long id, String checkOutBy, String checkOutImg) {
        VisitorGatePass existing = findById(id);
        existing.setCheckOutTime(new Date());
        if (checkOutBy != null && !checkOutBy.isBlank()) {
            existing.setCheckOutBy(checkOutBy);
        }
        if (checkOutImg != null && !checkOutImg.isBlank()) {
            existing.setCheckOutImg(checkOutImg);
        }
        Integer closedStatusId = getStatusIdByName("CLOSED");
        if (closedStatusId != null) {
            existing.setStatus(closedStatusId);
        }
        return repo.save(existing);
    }

    // ── Create ────────────────────────────────────────────────────────────────
    @Transactional
    public VisitorGatePass create(VisitorGatePass pass) {
        Date today = new Date();
        pass.setGatePassDate(today);
        pass.setGatePassNo(generateGatePassNo(today));
        if (pass.getStatus() == null) {
            pass.setStatus(getStatusIdByName("OPEN")); // Dynamic OPEN status ID from AD_STATUS_MASTER
        }
        return repo.save(pass);
    }

    // ── Update ────────────────────────────────────────────────────────────────
    @Transactional
    public VisitorGatePass update(Long id, VisitorGatePass updated) {
        VisitorGatePass existing = findById(id);
        existing.setVisitorName(updated.getVisitorName());
        existing.setVisitorType(updated.getVisitorType());
        existing.setIsdCode(updated.getIsdCode());
        existing.setMobileNo(updated.getMobileNo());
        existing.setEmailId(updated.getEmailId());
        existing.setAddress(updated.getAddress());
        existing.setVendorCode(updated.getVendorCode());
        existing.setNewVendor(updated.getNewVendor());
        existing.setPersonToMeet(updated.getPersonToMeet());
        existing.setPersonName(updated.getPersonName());
        existing.setPurpose(updated.getPurpose());
        existing.setPurposeComments(updated.getPurposeComments());
        existing.setNoOfPersons(updated.getNoOfPersons());
        if (updated.getVisitorDate() != null)
            existing.setVisitorDate(updated.getVisitorDate());
        if (updated.getInTime() != null)
            existing.setInTime(updated.getInTime());
        if (updated.getOutTime() != null)
            existing.setOutTime(updated.getOutTime());
        existing.setFoodAllowance(updated.getFoodAllowance());
        existing.setFoodCategory(updated.getFoodCategory());
        existing.setNormalFood(updated.getNormalFood());
        existing.setKit(updated.getKit());
        existing.setComments(updated.getComments());
        if (updated.getGatePassType() != null)
            existing.setGatePassType(updated.getGatePassType());

        if (updated.getCheckInImg() != null) {
            existing.setCheckInImg(updated.getCheckInImg());
        }
        if (updated.getCheckOutImg() != null) {
            existing.setCheckOutImg(updated.getCheckOutImg());
        }
        if (updated.getCheckInTime() != null) {
            existing.setCheckInTime(updated.getCheckInTime());
        }
        if (updated.getCheckOutTime() != null) {
            existing.setCheckOutTime(updated.getCheckOutTime());
            Integer closedStatusId = getStatusIdByName("CLOSED");
            if (closedStatusId != null) {
                existing.setStatus(closedStatusId);
            }
        }

        if (updated.getStatus() != null) {
            existing.setStatus(updated.getStatus());
            Integer checkInStatusId = getStatusIdByName("CHECKED_IN");
            Integer closedStatusId = getStatusIdByName("CLOSED");

            if (java.util.Objects.equals(updated.getStatus(), checkInStatusId) && existing.getCheckInBy() == null) {
                existing.setCheckInBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            }
            if (java.util.Objects.equals(updated.getStatus(), closedStatusId) && existing.getCheckOutBy() == null) {
                existing.setCheckOutBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            }
        }
        if (updated.getCancelReason() != null) {
            existing.setCancelReason(updated.getCancelReason());
        }
        return repo.save(existing);
    }

    // ── Nightly Scheduler @ 11:59 PM to auto close OPEN and CHECKED_IN passes for
    // the day ──
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 59 23 * * *", zone = "Asia/Kolkata")
    @Transactional
    public void autoCloseDailyVisitorGatePasses() {
        try {
            Date today = stripTime(new Date());
            Date endOfDay = parseToEndOfDay(new SimpleDateFormat("yyyy-MM-dd").format(today));

            // Dynamic status IDs retrieved from AD_STATUS_MASTER (or auto-created if
            // missing)
            Integer openStatusId = getStatusIdByName("OPEN");
            Integer checkInStatusId = getStatusIdByName("CHECKED_IN");
            Integer autoClosedStatusId = getStatusIdByName("AUTO CLOSED");

            java.util.List<Integer> targetStatusIds = new java.util.ArrayList<>();
            if (openStatusId != null)
                targetStatusIds.add(openStatusId);
            if (checkInStatusId != null)
                targetStatusIds.add(checkInStatusId);

            java.util.List<VisitorGatePass> openOrCheckInPasses = targetStatusIds.isEmpty()
                    ? java.util.Collections.emptyList()
                    : repo.findOpenPassesBeforeDate(endOfDay, targetStatusIds);

            for (VisitorGatePass pass : openOrCheckInPasses) {
                pass.setStatus(autoClosedStatusId); // Dynamic status ID from AD_STATUS_MASTER
                pass.setComments((pass.getComments() != null ? pass.getComments() + " | " : "")
                        + "Auto-closed at end of day (11:59 PM)");
                repo.save(pass);
            }
            System.out.println("[VisitorGatePassService] End of day auto-close process completed for "
                    + openOrCheckInPasses.size() + " passes with Status ID: " + autoClosedStatusId);
        } catch (Exception e) {
            System.err
                    .println("[VisitorGatePassService] Error running nightly auto-close scheduler: " + e.getMessage());
        }
    }

    // ── Gate pass number generator: VGP-YYYYMMDD-NNN ─────────────────────────
    public String generateGatePassNo(Date date) {
        String year = String.valueOf(java.time.LocalDate.now().getYear());
        String currentAccountYear = year + "-" + (java.time.LocalDate.now().getYear() + 1);
        String configuredPrefix = null;
        String configuredSuffix = "";
        int digits = 6;
        try {
            java.util.List<com.autonoma.erp.model.admin.PrefixCredential> allCreds = prefixCredentialService
                    .getAllPrefixCredentials();
            com.autonoma.erp.model.admin.PrefixCredential cred = allCreds.stream()
                    .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                    .filter(c -> currentAccountYear.equals(c.getAccountYear()))
                    .findFirst()
                    .orElse(allCreds.stream()
                            .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                            .findFirst().orElse(null));

            if (cred != null && cred.getVisitorGatePassPrefix() != null && !cred.getVisitorGatePassPrefix().isEmpty()) {
                configuredPrefix = cred.getVisitorGatePassPrefix().trim();
                if (cred.getVisitorGatePassSuffix() != null) {
                    configuredSuffix = cred.getVisitorGatePassSuffix().trim();
                }
                digits = cred.getVisitorGatePassDigit() != null ? cred.getVisitorGatePassDigit() : 6;
            }
        } catch (Exception ex) {
            System.err.println("[VisitorGatePassService] Could not read prefix: " + ex.getMessage());
        }

        if (configuredPrefix == null) {
            configuredPrefix = "VP/" + year + "-";
            configuredSuffix = "";
            digits = 4;
        }

        String finalPrefix = configuredPrefix.replaceAll("/+", "/");
        String finalSuffix = configuredSuffix.replaceAll("/+", "/");
        String searchPattern = finalPrefix + "%" + finalSuffix;

        long nextNum = 1;
        try {
            java.util.List<String> list = jdbcTemplate.queryForList(
                    "SELECT GATE_PASS_NO FROM OM_VISITOR_GATE_PASS WHERE GATE_PASS_NO LIKE ?",
                    String.class, searchPattern);

            long maxNum = 0;
            for (String vgp : list) {
                if (vgp == null || vgp.isBlank())
                    continue;
                String numStr = vgp.trim();
                if (!finalPrefix.isEmpty() && numStr.startsWith(finalPrefix)) {
                    numStr = numStr.substring(finalPrefix.length());
                }
                if (!finalSuffix.isEmpty() && numStr.endsWith(finalSuffix)) {
                    numStr = numStr.substring(0, numStr.length() - finalSuffix.length());
                }
                if (!numStr.isEmpty()) {
                    try {
                        long n = Long.parseLong(numStr);
                        if (n > maxNum) {
                            maxNum = n;
                        }
                    } catch (Exception ignored) {
                    }
                }
            }
            nextNum = maxNum + 1;
        } catch (Exception e) {
            System.err.println("[VisitorGatePassService] Error calculating next gate pass number: " + e.getMessage());
        }
        return finalPrefix + String.format("%0" + digits + "d", nextNum) + finalSuffix;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private String nullIfBlank(String val) {
        return (val == null || val.isBlank()) ? null : val;
    }

    private Date parseDate(String val) {
        if (val == null || val.isBlank())
            return null;
        try {
            return new SimpleDateFormat("yyyy-MM-dd").parse(val);
        } catch (Exception e) {
            return null;
        }
    }

    private Date parseToEndOfDay(String val) {
        Date d = parseDate(val);
        if (d == null)
            return null;
        Calendar cal = Calendar.getInstance();
        cal.setTime(d);
        cal.set(Calendar.HOUR_OF_DAY, 23);
        cal.set(Calendar.MINUTE, 59);
        cal.set(Calendar.SECOND, 59);
        return cal.getTime();
    }

    private Date stripTime(Date d) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(d);
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        return cal.getTime();
    }
}
