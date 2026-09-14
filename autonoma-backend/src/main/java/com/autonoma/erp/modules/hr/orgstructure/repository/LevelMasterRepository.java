package com.autonoma.erp.modules.hr.orgstructure.repository;

import com.autonoma.erp.modules.hr.orgstructure.entity.LevelMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LevelMasterRepository extends JpaRepository<LevelMaster, Long> {
}
