package com.autonoma.erp.modules.hr.employee.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_EMPLOYEE_BIRTHDAY_WISH")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeBirthdayWish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "RECIPIENT_EMPLOYEE_ID", nullable = false)
    private Long recipientEmployeeId;

    @Column(name = "SENDER_EMPLOYEE_ID", nullable = false)
    private Long senderEmployeeId;

    @Column(name = "WISH_YEAR", nullable = false)
    private Integer wishYear;

    @Column(name = "MESSAGE", nullable = false, length = 500)
    private String message;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate = new Date();

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    @PrePersist
    protected void onCreate() {
        if (this.createdDate == null) {
            this.createdDate = new Date();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRecipientEmployeeId() { return recipientEmployeeId; }
    public void setRecipientEmployeeId(Long recipientEmployeeId) { this.recipientEmployeeId = recipientEmployeeId; }
    public Long getSenderEmployeeId() { return senderEmployeeId; }
    public void setSenderEmployeeId(Long senderEmployeeId) { this.senderEmployeeId = senderEmployeeId; }
    public Integer getWishYear() { return wishYear; }
    public void setWishYear(Integer wishYear) { this.wishYear = wishYear; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
}
