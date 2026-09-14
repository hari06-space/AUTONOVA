package com.autonoma.erp.modules.platform.datamigration.service;

import com.autonoma.erp.util.SecurityUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.model.admin.UserCredential;

import com.autonoma.erp.modules.qms.checklist.service.MasterChecklistMigrationService;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeTypeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeTypeMasterRepository;
import com.autonoma.erp.modules.hr.orgstructure.entity.Designation;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationRepository;
import com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel;
import com.autonoma.erp.modules.hr.orgstructure.entity.Gradedetails;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationLevelRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.EmpGradeRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeManagerMapping;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeActivity;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeActivityRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeAsset;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeAssetRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeContact;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeContactRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeePersonalDetail;
import com.autonoma.erp.modules.hr.employee.repository.EmployeePersonalDetailRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeePassport;
import com.autonoma.erp.modules.hr.employee.repository.EmployeePassportRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeKycDocument;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeKycDocumentRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeEmergencyContact;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeEmergencyContactRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeEducation;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeEducationRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeDependent;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeDependentRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeExperience;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeExperienceRepository;
import com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster;
import com.autonoma.erp.modules.hr.holiday.repository.HrHolidayMasterRepository;
import com.autonoma.erp.modules.hr.loan.entity.HrLoanMaster;
import com.autonoma.erp.modules.hr.loan.repository.HrLoanMasterRepository;
import com.autonoma.erp.modules.hr.attendance.entity.ShiftMaster;
import com.autonoma.erp.modules.hr.attendance.repository.ShiftMasterRepository;
import com.autonoma.erp.modules.hr.month.entity.HrMonthMaster;
import com.autonoma.erp.modules.hr.month.repository.HrMonthMasterRepository;
import com.autonoma.erp.modules.hr.petrol.entity.HrPetrolAllowanceMaster;
import com.autonoma.erp.modules.hr.petrol.repository.HrPetrolAllowanceMasterRepository;

import com.autonoma.erp.modules.platform.identity.entity.PermissionEntry;
import com.autonoma.erp.modules.platform.identity.repository.PermissionEntryRepository;

import com.autonoma.erp.modules.hra.recruitment.repository.InterviewMasterRepository;
import com.autonoma.erp.modules.platform.files.service.FileService;
import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.master.organization.repository.DivisionRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.util.CellRangeAddressList;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;

