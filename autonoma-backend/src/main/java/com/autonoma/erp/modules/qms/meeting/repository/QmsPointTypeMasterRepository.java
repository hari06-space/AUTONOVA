package com.autonoma.erp.modules.qms.meeting.repository;

import com.autonoma.erp.modules.qms.meeting.entity.QmsPointTypeMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface QmsPointTypeMasterRepository extends JpaRepository<QmsPointTypeMaster, Long> {
    Optional<QmsPointTypeMaster> findByCodeIgnoreCase(String code);
}
