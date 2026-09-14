package com.autonoma.erp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "PP_PURCHASE_ORDER_LOG")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "PO_HEAD_ID", nullable = false)
    private Long poHeadId;

    @Column(name = "EVENT_TYPE", nullable = false, length = 50)
    private String eventType;

    @Column(name = "EVENT_DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String eventDescription;

    @Column(name = "OLD_VALUE", columnDefinition = "NVARCHAR(MAX)")
    private String oldValue;

    @Column(name = "NEW_VALUE", columnDefinition = "NVARCHAR(MAX)")
    private String newValue;

    @Column(name = "PERFORMED_BY", length = 100)
    private String performedBy;

    @Column(name = "EVENT_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date eventDate = new Date();

    @Column(name = "IP_ADDRESS", length = 50)
    private String ipAddress;

    @Column(name = "REMARKS", length = 500)
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
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
