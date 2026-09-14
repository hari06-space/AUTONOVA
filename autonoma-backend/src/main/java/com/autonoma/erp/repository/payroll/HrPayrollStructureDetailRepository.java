package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrPayrollStructureDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HrPayrollStructureDetailRepository extends JpaRepository<HrPayrollStructureDetail, Long> {
    List<HrPayrollStructureDetail> findByStructureId(Long structureId);
    void deleteByStructureId(Long structureId);
    boolean existsByComponentRowId(Long rowId);
}
