package com.autonoma.erp.modules.hr.loan.repository;

import com.autonoma.erp.modules.hr.loan.entity.HrLoanIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HrLoanIssueRepository extends JpaRepository<HrLoanIssue, Long> {
    List<HrLoanIssue> findByIsActiveTrue();

    List<HrLoanIssue> findByEmpCodeAndIsActiveTrue(String empCode);

    boolean existsByLoanCode(String loanCode);
}
