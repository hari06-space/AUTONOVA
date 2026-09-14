package com.autonoma.erp.service.ai.agent;

import com.autonoma.erp.service.ai.AiAuditLogService;
import com.autonoma.erp.service.ai.AiConversationService;
import com.autonoma.erp.service.ai.ConversationMemoryManager;

import com.autonoma.erp.service.ai.LanguageDetectionService;
import com.autonoma.erp.service.ai.IntentDetectionService;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AgentOrchestrator {

    private final List<AiAgent> agents;
    private final LanguageDetectionService languageService;
    private final IntentDetectionService intentService;
    private final com.autonoma.erp.service.ai.ConversationMemoryManager memoryManager;
    private final com.autonoma.erp.service.ai.AiAuditLogService auditLogService;
    private final com.autonoma.erp.service.ai.AiConversationService conversationService;

    @Autowired
    public AgentOrchestrator(List<AiAgent> agents, LanguageDetectionService languageService, IntentDetectionService intentService, com.autonoma.erp.service.ai.ConversationMemoryManager memoryManager, com.autonoma.erp.service.ai.AiAuditLogService auditLogService, com.autonoma.erp.service.ai.AiConversationService conversationService) {
        this.agents = agents;
        this.languageService = languageService;
        this.intentService = intentService;
        this.memoryManager = memoryManager;
        this.auditLogService = auditLogService;
        this.conversationService = conversationService;
    }

    public Map<String, Object> routeRequest(String userId, String sessionId, String question) {
        // Step 1: Detect Tenant (assuming SecurityUtils handles this in multi-tenant setup)
        String tenantId = SecurityUtils.getCurrentTenantId();
        
        // Context Memory Resolution
        String resolvedQuestion = memoryManager.resolveContextualQuery(userId, sessionId, question);

        // Step 2: Detect Language
        String languageCode = languageService.detectLanguage(resolvedQuestion);

        // Step 3: Detect Intent
        IntentDetectionService.IntentResult intentResult = intentService.detectIntent(resolvedQuestion);
        String intent = intentResult.intent();
        String module = intentResult.module();

        // Step 4: Route to the appropriate Agent
        AiAgent selectedAgent = agents.stream()
                .filter(agent -> agent.canHandle(intent, module))
                .findFirst()
                .orElse(null);

        Map<String, Object> finalResponse;
        long startTime = System.currentTimeMillis();
        
        if (selectedAgent != null) {
            finalResponse = selectedAgent.process(userId, tenantId, sessionId, resolvedQuestion, intent, module, languageCode);
        } else {
            // Fallback response if no agent can handle the request
            finalResponse = Map.of(
                    "answer", "I am currently unable to process requests for the " + module + " module or the " + intent + " action. Please try asking something else.",
                    "responseType", "TEXT",
                    "languageCode", languageCode,
                    "intent", intent,
                    "module", module,
                    "reportAvailable", false,
                    "forecastAvailable", false
            );
        }
        
        long executionTime = System.currentTimeMillis() - startTime;
        boolean isForecast = finalResponse.get("forecastAvailable") != null && (Boolean) finalResponse.get("forecastAvailable");
        
        // Save conversation history so suggestions and memory work properly
        String finalAnswer = (String) finalResponse.get("answer");
        String finalResponseType = (String) finalResponse.get("responseType");
        boolean isReport = "REPORT".equals(intent);
        
        // Find query result if available (it might be inside tableData)
        String queryExecuted = null;
        if (finalResponse.get("tableData") != null) {
            Map<String, Object> td = (Map<String, Object>) finalResponse.get("tableData");
            queryExecuted = "NativeQuery:" + td.get("tableName");
        }
        
        conversationService.saveConversation(
            userId, sessionId, resolvedQuestion, finalAnswer, languageCode,
            intent, module, queryExecuted, isReport, isForecast, finalResponseType
        );
        
        auditLogService.logInteraction(resolvedQuestion, finalAnswer, queryExecuted, module, isForecast, null, null, executionTime);
        
        return finalResponse;
    }
}
