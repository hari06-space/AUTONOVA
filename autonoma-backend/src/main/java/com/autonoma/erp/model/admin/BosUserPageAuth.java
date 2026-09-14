package com.autonoma.erp.model.admin;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.util.Date;
import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "BOS_USER_PAGE_AUTH")
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(BosUserPageAuthId.class)
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class BosUserPageAuth {

    @Id
    @Column(name = "user_id", columnDefinition = "NVARCHAR(50)")
    private String userId;

    @Id
    @Column(name = "page_id")
    private Integer pageId;

    @Column(name = "sub_mod_id")
    private Integer subModId;

    @Column(name = "mod_id", nullable = false)
    private Integer modId;

    @Column(name = "enable")
    private Integer enable;

    @Column(name = "read_acs")
    private Integer readAcs;

    @Column(name = "write")
    private Integer write;

    @Column(name = "delete_acs")
    private Integer deleteAcs;

    @Column(name = "export")
    private Integer export;

    @Column(name = "approval")
    private Integer approval;

    @Column(name = "manager")
    private Integer manager;

    @Column(name = "additional1")
    private Integer additional1;

    @Column(name = "additional2")
    private Integer additional2;

    @Column(name = "add_task_enable")
    private Integer addTaskEnable;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "updated_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private UserCredential user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "page_id", insertable = false, updatable = false)
    private BosPage page;

    @Transient
    private boolean enableFlag = false;
    @Transient
    private boolean readAcsFlag = false;
    @Transient
    private boolean writeFlag = false;
    @Transient
    private boolean deleteAcsFlag = false;
    @Transient
    private boolean exportFlag = false;
    @Transient
    private boolean approvalFlag = false;
    @Transient
    private boolean managerFlag = false;
    @Transient
    private boolean additional1Flag = false;
    @Transient
    private boolean additional2Flag = false;
    @Transient
    private boolean addTaskEnableFlag = false;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Integer getPageId() {
        return pageId;
    }

    public void setPageId(Integer pageId) {
        this.pageId = pageId;
    }

    public Integer getSubModId() {
        return subModId;
    }

    public void setSubModId(Integer subModId) {
        this.subModId = subModId;
    }

    public Integer getModId() {
        return modId;
    }

    public void setModId(Integer modId) {
        this.modId = modId;
    }

    public Integer getEnable() {
        return enable;
    }

    public void setEnable(Integer enable) {
        this.enable = enable;
    }

    public Integer getReadAcs() {
        return readAcs;
    }

    public void setReadAcs(Integer readAcs) {
        this.readAcs = readAcs;
    }

    public Integer getWrite() {
        return write;
    }

    public void setWrite(Integer write) {
        this.write = write;
    }

    public Integer getDeleteAcs() {
        return deleteAcs;
    }

    public void setDeleteAcs(Integer deleteAcs) {
        this.deleteAcs = deleteAcs;
    }

    public Integer getExport() {
        return export;
    }

    public void setExport(Integer export) {
        this.export = export;
    }

    public Integer getApproval() {
        return approval;
    }

    public void setApproval(Integer approval) {
        this.approval = approval;
    }

    public Integer getManager() {
        return manager;
    }

    public void setManager(Integer manager) {
        this.manager = manager;
    }

    public Integer getAdditional1() {
        return additional1;
    }

    public void setAdditional1(Integer additional1) {
        this.additional1 = additional1;
    }

    public Integer getAdditional2() {
        return additional2;
    }

    public void setAdditional2(Integer additional2) {
        this.additional2 = additional2;
    }

    public Integer getAddTaskEnable() {
        return addTaskEnable;
    }

    public void setAddTaskEnable(Integer addTaskEnable) {
        this.addTaskEnable = addTaskEnable;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Date getUpdatedDate() {
        return updatedDate;
    }

    public void setUpdatedDate(Date updatedDate) {
        this.updatedDate = updatedDate;
    }

    public UserCredential getUser() {
        return user;
    }

    public void setUser(UserCredential user) {
        this.user = user;
    }

    public BosPage getPage() {
        return page;
    }

    public void setPage(BosPage page) {
        this.page = page;
    }
}

