package com.autonoma.erp.controller.admin;

import com.autonoma.erp.model.AdUserSpeedDial;
import com.autonoma.erp.repository.AdUserSpeedDialRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user-speed-dials")
@CrossOrigin(origins = "*")
public class AdUserSpeedDialController {

    @Autowired
    private AdUserSpeedDialRepository repository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "SYSTEM";
    }

    public static class SpeedDialPayload {
        public String moduleGroupId;
        public String speedDialIds;
        public String moduleColor;
        public String moduleIcon;
    }

    public static class SpeedDialResponse {
        public String moduleGroupId;
        public String speedDialIds;
        public String moduleColor;
        public String moduleIcon;
    }

    @GetMapping
    public ResponseEntity<List<SpeedDialResponse>> getSpeedDials() {
        String userId = getCurrentUserId();
        if ("SYSTEM".equals(userId)) {
            return ResponseEntity.ok(List.of());
        }

        List<AdUserSpeedDial> dials = repository.findByUserId(userId);

        // Group by moduleId
        Map<String, List<AdUserSpeedDial>> grouped = dials.stream()
                .collect(Collectors.groupingBy(AdUserSpeedDial::getModuleId));

        List<SpeedDialResponse> responseList = new ArrayList<>();
        for (Map.Entry<String, List<AdUserSpeedDial>> entry : grouped.entrySet()) {
            SpeedDialResponse resp = new SpeedDialResponse();
            resp.moduleGroupId = entry.getKey();
            
            // Assuming color and icon are the same for all items in the module group
            if (!entry.getValue().isEmpty()) {
                resp.moduleColor = entry.getValue().get(0).getModuleColor();
                resp.moduleIcon = entry.getValue().get(0).getModuleIcon();
            }

            // sort by position
            entry.getValue().sort((a, b) -> Integer.compare(
                    a.getPosition() != null ? a.getPosition() : 0,
                    b.getPosition() != null ? b.getPosition() : 0));

            List<String> items = entry.getValue().stream()
                    .map(AdUserSpeedDial::getItemId)
                    .collect(Collectors.toList());

            try {
                resp.speedDialIds = objectMapper.writeValueAsString(items);
            } catch (Exception e) {
                resp.speedDialIds = "[]";
            }
            responseList.add(resp);
        }

        return ResponseEntity.ok(responseList);
    }

    @PostMapping("/save")
    @Transactional
    public ResponseEntity<List<AdUserSpeedDial>> saveSpeedDial(@RequestBody SpeedDialPayload payload) {
        String userId = getCurrentUserId();
        if ("SYSTEM".equals(userId)) {
            return ResponseEntity.badRequest().build();
        }

        if (payload.moduleGroupId == null || payload.moduleGroupId.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // Delete existing items for this module group
        repository.deleteByUserIdAndModuleId(userId, payload.moduleGroupId);

        List<AdUserSpeedDial> savedItems = new ArrayList<>();

        try {
            List<String> items = objectMapper.readValue(payload.speedDialIds, new TypeReference<List<String>>() {
            });
            for (int i = 0; i < items.size(); i++) {
                AdUserSpeedDial dial = new AdUserSpeedDial();
                dial.setUserId(userId);
                dial.setModuleId(payload.moduleGroupId);
                dial.setItemId(items.get(i));
                dial.setPosition(i);
                dial.setModuleColor(payload.moduleColor);
                dial.setModuleIcon(payload.moduleIcon);
                dial.setUpdatedDate(LocalDateTime.now());
                savedItems.add(repository.save(dial));
            }
            
            // If the user clears all speed dials but still wants to save the color/icon
            if (items.isEmpty() && (payload.moduleColor != null || payload.moduleIcon != null)) {
                AdUserSpeedDial dial = new AdUserSpeedDial();
                dial.setUserId(userId);
                dial.setModuleId(payload.moduleGroupId);
                dial.setItemId(""); // Blank item just to hold the preference
                dial.setPosition(0);
                dial.setModuleColor(payload.moduleColor);
                dial.setModuleIcon(payload.moduleIcon);
                dial.setUpdatedDate(LocalDateTime.now());
                savedItems.add(repository.save(dial));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(savedItems);
    }
}
