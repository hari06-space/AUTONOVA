package com.autonoma.erp.modules.platform.notification.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

import java.security.Principal;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Controller
public class SignalingController {

    private static final Logger log = LoggerFactory.getLogger(SignalingController.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired(required = false)
    private UserRepository userRepository;

    @Autowired(required = false)
    private EmployeeMasterRepository employeeRepository;

    @MessageMapping("/signaling")
    public void processSignalingMessage(@Payload Map<String, Object> message, Principal principal) {
        String sender = principal != null ? principal.getName() : (String) message.get("sender");
        if (sender == null || sender.trim().isEmpty()) {
            sender = "anonymous";
        }
        message.put("sender", sender);

        String targetUser = (String) message.get("targetUser");
        String type = (String) message.get("type");

        if (targetUser != null && !targetUser.trim().isEmpty()) {
            targetUser = targetUser.trim();
            log.info("[WebRTC Signaling] Forwarding msg type={} from={} to targetUser={}", type, sender, targetUser);

            Set<String> topics = new HashSet<>();
            topics.add(targetUser);
            topics.add(targetUser.toLowerCase());
            topics.add(targetUser.toUpperCase());

            // Resolve employee ID / empCode to userId credentials
            try {
                if (userRepository != null) {
                    // Check if targetUser is a numeric employee ID
                    try {
                        Long empId = Long.parseLong(targetUser);
                        List<UserCredential> users = userRepository.findByEmpId(empId);
                        if (users != null) {
                            for (UserCredential u : users) {
                                if (u.getUserId() != null) {
                                    topics.add(u.getUserId().trim());
                                    topics.add(u.getUserId().trim().toLowerCase());
                                }
                            }
                        }
                    } catch (NumberFormatException ignored) {}

                    // Check if targetUser is an empCode or employeeName
                    if (employeeRepository != null) {
                        employeeRepository.findByEmpCodeOrName(targetUser).ifPresent(emp -> {
                            topics.add(String.valueOf(emp.getId()));
                            if (emp.getEmpCode() != null) {
                                topics.add(emp.getEmpCode().trim());
                                topics.add(emp.getEmpCode().trim().toLowerCase());
                            }
                            List<UserCredential> users = userRepository.findByEmpId(emp.getId());
                            if (users != null) {
                                for (UserCredential u : users) {
                                    if (u.getUserId() != null) {
                                        topics.add(u.getUserId().trim());
                                        topics.add(u.getUserId().trim().toLowerCase());
                                    }
                                }
                            }
                        });
                    }

                    // Check if targetUser is a userId username
                    userRepository.findByUserIdIgnoreCase(targetUser).ifPresent(cred -> {
                        if (cred.getEmpId() != null) {
                            topics.add(String.valueOf(cred.getEmpId()));
                        }
                    });
                }
            } catch (Exception ex) {
                log.warn("[WebRTC Signaling] Error resolving user aliases: {}", ex.getMessage());
            }

            // Forward to all resolved individual topics for the target user
            for (String topic : topics) {
                if (topic != null && !topic.isEmpty() && !"broadcast".equalsIgnoreCase(topic) && !"all".equalsIgnoreCase(topic)) {
                    messagingTemplate.convertAndSend("/topic/signaling." + topic, message);
                }
            }

            // Only broadcast if explicitly targeted to all participants or broadcast
            if ("broadcast".equalsIgnoreCase(targetUser) || "all".equalsIgnoreCase(targetUser)) {
                messagingTemplate.convertAndSend("/topic/signaling.broadcast", message);
            }
        } else {
            log.warn("[WebRTC Signaling] Missing targetUser in message: {}", message);
        }
    }
}
