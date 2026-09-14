package com.autonoma.erp.modules.sm.sales.repository;

import com.autonoma.erp.modules.sm.sales.entity.SmAdditionalCharges;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmAdditionalChargesRepository extends JpaRepository<SmAdditionalCharges, Long> {
    List<SmAdditionalCharges> findAllByOrderByCreatedDateDesc();
}
