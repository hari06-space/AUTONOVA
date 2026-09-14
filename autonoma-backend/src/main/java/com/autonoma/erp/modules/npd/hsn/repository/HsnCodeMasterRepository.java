package com.autonoma.erp.modules.npd.hsn.repository;

import com.autonoma.erp.modules.npd.hsn.entity.HsnCodeMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HsnCodeMasterRepository extends JpaRepository<HsnCodeMaster, String> {
}
