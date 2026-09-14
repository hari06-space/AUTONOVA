package com.nutech.email.integration;

import com.azure.identity.ClientSecretCredential;
import com.azure.identity.ClientSecretCredentialBuilder;
import com.microsoft.graph.models.Message;
import com.microsoft.graph.models.Attachment;
import com.microsoft.graph.models.FileAttachment;
import com.microsoft.graph.models.ItemBody;
import com.microsoft.graph.models.BodyType;
import com.microsoft.graph.models.MailFolder;
import com.microsoft.graph.serviceclient.GraphServiceClient;
import com.microsoft.graph.users.item.messages.item.move.MovePostRequestBody;
import com.microsoft.graph.users.item.messages.item.reply.ReplyPostRequestBody;
import com.microsoft.graph.users.item.messages.item.replyall.ReplyAllPostRequestBody;
import com.microsoft.graph.models.Recipient;
import com.microsoft.graph.models.EmailAddress;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;
import java.util.Collections;

@Service
@Slf4j
public class GraphMailService {

    @Value("${msgraph.tenant-id}")
    private String tenantId;

    @Value("${msgraph.client-id}")
    private String clientId;

    @Value("${msgraph.client-secret}")
    private String clientSecret;

    @Value("${msgraph.shared-mailbox}")
    private String sharedMailbox;

    @Value("${msgraph.processed-folder-name:Processed}")
    private String processedFolderName;

    private GraphServiceClient graphClient;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private PythonMailServiceBridge pythonMailServiceBridge;

    @Value("${python.email.service.enabled:false}")
    private boolean pythonServiceEnabled;

    @PostConstruct
    public void init() {
        if (pythonServiceEnabled) {
            log.info("Python Mail Service is enabled. Skipping static GraphServiceClient initialization.");
            return;
        }
        try {
            ClientSecretCredential credential = new ClientSecretCredentialBuilder()
                    .tenantId(tenantId)
                    .clientId(clientId)
                    .clientSecret(clientSecret)
                    .build();

            graphClient = new GraphServiceClient(credential, "https://graph.microsoft.com/.default");
            log.info("Microsoft Graph client initialized for mailbox: {}", sharedMailbox);
        } catch (Exception e) {
            log.warn("Failed to initialize static Microsoft Graph client (expected if using OAuth/Python bridge): {}", e.getMessage());
        }
    }

    public List<Message> fetchUnreadEmails(int maxCount) {
        if (pythonServiceEnabled) {
            return pythonMailServiceBridge.fetchUnreadEmails(maxCount);
        }
        return fetchEmails("isRead eq false", maxCount);
    }

    public List<Message> fetchRecentEmails(int maxCount) {
        if (pythonServiceEnabled) {
            return pythonMailServiceBridge.fetchRecentEmails(maxCount);
        }
        return fetchEmails(null, maxCount);
    }

