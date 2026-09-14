package com.autonoma.erp.modules.notebook.repository;

import com.autonoma.erp.modules.notebook.entity.NotebookShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotebookShareRepository extends JpaRepository<NotebookShare, Long> {

    List<NotebookShare> findBySharedWithEmpIdAndActiveStatus(Long empId, String activeStatus);

    List<NotebookShare> findByNotebookIdAndActiveStatus(Long notebookId, String activeStatus);

    Optional<NotebookShare> findByNotebookIdAndSharedWithEmpId(Long notebookId, Long sharedWithEmpId);

    boolean existsByNotebookIdAndSharedWithEmpIdAndActiveStatus(Long notebookId, Long sharedWithEmpId, String activeStatus);
}
