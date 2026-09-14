package com.autonoma.erp.controller.ai;


import com.autonoma.erp.service.ai.GeminiService;
import com.autonoma.erp.modules.platform.ticketing.repository.TicketTraceabilityCenterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/assistant")
public class AIAssistantController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private TicketTraceabilityCenterRepository ticketRepository;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> request) {
        String prompt = request.get("prompt");

        if (prompt == null || prompt.trim().isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Prompt cannot be empty");
            return ResponseEntity.badRequest().body(error);
        }

        // Build dynamic context
        long totalTasks = ticketRepository.count();
        
        String dynamicContext = "You are BOS(S), Autonoma ERP's intelligent Voice AI Assistant. " +
            "You have deep knowledge of the Autonoma ERP project. Here is the project architecture: " +
            "1. Employee Management: Handles Employee Master, Attendance, KYC, Education, Profile, Experience. " +
            "2. Ticket Management (Task Dashboard): Uses TicketTraceabilityCenter to track tasks, assignees, priorities, due dates. Currently there are " + totalTasks + " active tasks. " +
            "3. Quality Management (QMS): Handles QMS Meeting Master, MOM Details, NCR (Non-Conformance Report) OFI (Opportunity For Improvement). " +
            "4. Sales & Marketing (SM): Manages Enquiries, Quotations, and Price Masters. " +
            "5. Induction & Training: Manages Interview Master, Induction Training, and Assignments. " +
            "6. Products: Manages Product Capacity, Models, OEM mapping. " +
            "INSTRUCTIONS: " +
            "- Answer EXACTLY what the user asks about the project. Be concise but accurate. " +
            "- If they just say hello, reply with a warm greeting: 'வணக்கம்! நான் பாஸ், உங்களுக்கு எப்படி உதவ முடியும்?'. " +
            "- CRITICAL INSTRUCTION: If the user speaks in Tamil or Tanglish, YOU MUST REPLY STRICTLY IN NATURAL SPOKEN TAMIL (Pechu Tamil). " +
            "- AVOID FORMAL/BOOKISH TAMIL (Senthamizh). Use everyday conversational words. " +
            "- EXTREMELY IMPORTANT TRANSLATION RULES: Do NOT use literal robotic translations. For example, instead of 'நாம் 35 டாஸ் டார்க்குகளை கொண்டுள்ளோம்', say 'உங்க டாஷ்போர்டில் மொத்தம் முப்பத்தி ஐந்து வேலைகள் இருக்கு'. Use common English words like 'Task', 'Dashboard', 'Employee' natively.";

        String aiResponse = geminiService.generateResponse(prompt, dynamicContext);

        Map<String, String> response = new HashMap<>();
        response.put("response", aiResponse);

        return ResponseEntity.ok(response);
    }
}
