package com.autonoma.erp.repository.chat;

import com.autonoma.erp.model.chat.CommMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CommMessageRepository extends JpaRepository<CommMessage, Long> {
    List<CommMessage> findByChannelIdOrderByIdAsc(Long channelId);

    @Query("SELECT m FROM CommMessage m WHERE m.channelId = :channelId AND LOWER(m.messageContent) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY m.id DESC")
    List<CommMessage> searchMessagesInChannel(@Param("channelId") Long channelId, @Param("query") String query);

    @Query("SELECT m FROM CommMessage m WHERE m.channelId IN :channelIds AND LOWER(m.messageContent) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY m.id DESC")
    List<CommMessage> searchMessagesAcrossChannels(@Param("channelIds") List<Long> channelIds, @Param("query") String query);

    @Query("SELECT m FROM CommMessage m WHERE m.channelId = :channelId AND m.messageType = 'FILE' ORDER BY m.id DESC")
    List<CommMessage> findFilesByChannelId(@Param("channelId") Long channelId);
}
