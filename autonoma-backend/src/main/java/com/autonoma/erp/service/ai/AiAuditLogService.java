package com.autonoma.erp.service.ai;

import com.autonoma.erp.model.ai.BosAiAuditLog;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.stereotype.Component;

@Component
public class AiAuditLogService {

    public void logInteraction(String question, String response, String generatedQuery, String module, boolean isForecast, String reports, String actions, long executionTime) {
        String userId = SecurityUtils.getCurrentUserId();
        String tenantId = SecurityUtils.getCurrentTenantId();

        BosAiAuditLog log = new BosAiAuditLog();
        log.setUserId(userId != null ? userId : "UNKNOWN");
        log.setTenantId(tenantId != null ? tenantId : "DEFAULT_TENANT");
        log.setQuestion(question);
        log.setResponse(response);
        log.setGeneratedQuery(generatedQuery);
        log.setModulesAccessed(module);
        log.setForecastGenerated(isForecast);
        log.setReportsGenerated(reports);
        log.setErpActionsExecuted(actions);
        log.setExecutionTimeMs(executionTime);

        // In a real implementation, this would save via a JPA repository
        // aiAuditLogRepository.save(log);
    }
}
