package com.autonoma.erp.model;

import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "PP_PURCHASE_SCHEDULE")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseSchedule extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "SUPPLIER_ID")
    private Long supplierId;

    @Column(name = "PO_ID")
    private Long poId;

    @Column(name = "PO_ITEM_ID")
    private Long poItemId;

    @Column(name = "SCHEDULE_QTY", precision = 12, scale = 2)
    private BigDecimal scheduleQty;

    @Column(name = "SCHEDULE_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date scheduleDate;

    @Column(name = "RECEIVE_QTY", precision = 12, scale = 2)
    private BigDecimal receiveQty = BigDecimal.ZERO;

    @Column(name = "ASN_QTY", precision = 12, scale = 2)
    private BigDecimal asnQty = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS")
    private StatusMaster status;
}
