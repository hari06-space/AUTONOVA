package com.autonoma.erp.service.payroll;

import com.autonoma.erp.model.payroll.HrPayrollComponent;
import com.autonoma.erp.model.payroll.HrPayrollEmployeeDetail;
import com.autonoma.erp.model.payroll.HrPayrollEmployeeSummary;
import com.autonoma.erp.model.payroll.HrPayrollRun;
import com.autonoma.erp.model.payroll.HrPayslipTemplate;
import com.autonoma.erp.repository.payroll.HrPayrollComponentRepository;
import com.autonoma.erp.repository.payroll.HrPayrollEmployeeDetailRepository;
import com.autonoma.erp.repository.payroll.HrPayrollEmployeeSummaryRepository;
import com.autonoma.erp.repository.payroll.HrPayrollRunRepository;
import com.autonoma.erp.repository.payroll.HrPayslipTemplateRepository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;

import com.autonoma.erp.model.payroll.*;
import com.autonoma.erp.repository.payroll.*;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.*;
import java.util.List;

@Service
public class PayrollReportService {

    @Autowired
    private HrPayrollRunRepository payrollRunRepository;

    @Autowired
    private HrPayrollEmployeeSummaryRepository employeeSummaryRepository;

    @Autowired
    private HrPayrollEmployeeDetailRepository employeeDetailRepository;

    @Autowired
    private HrPayslipTemplateRepository payslipTemplateRepository;

    @Autowired
    private HrPayrollComponentRepository componentRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeRepository;

    public byte[] generateSalaryRegisterExcel(Long payrollRunId) throws Exception {
        Optional<HrPayrollRun> runOpt = payrollRunRepository.findById(payrollRunId);
        if (!runOpt.isPresent()) {
            throw new IllegalArgumentException("Payroll run not found for ID: " + payrollRunId);
        }
        HrPayrollRun run = runOpt.get();
        List<HrPayrollEmployeeSummary> summaries = employeeSummaryRepository.findByPayrollRunId(payrollRunId);

        // Fetch active components to establish column headers and types
        List<HrPayrollComponent> allComponents = componentRepository.findByIsActiveTrueOrderBySequenceNoAsc();
        List<String> earningCols = new ArrayList<>();
        List<String> deductionCols = new ArrayList<>();
        
        for (HrPayrollComponent c : allComponents) {
            if ("EARNING".equalsIgnoreCase(c.getComponentType())) {
                earningCols.add(c.getComponentCode());
            } else if ("DEDUCTION".equalsIgnoreCase(c.getComponentType())) {
                deductionCols.add(c.getComponentCode());
            }
        }

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Salary Register - " + run.getPayrollMonth() + " " + run.getPayrollYear());

        // Styling
        org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        
        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);

        CellStyle dataStyle = workbook.createCellStyle();
        dataStyle.setBorderBottom(BorderStyle.THIN);
        dataStyle.setBorderTop(BorderStyle.THIN);
        dataStyle.setBorderLeft(BorderStyle.THIN);
        dataStyle.setBorderRight(BorderStyle.THIN);

        // Build Header Row
        Row headerRow = sheet.createRow(0);
        List<String> headers = new ArrayList<>(Arrays.asList("Emp Code", "Employee Name", "Department", "Designation", "Present Days", "LOP Days", "Paid Days"));
        headers.addAll(earningCols);
        headers.add("Gross Earnings");
        headers.addAll(deductionCols);
        headers.add("Total Deductions");
        headers.add("Net Payable");

