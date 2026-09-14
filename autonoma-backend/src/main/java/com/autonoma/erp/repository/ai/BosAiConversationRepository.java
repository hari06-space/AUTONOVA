package com.autonoma.erp.repository.ai;

import com.autonoma.erp.model.ai.BosAiConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BosAiConversationRepository extends JpaRepository<BosAiConversation, Long> {

    List<BosAiConversation> findByUserIdOrderByCreatedDateDesc(String userId);

    List<BosAiConversation> findByUserIdAndSessionIdOrderByCreatedDateAsc(String userId, String sessionId);

    void deleteByUserId(String userId);
}
