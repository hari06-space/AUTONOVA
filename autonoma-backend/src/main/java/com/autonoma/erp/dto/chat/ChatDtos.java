package com.autonoma.erp.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.util.List;

public class ChatDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChannelResponse {
        private Long id;
        private String channelName;
        private String channelType; // DIRECT, DEPARTMENT, PROJECT, TEAM
        private Long departmentId;
        private String departmentName;
        private String lastMessage;
        private String lastMessageSender;
        private Date lastMessageTime;
        private int unreadCount;
        private List<MemberInfo> members;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getChannelName() { return channelName; }
        public void setChannelName(String channelName) { this.channelName = channelName; }
        public String getChannelType() { return channelType; }
        public void setChannelType(String channelType) { this.channelType = channelType; }
        public Long getDepartmentId() { return departmentId; }
        public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
        public String getLastMessage() { return lastMessage; }
        public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }
        public String getLastMessageSender() { return lastMessageSender; }
        public void setLastMessageSender(String lastMessageSender) { this.lastMessageSender = lastMessageSender; }
        public Date getLastMessageTime() { return lastMessageTime; }
        public void setLastMessageTime(Date lastMessageTime) { this.lastMessageTime = lastMessageTime; }
        public int getUnreadCount() { return unreadCount; }
        public void setUnreadCount(int unreadCount) { this.unreadCount = unreadCount; }
        public List<MemberInfo> getMembers() { return members; }
        public void setMembers(List<MemberInfo> members) { this.members = members; }

        public static Builder builder() { return new Builder(); }
        public static class Builder {
            private Long id; private String channelName; private String channelType;
            private Long departmentId; private String departmentName; private String lastMessage;
            private String lastMessageSender; private Date lastMessageTime; private int unreadCount;
            private List<MemberInfo> members;
            public Builder id(Long v) { this.id = v; return this; }
            public Builder channelName(String v) { this.channelName = v; return this; }
            public Builder channelType(String v) { this.channelType = v; return this; }
            public Builder departmentId(Long v) { this.departmentId = v; return this; }
            public Builder departmentName(String v) { this.departmentName = v; return this; }
            public Builder lastMessage(String v) { this.lastMessage = v; return this; }
            public Builder lastMessageSender(String v) { this.lastMessageSender = v; return this; }
            public Builder lastMessageTime(Date v) { this.lastMessageTime = v; return this; }
            public Builder unreadCount(int v) { this.unreadCount = v; return this; }
            public Builder members(List<MemberInfo> v) { this.members = v; return this; }
            public ChannelResponse build() {
                ChannelResponse r = new ChannelResponse();
                r.id = this.id; r.channelName = this.channelName; r.channelType = this.channelType;
                r.departmentId = this.departmentId; r.departmentName = this.departmentName;
                r.lastMessage = this.lastMessage; r.lastMessageSender = this.lastMessageSender;
                r.lastMessageTime = this.lastMessageTime; r.unreadCount = this.unreadCount;
                r.members = this.members;
                return r;
            }
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberInfo {
        private String userId;
        private Long empId;
        private String employeeCode;
        private String employeeName;
        private String departmentName;
        private String designationName;
        private String imgName;
        private boolean isOnline;
        private Date lastSeen;
        private boolean isTyping;

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public Long getEmpId() { return empId; }
        public void setEmpId(Long empId) { this.empId = empId; }
        public String getEmployeeCode() { return employeeCode; }
        public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
        public String getDesignationName() { return designationName; }
        public void setDesignationName(String designationName) { this.designationName = designationName; }
        public String getImgName() { return imgName; }
        public void setImgName(String imgName) { this.imgName = imgName; }
        public boolean isOnline() { return isOnline; }
        public void setOnline(boolean isOnline) { this.isOnline = isOnline; }
        public Date getLastSeen() { return lastSeen; }
        public void setLastSeen(Date lastSeen) { this.lastSeen = lastSeen; }
        public boolean isTyping() { return isTyping; }
        public void setTyping(boolean isTyping) { this.isTyping = isTyping; }

        public static Builder builder() { return new Builder(); }
        public static class Builder {
            private String userId; private Long empId; private String employeeCode; private String employeeName; private String departmentName;
            private String designationName; private String imgName; private boolean isOnline;
            private Date lastSeen; private boolean isTyping;
            public Builder userId(String v) { this.userId = v; return this; }
            public Builder empId(Long v) { this.empId = v; return this; }
            public Builder employeeCode(String v) { this.employeeCode = v; return this; }
            public Builder employeeName(String v) { this.employeeName = v; return this; }
            public Builder departmentName(String v) { this.departmentName = v; return this; }
            public Builder designationName(String v) { this.designationName = v; return this; }
            public Builder imgName(String v) { this.imgName = v; return this; }
            public Builder isOnline(boolean v) { this.isOnline = v; return this; }
            public Builder lastSeen(Date v) { this.lastSeen = v; return this; }
            public Builder isTyping(boolean v) { this.isTyping = v; return this; }
            public MemberInfo build() {
                MemberInfo m = new MemberInfo();
                m.userId = this.userId; m.empId = this.empId; m.employeeCode = this.employeeCode; m.employeeName = this.employeeName; m.departmentName = this.departmentName;
                m.designationName = this.designationName; m.imgName = this.imgName; m.isOnline = this.isOnline;
                m.lastSeen = this.lastSeen; m.isTyping = this.isTyping;
                return m;
            }
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SendMessageRequest {
        private Long channelId;
        private String messageType; // TEXT, FILE, VOICE, SYSTEM, ACTION
        private String messageContent;
        private String attachmentUrl;
        private String attachmentName;
        private String attachmentType; // PDF, EXCEL, IMAGE, DOC

        public Long getChannelId() { return channelId; }
        public void setChannelId(Long channelId) { this.channelId = channelId; }
        public String getMessageType() { return messageType; }
        public void setMessageType(String messageType) { this.messageType = messageType; }
        public String getMessageContent() { return messageContent; }
        public void setMessageContent(String messageContent) { this.messageContent = messageContent; }
        public String getAttachmentUrl() { return attachmentUrl; }
        public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }
        public String getAttachmentName() { return attachmentName; }
        public void setAttachmentName(String attachmentName) { this.attachmentName = attachmentName; }
        public String getAttachmentType() { return attachmentType; }
        public void setAttachmentType(String attachmentType) { this.attachmentType = attachmentType; }

        public static Builder builder() { return new Builder(); }
        public static class Builder {
            private Long channelId; private String messageType; private String messageContent;
            private String attachmentUrl; private String attachmentName; private String attachmentType;
            public Builder channelId(Long v) { this.channelId = v; return this; }
            public Builder messageType(String v) { this.messageType = v; return this; }
            public Builder messageContent(String v) { this.messageContent = v; return this; }
            public Builder attachmentUrl(String v) { this.attachmentUrl = v; return this; }
            public Builder attachmentName(String v) { this.attachmentName = v; return this; }
            public Builder attachmentType(String v) { this.attachmentType = v; return this; }
            public SendMessageRequest build() {
                SendMessageRequest req = new SendMessageRequest();
                req.channelId = this.channelId; req.messageType = this.messageType; req.messageContent = this.messageContent;
                req.attachmentUrl = this.attachmentUrl; req.attachmentName = this.attachmentName; req.attachmentType = this.attachmentType;
                return req;
            }
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserPresenceResponse {
        private String userId;
        private boolean isOnline;
        private Date lastSeen;
        private Long isTypingChannelId;

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public boolean isOnline() { return isOnline; }
        public void setOnline(boolean isOnline) { this.isOnline = isOnline; }
        public Date getLastSeen() { return lastSeen; }
        public void setLastSeen(Date lastSeen) { this.lastSeen = lastSeen; }
        public Long getIsTypingChannelId() { return isTypingChannelId; }
        public void setIsTypingChannelId(Long isTypingChannelId) { this.isTypingChannelId = isTypingChannelId; }

        public static Builder builder() { return new Builder(); }
        public static class Builder {
            private String userId; private boolean isOnline; private Date lastSeen; private Long isTypingChannelId;
            public Builder userId(String v) { this.userId = v; return this; }
            public Builder isOnline(boolean v) { this.isOnline = v; return this; }
            public Builder lastSeen(Date v) { this.lastSeen = v; return this; }
            public Builder isTypingChannelId(Long v) { this.isTypingChannelId = v; return this; }
            public UserPresenceResponse build() {
                UserPresenceResponse r = new UserPresenceResponse();
                r.userId = this.userId; r.isOnline = this.isOnline; r.lastSeen = this.lastSeen; r.isTypingChannelId = this.isTypingChannelId;
                return r;
            }
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AiSummaryResponse {
        private Long channelId;
        private String summary;
        private Date generatedAt;

        public Long getChannelId() { return channelId; }
        public void setChannelId(Long channelId) { this.channelId = channelId; }
        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
        public Date getGeneratedAt() { return generatedAt; }
        public void setGeneratedAt(Date generatedAt) { this.generatedAt = generatedAt; }

        public static Builder builder() { return new Builder(); }
        public static class Builder {
            private Long channelId; private String summary; private Date generatedAt;
            public Builder channelId(Long v) { this.channelId = v; return this; }
            public Builder summary(String v) { this.summary = v; return this; }
            public Builder generatedAt(Date v) { this.generatedAt = v; return this; }
            public AiSummaryResponse build() {
                AiSummaryResponse r = new AiSummaryResponse();
                r.channelId = this.channelId; r.summary = this.summary; r.generatedAt = this.generatedAt;
                return r;
            }
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SmartRepliesResponse {
        private Long channelId;
        private List<String> suggestions;

        public Long getChannelId() { return channelId; }
        public void setChannelId(Long channelId) { this.channelId = channelId; }
        public List<String> getSuggestions() { return suggestions; }
        public void setSuggestions(List<String> suggestions) { this.suggestions = suggestions; }

        public static Builder builder() { return new Builder(); }
        public static class Builder {
            private Long channelId;
            private List<String> suggestions;
            public Builder channelId(Long v) { this.channelId = v; return this; }
            public Builder suggestions(List<String> v) { this.suggestions = v; return this; }
            public SmartRepliesResponse build() {
                SmartRepliesResponse r = new SmartRepliesResponse();
                r.channelId = this.channelId;
                r.suggestions = this.suggestions;
                return r;
            }
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OcrResponse {
        private String vendorName;
        private String invoiceNumber;
        private Double amount;
        private String extractedText;
        private String erpActionSuggestion;
        private String erpActionPayload;

        public String getVendorName() { return vendorName; }
        public void setVendorName(String vendorName) { this.vendorName = vendorName; }
        public String getInvoiceNumber() { return invoiceNumber; }
        public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
        public Double getAmount() { return amount; }
        public void setAmount(Double amount) { this.amount = amount; }
        public String getExtractedText() { return extractedText; }
        public void setExtractedText(String extractedText) { this.extractedText = extractedText; }
        public String getErpActionSuggestion() { return erpActionSuggestion; }
        public void setErpActionSuggestion(String erpActionSuggestion) { this.erpActionSuggestion = erpActionSuggestion; }
        public String getErpActionPayload() { return erpActionPayload; }
        public void setErpActionPayload(String erpActionPayload) { this.erpActionPayload = erpActionPayload; }

        public static Builder builder() { return new Builder(); }
        public static class Builder {
            private String vendorName; private String invoiceNumber; private Double amount;
            private String extractedText; private String erpActionSuggestion; private String erpActionPayload;
            public Builder vendorName(String v) { this.vendorName = v; return this; }
            public Builder invoiceNumber(String v) { this.invoiceNumber = v; return this; }
            public Builder amount(Double v) { this.amount = v; return this; }
            public Builder extractedText(String v) { this.extractedText = v; return this; }
            public Builder erpActionSuggestion(String v) { this.erpActionSuggestion = v; return this; }
            public Builder erpActionPayload(String v) { this.erpActionPayload = v; return this; }
            public OcrResponse build() {
                OcrResponse r = new OcrResponse();
                r.vendorName = this.vendorName; r.invoiceNumber = this.invoiceNumber; r.amount = this.amount;
                r.extractedText = this.extractedText; r.erpActionSuggestion = this.erpActionSuggestion; r.erpActionPayload = this.erpActionPayload;
                return r;
            }
        }
    }
}
