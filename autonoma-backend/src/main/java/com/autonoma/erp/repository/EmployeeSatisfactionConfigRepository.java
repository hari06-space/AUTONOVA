package com.autonoma.erp.repository;

import com.autonoma.erp.model.EmployeeSatisfactionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeSatisfactionConfigRepository extends JpaRepository<EmployeeSatisfactionConfig, Long> {
}
