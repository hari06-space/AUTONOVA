package com.autonoma.erp.dto.purchase.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionLineDTO {
    private Long sourceLineId;
    private BigDecimal requestedQty;
    private Long currentDocumentTransId; // Used when updating an existing document so we don't count its own previous qty
}
