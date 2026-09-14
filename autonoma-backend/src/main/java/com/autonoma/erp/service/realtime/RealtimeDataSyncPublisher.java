package com.autonoma.erp.service.realtime;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.io.Serializable;

/**
 * RealtimeDataSyncPublisher — Universal Real-Time Data Table Synchronizer
 * 
 * Independent of user notifications. Broadcasts data mutation events
 * (Save, Update, Delete, Verify, Status Change) across WebSockets to all connected
 * client browser windows so data tables auto-fetch in real-time.
 */
@Service
@Slf4j
public class RealtimeDataSyncPublisher {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(RealtimeDataSyncPublisher.class);

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimeDataSyncPublisher(@Lazy SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Data
    @NoArgsConstructor
    public static class RealtimeMutationEvent implements Serializable {
        private String entityName;
        private String action;
        private Long timestamp;

        public RealtimeMutationEvent(String entityName, String action, Long timestamp) {
            this.entityName = entityName;
            this.action = action;
            this.timestamp = timestamp;
        }
    }

    /**
     * Broadcasts a real-time data change event to all active clients listening on /topic/global-updates
     */
    public void publishMutation(String entityName, String action) {
        try {
            RealtimeMutationEvent event = new RealtimeMutationEvent(entityName, action, System.currentTimeMillis());
            log.info("[REALTIME_SYNC] Broadcasting data mutation event: {} - {} to /topic/global-updates", entityName, action);
            messagingTemplate.convertAndSend("/topic/global-updates", event);
        } catch (Exception e) {
            log.error("[REALTIME_SYNC_FAILED] Failed to publish real-time mutation event: {}", e.getMessage());
        }
    }

    public void publishMutation(String entityName) {
        publishMutation(entityName, "MUTATED");
    }
}
