package com.autonoma.erp.modules.qms.checklist.context;

import java.util.Date;

public class ChecklistSchedulerContext {
    private static final ThreadLocal<ChecklistSchedulerContext> CONTEXT = new ThreadLocal<>();

    private String executionType = "AUTO";
    private String schedulerName = "CHECKLIST";
    private Long triggerId;
    private Date dueDate;
    private Long dynamicPrimaryEmployeeId;

    public static ChecklistSchedulerContext get() {
        ChecklistSchedulerContext ctx = CONTEXT.get();
        if (ctx == null) {
            ctx = new ChecklistSchedulerContext();
            CONTEXT.set(ctx);
        }
        return ctx;
    }

    public static void set(ChecklistSchedulerContext ctx) {
        CONTEXT.set(ctx);
    }

    public static void clear() {
        CONTEXT.remove();
    }

    public String getExecutionType() {
        return executionType;
    }

    public void setExecutionType(String executionType) {
        this.executionType = executionType;
    }

    public String getSchedulerName() {
        return schedulerName;
    }

    public void setSchedulerName(String schedulerName) {
        this.schedulerName = schedulerName;
    }

    public Long getTriggerId() {
        return triggerId;
    }

    public void setTriggerId(Long triggerId) {
        this.triggerId = triggerId;
    }

    public Date getDueDate() {
        return dueDate;
    }

    public void setDueDate(Date dueDate) {
        this.dueDate = dueDate;
    }

    public Long getDynamicPrimaryEmployeeId() {
        return dynamicPrimaryEmployeeId;
    }

    public void setDynamicPrimaryEmployeeId(Long dynamicPrimaryEmployeeId) {
        this.dynamicPrimaryEmployeeId = dynamicPrimaryEmployeeId;
    }
}
