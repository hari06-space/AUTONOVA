package com.autonoma.erp.modules.hr.orgstructure.repository;

import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByDepartmentNo(String departmentNo);
    Optional<Department> findByDepartmentName(String departmentName);
    Optional<Department> findByDepartmentNameIgnoreCase(String departmentName);
    @org.springframework.data.jpa.repository.Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM HR_DEPARTMENT WHERE LOWER(LTRIM(RTRIM(DEPARTMENT_NAME))) = LOWER(LTRIM(RTRIM(:name)))", nativeQuery = true)
    int existsByNameNative(@org.springframework.data.repository.query.Param("name") String name);

    @org.springframework.data.jpa.repository.Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM HR_DEPARTMENT WHERE LOWER(LTRIM(RTRIM(DEPARTMENT_NAME))) = LOWER(LTRIM(RTRIM(:name))) AND id != :id", nativeQuery = true)
    int existsByNameNativeWithId(@org.springframework.data.repository.query.Param("name") String name, @org.springframework.data.repository.query.Param("id") Long id);

    @org.springframework.data.jpa.repository.Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM HR_DEPARTMENT WHERE DEPARTMENT_NO = :deptNo", nativeQuery = true)
    int existsByDeptNoNative(@org.springframework.data.repository.query.Param("deptNo") String deptNo);

    @org.springframework.data.jpa.repository.Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM HR_DEPARTMENT WHERE DEPARTMENT_NO = :deptNo AND id != :id", nativeQuery = true)
    int existsByDeptNoNativeWithId(@org.springframework.data.repository.query.Param("deptNo") String deptNo, @org.springframework.data.repository.query.Param("id") Long id);

    @org.springframework.data.jpa.repository.Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM HR_DEPARTMENT WHERE SEQUENCE_NO = :seqNo", nativeQuery = true)
    int existsBySeqNoNative(@org.springframework.data.repository.query.Param("seqNo") Integer seqNo);

    @org.springframework.data.jpa.repository.Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM HR_DEPARTMENT WHERE SEQUENCE_NO = :seqNo AND id != :id", nativeQuery = true)
    int existsBySeqNoNativeWithId(@org.springframework.data.repository.query.Param("seqNo") Integer seqNo, @org.springframework.data.repository.query.Param("id") Long id);

    @org.springframework.data.jpa.repository.Query("SELECT MAX(d.sequenceNo) FROM Department d")
    java.util.Optional<Integer> findMaxSequenceNo();

    @org.springframework.data.jpa.repository.Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(DEPARTMENT_NO, 6, LEN(DEPARTMENT_NO)) AS INT)), 0) FROM HR_DEPARTMENT WHERE DEPARTMENT_NO LIKE 'DEPT-%'", nativeQuery = true)
    Long findMaxDeptNumeric();
    
    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM HR_DEPARTMENT WHERE STATUS = :status", nativeQuery = true)
    java.util.List<Department> findByStatus(@org.springframework.data.repository.query.Param("status") String status);
}
