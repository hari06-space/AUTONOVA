package com.autonoma.erp.model.chat;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "COMM_USER_STATUS")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommUserStatus {
    @Id
    @Column(name = "user_id")
    private String userId;

    @Column(name = "is_online")
    private Integer isOnline = 0;

    @Column(name = "last_seen")
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastSeen = new Date();

    @Column(name = "is_typing_channel_id")
    private Long isTypingChannelId;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt = new Date();

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Integer getIsOnline() { return isOnline; }
    public boolean isOnline() { return isOnline != null && isOnline != 0; }
    public void setIsOnline(Integer isOnline) { this.isOnline = isOnline; }
    public Date getLastSeen() { return lastSeen; }
    public void setLastSeen(Date lastSeen) { this.lastSeen = lastSeen; }
    public Long getIsTypingChannelId() { return isTypingChannelId; }
    public void setIsTypingChannelId(Long isTypingChannelId) { this.isTypingChannelId = isTypingChannelId; }
    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
