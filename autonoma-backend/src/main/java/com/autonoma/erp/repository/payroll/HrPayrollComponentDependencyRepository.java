package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrPayrollComponentDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HrPayrollComponentDependencyRepository extends JpaRepository<HrPayrollComponentDependency, Long> {
    List<HrPayrollComponentDependency> findByComponentCode(String componentCode);
    void deleteByComponentCode(String componentCode);
}
