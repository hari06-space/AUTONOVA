package com.autonoma.erp.modules.hr.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeBirthdayWishDto {
    private Long id;
    private Long recipientEmployeeId;
    private Long senderEmployeeId;
    private String senderName;
    private String senderPhotoPath;
    private String senderDesignation;
    private String message;
    private Date createdDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRecipientEmployeeId() { return recipientEmployeeId; }
    public void setRecipientEmployeeId(Long recipientEmployeeId) { this.recipientEmployeeId = recipientEmployeeId; }
    public Long getSenderEmployeeId() { return senderEmployeeId; }
    public void setSenderEmployeeId(Long senderEmployeeId) { this.senderEmployeeId = senderEmployeeId; }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public String getSenderPhotoPath() { return senderPhotoPath; }
    public void setSenderPhotoPath(String senderPhotoPath) { this.senderPhotoPath = senderPhotoPath; }
    public String getSenderDesignation() { return senderDesignation; }
    public void setSenderDesignation(String senderDesignation) { this.senderDesignation = senderDesignation; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
}
