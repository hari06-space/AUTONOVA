package com.autonoma.erp.modules.pdfdesigner.service;

import com.autonoma.erp.modules.pdfdesigner.entity.BosPdfTemplate;
import com.autonoma.erp.util.PayrollFormulaEvaluator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itextpdf.text.*;
import com.itextpdf.text.Font;
import com.itextpdf.text.Image;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PdfGenerationEngine {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TemplateDto {
        public String templateName;
        public String documentType;
        public String pageSize;
        public float width;
        public float height;
        public List<ComponentDto> components = new ArrayList<>();
        public List<TableDto> tables = new ArrayList<>();
        public HeaderFooterDto header;
        public HeaderFooterDto footer;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class HeaderFooterDto {
        public float height = 0.0f;
        public List<ComponentDto> components = new ArrayList<>();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ComponentDto {
        public String id;
        public String type; // LABEL, TEXT, IMAGE, RECTANGLE, LINE, CIRCLE, QR_CODE, BARCODE, PAGE_NUMBER
        public float x;
        public float y;
        public float width;
        public float height;
        public String content;
        public String fontFamily;
        public float fontSize = 10.0f;
        public String fontWeight; // BOLD
        public String fontStyle; // ITALIC
        public String textColor = "#000000";
        public String backgroundColor;
        public String alignment = "LEFT"; // LEFT, CENTER, RIGHT
        public String borderColor = "#000000";
        public float borderThickness = 0.0f;
        public float rotation = 0.0f;
        public String visibility = "VISIBLE"; // VISIBLE, HIDDEN
        public float paddingLeft = 0.0f;
        public float paddingRight = 0.0f;
        public float paddingTop = 0.0f;
        public float paddingBottom = 0.0f;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TableDto {
        public String id;
        public float x;
        public float y;
        public float width;
        public float height;
        public String headerBackgroundColor = "#1a223f";
        public String headerTextColor = "#ffffff";
        public String borderColor = "#cbd5e1";
        public List<ColumnDto> columns = new ArrayList<>();
        public boolean showTotals = false;
        public List<String> totalFields = new ArrayList<>();
        public String filterField;
        public String filterValue;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ColumnDto {
        public String header;
        public String field;
        public String expression;
        public float widthPercent;
        public String align = "LEFT";
    }

    public byte[] generatePdf(BosPdfTemplate template, Map<String, Object> dataContext) throws Exception {
        TemplateDto layout = objectMapper.readValue(template.getTemplateJson(), TemplateDto.class);

        // Determine Page Size
        Rectangle pageSize = PageSize.A4;
        if ("A4_LANDSCAPE".equalsIgnoreCase(layout.pageSize)) {
            pageSize = PageSize.A4.rotate();
        } else if ("LETTER".equalsIgnoreCase(layout.pageSize)) {
            pageSize = PageSize.LETTER;
        } else if ("LETTER_LANDSCAPE".equalsIgnoreCase(layout.pageSize)) {
            pageSize = PageSize.LETTER.rotate();
        } else if ("CUSTOM".equalsIgnoreCase(layout.pageSize) && layout.width > 0 && layout.height > 0) {
            pageSize = new Rectangle(layout.width, layout.height);
        }

        Document document = new Document(pageSize, 0, 0, 0, 0); // 0 margins for exact canvas mapping
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        PdfWriter writer = PdfWriter.getInstance(document, bos);

        // Register Page Number Header/Footer Events
        writer.setPageEvent(new PageNumberEventHandler(layout, dataContext));

        document.open();

        // 1. Draw Static / Absolute Components on Page 1
        PdfContentByte cb = writer.getDirectContent();
        drawCanvasComponents(cb, layout.components, dataContext, pageSize.getHeight(), writer);

        // 2. Add Tables
        if (layout.tables != null && !layout.tables.isEmpty()) {
            for (TableDto tableConfig : layout.tables) {
                // Fetch dynamic table list from context (e.g. details or items)
                List<Map<String, Object>> rows = resolveTableRows(tableConfig, dataContext);

                PdfPTable pdfTable = createPdfTable(tableConfig, rows, writer);
                pdfTable.setTotalWidth(tableConfig.width);
                pdfTable.setLockedWidth(true);

                // absolute layout flow workaround: add spacer to push table down to its designer Y coordinate
                Paragraph spacer = new Paragraph();
                spacer.setSpacingBefore(tableConfig.y);
                document.add(spacer);

                document.add(pdfTable);
            }
        }

        document.close();
        return bos.toByteArray();
    }

    private List<Map<String, Object>> resolveTableRows(TableDto tableConfig, Map<String, Object> dataContext) {
        Object rawData = dataContext.get("details");
        if (rawData == null) {
            rawData = dataContext.get("items");
        }
        
        List<Map<String, Object>> resolved = new ArrayList<>();
        if (rawData instanceof List) {
            List<?> list = (List<?>) rawData;
            for (Object obj : list) {
                if (obj instanceof Map) {
                    Map<String, Object> row = (Map<String, Object>) obj;
                    // Apply filtering if specified
                    if (tableConfig.filterField != null && tableConfig.filterValue != null) {
                        Object val = row.get(tableConfig.filterField);
                        if (val == null || !tableConfig.filterValue.equalsIgnoreCase(val.toString())) {
                            continue;
                        }
                    }
                    resolved.add(row);
                }
            }
        }
        return resolved;
    }

    private void drawCanvasComponents(PdfContentByte cb, List<ComponentDto> components, Map<String, Object> context, float pageHeight, PdfWriter writer) throws Exception {
        if (components == null) return;
        
        for (ComponentDto c : components) {
            if ("PAGE_NUMBER".equalsIgnoreCase(c.type)) {
                // Handled globally in PageNumberEventHandler
                continue;
            }
            if (c.visibility != null && ("HIDDEN".equalsIgnoreCase(c.visibility) || "INVISIBLE".equalsIgnoreCase(c.visibility) || "FALSE".equalsIgnoreCase(c.visibility))) {
                continue;
            }

            cb.saveState();

            // Coordinate inversion from top-left (designer) to bottom-left (iText)
            float itextY = pageHeight - c.y - c.height;

            if (c.rotation != 0.0f) {
                float cx = c.x + c.width / 2;
                float cy = itextY + c.height / 2;
                double rad = Math.toRadians(c.rotation);
                float cos = (float) Math.cos(rad);
                float sin = (float) Math.sin(rad);
                cb.concatCTM(1.0f, 0.0f, 0.0f, 1.0f, cx, cy);
                cb.concatCTM(cos, sin, -sin, cos, 0.0f, 0.0f);
                cb.concatCTM(1.0f, 0.0f, 0.0f, 1.0f, -cx, -cy);
            }

            if ("LABEL".equalsIgnoreCase(c.type) || "TEXT".equalsIgnoreCase(c.type)) {
                String resolvedText = resolvePlaceholders(c.content, context);

                // Setup Font
                int fontStyle = Font.NORMAL;
                if ("BOLD".equalsIgnoreCase(c.fontWeight) && "ITALIC".equalsIgnoreCase(c.fontStyle)) {
                    fontStyle = Font.BOLDITALIC;
                } else if ("BOLD".equalsIgnoreCase(c.fontWeight)) {
                    fontStyle = Font.BOLD;
                } else if ("ITALIC".equalsIgnoreCase(c.fontStyle)) {
                    fontStyle = Font.ITALIC;
                }

                BaseColor textColor = parseColor(c.textColor, BaseColor.BLACK);
                Font.FontFamily family = Font.FontFamily.HELVETICA;
                if (c.fontFamily != null) {
                    String fam = c.fontFamily.toUpperCase();
                    if (fam.contains("TIMES") || fam.contains("GEORGIA") || fam.contains("SERIF")) {
                        family = Font.FontFamily.TIMES_ROMAN;
                    } else if (fam.contains("COURIER") || fam.contains("MONO")) {
                        family = Font.FontFamily.COURIER;
                    }
                }
                Font font = new Font(family, c.fontSize, fontStyle, textColor);

                int align = Element.ALIGN_LEFT;
                if ("CENTER".equalsIgnoreCase(c.alignment)) {
                    align = Element.ALIGN_CENTER;
                } else if ("RIGHT".equalsIgnoreCase(c.alignment)) {
                    align = Element.ALIGN_RIGHT;
                }

                // Render Background
                if (c.backgroundColor != null && !c.backgroundColor.trim().isEmpty()) {
                    cb.setColorFill(parseColor(c.backgroundColor, BaseColor.WHITE));
                    cb.rectangle(c.x, itextY, c.width, c.height);
                    cb.fill();
                }

                // Render Border
                if (c.borderThickness > 0) {
                    cb.setColorStroke(parseColor(c.borderColor, BaseColor.BLACK));
                    cb.setLineWidth(c.borderThickness);
                    cb.rectangle(c.x, itextY, c.width, c.height);
                    cb.stroke();
                }

                // Wrap Text in ColumnText for alignment and overflow protection
                ColumnText ct = new ColumnText(cb);
                float padLeft = c.paddingLeft > 0 ? c.paddingLeft : 3;
                float padRight = c.paddingRight > 0 ? c.paddingRight : 3;
                float padTop = c.paddingTop > 0 ? c.paddingTop : 0;
                float padBottom = c.paddingBottom > 0 ? c.paddingBottom : 0;
                ct.setSimpleColumn(c.x + padLeft, itextY + padBottom, c.x + c.width - padRight, itextY + c.height - padTop);
                Paragraph p = new Paragraph(resolvedText, font);
                p.setAlignment(align);
                ct.addElement(p);
                ct.go();

            } else if ("LINE".equalsIgnoreCase(c.type)) {
                cb.setColorStroke(parseColor(c.borderColor, BaseColor.BLACK));
                cb.setLineWidth(c.borderThickness > 0 ? c.borderThickness : 1.0f);
                cb.moveTo(c.x, pageHeight - c.y);
                cb.lineTo(c.x + c.width, pageHeight - (c.y + c.height));
                cb.stroke();

            } else if ("RECTANGLE".equalsIgnoreCase(c.type)) {
                cb.rectangle(c.x, itextY, c.width, c.height);
                if (c.backgroundColor != null && !c.backgroundColor.trim().isEmpty()) {
                    cb.setColorFill(parseColor(c.backgroundColor, BaseColor.WHITE));
                    cb.fill();
                }
                if (c.borderThickness > 0) {
                    cb.setColorStroke(parseColor(c.borderColor, BaseColor.BLACK));
                    cb.setLineWidth(c.borderThickness);
                    cb.rectangle(c.x, itextY, c.width, c.height);
                    cb.stroke();
                }

            } else if ("CIRCLE".equalsIgnoreCase(c.type)) {
                cb.ellipse(c.x, itextY, c.x + c.width, itextY + c.height);
                if (c.backgroundColor != null && !c.backgroundColor.trim().isEmpty()) {
                    cb.setColorFill(parseColor(c.backgroundColor, BaseColor.WHITE));
                    cb.fill();
                }
                if (c.borderThickness > 0) {
                    cb.setColorStroke(parseColor(c.borderColor, BaseColor.BLACK));
                    cb.setLineWidth(c.borderThickness);
                    cb.ellipse(c.x, itextY, c.x + c.width, itextY + c.height);
                    cb.stroke();
                }

            } else if ("IMAGE".equalsIgnoreCase(c.type)) {
                try {
                    Image img = null;
                    if (c.content != null && c.content.startsWith("data:image")) {
                        String base64Data = c.content.substring(c.content.indexOf(",") + 1);
                        byte[] imgBytes = Base64.getDecoder().decode(base64Data);
                        img = Image.getInstance(imgBytes);
                    } else if (c.content != null && (c.content.startsWith("http://") || c.content.startsWith("https://"))) {
                        img = Image.getInstance(c.content);
                    } else {
                        String imgPath = resolvePlaceholders(c.content, context);
                        if (imgPath != null && !imgPath.trim().isEmpty() && !imgPath.contains("{{")) {
                            if (imgPath.startsWith("data:image")) {
                                String base64Data = imgPath.substring(imgPath.indexOf(",") + 1);
                                byte[] imgBytes = Base64.getDecoder().decode(base64Data);
                                img = Image.getInstance(imgBytes);
                            } else if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
                                img = Image.getInstance(imgPath);
                            }
                        }
                        if (img == null) {
                            java.net.URL res = getClass().getResource("/static/logo.png");
                            if (res != null) {
                                img = Image.getInstance(res);
                            }
                        }
                    }
                    if (img != null) {
                        img.setAbsolutePosition(c.x, itextY);
                        img.scaleAbsolute(c.width, c.height);
                        cb.addImage(img);
                    }
                } catch (Exception ex) {
                    cb.setColorStroke(BaseColor.GRAY);
                    cb.setLineWidth(1.0f);
                    cb.rectangle(c.x, itextY, c.width, c.height);
                    cb.stroke();
                    
                    ColumnText ct = new ColumnText(cb);
                    ct.setSimpleColumn(c.x + 2, itextY, c.x + c.width - 2, itextY + c.height);
                    ct.addElement(new Paragraph("Logo Slot", new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, BaseColor.GRAY)));
                    ct.go();
                }

            } else if ("QR_CODE".equalsIgnoreCase(c.type)) {
                String val = resolvePlaceholders(c.content, context);
                BarcodeQRCode qrcode = new BarcodeQRCode(val != null && !val.isEmpty() ? val : "N/A", 1, 1, null);
                Image qrImage = qrcode.getImage();
                qrImage.setAbsolutePosition(c.x, itextY);
                qrImage.scaleAbsolute(c.width, c.height);
                cb.addImage(qrImage);

            } else if ("BARCODE".equalsIgnoreCase(c.type)) {
                String val = resolvePlaceholders(c.content, context);
                Barcode128 barcode = new Barcode128();
                barcode.setCode(val != null && !val.isEmpty() ? val : "N/A");
                Image barImage = barcode.createImageWithBarcode(cb, null, null);
                barImage.setAbsolutePosition(c.x, itextY);
                barImage.scaleAbsolute(c.width, c.height);
                cb.addImage(barImage);
            }

            cb.restoreState();
        }
    }

    private PdfPTable createPdfTable(TableDto config, List<Map<String, Object>> rows, PdfWriter writer) throws Exception {
        PdfPTable table = new PdfPTable(config.columns.size());
        
        // Setup table column width distribution
        float[] widths = new float[config.columns.size()];
        for (int i = 0; i < config.columns.size(); i++) {
            widths[i] = config.columns.get(i).widthPercent;
        }
        table.setWidths(widths);

        BaseColor headerBg = parseColor(config.headerBackgroundColor, new BaseColor(26, 34, 63));
        BaseColor headerTextClr = parseColor(config.headerTextColor, BaseColor.WHITE);
        BaseColor borderClr = parseColor(config.borderColor, BaseColor.LIGHT_GRAY);

        Font headerFont = new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, headerTextClr);
        Font cellFont = new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, BaseColor.BLACK);
        Font totalFont = new Font(Font.FontFamily.HELVETICA, 8, Font.BOLD, BaseColor.BLACK);

        // Header Row
        for (ColumnDto col : config.columns) {
            PdfPCell cell = new PdfPCell(new Phrase(col.header, headerFont));
            cell.setBackgroundColor(headerBg);
            cell.setBorderColor(borderClr);
            cell.setPadding(6);
            cell.setHorizontalAlignment(mapAlign(col.align));
            table.addCell(cell);
        }

        // Totals accumulator map
        Map<String, BigDecimal> totals = new HashMap<>();
        for (ColumnDto col : config.columns) {
            totals.put(col.field != null ? col.field : col.expression, BigDecimal.ZERO);
        }

        // Data Rows
        for (Map<String, Object> row : rows) {
            // Setup math expression variables context
            Map<String, BigDecimal> formulaVars = new HashMap<>();
            for (Map.Entry<String, Object> entry : row.entrySet()) {
                if (entry.getValue() instanceof Number) {
                    formulaVars.put(entry.getKey(), new BigDecimal(entry.getValue().toString()));
                }
            }

            for (ColumnDto col : config.columns) {
                String valStr = "";
                BigDecimal mathVal = BigDecimal.ZERO;

                if (col.field != null && !col.field.trim().isEmpty()) {
                    Object valObj = row.get(col.field);
                    valStr = valObj != null ? valObj.toString() : "";
                    if (valObj instanceof Number) {
                        mathVal = new BigDecimal(valObj.toString());
                    }
                } else if (col.expression != null && !col.expression.trim().isEmpty()) {
                    try {
                        mathVal = PayrollFormulaEvaluator.evaluate(col.expression, formulaVars);
                        valStr = mathVal.setScale(2, RoundingMode.HALF_UP).toString();
                        // Add calculated field to vars context for subsequent columns in the row
                        formulaVars.put(col.expression, mathVal);
                    } catch (Exception ex) {
                        valStr = "Expr Error";
                    }
                }

                // Accumulate totals
                String key = col.field != null ? col.field : col.expression;
                if (config.showTotals && config.totalFields.contains(key)) {
                    BigDecimal sum = totals.getOrDefault(key, BigDecimal.ZERO);
                    totals.put(key, sum.add(mathVal));
                }

                PdfPCell cell = new PdfPCell(new Phrase(valStr, cellFont));
                cell.setBorderColor(borderClr);
                cell.setPadding(5);
                cell.setHorizontalAlignment(mapAlign(col.align));
                table.addCell(cell);
            }
        }

        // Totals Footer Row
        if (config.showTotals) {
            for (ColumnDto col : config.columns) {
                String key = col.field != null ? col.field : col.expression;
                if (config.totalFields.contains(key)) {
                    BigDecimal total = totals.getOrDefault(key, BigDecimal.ZERO);
                    PdfPCell cell = new PdfPCell(new Phrase("Total: " + total.setScale(2, RoundingMode.HALF_UP).toString(), totalFont));
                    cell.setBorderColor(borderClr);
                    cell.setPadding(6);
                    cell.setHorizontalAlignment(mapAlign(col.align));
                    cell.setBackgroundColor(new BaseColor(248, 250, 252));
                    table.addCell(cell);
                } else {
                    PdfPCell cell = new PdfPCell(new Phrase("", cellFont));
                    cell.setBorderColor(borderClr);
                    cell.setPadding(6);
                    cell.setBackgroundColor(new BaseColor(248, 250, 252));
                    table.addCell(cell);
                }
            }
        }

        return table;
    }

    private int mapAlign(String align) {
        if ("CENTER".equalsIgnoreCase(align)) return Element.ALIGN_CENTER;
        if ("RIGHT".equalsIgnoreCase(align)) return Element.ALIGN_RIGHT;
        return Element.ALIGN_LEFT;
    }

    private String resolvePlaceholders(String text, Map<String, Object> context) {
        if (text == null) return "";
        Pattern pattern = Pattern.compile("\\{\\{([^}]+)\\}\\}");
        Matcher matcher = pattern.matcher(text);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String placeholderKey = matcher.group(1).trim();
            Object value = context.get(placeholderKey);
            if (value == null && placeholderKey.contains(".")) {
                // Handle nested mappings (e.g. employee.employeeName)
                String[] parts = placeholderKey.split("\\.");
                Map<String, Object> currentMap = context;
                for (int i = 0; i < parts.length - 1; i++) {
                    Object nested = currentMap.get(parts[i]);
                    if (nested instanceof Map) {
                        currentMap = (Map<String, Object>) nested;
                    } else {
                        break;
                    }
                }
                value = currentMap.get(parts[parts.length - 1]);
            }
            matcher.appendReplacement(sb, value != null ? value.toString() : "");
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private BaseColor parseColor(String hex, BaseColor def) {
        if (hex == null || hex.trim().isEmpty()) return def;
        try {
            if (hex.startsWith("#")) {
                hex = hex.substring(1);
            }
            int r = Integer.parseInt(hex.substring(0, 2), 16);
            int g = Integer.parseInt(hex.substring(2, 4), 16);
            int b = Integer.parseInt(hex.substring(4, 6), 16);
            return new BaseColor(r, g, b);
        } catch (Exception e) {
            return def;
        }
    }

    // PDF Event Handler to draw Page Numbers absolutely
    private class PageNumberEventHandler extends PdfPageEventHelper {
        private final TemplateDto layout;
        private final Map<String, Object> dataContext;

        public PageNumberEventHandler(TemplateDto layout, Map<String, Object> dataContext) {
            this.layout = layout;
            this.dataContext = dataContext;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            float pageHeight = document.getPageSize().getHeight();

            // 1. Draw Page Number Components
            if (layout.components != null) {
                for (ComponentDto c : layout.components) {
                    if ("PAGE_NUMBER".equalsIgnoreCase(c.type)) {
                        if (c.visibility != null && ("HIDDEN".equalsIgnoreCase(c.visibility) || "INVISIBLE".equalsIgnoreCase(c.visibility) || "FALSE".equalsIgnoreCase(c.visibility))) {
                            continue;
                        }
                        cb.saveState();
                        float itextY = pageHeight - c.y - c.height;

                        String text = "Page " + writer.getPageNumber();
                        BaseColor clr = parseColor(c.textColor);
                        Font font = new Font(Font.FontFamily.HELVETICA, c.fontSize, Font.NORMAL, clr);

                        int align = Element.ALIGN_CENTER;
                        if ("LEFT".equalsIgnoreCase(c.alignment)) {
                            align = Element.ALIGN_LEFT;
                        } else if ("RIGHT".equalsIgnoreCase(c.alignment)) {
                            align = Element.ALIGN_RIGHT;
                        }

                        ColumnText ct = new ColumnText(cb);
                        ct.setSimpleColumn(c.x, itextY, c.x + c.width, itextY + c.height);
                        Paragraph p = new Paragraph(text, font);
                        p.setAlignment(align);
                        ct.addElement(p);
                        try {
                            ct.go();
                        } catch (DocumentException e) {
                            // Ignore
                        }
                        cb.restoreState();
                    }
                }
            }

            // 2. Draw Repeating Header Components
            if (layout.header != null && layout.header.components != null) {
                try {
                    drawCanvasComponents(cb, layout.header.components, dataContext, pageHeight, writer);
                } catch (Exception e) {
                    // Ignore
                }
            }

            // 3. Draw Repeating Footer Components
            if (layout.footer != null && layout.footer.components != null) {
                try {
                    drawCanvasComponents(cb, layout.footer.components, dataContext, pageHeight, writer);
                } catch (Exception e) {
                    // Ignore
                }
            }
        }

        private BaseColor parseColor(String hex) {
            if (hex == null) return BaseColor.GRAY;
            try {
                if (hex.startsWith("#")) hex = hex.substring(1);
                return new BaseColor(
                        Integer.parseInt(hex.substring(0, 2), 16),
                        Integer.parseInt(hex.substring(2, 4), 16),
                        Integer.parseInt(hex.substring(4, 6), 16)
                );
            } catch (Exception ex) {
                return BaseColor.GRAY;
            }
        }
    }
}
