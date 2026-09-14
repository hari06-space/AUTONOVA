package com.autonoma.erp.modules.master.inventory.service;

import com.autonoma.erp.modules.master.inventory.entity.ItemTransactionType;
import com.autonoma.erp.modules.master.inventory.repository.ItemTransactionTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ItemTransactionTypeService {

    @Autowired
    private ItemTransactionTypeRepository repository;

    public List<ItemTransactionType> getAllTransactionTypes() {
        return repository.findAll();
    }
}
