package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.util.Date;

@Data
public class RfqWorkflowDTO {
    private Long id;
    private Long rfqRefId;
    private Long fromStatusId;
    private String fromStatusName;
    private Long toStatusId;
    private String toStatusName;
    private String remarks;
    private String createdBy;
    private Date createdDate;
}
