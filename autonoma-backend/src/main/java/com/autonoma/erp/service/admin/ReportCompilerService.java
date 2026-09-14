package com.autonoma.erp.service.admin;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.List;

@Service
public class ReportCompilerService {

    public byte[] generateCsv(List<Map<String, Object>> data) {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            if (data == null || data.isEmpty()) {
                bos.write("No data found.".getBytes());
                return bos.toByteArray();
            }

            Map<String, Object> firstRow = data.get(0);
            List<String> headers = new ArrayList<>(firstRow.keySet());
            StringBuilder sb = new StringBuilder();

            // Append Header
            for (int i = 0; i < headers.size(); i++) {
                sb.append(escapeCsvValue(headers.get(i)));
                if (i < headers.size() - 1) {
                    sb.append(",");
                }
            }
            sb.append("\n");

            // Append Rows
            for (Map<String, Object> row : data) {
                for (int i = 0; i < headers.size(); i++) {
                    Object val = row.get(headers.get(i));
                    sb.append(escapeCsvValue(val != null ? val.toString() : ""));
                    if (i < headers.size() - 1) {
                        sb.append(",");
                    }
                }
                sb.append("\n");
            }

            bos.write(sb.toString().getBytes());
            return bos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate CSV report: " + e.getMessage(), e);
        }
    }

    private String escapeCsvValue(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    public byte[] generateExcel(List<Map<String, Object>> data, String title) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(title != null ? title : "Report");

            if (data == null || data.isEmpty()) {
                Row row = sheet.createRow(0);
                row.createCell(0).setCellValue("No data found.");
                workbook.write(bos);
                return bos.toByteArray();
            }

            // Header Row
            Row headerRow = sheet.createRow(0);
            Map<String, Object> firstRow = data.get(0);
            List<String> headers = new ArrayList<>(firstRow.keySet());

            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            for (int i = 0; i < headers.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers.get(i));
                cell.setCellStyle(headerStyle);
            }

            // Data Rows
            int rowIdx = 1;
            for (Map<String, Object> dataRow : data) {
                Row row = sheet.createRow(rowIdx++);
                for (int i = 0; i < headers.size(); i++) {
                    Cell cell = row.createCell(i);
                    Object val = dataRow.get(headers.get(i));
                    if (val != null) {
                        if (val instanceof Number) {
                            cell.setCellValue(((Number) val).doubleValue());
                        } else if (val instanceof Boolean) {
                            cell.setCellValue((Boolean) val);
                        } else if (val instanceof Date) {
                            cell.setCellValue(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format((Date) val));
                        } else {
                            cell.setCellValue(val.toString());
                        }
                    } else {
                        cell.setCellValue("");
                    }
                }
            }

            for (int i = 0; i < headers.size(); i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(bos);
            return bos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Excel report: " + e.getMessage(), e);
        }
    }

    public byte[] generatePdf(List<Map<String, Object>> data, String title, String headerText, String footerText) {
        try {
            Document document = new Document(PageSize.A4, 36, 36, 54, 54);
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            PdfWriter writer = PdfWriter.getInstance(document, bos);

            // Header/Footer Event Helper
            writer.setPageEvent(new PdfPageEventHelper() {
                @Override
                public void onEndPage(PdfWriter writer, Document document) {
                    PdfContentByte cb = writer.getDirectContent();

                    // Header
                    Phrase header = new Phrase(headerText != null ? headerText : "Enterprise Automation Report",
                            FontFactory.getFont(FontFactory.HELVETICA, 8, com.itextpdf.text.Font.ITALIC));
                    ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, header,
                            (document.right() - document.left()) / 2 + document.leftMargin(),
                            document.top() + 10, 0);

                    // Footer
                    Phrase footer = new Phrase(
                            (footerText != null ? footerText : "Generated by BOS Automation Designer") +
                                    " | Page " + writer.getPageNumber(),
                            FontFactory.getFont(FontFactory.HELVETICA, 8, com.itextpdf.text.Font.ITALIC));
                    ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, footer,
                            (document.right() - document.left()) / 2 + document.leftMargin(),
                            document.bottom() - 20, 0);
                }
            });

            document.open();

            // Title Paragraph
            Paragraph titlePara = new Paragraph(title != null ? title : "Business Report",
                    FontFactory.getFont(FontFactory.HELVETICA, 18, com.itextpdf.text.Font.BOLD));
            titlePara.setAlignment(Element.ALIGN_CENTER);
            titlePara.setSpacingAfter(20);
            document.add(titlePara);

            if (data == null || data.isEmpty()) {
                document.add(new Paragraph("No records found."));
                document.close();
                return bos.toByteArray();
            }

            Map<String, Object> firstRow = data.get(0);
            List<String> headers = new ArrayList<>(firstRow.keySet());

            PdfPTable table = new PdfPTable(headers.size());
            table.setWidthPercentage(100);

            // Header cells
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header,
                        FontFactory.getFont(FontFactory.HELVETICA, 10, com.itextpdf.text.Font.BOLD)));
                cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(5);
                table.addCell(cell);
            }

            // Data rows cells
            for (Map<String, Object> row : data) {
                for (String header : headers) {
                    Object val = row.get(header);
                    String valStr = val != null ? val.toString() : "";
                    PdfPCell cell = new PdfPCell(new Phrase(valStr, FontFactory.getFont(FontFactory.HELVETICA, 9)));
                    cell.setPadding(4);
                    table.addCell(cell);
                }
            }

            document.add(table);
            document.close();
            return bos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF report: " + e.getMessage(), e);
        }
    }

    public String compileHtml(String templateBody, List<Map<String, Object>> data, String subjectTemplate,
            String footerText, Map<String, Object> globalVariables) {
        String body = templateBody != null ? templateBody : "Here is your requested business report.";

        // 1. Build and bind dynamic table if {{reportData}} is in email body
        if (body.contains("{{reportData}}")) {
            StringBuilder tableHtml = new StringBuilder();
            if (data == null || data.isEmpty()) {
                tableHtml.append("<p>No records found.</p>");
            } else {
                tableHtml.append(
                        "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse:collapse;width:100%;font-family:Arial,sans-serif;'>");

                // Headers
                tableHtml.append("<tr style='background-color:#1a223f;color:#ffffff;'>");
                Map<String, Object> firstRow = data.get(0);
                List<String> headers = new ArrayList<>(firstRow.keySet());
                for (String header : headers) {
                    tableHtml.append("<th>").append(header).append("</th>");
                }
                tableHtml.append("</tr>");

                // Rows
                for (Map<String, Object> row : data) {
                    tableHtml.append("<tr>");
                    for (String header : headers) {
                        Object val = row.get(header);
                        tableHtml.append("<td>").append(val != null ? val.toString() : "").append("</td>");
                    }
                    tableHtml.append("</tr>");
                }

                tableHtml.append("</table>");
            }
            body = body.replace("{{reportData}}", tableHtml.toString());
        }

        // 2. Bind dynamic variable mappings
        Map<String, Object> context = new HashMap<>();
        if (globalVariables != null) {
            context.putAll(globalVariables);
        }
        context.put("todayDate", new SimpleDateFormat("yyyy-MM-dd").format(new Date()));
        context.put("totalCount", data != null ? String.valueOf(data.size()) : "0");
        context.put("pendingCount", data != null ? String.valueOf(data.size()) : "0");

        for (Map.Entry<String, Object> entry : context.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String valStr = entry.getValue() != null ? entry.getValue().toString() : "";
            body = body.replace(placeholder, valStr);
        }

        // 3. Complete structural HTML page template output
        StringBuilder fullHtml = new StringBuilder();
        fullHtml.append("<html><head><style>")
                .append("body { font-family: Arial, sans-serif; color: #333333; line-height: 1.6; }")
                .append(".footer { margin-top: 20px; font-size: 11px; color: #777777; border-top: 1px solid #dddddd; padding-top: 10px; }")
                .append("</style></head><body>")
                .append("<div>").append(body).append("</div>");

        if (footerText != null && !footerText.trim().isEmpty()) {
            fullHtml.append("<div class='footer'>").append(footerText).append("</div>");
        }
        fullHtml.append("</body></html>");

        return fullHtml.toString();
    }
}
