package com.autonoma.erp.modules.master.commercial.controller;

import com.autonoma.erp.modules.master.commercial.entity.TermsMaster;
import com.autonoma.erp.modules.master.commercial.repository.TermsMasterRepository;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({
        "/api/terms-master",
        "/api/payment-terms",
        "/api/delivery-terms",
        "/api/sm/despatch-mode",
        "/api/despatch-mode",
        "/api/dispatch-mode",
        "/api/sm/freight",
        "/api/master/common/payment-terms",
        "/api/master/common/delivery-terms",
        "/api/master/commercial/payment-terms",
        "/api/master/sales/logistics/despatch-mode",
        "/api/master/sales/logistics/freight"
})
@CrossOrigin(origins = "*")
public class TermsMasterController {

    @Autowired
    private TermsMasterRepository repository;

    @GetMapping
    public List<TermsMaster> getAll(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long divisionId,
            @RequestParam(required = false) Boolean activeOnly,
            HttpServletRequest request) {
        return fetchTermsByContext(type, divisionId, activeOnly, request);
    }

    @GetMapping("/active")
    public List<TermsMaster> getActive(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long divisionId,
            HttpServletRequest request) {
        return fetchTermsByContext(type, divisionId, true, request);
    }

    private List<TermsMaster> fetchTermsByContext(String type, Long divisionId, Boolean activeOnly, HttpServletRequest request) {
        String uri = (request != null && request.getRequestURI() != null) ? request.getRequestURI().toLowerCase() : "";

        // If explicit type query param is provided
        if (type != null && !type.trim().isEmpty()) {
            String upperType = type.trim().toUpperCase();
            if (upperType.contains("PAYMENT")) {
                return repository.findPaymentTerms(divisionId, activeOnly);
            } else if (upperType.contains("DELIVERY") || upperType.contains("INCOTERM")) {
                return repository.findDeliveryTerms(divisionId, activeOnly);
            } else if (upperType.contains("DESPATC") || upperType.contains("DISPATCH")) {
                return repository.findDespatchModes(divisionId, activeOnly);
            } else if (upperType.contains("FREIGHT")) {
                return repository.findFreightTerms(divisionId, activeOnly);
            } else {
                return repository.searchTerms(type.trim(), divisionId, activeOnly);
            }
        }

        // Context based on request URL
        if (uri.contains("/payment-terms")) {
            return repository.findPaymentTerms(divisionId, activeOnly);
        } else if (uri.contains("/delivery-terms")) {
            return repository.findDeliveryTerms(divisionId, activeOnly);
        } else if (uri.contains("despatch-mode") || uri.contains("dispatch-mode")) {
            return repository.findDespatchModes(divisionId, activeOnly);
        } else if (uri.contains("/freight")) {
            return repository.findFreightTerms(divisionId, activeOnly);
        }

        // Default for /api/terms-master table
        if (activeOnly != null && activeOnly) {
            return repository.findByStatus(true);
        }
        return repository.findAll(Sort.by(Sort.Direction.ASC, "id"));
    }

    @GetMapping("/types")
    public List<String> getTypes() {
        return repository.findDistinctTypes();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TermsMaster> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M5210", action = "write")
    public ResponseEntity<?> create(@RequestBody TermsMaster item) {
        if (item.getDescription() == null || item.getDescription().trim().isEmpty()) {
            // Check legacy termName
            if (item.getTermName() != null && !item.getTermName().trim().isEmpty()) {
                item.setDescription(item.getTermName());
            } else {
                return ResponseEntity.badRequest().body("Term Description is required.");
            }
        }

        String type = (item.getType() != null && !item.getType().trim().isEmpty()) ? item.getType().trim().toUpperCase() : "PAYMENT";
        item.setType(type);

        if (item.getCode() == null && item.getTermCode() != null) {
            item.setCode(item.getTermCode());
        }

        if (repository.existsByDescriptionIgnoreCaseAndType(item.getDescription().trim(), type)) {
            return ResponseEntity.badRequest().body("Terms entry with this description already exists for type " + type);
        }

        return ResponseEntity.ok(repository.save(item));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M5210", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody TermsMaster item) {
        return repository.findById(id)
                .map(existing -> {
                    String newDesc = item.getDescription();
                    if ((newDesc == null || newDesc.trim().isEmpty()) && item.getTermName() != null) {
                        newDesc = item.getTermName();
                    }
                    if (newDesc == null || newDesc.trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Term Description is required.");
                    }

                    String newType = (item.getType() != null && !item.getType().trim().isEmpty()) ? item.getType().trim().toUpperCase() : existing.getType();

                    if (!existing.getDescription().equalsIgnoreCase(newDesc.trim())
                            && repository.existsByDescriptionIgnoreCaseAndType(newDesc.trim(), newType)) {
                        return ResponseEntity.badRequest().body("Terms entry with this description already exists for type " + newType);
                    }

                    existing.setDescription(newDesc.trim());
                    existing.setType(newType);
                    existing.setCode(item.getCode() != null ? item.getCode() : item.getTermCode());
                    if (item.getStatus() != null) {
                        existing.setStatus(item.getStatus());
                    }
                    if (item.getDivision() != null) {
                        existing.setDivision(item.getDivision());
                    }
                    existing.setUpdatedBy(SecurityUtils.getCurrentUserId());
                    return ResponseEntity.ok(repository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M5210", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
