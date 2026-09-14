/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-02
 * Description: DTO representing an individual document content search hit.
 */
package com.autonoma.erp.modules.platform.docsearch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocSearchResultItemDTO {
    private Long documentId;
    private String fileName;
    private String fileType;
    private String moduleCode;
    private String pageCode;
    private String refId;
    private String sourceTable;
    private Integer pageNumber;
    private Integer lineNumber;
    private String sheetName;
    private String cellReference;
    private String matchingSnippet;
    private String matchingText;
    private Float x;
    private Float y;
    private Float width;
    private Float height;
    private Double score;
    private String viewUrl;
}
