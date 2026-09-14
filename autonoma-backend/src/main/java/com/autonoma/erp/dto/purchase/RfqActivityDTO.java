package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.util.Date;

@Data
public class RfqActivityDTO {
    private Long id;
    private Long rfqRefId;
    private String activityType;
    private String description;
    private String actorId;
    private Date activityDate;
}
