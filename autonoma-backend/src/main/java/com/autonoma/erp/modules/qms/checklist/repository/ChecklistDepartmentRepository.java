package com.autonoma.erp.modules.qms.checklist.repository;

import com.autonoma.erp.modules.qms.checklist.entity.ChecklistDepartment;
import com.autonoma.erp.modules.qms.checklist.entity.MasterChecklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChecklistDepartmentRepository extends JpaRepository<ChecklistDepartment, Long> {
    void deleteByChecklist(MasterChecklist checklist);
}
