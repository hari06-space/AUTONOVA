package com.autonoma.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "AD_USER_SPEED_DIAL")
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@EntityListeners(AuditingEntityListener.class)
public class AdUserSpeedDial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USER_ID", nullable = false, length = 50)
    private String userId;

    @Column(name = "MODULE_ID", length = 255)
    private String moduleId;

    @Column(name = "ITEM_ID", length = 255)
    private String itemId;

    @Column(name = "POSITION")
    private Integer position;

    @Column(name = "MODULE_COLOR", length = 50)
    private String moduleColor;

    @Column(name = "MODULE_ICON", length = 100)
    private String moduleIcon;

    @LastModifiedDate
    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate;

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }
    public String getItemId() { return itemId; }
    public void setItemId(String itemId) { this.itemId = itemId; }
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setUpdatedDate(LocalDateTime updatedDate) { this.updatedDate = updatedDate; }
    public String getModuleColor() { return moduleColor; }
    public void setModuleColor(String moduleColor) { this.moduleColor = moduleColor; }
    public String getModuleIcon() { return moduleIcon; }
    public void setModuleIcon(String moduleIcon) { this.moduleIcon = moduleIcon; }
}
