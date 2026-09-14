package com.autonoma.erp.model.admin;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "AD_USER_SESSION_ACTIVITY")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSessionActivity extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "USER_ID", columnDefinition = "NVARCHAR(50)")
    private String userId;

    @Column(name = "PAGE_NAME", columnDefinition = "NVARCHAR(100)")
    private String pageName;

    @Column(name = "PAGE_URL", columnDefinition = "NVARCHAR(255)")
    private String pageUrl;

    @Column(name = "ENTRY_TIME")
    @Temporal(TemporalType.TIMESTAMP)
    private Date entryTime;

    @Column(name = "EXIT_TIME")
    @Temporal(TemporalType.TIMESTAMP)
    private Date exitTime;

    @Column(name = "DURATION_MS")
    private Long durationMs;

    @Column(name = "IS_IDLE")
    private Boolean isIdle = false;

    @Column(name = "IDLE_TIME_MS")
    private Long idleTimeMs = 0L;

    @Transient
    private String userImage;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getPageName() { return pageName; }
    public void setPageName(String pageName) { this.pageName = pageName; }
    public String getPageUrl() { return pageUrl; }
    public void setPageUrl(String pageUrl) { this.pageUrl = pageUrl; }
    public Date getEntryTime() { return entryTime; }
    public void setEntryTime(Date entryTime) { this.entryTime = entryTime; }
    public Date getExitTime() { return exitTime; }
    public void setExitTime(Date exitTime) { this.exitTime = exitTime; }
    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }
    public Boolean getIsIdle() { return isIdle; }
    public void setIsIdle(Boolean isIdle) { this.isIdle = isIdle; }
    public Long getIdleTimeMs() { return idleTimeMs; }
    public void setIdleTimeMs(Long idleTimeMs) { this.idleTimeMs = idleTimeMs; }
}
