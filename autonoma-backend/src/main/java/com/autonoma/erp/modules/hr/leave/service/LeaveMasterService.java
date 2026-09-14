package com.autonoma.erp.modules.hr.leave.service;

import com.autonoma.erp.modules.hr.leave.entity.LeaveMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.leave.entity.LeaveTransaction;
import com.autonoma.erp.modules.hr.leave.repository.LeaveMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.leave.repository.LeaveTransactionRepository;
import com.autonoma.erp.modules.hr.leave.repository.LeaveConfigRepository;
import com.autonoma.erp.modules.hr.leave.entity.LeaveConfig;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.Date;
import java.util.Calendar;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Service
public class LeaveMasterService {

    @Autowired
    private LeaveMasterRepository leaveMasterRepo;

    @Autowired
    private EmployeeMasterRepository employeeRepo;

    @Autowired
    private LeaveTransactionRepository leaveTransRepo;

    @Autowired
    private LeaveConfigRepository leaveConfigRepo;

    public List<LeaveMaster> getAllLeaveMasters() {
        List<LeaveMaster> list = leaveMasterRepo.findAllWithEmployeeOrderByCreatedDateDesc();
        // Ensure consistent REF_NO format LM/<EMP_CODE>
        for (LeaveMaster lm : list) {
            if (lm.getEmployee() != null && (lm.getRefNo() == null || lm.getRefNo().trim().isEmpty())) {
                lm.setRefNo("LM/" + lm.getEmployee().getEmpCode());
                leaveMasterRepo.save(lm);
            }
        }
        return list;
    }

    @Transactional
    public LeaveMaster saveLeaveMaster(LeaveMaster leaveMaster) {
        Long empId = leaveMaster.getEmployeeId();
        EmployeeMaster emp = employeeRepo.findById(empId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + empId));

        // Evaluate working days credit first so we base manual adjustment diffs on the absolute latest balances
        checkAndApplyWorkingDaysCredits(empId);

        Optional<LeaveMaster> existingOpt = leaveMasterRepo.findByEmployeeId(empId);
        LeaveMaster lm;

        if (existingOpt.isPresent()) {
            LeaveMaster existing = existingOpt.get();
            
            // Log adjustments/leaves as transactions
            logDifference(empId, "EL", existing.getEl(), leaveMaster.getEl());
            logDifference(empId, "CL", existing.getCl(), leaveMaster.getCl());
            logDifference(empId, "SL", existing.getSl(), leaveMaster.getSl());
            logDifference(empId, "AL", existing.getAl(), leaveMaster.getAl());
            logDifference(empId, "PL", existing.getPl(), leaveMaster.getPl());

            existing.setEl(leaveMaster.getEl());
            existing.setCl(leaveMaster.getCl());
            existing.setSl(leaveMaster.getSl());
            existing.setAl(leaveMaster.getAl());
            existing.setPl(leaveMaster.getPl());
            
            if (existing.getRefNo() == null || existing.getRefNo().trim().isEmpty()) {
                existing.setRefNo("LM/" + emp.getEmpCode());
            }

            existing.setStatus(leaveMaster.getStatus());
            lm = leaveMasterRepo.save(existing);
        } else {
            // New record
            leaveMaster.setRefNo("LM/" + emp.getEmpCode());
            lm = leaveMasterRepo.save(leaveMaster);
            
            // Log all initial setup values as credits
            logInitialSetup(empId, "EL", lm.getEl());
            logInitialSetup(empId, "CL", lm.getCl());
            logInitialSetup(empId, "SL", lm.getSl());
            logInitialSetup(empId, "AL", lm.getAl());
            logInitialSetup(empId, "PL", lm.getPl());
        }
        
