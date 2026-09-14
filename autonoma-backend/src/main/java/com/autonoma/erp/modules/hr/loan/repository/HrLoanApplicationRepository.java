package com.autonoma.erp.modules.hr.loan.repository;

import com.autonoma.erp.modules.hr.loan.entity.HrLoanApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HrLoanApplicationRepository extends JpaRepository<HrLoanApplication, Long> {
    List<HrLoanApplication> findByIsActiveTrue();
    List<HrLoanApplication> findByEmpCodeAndIsActiveTrue(String empCode);
}
