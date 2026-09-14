package com.autonoma.erp.modules.sm.sales.service;

import com.autonoma.erp.modules.sm.sales.dto.SmCustomerOrderScheduleDto;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SmCustomerOrderScheduleService {
    void saveBulkSchedules(List<SmCustomerOrderScheduleDto> scheduleDtos);
    List<SmCustomerOrderScheduleDto> getSchedulesByOrderId(Long orderId);
    List<SmCustomerOrderScheduleDto> getSchedulesByCustomerId(Long customerId);
    Page<SmCustomerOrderScheduleDto> getAllSchedules(Pageable pageable, String status);
    SmCustomerOrderScheduleDto getScheduleById(Long id);
}
