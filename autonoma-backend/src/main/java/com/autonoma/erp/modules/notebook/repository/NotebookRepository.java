package com.autonoma.erp.modules.notebook.repository;

import com.autonoma.erp.modules.notebook.entity.Notebook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotebookRepository extends JpaRepository<Notebook, Long> {
    List<Notebook> findByOwnerIdAndActiveStatus(Long ownerId, String activeStatus);
    List<Notebook> findByCompanyIdAndDivisionIdAndActiveStatus(Long companyId, Long divisionId, String activeStatus);
    List<Notebook> findByActiveStatus(String activeStatus);
}
