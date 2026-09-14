package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrPayrollProcessTrans;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HrPayrollProcessTransRepository extends JpaRepository<HrPayrollProcessTrans, Long> {
    List<HrPayrollProcessTrans> findByMasterId(Long masterId);
    void deleteByMasterId(Long masterId);
    void deleteByMasterIdIn(List<Long> masterIds);
}
