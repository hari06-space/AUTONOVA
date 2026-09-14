package com.autonoma.erp.modules.hr.leave.repository;

import com.autonoma.erp.modules.hr.leave.entity.LeaveMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveMasterRepository extends JpaRepository<LeaveMaster, Long> {

    List<LeaveMaster> findByStatusOrderByCreatedDateDesc(Boolean status);

    Optional<LeaveMaster> findByEmployeeIdAndStatus(Long employeeId, Boolean status);

    Optional<LeaveMaster> findByEmployeeId(Long employeeId);

    List<LeaveMaster> findAllByOrderByCreatedDateDesc();

    @org.springframework.data.jpa.repository.Query("SELECT lm FROM LeaveMaster lm LEFT JOIN FETCH lm.employee ORDER BY lm.createdDate DESC")
    List<LeaveMaster> findAllWithEmployeeOrderByCreatedDateDesc();
}
