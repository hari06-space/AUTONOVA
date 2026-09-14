package com.autonoma.erp.modules.platform.common.repository;

import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StatusMasterRepository extends JpaRepository<StatusMaster, Long> {
    Optional<StatusMaster> findByName(String name);

    Optional<StatusMaster> findByNameIgnoreCase(String name);

    Optional<StatusMaster> findFirstByNameIgnoreCase(String name);
}
