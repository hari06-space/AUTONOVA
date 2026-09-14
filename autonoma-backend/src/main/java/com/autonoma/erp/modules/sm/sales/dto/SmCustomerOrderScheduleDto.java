package com.autonoma.erp.modules.sm.sales.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;

@Data
public class SmCustomerOrderScheduleDto {
    private Long id;
    private Long customerId;
    private Long orderId;
    private String orderNo;
    private Long orderItemId;
    private String itemCode;
    private String itemName;
    private String uom;
    private Integer orderQty;
    private BigDecimal scheduleQty;
    private Date scheduleDate;
    private Long status;
    private String statusName;
    private BigDecimal despatchQty;
    private BigDecimal balanceQty;
}
