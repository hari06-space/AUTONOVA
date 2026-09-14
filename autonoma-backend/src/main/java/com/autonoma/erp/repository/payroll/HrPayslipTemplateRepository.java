package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrPayslipTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface HrPayslipTemplateRepository extends JpaRepository<HrPayslipTemplate, Long> {
    Optional<HrPayslipTemplate> findByIsDefaultTrue();
}
