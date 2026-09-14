package com.autonoma.erp.modules.npd.material.repository;

import com.autonoma.erp.modules.npd.material.entity.NpdMaterialGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NpdMaterialGradeRepository extends JpaRepository<NpdMaterialGrade, String> {
    java.util.List<NpdMaterialGrade> findByGradeNameIgnoreCase(String name);
}
