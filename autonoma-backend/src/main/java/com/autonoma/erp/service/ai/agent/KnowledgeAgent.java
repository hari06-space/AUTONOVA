package com.autonoma.erp.service.ai.agent;

import com.autonoma.erp.service.ai.GeminiService;
import com.autonoma.erp.service.ai.KnowledgeRetrievalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class KnowledgeAgent implements AiAgent {

    private final KnowledgeRetrievalService knowledgeRetrievalService;
    private final GeminiService geminiService;

    @Autowired
    public KnowledgeAgent(KnowledgeRetrievalService knowledgeRetrievalService, GeminiService geminiService) {
        this.knowledgeRetrievalService = knowledgeRetrievalService;
        this.geminiService = geminiService;
    }

    @Override
    public boolean canHandle(String intent, String module) {
        return "KNOWLEDGE_QUERY".equals(intent);
    }

    @Override
    public Map<String, Object> process(String userId, String tenantId, String sessionId, String question, String intent, String module, String languageCode) {
        // Simple keyword extraction for the poor-man's RAG, preserve unicode letters!
        List<String> keywords = Arrays.asList(question.replaceAll("[^\\p{L}\\p{N} ]", "").split("\\s+"));
        
        // Retrieve relevant knowledge context from database
        String context = knowledgeRetrievalService.retrieveContext(module, keywords);

        // Build prompt for LLM
        String systemPrompt = """
            You are AURA (Autonoma Unified Response Assistant), an expert in the BOSS ERP Application.
            The user is asking a question about how the application works, its features, or flow.
            
            Use the following context from the Application Knowledge Base to answer the question:
            ---
            %s
            ---
            
            RULES:
            - Respond in the language code: %s
            - If responding in Tamil (TA), you MUST use ONLY the native Tamil script (தமிழ் எழுத்துக்களில்). ABSOLUTELY DO NOT use Tanglish or English alphabets for Tamil words.
            - Provide a clear, step-by-step or descriptive answer.
            - If the context does not contain the exact answer, try to infer it based on the ERP domain, but do not hallucinate specific technical details.
            - Keep the answer under 200 words.
            """.formatted(context, languageCode);

        String answer;
        try {
            answer = geminiService.generateResponse(question, systemPrompt);
            // clean up if Groq wraps in markdown
            if (answer.startsWith("```")) {
                answer = answer.replaceAll("^```[a-zA-Z]*\n?", "").replaceAll("\n?```$", "").trim();
            }
        } catch (Exception e) {
            answer = "Sorry, I am unable to access the knowledge base at the moment.";
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("answer", answer);
        response.put("responseType", "TEXT");
        response.put("languageCode", languageCode);
        response.put("intent", intent);
        response.put("module", module);
        response.put("reportAvailable", false);
        response.put("forecastAvailable", false);
        response.put("timestamp", new Date().toString());
        
        return response;
    }
}
