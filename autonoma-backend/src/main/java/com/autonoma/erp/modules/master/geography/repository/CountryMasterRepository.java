package com.autonoma.erp.modules.master.geography.repository;

import com.autonoma.erp.modules.master.geography.entity.CountryMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CountryMasterRepository extends JpaRepository<CountryMaster, Long> {
}
