package com.nutech.email.service;

import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.concurrent.CompletableFuture;
import java.util.List;
import java.util.ArrayList;
import com.nutech.email.dto.AiDto.ExtractedPart;

@Service
@Slf4j
public class OcrService {

    @Value("${ocr.tessdata-path:/usr/share/tesseract-ocr/5/tessdata}")
    private String tessdataPath;

    @Value("${ocr.language:eng}")
    private String language;

    @Value("${ocr.reader-endpoint:http://192.168.1.189:5000}")
    private String readerEndpoint;

    /**
     * Extract text from a PDF. Tries text extraction first, falls back to OCR for image-only PDFs.
     */
    @Async("taskExecutor")
    public CompletableFuture<String> extractTextFromPdf(byte[] pdfBytes) {
        long start = System.currentTimeMillis();
        try {
            PDDocument document = Loader.loadPDF(pdfBytes);
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);

            // If text extraction yields very little, the PDF is likely image-based
            if (text.trim().length() < 50) {
                log.info("PDF appears image-based, falling back to OCR");
                text = ocrPdfPages(document);
            }

            document.close();
            log.debug("PDF text extraction completed in {}ms, {} chars", 
                      System.currentTimeMillis() - start, text.length());
            return CompletableFuture.completedFuture(text);
        } catch (Exception e) {
            log.error("PDF text extraction failed: {}", e.getMessage(), e);
            return CompletableFuture.completedFuture("");
        }
    }

    /**
     * Extract text from an image (JPG/PNG) using Tesseract OCR.
     */
    @Async("taskExecutor")
    public CompletableFuture<String> extractTextFromImage(byte[] imageBytes) {
        long start = System.currentTimeMillis();
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageBytes));
            if (image == null) {
                log.warn("Could not read image bytes");
                return CompletableFuture.completedFuture("");
            }

            Tesseract tesseract = createTesseract();
            String text = tesseract.doOCR(image);

            log.debug("Image OCR completed in {}ms, {} chars",
                      System.currentTimeMillis() - start, text.length());
            return CompletableFuture.completedFuture(text);
        } catch (Exception e) {
            log.error("Image OCR failed: {}", e.getMessage(), e);
            return CompletableFuture.completedFuture("");
        }
    }

    private String ocrPdfPages(PDDocument document) throws Exception {
        PDFRenderer renderer = new PDFRenderer(document);
        Tesseract tesseract = createTesseract();
        StringBuilder fullText = new StringBuilder();

        for (int page = 0; page < document.getNumberOfPages(); page++) {
            BufferedImage image = renderer.renderImageWithDPI(page, 300);
            String pageText = tesseract.doOCR(image);
            fullText.append(pageText).append("\n");
        }

        return fullText.toString();
    }

    private Tesseract createTesseract() {
        Tesseract tesseract = new Tesseract();
        tesseract.setDatapath(tessdataPath);
        tesseract.setLanguage(language);
        tesseract.setPageSegMode(1); // Automatic page segmentation with OSD
        return tesseract;
    }

    public List<ExtractedPart> extractPartsFromExternalOcr(byte[] pdfBytes, String fileName, String customerName) {
        log.info("Attempting external OCR parsing via endpoint: {}", readerEndpoint);
        List<ExtractedPart> extractedParts = new ArrayList<>();
        try {
            String boundary = "----WebKitFormBoundary" + java.util.UUID.randomUUID().toString();
            String lineFeed = "\r\n";
            ByteArrayOutputStream byteStream = new ByteArrayOutputStream();
            OutputStreamWriter writer = new OutputStreamWriter(byteStream, java.nio.charset.StandardCharsets.UTF_8);

            writer.write("--" + boundary + lineFeed);
            writer.write("Content-Disposition: form-data; name=\"file\"; filename=\"" + fileName + "\"" + lineFeed);
            writer.write("Content-Type: application/octet-stream" + lineFeed);
            writer.write(lineFeed);
            writer.flush();
            byteStream.write(pdfBytes);
            writer.write(lineFeed);

            writer.write("--" + boundary + lineFeed);
            writer.write("Content-Disposition: form-data; name=\"customer_name\"" + lineFeed);
            writer.write(lineFeed);
            writer.write((customerName != null ? customerName : "default") + lineFeed);

            writer.write("--" + boundary + "--" + lineFeed);
            writer.flush();

            java.net.http.HttpRequest httpRequest = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(readerEndpoint + "/parsedata"))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofByteArray(byteStream.toByteArray()))
                    .build();

            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpResponse<String> response = client.send(httpRequest, java.net.http.HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode rootNode = mapper.readTree(response.body());
                com.fasterxml.jackson.databind.JsonNode itemListNode = rootNode.get("item_list");
                if (itemListNode != null && itemListNode.isArray()) {
                    for (com.fasterxml.jackson.databind.JsonNode node : itemListNode) {
                        String partNo = node.has("part_no") ? node.get("part_no").asText() : "";
                        String partName = node.has("part_name") ? node.get("part_name").asText() : "";
                        double quantity = node.has("quantity") ? node.get("quantity").asDouble() : 1.0;
                        
                        if (!partNo.trim().isEmpty()) {
                            extractedParts.add(ExtractedPart.builder()
                                    .partCode(partNo)
                                    .quantity((int) Math.round(quantity))
                                    .surroundingContext(partName + " (from PDF via client OCR)")
                                    .build());
                        }
                    }
                }
            } else {
                log.warn("External OCR request failed with status: {}", response.statusCode());
            }
        } catch (Exception e) {
            log.error("Failed to parse PDF via external OCR: {}", e.getMessage());
        }
        return extractedParts;
    }
}
