package com.autonoma.erp.modules.master.finance.controller;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.finance.service.TaxLedgerService;
import com.autonoma.erp.security.RequirePagePermission;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master/finance/tax-ledger")
@Tag(name = "Tax Ledger Master", description = "Tax Ledger Master Management APIs")
public class TaxLedgerController {

    private final TaxLedgerService service;

    @org.springframework.beans.factory.annotation.Autowired
    public TaxLedgerController(TaxLedgerService service) {
        this.service = service;
    }

    @GetMapping
    public List<AccountLedger> getAllTaxLedgers() {
        return service.getAllTaxLedgers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountLedger> getTaxLedgerById(@PathVariable Long id) {
        return service.getTaxLedgerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @RequirePagePermission(pageCode = "M9130", action = "write")
    @PostMapping
    public AccountLedger createTaxLedger(@RequestBody AccountLedger ledger) {
        return service.saveTaxLedger(ledger);
    }

    @RequirePagePermission(pageCode = "M9130", action = "write")
    @PutMapping("/{id}")
    public ResponseEntity<AccountLedger> updateTaxLedger(@PathVariable Long id, @RequestBody AccountLedger ledgerDetails) {
        return service.getTaxLedgerById(id)
                .map(ledger -> {
                    ledger.setLedgerName(ledgerDetails.getLedgerName());
                    ledger.setShortName(ledgerDetails.getShortName());
                    ledger.setPrintName(ledgerDetails.getPrintName());
                    ledger.setCategory(ledgerDetails.getCategory());
                    ledger.setGroupId(ledgerDetails.getGroupId());
                    ledger.setIsActive(ledgerDetails.getIsActive());
                    ledger.setTaxType(ledgerDetails.getTaxType());
                    ledger.setTaxPercentage(ledgerDetails.getTaxPercentage());

                    return ResponseEntity.ok(service.saveTaxLedger(ledger));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @RequirePagePermission(pageCode = "M9130", action = "delete")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTaxLedger(@PathVariable Long id) {
        return service.getTaxLedgerById(id)
                .map(ledger -> {
                    service.deleteTaxLedger(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
