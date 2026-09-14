package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.util.Date;

@Data
public class RfqEmailLogDTO {
    private Long id;
    private Long rfqRefId;
    private Long supplierId;
    private String supplierName;
    private String emailTo;
    private String subject;
    private Date sentDate;
    private String status;
    private String errorMessage;
    private String messageId;
    private String inReplyTo;
}
