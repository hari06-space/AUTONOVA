package com.autonoma.erp.modules.notebook.repository;

import com.autonoma.erp.modules.notebook.entity.NotebookNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotebookNoteRepository extends JpaRepository<NotebookNote, Long> {
    List<NotebookNote> findByNotebookIdAndActiveStatus(Long notebookId, String activeStatus);
}
