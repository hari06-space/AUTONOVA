package com.autonoma.erp.modules.hr.employee.entity;

import com.autonoma.erp.util.YesNoConverter;
import jakarta.persistence.*;
import java.util.List;
import java.util.ArrayList;
import java.util.Date;

@Entity
@Table(name = "HR_EMPLOYEE_ABILITY")
public class EmployeeAbility {

    @Id
    @Column(name = "EMPLOYEE_ID")
    private Long employeeId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "EMPLOYEE_ID")
    private EmployeeMaster employee;

    @Column(name = "IS_AUDITOR")
    @Convert(converter = YesNoConverter.class)
    private String isAuditor = "NO";

    @Column(name = "AUDITOR_TYPE", columnDefinition = "NVARCHAR(MAX)")
    private String auditorType;

    @Transient
    private List<String> auditorFileList = new ArrayList<>();

    @Column(name = "IS_AUDITEE")
    @Convert(converter = YesNoConverter.class)
    private String isAuditee = "NO";

    @Column(name = "AUDITEE_TYPE", columnDefinition = "NVARCHAR(MAX)")
    private String auditeeType;

    @Transient
    private List<String> auditeeFileList = new ArrayList<>();

    @Column(name = "IS_NCR_APPROVER")
    @Convert(converter = YesNoConverter.class)
    private String isNcrApprover = "NO";

    @Column(name = "NCR_APPROVER_TYPE", columnDefinition = "NVARCHAR(MAX)")
    private String ncrApproverType;

    @Transient
    private List<String> ncrApproverFileList = new ArrayList<>();

    @Column(name = "IS_TASK_VERIFIER", length = 10)
    private String isTaskVerifier = "NO";

    @Column(name = "TASK_VERIFIER_TYPE", columnDefinition = "NVARCHAR(MAX)")
    private String taskVerifierType;

    @Transient
    private List<String> taskVerifierFileList = new ArrayList<>();

    @Column(name = "IS_TASK_TESTER", length = 10)
    private String isTaskTester = "NO";

    @Column(name = "TASK_TESTER_TYPE", columnDefinition = "NVARCHAR(MAX)")
    private String taskTesterType;

    @Transient
    private List<String> taskTesterFileList = new ArrayList<>();

    @Column(name = "IS_CHAIRED", length = 10)
    private String isChaired = "NO";

    @Column(name = "CHAIRED_TYPE", columnDefinition = "NVARCHAR(MAX)")
    private String chairedType;

    @Transient
    private List<String> chairedFileList = new ArrayList<>();

    @Column(name = "IS_HOST", length = 10)
    private String isHost = "NO";

    @Column(name = "HOST_TYPE", columnDefinition = "NVARCHAR(MAX)")
    private String hostType;

    @Transient
    private List<String> hostFileList = new ArrayList<>();

    @Column(name = "IS_PARTICIPANTS", length = 10)
    private String isParticipants = "NO";

    @Column(name = "PARTICIPANTS_TYPE", columnDefinition = "NVARCHAR(MAX)")
    private String participantsType;

    @Transient
    private List<String> participantsFileList = new ArrayList<>();

    @Column(name = "IS_FIRST_AID", length = 10)
    private String isFirstAid = "NO";

    @Column(name = "FIRST_AID_FILE_INFO", length = 1000)
    private String firstAidFileInfo;

    @Column(name = "IS_FIRE_FIGHTER", length = 10)
    private String isFireFighter = "NO";

    @Column(name = "FIRE_FIGHTER_FILE_INFO", length = 1000)
    private String fireFighterFileInfo;

    @Column(name = "IS_TWO_WHEELER", length = 10)
    private String isTwoWheeler = "NO";

    @Column(name = "TWO_WHEELER_FILE_INFO", length = 1000)
    private String twoWheelerFileInfo;

    @Column(name = "IS_FOUR_WHEELER", length = 10)
    private String isFourWheeler = "NO";

    @Column(name = "FOUR_WHEELER_FILE_INFO", length = 1000)
    private String fourWheelerFileInfo;

    @Column(name = "IS_INTERVIEWER")
    @Convert(converter = YesNoConverter.class)
    private String isInterviewer = "NO";

    @Column(name = "IS_ENQUIRY_ASSIGNEE")
    @Convert(converter = YesNoConverter.class)
    private String isEnquiryAssignee = "NO";

    @Column(name = "IS_PR_ASSIGNEE")
    @Convert(converter = YesNoConverter.class)
    private String isPrAssignee = "NO";

    @Column(name = "TASK_VERIFIER_FILE_INFO")
    private String taskVerifierFileInfo;

    @Column(name = "TASK_TESTER_FILE_INFO")
    private String taskTesterFileInfo;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    public EmployeeAbility() {
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public EmployeeMaster getEmployee() {
        return employee;
    }

    public void setEmployee(EmployeeMaster employee) {
        this.employee = employee;
    }

    public String getIsAuditor() {
        return isAuditor;
    }

    public void setIsAuditor(String isAuditor) {
        this.isAuditor = isAuditor;
    }

    public String getAuditorType() {
        return auditorType;
    }

    public void setAuditorType(String auditorType) {
        this.auditorType = auditorType;
    }

    public List<String> getAuditorFileList() {
        return auditorFileList;
    }

    public void setAuditorFileList(List<String> auditorFileList) {
        if (this.auditorFileList == null) {
            this.auditorFileList = new ArrayList<>();
        } else {
            this.auditorFileList.clear();
        }
        if (auditorFileList != null) {
            this.auditorFileList.addAll(auditorFileList);
        }
    }

    public String getIsAuditee() {
        return isAuditee;
    }

    public void setIsAuditee(String isAuditee) {
        this.isAuditee = isAuditee;
    }

    public String getAuditeeType() {
        return auditeeType;
    }

    public void setAuditeeType(String auditeeType) {
        this.auditeeType = auditeeType;
    }

    public List<String> getAuditeeFileList() {
        return auditeeFileList;
    }

    public void setAuditeeFileList(List<String> auditeeFileList) {
        if (this.auditeeFileList == null) {
            this.auditeeFileList = new ArrayList<>();
        } else {
            this.auditeeFileList.clear();
        }
        if (auditeeFileList != null) {
            this.auditeeFileList.addAll(auditeeFileList);
        }
    }

    public String getIsNcrApprover() {
        return isNcrApprover;
    }

    public void setIsNcrApprover(String isNcrApprover) {
        this.isNcrApprover = isNcrApprover;
    }

    public String getNcrApproverType() {
        return ncrApproverType;
    }

    public void setNcrApproverType(String ncrApproverType) {
        this.ncrApproverType = ncrApproverType;
    }

    public List<String> getNcrApproverFileList() {
        return ncrApproverFileList;
    }

    public void setNcrApproverFileList(List<String> ncrApproverFileList) {
        if (this.ncrApproverFileList == null) {
            this.ncrApproverFileList = new ArrayList<>();
        } else {
            this.ncrApproverFileList.clear();
        }
        if (ncrApproverFileList != null) {
            this.ncrApproverFileList.addAll(ncrApproverFileList);
        }
    }

    public String getIsTaskVerifier() {
        return isTaskVerifier;
    }

    public void setIsTaskVerifier(String isTaskVerifier) {
        this.isTaskVerifier = isTaskVerifier;
    }

    public String getTaskVerifierType() {
        return taskVerifierType;
    }

    public void setTaskVerifierType(String taskVerifierType) {
        this.taskVerifierType = taskVerifierType;
    }

    public List<String> getTaskVerifierFileList() {
        return taskVerifierFileList;
    }

    public void setTaskVerifierFileList(List<String> taskVerifierFileList) {
        if (this.taskVerifierFileList == null) {
            this.taskVerifierFileList = new ArrayList<>();
        } else {
            this.taskVerifierFileList.clear();
        }
        if (taskVerifierFileList != null) {
            this.taskVerifierFileList.addAll(taskVerifierFileList);
        }
    }

    public String getIsTaskTester() {
        return isTaskTester;
    }

    public void setIsTaskTester(String isTaskTester) {
        this.isTaskTester = isTaskTester;
    }

    public String getTaskTesterType() {
        return taskTesterType;
    }

    public void setTaskTesterType(String taskTesterType) {
        this.taskTesterType = taskTesterType;
    }

    public List<String> getTaskTesterFileList() {
        return taskTesterFileList;
    }

    public void setTaskTesterFileList(List<String> taskTesterFileList) {
        if (this.taskTesterFileList == null) {
            this.taskTesterFileList = new ArrayList<>();
        } else {
            this.taskTesterFileList.clear();
        }
        if (taskTesterFileList != null) {
            this.taskTesterFileList.addAll(taskTesterFileList);
        }
    }

    public String getIsChaired() {
        return isChaired;
    }

    public void setIsChaired(String isChaired) {
        this.isChaired = isChaired;
    }

    public String getChairedType() {
        return chairedType;
    }

    public void setChairedType(String chairedType) {
        this.chairedType = chairedType;
    }

    public List<String> getChairedFileList() {
        return chairedFileList;
    }

    public void setChairedFileList(List<String> chairedFileList) {
        if (this.chairedFileList == null) {
            this.chairedFileList = new ArrayList<>();
        } else {
            this.chairedFileList.clear();
        }
        if (chairedFileList != null) {
            this.chairedFileList.addAll(chairedFileList);
        }
    }

    public String getIsHost() {
        return isHost;
    }

    public void setIsHost(String isHost) {
        this.isHost = isHost;
    }

    public String getHostType() {
        return hostType;
    }

    public void setHostType(String hostType) {
        this.hostType = hostType;
    }

    public List<String> getHostFileList() {
        return hostFileList;
    }

    public void setHostFileList(List<String> hostFileList) {
        if (this.hostFileList == null) {
            this.hostFileList = new ArrayList<>();
        } else {
            this.hostFileList.clear();
        }
        if (hostFileList != null) {
            this.hostFileList.addAll(hostFileList);
        }
    }

    public String getIsParticipants() {
        return isParticipants;
    }

    public void setIsParticipants(String isParticipants) {
        this.isParticipants = isParticipants;
    }

    public String getParticipantsType() {
        return participantsType;
    }

    public void setParticipantsType(String participantsType) {
        this.participantsType = participantsType;
    }

    public List<String> getParticipantsFileList() {
        return participantsFileList;
    }

    public void setParticipantsFileList(List<String> participantsFileList) {
        if (this.participantsFileList == null) {
            this.participantsFileList = new ArrayList<>();
        } else {
            this.participantsFileList.clear();
        }
        if (participantsFileList != null) {
            this.participantsFileList.addAll(participantsFileList);
        }
    }

    public String getIsFirstAid() {
        return isFirstAid;
    }

    public void setIsFirstAid(String isFirstAid) {
        this.isFirstAid = isFirstAid;
    }

    public String getFirstAidFileInfo() {
        return firstAidFileInfo;
    }

    public void setFirstAidFileInfo(String firstAidFileInfo) {
        this.firstAidFileInfo = firstAidFileInfo;
    }

    public String getIsFireFighter() {
        return isFireFighter;
    }

    public void setIsFireFighter(String isFireFighter) {
        this.isFireFighter = isFireFighter;
    }

    public String getFireFighterFileInfo() {
        return fireFighterFileInfo;
    }

    public void setFireFighterFileInfo(String fireFighterFileInfo) {
        this.fireFighterFileInfo = fireFighterFileInfo;
    }

    public String getIsTwoWheeler() {
        return isTwoWheeler;
    }

    public void setIsTwoWheeler(String isTwoWheeler) {
        this.isTwoWheeler = isTwoWheeler;
    }

    public String getTwoWheelerFileInfo() {
        return twoWheelerFileInfo;
    }

    public void setTwoWheelerFileInfo(String twoWheelerFileInfo) {
        this.twoWheelerFileInfo = twoWheelerFileInfo;
    }

    public String getIsFourWheeler() {
        return isFourWheeler;
    }

    public void setIsFourWheeler(String isFourWheeler) {
        this.isFourWheeler = isFourWheeler;
    }

    public String getFourWheelerFileInfo() {
        return fourWheelerFileInfo;
    }

    public void setFourWheelerFileInfo(String fourWheelerFileInfo) {
        this.fourWheelerFileInfo = fourWheelerFileInfo;
    }

    public String getIsInterviewer() {
        return isInterviewer;
    }

    public void setIsInterviewer(String isInterviewer) {
        this.isInterviewer = isInterviewer;
    }

    public String getIsEnquiryAssignee() {
        return isEnquiryAssignee;
    }

    public void setIsEnquiryAssignee(String isEnquiryAssignee) {
        this.isEnquiryAssignee = isEnquiryAssignee;
    }

    public String getIsPrAssignee() {
        return isPrAssignee;
    }

    public void setIsPrAssignee(String isPrAssignee) {
        this.isPrAssignee = isPrAssignee;
    }

    public String getTaskVerifierFileInfo() {
        return taskVerifierFileInfo;
    }

    public void setTaskVerifierFileInfo(String taskVerifierFileInfo) {
        this.taskVerifierFileInfo = taskVerifierFileInfo;
    }

    public String getTaskTesterFileInfo() {
        return taskTesterFileInfo;
    }

    public void setTaskTesterFileInfo(String taskTesterFileInfo) {
        this.taskTesterFileInfo = taskTesterFileInfo;
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

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        if (currentUserId != null && !currentUserId.trim().isEmpty()) {
            this.createdBy = currentUserId;
        } else if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = "admin";
        }
        this.createdDate = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.updatedBy = currentUserId;
        this.updatedDate = new Date();
    }
}

