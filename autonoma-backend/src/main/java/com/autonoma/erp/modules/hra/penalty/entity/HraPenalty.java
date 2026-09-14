package com.autonoma.erp.modules.hra.penalty.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;

@Entity
@Table(name = "HRA_PENALTY")
@Data
@NoArgsConstructor
public class HraPenalty extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", nullable = false)
    @JsonIgnoreProperties({"departments", "designations"})
    private EmployeeMaster employee;

    @Column(name = "OLD_EMP_CODE", length = 100)
    private String oldEmpCode;

    @Column(name = "MONTH", nullable = false)
    private Integer month;

    @Column(name = "YEAR", nullable = false)
    private Integer year;

    @Column(name = "PENALTY_REASON", columnDefinition = "NVARCHAR(MAX)")
    private String penaltyReason;

    @Column(name = "PENALTY_AMOUNT", precision = 18, scale = 2)
    private BigDecimal penaltyAmount;

    @Column(name = "STATUS", length = 50)
    private String status = "OPEN";

    @Column(name = "SHORT_CLOSE_REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String shortCloseRemarks;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public EmployeeMaster getEmployee() { return employee; }
    public void setEmployee(EmployeeMaster employee) { this.employee = employee; }
    public String getOldEmpCode() { return oldEmpCode; }
    public void setOldEmpCode(String oldEmpCode) { this.oldEmpCode = oldEmpCode; }
    public Integer getMonth() { return month; }
    public void setMonth(Integer month) { this.month = month; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getPenaltyReason() { return penaltyReason; }
    public void setPenaltyReason(String penaltyReason) { this.penaltyReason = penaltyReason; }
    public BigDecimal getPenaltyAmount() { return penaltyAmount; }
    public void setPenaltyAmount(BigDecimal penaltyAmount) { this.penaltyAmount = penaltyAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getShortCloseRemarks() { return shortCloseRemarks; }
    public void setShortCloseRemarks(String shortCloseRemarks) { this.shortCloseRemarks = shortCloseRemarks; }
}
