package com.autonoma.erp.model;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.master.organization.entity.Division;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "PP_COMPARISON_DECISION")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class ComparisonDecision extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RFQ_REF_ID", nullable = false)
    private RfqHead rfqHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RECOMMENDED_SUPPLIER_ID")
    private AccountLedger recommendedSupplier;

    @Column(name = "RECOMMENDED_REASON", columnDefinition = "NVARCHAR(MAX)")
    private String recommendedReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SELECTED_SUPPLIER_ID", nullable = false)
    private AccountLedger selectedSupplier;

    @Column(name = "OVERRIDE_REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String overrideRemarks;

    @Column(name = "DECISION_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date decisionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS_ID", nullable = false)
    private StatusMaster status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION", nullable = false)
    private Division division;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public RfqHead getRfqHead() { return rfqHead; }
    public void setRfqHead(RfqHead rfqHead) { this.rfqHead = rfqHead; }
    public AccountLedger getRecommendedSupplier() { return recommendedSupplier; }
    public void setRecommendedSupplier(AccountLedger recommendedSupplier) { this.recommendedSupplier = recommendedSupplier; }
    public String getRecommendedReason() { return recommendedReason; }
    public void setRecommendedReason(String recommendedReason) { this.recommendedReason = recommendedReason; }
    public AccountLedger getSelectedSupplier() { return selectedSupplier; }
    public void setSelectedSupplier(AccountLedger selectedSupplier) { this.selectedSupplier = selectedSupplier; }
    public String getOverrideRemarks() { return overrideRemarks; }
    public void setOverrideRemarks(String overrideRemarks) { this.overrideRemarks = overrideRemarks; }
    public Date getDecisionDate() { return decisionDate; }
    public void setDecisionDate(Date decisionDate) { this.decisionDate = decisionDate; }
    public StatusMaster getStatus() { return status; }
    public void setStatus(StatusMaster status) { this.status = status; }
    public Division getDivision() { return division; }
    public void setDivision(Division division) { this.division = division; }
}
