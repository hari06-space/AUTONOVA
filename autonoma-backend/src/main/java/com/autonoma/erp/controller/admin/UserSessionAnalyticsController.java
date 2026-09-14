package com.autonoma.erp.controller.admin;


import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.model.admin.UserSessionActivity;
import com.autonoma.erp.service.admin.UserSessionService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics/sessions")
@CrossOrigin(origins = "*")
public class UserSessionAnalyticsController {

    @Autowired
    private UserSessionService userSessionService;

    @PostMapping("/record-entry")


    @RequirePagePermission(pageCode = "AD1160", action = "write")
    public void recordEntry(@RequestBody Map<String, String> data) {
        String userId = data.get("userId");
        String pageName = data.get("pageName");
        String pageUrl = data.get("pageUrl");
        userSessionService.recordPageEntry(userId, pageName, pageUrl);
    }

    @PostMapping("/record-exit")


    @RequirePagePermission(pageCode = "AD1160", action = "write")
    public void recordExit(@RequestBody Map<String, String> data) {
        String userId = data.get("userId");
        userSessionService.recordPageExit(userId);
    }

    @GetMapping("/navigation")
    public List<UserSessionActivity> getAllNavigation() {
        return userSessionService.getAllNavigation();
    }

    @GetMapping("/navigation/{userId}")
    public List<UserSessionActivity> getUserNavigation(@PathVariable String userId) {
        return userSessionService.getUserNavigation(userId);
    }

    @GetMapping("/check-status/{userId}")
    public boolean checkSessionStatus(@PathVariable String userId) {
        return userSessionService.isSessionValid(userId);
    }

    @PostMapping("/terminate")


    @RequirePagePermission(pageCode = "AD1160", action = "write")
    public void terminateSession(@RequestBody Map<String, String> data) {
        String userId = data.get("userId");
        userSessionService.terminateSession(userId);
    }
}
