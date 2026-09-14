/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-02
 * Description: Core service for document search orchestration, indexing queue, and permission-aware search.
 */
package com.autonoma.erp.modules.platform.docsearch.service;

import com.autonoma.erp.modules.platform.docsearch.dto.DocIndexStatusDTO;
import com.autonoma.erp.modules.platform.docsearch.dto.DocSearchResponseDTO;
import com.autonoma.erp.modules.platform.docsearch.dto.DocSearchResultItemDTO;
import com.autonoma.erp.modules.platform.docsearch.entity.DocSearchDocument;
import com.autonoma.erp.modules.platform.docsearch.repository.DocSearchDocumentRepository;
import com.autonoma.erp.modules.platform.files.service.FileService;
import com.autonoma.erp.service.admin.BosUserPageAuthService;
import com.autonoma.erp.util.SecurityUtils;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.jdbc.core.JdbcTemplate;

@Service
@RequiredArgsConstructor
public class DocumentSearchService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DocumentSearchService.class);

    private final DocSearchDocumentRepository docSearchRepository;
    private final PythonDocumentProcessingService pythonProcessingService;
    private final BosUserPageAuthService pageAuthService;
    private final FileService fileService;
    private final JdbcTemplate jdbcTemplate;

    @Value("${document.search.storage.root:D:/BOS_DOCUMENTS}")
    private String storageRoot;

    /**
     * Compute SHA-256 for a physical file.
     */
    public String calculateFileHash(File file) {
        try (FileInputStream fis = new FileInputStream(file)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] byteArray = new byte[65536];
            int bytesCount;
            while ((bytesCount = fis.read(byteArray)) != -1) {
                digest.update(byteArray, 0, bytesCount);
            }
            byte[] bytes = digest.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(Integer.toString((b & 0xff) + 0x100, 16).substring(1));
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Failed to compute SHA-256 for {}: {}", file.getAbsolutePath(), e.getMessage());
            return UUID.randomUUID().toString().replace("-", "");
        }
    }

    /**
     * Resolve the absolute path of a document on disk.
     */
    public File resolvePhysicalFile(DocSearchDocument doc) {
        return resolvePhysicalFileFromPath(doc.getStoragePath());
    }

    /**
     * Resolve physical file from path string.
     */
    public File resolvePhysicalFileFromPath(String pathStr) {
        if (pathStr == null || pathStr.isBlank()) {
            return null;
        }

        File direct = new File(pathStr);
        if (direct.exists()) {
            return direct;
        }

        // Relative to configured storage root
        File fromRoot = Paths.get(storageRoot, pathStr).toFile();
        if (fromRoot.exists()) {
            return fromRoot;
        }

        // Try FileService root path
        try {
            Path fileServiceRoot = fileService.getRootPath();
            if (fileServiceRoot != null) {
                File fromService = fileServiceRoot.resolve(pathStr).toFile();
                if (fromService.exists()) {
                    return fromService;
                }
            }
        } catch (Exception ignored) {
        }

        return null;
    }

    /**
     * Register a document for indexing.
     */
    @Transactional
    public DocSearchDocument registerDocument(String moduleCode, String pageCode, String sourceTable,
                                             String sourcePkValue, String refId, String fileName, String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            return null;
        }

        String normPath = storagePath.replace('\\', '/');

        // Check if already registered
        if (sourceTable != null && sourcePkValue != null) {
            Optional<DocSearchDocument> existing = docSearchRepository.findBySourceTableAndSourcePkValue(sourceTable, sourcePkValue);
            if (existing.isPresent()) {
                DocSearchDocument existingDoc = existing.get();
                if (refId != null && !refId.isBlank() && !refId.equals(existingDoc.getRefId())) {
                    existingDoc.setRefId(refId);
                    docSearchRepository.save(existingDoc);
                }
                return null;
            }
        }
        Optional<DocSearchDocument> existingByPath = docSearchRepository.findByStoragePath(normPath);
        if (existingByPath.isPresent()) {
            DocSearchDocument existingDoc = existingByPath.get();
            if (refId != null && !refId.isBlank() && !refId.equals(existingDoc.getRefId())) {
                existingDoc.setRefId(refId);
                docSearchRepository.save(existingDoc);
            }
            return null;
        }

        String cleanExt = "DOC";
        if (fileName != null && fileName.contains(".")) {
            cleanExt = fileName.substring(fileName.lastIndexOf('.') + 1).toUpperCase();
        } else if (normPath.contains(".")) {
            cleanExt = normPath.substring(normPath.lastIndexOf('.') + 1).toUpperCase();
        }

        File physicalFile = resolvePhysicalFileFromPath(normPath);
        String hash = (physicalFile != null && physicalFile.exists())
                ? calculateFileHash(physicalFile)
                : UUID.randomUUID().toString().replace("-", "");
        Long fileSize = (physicalFile != null && physicalFile.exists()) ? physicalFile.length() : null;

        DocSearchDocument doc = DocSearchDocument.builder()
                .moduleCode(moduleCode != null ? moduleCode : "ERP")
                .pageCode(pageCode != null ? pageCode : "GEN")
                .sourceTable(sourceTable != null ? sourceTable : "ATTACHMENT")
                .sourcePkValue(sourcePkValue != null ? sourcePkValue : UUID.randomUUID().toString().substring(0, 8))
                .refId(refId)
                .fileName(fileName != null ? fileName : (physicalFile != null ? physicalFile.getName() : "document"))
                .fileType(cleanExt)
                .storagePath(normPath)
                .fileHash(hash)
                .fileSize(fileSize)
                .totalPages(1)
                .indexStatus("PENDING")
                .indexAttempts(0)
                .createdDate(LocalDateTime.now())
                .createdBy(SecurityUtils.getCurrentUserId() != null ? SecurityUtils.getCurrentUserId() : "SYSTEM")
                .build();

        return docSearchRepository.save(doc);
    }

    /**
     * Register or update an attachment's metadata (especially REF_ID and sourceTable).
     */
    @Transactional
    public DocSearchDocument registerOrUpdateAttachment(String moduleCode, String pageCode, String sourceTable,
                                                        String sourcePkValue, String refId, String fileName, String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            return null;
        }

        String normPath = storagePath.replace('\\', '/');

        // Check by storage path or by source table & pk
        Optional<DocSearchDocument> existing = Optional.empty();
        if (sourceTable != null && sourcePkValue != null) {
            existing = docSearchRepository.findBySourceTableAndSourcePkValue(sourceTable, sourcePkValue);
        }
        if (existing.isEmpty()) {
            existing = docSearchRepository.findByStoragePath(normPath);
        }

        if (existing.isPresent()) {
            DocSearchDocument doc = existing.get();
            boolean changed = false;
            if (refId != null && !refId.isBlank() && !refId.equals(doc.getRefId())) {
                doc.setRefId(refId);
                changed = true;
            }
            if (pageCode != null && !pageCode.isBlank() && !pageCode.equals(doc.getPageCode())) {
                doc.setPageCode(pageCode);
                changed = true;
            }
            if (moduleCode != null && !moduleCode.isBlank() && !moduleCode.equals(doc.getModuleCode())) {
                doc.setModuleCode(moduleCode);
                changed = true;
            }
            if (sourceTable != null && !sourceTable.isBlank() && !sourceTable.equals(doc.getSourceTable())) {
                doc.setSourceTable(sourceTable);
                changed = true;
            }
            if (sourcePkValue != null && !sourcePkValue.isBlank() && !sourcePkValue.equals(doc.getSourcePkValue())) {
                doc.setSourcePkValue(sourcePkValue);
                changed = true;
            }
            if (changed) {
                return docSearchRepository.save(doc);
            }
            return doc;
        }

        // If not found, register fresh
        return registerDocument(moduleCode, pageCode, sourceTable, sourcePkValue, refId, fileName, storagePath);
    }

    /**
     * Immediately triggers background indexing asynchronously.
     */
    public void triggerAsyncIndexing() {
        CompletableFuture.runAsync(() -> {
            try {
                processPendingQueue();
            } catch (Exception e) {
                log.error("Async indexing execution failed: {}", e.getMessage());
            }
        });
    }

    /**
     * Process a batch of pending documents immediately.
     */
    public void processPendingQueue() {
        try {
            LocalDateTime staleThreshold = LocalDateTime.now().minusMinutes(10);
            List<DocSearchDocument> pendingDocs = docSearchRepository.findPendingForProcessing(staleThreshold, PageRequest.of(0, 50));
            for (DocSearchDocument doc : pendingDocs) {
                try {
                    indexDocument(doc);
                } catch (Exception e) {
                    log.error("Error indexing doc {}: {}", doc.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error processing pending queue: {}", e.getMessage());
        }
    }

    /**
     * Helper to derive module code from a relative path or module string.
     */
    public String deriveModuleFromPath(String path) {
        if (path == null) return "ERP";
        String lower = path.toLowerCase();
        if (lower.contains("product") || lower.contains("npd") || lower.contains("bom")) return "NPD";
        if (lower.contains("purchase") || lower.contains("vendor") || lower.contains("rfq") || lower.contains("gate_entry") || lower.contains("grn")) return "PURCHASE";
        if (lower.contains("sales") || lower.contains("quotation") || lower.contains("order") || lower.contains("sm_")) return "SALES";
        if (lower.contains("qms") || lower.contains("quality") || lower.contains("audit") || lower.contains("meeting") || lower.contains("ncr")) return "QMS";
        if (lower.contains("hr") || lower.contains("employee") || lower.contains("ats") || lower.contains("candidate") || lower.contains("attendance")) return "HR";
        if (lower.contains("admin") || lower.contains("company") || lower.contains("user")) return "ADMIN";
        return "MASTER";
    }

    /**
     * Helper to derive default page code from a path.
     */
    public String derivePageFromPath(String path) {
        if (path == null) return "GEN";
        String lower = path.toLowerCase();
        if (lower.contains("product")) return "M3115";
        if (lower.contains("bom")) return "M3110";
        if (lower.contains("quotation")) return "SM1120";
        if (lower.contains("enquiry")) return "SM1110";
        if (lower.contains("purchase")) return "PU1110";
        if (lower.contains("employee")) return "HR1110";
        if (lower.contains("audit")) return "QM1120";
        if (lower.contains("meeting")) return "QM1110";
        return "GEN";
    }

    /**
     * Sync all existing attachments from known ERP tables into DOC_SEARCH_DOCUMENT.
     */
    @Transactional
    public Map<String, Object> syncExistingAttachments() {
        int registered = 0;
        int skipped = 0;

        // 1. Scan NPD_ATTACHMENT_PATH
        try {
            List<Map<String, Object>> npdRows = jdbcTemplate.queryForList(
                    "SELECT a.id, a.page_code, a.file_name, a.path, p.ITEM_NO as item_no " +
                    "FROM dbo.NPD_ATTACHMENT_PATH a WITH (NOLOCK) " +
                    "LEFT JOIN dbo.NPD_PRODUCT_MASTER p WITH (NOLOCK) ON COALESCE(a.REF_ID, TRY_CAST(a.REF_ID_STR AS bigint)) = p.id " +
                    "WHERE a.path IS NOT NULL");
            for (Map<String, Object> row : npdRows) {
                String id = String.valueOf(row.get("id"));
                String pageCode = row.get("page_code") != null ? (String) row.get("page_code") : "M3115";
                String fileName = (String) row.get("file_name");
                String path = (String) row.get("path");
                String itemNo = (String) row.get("item_no");
                DocSearchDocument doc = registerOrUpdateAttachment("NPD", pageCode, "NPD_ATTACHMENT_PATH", id, itemNo, fileName, path);
                if (doc != null) registered++; else skipped++;
            }
        } catch (Exception e) {
            log.warn("Could not scan NPD_ATTACHMENT_PATH: {}", e.getMessage());
        }

        // 2. Scan FILE_ATTACHMENT_METADATA (Catches any file uploaded anywhere in the ERP!)
        try {
            List<Map<String, Object>> metaRows = jdbcTemplate.queryForList(
                    "SELECT id, storage_path, original_file_name FROM dbo.FILE_ATTACHMENT_METADATA WITH (NOLOCK) WHERE storage_path IS NOT NULL");
            for (Map<String, Object> row : metaRows) {
                String id = String.valueOf(row.get("id"));
                String path = (String) row.get("storage_path");
                String origName = (String) row.get("original_file_name");
                String mod = deriveModuleFromPath(path);
                String page = derivePageFromPath(path);
                DocSearchDocument doc = registerOrUpdateAttachment(mod, page, "FILE_ATTACHMENT_METADATA", id, null, origName, path);
                if (doc != null) registered++; else skipped++;
            }
        } catch (Exception e) {
            log.debug("FILE_ATTACHMENT_METADATA scan skipped: {}", e.getMessage());
        }

        // 3. Scan QMS_ATTACHMENT_PATH
        try {
            List<Map<String, Object>> qmsRows = jdbcTemplate.queryForList(
                    "SELECT id, page_code, file_name, path FROM dbo.QMS_ATTACHMENT_PATH WITH (NOLOCK) WHERE path IS NOT NULL");
            for (Map<String, Object> row : qmsRows) {
                String id = String.valueOf(row.get("id"));
                String pageCode = row.get("page_code") != null ? (String) row.get("page_code") : "QM1120";
                String fileName = (String) row.get("file_name");
                String path = (String) row.get("path");
                DocSearchDocument doc = registerOrUpdateAttachment("QMS", pageCode, "QMS_ATTACHMENT_PATH", id, null, fileName, path);
                if (doc != null) registered++; else skipped++;
            }
        } catch (Exception e) {
            log.debug("QMS_ATTACHMENT_PATH query skipped: {}", e.getMessage());
        }

        // 4. Scan HR_ATTACHMENT_PATH & ATS_ATTACHMENT_PATH
        try {
            List<Map<String, Object>> hrRows = jdbcTemplate.queryForList(
                    "SELECT id, page_code, file_name, path FROM dbo.HR_ATTACHMENT_PATH WITH (NOLOCK) WHERE path IS NOT NULL");
            for (Map<String, Object> row : hrRows) {
                String id = String.valueOf(row.get("id"));
                String pageCode = row.get("page_code") != null ? (String) row.get("page_code") : "HR1110";
                String fileName = (String) row.get("file_name");
                String path = (String) row.get("path");
                DocSearchDocument doc = registerOrUpdateAttachment("HR", pageCode, "HR_ATTACHMENT_PATH", id, null, fileName, path);
                if (doc != null) registered++; else skipped++;
            }
        } catch (Exception e) {
            log.debug("HR_ATTACHMENT_PATH query skipped: {}", e.getMessage());
        }

        // 5. Scan Purchase & Sales Attachments
        try {
            List<Map<String, Object>> purchaseRows = jdbcTemplate.queryForList(
                    "SELECT id, path, file_name FROM dbo.PP_PURCHASE_ATTACHMENT WITH (NOLOCK) WHERE path IS NOT NULL");
            for (Map<String, Object> row : purchaseRows) {
                String id = String.valueOf(row.get("id"));
                String path = (String) row.get("path");
                String fileName = (String) row.get("file_name");
                DocSearchDocument doc = registerOrUpdateAttachment("PURCHASE", "PU1110", "PP_PURCHASE_ATTACHMENT", id, null, fileName, path);
                if (doc != null) registered++; else skipped++;
            }
        } catch (Exception ignored) {}

        try {
            List<Map<String, Object>> salesRows = jdbcTemplate.queryForList(
                    "SELECT id, path, file_name FROM dbo.SALES_ATTACHMENTS_PATH WITH (NOLOCK) WHERE path IS NOT NULL");
            for (Map<String, Object> row : salesRows) {
                String id = String.valueOf(row.get("id"));
                String path = (String) row.get("path");
                String fileName = (String) row.get("file_name");
                DocSearchDocument doc = registerOrUpdateAttachment("SALES", "SM1110", "SALES_ATTACHMENTS_PATH", id, null, fileName, path);
                if (doc != null) registered++; else skipped++;
            }
        } catch (Exception ignored) {}

        // 6. Scan Physical Storage Directory for any unindexed files on disk
        try {
            Path root = fileService != null ? fileService.getRootPath() : Paths.get(storageRoot);
            if (root != null && Files.exists(root)) {
                try (Stream<Path> stream = Files.walk(root, 10)) {
                    stream.filter(Files::isRegularFile)
                            .filter(p -> !p.toString().contains(".search_index"))
                            .forEach(p -> {
                                try {
                                    String relPath = root.relativize(p).toString().replace('\\', '/');
                                    String fileName = p.getFileName().toString();
                                    String mod = deriveModuleFromPath(relPath);
                                    String page = derivePageFromPath(relPath);
                                    registerOrUpdateAttachment(mod, page, "FILESYSTEM", null, null, fileName, relPath);
                                } catch (Exception ignored) {}
                            });
                }
            }
        } catch (Exception e) {
            log.debug("Filesystem scan skipped: {}", e.getMessage());
        }

        // Trigger indexing for all newly registered PENDING documents
        triggerAsyncIndexing();

        Map<String, Object> res = new HashMap<>();
        res.put("registered", registered);
        res.put("alreadyExistedOrSkipped", skipped);
        res.put("totalPendingInQueue", docSearchRepository.countByIndexStatus("PENDING"));
        return res;
    }

    /**
     * Search documents across content and metadata (Hybrid Search: File Name LIKE + Content FTS).
     */
    public DocSearchResponseDTO searchDocuments(String query, String module, String fileType, int page, int size) {
        if (query == null || query.trim().isEmpty()) {
            return DocSearchResponseDTO.builder()
                    .query("")
                    .totalMatches(0)
                    .page(page)
                    .size(size)
                    .totalPages(0)
                    .items(Collections.emptyList())
                    .build();
        }

        String cleanQuery = query.trim();

        // Determine current user permissions upfront
        String currentUserId = null;
        try {
            currentUserId = SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {
        }

        // Upfront Authorization Check: Only search documents belonging to pages where user has 'export' rights
        Set<String> allowedPages = (currentUserId != null) ? pageAuthService.getAllowedPageCodes(currentUserId, "export") : null;
        if (allowedPages != null && allowedPages.isEmpty()) {
            log.info("User {} has no export permissions on any page in BOS_USER_PAGE_AUTH. Skipping search immediately.", currentUserId);
            return DocSearchResponseDTO.builder()
                    .query(cleanQuery)
                    .totalMatches(0)
                    .page(page)
                    .size(size)
                    .totalPages(0)
                    .items(Collections.emptyList())
                    .build();
        }

        List<String> allowedHashes = null;
        if (allowedPages != null) {
            allowedHashes = docSearchRepository.findDistinctFileHashesByPageCodes(allowedPages);
        }

        Map<Long, DocSearchResultItemDTO> resultMap = new LinkedHashMap<>();

        // ─── 1. Metadata / File Name LIKE Search (SQL) ───
        try {
            List<DocSearchDocument> metadataMatchedDocs = docSearchRepository.searchByFileNameAndMetadata(
                    cleanQuery, allowedPages, module, fileType, PageRequest.of(0, 100));

            for (DocSearchDocument doc : metadataMatchedDocs) {
                if (currentUserId != null && doc.getPageCode() != null) {
                    if (!pageAuthService.hasPermission(currentUserId, doc.getPageCode(), "export")) {
                        continue;
                    }
                }

                double score = 6.0;
                String lowerFn = doc.getFileName() != null ? doc.getFileName().toLowerCase() : "";
                String lowerQ = cleanQuery.toLowerCase();
                if (lowerFn.equals(lowerQ)) {
                    score = 15.0;
                } else if (lowerFn.startsWith(lowerQ) || lowerFn.contains("/" + lowerQ) || lowerFn.contains("_" + lowerQ)) {
                    score = 12.0;
                } else if (lowerFn.contains(lowerQ)) {
                    score = 8.0;
                }

                String snippet = highlightMatch(doc.getFileName(), cleanQuery);

                DocSearchResultItemDTO item = DocSearchResultItemDTO.builder()
                        .documentId(doc.getId())
                        .fileName(doc.getFileName())
                        .fileType(doc.getFileType())
                        .moduleCode(doc.getModuleCode())
                        .pageCode(doc.getPageCode())
                        .refId(doc.getRefId())
                        .sourceTable(doc.getSourceTable())
                        .pageNumber(1)
                        .lineNumber(1)
                        .matchingSnippet(snippet)
                        .matchingText(doc.getFileName())
                        .score(score)
                        .viewUrl("/api/document-search/document/" + doc.getId() + "/view")
                        .build();

                resultMap.put(doc.getId(), item);
            }
        } catch (Exception e) {
            log.warn("Metadata search query failed: {}", e.getMessage());
        }

        // ─── 2. Python FTS5 Content Search ───
        if (allowedPages == null || (allowedHashes != null && !allowedHashes.isEmpty())) {
            int searchLimit = 200;
            JsonNode searchResult = pythonProcessingService.searchIndex(cleanQuery, searchLimit, allowedHashes);

            if (searchResult != null && searchResult.path("success").asBoolean(false)) {
                JsonNode matchesNode = searchResult.path("matches");
                if (matchesNode.isArray() && !matchesNode.isEmpty()) {
                    Set<String> fileHashes = new HashSet<>();
                    for (JsonNode m : matchesNode) {
                        fileHashes.add(m.path("fileHash").asText());
                    }

                    List<DocSearchDocument> docs = docSearchRepository.findByFileHashIn(fileHashes);
                    Map<String, List<DocSearchDocument>> docsByHash = docs.stream()
                            .collect(Collectors.groupingBy(DocSearchDocument::getFileHash));

                    for (JsonNode match : matchesNode) {
                        String hash = match.path("fileHash").asText();
                        List<DocSearchDocument> matchingDocs = docsByHash.get(hash);
                        if (matchingDocs == null || matchingDocs.isEmpty()) {
                            continue;
                        }

                        for (DocSearchDocument doc : matchingDocs) {
                            if (module != null && !module.isBlank() && !"ALL".equalsIgnoreCase(module) &&
                                    (doc.getModuleCode() == null || !doc.getModuleCode().equalsIgnoreCase(module))) {
                                continue;
                            }

                            if (!matchesFileType(doc.getFileType(), fileType)) {
                                continue;
                            }

                            if (currentUserId != null && doc.getPageCode() != null) {
                                if (!pageAuthService.hasPermission(currentUserId, doc.getPageCode(), "export")) {
                                    continue;
                                }
                            }

                            Float x = match.hasNonNull("x") ? Float.valueOf((float) match.path("x").asDouble()) : null;
                            Float y = match.hasNonNull("y") ? Float.valueOf((float) match.path("y").asDouble()) : null;
                            Float w = match.hasNonNull("w") ? Float.valueOf((float) match.path("w").asDouble()) : null;
                            Float h = match.hasNonNull("h") ? Float.valueOf((float) match.path("h").asDouble()) : null;
                            double ftsScore = match.path("score").asDouble(1.0);

                            if (resultMap.containsKey(doc.getId())) {
                                DocSearchResultItemDTO existingItem = resultMap.get(doc.getId());
                                existingItem.setScore(existingItem.getScore() + ftsScore);
                                existingItem.setPageNumber(match.path("page").asInt(1));
                                existingItem.setLineNumber(match.path("line").asInt(1));
                                existingItem.setSheetName(match.hasNonNull("sheet") ? match.path("sheet").asText() : null);
                                existingItem.setCellReference(match.hasNonNull("cell") ? match.path("cell").asText() : null);
                                existingItem.setMatchingSnippet(match.path("snippet").asText());
                                existingItem.setMatchingText(match.path("text").asText());
                                existingItem.setX(x);
                                existingItem.setY(y);
                                existingItem.setWidth(w);
                                existingItem.setHeight(h);
                            } else {
                                DocSearchResultItemDTO item = DocSearchResultItemDTO.builder()
                                        .documentId(doc.getId())
                                        .fileName(doc.getFileName())
                                        .fileType(doc.getFileType())
                                        .moduleCode(doc.getModuleCode())
                                        .pageCode(doc.getPageCode())
                                        .refId(doc.getRefId())
                                        .sourceTable(doc.getSourceTable())
                                        .pageNumber(match.path("page").asInt(1))
                                        .lineNumber(match.path("line").asInt(1))
                                        .sheetName(match.hasNonNull("sheet") ? match.path("sheet").asText() : null)
                                        .cellReference(match.hasNonNull("cell") ? match.path("cell").asText() : null)
                                        .matchingSnippet(match.path("snippet").asText())
                                        .matchingText(match.path("text").asText())
                                        .x(x)
                                        .y(y)
                                        .width(w)
                                        .height(h)
                                        .score(ftsScore)
                                        .viewUrl("/api/document-search/document/" + doc.getId() + "/view")
                                        .build();

                                resultMap.put(doc.getId(), item);
                            }
                        }
                    }
                }
            }
        }

        // Sort combined results by score descending
        List<DocSearchResultItemDTO> candidateItems = new ArrayList<>(resultMap.values());
        candidateItems.sort(Comparator.comparingDouble(DocSearchResultItemDTO::getScore).reversed());

        int totalMatches = candidateItems.size();
        int totalPages = (int) Math.ceil((double) totalMatches / size);
        int fromIndex = Math.min(page * size, totalMatches);
        int toIndex = Math.min(fromIndex + size, totalMatches);
        List<DocSearchResultItemDTO> pagedItems = candidateItems.subList(fromIndex, toIndex);

        return DocSearchResponseDTO.builder()
                .query(cleanQuery)
                .totalMatches(totalMatches)
                .page(page)
                .size(size)
                .totalPages(totalPages)
                .items(pagedItems)
                .build();
    }

    private String highlightMatch(String text, String query) {
        if (text == null || query == null || query.isBlank()) {
            return text;
        }
        int idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx < 0) {
            return text;
        }
        return text.substring(0, idx) + "<mark>" + text.substring(idx, idx + query.length()) + "</mark>" + text.substring(idx + query.length());
    }

    private boolean matchesFileType(String docFileType, String requestedFileType) {
        if (requestedFileType == null || requestedFileType.isBlank() || "ALL".equalsIgnoreCase(requestedFileType)) {
            return true;
        }
        if (docFileType == null) {
            return false;
        }
        String docType = docFileType.trim().toUpperCase();
        String reqType = requestedFileType.trim().toUpperCase();
        if (docType.equals(reqType)) {
            return true;
        }
        if ("IMAGE".equals(reqType)) {
            return Set.of("JPG", "JPEG", "PNG", "GIF", "BMP", "TIFF", "WEBP", "IMAGE").contains(docType);
        }
        if ("DOCX".equals(reqType)) {
            return Set.of("DOCX", "DOC").contains(docType);
        }
        if ("XLSX".equals(reqType)) {
            return Set.of("XLSX", "XLS", "CSV").contains(docType);
        }
        if ("TEXT".equals(reqType)) {
            return Set.of("TEXT", "TXT", "LOG", "JSON", "XML").contains(docType);
        }
        return false;
    }

    /**
     * Index an individual document record.
     */
    @Transactional
    public boolean indexDocument(DocSearchDocument doc) {
        File physicalFile = resolvePhysicalFile(doc);
        if (physicalFile == null || !physicalFile.exists()) {
            doc.setIndexStatus("FAILED");
            doc.setIndexAttempts(doc.getIndexAttempts() + 1);
            doc.setLastAttemptDate(LocalDateTime.now());
            doc.setIndexError("Physical file not found on disk: " + doc.getStoragePath());
            docSearchRepository.save(doc);
            return false;
        }

        try {
            doc.setIndexStatus("PROCESSING");
            doc.setLastAttemptDate(LocalDateTime.now());
            docSearchRepository.save(doc);

            String hash = calculateFileHash(physicalFile);
            doc.setFileHash(hash);
            doc.setFileSize(physicalFile.length());

            JsonNode extractResult = pythonProcessingService.extractAndIndex(physicalFile.getAbsolutePath(), hash);
            if (extractResult != null && extractResult.path("success").asBoolean(false)) {
                doc.setIndexStatus("INDEXED");
                doc.setTotalPages(extractResult.path("pageCount").asInt(1));
                doc.setIndexError(null);
                docSearchRepository.save(doc);
                log.info("Successfully indexed document ID {} ({}) - {} rows", doc.getId(), doc.getFileName(), extractResult.path("rowCount").asInt(0));
                return true;
            } else {
                String err = extractResult != null ? extractResult.path("error").asText("Extraction failed") : "Python process returned null";
                doc.setIndexStatus("FAILED");
                doc.setIndexAttempts(doc.getIndexAttempts() + 1);
                doc.setIndexError(err);
                docSearchRepository.save(doc);
                log.warn("Failed indexing document ID {}: {}", doc.getId(), err);
                return false;
            }
        } catch (Exception e) {
            doc.setIndexStatus("FAILED");
            doc.setIndexAttempts(doc.getIndexAttempts() + 1);
            doc.setIndexError(e.getMessage());
            docSearchRepository.save(doc);
            log.error("Exception indexing document ID {}: {}", doc.getId(), e.getMessage(), e);
            return false;
        }
    }

    /**
     * Trigger manual indexing of real pending documents from the queue and synchronize new attachments.
     */
    @Transactional
    public Map<String, Object> indexPocDocuments() {
        // 1. Sync any newly added attachments from source tables first
        try {
            syncExistingAttachments();
        } catch (Exception e) {
            log.warn("Attachment sync before manual indexing had warning: {}", e.getMessage());
        }

        // 2. Fetch pending documents from queue for processing
        LocalDateTime staleThreshold = LocalDateTime.now().minusMinutes(10);
        List<DocSearchDocument> pendingDocs = docSearchRepository.findPendingForProcessing(staleThreshold, PageRequest.of(0, 100));

        int successCount = 0;
        int failedCount = 0;
        for (DocSearchDocument doc : pendingDocs) {
            boolean ok = indexDocument(doc);
            if (ok) {
                successCount++;
            } else {
                failedCount++;
            }
        }

        DocIndexStatusDTO status = getStatus();

        Map<String, Object> result = new HashMap<>();
        result.put("totalDiscovered", pendingDocs.size());
        result.put("successfullyIndexed", successCount);
        result.put("failedCount", failedCount);
        result.put("status", status);
        result.put("message", String.format("Indexing complete! %d of %d pending documents indexed successfully (Total indexed: %d).",
                successCount, pendingDocs.size(), status.getIndexedDocuments()));
        return result;
    }

    private void addPocDocIfFileExists(List<DocSearchDocument> list, String module, String pageCode, String filePath, String fileType, String refId) {
        File file = new File(filePath);
        if (!file.exists()) {
            return;
        }

        String hash = calculateFileHash(file);
        Optional<DocSearchDocument> existing = docSearchRepository.findByFileHash(hash);
        if (existing.isPresent()) {
            list.add(existing.get());
            return;
        }

        DocSearchDocument doc = DocSearchDocument.builder()
                .moduleCode(module)
                .pageCode(pageCode)
                .sourceTable("POC_FILE_REGISTRY")
                .sourcePkValue(UUID.randomUUID().toString().substring(0, 8))
                .refId(refId)
                .fileName(file.getName())
                .fileType(fileType)
                .storagePath(filePath)
                .fileHash(hash)
                .fileSize(file.length())
                .totalPages(1)
                .indexStatus("PENDING")
                .indexAttempts(0)
                .createdBy("SYSTEM")
                .build();

        doc = docSearchRepository.save(doc);
        list.add(doc);
    }

    /**
     * Get system-wide index status.
     */
    public DocIndexStatusDTO getStatus() {
        long total = docSearchRepository.count();
        long indexed = docSearchRepository.countByIndexStatus("INDEXED");
        long pending = docSearchRepository.countByIndexStatus("PENDING");
        long failed = docSearchRepository.countByIndexStatus("FAILED");

        JsonNode pyStatus = pythonProcessingService.getIndexStatus();
        int localFiles = pyStatus != null ? pyStatus.path("indexedFiles").asInt(0) : 0;
        int localRows = pyStatus != null ? pyStatus.path("totalRows").asInt(0) : 0;
        long localBytes = pyStatus != null ? pyStatus.path("dbSizeBytes").asLong(0) : 0;

        return DocIndexStatusDTO.builder()
                .totalDocuments(total)
                .indexedDocuments(indexed)
                .pendingDocuments(pending)
                .failedDocuments(failed)
                .localIndexFiles(localFiles)
                .localIndexRows(localRows)
                .localIndexSizeBytes(localBytes)
                .build();
    }

    /**
     * Retrieve document entity for secure streaming.
     */
    public DocSearchDocument getDocumentById(Long documentId) {
        return docSearchRepository.findById(documentId).orElse(null);
    }

    /**
     * Render high-resolution page preview with visual highlights.
     */
    public JsonNode getDocumentPagePreview(Long documentId, int page, String query, boolean highlight) {
        DocSearchDocument doc = docSearchRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));

        File physicalFile = resolvePhysicalFileFromPath(doc.getStoragePath());
        if (physicalFile == null || !physicalFile.exists()) {
            throw new IllegalArgumentException("Physical document file does not exist on disk: " + doc.getStoragePath());
        }

        return pythonProcessingService.renderPagePreview(physicalFile.getAbsolutePath(), page, query, highlight);
    }
}
