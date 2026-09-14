package com.autonoma.erp.repository;

import com.autonoma.erp.model.RfqEmailLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RfqEmailLogRepository extends JpaRepository<RfqEmailLog, Long> {
    List<RfqEmailLog> findByRfqHeadIdOrderBySentDateDesc(Long rfqHeadId);
}
