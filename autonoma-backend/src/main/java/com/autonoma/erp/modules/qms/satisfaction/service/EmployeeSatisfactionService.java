package com.autonoma.erp.modules.qms.satisfaction.service;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
import com.autonoma.erp.modules.qms.satisfaction.entity.*;
import com.autonoma.erp.modules.qms.satisfaction.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.*;

@Service("qmsEmployeeSatisfactionService")
@Slf4j
public class EmployeeSatisfactionService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(EmployeeSatisfactionService.class);

    private final QmsSatisfactionCriteriaRepository criteriaRepo;
    private final EmployeeSatisfactionResponseRepository responseRepo;
    private final VendorSatisfactionResponseRepository vendorResponseRepo;
    private final EmployeeSatisfactionTrackingRepository trackingRepo;
    private final EmployeeSatisfactionActivityRepository activityRepo;
    private final EmployeeMasterRepository employeeRepo;
    private final AccountLedgerRepository supplierRepo;
    private final JdbcTemplate jdbcTemplate;

    @org.springframework.beans.factory.annotation.Autowired
    public EmployeeSatisfactionService(
            QmsSatisfactionCriteriaRepository criteriaRepo,
            EmployeeSatisfactionResponseRepository responseRepo,
            VendorSatisfactionResponseRepository vendorResponseRepo,
            EmployeeSatisfactionTrackingRepository trackingRepo,
            EmployeeSatisfactionActivityRepository activityRepo,
            EmployeeMasterRepository employeeRepo,
            AccountLedgerRepository supplierRepo,
            JdbcTemplate jdbcTemplate) {
        this.criteriaRepo = criteriaRepo;
        this.responseRepo = responseRepo;
        this.vendorResponseRepo = vendorResponseRepo;
        this.trackingRepo = trackingRepo;
        this.activityRepo = activityRepo;
        this.employeeRepo = employeeRepo;
        this.supplierRepo = supplierRepo;
        this.jdbcTemplate = jdbcTemplate;
    }

    // =========================================================================
    // 1. Satisfaction Criteria Master CRUD
    // =========================================================================

    public Page<QmsSatisfactionCriteria> getCriteriaPage(String type, String criteria, Pageable pageable) {
        String cleanType = (type == null || "All".equalsIgnoreCase(type)) ? null : type;
        String cleanCriteria = (criteria == null || criteria.trim().isEmpty()) ? null : criteria;
        return criteriaRepo.findByFilters(cleanType, cleanCriteria, pageable);
    }

    public List<QmsSatisfactionCriteria> getActiveCriteriaByType(String type) {
        return criteriaRepo.findBySatisfactionTypeAndStatus(type, 1);
    }

    @Transactional
    public QmsSatisfactionCriteria saveCriteria(QmsSatisfactionCriteria criteria) {
        return criteriaRepo.save(criteria);
    }

    @Transactional
    public void deleteCriteria(Long id) {
        criteriaRepo.deleteById(id);
    }

    // =========================================================================
    // 2. Feedback Entry logic
    // =========================================================================

    public Optional<EmployeeSatisfactionTracking> getPendingTracking(Long employeeId, String cycle) {
        return trackingRepo.findByEmployeeIdAndFeedbackCycle(employeeId, cycle);
    }

    public List<EmployeeSatisfactionResponse> getSavedResponses(Long employeeId, String cycle) {
        return responseRepo.findByEmployeeIdAndFeedbackCycle(employeeId, cycle);
    }

    public List<VendorSatisfactionResponse> getSavedVendorResponses(Long vendorId, String cycle) {
        return vendorResponseRepo.findByVendorIdAndFeedbackCycle(vendorId, cycle);
    }

    @Transactional
    public void saveEmployeeDraft(Long employeeId, String cycle, List<Map<String, Object>> responses) {
        EmployeeMaster employee = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + employeeId));

        // Delete existing responses for this cycle to overwrite
        List<EmployeeSatisfactionResponse> existing = responseRepo.findByEmployeeIdAndFeedbackCycle(employeeId, cycle);
        responseRepo.deleteAll(existing);

        for (Map<String, Object> r : responses) {
            Long questionId = Long.valueOf(r.get("questionId").toString());
            String rating = r.get("rating").toString();
            Integer score = mapRatingToScore(rating);
            String comments = r.get("comments") != null ? r.get("comments").toString() : null;

            QmsSatisfactionCriteria question = criteriaRepo.findById(questionId)
                    .orElseThrow(() -> new IllegalArgumentException("Question not found with ID: " + questionId));

            EmployeeSatisfactionResponse resp = new EmployeeSatisfactionResponse();
            resp.setEmployee(employee);
            resp.setQuestion(question);
            resp.setFeedbackCycle(cycle);
            resp.setRating(rating);
            resp.setScore(score);
            resp.setComments(comments);
            resp.setSubmittedDate(new Date());
            responseRepo.save(resp);
        }

        // Add activity log
        logActivity(employee, cycle, "Feedback draft saved");
    }

    @Transactional
    public void submitEmployeeFeedback(Long employeeId, String cycle, List<Map<String, Object>> responses) {
        EmployeeMaster employee = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + employeeId));

        // Validation & Save
        List<EmployeeSatisfactionResponse> existing = responseRepo.findByEmployeeIdAndFeedbackCycle(employeeId, cycle);
        responseRepo.deleteAll(existing);

        for (Map<String, Object> r : responses) {
            Long questionId = Long.valueOf(r.get("questionId").toString());
            String rating = r.get("rating").toString();
            Integer score = mapRatingToScore(rating);
            String comments = r.get("comments") != null ? r.get("comments").toString() : null;

            if (("Moderate".equalsIgnoreCase(rating) || "Poor".equalsIgnoreCase(rating)) && (comments == null || comments.trim().isEmpty())) {
                throw new IllegalArgumentException("Comments are mandatory for Poor or Moderate ratings.");
            }

            QmsSatisfactionCriteria question = criteriaRepo.findById(questionId)
                    .orElseThrow(() -> new IllegalArgumentException("Question not found with ID: " + questionId));

            EmployeeSatisfactionResponse resp = new EmployeeSatisfactionResponse();
            resp.setEmployee(employee);
            resp.setQuestion(question);
            resp.setFeedbackCycle(cycle);
            resp.setRating(rating);
            resp.setScore(score);
            resp.setComments(comments);
            resp.setSubmittedDate(new Date());
            responseRepo.save(resp);
        }

        // Update tracking status
        EmployeeSatisfactionTracking tracking = trackingRepo.findByEmployeeIdAndFeedbackCycle(employeeId, cycle)
                .orElseGet(() -> {
                    EmployeeSatisfactionTracking t = new EmployeeSatisfactionTracking();
                    t.setEmployee(employee);
                    t.setFeedbackCycle(cycle);
                    t.setEligibilityDate(new Date());
                    return t;
                });
        
        tracking.setStatus("Completed");
        tracking.setSubmittedDate(new Date());
        tracking.setNextReminderDate(null); // No more reminders
        tracking.setEmailStatus("Submitted");
        trackingRepo.save(tracking);

        // Add activity log
        logActivity(employee, cycle, "Feedback Submitted");
    }

    @Transactional
    public void submitVendorFeedback(Long vendorId, String cycle, List<Map<String, Object>> responses) {
        AccountLedger vendor = supplierRepo.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found with ID: " + vendorId));

        List<VendorSatisfactionResponse> existing = vendorResponseRepo.findByVendorIdAndFeedbackCycle(vendorId, cycle);
        vendorResponseRepo.deleteAll(existing);

        for (Map<String, Object> r : responses) {
            Long questionId = Long.valueOf(r.get("questionId").toString());
            String rating = r.get("rating").toString();
            Integer score = mapRatingToScore(rating);
            String comments = r.get("comments") != null ? r.get("comments").toString() : null;

            if (("Moderate".equalsIgnoreCase(rating) || "Poor".equalsIgnoreCase(rating)) && (comments == null || comments.trim().isEmpty())) {
                throw new IllegalArgumentException("Comments are mandatory for Poor or Moderate ratings.");
            }

            QmsSatisfactionCriteria question = criteriaRepo.findById(questionId)
                    .orElseThrow(() -> new IllegalArgumentException("Question not found with ID: " + questionId));

            VendorSatisfactionResponse resp = new VendorSatisfactionResponse();
            resp.setVendor(vendor);
            resp.setQuestion(question);
            resp.setFeedbackCycle(cycle);
            resp.setRating(rating);
            resp.setScore(score);
            resp.setComments(comments);
            resp.setSubmittedDate(new Date());
            vendorResponseRepo.save(resp);
        }
    }

    private Integer mapRatingToScore(String rating) {
        if ("Excellent".equalsIgnoreCase(rating)) return 100;
        if ("Very Good".equalsIgnoreCase(rating)) return 75;
        if ("Good".equalsIgnoreCase(rating)) return 50;
        if ("Moderate".equalsIgnoreCase(rating)) return 25;
        if ("Poor".equalsIgnoreCase(rating)) return 0;
        return 0;
    }

    // =========================================================================
    // 3. Dashboard Analytics
    // =========================================================================

    public Map<String, Object> getDashboardCards(String cycle) {
        List<EmployeeSatisfactionTracking> trackingList = trackingRepo.findByFeedbackCycle(cycle);
        
        int totalEligible = trackingList.size();
        int completed = 0;
        int pending = 0;
        int overdue = 0;
        int awaitingReminder = 0;
        int lowSatisfaction = 0;
        double totalScoreSum = 0;
        int scoreCount = 0;

        Date today = new Date();

        for (EmployeeSatisfactionTracking t : trackingList) {
            if ("Completed".equalsIgnoreCase(t.getStatus())) {
                completed++;
                
                // Get employee score in cycle
                List<EmployeeSatisfactionResponse> resps = responseRepo.findByEmployeeIdAndFeedbackCycle(t.getEmployee().getId(), cycle);
                if (!resps.isEmpty()) {
                    double empAvg = resps.stream().mapToInt(EmployeeSatisfactionResponse::getScore).average().orElse(0.0);
                    totalScoreSum += empAvg;
                    scoreCount++;
                    if (empAvg < 50.0) {
                        lowSatisfaction++;
                    }
                }
            } else {
                if ("Overdue".equalsIgnoreCase(t.getStatus()) || (t.getNextReminderDate() != null && t.getNextReminderDate().before(today))) {
                    overdue++;
                    t.setStatus("Overdue"); // Auto update in memory/db
                    trackingRepo.save(t);
                } else {
                    pending++;
                }
                
                if (t.getNextReminderDate() != null) {
                    awaitingReminder++;
                }
            }
        }

        double completionPercentage = totalEligible > 0 ? ((double) completed / totalEligible) * 100.0 : 0.0;
        double averageScore = scoreCount > 0 ? (totalScoreSum / scoreCount) : 0.0;

        Map<String, Object> cards = new HashMap<>();
        cards.put("totalEligible", totalEligible);
        cards.put("completedFeedback", completed);
        cards.put("pendingFeedback", pending);
        cards.put("overdueFeedback", overdue);
        cards.put("completionPercentage", Math.round(completionPercentage * 100.0) / 100.0);
        cards.put("averageSatisfactionScore", Math.round(averageScore * 100.0) / 100.0);
        cards.put("awaitingReminder", awaitingReminder);
        cards.put("lowSatisfactionEmployees", lowSatisfaction);

        return cards;
    }

    public List<Map<String, Object>> getEmployeeMappings(String cycle, Long departmentId, String status, Double minScore, Double maxScore, String riskLevel) {
        List<EmployeeSatisfactionTracking> trackingList = trackingRepo.findByFeedbackCycle(cycle);
        List<Map<String, Object>> mappings = new ArrayList<>();

        for (EmployeeSatisfactionTracking t : trackingList) {
            EmployeeMaster emp = t.getEmployee();

            // Filter department
            if (departmentId != null && !departmentId.equals(emp.getDepartmentId())) {
                continue;
            }

            // Filter status
            if (status != null && !status.trim().isEmpty() && !t.getStatus().equalsIgnoreCase(status)) {
                continue;
            }

            // Calculate score & risk
            List<EmployeeSatisfactionResponse> resps = responseRepo.findByEmployeeIdAndFeedbackCycle(emp.getId(), cycle);
            double avgScore = 0.0;
            int poorCount = 0;
            int moderateCount = 0;

            if (!resps.isEmpty()) {
                avgScore = resps.stream().mapToInt(EmployeeSatisfactionResponse::getScore).average().orElse(0.0);
                for (EmployeeSatisfactionResponse r : resps) {
                    if ("Poor".equalsIgnoreCase(r.getRating())) poorCount++;
                    if ("Moderate".equalsIgnoreCase(r.getRating())) moderateCount++;
                }
            }

            // Risk Level Calculation
            String calculatedRisk = "Low";
            if (!resps.isEmpty()) {
                if (avgScore < 50.0 || poorCount >= 2) {
                    calculatedRisk = "High";
                } else if ((avgScore >= 50.0 && avgScore <= 75.0) || poorCount == 1 || moderateCount >= 2) {
                    calculatedRisk = "Medium";
                }
            }

            // Filter risk
            if (riskLevel != null && !riskLevel.trim().isEmpty() && !calculatedRisk.equalsIgnoreCase(riskLevel)) {
                continue;
            }

            // Filter score range
            if (minScore != null && avgScore < minScore) continue;
            if (maxScore != null && avgScore > maxScore) continue;

            Map<String, Object> map = new HashMap<>();
            map.put("id", t.getId());
            map.put("employeeId", emp.getId());
            map.put("empCode", emp.getEmpCode());
            map.put("employeeName", emp.getEmployeeName());
            map.put("department", emp.getDepartment() != null ? emp.getDepartment().getDepartmentName() : "-");
            map.put("designation", emp.getDesignation() != null ? emp.getDesignation().getDesignationName() : "-");
            map.put("joiningDate", emp.getDateOfJoining());
            map.put("eligibilityDate", t.getEligibilityDate());
            map.put("status", t.getStatus());
            map.put("submittedDate", t.getSubmittedDate());
            map.put("averageScore", Math.round(avgScore * 100.0) / 100.0);
            map.put("riskLevel", calculatedRisk);

            mappings.add(map);
        }

        return mappings;
    }

    public List<Map<String, Object>> getReminderTrackings(String cycle) {
        List<EmployeeSatisfactionTracking> trackingList = trackingRepo.findByFeedbackCycle(cycle);
        List<Map<String, Object>> reminders = new ArrayList<>();

        for (EmployeeSatisfactionTracking t : trackingList) {
            EmployeeMaster emp = t.getEmployee();
            Map<String, Object> r = new HashMap<>();
            r.put("employeeId", emp.getId());
            r.put("empCode", emp.getEmpCode());
            r.put("employeeName", emp.getEmployeeName());
            r.put("reminderCount", t.getReminderCount());
            r.put("firstReminderDate", t.getFirstReminderDate());
            r.put("lastReminderDate", t.getLastReminderDate());
            r.put("nextReminderDate", t.getNextReminderDate());
            r.put("emailStatus", t.getEmailStatus());
            r.put("status", t.getStatus());

            reminders.add(r);
        }
        return reminders;
    }

    public List<EmployeeSatisfactionActivity> getEmployeeTimeline(Long employeeId, String cycle) {
        return activityRepo.findByEmployeeIdAndFeedbackCycleOrderByActivityDateAsc(employeeId, cycle);
    }

    public List<EmployeeSatisfactionResponse> getEmployeeResponses(Long employeeId, String cycle) {
        return responseRepo.findByEmployeeIdAndFeedbackCycle(employeeId, cycle);
    }

    @Transactional
    public void assignFeedback(List<Long> employeeIds, String cycle, Date eligibilityDate) {
        for (Long empId : employeeIds) {
            EmployeeMaster emp = employeeRepo.findById(empId)
                    .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + empId));

            Optional<EmployeeSatisfactionTracking> existing = trackingRepo.findByEmployeeIdAndFeedbackCycle(empId, cycle);
            if (existing.isPresent()) {
                continue; // Already assigned
            }

            EmployeeSatisfactionTracking t = new EmployeeSatisfactionTracking();
            t.setEmployee(emp);
            t.setFeedbackCycle(cycle);
            t.setStatus("Pending");
            t.setEligibilityDate(eligibilityDate != null ? eligibilityDate : new Date());
            t.setReminderCount(0);
            t.setEmailStatus("Not Sent");

            // Calculate next reminder date (e.g. tomorrow, shifted to next working day)
            Calendar tomorrow = Calendar.getInstance();
            tomorrow.add(Calendar.DAY_OF_YEAR, 1);
            t.setNextReminderDate(shiftToNextWorkingDay(tomorrow.getTime()));

            trackingRepo.save(t);

            // Log activity
            logActivity(emp, cycle, "Feedback Assigned");
        }
    }

    public Map<String, Object> getChartData(String cycle) {
        List<EmployeeSatisfactionTracking> trackingList = trackingRepo.findByFeedbackCycle(cycle);
        
        // Department Comparison
        Map<String, Double> deptSum = new HashMap<>();
        Map<String, Integer> deptCount = new HashMap<>();

        // Score Distribution
        int scoreUnder50 = 0;
        int score50to75 = 0;
        int scoreOver75 = 0;

        // Completion status
        int completed = 0;
        int pending = 0;

        // Risk distribution
        int lowRisk = 0;
        int mediumRisk = 0;
        int highRisk = 0;

        for (EmployeeSatisfactionTracking t : trackingList) {
            EmployeeMaster emp = t.getEmployee();
            String deptName = emp.getDepartment() != null ? emp.getDepartment().getDepartmentName() : "Unknown";

            if ("Completed".equalsIgnoreCase(t.getStatus())) {
                completed++;
                List<EmployeeSatisfactionResponse> resps = responseRepo.findByEmployeeIdAndFeedbackCycle(emp.getId(), cycle);
                if (!resps.isEmpty()) {
                    double avgScore = resps.stream().mapToInt(EmployeeSatisfactionResponse::getScore).average().orElse(0.0);
                    
                    deptSum.put(deptName, deptSum.getOrDefault(deptName, 0.0) + avgScore);
                    deptCount.put(deptName, deptCount.getOrDefault(deptName, 0) + 1);

                    if (avgScore < 50) {
                        scoreUnder50++;
                    } else if (avgScore <= 75) {
                        score50to75++;
                    } else {
                        scoreOver75++;
                    }

                    // Calculate Risk
                    int poor = 0, moderate = 0;
                    for (EmployeeSatisfactionResponse r : resps) {
                        if ("Poor".equalsIgnoreCase(r.getRating())) poor++;
                        if ("Moderate".equalsIgnoreCase(r.getRating())) moderate++;
                    }
                    if (avgScore < 50.0 || poor >= 2) {
                        highRisk++;
                    } else if ((avgScore >= 50.0 && avgScore <= 75.0) || poor == 1 || moderate >= 2) {
                        mediumRisk++;
                    } else {
                        lowRisk++;
                    }
                }
            } else {
                pending++;
                lowRisk++; // Non-responders default to low risk or not counted, let's count only completed for risk
            }
        }

        List<Map<String, Object>> deptComparisonList = new ArrayList<>();
        for (String dept : deptSum.keySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("department", dept);
            double avg = deptSum.get(dept) / deptCount.get(dept);
            item.put("averageScore", Math.round(avg * 100.0) / 100.0);
            deptComparisonList.add(item);
        }

        Map<String, Object> charts = new HashMap<>();
        charts.put("departmentComparison", deptComparisonList);

        List<Map<String, Object>> scoreDistList = new ArrayList<>();
        scoreDistList.add(Map.of("range", "Below 50", "count", scoreUnder50));
        scoreDistList.add(Map.of("range", "50 - 75", "count", score50to75));
        scoreDistList.add(Map.of("range", "Above 75", "count", scoreOver75));
        charts.put("scoreDistribution", scoreDistList);

        charts.put("completionStatus", List.of(
            Map.of("status", "Completed", "count", completed),
            Map.of("status", "Pending", "count", pending)
        ));

        charts.put("riskDistribution", List.of(
            Map.of("risk", "High", "count", highRisk),
            Map.of("risk", "Medium", "count", mediumRisk),
            Map.of("risk", "Low", "count", lowRisk)
        ));

        return charts;
    }

    // =========================================================================
    // 4. Activity Logger
    // =========================================================================

    public void logActivity(EmployeeMaster employee, String cycle, String description) {
        EmployeeSatisfactionActivity act = new EmployeeSatisfactionActivity();
        act.setEmployee(employee);
        act.setFeedbackCycle(cycle);
        act.setActivityDate(new Date());
        act.setDescription(description);
        activityRepo.save(act);
    }

    // =========================================================================
    // Helper Calendar Methods (Weekend & Holiday shifting)
    // =========================================================================

    public List<Date> getActiveHolidayDates() {
        try {
            String sql = "SELECT HOLIDAY_DATE FROM HR_HOLIDAY_MASTER WHERE IS_ACTIVE = 1";
            return jdbcTemplate.query(sql, (rs, rowNum) -> rs.getDate("HOLIDAY_DATE"));
        } catch (Exception e) {
            log.error("Failed to fetch holidays from database: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public Date shiftToNextWorkingDay(Date date) {
        List<Date> holidays = getActiveHolidayDates();
        Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("Asia/Kolkata"));
        cal.setTime(date);

        while (!isWorkingDay(cal.getTime(), holidays)) {
            cal.add(Calendar.DAY_OF_YEAR, 1);
        }
        return cal.getTime();
    }

    private boolean isWorkingDay(Date date, List<Date> holidays) {
        Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("Asia/Kolkata"));
        cal.setTime(date);
        int dayOfWeek = cal.get(Calendar.DAY_OF_WEEK);
        
        // 1 = Sunday, 7 = Saturday
        if (dayOfWeek == Calendar.SATURDAY || dayOfWeek == Calendar.SUNDAY) {
            return false;
        }

        // Compare date format
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        sdf.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));
        String dateStr = sdf.format(date);

        for (Date h : holidays) {
            if (sdf.format(h).equals(dateStr)) {
                return false;
            }
        }
        return true;
    }
}
