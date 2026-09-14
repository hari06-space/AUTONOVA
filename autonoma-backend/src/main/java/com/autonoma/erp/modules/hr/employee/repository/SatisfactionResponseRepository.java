package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.SatisfactionResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SatisfactionResponseRepository extends JpaRepository<SatisfactionResponse, Long> {
    List<SatisfactionResponse> findBySatisfactionType(String satisfactionType);
}
