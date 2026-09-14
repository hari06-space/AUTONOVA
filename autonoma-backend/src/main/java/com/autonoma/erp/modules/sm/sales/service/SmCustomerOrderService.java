package com.autonoma.erp.modules.sm.sales.service;

import com.autonoma.erp.modules.sm.sales.dto.SmCustomerOrderHeaderDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SmCustomerOrderService {
    SmCustomerOrderHeaderDto createOrder(SmCustomerOrderHeaderDto dto);
    SmCustomerOrderHeaderDto updateOrder(Long id, SmCustomerOrderHeaderDto dto);
    SmCustomerOrderHeaderDto getOrderById(Long id);
    Page<SmCustomerOrderHeaderDto> getAllOrders(Pageable pageable);
    void deleteOrder(Long id);
    void updateLineItemsApproval(Long orderId, java.util.List<Long> lineItemIds, String status);
}
