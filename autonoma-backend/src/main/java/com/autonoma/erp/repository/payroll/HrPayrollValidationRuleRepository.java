package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrPayrollValidationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HrPayrollValidationRuleRepository extends JpaRepository<HrPayrollValidationRule, Long> {
    List<HrPayrollValidationRule> findByIsEnabledTrue();
}
