package com.autonoma.erp.model.admin;

import com.autonoma.erp.model.BaseAuditEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import java.util.Date;

@Entity
@Table(name = "AD_USER_THEME_SETTING")
@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class UserThemeSetting extends BaseAuditEntity {

    @Id
    @Column(name = "user_id", columnDefinition = "NVARCHAR(50)")
    private String userId;

    @Column(name = "theme_mode", columnDefinition = "NVARCHAR(20)")
    private String themeMode = "system";

    @Column(name = "menu_orientation", columnDefinition = "NVARCHAR(20)")
    private String menuOrientation = "vertical";

    @Column(name = "menu_card_style", columnDefinition = "NVARCHAR(20)")
    private String menuCardStyle = "none";

    @Column(name = "mini_drawer")
    private Boolean miniDrawer = false;

    @Column(name = "font_family", columnDefinition = "NVARCHAR(100)")
    private String fontFamily = "'Roboto', sans-serif";

    @Column(name = "font_size")
    private Integer fontSize = 14;

    @Column(name = "border_radius")
    private Integer borderRadius = 8;

    @Column(name = "outlined_filled")
    private Boolean outlinedFilled = true;

    @Column(name = "preset_color", columnDefinition = "NVARCHAR(50)")
    private String presetColor = "default";

    @Column(name = "custom_primary_color", columnDefinition = "NVARCHAR(20)")
    private String customPrimaryColor;

    @Column(name = "custom_secondary_color", columnDefinition = "NVARCHAR(20)")
    private String customSecondaryColor;

    @Column(name = "i18n", columnDefinition = "NVARCHAR(20)")
    private String i18n = "en";

    @Column(name = "theme_direction", columnDefinition = "NVARCHAR(20)")
    private String themeDirection = "ltr";

    @Column(name = "container")
    private Boolean container = false;

    @Column(name = "dashboard_layout", columnDefinition = "NVARCHAR(20)")
    private String dashboardLayout = "glass";

    @Column(name = "face_login_enabled")
    private Boolean faceLoginEnabled = false;

    @Column(name = "dnd_mode")
    private Boolean dndMode = false;

    @Column(name = "allow_notifications")
    private Boolean allowNotifications = true;

    @Column(name = "notification_ringtone", columnDefinition = "NVARCHAR(20)")
    private String notificationRingtone = "chime";

    @Column(name = "notification_mapping", columnDefinition = "NVARCHAR(MAX)")
    private String notificationMapping;

    @Column(name = "ribbon_layout", columnDefinition = "NVARCHAR(30)")
    private String ribbonLayout;

    @Column(name = "header_theme", columnDefinition = "NVARCHAR(50)")
    private String headerTheme = "default";

    public String getHeaderTheme() {
        return headerTheme;
    }

    public void setHeaderTheme(String headerTheme) {
        this.headerTheme = headerTheme;
    }

    public String getRibbonLayout() {
        return ribbonLayout;
    }

    public void setRibbonLayout(String ribbonLayout) {
        this.ribbonLayout = ribbonLayout;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public void setThemeDirection(String themeDirection) { this.themeDirection = themeDirection; }
    public String getThemeDirection() { return themeDirection; }
    public void setContainer(Boolean container) { this.container = container; }
    public Boolean getContainer() { return container; }
    public void setDndMode(Boolean dndMode) { this.dndMode = dndMode; }
    public Boolean getDndMode() { return dndMode; }
    public void setAllowNotifications(Boolean allowNotifications) { this.allowNotifications = allowNotifications; }
    public Boolean getAllowNotifications() { return allowNotifications; }
    public String getMenuCardStyle() { return menuCardStyle; }
    public void setMenuCardStyle(String menuCardStyle) { this.menuCardStyle = menuCardStyle; }
    public Integer getFontSize() { return fontSize; }
    public void setFontSize(Integer fontSize) { this.fontSize = fontSize; }
    public String getDashboardLayout() { return dashboardLayout; }
    public void setDashboardLayout(String dashboardLayout) { this.dashboardLayout = dashboardLayout; }

    public String getThemeMode() {
        return themeMode;
    }

    public void setThemeMode(String themeMode) {
        this.themeMode = themeMode;
    }

    public String getMenuOrientation() {
        return menuOrientation;
    }

    public void setMenuOrientation(String menuOrientation) {
        this.menuOrientation = menuOrientation;
    }

    public Boolean getMiniDrawer() {
        return miniDrawer;
    }

    public void setMiniDrawer(Boolean miniDrawer) {
        this.miniDrawer = miniDrawer;
    }

    public String getFontFamily() {
        return fontFamily;
    }

    public void setFontFamily(String fontFamily) {
        this.fontFamily = fontFamily;
    }

    public Integer getBorderRadius() {
        return borderRadius;
    }

    public void setBorderRadius(Integer borderRadius) {
        this.borderRadius = borderRadius;
    }

    public Boolean getOutlinedFilled() {
        return outlinedFilled;
    }

    public void setOutlinedFilled(Boolean outlinedFilled) {
        this.outlinedFilled = outlinedFilled;
    }

    public String getPresetColor() {
        return presetColor;
    }

    public void setPresetColor(String presetColor) {
        this.presetColor = presetColor;
    }

    public String getCustomPrimaryColor() {
        return customPrimaryColor;
    }

    public void setCustomPrimaryColor(String customPrimaryColor) {
        this.customPrimaryColor = customPrimaryColor;
    }

    public String getCustomSecondaryColor() {
        return customSecondaryColor;
    }

    public void setCustomSecondaryColor(String customSecondaryColor) {
        this.customSecondaryColor = customSecondaryColor;
    }

    public String getI18n() {
        return i18n;
    }

    public void setI18n(String i18n) {
        this.i18n = i18n;
    }

    public Boolean getFaceLoginEnabled() {
        return faceLoginEnabled;
    }

    public void setFaceLoginEnabled(Boolean faceLoginEnabled) {
        this.faceLoginEnabled = faceLoginEnabled;
    }

    public String getNotificationRingtone() {
        return notificationRingtone;
    }

    public void setNotificationRingtone(String notificationRingtone) {
        this.notificationRingtone = notificationRingtone;
    }

    public String getNotificationMapping() {
        return notificationMapping;
    }

    public void setNotificationMapping(String notificationMapping) {
        this.notificationMapping = notificationMapping;
    }
}
