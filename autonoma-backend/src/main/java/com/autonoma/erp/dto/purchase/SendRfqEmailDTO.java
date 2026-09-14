package com.autonoma.erp.dto.purchase;

import lombok.Data;

@Data
public class SendRfqEmailDTO {
    private String subject;
    private String content;
    private String fromEmail;
    private String toEmail;
    private String ccEmail;

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
