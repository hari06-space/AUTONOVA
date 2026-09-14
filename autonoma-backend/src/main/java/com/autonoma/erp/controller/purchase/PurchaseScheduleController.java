package com.autonoma.erp.controller.purchase;

import com.autonoma.erp.dto.purchase.po.PurchaseScheduleDTO;
import com.autonoma.erp.service.purchase.po.PurchaseScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/purchase-schedule")
public class PurchaseScheduleController {

    @Autowired
    private PurchaseScheduleService purchaseScheduleService;

    @PostMapping("/bulk")
    public ResponseEntity<List<PurchaseScheduleDTO>> saveSchedules(@RequestBody List<PurchaseScheduleDTO> schedules) {
        List<PurchaseScheduleDTO> savedSchedules = purchaseScheduleService.saveSchedules(schedules);
        return ResponseEntity.ok(savedSchedules);
    }

    @GetMapping("/po/{poId}")
    public ResponseEntity<List<PurchaseScheduleDTO>> getSchedulesByPo(@PathVariable Long poId) {
        List<PurchaseScheduleDTO> schedules = purchaseScheduleService.getSchedulesByPo(poId);
        return ResponseEntity.ok(schedules);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        purchaseScheduleService.deleteSchedule(id);
        return ResponseEntity.noContent().build();
    }
}
