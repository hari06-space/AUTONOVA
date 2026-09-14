package com.autonoma.erp.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "ERP_USER_RELEASE_READ")
@IdClass(UserReleaseReadId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserReleaseRead {

    @Id
    @Column(name = "USER_ID", length = 50)
    private String userId;

    @Id
    @Column(name = "RELEASE_ID")
    private Long releaseId;

    @Column(name = "READ_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date readDate = new Date();

    @Column(name = "DONT_SHOW_AGAIN", nullable = false)
    private Boolean dontShowAgain = false;

    public Long getReleaseId() { return releaseId; }
    public Boolean getDontShowAgain() { return dontShowAgain; }
    public Date getReadDate() { return readDate; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setReleaseId(Long releaseId) { this.releaseId = releaseId; }
    public void setReadDate(Date readDate) { this.readDate = readDate; }
    public void setDontShowAgain(Boolean dontShowAgain) { this.dontShowAgain = dontShowAgain; }
}
