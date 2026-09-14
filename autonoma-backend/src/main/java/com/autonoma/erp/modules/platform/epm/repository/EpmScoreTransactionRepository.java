package com.autonoma.erp.modules.platform.epm.repository;

import com.autonoma.erp.modules.platform.epm.entity.EpmScoreTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EpmScoreTransactionRepository extends JpaRepository<EpmScoreTransaction, Long> {
    List<EpmScoreTransaction> findByUserIdOrderByTransactionDateDesc(Long userId);
}
