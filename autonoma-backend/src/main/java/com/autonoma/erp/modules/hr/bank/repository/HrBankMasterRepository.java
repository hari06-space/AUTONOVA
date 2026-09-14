package com.autonoma.erp.modules.hr.bank.repository;

import com.autonoma.erp.modules.hr.bank.entity.HrBankMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HrBankMasterRepository extends JpaRepository<HrBankMaster, Long> {

    boolean existsByBankCode(String bankCode);

    boolean existsByBankCodeAndIdNot(String bankCode, Long id);

    boolean existsByAccountNo(String accountNo);

    boolean existsByAccountNoAndIdNot(String accountNo, Long id);

    @Query(value = "SELECT MAX(CAST(BANK_CODE AS INT)) FROM HR_BANK_MASTER WITH (NOLOCK) WHERE ISNUMERIC(BANK_CODE) = 1", nativeQuery = true)
    Optional<Integer> findMaxBankCodeAsInt();
}
