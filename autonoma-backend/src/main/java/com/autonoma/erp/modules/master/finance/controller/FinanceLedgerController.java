package com.autonoma.erp.modules.master.finance.controller;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.finance.service.FinanceLedgerService;
import com.autonoma.erp.security.RequirePagePermission;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master/finance/ledger")
@Tag(name = "Finance Ledger Master", description = "Finance Ledger Master Management APIs")
public class FinanceLedgerController {

    private final FinanceLedgerService service;

    @org.springframework.beans.factory.annotation.Autowired
    public FinanceLedgerController(FinanceLedgerService service) {
        this.service = service;
    }

    @GetMapping
    public List<AccountLedger> getAllFinanceLedgers() {
        return service.getAllFinanceLedgers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountLedger> getFinanceLedgerById(@PathVariable Long id) {
        return service.getFinanceLedgerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @RequirePagePermission(pageCode = "M9120", action = "write")
    @PostMapping
    public AccountLedger createFinanceLedger(@RequestBody AccountLedger ledger) {
        return service.saveFinanceLedger(ledger);
    }

    @RequirePagePermission(pageCode = "M9120", action = "write")
    @PutMapping("/{id}")
    public ResponseEntity<AccountLedger> updateFinanceLedger(@PathVariable Long id, @RequestBody AccountLedger ledgerDetails) {
        return service.getFinanceLedgerById(id)
                .map(ledger -> {
                    ledger.setLedgerName(ledgerDetails.getLedgerName());
                    ledger.setShortName(ledgerDetails.getShortName());
                    ledger.setPrintName(ledgerDetails.getPrintName());
                    ledger.setCategory(ledgerDetails.getCategory());
                    ledger.setGroupId(ledgerDetails.getGroupId());
                    ledger.setIsActive(ledgerDetails.getIsActive());

                    return ResponseEntity.ok(service.saveFinanceLedger(ledger));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @RequirePagePermission(pageCode = "M9120", action = "delete")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFinanceLedger(@PathVariable Long id) {
        return service.getFinanceLedgerById(id)
                .map(ledger -> {
                    service.deleteFinanceLedger(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
