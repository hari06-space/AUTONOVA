package com.autonoma.erp.modules.npd.inventory.repository;

import com.autonoma.erp.modules.npd.inventory.entity.NpdInventoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NpdInventoryTypeRepository extends JpaRepository<NpdInventoryType, String> {
}
