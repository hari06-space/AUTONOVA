package com.autonoma.erp.modules.qms.meeting.repository;

import com.autonoma.erp.modules.qms.meeting.entity.QmsProcessTypeMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface QmsProcessTypeMasterRepository extends JpaRepository<QmsProcessTypeMaster, Long> {
    Optional<QmsProcessTypeMaster> findByCodeIgnoreCase(String code);
}