        return lm;
    }

    @Transactional
    public void deleteLeaveMaster(Long id) {
        LeaveMaster record = leaveMasterRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave Master record not found with ID: " + id));
        record.setStatus(false);
        leaveMasterRepo.save(record);
    }

    @Transactional
    public void checkAndApplyWorkingDaysCredits(Long employeeId) {
        EmployeeMaster emp = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        Date startDate = emp.getDateOfJoining();
        if (startDate == null) {
            startDate = emp.getCreatedDate() != null ? emp.getCreatedDate() : new Date();
        }
        Date endDate = new Date();

        // Dynamically fetch active EL LeaveConfig
        List<LeaveConfig> activeConfigs = leaveConfigRepo.findByStatus("ACTIVE");
        LeaveConfig targetConfig = null;
        for (LeaveConfig c : activeConfigs) {
            if ("EL".equalsIgnoreCase(c.getLeaveType()) || "Earned Leave".equalsIgnoreCase(c.getLeaveType())) {
                targetConfig = c;
                break;
            }
        }

        BigDecimal monthlyRate = new BigDecimal("1.0");
        if (targetConfig != null && targetConfig.getMonthlyCreditRate() != null && targetConfig.getMonthlyCreditRate() > 0) {
            monthlyRate = BigDecimal.valueOf(targetConfig.getMonthlyCreditRate());
        } else if (targetConfig != null && targetConfig.getAnnualQuota() != null && targetConfig.getAnnualQuota() > 0) {
            monthlyRate = BigDecimal.valueOf(targetConfig.getAnnualQuota()).divide(new BigDecimal("12.0"), 2, java.math.RoundingMode.HALF_UP);
        }

        Calendar startCal = Calendar.getInstance();
        startCal.setTime(startDate);
        Calendar endCal = Calendar.getInstance();
        endCal.setTime(endDate);
        int months = (endCal.get(Calendar.YEAR) - startCal.get(Calendar.YEAR)) * 12 + (endCal.get(Calendar.MONTH) - startCal.get(Calendar.MONTH));
        if (months < 0) months = 0;

        int creditsDue = monthlyRate.multiply(new BigDecimal(months)).intValue();

        BigDecimal alreadyCredited = leaveTransRepo.getSumOfWorkingDayCredits(employeeId);
        int diff = creditsDue - alreadyCredited.intValue();

        if (diff >= 1) {
            Optional<LeaveMaster> lmOpt = leaveMasterRepo.findByEmployeeId(employeeId);
            LeaveMaster lm;
            if (lmOpt.isPresent()) {
                lm = lmOpt.get();
                BigDecimal updatedEl = lm.getEl().add(new BigDecimal(diff));
                if (targetConfig != null && Boolean.TRUE.equals(targetConfig.getAllowCarryForward()) && targetConfig.getMaxCarryForwardDays() != null && targetConfig.getMaxCarryForwardDays() > 0) {
                    BigDecimal maxCarry = BigDecimal.valueOf(targetConfig.getMaxCarryForwardDays());
                    if (updatedEl.compareTo(maxCarry) > 0) {
                        updatedEl = maxCarry;
                    }
                }
                lm.setEl(updatedEl);
            } else {
                lm = new LeaveMaster();
                lm.setEmployeeId(employeeId);
                lm.setRefNo("LM/" + emp.getEmpCode());
                BigDecimal initialEl = new BigDecimal(diff);
                if (targetConfig != null && Boolean.TRUE.equals(targetConfig.getAllowCarryForward()) && targetConfig.getMaxCarryForwardDays() != null && targetConfig.getMaxCarryForwardDays() > 0) {
                    BigDecimal maxCarry = BigDecimal.valueOf(targetConfig.getMaxCarryForwardDays());
                    if (initialEl.compareTo(maxCarry) > 0) {
                        initialEl = maxCarry;
                    }
                }
                lm.setEl(initialEl);
                lm.setStatus(true);
            }
            if (lm.getRefNo() == null || lm.getRefNo().trim().isEmpty()) {
                lm.setRefNo("LM/" + emp.getEmpCode());
            }
            leaveMasterRepo.save(lm);

            // Log ledger transaction
            LeaveTransaction trans = new LeaveTransaction();
            trans.setEmployeeId(employeeId);
            trans.setTransactionDate(new Date());
            trans.setTransactionType("CREDIT");
            trans.setLeaveType("EL");
            trans.setCrQty(new BigDecimal(diff));
            trans.setDrQty(BigDecimal.ZERO);
            trans.setAvlQty(lm.getEl());
            trans.setRemarks("Monthly Leave Accrual Credit");
            leaveTransRepo.save(trans);
        }
    }

    @Transactional
    public void checkAndApplyWorkingDaysCreditsForAll() {
        List<EmployeeMaster> activeEmployees = employeeRepo.findByStatus("Active");

        // Fetch all existing Leave Masters
        List<LeaveMaster> allMasters = leaveMasterRepo.findAll();
        Map<Long, LeaveMaster> masterMap = new HashMap<>();
        for (LeaveMaster lm : allMasters) {
            masterMap.put(lm.getEmployeeId(), lm);
        }

        // Fetch all already credited sums
        Map<Long, BigDecimal> creditsMap = new HashMap<>();
        List<Object[]> results = leaveTransRepo.getSumOfWorkingDayCreditsForAll();
        for (Object[] row : results) {
            creditsMap.put((Long) row[0], (BigDecimal) row[1]);
        }

        Date endDate = new Date();

        // Dynamically fetch active EL LeaveConfig
        List<LeaveConfig> activeConfigs = leaveConfigRepo.findByStatus("ACTIVE");
        LeaveConfig targetConfig = null;
        for (LeaveConfig c : activeConfigs) {
            if ("EL".equalsIgnoreCase(c.getLeaveType()) || "Earned Leave".equalsIgnoreCase(c.getLeaveType())) {
                targetConfig = c;
                break;
            }
        }

        BigDecimal monthlyRate = new BigDecimal("1.0");
        if (targetConfig != null && targetConfig.getMonthlyCreditRate() != null && targetConfig.getMonthlyCreditRate() > 0) {
            monthlyRate = BigDecimal.valueOf(targetConfig.getMonthlyCreditRate());
        } else if (targetConfig != null && targetConfig.getAnnualQuota() != null && targetConfig.getAnnualQuota() > 0) {
            monthlyRate = BigDecimal.valueOf(targetConfig.getAnnualQuota()).divide(new BigDecimal("12.0"), 2, java.math.RoundingMode.HALF_UP);
        }

        for (EmployeeMaster emp : activeEmployees) {
            Date startDate = emp.getDateOfJoining();
            if (startDate == null) {
                startDate = emp.getCreatedDate() != null ? emp.getCreatedDate() : new Date();
            }

            Calendar startCal = Calendar.getInstance();
            startCal.setTime(startDate);
            Calendar endCal = Calendar.getInstance();
            endCal.setTime(endDate);
            int months = (endCal.get(Calendar.YEAR) - startCal.get(Calendar.YEAR)) * 12 + (endCal.get(Calendar.MONTH) - startCal.get(Calendar.MONTH));
            if (months < 0) months = 0;

            int creditsDue = monthlyRate.multiply(new BigDecimal(months)).intValue();

            BigDecimal alreadyCredited = creditsMap.getOrDefault(emp.getId(), BigDecimal.ZERO);
            int diff = creditsDue - alreadyCredited.intValue();

            LeaveMaster lm = masterMap.get(emp.getId());
            boolean needsSave = false;

            if (lm == null) {
                lm = new LeaveMaster();
                lm.setEmployeeId(emp.getId());
                lm.setRefNo("LM/" + emp.getEmpCode());
                lm.setEl(BigDecimal.ZERO);
                lm.setStatus(true);
                masterMap.put(emp.getId(), lm);
                needsSave = true;
            }

            if (lm.getRefNo() == null || lm.getRefNo().trim().isEmpty()) {
                lm.setRefNo("LM/" + emp.getEmpCode());
                needsSave = true;
            }

            if (diff >= 1) {
                BigDecimal updatedEl = lm.getEl().add(new BigDecimal(diff));
                if (targetConfig != null && Boolean.TRUE.equals(targetConfig.getAllowCarryForward()) && targetConfig.getMaxCarryForwardDays() != null && targetConfig.getMaxCarryForwardDays() > 0) {
                    BigDecimal maxCarry = BigDecimal.valueOf(targetConfig.getMaxCarryForwardDays());
                    if (updatedEl.compareTo(maxCarry) > 0) {
                        updatedEl = maxCarry;
                    }
                }
                lm.setEl(updatedEl);
                needsSave = true;
 
                // Log ledger transaction
                LeaveTransaction trans = new LeaveTransaction();
                trans.setEmployeeId(emp.getId());
                trans.setTransactionDate(new Date());
                trans.setTransactionType("CREDIT");
                trans.setLeaveType("EL");
                trans.setCrQty(new BigDecimal(diff));
                trans.setDrQty(BigDecimal.ZERO);
                trans.setAvlQty(lm.getEl());
                trans.setRemarks("Working Days Credit");
                leaveTransRepo.save(trans);
            } else if (targetConfig != null && Boolean.TRUE.equals(targetConfig.getAllowCarryForward()) && targetConfig.getMaxCarryForwardDays() != null && lm.getEl().compareTo(BigDecimal.valueOf(targetConfig.getMaxCarryForwardDays())) > 0) {
                lm.setEl(BigDecimal.valueOf(targetConfig.getMaxCarryForwardDays()));
                needsSave = true;
            }

            if (needsSave) {
                leaveMasterRepo.save(lm);
            }
        }
    }

    private int getWorkingDaysExcludingSundays(Date startDate, Date endDate) {
        if (startDate == null || endDate == null || startDate.after(endDate)) {
            return 0;
        }

        Calendar startCal = Calendar.getInstance();
        startCal.setTime(startDate);
        startCal.set(Calendar.HOUR_OF_DAY, 0);
        startCal.set(Calendar.MINUTE, 0);
        startCal.set(Calendar.SECOND, 0);
        startCal.set(Calendar.MILLISECOND, 0);

        Calendar endCal = Calendar.getInstance();
        endCal.setTime(endDate);
        endCal.set(Calendar.HOUR_OF_DAY, 0);
        endCal.set(Calendar.MINUTE, 0);
        endCal.set(Calendar.SECOND, 0);
        endCal.set(Calendar.MILLISECOND, 0);

        long startTime = startCal.getTimeInMillis();
        long endTime = endCal.getTimeInMillis();

        if (startTime > endTime) {
            return 0;
        }

        long totalDays = ((endTime - startTime) / (24 * 60 * 60 * 1000)) + 1;
        long weeks = totalDays / 7;
        long workDays = weeks * 6; // 6 working days per week

        long remainder = totalDays % 7;
        int startDayOfWeek = startCal.get(Calendar.DAY_OF_WEEK);

        for (int i = 0; i < remainder; i++) {
            int currentDayOfWeek = ((startDayOfWeek - 1 + i) % 7) + 1;
            if (currentDayOfWeek != Calendar.SUNDAY) {
                workDays++;
            }
        }

        return (int) workDays;
    }

    private void logDifference(Long employeeId, String leaveType, BigDecimal oldVal, BigDecimal newVal) {
        if (oldVal == null) oldVal = BigDecimal.ZERO;
        if (newVal == null) newVal = BigDecimal.ZERO;

        BigDecimal diff = newVal.subtract(oldVal);
        if (diff.compareTo(BigDecimal.ZERO) == 0) return;

        LeaveTransaction trans = new LeaveTransaction();
        trans.setEmployeeId(employeeId);
        trans.setTransactionDate(new Date());
        if (diff.compareTo(BigDecimal.ZERO) > 0) {
            trans.setTransactionType("CREDIT");
            trans.setCrQty(diff);
            trans.setDrQty(BigDecimal.ZERO);
            trans.setRemarks("Manual adjustment credit");
        } else {
            trans.setTransactionType("DEBIT");
            trans.setCrQty(BigDecimal.ZERO);
            trans.setDrQty(diff.negate());
            trans.setRemarks("Leave taken / Manual debit");
        }
        trans.setLeaveType(leaveType);
        trans.setAvlQty(newVal);
        leaveTransRepo.save(trans);
    }

    private void logInitialSetup(Long employeeId, String leaveType, BigDecimal val) {
        if (val == null || val.compareTo(BigDecimal.ZERO) == 0) return;

        LeaveTransaction trans = new LeaveTransaction();
        trans.setEmployeeId(employeeId);
        trans.setTransactionDate(new Date());
        trans.setTransactionType("CREDIT");
        trans.setLeaveType(leaveType);
        trans.setCrQty(val);
        trans.setDrQty(BigDecimal.ZERO);
        trans.setAvlQty(val);
        trans.setRemarks("Initial Balance Setup");
        leaveTransRepo.save(trans);
    }

    public List<LeaveTransaction> getAllTransactions() {
        return leaveTransRepo.findAllActiveWithEmployeeOrderByTransactionDateDesc();
    }
}