@Service
public class HrmsMigrationService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(HrmsMigrationService.class);

    @Autowired
    private org.springframework.transaction.PlatformTransactionManager transactionManager;

    @Autowired
    private DivisionRepository divisionRepository;

    @Autowired
    private com.autonoma.erp.modules.hra.recruitment.service.AtsStatusResolver statusResolver;

    @Autowired
    private com.autonoma.erp.repository.admin.MigrationAuditLogRepository auditLogRepository;

    @Transactional
    public String clearEmployeeTypes() {
        employeeTypeMasterRepository.deleteAllInBatch();
        return "Cleared all employee type records.";
    }

    @Transactional
    public void clearEmployeeMasterAll() {
        java.util.List<String> deleteQueries = java.util.Arrays.asList(
                "DELETE FROM HR_EMPLOYEE_SATISFACTION_REMINDER_LOG",
                "DELETE FROM HR_EMPLOYEE_SATISFACTION_RESPONSE",
                "DELETE FROM HR_EMPLOYEE_SATISFACTION_MAPPING",
                "DELETE FROM HR_BIOMETRIC_ATTENDANCE",
                "DELETE FROM HR_EMPLOYEE_TRANSFER",
                "DELETE FROM HR_LEAVE_TRANSACTION",
                "DELETE FROM HR_LEAVE_DETAILS",
                "DELETE FROM HR_LEAVE_MASTER",
                "DELETE FROM HR_LEAVE_TRAVEL_DETAILS",
                "DELETE FROM HR_EMPLOYEE_MANAGER_MAPPING",
                "DELETE FROM HR_ONBOARD_APPOINTMENT_ORDER",
                "DELETE FROM HR_ONBOARD_OFFER_LETTER",
                "DELETE FROM HR_ONBOARD_RELIEVING_ORDER",
                "DELETE FROM HR_EMPLOYEE_ORGANIZATION",
                "DELETE FROM HR_EMPLOYEE_REFERENCE",
                "DELETE FROM HR_EMPLOYEE_SCHEDULING",
                "DELETE FROM HR_EMPLOYEE_INDUCTION",
                "DELETE FROM HR_EMPLOYEE_OPERATIONS",
                "DELETE FROM HR_EMPLOYEE_STATUTORY",
                "DELETE FROM HR_EMPLOYEE_ABILITY",
                "DELETE FROM HR_EMPLOYEE_MEMO",
                "DELETE FROM HR_EMPLOYEE_SELF_ASSESSMENT",
                "DELETE FROM HR_LEAVE_ENCASHMENT_ENTRY",
                "DELETE FROM HRA_LEAVE_ENCASHMENT_VERIFIED",
                "DELETE FROM HRA_PENALTY",
                "DELETE FROM QMS_MEETING_USER_ATTENDANCE",
                "DELETE FROM QMS_MOM_ATTENDANCE",
                "DELETE FROM QMS_MEETING_SCHEDULE_PARTICIPANT",
                "DELETE FROM QMS_MEETING_PARTICIPANT_MAPPING",
                "DELETE FROM QMS_MEETING_EMPLOYEE_MAPPING",
                "DELETE FROM QMS_AUDIT_ATTENDANCE",
                "DELETE FROM PLATFORM_TICKET_TRACEABILITY_CENTER",
                "DELETE FROM PLATFORM_PERMISSION_ENTRY");

        for (String sql : deleteQueries) {
            try {
                primaryJdbcTemplate.execute(sql);
            } catch (Exception e) {
                // Ignore missing tables
            }
        }

        try {
            primaryJdbcTemplate.update("UPDATE QMS_CHECKLIST_MASTER SET PRIMARY_EMPLOYEE_ID = NULL");
        } catch (Exception e) {
        }
        try {
            primaryJdbcTemplate.update(
                    "UPDATE HR_INDUCTION_REASSIGNMENT_LOG SET NEW_ASSESSOR_ID = NULL, PREVIOUS_ASSESSOR_ID = NULL, TRAINEE_ID = NULL");
        } catch (Exception e) {
        }

        // Delete sub-tables first (foreign key order), then the master
        employeeActivityRepository.deleteAllInBatch();
        employeeAssetRepository.deleteAllInBatch();
        employeeContactRepository.deleteAllInBatch();
        employeePersonalDetailRepository.deleteAllInBatch();
        employeePassportRepository.deleteAllInBatch();
        employeeKycDocumentRepository.deleteAllInBatch();
        employeeJobProfileRepository.deleteAllInBatch();
        employeeEmergencyContactRepository.deleteAllInBatch();
        employeeEducationRepository.deleteAllInBatch();
        employeeDependentRepository.deleteAllInBatch();
        employeeExperienceRepository.deleteAllInBatch();
        employeeMasterRepository.deleteAllInBatch();
    }

    @Autowired(required = false)
    @Qualifier("secondaryJdbcTemplate")
    private JdbcTemplate jdbcTemplate;

    private final java.util.Map<String, Boolean> folderExistenceCache = new java.util.concurrent.ConcurrentHashMap<>();

    private String migrateEmployeeFile(String fileName, String oldSubFolder, String newLogicalFolder) {
        if (fileName == null || fileName.trim().isEmpty())
            return null;
        fileName = fileName.trim();
        try {
            String basePath = getSecondaryProcessImgLocation();
            if (basePath == null)
                return fileName;

            if (oldSubFolder != null && !oldSubFolder.trim().isEmpty()) {
                basePath = basePath + java.io.File.separator + oldSubFolder;
            }

            boolean dirExists = folderExistenceCache.computeIfAbsent(basePath, path -> new java.io.File(path).exists());
            if (!dirExists) {
                return fileName;
            }

            java.io.File sourceFile = new java.io.File(basePath, fileName);
            if (sourceFile.exists()) {
                java.nio.file.Path targetDir = fileService.getRootPath().resolve(newLogicalFolder).toFile().toPath();
                if (!java.nio.file.Files.exists(targetDir)) {
                    java.nio.file.Files.createDirectories(targetDir);
                }
                java.io.File targetFile = targetDir.resolve(fileName).toFile();
                java.nio.file.Files.copy(sourceFile.toPath(), targetFile.toPath(),
                        java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                return newLogicalFolder + "/" + fileName;
            } else {
                System.err.println("[EMPLOYEE FILE MIGRATION] Source file not found: " + sourceFile.getAbsolutePath());
            }
        } catch (Exception e) {
            System.err.println("[EMPLOYEE FILE MIGRATION] Error copying file " + fileName + ": " + e.getMessage());
        }
        return fileName; // Return just the filename if it wasn't copied so at least DB holds the name
    }

    private String getSecondaryProcessImgLocation() {
        String customPath = com.autonoma.erp.modules.qms.checklist.service.MasterChecklistMigrationService
                .getSecondaryAttachmentPath();
        if (customPath != null && !customPath.trim().isEmpty()) {
            String base = customPath.trim();
            if (!base.toLowerCase().endsWith("erpimage") && !base.toLowerCase().endsWith("erpimage\\")) {
                base = base + "\\erpimage";
            }
            return base;
        }
        try {
            if (jdbcTemplate != null) {
                String sql = "SELECT VALUE FROM PREFERENCE_TABLE WHERE COL_NAME = 'PROCESS_IMG_LOCATION'";
                String val = jdbcTemplate.queryForObject(sql, String.class);
                if (val != null && !val.trim().isEmpty()) {
                    return val.trim();
                }
            }
        } catch (Exception e) {
            System.err.println("[MIGRATION WARNING] Failed to get PROCESS_IMG_LOCATION: " + e.getMessage());
        }
        return "D:\\ERPCommon-NuTech\\erpimage";
    }

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmployeeTypeMasterRepository employeeTypeMasterRepository;

    @Autowired
    private DesignationRepository designationRepository;

    @Autowired
    private DesignationLevelRepository designationLevelRepository;

    @Autowired
    private EmpGradeRepository empGradeRepository;

    @Autowired
    private EmployeeMasterRepository employeeMasterRepository;
    @Autowired
    private EmployeeManagerMappingRepository employeeManagerMappingRepository;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private EmployeeActivityRepository employeeActivityRepository;
    @Autowired
    private EmployeeAssetRepository employeeAssetRepository;
    @Autowired
    private EmployeeContactRepository employeeContactRepository;
    @Autowired
    private EmployeePersonalDetailRepository employeePersonalDetailRepository;
    @Autowired
    private EmployeePassportRepository employeePassportRepository;
    @Autowired
    private EmployeeKycDocumentRepository employeeKycDocumentRepository;
    @Autowired
    private EmployeeJobProfileRepository employeeJobProfileRepository;
    @Autowired
    private EmployeeEmergencyContactRepository employeeEmergencyContactRepository;
    @Autowired
    private EmployeeEducationRepository employeeEducationRepository;
    @Autowired
    private EmployeeDependentRepository employeeDependentRepository;
    @Autowired
    private EmployeeExperienceRepository employeeExperienceRepository;
    @Autowired
    private HrHolidayMasterRepository hrHolidayMasterRepository;

    @Autowired
    private HrLoanMasterRepository hrLoanMasterRepository;

    @Autowired
    private ShiftMasterRepository shiftMasterRepository;

    @Autowired
    private HrMonthMasterRepository hrMonthMasterRepository;

    @Autowired
    private HrPetrolAllowanceMasterRepository hrPetrolAllowanceMasterRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.common.repository.CategoryMasterRepository categoryMasterRepository;

    @Autowired
    private PermissionEntryRepository permissionEntryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    @Qualifier("jdbcTemplate")
    private JdbcTemplate primaryJdbcTemplate;

    @Autowired
    private InterviewMasterRepository interviewMasterRepository;

    @Autowired
    private FileService fileService;

    private java.util.List<String> expandCols(String[] colNames) {
        java.util.List<String> cols = new java.util.ArrayList<>(java.util.Arrays.asList(colNames));
        boolean needsEmpCd = false;
        boolean needsOldEmpCd = false;
        for (String c : colNames) {
            if ("empCode".equalsIgnoreCase(c) || "EMP_CODE".equalsIgnoreCase(c) || "employeeId".equalsIgnoreCase(c)
                    || "EMPLOYEE_ID".equalsIgnoreCase(c)) {
                needsEmpCd = true;
            }
            if ("oldEmpCode".equalsIgnoreCase(c) || "OLD_EMP_CODE".equalsIgnoreCase(c)) {
                needsOldEmpCd = true;
            }
        }
        if (needsEmpCd)
            cols.add("EMP_CD");
        if (needsOldEmpCd)
            cols.add("OLDEMP_CD");
        return cols;
    }

    private String getStringSafe(java.sql.ResultSet rs, String... colNames) {
        for (String col : expandCols(colNames)) {
            try {
                String val = rs.getString(col);
                if (val != null)
                    return val.trim();
            } catch (Exception e) {
            }
        }
        return null;
    }

    private java.sql.Timestamp getTimestampSafe(java.sql.ResultSet rs, String... colNames) {
        for (String col : expandCols(colNames)) {
            try {
                java.sql.Timestamp t = rs.getTimestamp(col);
                if (t != null)
                    return t;
            } catch (Exception e) {
            }
        }
        return null;
    }

    private Integer getIntSafe(java.sql.ResultSet rs, String... colNames) {
        for (String col : expandCols(colNames)) {
            try {
                rs.findColumn(col);
                int val = rs.getInt(col);
                if (!rs.wasNull())
                    return val;
            } catch (Exception e) {
            }
        }
        return null;
    }

    private Integer getIntegerSafe(java.sql.ResultSet rs, String... colNames) {
        return getIntSafe(rs, colNames);
    }

    private Long getLongSafe(java.sql.ResultSet rs, String... colNames) {
        for (String col : expandCols(colNames)) {
            try {
                rs.findColumn(col);
                long val = rs.getLong(col);
                if (!rs.wasNull())
                    return val;
            } catch (Exception e) {
            }
        }
        return null;
    }

    private Double getDoubleSafe(java.sql.ResultSet rs, String... colNames) {
        for (String col : expandCols(colNames)) {
            try {
                rs.findColumn(col);
                double val = rs.getDouble(col);
                if (!rs.wasNull())
                    return val;
            } catch (Exception e) {
            }
        }
        return null;
    }

    private java.math.BigDecimal getBigDecimalSafe(java.sql.ResultSet rs, String... colNames) {
        for (String col : expandCols(colNames)) {
            try {
                rs.findColumn(col);
                java.math.BigDecimal val = rs.getBigDecimal(col);
                if (val != null)
                    return val;
            } catch (Exception e) {
            }
        }
        return null;
    }

    private Boolean getBooleanSafe(java.sql.ResultSet rs, String... colNames) {
        for (String col : expandCols(colNames)) {
            try {
                rs.findColumn(col);
                boolean val = rs.getBoolean(col);
                if (!rs.wasNull())
                    return val;
            } catch (Exception e) {
            }
        }
        return null;
    }

    @Transactional
    public String migrateEmployeeTypes() {
        String currentUser = "SUPER BOSS";

        final String finalUserId = currentUser;
        codeToNewEmpIdMap = null;
        oldToNewEmpIdMap = null;
        initCodeToNewEmpIdMap();
        initOldToNewEmpIdMap();
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }

        String sql = "SELECT * FROM HRMS_EMPLOYEE_TYPE_MASTER";

        List<EmployeeTypeMaster> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            EmployeeTypeMaster type = new EmployeeTypeMaster();

            // Map legacy columns safely
            String legacyTypeName = getStringSafe(rs, "TYPE_NAME", "type_name", "EMP_TYPE_NAME", "emp_type_name");
            type.setTypeName(legacyTypeName);

            type.setDescription(getStringSafe(rs, "DESCRIPTION", "description"));

            String status = getStringSafe(rs, "STATUS", "status");
            type.setStatus(status != null && !status.isEmpty() ? status : "ACTIVE");

            type.setIsActive("ACTIVE".equalsIgnoreCase(type.getStatus()));

            type.setCreatedBy("SUPER BOSS");

            java.sql.Timestamp createdDate = getTimestampSafe(rs, "CREATED_DATE", "CREATED_AT", "created_date",
                    "created_at", "createdDate", "CREAT_DT");
            type.setCreatedDate(createdDate != null ? createdDate : new java.util.Date());

            type.setUpdatedBy("SUPER BOSS");
            type.setUpdatedDate(getTimestampSafe(rs, "UPDATED_DATE", "UPDATED_AT", "updated_date", "updated_at",
                    "updatedDate", "LST_UPDT_TS"));

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return type;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped by user. Migrated 0 employee type records.";
        }

        int migratedCount = 0;
        if (!migratedList.isEmpty()) {
            List<EmployeeTypeMaster> existingAll = employeeTypeMasterRepository.findAll();
            for (EmployeeTypeMaster type : migratedList) {
                if (type.getTypeName() != null && !type.getTypeName().isEmpty()) {
                    EmployeeTypeMaster existing = existingAll.stream()
                            .filter(e -> e.getTypeName().equalsIgnoreCase(type.getTypeName())).findFirst().orElse(null);
                    if (existing != null) {
                        type.setId(existing.getId());
                    }
                    employeeTypeMasterRepository.save(type);
                    migratedCount++;
                }
            }
        }

        return "Successfully migrated " + migratedCount
                + " employee type records from HRMS_EMPLOYEE_TYPE_MASTER to HR_EMPLOYEE_TYPE.";
    }

    public byte[] generateEmployeeTypeSampleExcel() {
        try (Workbook workbook = new XSSFWorkbook()) {
            // Sheet 1: Instructions
            Sheet instructionSheet = workbook.createSheet("Instructions");
            Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("Employee Type Migration Instructions");

            Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            Row instRow2 = instructionSheet.createRow(2);
            instRow2.createCell(0).setCellValue("2. 'Type Name' is mandatory and should be unique.");
            Row instRow3 = instructionSheet.createRow(3);
            instRow3.createCell(0).setCellValue("3. 'Status' has a dropdown. Please select ACTIVE or INACTIVE.");

            instructionSheet.autoSizeColumn(0);

            // Sheet 2: Migration Record
            Sheet sheet = workbook.createSheet("Migration Record");

            // Highlighted and Bold Header
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row headerRow = sheet.createRow(0);
            Cell h1 = headerRow.createCell(0);
            h1.setCellValue("Type Name");
            h1.setCellStyle(headerStyle);

            Cell h2 = headerRow.createCell(1);
            h2.setCellValue("Description");
            h2.setCellStyle(headerStyle);

            Cell h3 = headerRow.createCell(2);
            h3.setCellValue("Status");
            h3.setCellStyle(headerStyle);

            Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("Permanent");
            sampleRow.createCell(1).setCellValue("Permanent Employee");
            sampleRow.createCell(2).setCellValue("ACTIVE");

            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            // Dropdown for Status column
            DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            DataValidationConstraint constraint = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            CellRangeAddressList addressList = new CellRangeAddressList(1, 1000, 2, 2);
            DataValidation validation = validationHelper.createValidation(constraint, addressList);
            sheet.addValidationData(validation);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate sample excel", e);
        }
    }

    @Transactional
    public java.util.Map<String, Object> migrateEmployeeTypesFromExcel(MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(1); // Read from Migration Record sheet

            Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null
                    || headerRow.getCell(0).getCellType() != CellType.STRING
                    || !"Type Name".equalsIgnoreCase(headerRow.getCell(0).getStringCellValue().trim())) {
                throw new IllegalArgumentException(
                        "Invalid Excel template uploaded. Expected 'Type Name' column. Please download the correct Employee Type template.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            List<EmployeeTypeMaster> existingAll = employeeTypeMasterRepository.findAll();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                Cell typeNameCell = row.getCell(0);
                if (typeNameCell == null || typeNameCell.getCellType() == CellType.BLANK)
                    continue;
                String typeName = typeNameCell.getStringCellValue().trim();

                String description = "";
                Cell descCell = row.getCell(1);
                if (descCell != null && descCell.getCellType() == CellType.STRING) {
                    description = descCell.getStringCellValue().trim();
                }

                String status = "ACTIVE";
                Cell statusCell = row.getCell(2);
                if (statusCell != null && statusCell.getCellType() == CellType.STRING) {
                    status = statusCell.getStringCellValue().trim();
                }

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("typeName", typeName);
                rowDetail.put("description", description);
                rowDetail.put("status", status);

                boolean exists = existingAll.stream()
                        .anyMatch(e -> e.getTypeName().equalsIgnoreCase(typeName));

                if (exists) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", "Type name already exists");
                    failedCount++;
                } else {
                    EmployeeTypeMaster type = new EmployeeTypeMaster();
                    type.setTypeName(typeName);
                    type.setDescription(description);
                    type.setStatus(status);
                    type.setIsActive("ACTIVE".equalsIgnoreCase(status));
                    employeeTypeMasterRepository.save(type);

                    existingAll.add(type);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " employee type records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    @Transactional
    public java.util.Map<String, Object> migrateDepartmentsFromExcel(MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(1); // Read from Migration Record sheet

            Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null
                    || headerRow.getCell(0).getCellType() != CellType.STRING
                    || !"Department Name".equalsIgnoreCase(headerRow.getCell(0).getStringCellValue().trim())) {
                throw new IllegalArgumentException(
                        "Invalid Excel template uploaded. Expected 'Department Name' column. Please download the correct Department template.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            List<com.autonoma.erp.modules.hr.orgstructure.entity.Department> existingAll = departmentRepository
                    .findAll();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                Cell deptNameCell = row.getCell(0);
                if (deptNameCell == null || deptNameCell.getCellType() == CellType.BLANK)
                    continue;
                String deptName = deptNameCell.getStringCellValue().trim();

                String deptNo = "";
                Cell deptNoCell = row.getCell(1);
                if (deptNoCell != null && deptNoCell.getCellType() == CellType.STRING) {
                    deptNo = deptNoCell.getStringCellValue().trim();
                }

                String ndaCertificate = "No";
                Cell ndaCell = row.getCell(2);
                if (ndaCell != null && ndaCell.getCellType() == CellType.STRING) {
                    ndaCertificate = ndaCell.getStringCellValue().trim();
                }

                String status = "Active";
                Cell statusCell = row.getCell(3);
                if (statusCell != null && statusCell.getCellType() == CellType.STRING) {
                    status = statusCell.getStringCellValue().trim();
                }

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("typeName", deptName); // Map to "typeName" for generic data table columns
                rowDetail.put("description", deptNo); // Map to "description" for generic data table columns
                rowDetail.put("status", status);

                boolean exists = existingAll.stream()
                        .anyMatch(e -> e.getDepartmentName().equalsIgnoreCase(deptName));

                if (exists) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", "Department name already exists");
                    failedCount++;
                } else {
                    com.autonoma.erp.modules.hr.orgstructure.entity.Department dept = new com.autonoma.erp.modules.hr.orgstructure.entity.Department();
                    dept.setDepartmentName(deptName);
                    dept.setDepartmentNo(deptNo);
                    dept.setNdaCertificate(ndaCertificate);
                    dept.setStatus(status);
                    dept.setIsActive("ACTIVE".equalsIgnoreCase(status));
                    departmentRepository.save(dept);

                    existingAll.add(dept);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " department records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generateDepartmentSampleExcel() {
        try (Workbook workbook = new XSSFWorkbook()) {
            // Sheet 1: Instructions
            Sheet instructionSheet = workbook.createSheet("Instructions");
            Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("Department Migration Instructions");

            Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            Row instRow2 = instructionSheet.createRow(2);
            instRow2.createCell(0).setCellValue("2. 'Department Name' is mandatory and should be unique.");
            Row instRow3 = instructionSheet.createRow(3);
            instRow3.createCell(0).setCellValue("3. 'Department No' is optional but should be unique if provided.");
            Row instRow4 = instructionSheet.createRow(4);
            instRow4.createCell(0).setCellValue("4. 'Status' has a dropdown. Please select Active or Inactive.");

            instructionSheet.autoSizeColumn(0);

            // Sheet 2: Migration Record
            Sheet sheet = workbook.createSheet("Migration Record");

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row headerRow = sheet.createRow(0);
            Cell h1 = headerRow.createCell(0);
            h1.setCellValue("Department Name");
            h1.setCellStyle(headerStyle);

            Cell h2 = headerRow.createCell(1);
            h2.setCellValue("Department No");
            h2.setCellStyle(headerStyle);

            Cell h3 = headerRow.createCell(2);
            h3.setCellValue("NDA Certificate");
            h3.setCellStyle(headerStyle);

            Cell h4 = headerRow.createCell(3);
            h4.setCellValue("Status");
            h4.setCellStyle(headerStyle);

            Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("Information Technology");
            sampleRow.createCell(1).setCellValue("IT-001");
            sampleRow.createCell(2).setCellValue("Yes");
            sampleRow.createCell(3).setCellValue("Active");

            for (int i = 0; i < 4; i++) {
                sheet.autoSizeColumn(i);
            }

            DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            DataValidationConstraint constraint = validationHelper
                    .createExplicitListConstraint(new String[] { "Active", "Inactive" });
            CellRangeAddressList addressList = new CellRangeAddressList(1, 1000, 3, 3);
            DataValidation validation = validationHelper.createValidation(constraint, addressList);
            sheet.addValidationData(validation);

            DataValidationConstraint ndaConstraint = validationHelper
                    .createExplicitListConstraint(new String[] { "Yes", "No" });
            CellRangeAddressList ndaAddressList = new CellRangeAddressList(1, 1000, 2, 2);
            DataValidation ndaValidation = validationHelper.createValidation(ndaConstraint, ndaAddressList);
            sheet.addValidationData(ndaValidation);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Department sample Excel: " + e.getMessage());
        }
    }

    public byte[] generateDesignationSampleExcel() {
        try (Workbook workbook = new XSSFWorkbook()) {
            // Sheet 1: Instructions
            Sheet instructionSheet = workbook.createSheet("Instructions");
            Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("Designation Migration Instructions");

            Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            Row instRow2 = instructionSheet.createRow(2);
            instRow2.createCell(0).setCellValue("2. 'Designation Name' is mandatory and should be unique.");
            Row instRow3 = instructionSheet.createRow(3);
            instRow3.createCell(0).setCellValue("3. 'Designation Code' is optional but should be unique if provided.");
            Row instRow4 = instructionSheet.createRow(4);
            instRow4.createCell(0).setCellValue("4. 'Status' has a dropdown. Please select Active or Inactive.");

            instructionSheet.autoSizeColumn(0);

            // Sheet 2: Migration Record
            Sheet sheet = workbook.createSheet("Migration Record");

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row headerRow = sheet.createRow(0);
            Cell h1 = headerRow.createCell(0);
            h1.setCellValue("Designation Name");
            h1.setCellStyle(headerStyle);

            Cell h2 = headerRow.createCell(1);
            h2.setCellValue("Designation Code");
            h2.setCellStyle(headerStyle);

            Cell h3 = headerRow.createCell(2);
            h3.setCellValue("Status");
            h3.setCellStyle(headerStyle);

            Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("Software Engineer");
            sampleRow.createCell(1).setCellValue("SE-001");
            sampleRow.createCell(2).setCellValue("ACTIVE");

            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            DataValidationConstraint constraint = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            CellRangeAddressList addressList = new CellRangeAddressList(1, 1000, 2, 2);
            DataValidation validation = validationHelper.createValidation(constraint, addressList);
            sheet.addValidationData(validation);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Designation sample Excel: " + e.getMessage());
        }
    }

    @Transactional
    public java.util.Map<String, Object> migrateDesignationsFromExcel(MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(1); // Read from Migration Record sheet

            Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null
                    || headerRow.getCell(0).getCellType() != CellType.STRING
                    || !"Designation Name".equalsIgnoreCase(headerRow.getCell(0).getStringCellValue().trim())) {
                throw new IllegalArgumentException(
                        "Invalid Excel template uploaded. Expected 'Designation Name' column. Please download the correct Designation template.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            List<Designation> existingAll = designationRepository.findAll();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                Cell nameCell = row.getCell(0);
                if (nameCell == null || nameCell.getCellType() == CellType.BLANK)
                    continue;
                String desigName = nameCell.getStringCellValue().trim();

                String desigCode = "";
                Cell codeCell = row.getCell(1);
                if (codeCell != null && codeCell.getCellType() == CellType.STRING) {
                    desigCode = codeCell.getStringCellValue().trim();
                }

                String status = "ACTIVE";
                Cell statusCell = row.getCell(2);
                if (statusCell != null && statusCell.getCellType() == CellType.STRING) {
                    status = statusCell.getStringCellValue().trim();
                }

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("designationName", desigName);
                rowDetail.put("designationCode", desigCode);
                rowDetail.put("status", status);

                boolean exists = existingAll.stream().anyMatch(
                        d -> d.getDesignationName() != null && d.getDesignationName().equalsIgnoreCase(desigName));

                if (exists) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", "Designation Name already exists");
                    failedCount++;
                } else {
                    Designation d = new Designation();
                    d.setDesignationName(desigName);
                    d.setDesignationCode(desigCode);
                    d.setIsActive("ACTIVE".equalsIgnoreCase(status));

                    designationRepository.save(d);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " designation records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    @Transactional
    public String clearDesignations() {
        designationRepository.deleteAllInBatch();
        return "Cleared all designation records.";
    }

    @Transactional
    public String migrateDesignationLevels() {
        if (jdbcTemplate == null)
            return "Migration database not configured.";
        String sql = "SELECT * FROM HRMS_DESIG_LEVEL_MASTER";

        List<DesignationLevel> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            DesignationLevel dl = new DesignationLevel();

            String levelName = getStringSafe(rs, "DESIG_LEVEL", "desig_level");
            dl.setLevel(levelName);

            dl.setBasic(getDoubleSafe(rs, "BASIC", "basic"));
            dl.setDa(getDoubleSafe(rs, "BASKET_ALLOW", "basket_allow", "DA", "da"));
            dl.setHra(getDoubleSafe(rs, "HRA", "hra"));

            Integer screeningLevel = getIntSafe(rs, "SCREENING_LEVEL", "screening_level");
            dl.setScreeningLevel(screeningLevel != null ? screeningLevel : 0);

            dl.setCreatedBy("SUPER BOSS");

            java.sql.Timestamp createdDate = getTimestampSafe(rs, "CREATE_DT", "create_dt", "CREATED_DATE",
                    "created_date");
            dl.setCreatedDate(createdDate != null ? createdDate : new java.util.Date());

            java.sql.Timestamp updatedDate = getTimestampSafe(rs, "LST_UPDT_TS", "lst_updt_ts", "UPDATED_DATE",
                    "updated_date");
            dl.setUpdatedDate(updatedDate);
            dl.setUpdatedBy("SUPER BOSS");

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return dl;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped by user. Migrated 0 designation level records.";
        }

        int migratedCount = 0;
        if (!migratedList.isEmpty()) {
            List<DesignationLevel> existingAll = designationLevelRepository.findAll();
            for (DesignationLevel dl : migratedList) {
                if (dl.getLevel() != null && !dl.getLevel().isEmpty()) {
                    DesignationLevel existing = existingAll.stream()
                            .filter(e -> e.getLevel().equalsIgnoreCase(dl.getLevel())).findFirst().orElse(null);
                    if (existing != null) {
                        dl.setRowId(existing.getRowId());
                    }
                    designationLevelRepository.save(dl);
                    migratedCount++;
                }
            }
        }

        return "Successfully migrated " + migratedCount
                + " designation level records from HRMS_DESIG_LEVEL_MASTER to HR_DESIGNATION_LEVEL.";
    }

    public byte[] generateDesignationLevelSampleExcel() {
        try (Workbook workbook = new XSSFWorkbook()) {
            // Sheet 1: Instructions
            Sheet instructionSheet = workbook.createSheet("Instructions");
            Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("Designation Level Migration Instructions");

            Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            Row instRow2 = instructionSheet.createRow(2);
            instRow2.createCell(0).setCellValue("2. 'Level Name' is mandatory and should be unique.");
            Row instRow3 = instructionSheet.createRow(3);
            instRow3.createCell(0).setCellValue("3. 'Status' has a dropdown. Please select Active or Inactive.");

            instructionSheet.autoSizeColumn(0);

            // Sheet 2: Migration Record
            Sheet sheet = workbook.createSheet("Migration Record");

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row headerRow = sheet.createRow(0);
            Cell h1 = headerRow.createCell(0);
            h1.setCellValue("Level Name");
            h1.setCellStyle(headerStyle);

            Cell h2 = headerRow.createCell(1);
            h2.setCellValue("Basic");
            h2.setCellStyle(headerStyle);

            Cell h3 = headerRow.createCell(2);
            h3.setCellValue("DA");
            h3.setCellStyle(headerStyle);

            Cell h4 = headerRow.createCell(3);
            h4.setCellValue("HRA");
            h4.setCellStyle(headerStyle);

            Cell h5 = headerRow.createCell(4);
            h5.setCellValue("Screening Level");
            h5.setCellStyle(headerStyle);

            Cell h6 = headerRow.createCell(5);
            h6.setCellValue("Status");
            h6.setCellStyle(headerStyle);

            Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("L1");
            sampleRow.createCell(1).setCellValue(50000);
            sampleRow.createCell(2).setCellValue(10000);
            sampleRow.createCell(3).setCellValue(5000);
            sampleRow.createCell(4).setCellValue(1);
            sampleRow.createCell(5).setCellValue("ACTIVE");

            for (int i = 0; i < 6; i++) {
                sheet.autoSizeColumn(i);
            }

            DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            DataValidationConstraint constraint = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            CellRangeAddressList addressList = new CellRangeAddressList(1, 1000, 5, 5);
            DataValidation validation = validationHelper.createValidation(constraint, addressList);
            sheet.addValidationData(validation);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Designation Level sample Excel: " + e.getMessage());
        }
    }

    @Transactional
    public java.util.Map<String, Object> migrateDesignationLevelsFromExcel(MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(1); // Read from Migration Record sheet

            Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null
                    || headerRow.getCell(0).getCellType() != CellType.STRING
                    || !"Level Name".equalsIgnoreCase(headerRow.getCell(0).getStringCellValue().trim())) {
                throw new IllegalArgumentException(
                        "Invalid Excel template uploaded. Expected 'Level Name' column. Please download the correct Designation Level template.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            List<DesignationLevel> existingAll = designationLevelRepository.findAll();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                Cell nameCell = row.getCell(0);
                if (nameCell == null || nameCell.getCellType() == CellType.BLANK)
                    continue;
                String levelName = nameCell.getCellType() == CellType.STRING ? nameCell.getStringCellValue().trim()
                        : String.valueOf((int) nameCell.getNumericCellValue());

                double basic = 0;
                Cell basicCell = row.getCell(1);
                if (basicCell != null && basicCell.getCellType() == CellType.NUMERIC) {
                    basic = basicCell.getNumericCellValue();
                }

                double da = 0;
                Cell daCell = row.getCell(2);
                if (daCell != null && daCell.getCellType() == CellType.NUMERIC) {
                    da = daCell.getNumericCellValue();
                }

                double hra = 0;
                Cell hraCell = row.getCell(3);
                if (hraCell != null && hraCell.getCellType() == CellType.NUMERIC) {
                    hra = hraCell.getNumericCellValue();
                }

                int screeningLevel = 0;
                Cell screeningCell = row.getCell(4);
                if (screeningCell != null && screeningCell.getCellType() == CellType.NUMERIC) {
                    screeningLevel = (int) screeningCell.getNumericCellValue();
                }

                String status = "ACTIVE";
                Cell statusCell = row.getCell(5);
                if (statusCell != null && statusCell.getCellType() == CellType.STRING) {
                    status = statusCell.getStringCellValue().trim();
                }

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("levelName", levelName);
                rowDetail.put("basic", String.valueOf(basic));
                rowDetail.put("da", String.valueOf(da));
                rowDetail.put("hra", String.valueOf(hra));
                rowDetail.put("screeningLevel", String.valueOf(screeningLevel));
                rowDetail.put("status", status);

                boolean exists = existingAll.stream()
                        .anyMatch(d -> d.getLevel() != null && d.getLevel().equalsIgnoreCase(levelName));

                if (exists) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", "Level Name already exists");
                    failedCount++;
                } else {
                    DesignationLevel dl = new DesignationLevel();
                    dl.setLevel(levelName);
                    dl.setBasic(basic);
                    dl.setDa(da);
                    dl.setHra(hra);
                    dl.setScreeningLevel(screeningLevel);
                    dl.setIsActive("ACTIVE".equalsIgnoreCase(status));

                    designationLevelRepository.save(dl);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message",
                    "Successfully migrated " + migratedCount + " designation level records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    @Transactional
    public String clearDesignationLevels() {
        designationLevelRepository.deleteAllInBatch();
        return "Cleared all designation level records.";
    }

    @Transactional
    public String migrateGrades() {
        if (jdbcTemplate == null)
            return "Migration database not configured.";
        String sql = "SELECT * FROM HRMS_GRADE_MASTER";

        List<Gradedetails> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            Gradedetails grade = new Gradedetails();

            grade.setGradeCode(getStringSafe(rs, "GRADE_CODE", "grade_code"));
            grade.setGradeName(getStringSafe(rs, "GRADE_NAME", "grade_name"));

            String seqNo = getStringSafe(rs, "SEQ_NO", "seq_no");
            if (seqNo == null) {
                Integer seqNoInt = getIntSafe(rs, "SEQ_NO", "seq_no");
                if (seqNoInt != null) {
                    seqNo = String.valueOf(seqNoInt);
                }
            }
            grade.setSequenceNo(seqNo);

            grade.setStatus("Active");
            grade.setCreatedBy("SUPER BOSS");

            java.sql.Timestamp createdDate = getTimestampSafe(rs, "CREAT_DT", "creat_dt", "CREATED_DATE",
                    "created_date");
            grade.setCreatedDate(createdDate != null ? createdDate : new java.util.Date());

            java.sql.Timestamp updatedDate = getTimestampSafe(rs, "LST_UPDT_TS", "lst_updt_ts", "UPDATED_DATE",
                    "updated_date");
            grade.setUpdatedDate(updatedDate);
            grade.setUpdatedBy("SUPER BOSS");

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return grade;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped by user. Migrated 0 grade records.";
        }

        int migratedCount = 0;
        if (!migratedList.isEmpty()) {
            List<Gradedetails> existingAll = empGradeRepository.findAll();
            for (Gradedetails g : migratedList) {
                if (g.getGradeCode() != null && !g.getGradeCode().isEmpty()) {
                    boolean exists = existingAll.stream()
                            .anyMatch(e -> e.getGradeCode() != null
                                    && e.getGradeCode().equalsIgnoreCase(g.getGradeCode()));

                    if (!exists) {
                        empGradeRepository.save(g);
                        migratedCount++;
                    }
                }
            }
        }

        return "Successfully migrated " + migratedCount + " grade records from HRMS_GRADE_MASTER to HR_GRADE_DETAIL.";
    }

    public byte[] generateGradeSampleExcel() {
        try (Workbook workbook = new XSSFWorkbook()) {
            // Sheet 1: Instructions
            Sheet instructionSheet = workbook.createSheet("Instructions");
            Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("Grade Migration Instructions");

            Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            Row instRow2 = instructionSheet.createRow(2);
            instRow2.createCell(0).setCellValue("2. 'Grade Code' is mandatory and should be unique.");
            Row instRow3 = instructionSheet.createRow(3);
            instRow3.createCell(0).setCellValue("3. 'Status' has a dropdown. Please select Active or Inactive.");

            instructionSheet.autoSizeColumn(0);

            // Sheet 2: Migration Record
            Sheet sheet = workbook.createSheet("Migration Record");

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row headerRow = sheet.createRow(0);
            Cell h1 = headerRow.createCell(0);
            h1.setCellValue("Grade Code");
            h1.setCellStyle(headerStyle);

            Cell h2 = headerRow.createCell(1);
            h2.setCellValue("Grade Name");
            h2.setCellStyle(headerStyle);

            Cell h3 = headerRow.createCell(2);
            h3.setCellValue("Sequence No");
            h3.setCellStyle(headerStyle);

            Cell h4 = headerRow.createCell(3);
            h4.setCellValue("Status");
            h4.setCellStyle(headerStyle);

            Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("G1");
            sampleRow.createCell(1).setCellValue("Grade 1");
            sampleRow.createCell(2).setCellValue("1");
            sampleRow.createCell(3).setCellValue("Active");

            for (int i = 0; i < 4; i++) {
                sheet.autoSizeColumn(i);
            }

            DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            DataValidationConstraint constraint = validationHelper
                    .createExplicitListConstraint(new String[] { "Active", "Inactive" });
            CellRangeAddressList addressList = new CellRangeAddressList(1, 1000, 3, 3);
            DataValidation validation = validationHelper.createValidation(constraint, addressList);
            sheet.addValidationData(validation);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Grade sample Excel: " + e.getMessage());
        }
    }

    @Transactional
    public java.util.Map<String, Object> migrateGradesFromExcel(MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(1); // Read from Migration Record sheet

            Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(0) == null
                    || headerRow.getCell(0).getCellType() != CellType.STRING
                    || !"Grade Code".equalsIgnoreCase(headerRow.getCell(0).getStringCellValue().trim())) {
                throw new IllegalArgumentException(
                        "Invalid Excel template uploaded. Expected 'Grade Code' column. Please download the correct Grade template.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            List<Gradedetails> existingAll = empGradeRepository.findAll();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                Cell codeCell = row.getCell(0);
                if (codeCell == null || codeCell.getCellType() == CellType.BLANK)
                    continue;
                String gradeCode = codeCell.getCellType() == CellType.STRING ? codeCell.getStringCellValue().trim()
                        : String.valueOf((int) codeCell.getNumericCellValue());

                String gradeName = "";
                Cell nameCell = row.getCell(1);
                if (nameCell != null && nameCell.getCellType() == CellType.STRING) {
                    gradeName = nameCell.getStringCellValue().trim();
                }

                String seqNo = "";
                Cell seqCell = row.getCell(2);
                if (seqCell != null) {
                    if (seqCell.getCellType() == CellType.STRING) {
                        seqNo = seqCell.getStringCellValue().trim();
                    } else if (seqCell.getCellType() == CellType.NUMERIC) {
                        seqNo = String.valueOf((int) seqCell.getNumericCellValue());
                    }
                }

                String status = "Active";
                Cell statusCell = row.getCell(3);
                if (statusCell != null && statusCell.getCellType() == CellType.STRING) {
                    status = statusCell.getStringCellValue().trim();
                }

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("gradeCode", gradeCode);
                rowDetail.put("gradeName", gradeName);
                rowDetail.put("seqNo", seqNo);
                rowDetail.put("status", status);

                boolean exists = existingAll.stream()
                        .anyMatch(d -> d.getGradeCode() != null && d.getGradeCode().equalsIgnoreCase(gradeCode));

                if (exists) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", "Grade Code already exists");
                    failedCount++;
                } else {
                    Gradedetails g = new Gradedetails();
                    g.setGradeCode(gradeCode);
                    g.setGradeName(gradeName);
                    g.setSequenceNo(seqNo);
                    g.setStatus(status);

                    empGradeRepository.save(g);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " grade records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    @Transactional
    public String clearGrades() {
        empGradeRepository.deleteAllInBatch();
        return "Cleared all grade records.";
    }

    @Transactional
    public String migrateDesignations() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }

        String sql = "SELECT * FROM HRMS_DESIG_MASTER";

        List<Designation> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            Designation desig = new Designation();

            // Map legacy columns safely
            desig.setDesignationCode(getStringSafe(rs, "DESIG_CODE", "DESIGNATION_CODE", "desig_code", "CODE"));
            desig.setDesignationName(getStringSafe(rs, "DESIG_NAME", "DESIGNATION_NAME", "desig_name", "DESIGNATION",
                    "DESIG_DESC", "NAME"));
            desig.setSubCategoryLevel(getStringSafe(rs, "SUB_CATEGORY_LEVEL", "sub_category_level"));
            desig.setExperience(getStringSafe(rs, "EXPERIENCE", "experience"));
            desig.setAppearInCompetency(getStringSafe(rs, "APPEAR_IN_COMPETENCY", "appear_in_competency"));
            desig.setDisplaySlNo(getIntSafe(rs, "DISPLAY_SL_NO", "display_sl_no"));
            desig.setQualification(getStringSafe(rs, "QUALIFICATION", "qualification"));
            desig.setJobDescription(getStringSafe(rs, "JOB_DESCRIPTION", "job_description"));
            desig.setOrgSeqNo(getIntSafe(rs, "ORG_SEQUENCE_NO", "org_sequence_no", "ORG_SEQ_NO"));
            desig.setBudgetedPositions(getIntSafe(rs, "BUDGETED_POSITIONS", "budgeted_positions"));

            String status = getStringSafe(rs, "STATUS", "status");
            desig.setIsActive(status != null ? "ACTIVE".equalsIgnoreCase(status) : true);

            desig.setCreatedBy("SUPER BOSS");

            java.sql.Timestamp createdDate = getTimestampSafe(rs, "CREATED_DATE", "CREATED_AT", "created_date",
                    "created_at");
            desig.setCreatedDate(createdDate != null ? createdDate : new java.util.Date());

            desig.setUpdatedBy("SUPER BOSS");
            desig.setUpdatedDate(getTimestampSafe(rs, "UPDATED_DATE", "UPDATED_AT", "updated_date", "updated_at"));

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return desig;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped by user. Migrated 0 designation records.";
        }

        int migratedCount = 0;
        if (!migratedList.isEmpty()) {
            List<Designation> existingAll = designationRepository.findAll();
            for (Designation desig : migratedList) {
                if (desig.getDesignationName() != null && !desig.getDesignationName().isEmpty()) {
                    boolean exists = existingAll.stream()
                            .anyMatch(e -> e.getDesignationName().equalsIgnoreCase(desig.getDesignationName()));

                    if (!exists) {
                        designationRepository.save(desig);
                        migratedCount++;
                    }
                }
            }
        }

        return "Successfully migrated " + migratedCount
                + " designation records from HRMS_DESIG_MASTER to HR_DESIGNATION.";
    }

    public String migrateEmployeeMaster(org.springframework.jdbc.core.JdbcTemplate migrationTemplate) {
        org.springframework.jdbc.core.JdbcTemplate jdbcTemplate = migrationTemplate != null ? migrationTemplate
                : this.jdbcTemplate;
        String currentUser = "SUPER BOSS";
        final String finalUserId = currentUser;
        codeToNewEmpIdMap = null;
        oldToNewEmpIdMap = null;
        initCodeToNewEmpIdMap();
        initOldToNewEmpIdMap();
        if (jdbcTemplate == null)
            return "Database not configured.";

        MasterChecklistMigrationService.resetStop();

        java.util.function.BiFunction<String, Integer, String> trunc = (val,
                len) -> (val != null && val.length() > len) ? val.substring(0, len) : val;

        // Setup lookup maps for master entities
        java.util.Map<Long, Long> deptMap = new java.util.HashMap<>();
        try {
            java.util.List<com.autonoma.erp.modules.hr.orgstructure.entity.Department> allDepts = departmentRepository
                    .findAll();
            jdbcTemplate.query("SELECT DEPT_NO, DEPT_NAME FROM DEPT", (rs) -> {
                long legacyId = rs.getLong("DEPT_NO");
                String name = rs.getString("DEPT_NAME");
                if (name != null) {
                    allDepts.stream()
                            .filter(d -> name.trim().equalsIgnoreCase(d.getDepartmentName()))
                            .findFirst()
                            .ifPresent(d -> deptMap.put(legacyId, d.getId()));
                }
            });
        } catch (Exception e) {
        }

        java.util.Map<Long, Long> desigMap = new java.util.HashMap<>();
        try {
            java.util.List<Designation> allDesigs = designationRepository.findAll();
            jdbcTemplate.query("SELECT * FROM HRMS_DESIG_MASTER", (rs) -> {
                long legacyId = getLongSafe(rs, "DESIG_CODE", "desigCode");
                String name = getStringSafe(rs, "DESIG_NAME", "DESIGNATION_NAME", "desig_name", "DESIGNATION",
                        "DESIG_DESC", "NAME");
                if (name != null) {
                    allDesigs.stream()
                            .filter(d -> d.getDesignationName() != null
                                    && name.trim().equalsIgnoreCase(d.getDesignationName().trim()))
                            .findFirst()
                            .ifPresent(d -> desigMap.put(legacyId, d.getId()));
                }
            });
        } catch (Exception e) {
        }

        java.util.Map<String, Long> levelMap = new java.util.HashMap<>();
        try {
            java.util.List<String> requiredLevels = java.util.Arrays.asList("L1", "L2", "L3", "L4", "L5", "L6", "L7");
            java.util.List<DesignationLevel> allLevels = designationLevelRepository.findAll();
            java.util.Set<String> existingNames = allLevels.stream()
                    .map(l -> l.getLevel() != null ? l.getLevel().trim().toLowerCase() : "")
                    .collect(java.util.stream.Collectors.toSet());
            for (String lvl : requiredLevels) {
                if (!existingNames.contains(lvl.toLowerCase())) {
                    try {
                        DesignationLevel newLvl = new DesignationLevel();
                        newLvl.setLevel(lvl);
                        newLvl.setCreatedBy("SUPER BOSS");
                        designationLevelRepository.saveAndFlush(newLvl);
                        allLevels.add(newLvl);
                    } catch (Exception ignored) {
                    }
                }
            }
            allLevels = designationLevelRepository.findAll();
            allLevels.forEach(l -> {
                if (l.getLevel() != null) {
                    levelMap.put(l.getLevel().trim().toLowerCase(), l.getRowId());
                }
            });
        } catch (Exception e) {
            System.err.println("[MIGRATION WARNING] Failed to load/seed HR_DESIGNATION_LEVEL: " + e.getMessage());
        }

        java.util.Map<String, Long> categoryMap = new java.util.HashMap<>();
        try {
            java.util.List<String> requiredCategories = java.util.Arrays.asList(
                    "Employee", "Contractor", "Consultant", "General");
            java.util.List<com.autonoma.erp.modules.hr.common.entity.CategoryMaster> allCats = categoryMasterRepository
                    .findAll();
            java.util.Set<String> existingNames = allCats.stream()
                    .map(c -> c.getCategoryName() != null ? c.getCategoryName().trim().toLowerCase() : "")
                    .collect(java.util.stream.Collectors.toSet());
            for (String catName : requiredCategories) {
                if (!existingNames.contains(catName.toLowerCase())) {
                    try {
                        com.autonoma.erp.modules.hr.common.entity.CategoryMaster newCat = new com.autonoma.erp.modules.hr.common.entity.CategoryMaster(
                                catName);
                        categoryMasterRepository.saveAndFlush(newCat);
                        allCats.add(newCat);
                    } catch (Exception ignored) {
                    }
                }
            }
            allCats = categoryMasterRepository.findAll();
            allCats.forEach(c -> {
                if (c.getCategoryName() != null)
                    categoryMap.put(c.getCategoryName().trim().toLowerCase(), c.getId());
            });
        } catch (Exception e) {
            System.err.println("[MIGRATION WARNING] Failed to load/seed HR_CATEGORY_MASTER: " + e.getMessage());
        }

        java.util.Map<String, Long> typeMap = new java.util.HashMap<>();
        try {
            java.util.List<String> requiredTypes = java.util.Arrays.asList(
                    "Contractor", "Permanent", "Production Staff", "Temporary");
            java.util.List<EmployeeTypeMaster> allTypes = employeeTypeMasterRepository.findAll();
            java.util.Set<String> existingNames = allTypes.stream()
                    .map(t -> t.getTypeName() != null ? t.getTypeName().trim().toLowerCase() : "")
                    .collect(java.util.stream.Collectors.toSet());
            for (String typeName : requiredTypes) {
                if (!existingNames.contains(typeName.toLowerCase())) {
                    try {
                        EmployeeTypeMaster newType = new EmployeeTypeMaster(typeName);
                        employeeTypeMasterRepository.saveAndFlush(newType);
                        allTypes.add(newType);
                    } catch (Exception ignored) {
                    }
                }
            }
            allTypes = employeeTypeMasterRepository.findAll();
            allTypes.forEach(t -> {
                if (t.getTypeName() != null) {
                    typeMap.put(t.getTypeName().trim().toLowerCase(), t.getId());
                }
            });
        } catch (Exception e) {
            System.err.println("[MIGRATION WARNING] Failed to load/seed HR_EMPLOYEE_TYPE: " + e.getMessage());
        }

        java.util.Map<String, String> gradeCodeToNameMap = new java.util.HashMap<>();
        try {
            jdbcTemplate.query("SELECT GRADE_CODE, GRADE_NAME FROM HRMS_GRADE_MASTER", (rs) -> {
                String code = rs.getString("GRADE_CODE");
                String name = rs.getString("GRADE_NAME");
                if (code != null && name != null) {
                    gradeCodeToNameMap.put(code.trim().toUpperCase(), name.trim());
                }
            });
        } catch (Exception e) {
            System.err.println("[MIGRATION WARNING] Failed to query HRMS_GRADE_MASTER: " + e.getMessage());
        }

        java.util.Map<Long, String> signatureMap = new java.util.HashMap<>();
        java.util.Map<Long, String> fitnessMap = new java.util.HashMap<>();
        java.util.Map<Long, String> ndaMap = new java.util.HashMap<>();
        try {
            jdbcTemplate.query(
                    "SELECT REF_ROW_ID, FROM_WHERE, FILE_NAME FROM FILE_UPLOAD_TRANS WHERE FROM_WHERE IN ('HRMS SIGN', 'EMPLOYEE FITNESS CERTIFICATE', 'EMPLOYEE_MASTER')",
                    (rs) -> {
                        Long empCd = rs.getLong("REF_ROW_ID");
                        String fromWhere = rs.getString("FROM_WHERE");
                        String fileName = rs.getString("FILE_NAME");
                        if (fileName != null && !fileName.trim().isEmpty()) {
                            if ("HRMS SIGN".equals(fromWhere)) {
                                signatureMap.put(empCd, fileName);
                            } else if ("EMPLOYEE FITNESS CERTIFICATE".equals(fromWhere)) {
                                fitnessMap.put(empCd, fileName);
                            } else if ("EMPLOYEE_MASTER".equals(fromWhere) && fileName.toLowerCase().contains("nda")) {
                                ndaMap.put(empCd, fileName);
                            }
                        }
                    });
        } catch (Exception e) {
            System.err.println("[MIGRATION WARNING] Failed to query FILE_UPLOAD_TRANS: " + e.getMessage());
        }

        List<java.util.Map<String, Object>> secondaryEmployees = jdbcTemplate.queryForList("SELECT * FROM EMPLOYEE");
        java.util.Map<Long, java.util.Map<String, Object>> secondaryEmployeeById = new java.util.HashMap<>();
        for (java.util.Map<String, Object> empRow : secondaryEmployees) {
            Number idNum = (Number) empRow.get("EMP_CD");
            if (idNum == null)
                idNum = (Number) empRow.get("ID");
            if (idNum == null)
                idNum = (Number) empRow.get("EMP_ID");
            if (idNum != null) {
                secondaryEmployeeById.put(idNum.longValue(), empRow);
            }
        }

        int successCount = 0;
        int failCount = 0;
        java.util.Set<String> processingCodes = new java.util.HashSet<>();

        MigrationProgressTracker.start("employeeMaster", secondaryEmployees.size());

        for (java.util.Map<String, Object> empRow : secondaryEmployees) {
            if (MasterChecklistMigrationService.stopFlag.get()) {
                break;
            }
            try {
                Long newId = migrateEmployeeRow(empRow, secondaryEmployeeById, processingCodes, deptMap, desigMap,
                        levelMap, categoryMap, typeMap, signatureMap, fitnessMap, ndaMap, gradeCodeToNameMap);
                if (newId != null) {
                    successCount++;
                }
            } catch (Exception e) {
                failCount++;
            }

            // Update progress tracker
            MigrationProgressTracker.update("employeeMaster", successCount);
        }

        // Re-initialize code/ID lookup maps
        codeToNewEmpIdMap = null;
        oldToNewEmpIdMap = null;
        initCodeToNewEmpIdMap();
        initOldToNewEmpIdMap();

        // --- Migrate EMP_ABILITY_MASTER ---
        try {
            java.util.function.Function<String, String> mapYesNo = (val) -> {
                if (val == null)
                    return "NO";
                String lower = val.trim().toLowerCase();
                if (lower.equals("yes") || lower.equals("y") || lower.equals("1") || lower.equals("true"))
                    return "YES";
                return "NO";
            };

            jdbcTemplate.<Object>query("SELECT * FROM EMP_ABILITY_MASTER", (rs, rowNum) -> {
                String oldEmpCd = getStringSafe(rs, "EMP_ID", "empId");
                com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp = null;
                if (oldEmpCd != null && !oldEmpCd.trim().isEmpty()) {
                    oldEmpCd = oldEmpCd.trim();
                    emp = employeeMasterRepository.findByEmpCodeIgnoreCase(oldEmpCd).orElse(null);
                    if (emp == null) {
                        initOldNumericToAlphaMap();
                        String alphaCode = oldNumericToAlphaMap.get(oldEmpCd);
                        if (alphaCode != null) {
                            emp = employeeMasterRepository.findByEmpCodeIgnoreCase(alphaCode).orElse(null);
                        }
                    }
                }

                if (emp != null) {
                    String isAuditorVal = mapYesNo.apply(getStringSafe(rs, "AUDITOR", "IS_AUDITOR"));
                    emp.setIsAuditor(isAuditorVal);
                    emp.setAuditorType(trunc.apply(getStringSafe(rs, "AUDITOR_TYPE"), 50));
                    String isAuditeeVal = mapYesNo.apply(getStringSafe(rs, "AUDITEE", "IS_AUDITEE"));
                    emp.setIsAuditee(isAuditeeVal);
                    emp.setAuditeeType(trunc.apply(getStringSafe(rs, "AUDITEE_TYPE"), 50));
                    String isNcrApproverVal = mapYesNo.apply(getStringSafe(rs, "NCR_APPROVED_BY", "IS_NCR_APPROVER"));
                    emp.setIsNcrApprover(isNcrApproverVal);
                    emp.setNcrApproverType(trunc.apply(getStringSafe(rs, "NCR_TYPE", "NCR_APPROVER_TYPE"), 50));
                    emp.setIsChaired(mapYesNo.apply(getStringSafe(rs, "CHAIRED", "IS_CHAIRED")));
                    emp.setChairedType(trunc.apply(getStringSafe(rs, "CHAIRED_TYPE"), 50));
                    emp.setIsHost(mapYesNo.apply(getStringSafe(rs, "HOST", "IS_HOST")));
                    emp.setHostType(trunc.apply(getStringSafe(rs, "HOST_TYPE"), 50));
                    emp.setIsParticipants(mapYesNo.apply(getStringSafe(rs, "PARTICIPANTS", "IS_PARTICIPANTS")));
                    emp.setParticipantsType(trunc.apply(getStringSafe(rs, "PARTICIPANTS_TYPE"), 50));
                    String isFirstAidVal = mapYesNo.apply(getStringSafe(rs, "FIRST_AID", "IS_FIRST_AID"));
                    emp.setIsFirstAid(isFirstAidVal);
                    String isFireFighterVal = mapYesNo.apply(getStringSafe(rs, "FIRE_FIGHTER", "IS_FIRE_FIGHTER"));
                    emp.setIsFireFighter(isFireFighterVal);
                    String isTwoWheelerVal = mapYesNo.apply(getStringSafe(rs, "TWO_WHEEL_DRIVING", "IS_TWO_WHEELER"));
                    emp.setIsTwoWheeler(isTwoWheelerVal);
                    String isFourWheelerVal = mapYesNo
                            .apply(getStringSafe(rs, "FOUR_WHEEL_DRIVING", "IS_FOUR_WHEELER"));
                    emp.setIsFourWheeler(isFourWheelerVal);
                    emp.setIsInterviewer(mapYesNo.apply(getStringSafe(rs, "INTERVIEWER", "IS_INTERVIEWER")));
                    emp.setIsEnquiryAssignee(
                            mapYesNo.apply(getStringSafe(rs, "ENQUIRY_ASSIGN", "IS_ENQUIRY_ASSIGNEE")));
                    emp.setIsPrAssignee(mapYesNo.apply(getStringSafe(rs, "PR_ASSIGN", "IS_PR_ASSIGNEE")));

                    if (oldEmpCd != null && !oldEmpCd.trim().isEmpty()) {
                        oldEmpCd = oldEmpCd.trim();
                        try {
                            String secondaryImgLoc = getSecondaryProcessImgLocation();
                            java.io.File hrmsFolder = new java.io.File(secondaryImgLoc, "HRMS");
                            if (hrmsFolder.exists() && hrmsFolder.isDirectory()) {
                                final String prefix = oldEmpCd + "_";
                                java.io.File[] matchingFiles = hrmsFolder
                                        .listFiles((dir, name) -> name.startsWith(prefix));
                                if (matchingFiles != null && matchingFiles.length > 0) {
                                    java.util.List<String> migratedPaths = new java.util.ArrayList<>();
                                    for (java.io.File file : matchingFiles) {
                                        String newPath = migrateEmployeeFile(file.getName(), "HRMS",
                                                "MASTER/HR/Employee/Employee Master/Ability");
                                        if (newPath != null) {
                                            migratedPaths.add(newPath);
                                        }
                                    }
                                    if (!migratedPaths.isEmpty()) {
                                        if ("YES".equals(isAuditorVal)) {
                                            emp.setAuditorFileList(migratedPaths);
                                        }
                                        if ("YES".equals(isAuditeeVal)) {
                                            emp.setAuditeeFileList(migratedPaths);
                                        }
                                        if ("YES".equals(isNcrApproverVal)) {
                                            emp.setNcrApproverFileList(migratedPaths);
                                        }
                                        String safetyPaths = String.join(",", migratedPaths);
                                        if ("YES".equals(isFirstAidVal)) {
                                            emp.setFirstAidFileInfo(safetyPaths);
                                        }
                                        if ("YES".equals(isFireFighterVal)) {
                                            emp.setFireFighterFileInfo(safetyPaths);
                                        }
                                        if ("YES".equals(isTwoWheelerVal)) {
                                            emp.setTwoWheelerFileInfo(safetyPaths);
                                        }
                                        if ("YES".equals(isFourWheelerVal)) {
                                            emp.setFourWheelerFileInfo(safetyPaths);
                                        }
                                    }
                                }
                            }
                        } catch (Exception fileEx) {
                            System.err.println("Error scanning/migrating files: " + fileEx.getMessage());
                        }
                    }

                    if (oldEmpCd != null && !oldEmpCd.trim().isEmpty()) {
                        try {
                            Integer numericEmpCd = null;
                            try {
                                numericEmpCd = Integer.parseInt(oldEmpCd.trim());
                            } catch (NumberFormatException nfe) {
                            }

                            if (numericEmpCd != null) {
                                String actSql = "SELECT ACTIVITY_DETAILS, FILE_NAME FROM HRMS_ADDITIONAL_ACTIVITIES WHERE EMPLOYEE_CODE = ?";
                                List<java.util.Map<String, Object>> activities = jdbcTemplate.queryForList(actSql,
                                        numericEmpCd);
                                for (java.util.Map<String, Object> act : activities) {
                                    String details = (String) act.get("ACTIVITY_DETAILS");
                                    String fileName = (String) act.get("FILE_NAME");
                                    if (fileName != null && !fileName.trim().isEmpty()) {
                                        fileName = fileName.trim();
                                        String newPath = migrateEmployeeFile(fileName, "EMP ACTIVITY",
                                                "MASTER/HR/Employee/Employee Master/Ability");
                                        if (newPath != null) {
                                            String detailsUpper = details != null ? details.toUpperCase() : "";
                                            if (detailsUpper.contains("AUDIT") || detailsUpper.contains("IATF")
                                                    || detailsUpper.contains("ISO 9001")) {
                                                java.util.List<String> list = new java.util.ArrayList<>(
                                                        emp.getAbility().getAuditorFileList());
                                                if (!list.contains(newPath)) {
                                                    list.add(newPath);
                                                    emp.setAuditorFileList(list);
                                                }
                                            } else if (detailsUpper.contains("FIRE")
                                                    || detailsUpper.contains("FIGHTER")) {
                                                String current = emp.getAbility().getFireFighterFileInfo();
                                                emp.setFireFighterFileInfo(appendSafetyFileInfo(current, newPath));
                                            } else if (detailsUpper.contains("FIRST AID")
                                                    || detailsUpper.contains("FIRST_AID")
                                                    || detailsUpper.contains("FIRSTAID")) {
                                                String current = emp.getAbility().getFirstAidFileInfo();
                                                emp.setFirstAidFileInfo(appendSafetyFileInfo(current, newPath));
                                            } else if (detailsUpper.contains("TWO WHEEL")
                                                    || detailsUpper.contains("TWO_WHEEL")
                                                    || detailsUpper.contains("TWO-WHEEL")) {
                                                String current = emp.getAbility().getTwoWheelerFileInfo();
                                                emp.setTwoWheelerFileInfo(appendSafetyFileInfo(current, newPath));
                                            } else if (detailsUpper.contains("FOUR WHEEL")
                                                    || detailsUpper.contains("FOUR_WHEEL")
                                                    || detailsUpper.contains("FOUR-WHEEL")) {
                                                String current = emp.getAbility().getFourWheelerFileInfo();
                                                emp.setFourWheelerFileInfo(appendSafetyFileInfo(current, newPath));
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (Exception actEx) {
                            System.err.println("Error migrating ADDITIONAL_ACTIVITIES: " + actEx.getMessage());
                        }
                    }

                    employeeMasterRepository.save(emp);
                }
                return null;
            });
        } catch (Exception e) {
            System.err.println("Error migrating EMP_ABILITY_MASTER: " + e.getMessage());
        }

        // --- Migrate INTERVIEW_SELF_ASSESMENT ---
        try {
            jdbcTemplate.query("SELECT * FROM INTERVIEW_SELF_ASSESMENT", (rs, rowNum) -> {
                Long empId = null;
                try {
                    empId = resolveEmployeeId(rs);
                } catch (Exception ex) {
                }
                if (empId == null) {
                    try {
                        empId = getMappedEmployeeId(getLongSafe(rs, "APPLICANT_ID"));
                    } catch (Exception ex) {
                    }
                }
                if (empId != null) {
                    com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp = employeeMasterRepository
                            .findById(empId).orElse(null);
                    if (emp != null) {
                        emp.setQ1_native(trunc.apply(getStringSafe(rs, "NATIVE_ADD", "Q1_NATIVE"), 255));
                        emp.setQ2_presentAddress(
                                trunc.apply(getStringSafe(rs, "PRESENT_ADDRESS", "Q2_PRESENT_ADDRESS"), 255));
                        emp.setQ3_permanentAddress(
                                trunc.apply(getStringSafe(rs, "PERMANENT_ADDRESS", "Q3_PERMANENT_ADDRESS"), 255));
                        emp.setQ4_fatherOccupation(
                                trunc.apply(getStringSafe(rs, "FATHER_OCCUPATION", "Q4_FATHER_OCCUPATION"), 255));
                        emp.setQ5_motherOccupation(
                                trunc.apply(getStringSafe(rs, "MOTHER_OCCUPATION", "Q5_MOTHER_OCCUPATION"), 255));
                        emp.setQ6_maritalStatus(
                                trunc.apply(getStringSafe(rs, "MARITAL_STATUS", "Q6_MARITAL_STATUS"), 50));
                        emp.setQ7_spouseOccupation(trunc
                                .apply(getStringSafe(rs, "OCCUPATION_OF_YOUR_SPOUSE", "Q7_SPOUSE_OCCUPATION"), 255));
                        emp.setQ8_children(trunc.apply(getStringSafe(rs, "CHILDREN", "Q8_CHILDREN"), 255));
                        emp.setQ9_hasRelativesInCompany(trunc.apply(
                                getStringSafe(rs, "ANY_OF_RELATIVE_WORKING_IN_THIS_COMPANY", "Q9_HAS_RELATIVES"), 10));
                        emp.setQ10_relativesDetails(
                                trunc.apply(getStringSafe(rs, "RELATIVES_DETAILS", "Q10_RELATIVES_DETAILS"), 255));
                        emp.setQ11_siblingsOccupations(trunc
                                .apply(getStringSafe(rs, "SIBILINGS_OCCUPATION", "Q11_SIBLINGS_OCCUPATIONS"), 255));
                        emp.setQ12_hasTwoWheeler(
                                trunc.apply(getStringSafe(rs, "DO_YOU_HAVE_TWO_WHEELER", "Q12_HAS_TWO_WHEELER"), 10));
                        emp.setQ13_hasAndroidPhone(trunc
                                .apply(getStringSafe(rs, "DO_YOU_HAVE_ANDROID_PHONE", "Q13_HAS_ANDROID_PHONE"), 10));
                        emp.setQ14_knowsCarDriving(trunc
                                .apply(getStringSafe(rs, "DO_YOU_KNOWN_CAR_DRIVING", "Q14_KNOWS_CAR_DRIVING"), 10));
                        emp.setQ15_willingToTravel(
                                trunc.apply(getStringSafe(rs, "WILLING_TO_TRAVEL", "Q15_WILLING_TO_TRAVEL"), 10));
                        emp.setQ16_covidVaccination(
                                trunc.apply(getStringSafe(rs, "COVID_VACCINATION", "Q16_COVID_VACCINATION"), 10));
                        emp.setQ17_positivePoints(trunc
                                .apply(getStringSafe(rs, "WHAT_ARE_YOUR_POSITIVE_POINTS", "Q17_POSITIVE_POINTS"), 500));
                        emp.setQ18_negativePoints(trunc
                                .apply(getStringSafe(rs, "WHAT_ARE_YOUR_NEGATIVE_POINTS", "Q18_NEGATIVE_POINTS"), 500));
                        emp.setQ19_lifeGoals(trunc
                                .apply(getStringSafe(rs, "WHAT_IS_YOUR_GOAL_IN_YOUR_LIFE", "Q19_LIFE_GOALS"), 500));
                        emp.setQ20_improvementSuggestions(trunc
                                .apply(getStringSafe(rs, "IMPROVEMENTS_EXPECTED", "Q20_IMPROVEMENT_SUGGESTIONS"), 500));
                        emp.setQ21_isExperienced(
                                trunc.apply(getStringSafe(rs, "IS_EXPERIENCED", "Q21_IS_EXPERIENCED"), 10));
                        emp.setQ22_totalExperience(
                                trunc.apply(getStringSafe(rs, "TOTAL_EXPERIENCE", "Q22_TOTAL_EXPERIENCE"), 50));

                        employeeMasterRepository.save(emp);
                    }
                }
                return null;
            });
        } catch (Exception e) {
            System.err.println("Error migrating INTERVIEW_SELF_ASSESMENT: " + e.getMessage());
        }

        return "Successfully migrated " + successCount + " employee records (Failed: " + failCount + ").";
    }

    private Long migrateEmployeeRow(java.util.Map<String, Object> empRow,
            java.util.Map<Long, java.util.Map<String, Object>> secondaryEmployeeById,
            java.util.Set<String> processingCodes,
            java.util.Map<Long, Long> deptMap,
            java.util.Map<Long, Long> desigMap,
            java.util.Map<String, Long> levelMap,
            java.util.Map<String, Long> categoryMap,
            java.util.Map<String, Long> typeMap,
            java.util.Map<Long, String> signatureMap,
            java.util.Map<Long, String> fitnessMap,
            java.util.Map<Long, String> ndaMap,
            java.util.Map<String, String> gradeCodeToNameMap) {

        String oldEmpCd = getStringSafeFromMap(empRow, "OLDEMP_CD", "OLD_EMP_CODE", "oldEmpCode");
        String empCd = getStringSafeFromMap(empRow, "EMP_CD", "EMP_CODE", "EMPLOYEE_CODE", "empCode");
        if (empCd == null && oldEmpCd != null) {
            empCd = oldEmpCd;
        }
        if (empCd == null) {
            return null;
        }

        if (processingCodes.contains(empCd.trim().toUpperCase())) {
            EmployeeMaster existing = null;
            if (oldEmpCd != null && !oldEmpCd.trim().isEmpty()) {
                existing = employeeMasterRepository.findByOldEmpCode(oldEmpCd.trim()).orElse(null);
            }
            if (existing == null) {
                existing = employeeMasterRepository.findByEmpCode(empCd.trim()).orElse(null);
            }
            return existing != null ? existing.getId() : null;
        }
        processingCodes.add(empCd.trim().toUpperCase());

        String oldFirstName = getStringSafeFromMap(empRow, "FIRST_NAME", "firstName", "FIRSTNAME", "EMP_NAME");
        if ("Mangal".contains(oldFirstName != null ? oldFirstName.trim() : "")) {
            return null;
        }

        org.springframework.transaction.TransactionStatus txStatus = transactionManager
                .getTransaction(new org.springframework.transaction.support.DefaultTransactionDefinition());
        long empStartTime = System.currentTimeMillis();
        try {
            boolean isUpdate = false;
            EmployeeMaster employee = null;
            if (empCd != null && !empCd.trim().isEmpty()) {
                employee = employeeMasterRepository.findByEmpCode(empCd.trim()).orElse(null);
            }
            if (employee == null && oldEmpCd != null && !oldEmpCd.trim().isEmpty()) {
                employee = employeeMasterRepository.findByOldEmpCode(oldEmpCd.trim()).orElse(null);
            }
            if (employee == null) {
                employee = new EmployeeMaster();
                employee.setOldEmpCode(oldEmpCd);
                isUpdate = false;
            } else {
                isUpdate = true;
            }

            employee.setEmpCode(empCd);
            employee.setEmployeeName(oldFirstName);
            employee.setFirstName(oldFirstName);
            employee.setLastName(getStringSafeFromMap(empRow, "LAST_NAME", "lastName", "LASTNAME"));
            employee.setFatherHusbandName(getStringSafeFromMap(empRow, "LAST_NAME", "lastName", "LASTNAME"));

            String titleRaw = getStringSafeFromMap(empRow, "TITLE", "title", "Tittle");
            if (titleRaw != null) {
                String t = titleRaw.trim().replace(".", "");
                if (t.equalsIgnoreCase("mr"))
                    titleRaw = "Mr";
                else if (t.equalsIgnoreCase("mrs"))
                    titleRaw = "Mrs";
                else if (t.equalsIgnoreCase("ms") || t.equalsIgnoreCase("miss"))
                    titleRaw = "Ms";
                else if (t.equalsIgnoreCase("dr"))
                    titleRaw = "Dr";
                else
                    titleRaw = t;
            }
            employee.setTitle(titleRaw);

            String catStr = getStringSafeFromMap(empRow, "EMP_CAT", "CATEGORY", "Category", "category");
            Long catId = null;
            if (catStr != null) {
                String c = catStr.trim().toLowerCase();
                if (categoryMap.containsKey(c)) {
                    catId = categoryMap.get(c);
                } else if (c.contains("employee")) {
                    catId = categoryMap.get("employee");
                } else if (c.contains("contractor")) {
                    catId = categoryMap.get("contractor");
                } else if (c.contains("consultant")) {
                    catId = categoryMap.get("consultant");
                }
            }
            employee.setCategoryId(catId);

            String empLevel = getStringSafeFromMap(empRow, "EMP_SUB_CAT", "EMP_LEVEL", "empLevel", "LEVEL", "Level");
            employee.setEmpLevelId(empLevel != null && levelMap.containsKey(empLevel.trim().toLowerCase())
                    ? levelMap.get(empLevel.trim().toLowerCase())
                    : null);

            String empTypeStr = getStringSafeFromMap(empRow, "EMP_TYPE", "empType", "TYPE", "Type");
            employee.setEmployeeTypeId(empTypeStr != null && typeMap.containsKey(empTypeStr.trim().toLowerCase())
                    ? typeMap.get(empTypeStr.trim().toLowerCase())
                    : null);

            String oldGradeCode = getStringSafeFromMap(empRow, "GRADE_CODE", "gradeCode", "GRADE", "Grade");
            String mappedGradeName = null;
            if (oldGradeCode != null) {
                mappedGradeName = gradeCodeToNameMap.get(oldGradeCode.trim().toUpperCase());
            }
            if (mappedGradeName == null) {
                mappedGradeName = oldGradeCode;
            }
            employee.setGradeCode(mappedGradeName);

            String unitStr = getStringSafeFromMap(empRow, "UNIT_NAME", "unitName", "UNIT");
            if (unitStr != null) {
                if (unitStr.trim().equalsIgnoreCase("UNIT1") || unitStr.trim().equalsIgnoreCase("UNIT 1")) {
                    employee.setUnitId(1L);
                } else if (unitStr.trim().equalsIgnoreCase("UNIT2") || unitStr.trim().equalsIgnoreCase("UNIT 2")) {
                    employee.setUnitId(2L);
                } else {
                    employee.setUnitId(null);
                }
            } else {
                employee.setUnitId(null);
            }

            Number legacyDeptNoNum = (Number) empRow.get("DEPT_NO");
            employee.setDepartmentId(legacyDeptNoNum != null ? deptMap.get(legacyDeptNoNum.longValue()) : null);

            Number legacyDesigIdNum = (Number) empRow.get("DESIG_CODE");
            employee.setDesignationId(legacyDesigIdNum != null ? desigMap.get(legacyDesigIdNum.longValue()) : null);

            String oldPhotoFilename = getStringSafeFromMap(empRow, "PHOTO_FILENAME", "photoFilename",
                    "EMPLOYEE_PHOTO_UPLOAD");
            String newPhotoPath = migrateEmployeeFile(oldPhotoFilename, "HRMS",
                    "MASTER/HR/Employee/Employee Master/IMAGE");
            employee.setEmployeePhotoUpload(newPhotoPath != null ? newPhotoPath : oldPhotoFilename);

            Number empCdForFilesNum = (Number) empRow.get("EMP_CD");
            if (empCdForFilesNum != null) {
                long empCdVal = empCdForFilesNum.longValue();
                String oldSignature = signatureMap.get(empCdVal);
                if (oldSignature != null) {
                    String newSignaturePath = migrateEmployeeFile(oldSignature, "HRMS/Signature",
                            "MASTER/HR/Employee/Employee Master/Signature");
                    employee.setEmployeeSignatureUpload(newSignaturePath != null ? newSignaturePath : oldSignature);
                }
                String oldNda = ndaMap.get(empCdVal);
                if (oldNda != null) {
                    String newNdaPath = migrateEmployeeFile(oldNda, "EMPLOYEE_MASTER",
                            "MASTER/HR/Employee/Employee Master/NDA");
                    employee.setNdaUpload(newNdaPath != null ? newNdaPath : oldNda);
                }
                String oldFitness = fitnessMap.get(empCdVal);
                if (oldFitness != null) {
                    String newFitnessPath = migrateEmployeeFile(oldFitness, "EMPLOYEE FITNESS CERTIFICATE",
                            "MASTER/HR/Employee/Employee Master/Fitness");
                    employee.setFitnessCertificateUpload(newFitnessPath != null ? newFitnessPath : oldFitness);
                }
            }

            employee.setOfficeMail(getStringSafeFromMap(empRow, "OFFICE_MAIL", "officeMail"));
            employee.setOfficeMailPassword(getStringSafeFromMap(empRow, "OFFICE_MAIL_PASSWORD", "officeMailPassword",
                    "PASSWORD", "Office mail Password"));
            employee.setPfToggle(getStringSafeFromMap(empRow, "PF_TOGGLE", "pfToggle", "PF"));
            employee.setEsiToggle(getStringSafeFromMap(empRow, "ESI_TOGGLE", "esiToggle", "ESI"));
            employee.setPTaxToggle(getStringSafeFromMap(empRow, "P_TAX_TOGGLE", "pTaxToggle", "P TAX"));
            employee.setBonusToggle(getStringSafeFromMap(empRow, "BONUS_TOGGLE", "bonusToggle", "Bonus"));
            employee.setOtToggle(getStringSafeFromMap(empRow, "OT_TOGGLE", "otToggle", "OT"));

            Object otFactorialObj = empRow.get("OT_FACTORIAL");
            employee.setOtFactorial(parseBigDecimalSafe(otFactorialObj));

            employee.setLomDeduction(getStringSafeFromMap(empRow, "LOM_DEDUCTION", "lomDeduction"));

            Object lomAllowObj = empRow.get("LOM_ALLOW");
            employee.setLomAllow(parseBigDecimalSafe(lomAllowObj));

            employee.setLtaEligible(getStringSafeFromMap(empRow, "LTA_ELIGIBLE", "ltaEligible"));

            Object pfRestrictionObj = empRow.get("PF_RESTRICTION");
            employee.setPfRestriction(parseBigDecimalSafe(pfRestrictionObj));

            employee.setPermissionToggle(
                    getStringSafeFromMap(empRow, "PERMISSION_TOGGLE", "permissionToggle", "MANAGER_PERM"));

            Object permLimitObj = empRow.get("PERMISSION_LIMIT");
            employee.setPermissionLimit(parseBigDecimalSafe(permLimitObj));

            employee.setVendorName(getStringSafeFromMap(empRow, "VENDOR_NAME", "vendorName", "CONT_SUP_CODE"));
            employee.setReferMode(getStringSafeFromMap(empRow, "REFER_MODE", "referMode"));
            employee.setReferenceComments(
                    getStringSafeFromMap(empRow, "REFERENCE_COMMENTS", "referenceComments", "REF_BY"));
            employee.setSupplierName(getStringSafeFromMap(empRow, "SUPPLIER_NAME", "supplierName"));

            employee.setDateOfJoining(
                    getTimestampSafeFromMap(empRow, "JOIN_DATE", "DATE_OF_JOINING", "dateOfJoining", "DATE OF JOINING",
                            "DOJ"));
            employee.setProbationPeriod(getStringSafeFromMap(empRow, "PROBATION_PERIOD", "probationPeriod"));
            employee.setConfirmationDate(
                    getTimestampSafeFromMap(empRow, "CONFIRM_DATE", "CONFIRMATION_DATE", "confirmationDate"));
            employee.setInductionStatus(getStringSafeFromMap(empRow, "INDUCTION_STATUS", "inductionStatus"));
            employee.setExitDate(getTimestampSafeFromMap(empRow, "EXIT_DATE", "exitDate"));
            employee.setExitReason(getStringSafeFromMap(empRow, "EXIT_REASON", "exitReason"));
            employee.setExitComments(getStringSafeFromMap(empRow, "EXIT_COMMENTS", "exitComments"));
            employee.setRejoiningDate(getTimestampSafeFromMap(empRow, "REJOINING_DATE", "rejoiningDate"));

            employee.setGraceMinutes(
                    getIntegerSafeFromMap(empRow, "GRACE_MINS", "GRACE_MINUTES", "graceMinutes", "GRACE MIN"));
            employee.setPetrolMode(getStringSafeFromMap(empRow, "PETROL_MODE", "petrolMode", "PETROL MODE"));

            Object petrolAllowanceObj = empRow.get("PETROL_ALLOWANCE");
            employee.setPetrolAllowance(parseBigDecimalSafe(petrolAllowanceObj));

            employee.setShift(getStringSafeFromMap(empRow, "SHIFT", "shift", "SHIFT"));
            employee.setShiftName(getStringSafeFromMap(empRow, "SHIFT_NAME", "shiftName"));
            employee.setShiftDuration(getStringSafeFromMap(empRow, "SHIFT_DURATION", "shiftDuration"));
            employee.setIsAuditor(getStringSafeFromMap(empRow, "IS_AUDITOR", "isAuditor"));
            employee.setAuditorType(getStringSafeFromMap(empRow, "AUDITOR_TYPE", "auditorType"));
            employee.setAuditorFileInfo(getStringSafeFromMap(empRow, "AUDITOR_FILE_INFO", "auditorFileInfo"));
            employee.setIsAuditee(getStringSafeFromMap(empRow, "IS_AUDITEE", "isAuditee"));
            employee.setAuditeeType(getStringSafeFromMap(empRow, "AUDITEE_TYPE", "auditeeType"));
            employee.setAuditeeFileInfo(getStringSafeFromMap(empRow, "AUDITEE_FILE_INFO", "auditeeFileInfo"));
            employee.setIsNcrApprover(getStringSafeFromMap(empRow, "IS_NCR_APPROVER", "isNcrApprover"));
            employee.setNcrApproverType(getStringSafeFromMap(empRow, "NCR_APPROVER_TYPE", "ncrApproverType"));
            employee.setNcrApproverFileInfo(
                    getStringSafeFromMap(empRow, "NCR_APPROVER_FILE_INFO", "ncrApproverFileInfo"));
            employee.setIsTaskVerifier(getStringSafeFromMap(empRow, "IS_TASK_VERIFIER", "isTaskVerifier"));
            employee.setTaskVerifierType(getStringSafeFromMap(empRow, "TASK_VERIFIER_TYPE", "taskVerifierType"));
            employee.setTaskVerifierFileInfo(
                    getStringSafeFromMap(empRow, "TASK_VERIFIER_FILE_INFO", "taskVerifierFileInfo"));
            employee.setIsTaskTester(getStringSafeFromMap(empRow, "IS_TASK_TESTER", "isTaskTester"));
            employee.setTaskTesterType(getStringSafeFromMap(empRow, "TASK_TESTER_TYPE", "taskTesterType"));
            employee.setTaskTesterFileInfo(getStringSafeFromMap(empRow, "TASK_TESTER_FILE_INFO", "taskTesterFileInfo"));
            employee.setIsChaired(getStringSafeFromMap(empRow, "IS_CHAIRED", "isChaired"));
            employee.setChairedType(getStringSafeFromMap(empRow, "CHAIRED_TYPE", "chairedType"));
            employee.setChairedFileInfo(getStringSafeFromMap(empRow, "CHAIRED_FILE_INFO", "chairedFileInfo"));
            employee.setIsHost(getStringSafeFromMap(empRow, "IS_HOST", "isHost"));
            employee.setHostType(getStringSafeFromMap(empRow, "HOST_TYPE", "hostType"));
            employee.setHostFileInfo(getStringSafeFromMap(empRow, "HOST_FILE_INFO", "hostFileInfo"));
            employee.setIsParticipants(getStringSafeFromMap(empRow, "IS_PARTICIPANTS", "isParticipants"));
            employee.setParticipantsType(getStringSafeFromMap(empRow, "PARTICIPANTS_TYPE", "participantsType"));
            employee.setParticipantsFileInfo(
                    getStringSafeFromMap(empRow, "PARTICIPANTS_FILE_INFO", "participantsFileInfo"));
            employee.setSegment(getStringSafeFromMap(empRow, "SEGMENT", "segment", "SITE"));
            employee.setSubSegment(getStringSafeFromMap(empRow, "SUB_SEGMENT", "subSegment"));
            employee.setIsFirstAid(getStringSafeFromMap(empRow, "IS_FIRST_AID", "isFirstAid"));
            employee.setFirstAidFileInfo(getStringSafeFromMap(empRow, "FIRST_AID_FILE_INFO", "firstAidFileInfo"));
            employee.setIsFireFighter(getStringSafeFromMap(empRow, "IS_FIRE_FIGHTER", "isFireFighter"));
            employee.setFireFighterFileInfo(
                    getStringSafeFromMap(empRow, "FIRE_FIGHTER_FILE_INFO", "fireFighterFileInfo"));
            employee.setIsTwoWheeler(getStringSafeFromMap(empRow, "IS_TWO_WHEELER", "isTwoWheeler"));
            employee.setTwoWheelerFileInfo(getStringSafeFromMap(empRow, "TWO_WHEELER_FILE_INFO", "twoWheelerFileInfo"));
            employee.setIsFourWheeler(getStringSafeFromMap(empRow, "IS_FOUR_WHEELER", "isFourWheeler"));
            employee.setFourWheelerFileInfo(
                    getStringSafeFromMap(empRow, "FOUR_WHEELER_FILE_INFO", "fourWheelerFileInfo"));
            employee.setIsInductionEligible(
                    getStringSafeFromMap(empRow, "IS_INDUCTION_ELIGIBLE", "isInductionEligible", "IND_FLAG"));
            employee.setIsInterviewer(getStringSafeFromMap(empRow, "IS_INTERVIEWER", "isInterviewer"));
            employee.setIsEnquiryAssignee(getStringSafeFromMap(empRow, "IS_ENQUIRY_ASSIGNEE", "isEnquiryAssignee"));
            employee.setIsPrAssignee(getStringSafeFromMap(empRow, "IS_PR_ASSIGNEE", "isPrAssignee"));

            employee.setApplicantDate(getTimestampSafeFromMap(empRow, "APPLICANT_DATE", "applicantDate"));
            employee.setAge(getIntegerSafeFromMap(empRow, "AGE", "age"));

            employee.setCallStatus(statusResolver.get(getStringSafeFromMap(empRow, "CALL_STATUS", "callStatus")));
            employee.setInterviewStatus(
                    statusResolver.get(getStringSafeFromMap(empRow, "INTERVIEW_STATUS", "interviewStatus")));
            employee.setOfferStatus(statusResolver.get(getStringSafeFromMap(empRow, "OFFER_STATUS", "offerStatus")));
            employee.setVerificationStatus(
                    statusResolver.get(getStringSafeFromMap(empRow, "VERIFICATION_STATUS", "verificationStatus")));

            employee.setNextSalaryHikeMonth(
                    getStringSafeFromMap(empRow, "NEXT_SALARY_HIKE_MONTH", "nextSalaryHikeMonth", "HIKE_DATE"));

            Object createdAtObj = empRow.get("CREAT_DT");
            employee.setCreatedDate(
                    createdAtObj != null ? java.sql.Timestamp.valueOf(createdAtObj.toString()) : new java.util.Date());

            Object updatedAtObj = empRow.get("LST_UPDT_TS");
            employee.setUpdatedDate(
                    updatedAtObj != null ? java.sql.Timestamp.valueOf(updatedAtObj.toString()) : new java.util.Date());

            employee.setCreatedBy("SUPER BOSS");
            employee.setUpdatedBy("SUPER BOSS");

            String leftCompany = getStringSafeFromMap(empRow, "LEFT_COMPANY", "leftCompany");
            String statusValue = "Active";
            if ("Yes".equalsIgnoreCase(leftCompany)) {
                statusValue = "Inactive";
            } else if ("No".equalsIgnoreCase(leftCompany)) {
                statusValue = "Active";
            } else {
                String oldStatus = getStringSafeFromMap(empRow, "STATUS", "status");
                if ("HOLD".equalsIgnoreCase(oldStatus) || "0".equals(oldStatus)) {
                    statusValue = "Inactive";
                } else if ("1".equals(oldStatus)) {
                    statusValue = "Active";
                }
            }
            employee.setStatus(statusResolver.get(statusValue));
            employee.setIsActive("Active".equals(statusValue));

            // Save employee first to get new EMPLOYEE_ID
            EmployeeMaster savedEmp = employeeMasterRepository.saveAndFlush(employee);
            Long newEmpId = savedEmp.getId();

            // Update manager columns on employee master to null first (will be mapped in
            // separate card)
            savedEmp.setVerticalHead(null);
            savedEmp.setHrManager(null);
            savedEmp.setBusinessManager(null);
            savedEmp.setHomeManager(null);
            employeeMasterRepository.saveAndFlush(savedEmp);

            transactionManager.commit(txStatus);
            // Log SUCCESS in Migration Audit History
            logDetailedMigration(oldEmpCd, newEmpId, isUpdate ? "UPDATE" : "INSERT", "SUCCESS", "SUCCESS", "",
                    System.currentTimeMillis() - empStartTime);
            return newEmpId;

        } catch (Exception e) {
            transactionManager.rollback(txStatus);
            // Log FAILURE in Migration Audit History
            logDetailedMigration(oldEmpCd, null, "NONE", "FAILED", "FAILED", e.getMessage(),
                    System.currentTimeMillis() - empStartTime);
            throw new RuntimeException("Migration failed for employee code " + empCd + ": " + e.getMessage(), e);
        }
    }

    private Long resolveManagerNewIdRecursive(java.util.Map<String, Object> empRow, String managerColName,
            java.util.Map<Long, java.util.Map<String, Object>> secondaryEmployeeById,
            java.util.Set<String> processingCodes,
            java.util.Map<Long, Long> deptMap,
            java.util.Map<Long, Long> desigMap,
            java.util.Map<String, Long> levelMap,
            java.util.Map<String, Long> categoryMap,
            java.util.Map<String, Long> typeMap,
            java.util.Map<Long, String> signatureMap,
            java.util.Map<Long, String> fitnessMap,
            java.util.Map<Long, String> ndaMap,
            java.util.Map<String, String> gradeCodeToNameMap) {
        Object legacyMgrVal = empRow.get(managerColName);
        if (legacyMgrVal == null) {
            return null;
        }
        Long legacyManagerId = null;
        try {
            legacyManagerId = Long.parseLong(legacyMgrVal.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
        if (legacyManagerId == 0) {
            return null;
        }

        // Find corresponding source employee record using EMP_ID
        java.util.Map<String, Object> mgrSrc = secondaryEmployeeById.get(legacyManagerId);
        if (mgrSrc == null) {
            return null;
        }

        // Read that employee's EMP_CODE (or OLD_EMP_CODE)
        String mgrEmpCode = getStringSafeFromMap(mgrSrc, "EMP_CD", "EMP_CODE", "EMPLOYEE_CODE", "empCode");
        String mgrOldEmpCode = getStringSafeFromMap(mgrSrc, "OLDEMP_CD", "OLD_EMP_CODE", "oldEmpCode");

        // Compare it with HR_EMPLOYEE.EMP_CODE or HR_EMPLOYEE.OLD_EMP_CODE
        EmployeeMaster targetManager = null;
        if (mgrOldEmpCode != null && !mgrOldEmpCode.trim().isEmpty()) {
            targetManager = employeeMasterRepository.findByOldEmpCode(mgrOldEmpCode.trim()).orElse(null);
        }
        if (targetManager == null && mgrEmpCode != null && !mgrEmpCode.trim().isEmpty()) {
            targetManager = employeeMasterRepository.findByEmpCode(mgrEmpCode.trim()).orElse(null);
        }
        if (targetManager == null && mgrOldEmpCode != null && !mgrOldEmpCode.trim().isEmpty()) {
            targetManager = employeeMasterRepository.findByEmpCode(mgrOldEmpCode.trim()).orElse(null);
        }

        if (targetManager == null) {
            try {
                return migrateEmployeeRow(mgrSrc, secondaryEmployeeById, processingCodes, deptMap, desigMap, levelMap,
                        categoryMap, typeMap, signatureMap, fitnessMap, ndaMap, gradeCodeToNameMap);
            } catch (Exception e) {
                throw new RuntimeException(
                        "Failed to migrate manager " + mgrEmpCode + " recursively: " + e.getMessage(), e);
            }
        }

        return targetManager.getId();
    }

    private void logDetailedMigration(String oldEmpCode, Long newEmployeeId, String operation,
            String managerMappingStatus, String status, String errorMessage, long executionTimeMs) {
        try {
            com.autonoma.erp.model.admin.MigrationAuditLog auditLog = new com.autonoma.erp.model.admin.MigrationAuditLog();
            auditLog.setTableName("EMPLOYEE_MASTER_MIGRATION: " + (oldEmpCode != null ? oldEmpCode : "UNKNOWN"));
            auditLog.setMigratedBy("SUPER BOSS");
            auditLog.setMigratedAt(new java.util.Date());
            auditLog.setStatus(status);
            auditLog.setRecordsCount(1);
            auditLog.setExecutionTimeMs(executionTimeMs);

            String formattedMessage = String.format(
                    "OLD_EMP_CODE: %s | New EMPLOYEE_ID: %s | Operation: %s | Manager Mapping Status: %s | Success/Failure: %s | Error: %s | Execution Time: %d ms",
                    oldEmpCode != null ? oldEmpCode : "N/A",
                    newEmployeeId != null ? newEmployeeId.toString() : "N/A",
                    operation,
                    managerMappingStatus,
                    status,
                    errorMessage != null ? errorMessage : "None",
                    executionTimeMs);
            auditLog.setMessage(formattedMessage);
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            System.err.println("Failed to save employee audit log: " + e.getMessage());
        }
    }

    private java.math.BigDecimal parseBigDecimalSafe(Object obj) {
        if (obj == null)
            return null;
        String str = obj.toString().trim();
        if (str.isEmpty() || str.equalsIgnoreCase("N/A") || str.equalsIgnoreCase("NA")
                || str.equalsIgnoreCase("NULL")) {
            return null;
        }
        try {
            return new java.math.BigDecimal(str);
        } catch (Exception e) {
            return null;
        }
    }

    private String getStringSafeFromMap(java.util.Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val != null) {
                return val.toString().trim();
            }
            for (String mapKey : map.keySet()) {
                if (mapKey.equalsIgnoreCase(key)) {
                    Object valCI = map.get(mapKey);
                    if (valCI != null) {
                        return valCI.toString().trim();
                    }
                }
            }
        }
        return null;
    }

    private java.sql.Timestamp getTimestampSafeFromMap(java.util.Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val != null) {
                if (val instanceof java.sql.Timestamp) {
                    return (java.sql.Timestamp) val;
                } else if (val instanceof java.util.Date) {
                    return new java.sql.Timestamp(((java.util.Date) val).getTime());
                } else {
                    try {
                        return java.sql.Timestamp.valueOf(val.toString());
                    } catch (Exception e) {
                    }
                }
            }
            for (String mapKey : map.keySet()) {
                if (mapKey.equalsIgnoreCase(key)) {
                    Object valCI = map.get(mapKey);
                    if (valCI != null) {
                        if (valCI instanceof java.sql.Timestamp) {
                            return (java.sql.Timestamp) valCI;
                        } else if (valCI instanceof java.util.Date) {
                            return new java.sql.Timestamp(((java.util.Date) valCI).getTime());
                        } else {
                            try {
                                return java.sql.Timestamp.valueOf(valCI.toString());
                            } catch (Exception e) {
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    private Integer getIntegerSafeFromMap(java.util.Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val != null) {
                if (val instanceof Number) {
                    return ((Number) val).intValue();
                } else {
                    try {
                        return Integer.parseInt(val.toString().trim());
                    } catch (Exception e) {
                    }
                }
            }
            for (String mapKey : map.keySet()) {
                if (mapKey.equalsIgnoreCase(key)) {
                    Object valCI = map.get(mapKey);
                    if (valCI != null) {
                        if (valCI instanceof Number) {
                            return ((Number) valCI).intValue();
                        } else {
                            try {
                                return Integer.parseInt(valCI.toString().trim());
                            } catch (Exception e) {
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    private java.util.Map<Long, Long> oldToNewEmpIdMap;

    private void initOldToNewEmpIdMap() {
        if (oldToNewEmpIdMap != null)
            return;
        oldToNewEmpIdMap = new java.util.HashMap<>();
        try {
            String sql = "SELECT EMP_CD, OLDEMP_CD, APPLICANT_ID FROM EMPLOYEE";
            java.util.Map<String, Long> empCodeToOldId = new java.util.HashMap<>();
            java.util.Map<Long, Long> applicantToOldId = new java.util.HashMap<>();

            jdbcTemplate.query(sql, (rs, rowNum) -> {
                String codeObj = getStringSafe(rs, "EMP_CD");
                String oldEmpCdObj = getStringSafe(rs, "OLDEMP_CD");
                Long applicantObj = getLongSafe(rs, "APPLICANT_ID");
                if (codeObj != null && !codeObj.trim().isEmpty()) {
                    try {
                        Long idObj = Long.parseLong(codeObj.trim());
                        String savedEmpCode = (codeObj != null && !codeObj.trim().isEmpty()) ? codeObj
                                : oldEmpCdObj;
                        empCodeToOldId.put(savedEmpCode.trim().toUpperCase(), idObj);
                        if (applicantObj != null && applicantObj > 0) {
                            applicantToOldId.put(applicantObj, idObj);
                        }
                    } catch (NumberFormatException e) {
                        // ignore if EMP_CD is not numeric
                    }
                }
                return null;
            });

            List<EmployeeMaster> newRecords = employeeMasterRepository.findAll();
            for (EmployeeMaster newEmp : newRecords) {
                if (newEmp.getEmpCode() != null && newEmp.getId() != null) {
                    Long oldMappedId = empCodeToOldId.get(newEmp.getEmpCode().trim().toUpperCase());
                    if (oldMappedId != null) {
                        oldToNewEmpIdMap.put(oldMappedId, newEmp.getId());
                    }
                }
            }
            for (java.util.Map.Entry<Long, Long> entry : applicantToOldId.entrySet()) {
                Long newEmpId = oldToNewEmpIdMap.get(entry.getValue());
                if (newEmpId != null) {
                    oldToNewEmpIdMap.put(entry.getKey(), newEmpId);
                }
            }
        } catch (org.springframework.dao.DataAccessException e) {
            System.err.println("[MIGRATION WARNING] EMPLOYEE table not found for mapping: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("[MIGRATION ERROR] Failed to initialize employee ID map: " + e.getMessage());
        }
    }

    private Long getMappedEmployeeId(Long oldId) {
        if (oldId == null)
            return null;
        initOldToNewEmpIdMap();
        return oldToNewEmpIdMap.get(oldId);
    }

    private java.util.Map<String, Long> codeToNewEmpIdMap;

    private void initCodeToNewEmpIdMap() {
        if (codeToNewEmpIdMap != null)
            return;
        codeToNewEmpIdMap = new java.util.HashMap<>();
        try {
            List<EmployeeMaster> newRecords = employeeMasterRepository.findAll();
            for (EmployeeMaster newEmp : newRecords) {
                if (newEmp.getEmpCode() != null && newEmp.getId() != null) {
                    codeToNewEmpIdMap.put(newEmp.getEmpCode().trim().toUpperCase(), newEmp.getId());
                }
                if (newEmp.getOldEmpCode() != null && newEmp.getId() != null) {
                    codeToNewEmpIdMap.put(newEmp.getOldEmpCode().trim().toUpperCase(), newEmp.getId());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private java.util.Map<String, String> oldNumericToAlphaMap;

    private void initOldNumericToAlphaMap() {
        if (oldNumericToAlphaMap != null)
            return;
        oldNumericToAlphaMap = new java.util.HashMap<>();
        if (jdbcTemplate != null) {
            try {
                String sql = "SELECT EMP_CD, OLDEMP_CD FROM EMPLOYEE";
                jdbcTemplate.query(sql, (rs, rowNum) -> {
                    String empCd = getStringSafe(rs, "EMP_CD");
                    String oldEmpCd = getStringSafe(rs, "OLDEMP_CD");
                    if (empCd != null && oldEmpCd != null && !oldEmpCd.trim().isEmpty()) {
                        oldNumericToAlphaMap.put(empCd.trim(), oldEmpCd.trim().toUpperCase());
                    }
                    return null;
                });
            } catch (Exception e) {
                System.err.println("Failed to load oldNumericToAlphaMap: " + e.getMessage());
            }
        }
    }

    private Long resolveEmployeeId(java.sql.ResultSet rs) {
        initCodeToNewEmpIdMap();
        initOldNumericToAlphaMap();

        String code = getStringSafe(rs, "EMP_CD", "EMPLOYEE_CODE", "EMP_CODE", "empCode");
        if (code != null) {
            code = code.trim();
            // 1. Try to map numeric to alpha using old DB mapping
            String alphaCode = oldNumericToAlphaMap.get(code);
            if (alphaCode != null) {
                Long mappedId = codeToNewEmpIdMap.get(alphaCode);
                if (mappedId != null)
                    return mappedId;
            }

            // 2. Direct lookup (if OLDEMP_CD was empty, new DB has the numeric code itself)
            Long mappedId = codeToNewEmpIdMap.get(code.toUpperCase());
            if (mappedId != null)
                return mappedId;
            try {
                Long oldNumericId = Long.parseLong(code);
                Long mappedFromOld = getMappedEmployeeId(oldNumericId);
                if (mappedFromOld != null)
                    return mappedFromOld;
            } catch (NumberFormatException e) {
            }
        }

        Long oldId = getLongSafe(rs, "EMPLOYEE_ID", "employeeId", "EMP_ID", "empId", "ID", "id");
        if (oldId != null) {
            return getMappedEmployeeId(oldId);
        }

        return null;
    }

    @Transactional
    public String migrateEmployeeActivities(org.springframework.jdbc.core.JdbcTemplate migrationTemplate) {
        org.springframework.jdbc.core.JdbcTemplate jdbcTemplate = migrationTemplate != null ? migrationTemplate
                : this.jdbcTemplate;
        String currentUser = "SUPER BOSS";

        final String finalUserId = currentUser;
        codeToNewEmpIdMap = null;
        oldToNewEmpIdMap = null;
        initCodeToNewEmpIdMap();
        initOldToNewEmpIdMap();
        if (jdbcTemplate == null)
            return "Database not configured.";
        String sql = "SELECT * FROM HRMS_ADDITIONAL_ACTIVITIES";
        List<EmployeeActivity> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            EmployeeActivity entity = new EmployeeActivity();
            entity.setEmployeeId(resolveEmployeeId(rs));
            entity.setActivityDetails(getStringSafe(rs, "ACTIVITY_DETAILS", "activityDetails"));
            entity.setIsActive(getBooleanSafe(rs, "IS_ACTIVE", "isActive"));
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return entity;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());
        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped. Migrated 0 records for HRMS_ADDITIONAL_ACTIVITIES.";
        }

        // Skip records with null employeeId (not-null constraint on EMPLOYEE_ID)
        List<EmployeeActivity> toInsert = migratedList.stream()
                .filter(e -> e.getEmployeeId() != null)
                .collect(Collectors.toList());
        int skipped = migratedList.size() - toInsert.size();

        int count = 0;
        if (!toInsert.isEmpty()) {
            java.util.List<Long> empIds = toInsert.stream().map(EmployeeActivity::getEmployeeId)
                    .collect(java.util.stream.Collectors.toList());
            employeeActivityRepository.deleteByEmployeeIdIn(empIds);
            employeeActivityRepository.saveAll(toInsert);
            count = toInsert.size();
        }
        return "Successfully migrated " + count + " records from HRMS_ADDITIONAL_ACTIVITIES" +
                (skipped > 0 ? " (skipped " + skipped + " records with null employeeId)." : ".");
    }

    @Transactional
    public String migrateEmployeeAssets(org.springframework.jdbc.core.JdbcTemplate migrationTemplate) {
        org.springframework.jdbc.core.JdbcTemplate jdbcTemplate = migrationTemplate != null ? migrationTemplate
                : this.jdbcTemplate;
        String currentUser = "SUPER BOSS";

        final String finalUserId = currentUser;
        codeToNewEmpIdMap = null;
        oldToNewEmpIdMap = null;
        initCodeToNewEmpIdMap();
        initOldToNewEmpIdMap();
        if (jdbcTemplate == null)
            return "Database not configured.";
        String sql = "SELECT * FROM HRMS_ASSETS_EMPLOYEE";
        List<EmployeeAsset> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            EmployeeAsset entity = new EmployeeAsset();
            entity.setEmployeeId(resolveEmployeeId(rs));
            entity.setAssetId(getStringSafe(rs, "ASSET_ID", "assetId"));
            entity.setAssetName(getStringSafe(rs, "ASSET_NAME", "assetName"));
            entity.setAssetValue(getBigDecimalSafe(rs, "VALUE", "assetValue"));
            entity.setIssueDate(getTimestampSafe(rs, "ISSUE_DATE", "issueDate"));
            entity.setCondition(getStringSafe(rs, "CONDITION_OF_ASSET", "condition"));
            entity.setQty(getIntegerSafe(rs, "QTY", "qty"));
            entity.setSerialNo(getStringSafe(rs, "SERIAL_NO", "serialNo"));
            entity.setComments(getStringSafe(rs, "COMMENTS", "comments"));
            entity.setIsActive(getBooleanSafe(rs, "IS_ACTIVE", "isActive"));
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return entity;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());
        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped. Migrated 0 records for HRMS_ASSETS_EMPLOYEE.";
        }

        java.util.Set<Long> validEmpIds = employeeMasterRepository.findAll().stream()
                .map(e -> e.getId()).filter(id -> id != null)
                .collect(java.util.stream.Collectors.toSet());
        List<EmployeeAsset> toInsert = migratedList.stream()
                .filter(e -> e.getEmployeeId() != null && validEmpIds.contains(e.getEmployeeId()))
                .collect(Collectors.toList());
        int skipped = migratedList.size() - toInsert.size();

        int count = 0;
        if (!toInsert.isEmpty()) {
            java.util.List<Long> empIds = toInsert.stream().map(EmployeeAsset::getEmployeeId)
                    .collect(java.util.stream.Collectors.toList());
            employeeAssetRepository.deleteByEmployeeIdIn(empIds);
            employeeAssetRepository.saveAll(toInsert);
            count = toInsert.size();
        }
        return "Successfully migrated " + count + " records from HRMS_ASSETS_EMPLOYEE" +
                (skipped > 0 ? " (skipped " + skipped + " records with invalid/null employeeId)." : ".");
    }

    @Transactional
    public String migrateEmployeeContacts(org.springframework.jdbc.core.JdbcTemplate migrationTemplate) {
        org.springframework.jdbc.core.JdbcTemplate jdbcTemplate = migrationTemplate != null ? migrationTemplate
                : this.jdbcTemplate;
        String currentUser = "SUPER BOSS";

        final String finalUserId = currentUser;
        codeToNewEmpIdMap = null;
        oldToNewEmpIdMap = null;
        initCodeToNewEmpIdMap();
        initOldToNewEmpIdMap();
        if (jdbcTemplate == null)
            return "Database not configured.";
        String sql = "SELECT * FROM HRMS_CONTACT_DETAILS";
        List<EmployeeContact> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            EmployeeContact entity = new EmployeeContact();
            entity.setEmployeeId(resolveEmployeeId(rs));
            entity.setMobile(getStringSafe(rs, "MOBILE", "mobile"));
            entity.setAlternateMobile(getStringSafe(rs, "ALTERNATE_MOBILE", "alternateMobile", "PRES_MOBILE"));
            entity.setAddress(getStringSafe(rs, "PERM_ADDRESS1", "address", "PERM_ADD1"));
            entity.setCity(getStringSafe(rs, "PERM_CITY", "city"));
            entity.setState(getStringSafe(rs, "PERM_STATE", "state"));
            String permCountry = getStringSafe(rs, "PERM_COUNTRY", "country", "COUNTRY", "Country");
            entity.setCountry(permCountry);
            entity.setPincode(getStringSafe(rs, "PERM_PIN_CODE", "pincode", "POST_BOX"));
            entity.setCommAddress(getStringSafe(rs, "COMM_ADDRESS1", "commAddress", "PRES_ADD1"));
            entity.setCommCity(getStringSafe(rs, "COMM_CITY", "commCity", "PRES_CITY"));
            entity.setCommState(getStringSafe(rs, "COMM_STATE", "commState", "PRES_STATE"));
            String commCountry = getStringSafe(rs, "COMM_COUNTRY", "commCountry");
            entity.setCommCountry(commCountry != null ? commCountry : permCountry);
            entity.setCommPincode(getStringSafe(rs, "COMM_PIN_CODE", "commPincode", "PRES_POST_BOX"));
            entity.setIsActive(getBooleanSafe(rs, "IS_ACTIVE", "isActive"));
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return entity;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());
        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped. Migrated 0 records for HRMS_CONTACT_DETAILS.";
        }

        java.util.Set<Long> validEmpIds = employeeMasterRepository.findAll().stream()
                .map(e -> e.getId()).filter(id -> id != null)
                .collect(java.util.stream.Collectors.toSet());
        List<EmployeeContact> toInsert = migratedList.stream()
                .filter(e -> e.getEmployeeId() != null && validEmpIds.contains(e.getEmployeeId()))
                .collect(Collectors.toList());
        int skipped = migratedList.size() - toInsert.size();

        int count = 0;
        if (!toInsert.isEmpty()) {
            java.util.List<Long> empIds = toInsert.stream().map(EmployeeContact::getEmployeeId)
                    .collect(Collectors.toList());
            employeeContactRepository.deleteByEmployeeIdIn(empIds);
            employeeContactRepository.saveAll(toInsert);
            count = toInsert.size();
        }
        return "Successfully migrated " + count + " records from HRMS_CONTACT_DETAILS" +
                (skipped > 0 ? " (skipped " + skipped + " records with invalid/null employeeId)." : ".");
    }

    @Transactional
    public String migrateEmployeePersonalDetails(org.springframework.jdbc.core.JdbcTemplate migrationTemplate) {
        org.springframework.jdbc.core.JdbcTemplate jdbcTemplate = migrationTemplate != null ? migrationTemplate
                : this.jdbcTemplate;
        String currentUser = "SUPER BOSS";

        final String finalUserId = currentUser;
        codeToNewEmpIdMap = null;
        oldToNewEmpIdMap = null;
        initCodeToNewEmpIdMap();
        initOldToNewEmpIdMap();
        if (jdbcTemplate == null)
            return "Database not configured.";
        String sql = "SELECT * FROM HRMS_PERSONAL_DETAILS";
        List<EmployeePersonalDetail> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            EmployeePersonalDetail entity = new EmployeePersonalDetail();
            entity.setEmployeeId(resolveEmployeeId(rs));
            entity.setGender(getStringSafe(rs, "GENDER", "gender"));
            entity.setBirthDate(getTimestampSafe(rs, "BIRTH_DATE", "birthDate"));
            entity.setMaritalStatus(getStringSafe(rs, "MARITAL_STATUS", "maritalStatus"));
            entity.setMarriageDate(
                    getTimestampSafe(rs, "MARRIAGE_DATE", "marriageDate", "MARIAGE_DT", "marriage date"));
            entity.setNumberOfChildren(getIntegerSafe(rs, "NUMBER_OF_CHILDREN", "numberOfChildren", "NO_CHILDREN"));
            entity.setPersonalEmail(getStringSafe(rs, "PERSONAL_EMAIL", "personalEmail", "EMAIL_ID"));
            // passport details removed to be migrated strictly through
            // migrateEmployeePassports
            entity.setNationality(getStringSafe(rs, "NATIONALITY", "nationality"));
            entity.setBloodGroup(getStringSafe(rs, "BLOOD_GROUP", "bloodGroup"));
            entity.setReligion(getStringSafe(rs, "RELIGION", "religion"));
            entity.setRegion(getStringSafe(rs, "REGION", "region", "Region"));
            entity.setHeight(getStringSafe(rs, "HEIGHT", "height"));
            entity.setWeight(getStringSafe(rs, "WEIGHT", "weight"));
            entity.setShirtSize(getStringSafe(rs, "SHIRT_SIZE", "shirtSize"));
            entity.setPantSize(getStringSafe(rs, "PANT_SIZE", "pantSize"));
            entity.setShoeSize(getStringSafe(rs, "SHOE_SIZE", "shoeSize"));
            entity.setInsuranceNumber(getStringSafe(rs, "INSURANCE_NUMBER", "insuranceNumber", "INSURANCE"));
            entity.setEsicNumber(getStringSafe(rs, "ESIC_NUMBER", "esicNumber", "ESIC_NO"));
            entity.setPfNumber(getStringSafe(rs, "PF_NUMBER", "pfNumber", "PF_NO"));
            entity.setInsuranceExpiryDate(
                    getTimestampSafe(rs, "INSURANCE_EXPIRY_DATE", "insuranceExpiryDate", "INSURANCE_EXP_DT"));
            entity.setUanNumber(getStringSafe(rs, "UAN_NUMBER", "uanNumber", "UAN_NO"));
            entity.setPanNumber(getStringSafe(rs, "PAN_NUMBER", "panNumber", "PAN_NO"));
            entity.setAadharNumber(getStringSafe(rs, "AADHAR_NUMBER", "aadharNumber", "AADHAR_NO"));
            entity.setDrivingLicenseNumber(
                    getStringSafe(rs, "DRIVING_LICENSE_NUMBER", "drivingLicenseNumber", "DRIVING_LIC_NO",
                            "LICENECE NO"));
            entity.setLicenseExpiryDate(
                    getTimestampSafe(rs, "LICENSE_EXPIRY_DATE", "licenseExpiryDate", "DRIVING_LIC_EXP_DT"));
            entity.setElectionCardNumber(
                    getStringSafe(rs, "ELECTION_CARD_NUMBER", "electionCardNumber", "ELECTION_CARD"));
            entity.setRationCardNumber(getStringSafe(rs, "RATION_CARD_NUMBER", "rationCardNumber", "RATION_CARD"));
            entity.setCompanyIssuedMobile(
                    getStringSafe(rs, "COMPANY_ISSUED_MOBILE", "companyIssuedMobile", "COMPANY_MOBILE_NO"));
            entity.setMobileDeduction(getBigDecimalSafe(rs, "MOBILE_DEDUCTION", "mobileDeduction", "MOB_DED"));
            entity.setCanteenAllowance(getBigDecimalSafe(rs, "CANTEEN_ALLOWANCE", "canteenAllowance", "CANTEEN_ALLOW"));
            entity.setLoanInstallmentMonth(
                    getStringSafe(rs, "LOAN_INSTALLMENT_MONTH", "loanInstallmentMonth", "LOAN INSTALLMENT AMOUNT"));
            entity.setIsActive(getBooleanSafe(rs, "IS_ACTIVE", "isActive"));
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return entity;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());
        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped. Migrated 0 records for HRMS_PERSONAL_DETAILS.";
        }

        java.util.Set<Long> validEmpIds = employeeMasterRepository.findAll().stream()
                .map(e -> e.getId()).filter(id -> id != null)
                .collect(java.util.stream.Collectors.toSet());
        List<EmployeePersonalDetail> toInsert = migratedList.stream()
                .filter(e -> e.getEmployeeId() != null && validEmpIds.contains(e.getEmployeeId()))
                .collect(Collectors.toList());
        int skipped = migratedList.size() - toInsert.size();

        int count = 0;
        if (!toInsert.isEmpty()) {
            java.util.List<Long> empIds = toInsert.stream().map(EmployeePersonalDetail::getEmployeeId)
                    .collect(Collectors.toList());
            employeePersonalDetailRepository.deleteByEmployeeIdIn(empIds);
            employeePersonalDetailRepository.saveAll(toInsert);
            count = toInsert.size();
        }
        return "Successfully migrated " + count + " records from HRMS_PERSONAL_DETAILS" +
                (skipped > 0 ? " (skipped " + skipped + " records with invalid/null employeeId)." : ".");
    }

    @Transactional
    public String migrateEmployeePassports(org.springframework.jdbc.core.JdbcTemplate migrationTemplate) {
        org.springframework.jdbc.core.JdbcTemplate jdbcTemplate = migrationTemplate != null ? migrationTemplate
                : this.jdbcTemplate;
        String currentUser = "SUPER BOSS";

        final String finalUserId = currentUser;
        codeToNewEmpIdMap = null;
        oldToNewEmpIdMap = null;
        initCodeToNewEmpIdMap();
        initOldToNewEmpIdMap();
        if (jdbcTemplate == null)
            return "Database not configured.";
        String sql = "SELECT * FROM HRMS_PASSPORT_DETAILS";
        List<EmployeePassport> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            EmployeePassport entity = new EmployeePassport();
            entity.setEmployeeId(resolveEmployeeId(rs));
            entity.setPassportNumber(getStringSafe(rs, "PASSPORT_NUMBER", "passportNumber", "PASSPORT"));
            entity.setPassportIssueCity(getStringSafe(rs, "PASSPORT_ISSUE_CITY", "passportIssueCity"));
            entity.setIssueDate(getTimestampSafe(rs, "ISSUE_DATE", "issueDate"));
            entity.setExpiryDate(getTimestampSafe(rs, "EXPIRY_DATE", "expiryDate"));
            entity.setComments(getStringSafe(rs, "COMMENTS", "comments"));
            entity.setIsActive(getBooleanSafe(rs, "IS_ACTIVE", "isActive"));
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return entity;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());
        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped. Migrated 0 records for HRMS_PASSPORT_DETAILS.";
        }

        java.util.Set<Long> validEmpIds = employeeMasterRepository.findAll().stream()
                .map(e -> e.getId()).filter(id -> id != null)
                .collect(java.util.stream.Collectors.toSet());
        List<EmployeePassport> toInsert = migratedList.stream()
                .filter(e -> e.getEmployeeId() != null && validEmpIds.contains(e.getEmployeeId()))
                .collect(Collectors.toList());
        int skipped = migratedList.size() - toInsert.size();

        int count = 0;
        if (!toInsert.isEmpty()) {
            java.util.List<Long> empIds = toInsert.stream().map(EmployeePassport::getEmployeeId)
                    .collect(Collectors.toList());
            employeePassportRepository.deleteByEmployeeIdIn(empIds);
            employeePassportRepository.saveAll(toInsert);
            count = toInsert.size();
        }
        return "Successfully migrated " + count + " records from HRMS_PASSPORT_DETAILS" +
                (skipped > 0 ? " (skipped " + skipped + " records with invalid/null employeeId)." : ".");
    }

    @Transactional
    public String migrateEmployeeKycDocuments(org.springframework.jdbc.core.JdbcTemplate migrationTemplate) {
        org.springframework.jdbc.core.JdbcTemplate jdbcTemplate = migrationTemplate != null ? migrationTemplate
                : this.jdbcTemplate;
        String currentUser = "SUPER BOSS";

        final String finalUserId = currentUser;
        codeToNewEmpIdMap = null;
        oldToNewEmpIdMap = null;
        initCodeToNewEmpIdMap();
        initOldToNewEmpIdMap();
        if (jdbcTemplate == null)
            return "Database not configured.";
        String sql = "SELECT * FROM HRMS_KYC_DOCUMENTS";
        List<EmployeeKycDocument> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            EmployeeKycDocument entity = new EmployeeKycDocument();
            entity.setEmployeeId(resolveEmployeeId(rs));
            entity.setSeqNo(getIntegerSafe(rs, "SEQ_NO", "seqNo"));
            entity.setDocumentName(getStringSafe(rs, "DOCUMENT_NAME", "documentName"));
            entity.setDocumentNumber(getStringSafe(rs, "DOCUMENT_NUMBER", "documentNumber"));
            entity.setAttachment(getStringSafe(rs, "ATTACHMENT", "attachment"));
            entity.setFileName(getStringSafe(rs, "FILE_NAME", "fileName"));
            entity.setIsActive(getBooleanSafe(rs, "IS_ACTIVE", "isActive"));
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return entity;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());
        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped. Migrated 0 records for HRMS_KYC_DOCUMENTS.";
        }

        java.util.Set<Long> validEmpIds = employeeMasterRepository.findAll().stream()
                .map(e -> e.getId()).filter(id -> id != null)
                .collect(java.util.stream.Collectors.toSet());
        List<EmployeeKycDocument> toInsert = migratedList.stream()
                .filter(e -> e.getEmployeeId() != null && validEmpIds.contains(e.getEmployeeId()))
                .collect(Collectors.toList());
        int skipped = migratedList.size() - toInsert.size();

        int count = 0;
        if (!toInsert.isEmpty()) {
            java.util.List<Long> empIds = toInsert.stream().map(EmployeeKycDocument::getEmployeeId)
                    .collect(java.util.stream.Collectors.toList());
            employeeKycDocumentRepository.deleteByEmployeeIdIn(empIds);
            employeeKycDocumentRepository.saveAll(toInsert);
            count = toInsert.size();
        }
        return "Successfully migrated " + count + " records from HRMS_KYC_DOCUMENTS" +
                (skipped > 0 ? " (skipped " + skipped + " records with invalid/null employeeId)." : ".");
    }

    @Transactional
    public String migrateEmployeeJobProfiles(org.springframework.jdbc.core.JdbcTemplate migrationTemplate) {
        org.springframework.jdbc.core.JdbcTemplate jdbcTemplate = migrationTemplate != null ? migrationTemplate
                : this.jdbcTemplate;
        String currentUser = "SUPER BOSS";

        final String finalUserId = currentUser;
        codeToNewEmpIdMap = null;
        oldToNewEmpIdMap = null;
        initCodeToNewEmpIdMap();
        initOldToNewEmpIdMap();
        if (jdbcTemplate == null)
            return "Database not configured.";
        String sql = "SELECT p.*, e.FIRST_NAME, e.LAST_NAME FROM HRMS_JOB_PROFILE p LEFT JOIN EMPLOYEE e ON p.EMP_CD = e.EMP_CD";
        List<EmployeeJobProfile> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            EmployeeJobProfile entity = new EmployeeJobProfile();
            entity.setEmployeeId(resolveEmployeeId(rs));
            entity.setWagesType(getStringSafe(rs, "WAGES_TYPE", "wagesType"));
            entity.setPaymentMode(getStringSafe(rs, "PAYMENT_MODE", "paymentMode", "PAY_MODE"));
            entity.setSalaryAccountNumber(getStringSafe(rs, "SALARY_ACCOUNT_NUMBER", "salaryAccountNumber", "ACC_NO"));

            String fName = getStringSafe(rs, "FIRST_NAME", "firstName");
            String lName = getStringSafe(rs, "LAST_NAME", "lastName");
            String accName = ((fName != null ? fName : "") + " " + (lName != null ? lName : "")).trim();
            entity.setAccountName(!accName.isEmpty() ? accName : null);

            entity.setBankAccountType(getStringSafe(rs, "BANK_ACCOUNT_TYPE", "bankAccountType", "Acc Type"));
            entity.setPersonalAccountNumber(
                    getStringSafe(rs, "PERSONAL_ACCOUNT_NUMBER", "personalAccountNumber", "PERSONAL_ACC_NO"));
            entity.setBankName(getStringSafe(rs, "BANK_NAME", "bankName"));
            entity.setIfscCode(getStringSafe(rs, "IFSC_CODE", "ifscCode"));
            entity.setBranchName(getStringSafe(rs, "BRANCH_NAME", "branchName", "BANK_BRANCH_NAME"));
            entity.setOfficeEmail(getStringSafe(rs, "OFFICE_EMAIL", "officeEmail", "OFF_EMAIL"));
            entity.setOfficialPassword(
                    getStringSafe(rs, "OFFICIAL_PASSWORD", "officialPassword", "OFFICIAL_USER_PASS"));
            entity.setIsActive(getBooleanSafe(rs, "IS_ACTIVE", "isActive"));
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);

            java.util.Map<String, Object> dynMap = new java.util.HashMap<>();
            dynMap.put("BASIC", getBigDecimalSafe(rs, "BASIC_SALARY", "basicSalary"));
            dynMap.put("DA", getBigDecimalSafe(rs, "DA", "da"));
            dynMap.put("HRA", getBigDecimalSafe(rs, "HRA", "hra"));
            dynMap.put("SPECIAL_ALLOWANCE", getBigDecimalSafe(rs, "SPECIAL_ALLOWANCE", "specialAllowance"));
            dynMap.put("performance_incentive", getBigDecimalSafe(rs, "PERFORMANCE_INCENTIVE", "performanceIncentive"));
            dynMap.put("canteenAllowance", getBigDecimalSafe(rs, "CANTEEN_ALLOWANCE", "canteenAllowance"));
            dynMap.put("PF_EMP", getBigDecimalSafe(rs, "PF_EMPLOYEE", "pfEmployee"));
            dynMap.put("ESI_EMP", getBigDecimalSafe(rs, "ESI_EMPLOYEE", "esiEmployee"));
            dynMap.put("PT", getBigDecimalSafe(rs, "PROFESSIONAL_TAX_AMOUNT", "professionalTaxAmount"));
            dynMap.put("GROSS", getBigDecimalSafe(rs, "GROSS_SALARY", "grossSalary"));
            dynMap.put("NET_SALARY", getBigDecimalSafe(rs, "NET_SALARY", "netSalary"));
            dynMap.put("monthlyCtc", getBigDecimalSafe(rs, "MONTHLY_CTC", "monthlyCtc"));
            dynMap.put("uniformAllowance", getBigDecimalSafe(rs, "UNIFORM_ALLOWANCE", "uniformAllowance"));
            dynMap.put("shoeAllowance", getBigDecimalSafe(rs, "SHOE_ALLOWANCE", "shoeAllowance"));
            dynMap.put("mobileAllowanceCug", getBigDecimalSafe(rs, "MOBILE_ALLOWANCE_CUG", "mobileAllowanceCug"));
            dynMap.put("employerPf", getBigDecimalSafe(rs, "EMPLOYER_PF", "employerPf"));
            dynMap.put("employerEsi", getBigDecimalSafe(rs, "EMPLOYER_ESI", "employerEsi"));
            dynMap.put("canteenDeduction", getBigDecimalSafe(rs, "CANTEEN_DEDUCTION", "canteenDeduction"));

            // Added from new table specs mapping
            dynMap.put("YRS_BONUS", getStringSafe(rs, "YRS_BONUS", "yrsBonus"));
            dynMap.put("CONV_VALUE", getBigDecimalSafe(rs, "CONV_VALUE", "convValue"));
            dynMap.put("OT_RESTRICT_TO", getBigDecimalSafe(rs, "OT_RESTRICT_TO", "otRestrictTo"));
            dynMap.put("basicCtc", getBigDecimalSafe(rs, "BASIC_CTC", "basicCtc"));
            dynMap.put("hraCtc", getBigDecimalSafe(rs, "HRA_CTC", "hraCtc"));
            dynMap.put("conveyanceCtc", getBigDecimalSafe(rs, "CONVEYANCE_CTC", "conveyanceCtc"));
            dynMap.put("medicalCtc", getBigDecimalSafe(rs, "MEDICAL_CTC", "medicalCtc"));
            dynMap.put("ltaCtc", getBigDecimalSafe(rs, "LTA_CTC", "ltaCtc"));
            dynMap.put("daCtc", getBigDecimalSafe(rs, "DA_CTC", "daCtc"));
            dynMap.put("specialAllowanceCtc", getBigDecimalSafe(rs, "SPECIAL_ALLOWANCE_CTC", "specialAllowanceCtc"));
            dynMap.put("performanceIncentiveCtc",
                    getBigDecimalSafe(rs, "PERFORMANCE_INCENTIVE_CTC", "performanceIncentiveCtc"));
            dynMap.put("esiCtc", getBigDecimalSafe(rs, "ESI_CTC", "esiCtc"));
            dynMap.put("pfCtc", getBigDecimalSafe(rs, "PF_CTC", "pfCtc"));
            dynMap.put("grossCtc", getBigDecimalSafe(rs, "GROSS_CTC", "grossCtc"));
            dynMap.put("annualCtc", getBigDecimalSafe(rs, "ANNUAL_CTC", "annualCtc"));
            dynMap.put("salaryCtc", getBigDecimalSafe(rs, "SALARY_CTC", "salaryCtc"));
            dynMap.put("gratuity", getBigDecimalSafe(rs, "GRATUITY", "gratuity"));
            dynMap.put("bonus", getBigDecimalSafe(rs, "BONUS", "bonus"));
            dynMap.put("specialIncentive", getBigDecimalSafe(rs, "SPECIAL_INCENTIVE", "specialIncentive"));
            dynMap.put("performanceLinkedIncentive",
                    getBigDecimalSafe(rs, "PERFORMANCE_LINKED_INCENTIVE", "performanceLinkedIncentive"));
            dynMap.put("healthInsurance", getBigDecimalSafe(rs, "HEALTH_INSURANCE", "healthInsurance"));

            try {
                entity.setDynamicComponents(
                        new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(dynMap));
            } catch (Exception e) {
                // ignore
            }

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return entity;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());
        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped. Migrated 0 records for HRMS_JOB_PROFILE.";
        }

        java.util.Set<Long> validEmpIds = employeeMasterRepository.findAll().stream()
                .map(e -> e.getId()).filter(id -> id != null)
                .collect(java.util.stream.Collectors.toSet());
        List<EmployeeJobProfile> toInsert = migratedList.stream()
                .filter(e -> e.getEmployeeId() != null && validEmpIds.contains(e.getEmployeeId()))
                .collect(Collectors.toList());
        int skipped = migratedList.size() - toInsert.size();

        int count = 0;
        if (!toInsert.isEmpty()) {
            java.util.List<Long> empIds = toInsert.stream().map(EmployeeJobProfile::getEmployeeId)
                    .collect(Collectors.toList());
            employeeJobProfileRepository.deleteByEmployeeIdIn(empIds);
            employeeJobProfileRepository.saveAll(toInsert);
            count = toInsert.size();
        }
        return "Successfully migrated " + count + " records from HRMS_JOB_PROFILE" +
                (skipped > 0 ? " (skipped " + skipped + " records with invalid/null employeeId)." : ".");
    }

    @Transactional
    public String migrateEmployeeEmergencyContacts(org.springframework.jdbc.core.JdbcTemplate migrationTemplate) {
        org.springframework.jdbc.core.JdbcTemplate jdbcTemplate = migrationTemplate != null ? migrationTemplate
                : this.jdbcTemplate;
        String currentUser = "SUPER BOSS";

        final String finalUserId = currentUser;
        codeToNewEmpIdMap = null;
        oldToNewEmpIdMap = null;
        initCodeToNewEmpIdMap();
        initOldToNewEmpIdMap();
        if (jdbcTemplate == null)
            return "Database not configured.";
        String sql = "SELECT * FROM HRMS_EMERGENCY_CONTACT";
        List<EmployeeEmergencyContact> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            EmployeeEmergencyContact entity = new EmployeeEmergencyContact();
            entity.setEmployeeId(resolveEmployeeId(rs));
            entity.setContactName(getStringSafe(rs, "CONTACT_NAME", "contactName"));
            entity.setRelation(getStringSafe(rs, "RELATION", "relation", "RELATION_SHIP"));
            entity.setAddress1(getStringSafe(rs, "ADDRESS1", "address1", "ADD1"));
            entity.setAddress2(getStringSafe(rs, "ADDRESS2", "address2", "ADD2", "ADD3"));
            entity.setMobileNumber(getStringSafe(rs, "MOBILE_NUMBER", "mobileNumber", "MOBILE"));
            entity.setHomePhoneNumber(
                    getStringSafe(rs, "HOME_PHONE_NUMBER", "homePhoneNumber", "HOME_PHONE", "WORK_PHONE"));
            entity.setIsActive(getBooleanSafe(rs, "IS_ACTIVE", "isActive"));
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return entity;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());
        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped. Migrated 0 records for HRMS_EMERGENCY_CONTACT.";
        }

        java.util.Set<Long> validEmpIds = employeeMasterRepository.findAll().stream()
                .map(e -> e.getId()).filter(id -> id != null)
                .collect(java.util.stream.Collectors.toSet());
        List<EmployeeEmergencyContact> toInsert = migratedList.stream()
                .filter(e -> e.getEmployeeId() != null && validEmpIds.contains(e.getEmployeeId()))
                .collect(Collectors.toList());
        int skipped = migratedList.size() - toInsert.size();

        int count = 0;
        if (!toInsert.isEmpty()) {
            java.util.List<Long> empIds = toInsert.stream().map(EmployeeEmergencyContact::getEmployeeId)
                    .collect(java.util.stream.Collectors.toList());
            employeeEmergencyContactRepository.deleteByEmployeeIdIn(empIds);
            employeeEmergencyContactRepository.saveAll(toInsert);
            count = toInsert.size();
        }
        return "Successfully migrated " + count + " records from HRMS_EMERGENCY_CONTACT" +
                (skipped > 0 ? " (skipped " + skipped + " records with invalid/null employeeId)." : ".");
    }

    @Transactional
    public String migrateEmployeeEducation(org.springframework.jdbc.core.JdbcTemplate migrationTemplate) {
        org.springframework.jdbc.core.JdbcTemplate jdbcTemplate = migrationTemplate != null ? migrationTemplate
                : this.jdbcTemplate;
        String currentUser = "SUPER BOSS";

        final String finalUserId = currentUser;
        codeToNewEmpIdMap = null;
        oldToNewEmpIdMap = null;
        initCodeToNewEmpIdMap();
        initOldToNewEmpIdMap();
        if (jdbcTemplate == null)
            return "Database not configured.";
        String sql = "SELECT * FROM HRMS_EDUCATION_DETAILS";
        List<EmployeeEducation> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            EmployeeEducation entity = new EmployeeEducation();
            entity.setEmployeeId(resolveEmployeeId(rs));
            entity.setEducation(getStringSafe(rs, "EDUCATION", "education", "QUALIFICATION"));
            entity.setInstitutionName(getStringSafe(rs, "INSTITUTION_NAME", "institutionName"));
            entity.setUniversity(getStringSafe(rs, "UNIVERSITY", "university")); // SPECIALIZATION NOT mapped here
            entity.setType(getStringSafe(rs, "TYPE", "type"));
            entity.setYearOfPassing(getStringSafe(rs, "YEAR_OF_PASSING", "yearOfPassing", "YEAR"));
            entity.setPercentageGrade(getStringSafe(rs, "PERCENTAGE_GRADE", "percentageGrade", "CLASS", "GRADE"));

            Long rowId = getLongSafe(rs, "ROW_ID", "rowId");
            String fileSql = "SELECT FILE_NAME FROM FILE_UPLOAD_TRANS WHERE FROM_WHERE = 'EMPLOYEE EDUCATION' AND REF_ROW_ID = "
                    + rowId;
            java.util.List<String> files = jdbcTemplate.queryForList(fileSql, String.class);
            String oldCert = (files != null && !files.isEmpty()) ? files.get(0)
                    : getStringSafe(rs, "DOCUMENTS", "certificateFile", "VIEW_DOCS", "UPLOAD_DOCS");

            String newCertPath = migrateEmployeeFile(oldCert, "EmpEducation",
                    "MASTER/HR/Employee/Employee Master/Education");
            entity.setCertificateFile(newCertPath != null ? newCertPath : oldCert);
            entity.setIsActive(getBooleanSafe(rs, "IS_ACTIVE", "isActive"));
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return entity;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());
        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped. Migrated 0 records for HRMS_EDUCATION_DETAILS.";
        }

        java.util.Set<Long> validEmpIds = employeeMasterRepository.findAll().stream()
                .map(e -> e.getId()).filter(id -> id != null)
                .collect(java.util.stream.Collectors.toSet());
        List<EmployeeEducation> toInsert = migratedList.stream()
                .filter(e -> e.getEmployeeId() != null && validEmpIds.contains(e.getEmployeeId()))
                .collect(Collectors.toList());
        int skipped = migratedList.size() - toInsert.size();

        int count = 0;
        if (!toInsert.isEmpty()) {
            java.util.List<Long> empIds = toInsert.stream().map(EmployeeEducation::getEmployeeId)
                    .collect(java.util.stream.Collectors.toList());
            employeeEducationRepository.deleteByEmployeeIdIn(empIds);
            employeeEducationRepository.saveAll(toInsert);
            count = toInsert.size();
        }
        try {
            java.util.List<EmployeeEducation> additionalEdu = new java.util.ArrayList<>();
            jdbcTemplate.query(
                    "SELECT REF_ROW_ID, FROM_WHERE, FILE_NAME FROM FILE_UPLOAD_TRANS WHERE FROM_WHERE = 'EMPLOYEE_MASTER'",
                    (rs) -> {
                        Long empCd = rs.getLong("REF_ROW_ID");
                        String fileName = rs.getString("FILE_NAME");
                        if (fileName != null && !fileName.trim().isEmpty() && !fileName.toLowerCase().contains("nda")) {
                            Long newEmpId = getMappedEmployeeId(empCd);
                            if (newEmpId != null) {
                                String newPath = migrateEmployeeFile(fileName, "EMPLOYEE_MASTER",
                                        "MASTER/HR/Employee/Employee Master");
                                if (newPath != null) {
                                    EmployeeEducation edu = new EmployeeEducation();
                                    edu.setEmployeeId(newEmpId);
                                    if (fileName.toLowerCase().contains("10th"))
                                        edu.setEducation("10th");
                                    else if (fileName.toLowerCase().contains("12th"))
                                        edu.setEducation("12th");
                                    else
                                        edu.setEducation("Other Certificate");
                                    edu.setCertificateFile(newPath);
                                    edu.setIsActive(true);
                                    edu.setCreatedBy(finalUserId);
                                    edu.setUpdatedBy(finalUserId);
                                    additionalEdu.add(edu);
                                }
                            }
                        }
                    });
            if (!additionalEdu.isEmpty()) {
                employeeEducationRepository.saveAll(additionalEdu);
                count += additionalEdu.size();
            }
        } catch (Exception e) {
            System.err.println("[MIGRATION WARNING] Failed to migrate additional education files: " + e.getMessage());
        }

        return "Successfully migrated " + count + " records from HRMS_EDUCATION_DETAILS" +
                (skipped > 0 ? " (skipped " + skipped + " records with invalid/null employeeId)." : ".");
    }

    @Transactional
    public String migrateEmployeeExperience(org.springframework.jdbc.core.JdbcTemplate migrationTemplate) {
        org.springframework.jdbc.core.JdbcTemplate jdbcTemplate = migrationTemplate != null ? migrationTemplate
                : this.jdbcTemplate;
        String currentUser = "SUPER BOSS";

        final String finalUserId = currentUser;
        codeToNewEmpIdMap = null;
        oldToNewEmpIdMap = null;
        initCodeToNewEmpIdMap();
        initOldToNewEmpIdMap();
        if (jdbcTemplate == null)
            return "Database not configured.";
        String sql = "SELECT * FROM HRMS_EXPERIENCE_SERVICE_DETAILS";
        List<EmployeeExperience> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            EmployeeExperience entity = new EmployeeExperience();
            entity.setEmployeeId(resolveEmployeeId(rs));
            entity.setCompanyName(getStringSafe(rs, "COMPANY_NAME", "companyName"));
            entity.setLocation(getStringSafe(rs, "LOCATION", "location"));
            entity.setFromDate(getTimestampSafe(rs, "FROM_DATE", "fromDate"));
            entity.setToDate(getTimestampSafe(rs, "TO_DATE", "toDate"));

            Double exp = getDoubleSafe(rs, "TOTAL_EXPERIENCE", "totalExperience");
            if (exp != null) {
                // if the value is less than 50, it is likely years, convert to months
                if (exp <= 50) {
                    entity.setTotalExperienceMonths((int) Math.round(exp * 12));
                } else {
                    entity.setTotalExperienceMonths((int) Math.round(exp));
                }
            }

            Long rowId = getLongSafe(rs, "ROW_ID", "rowId");
            String fileSql = "SELECT FILE_NAME FROM FILE_UPLOAD_TRANS WHERE FROM_WHERE = 'EMPLOYEE EXPERIENCE' AND REF_ROW_ID = "
                    + rowId;
            java.util.List<String> files = jdbcTemplate.queryForList(fileSql, String.class);
            String oldDocs = (files != null && !files.isEmpty()) ? files.get(0)
                    : getStringSafe(rs, "DOCUMENTS", "documents");

            String newDocsPath = migrateEmployeeFile(oldDocs, "EmpExperienceDts",
                    "MASTER/HR/Employee/Employee Master/Experience");
            entity.setDocuments(newDocsPath != null ? newDocsPath : oldDocs);
            entity.setIsActive(getBooleanSafe(rs, "IS_ACTIVE", "isActive"));
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return entity;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());
        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped. Migrated 0 records for HRMS_EXPERIENCE_SERVICE_DETAILS.";
        }

        java.util.Set<Long> validEmpIds = employeeMasterRepository.findAll().stream()
                .map(e -> e.getId()).filter(id -> id != null)
                .collect(java.util.stream.Collectors.toSet());
        List<EmployeeExperience> toInsert = migratedList.stream()
                .filter(e -> e.getEmployeeId() != null && validEmpIds.contains(e.getEmployeeId()))
                .collect(Collectors.toList());
        int skipped = migratedList.size() - toInsert.size();

        int count = 0;
        if (!toInsert.isEmpty()) {
            java.util.List<Long> empIds = toInsert.stream().map(EmployeeExperience::getEmployeeId)
                    .collect(java.util.stream.Collectors.toList());
            employeeExperienceRepository.deleteByEmployeeIdIn(empIds);
            employeeExperienceRepository.saveAll(toInsert);
            count = toInsert.size();
        }
        return "Successfully migrated " + count + " records from HRMS_EXPERIENCE_SERVICE_DETAILS" +
                (skipped > 0 ? " (skipped " + skipped + " records with invalid/null employeeId)." : ".");
    }

    @Transactional
    public String migrateEmployeeDependents(org.springframework.jdbc.core.JdbcTemplate migrationTemplate) {
        org.springframework.jdbc.core.JdbcTemplate jdbcTemplate = migrationTemplate != null ? migrationTemplate
                : this.jdbcTemplate;
        String currentUser = "SUPER BOSS";

        final String finalUserId = currentUser;
        codeToNewEmpIdMap = null;
        oldToNewEmpIdMap = null;
        initCodeToNewEmpIdMap();
        initOldToNewEmpIdMap();
        if (jdbcTemplate == null)
            return "Database not configured.";
        String sql = "SELECT * FROM HRMS_DEPENDENT_DETAILS";
        List<EmployeeDependent> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            EmployeeDependent entity = new EmployeeDependent();
            entity.setEmployeeId(resolveEmployeeId(rs));
            entity.setName(getStringSafe(rs, "RELATION_NAME", "name", "NAME"));
            entity.setGender(getStringSafe(rs, "GENDER", "gender"));
            entity.setDob(getTimestampSafe(rs, "DATE_OF_BIRTH", "dob", "BIRTH_DATE"));
            entity.setRelationship(getStringSafe(rs, "RELATIONSHIP", "relationship", "RELATION"));
            entity.setOccupation(getStringSafe(rs, "OCCUPATION", "occupation"));
            entity.setBloodGroup(getStringSafe(rs, "BLOOD_GROUP", "bloodGroup"));
            entity.setContactNo(getStringSafe(rs, "CONTACT_NUMBER1", "contactNo", "CONTACT_NO1"));
            entity.setIsActive(getBooleanSafe(rs, "IS_ACTIVE", "isActive"));
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);
            entity.setCreatedBy(finalUserId);
            entity.setUpdatedBy(finalUserId);

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return entity;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());
        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped. Migrated 0 records for HRMS_DEPENDENT_DETAILS.";
        }

        java.util.Set<Long> validEmpIds = employeeMasterRepository.findAll().stream()
                .map(e -> e.getId()).filter(id -> id != null)
                .collect(java.util.stream.Collectors.toSet());
        List<EmployeeDependent> toInsert = migratedList.stream()
                .filter(e -> e.getEmployeeId() != null && validEmpIds.contains(e.getEmployeeId()))
                .collect(Collectors.toList());
        int skipped = migratedList.size() - toInsert.size();

        int count = 0;
        if (!toInsert.isEmpty()) {
            java.util.List<Long> empIds = toInsert.stream().map(EmployeeDependent::getEmployeeId)
                    .collect(java.util.stream.Collectors.toList());
            employeeDependentRepository.deleteByEmployeeIdIn(empIds);
            employeeDependentRepository.saveAll(toInsert);
            count = toInsert.size();
        }
        return "Successfully migrated " + count + " records from HRMS_DEPENDENT_DETAILS" +
                (skipped > 0 ? " (skipped " + skipped + " records with invalid/null employeeId)." : ".");
    }

    @Transactional
    public String migrateHolidays() {
        if (jdbcTemplate == null) {
            return "Migration database not configured.";
        }

        String sql = "SELECT * FROM HRMS_HOLIDAY_MASTER";

        List<HrHolidayMaster> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            HrHolidayMaster holiday = new HrHolidayMaster();

            String holName = getStringSafe(rs, "HOLIDAY_REASON", "holiday_reason");
            holiday.setHolidayName(holName != null ? holName : "Unnamed Holiday");

            java.sql.Timestamp dateTs = getTimestampSafe(rs, "DATE", "date");
            if (dateTs != null) {
                holiday.setHolidayDate(dateTs.toLocalDateTime().toLocalDate());
            }

            String holType = getStringSafe(rs, "HOLIDAY_TYPE", "holiday_type");
            holiday.setHolidayType(holType != null ? holType : "GOVERNMENT");

            holiday.setCreatedBy(getStringSafe(rs, "CREAT_USER_ID_CD", "creat_user_id_cd", "CREATED_BY"));
            if (holiday.getCreatedBy() == null) {
                try {
                    holiday.setCreatedBy("SUPER BOSS");
                } catch (Exception e) {
                }
            }

            java.sql.Timestamp createdDate = getTimestampSafe(rs, "CREAT_DT", "creat_dt", "CREATED_DATE");
            holiday.setCreatedDate(createdDate != null ? createdDate : new java.util.Date());

            holiday.setUpdatedBy(getStringSafe(rs, "LST_UPDT_USER_ID_CD", "lst_updt_user_id_cd", "UPDATED_BY"));
            holiday.setUpdatedDate(getTimestampSafe(rs, "LST_UPDT_TS", "lst_updt_ts", "UPDATED_DATE"));

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return holiday;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped by user. Migrated 0 holiday records.";
        }

        int migratedCount = 0;
        if (!migratedList.isEmpty()) {
            List<HrHolidayMaster> existingAll = hrHolidayMasterRepository.findAll();
            for (HrHolidayMaster holiday : migratedList) {
                if (holiday.getHolidayDate() != null) {
                    boolean exists = existingAll.stream()
                            .anyMatch(e -> e.getHolidayDate() != null
                                    && e.getHolidayDate().equals(holiday.getHolidayDate()));

                    if (!exists) {
                        hrHolidayMasterRepository.save(holiday);
                        migratedCount++;
                    }
                }
            }
        }

        return "Successfully migrated " + migratedCount
                + " holiday records from HRMS_HOLIDAY_MASTER to HR_HOLIDAY_MASTER.";
    }

    public byte[] generateHolidaySampleExcel() {
        try (Workbook workbook = new XSSFWorkbook()) {
            // Sheet 1: Instructions
            Sheet instructionSheet = workbook.createSheet("Instructions");
            Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("Holiday Migration Instructions");

            Row instRow1 = instructionSheet.createRow(1);
            instRow1.createCell(0).setCellValue("1. Please fill the data in the 'Migration Record' sheet.");
            Row instRow2 = instructionSheet.createRow(2);
            instRow2.createCell(0).setCellValue("2. 'Holiday Name' is mandatory.");
            Row instRow3 = instructionSheet.createRow(3);
            instRow3.createCell(0)
                    .setCellValue("3. 'Holiday Date' should be a valid date (YYYY-MM-DD format is recommended).");
            Row instRow4 = instructionSheet.createRow(4);
            instRow4.createCell(0).setCellValue("4. 'Holiday Type' dropdown options: GOVERNMENT, COMPANY, CUSTOM.");
            Row instRow5 = instructionSheet.createRow(5);
            instRow5.createCell(0).setCellValue("5. 'Status' has a dropdown. Please select Active or Inactive.");

            instructionSheet.autoSizeColumn(0);

            // Sheet 2: Migration Record
            Sheet sheet = workbook.createSheet("Migration Record");

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row headerRow = sheet.createRow(0);
            String[] headers = { "Sl.No", "Holiday Name", "Holiday Date", "Holiday Type", "Applicable To",
                    "Is Optional", "Status" };
            for (int i = 0; i < headers.length; i++) {
                Cell h = headerRow.createCell(i);
                h.setCellValue(headers[i]);
                h.setCellStyle(headerStyle);
            }

            // Date formatting
            CellStyle dateStyle = workbook.createCellStyle();
            CreationHelper createHelper = workbook.getCreationHelper();
            dateStyle.setDataFormat(createHelper.createDataFormat().getFormat("yyyy-mm-dd"));
            sheet.setDefaultColumnStyle(2, dateStyle);

            Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue(1);
            sampleRow.createCell(1).setCellValue("New Year");
            Cell dateCell = sampleRow.createCell(2);
            dateCell.setCellValue(java.time.LocalDate.of(2024, 1, 1));
            dateCell.setCellStyle(dateStyle);
            sampleRow.createCell(3).setCellValue("COMPANY");
            sampleRow.createCell(4).setCellValue("ALL");
            sampleRow.createCell(5).setCellValue("NO");
            sampleRow.createCell(6).setCellValue("ACTIVE");

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            DataValidationHelper validationHelper = sheet.getDataValidationHelper();

            DataValidationConstraint dateConstraint = validationHelper.createDateConstraint(
                    DataValidationConstraint.OperatorType.BETWEEN, "Date(1900, 1, 1)", "Date(2100, 12, 31)",
                    "yyyy-mm-dd");
            sheet.addValidationData(
                    validationHelper.createValidation(dateConstraint, new CellRangeAddressList(1, 1000, 2, 2)));

            // Type dropdown
            DataValidationConstraint typeConstraint = validationHelper
                    .createExplicitListConstraint(new String[] { "GOVERNMENT", "COMPANY", "CUSTOM" });
            CellRangeAddressList typeAddressList = new CellRangeAddressList(1, 1000, 3, 3);
            sheet.addValidationData(validationHelper.createValidation(typeConstraint, typeAddressList));

            // Applicable To dropdown
            DataValidationConstraint applicableConstraint = validationHelper
                    .createExplicitListConstraint(new String[] { "ALL", "SPECIFIC" });
            CellRangeAddressList applicableAddressList = new CellRangeAddressList(1, 1000, 4, 4);
            sheet.addValidationData(validationHelper.createValidation(applicableConstraint, applicableAddressList));

            // Is Optional dropdown
            DataValidationConstraint optionalConstraint = validationHelper
                    .createExplicitListConstraint(new String[] { "YES", "NO" });
            CellRangeAddressList optionalAddressList = new CellRangeAddressList(1, 1000, 5, 5);
            sheet.addValidationData(validationHelper.createValidation(optionalConstraint, optionalAddressList));

            // Status dropdown
            DataValidationConstraint statusConstraint = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            CellRangeAddressList statusAddressList = new CellRangeAddressList(1, 1000, 6, 6);
            sheet.addValidationData(validationHelper.createValidation(statusConstraint, statusAddressList));

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Holiday sample Excel: " + e.getMessage());
        }
    }

    @Transactional
    public java.util.Map<String, Object> migrateHolidaysFromExcel(MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(1); // Read from Migration Record sheet

            Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(1) == null
                    || headerRow.getCell(1).getCellType() != CellType.STRING
                    || !"Holiday Name".equalsIgnoreCase(headerRow.getCell(1).getStringCellValue().trim())) {
                throw new IllegalArgumentException(
                        "Invalid Excel template uploaded. Expected 'Holiday Name' in column 2. Please download the correct Holiday template.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            List<HrHolidayMaster> existingAll = hrHolidayMasterRepository.findAll();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                Cell nameCell = row.getCell(1);
                if (nameCell == null || nameCell.getCellType() == CellType.BLANK)
                    continue;
                String holidayName = nameCell.getCellType() == CellType.STRING ? nameCell.getStringCellValue().trim()
                        : String.valueOf(nameCell.getNumericCellValue());

                Cell dateCell = row.getCell(2);
                LocalDate holidayDate = null;
                if (dateCell != null) {
                    if (dateCell.getCellType() == CellType.NUMERIC
                            && org.apache.poi.ss.usermodel.DateUtil.isCellDateFormatted(dateCell)) {
                        holidayDate = dateCell.getDateCellValue().toInstant().atZone(java.time.ZoneId.systemDefault())
                                .toLocalDate();
                    } else if (dateCell.getCellType() == CellType.STRING) {
                        try {
                            holidayDate = LocalDate.parse(dateCell.getStringCellValue().trim());
                        } catch (Exception e) {
                        }
                    }
                }

                if (holidayDate == null) {
                    java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                    rowDetail.put("holidayName", holidayName);
                    rowDetail.put("holidayDate", "");
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", "Invalid or missing Holiday Date");
                    failedCount++;
                    details.add(rowDetail);
                    continue;
                }

                String type = "COMPANY";
                Cell typeCell = row.getCell(3);
                if (typeCell != null && typeCell.getCellType() == CellType.STRING) {
                    type = typeCell.getStringCellValue().trim();
                }

                String applicableTo = "ALL";
                Cell appCell = row.getCell(4);
                if (appCell != null && appCell.getCellType() == CellType.STRING) {
                    applicableTo = appCell.getStringCellValue().trim();
                }

                boolean isOptional = false;
                Cell optCell = row.getCell(5);
                if (optCell != null && optCell.getCellType() == CellType.STRING) {
                    isOptional = "YES".equalsIgnoreCase(optCell.getStringCellValue().trim());
                }

                String status = "ACTIVE";
                Cell statusCell = row.getCell(6);
                if (statusCell != null && statusCell.getCellType() == CellType.STRING) {
                    status = statusCell.getStringCellValue().trim();
                }

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("holidayName", holidayName);
                rowDetail.put("holidayDate", holidayDate.toString());
                rowDetail.put("holidayType", type);
                rowDetail.put("status", status);

                LocalDate finalHolidayDate = holidayDate;
                boolean exists = existingAll.stream()
                        .anyMatch(d -> d.getHolidayDate() != null && d.getHolidayDate().equals(finalHolidayDate));

                if (exists) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", "Holiday Date already exists");
                    failedCount++;
                } else {
                    HrHolidayMaster h = new HrHolidayMaster();
                    h.setHolidayName(holidayName);
                    h.setFromDate(holidayDate);
                    h.setHolidayDate(holidayDate);
                    h.setHolidayType(type);
                    h.setApplicableTo(applicableTo);
                    h.setIsOptional(isOptional);
                    h.setIsActive("ACTIVE".equalsIgnoreCase(status));

                    hrHolidayMasterRepository.save(h);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " holiday records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    @Transactional
    public String clearHolidays() {
        hrHolidayMasterRepository.deleteAllInBatch();
        return "Cleared all holiday records.";
    }

    public String migrateLoans() {
        if (jdbcTemplate == null) {
            return "Migration database not configured.";
        }

        String sql = "SELECT * FROM HRMS_LOAN_MASTER";

        List<HrLoanMaster> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            HrLoanMaster loan = new HrLoanMaster();

            String loanCode = getStringSafe(rs, "LOAN_CODE", "loan_code");
            loan.setLoanCode(loanCode != null ? loanCode : "UNKNOWN");

            String loanName = getStringSafe(rs, "LOAN_NAME", "loan_name");
            loan.setLoanName(loanName != null ? loanName : "Unnamed Loan");

            Double minLimit = getDoubleSafe(rs, "MIN_LIMIT", "min_limit");
            loan.setMinLimit(minLimit != null ? minLimit : 0.0);

            Double maxLimit = getDoubleSafe(rs, "MAX_LIMIT", "max_limit");
            loan.setMaxLimit(maxLimit != null ? maxLimit : 0.0);

            loan.setRemarks(getStringSafe(rs, "COMMENTS", "comments"));

            loan.setCreatedBy(getStringSafe(rs, "CREAT_USER_ID_CD", "creat_user_id_cd", "CREATED_BY"));
            if (loan.getCreatedBy() == null) {
                try {
                    loan.setCreatedBy("SUPER BOSS");
                } catch (Exception e) {
                }
            }

            java.sql.Timestamp createdDate = getTimestampSafe(rs, "CREAT_DT", "creat_dt", "CREATED_DATE");
            loan.setCreatedDate(createdDate != null ? createdDate : new java.util.Date());

            loan.setUpdatedBy(getStringSafe(rs, "LST_UPDT_USER_ID_CD", "lst_updt_user_id_cd", "UPDATED_BY"));
            loan.setUpdatedDate(getTimestampSafe(rs, "LST_UPDT_TS", "lst_updt_ts", "UPDATED_DATE"));

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return loan;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped by user. Migrated 0 loan records.";
        }

        int migratedCount = 0;
        if (!migratedList.isEmpty()) {
            List<HrLoanMaster> existingAll = hrLoanMasterRepository.findAll();
            for (HrLoanMaster loan : migratedList) {
                if (loan.getLoanCode() != null && !loan.getLoanCode().isEmpty()) {
                    boolean exists = existingAll.stream()
                            .anyMatch(e -> e.getLoanCode().equalsIgnoreCase(loan.getLoanCode()));

                    if (!exists) {
                        hrLoanMasterRepository.save(loan);
                        migratedCount++;
                    }
                }
            }
        }

        return "Successfully migrated " + migratedCount
                + " loan records from HRMS_LOAN_MASTER to HR_LOAN_MASTER.";
    }

    @Transactional
    public String clearLoans() {
        hrLoanMasterRepository.deleteAllInBatch();
        return "Cleared all loan records.";
    }

    @Transactional
    public String migratePermissions() {
        if (jdbcTemplate == null) {
            return "Migration database not configured.";
        }

        String sql = "SELECT * FROM HRMS_PERMISSION_DETAILS";

        List<PermissionEntry> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            PermissionEntry entry = new PermissionEntry();

            Long empId = resolveEmployeeId(rs);
            if (empId == null)
                return null; // Can't migrate without valid employee
            entry.setEmployeeId(empId);

            java.sql.Timestamp permDateTs = getTimestampSafe(rs, "PERMISSION_DATE", "permission_date");
            if (permDateTs != null) {
                entry.setPermissionDate(new java.util.Date(permDateTs.getTime()));
                java.time.LocalDate localDate = permDateTs.toLocalDateTime().toLocalDate();
                entry.setMonth(localDate.getMonth().name().substring(0, 1).toUpperCase()
                        + localDate.getMonth().name().substring(1).toLowerCase());
                entry.setYear(localDate.getYear());
            } else {
                return null; // Date is required
            }

            entry.setFromTime(getStringSafe(rs, "FROM_TIME", "from_time"));
            entry.setToTime(getStringSafe(rs, "TO_TIME", "to_time"));

            String diffTime = getStringSafe(rs, "DIFF_TIME", "diff_time");
            entry.setActualDuration(diffTime != null ? diffTime : "0");

            try {
                entry.setConsideredDuration(new java.math.BigDecimal(diffTime != null ? diffTime : "0"));
            } catch (Exception e) {
                entry.setConsideredDuration(java.math.BigDecimal.ZERO);
            }

            entry.setReason(getStringSafe(rs, "REASON_PERMISSION", "reason_permission"));

            entry.setStatusId(10022L);

            entry.setRejectionReason(getStringSafe(rs, "REJECT_REASON", "reject_reason"));

            entry.setCreatedBy(getStringSafe(rs, "CREAT_USER_ID_CD", "creat_user_id_cd", "CREATED_BY"));
            java.sql.Timestamp createdDate = getTimestampSafe(rs, "CREAT_DT", "creat_dt", "CREATED_DATE");
            entry.setCreatedDate(
                    createdDate != null ? new java.util.Date(createdDate.getTime()) : new java.util.Date());

            entry.setUpdatedBy(getStringSafe(rs, "LST_UPDT_USER_ID_CD", "lst_updt_user_id_cd", "UPDATED_BY"));
            java.sql.Timestamp updatedDate = getTimestampSafe(rs, "LST_UPDT_TS", "lst_updt_ts", "UPDATED_DATE");
            if (updatedDate != null) {
                entry.setUpdatedDate(new java.util.Date(updatedDate.getTime()));
            }

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return entry;
        });

        migratedList = migratedList.stream().filter(t -> t != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped by user. Migrated 0 permission records.";
        }

        int count = 0;
        if (!migratedList.isEmpty()) {
            permissionEntryRepository.saveAll(migratedList);
            count = migratedList.size();
        }

        return "Successfully migrated " + count
                + " permission records from HRMS_PERMISSION_DETAILS to HR_PERMISSION_DETAILS.";
    }

    @Transactional
    public String clearPermissions() {
        permissionEntryRepository.deleteAllInBatch();
        return "Cleared all permission records.";
    }

    @Transactional
    public String migrateUserCredentials() {
        String currentUser = "SUPER BOSS";

        final String finalUserId = currentUser;
        codeToNewEmpIdMap = null;
        oldToNewEmpIdMap = null;
        initCodeToNewEmpIdMap();
        initOldToNewEmpIdMap();
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }

        String sql = "SELECT * FROM ERP_USER";

        List<UserCredential> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            // Skip GUEST users as instructed â€” only migrate STATUS != 'GUEST' and
            // GUEST_USER != 'Yes'
            String guestFlag = getStringSafe(rs, "GUEST_USER", "guestUser");
            String statusStr = getStringSafe(rs, "STATUS", "status");
            if ("Yes".equalsIgnoreCase(guestFlag) || "GUEST".equalsIgnoreCase(statusStr)) {
                return null;
            }

            UserCredential cred = new UserCredential();

            String userId = getStringSafe(rs, "USER_ID", "userId");
            if (userId == null || userId.isEmpty()) {
                return null;
            }
            cred.setUserId(userId);

            // Resolve empId
            Long empId = resolveEmployeeId(rs);
            cred.setEmpId(empId);

            // Pass
            String pass = getStringSafe(rs, "PASS", "pass");
            cred.setPassword(pass != null ? passwordEncoder.encode(pass) : passwordEncoder.encode(""));

            // Status: If STATUS is "ACTIVE", set 1, else 0
            cred.setStatus("ACTIVE".equalsIgnoreCase(statusStr) ? 1 : 0);

            // Role mapping -> User Level
            String roleName = getStringSafe(rs, "ROLE_NAME", "roleName");
            if ("SUPER BOSS".equalsIgnoreCase(roleName)) {
                cred.setUserLevel(5);
            } else if ("Manager".equalsIgnoreCase(roleName)) {
                cred.setUserLevel(1);
            } else {
                cred.setUserLevel(0);
            }

            cred.setTenantId("AUTONOMA");
            cred.setIsActive("ACTIVE".equalsIgnoreCase(statusStr));
            cred.setAuthMethod("PASSWORD");
            cred.setAutoLogoutOnFaceAbsence(0);

            try {
                cred.setCreatedBy("SUPER BOSS");
            } catch (Exception e) {
                cred.setCreatedBy("SUPER BOSS");
            }

            cred.setCreatedDate(new java.util.Date());

            if (MasterChecklistMigrationService.stopFlag.get())
                return null;
            return cred;
        });

        migratedList = migratedList.stream().filter(c -> c != null).collect(Collectors.toList());

        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped by user. Migrated 0 user credential records.";
        }

        int migratedCount = 0;
        if (!migratedList.isEmpty()) {
            List<UserCredential> existingAll = userRepository.findAll();
            java.util.Set<String> existingUserIds = existingAll.stream()
                    .map(u -> u.getUserId().trim().toLowerCase())
                    .collect(Collectors.toSet());

            for (UserCredential cred : migratedList) {
                if (cred.getUserId() != null && !cred.getUserId().isEmpty()) {
                    if (!existingUserIds.contains(cred.getUserId().trim().toLowerCase())) {
                        userRepository.save(cred);
                        migratedCount++;
                    }
                }
            }
        }

        return "Successfully migrated " + migratedCount
                + " user credential records from ERP_USER to AD_USER_CREDENTIAL.";
    }

    @Transactional
    public String clearUserCredentials() {
        List<UserCredential> all = userRepository.findAll();
        int clearedCount = 0;
        for (UserCredential cred : all) {
            String uid = cred.getUserId().trim();
            if (!uid.equalsIgnoreCase("SUPER BOSS")) {
                userRepository.delete(cred);
                clearedCount++;
            }
        }
        return "Successfully cleared all migrated user credential records.";
    }

    public byte[] generateLoanSampleExcel() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet instructionSheet = workbook.createSheet("Instructions");
            Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("Loan Master Migration Instructions");

            instructionSheet.createRow(1).createCell(0)
                    .setCellValue("1. Fill the data in the 'Migration Record' sheet.");
            instructionSheet.createRow(2).createCell(0).setCellValue("2. 'Loan Code' and 'Loan Name' are mandatory.");
            instructionSheet.createRow(3).createCell(0)
                    .setCellValue("3. 'Min Limit' and 'Max Limit' should be valid numbers.");
            instructionSheet.createRow(4).createCell(0).setCellValue("4. 'Status' should be Active or Inactive.");
            instructionSheet.autoSizeColumn(0);

            Sheet sheet = workbook.createSheet("Migration Record");
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row headerRow = sheet.createRow(0);
            String[] headers = { "Sl.No", "Loan Code", "Loan Name", "Min Limit", "Max Limit", "Remarks", "Status" };
            for (int i = 0; i < headers.length; i++) {
                Cell h = headerRow.createCell(i);
                h.setCellValue(headers[i]);
                h.setCellStyle(headerStyle);
            }

            Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue(1);
            sampleRow.createCell(1).setCellValue("PL01");
            sampleRow.createCell(2).setCellValue("Personal Loan");
            sampleRow.createCell(3).setCellValue(1000.0);
            sampleRow.createCell(4).setCellValue(500000.0);
            sampleRow.createCell(5).setCellValue("Standard personal loan policy");
            sampleRow.createCell(6).setCellValue("ACTIVE");

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            DataValidationConstraint statusConstraint = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            sheet.addValidationData(
                    validationHelper.createValidation(statusConstraint, new CellRangeAddressList(1, 1000, 6, 6)));

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Loan sample Excel: " + e.getMessage());
        }
    }

    @Transactional
    public java.util.Map<String, Object> migrateLoansFromExcel(MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(1);

            Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(1) == null
                    || headerRow.getCell(1).getCellType() != CellType.STRING
                    || !"Loan Code".equalsIgnoreCase(headerRow.getCell(1).getStringCellValue().trim())) {
                throw new IllegalArgumentException(
                        "Invalid Excel template uploaded. Expected 'Loan Code' in column 2. Please download the correct Loan template.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            List<HrLoanMaster> existingAll = hrLoanMasterRepository.findAll();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                Cell codeCell = row.getCell(1);
                if (codeCell == null || codeCell.getCellType() == CellType.BLANK)
                    continue;
                String loanCode = codeCell.getCellType() == CellType.STRING ? codeCell.getStringCellValue().trim()
                        : String.valueOf((int) codeCell.getNumericCellValue());

                Cell nameCell = row.getCell(2);
                String loanName = nameCell != null && nameCell.getCellType() == CellType.STRING
                        ? nameCell.getStringCellValue().trim()
                        : loanCode;

                Cell minCell = row.getCell(3);
                Double minLimit = minCell != null && minCell.getCellType() == CellType.NUMERIC
                        ? minCell.getNumericCellValue()
                        : 0.0;

                Cell maxCell = row.getCell(4);
                Double maxLimit = maxCell != null && maxCell.getCellType() == CellType.NUMERIC
                        ? maxCell.getNumericCellValue()
                        : 0.0;

                Cell remarkCell = row.getCell(5);
                String remarks = remarkCell != null && remarkCell.getCellType() == CellType.STRING
                        ? remarkCell.getStringCellValue().trim()
                        : null;

                Cell statusCell = row.getCell(6);
                boolean isActive = statusCell == null || statusCell.getCellType() != CellType.STRING
                        || !"INACTIVE".equalsIgnoreCase(statusCell.getStringCellValue().trim());

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("loanCode", loanCode);
                rowDetail.put("loanName", loanName);
                rowDetail.put("status", isActive ? "ACTIVE" : "INACTIVE");

                boolean exists = existingAll.stream()
                        .anyMatch(d -> d.getLoanCode() != null && d.getLoanCode().equalsIgnoreCase(loanCode));

                if (exists) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", "Loan Code already exists");
                    failedCount++;
                } else {
                    HrLoanMaster h = new HrLoanMaster();
                    h.setLoanCode(loanCode);
                    h.setLoanName(loanName);
                    h.setMinLimit(minLimit);
                    h.setMaxLimit(maxLimit);
                    h.setRemarks(remarks);
                    h.setIsActive(isActive);

                    hrLoanMasterRepository.save(h);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " loan records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generateMonthSampleExcel() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet instructionSheet = workbook.createSheet("Instructions");
            Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("Month Master Migration Instructions");

            instructionSheet.createRow(1).createCell(0)
                    .setCellValue("1. Fill the data in the 'Migration Record' sheet.");
            instructionSheet.createRow(2).createCell(0)
                    .setCellValue("2. 'Month Type' (e.g. REGULAR or HR), 'Month Name', and 'Seq No' are mandatory.");
            instructionSheet.createRow(3).createCell(0).setCellValue("3. 'Status' should be Active or Inactive.");
            instructionSheet.autoSizeColumn(0);

            Sheet sheet = workbook.createSheet("Migration Record");
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row headerRow = sheet.createRow(0);
            String[] headers = { "Sl.No", "Month Type", "Month Name", "Seq No", "Status" };
            for (int i = 0; i < headers.length; i++) {
                Cell h = headerRow.createCell(i);
                h.setCellValue(headers[i]);
                h.setCellStyle(headerStyle);
            }

            Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue(1);
            sampleRow.createCell(1).setCellValue("REGULAR");
            sampleRow.createCell(2).setCellValue("January");
            sampleRow.createCell(3).setCellValue(1);
            sampleRow.createCell(4).setCellValue("ACTIVE");

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            DataValidationConstraint typeConstraint = validationHelper
                    .createExplicitListConstraint(new String[] { "REGULAR", "HR" });
            sheet.addValidationData(
                    validationHelper.createValidation(typeConstraint, new CellRangeAddressList(1, 1000, 1, 1)));

            DataValidationConstraint statusConstraint = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            sheet.addValidationData(
                    validationHelper.createValidation(statusConstraint, new CellRangeAddressList(1, 1000, 4, 4)));

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Month sample Excel: " + e.getMessage());
        }
    }

    @Transactional
    public java.util.Map<String, Object> migrateMonthsFromExcel(MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(1);

            Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(1) == null
                    || headerRow.getCell(1).getCellType() != CellType.STRING
                    || !"Month Type".equalsIgnoreCase(headerRow.getCell(1).getStringCellValue().trim())) {
                throw new IllegalArgumentException(
                        "Invalid Excel template uploaded. Expected 'Month Type' in column 2. Please download the correct Month template.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            List<HrMonthMaster> existingAll = hrMonthMasterRepository.findAll();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                Cell typeCell = row.getCell(1);
                if (typeCell == null || typeCell.getCellType() == CellType.BLANK)
                    continue;
                String monthType = typeCell.getCellType() == CellType.STRING ? typeCell.getStringCellValue().trim()
                        : "REGULAR";

                Cell nameCell = row.getCell(2);
                String monthName = nameCell != null && nameCell.getCellType() == CellType.STRING
                        ? nameCell.getStringCellValue().trim()
                        : "Unknown";

                Cell seqCell = row.getCell(3);
                Integer seqNo = seqCell != null && seqCell.getCellType() == CellType.NUMERIC
                        ? (int) seqCell.getNumericCellValue()
                        : 0;

                Cell statusCell = row.getCell(4);
                boolean isActive = statusCell == null || statusCell.getCellType() != CellType.STRING
                        || !"INACTIVE".equalsIgnoreCase(statusCell.getStringCellValue().trim());

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("monthName", monthName);
                rowDetail.put("monthType", monthType);
                rowDetail.put("status", isActive ? "ACTIVE" : "INACTIVE");

                boolean exists = existingAll.stream()
                        .anyMatch(d -> d.getMonthName() != null && d.getMonthName().equalsIgnoreCase(monthName)
                                && d.getMonthType() != null && d.getMonthType().equalsIgnoreCase(monthType));

                if (exists) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", "Month Name already exists for this Type");
                    failedCount++;
                } else {
                    HrMonthMaster h = new HrMonthMaster();
                    h.setMonthType(monthType);
                    h.setMonthName(monthName);
                    h.setSeqNo(seqNo);
                    h.setIsActive(isActive);

                    hrMonthMasterRepository.save(h);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " month records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generatePetrolAllowanceSampleExcel() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet instructionSheet = workbook.createSheet("Instructions");
            Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("Petrol Allowance Migration Instructions");

            instructionSheet.createRow(1).createCell(0)
                    .setCellValue("1. Fill the data in the 'Migration Record' sheet.");
            instructionSheet.createRow(2).createCell(0).setCellValue("2. 'Vehicle Type' is mandatory.");
            instructionSheet.createRow(3).createCell(0).setCellValue("3. Provide rates as valid decimal numbers.");
            instructionSheet.createRow(4).createCell(0).setCellValue("4. 'Status' should be Active or Inactive.");
            instructionSheet.autoSizeColumn(0);

            Sheet sheet = workbook.createSheet("Migration Record");
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row headerRow = sheet.createRow(0);
            String[] headers = { "Sl.No", "Vehicle Type", "From Rate", "To Rate", "Rate 2-Wheeler", "Rate 4-Wheeler",
                    "Status" };
            for (int i = 0; i < headers.length; i++) {
                Cell h = headerRow.createCell(i);
                h.setCellValue(headers[i]);
                h.setCellStyle(headerStyle);
            }

            Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue(1);
            sampleRow.createCell(1).setCellValue("Standard");
            sampleRow.createCell(2).setCellValue(10.50);
            sampleRow.createCell(3).setCellValue(20.00);
            sampleRow.createCell(4).setCellValue(5.00);
            sampleRow.createCell(5).setCellValue(15.00);
            sampleRow.createCell(6).setCellValue("ACTIVE");

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            DataValidationConstraint statusConstraint = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            sheet.addValidationData(
                    validationHelper.createValidation(statusConstraint, new CellRangeAddressList(1, 1000, 6, 6)));

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Petrol Allowance sample Excel: " + e.getMessage());
        }
    }

    @Transactional
    public java.util.Map<String, Object> migratePetrolAllowancesFromExcel(MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(1);

            Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(1) == null
                    || headerRow.getCell(1).getCellType() != CellType.STRING
                    || !"Vehicle Type".equalsIgnoreCase(headerRow.getCell(1).getStringCellValue().trim())) {
                throw new IllegalArgumentException(
                        "Invalid Excel template uploaded. Expected 'Vehicle Type' in column 2. Please download the correct Petrol Allowance template.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            List<HrPetrolAllowanceMaster> existingAll = hrPetrolAllowanceMasterRepository.findAll();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                Cell typeCell = row.getCell(1);
                if (typeCell == null || typeCell.getCellType() == CellType.BLANK)
                    continue;
                String vehicleType = typeCell.getCellType() == CellType.STRING ? typeCell.getStringCellValue().trim()
                        : String.valueOf((int) typeCell.getNumericCellValue());

                Cell fromCell = row.getCell(2);
                java.math.BigDecimal fromRate = fromCell != null && fromCell.getCellType() == CellType.NUMERIC
                        ? new java.math.BigDecimal(fromCell.getNumericCellValue())
                        : new java.math.BigDecimal("0.0");

                Cell toCell = row.getCell(3);
                java.math.BigDecimal toRate = toCell != null && toCell.getCellType() == CellType.NUMERIC
                        ? new java.math.BigDecimal(toCell.getNumericCellValue())
                        : new java.math.BigDecimal("0.0");

                Cell twoCell = row.getCell(4);
                java.math.BigDecimal rateTwoWheeler = twoCell != null && twoCell.getCellType() == CellType.NUMERIC
                        ? new java.math.BigDecimal(twoCell.getNumericCellValue())
                        : new java.math.BigDecimal("0.0");

                Cell fourCell = row.getCell(5);
                java.math.BigDecimal rateFourWheeler = fourCell != null && fourCell.getCellType() == CellType.NUMERIC
                        ? new java.math.BigDecimal(fourCell.getNumericCellValue())
                        : new java.math.BigDecimal("0.0");

                Cell statusCell = row.getCell(6);
                boolean isActive = statusCell == null || statusCell.getCellType() != CellType.STRING
                        || !"INACTIVE".equalsIgnoreCase(statusCell.getStringCellValue().trim());

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("vehicleType", vehicleType);
                rowDetail.put("status", isActive ? "ACTIVE" : "INACTIVE");

                boolean exists = existingAll.stream()
                        .anyMatch(d -> d.getVehicleType() != null && d.getVehicleType().equalsIgnoreCase(vehicleType));

                if (exists) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", "Vehicle Type already exists");
                    failedCount++;
                } else {
                    HrPetrolAllowanceMaster h = new HrPetrolAllowanceMaster();
                    h.setVehicleType(vehicleType);
                    h.setFromRate(fromRate);
                    h.setToRate(toRate);
                    h.setRateTwoWheeler(rateTwoWheeler);
                    h.setRateFourWheeler(rateFourWheeler);
                    h.setIsActive(isActive);

                    hrPetrolAllowanceMasterRepository.save(h);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " petrol allowance records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generateShiftSampleExcel() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet instructionSheet = workbook.createSheet("Instructions");
            Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("Shift Master Migration Instructions");

            instructionSheet.createRow(1).createCell(0)
                    .setCellValue("1. Fill the data in the 'Migration Record' sheet.");
            instructionSheet.createRow(2).createCell(0).setCellValue("2. 'Shift Code' and 'Shift Name' are mandatory.");
            instructionSheet.createRow(3).createCell(0)
                    .setCellValue("3. 'Start Time' and 'End Time' format should be HH:MM.");
            instructionSheet.createRow(4).createCell(0).setCellValue("4. 'Status' should be Active or Inactive.");
            instructionSheet.autoSizeColumn(0);

            Sheet sheet = workbook.createSheet("Migration Record");
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row headerRow = sheet.createRow(0);
            String[] headers = { "Sl.No", "Shift Code", "Shift Name", "Start Time", "End Time", "Break Minutes",
                    "Grace Minutes", "Standard Hours", "Is Night Shift", "Status" };
            for (int i = 0; i < headers.length; i++) {
                Cell h = headerRow.createCell(i);
                h.setCellValue(headers[i]);
                h.setCellStyle(headerStyle);
            }

            Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue(1);
            sampleRow.createCell(1).setCellValue("S1");
            sampleRow.createCell(2).setCellValue("Morning Shift");
            sampleRow.createCell(3).setCellValue("09:00");
            sampleRow.createCell(4).setCellValue("18:00");
            sampleRow.createCell(5).setCellValue(60);
            sampleRow.createCell(6).setCellValue(15);
            sampleRow.createCell(7).setCellValue(8.00);
            sampleRow.createCell(8).setCellValue("NO");
            sampleRow.createCell(9).setCellValue("ACTIVE");

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            DataValidationConstraint ynConstraint = validationHelper
                    .createExplicitListConstraint(new String[] { "YES", "NO" });
            sheet.addValidationData(
                    validationHelper.createValidation(ynConstraint, new CellRangeAddressList(1, 1000, 8, 8)));

            DataValidationConstraint statusConstraint = validationHelper
                    .createExplicitListConstraint(new String[] { "ACTIVE", "INACTIVE" });
            sheet.addValidationData(
                    validationHelper.createValidation(statusConstraint, new CellRangeAddressList(1, 1000, 9, 9)));

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Shift sample Excel: " + e.getMessage());
        }
    }

    @Transactional
    public java.util.Map<String, Object> migrateShiftsFromExcel(MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(1);

            Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(1) == null
                    || headerRow.getCell(1).getCellType() != CellType.STRING
                    || !"Shift Code".equalsIgnoreCase(headerRow.getCell(1).getStringCellValue().trim())) {
                throw new IllegalArgumentException(
                        "Invalid Excel template uploaded. Expected 'Shift Code' in column 2. Please download the correct Shift template.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            List<ShiftMaster> existingAll = shiftMasterRepository.findAll();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                Cell codeCell = row.getCell(1);
                if (codeCell == null || codeCell.getCellType() == CellType.BLANK)
                    continue;
                String shiftCode = codeCell.getCellType() == CellType.STRING ? codeCell.getStringCellValue().trim()
                        : String.valueOf((int) codeCell.getNumericCellValue());

                Cell nameCell = row.getCell(2);
                String shiftName = nameCell != null && nameCell.getCellType() == CellType.STRING
                        ? nameCell.getStringCellValue().trim()
                        : shiftCode;

                Cell startCell = row.getCell(3);
                String startTime = startCell != null && startCell.getCellType() == CellType.STRING
                        ? startCell.getStringCellValue().trim()
                        : "00:00";

                Cell endCell = row.getCell(4);
                String endTime = endCell != null && endCell.getCellType() == CellType.STRING
                        ? endCell.getStringCellValue().trim()
                        : "00:00";

                Cell breakCell = row.getCell(5);
                Integer breakMinutes = breakCell != null && breakCell.getCellType() == CellType.NUMERIC
                        ? (int) breakCell.getNumericCellValue()
                        : 0;

                Cell graceCell = row.getCell(6);
                Integer graceMinutes = graceCell != null && graceCell.getCellType() == CellType.NUMERIC
                        ? (int) graceCell.getNumericCellValue()
                        : 0;

                Cell stdCell = row.getCell(7);
                java.math.BigDecimal standardHours = stdCell != null && stdCell.getCellType() == CellType.NUMERIC
                        ? new java.math.BigDecimal(stdCell.getNumericCellValue())
                        : new java.math.BigDecimal("0.0");

                Cell nightCell = row.getCell(8);
                boolean isNightShift = nightCell != null && nightCell.getCellType() == CellType.STRING
                        && "YES".equalsIgnoreCase(nightCell.getStringCellValue().trim());

                Cell statusCell = row.getCell(9);
                boolean isActive = statusCell == null || statusCell.getCellType() != CellType.STRING
                        || !"INACTIVE".equalsIgnoreCase(statusCell.getStringCellValue().trim());

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("shiftCode", shiftCode);
                rowDetail.put("shiftName", shiftName);
                rowDetail.put("status", isActive ? "ACTIVE" : "INACTIVE");

                boolean exists = existingAll.stream()
                        .anyMatch(d -> d.getShiftCode() != null && d.getShiftCode().equalsIgnoreCase(shiftCode));

                if (exists) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", "Shift Code already exists");
                    failedCount++;
                } else {
                    ShiftMaster h = new ShiftMaster();
                    h.setShiftCode(shiftCode);
                    h.setShiftName(shiftName);
                    h.setStartTime(startTime);
                    h.setEndTime(endTime);
                    h.setBreakMinutes(breakMinutes);
                    h.setGraceMinutes(graceMinutes);
                    h.setStandardHours(standardHours);
                    h.setIsNightShift(isNightShift);
                    h.setIsActive(isActive);

                    shiftMasterRepository.save(h);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " shift records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    public byte[] generatePermissionSampleExcel() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet instructionSheet = workbook.createSheet("Instructions");
            Row instHeaderRow = instructionSheet.createRow(0);
            instHeaderRow.createCell(0).setCellValue("Permission Entry Migration Instructions");

            instructionSheet.createRow(1).createCell(0)
                    .setCellValue("1. Fill the data in the 'Migration Record' sheet.");
            instructionSheet.createRow(2).createCell(0)
                    .setCellValue("2. 'Employee Code' and 'Permission Date' are mandatory.");
            instructionSheet.createRow(3).createCell(0)
                    .setCellValue("3. 'From Time' and 'To Time' format should be HH:MM.");
            instructionSheet.createRow(4).createCell(0).setCellValue("4. Date format should be YYYY-MM-DD.");
            instructionSheet.autoSizeColumn(0);

            Sheet sheet = workbook.createSheet("Migration Record");
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row headerRow = sheet.createRow(0);
            String[] headers = { "Sl.No", "Employee Code", "Permission Date", "From Time", "To Time",
                    "Considered Duration", "Reason", "Request Type", "Status" };
            for (int i = 0; i < headers.length; i++) {
                Cell h = headerRow.createCell(i);
                h.setCellValue(headers[i]);
                h.setCellStyle(headerStyle);
            }

            // Date formatting
            CellStyle dateStyle = workbook.createCellStyle();
            CreationHelper createHelper = workbook.getCreationHelper();
            dateStyle.setDataFormat(createHelper.createDataFormat().getFormat("yyyy-mm-dd"));
            sheet.setDefaultColumnStyle(2, dateStyle);

            Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue(1);
            sampleRow.createCell(1).setCellValue("EMP001");
            Cell dateCell = sampleRow.createCell(2);
            dateCell.setCellValue(java.time.LocalDate.of(2024, 5, 15));
            dateCell.setCellStyle(dateStyle);
            sampleRow.createCell(3).setCellValue("10:00");
            sampleRow.createCell(4).setCellValue("12:00");
            sampleRow.createCell(5).setCellValue(2.0);
            sampleRow.createCell(6).setCellValue("Doctor Appointment");
            sampleRow.createCell(7).setCellValue("Personal");
            sampleRow.createCell(8).setCellValue("Approved");

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            DataValidationHelper validationHelper = sheet.getDataValidationHelper();
            DataValidationConstraint dateConstraint = validationHelper.createDateConstraint(
                    DataValidationConstraint.OperatorType.BETWEEN, "Date(1900, 1, 1)", "Date(2100, 12, 31)",
                    "yyyy-mm-dd");
            sheet.addValidationData(
                    validationHelper.createValidation(dateConstraint, new CellRangeAddressList(1, 1000, 2, 2)));

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Permission sample Excel: " + e.getMessage());
        }
    }

    @Transactional
    public java.util.Map<String, Object> migratePermissionsFromExcel(MultipartFile file) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "File is empty");
            return response;
        }
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(1);

            Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getCell(1) == null
                    || headerRow.getCell(1).getCellType() != CellType.STRING
                    || !"Employee Code".equalsIgnoreCase(headerRow.getCell(1).getStringCellValue().trim())) {
                throw new IllegalArgumentException(
                        "Invalid Excel template uploaded. Expected 'Employee Code' in column 2. Please download the correct Permission template.");
            }

            java.util.List<java.util.Map<String, String>> details = new java.util.ArrayList<>();
            int migratedCount = 0;
            int failedCount = 0;

            initCodeToNewEmpIdMap();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                Cell codeCell = row.getCell(1);
                if (codeCell == null || codeCell.getCellType() == CellType.BLANK)
                    continue;
                String empCode = codeCell.getCellType() == CellType.STRING ? codeCell.getStringCellValue().trim()
                        : String.valueOf((long) codeCell.getNumericCellValue());

                Long employeeId = codeToNewEmpIdMap.get(empCode);

                Cell dateCell = row.getCell(2);
                java.util.Date permissionDate = null;
                if (dateCell != null) {
                    if (dateCell.getCellType() == CellType.NUMERIC) {
                        permissionDate = dateCell.getDateCellValue();
                    } else if (dateCell.getCellType() == CellType.STRING) {
                        try {
                            permissionDate = new java.text.SimpleDateFormat("yyyy-MM-dd")
                                    .parse(dateCell.getStringCellValue().trim());
                        } catch (Exception ignored) {
                        }
                    }
                }

                Cell fromCell = row.getCell(3);
                String fromTime = fromCell != null && fromCell.getCellType() == CellType.STRING
                        ? fromCell.getStringCellValue().trim()
                        : "00:00";

                Cell toCell = row.getCell(4);
                String toTime = toCell != null && toCell.getCellType() == CellType.STRING
                        ? toCell.getStringCellValue().trim()
                        : "00:00";

                Cell durationCell = row.getCell(5);
                java.math.BigDecimal consideredDuration = durationCell != null
                        && durationCell.getCellType() == CellType.NUMERIC
                                ? new java.math.BigDecimal(durationCell.getNumericCellValue())
                                : new java.math.BigDecimal("0.0");

                Cell reasonCell = row.getCell(6);
                String reason = reasonCell != null && reasonCell.getCellType() == CellType.STRING
                        ? reasonCell.getStringCellValue().trim()
                        : "";

                Cell typeCell = row.getCell(7);
                String requestType = typeCell != null && typeCell.getCellType() == CellType.STRING
                        ? typeCell.getStringCellValue().trim()
                        : "";

                Cell statusCell = row.getCell(8);
                String status = statusCell != null && statusCell.getCellType() == CellType.STRING
                        ? statusCell.getStringCellValue().trim()
                        : "Pending for Verify";

                java.util.Map<String, String> rowDetail = new java.util.HashMap<>();
                rowDetail.put("employeeCode", empCode);

                if (employeeId == null) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", "Employee Code not found");
                    failedCount++;
                } else if (permissionDate == null) {
                    rowDetail.put("migrationStatus", "FAILED");
                    rowDetail.put("reason", "Invalid Permission Date");
                    failedCount++;
                } else {
                    PermissionEntry entry = new PermissionEntry();
                    entry.setEmployeeId(employeeId);
                    entry.setPermissionDate(permissionDate);
                    entry.setFromTime(fromTime);
                    entry.setToTime(toTime);
                    entry.setActualDuration(String.valueOf(consideredDuration));
                    entry.setConsideredDuration(consideredDuration);
                    entry.setReason(reason);
                    entry.setRequestType(requestType);
                    entry.setStatusId(10022L);

                    java.util.Calendar cal = java.util.Calendar.getInstance();
                    cal.setTime(permissionDate);
                    entry.setMonth(new java.text.SimpleDateFormat("MMMM").format(permissionDate));
                    entry.setYear(cal.get(java.util.Calendar.YEAR));

                    permissionEntryRepository.save(entry);

                    rowDetail.put("migrationStatus", "SUCCESS");
                    rowDetail.put("reason", "Migrated successfully");
                    migratedCount++;
                }
                details.add(rowDetail);
            }

            response.put("message", "Successfully migrated " + migratedCount + " permission records from Excel.");
            response.put("migratedCount", migratedCount);
            response.put("failedCount", failedCount);
            response.put("details", details);

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    @Transactional
    public String clearInterviewCriteria() {
        try {
            // Delete mappings first due to FK constraints
            primaryJdbcTemplate.execute("DELETE FROM HR_INTERVIEW_DEPARTMENT_MAPPING");
            primaryJdbcTemplate.execute("DELETE FROM HR_INTERVIEW_LEVEL_MAPPING");

            // Delete physical attachment files and mappings
            List<String> attachmentPaths = primaryJdbcTemplate.queryForList(
                    "SELECT PATH FROM HR_ATTACHMENT_PATH WHERE PAGE_CODE = 'M2110'", String.class);
            for (String p : attachmentPaths) {
                if (p != null && !p.trim().isEmpty()) {
                    fileService.deleteFile(p.trim());
                }
            }
            primaryJdbcTemplate.execute("DELETE FROM HR_ATTACHMENT_PATH WHERE PAGE_CODE = 'M2110'");

            int deleted = primaryJdbcTemplate.update("DELETE FROM HR_INTERVIEW");
            try {
                primaryJdbcTemplate.execute("DBCC CHECKIDENT ('HR_INTERVIEW', RESEED, 0)");
            } catch (Exception ignore) {
            }
            try {
                primaryJdbcTemplate.execute("DBCC CHECKIDENT ('HR_INTERVIEW_DEPARTMENT_MAPPING', RESEED, 0)");
            } catch (Exception ignore) {
            }
            try {
                primaryJdbcTemplate.execute("DBCC CHECKIDENT ('HR_INTERVIEW_LEVEL_MAPPING', RESEED, 0)");
            } catch (Exception ignore) {
            }
            return "Successfully cleared " + deleted + " interview criteria records and associated files/mappings.";
        } catch (Exception e) {
            throw new RuntimeException("Failed to clear interview criteria: " + e.getMessage(), e);
        }
    }

    @Transactional
    public String migrateInterviewCriteria() {
        if (jdbcTemplate == null) {
            return "Migration database not configured.";
        }

        // Clear existing data to support clean re-runs
        clearInterviewCriteria();

        // 1. Fetch department mapping lookup (DEPARTMENT_NO -> HR_DEPARTMENT.ID)
        // Source DEPT_NO (String) is matched against HR_DEPARTMENT.DEPARTMENT_NO
        // to fetch the correct primary key ID for department mapping.
        List<com.autonoma.erp.modules.hr.orgstructure.entity.Department> depts = departmentRepository.findAll();
        java.util.Map<String, Long> deptNoToIdMap = depts.stream()
                .filter(d -> d.getDepartmentNo() != null && !d.getDepartmentNo().trim().isEmpty())
                .collect(Collectors.toMap(
                        d -> d.getDepartmentNo().trim(),
                        com.autonoma.erp.modules.hr.orgstructure.entity.Department::getId,
                        (a, b) -> a));

        // 2. Fetch designation level mapping lookup (LEVEL -> ROW_ID)
        List<DesignationLevel> lvls = designationLevelRepository.findAll();
        java.util.Map<String, Long> lvlToIdMap = lvls.stream()
                .filter(l -> l.getLevel() != null && !l.getLevel().trim().isEmpty())
                .collect(Collectors.toMap(
                        l -> l.getLevel().trim(),
                        DesignationLevel::getRowId,
                        (a, b) -> a));

        // 3. Query source table
        String sql = "SELECT * FROM INTERVIEW_CRITERIA_MASTER";

        java.util.concurrent.atomic.AtomicInteger migratedCount = new java.util.concurrent.atomic.AtomicInteger(0);
        java.util.concurrent.atomic.AtomicInteger attachmentCount = new java.util.concurrent.atomic.AtomicInteger(0);

        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertInterviewSql = "INSERT INTO HR_INTERVIEW (ID, CRITERIA_DETAILS, ANSWER, LEVEL_CODES, INTERVIEW_ROUND, ATTACHMENT_REQUIRED, INTERVIEW_ATTACHMENT, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            String insertDeptMappingSql = "INSERT INTO HR_INTERVIEW_DEPARTMENT_MAPPING (INTERVIEW_ID, DEPARTMENT_ID, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES (?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)";
            String insertLvlMappingSql = "INSERT INTO HR_INTERVIEW_LEVEL_MAPPING (INTERVIEW_ID, LEVEL_ID, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES (?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)";
            String insertAttSql = "INSERT INTO HR_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES ('M2110', ?, 'INTERVIEW CRITERIA', ?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)";

            try (java.sql.Statement stmt = conn.createStatement()) {
                stmt.execute("SET IDENTITY_INSERT HR_INTERVIEW ON");
            } catch (java.sql.SQLException e) {
                System.err.println(
                        "[MIGRATION ERROR] Failed to set IDENTITY_INSERT ON for HR_INTERVIEW: " + e.getMessage());
            }

            try (java.sql.PreparedStatement psInterview = conn.prepareStatement(insertInterviewSql);
                    java.sql.PreparedStatement psDeptMap = conn.prepareStatement(insertDeptMappingSql);
                    java.sql.PreparedStatement psLvlMap = conn.prepareStatement(insertLvlMappingSql);
                    java.sql.PreparedStatement psAtt = conn.prepareStatement(insertAttSql)) {

                jdbcTemplate.query(sql, (rs) -> {
                    long rowId = rs.getLong("ROW_ID");
                    String criteriaDetails = getStringSafe(rs, "CRITERIA_MASTER");
                    if (criteriaDetails == null || criteriaDetails.trim().isEmpty()) {
                        return; // Skip invalid criteria
                    }

                    String answer = getStringSafe(rs, "ANSWER");
                    if (answer == null || answer.trim().isEmpty()) {
                        answer = "-"; // Default fallback since it is non-nullable in target
                    }

                    String levelCodes = getStringSafe(rs, "LEVEL");
                    String interviewRound = getStringSafe(rs, "INTERVIEW_ROUND");
                    String attRequired = getStringSafe(rs, "ATTACHMENT_REQUIRED");
                    if (attRequired == null || attRequired.trim().isEmpty()) {
                        attRequired = "NO";
                    }

                    String status = getStringSafe(rs, "STATUS");
                    if (status == null || status.trim().isEmpty()) {
                        status = "ACTIVE";
                    }
                    boolean isActive = "ACTIVE".equalsIgnoreCase(status);

                    String createdBy = "SUPER BOSS";
                    java.sql.Timestamp createdDate = getTimestampSafe(rs, "CREATE_DATE");
                    if (createdDate == null) {
                        createdDate = new java.sql.Timestamp(System.currentTimeMillis());
                    }
                    String updatedBy = "SUPER BOSS";
                    java.sql.Timestamp updatedDate = getTimestampSafe(rs, "LST_UPDT_TS");

                    // 4. File attachments from FILE_UPLOAD_TRANS (FROM_WHERE = 'INTERVIEW
                    // CRITERIA')
                    String firstFileLogicalPath = null;
                    String fileSql = "SELECT FILE_NAME FROM FILE_UPLOAD_TRANS WHERE FROM_WHERE = 'INTERVIEW CRITERIA' AND REF_ROW_ID = "
                            + rowId;
                    List<String> files = jdbcTemplate.queryForList(fileSql, String.class);
                    for (String fName : files) {
                        if (fName == null || fName.trim().isEmpty()) {
                            continue;
                        }
                        fName = fName.trim();

                        // Copy file physically
                        try {
                            java.io.File sourceFile = new java.io.File(getSecondaryProcessImgLocation() + "\\CRITERIA",
                                    fName);
                            if (sourceFile.exists()) {
                                java.nio.file.Path rootPath = fileService.getRootPath();
                                java.io.File targetDir = rootPath
                                        .resolve(AppUtil.BosDocConstants.MASTER_HR_ATS_INTERVIEW_CRITERIA_MASTER_PATH)
                                        .toFile();
                                if (!targetDir.exists()) {
                                    targetDir.mkdirs();
                                }
                                java.io.File targetFile = new java.io.File(targetDir, fName);
                                java.nio.file.Files.copy(sourceFile.toPath(), targetFile.toPath(),
                                        java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                                System.out.println("[CRITERIA MIGRATION] SUCCESS: Copied "
                                        + sourceFile.getAbsolutePath() + " to " + targetFile.getAbsolutePath());
                            } else {
                                System.err.println("[CRITERIA MIGRATION] FAILED: Source file not found: "
                                        + sourceFile.getAbsolutePath());
                            }
                        } catch (Exception e) {
                            System.err.println(
                                    "[CRITERIA MIGRATION] File copy exception for " + fName + ": " + e.getMessage());
                        }

                        // Insert QMS_ATTACHMENT_PATH
                        try {
                            String logicalPath = AppUtil.BosDocConstants.MASTER_HR_ATS_INTERVIEW_CRITERIA_MASTER_PATH
                                    + "/" + fName;
                            if (firstFileLogicalPath == null) {
                                firstFileLogicalPath = logicalPath;
                            }
                            psAtt.setLong(1, rowId);
                            psAtt.setString(2, logicalPath);
                            psAtt.setString(3, fName);
                            psAtt.executeUpdate();
                            attachmentCount.incrementAndGet();
                        } catch (Exception e) {
                            System.err.println("[CRITERIA MIGRATION] DB insert failed for attachment " + fName + ": "
                                    + e.getMessage());
                        }
                    }

                    // Save HR_INTERVIEW
                    psInterview.setLong(1, rowId);
                    psInterview.setString(2, criteriaDetails);
                    psInterview.setString(3, answer);
                    psInterview.setString(4, levelCodes);
                    psInterview.setString(5, interviewRound);
                    psInterview.setString(6, attRequired);
                    psInterview.setString(7, firstFileLogicalPath); // Sets the interviewAttachment field
                    psInterview.setBoolean(8, isActive);
                    psInterview.setString(9, createdBy);
                    psInterview.setTimestamp(10, createdDate);
                    psInterview.setString(11, updatedBy);
                    psInterview.setTimestamp(12, updatedDate);
                    psInterview.executeUpdate();

                    // 5. Save Department Mappings
                    String deptNoRaw = getStringSafe(rs, "DEPT_NO");
                    if (deptNoRaw != null) {
                        for (String part : deptNoRaw.split(",")) {
                            String dNo = part.trim().replace(",", "");
                            if (dNo.isEmpty())
                                continue;
                            Long deptId = deptNoToIdMap.get(dNo);
                            if (deptId != null) {
                                try {
                                    psDeptMap.setLong(1, rowId);
                                    psDeptMap.setLong(2, deptId);
                                    psDeptMap.executeUpdate();
                                } catch (Exception e) {
                                    System.err.println("[CRITERIA MIGRATION] Department mapping failed for Row: "
                                            + rowId + ", DeptNo: " + dNo + ": " + e.getMessage());
                                }
                            }
                        }
                    }

                    // 6. Save Level Mappings
                    if (levelCodes != null) {
                        for (String part : levelCodes.split(",")) {
                            String lCode = part.trim();
                            if (lCode.isEmpty())
                                continue;
                            Long lvlId = lvlToIdMap.get(lCode);
                            if (lvlId != null) {
                                try {
                                    psLvlMap.setLong(1, rowId);
                                    psLvlMap.setLong(2, lvlId);
                                    psLvlMap.executeUpdate();
                                } catch (Exception e) {
                                    System.err.println("[CRITERIA MIGRATION] Level mapping failed for Row: " + rowId
                                            + ", Level: " + lCode + ": " + e.getMessage());
                                }
                            }
                        }
                    }

                    migratedCount.incrementAndGet();
                });

            } finally {
                try (java.sql.Statement stmt = conn.createStatement()) {
                    stmt.execute("SET IDENTITY_INSERT HR_INTERVIEW OFF");
                } catch (java.sql.SQLException e) {
                    System.err.println(
                            "[MIGRATION ERROR] Failed to set IDENTITY_INSERT OFF for HR_INTERVIEW: " + e.getMessage());
                }
            }
            return null;
        });

        return "Successfully migrated " + migratedCount.get() + " interview criteria records and "
                + attachmentCount.get() + " files.";
    }

    @Transactional
    public String clearInductionCriteria() {
        try {
            // Delete mappings first due to FK constraints
            primaryJdbcTemplate.execute("DELETE FROM HR_INDUCTION_DEPARTMENT_MAPPING");
            primaryJdbcTemplate.execute("DELETE FROM HR_INDUCTION_LEVEL_MAPPING");

            // Delete physical attachment files and mappings
            List<String> attachmentPaths = primaryJdbcTemplate.queryForList(
                    "SELECT PATH FROM HR_ATTACHMENT_PATH WHERE PAGE_CODE = 'M2140'", String.class);
            for (String p : attachmentPaths) {
                if (p != null && !p.trim().isEmpty()) {
                    fileService.deleteFile(p.trim());
                }
            }
            primaryJdbcTemplate.execute("DELETE FROM HR_ATTACHMENT_PATH WHERE PAGE_CODE = 'M2140'");

            int deleted = primaryJdbcTemplate.update("DELETE FROM HR_INDUCTION");
            try {
                primaryJdbcTemplate.execute("DBCC CHECKIDENT ('HR_INDUCTION', RESEED, 0)");
            } catch (Exception ignore) {
            }
            try {
                primaryJdbcTemplate.execute("DBCC CHECKIDENT ('HR_INDUCTION_DEPARTMENT_MAPPING', RESEED, 0)");
            } catch (Exception ignore) {
            }
            try {
                primaryJdbcTemplate.execute("DBCC CHECKIDENT ('HR_INDUCTION_LEVEL_MAPPING', RESEED, 0)");
            } catch (Exception ignore) {
            }
            return "Successfully cleared " + deleted + " induction criteria records and associated files/mappings.";
        } catch (Exception e) {
            throw new RuntimeException("Failed to clear induction criteria: " + e.getMessage(), e);
        }
    }

    @Transactional
    public String migrateInductionCriteria() {
        if (jdbcTemplate == null) {
            return "Migration database not configured.";
        }

        // Clear existing data to support clean re-runs
        clearInductionCriteria();

        // 1. Fetch department mapping lookup (DEPARTMENT_NO -> ID)
        List<com.autonoma.erp.modules.hr.orgstructure.entity.Department> depts = departmentRepository.findAll();
        java.util.Map<String, Long> deptNoToIdMap = depts.stream()
                .filter(d -> d.getDepartmentNo() != null && !d.getDepartmentNo().trim().isEmpty())
                .collect(Collectors.toMap(
                        d -> d.getDepartmentNo().trim(),
                        com.autonoma.erp.modules.hr.orgstructure.entity.Department::getId,
                        (a, b) -> a));

        // 2. Fetch designation level mapping lookup (LEVEL -> ROW_ID)
        List<DesignationLevel> lvls = designationLevelRepository.findAll();
        java.util.Map<String, Long> lvlToIdMap = lvls.stream()
                .filter(l -> l.getLevel() != null && !l.getLevel().trim().isEmpty())
                .collect(Collectors.toMap(
                        l -> l.getLevel().trim(),
                        DesignationLevel::getRowId,
                        (a, b) -> a));

        // 3. Fetch induction round mapping lookup (ROUND_CODE -> ID)
        java.util.Map<String, Long> roundToIdMap = primaryJdbcTemplate.query(
                "SELECT ID, ROUND_CODE FROM HR_INDUCTION_ROUND",
                (rs, rowNum) -> new Object[] { rs.getString("ROUND_CODE").trim().toUpperCase(), rs.getLong("ID") })
                .stream().collect(Collectors.toMap(
                        obj -> (String) obj[0],
                        obj -> (Long) obj[1],
                        (a, b) -> a));

        // 4. Query source table
        String sql = "SELECT * FROM INDUCTION_CRITERIA_MASTER";

        java.util.concurrent.atomic.AtomicInteger migratedCount = new java.util.concurrent.atomic.AtomicInteger(0);
        java.util.concurrent.atomic.AtomicInteger attachmentCount = new java.util.concurrent.atomic.AtomicInteger(0);

        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertInductionSql = "INSERT INTO HR_INDUCTION (ID, INDUCTION_DETAILS, ANSWER, INDUCTION_ROUND_ID, ATTACHMENT_REQUIRED, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE, IS_ACTIVE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            String insertDeptMappingSql = "INSERT INTO HR_INDUCTION_DEPARTMENT_MAPPING (INDUCTION_ID, DEPARTMENT_ID, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES (?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)";
            String insertLvlMappingSql = "INSERT INTO HR_INDUCTION_LEVEL_MAPPING (INDUCTION_ID, LEVEL_ID, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES (?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)";
            String insertAttSql = "INSERT INTO HR_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES ('M2140', ?, 'INDUCTION_ATTACHMENT', ?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)";

            try (java.sql.Statement stmt = conn.createStatement()) {
                stmt.execute("SET IDENTITY_INSERT HR_INDUCTION ON");
            } catch (java.sql.SQLException e) {
                System.err.println(
                        "[MIGRATION ERROR] Failed to set IDENTITY_INSERT ON for HR_INDUCTION: " + e.getMessage());
            }

            try (java.sql.PreparedStatement psInduction = conn.prepareStatement(insertInductionSql);
                    java.sql.PreparedStatement psDeptMap = conn.prepareStatement(insertDeptMappingSql);
                    java.sql.PreparedStatement psLvlMap = conn.prepareStatement(insertLvlMappingSql);
                    java.sql.PreparedStatement psAtt = conn.prepareStatement(insertAttSql)) {

                jdbcTemplate.query(sql, (rs) -> {
                    long rowId = rs.getLong("ROW_ID");
                    String inductionDetails = getStringSafe(rs, "INDUCTION_MASTER");
                    if (inductionDetails == null || inductionDetails.trim().isEmpty()) {
                        return; // Skip invalid criteria
                    }

                    String answer = getStringSafe(rs, "ANSWER");
                    if (answer == null || answer.trim().isEmpty()) {
                        answer = "-"; // Default fallback
                    }

                    String levelCodes = getStringSafe(rs, "LEVEL");
                    String inductionRound = getStringSafe(rs, "INDUCTION_ROUND");
                    Long roundId = null;
                    if (inductionRound != null && !inductionRound.trim().isEmpty()) {
                        roundId = roundToIdMap.get(inductionRound.trim().toUpperCase());
                    }

                    String attRequired = getStringSafe(rs, "ATTACHMENT_REQUIRED");
                    if (attRequired == null || attRequired.trim().isEmpty()) {
                        attRequired = "NO";
                    }

                    String status = getStringSafe(rs, "STATUS");
                    if (status == null || status.trim().isEmpty()) {
                        status = "ACTIVE";
                    }
                    boolean isActive = "ACTIVE".equalsIgnoreCase(status);

                    String createdBy = "SUPER BOSS";
                    java.sql.Timestamp createdDate = getTimestampSafe(rs, "CREATE_DATE");
                    if (createdDate == null) {
                        createdDate = new java.sql.Timestamp(System.currentTimeMillis());
                    }
                    String updatedBy = "SUPER BOSS";
                    java.sql.Timestamp updatedDate = getTimestampSafe(rs, "LST_UPDT_TS");

                    // 5. File attachments from FILE_UPLOAD_TRANS (FROM_WHERE = 'INDUCTION')
                    String firstFileLogicalPath = null;
                    String fileSql = "SELECT FILE_NAME FROM FILE_UPLOAD_TRANS WHERE FROM_WHERE = 'INDUCTION' AND REF_ROW_ID = "
                            + rowId;
                    List<String> files = jdbcTemplate.queryForList(fileSql, String.class);
                    for (String fName : files) {
                        if (fName == null || fName.trim().isEmpty()) {
                            continue;
                        }
                        fName = fName.trim();

                        // Copy file physically
                        try {
                            java.io.File sourceFile = new java.io.File(getSecondaryProcessImgLocation() + "\\INDUCTION",
                                    fName);
                            if (sourceFile.exists()) {
                                java.nio.file.Path rootPath = fileService.getRootPath();
                                java.io.File targetDir = rootPath
                                        .resolve(AppUtil.BosDocConstants.MASTER_HR_ATS_INDUCTION_CRITERIA_PATH)
                                        .toFile();
                                if (!targetDir.exists()) {
                                    targetDir.mkdirs();
                                }
                                java.io.File targetFile = new java.io.File(targetDir, fName);
                                java.nio.file.Files.copy(sourceFile.toPath(), targetFile.toPath(),
                                        java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                                System.out.println("[INDUCTION MIGRATION] SUCCESS: Copied "
                                        + sourceFile.getAbsolutePath() + " to " + targetFile.getAbsolutePath());
                            } else {
                                System.err.println("[INDUCTION MIGRATION] FAILED: Source file not found: "
                                        + sourceFile.getAbsolutePath());
                            }
                        } catch (Exception e) {
                            System.err.println(
                                    "[INDUCTION MIGRATION] File copy exception for " + fName + ": " + e.getMessage());
                        }

                        // Insert QMS_ATTACHMENT_PATH
                        try {
                            String logicalPath = AppUtil.BosDocConstants.MASTER_HR_ATS_INDUCTION_CRITERIA_PATH + "/"
                                    + fName;
                            if (firstFileLogicalPath == null) {
                                firstFileLogicalPath = logicalPath;
                            }
                            psAtt.setLong(1, rowId);
                            psAtt.setString(2, logicalPath);
                            psAtt.setString(3, fName);
                            psAtt.executeUpdate();
                            attachmentCount.incrementAndGet();
                        } catch (Exception e) {
                            System.err.println("[INDUCTION MIGRATION] DB insert failed for attachment " + fName + ": "
                                    + e.getMessage());
                        }
                    }

                    // Save HR_INDUCTION
                    psInduction.setLong(1, rowId);
                    psInduction.setString(2, inductionDetails);
                    psInduction.setString(3, answer);
                    if (roundId != null) {
                        psInduction.setLong(4, roundId);
                    } else {
                        psInduction.setNull(4, java.sql.Types.BIGINT);
                    }
                    psInduction.setString(5, attRequired);
                    psInduction.setString(6, createdBy);
                    psInduction.setTimestamp(7, createdDate);
                    psInduction.setString(8, updatedBy);
                    psInduction.setTimestamp(9, updatedDate);
                    psInduction.setBoolean(10, isActive);
                    psInduction.executeUpdate();

                    // 6. Save Department Mappings
                    String deptNoRaw = getStringSafe(rs, "DEPT_NO");
                    if (deptNoRaw != null) {
                        for (String part : deptNoRaw.split(",")) {
                            String dNo = part.trim().replace(",", "");
                            if (dNo.isEmpty())
                                continue;
                            Long deptId = deptNoToIdMap.get(dNo);
                            if (deptId != null) {
                                try {
                                    psDeptMap.setLong(1, rowId);
                                    psDeptMap.setLong(2, deptId);
                                    psDeptMap.executeUpdate();
                                } catch (Exception e) {
                                    System.err.println("[INDUCTION MIGRATION] Department mapping failed for Row: "
                                            + rowId + ", DeptNo: " + dNo + ": " + e.getMessage());
                                }
                            }
                        }
                    }

                    // 7. Save Level Mappings
                    if (levelCodes != null) {
                        for (String part : levelCodes.split(",")) {
                            String lCode = part.trim();
                            if (lCode.isEmpty())
                                continue;
                            Long lvlId = lvlToIdMap.get(lCode);
                            if (lvlId != null) {
                                try {
                                    psLvlMap.setLong(1, rowId);
                                    psLvlMap.setLong(2, lvlId);
                                    psLvlMap.executeUpdate();
                                } catch (Exception e) {
                                    System.err.println("[INDUCTION MIGRATION] Level mapping failed for Row: " + rowId
                                            + ", Level: " + lCode + ": " + e.getMessage());
                                }
                            }
                        }
                    }

                    migratedCount.incrementAndGet();
                });

            } finally {
                try (java.sql.Statement stmt = conn.createStatement()) {
                    stmt.execute("SET IDENTITY_INSERT HR_INDUCTION OFF");
                } catch (java.sql.SQLException e) {
                    System.err.println(
                            "[MIGRATION ERROR] Failed to set IDENTITY_INSERT OFF for HR_INDUCTION: " + e.getMessage());
                }
            }
            return null;
        });

        return "Successfully migrated " + migratedCount.get() + " induction criteria records and "
                + attachmentCount.get() + " files.";
    }

    @Transactional
    public String clearApplicantVerificationCriteria() {
        try {
            int deleted = primaryJdbcTemplate.update("DELETE FROM HR_VERIFICATION_CRITERIA");
            try {
                primaryJdbcTemplate.execute("DBCC CHECKIDENT ('HR_VERIFICATION_CRITERIA', RESEED, 0)");
            } catch (Exception ignore) {
            }
            return "Successfully cleared " + deleted + " applicant verification criteria records.";
        } catch (Exception e) {
            throw new RuntimeException("Failed to clear applicant verification criteria: " + e.getMessage(), e);
        }
    }

    @Transactional
    public String migrateApplicantVerificationCriteria() {
        if (jdbcTemplate == null) {
            return "Migration database not configured.";
        }

        // Clear existing data to support clean re-runs
        clearApplicantVerificationCriteria();

        String sql = "SELECT * FROM HRMS_APPLICANT_VERIFICATION_CRITERIA";
        java.util.concurrent.atomic.AtomicInteger migratedCount = new java.util.concurrent.atomic.AtomicInteger(0);

        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertSql = "INSERT INTO HR_VERIFICATION_CRITERIA (ID, TYPE, DESCRIPTION, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE, IS_ACTIVE) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

            try (java.sql.Statement stmt = conn.createStatement()) {
                stmt.execute("SET IDENTITY_INSERT HR_VERIFICATION_CRITERIA ON");
            } catch (java.sql.SQLException e) {
                System.err.println("[MIGRATION ERROR] Failed to set IDENTITY_INSERT ON for HR_VERIFICATION_CRITERIA: "
                        + e.getMessage());
            }

            try (java.sql.PreparedStatement ps = conn.prepareStatement(insertSql)) {
                jdbcTemplate.query(sql, (rs) -> {
                    long rowId = rs.getLong("ROW_ID");
                    String type = getStringSafe(rs, "TYPE");
                    if (type == null || type.trim().isEmpty()) {
                        return; // Skip invalid criteria
                    }

                    String description = getStringSafe(rs, "DESCRIPTION");
                    if (description == null || description.trim().isEmpty()) {
                        return; // Skip invalid criteria
                    }

                    String status = getStringSafe(rs, "STATUS");
                    if (status == null || status.trim().isEmpty()) {
                        status = "ACTIVE";
                    }
                    boolean isActive = "ACTIVE".equalsIgnoreCase(status);

                    String createdBy = "SUPER BOSS";
                    java.sql.Timestamp createdDate = getTimestampSafe(rs, "CREATE_DT");
                    if (createdDate == null) {
                        createdDate = new java.sql.Timestamp(System.currentTimeMillis());
                    }
                    String updatedBy = "SUPER BOSS";
                    java.sql.Timestamp updatedDate = getTimestampSafe(rs, "LST_UPDT_DT");

                    ps.setLong(1, rowId);
                    ps.setString(2, type);
                    ps.setString(3, description);
                    ps.setString(4, createdBy);
                    ps.setTimestamp(5, createdDate);
                    ps.setString(6, updatedBy);
                    ps.setTimestamp(7, updatedDate);
                    ps.setBoolean(8, isActive);
                    ps.executeUpdate();

                    migratedCount.incrementAndGet();
                });
            } finally {
                try (java.sql.Statement stmt = conn.createStatement()) {
                    stmt.execute("SET IDENTITY_INSERT HR_VERIFICATION_CRITERIA OFF");
                } catch (java.sql.SQLException e) {
                    System.err.println(
                            "[MIGRATION ERROR] Failed to set IDENTITY_INSERT OFF for HR_VERIFICATION_CRITERIA: "
                                    + e.getMessage());
                }
            }
            return null;
        });

        return "Successfully migrated " + migratedCount.get() + " applicant verification criteria records.";
    }

    private String appendSafetyFileInfo(String current, String newPath) {
        if (newPath == null || newPath.trim().isEmpty()) {
            return current;
        }
        if (current == null || current.trim().isEmpty()) {
            return newPath;
        }
        java.util.List<String> paths = java.util.Arrays.asList(current.split(","));
        if (paths.contains(newPath)) {
            return current;
        }
        return current + "," + newPath;
    }

    @Transactional
    public String migrateEmployeeManagerMapping(org.springframework.jdbc.core.JdbcTemplate migrationTemplate) {
        org.springframework.jdbc.core.JdbcTemplate jdbcTemplate = migrationTemplate != null ? migrationTemplate
                : this.jdbcTemplate;
        List<EmployeeMaster> employees = employeeMasterRepository.findAll();
        List<java.util.Map<String, Object>> secondaryEmployees = jdbcTemplate.queryForList("SELECT * FROM EMPLOYEE");

        // Map to quickly look up legacy employee row by legacy ID/EMP_CD (String)
        java.util.Map<String, java.util.Map<String, Object>> legacyEmpByStrId = new java.util.HashMap<>();
        for (java.util.Map<String, Object> empRow : secondaryEmployees) {
            Object idVal = empRow.get("ID");
            if (idVal == null) {
                idVal = empRow.get("EMP_CD");
            }
            if (idVal == null) {
                idVal = empRow.get("EMP_CODE");
            }
            if (idVal != null) {
                legacyEmpByStrId.put(idVal.toString().trim().toUpperCase(), empRow);
            }
        }

        // Map to quickly look up target employee ID by target EMP_CODE (String)
        java.util.Map<String, Long> empCodeToId = new java.util.HashMap<>();
        try {
            java.lang.reflect.Field empCodeField = EmployeeMaster.class.getDeclaredField("empCode");
            empCodeField.setAccessible(true);
            java.lang.reflect.Field oldEmpCodeField = EmployeeMaster.class.getDeclaredField("oldEmpCode");
            oldEmpCodeField.setAccessible(true);
            for (EmployeeMaster emp : employees) {
                String code = (String) empCodeField.get(emp);
                String oldCode = (String) oldEmpCodeField.get(emp);
                if (code != null && !code.trim().isEmpty()) {
                    empCodeToId.put(code.trim().toUpperCase(), emp.getId());
                }
                if (oldCode != null && !oldCode.trim().isEmpty()) {
                    empCodeToId.put(oldCode.trim().toUpperCase(), emp.getId());
                }
            }
        } catch (Exception e) {
            for (EmployeeMaster emp : employees) {
                if (emp.getEmpCode() != null && !emp.getEmpCode().trim().isEmpty()) {
                    empCodeToId.put(emp.getEmpCode().trim().toUpperCase(), emp.getId());
                }
                if (emp.getOldEmpCode() != null && !emp.getOldEmpCode().trim().isEmpty()) {
                    empCodeToId.put(emp.getOldEmpCode().trim().toUpperCase(), emp.getId());
                }
            }
        }

        int totalRead = secondaryEmployees.size();
        int totalMigrated = 0;
        int totalInserted = 0;
        int totalUpdated = 0;
        int totalFailed = 0;
        int missingEmployees = 0;
        int missingManagersCount = 0;

        java.util.List<String[]> csvLines = new java.util.ArrayList<>();
        csvLines.add(new String[] { "Employee Code", "Employee Name", "Manager Type", "Legacy Manager Code",
                "Failure Reason" });

        for (java.util.Map<String, Object> empRow : secondaryEmployees) {
            if (MasterChecklistMigrationService.stopFlag.get()) {
                break;
            }

            Object empCdVal = empRow.get("EMP_CD");
            String legacyEmpCode = empCdVal != null ? empCdVal.toString().trim() : null;
            String empName = getStringSafeFromMap(empRow, "FIRST_NAME", "firstName", "FIRSTNAME", "EMP_NAME");
            if (legacyEmpCode == null || legacyEmpCode.trim().isEmpty()) {
                totalFailed++;
                csvLines.add(new String[] { "UNKNOWN", empName != null ? empName : "UNKNOWN", "N/A", "N/A",
                        "Legacy Employee Code (EMP_CD) is missing or null" });
                continue;
            }
            legacyEmpCode = legacyEmpCode.trim();

            Long targetEmpId = empCodeToId.get(legacyEmpCode.toUpperCase());
            if (targetEmpId == null) {
                totalFailed++;
                missingEmployees++;
                csvLines.add(new String[] { legacyEmpCode, empName != null ? empName : "", "N/A", "N/A",
                        "Employee not found in latest database" });
                continue;
            }

            EmployeeMaster emp = employeeMasterRepository.findById(targetEmpId).orElse(null);
            if (emp == null) {
                totalFailed++;
                csvLines.add(new String[] { legacyEmpCode, empName != null ? empName : "", "N/A", "N/A",
                        "Failed to retrieve employee from latest database" });
                continue;
            }

            // Resolve manager legacy IDs from columns
            Object legacyHrId = empRow.get("HR_MANAGER");
            Object legacyHomeId = empRow.get("HOME_MANAGER");
            Object legacyBusinessId = empRow.get("BUSINESS_MANAGER");
            Object legacyVrId = empRow.get("VR_MANAGER");

            System.out.println("Processing Employee Code: " + legacyEmpCode + " (Name: " + empName + ")");
            System.out.println("  Legacy Manager IDs -> HR: " + legacyHrId + ", Home: " + legacyHomeId + ", Business: "
                    + legacyBusinessId + ", VR: " + legacyVrId);

            Long hrMgrId = resolveManagerTargetId(legacyHrId, legacyEmpByStrId, empCodeToId, "HR_MANAGER",
                    legacyEmpCode);
            Long homeMgrId = resolveManagerTargetId(legacyHomeId, legacyEmpByStrId, empCodeToId, "HOME_MANAGER",
                    legacyEmpCode);
            Long businessMgrId = resolveManagerTargetId(legacyBusinessId, legacyEmpByStrId, empCodeToId,
                    "BUSINESS_MANAGER", legacyEmpCode);
            Long vrMgrId = resolveManagerTargetId(legacyVrId, legacyEmpByStrId, empCodeToId, "VR_MANAGER",
                    legacyEmpCode);

            System.out.println("  Resolved Manager Target IDs -> HR: " + hrMgrId + ", Home: " + homeMgrId
                    + ", Business: " + businessMgrId + ", VR: " + vrMgrId);

            if (legacyHrId != null && !"0".equals(legacyHrId.toString().trim()) && hrMgrId == null) {
                missingManagersCount++;
                csvLines.add(new String[] { legacyEmpCode, empName != null ? empName : "", "HR_MANAGER",
                        legacyHrId.toString(), "HR Manager not found in latest database" });
            }
            if (legacyHomeId != null && !"0".equals(legacyHomeId.toString().trim()) && homeMgrId == null) {
                missingManagersCount++;
                csvLines.add(new String[] { legacyEmpCode, empName != null ? empName : "", "HOME_MANAGER",
                        legacyHomeId.toString(), "Home Manager not found in latest database" });
            }
            if (legacyBusinessId != null && !"0".equals(legacyBusinessId.toString().trim()) && businessMgrId == null) {
                missingManagersCount++;
                csvLines.add(new String[] { legacyEmpCode, empName != null ? empName : "", "BUSINESS_MANAGER",
                        legacyBusinessId.toString(), "Business Manager not found in latest database" });
            }
            if (legacyVrId != null && !"0".equals(legacyVrId.toString().trim()) && vrMgrId == null) {
                missingManagersCount++;
                csvLines.add(new String[] { legacyEmpCode, empName != null ? empName : "", "VR_MANAGER",
                        legacyVrId.toString(), "VR Manager not found in latest database" });
            }

            emp.setHrManager(hrMgrId != null ? hrMgrId.toString() : null);
            emp.setVerticalHead(vrMgrId != null ? vrMgrId.toString() : null);
            emp.setBusinessManager(businessMgrId != null ? businessMgrId.toString() : null);
            emp.setHomeManager(homeMgrId != null ? homeMgrId.toString() : null);
            employeeMasterRepository.save(emp);

            EmployeeManagerMapping mapping = employeeManagerMappingRepository.findByEmpId(targetEmpId).orElse(null);
            if (mapping == null) {
                mapping = new EmployeeManagerMapping();
                mapping.setEmpId(targetEmpId);
                mapping.setCreatedBy("SUPER BOSS");
                mapping.setCreatedDate(new java.util.Date());
                totalInserted++;
            } else {
                mapping.setUpdatedBy("SUPER BOSS");
                mapping.setUpdatedDate(new java.util.Date());
                totalUpdated++;
            }
            mapping.setVerticalHeadId(vrMgrId);
            mapping.setHrId(hrMgrId);
            mapping.setBusinessManagerId(businessMgrId);
            mapping.setHomeManagerId(homeMgrId);
            mapping.setStatus("Active");
            mapping.setIsActive(true);
            employeeManagerMappingRepository.saveAndFlush(mapping);
            totalMigrated++;
        }

        // Export error logs as CSV
        try {
            java.io.File csvFile = new java.io.File(
                    "d:\\Workspace\\Autonoma\\Autonoma_ERP\\autonoma-backend\\employee_manager_mapping_error_log.csv");
            try (java.io.PrintWriter pw = new java.io.PrintWriter(new java.io.FileWriter(csvFile))) {
                for (String[] line : csvLines) {
                    pw.println(String.join(",", java.util.Arrays.stream(line)
                            .map(s -> "\"" + (s != null ? s.replace("\"", "\"\"") : "") + "\"")
                            .toArray(String[]::new)));
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to write CSV error log: " + e.getMessage());
        }

        return "Successfully migrated Employee Manager Mapping.\n" +
                "Total Employees Read: " + totalRead + "\n" +
                "Total Employees Migrated: " + totalMigrated + "\n" +
                "Total Mapping Inserted: " + totalInserted + "\n" +
                "Total Mapping Updated: " + totalUpdated + "\n" +
                "Total Failed: " + totalFailed + "\n" +
                "Missing Managers: " + missingManagersCount + "\n" +
                "Missing Employees: " + missingEmployees;
    }

    private Long resolveManagerTargetId(Object legacyMgrVal,
            java.util.Map<String, java.util.Map<String, Object>> legacyEmpByStrId,
            java.util.Map<String, Long> empCodeToId,
            String managerType,
            String empCode) {
        if (legacyMgrVal == null) {
            return null;
        }
        String legacyMgrIdStr = legacyMgrVal.toString().trim();
        if (legacyMgrIdStr.isEmpty() || "0".equals(legacyMgrIdStr)) {
            return null;
        }

        java.util.Map<String, Object> managerRow = legacyEmpByStrId.get(legacyMgrIdStr.toUpperCase());
        if (managerRow == null) {
            System.out.println("    [WARNING] Manager lookup failed for Employee " + empCode + " (" + managerType
                    + "): Legacy Manager ID " + legacyMgrIdStr + " not found in legacy EMPLOYEE table");
            return null;
        }

        Object mgrCdVal = managerRow.get("EMP_CD");
        if (mgrCdVal == null) {
            mgrCdVal = managerRow.get("EMP_CODE");
        }
        if (mgrCdVal == null) {
            mgrCdVal = managerRow.get("ID");
        }
        if (mgrCdVal == null) {
            System.out.println("    [WARNING] Manager row exists but has no EMP_CD/EMP_CODE/ID key for Employee "
                    + empCode + " (" + managerType + ", Legacy Manager ID: " + legacyMgrIdStr + ")");
            return null;
        }

        String managerEmpCode = mgrCdVal.toString().trim();
        Long targetId = empCodeToId.get(managerEmpCode.toUpperCase());
        if (targetId == null) {
            System.out.println("    [WARNING] Manager resolved in legacy (" + managerEmpCode
                    + "), but not found in Latest HR_EMPLOYEE for Employee " + empCode + " (" + managerType + ")");
        }
        return targetId;
    }

    @Transactional
    public String clearEmployeeManagerMapping() {
        employeeManagerMappingRepository.deleteAllInBatch();
        primaryJdbcTemplate.update(
                "UPDATE HR_EMPLOYEE SET VERTICAL_HEAD = NULL, HR_MANAGER = NULL, BUSINESS_MANAGER = NULL, HOME_MANAGER = NULL");
        return "Successfully cleared all employee manager mapping records.";
    }

    public int getAtsRecruitmentCount() {
        if (jdbcTemplate == null) {
            return 0;
        }
        try {
            return jdbcTemplate.queryForObject("SET NOCOUNT ON; SELECT COUNT(*) FROM HRMS_NEWAPP_MASTER WITH (NOLOCK)",
                    Integer.class);
        } catch (Exception e) {
            return 0;
        }
    }

    private void saveMigratedAttachment(Long refId, String pageCode, String docType, String path, String refIdStr,
            String createdBy, java.sql.Timestamp createdDate) {
        if (path == null || path.trim().isEmpty()) {
            return;
        }
        try {
            String fileName = fileService.getOriginalFileNameForPath(path);
            if (fileName == null || fileName.isEmpty()) {
                fileName = path.substring(path.lastIndexOf('/') + 1);
            }
            if (fileName.length() > 255) {
                fileName = fileName.substring(fileName.length() - 255);
            }
            primaryJdbcTemplate.update(
                    "INSERT INTO HR_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, REFERENCE_ID_STRING, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    pageCode, refId, docType, path, fileName, refIdStr != null ? refIdStr : "Unknown",
                    createdBy != null ? createdBy : "SYSTEM",
                    createdDate != null ? createdDate : new java.sql.Timestamp(System.currentTimeMillis()),
                    createdBy != null ? createdBy : "SYSTEM",
                    createdDate != null ? createdDate : new java.sql.Timestamp(System.currentTimeMillis()));
        } catch (Exception e) {
            log.error("[ATS MIGRATION] Failed to save attachment metadata to HR_ATTACHMENT_PATH for path: {}", path, e);
        }
    }

    @Transactional
    public String migrateAtsData() {
        System.out.println("[ATS MIGRATION] Starting ATS data migration...");
        if (jdbcTemplate == null) {
            System.out.println("[ATS MIGRATION] Migration database not configured.");
            return "Migration database not configured.";
        }

        int totalCount = getAtsRecruitmentCount();

        // 1. Clear existing ATS data for legacy EN_NOs based on APPLICANT_CODE to avoid
        // direct ID deletes
        log.info("[ATS MIGRATION] Clearing existing ATS records for legacy EN_NOs from primary database...");

        List<String> legacyCodes = jdbcTemplate.queryForList(
                "SET NOCOUNT ON; SELECT CAST(EN_NO AS VARCHAR(50)) FROM HRMS_NEWAPP_MASTER WITH (NOLOCK)",
                String.class);

        if (legacyCodes != null && !legacyCodes.isEmpty()) {
            for (int i = 0; i < legacyCodes.size(); i += 500) {
                List<String> subList = legacyCodes.subList(i, Math.min(i + 500, legacyCodes.size()));
                String codesStr = String.join(",", subList.stream().map(c -> "'APP-" + c.replace("'", "''") + "'")
                        .collect(java.util.stream.Collectors.toList()));

                primaryJdbcTemplate.update(
                        "DELETE FROM HR_ATTACHMENT_PATH WHERE PAGE_CODE = 'HA1110' AND REF_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");

                primaryJdbcTemplate.update(
                        "DELETE FROM HR_ATTACHMENT_PATH WHERE PAGE_CODE = 'HA1120' AND REF_ID IN (SELECT ID FROM HR_APPLICANT_INTERVIEW WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + ")))");

                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_ACTIVITY WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");

                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_KYC_DOCUMENT WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_APPLICANT_VERIFICATION_RESPONSE WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_APPLICANT_VERIFICATION_SUBMISSION WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_APPLICANT_INTERVIEW WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_EDUCATION WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_EXPERIENCE WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_PERSONAL WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_CONTACT WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_ORGANIZATION WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_JOB_PROFILE WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_SELF_ASSESSMENT WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_MANAGER_MAPPING WHERE EMP_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update("DELETE FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN (" + codesStr + ")");
            }
        }
        log.info("[ATS MIGRATION] Cleared legacy HRMS candidate records and sub-tables");

        log.info("[ATS MIGRATION] Finished clearing old data. Starting recruitment candidates migration...");

        // 2. Migrate HRMS_NEWAPP_MASTER -> HR_EMPLOYEE
        final java.util.Map<Long, Long> deptMap = new java.util.HashMap<>();
        try {
            java.util.List<com.autonoma.erp.modules.hr.orgstructure.entity.Department> allDepts = departmentRepository
                    .findAll();
            jdbcTemplate.query("SELECT DEPT_NO, DEPT_NAME FROM DEPT", (rs) -> {
                long legacyId = rs.getLong("DEPT_NO");
                String name = rs.getString("DEPT_NAME");
                if (name != null) {
                    allDepts.stream()
                            .filter(d -> name.trim().equalsIgnoreCase(d.getDepartmentName()))
                            .findFirst()
                            .ifPresent(d -> deptMap.put(legacyId, d.getId()));
                }
            });
        } catch (Exception e) {
            log.error("[ATS MIGRATION] Failed to build deptMap: {}", e.getMessage());
        }

        final java.util.Map<Long, Long> desigMap = new java.util.HashMap<>();
        try {
            java.util.List<Designation> allDesigs = designationRepository.findAll();
            jdbcTemplate.query("SELECT DESIG_CODE, DESIG_NAME FROM HRMS_DESIG_MASTER", (rs) -> {
                long legacyId = rs.getLong("DESIG_CODE");
                String name = rs.getString("DESIG_NAME");
                if (name != null) {
                    allDesigs.stream()
                            .filter(d -> d.getDesignationName() != null
                                    && name.trim().equalsIgnoreCase(d.getDesignationName().trim()))
                            .findFirst()
                            .ifPresent(d -> desigMap.put(legacyId, d.getId()));
                }
            });
        } catch (Exception e) {
            log.error("[ATS MIGRATION] Failed to build desigMap: {}", e.getMessage());
        }

        final java.util.Map<Long, String> enNoToAadhar = new java.util.concurrent.ConcurrentHashMap<>();
        final java.util.Map<Long, String> enNoToMobile = new java.util.concurrent.ConcurrentHashMap<>();
        final java.util.Map<Long, String> enNoToEmail = new java.util.concurrent.ConcurrentHashMap<>();
        final java.util.Map<Long, java.sql.Timestamp> enNoToBirthDate = new java.util.concurrent.ConcurrentHashMap<>();

        String newAppSql = "SET NOCOUNT ON; SELECT * FROM HRMS_NEWAPP_MASTER WITH (NOLOCK)";
        java.util.concurrent.atomic.AtomicInteger empCount = new java.util.concurrent.atomic.AtomicInteger(0);
        java.util.concurrent.atomic.AtomicInteger attachmentCount = new java.util.concurrent.atomic.AtomicInteger(0);
        java.util.Map<Long, Long> oldEnNoToNewEmpId = new java.util.HashMap<>();

        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertEmp = "INSERT INTO HR_EMPLOYEE (" +
                    "TITLE, first_name, last_name, EMPLOYEE_NAME, EMP_CODE, IS_ACTIVE, RESUME_PATH, PROFILE_UPLOAD, " +
                    "NEXT_SALARY_HIKE_MONTH, MINIMUM_AMOUNT, MAXIMUM_AMOUNT, STATUS, APPLICANT_CODE, APPLICANT_DATE, " +
                    "CALL_STATUS, INTERVIEW_STATUS, OFFER_STATUS, VERIFICATION_STATUS, ONBOARDING_STARTED, " +
                    "CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE, ATS_OVERALL_STATUS, BACKGROUND_VERIFICATION_STATUS, FROMWHERE"
                    +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            try (java.sql.PreparedStatement ps = conn.prepareStatement(insertEmp)) {
                jdbcTemplate.query(newAppSql, (rs) -> {
                    long enNo = rs.getLong("EN_NO");
                    String title = getStringSafe(rs, "TITLE");
                    String firstName = getStringSafe(rs, "FIRST_NAME");
                    String lastName = getStringSafe(rs, "LAST_NAME");
                    log.info("[ATS MIGRATION] Starting candidate migration. legacy EN_NO: {}, Name: {} {}", enNo,
                            firstName, lastName);
                    String position = getStringSafe(rs, "POSITION_LOOK_FOR");
                    java.sql.Timestamp appDate = getTimestampSafe(rs, "APP_DATE");
                    String fileName = getStringSafe(rs, "FILE_NAME");
                    String photoFile = getStringSafe(rs, "PHOTO_FILE");
                    String nextHike = getStringSafe(rs, "NEXT_SALARY_HIKE_MONTH");
                    Double minAmt = rs.getObject("MIN_AMOUNT") != null ? rs.getDouble("MIN_AMOUNT") : null;
                    Double maxAmt = rs.getObject("MAX_AMOUNT") != null ? rs.getDouble("MAX_AMOUNT") : null;

                    String appStatus = getStringSafe(rs, "APPL_STATUS");
                    String callLetStatus = getStringSafe(rs, "CALL_LET_STATUS");
                    String offerLetStatus = getStringSafe(rs, "OFFER_LET_STATUS");
                    String docVerifyStatus = getStringSafe(rs, "DOC_VERIFY_STATUS");
                    String appVerifyStatus = getStringSafe(rs, "APP_VERIFY_STATUS");

                    Long statusId = resolveStatusId(appStatus, "Pending");
                    Long callStatusId = mapAtsCallStatus(callLetStatus);
                    Long offerStatusId = mapAtsOfferStatus(offerLetStatus);
                    Long docVerifyStatusId = mapAtsDocVerifyStatus(docVerifyStatus);
                    Long appVerifyStatusId = mapAtsBgvStatus(appVerifyStatus);

                    // Fetch actual interview status from ASSIGN_INTERVIEW_PROCESS for this
                    // candidate
                    Long interviewStatusId = resolveStatusId("Pending", "Pending");
                    try {
                        String intStat = jdbcTemplate.queryForObject(
                                "SELECT TOP 1 INTERVIEW_STATUS FROM ASSIGN_INTERVIEW_PROCESS WITH (NOLOCK) WHERE APPLICANT_ID = ? ORDER BY ROW_ID DESC",
                                String.class, enNo);
                        if (intStat != null && !intStat.trim().isEmpty()) {
                            interviewStatusId = resolveStatusId(intStat.trim(), "Pending");
                        }
                    } catch (Exception ignore) {
                    }

                    // Physical file copy for candidate resumes & photo
                    String newResumePath = null;
                    if (fileName != null && !fileName.trim().isEmpty()) {
                        newResumePath = migrateEmployeeFile(fileName, "HRMS",
                                "MASTER/HR/Employee/Employee Master/Resume");
                        if (newResumePath == null || newResumePath.equals(fileName)) {
                            newResumePath = migrateEmployeeFile(fileName, "EMPLOYEE_MASTER",
                                    "MASTER/HR/Employee/Employee Master/Resume");
                        }
                        if (newResumePath != null)
                            attachmentCount.incrementAndGet();
                    }
                    String newPhotoPath = null;
                    if (photoFile != null && !photoFile.trim().isEmpty()) {
                        newPhotoPath = migrateEmployeeFile(photoFile, "HRMS",
                                "MASTER/HR/Employee/Employee Master/IMAGE");
                        if (newPhotoPath == null || newPhotoPath.equals(photoFile)) {
                            newPhotoPath = migrateEmployeeFile(photoFile, "EMPLOYEE_MASTER",
                                    "MASTER/HR/Employee/Employee Master/IMAGE");
                        }
                        if (newPhotoPath != null)
                            attachmentCount.incrementAndGet();
                    }

                    // Combined full employee name fallback
                    String employeeName = (firstName != null ? firstName.trim() : "") + " "
                            + (lastName != null ? lastName.trim() : "");
                    employeeName = employeeName.trim();
                    if (employeeName.isEmpty()) {
                        employeeName = null;
                    }

                    // Cache details for fallbacks
                    String aadharNo = getStringSafe(rs, "AADHAR_NO");
                    if (aadharNo != null && !aadharNo.trim().isEmpty()) {
                        enNoToAadhar.put(enNo, aadharNo.trim());
                    }
                    String mobileNo = getStringSafe(rs, "MOBILE_NO");
                    if (mobileNo != null && !mobileNo.trim().isEmpty()) {
                        enNoToMobile.put(enNo, mobileNo.trim());
                    }
                    String emailId = getStringSafe(rs, "EMAIL_ID");
                    if (emailId != null && !emailId.trim().isEmpty()) {
                        enNoToEmail.put(enNo, emailId.trim());
                    }
                    java.sql.Timestamp birthDate = getTimestampSafe(rs, "BIRTH_DATE");
                    if (birthDate != null) {
                        enNoToBirthDate.put(enNo, birthDate);
                    }

                    ps.setString(1, title);
                    ps.setString(2, firstName);
                    ps.setString(3, lastName);
                    ps.setString(4, employeeName); // EMPLOYEE_NAME
                    ps.setString(5, String.valueOf(enNo)); // EMP_CODE stores legacy EN_NO
                    ps.setBoolean(6, true); // IS_ACTIVE = true for candidates
                    ps.setString(7, newResumePath != null ? newResumePath : fileName); // RESUME_PATH
                    ps.setString(8, newPhotoPath != null ? newPhotoPath : photoFile); // PROFILE_UPLOAD
                    ps.setString(9, nextHike);
                    if (minAmt != null)
                        ps.setDouble(10, minAmt);
                    else
                        ps.setNull(10, java.sql.Types.DECIMAL);
                    if (maxAmt != null)
                        ps.setDouble(11, maxAmt);
                    else
                        ps.setNull(11, java.sql.Types.DECIMAL);
                    ps.setLong(12, statusId);
                    ps.setString(13, "APP-" + enNo); // APPLICANT_CODE
                    ps.setTimestamp(14, appDate);
                    ps.setLong(15, callStatusId);
                    ps.setLong(16, interviewStatusId); // INTERVIEW_STATUS maps to actual interview status!
                    ps.setLong(17, offerStatusId);
                    ps.setLong(18, docVerifyStatusId);
                    ps.setBoolean(19, false); // ONBOARDING_STARTED
                    ps.setString(20, getStringSafe(rs, "CREAT_USER_ID_CD"));
                    ps.setTimestamp(21, getTimestampSafe(rs, "CREAT_DT"));
                    ps.setString(22, getStringSafe(rs, "LST_UPDT_USER_ID_CD"));
                    ps.setTimestamp(23, getTimestampSafe(rs, "LST_UPDT_TS"));
                    ps.setLong(24, statusId); // ATS_OVERALL_STATUS
                    ps.setLong(25, appVerifyStatusId); // BACKGROUND_VERIFICATION_STATUS
                    ps.setString(26, "ATS"); // FROMWHERE

                    ps.executeUpdate();

                    Long targetEmpId = null;
                    try {
                        targetEmpId = primaryJdbcTemplate.queryForObject(
                                "SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE = ?",
                                Long.class,
                                "APP-" + enNo);
                        if (targetEmpId != null) {
                            oldEnNoToNewEmpId.put(enNo, targetEmpId);
                        }
                    } catch (Exception e) {
                        log.error("[ATS MIGRATION] Failed to retrieve generated ID for EN_NO: {}", enNo, e);
                    }

                    // Map department and designation to HR_EMPLOYEE_ORGANIZATION
                    if (targetEmpId != null) {
                        Long departmentId = null;
                        Object legacyDeptNo = rs.getObject("DEPT_NO");
                        if (legacyDeptNo != null) {
                            try {
                                departmentId = deptMap.get(Long.parseLong(legacyDeptNo.toString()));
                            } catch (Exception ignore) {
                            }
                        }

                        Long designationId = null;
                        Object legacyDesigCode = rs.getObject("DESIG_CODE");
                        if (legacyDesigCode != null) {
                            try {
                                designationId = desigMap.get(Long.parseLong(legacyDesigCode.toString()));
                            } catch (Exception ignore) {
                            }
                        }

                        if (designationId == null && position != null && !position.trim().isEmpty()) {
                            try {
                                designationId = primaryJdbcTemplate.queryForObject(
                                        "SELECT ID FROM HR_DESIGNATION WHERE UPPER(TRIM(DESIGNATION_NAME)) = ?",
                                        Long.class,
                                        position.trim().toUpperCase());
                            } catch (Exception ignore) {
                            }
                        }
                        try {
                            primaryJdbcTemplate.update(
                                    "INSERT INTO HR_EMPLOYEE_ORGANIZATION (EMPLOYEE_ID, DEPARTMENT_ID, DESIGNATION_ID, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES (?, ?, ?, ?, ?, ?, ?)",
                                    targetEmpId, departmentId, designationId, getStringSafe(rs, "CREAT_USER_ID_CD"),
                                    getTimestampSafe(rs, "CREAT_DT"), getStringSafe(rs, "LST_UPDT_USER_ID_CD"),
                                    getTimestampSafe(rs, "LST_UPDT_TS"));
                        } catch (Exception e) {
                            log.error("[ATS MIGRATION] Failed to insert HR_EMPLOYEE_ORGANIZATION for employee ID: {}",
                                    targetEmpId, e);
                        }
                    }

                    int currentCount = empCount.incrementAndGet();
                    log.info("[ATS MIGRATION] Migrated candidate EN_NO: {} -> Emp ID: {}. Progress: {}/{}", enNo,
                            getTargetEmpId(enNo, oldEnNoToNewEmpId), currentCount, totalCount);
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                            .update("atsRecruitment", currentCount);
                });
            }
            return null;
        });

        // 3. Migrate HRMS_NA_CONTACT_DETAIL -> HR_EMPLOYEE_CONTACT
        log.info("[ATS MIGRATION] Starting sub-table migration for Contact Details");
        String contactSql = "SET NOCOUNT ON; SELECT * FROM HRMS_NA_CONTACT_DETAIL WITH (NOLOCK)";
        java.util.concurrent.atomic.AtomicInteger contactCount = new java.util.concurrent.atomic.AtomicInteger(0);

        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertContact = "INSERT INTO HR_EMPLOYEE_CONTACT (" +
                    "EMPLOYEE_ID, COMM_ADDRESS1, COMM_CITY, MOBILE, ALTERNATE_MOBILE, IS_ACTIVE, " +
                    "CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            try (java.sql.PreparedStatement ps = conn.prepareStatement(insertContact)) {
                java.util.Set<Long> processedEmpIds = new java.util.HashSet<>();
                jdbcTemplate.query(contactSql, (rs) -> {
                    long enNo = rs.getLong("EN_NO");
                    Long targetEmpId = getTargetEmpId(enNo, oldEnNoToNewEmpId);
                    if (targetEmpId == null)
                        return;

                    if (processedEmpIds.contains(targetEmpId))
                        return;
                    processedEmpIds.add(targetEmpId);

                    String mobileVal = getStringSafe(rs, "MOBILE_NO");
                    if (mobileVal == null || mobileVal.trim().isEmpty()) {
                        mobileVal = enNoToMobile.get(enNo);
                    }

                    ps.setLong(1, targetEmpId);
                    String add1 = getStringSafe(rs, "ADD1");
                    String add2 = getStringSafe(rs, "ADD2");
                    String fullAddress = (add1 != null ? add1 : "")
                            + (add2 != null && !add2.trim().isEmpty() ? " " + add2.trim() : "");
                    ps.setString(2, fullAddress);
                    ps.setString(3, getStringSafe(rs, "CITY"));
                    ps.setString(4, mobileVal);
                    ps.setString(5, getStringSafe(rs, "PHONE_NO"));
                    ps.setBoolean(6, true);
                    ps.setString(7, getStringSafe(rs, "CREAT_USER_ID_CD"));
                    ps.setTimestamp(8, getTimestampSafe(rs, "CREAT_DT"));
                    ps.setString(9, getStringSafe(rs, "LST_UPDT_USER_ID_CD"));
                    ps.setTimestamp(10, getTimestampSafe(rs, "LST_UPDT_TS"));
                    ps.executeUpdate();
                    contactCount.incrementAndGet();
                });
            }
            return null;
        });

        String eduSql = "SET NOCOUNT ON; SELECT * FROM HRMS_NA_EDUCATION_DETAIL WITH (NOLOCK)";
        java.util.concurrent.atomic.AtomicInteger eduCount = new java.util.concurrent.atomic.AtomicInteger(0);
        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertEdu = "INSERT INTO HR_EMPLOYEE_EDUCATION (" +
                    "EMPLOYEE_ID, EDUCATION, INSTITUTION_NAME, STREAM, YEAR_OF_PASSING, PERCENTAGE_GRADE, DOCUMENTS, IS_ACTIVE, "
                    +
                    "CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            try (java.sql.PreparedStatement ps = conn.prepareStatement(insertEdu)) {
                jdbcTemplate.query(eduSql, (rs) -> {
                    long enNo = rs.getLong("EN_NO");
                    Long targetEmpId = getTargetEmpId(enNo, oldEnNoToNewEmpId);
                    if (targetEmpId == null)
                        return;

                    long rowId = rs.getLong("ROW_ID");
                    ps.setLong(1, targetEmpId);
                    String edu = getStringSafe(rs, "EDUCATION");
                    if (edu == null || edu.isEmpty()) {
                        edu = getStringSafe(rs, "QUALIFICATION");
                    }
                    ps.setString(2, edu);
                    ps.setString(3, getStringSafe(rs, "INSTITUTION_NAME"));
                    ps.setString(4, getStringSafe(rs, "SPECIALIZATION"));

                    Object yop = rs.getObject("YEAR_OF_PASSING");
                    if (yop == null)
                        yop = rs.getObject("YEAR_OF_COMPLETION");
                    ps.setString(5, yop != null ? yop.toString() : null);

                    ps.setString(6, getStringSafe(rs, "GRADE"));

                    // Fetch attachment from FILE_UPLOAD_TRANS
                    String fileSql = "SET NOCOUNT ON; SELECT FILE_NAME FROM FILE_UPLOAD_TRANS WITH (NOLOCK) WHERE FROM_WHERE = 'APPLICANT EDUCATION' AND REF_ROW_ID = "
                            + rowId;
                    List<String> files = jdbcTemplate.queryForList(fileSql, String.class);
                    String oldCert = (files != null && !files.isEmpty()) ? files.get(0)
                            : getStringSafe(rs, "UPLOAD_DOCS");
                    String newCertPath = null;
                    if (oldCert != null && !oldCert.trim().isEmpty()) {
                        newCertPath = migrateEmployeeFile(oldCert, "ApplicantEducation",
                                "MASTER/HR/Employee/Employee Master/Education");
                        if (newCertPath == null || newCertPath.equals(oldCert)) {
                            newCertPath = migrateEmployeeFile(oldCert, "EmpEducation",
                                    "MASTER/HR/Employee/Employee Master/Education");
                        }
                        if (newCertPath != null)
                            attachmentCount.incrementAndGet();
                    }
                    ps.setString(7, newCertPath != null ? newCertPath : oldCert);

                    ps.setBoolean(8, true);
                    ps.setString(9, getStringSafe(rs, "CREAT_USER_ID_CD"));
                    ps.setTimestamp(10, getTimestampSafe(rs, "CREAT_DT"));
                    ps.setString(11, getStringSafe(rs, "LST_UPDT_USER_ID_CD"));
                    ps.setTimestamp(12, getTimestampSafe(rs, "LST_UPDT_TS"));
                    ps.executeUpdate();
                    eduCount.incrementAndGet();
                    if (newCertPath != null && !newCertPath.trim().isEmpty()) {
                        saveMigratedAttachment(targetEmpId, "HA1110", "EDUCATION", newCertPath, edu,
                                getStringSafe(rs, "CREAT_USER_ID_CD"), getTimestampSafe(rs, "CREAT_DT"));
                    }
                });
            }
            return null;
        });

        // 5. Migrate HRMS_NA_EXPERIENCE_DETAIL -> HR_EMPLOYEE_EXPERIENCE
        String expSql = "SET NOCOUNT ON; SELECT * FROM HRMS_NA_EXPERIENCE_DETAIL WITH (NOLOCK)";
        java.util.concurrent.atomic.AtomicInteger expCount = new java.util.concurrent.atomic.AtomicInteger(0);
        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertExp = "INSERT INTO HR_EMPLOYEE_EXPERIENCE (" +
                    "EMPLOYEE_ID, COMPANY_NAME, LOCATION, FROM_DATE, TO_DATE, TOTAL_EXPERIENCE_MONTHS, LAST_SALARY, IS_ACTIVE, "
                    +
                    "CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE, DOCUMENTS" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            try (java.sql.PreparedStatement ps = conn.prepareStatement(insertExp)) {
                jdbcTemplate.query(expSql, (rs) -> {
                    long enNo = rs.getLong("EN_NO");
                    Long targetEmpId = getTargetEmpId(enNo, oldEnNoToNewEmpId);
                    if (targetEmpId == null)
                        return;

                    long rowId = rs.getLong("ROW_ID");
                    ps.setLong(1, targetEmpId);
                    String comp = getStringSafe(rs, "COMPANY_NAME");
                    if (comp == null || comp.isEmpty()) {
                        comp = getStringSafe(rs, "CURRENT_EMPLOYER");
                    }
                    ps.setString(2, comp);
                    ps.setString(3, getStringSafe(rs, "LOCATION"));
                    ps.setTimestamp(4, getTimestampSafe(rs, "FROM_DATE"));
                    ps.setTimestamp(5, getTimestampSafe(rs, "TO_DATE"));

                    Double totMonths = rs.getObject("TOTAL_EXPERIENCE_IN_MONTHS") != null
                            ? rs.getDouble("TOTAL_EXPERIENCE_IN_MONTHS")
                            : null;
                    if (totMonths == null && rs.getObject("YRS_EXP") != null) {
                        totMonths = rs.getDouble("YRS_EXP") * 12;
                    }
                    if (totMonths != null)
                        ps.setInt(6, totMonths.intValue());
                    else
                        ps.setNull(6, java.sql.Types.INTEGER);

                    Double lastSal = rs.getObject("CURRENT_CTC") != null ? rs.getDouble("CURRENT_CTC") : null;
                    if (lastSal != null)
                        ps.setDouble(7, lastSal);
                    else
                        ps.setNull(7, java.sql.Types.DECIMAL);

                    ps.setBoolean(8, true);
                    ps.setString(9, getStringSafe(rs, "CREAT_USER_ID_CD"));
                    ps.setTimestamp(10, getTimestampSafe(rs, "CREAT_DT"));
                    ps.setString(11, getStringSafe(rs, "LST_UPDT_USER_ID_CD"));
                    ps.setTimestamp(12, getTimestampSafe(rs, "LST_UPDT_TS"));

                    // Fetch attachment from FILE_UPLOAD_TRANS
                    String fileSql = "SET NOCOUNT ON; SELECT FILE_NAME FROM FILE_UPLOAD_TRANS WITH (NOLOCK) WHERE FROM_WHERE = 'APPLICANT EXPERIENCE' AND REF_ROW_ID = "
                            + rowId;
                    List<String> files = jdbcTemplate.queryForList(fileSql, String.class);
                    String oldDoc = (files != null && !files.isEmpty()) ? files.get(0) : null;
                    String newDocPath = null;
                    if (oldDoc != null && !oldDoc.trim().isEmpty()) {
                        newDocPath = migrateEmployeeFile(oldDoc, "ApplicantExperience",
                                "MASTER/HR/Employee/Employee Master/Experience");
                        if (newDocPath == null || newDocPath.equals(oldDoc)) {
                            newDocPath = migrateEmployeeFile(oldDoc, "EmpExperienceDts",
                                    "MASTER/HR/Employee/Employee Master/Experience");
                        }
                        if (newDocPath != null)
                            attachmentCount.incrementAndGet();
                    }
                    ps.setString(13, newDocPath != null ? newDocPath : oldDoc);

                    ps.executeUpdate();
                    expCount.incrementAndGet();
                    if (newDocPath != null && !newDocPath.trim().isEmpty()) {
                        saveMigratedAttachment(targetEmpId, "HA1110", "EXPERIENCE", newDocPath, comp,
                                getStringSafe(rs, "CREAT_USER_ID_CD"), getTimestampSafe(rs, "CREAT_DT"));
                    }
                });
            }
            return null;
        });

        // 6. Migrate HRMS_NA_PERSONAL_DETAIL -> HR_EMPLOYEE_PERSONAL
        String personalSql = "SET NOCOUNT ON; SELECT * FROM HRMS_NA_PERSONAL_DETAIL WITH (NOLOCK)";
        java.util.concurrent.atomic.AtomicInteger personalCount = new java.util.concurrent.atomic.AtomicInteger(0);
        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertPersonal = "INSERT INTO HR_EMPLOYEE_PERSONAL (" +
                    "EMPLOYEE_ID, GENDER, MARITAL_STATUS, BIRTH_DATE, PAN_NUMBER, AADHAR_NUMBER, PERSONAL_EMAIL, NATIONALITY, RELIGION, IS_ACTIVE, "
                    +
                    "CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            try (java.sql.PreparedStatement ps = conn.prepareStatement(insertPersonal)) {
                java.util.Set<Long> processedEmpIds = new java.util.HashSet<>();
                jdbcTemplate.query(personalSql, (rs) -> {
                    long enNo = rs.getLong("EN_NO");
                    Long targetEmpId = getTargetEmpId(enNo, oldEnNoToNewEmpId);
                    if (targetEmpId == null)
                        return;

                    if (processedEmpIds.contains(targetEmpId))
                        return;
                    processedEmpIds.add(targetEmpId);

                    java.sql.Timestamp bDate = getTimestampSafe(rs, "BIRTH_DATE");
                    if (bDate == null) {
                        bDate = enNoToBirthDate.get(enNo);
                    }

                    String emailVal = getStringSafe(rs, "PERONAL_EMAIL_ID");
                    if (emailVal == null || emailVal.trim().isEmpty()) {
                        emailVal = enNoToEmail.get(enNo);
                    }

                    String aadharVal = enNoToAadhar.get(enNo);

                    ps.setLong(1, targetEmpId);
                    ps.setString(2, getStringSafe(rs, "GENDER"));
                    ps.setString(3, getStringSafe(rs, "MARITAL_STATUS"));
                    ps.setTimestamp(4, bDate);
                    ps.setString(5, getStringSafe(rs, "PAN_NO"));
                    ps.setString(6, aadharVal);
                    ps.setString(7, emailVal);
                    ps.setString(8, getStringSafe(rs, "NATIONALITY"));
                    ps.setString(9, getStringSafe(rs, "RELIGION"));
                    ps.setBoolean(10, true);
                    ps.setString(11, getStringSafe(rs, "CREAT_USER_ID_CD"));
                    ps.setTimestamp(12, getTimestampSafe(rs, "CREAT_DT"));
                    ps.setString(13, getStringSafe(rs, "LST_UPDT_USER_ID_CD"));
                    ps.setTimestamp(14, getTimestampSafe(rs, "LST_UPDT_TS"));
                    ps.executeUpdate();
                    personalCount.incrementAndGet();
                });
            }
            return null;
        });

        // 7. Migrate HRMS_NA_SALARY_DETAILS -> HR_EMPLOYEE_JOB_PROFILE
        String salSql = "SET NOCOUNT ON; SELECT * FROM HRMS_NA_SALARY_DETAILS WITH (NOLOCK)";
        java.util.concurrent.atomic.AtomicInteger salCount = new java.util.concurrent.atomic.AtomicInteger(0);
        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertJob = "INSERT INTO HR_EMPLOYEE_JOB_PROFILE (" +
                    "EMPLOYEE_ID, WAGES_TYPE, PAYMENT_MODE, DYNAMIC_COMPONENTS, IS_ACTIVE, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE"
                    +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            try (java.sql.PreparedStatement ps = conn.prepareStatement(insertJob)) {
                java.util.Set<Long> processedEmpIds = new java.util.HashSet<>();
                jdbcTemplate.query(salSql, (rs) -> {
                    long applicantId = rs.getLong("APPLICANT_ID");
                    Long targetEmpId = getTargetEmpId(applicantId, oldEnNoToNewEmpId);
                    if (targetEmpId == null)
                        return;

                    if (processedEmpIds.contains(targetEmpId))
                        return;
                    processedEmpIds.add(targetEmpId);

                    ps.setLong(1, targetEmpId);
                    ps.setString(2, "Monthly");
                    ps.setString(3, "Bank Transfer");

                    java.util.Map<String, Object> salComp = new java.util.HashMap<>();
                    salComp.put("basic", rs.getDouble("BASIC"));
                    salComp.put("hra", rs.getDouble("HRA"));
                    salComp.put("da", rs.getDouble("DA"));
                    salComp.put("gross", rs.getDouble("GROSS_SALARY"));
                    salComp.put("net", rs.getDouble("NET_SALARY"));
                    salComp.put("pf_employee", rs.getDouble("PF_EMPLOYEE"));
                    salComp.put("esi_employee", rs.getDouble("ESI_EMPLOYEE"));
                    salComp.put("esi_employer", rs.getDouble("ESI_EMPLR"));
                    salComp.put("pf_employer", rs.getDouble("PF_EMPLR"));
                    salComp.put("ctc", rs.getDouble("CTC_VAL"));

                    String json = "";
                    try {
                        json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(salComp);
                    } catch (Exception ignore) {
                    }

                    ps.setString(4, json);
                    ps.setBoolean(5, true);
                    ps.setString(6, getStringSafe(rs, "CREAT_USER_ID_CD"));
                    ps.setTimestamp(7, getTimestampSafe(rs, "CREAT_DT"));
                    ps.setString(8, getStringSafe(rs, "LST_UPDT_USER_ID_CD"));
                    ps.setTimestamp(9, getTimestampSafe(rs, "LST_UPDT_TS"));
                    ps.executeUpdate();
                    salCount.incrementAndGet();
                });
            }
            return null;
        });

        // 8. Migrate ASSIGN_INTERVIEW_PROCESS -> HR_APPLICANT_INTERVIEW
        String assignIntSql = "SET NOCOUNT ON; SELECT * FROM ASSIGN_INTERVIEW_PROCESS WITH (NOLOCK) WHERE APPLICANT_ID IN (SELECT EN_NO FROM HRMS_NEWAPP_MASTER WITH (NOLOCK))";
        java.util.concurrent.atomic.AtomicInteger evalCount = new java.util.concurrent.atomic.AtomicInteger(0);
        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertEval = "INSERT INTO HR_APPLICANT_INTERVIEW (" +
                    "EMPLOYEE_ID, SCREENING_LEVEL, ROUND, INTERVIEW_DATE, START_TIME, END_TIME, INTERVIEW_PERSON, " +
                    "STATUS, IS_ACTIVE, COMMENTS, ATTACHMENT_REQUIRED, ATTACHMENT_PATH, FEEDBACK_JSON, INTERVIEW_STATUS, "
                    +
                    "CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            try (java.sql.PreparedStatement ps = conn.prepareStatement(insertEval)) {
                jdbcTemplate.query(assignIntSql, (rs) -> {
                    long applicantId = rs.getLong("APPLICANT_ID");
                    Long targetEmpId = getTargetEmpId(applicantId, oldEnNoToNewEmpId);
                    if (targetEmpId == null)
                        return;

                    long masterRowId = rs.getLong("ROW_ID");
                    ps.setLong(1, targetEmpId);
                    ps.setString(2, getStringSafe(rs, "SCREENING_LEVEL"));
                    ps.setString(3, getStringSafe(rs, "INTERVIEW_ROUND"));

                    java.sql.Timestamp intDate = getTimestampSafe(rs, "INTERVIEW_DATE");
                    ps.setString(4, intDate != null ? intDate.toString() : null);

                    ps.setString(5, getStringSafe(rs, "START_TIME"));
                    ps.setString(6, getStringSafe(rs, "END_TIME"));
                    ps.setString(7, getStringSafe(rs, "INTERVIEW_BY"));
                    ps.setString(8, getStringSafe(rs, "STATUS"));
                    ps.setBoolean(9, true); // IS_ACTIVE = true
                    ps.setString(10, null); // COMMENTS
                    ps.setString(11, "No"); // ATTACHMENT_REQUIRED default

                    // Fetch transaction feedback detail and attachments from
                    // INTERVIEW_PROCESS_TRANS
                    String transSql = "SET NOCOUNT ON; SELECT * FROM INTERVIEW_PROCESS_TRANS WITH (NOLOCK) WHERE MASTER_REF_NO = "
                            + masterRowId;
                    java.util.List<java.util.Map<String, Object>> transRows = jdbcTemplate.queryForList(transSql);
                    java.util.List<java.util.Map<String, Object>> feedbackList = new java.util.ArrayList<>();
                    String attachedPath = null;

                    for (java.util.Map<String, Object> transRow : transRows) {
                        java.util.Map<String, Object> fbItem = new java.util.HashMap<>();
                        fbItem.put("criteria", transRow.get("CRITERIA"));
                        fbItem.put("score", transRow.get("RATING") != null ? transRow.get("RATING").toString() : null);
                        fbItem.put("feedback", transRow.get("FEED_BACK"));
                        fbItem.put("isCustom", false);
                        feedbackList.add(fbItem);

                        Object fName = transRow.get("FILE_NAME");
                        if (fName != null && !fName.toString().trim().isEmpty() && attachedPath == null) {
                            String legacyFile = fName.toString().trim();
                            attachedPath = migrateEmployeeFile(legacyFile, "Interview",
                                    "MASTER/HR/Employee/Employee Master/Interview");
                            if (attachedPath == null || attachedPath.equals(legacyFile)) {
                                attachedPath = migrateEmployeeFile(legacyFile, "HRMS",
                                        "MASTER/HR/Employee/Employee Master/Interview");
                            }
                            if (attachedPath != null)
                                attachmentCount.incrementAndGet();
                        }
                    }

                    String feedbackJsonString = "[]";
                    try {
                        feedbackJsonString = new com.fasterxml.jackson.databind.ObjectMapper()
                                .writeValueAsString(feedbackList);
                    } catch (Exception ignore) {
                    }

                    ps.setString(12, attachedPath);
                    ps.setString(13, feedbackJsonString);

                    String intStatusStr = getStringSafe(rs, "INTERVIEW_STATUS");
                    Long statusId = resolveStatusId(intStatusStr, "Pending");
                    if (statusId != null)
                        ps.setLong(14, statusId);
                    else
                        ps.setNull(14, java.sql.Types.BIGINT);

                    ps.setString(15, getStringSafe(rs, "CREAT_USER_ID_CD"));
                    ps.setTimestamp(16, getTimestampSafe(rs, "CREAT_DT"));
                    ps.setString(17, getStringSafe(rs, "LST_UPDT_USER_ID_CD"));
                    ps.setTimestamp(18, getTimestampSafe(rs, "LST_UPDT_TS"));

                    ps.executeUpdate();
                    evalCount.incrementAndGet();

                    Long generatedInterviewId = null;
                    try {
                        generatedInterviewId = primaryJdbcTemplate.queryForObject(
                                "SELECT MAX(ID) FROM HR_APPLICANT_INTERVIEW WHERE EMPLOYEE_ID = ? AND ROUND = ?",
                                Long.class,
                                targetEmpId,
                                getStringSafe(rs, "INTERVIEW_ROUND"));
                    } catch (Exception e) {
                        log.error("[ATS MIGRATION] Failed to retrieve generated Interview ID", e);
                    }

                    if (generatedInterviewId != null && attachedPath != null && !attachedPath.trim().isEmpty()) {
                        saveMigratedAttachment(generatedInterviewId, "HA1120", "INTERVIEW_ATTACHMENT", attachedPath,
                                "Interview Feedback", getStringSafe(rs, "CREAT_USER_ID_CD"),
                                getTimestampSafe(rs, "CREAT_DT"));
                    }
                });
            }
            return null;
        });

        // 9. Migrate HRMS_APPLICANT_VERIFICATION_MASTER ->
        // HR_APPLICANT_VERIFICATION_SUBMISSION
        String verifyMasterSql = "SET NOCOUNT ON; SELECT * FROM HRMS_APPLICANT_VERIFICATION_MASTER WITH (NOLOCK)";
        java.util.concurrent.atomic.AtomicInteger vMasterCount = new java.util.concurrent.atomic.AtomicInteger(0);
        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertVM = "INSERT INTO HR_APPLICANT_VERIFICATION_SUBMISSION (" +
                    "EMPLOYEE_ID, ROLE, NAME, EMAIL, PHONE, IS_SUBMITTED, SUBMITTED_DATE, TOKEN" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            try (java.sql.PreparedStatement ps = conn.prepareStatement(insertVM)) {
                jdbcTemplate.query(verifyMasterSql, (rs) -> {
                    long appId = rs.getLong("APP_ID");
                    Long targetEmpId = getTargetEmpId(appId, oldEnNoToNewEmpId);
                    if (targetEmpId == null)
                        return;

                    ps.setLong(1, targetEmpId);
                    ps.setString(2, "VERIFIER");
                    ps.setString(3, "Legacy Verifier");
                    ps.setString(4, getStringSafe(rs, "TO_MAIL"));
                    ps.setString(5, null);

                    String vStatus = getStringSafe(rs, "VERIFY_STATUS");
                    boolean isSubmitted = "VERIFIED".equalsIgnoreCase(vStatus) || "COMPLETED".equalsIgnoreCase(vStatus);
                    ps.setBoolean(6, isSubmitted);

                    ps.setTimestamp(7, getTimestampSafe(rs, "VERIFY_SEND_TS"));
                    ps.setString(8, getStringSafe(rs, "USER_ID"));
                    ps.executeUpdate();
                    vMasterCount.incrementAndGet();
                });
            }
            return null;
        });

        // 10. Migrate HRMS_APPLICANT_VERIFICATION_RESULT ->
        // HR_APPLICANT_VERIFICATION_RESPONSE
        String verifyResultSql = "SET NOCOUNT ON; SELECT * FROM HRMS_APPLICANT_VERIFICATION_RESULT WITH (NOLOCK)";
        java.util.concurrent.atomic.AtomicInteger vResultCount = new java.util.concurrent.atomic.AtomicInteger(0);
        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertVR = "INSERT INTO HR_APPLICANT_VERIFICATION_RESPONSE (" +
                    "EMPLOYEE_ID, ROLE, QUESTION_ID, RATING, FEEDBACK, REASON, SUBMITTED_DATE" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?)";
            try (java.sql.PreparedStatement ps = conn.prepareStatement(insertVR)) {
                jdbcTemplate.query(verifyResultSql, (rs) -> {
                    long appId = rs.getLong("APP_ID");
                    Long targetEmpId = getTargetEmpId(appId, oldEnNoToNewEmpId);
                    if (targetEmpId == null)
                        return;

                    ps.setLong(1, targetEmpId);
                    ps.setString(2, "VERIFIER");

                    long criteriaId = rs.getLong("VER_CRITERIA_ROWID");
                    boolean criteriaExists = false;
                    try {
                        Integer cnt = primaryJdbcTemplate.queryForObject(
                                "SELECT COUNT(1) FROM HR_VERIFICATION_CRITERIA WHERE ID = ?",
                                Integer.class,
                                criteriaId);
                        criteriaExists = (cnt != null && cnt > 0);
                    } catch (Exception ignore) {
                    }

                    if (!criteriaExists) {
                        try {
                            Long firstId = primaryJdbcTemplate.queryForObject(
                                    "SELECT MIN(ID) FROM HR_VERIFICATION_CRITERIA",
                                    Long.class);
                            if (firstId != null) {
                                criteriaId = firstId;
                                criteriaExists = true;
                            }
                        } catch (Exception ignore) {
                        }
                    }

                    if (!criteriaExists) {
                        log.warn(
                                "[ATS MIGRATION] Skipping verification response for EN_NO: {}, missing verification criteria ID: {}",
                                appId, criteriaId);
                        return;
                    }

                    ps.setLong(3, criteriaId);

                    String scoreRaw = getStringSafe(rs, "SCORE");
                    int rating = 0;
                    if (scoreRaw != null && scoreRaw.matches("\\d+")) {
                        rating = Integer.parseInt(scoreRaw);
                    }
                    ps.setInt(4, rating);
                    ps.setString(5, getStringSafe(rs, "RESULT"));
                    ps.setString(6, getStringSafe(rs, "REMARKS"));

                    java.sql.Timestamp created = getTimestampSafe(rs, "CREATE_DATE");
                    ps.setTimestamp(7, created != null ? created : new java.sql.Timestamp(System.currentTimeMillis()));
                    ps.executeUpdate();
                    vResultCount.incrementAndGet();
                });
            }
            return null;
        });

        // 11. Migrate HRMS_KYC_DOCUMENTS -> HR_EMPLOYEE_KYC_DOCUMENT
        String kycSql = "SET NOCOUNT ON; SELECT * FROM HRMS_KYC_DOCUMENTS WITH (NOLOCK) WHERE APPLICANT_ID IS NOT NULL AND APPLICANT_ID IN (SELECT EN_NO FROM HRMS_NEWAPP_MASTER WITH (NOLOCK))";
        java.util.concurrent.atomic.AtomicInteger kycDocCount = new java.util.concurrent.atomic.AtomicInteger(0);
        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertKycDoc = "INSERT INTO HR_EMPLOYEE_KYC_DOCUMENT (" +
                    "EMPLOYEE_ID, SEQ_NO, DOCUMENT_NAME, DOCUMENT_NUMBER, ATTACHMENT, FILE_NAME, IS_ACTIVE, " +
                    "CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            try (java.sql.PreparedStatement ps = conn.prepareStatement(insertKycDoc)) {
                jdbcTemplate.query(kycSql, (rs) -> {
                    long applicantId = rs.getLong("APPLICANT_ID");
                    Long targetEmpId = getTargetEmpId(applicantId, oldEnNoToNewEmpId);
                    if (targetEmpId == null)
                        return;

                    ps.setLong(1, targetEmpId);

                    Object seq = rs.getObject("SEQ_NO");
                    if (seq != null) {
                        try {
                            ps.setInt(2, Integer.parseInt(seq.toString()));
                        } catch (Exception e) {
                            ps.setNull(2, java.sql.Types.INTEGER);
                        }
                    } else {
                        ps.setNull(2, java.sql.Types.INTEGER);
                    }

                    ps.setString(3, getStringSafe(rs, "DOCUMENT_NAME"));
                    ps.setString(4, getStringSafe(rs, "DOCUMENT_NO"));

                    String originalFile = getStringSafe(rs, "FILE_NAME");
                    String newKycPath = null;
                    if (originalFile != null && !originalFile.trim().isEmpty()) {
                        newKycPath = migrateEmployeeFile(originalFile, "HRMS",
                                "MASTER/HR/Employee/Employee Master/KYC");
                        if (newKycPath == null || newKycPath.equals(originalFile)) {
                            newKycPath = migrateEmployeeFile(originalFile, "EMPLOYEE_MASTER",
                                    "MASTER/HR/Employee/Employee Master/KYC");
                        }
                        if (newKycPath != null)
                            attachmentCount.incrementAndGet();
                    }

                    ps.setString(5, newKycPath != null ? newKycPath : originalFile);
                    ps.setString(6, originalFile);
                    ps.setBoolean(7, true);
                    ps.setString(8, getStringSafe(rs, "CREATED_USER_ID"));
                    ps.setTimestamp(9, getTimestampSafe(rs, "CREATED_DATE"));
                    ps.setString(10, getStringSafe(rs, "LST_UPT_USER_ID_CD"));
                    ps.setTimestamp(11, getTimestampSafe(rs, "LST_UPT_DATE"));
                    ps.executeUpdate();
                    kycDocCount.incrementAndGet();
                    if (newKycPath != null && !newKycPath.trim().isEmpty()) {
                        saveMigratedAttachment(targetEmpId, "HA1110", "KYC", newKycPath,
                                getStringSafe(rs, "DOCUMENT_NAME"), getStringSafe(rs, "CREATED_USER_ID"),
                                getTimestampSafe(rs, "CREATED_DATE"));
                    }
                });
            }
            return null;
        });

        // 12. Migrate INTERVIEW_SELF_ASSESMENT -> HR_EMPLOYEE_SELF_ASSESSMENT
        String selfAssSql = "SET NOCOUNT ON; SELECT * FROM INTERVIEW_SELF_ASSESMENT WITH (NOLOCK) WHERE APPLICANT_ID IN (SELECT EN_NO FROM HRMS_NEWAPP_MASTER WITH (NOLOCK))";
        java.util.concurrent.atomic.AtomicInteger selfAssCount = new java.util.concurrent.atomic.AtomicInteger(0);
        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertSelfAss = "INSERT INTO HR_EMPLOYEE_SELF_ASSESSMENT (" +
                    "EMPLOYEE_ID, Q1_NATIVE, Q2_PRESENT_ADDRESS, Q3_PERMANENT_ADDRESS, Q4_FATHER_OCCUPATION, Q5_MOTHER_OCCUPATION, "
                    +
                    "Q6_MARITAL_STATUS, Q7_SPOUSE_OCCUPATION, Q8_CHILDREN, Q9_HAS_RELATIVES, Q10_RELATIVES_DETAILS, " +
                    "Q11_SIBLINGS_OCCUPATIONS, Q12_HAS_TWO_WHEELER, Q13_HAS_ANDROID_PHONE, Q14_KNOWS_CAR_DRIVING, " +
                    "Q15_WILLING_TO_TRAVEL, Q16_COVID_VACCINATION, Q17_POSITIVE_POINTS, Q18_NEGATIVE_POINTS, Q19_LIFE_GOALS, "
                    +
                    "Q20_IMPROVEMENT_SUGGESTIONS, Q21_IS_EXPERIENCED, Q22_TOTAL_EXPERIENCE, Q23_CORE_EXPERIENCE, " +
                    "Q24_PREV_NET_SALARY, Q25_PREV_GROSS_SALARY, Q26_EXPECTED_NET_SALARY, Q27_EXPECTED_GROSS_SALARY, " +
                    "Q28_PF_HIGHER_PENSION, Q29_PF_DEDUCTION_AMOUNT, Q30_ALTERNATIVE_DEPARTMENT, Q31_PREV_LOCATION, " +
                    "Q32_PREV_SHIFT, Q33_REASON_FOR_LEAVING, Q34_NOTICE_PERIOD, Q35_PREV_DEPT_POSITION, Q36_PREV_DEPT_COUNT, "
                    +
                    "Q37_PREV_HR_MGR, Q38_HANDLE_MISTAKE, Q39_HANDLE_OPINION_DIFFERENCE, Q40_COMPUTER_SELF_RATING, "
                    +
                    "Q41_HR_MGR_NAME, Q42_HR_MGR_EMAIL, Q43_HR_MGR_PHONE, Q44_VERT_HEAD_NAME, Q45_VERT_HEAD_EMAIL, " +
                    "Q46_VERT_HEAD_PHONE, Q20_WILLING_ROTATIONAL_SHIFTS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE, "
                    +
                    "SELF_ASSESSMENT_STATUS, CURRENT_STEP" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            try (java.sql.PreparedStatement ps = conn.prepareStatement(insertSelfAss)) {
                java.util.Set<Long> processedEmpIds = new java.util.HashSet<>();
                jdbcTemplate.query(selfAssSql, (rs) -> {
                    long applicantId = rs.getLong("APPLICANT_ID");
                    Long targetEmpId = getTargetEmpId(applicantId, oldEnNoToNewEmpId);
                    if (targetEmpId == null)
                        return;

                    if (processedEmpIds.contains(targetEmpId))
                        return;
                    processedEmpIds.add(targetEmpId);

                    ps.setLong(1, targetEmpId);
                    ps.setString(2, getStringSafe(rs, "NATIVE_ADD"));
                    ps.setString(3, getStringSafe(rs, "PRESENT_ADDRESS"));
                    ps.setString(4, getStringSafe(rs, "PERMANENT_ADDRESS"));
                    ps.setString(5, getStringSafe(rs, "FATHER_OCCUPATION"));
                    ps.setString(6, getStringSafe(rs, "MOTHER_OCCUPATION"));
                    ps.setString(7, getStringSafe(rs, "MARITAL_STATUS"));
                    ps.setString(8, getStringSafe(rs, "OCCUPATION_OF_YOUR_SPOUSE"));
                    ps.setString(9, getStringSafe(rs, "CHILDREN"));
                    ps.setString(10, getStringSafe(rs, "ANY_OF_RELATIVE_WORKING_IN_THIS_COMPANY"));
                    ps.setString(11, getStringSafe(rs, "RELATIVE_OR_FRIENDS_DETAILS"));
                    ps.setString(12, getStringSafe(rs, "SIBILINGS_OCCUPATION"));
                    ps.setString(13, getStringSafe(rs, "DO_YOU_HAVE_TWO_WHEELER"));
                    ps.setString(14, getStringSafe(rs, "DO_YOU_HAVE_ANDROID_PHONE"));
                    ps.setString(15, getStringSafe(rs, "DO_YOU_KNOWN_CAR_DRIVING"));
                    ps.setString(16, getStringSafe(rs, "WILLING_TO_TRAVEL"));
                    ps.setString(17, getStringSafe(rs, "COVID_VACCINATION"));
                    ps.setString(18, getStringSafe(rs, "ABOUT_YOUR_POSITIVE"));
                    ps.setString(19, getStringSafe(rs, "ABOUT_YOUR_NEGATIVE"));
                    ps.setString(20, getStringSafe(rs, "GOAL"));
                    ps.setString(21, getStringSafe(rs, "PRODUCTIVE_IMPROVEMENTS_IDEAS"));
                    ps.setString(22, getStringSafe(rs, "ARE_YOU_EXPERIENCED"));

                    Object totExp = rs.getObject("TOTAL_EXPERIENCE");
                    ps.setString(23, totExp != null ? totExp.toString() : null);

                    Object relExp = rs.getObject("RELEVANT_DEPT_EXP");
                    ps.setString(24, relExp != null ? relExp.toString() : null);

                    Object prevNet = rs.getObject("PREV_COMPANY_NET_SALARY");
                    ps.setString(25, prevNet != null ? prevNet.toString() : null);

                    Object prevGross = rs.getObject("PREV_COMPANY_GROSS_SALARY");
                    ps.setString(26, prevGross != null ? prevGross.toString() : null);

                    Object expNet = rs.getObject("EXPT_NET_SALARY");
                    ps.setString(27, expNet != null ? expNet.toString() : null);

                    Object expGross = rs.getObject("EXPT_GROSS_SALARY");
                    ps.setString(28, expGross != null ? expGross.toString() : null);

                    ps.setString(29, getStringSafe(rs, "PF_HIGHER_PENSION"));

                    Object pfAmt = rs.getObject("CURRENT_PF_AMOUNT");
                    ps.setString(30, pfAmt != null ? pfAmt.toString() : null);

                    ps.setString(31, getStringSafe(rs, "ALTER_DEPT_NAME"));
                    ps.setString(32, getStringSafe(rs, "PREV_COMPANY_LOCATION"));
                    ps.setString(33, getStringSafe(rs, "PREV_COMPANY_SHIFT"));
                    ps.setString(34, getStringSafe(rs, "REASON_FOR_LEAVING"));

                    Object notice = rs.getObject("NOTICE_PERIOD");
                    ps.setString(35, notice != null ? notice.toString() : null);

                    ps.setString(36, getStringSafe(rs, "PREV_COMP_POSITION"));

                    Object deptCount = rs.getObject("PREV_COMP_DEPT_COUNT");
                    ps.setString(37, deptCount != null ? deptCount.toString() : null);

                    ps.setString(38, getStringSafe(rs, "PREV_COMP_REPORT_TO"));
                    ps.setString(39, getStringSafe(rs, "HANDLE_MISTAKE"));
                    ps.setString(40, getStringSafe(rs, "HANDLE_DIFFERENT_OPINION"));

                    Object rating = rs.getObject("MS_OFF_RATING");
                    ps.setString(41, rating != null ? rating.toString() : null);

                    ps.setString(42, getStringSafe(rs, "PREVIOUS_HR_NAME"));
                    ps.setString(43, getStringSafe(rs, "PREVIOUS_HR_MAIL"));
                    ps.setString(44, getStringSafe(rs, "PREVIOUS_HR__CONT_NO"));
                    ps.setString(45, getStringSafe(rs, "PREVIOUS_MANAGER_NAME"));
                    ps.setString(46, getStringSafe(rs, "PREVIOUS_MANAGER_MAIL"));
                    ps.setString(47, getStringSafe(rs, "PREVIOUS_MANAGER_CONT_NO"));
                    ps.setString(48, getStringSafe(rs, "WORK_ROTATION_SHIFT"));

                    ps.setString(49, getStringSafe(rs, "CREATE_USER_ID"));
                    ps.setTimestamp(50, getTimestampSafe(rs, "CREATE_DATE"));
                    ps.setString(51, getStringSafe(rs, "LAST_UPDT_USER_ID"));
                    ps.setTimestamp(52, getTimestampSafe(rs, "LAST_UPDT_DATE"));

                    ps.setString(53, "SUBMITTED"); // Status
                    ps.setInt(54, 5); // Current step

                    ps.executeUpdate();

                    // Migrate payslip attachment document
                    String originalPayslip = getStringSafe(rs, "PREV_COMPNAY_PAY_SLIP");
                    if (originalPayslip != null && !originalPayslip.trim().isEmpty()) {
                        String newPayslipPath = migrateEmployeeFile(originalPayslip, "SelfAssessment",
                                "MASTER/HR/Employee/Employee Master/SelfAssessment");
                        if (newPayslipPath == null || newPayslipPath.equals(originalPayslip)) {
                            newPayslipPath = migrateEmployeeFile(originalPayslip, "HRMS",
                                    "MASTER/HR/Employee/Employee Master/SelfAssessment");
                        }
                        if (newPayslipPath == null || newPayslipPath.equals(originalPayslip)) {
                            newPayslipPath = migrateEmployeeFile(originalPayslip, "EMPLOYEE_MASTER",
                                    "MASTER/HR/Employee/Employee Master/SelfAssessment");
                        }
                        if (newPayslipPath != null) {
                            primaryJdbcTemplate.update("UPDATE HR_EMPLOYEE SET PAYSLIP_PATH = ? WHERE ID = ?",
                                    newPayslipPath, targetEmpId);
                            attachmentCount.incrementAndGet();
                        }
                    }

                    selfAssCount.incrementAndGet();
                });
            }
            return null;
        });

        // 13. Migrate HRMS_ADDITIONAL_ACTIVITIES -> HR_EMPLOYEE_ACTIVITY
        String activitySql = "SET NOCOUNT ON; SELECT * FROM HRMS_ADDITIONAL_ACTIVITIES WITH (NOLOCK) WHERE APPLICANT_ID IN (SELECT EN_NO FROM HRMS_NEWAPP_MASTER WITH (NOLOCK))";
        java.util.concurrent.atomic.AtomicInteger actCount = new java.util.concurrent.atomic.AtomicInteger(0);
        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertAct = "INSERT INTO HR_EMPLOYEE_ACTIVITY (" +
                    "EMPLOYEE_ID, ACTIVITY_DETAILS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE, IS_ACTIVE, FILE_PATH"
                    +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            try (java.sql.PreparedStatement ps = conn.prepareStatement(insertAct)) {
                jdbcTemplate.query(activitySql, (rs) -> {
                    long applicantId = rs.getLong("APPLICANT_ID");
                    Long targetEmpId = getTargetEmpId(applicantId, oldEnNoToNewEmpId);
                    if (targetEmpId == null)
                        return;

                    ps.setLong(1, targetEmpId);
                    ps.setString(2, getStringSafe(rs, "ACTIVITY_DETAILS"));
                    ps.setString(3, getStringSafe(rs, "CREATED_USER_ID"));
                    ps.setTimestamp(4, getTimestampSafe(rs, "CREATED_DATE"));
                    ps.setString(5, getStringSafe(rs, "LST_UPT_USER_ID_CD"));
                    ps.setTimestamp(6, getTimestampSafe(rs, "LST_UPT_DATE"));
                    ps.setBoolean(7, true); // IS_ACTIVE = true

                    String originalFile = getStringSafe(rs, "FILE_NAME");
                    String newFilePath = null;
                    if (originalFile != null && !originalFile.trim().isEmpty()) {
                        newFilePath = migrateEmployeeFile(originalFile, "EMP ACTIVITY",
                                "MASTER/HR/Employee/Employee Master/Activity");
                        if (newFilePath == null || newFilePath.equals(originalFile)) {
                            newFilePath = migrateEmployeeFile(originalFile, "HRMS",
                                    "MASTER/HR/Employee/Employee Master/Activity");
                        }
                        if (newFilePath != null)
                            attachmentCount.incrementAndGet();
                    }
                    ps.setString(8, newFilePath != null ? newFilePath : originalFile);

                    ps.executeUpdate();
                    actCount.incrementAndGet();
                    if (newFilePath != null && !newFilePath.trim().isEmpty()) {
                        saveMigratedAttachment(targetEmpId, "HA1110", "SKILLS", newFilePath,
                                getStringSafe(rs, "ACTIVITY_DETAILS"), getStringSafe(rs, "CREATED_USER_ID"),
                                getTimestampSafe(rs, "CREATED_DATE"));
                    }
                });
            }
            return null;
        });

        // Fallback for missing Contact records
        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertContact = "INSERT INTO HR_EMPLOYEE_CONTACT (" +
                    "EMPLOYEE_ID, COMM_ADDRESS1, COMM_CITY, MOBILE, IS_ACTIVE, CREATED_BY, CREATED_DATE" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?)";
            try (java.sql.PreparedStatement ps = conn.prepareStatement(insertContact)) {
                for (java.util.Map.Entry<Long, Long> entry : oldEnNoToNewEmpId.entrySet()) {
                    Long enNo = entry.getKey();
                    Long targetEmpId = entry.getValue();

                    // Check if already processed
                    Integer count = primaryJdbcTemplate.queryForObject(
                            "SELECT COUNT(*) FROM HR_EMPLOYEE_CONTACT WHERE EMPLOYEE_ID = ?",
                            Integer.class,
                            targetEmpId);
                    if (count == null || count == 0) {
                        String mobile = enNoToMobile.get(enNo);
                        ps.setLong(1, targetEmpId);
                        ps.setString(2, "N/A");
                        ps.setString(3, "Chennai");
                        ps.setString(4, (mobile != null && !mobile.isEmpty()) ? mobile : "0000000000");
                        ps.setBoolean(5, true);
                        ps.setString(6, "SYSTEM");
                        ps.setTimestamp(7, new java.sql.Timestamp(System.currentTimeMillis()));
                        ps.executeUpdate();
                        contactCount.incrementAndGet();
                    }
                }
            } catch (Exception e) {
                log.error("[ATS MIGRATION] Fallback contact insertion failed: {}", e.getMessage());
            }
            return null;
        });

        // Fallback for missing Personal records
        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
            String insertPersonal = "INSERT INTO HR_EMPLOYEE_PERSONAL (" +
                    "EMPLOYEE_ID, GENDER, MARITAL_STATUS, BIRTH_DATE, AADHAR_NUMBER, PERSONAL_EMAIL, IS_ACTIVE, CREATED_BY, CREATED_DATE"
                    +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            try (java.sql.PreparedStatement ps = conn.prepareStatement(insertPersonal)) {
                for (java.util.Map.Entry<Long, Long> entry : oldEnNoToNewEmpId.entrySet()) {
                    Long enNo = entry.getKey();
                    Long targetEmpId = entry.getValue();

                    // Check if already processed
                    Integer count = primaryJdbcTemplate.queryForObject(
                            "SELECT COUNT(*) FROM HR_EMPLOYEE_PERSONAL WHERE EMPLOYEE_ID = ?",
                            Integer.class,
                            targetEmpId);
                    if (count == null || count == 0) {
                        String aadhar = enNoToAadhar.get(enNo);
                        String email = enNoToEmail.get(enNo);
                        java.sql.Timestamp bDate = enNoToBirthDate.get(enNo);

                        ps.setLong(1, targetEmpId);
                        ps.setString(2, "MALE");
                        ps.setString(3, "SINGLE");
                        ps.setTimestamp(4, bDate);
                        ps.setString(5, aadhar);
                        ps.setString(6, email);
                        ps.setBoolean(7, true);
                        ps.setString(8, "SYSTEM");
                        ps.setTimestamp(9, new java.sql.Timestamp(System.currentTimeMillis()));
                        ps.executeUpdate();
                        personalCount.incrementAndGet();
                    }
                }
            } catch (Exception e) {
                log.error("[ATS MIGRATION] Fallback personal insertion failed: {}", e.getMessage());
            }
            return null;
        });

        return "Successfully migrated ATS Recruitment data:\n" +
                "- " + empCount.get() + " Applicants (HR_EMPLOYEE)\n" +
                "- " + contactCount.get() + " Contact Details\n" +
                "- " + eduCount.get() + " Education Records\n" +
                "- " + expCount.get() + " Experience Records\n" +
                "- " + personalCount.get() + " Personal Details\n" +
                "- " + salCount.get() + " Salary/Job Profiles\n" +
                "- " + evalCount.get() + " Interview Evaluations\n" +
                "- " + vMasterCount.get() + " Verification Submissions\n" +
                "- " + vResultCount.get() + " Verification Responses\n" +
                "- " + kycDocCount.get() + " KYC Documents\n" +
                "- " + selfAssCount.get() + " Employee Self Assessments\n" +
                "- " + actCount.get() + " Employee Activities (Engagement)\n" +
                "- " + attachmentCount.get() + " Physically Copied Attachments";
    }

    @Transactional
    public String clearAtsData() {
        List<String> legacyCodes = jdbcTemplate
                .queryForList("SELECT CAST(EN_NO AS VARCHAR(50)) FROM HRMS_NEWAPP_MASTER", String.class);
        if (legacyCodes != null && !legacyCodes.isEmpty()) {
            for (int i = 0; i < legacyCodes.size(); i += 500) {
                List<String> subList = legacyCodes.subList(i, Math.min(i + 500, legacyCodes.size()));
                String codesStr = String.join(",", subList.stream().map(c -> "'APP-" + c.replace("'", "''") + "'")
                        .collect(java.util.stream.Collectors.toList()));

                primaryJdbcTemplate.update(
                        "DELETE FROM HR_ATTACHMENT_PATH WHERE PAGE_CODE = 'HA1110' AND REF_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_ATTACHMENT_PATH WHERE PAGE_CODE = 'HA1120' AND REF_ID IN (SELECT ID FROM HR_APPLICANT_INTERVIEW WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + ")))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_ACTIVITY WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_SELF_ASSESSMENT WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_KYC_DOCUMENT WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_APPLICANT_VERIFICATION_RESPONSE WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_APPLICANT_VERIFICATION_SUBMISSION WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_APPLICANT_INTERVIEW WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_EDUCATION WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_EXPERIENCE WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_PERSONAL WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_CONTACT WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_ORGANIZATION WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update(
                        "DELETE FROM HR_EMPLOYEE_JOB_PROFILE WHERE EMPLOYEE_ID IN (SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN ("
                                + codesStr + "))");
                primaryJdbcTemplate.update("DELETE FROM HR_EMPLOYEE WHERE APPLICANT_CODE IN (" + codesStr + ")");
            }
        }
        return "Cleared ATS Recruitment data successfully.";
    }

    private Long getTargetEmpId(Long enNo, java.util.Map<Long, Long> oldEnNoToNewEmpId) {
        if (enNo == null)
            return null;
        Long targetEmpId = oldEnNoToNewEmpId.get(enNo);
        if (targetEmpId == null) {
            try {
                targetEmpId = primaryJdbcTemplate.queryForObject(
                        "SELECT ID FROM HR_EMPLOYEE WHERE APPLICANT_CODE = ?",
                        Long.class,
                        "APP-" + enNo);
                if (targetEmpId != null) {
                    oldEnNoToNewEmpId.put(enNo, targetEmpId);
                }
            } catch (Exception e) {
                // Ignore if not found
            }
        }
        return targetEmpId;
    }

    private Long resolveStatusId(String statusName, String defaultStatus) {
        if (statusName == null || statusName.trim().isEmpty()) {
            statusName = defaultStatus;
        }
        com.autonoma.erp.modules.platform.common.entity.StatusMaster sm = statusResolver.get(statusName);
        return sm != null ? sm.getId() : null;
    }

    private Long mapAtsCallStatus(String legacyVal) {
        if (legacyVal == null || legacyVal.trim().isEmpty() || "OPEN".equalsIgnoreCase(legacyVal.trim())) {
            return resolveStatusId("Pending", "Pending");
        }
        String u = legacyVal.trim().toUpperCase();
        if ("SENT".equals(u))
            return resolveStatusId("SENT", "Pending");
        if ("RESEND".equals(u) || "RESENT".equals(u))
            return resolveStatusId("RESENT", "Pending");
        if ("TO BE VERIFY".equals(u) || "TO_BE_VERIFIED".equals(u))
            return resolveStatusId("TO BE VERIFY", "Pending");
        if ("COMPLETED".equals(u) || "CONFIRM".equals(u) || "VERIFIED".equals(u))
            return resolveStatusId("CONFIRM", "Pending");
        if ("CANCELLED".equals(u))
            return resolveStatusId("CANCELLED", "Pending");
        return resolveStatusId(legacyVal, "Pending");
    }

    private Long mapAtsOfferStatus(String legacyVal) {
        if (legacyVal == null || legacyVal.trim().isEmpty() || "OPEN".equalsIgnoreCase(legacyVal.trim())) {
            return resolveStatusId("Pending", "Pending");
        }
        String u = legacyVal.trim().toUpperCase();
        if ("SENT".equals(u))
            return resolveStatusId("SENT", "Pending");
        if ("RESEND".equals(u) || "RESENT".equals(u))
            return resolveStatusId("RESENT", "Pending");
        if ("TO BE VERIFY".equals(u) || "TO_BE_VERIFIED".equals(u))
            return resolveStatusId("TO BE VERIFY", "Pending");
        if ("REJECTED".equals(u))
            return resolveStatusId("Rejected", "Pending");
        if ("COMPLETED".equals(u) || "CONFIRM".equals(u) || "APPROVED".equals(u) || "VERIFIED".equals(u))
            return resolveStatusId("Approved", "Pending");
        if ("NOT APPLICABLE".equals(u) || "N/A".equals(u))
            return resolveStatusId("Not Applicable", "Pending");
        if ("CANCELLED".equals(u))
            return resolveStatusId("CANCELLED", "Pending");
        return resolveStatusId(legacyVal, "Pending");
    }

    private Long mapAtsDocVerifyStatus(String legacyVal) {
        if (legacyVal == null || legacyVal.trim().isEmpty() || "OPEN".equalsIgnoreCase(legacyVal.trim())) {
            return resolveStatusId("Pending", "Pending");
        }
        String u = legacyVal.trim().toUpperCase();
        if ("SENT".equals(u))
            return resolveStatusId("SENT", "Pending");
        if ("TO BE VERIFY".equals(u) || "TO_BE_VERIFIED".equals(u))
            return resolveStatusId("TO BE VERIFY", "Pending");
        if ("RESEND".equals(u) || "RESENT".equals(u))
            return resolveStatusId("RESENT", "Pending");
        if ("COMPLETED".equals(u) || "CONFIRM".equals(u) || "VERIFIED".equals(u))
            return resolveStatusId("Verified", "Pending");
        if ("CANCELLED".equals(u))
            return resolveStatusId("CANCELLED", "Pending");
        return resolveStatusId(legacyVal, "Pending");
    }

    private Long mapAtsBgvStatus(String legacyVal) {
        if (legacyVal == null || legacyVal.trim().isEmpty() || "N/A".equalsIgnoreCase(legacyVal.trim())) {
            return resolveStatusId("Not Applicable", "Not Applicable");
        }
        String u = legacyVal.trim().toUpperCase();
        if ("APPLICABLE".equals(u) || "TO BE VERIFY".equals(u) || "TO_BE_VERIFIED".equals(u))
            return resolveStatusId("TO BE VERIFY", "Not Applicable");
        if ("COMPLETED".equals(u) || "CONFIRM".equals(u) || "VERIFIED".equals(u))
            return resolveStatusId("Verified", "Not Applicable");
        if ("PENDING".equals(u))
            return resolveStatusId("Pending", "Not Applicable");
        return resolveStatusId(legacyVal, "Not Applicable");
    }

    public String clearDivisions() {
        try {
            // Use divisionRepository (target DB) instead of jdbcTemplate (legacy DB)
            java.util.List<Division> divisions = divisionRepository.findAll();
            int deleted = 0;
            int failed = 0;
            for (Division div : divisions) {
                if (div.getId() != null && div.getId() == 1L) {
                    continue; // Skip Corporate Division
                }
                try {
                    divisionRepository.deleteById(div.getId());
                    deleted++;
                } catch (Exception e) {
                    failed++;
                }
            }
            if (failed > 0) {
                return "Cleared " + deleted + " divisions. Skipped " + failed
                        + " divisions because they are being used in transactions (e.g., Purchase Requests).";
            }
            return "Cleared " + deleted + " division records successfully.";
        } catch (Exception e) {
            return "Failed to clear division records: " + e.getMessage();
        }
    }

    public String migrateDivisions() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }

        String sql = "SELECT * FROM divisions";
        List<Division> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            Division division = new Division();
            division.setDivisionName(getStringSafe(rs, "division_name"));
            // division.setDivisionShortName(getStringSafe(rs, "division_no")); // map short
            // name
            division.setAddress(getStringSafe(rs, "division_address", "address_1"));
            division.setCity(getStringSafe(rs, "city"));
            division.setState(getStringSafe(rs, "gst_statename", "state"));
            division.setCountry("India");
            division.setPincode(getStringSafe(rs, "pincode"));

            String stateIdStr = getStringSafe(rs, "gst_stateid");
            if (stateIdStr != null && !stateIdStr.trim().isEmpty()) {
                try {
                    division.setStateCode(Integer.parseInt(stateIdStr.trim()));
                } catch (Exception e) {
                }
            }
            division.setDescription(getStringSafe(rs, "print_name"));
            division.setMobileNo(getStringSafe(rs, "phone_no"));
            division.setGstIn(getStringSafe(rs, "gstin", "gst_no"));
            division.setPanNo(getStringSafe(rs, "pan_it_no"));
            division.setPfNo(getStringSafe(rs, "pf_no"));
            division.setEsiNo(getStringSafe(rs, "esi_no"));
            division.setIeCode(getStringSafe(rs, "ie_code"));
            division.setCinNo(getStringSafe(rs, "cin"));
            division.setEmailId(getStringSafe(rs, "email"));
            division.setWebsite(getStringSafe(rs, "website"));
            division.setEwaybillUserName(getStringSafe(rs, "ewaybill_user"));
            division.setEwaybillPassword(getStringSafe(rs, "ewaybill_pswd"));
            division.setGstUserName(getStringSafe(rs, "gstin_user"));
            division.setEinvoiceUserName(getStringSafe(rs, "einv_user"));
            division.setEinvoicePassword(getStringSafe(rs, "einv_pswd"));

            // set defaults for audit
            division.setCompanyId(1L);
            division.setSequenceNo(rowNum + 1);
            division.setStatus(true);
            division.setCreatedBy("SUPER BOSS");
            division.setCreatedDate(new java.util.Date());

            return division;
        });

        int initialCount = divisionRepository.findAll().size();

        for (Division div : migratedList) {
            if (div.getDivisionName() != null) {
                Division existing = divisionRepository.findByDivisionNameIgnoreCase(div.getDivisionName());
                if (existing == null) {
                    divisionRepository.save(div);
                } else {
                    // Update existing
                    existing.setAddress(div.getAddress());
                    existing.setCity(div.getCity());
                    existing.setState(div.getState());
                    existing.setCountry(div.getCountry());
                    existing.setPincode(div.getPincode());
                    existing.setGstIn(div.getGstIn());
                    existing.setStateCode(div.getStateCode());
                    existing.setDescription(div.getDescription());

                    existing.setMobileNo(div.getMobileNo());
                    existing.setPanNo(div.getPanNo());
                    existing.setPfNo(div.getPfNo());
                    existing.setEsiNo(div.getEsiNo());
                    existing.setIeCode(div.getIeCode());
                    existing.setCinNo(div.getCinNo());
                    existing.setEmailId(div.getEmailId());
                    existing.setWebsite(div.getWebsite());
                    existing.setEwaybillUserName(div.getEwaybillUserName());
                    existing.setEwaybillPassword(div.getEwaybillPassword());
                    existing.setGstUserName(div.getGstUserName());
                    existing.setEinvoiceUserName(div.getEinvoiceUserName());
                    existing.setEinvoicePassword(div.getEinvoicePassword());
                    existing.setUpdatedBy("SUPER BOSS");
                    existing.setUpdatedDate(new java.util.Date());
                    divisionRepository.save(existing);
                }
            }
        }

        int finalCount = divisionRepository.findAll().size();
        return "Migrated " + migratedList.size() + " Division records. New inserted: " + (finalCount - initialCount)
                + ".";
    }
}
