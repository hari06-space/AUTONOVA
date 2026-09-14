package com.autonoma.erp.model.admin;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;

@Data
@Entity
@Table(name = "AD_FACE_AUTH_LOG")
public class FaceAuthLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USER_ID")
    private String userId;

    @Column(name = "STATUS")
    private String status;

    @Column(name = "MESSAGE")
    private String message;

    @Column(name = "MATCH_DISTANCE")
    private Double matchDistance;

    @Column(name = "IP_ADDRESS")
    private String ipAddress;

    @Column(name = "USER_AGENT")
    private String userAgent;

    @Column(name = "CREATED_DATE")
    private Date createdDate;

    @Column(name = "CREATED_BY")
    private String createdBy;

    @Column(name = "UPDATED_DATE")
    private Date updatedDate;

    @Column(name = "UPDATED_BY")
    private String updatedBy;

    @Column(name = "ACTIVE_STATUS")
    private Boolean activeStatus = true;

    public void setUserId(String userId) { this.userId = userId; }
    public void setStatus(String status) { this.status = status; }
    public void setMessage(String message) { this.message = message; }
    public void setMatchDistance(Double matchDistance) { this.matchDistance = matchDistance; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public void setIsActive(Boolean activeStatus) { this.activeStatus = activeStatus; }
}
