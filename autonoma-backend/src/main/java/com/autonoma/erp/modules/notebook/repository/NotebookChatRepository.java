package com.autonoma.erp.modules.notebook.repository;

import com.autonoma.erp.modules.notebook.entity.NotebookChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotebookChatRepository extends JpaRepository<NotebookChat, Long> {
    List<NotebookChat> findByNotebookIdAndActiveStatusOrderByCreatedDateAsc(Long notebookId, String activeStatus);
}
