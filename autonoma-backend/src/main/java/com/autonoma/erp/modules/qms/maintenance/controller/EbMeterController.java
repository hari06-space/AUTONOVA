package com.autonoma.erp.modules.qms.maintenance.controller;

import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.qms.maintenance.entity.EbMeter;
import com.autonoma.erp.modules.qms.maintenance.repository.EbMeterRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/master/qms/eb-meter")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class EbMeterController {

    private final EbMeterRepository repository;
    private final com.autonoma.erp.modules.qms.maintenance.service.EbMeterService meterService;

    public EbMeterController(EbMeterRepository repository, com.autonoma.erp.modules.qms.maintenance.service.EbMeterService meterService) {
        this.repository = repository;
        this.meterService = meterService;
    }

    @GetMapping
    public ResponseEntity<List<EbMeter>> getAllMeters() {
        try {
            return ResponseEntity.ok(repository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<EbMeter> getMeterById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M1420", action = "write")
    public ResponseEntity<?> createMeter(@RequestBody EbMeter meter) {
        try {
            if (meter.getConsumerName() == null || meter.getConsumerName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Consumer Name is required.");
            }

            if (meter.getMeterType() == null || meter.getMeterType().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Meter Type is required.");
            }

            if (meter.getMeterNo() == null || meter.getMeterNo().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Meter Number is required.");
            }

            if (meter.getMultiplicationFactor() == null || meter.getMultiplicationFactor().compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body("Multiplication Factor must be greater than 0.");
            }

            if (meter.getMaximumDemand() == null || meter.getMaximumDemand().compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body("Maximum Demand must be greater than 0.");
            }

            if (meter.getSanctionedLoad() == null || meter.getSanctionedLoad().compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body("Sanctioned Load must be greater than 0.");
            }

            if (meter.getUnitPrice() == null || meter.getUnitPrice().compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body("Unit Price must be greater than 0.");
            }

            if (meter.getAdditionalDetails() == null || meter.getAdditionalDetails().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Additional Details is required.");
            }

            String cleanMeterNo = meter.getMeterNo().trim();
            if (repository.existsByMeterNoIgnoreCase(cleanMeterNo)) {
                return ResponseEntity.badRequest().body("Meter No '" + cleanMeterNo + "' already exists.");
            }

            meter.setMeterNo(cleanMeterNo);

            EbMeter saved = meterService.createMeter(meter);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create Meter: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M1420", action = "write")
    public ResponseEntity<?> updateMeter(@PathVariable Long id, @RequestBody EbMeter meter) {
        try {
            EbMeter existing = repository.findById(id).orElse(null);
            if (existing == null) {
                return ResponseEntity.notFound().build();
            }

            if (meter.getConsumerName() == null || meter.getConsumerName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Consumer Name is required.");
            }

            if (meter.getMeterType() == null || meter.getMeterType().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Meter Type is required.");
            }

            if (meter.getMeterNo() == null || meter.getMeterNo().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Meter Number is required.");
            }

            if (meter.getMultiplicationFactor() == null || meter.getMultiplicationFactor().compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body("Multiplication Factor must be greater than 0.");
            }

            if (meter.getMaximumDemand() == null || meter.getMaximumDemand().compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body("Maximum Demand must be greater than 0.");
            }

            if (meter.getSanctionedLoad() == null || meter.getSanctionedLoad().compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body("Sanctioned Load must be greater than 0.");
            }

            if (meter.getUnitPrice() == null || meter.getUnitPrice().compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body("Unit Price must be greater than 0.");
            }

            if (meter.getAdditionalDetails() == null || meter.getAdditionalDetails().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Additional Details is required.");
            }

            String cleanMeterNo = meter.getMeterNo().trim();
            if (repository.existsByMeterNoIgnoreCaseAndIdNot(cleanMeterNo, id)) {
                return ResponseEntity.badRequest().body("Meter No '" + cleanMeterNo + "' already exists.");
            }

            // Copy mutable fields
            existing.setConsumerName(meter.getConsumerName());
            existing.setConsumerNo(meter.getConsumerNo());
            existing.setMeterType(meter.getMeterType());
            existing.setMeterNo(cleanMeterNo);
            existing.setPurchaseDate(meter.getPurchaseDate());
            existing.setStartUnitKwh(meter.getStartUnitKwh());
            existing.setStartUnitKvah(meter.getStartUnitKvah());
            existing.setMaximumDemand(meter.getMaximumDemand());
            existing.setMultiplicationFactor(meter.getMultiplicationFactor());
            existing.setSanctionedLoad(meter.getSanctionedLoad());
            existing.setUnitPrice(meter.getUnitPrice());
            existing.setAdditionalDetails(meter.getAdditionalDetails());
            existing.setStatus(meter.getStatus());

            EbMeter updated = meterService.updateMeter(existing);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update Meter: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M1420", action = "delete")
    public ResponseEntity<?> deleteMeter(@PathVariable Long id) {
        try {
            if (!repository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            meterService.deleteMeter(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete Meter: " + e.getMessage());
        }
    }
}
