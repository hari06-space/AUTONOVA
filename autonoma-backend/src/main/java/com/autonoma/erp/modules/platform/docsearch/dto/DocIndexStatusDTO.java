/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-02
 * Description: DTO for document search indexing status and metrics.
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
public class DocIndexStatusDTO {
    private long totalDocuments;
    private long indexedDocuments;
    private long pendingDocuments;
    private long failedDocuments;
    private int localIndexFiles;
    private int localIndexRows;
    private long localIndexSizeBytes;
}
