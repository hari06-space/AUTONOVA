package com.autonoma.erp.modules.npd.material.repository;

import com.autonoma.erp.modules.npd.material.entity.NpdMaterialType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NpdMaterialTypeRepository extends JpaRepository<NpdMaterialType, String> {
    java.util.List<NpdMaterialType> findByTypeNameIgnoreCase(String name);
}
