package com.autonoma.erp.modules.hr.holiday.controller;

import com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.hr.holiday.service.HrHolidayMasterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/master/hr/holidays")
@CrossOrigin(origins = "*")
public class HrHolidayMasterController {

    @Autowired
    private HrHolidayMasterService service;

    @GetMapping
    public List<HrHolidayMaster> getAll(@RequestParam(value = "year", required = false) Integer year) {
        if (year != null) {
            return service.findByYear(year);
        }
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<HrHolidayMaster> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.findById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/optional")
    public List<HrHolidayMaster> getOptional() {
        return service.findOptionalActive();
    }

    @GetMapping("/calendar")
    public List<HrHolidayMaster> getCalendar(@RequestParam("from") String from,
                                             @RequestParam("to") String to) {
        return service.findActiveBetween(LocalDate.parse(from), LocalDate.parse(to));
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M2310", action = "write")
    public ResponseEntity<?> create(@RequestBody HrHolidayMaster holiday) {
        try {
            return ResponseEntity.ok(service.create(holiday));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M2310", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody HrHolidayMaster holiday) {
        try {
            return ResponseEntity.ok(service.update(id, holiday));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M2310", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