    private List<Message> fetchEmails(String filter, int maxCount) {
        try {
            var messages = graphClient.users().byUserId(sharedMailbox)
                    .messages()
                    .get(config -> {
                        if (filter != null) config.queryParameters.filter = filter;
                        config.queryParameters.top = maxCount;
                        config.queryParameters.orderby = new String[]{"receivedDateTime desc"};
                        config.queryParameters.select = new String[]{
                            "id", "subject", "from", "toRecipients", "bodyPreview", "receivedDateTime",
                            "hasAttachments", "isRead", "body"
                        };
                    });

            return messages != null && messages.getValue() != null
                    ? messages.getValue()
                    : Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to fetch emails (filter: {}): {}", filter, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    public List<Attachment> getAttachments(String messageId) {
        if (pythonServiceEnabled) {
            return pythonMailServiceBridge.getAttachments(messageId);
        }
        try {
            var attachments = graphClient.users().byUserId(sharedMailbox)
                    .messages().byMessageId(messageId)
                    .attachments()
                    .get();

            return attachments != null && attachments.getValue() != null
                    ? attachments.getValue()
                    : Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to get attachments for message {}: {}", messageId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    public void markAsRead(String messageId) {
        if (pythonServiceEnabled) {
            pythonMailServiceBridge.markAsRead(messageId);
            return;
        }
        try {
            Message msg = new Message();
            msg.setIsRead(true);
            graphClient.users().byUserId(sharedMailbox)
                    .messages().byMessageId(messageId)
                    .patch(msg);
            log.debug("Marked message {} as read", messageId);
        } catch (Exception e) {
            log.error("Failed to mark message {} as read: {}", messageId, e.getMessage(), e);
        }
    }

    public void sendReplyWithAttachment(String originalMessageId, String toEmail, List<String> ccEmails, String subject,
                                         String htmlBody, byte[] pdfBytes, String pdfFileName) {
        boolean hasCc = ccEmails != null && !ccEmails.isEmpty();
        sendReplyWithAttachment(originalMessageId, toEmail, ccEmails, subject, htmlBody, pdfBytes, pdfFileName, hasCc);
    }

    public void sendReplyWithAttachment(String originalMessageId, String toEmail, List<String> ccEmails, String subject,
                                         String htmlBody, byte[] fileBytes, String fileName, boolean replyAll) {
        if (pythonServiceEnabled) {
            pythonMailServiceBridge.sendReplyWithAttachment(originalMessageId, toEmail, ccEmails, subject, htmlBody, fileBytes, fileName, replyAll);
            return;
        }
        try {
            Message reply = new Message();
            reply.setSubject("RE: " + subject);

            ItemBody body = new ItemBody();
            body.setContentType(BodyType.Html);
            body.setContent(htmlBody);
            reply.setBody(body);

            FileAttachment fileAttachment = new FileAttachment();
            fileAttachment.setOdataType("#microsoft.graph.fileAttachment");
            fileAttachment.setName(fileName);
            if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
                fileAttachment.setContentType("application/vnd.ms-excel");
            } else {
                fileAttachment.setContentType("application/pdf");
            }
            fileAttachment.setContentBytes(fileBytes);

            reply.setAttachments(List.of(fileAttachment));

            if (ccEmails != null && !ccEmails.isEmpty()) {
                List<Recipient> ccRecipients = new ArrayList<>();
                for (String cc : ccEmails) {
                    Recipient r = new Recipient();
                    EmailAddress ea = new EmailAddress();
                    ea.setAddress(cc);
                    r.setEmailAddress(ea);
                    ccRecipients.add(r);
                }
                reply.setCcRecipients(ccRecipients);
            }

            if (replyAll) {
                ReplyAllPostRequestBody bodyReq = new ReplyAllPostRequestBody();
                bodyReq.setMessage(reply);

                graphClient.users().byUserId(sharedMailbox)
                        .messages().byMessageId(originalMessageId)
                        .replyAll()
                        .post(bodyReq);
            } else {
                ReplyPostRequestBody bodyReq = new ReplyPostRequestBody();
                bodyReq.setMessage(reply);

                graphClient.users().byUserId(sharedMailbox)
                        .messages().byMessageId(originalMessageId)
                        .reply()
                        .post(bodyReq);
            }

            log.info("Reply (replyAll={}) sent for message {}", replyAll, originalMessageId);
        } catch (Exception e) {
            log.error("Failed to send reply for message {}: {}", originalMessageId, e.getMessage(), e);
            throw new RuntimeException("Failed to send reply email", e);
        }
    }

    public String moveToProcessedFolder(String messageId) {
        if (pythonServiceEnabled) {
            return pythonMailServiceBridge.moveToProcessedFolder(messageId);
        }
        try {
            String folderId = getOrCreateFolder(processedFolderName);
            MovePostRequestBody moveBody = new MovePostRequestBody();
            moveBody.setDestinationId(folderId);

            Message movedMessage = graphClient.users().byUserId(sharedMailbox)
                    .messages().byMessageId(messageId)
                    .move()
                    .post(moveBody);

            log.debug("Moved message {} to Processed folder. New ID: {}", messageId, movedMessage.getId());
            return movedMessage.getId();
        } catch (Exception e) {
            log.error("Failed to move message {} to Processed: {}", messageId, e.getMessage(), e);
            return messageId; // Return original if move failed or was already there
        }
    }

    private String getOrCreateFolder(String folderName) {
        try {
            var folders = graphClient.users().byUserId(sharedMailbox)
                    .mailFolders()
                    .get(config -> {
                        config.queryParameters.filter = "displayName eq '" + folderName + "'";
                    });

            if (folders != null && folders.getValue() != null && !folders.getValue().isEmpty()) {
                return folders.getValue().get(0).getId();
            }

            MailFolder newFolder = new MailFolder();
            newFolder.setDisplayName(folderName);
            MailFolder created = graphClient.users().byUserId(sharedMailbox)
                    .mailFolders()
                    .post(newFolder);
            return created.getId();
        } catch (Exception e) {
            log.error("Failed to get/create folder {}: {}", folderName, e.getMessage(), e);
            throw new RuntimeException("Cannot access mail folder: " + folderName, e);
        }
    }
    public List<Message> fetchUnreadEmails(int maxCount, com.nutech.email.model.OcrConfig cfg) {
        if (pythonServiceEnabled) {
            return pythonMailServiceBridge.fetchUnreadEmails(maxCount, cfg);
        }
        return fetchEmails("isRead eq false", maxCount); // Fallback to default static config
    }

    public List<Message> fetchRecentEmails(int maxCount, com.nutech.email.model.OcrConfig cfg) {
        if (pythonServiceEnabled) {
            return pythonMailServiceBridge.fetchRecentEmails(maxCount, cfg);
        }
        return fetchEmails(null, maxCount); // Fallback to default static config
    }

    public List<Attachment> getAttachments(String messageId, com.nutech.email.model.OcrConfig cfg) {
        if (pythonServiceEnabled) {
            return pythonMailServiceBridge.getAttachments(messageId, cfg);
        }
        return getAttachments(messageId); // Fallback to default static config
    }

    public void markAsRead(String messageId, com.nutech.email.model.OcrConfig cfg) {
        if (pythonServiceEnabled) {
            pythonMailServiceBridge.markAsRead(messageId, cfg);
            return;
        }
        markAsRead(messageId); // Fallback to default static config
    }

    public String moveToProcessedFolder(String messageId, com.nutech.email.model.OcrConfig cfg) {
        if (pythonServiceEnabled) {
            return pythonMailServiceBridge.moveToProcessedFolder(messageId, cfg);
        }
        return moveToProcessedFolder(messageId); // Fallback to default static config
    }

    public void sendReplyWithAttachment(String originalMessageId, String toEmail, List<String> ccEmails, String subject,
                                         String htmlBody, byte[] fileBytes, String fileName, boolean replyAll, com.nutech.email.model.OcrConfig cfg) {
        if (pythonServiceEnabled) {
            pythonMailServiceBridge.sendReplyWithAttachment(originalMessageId, toEmail, ccEmails, subject, htmlBody, fileBytes, fileName, replyAll, cfg);
            return;
        }
        sendReplyWithAttachment(originalMessageId, toEmail, ccEmails, subject, htmlBody, fileBytes, fileName, replyAll); // Fallback to default static config
    }
}
