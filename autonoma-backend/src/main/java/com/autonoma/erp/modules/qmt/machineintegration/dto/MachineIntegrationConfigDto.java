package com.autonoma.erp.modules.qmt.machineintegration.dto;

import lombok.Data;
import java.util.Date;
import java.util.List;

@Data
public class MachineIntegrationConfigDto {
    private Long id;
    private Long machineIdRef;

    // Connection
    private String dbType;
    private String dbHost;
    private Integer dbPort;
    private String databaseName;
    private String dbUsername;
    private String dbPassword;
    private String productionTableName;

    // Read config
    private String readColumns;          // comma-separated ordered column names
    private String readSqlQuery;
    private Boolean customReadQueryEnabled;

    // Send/Write config
    private String sendSqlQuery;
    private String writeMode;            // TABLE or FILE
    private String targetDestination;    // table name or file path

    // Scheduler (Send)
    private Boolean scheduleEnabled;
    private Integer scheduleIntervalSeconds;
    private Date lastRunDate;

    // Scheduler (Read)
    private Boolean readScheduleEnabled;
    private Integer readScheduleIntervalSeconds;
    private Date readLastRunDate;

    private Boolean active;
    private String fileLogPath;
    private String lastRunMessage;
    private String readLastRunMessage;
}
