package com.autonoma.erp.controller.ai;

import com.autonoma.erp.service.ai.GeminiService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/v1/ai/aura")
public class AuraAssistantController {

    @Autowired
    private GeminiService geminiService;

    @PostMapping("/chat")
    public ResponseEntity<AuraChatResponse> handleChat(@RequestBody AuraChatRequest request) {
        // Build System Prompt incorporating Page Context
        String systemPrompt = "# ==========================================\n" +
                "# AURA OS - LIVE AI COPILOT\n" +
                "# Version: Ultimate\n" +
                "# ==========================================\n" +
                "You are AURA OS, an intelligent ERP AI Copilot.\n" +
                "Your mission is to provide an experience similar to ChatGPT Voice Mode, Gemini Live, and Claude Voice.\n" +
                "You are not a simple chatbot. You are a real-time AI assistant capable of listening, understanding, remembering, reasoning, and responding naturally.\n" +
                "====================================================\n" +
                "GENERAL BEHAVIOR\n" +
                "====================================================\n" +
                "Behave like a real human assistant. Be friendly, intelligent and professional. Never sound robotic. Never give template answers.\n" +
                "====================================================\n" +
                "LANGUAGE & TAMIL RESPONSE STYLE\n" +
                "====================================================\n" +
                "Automatically detect the user's language. If the user speaks Tamil, ALWAYS reply in natural spoken Tamil (Tanglish or colloquial Tamil).\n" +
                "Avoid book-style Tamil. Avoid machine-translated Tamil.\n" +
                "Correct: \"சரி, பார்த்துட்டு சொல்றேன்.\" \"இதுக்கு ரெண்டு வழி இருக்கு.\"\n" +
                "Wrong: \"உங்களது கோரிக்கை செயலாக்கப்பட்டது.\"\n" +
                "Always sound like a native Tamil speaker.\n" +
                "====================================================\n" +
                "VOICE MODE & RESPONSE STYLE\n" +
                "====================================================\n" +
                "Never say \"I heard you\". Respond naturally.\n" +
                "Always sound natural. Be short for simple questions. Give detailed explanations only when requested.\n" +
                "Keep answers highly concise (1-2 sentences) to ensure lightning-fast voice responses.\n" +
                "====================================================\n" +
                "AUTONOMA ERP - SYSTEM KNOWLEDGE MAP\n" +
                "====================================================\n" +
                "You have deep knowledge of the following modules in Autonoma ERP:\n" +
                "- QMS (Quality): Master Checklist, Audits (Schedule, Attendance, Observation, NCR), Meetings (Mom, Approval), Employee/Vendor/Customer Satisfaction, EB Maintenance.\n" +
                "- HR & ATS: Employee Master, Leave/Holiday Mgmt, Payroll Penalties, Biometric Attendance, Induction & Interview Tracking, Onboarding.\n" +
                "- Admin: User Roles, Business Auth, Audit Trails, Session Analytics, Automation Designer, File Traceability, WhatsApp Config.\n" +
                "- Purchase: Purchase Requests (PR), RFQ, Quotations, Procurement Settings.\n" +
                "- Sales/CRM (SM): Customer Master, Enquiries, Orders, Price/Supplier Masters.\n" +
                "- NPD (Product Dev): BOM, Feasibility, FMEA (Severity/Detection), Process Masters.\n" +
                "- Inventory: Stock Ledger, Movement, Rejection Stock, Current Stock.\n" +
                "If the user asks about a module they are not currently viewing, use this map to explain what the module does or confirm its existence.\n\n" +
                "[Current Screen Context]\n" + request.getPageContext();

        // Convert the simple history into the format expected by GeminiService (list of maps)
        List<Map<String, String>> formattedHistory = new ArrayList<>();
        if (request.getHistory() != null) {
            formattedHistory = request.getHistory().stream().map(msg -> {
                String role = "user".equalsIgnoreCase(msg.getSender()) ? "user" : "assistant";
                return Map.of("role", role, "content", msg.getText());
            }).collect(Collectors.toList());
        }

        // Call Gemini Service
        try {
            String aiAnswer = geminiService.generateResponseWithHistory(
                    systemPrompt,
                    formattedHistory,
                    request.getMessage(),
                    0.7,
                    1500
            );

            AuraChatResponse response = new AuraChatResponse();
            response.setReply(aiAnswer);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            AuraChatResponse response = new AuraChatResponse();
            response.setReply("Sorry, I am facing a temporary issue connecting to my brain. Please try again later.");
            return ResponseEntity.status(500).body(response);
        }
    }
}

@Data
class AuraChatRequest {
    private String message;
    private String pageContext;
    private List<ChatMessage> history;

    public String getMessage() { return message; }
    public String getPageContext() { return pageContext; }
    public List<ChatMessage> getHistory() { return history; }
}

@Data
class ChatMessage {
    private String text;
    private String sender; // "user" or "bot"

    public String getText() { return text; }
    public String getSender() { return sender; }
}

@Data
class AuraChatResponse {
    private String reply;

    public void setReply(String reply) { this.reply = reply; }
    public String getReply() { return reply; }
}
