/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-02
 * Description: DTO representing a database table content search hit across ERP tables.
 */
package com.autonoma.erp.modules.platform.docsearch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DbSearchResultItemDTO {
    private String tableName;
    private String tableDisplayName;
    private String moduleCode;
    private String moduleName;
    private String pageCode;
    private String pageName;
    private Object recordId;
    private String referenceCode; // Part No / Item Code / PO No / Code / Emp Code
    private String primaryTitle;   // Product Name / Ledger Name / Employee Name / Title
    private String matchedColumn;  // Column name where match occurred
    private String matchedValue;   // Value that matched
    private String highlightedSnippet; // Highlighted with <mark> tags
    private String additionalDetails; // e.g. "HSN: 84128030 | Category: Spares"
}
