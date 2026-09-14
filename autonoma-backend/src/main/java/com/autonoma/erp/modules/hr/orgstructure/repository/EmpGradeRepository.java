package com.autonoma.erp.modules.hr.orgstructure.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.autonoma.erp.modules.hr.orgstructure.entity.Gradedetails;

import java.util.List;

@Repository
public interface EmpGradeRepository extends JpaRepository<Gradedetails, Long> {

    List<Gradedetails> findByStatusIgnoreCase(String status);

}
