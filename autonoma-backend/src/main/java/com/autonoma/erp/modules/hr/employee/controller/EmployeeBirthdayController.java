package com.autonoma.erp.modules.hr.employee.controller;

import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.modules.hr.employee.dto.EmployeeBirthdayDto;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeBirthdayLog;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeBirthdayWish;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeePersonalDetail;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeBirthdayLogRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeBirthdayWishRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeePersonalDetailRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.modules.hr.employee.dto.EmployeeBirthdayWishDto;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.modules.platform.notification.entity.AppNotification;
import com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository;
import com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster;
import com.autonoma.erp.modules.hr.holiday.repository.HrHolidayMasterRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@RestController
@RequestMapping("/api/master/hr/employees/birthdays")
@CrossOrigin(origins = "*", maxAge = 3600)
@Tag(name = "HRM - Employee Birthdays", description = "Endpoints for employee birthdays and tracking greeting popups")
public class EmployeeBirthdayController {

    @Autowired
    private EmployeeMasterRepository employeeMasterRepository;

    @Autowired
    private EmployeePersonalDetailRepository personalRepo;

    @Autowired
    private EmployeeBirthdayLogRepository birthdayLogRepository;

    @Autowired
    private EmployeeBirthdayWishRepository birthdayWishRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppNotificationRepository appNotificationRepository;

    @Autowired
    private HrHolidayMasterRepository hrHolidayMasterRepository;

    @GetMapping("/upcoming")
    @Operation(summary = "Get active employees with birthdays in the current month that are upcoming or today")
    public ResponseEntity<List<EmployeeBirthdayDto>> getUpcomingBirthdays() {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        LocalDate today = LocalDate.now();
        int month = today.getMonthValue();
        int day = today.getDayOfMonth();

        List<EmployeeBirthdayDto> birthdays = employeeMasterRepository.findUpcomingBirthdays(month, day);
        return ResponseEntity.ok(birthdays);
    }

