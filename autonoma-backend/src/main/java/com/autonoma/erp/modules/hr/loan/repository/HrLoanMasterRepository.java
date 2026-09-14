package com.autonoma.erp.modules.hr.loan.repository;

import com.autonoma.erp.modules.hr.loan.entity.HrLoanMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HrLoanMasterRepository extends JpaRepository<HrLoanMaster, Long> {

    boolean existsByLoanCode(String loanCode);

    boolean existsByLoanCodeAndIdNot(String loanCode, Long id);

    boolean existsByLoanNameIgnoreCase(String loanName);

    boolean existsByLoanNameIgnoreCaseAndIdNot(String loanName, Long id);

    @Query("SELECT MAX(CAST(h.loanCode AS integer)) FROM HrLoanMaster h")
    Optional<Integer> findMaxLoanCodeAsInt();
}
