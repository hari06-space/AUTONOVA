package com.autonoma.erp.modules.hr.settings.repository;

import com.autonoma.erp.modules.hr.settings.entity.HrSettingMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HrSettingMasterRepository extends JpaRepository<HrSettingMaster, Long> {

    Optional<HrSettingMaster> findFirstByOrderByIdAsc();
}
