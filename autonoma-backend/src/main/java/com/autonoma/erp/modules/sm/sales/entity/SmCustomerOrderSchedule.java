package com.autonoma.erp.modules.sm.sales.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.math.BigDecimal;

@Entity
@Table(name = "SM_CUST_ORDER_SCHEDULE")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SmCustomerOrderSchedule extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "CUSTOMER_ID")
    private Long customerId;

    @Column(name = "PO_ID")
    private Long orderId;

    @Column(name = "PO_ITEM_ID")
    private Long orderItemId;

    @Column(name = "SCHEDULE_QTY")
    private BigDecimal scheduleQty;

    @Column(name = "SCHEDULE_DATE")
    @Temporal(TemporalType.DATE)
    private Date scheduleDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private StatusMaster statusMaster;

    // We can map a transient field or handle despatchQty in queries if needed,
    // but the DB schema doesn't have it. We will rely on order detail for despatched qty.
}
