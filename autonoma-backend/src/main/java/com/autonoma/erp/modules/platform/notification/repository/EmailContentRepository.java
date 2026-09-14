package com.autonoma.erp.modules.platform.notification.repository;

import com.autonoma.erp.modules.platform.notification.entity.EmailContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmailContentRepository extends JpaRepository<EmailContent, Long> {
    List<EmailContent> findByTypeAndIsActive(String type, Boolean isActive);

    List<EmailContent> findByTypeIgnoreCaseAndIsActiveOrderByIdDesc(String type, Boolean isActive);

    @Query("SELECT MAX(e.id) FROM EmailContent e")
    Long findMaxId();
}
