package com.autonoma.erp.repository.chat;

import com.autonoma.erp.model.chat.CommChannel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CommChannelRepository extends JpaRepository<CommChannel, Long> {
    
    @Query("SELECT c FROM CommChannel c WHERE c.channelType = 'DEPARTMENT' AND c.departmentId = :departmentId")
    Optional<CommChannel> findByDepartmentId(@Param("departmentId") Long departmentId);

    @Query("SELECT c FROM CommChannel c JOIN CommChannelMember m1 ON c.id = m1.channelId JOIN CommChannelMember m2 ON c.id = m2.channelId WHERE c.channelType = 'DIRECT' AND m1.userId = :user1 AND m2.userId = :user2")
    List<CommChannel> findDirectChannelBetweenUsers(@Param("user1") String user1, @Param("user2") String user2);
}
