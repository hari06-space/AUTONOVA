package com.autonoma.erp.modules.hr.orgstructure.repository;

import com.autonoma.erp.modules.hr.orgstructure.entity.Designation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DesignationRepository extends JpaRepository<Designation, Long> {
    @Query("SELECT MAX(CAST(d.designationCode AS int)) FROM Designation d WHERE d.designationCode LIKE '[0-9]%'")
    Optional<Integer> findMaxDesignationCode();

    @Query("SELECT MAX(d.displaySlNo) FROM Designation d")
    Optional<Integer> findMaxDisplaySlNo();

    boolean existsByDesignationName(String designationName);
    boolean existsByDesignationNameAndIdNot(String designationName, Long id);
    boolean existsByDesignationCode(String designationCode);
    boolean existsByDesignationCodeAndIdNot(String designationCode, Long id);
    boolean existsByOrgSeqNo(Integer orgSeqNo);
    boolean existsByOrgSeqNoAndIdNot(Integer orgSeqNo, Long id);
}
