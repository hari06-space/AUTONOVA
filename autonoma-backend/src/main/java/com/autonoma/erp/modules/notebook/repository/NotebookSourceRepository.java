package com.autonoma.erp.modules.notebook.repository;

import com.autonoma.erp.modules.notebook.entity.NotebookSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotebookSourceRepository extends JpaRepository<NotebookSource, Long> {
    List<NotebookSource> findByNotebookIdAndActiveStatus(Long notebookId, String activeStatus);
    long countByNotebookIdAndActiveStatus(Long notebookId, String activeStatus);
}
