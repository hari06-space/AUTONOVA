package com.autonoma.erp.modules.sm.sales.controller;

import com.autonoma.erp.modules.sm.sales.dto.SmCustomerOrderScheduleDto;
import com.autonoma.erp.modules.sm.sales.service.SmCustomerOrderScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sm/customer-schedules")
public class SmCustomerOrderScheduleController {

    @Autowired
    private SmCustomerOrderScheduleService scheduleService;

    @PostMapping("/bulk")
    public ResponseEntity<Void> saveBulkSchedules(@RequestBody List<SmCustomerOrderScheduleDto> scheduleDtos) {
        scheduleService.saveBulkSchedules(scheduleDtos);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<SmCustomerOrderScheduleDto>> getSchedulesByOrderId(@PathVariable Long orderId) {
        List<SmCustomerOrderScheduleDto> schedules = scheduleService.getSchedulesByOrderId(orderId);
        return ResponseEntity.ok(schedules);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<SmCustomerOrderScheduleDto>> getSchedulesByCustomerId(@PathVariable Long customerId) {
        List<SmCustomerOrderScheduleDto> schedules = scheduleService.getSchedulesByCustomerId(customerId);
        return ResponseEntity.ok(schedules);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SmCustomerOrderScheduleDto> getScheduleById(@PathVariable Long id) {
        SmCustomerOrderScheduleDto schedule = scheduleService.getScheduleById(id);
        return ResponseEntity.ok(schedule);
    }

    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<SmCustomerOrderScheduleDto>> getAllSchedules(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<SmCustomerOrderScheduleDto> schedules = scheduleService.getAllSchedules(pageable, status);
        return ResponseEntity.ok(schedules);
    }
}
