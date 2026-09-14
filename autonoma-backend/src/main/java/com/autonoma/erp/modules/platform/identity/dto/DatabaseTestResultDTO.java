package com.autonoma.erp.modules.platform.identity.dto;

import java.util.ArrayList;
import java.util.List;

public class DatabaseTestResultDTO {

    private boolean success;
    private String message;
    private List<String> databases = new ArrayList<>();

    public DatabaseTestResultDTO() {}

    public DatabaseTestResultDTO(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public DatabaseTestResultDTO(boolean success, String message, List<String> databases) {
        this.success = success;
        this.message = message;
        this.databases = databases != null ? databases : new ArrayList<>();
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public List<String> getDatabases() { return databases; }
    public void setDatabases(List<String> databases) { this.databases = databases; }
}
