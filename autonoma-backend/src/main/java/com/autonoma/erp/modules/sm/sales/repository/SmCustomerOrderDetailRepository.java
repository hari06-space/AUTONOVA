package com.autonoma.erp.modules.sm.sales.repository;

import com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmCustomerOrderDetailRepository extends JpaRepository<SmCustomerOrderDetail, Long> {
    List<SmCustomerOrderDetail> findByOrderHeaderId(Long orderHeaderId);
    void deleteByOrderHeaderId(Long orderHeaderId);
}
