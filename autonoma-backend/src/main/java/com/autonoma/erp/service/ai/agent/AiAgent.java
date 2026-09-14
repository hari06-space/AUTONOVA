package com.autonoma.erp.service.ai.agent;

import java.util.Map;

public interface AiAgent {

    /**
     * Checks if this agent can handle the given intent and module.
     *
     * @param intent The detected intent (e.g., "QUERY", "FORECAST", "ACTION")
     * @param module The detected module (e.g., "HR", "SALES")
     * @return true if the agent can handle it, false otherwise
     */
    boolean canHandle(String intent, String module);

    /**
     * Processes the user request and returns the response.
     *
     * @param userId The ID of the user
     * @param tenantId The tenant ID for data isolation
     * @param sessionId The current session ID
     * @param question The user's question or command
     * @param intent The detected intent
     * @param module The detected module
     * @param languageCode The language code of the user
     * @return A map containing the response data (answer, tableData, forecastData, etc.)
     */
    Map<String, Object> process(String userId, String tenantId, String sessionId, String question, String intent, String module, String languageCode);
}
