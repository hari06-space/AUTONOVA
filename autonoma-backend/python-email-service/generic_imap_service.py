import base64
import email
from email.header import decode_header
import logging
import imaplib
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Dict, Any, Optional
from html_parser import EmailHtmlParser

logger = logging.getLogger("GenericImapSmtpService")

def clean_email(email_str: str) -> str:
    email_str = email_str.strip()
    if "<" in email_str and ">" in email_str:
        start = email_str.find("<")
        end = email_str.find(">")
        if start < end:
            return email_str[start + 1:end].strip()
    return email_str

def decode_uid(encoded_uid: str) -> str:
    padding = len(encoded_uid) % 4
    if padding:
        encoded_uid += '=' * (4 - padding)
    return base64.urlsafe_b64decode(encoded_uid.encode('ascii')).decode('utf-8')

class GenericImapSmtpService:
    def __init__(
        self,
        email_address: str,
        password: str,
        provider: str = "GMAIL",
        processed_folder: str = "Processed"
    ):
        self.email_address = email_address
        self.password = password
        self.provider = provider.upper()
        self.processed_folder = processed_folder

        if self.provider == "GMAIL":
            self.imap_server = "imap.gmail.com"
            self.smtp_server = "smtp.gmail.com"
        else:
            # Yahoo Mail
            self.imap_server = "imap.mail.yahoo.com"
            self.smtp_server = "smtp.mail.yahoo.com"
            
        self.imap_port = 993
        self.smtp_port = 587

    def _connect_imap(self) -> imaplib.IMAP4_SSL:
        mail = imaplib.IMAP4_SSL(self.imap_server, self.imap_port)
        mail.login(self.email_address, self.password)
        return mail

    def _decode_header_text(self, text: str) -> str:
        if not text:
            return ""
        decoded = []
        for part, encoding in decode_header(text):
            if isinstance(part, bytes):
                try:
                    decoded.append(part.decode(encoding or "utf-8", errors="ignore"))
                except Exception:
                    decoded.append(part.decode("latin1", errors="ignore"))
            else:
                decoded.append(str(part))
        return "".join(decoded)

    def fetch_recent_emails(self, max_count: int = 20) -> List[Dict[str, Any]]:
        return self._fetch_emails(criterion="ALL", max_count=max_count)

    def fetch_unread_emails(self, max_count: int = 20) -> List[Dict[str, Any]]:
        return self._fetch_emails(criterion="UNSEEN", max_count=max_count)

    def _fetch_emails(self, criterion: str, max_count: int) -> List[Dict[str, Any]]:
        mail = self._connect_imap()
        try:
            mail.select("inbox")
            status, data = mail.search(None, criterion)
            if status != "OK" or not data or not data[0]:
                return []
            
            mail_ids = data[0].split()
            # Sort descending (recent first)
            mail_ids = list(reversed(mail_ids))[:max_count]
            
            messages = []
            for mid in mail_ids:
                try:
                    status, msg_data = mail.fetch(mid, "(RFC822)")
                    if status != "OK" or not msg_data:
                        continue
                    
                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)
                    
                    uid_str = mid.decode('utf-8')
                    encoded_uid = base64.urlsafe_b64encode(uid_str.encode('utf-8')).decode('ascii').rstrip('=')
                    
                    parsed = self._parse_mime_message(encoded_uid, msg)
                    messages.append(parsed)
                except Exception as e:
                    logger.error(f"Error fetching/parsing IMAP email {mid}: {e}")
            return messages
        finally:
            try:
                mail.logout()
            except:
                pass

    def _parse_mime_message(self, uid: str, msg: email.message.Message) -> Dict[str, Any]:
        subject = self._decode_header_text(msg.get("Subject", ""))
        from_hdr = self._decode_header_text(msg.get("From", ""))
        to_hdr = self._decode_header_text(msg.get("To", ""))
        message_id = msg.get("Message-ID", f"UID-{uid}")
        date_hdr = msg.get("Date", "")

        body_html = ""
        body_text = ""
        has_attachments = False

        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition", ""))

                if "attachment" in content_disposition or part.get_filename():
                    has_attachments = True
                    continue

                if content_type == "text/html" and not body_html:
                    body_html = part.get_payload(decode=True).decode(errors="ignore")
                elif content_type == "text/plain" and not body_text:
                    body_text = part.get_payload(decode=True).decode(errors="ignore")
        else:
            content_type = msg.get_content_type()
            if content_type == "text/html":
                body_html = msg.get_payload(decode=True).decode(errors="ignore")
            else:
                body_text = msg.get_payload(decode=True).decode(errors="ignore")

        bs4_result = EmailHtmlParser.parse_html(body_html or body_text)
        cc_hdr = self._decode_header_text(msg.get("Cc", ""))

        # Thread mapping: get root message ID
        references_hdr = msg.get("References", "")
        in_reply_to_hdr = msg.get("In-Reply-To", "")
        conv_id = ""
        if references_hdr:
            refs = [r.strip() for r in references_hdr.split() if r.strip()]
            if refs:
                conv_id = refs[0]
        if not conv_id and in_reply_to_hdr:
            conv_id = in_reply_to_hdr.strip()
        if not conv_id:
            conv_id = message_id

        return {
            "uid": uid,
            "id": message_id,
            "subject": subject,
            "from": from_hdr,
            "to": to_hdr,
            "cc": cc_hdr,
            "date": date_hdr,
            "body_html": body_html,
            "body_text": bs4_result["text"],
            "tables": bs4_result["tables"],
            "links": bs4_result["links"],
            "has_attachments": has_attachments,
            "in_reply_to": msg.get("In-Reply-To", ""),
            "references": msg.get("References", ""),
            "conversation_id": conv_id
        }

    def get_attachments(self, uid: str) -> List[Dict[str, Any]]:
        decoded_uid = decode_uid(uid)
        mail = self._connect_imap()
        try:
            mail.select("inbox")
            status, msg_data = mail.fetch(decoded_uid.encode('utf-8'), "(RFC822)")
            if status != "OK" or not msg_data:
                return []
            
            raw_email = msg_data[0][1]
            msg = email.message_from_bytes(raw_email)
            
            # Extract plain text and HTML bodies for filtering context
            body_html = ""
            body_text = ""
            for p in msg.walk():
                if p.get_content_type() == "text/html":
                    body_html = p.get_payload(decode=True).decode('utf-8', errors='ignore')
                elif p.get_content_type() == "text/plain":
                    body_text = p.get_payload(decode=True).decode('utf-8', errors='ignore')
            
            if body_html and not body_text:
                from html_parser import EmailHtmlParser
                body_text = EmailHtmlParser.parse_html(body_html)["text"]
            
            from html_parser import AttachmentFilter
            attachments = []
            for part in msg.walk():
                if part.get_content_maintype() == 'multipart':
                    continue
                
                filename = part.get_filename()
                content_disposition = str(part.get('Content-Disposition', ''))
                
                if not content_disposition and not filename:
                    continue
                
                is_inline = False
                if "inline" in content_disposition.lower():
                    is_inline = True
                
                content_id = part.get('Content-ID', '')
                content_type = part.get_content_type()
                
                decoded_filename = ""
                if filename:
                    for part_str, encoding in decode_header(filename):
                        if isinstance(part_str, bytes):
                            decoded_filename += part_str.decode(encoding or "utf-8", errors="ignore")
                        else:
                            decoded_filename += part_str
                else:
                    decoded_filename = "attachment.bin"
                
                file_data = part.get_payload(decode=True)
                if not file_data:
                    continue
                
                size = len(file_data)
                
                # Apply Attachment Filter
                if not AttachmentFilter.should_keep_image(
                    filename=decoded_filename,
                    content_type=content_type,
                    is_inline=is_inline,
                    content_id=content_id,
                    body_html=body_html,
                    body_text=body_text,
                    size_bytes=size
                ):
                    continue
                
                content_b64 = base64.b64encode(file_data).decode('utf-8')
                attachments.append({
                    "id": filename or decoded_filename,
                    "name": decoded_filename,
                    "contentType": content_type,
                    "size": size,
                    "contentBytes": content_b64
                })
            return attachments
        finally:
            try:
                mail.logout()
            except:
                pass

    def mark_as_read(self, uid: str):
        decoded_uid = decode_uid(uid)
        mail = self._connect_imap()
        try:
            mail.select("inbox")
            mail.store(decoded_uid.encode('utf-8'), '+FLAGS', '\\Seen')
        finally:
            try:
                mail.logout()
            except:
                pass

    def move_to_processed_folder(self, uid: str, folder_name: Optional[str] = None) -> str:
        target_folder = folder_name or self.processed_folder
        decoded_uid = decode_uid(uid)
        mail = self._connect_imap()
        try:
            mail.select("inbox")
            # Check if target folder exists
            status, folder_list = mail.list(pattern=target_folder)
            if not folder_list or not folder_list[0]:
                mail.create(target_folder)
                
            status, copy_data = mail.copy(decoded_uid.encode('utf-8'), target_folder)
            if status == "OK":
                mail.store(decoded_uid.encode('utf-8'), '+FLAGS', '\\Deleted')
                mail.expunge()
            return uid
        finally:
            try:
                mail.logout()
            except:
                pass

    def send_reply_with_attachment(
        self,
        original_message_id: str,
        to_email: str,
        cc_emails: Optional[List[str]],
        subject: str,
        html_body: str,
        file_bytes: bytes,
        file_name: str,
        reply_all: bool = False
    ):
        msg = MIMEMultipart()
        msg["From"] = self.email_address
        msg["To"] = to_email
        if cc_emails:
            msg["Cc"] = ", ".join(cc_emails)
        msg["Subject"] = "RE: " + subject
        if original_message_id:
            msg["In-Reply-To"] = original_message_id
            msg["References"] = original_message_id

        msg.attach(MIMEText(html_body, "html"))

        part = MIMEBase("application", "octet-stream")
        part.set_payload(file_bytes)
        encoders.encode_base64(part)
        part.add_header(
            "Content-Disposition",
            f"attachment; filename= {file_name}",
        )
        msg.attach(part)

        server = smtplib.SMTP(self.smtp_server, self.smtp_port)
        try:
            server.starttls()
            server.login(self.email_address, self.password)
            
            recipients = [clean_email(to_email)]
            if cc_emails:
                recipients.extend([clean_email(cc) for cc in cc_emails if clean_email(cc)])
                
            server.sendmail(self.email_address, recipients, msg.as_string())
        finally:
            server.quit()