    @GetMapping("/check-today-popup")
    @Operation(summary = "Check if the logged-in user has a birthday today and hasn't seen the greeting popup yet")
    public ResponseEntity<Map<String, Object>> checkTodayPopup() {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("showPopup", false);

        // Find user
        Optional<UserCredential> userOpt = userRepository.findByUserId(currentUserId);
        if (!userOpt.isPresent() || userOpt.get().getEmpId() == null) {
            return ResponseEntity.ok(response);
        }

        Long empId = userOpt.get().getEmpId();

        // Check if employee is active
        Optional<EmployeeMaster> empOpt = employeeMasterRepository.findById(empId);
        if (!empOpt.isPresent() || empOpt.get().getStatus() == null || !"Active".equalsIgnoreCase(empOpt.get().getStatus().getName())) {
            return ResponseEntity.ok(response);
        }

        // Get personal detail (for birthdate)
        Optional<EmployeePersonalDetail> personalOpt = personalRepo.findFirstByEmployeeId(empId);
        if (!personalOpt.isPresent() || personalOpt.get().getBirthDate() == null) {
            return ResponseEntity.ok(response);
        }

        Date birthDate = personalOpt.get().getBirthDate();
        Calendar cal = Calendar.getInstance();
        cal.setTime(birthDate);
        int dobMonth = cal.get(Calendar.MONTH) + 1; // 0-indexed
        int dobDay = cal.get(Calendar.DAY_OF_MONTH);

        LocalDate today = LocalDate.now();
        int curMonth = today.getMonthValue();
        int curDay = today.getDayOfMonth();

        // Compare month and day
        if (dobMonth == curMonth && dobDay == curDay) {
            int currentYear = today.getYear();
            boolean alreadyShown = birthdayLogRepository.existsByEmployeeIdAndBirthdayYear(empId, currentYear);
            if (!alreadyShown) {
                response.put("showPopup", true);
                response.put("employeeName", empOpt.get().getEmployeeName());
                response.put("photoPath", empOpt.get().getEmployeePhotoUpload());
                response.put("empCode", empOpt.get().getEmpCode());
            }
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/mark-popup-shown")
    @Operation(summary = "Mark the birthday greeting popup as shown for the current employee and current year")
    public ResponseEntity<Map<String, Object>> markPopupShown() {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        // Find user
        Optional<UserCredential> userOpt = userRepository.findByUserId(currentUserId);
        if (!userOpt.isPresent() || userOpt.get().getEmpId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not mapped to an employee"));
        }

        Long empId = userOpt.get().getEmpId();
        int currentYear = LocalDate.now().getYear();

        // Check if already logged
        boolean alreadyShown = birthdayLogRepository.existsByEmployeeIdAndBirthdayYear(empId, currentYear);
        if (!alreadyShown) {
            EmployeeBirthdayLog log = new EmployeeBirthdayLog();
            log.setEmployeeId(empId);
            log.setBirthdayYear(currentYear);
            log.setPopupShown(true);
            log.setShownDate(new Date());
            log.setCreatedBy(currentUserId);
            log.setCreatedDate(new Date());
            birthdayLogRepository.save(log);
        }

        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/send-wish")
    @Operation(summary = "Send a birthday wish to an employee")
    public ResponseEntity<Map<String, Object>> sendWish(@RequestBody Map<String, Object> payload) {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        Optional<UserCredential> userOpt = userRepository.findByUserId(currentUserId);
        if (!userOpt.isPresent() || userOpt.get().getEmpId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not mapped to an employee"));
        }
        Long senderEmpId = userOpt.get().getEmpId();

        Object recipientIdObj = payload.get("recipientEmployeeId");
        if (recipientIdObj == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Recipient employee ID is required"));
        }
        Long recipientEmpId = Long.valueOf(recipientIdObj.toString());

        String message = (String) payload.get("message");
        if (message == null || message.trim().isEmpty()) {
            message = "Wishing you a wonderful year ahead filled with happiness and success! 🎉";
        }

        int currentYear = LocalDate.now().getYear();

        boolean alreadySent = birthdayWishRepository.existsByRecipientEmployeeIdAndSenderEmployeeIdAndWishYear(
                recipientEmpId, senderEmpId, currentYear);

        if (alreadySent) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "You have already sent a wish to this colleague for this year!"));
        }

        EmployeeBirthdayWish wish = new EmployeeBirthdayWish();
        wish.setRecipientEmployeeId(recipientEmpId);
        wish.setSenderEmployeeId(senderEmpId);
        wish.setWishYear(currentYear);
        wish.setMessage(message);
        wish.setCreatedBy(currentUserId);
        wish.setCreatedDate(new Date());

        birthdayWishRepository.save(wish);

        // Send Wish notification to recipient
        try {
            String senderName = "Colleague";
            Optional<EmployeeMaster> senderOpt = employeeMasterRepository.findById(senderEmpId);
            if (senderOpt.isPresent()) {
                senderName = senderOpt.get().getEmployeeName();
            }
            AppNotification notification = new AppNotification();
            notification.setRecipientEmpId(recipientEmpId);
            notification.setTitle("New Birthday Wish! 🎉");
            notification.setMessage(senderName + " sent you a birthday wish: \"" + message + "\"");
            notification.setLinkUrl("/");
            appNotificationRepository.save(notification);
        } catch (Exception e) {
            // Ignore to not fail the transaction if notification fails
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Wish sent successfully!"));
    }

    @GetMapping("/my-wishes")
    @Operation(summary = "Get all birthday wishes received by the current employee for the current year")
    public ResponseEntity<List<EmployeeBirthdayWishDto>> getMyWishes() {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        Optional<UserCredential> userOpt = userRepository.findByUserId(currentUserId);
        if (!userOpt.isPresent() || userOpt.get().getEmpId() == null) {
            return ResponseEntity.badRequest().build();
        }
        Long empId = userOpt.get().getEmpId();
        int currentYear = LocalDate.now().getYear();

        List<EmployeeBirthdayWish> wishes = birthdayWishRepository
                .findByRecipientEmployeeIdAndWishYearOrderByCreatedDateDesc(empId, currentYear);

        List<EmployeeBirthdayWishDto> dtos = new ArrayList<>();
        for (EmployeeBirthdayWish wish : wishes) {
            EmployeeBirthdayWishDto dto = new EmployeeBirthdayWishDto();
            dto.setId(wish.getId());
            dto.setRecipientEmployeeId(wish.getRecipientEmployeeId());
            dto.setSenderEmployeeId(wish.getSenderEmployeeId());
            dto.setMessage(wish.getMessage());
            dto.setCreatedDate(wish.getCreatedDate());

            Optional<EmployeeMaster> senderOpt = employeeMasterRepository.findById(wish.getSenderEmployeeId());
            if (senderOpt.isPresent()) {
                dto.setSenderName(senderOpt.get().getEmployeeName());
                dto.setSenderPhotoPath(senderOpt.get().getEmployeePhotoUpload());
                dto.setSenderDesignation(
                        senderOpt.get().getDesignation() != null ? senderOpt.get().getDesignation().getDesignationName()
                                : null);
            } else {
                dto.setSenderName("Colleague");
            }
            dtos.add(dto);
        }

        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/send-thank-you")
    @Operation(summary = "Send thank you notifications to all employees who sent birthday wishes to the logged-in user this year")
    public ResponseEntity<Map<String, Object>> sendThankYou() {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        Optional<UserCredential> userOpt = userRepository.findByUserId(currentUserId);
        if (!userOpt.isPresent() || userOpt.get().getEmpId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not mapped to an employee"));
        }
        Long empId = userOpt.get().getEmpId();

        Optional<EmployeeMaster> empOpt = employeeMasterRepository.findById(empId);
        if (!empOpt.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Employee details not found"));
        }
        String empName = empOpt.get().getEmployeeName();

        int currentYear = LocalDate.now().getYear();

        // Get all wishes sent to the logged-in employee this year
        List<EmployeeBirthdayWish> wishes = birthdayWishRepository
                .findByRecipientEmployeeIdAndWishYearOrderByCreatedDateDesc(empId, currentYear);

        List<AppNotification> notifications = new ArrayList<>();
        for (EmployeeBirthdayWish wish : wishes) {
            AppNotification notification = new AppNotification();
            notification.setRecipientEmpId(wish.getSenderEmployeeId());
            notification.setTitle("Birthday Thanks! 🎉");
            notification.setMessage(empName + " says: Thank you so much for your warm birthday wishes! ❤️");
            notification.setIsRead(false);
            notifications.add(notification);
        }

        if (!notifications.isEmpty()) {
            appNotificationRepository.saveAll(notifications);
        }

        return ResponseEntity.ok(Map.of("success", true, "count", notifications.size()));
    }

    @GetMapping("/check-special-days")
    @Operation(summary = "Check if the logged-in user has an anniversary today, or if a holiday is coming up that warrants wishes")
    public ResponseEntity<Map<String, Object>> checkSpecialDays() {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("showAnniversaryPopup", false);
        response.put("showHolidayPopup", false);

        // Find user
        Optional<UserCredential> userOpt = userRepository.findByUserId(currentUserId);
        Long empId = null;
        String employeeName = "User";
        String empCode = "SYSTEM";
        String photoPath = null;

        if (userOpt.isPresent()) {
            UserCredential credential = userOpt.get();
            empId = credential.getEmpId();
            if (empId != null) {
                Optional<EmployeeMaster> empOpt = employeeMasterRepository.findById(empId);
                if (empOpt.isPresent() && empOpt.get().getStatus() != null && "Active".equalsIgnoreCase(empOpt.get().getStatus().getName())) {
                    employeeName = empOpt.get().getEmployeeName();
                    empCode = empOpt.get().getEmpCode();
                    photoPath = empOpt.get().getEmployeePhotoUpload();
                    
                    // Check Work Anniversary
                    Date doj = empOpt.get().getDateOfJoining();
                    if (doj != null) {
                        Calendar cal = Calendar.getInstance();
                        cal.setTime(doj);
                        int jMonth = cal.get(Calendar.MONTH) + 1;
                        int jDay = cal.get(Calendar.DAY_OF_MONTH);

                        LocalDate today = LocalDate.now();
                        if (jMonth == today.getMonthValue() && jDay == today.getDayOfMonth()) {
                            response.put("showWorkAnniversaryPopup", true);
                            response.put("joiningDate", doj.toString());
                            int years = today.getYear() - cal.get(Calendar.YEAR);
                            response.put("yearsOfWork", years);
                        }
                    }
                }
            } else {
                employeeName = credential.getUserId() != null ? credential.getUserId() : "System Admin";
            }
        }

        response.put("employeeName", employeeName);
        response.put("photoPath", photoPath);
        response.put("empCode", empCode);

        LocalDate today = LocalDate.now();
        int curMonth = today.getMonthValue();
        int curDay = today.getDayOfMonth();

        // Get personal detail (for marriage date)
        if (empId != null) {
            Optional<EmployeePersonalDetail> personalOpt = personalRepo.findFirstByEmployeeId(empId);
            if (personalOpt.isPresent() && personalOpt.get().getMarriageDate() != null) {
                Date marriageDate = personalOpt.get().getMarriageDate();
                Calendar cal = Calendar.getInstance();
                cal.setTime(marriageDate);
                int mMonth = cal.get(Calendar.MONTH) + 1; // 0-indexed
                int mDay = cal.get(Calendar.DAY_OF_MONTH);

                if (mMonth == curMonth && mDay == curDay) {
                    response.put("showAnniversaryPopup", true);
                    response.put("marriageDate", marriageDate.toString());
                    int years = today.getYear() - cal.get(Calendar.YEAR);
                    response.put("yearsOfMarriage", years);
                }
            }
        }

        // Check holidays
        List<HrHolidayMaster> allHolidays = hrHolidayMasterRepository.findAll();
        for (HrHolidayMaster holiday : allHolidays) {
            if (holiday.getIsActive() != null && holiday.getIsActive() && holiday.getHolidayDate() != null) {
                LocalDate holidayDate = holiday.getHolidayDate();
                
                // Rule logic:
                // Start with day before
                LocalDate wishDate = holidayDate.minusDays(1);
                
                // While wishDate is a Sunday or another active holiday, shift it back
                while (wishDate.getDayOfWeek() == java.time.DayOfWeek.SUNDAY || isHolidayDate(wishDate, allHolidays)) {
                    wishDate = wishDate.minusDays(1);
                }

                // If today is the calculated wish date or the holiday date itself, trigger holiday popup
                if (today.equals(wishDate) || today.equals(holidayDate)) {
                    response.put("showHolidayPopup", true);
                    response.put("holidayName", holiday.getHolidayName());
                    response.put("holidayDate", holidayDate.toString());
                    response.put("holidayType", holiday.getHolidayType());
                    
                    // Is it advanced wish? (If wish date is more than 1 day before the holiday)
                    boolean isAdvanced = today.isBefore(holidayDate.minusDays(1));
                    response.put("isAdvancedWish", isAdvanced);
                    break;
                }
            }
        }

        return ResponseEntity.ok(response);
    }

    private boolean isHolidayDate(LocalDate date, List<HrHolidayMaster> allHolidays) {
        for (HrHolidayMaster h : allHolidays) {
            if (h.getIsActive() != null && h.getIsActive() && h.getHolidayDate() != null && h.getHolidayDate().equals(date)) {
                return true;
            }
        }
        return false;
    }
}
