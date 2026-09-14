/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-02
 * Description: Background queue worker for persistent document indexing and crash recovery.
 */
package com.autonoma.erp.modules.platform.docsearch.service;

import com.autonoma.erp.modules.platform.docsearch.entity.DocSearchDocument;
import com.autonoma.erp.modules.platform.docsearch.repository.DocSearchDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DocumentSearchWorker {

    private final DocSearchDocumentRepository docSearchRepository;
    private final DocumentSearchService documentSearchService;

    @Value("${document.search.worker.enabled:true}")
    private boolean workerEnabled;

    @Value("${document.search.worker.batch-size:10}")
    private int batchSize;

    /**
     * Poll queue for PENDING documents and stale PROCESSING jobs.
     */
    @Scheduled(fixedDelayString = "${document.search.worker.poll-interval-ms:15000}", initialDelay = 5000)
    public void processIndexingQueue() {
        if (!workerEnabled) {
            return;
        }

        try {
            // Any PROCESSING job older than 10 minutes is treated as abandoned (e.g. server crash)
            LocalDateTime staleThreshold = LocalDateTime.now().minusMinutes(10);
            List<DocSearchDocument> pendingDocs = docSearchRepository.findPendingForProcessing(staleThreshold, PageRequest.of(0, batchSize));

            if (pendingDocs.isEmpty()) {
                return;
            }

            log.info("DocumentSearchWorker: processing batch of {} document(s)...", pendingDocs.size());

            for (DocSearchDocument doc : pendingDocs) {
                try {
                    documentSearchService.indexDocument(doc);
                } catch (Exception e) {
                    log.error("DocumentSearchWorker: failed to index doc ID {}: {}", doc.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("DocumentSearchWorker error in processing loop: {}", e.getMessage(), e);
        }
    }
}
