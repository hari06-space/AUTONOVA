package com.autonoma.erp.modules.hra.penalty.repository;

import com.autonoma.erp.modules.hra.penalty.entity.HraPenalty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HraPenaltyRepository extends JpaRepository<HraPenalty, Long> {
    List<HraPenalty> findByEmployeeId(Long employeeId);
    List<HraPenalty> findByStatus(String status);
    List<HraPenalty> findByMonthAndYear(Integer month, Integer year);
}
