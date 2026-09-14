/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-02
 * Description: Response DTO for database table content search.
 */
package com.autonoma.erp.modules.platform.docsearch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DbSearchResponseDTO {
    private String query;
    private int totalMatches;
    private int page;
    private int size;
    private int totalPages;
    private List<DbSearchResultItemDTO> items;
}
