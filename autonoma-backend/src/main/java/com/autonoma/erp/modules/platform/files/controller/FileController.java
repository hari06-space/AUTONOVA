package com.autonoma.erp.modules.platform.files.controller;

import com.autonoma.erp.modules.platform.files.service.FileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private static final Logger log = LoggerFactory.getLogger(FileController.class);

    @Autowired
    private FileService fileService;

    @Autowired
    private com.autonoma.erp.modules.platform.files.service.DocxToPdfConverterService docxToPdfConverterService;

    @Autowired
    private com.autonoma.erp.modules.platform.files.service.EmlPreviewService emlPreviewService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "module", required = false) String module,
            @RequestParam(value = "pageCode", required = false) String pageCode,
            @RequestParam(value = "refId", required = false) String refId) {
        try {
            String relativePath = fileService.saveFile(file, module, pageCode, refId);
            String originalName = fileService.getOriginalFileNameForPath(relativePath);
            java.util.Map<String, String> response = new java.util.HashMap<>();
            response.put("filePath", relativePath);
            response.put("path", relativePath);
            response.put("fileName", originalName);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Could not upload the file: " + e.getMessage());
        }
    }

    @GetMapping("/download/{*filename}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable(required = false) String filename,
            @RequestParam(value = "path", required = false) String path) {
        String finalPath = (path != null) ? path : filename;
        return serveFile(finalPath, false);
    }

    @GetMapping("/view/{*filename}")
    public ResponseEntity<Resource> viewFile(
            @PathVariable(required = false) String filename,
            @RequestParam(value = "path", required = false) String path) {
        String finalPath = (path != null) ? path : filename;
        return serveFile(finalPath, true);
    }

    @GetMapping("/metadata")
    public ResponseEntity<?> getFileMetadata(@RequestParam("path") String path) {
        try {
            String originalName = fileService.getOriginalFileNameForPath(path);
            java.util.Map<String, String> response = new java.util.HashMap<>();
            response.put("filePath", path);
            response.put("fileName", originalName);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(404).body("Metadata not found");
        }
    }

    @GetMapping("/preview/docx-to-pdf")
    public ResponseEntity<?> previewDocxAsPdf(@RequestParam("path") String path) {
        try {
            Resource resource = fileService.loadFile(path);
            java.io.ByteArrayOutputStream pdfOutputStream = new java.io.ByteArrayOutputStream();
            try (java.io.InputStream docxInputStream = resource.getInputStream()) {
                docxToPdfConverterService.convertDocxToPdf(docxInputStream, pdfOutputStream);
            }
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"preview.pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfOutputStream.toByteArray());
        } catch (Exception e) {
            log.error("Error converting DOCX to PDF for preview", e);
            return ResponseEntity.status(500).body("Error generating PDF preview: " + e.getMessage());
        }
    }

    @GetMapping("/preview/eml")
    public ResponseEntity<?> previewEml(@RequestParam("path") String path) {
        try {
            Resource resource = fileService.loadFile(path);
            try (java.io.InputStream is = resource.getInputStream()) {
                com.autonoma.erp.modules.platform.files.service.EmlPreviewService.EmlPreviewResponseDto dto = emlPreviewService.parseEmlStream(is);
                return ResponseEntity.ok(dto);
            }
        } catch (Exception e) {
            log.error("Error parsing EML file for preview: path={}", path, e);
            return ResponseEntity.status(500).body(java.util.Map.of("error", "Failed to parse EML preview: " + e.getMessage()));
        }
    }

    @PostMapping("/preview/eml/upload")
    public ResponseEntity<?> previewEmlUpload(@RequestParam("file") MultipartFile file) {
        try {
            try (java.io.InputStream is = file.getInputStream()) {
                com.autonoma.erp.modules.platform.files.service.EmlPreviewService.EmlPreviewResponseDto dto = emlPreviewService.parseEmlStream(is);
                return ResponseEntity.ok(dto);
            }
        } catch (Exception e) {
            log.error("Error parsing uploaded EML file for preview", e);
            return ResponseEntity.status(500).body(java.util.Map.of("error", "Failed to parse EML preview: " + e.getMessage()));
        }
    }

    private ResponseEntity<Resource> serveFile(String filename, boolean inline) {
        try {
            if (filename != null && filename.startsWith("/")) {
                filename = filename.substring(1);
            }

            String decodedFilename = filename;
            Resource resource = fileService.loadFile(decodedFilename);

            Path filePath = resource.getFile().toPath();
            String name = filePath.getFileName().toString().toLowerCase();
            String contentType = null;

            // Prioritize extension-based content type matching to avoid container environment mime detection bugs
            if (name.endsWith(".pdf"))
                contentType = "application/pdf";
            else if (name.endsWith(".png"))
                contentType = "image/png";
            else if (name.endsWith(".jpg") || name.endsWith(".jpeg"))
                contentType = "image/jpeg";
            else if (name.endsWith(".gif"))
                contentType = "image/gif";
            else if (name.endsWith(".webp"))
                contentType = "image/webp";
            else if (name.endsWith(".svg"))
                contentType = "image/svg+xml";
            else if (name.endsWith(".bmp"))
                contentType = "image/bmp";
            else if (name.endsWith(".txt"))
                contentType = "text/plain";
            else if (name.endsWith(".csv"))
                contentType = "text/csv";
            else if (name.endsWith(".json"))
                contentType = "application/json";
            else if (name.endsWith(".xml"))
                contentType = "application/xml";
            else if (name.endsWith(".html") || name.endsWith(".htm"))
                contentType = "text/html";
            else if (name.endsWith(".eml"))
                contentType = "message/rfc822";
            else if (name.endsWith(".msg"))
                contentType = "application/vnd.ms-outlook";
            else if (name.endsWith(".mp3"))
                contentType = "audio/mpeg";
            else if (name.endsWith(".wav"))
                contentType = "audio/wav";
            else if (name.endsWith(".webm"))
                contentType = "audio/webm";
            else if (name.endsWith(".ogg"))
                contentType = "audio/ogg";
            else if (name.endsWith(".m4a"))
                contentType = "audio/mp4";
            else if (name.endsWith(".aac"))
                contentType = "audio/aac";
            else if (name.endsWith(".mp4"))
                contentType = "video/mp4";
            else if (name.endsWith(".mov"))
                contentType = "video/quicktime";
            else if (name.endsWith(".docx"))
                contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            else if (name.endsWith(".doc"))
                contentType = "application/msword";
            else if (name.endsWith(".xlsx"))
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            else if (name.endsWith(".xls"))
                contentType = "application/vnd.ms-excel";
            else if (name.endsWith(".pptx"))
                contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            else if (name.endsWith(".ppt"))
                contentType = "application/vnd.ms-powerpoint";
            else if (name.endsWith(".zip"))
                contentType = "application/zip";
            else if (name.endsWith(".rar"))
                contentType = "application/x-rar-compressed";
            else if (name.endsWith(".7z"))
                contentType = "application/x-7z-compressed";

            if (contentType == null) {
                contentType = Files.probeContentType(filePath);
            }
            if (contentType == null || contentType.equalsIgnoreCase("application/octet-stream")) {
                contentType = "application/octet-stream";
            }

            String originalName = fileService.getOriginalFileNameForPath(filename);
            if (originalName == null || originalName.trim().isEmpty()) {
                originalName = fileService.getOriginalFileName(decodedFilename);
            }
            if (originalName == null || originalName.trim().isEmpty()) {
                originalName = resource.getFilename();
            }
            String safeFilename = "";
            if (originalName != null) {
                StringBuilder sb = new StringBuilder();
                for (char c : originalName.toCharArray()) {
                    if (c == '\u202F' || c == '\u2007' || c == '\u00A0') {
                        sb.append(' ');
                    } else if (c > 255) {
                        sb.append('_');
                    } else {
                        sb.append(c);
                    }
                }
                safeFilename = sb.toString();
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.set(HttpHeaders.CONTENT_DISPOSITION,
                    (inline ? "inline" : "attachment") + "; filename=\"" + safeFilename + "\"");
            
            // Modern security, caching, and streaming headers
            headers.set("X-Content-Type-Options", "nosniff");
            headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
            headers.set(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
            headers.set(HttpHeaders.PRAGMA, "no-cache");
            headers.set(HttpHeaders.EXPIRES, "0");

            try {
                long length = resource.contentLength();
                headers.setContentLength(length);
            } catch (Exception ignored) {}

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
        } catch (Exception e) {
            log.warn("Failed to serve file '{}': {}", filename, e.getMessage());
            return ResponseEntity.status(404).build();
        }
    }

    @PostMapping("/preview/pptx/upload")
    public ResponseEntity<?> previewPptxUpload(@RequestParam("file") MultipartFile file) {
        try {
            try (java.io.InputStream inputStream = file.getInputStream();
                    org.apache.poi.xslf.usermodel.XMLSlideShow ppt = new org.apache.poi.xslf.usermodel.XMLSlideShow(
                            inputStream)) {

                java.awt.Dimension pgsize = ppt.getPageSize();
                java.util.List<org.apache.poi.xslf.usermodel.XSLFSlide> slides = ppt.getSlides();

                java.util.List<String> base64Slides = new java.util.ArrayList<>();
                for (org.apache.poi.xslf.usermodel.XSLFSlide slide : slides) {
                    java.awt.image.BufferedImage img = new java.awt.image.BufferedImage(
                            pgsize.width, pgsize.height, java.awt.image.BufferedImage.TYPE_INT_ARGB);
                    java.awt.Graphics2D graphics = img.createGraphics();

                    graphics.setPaint(java.awt.Color.white);
                    graphics.fill(new java.awt.geom.Rectangle2D.Float(0, 0, pgsize.width, pgsize.height));

                    graphics.setRenderingHint(java.awt.RenderingHints.KEY_ANTIALIASING,
                            java.awt.RenderingHints.VALUE_ANTIALIAS_ON);
                    graphics.setRenderingHint(java.awt.RenderingHints.KEY_RENDERING,
                            java.awt.RenderingHints.VALUE_RENDER_QUALITY);
                    graphics.setRenderingHint(java.awt.RenderingHints.KEY_TEXT_ANTIALIASING,
                            java.awt.RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

                    slide.draw(graphics);

                    java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                    javax.imageio.ImageIO.write(img, "png", baos);
                    byte[] imageBytes = baos.toByteArray();
                    String base64String = "data:image/png;base64,"
                            + java.util.Base64.getEncoder().encodeToString(imageBytes);
                    base64Slides.add(base64String);

                    graphics.dispose();
                }

                return ResponseEntity.ok(base64Slides);
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to convert PowerPoint presentation: " + e.getMessage());
        }
    }

    @GetMapping("/preview/pptx/{*filename}")
    public ResponseEntity<?> previewPptx(
            @PathVariable(required = false) String filename,
            @RequestParam(value = "path", required = false) String path) {
        try {
            String finalPath = (path != null) ? path : filename;
            if (finalPath != null && finalPath.startsWith("/")) {
                finalPath = finalPath.substring(1);
            }
            String decodedFilename = java.net.URLDecoder.decode(finalPath,
                    java.nio.charset.StandardCharsets.UTF_8.name());
            Resource resource = fileService.loadFile(decodedFilename);

            try (java.io.InputStream inputStream = resource.getInputStream();
                    org.apache.poi.xslf.usermodel.XMLSlideShow ppt = new org.apache.poi.xslf.usermodel.XMLSlideShow(
                            inputStream)) {

                java.awt.Dimension pgsize = ppt.getPageSize();
                java.util.List<org.apache.poi.xslf.usermodel.XSLFSlide> slides = ppt.getSlides();

                java.util.List<String> base64Slides = new java.util.ArrayList<>();
                for (org.apache.poi.xslf.usermodel.XSLFSlide slide : slides) {
                    java.awt.image.BufferedImage img = new java.awt.image.BufferedImage(
                            pgsize.width, pgsize.height, java.awt.image.BufferedImage.TYPE_INT_ARGB);
                    java.awt.Graphics2D graphics = img.createGraphics();

                    // Clear background with white
                    graphics.setPaint(java.awt.Color.white);
                    graphics.fill(new java.awt.geom.Rectangle2D.Float(0, 0, pgsize.width, pgsize.height));

                    // Set rendering hints for quality
                    graphics.setRenderingHint(java.awt.RenderingHints.KEY_ANTIALIASING,
                            java.awt.RenderingHints.VALUE_ANTIALIAS_ON);
                    graphics.setRenderingHint(java.awt.RenderingHints.KEY_RENDERING,
                            java.awt.RenderingHints.VALUE_RENDER_QUALITY);
                    graphics.setRenderingHint(java.awt.RenderingHints.KEY_TEXT_ANTIALIASING,
                            java.awt.RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

                    // Render slide
                    slide.draw(graphics);

                    java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                    javax.imageio.ImageIO.write(img, "png", baos);
                    byte[] imageBytes = baos.toByteArray();
                    String base64String = "data:image/png;base64,"
                            + java.util.Base64.getEncoder().encodeToString(imageBytes);
                    base64Slides.add(base64String);

                    graphics.dispose();
                }

                return ResponseEntity.ok(base64Slides);
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to convert PowerPoint presentation: " + e.getMessage());
        }
    }
}
