package com.autonoma.erp.modules.sm.sales.repository;

import com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderHeader;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SmCustomerOrderHeaderRepository extends JpaRepository<SmCustomerOrderHeader, Long> {
    boolean existsByOrderNo(String orderNo);
    boolean existsByOrderNoAndIdNot(String orderNo, Long id);

    @Query("SELECT DISTINCT h FROM SmCustomerOrderHeader h JOIN FETCH h.orderDetails d WHERE h.custId = :custId")
    List<SmCustomerOrderHeader> findByCustIdWithDetails(@Param("custId") Long custId);
}

