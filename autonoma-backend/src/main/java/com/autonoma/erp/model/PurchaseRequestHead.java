package com.autonoma.erp.model;

import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.master.organization.entity.Division;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.util.List;
import java.math.BigDecimal;

@Entity
@Table(name = "PP_PURCHASE_REQUEST_HEAD")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseRequestHead extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "PR_NO", length = 50, nullable = false)
    private String prNo;

    @Column(name = "PR_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date prDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DEPARTMENT_ID", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PLANNERR_ID", nullable = false)
    private EmployeeMaster planner;

    @Column(name = "PR_FROM", length = 25)
    private String prFrom = "REGULAR";

    @Column(name = "REMARKS", length = 250)
    private String remarks;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION", nullable = false)
    private Division division;

    @OneToMany(mappedBy = "purchaseRequestHead", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private List<PurchaseRequestTrans> transactions;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPrNo() { return prNo; }
    public void setPrNo(String prNo) { this.prNo = prNo; }
    public Date getPrDate() { return prDate; }
    public void setPrDate(Date prDate) { this.prDate = prDate; }
    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
    public EmployeeMaster getPlanner() { return planner; }
    public void setPlanner(EmployeeMaster planner) { this.planner = planner; }
    public String getPrFrom() { return prFrom; }
    public void setPrFrom(String prFrom) { this.prFrom = prFrom; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
    public Division getDivision() { return division; }
    public void setDivision(Division division) { this.division = division; }
    public List<PurchaseRequestTrans> getTransactions() { return transactions; }
    public void setTransactions(List<PurchaseRequestTrans> transactions) { this.transactions = transactions; }
}
