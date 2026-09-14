package com.autonoma.erp.repository.chat;

import com.autonoma.erp.model.chat.CommMessageDeleted;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommMessageDeletedRepository extends JpaRepository<CommMessageDeleted, Long> {
    List<CommMessageDeleted> findByUserId(String userId);
    void deleteByMessageIdInAndUserId(List<Long> messageIds, String userId);
}
