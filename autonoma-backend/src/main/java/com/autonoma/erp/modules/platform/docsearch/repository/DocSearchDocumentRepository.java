/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-02
 * Description: Repository for document search metadata and queue management.
 */
package com.autonoma.erp.modules.platform.docsearch.repository;

import com.autonoma.erp.modules.platform.docsearch.entity.DocSearchDocument;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface DocSearchDocumentRepository extends JpaRepository<DocSearchDocument, Long> {

    Optional<DocSearchDocument> findByFileHash(String fileHash);

    List<DocSearchDocument> findByFileHashIn(Collection<String> fileHashes);

    @Query("SELECT DISTINCT d.fileHash FROM DocSearchDocument d WHERE d.pageCode IN :pageCodes AND d.indexStatus = 'INDEXED'")
    List<String> findDistinctFileHashesByPageCodes(@Param("pageCodes") Collection<String> pageCodes);

    boolean existsBySourceTableAndSourcePkValue(String sourceTable, String sourcePkValue);

    Optional<DocSearchDocument> findBySourceTableAndSourcePkValue(String sourceTable, String sourcePkValue);

    boolean existsByStoragePath(String storagePath);

    Optional<DocSearchDocument> findByStoragePath(String storagePath);

    @Query("SELECT d FROM DocSearchDocument d WHERE " +
           "(:pageCodes IS NULL OR d.pageCode IN :pageCodes) AND " +
           "(:module IS NULL OR :module = 'ALL' OR UPPER(d.moduleCode) = UPPER(:module)) AND " +
           "(:fileType IS NULL OR :fileType = 'ALL' OR " +
           " (:fileType = 'IMAGE' AND UPPER(d.fileType) IN ('JPG', 'JPEG', 'PNG', 'GIF', 'BMP', 'TIFF', 'WEBP', 'IMAGE')) OR " +
           " (:fileType = 'DOCX' AND UPPER(d.fileType) IN ('DOCX', 'DOC')) OR " +
           " (:fileType = 'XLSX' AND UPPER(d.fileType) IN ('XLSX', 'XLS', 'CSV')) OR " +
           " (:fileType = 'TEXT' AND UPPER(d.fileType) IN ('TEXT', 'TXT', 'LOG', 'JSON', 'XML')) OR " +
           " UPPER(d.fileType) = UPPER(:fileType)) AND " +
           "(LOWER(d.fileName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.refId) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.sourcePkValue) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<DocSearchDocument> searchByFileNameAndMetadata(
            @Param("query") String query,
            @Param("pageCodes") Collection<String> pageCodes,
            @Param("module") String module,
            @Param("fileType") String fileType,
            Pageable pageable);

    @Query("SELECT d FROM DocSearchDocument d WHERE d.indexStatus = 'PENDING' " +
           "OR (d.indexStatus = 'PROCESSING' AND d.lastAttemptDate < :staleTime AND d.indexAttempts < 3) " +
           "ORDER BY d.id ASC")
    List<DocSearchDocument> findPendingForProcessing(@Param("staleTime") LocalDateTime staleTime, Pageable pageable);

    long countByIndexStatus(String indexStatus);
}
