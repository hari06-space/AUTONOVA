/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-02
 * Description: DTO for paginated document content search response.
 */
package com.autonoma.erp.modules.platform.docsearch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Data
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocSearchResponseDTO {
    private String query;
    private int totalMatches;
    private int page;
    private int size;
    private int totalPages;
    private List<DocSearchResultItemDTO> items;
}
