package com.autonoma.erp.modules.hr.employee.entity;

public class EmployeeOfficeMailCredentials {
    private final String officeEmail;
    private final String officialPassword;
    private final boolean configured;

    public EmployeeOfficeMailCredentials(String officeEmail, String officialPassword, boolean configured) {
        this.officeEmail = officeEmail;
        this.officialPassword = officialPassword;
        this.configured = configured;
    }

    public String getOfficeEmail() {
        return officeEmail;
    }

    public String getOfficialPassword() {
        return officialPassword;
    }

    public boolean isConfigured() {
        return configured;
    }
}
