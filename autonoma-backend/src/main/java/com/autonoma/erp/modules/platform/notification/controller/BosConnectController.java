package com.autonoma.erp.modules.platform.notification.controller;

import com.autonoma.erp.dto.chat.ChatDtos.*;
import com.autonoma.erp.model.chat.CommChannel;
import com.autonoma.erp.model.chat.CommMessage;
import com.autonoma.erp.service.chat.BosConnectService;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class BosConnectController {

    @Autowired
    private BosConnectService chatService;

    // --- GET CHANNELS ---
    @GetMapping("/channels")
    public ResponseEntity<List<ChannelResponse>> getChannels() {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        chatService.ensureDefaultChannelsForUser(userId);
        return ResponseEntity.ok(chatService.getUserChannels(userId));
    }

    // --- DIRECT CHAT INITIATION ---
    @PostMapping("/channels/direct")
    public ResponseEntity<ChannelResponse> getOrCreateDirectChannel(@RequestParam("targetUserId") String targetUserId) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(chatService.getOrCreateDirectChannel(userId, targetUserId));
    }

    // --- GROUP CHAT CREATION ---
    @PostMapping("/channels/group")
    public ResponseEntity<CommChannel> createGroupChannel(
            @RequestParam("name") String name,
            @RequestParam("type") String type,
            @RequestBody List<String> userIds) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(chatService.createGroupChannel(name, type, userIds, userId));
    }

    // --- GET MESSAGE HISTORY ---
    @GetMapping("/channels/{id}/messages")
    public ResponseEntity<List<CommMessage>> getMessages(@PathVariable("id") Long channelId) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(chatService.getChannelMessages(channelId, userId));
    }

    // --- SEND MESSAGE ---
    @PostMapping("/channels/messages")
    public ResponseEntity<CommMessage> sendMessage(@RequestBody SendMessageRequest req) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(chatService.sendMessage(userId, req));
    }

    // --- DELETE MESSAGES ---
    @DeleteMapping("/channels/messages")
    public ResponseEntity<Void> deleteMessages(@RequestParam("msgIds") List<Long> msgIds, @RequestParam("deleteType") String deleteType) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        chatService.deleteMessages(msgIds, userId, deleteType);
        return ResponseEntity.ok().build();
    }

    // --- MARK CHANNEL READ ---
    @PostMapping("/channels/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable("id") Long channelId) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        chatService.markChannelRead(channelId, userId);
        return ResponseEntity.ok().build();
    }

    // --- PRESENCE SYNC ---
    @PostMapping("/presence")
    public ResponseEntity<Void> updatePresence(@RequestParam("isOnline") boolean isOnline) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId != null) {
            chatService.updateUserPresence(userId, isOnline);
        }
        return ResponseEntity.ok().build();
    }

    // --- TYPING SYNC ---
    @PostMapping("/typing")
    public ResponseEntity<Void> updateTyping(@RequestParam(value = "channelId", required = false) Long channelId) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId != null) {
            chatService.updateUserTyping(userId, channelId);
        }
        return ResponseEntity.ok().build();
    }

    // --- SEARCH ---
    @GetMapping("/search")
    public ResponseEntity<List<CommMessage>> searchMessages(@RequestParam("query") String query) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(chatService.searchMessages(userId, query));
    }

    @GetMapping("/search/users")
    public ResponseEntity<List<MemberInfo>> searchUsers(@RequestParam("query") String query) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(chatService.searchUsers(query));
    }

    @GetMapping("/channels/{id}/files")
    public ResponseEntity<List<CommMessage>> searchFiles(@PathVariable("id") Long channelId) {
        return ResponseEntity.ok(chatService.searchFiles(channelId));
    }

    // --- AI SUMMARIZATION & SMART REPLIES ---
    @GetMapping("/channels/{id}/summary")
    public ResponseEntity<AiSummaryResponse> getSummary(@PathVariable("id") Long channelId) {
        return ResponseEntity.ok(chatService.getChannelSummary(channelId));
    }

    @GetMapping("/channels/{id}/smart-replies")
    public ResponseEntity<SmartRepliesResponse> getSmartReplies(@PathVariable("id") Long channelId) {
        return ResponseEntity.ok(chatService.getSmartReplies(channelId));
    }

    // --- TOGGLE REACTION ---
    @PostMapping("/channels/messages/{msgId}/react")
    public ResponseEntity<Void> toggleReaction(@PathVariable("msgId") Long msgId, @RequestParam("emoji") String emoji) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId != null) {
            chatService.toggleReaction(userId, msgId, emoji);
        }
        return ResponseEntity.ok().build();
    }

    // --- DELETE CHANNEL ---
    @DeleteMapping("/channels/{id}")
    public ResponseEntity<Void> deleteChannel(@PathVariable("id") Long channelId) {
        String userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        chatService.deleteChannel(channelId, userId);
        return ResponseEntity.ok().build();
    }
}
