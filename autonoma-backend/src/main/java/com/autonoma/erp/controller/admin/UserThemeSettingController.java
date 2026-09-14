package com.autonoma.erp.controller.admin;

import com.autonoma.erp.model.admin.UserThemeSetting;
import com.autonoma.erp.repository.admin.UserThemeSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.Optional;

@RestController
@RequestMapping("/api/theme-settings")
@CrossOrigin(origins = "*")
public class UserThemeSettingController {

    @Autowired
    private UserThemeSettingRepository userThemeSettingRepository;

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "SYSTEM";
    }

    @GetMapping
    public ResponseEntity<UserThemeSetting> getThemeSettings() {
        String userId = getCurrentUserId();
        if ("SYSTEM".equals(userId)) {
            return ResponseEntity.ok(new UserThemeSetting());
        }

        Optional<UserThemeSetting> settingsOpt = userThemeSettingRepository.findById(userId);
        if (settingsOpt.isPresent()) {
            UserThemeSetting userSetting = settingsOpt.get();
            if (userSetting.getRibbonLayout() == null || userSetting.getRibbonLayout().trim().isEmpty()) {
                userSetting.setRibbonLayout("classic");
            }
            return ResponseEntity.ok(userSetting);
        } else {
            UserThemeSetting defaultSettings = new UserThemeSetting();
            defaultSettings.setUserId(userId);
            defaultSettings.setThemeMode("system");
            defaultSettings.setMenuOrientation("vertical");
            defaultSettings.setMiniDrawer(false);
            defaultSettings.setFontFamily("'Roboto', sans-serif");
            defaultSettings.setBorderRadius(8);
            defaultSettings.setOutlinedFilled(true);
            defaultSettings.setPresetColor("default");
            defaultSettings.setI18n("en");
            defaultSettings.setThemeDirection("ltr");
            defaultSettings.setContainer(false);
            defaultSettings.setDndMode(false);
            defaultSettings.setAllowNotifications(true);
            defaultSettings.setNotificationRingtone("chime");
            defaultSettings.setNotificationMapping("{\"newTask\":\"nova_ping\",\"taskCompleted\":\"crystal_chime\",\"approvalRequired\":\"approval_bell\",\"taskRejected\":\"warning_echo\",\"deadlineReminder\":\"priority_pulse\",\"overdueTask\":\"critical_pulse\",\"successMessage\":\"digital_bloom\",\"generalNotification\":\"soft_spark\",\"errorNotification\":\"rapid_alert\",\"meetingReminder\":\"orbit_echo\"}");
            defaultSettings.setRibbonLayout("classic");
            defaultSettings.setHeaderTheme("default");
            defaultSettings.setUpdatedAt(new Date());
            return ResponseEntity.ok(defaultSettings);
        }
    }

    @PostMapping
    public ResponseEntity<UserThemeSetting> saveThemeSettings(@RequestBody UserThemeSetting settings) {
        String userId = getCurrentUserId();
        if ("SYSTEM".equals(userId)) {
            return ResponseEntity.badRequest().build();
        }

        try {
            return ResponseEntity.ok(saveOrUpdateThemeSettings(userId, settings));
        } catch (org.springframework.dao.DataIntegrityViolationException | org.hibernate.exception.ConstraintViolationException e) {
            // Concurrent insert race condition: retry once so findById finds the record inserted by the other thread
            try {
                return ResponseEntity.ok(saveOrUpdateThemeSettings(userId, settings));
            } catch (Exception ex) {
                return ResponseEntity.status(409).build();
            }
        }
    }

    private UserThemeSetting saveOrUpdateThemeSettings(String userId, UserThemeSetting settings) {
        Optional<UserThemeSetting> existingOpt = userThemeSettingRepository.findById(userId);
        UserThemeSetting entityToSave;
        
        if (existingOpt.isPresent()) {
            entityToSave = existingOpt.get();
            if (settings.getThemeMode() != null) entityToSave.setThemeMode(settings.getThemeMode());
            if (settings.getMenuOrientation() != null) entityToSave.setMenuOrientation(settings.getMenuOrientation());

            // User enna config pandrano athu tha varanum, nama update panna koodathu.
            // Only update if incoming settings explicitly has a non-empty ribbonLayout!
            // If incoming ribbonLayout is null/empty, preserve existing user configuration unless existing is also null/empty.
            if (settings.getRibbonLayout() != null && !settings.getRibbonLayout().trim().isEmpty()) {
                entityToSave.setRibbonLayout(settings.getRibbonLayout().trim());
            } else if (entityToSave.getRibbonLayout() == null || entityToSave.getRibbonLayout().trim().isEmpty()) {
                entityToSave.setRibbonLayout("classic");
            }

            if (settings.getHeaderTheme() != null && !settings.getHeaderTheme().trim().isEmpty()) {
                entityToSave.setHeaderTheme(settings.getHeaderTheme().trim());
            }

            if (settings.getMenuCardStyle() != null) entityToSave.setMenuCardStyle(settings.getMenuCardStyle());
            if (settings.getMiniDrawer() != null) entityToSave.setMiniDrawer(settings.getMiniDrawer());
            if (settings.getFontFamily() != null) entityToSave.setFontFamily(settings.getFontFamily());
            if (settings.getFontSize() != null) entityToSave.setFontSize(settings.getFontSize());
            if (settings.getBorderRadius() != null) entityToSave.setBorderRadius(settings.getBorderRadius());
            if (settings.getOutlinedFilled() != null) entityToSave.setOutlinedFilled(settings.getOutlinedFilled());
            if (settings.getPresetColor() != null) entityToSave.setPresetColor(settings.getPresetColor());
            if (settings.getCustomPrimaryColor() != null) entityToSave.setCustomPrimaryColor(settings.getCustomPrimaryColor());
            if (settings.getCustomSecondaryColor() != null) entityToSave.setCustomSecondaryColor(settings.getCustomSecondaryColor());
            if (settings.getI18n() != null) entityToSave.setI18n(settings.getI18n());
            if (settings.getThemeDirection() != null) entityToSave.setThemeDirection(settings.getThemeDirection());
            if (settings.getContainer() != null) entityToSave.setContainer(settings.getContainer());
            if (settings.getDashboardLayout() != null) entityToSave.setDashboardLayout(settings.getDashboardLayout());
            if (settings.getDndMode() != null) entityToSave.setDndMode(settings.getDndMode());
            if (settings.getAllowNotifications() != null) entityToSave.setAllowNotifications(settings.getAllowNotifications());
            if (settings.getNotificationRingtone() != null) entityToSave.setNotificationRingtone(settings.getNotificationRingtone());
            if (settings.getNotificationMapping() != null) entityToSave.setNotificationMapping(settings.getNotificationMapping());
            entityToSave.setUpdatedAt(new Date());
        } else {
            entityToSave = settings;
            entityToSave.setUserId(userId);
            if (entityToSave.getRibbonLayout() == null || entityToSave.getRibbonLayout().trim().isEmpty()) {
                entityToSave.setRibbonLayout("classic");
            }
            if (entityToSave.getHeaderTheme() == null || entityToSave.getHeaderTheme().trim().isEmpty()) {
                entityToSave.setHeaderTheme("default");
            }
            entityToSave.setUpdatedAt(new Date());
        }

        return userThemeSettingRepository.saveAndFlush(entityToSave);
    }
}
