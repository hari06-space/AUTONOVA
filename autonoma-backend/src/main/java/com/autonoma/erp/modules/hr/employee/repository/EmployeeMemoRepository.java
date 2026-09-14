package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMemo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeMemoRepository extends JpaRepository<EmployeeMemo, Long> {
    
    @Query("SELECT m FROM EmployeeMemo m ORDER BY m.createdDate DESC")
    List<EmployeeMemo> findAllOrdered();

    @Query("SELECT m FROM EmployeeMemo m WHERE " +
           "(:employeeId IS NULL OR m.employee.id = :employeeId) AND " +
           "(:memoType IS NULL OR m.memoType = :memoType) " +
           "ORDER BY m.createdDate DESC")
    List<EmployeeMemo> findFiltered(
        @Param("employeeId") Long employeeId,
        @Param("memoType") String memoType
    );

    Optional<EmployeeMemo> findByMemoNumber(String memoNumber);
    
    @Query("SELECT m FROM EmployeeMemo m WHERE m.memoNumber LIKE :prefix% ORDER BY m.memoNumber DESC")
    List<EmployeeMemo> findByMemoNumberStartingWith(@Param("prefix") String prefix);
}
