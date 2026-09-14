package com.autonoma.erp.modules.qmt.machineintegration.service;

import com.autonoma.erp.modules.qmt.machineintegration.dto.MachineIntegrationConfigDto;
import com.autonoma.erp.modules.qmt.machineintegration.dto.SendDataRequestDto;
import com.autonoma.erp.modules.qmt.machineintegration.dto.TestConnectionResultDto;
import com.autonoma.erp.modules.qmt.machineintegration.entity.MachineIntegration;
import com.autonoma.erp.modules.qmt.machineintegration.repository.MachineIntegrationRepository;
import com.autonoma.erp.modules.qmt.repository.MachineRepository;
import com.autonoma.erp.modules.qmt.entity.Machine;
import com.autonoma.erp.security.EncryptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MachineIntegrationService {

    @Autowired
    private MachineIntegrationRepository repository;

    @Autowired
    private MachineRepository machineRepository;

    @Autowired
    private ExternalDatabaseService externalDbService;

    @Autowired
    private EncryptionService encryptionService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // ---- Config CRUD ----

    public MachineIntegrationConfigDto getConfig(Long machineIdRef) {
        return repository.findByMachineIdRef(machineIdRef)
                .map(this::toDto)
                .orElse(null);
    }

    public MachineIntegrationConfigDto saveConfig(Long machineIdRef, MachineIntegrationConfigDto dto) {
        machineRepository.findById(machineIdRef)
                .orElseThrow(() -> new IllegalArgumentException("Invalid Machine ID"));

        MachineIntegration entity = repository.findByMachineIdRef(machineIdRef).orElse(new MachineIntegration());
        entity.setMachineIdRef(machineIdRef);

        // Connection
        entity.setDbType(dto.getDbType());
        entity.setDbHost(dto.getDbHost());
        entity.setDbPort(dto.getDbPort());
        entity.setDatabaseName(dto.getDatabaseName());
        entity.setDbUsername(dto.getDbUsername());
        if (dto.getDbPassword() != null && !dto.getDbPassword().equals("********")) {
            entity.setDbPassword(encryptionService.encrypt(dto.getDbPassword()));
        }
        entity.setProductionTableName(dto.getProductionTableName());

        // Read config
        entity.setReadColumns(dto.getReadColumns());
        entity.setReadSqlQuery(dto.getReadSqlQuery());
        entity.setCustomReadQueryEnabled(dto.getCustomReadQueryEnabled() != null ? dto.getCustomReadQueryEnabled() : false);

        // Send/Write config
        entity.setSendSqlQuery(dto.getSendSqlQuery());
        entity.setWriteMode(dto.getWriteMode() != null ? dto.getWriteMode() : "TABLE");
        entity.setTargetDestination(dto.getTargetDestination());

        // Scheduler
        entity.setScheduleEnabled(dto.getScheduleEnabled() != null ? dto.getScheduleEnabled() : false);
        entity.setScheduleIntervalSeconds(dto.getScheduleIntervalSeconds() != null ? dto.getScheduleIntervalSeconds() : 60);

        entity.setReadScheduleEnabled(dto.getReadScheduleEnabled() != null ? dto.getReadScheduleEnabled() : false);
        entity.setReadScheduleIntervalSeconds(dto.getReadScheduleIntervalSeconds() != null ? dto.getReadScheduleIntervalSeconds() : 60);

        entity.setActive(dto.getActive() != null ? dto.getActive() : true);
        entity.setFileLogPath(dto.getFileLogPath());
        entity.setLastRunMessage(dto.getLastRunMessage());
        entity.setReadLastRunMessage(dto.getReadLastRunMessage());

        MachineIntegration saved = repository.save(entity);
        MachineIntegrationConfigDto result = toDto(saved);
        result.setDbPassword("********");
        return result;
    }

    // ---- Test Connection ----

    public TestConnectionResultDto testConnection(Long machineIdRef) {
        MachineIntegration config = getEntity(machineIdRef);
        String pwd = encryptionService.decrypt(config.getDbPassword());
        boolean ok = externalDbService.testConnection(
                config.getDbType(), config.getDbHost(), config.getDbPort(),
                config.getDatabaseName(), config.getDbUsername(), pwd);
        return ok
                ? new TestConnectionResultDto(true, "Connected Successfully")
                : new TestConnectionResultDto(false, "Connection failed. Verify server, port, database, username and password.");
    }

    // ---- Table listing from machine DB ----

    public List<String> getTables(Long machineIdRef) {
        java.util.Optional<MachineIntegration> configOpt = repository.findByMachineIdRef(machineIdRef);
        if (!configOpt.isPresent()) {
            return new java.util.ArrayList<>();
        }
        MachineIntegration config = configOpt.get();
        if (config.getDbHost() == null || config.getDbHost().trim().isEmpty()) {
            return new java.util.ArrayList<>();
        }
        String pwd = encryptionService.decrypt(config.getDbPassword());
        return externalDbService.getTables(
                config.getDbType(), config.getDbHost(), config.getDbPort(),
                config.getDatabaseName(), config.getDbUsername(), pwd);
    }

    // ---- Column listing from machine DB table ----

    public List<String> getTableColumns(Long machineIdRef, String tableName) {
        java.util.Optional<MachineIntegration> configOpt = repository.findByMachineIdRef(machineIdRef);
        if (!configOpt.isPresent()) {
            return new java.util.ArrayList<>();
        }
        MachineIntegration config = configOpt.get();
        String tableToFetch = (tableName != null && !tableName.trim().isEmpty()) ? tableName : config.getProductionTableName();
        
        if (config.getDbHost() == null || config.getDbHost().trim().isEmpty() || tableToFetch == null || tableToFetch.trim().isEmpty()) {
            return new java.util.ArrayList<>();
        }
        String pwd = encryptionService.decrypt(config.getDbPassword());
        return externalDbService.getTableColumns(
                config.getDbType(), config.getDbHost(), config.getDbPort(),
                config.getDatabaseName(), config.getDbUsername(), pwd,
                tableToFetch);
    }

    // ---- Read from machine DB using saved column config ----

    public List<Map<String, Object>> readExternalData(Long machineIdRef) {
        MachineIntegration config = getEntity(machineIdRef);
        String pwd = encryptionService.decrypt(config.getDbPassword());
        List<Map<String, Object>> data;

        if (Boolean.TRUE.equals(config.getCustomReadQueryEnabled()) && config.getReadSqlQuery() != null && !config.getReadSqlQuery().trim().isEmpty()) {
            data = externalDbService.runQueryOnExternal(
                    config.getDbType(), config.getDbHost(), config.getDbPort(),
                    config.getDatabaseName(), config.getDbUsername(), pwd,
                    config.getReadSqlQuery());
        } else {
            List<String> cols = null;
            if (config.getReadColumns() != null && !config.getReadColumns().trim().isEmpty()) {
                cols = Arrays.stream(config.getReadColumns().split(","))
                        .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList());
            }

            data = externalDbService.readData(
                    config.getDbType(), config.getDbHost(), config.getDbPort(),
                    config.getDatabaseName(), config.getDbUsername(), pwd,
                    config.getProductionTableName(), cols);
        }

        // Filter out already read rows
        List<Map<String, Object>> newRows = new java.util.ArrayList<>();
        for (Map<String, Object> row : data) {
            String hash = generateRowHash(row);
            if (!isRecordLogged(machineIdRef, "READ", hash)) {
                newRows.add(row);
                logRecordHash(machineIdRef, "READ", hash);
            }
        }

        logToFile(machineIdRef, "READ", newRows);

        String msg = "READ: " + newRows.size() + " row(s) retrieved from machine DB";
        config.setReadLastRunDate(new Date());
        config.setReadLastRunMessage(msg);
        repository.save(config);

        return newRows;
    }

    // ---- Ad-hoc send (legacy / quick test) ----

    public String sendExternalData(Long machineIdRef, SendDataRequestDto dto) {
        MachineIntegration config = getEntity(machineIdRef);
        
        String hash = generateRowHash(dto.getPayload());
        if (isRecordLogged(machineIdRef, "SEND", hash)) {
            throw new IllegalArgumentException("This data has already been sent.");
        }

        logToFile(machineIdRef, "SEND", dto.getPayload());
        String pwd = encryptionService.decrypt(config.getDbPassword());
        String result = externalDbService.sendData(
                config.getDbType(), config.getDbHost(), config.getDbPort(),
                config.getDatabaseName(), config.getDbUsername(), pwd,
                dto.getWriteMode(), dto.getTargetDestination(), dto.getPayload());

        logRecordHash(machineIdRef, "SEND", hash);
        return result;
    }

    // ---- Run configured Send job ----

    public Map<String, Object> runConfiguredJob(Long machineIdRef) {
        MachineIntegration config = getEntity(machineIdRef);
        String pwd = encryptionService.decrypt(config.getDbPassword());
        String result = executeJob(config, pwd);

        config.setLastRunDate(new Date());
        config.setLastRunMessage(result);
        repository.save(config);

        return Map.of("success", true, "message", result);
    }

    /**
     * Core execution: runs the saved SQL against our AT_NUTECH DB, then
     * writes results to either the machine DB table or a local file.
     */
    public String executeJob(MachineIntegration config, String plainPassword) {
        if (config.getSendSqlQuery() == null || config.getSendSqlQuery().trim().isEmpty()) {
            throw new IllegalArgumentException("Send SQL Query is not configured.");
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(config.getSendSqlQuery());
        
        // Filter out already sent rows
        List<Map<String, Object>> newRows = new java.util.ArrayList<>();
        for (Map<String, Object> row : rows) {
            String hash = generateRowHash(row);
            if (!isRecordLogged(config.getMachineIdRef(), "SEND", hash)) {
                newRows.add(row);
            }
        }

        if (newRows.isEmpty()) {
            return "No new data to send.";
        }

        logToFile(config.getMachineIdRef(), "SEND", newRows);

        if ("FILE".equalsIgnoreCase(config.getWriteMode())) {
            if (config.getTargetDestination() == null || config.getTargetDestination().trim().isEmpty()) {
                throw new IllegalArgumentException("File path (Target Destination) is not configured.");
            }
            String result = externalDbService.writeDataToFile(newRows, config.getTargetDestination());
            for (Map<String, Object> row : newRows) {
                logRecordHash(config.getMachineIdRef(), "SEND", generateRowHash(row));
            }
            return result;
        } else {
            if (config.getTargetDestination() == null || config.getTargetDestination().trim().isEmpty()) {
                throw new IllegalArgumentException("Target table (Target Destination) is not configured.");
            }
            int count = 0;
            for (Map<String, Object> row : newRows) {
                externalDbService.sendDataToTable(
                        config.getDbType(), config.getDbHost(), config.getDbPort(),
                        config.getDatabaseName(), config.getDbUsername(), plainPassword,
                        config.getTargetDestination(), row);
                logRecordHash(config.getMachineIdRef(), "SEND", generateRowHash(row));
                count++;
            }
            return "Sent " + count + " row(s) to table: " + config.getTargetDestination();
        }
    }

    // ---- Scheduler support: called by MachineIntegrationScheduler ----

    public List<MachineIntegration> getAllScheduledSendConfigs() {
        return repository.findByScheduleEnabledTrueAndActiveTrue();
    }

    public List<MachineIntegration> getAllScheduledReadConfigs() {
        return repository.findByReadScheduleEnabledTrueAndActiveTrue();
    }

    public String executeReadJob(MachineIntegration config, String plainPassword) {
        List<Map<String, Object>> rows;
        if (Boolean.TRUE.equals(config.getCustomReadQueryEnabled()) && config.getReadSqlQuery() != null && !config.getReadSqlQuery().trim().isEmpty()) {
            rows = externalDbService.runQueryOnExternal(
                    config.getDbType(), config.getDbHost(), config.getDbPort(),
                    config.getDatabaseName(), config.getDbUsername(), plainPassword,
                    config.getReadSqlQuery());
        } else {
            List<String> cols = null;
            if (config.getReadColumns() != null && !config.getReadColumns().trim().isEmpty()) {
                cols = Arrays.stream(config.getReadColumns().split(","))
                        .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList());
            }
            rows = externalDbService.readData(
                    config.getDbType(), config.getDbHost(), config.getDbPort(),
                    config.getDatabaseName(), config.getDbUsername(), plainPassword,
                    config.getProductionTableName(), cols);
        }

        // Filter out already read rows
        List<Map<String, Object>> newRows = new java.util.ArrayList<>();
        for (Map<String, Object> row : rows) {
            String hash = generateRowHash(row);
            if (!isRecordLogged(config.getMachineIdRef(), "READ", hash)) {
                newRows.add(row);
                logRecordHash(config.getMachineIdRef(), "READ", hash);
            }
        }

        logToFile(config.getMachineIdRef(), "READ", newRows);
        return "READ: " + newRows.size() + " row(s) retrieved from machine DB";
    }

    public List<Map<String, Object>> getSendDataPreview(Long machineIdRef) {
        MachineIntegration config = getEntity(machineIdRef);
        if (config.getSendSqlQuery() == null || config.getSendSqlQuery().trim().isEmpty()) {
            throw new IllegalArgumentException("Send SQL Query is not configured.");
        }
        // As per ad-hoc queries, always add WITH (NOLOCK) or set READ UNCOMMITTED if needed, but since it's user SQL query, we execute as-is
        return jdbcTemplate.queryForList(config.getSendSqlQuery());
    }

    // ---- Helpers ----

    public MachineIntegration getEntity(Long machineIdRef) {
        return repository.findByMachineIdRef(machineIdRef)
                .orElseThrow(() -> new IllegalArgumentException("Configuration not found for machine: " + machineIdRef));
    }

    private MachineIntegrationConfigDto toDto(MachineIntegration e) {
        MachineIntegrationConfigDto dto = new MachineIntegrationConfigDto();
        dto.setId(e.getId());
        dto.setMachineIdRef(e.getMachineIdRef());
        dto.setDbType(e.getDbType());
        dto.setDbHost(e.getDbHost());
        dto.setDbPort(e.getDbPort());
        dto.setDatabaseName(e.getDatabaseName());
        dto.setDbUsername(e.getDbUsername());
        dto.setDbPassword("********");
        dto.setProductionTableName(e.getProductionTableName());
        dto.setReadColumns(e.getReadColumns());
        dto.setReadSqlQuery(e.getReadSqlQuery());
        dto.setCustomReadQueryEnabled(e.getCustomReadQueryEnabled());
        dto.setSendSqlQuery(e.getSendSqlQuery());
        dto.setWriteMode(e.getWriteMode());
        dto.setTargetDestination(e.getTargetDestination());
        dto.setScheduleEnabled(e.getScheduleEnabled());
        dto.setScheduleIntervalSeconds(e.getScheduleIntervalSeconds());
        dto.setLastRunDate(e.getLastRunDate());
        dto.setReadScheduleEnabled(e.getReadScheduleEnabled());
        dto.setReadScheduleIntervalSeconds(e.getReadScheduleIntervalSeconds());
        dto.setReadLastRunDate(e.getReadLastRunDate());
        dto.setActive(e.getActive());
        dto.setFileLogPath(e.getFileLogPath());
        dto.setLastRunMessage(e.getLastRunMessage());
        dto.setReadLastRunMessage(e.getReadLastRunMessage());
        return dto;
    }

    private void logToFile(Long machineIdRef, String prefix, Object data) {
        if (data == null) {
            return;
        }
        if (data instanceof java.util.Collection && ((java.util.Collection<?>) data).isEmpty()) {
            return;
        }
        if (data instanceof java.util.Map && ((java.util.Map<?, ?>) data).isEmpty()) {
            return;
        }
        try {
            MachineIntegration config = repository.findByMachineIdRef(machineIdRef).orElse(null);
            if (config == null || config.getFileLogPath() == null || config.getFileLogPath().trim().isEmpty()) {
                return;
            }

            String directoryPath = config.getFileLogPath().trim();

            Machine machine = machineRepository.findById(machineIdRef).orElse(null);
            String machineCode = (machine != null && machine.getAssetId() != null) ? machine.getAssetId() : "M" + machineIdRef;
            machineCode = machineCode.replaceAll("[\\\\/:*?\"<>|]", "_");

            java.io.File dir = new java.io.File(directoryPath, machineCode);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String timestamp = new java.text.SimpleDateFormat("yyyyMMdd_HHmmss").format(new java.util.Date());
            String fileName = machineCode + "_" + timestamp + "_" + prefix + ".txt";
            java.io.File file = new java.io.File(dir, fileName);

            String content;
            try {
                content = new com.fasterxml.jackson.databind.ObjectMapper()
                        .writerWithDefaultPrettyPrinter()
                        .writeValueAsString(data);
            } catch (Exception e) {
                content = String.valueOf(data);
            }

            java.nio.file.Files.write(file.toPath(), content.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(MachineIntegrationService.class)
                    .error("Failed to write integration log file for machine " + machineIdRef, e);
        }
    }

    private boolean isRecordLogged(Long machineIdRef, String opType, String recordHash) {
        try {
            String sql = "SELECT COUNT(*) FROM QMT_MACHINE_INTEGRATION_LOG WITH (NOLOCK) WHERE MACHINE_ID_REF = ? AND OP_TYPE = ? AND RECORD_HASH = ?";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, machineIdRef, opType, recordHash);
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private void logRecordHash(Long machineIdRef, String opType, String recordHash) {
        try {
            String sql = "INSERT INTO QMT_MACHINE_INTEGRATION_LOG (MACHINE_ID_REF, OP_TYPE, RECORD_HASH, CREATED_DATE) VALUES (?, ?, ?, GETDATE())";
            jdbcTemplate.update(sql, machineIdRef, opType, recordHash);
        } catch (Exception e) {
            // Ignore if insert fails due to uniqueness index
        }
    }

    private String generateRowHash(Map<String, Object> row) {
        if (row == null || row.isEmpty()) {
            return "empty";
        }
        try {
            java.util.TreeMap<String, Object> sortedMap = new java.util.TreeMap<>();
            for (Map.Entry<String, Object> entry : row.entrySet()) {
                if (entry.getValue() != null) {
                    sortedMap.put(entry.getKey(), entry.getValue().toString());
                }
            }
            String content = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(sortedMap);
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return String.valueOf(row.hashCode());
        }
    }

    public void resetIntegrationHistory(Long machineIdRef) {
        String sql = "DELETE FROM QMT_MACHINE_INTEGRATION_LOG WHERE MACHINE_ID_REF = ?";
        jdbcTemplate.update(sql, machineIdRef);
    }
}
