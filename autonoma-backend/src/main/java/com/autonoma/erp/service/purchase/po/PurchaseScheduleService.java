package com.autonoma.erp.service.purchase.po;

import com.autonoma.erp.dto.purchase.po.PurchaseScheduleDTO;
import java.util.List;

public interface PurchaseScheduleService {
    List<PurchaseScheduleDTO> saveSchedules(List<PurchaseScheduleDTO> schedules);
    List<PurchaseScheduleDTO> getSchedulesByPo(Long poId);
    void deleteSchedule(Long id);
}
