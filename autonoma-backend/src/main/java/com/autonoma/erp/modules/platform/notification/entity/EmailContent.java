package com.autonoma.erp.modules.platform.notification.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_EMAIL_CONTENT")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailContent extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "TYPE", length = 100, nullable = false)
    private String type;

    @Column(name = "SUBJECT", length = 500, nullable = false)
    private String subject;

    @Column(name = "BODY_CONTENT", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String bodyContent;

    @Column(name = "YOURS_WINDFULLY", length = 200, nullable = true)
    private String yoursWindfully;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getBodyContent() {
        return bodyContent;
    }

    public void setBodyContent(String bodyContent) {
        this.bodyContent = bodyContent;
    }

    public String getYoursWindfully() {
        return yoursWindfully;
    }

    public void setYoursWindfully(String yoursWindfully) {
        this.yoursWindfully = yoursWindfully;
    }



    @Column(name = "INCLUDE_COMPANY_FOOTER")
    private Boolean includeCompanyFooter = false;

    @Column(name = "INCLUDE_WEBSITE")
    private Boolean includeWebsite = false;

    @Column(name = "INCLUDE_LOCATION")
    private Boolean includeLocation = false;

    public Boolean getIncludeCompanyFooter() {
        return includeCompanyFooter != null ? includeCompanyFooter : false;
    }

    public void setIncludeCompanyFooter(Boolean includeCompanyFooter) {
        this.includeCompanyFooter = includeCompanyFooter;
    }

    public Boolean getIncludeWebsite() {
        return includeWebsite != null ? includeWebsite : false;
    }

    public void setIncludeWebsite(Boolean includeWebsite) {
        this.includeWebsite = includeWebsite;
    }

    public Boolean getIncludeLocation() {
        return includeLocation != null ? includeLocation : false;
    }

    public void setIncludeLocation(Boolean includeLocation) {
        this.includeLocation = includeLocation;
    }

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    // Explicit getter/setter for isActive
    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    @Column(name = "FOOTER_HEADER", length = 200)
    private String footerHeader;

    @Column(name = "FOOTER_CONTENT", columnDefinition = "NVARCHAR(MAX)")
    private String footerContent;

    @Column(name = "USE_CURRENT_USER_CREDENTIALS")
    private Boolean useCurrentUserCredentials = false;

    public String getFooterHeader() {
        return footerHeader;
    }

    public void setFooterHeader(String footerHeader) {
        this.footerHeader = footerHeader;
    }

    public String getFooterContent() {
        return footerContent;
    }

    public void setFooterContent(String footerContent) {
        this.footerContent = footerContent;
    }

    public Boolean getUseCurrentUserCredentials() {
        return useCurrentUserCredentials != null ? useCurrentUserCredentials : false;
    }

    public void setUseCurrentUserCredentials(Boolean useCurrentUserCredentials) {
        this.useCurrentUserCredentials = useCurrentUserCredentials;
    }
}
