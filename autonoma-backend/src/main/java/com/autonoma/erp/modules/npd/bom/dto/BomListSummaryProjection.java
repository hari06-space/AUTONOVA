/*
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-05
 * Description: Spring Data JPA projection for Product BOM Master list view with process, material, machine, and tool counts.
 */
package com.autonoma.erp.modules.npd.bom.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface BomListSummaryProjection {
    Long getId();
    String getBomNo();
    String getRevNo();
    LocalDate getRevDate();
    Boolean getIsActive();
    BigDecimal getBaseQuantity();
    String getBomUsage();
    String getRemarks();
    Long getProductId();
    String getProductItemNo();
    String getProductItemName();
    Integer getProcessCount();
    Integer getMaterialCount();
    Integer getMachineCount();
    Integer getToolCount();
}
