package com.autonoma.erp.repository.chat;

import com.autonoma.erp.model.chat.CommChannelMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CommChannelMemberRepository extends JpaRepository<CommChannelMember, Long> {
    List<CommChannelMember> findByChannelId(Long channelId);
    List<CommChannelMember> findByUserId(String userId);
    Optional<CommChannelMember> findByChannelIdAndUserId(Long channelId, String userId);
}
