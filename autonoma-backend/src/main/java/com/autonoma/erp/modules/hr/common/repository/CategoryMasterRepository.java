package com.autonoma.erp.modules.hr.common.repository;

import com.autonoma.erp.modules.hr.common.entity.CategoryMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryMasterRepository extends JpaRepository<CategoryMaster, Long> {
}
