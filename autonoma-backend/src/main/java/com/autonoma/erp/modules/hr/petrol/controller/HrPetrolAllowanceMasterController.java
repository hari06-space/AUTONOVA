package com.autonoma.erp.modules.hr.petrol.controller;

import com.autonoma.erp.modules.hr.petrol.entity.HrPetrolAllowanceMaster;
import com.autonoma.erp.modules.hr.petrol.repository.HrPetrolAllowanceMasterRepository;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/master/hr/payroll/petrol")
@CrossOrigin(origins = "*")
public class HrPetrolAllowanceMasterController {

    @Autowired
    private HrPetrolAllowanceMasterRepository repository;

    @GetMapping
    public List<HrPetrolAllowanceMaster> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<HrPetrolAllowanceMaster> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M2370", action = "write")
    public ResponseEntity<?> create(@RequestBody HrPetrolAllowanceMaster allowance) {
        if (allowance.getVehicleType() == null || allowance.getVehicleType().isBlank()) {
            return ResponseEntity.badRequest().body("Vehicle Type is required.");
        }
        if (allowance.getFromRate() == null) {
            return ResponseEntity.badRequest().body("From Rate is required.");
        }
        if (allowance.getToRate() == null) {
            return ResponseEntity.badRequest().body("To Rate is required.");
        }
        if (allowance.getFromRate().compareTo(BigDecimal.ZERO) < 0) {
            return ResponseEntity.badRequest().body("From Rate must be a valid non-negative number.");
        }
        if (allowance.getToRate().compareTo(BigDecimal.ZERO) < 0) {
            return ResponseEntity.badRequest().body("To Rate must be a valid non-negative number.");
        }
        if (allowance.getToRate().compareTo(allowance.getFromRate()) < 0) {
            return ResponseEntity.badRequest().body("To Rate must be greater than or equal to From Rate.");
        }
        if (allowance.getRateTwoWheeler() != null && allowance.getRateTwoWheeler().compareTo(BigDecimal.ZERO) < 0) {
            return ResponseEntity.badRequest().body("Rate for Two Wheeler must be non-negative.");
        }
        if (allowance.getRateFourWheeler() != null && allowance.getRateFourWheeler().compareTo(BigDecimal.ZERO) < 0) {
            return ResponseEntity.badRequest().body("Rate for Four Wheeler must be non-negative.");
        }

        String vehicleType = allowance.getVehicleType().toUpperCase();
        allowance.setVehicleType(vehicleType);

        if (repository.existsOverlappingSlab(vehicleType, allowance.getFromRate(), allowance.getToRate())) {
            return ResponseEntity.badRequest().body(
                    "An allowance slab already exists for vehicle type '" + vehicleType + "' overlapping with rate range " + allowance.getFromRate() + " to " + allowance.getToRate() + "."
            );
        }

        try {
            return ResponseEntity.ok(repository.save(allowance));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to save petrol allowance: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M2370", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody HrPetrolAllowanceMaster details) {
        return repository.findById(id)
                .map(existing -> {
                    if (details.getVehicleType() == null || details.getVehicleType().isBlank()) {
                        return ResponseEntity.badRequest().body((Object) "Vehicle Type is required.");
                    }
                    if (details.getFromRate() == null) {
                        return ResponseEntity.badRequest().body((Object) "From Rate is required.");
                    }
                    if (details.getToRate() == null) {
                        return ResponseEntity.badRequest().body((Object) "To Rate is required.");
                    }
                    if (details.getFromRate().compareTo(BigDecimal.ZERO) < 0) {
                        return ResponseEntity.badRequest().body((Object) "From Rate must be a valid non-negative number.");
                    }
                    if (details.getToRate().compareTo(BigDecimal.ZERO) < 0) {
                        return ResponseEntity.badRequest().body((Object) "To Rate must be a valid non-negative number.");
                    }
                    if (details.getToRate().compareTo(details.getFromRate()) < 0) {
                        return ResponseEntity.badRequest().body((Object) "To Rate must be greater than or equal to From Rate.");
                    }
                    if (details.getRateTwoWheeler() != null && details.getRateTwoWheeler().compareTo(BigDecimal.ZERO) < 0) {
                        return ResponseEntity.badRequest().body((Object) "Rate for Two Wheeler must be non-negative.");
                    }
                    if (details.getRateFourWheeler() != null && details.getRateFourWheeler().compareTo(BigDecimal.ZERO) < 0) {
                        return ResponseEntity.badRequest().body((Object) "Rate for Four Wheeler must be non-negative.");
                    }

                    String vehicleType = details.getVehicleType().toUpperCase();
                    if (repository.existsOverlappingSlabExcludingId(vehicleType, details.getFromRate(), details.getToRate(), id)) {
                        return ResponseEntity.badRequest().body((Object) (
                                "An allowance slab already exists for vehicle type '" + vehicleType + "' overlapping with rate range " + details.getFromRate() + " to " + details.getToRate() + "."
                        ));
                    }

                    existing.setVehicleType(vehicleType);
                    existing.setFromRate(details.getFromRate());
                    existing.setToRate(details.getToRate());
                    existing.setRateTwoWheeler(details.getRateTwoWheeler());
                    existing.setRateFourWheeler(details.getRateFourWheeler());
                    existing.setIsActive(details.getIsActive() != null ? details.getIsActive() : existing.getIsActive());
                    existing.setUpdatedBy(SecurityUtils.getCurrentUserId());

                    return ResponseEntity.ok((Object) repository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M2370", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return repository.findById(id)
                .map(allowance -> {
                    repository.delete(allowance);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
