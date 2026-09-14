package com.autonoma.erp.model.admin;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "BOS_PAGES")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class BosPage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "page_id")
    private Integer pageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mod_id", nullable = false)
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private BosModule module;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sub_mod_id")
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private BosSubModule subModule;

    @Column(name = "page_code", columnDefinition = "NVARCHAR(10)")
    private String pageCode;

    @Column(name = "page_name", nullable = false, columnDefinition = "NVARCHAR(100)")
    private String pageName;

    @Column(name = "enabled")
    private Integer enabled;

    public Integer getPageId() {
        return pageId;
    }

    public void setPageId(Integer pageId) {
        this.pageId = pageId;
    }

    public BosModule getModule() {
        return module;
    }

    public void setModule(BosModule module) {
        this.module = module;
    }

    public BosSubModule getSubModule() {
        return subModule;
    }

    public void setSubModule(BosSubModule subModule) {
        this.subModule = subModule;
    }

    public String getPageCode() {
        return pageCode;
    }

    public void setPageCode(String pageCode) {
        this.pageCode = pageCode;
    }

    public String getPageName() {
        return pageName;
    }

    public void setPageName(String pageName) {
        this.pageName = pageName;
    }

    public Integer getEnabled() {
        return enabled;
    }

    public void setEnabled(Integer enabled) {
        this.enabled = enabled;
    }
}
