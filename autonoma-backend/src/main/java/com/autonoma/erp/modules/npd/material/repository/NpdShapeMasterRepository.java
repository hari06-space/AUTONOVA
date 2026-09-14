package com.autonoma.erp.modules.npd.material.repository;

import com.autonoma.erp.modules.npd.material.entity.NpdShapeMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NpdShapeMasterRepository extends JpaRepository<NpdShapeMaster, String> {
    java.util.List<NpdShapeMaster> findByShapeNameIgnoreCase(String name);
}
