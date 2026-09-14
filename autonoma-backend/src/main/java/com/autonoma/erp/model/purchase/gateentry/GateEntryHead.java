package com.autonoma.erp.model.purchase.gateentry;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.organization.entity.Division;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "PP_GATE_ENTRY_HEAD")
@Data
@EqualsAndHashCode(callSuper = true, exclude = {"transactions", "visitors", "sources", "attachments", "logs"})
@ToString(callSuper = true, exclude = {"transactions", "visitors", "sources", "attachments", "logs"})
@NoArgsConstructor
@AllArgsConstructor
public class GateEntryHead extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION", nullable = false)
    private Division division;

    @Column(name = "GATE_ENTRY_NO", nullable = false, length = 50)
    private String gateEntryNo;

    @Column(name = "GATE_ENTRY_DATE", nullable = false)
    private LocalDate gateEntryDate;

    @Column(name = "GATE_PASS_TYPE", nullable = false, length = 50)
    private String gatePassType = "MATERIAL_RECEIPT";

    @Column(name = "ENTRY_TYPE", nullable = false, length = 20)
    private String entryType = "INWARD";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID")
    private AccountLedger supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TRANSPORTER_ID")
    private AccountLedger transporter;

    @Column(name = "TRANSPORT_MODE", length = 50)
    private String transportMode;

    @Column(name = "EXPECTED_ARRIVAL_TIME")
    private LocalDateTime expectedArrivalTime;

    @Column(name = "VEHICLE_NO", length = 50)
    private String vehicleNo;

    @Column(name = "LR_NO", length = 50)
    private String lrNo;

    @Column(name = "LR_DATE")
    private LocalDate lrDate;

    @Column(name = "ARRIVAL_TIME")
    private LocalDateTime arrivalTime;

    @Column(name = "SECURITY_CHECK_START")
    private LocalDateTime securityCheckStart;

    @Column(name = "SECURITY_CHECK_END")
    private LocalDateTime securityCheckEnd;

    @Column(name = "STORES_INSPECTION_START")
    private LocalDateTime storesInspectionStart;

    @Column(name = "STORES_INSPECTION_END")
    private LocalDateTime storesInspectionEnd;

    @Column(name = "GRN_CREATED_TIME")
    private LocalDateTime grnCreatedTime;

    @Column(name = "EXIT_TIME")
    private LocalDateTime exitTime;

    @Column(name = "GATE_NO", length = 50)
    private String gateNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SECURITY_OFFICER_ID")
    private UserCredential securityOfficer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DEPARTMENT_ID")
    private Department department;

    @Column(name = "REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS_ID", nullable = false)
    private StatusMaster status;

    @Column(name = "APPROVAL_VERSION", nullable = false)
    private Integer approvalVersion = 1;

    @Column(name = "APPROVAL_SEQUENCE", nullable = false)
    private Integer approvalSequence = 0;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Integer activeStatus = 1;

    @OneToMany(mappedBy = "gateEntryHead", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GateEntryTrans> transactions = new ArrayList<>();

    @OneToMany(mappedBy = "gateEntryHead", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GateEntryVisitor> visitors = new ArrayList<>();

    @OneToMany(mappedBy = "gateEntryHead", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GateEntrySource> sources = new ArrayList<>();

    @OneToMany(mappedBy = "gateEntryHead", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GateEntryAttachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "gateEntryHead", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GateEntryLog> logs = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Division getDivision() { return division; }
    public void setDivision(Division division) { this.division = division; }
    public String getGateEntryNo() { return gateEntryNo; }
    public void setGateEntryNo(String gateEntryNo) { this.gateEntryNo = gateEntryNo; }
    public LocalDate getGateEntryDate() { return gateEntryDate; }
    public void setGateEntryDate(LocalDate gateEntryDate) { this.gateEntryDate = gateEntryDate; }
    public String getGatePassType() { return gatePassType; }
    public void setGatePassType(String gatePassType) { this.gatePassType = gatePassType; }
    public String getEntryType() { return entryType; }
    public void setEntryType(String entryType) { this.entryType = entryType; }
    public AccountLedger getSupplier() { return supplier; }
    public void setSupplier(AccountLedger supplier) { this.supplier = supplier; }
    public AccountLedger getTransporter() { return transporter; }
    public void setTransporter(AccountLedger transporter) { this.transporter = transporter; }
    public String getTransportMode() { return transportMode; }
    public void setTransportMode(String transportMode) { this.transportMode = transportMode; }
    public LocalDateTime getExpectedArrivalTime() { return expectedArrivalTime; }
    public void setExpectedArrivalTime(LocalDateTime expectedArrivalTime) { this.expectedArrivalTime = expectedArrivalTime; }
    public String getVehicleNo() { return vehicleNo; }
    public void setVehicleNo(String vehicleNo) { this.vehicleNo = vehicleNo; }
    public String getLrNo() { return lrNo; }
    public void setLrNo(String lrNo) { this.lrNo = lrNo; }
    public LocalDate getLrDate() { return lrDate; }
    public void setLrDate(LocalDate lrDate) { this.lrDate = lrDate; }
    public LocalDateTime getArrivalTime() { return arrivalTime; }
    public void setArrivalTime(LocalDateTime arrivalTime) { this.arrivalTime = arrivalTime; }
    public LocalDateTime getSecurityCheckStart() { return securityCheckStart; }
    public void setSecurityCheckStart(LocalDateTime securityCheckStart) { this.securityCheckStart = securityCheckStart; }
    public LocalDateTime getSecurityCheckEnd() { return securityCheckEnd; }
    public void setSecurityCheckEnd(LocalDateTime securityCheckEnd) { this.securityCheckEnd = securityCheckEnd; }
    public LocalDateTime getStoresInspectionStart() { return storesInspectionStart; }
    public void setStoresInspectionStart(LocalDateTime storesInspectionStart) { this.storesInspectionStart = storesInspectionStart; }
    public LocalDateTime getStoresInspectionEnd() { return storesInspectionEnd; }
    public void setStoresInspectionEnd(LocalDateTime storesInspectionEnd) { this.storesInspectionEnd = storesInspectionEnd; }
    public LocalDateTime getGrnCreatedTime() { return grnCreatedTime; }
    public void setGrnCreatedTime(LocalDateTime grnCreatedTime) { this.grnCreatedTime = grnCreatedTime; }
    public LocalDateTime getExitTime() { return exitTime; }
    public void setExitTime(LocalDateTime exitTime) { this.exitTime = exitTime; }
    public String getGateNo() { return gateNo; }
    public void setGateNo(String gateNo) { this.gateNo = gateNo; }
    public UserCredential getSecurityOfficer() { return securityOfficer; }
    public void setSecurityOfficer(UserCredential securityOfficer) { this.securityOfficer = securityOfficer; }
    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public StatusMaster getStatus() { return status; }
    public void setStatus(StatusMaster status) { this.status = status; }
    public Integer getApprovalVersion() { return approvalVersion; }
    public void setApprovalVersion(Integer approvalVersion) { this.approvalVersion = approvalVersion; }
    public Integer getApprovalSequence() { return approvalSequence; }
    public void setApprovalSequence(Integer approvalSequence) { this.approvalSequence = approvalSequence; }
    public Integer getActiveStatus() { return activeStatus; }
    public void setActiveStatus(Integer activeStatus) { this.activeStatus = activeStatus; }
    public List<GateEntryTrans> getTransactions() { return transactions; }
    public void setTransactions(List<GateEntryTrans> transactions) { this.transactions = transactions; }
    public List<GateEntryVisitor> getVisitors() { return visitors; }
    public void setVisitors(List<GateEntryVisitor> visitors) { this.visitors = visitors; }
    public List<GateEntrySource> getSources() { return sources; }
    public void setSources(List<GateEntrySource> sources) { this.sources = sources; }
    public List<GateEntryAttachment> getAttachments() { return attachments; }
    public void setAttachments(List<GateEntryAttachment> attachments) { this.attachments = attachments; }
    public List<GateEntryLog> getLogs() { return logs; }
    public void setLogs(List<GateEntryLog> logs) { this.logs = logs; }
}
