package com.autonoma.erp.modules.master.finance.ledgergroup.controller;

import com.autonoma.erp.modules.master.finance.ledgergroup.dto.LedgerGroupDTO;
import com.autonoma.erp.modules.master.finance.ledgergroup.service.LedgerGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master/finance/ledger-group")
public class LedgerGroupController {

    @Autowired
    private LedgerGroupService ledgerGroupService;

    @GetMapping
    public ResponseEntity<List<LedgerGroupDTO>> getAllLedgerGroups() {
        return ResponseEntity.ok(ledgerGroupService.getAllLedgerGroups());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LedgerGroupDTO> getLedgerGroupById(@PathVariable Long id) {
        return ResponseEntity.ok(ledgerGroupService.getLedgerGroupById(id));
    }

    @PostMapping
    public ResponseEntity<LedgerGroupDTO> createLedgerGroup(@RequestBody LedgerGroupDTO dto) {
        return ResponseEntity.ok(ledgerGroupService.createLedgerGroup(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LedgerGroupDTO> updateLedgerGroup(@PathVariable Long id, @RequestBody LedgerGroupDTO dto) {
        return ResponseEntity.ok(ledgerGroupService.updateLedgerGroup(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLedgerGroup(@PathVariable Long id) {
        ledgerGroupService.deleteLedgerGroup(id);
        return ResponseEntity.ok().build();
    }
}
