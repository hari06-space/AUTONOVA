package com.autonoma.erp.modules.qmt.repository;

import com.autonoma.erp.modules.qmt.entity.MachineCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MachineCategoryRepository extends JpaRepository<MachineCategory, Long> {
    boolean existsByCategoryNameIgnoreCase(String categoryName);
    boolean existsByCategoryNameIgnoreCaseAndIdNot(String categoryName, Long id);
    boolean existsByCategoryPrefixIgnoreCase(String categoryPrefix);
    boolean existsByCategoryPrefixIgnoreCaseAndIdNot(String categoryPrefix, Long id);
}
