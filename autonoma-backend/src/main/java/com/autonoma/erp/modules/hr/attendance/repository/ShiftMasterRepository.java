package com.autonoma.erp.modules.hr.attendance.repository;

import com.autonoma.erp.modules.hr.attendance.entity.ShiftMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShiftMasterRepository extends JpaRepository<ShiftMaster, Long> {
    Optional<ShiftMaster> findByShiftCode(String shiftCode);
    List<ShiftMaster> findByIsActiveTrue();
    List<ShiftMaster> findAllByOrderByShiftCodeAsc();
}
