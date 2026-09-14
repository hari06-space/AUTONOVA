package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeManagerMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeManagerMappingRepository extends JpaRepository<EmployeeManagerMapping, Long> {
    Optional<EmployeeManagerMapping> findByEmpId(Long empId);
    Optional<EmployeeManagerMapping> findByEmpIdAndStatus(Long empId, String status);
    void deleteByEmpId(Long empId);

    @Query("SELECT m.empId FROM EmployeeManagerMapping m WHERE m.status = 'Active' AND (m.homeManagerId = :managerId OR m.businessManagerId = :managerId OR m.verticalHeadId = :managerId OR m.hrId = :managerId)")
    List<Long> findReporteeEmpIdsByManagerId(@Param("managerId") Long managerId);

    @Query("SELECT m.empId FROM EmployeeManagerMapping m WHERE m.status = 'Active' AND m.verticalHeadId = :verticalHeadId")
    List<Long> findEmpIdsByVerticalHeadId(@Param("verticalHeadId") Long verticalHeadId);
}
