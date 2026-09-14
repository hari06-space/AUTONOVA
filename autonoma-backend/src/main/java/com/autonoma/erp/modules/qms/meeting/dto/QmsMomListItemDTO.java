package com.autonoma.erp.modules.qms.meeting.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Date;

/**
 * Lightweight DTO for the MOM list page.
 * Contains only the fields required for list display — NO nested child collections,
 * NO agenda HTML, NO attendance lists, NO material mappings.
 * This ensures the list API is fast and memory-efficient at enterprise scale.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QmsMomListItemDTO {

    private Long id;
    private String momNo;
    private String momDate;       // yyyy-MM-dd string
    private String scheduleNo;
    private String meetingTypeName;
    private String status;        // MOM-level status (OPEN, CLOSED, etc.)

    // Detail aggregate counts — computed server-side via sub-selects
    private int totalDetails;
    private int openCount;
    private int closedCount;
    private int pendingCount;
    private int cancelledCount;

    // Audit
    private String createdUser;
    private Date createdAt;
    private String updatedUser;
    private Date updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMomNo() { return momNo; }
    public void setMomNo(String momNo) { this.momNo = momNo; }
    public String getMomDate() { return momDate; }
    public void setMomDate(String momDate) { this.momDate = momDate; }
    public String getScheduleNo() { return scheduleNo; }
    public void setScheduleNo(String scheduleNo) { this.scheduleNo = scheduleNo; }
    public String getMeetingTypeName() { return meetingTypeName; }
    public void setMeetingTypeName(String meetingTypeName) { this.meetingTypeName = meetingTypeName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getTotalDetails() { return totalDetails; }
    public void setTotalDetails(int totalDetails) { this.totalDetails = totalDetails; }
    public int getOpenCount() { return openCount; }
    public void setOpenCount(int openCount) { this.openCount = openCount; }
    public int getClosedCount() { return closedCount; }
    public void setClosedCount(int closedCount) { this.closedCount = closedCount; }
    public int getPendingCount() { return pendingCount; }
    public void setPendingCount(int pendingCount) { this.pendingCount = pendingCount; }
    public int getCancelledCount() { return cancelledCount; }
    public void setCancelledCount(int cancelledCount) { this.cancelledCount = cancelledCount; }
    public String getCreatedUser() { return createdUser; }
    public void setCreatedUser(String createdUser) { this.createdUser = createdUser; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    public String getUpdatedUser() { return updatedUser; }
    public void setUpdatedUser(String updatedUser) { this.updatedUser = updatedUser; }
    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
