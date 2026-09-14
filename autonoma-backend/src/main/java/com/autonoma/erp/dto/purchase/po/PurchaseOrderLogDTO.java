package com.autonoma.erp.dto.purchase.po;

import lombok.Data;
import java.util.Date;

@Data
public class PurchaseOrderLogDTO {
    private Long id;
    private Long poHeadId;
    private String eventType;
    private String eventDescription;
    private String oldValue;
    private String newValue;
    private String performedBy;
    private Date eventDate;
    private String remarks;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPoHeadId() { return poHeadId; }
    public void setPoHeadId(Long poHeadId) { this.poHeadId = poHeadId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getEventDescription() { return eventDescription; }
    public void setEventDescription(String eventDescription) { this.eventDescription = eventDescription; }
    public String getOldValue() { return oldValue; }
    public void setOldValue(String oldValue) { this.oldValue = oldValue; }
    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }
    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }
    public Date getEventDate() { return eventDate; }
    public void setEventDate(Date eventDate) { this.eventDate = eventDate; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
