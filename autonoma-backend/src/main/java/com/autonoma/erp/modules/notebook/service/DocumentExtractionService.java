package com.autonoma.erp.modules.notebook.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.autonoma.erp.service.ai.GeminiService;

import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;
import java.util.stream.Collectors;

/**
 * Handles document text extraction for Notebook AI grounding.
 * Supports PDF (PDFBox), Word .docx (POI), Excel .xlsx (POI),
 * plain text, URL scraping (Jsoup), and image OCR via Gemini Vision.
 */
@Service
public class DocumentExtractionService {

    @Autowired
    private GeminiService geminiService;

    private static final int MAX_CONTENT_CHARS = 50_000; // Gemini context limit guard
    private static final int URL_TIMEOUT_MS = 10_000;

    // ─── Main dispatch by file type ────────────────────────────────────────────

    public ExtractionResult extractFromFile(MultipartFile file) {
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";

        try {
            long fileSizeKb = file.getSize() / 1024;

            if (originalName.endsWith(".pdf") || contentType.contains("pdf")) {
                String text = extractPdf(file.getInputStream());
                return new ExtractionResult(truncate(text), "DONE", (int) fileSizeKb);

            } else if (originalName.endsWith(".docx") || contentType.contains("wordprocessingml")) {
                String text = extractDocx(file.getInputStream());
                return new ExtractionResult(truncate(text), "DONE", (int) fileSizeKb);

            } else if (originalName.endsWith(".xlsx") || originalName.endsWith(".xls") || contentType.contains("spreadsheetml")) {
                String text = extractExcel(file.getInputStream());
                return new ExtractionResult(truncate(text), "DONE", (int) fileSizeKb);

            } else if (contentType.startsWith("image/") || originalName.matches(".*\\.(png|jpg|jpeg|gif|webp|bmp)$")) {
                String text = extractImageViaGemini(file.getBytes(), contentType.startsWith("image/") ? contentType : "image/jpeg");
                return new ExtractionResult(truncate(text), "DONE", (int) fileSizeKb);

            } else if (contentType.startsWith("text/") || originalName.endsWith(".txt") || originalName.endsWith(".csv")) {
                String text = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
                return new ExtractionResult(truncate(text), "DONE", (int) fileSizeKb);

            } else {
                return new ExtractionResult("[File type not supported for text extraction: " + originalName + "]", "FAILED", (int) fileSizeKb);
            }
        } catch (Exception e) {
            return new ExtractionResult("[Extraction failed: " + e.getMessage() + "]", "FAILED", 0);
        }
    }

    // ─── URL Scraping ──────────────────────────────────────────────────────────

    public ExtractionResult extractFromUrl(String url) {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 BOS-Notebook-AI")
                    .timeout(URL_TIMEOUT_MS)
                    .get();

            // Remove scripts, styles, nav, footer noise
            doc.select("script, style, nav, footer, header, [role=navigation], .ads, .cookie-banner").remove();

            String title = doc.title();
            String body = doc.body().text().replaceAll("\\s{2,}", " ").trim();
            String combined = (title.isBlank() ? "" : "Page Title: " + title + "\n\n") + body;

            return new ExtractionResult(truncate(combined), "DONE", 0);
        } catch (Exception e) {
            return new ExtractionResult("[URL scraping failed: " + e.getMessage() + "]", "FAILED", 0);
        }
    }

    // ─── PDF via PDFBox ────────────────────────────────────────────────────────

    private String extractPdf(InputStream is) throws IOException {
        try (PDDocument doc = Loader.loadPDF(is.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);
            return text != null ? text.trim() : "";
        }
    }

    // ─── Word .docx via Apache POI ────────────────────────────────────────────

    private String extractDocx(InputStream is) throws IOException {
        try (XWPFDocument doc = new XWPFDocument(is)) {
            return doc.getParagraphs().stream()
                    .map(XWPFParagraph::getText)
                    .filter(t -> t != null && !t.isBlank())
                    .collect(Collectors.joining("\n"));
        }
    }

    // ─── Excel .xlsx via Apache POI ───────────────────────────────────────────

    private String extractExcel(InputStream is) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook(is)) {
            StringBuilder sb = new StringBuilder();
            wb.forEach(sheet -> {
                sb.append("--- Sheet: ").append(sheet.getSheetName()).append(" ---\n");
                sheet.forEach(row -> {
                    StringBuilder rowSb = new StringBuilder();
                    row.forEach(cell -> {
                        String val = "";
                        try { val = cell.toString(); } catch (Exception ignored) {}
                        rowSb.append(val).append("\t");
                    });
                    String rowStr = rowSb.toString().trim();
                    if (!rowStr.isEmpty()) sb.append(rowStr).append("\n");
                });
                sb.append("\n");
            });
            return sb.toString().trim();
        }
    }

    // ─── Image OCR via Gemini Vision ──────────────────────────────────────────

    private String extractImageViaGemini(byte[] imageBytes, String mimeType) {
        // Use Gemini's native vision capability — encode image as base64 and ask it to transcribe
        String base64 = Base64.getEncoder().encodeToString(imageBytes);
        String prompt = "data:" + mimeType + ";base64," + base64 +
                "\n\nThis is an image from a business document. Extract and return ALL visible text from this image accurately. " +
                "Preserve table structure where possible. If no text is visible, describe what you see briefly.";
        return geminiService.generateResponse(
                "You are an OCR engine. Extract text from this image accurately and completely.", prompt);
    }

    // ─── Utility ──────────────────────────────────────────────────────────────

    private String truncate(String text) {
        if (text == null) return "";
        return text.length() > MAX_CONTENT_CHARS ? text.substring(0, MAX_CONTENT_CHARS) + "\n[Content truncated due to length...]" : text;
    }

    // ─── Result DTO ───────────────────────────────────────────────────────────

    public static class ExtractionResult {
        public final String content;
        public final String status;   // DONE | FAILED
        public final int fileSizeKb;

        public ExtractionResult(String content, String status, int fileSizeKb) {
            this.content = content;
            this.status = status;
            this.fileSizeKb = fileSizeKb;
        }
    }
}
