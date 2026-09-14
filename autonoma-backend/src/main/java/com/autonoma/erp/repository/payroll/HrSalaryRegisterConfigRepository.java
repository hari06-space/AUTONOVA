package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrSalaryRegisterConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HrSalaryRegisterConfigRepository extends JpaRepository<HrSalaryRegisterConfig, Long> {
    List<HrSalaryRegisterConfig> findByIsActiveTrue();
}
