package com.autonoma.erp.modules.sm.sales.repository;

import com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderCharge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmCustomerOrderChargeRepository extends JpaRepository<SmCustomerOrderCharge, Long> {
    List<SmCustomerOrderCharge> findByOrderHeaderId(Long orderHeaderId);
    void deleteByOrderHeaderId(Long orderHeaderId);
}
