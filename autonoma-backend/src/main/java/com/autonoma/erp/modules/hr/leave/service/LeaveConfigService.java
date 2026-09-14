package com.autonoma.erp.modules.hr.leave.service;

import com.autonoma.erp.modules.hr.leave.entity.LeaveConfig;
import com.autonoma.erp.modules.hr.leave.repository.LeaveConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class LeaveConfigService {

    @Autowired
    private LeaveConfigRepository leaveConfigRepository;

    public List<LeaveConfig> getAll() {
        return leaveConfigRepository.findAll();
    }

    public Optional<LeaveConfig> getById(Long id) {
        return leaveConfigRepository.findById(id);
    }

    @Transactional
    public LeaveConfig save(LeaveConfig entity, String user) {
        if ("ACTIVE".equalsIgnoreCase(entity.getStatus())) {
            List<LeaveConfig> others = leaveConfigRepository.findByLeaveTypeAndEmpTypeAndStatus(
                entity.getLeaveType(), entity.getEmpType(), "ACTIVE"
            );
            for (LeaveConfig other : others) {
                if (entity.getId() == null || !other.getId().equals(entity.getId())) {
                    other.setStatus("IN ACTIVE");
                    leaveConfigRepository.save(other);
                }
            }
        }

        if (entity.getId() != null) {
            LeaveConfig existing = leaveConfigRepository.findById(entity.getId())
                    .orElseThrow(() -> new RuntimeException("Leave configuration not found."));
            existing.setLeaveType(entity.getLeaveType());
            existing.setLeaveCode(entity.getLeaveCode());
            existing.setLeaveName(entity.getLeaveName());
            existing.setEmpType(entity.getEmpType());
            existing.setCondition(entity.getCondition());
            existing.setCreditValue(entity.getCreditValue());
            existing.setAnnualQuota(entity.getAnnualQuota());
            existing.setMonthlyCreditRate(entity.getMonthlyCreditRate());
            existing.setAccrualFrequency(entity.getAccrualFrequency());
            existing.setAllowCarryForward(entity.getAllowCarryForward());
            existing.setMaxCarryForwardDays(entity.getMaxCarryForwardDays());
            existing.setCarryForwardExpiryMonths(entity.getCarryForwardExpiryMonths());
            existing.setAllowEncashment(entity.getAllowEncashment());
            existing.setMinBalanceToRetain(entity.getMinBalanceToRetain());
            existing.setMaxEncashableDays(entity.getMaxEncashableDays());
            existing.setGenderEligibility(entity.getGenderEligibility());
            existing.setProbationAllowed(entity.getProbationAllowed());
            existing.setMinServiceMonths(entity.getMinServiceMonths());
            existing.setSandwichRuleApplies(entity.getSandwichRuleApplies());
            existing.setIncludeWeekends(entity.getIncludeWeekends());
            existing.setIncludeHolidays(entity.getIncludeHolidays());
            existing.setMaxConsecutiveDays(entity.getMaxConsecutiveDays());
            existing.setAllowHalfDay(entity.getAllowHalfDay());
            existing.setAllowHourly(entity.getAllowHourly());
            existing.setApprovalLevels(entity.getApprovalLevels());
            existing.setDocumentRequired(entity.getDocumentRequired());
            existing.setDocumentThresholdDays(entity.getDocumentThresholdDays());
            existing.setAutoCreditPolicy(entity.getAutoCreditPolicy());
            existing.setAllowNegativeBalance(entity.getAllowNegativeBalance());
            existing.setEffectiveFromDate(entity.getEffectiveFromDate());
            existing.setEffectiveToDate(entity.getEffectiveToDate());
            existing.setStatus(entity.getStatus());
            existing.setUpdatedBy(user);
            return leaveConfigRepository.save(existing);
        } else {
            entity.setCreatedBy(user);
            if (entity.getStatus() == null) {
                entity.setStatus("ACTIVE");
            }
            return leaveConfigRepository.save(entity);
        }
    }

    @Transactional
    public void delete(Long id) {
        leaveConfigRepository.deleteById(id);
    }
}
