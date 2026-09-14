package com.autonoma.erp.modules.platform.files.service;

import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeUtility;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Robust, production-grade EML Email Parser Service.
 * Recursively parses Jakarta Mail MIME structures, decodes Base64/Quoted-Printable payloads,
 * extracts inline CID images into Data URIs, and captures attachments.
 */
@Service
public class EmlPreviewService {

    private static final Logger log = LoggerFactory.getLogger(EmlPreviewService.class);

    public static class EmailContact {
        private String name;
        private String email;

        public EmailContact() {}
        public EmailContact(String name, String email) {
            this.name = name;
            this.email = email;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class EmlAttachmentDto {
        private String fileName;
        private String contentType;
        private long size;

        public EmlAttachmentDto() {}
        public EmlAttachmentDto(String fileName, String contentType, long size) {
            this.fileName = fileName;
            this.contentType = contentType;
            this.size = size;
        }

        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        public String getContentType() { return contentType; }
        public void setContentType(String contentType) { this.contentType = contentType; }
        public long getSize() { return size; }
        public void setSize(long size) { this.size = size; }
    }

    public static class EmlPreviewResponseDto {
        private String subject;
        private EmailContact from;
        private List<EmailContact> to = new ArrayList<>();
        private List<EmailContact> cc = new ArrayList<>();
        private String date;
        private String htmlBody;
        private String textBody;
        private boolean isHtml;
        private List<EmlAttachmentDto> attachments = new ArrayList<>();

        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public EmailContact getFrom() { return from; }
        public void setFrom(EmailContact from) { this.from = from; }
        public List<EmailContact> getTo() { return to; }
        public void setTo(List<EmailContact> to) { this.to = to; }
        public List<EmailContact> getCc() { return cc; }
        public void setCc(List<EmailContact> cc) { this.cc = cc; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public String getHtmlBody() { return htmlBody; }
        public void setHtmlBody(String htmlBody) { this.htmlBody = htmlBody; }
        public String getTextBody() { return textBody; }
        public void setTextBody(String textBody) { this.textBody = textBody; }
        public boolean isHtml() { return isHtml; }
        public void setHtml(boolean html) { isHtml = html; }
        public List<EmlAttachmentDto> getAttachments() { return attachments; }
        public void setAttachments(List<EmlAttachmentDto> attachments) { this.attachments = attachments; }
    }

    private static class ParseContext {
        StringBuilder htmlBuilder = new StringBuilder();
        StringBuilder textBuilder = new StringBuilder();
        Map<String, String> cidMap = new LinkedHashMap<>();
        List<EmlAttachmentDto> attachments = new ArrayList<>();
    }

    /**
     * Parses an EML input stream into an EmlPreviewResponseDto
     */
    public EmlPreviewResponseDto parseEmlStream(InputStream inputStream) throws Exception {
        Session session = Session.getDefaultInstance(new Properties());
        MimeMessage message = new MimeMessage(session, inputStream);

        EmlPreviewResponseDto response = new EmlPreviewResponseDto();

        // 1. Extract Headers
        response.setSubject(decodeHeader(message.getSubject(), "(No Subject)"));
        response.setFrom(parseFirstAddress(message.getFrom()));
        response.setTo(parseAddressList(message.getRecipients(Message.RecipientType.TO)));
        response.setCc(parseAddressList(message.getRecipients(Message.RecipientType.CC)));

        if (message.getSentDate() != null) {
            SimpleDateFormat sdf = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss Z", Locale.ENGLISH);
            response.setDate(sdf.format(message.getSentDate()));
        } else {
            String[] dateHeaders = message.getHeader("Date");
            response.setDate(dateHeaders != null && dateHeaders.length > 0 ? dateHeaders[0] : "");
        }

        // 2. Recursively Parse Parts
        ParseContext ctx = new ParseContext();
        parsePartRecursive(message, ctx);

        String html = ctx.htmlBuilder.toString();
        String text = ctx.textBuilder.toString();

        if (!html.isEmpty()) {
            // Resolve inline CID images in HTML
            String resolvedHtml = resolveCidImages(html, ctx.cidMap);
            response.setHtmlBody(resolvedHtml);
            response.setHtml(true);
        } else if (!text.isEmpty()) {
            response.setTextBody(text);
            response.setHtml(false);
        } else {
            response.setTextBody("(No message content)");
            response.setHtml(false);
        }

        response.setAttachments(ctx.attachments);
        return response;
    }

    private void parsePartRecursive(Part part, ParseContext ctx) throws Exception {
        if (part == null) return;

        String contentType = part.getContentType();
        if (contentType == null) contentType = "text/plain";
        contentType = contentType.toLowerCase();

        String disposition = part.getDisposition();
        String contentId = part.getHeader("Content-ID") != null && part.getHeader("Content-ID").length > 0
                ? part.getHeader("Content-ID")[0].replaceAll("[<>]", "").trim()
                : null;

        String fileName = null;
        try {
            fileName = part.getFileName();
            if (fileName != null) {
                fileName = MimeUtility.decodeText(fileName);
            }
        } catch (Exception ignored) {}

        // A. Is it a Multipart Container?
        if (part.isMimeType("multipart/*") || part.getContent() instanceof Multipart) {
            Multipart multipart = (Multipart) part.getContent();
            int count = multipart.getCount();
            for (int i = 0; i < count; i++) {
                parsePartRecursive(multipart.getBodyPart(i), ctx);
            }
            return;
        }

        // B. Is it an Inline CID Image / Media?
        boolean isInlineImage = (contentId != null && !contentId.isEmpty())
                || part.isMimeType("image/*")
                || (Part.INLINE.equalsIgnoreCase(disposition) && part.isMimeType("image/*"));

        if (isInlineImage && (part.isMimeType("image/*") || (contentId != null))) {
            try (InputStream is = part.getInputStream()) {
                byte[] bytes = IOUtils.toByteArray(is);
                String cleanMime = contentType.split(";")[0].trim();
                if (!cleanMime.startsWith("image/")) {
                    cleanMime = "image/jpeg";
                }
                String base64 = Base64.getEncoder().encodeToString(bytes);
                String dataUrl = "data:" + cleanMime + ";base64," + base64;

                if (contentId != null) {
                    ctx.cidMap.put(contentId, dataUrl);
                    String namePart = contentId.split("@")[0];
                    if (!namePart.isEmpty()) {
                        ctx.cidMap.put(namePart, dataUrl);
                    }
                }
                if (fileName != null && !fileName.isEmpty()) {
                    ctx.cidMap.put(fileName, dataUrl);
                }
            } catch (Exception e) {
                log.warn("Failed to extract inline image part: {}", e.getMessage());
            }
            return;
        }

        // C. Is it an Attachment?
        if (Part.ATTACHMENT.equalsIgnoreCase(disposition) || (fileName != null && !fileName.trim().isEmpty() && !isInlineImage)) {
            long size = part.getSize();
            ctx.attachments.add(new EmlAttachmentDto(fileName, contentType.split(";")[0].trim(), size > 0 ? size : 0));
            return;
        }

        // D. Text / HTML Leaf Body
        if (part.isMimeType("text/html")) {
            String htmlContent = extractStringContent(part);
            if (htmlContent != null && !htmlContent.trim().isEmpty()) {
                if (ctx.htmlBuilder.length() < htmlContent.length()) {
                    ctx.htmlBuilder.setLength(0);
                    ctx.htmlBuilder.append(htmlContent);
                }
            }
        } else if (part.isMimeType("text/plain")) {
            String textContent = extractStringContent(part);
            if (textContent != null && !textContent.trim().isEmpty()) {
                if (ctx.textBuilder.length() == 0) {
                    ctx.textBuilder.append(textContent);
                } else {
                    ctx.textBuilder.append("\n\n").append(textContent);
                }
            }
        }
    }

    private String extractStringContent(Part part) {
        try {
            Object content = part.getContent();
            if (content instanceof String) {
                return (String) content;
            } else if (content instanceof InputStream) {
                try (InputStream is = (InputStream) content) {
                    return IOUtils.toString(is, StandardCharsets.UTF_8);
                }
            }
        } catch (Exception e) {
            try (InputStream is = part.getInputStream()) {
                return IOUtils.toString(is, StandardCharsets.UTF_8);
            } catch (Exception ex) {
                log.warn("Failed to extract string content from part: {}", ex.getMessage());
            }
        }
        return "";
    }

    private String resolveCidImages(String html, Map<String, String> cidMap) {
        if (html == null || cidMap == null || cidMap.isEmpty()) return html;

        Pattern pattern = Pattern.compile("src=[\"']?cid:([^\"'\\s>]+)[\"']?", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(html);
        StringBuffer sb = new StringBuffer();

        while (matcher.find()) {
            String cid = matcher.group(1).replaceAll("[<>]", "").trim();
            String dataUrl = cidMap.get(cid);

            if (dataUrl == null) {
                String namePart = cid.split("@")[0];
                dataUrl = cidMap.get(namePart);
            }

            if (dataUrl == null) {
                for (Map.Entry<String, String> entry : cidMap.entrySet()) {
                    if (entry.getKey().equalsIgnoreCase(cid) || cid.toLowerCase().contains(entry.getKey().toLowerCase())) {
                        dataUrl = entry.getValue();
                        break;
                    }
                }
            }

            if (dataUrl != null) {
                matcher.appendReplacement(sb, Matcher.quoteReplacement("src=\"" + dataUrl + "\""));
            } else {
                matcher.appendReplacement(sb, Matcher.quoteReplacement(matcher.group(0)));
            }
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private String decodeHeader(String header, String defaultValue) {
        if (header == null || header.trim().isEmpty()) return defaultValue;
        try {
            return MimeUtility.decodeText(header);
        } catch (Exception e) {
            return header;
        }
    }

    private EmailContact parseFirstAddress(Address[] addresses) {
        if (addresses == null || addresses.length == 0) {
            return new EmailContact("(No Sender)", "");
        }
        Address addr = addresses[0];
        if (addr instanceof InternetAddress ia) {
            String personal = ia.getPersonal();
            String address = ia.getAddress();
            return new EmailContact(personal != null && !personal.isEmpty() ? personal : address, address != null ? address : "");
        }
        return new EmailContact(addr.toString(), addr.toString());
    }

    private List<EmailContact> parseAddressList(Address[] addresses) {
        List<EmailContact> list = new ArrayList<>();
        if (addresses == null) return list;
        for (Address addr : addresses) {
            if (addr instanceof InternetAddress ia) {
                String personal = ia.getPersonal();
                String address = ia.getAddress();
                list.add(new EmailContact(personal != null && !personal.isEmpty() ? personal : address, address != null ? address : ""));
            } else {
                list.add(new EmailContact(addr.toString(), addr.toString()));
            }
        }
        return list;
    }
}
