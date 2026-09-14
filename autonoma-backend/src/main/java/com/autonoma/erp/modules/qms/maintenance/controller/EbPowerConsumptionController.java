package com.autonoma.erp.modules.qms.maintenance.controller;

import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.qms.maintenance.entity.EbMeter;
import com.autonoma.erp.modules.qms.maintenance.entity.EbPowerConsumption;
import com.autonoma.erp.modules.qms.maintenance.repository.EbMeterRepository;
import com.autonoma.erp.modules.qms.maintenance.repository.EbPowerConsumptionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/master/qms/eb-power-consumption")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class EbPowerConsumptionController {

    private final EbPowerConsumptionRepository repository;
    private final EbMeterRepository meterRepository;
    private final com.autonoma.erp.modules.qms.maintenance.service.EbPowerConsumptionService powerConsumptionService;

    public EbPowerConsumptionController(EbPowerConsumptionRepository repository, EbMeterRepository meterRepository, com.autonoma.erp.modules.qms.maintenance.service.EbPowerConsumptionService powerConsumptionService) {
        this.repository = repository;
        this.meterRepository = meterRepository;
        this.powerConsumptionService = powerConsumptionService;
    }

    @GetMapping
    public ResponseEntity<List<EbPowerConsumption>> getAllConsumptions() {
        try {
            return ResponseEntity.ok(repository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<EbPowerConsumption> getConsumptionById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/latest-units")
    public ResponseEntity<?> getLatestUnits(@RequestParam Long meterId) {
        try {
            EbMeter meter = meterRepository.findById(meterId).orElse(null);
            if (meter == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Meter not found.");
            }

            Optional<EbPowerConsumption> latestOpt = repository.findFirstByMeterIdOrderByReadingDateDescIdDesc(meterId);

            Map<String, Object> result = new HashMap<>();
            if (latestOpt.isPresent()) {
                result.put("startUnitKwh", latestOpt.get().getEndUnitKwh());
                result.put("startUnitKvah", latestOpt.get().getEndUnitKvah());
            } else {
                result.put("startUnitKwh", meter.getStartUnitKwh());
                result.put("startUnitKvah", meter.getStartUnitKvah());
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to fetch latest units: " + e.getMessage());
        }
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M1430", action = "write")
    public ResponseEntity<?> createConsumption(@RequestBody EbPowerConsumption consumption) {
        try {
            if (consumption.getMeter() == null || consumption.getMeter().getId() == null) {
                return ResponseEntity.badRequest().body("Meter No is mandatory.");
            }

            EbMeter meter = meterRepository.findById(consumption.getMeter().getId()).orElse(null);
            if (meter == null) {
                return ResponseEntity.badRequest().body("Selected Meter does not exist.");
            }

            if (consumption.getShift() == null || consumption.getShift().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Shift is mandatory.");
            }

            if (consumption.getReadingDate() == null) {
                return ResponseEntity.badRequest().body("Consumption Date is mandatory.");
            }

            // Duplicate validation
            if (repository.existsByMeterIdAndReadingDateAndShiftAndIsActiveTrue(meter.getId(), consumption.getReadingDate(), consumption.getShift())) {
                return ResponseEntity.badRequest().body("Duplicate entry: A consumption record already exists for this Meter, Date, and Shift combination.");
            }

            // Enforce master validations
            if (meter.getMultiplicationFactor() == null || meter.getMultiplicationFactor().compareTo(BigDecimal.ZERO) < 0) {
                return ResponseEntity.badRequest().body("Multiplication Factor (MF) in Meter Master must be greater than or equal to 0.");
            }

            if (meter.getUnitPrice() == null || meter.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                return ResponseEntity.badRequest().body("Unit Price in Meter Master must be greater than or equal to 0.");
            }

            // Populate start units if not provided (safety fallback)
            if (consumption.getStartUnitKwh() == null || consumption.getStartUnitKvah() == null) {
                Optional<EbPowerConsumption> latestOpt = repository.findFirstByMeterIdAndIsActiveTrueOrderByReadingDateDescIdDesc(meter.getId());
                if (consumption.getStartUnitKwh() == null) {
                    consumption.setStartUnitKwh(latestOpt.map(EbPowerConsumption::getEndUnitKwh).orElse(meter.getStartUnitKwh()));
                }
                if (consumption.getStartUnitKvah() == null) {
                    consumption.setStartUnitKvah(latestOpt.map(EbPowerConsumption::getEndUnitKvah).orElse(meter.getStartUnitKvah()));
                }
            }

            // End unit validation
            if (consumption.getEndUnitKwh().compareTo(consumption.getStartUnitKwh()) < 0) {
                return ResponseEntity.badRequest().body("End Unit (kWh) must be greater than or equal to Start Unit (kWh).");
            }

            if (consumption.getEndUnitKvah().compareTo(consumption.getStartUnitKvah()) < 0) {
                return ResponseEntity.badRequest().body("End Unit (kVAh) must be greater than or equal to Start Unit (kVAh).");
            }

            // Perform calculations
            performCalculations(consumption, meter);

            EbPowerConsumption saved = powerConsumptionService.createConsumption(consumption);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create Power Consumption reading: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M1430", action = "write")
    public ResponseEntity<?> updateConsumption(@PathVariable Long id, @RequestBody EbPowerConsumption consumption) {
        try {
            EbPowerConsumption existing = repository.findById(id).orElse(null);
            if (existing == null) {
                return ResponseEntity.notFound().build();
            }

            if (consumption.getMeter() == null || consumption.getMeter().getId() == null) {
                return ResponseEntity.badRequest().body("Meter No is mandatory.");
            }

            EbMeter meter = meterRepository.findById(consumption.getMeter().getId()).orElse(null);
            if (meter == null) {
                return ResponseEntity.badRequest().body("Selected Meter does not exist.");
            }

            if (consumption.getShift() == null || consumption.getShift().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Shift is mandatory.");
            }

            if (consumption.getReadingDate() == null) {
                return ResponseEntity.badRequest().body("Consumption Date is mandatory.");
            }

            // Duplicate validation (excluding current id)
            if (repository.existsByMeterIdAndReadingDateAndShiftAndIsActiveTrueAndIdNot(meter.getId(), consumption.getReadingDate(), consumption.getShift(), id)) {
                return ResponseEntity.badRequest().body("Duplicate entry: A consumption record already exists for this Meter, Date, and Shift combination.");
            }

            // Enforce master validations
            if (meter.getMultiplicationFactor() == null || meter.getMultiplicationFactor().compareTo(BigDecimal.ZERO) < 0) {
                return ResponseEntity.badRequest().body("Multiplication Factor (MF) in Meter Master must be greater than or equal to 0.");
            }

            if (meter.getUnitPrice() == null || meter.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                return ResponseEntity.badRequest().body("Unit Price in Meter Master must be greater than or equal to 0.");
            }

            // Fallback for null start units
            if (consumption.getStartUnitKwh() == null) {
                consumption.setStartUnitKwh(existing.getStartUnitKwh());
            }
            if (consumption.getStartUnitKvah() == null) {
                consumption.setStartUnitKvah(existing.getStartUnitKvah());
            }

            // Fallback for null end units
            if (consumption.getEndUnitKwh() == null) {
                consumption.setEndUnitKwh(existing.getEndUnitKwh());
            }
            if (consumption.getEndUnitKvah() == null) {
                consumption.setEndUnitKvah(existing.getEndUnitKvah());
            }

            if (consumption.getEndUnitKwh().compareTo(consumption.getStartUnitKwh()) < 0) {
                return ResponseEntity.badRequest().body("End Unit (kWh) must be greater than or equal to Start Unit (kWh).");
            }

            if (consumption.getEndUnitKvah().compareTo(consumption.getStartUnitKvah()) < 0) {
                return ResponseEntity.badRequest().body("End Unit (kVAh) must be greater than or equal to Start Unit (kVAh).");
            }

            // Copy mutable fields
            existing.setMeter(meter);
            existing.setShift(consumption.getShift());
            existing.setReadingDate(consumption.getReadingDate());
            existing.setStartUnitKwh(consumption.getStartUnitKwh());
            existing.setEndUnitKwh(consumption.getEndUnitKwh());
            existing.setStartUnitKvah(consumption.getStartUnitKvah());
            existing.setEndUnitKvah(consumption.getEndUnitKvah());
            existing.setRemarks(consumption.getRemarks());
            existing.setStatus(consumption.getStatus());

            // Perform calculations
            performCalculations(existing, meter);

            EbPowerConsumption updated = powerConsumptionService.updateConsumption(existing);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update Power Consumption reading: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M1430", action = "delete")
    public ResponseEntity<?> deleteConsumption(@PathVariable Long id) {
        try {
            if (!repository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            repository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete Power Consumption reading: " + e.getMessage());
        }
    }

    private void performCalculations(EbPowerConsumption consumption, EbMeter meter) {
        BigDecimal startKwh = consumption.getStartUnitKwh() != null ? consumption.getStartUnitKwh() : BigDecimal.ZERO;
        BigDecimal endKwh = consumption.getEndUnitKwh() != null ? consumption.getEndUnitKwh() : BigDecimal.ZERO;
        BigDecimal consumptionKwh = endKwh.subtract(startKwh);
        consumption.setConsumptionUnitKwh(consumptionKwh);

        BigDecimal mf = meter.getMultiplicationFactor() != null ? meter.getMultiplicationFactor() : BigDecimal.ONE;
        BigDecimal actualKwh = consumptionKwh.multiply(mf);
        consumption.setActualConsumptionUnit(actualKwh);

        BigDecimal unitPrice = meter.getUnitPrice() != null ? meter.getUnitPrice() : BigDecimal.ZERO;
        BigDecimal cost = actualKwh.multiply(unitPrice);
        consumption.setCost(cost.setScale(2, RoundingMode.HALF_UP));

        BigDecimal startKvah = consumption.getStartUnitKvah() != null ? consumption.getStartUnitKvah() : BigDecimal.ZERO;
        BigDecimal endKvah = consumption.getEndUnitKvah() != null ? consumption.getEndUnitKvah() : BigDecimal.ZERO;
        BigDecimal consumptionKvah = endKvah.subtract(startKvah);
        consumption.setConsumptionUnitKvah(consumptionKvah);

        if (consumptionKvah.compareTo(BigDecimal.ZERO) == 0) {
            consumption.setPowerFactor(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
        } else {
            BigDecimal pf = consumptionKwh.divide(consumptionKvah, 4, RoundingMode.HALF_UP);
            consumption.setPowerFactor(pf);
        }
    }
}
