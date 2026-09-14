package com.autonoma.erp.modules.master.inventory.controller;

import com.autonoma.erp.modules.master.inventory.entity.ItemTransactionType;
import com.autonoma.erp.modules.master.inventory.service.ItemTransactionTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master/inventory/transaction-type")
public class ItemTransactionTypeController {

    @Autowired
    private ItemTransactionTypeService service;

    @GetMapping
    public ResponseEntity<List<ItemTransactionType>> getAllTransactionTypes() {
        return ResponseEntity.ok(service.getAllTransactionTypes());
    }
}
