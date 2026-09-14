package com.autonoma.erp.modules.master.inventory.repository;

import com.autonoma.erp.modules.master.inventory.entity.ItemTransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemTransactionTypeRepository extends JpaRepository<ItemTransactionType, Integer> {
}