        for (int i = 0; i < headers.size(); i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers.get(i));
            cell.setCellStyle(headerStyle);
        }

        // Fill Data Rows
        int rowIdx = 1;
        for (HrPayrollEmployeeSummary summary : summaries) {
            Row row = sheet.createRow(rowIdx++);
            
            // Map details for quick lookup
            Long empId = employeeRepository.findByEmpCode(summary.getEmpCode()).map(com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster::getId).orElse(null);
            List<HrPayrollEmployeeDetail> details = new ArrayList<>();
            if (empId != null) {
                details = employeeDetailRepository.findByPayrollRunIdAndEmpId(payrollRunId, empId);
            }
            Map<String, BigDecimal> compVal = new HashMap<>();
            for (HrPayrollEmployeeDetail d : details) {
                compVal.put(d.getComponentCode().toUpperCase(), d.getCalculatedAmount());
            }

            int colIdx = 0;
            row.createCell(colIdx++).setCellValue(summary.getEmpCode());
            row.createCell(colIdx++).setCellValue(summary.getEmployeeName());
            row.createCell(colIdx++).setCellValue(summary.getDepartmentName() != null ? summary.getDepartmentName() : "N/A");
            row.createCell(colIdx++).setCellValue(summary.getDesignationName() != null ? summary.getDesignationName() : "N/A");
            row.createCell(colIdx++).setCellValue(summary.getPresentDays().doubleValue());
            row.createCell(colIdx++).setCellValue(summary.getLopDays().doubleValue());
            row.createCell(colIdx++).setCellValue(summary.getPaidDays().doubleValue());

            // Earnings
            for (String col : earningCols) {
                BigDecimal val = compVal.getOrDefault(col.toUpperCase(), BigDecimal.ZERO);
                row.createCell(colIdx++).setCellValue(val.doubleValue());
            }
            row.createCell(colIdx++).setCellValue(summary.getGrossEarnings().doubleValue());

            // Deductions
            for (String col : deductionCols) {
                BigDecimal val = compVal.getOrDefault(col.toUpperCase(), BigDecimal.ZERO);
                row.createCell(colIdx++).setCellValue(val.doubleValue());
            }
            row.createCell(colIdx++).setCellValue(summary.getTotalDeductions().doubleValue());
            row.createCell(colIdx++).setCellValue(summary.getNetSalary().doubleValue());

            for (int j = 0; j < colIdx; j++) {
                row.getCell(j).setCellStyle(dataStyle);
            }
        }

        // Auto-size columns
        for (int i = 0; i < headers.size(); i++) {
            sheet.autoSizeColumn(i);
        }

        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        workbook.write(bos);
        workbook.close();

        return bos.toByteArray();
    }

    public byte[] generatePayslipPdf(Long employeeSummaryId) throws Exception {
        Optional<HrPayrollEmployeeSummary> summaryOpt = employeeSummaryRepository.findById(employeeSummaryId);
        if (!summaryOpt.isPresent()) {
            throw new IllegalArgumentException("Employee summary not found for ID: " + employeeSummaryId);
        }
        HrPayrollEmployeeSummary summary = summaryOpt.get();
        Long empId = employeeRepository.findByEmpCode(summary.getEmpCode()).map(com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster::getId).orElse(null);
        List<HrPayrollEmployeeDetail> details = new ArrayList<>();
        if (empId != null) {
            details = employeeDetailRepository.findByPayrollRunIdAndEmpId(summary.getPayrollRunId(), empId);
        }

        // Fetch payslip template
        HrPayslipTemplate template = payslipTemplateRepository.findByIsDefaultTrue()
                .orElseGet(() -> {
                    HrPayslipTemplate defaultTmpl = new HrPayslipTemplate();
                    defaultTmpl.setTemplateName("Default Payslip Template");
                    defaultTmpl.setHeaderHtml("<h2>Enterprise ERP Payslip</h2>");
                    defaultTmpl.setFooterHtml("This is a computer generated document and does not require signature.");
                    return defaultTmpl;
                });

        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, bos);
        document.open();

        // Title/Header
        com.itextpdf.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.DARK_GRAY);
        Paragraph title = new Paragraph(template.getTemplateName(), titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(15);
        document.add(title);

        // Employee Details Sub-table (2x2 grid layout)
        PdfPTable empTable = new PdfPTable(4);
        empTable.setWidthPercentage(100);
        empTable.setSpacingAfter(15);
        
        com.itextpdf.text.Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BaseColor.BLACK);
        com.itextpdf.text.Font valFont = FontFactory.getFont(FontFactory.HELVETICA, 9, BaseColor.BLACK);

        empTable.addCell(new PdfPCell(new Phrase("Employee Code:", labelFont)));
        empTable.addCell(new PdfPCell(new Phrase(summary.getEmpCode(), valFont)));
        empTable.addCell(new PdfPCell(new Phrase("Employee Name:", labelFont)));
        empTable.addCell(new PdfPCell(new Phrase(summary.getEmployeeName(), valFont)));

        empTable.addCell(new PdfPCell(new Phrase("Department:", labelFont)));
        empTable.addCell(new PdfPCell(new Phrase(summary.getDepartmentName() != null ? summary.getDepartmentName() : "N/A", valFont)));
        empTable.addCell(new PdfPCell(new Phrase("Designation:", labelFont)));
        empTable.addCell(new PdfPCell(new Phrase(summary.getDesignationName() != null ? summary.getDesignationName() : "N/A", valFont)));

        empTable.addCell(new PdfPCell(new Phrase("Present Days:", labelFont)));
        empTable.addCell(new PdfPCell(new Phrase(summary.getPresentDays().toString(), valFont)));
        empTable.addCell(new PdfPCell(new Phrase("LOP Days:", labelFont)));
        empTable.addCell(new PdfPCell(new Phrase(summary.getLopDays().toString(), valFont)));

        // Style the cells
        for (PdfPCell cell : empTable.getRows().stream().flatMap(r -> Arrays.stream(r.getCells())).toArray(PdfPCell[]::new)) {
            if (cell != null) {
                cell.setPadding(6);
                cell.setBackgroundColor(new BaseColor(245, 247, 248));
                cell.setBorderColor(BaseColor.LIGHT_GRAY);
            }
        }
        document.add(empTable);

        // Earnings vs Deductions Tables (side by side in a outer wrapper table)
        PdfPTable containerTable = new PdfPTable(2);
        containerTable.setWidthPercentage(100);
        containerTable.setSpacingAfter(15);
        containerTable.setWidths(new int[]{50, 50});

        // Left: Earnings Table
        PdfPTable earningsTable = new PdfPTable(2);
        earningsTable.setWidthPercentage(100);
        earningsTable.setWidths(new int[]{70, 30});
        
        PdfPCell earHeader = new PdfPCell(new Phrase("Earnings", labelFont));
        earHeader.setBackgroundColor(new BaseColor(230, 240, 250));
        earHeader.setPadding(6);
        earHeader.setColspan(2);
        earningsTable.addCell(earHeader);

        // Right: Deductions Table
        PdfPTable deductionsTable = new PdfPTable(2);
        deductionsTable.setWidthPercentage(100);
        deductionsTable.setWidths(new int[]{70, 30});
        
        PdfPCell dedHeader = new PdfPCell(new Phrase("Deductions", labelFont));
        dedHeader.setBackgroundColor(new BaseColor(250, 230, 230));
        dedHeader.setPadding(6);
        dedHeader.setColspan(2);
        deductionsTable.addCell(dedHeader);

        for (HrPayrollEmployeeDetail det : details) {
            Phrase phraseName = new Phrase(det.getComponentName(), valFont);
            Phrase phraseAmt = new Phrase(det.getCalculatedAmount().toString(), valFont);
            
            if ("EARNING".equalsIgnoreCase(det.getComponentType())) {
                earningsTable.addCell(new PdfPCell(phraseName));
                PdfPCell valCell = new PdfPCell(phraseAmt);
                valCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                earningsTable.addCell(valCell);
            } else if ("DEDUCTION".equalsIgnoreCase(det.getComponentType())) {
                deductionsTable.addCell(new PdfPCell(phraseName));
                PdfPCell valCell = new PdfPCell(phraseAmt);
                valCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                deductionsTable.addCell(valCell);
            }
        }

        // Add spacing pad cells to balance tables
        int earRows = earningsTable.getRows().size();
        int dedRows = deductionsTable.getRows().size();
        if (earRows > dedRows) {
            for (int r = 0; r < earRows - dedRows; r++) {
                deductionsTable.addCell(new Phrase(" ", valFont));
                deductionsTable.addCell(new Phrase(" ", valFont));
            }
        } else if (dedRows > earRows) {
            for (int r = 0; r < dedRows - earRows; r++) {
                earningsTable.addCell(new Phrase(" ", valFont));
                earningsTable.addCell(new Phrase(" ", valFont));
            }
        }

        // Subtotals
        PdfPCell grLabel = new PdfPCell(new Phrase("Gross Earnings", labelFont));
        grLabel.setBackgroundColor(new BaseColor(245, 245, 245));
        earningsTable.addCell(grLabel);
        PdfPCell grVal = new PdfPCell(new Phrase(summary.getGrossEarnings().toString(), labelFont));
        grVal.setBackgroundColor(new BaseColor(245, 245, 245));
        grVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
        earningsTable.addCell(grVal);

        PdfPCell ddLabel = new PdfPCell(new Phrase("Total Deductions", labelFont));
        ddLabel.setBackgroundColor(new BaseColor(245, 245, 245));
        deductionsTable.addCell(ddLabel);
        PdfPCell ddVal = new PdfPCell(new Phrase(summary.getTotalDeductions().toString(), labelFont));
        ddVal.setBackgroundColor(new BaseColor(245, 245, 245));
        ddVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
        deductionsTable.addCell(ddVal);

        // Style cells inside side-by-side tables
        for (PdfPCell cell : earningsTable.getRows().stream().flatMap(r -> Arrays.stream(r.getCells())).toArray(PdfPCell[]::new)) {
            if (cell != null) {
                cell.setPadding(5);
                cell.setBorderColor(BaseColor.LIGHT_GRAY);
            }
        }
        for (PdfPCell cell : deductionsTable.getRows().stream().flatMap(r -> Arrays.stream(r.getCells())).toArray(PdfPCell[]::new)) {
            if (cell != null) {
                cell.setPadding(5);
                cell.setBorderColor(BaseColor.LIGHT_GRAY);
            }
        }

        // Wrap left/right into container cells
        PdfPCell leftCell = new PdfPCell(earningsTable);
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setPaddingRight(10);
        
        PdfPCell rightCell = new PdfPCell(deductionsTable);
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setPaddingLeft(10);

        containerTable.addCell(leftCell);
        containerTable.addCell(rightCell);
        document.add(containerTable);

        // Net Payable Block
        PdfPTable netTable = new PdfPTable(2);
        netTable.setWidthPercentage(100);
        netTable.setSpacingAfter(25);
        netTable.setWidths(new int[]{70, 30});

        PdfPCell netLabelCell = new PdfPCell(new Phrase("NET SALARY PAYABLE (ROUNDED)", labelFont));
        netLabelCell.setBackgroundColor(new BaseColor(230, 245, 230));
        netLabelCell.setPadding(8);
        netTable.addCell(netLabelCell);

        PdfPCell netValCell = new PdfPCell(new Phrase(summary.getNetSalary().toString(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.BLACK)));
        netValCell.setBackgroundColor(new BaseColor(230, 245, 230));
        netValCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        netValCell.setPadding(8);
        netTable.addCell(netValCell);

        for (PdfPCell cell : netTable.getRows().stream().flatMap(r -> Arrays.stream(r.getCells())).toArray(PdfPCell[]::new)) {
            if (cell != null) {
                cell.setBorderColor(BaseColor.LIGHT_GRAY);
            }
        }
        document.add(netTable);

        // Footer Note
        if (template.getFooterHtml() != null && !template.getFooterHtml().isEmpty()) {
            com.itextpdf.text.Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, BaseColor.GRAY);
            Paragraph footer = new Paragraph(template.getFooterHtml(), footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);
        }

        document.close();
        return bos.toByteArray();
    }
}
