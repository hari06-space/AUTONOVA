package com.autonoma.erp.modules.sm.sales.repository;

import com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmCustomerOrderScheduleRepository extends JpaRepository<SmCustomerOrderSchedule, Long> {
    List<SmCustomerOrderSchedule> findByOrderId(Long orderId);
    List<SmCustomerOrderSchedule> findByOrderItemId(Long orderItemId);
    List<SmCustomerOrderSchedule> findByCustomerId(Long customerId);
}
