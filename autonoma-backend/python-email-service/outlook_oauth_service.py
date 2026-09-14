"""
Outlook OAuth 2.0 Email Service Module.
Uses msal for token management and Microsoft Graph REST API for full email operations.
Integrated with EmailHtmlParser (BeautifulSoup) for body parsing.
"""

import base64
import smtplib
import logging
from typing import List, Dict, Any, Optional
import msal
import requests

from html_parser import EmailHtmlParser

logger = logging.getLogger("OutlookOAuthService")

def clean_email(email_str: str) -> str:
    email_str = email_str.strip()
    if "<" in email_str and ">" in email_str:
        start = email_str.find("<")
        end = email_str.find(">")
        if start < end:
            return email_str[start + 1:end].strip()
    return email_str

class OutlookOAuthService:
    def __init__(
        self,
        tenant_id: str,
        client_id: str,
        client_secret: str,
        shared_mailbox: str,
        redirect_uri: str = "http://localhost:3001/oauth/callback",
        processed_folder: str = "Processed",
        imap_server: str = "outlook.office365.com",
        imap_port: int = 993,
        smtp_server: str = "smtp.office365.com",
        smtp_port: int = 587,
        fallback_client_secret: str = None
    ):
        self.tenant_id = tenant_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.shared_mailbox = shared_mailbox
        self.redirect_uri = redirect_uri
        self.processed_folder = processed_folder
        self.imap_server = imap_server
        self.imap_port = imap_port
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.fallback_client_secret = fallback_client_secret

        self.authority = f"https://login.microsoftonline.com/{self.tenant_id}"
        self.scopes = [
            "https://graph.microsoft.com/Mail.ReadWrite",
            "https://graph.microsoft.com/Mail.Send"
        ]

        self.msal_app = msal.ConfidentialClientApplication(
            self.client_id,
            authority=self.authority,
            client_credential=self.client_secret
        )

        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None

    # -------------------------------------------------------------------
    # OAuth Token Management
    # -------------------------------------------------------------------
    def get_authorization_url(self) -> str:
        """Returns the Microsoft OAuth 2.0 authorization URL for frontend redirect."""
        return self.msal_app.get_authorization_request_url(
            scopes=self.scopes,
            redirect_uri=self.redirect_uri
        )

    def acquire_tokens_by_code(self, code: str) -> Dict[str, Any]:
        """Exchanges authorization code for Access & Refresh tokens."""
        result = self.msal_app.acquire_token_by_authorization_code(
            code=code,
            scopes=self.scopes,
            redirect_uri=self.redirect_uri
        )
        if "access_token" in result:
            self.access_token = result["access_token"]
            self.refresh_token = result.get("refresh_token")
            logger.info("Successfully acquired access token via OAuth2 code exchange.")
            return result
        else:
            error_desc = result.get("error_description", result.get("error", "Unknown error"))
            logger.error(f"Failed to acquire tokens: {error_desc}")
            raise RuntimeError(f"Token acquisition failed: {error_desc}")

    def refresh_token_if_needed(self, scopes: Optional[List[str]] = None) -> str:
        """Refreshes access token if expired or missing."""
        target_scopes = scopes if scopes else self.scopes

        if self.access_token and not scopes:
            return self.access_token

        if not self.refresh_token:
            logger.warning("No refresh token available. User authentication required.")
            raise RuntimeError("No refresh token available. User authentication required.")

        result = self.msal_app.acquire_token_by_refresh_token(
            refresh_token=self.refresh_token,
            scopes=target_scopes
        )
        if "access_token" in result:
            if not scopes:
                self.access_token = result["access_token"]
            if "refresh_token" in result:
                self.refresh_token = result["refresh_token"]
            logger.info(f"Successfully acquired token for scopes: {target_scopes}")
            return result["access_token"]
        else:
            error_desc = result.get("error_description", result.get("error", "Unknown error"))
            logger.error(f"Failed to acquire token: {error_desc}")
            raise RuntimeError(f"Token acquisition failed: {error_desc}")

    # -------------------------------------------------------------------
    # Microsoft Graph API Helper Wrapper
    # -------------------------------------------------------------------
    def _make_graph_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Helper to make a Graph API request, dynamically handling /users/{email} vs /me fallback on access denied."""
        # Determine scope based on whether it is a sendMail endpoint
        is_send = "sendMail" in endpoint
        scopes = ["https://graph.microsoft.com/Mail.Send"] if is_send else ["https://graph.microsoft.com/Mail.ReadWrite"]
        
        token = self.refresh_token_if_needed(scopes=scopes)
        
        headers = kwargs.get("headers", {})
        headers["Authorization"] = f"Bearer {token}"
        headers["Content-Type"] = "application/json"
        kwargs["headers"] = headers

        # 1. Try primary path using /users/{mailbox}
        primary_endpoint = endpoint.replace("{mailbox}", f"users/{self.shared_mailbox}")
        url = f"https://graph.microsoft.com/v1.0/{primary_endpoint}"
        
        resp = requests.request(method, url, **kwargs)
        
        # 2. If access denied, try fallback using /me
        if resp.status_code == 403 or (resp.status_code == 400 and "ErrorAccessDenied" in resp.text):
            logger.info(f"Graph request to {url} returned access denied ({resp.status_code}). Trying fallback to /me...")
            fallback_endpoint = endpoint.replace("{mailbox}", "me")
            fallback_url = f"https://graph.microsoft.com/v1.0/{fallback_endpoint}"
            resp = requests.request(method, fallback_url, **kwargs)
            
        return resp

    # -------------------------------------------------------------------
    # Email Operations (Graph API REST Implementation)
    # -------------------------------------------------------------------
    def fetch_unread_emails(self, max_count: int = 20) -> List[Dict[str, Any]]:
        return self._fetch_emails(criterion="UNSEEN", max_count=max_count)

    def fetch_recent_emails(self, max_count: int = 20) -> List[Dict[str, Any]]:
        return self._fetch_emails(criterion="ALL", max_count=max_count)

    def _fetch_emails(self, criterion: str, max_count: int) -> List[Dict[str, Any]]:
        filter_query = ""
        if criterion == "UNSEEN":
            filter_query = "&$filter=isRead eq false"
            
        endpoint = f"{{mailbox}}/mailFolders/Inbox/messages?$top={max_count}{filter_query}&$orderby=receivedDateTime desc"
        resp = self._make_graph_request("GET", endpoint)
        
        if resp.status_code not in (200, 201):
            logger.error(f"Failed to fetch emails via Graph API: {resp.text}")
            return []
            
        messages_data = resp.json().get("value", [])
        messages = []
        
        for item in messages_data:
            try:
                msg_id = item.get("id")
                subject = item.get("subject", "")
                
                from_addr = ""
                from_obj = item.get("from")
                if from_obj and from_obj.get("emailAddress"):
                    addr = from_obj["emailAddress"].get("address", "")
                    name = from_obj["emailAddress"].get("name", "")
                    from_addr = f"{name} <{addr}>" if name else addr
                    
                to_addrs = []
                for r in item.get("toRecipients", []):
                    if r.get("emailAddress"):
                        addr = r["emailAddress"].get("address", "")
                        name = r["emailAddress"].get("name", "")
                        to_addrs.append(f"{name} <{addr}>" if name else addr)
                to_hdr = ", ".join(to_addrs)
                
                cc_addrs = []
                for r in item.get("ccRecipients", []):
                    if r.get("emailAddress"):
                        addr = r["emailAddress"].get("address", "")
                        name = r["emailAddress"].get("name", "")
                        cc_addrs.append(f"{name} <{addr}>" if name else addr)
                cc_hdr = ", ".join(cc_addrs)
                
                date_hdr = item.get("receivedDateTime", "")
                
                body_obj = item.get("body", {})
                body_type = body_obj.get("contentType", "text")
                body_content = body_obj.get("content", "")
                
                body_html = ""
                body_text = ""
                if body_type.lower() == "html":
                    body_html = body_content
                else:
                    body_text = body_content
                    
                bs4_result = EmailHtmlParser.parse_html(body_html or body_text)
                
                messages.append({
                    "uid": msg_id,
                    "id": msg_id,
                    "subject": subject,
                    "from": from_addr,
                    "to": to_hdr,
                    "cc": cc_hdr,
                    "date": date_hdr,
                    "body_html": body_html,
                    "body_text": bs4_result["text"],
                    "tables": bs4_result["tables"],
                    "links": bs4_result["links"],
                    "has_attachments": item.get("hasAttachments", False),
                    "conversation_id": item.get("conversationId", "")
                })
            except Exception as e:
                logger.error(f"Error parsing Graph message item {item.get('id')}: {e}")
                
        return messages

    def get_attachments(self, uid: str) -> List[Dict[str, Any]]:
        """Downloads attachments for message UID via Graph API."""
        # Get email body HTML and text for attachment context filtering
        body_html = ""
        body_text = ""
        msg_resp = self._make_graph_request("GET", f"{{mailbox}}/messages/{uid}")
        if msg_resp.status_code == 200:
            msg_data = msg_resp.json()
            body_html = msg_data.get("body", {}).get("content", "")
            from html_parser import EmailHtmlParser
            bs4_res = EmailHtmlParser.parse_html(body_html)
            body_text = bs4_res["text"]

        endpoint = f"{{mailbox}}/messages/{uid}/attachments"
        resp = self._make_graph_request("GET", endpoint)
        
        attachments = []
        if resp.status_code not in (200, 201):
            logger.error(f"Failed to fetch attachments for message {uid} via Graph API: {resp.text}")
            return attachments
            
        from html_parser import AttachmentFilter
        data = resp.json().get("value", [])
        for item in data:
            if item.get("@odata.type") == "#microsoft.graph.fileAttachment":
                filename = item.get("name", "attachment.bin")
                content_type = item.get("contentType", "application/octet-stream")
                is_inline = item.get("isInline", False)
                content_id = item.get("contentId", "")
                size = item.get("size", None)

                # Filter out signature/logo/decorative images
                if not AttachmentFilter.should_keep_image(
                    filename=filename,
                    content_type=content_type,
                    is_inline=is_inline,
                    content_id=content_id,
                    body_html=body_html,
                    body_text=body_text,
                    size_bytes=size
                ):
                    continue

                attachments.append({
                    "id": item.get("id", ""),
                    "filename": filename,
                    "content_type": content_type,
                    "size": size,
                    "isInline": is_inline,
                    "base64_data": item.get("contentBytes", "")
                })
        return attachments

    def mark_as_read(self, uid: str):
        """Marks email as read via Graph API."""
        endpoint = f"{{mailbox}}/messages/{uid}"
        payload = {
            "isRead": True
        }
        resp = self._make_graph_request("PATCH", endpoint, json=payload)
        if resp.status_code in (200, 201, 202):
            logger.info(f"Marked message {uid} as read via Graph API.")
        else:
            logger.error(f"Failed to mark message {uid} as read: {resp.text}")

    def _get_or_create_folder_id(self, folder_name: str) -> Optional[str]:
        endpoint = "{mailbox}/mailFolders?$top=100"
        resp = self._make_graph_request("GET", endpoint)
        if resp.status_code in (200, 201):
            folders = resp.json().get("value", [])
            for f in folders:
                if f.get("displayName", "").lower() == folder_name.lower():
                    return f.get("id")
                    
        create_endpoint = "{mailbox}/mailFolders"
        payload = {
            "displayName": folder_name
        }
        create_resp = self._make_graph_request("POST", create_endpoint, json=payload)
        if create_resp.status_code in (200, 201, 202):
            return create_resp.json().get("id")
            
        logger.error(f"Failed to find or create mail folder '{folder_name}': {create_resp.text}")
        return None

    def move_to_processed_folder(self, uid: str, folder_name: Optional[str] = None) -> str:
        """Moves email to folder via Graph API."""
        target_folder = folder_name or self.processed_folder
        folder_id = self._get_or_create_folder_id(target_folder)
        if not folder_id:
            logger.warning(f"Could not resolve folder ID for '{target_folder}'. Skipping move.")
            return uid
            
        endpoint = f"{{mailbox}}/messages/{uid}/move"
        payload = {
            "destinationId": folder_id
        }
        
        resp = self._make_graph_request("POST", endpoint, json=payload)
        if resp.status_code in (200, 201, 202):
            logger.info(f"Moved message {uid} to folder '{target_folder}' via Graph API.")
            return resp.json().get("id", uid)
        else:
            logger.error(f"Failed to move message {uid} to '{target_folder}': {resp.text}")
            return uid

    # -------------------------------------------------------------------
    # SMTP & Graph Reply Operations
    # -------------------------------------------------------------------
    def send_reply_via_graph(
        self,
        to_email: str,
        cc_emails: List[str],
        subject: str,
        html_body: str,
        file_bytes: Optional[bytes] = None,
        file_name: Optional[str] = None
    ):
        endpoint = "{mailbox}/sendMail"
        
        to_recipients = [{"emailAddress": {"address": clean_email(to_email)}}]
        cc_recipients = [{"emailAddress": {"address": clean_email(cc)}} for cc in cc_emails if clean_email(cc)] if cc_emails else []
        
        message = {
            "subject": subject,
            "body": {
                "contentType": "HTML",
                "content": html_body
            },
            "toRecipients": to_recipients,
            "ccRecipients": cc_recipients
        }
        
        if file_bytes and file_name:
            b64_content = base64.b64encode(file_bytes).decode('utf-8')
            message["attachments"] = [
                {
                    "@odata.type": "#microsoft.graph.fileAttachment",
                    "name": file_name,
                    "contentType": "application/octet-stream",
                    "contentBytes": b64_content
                }
            ]
            
        payload = {
            "message": message,
            "saveToSentItems": "true"
        }
        
        resp = self._make_graph_request("POST", endpoint, json=payload)
        if resp.status_code not in (200, 201, 202):
            # Fallback to /me if it failed on users/{mailbox}/sendMail (even if not caught by 403 filter)
            fallback_url = "https://graph.microsoft.com/v1.0/me/sendMail"
            token = self.refresh_token_if_needed(scopes=["https://graph.microsoft.com/Mail.Send"])
            fallback_headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            resp2 = requests.post(fallback_url, json=payload, headers=fallback_headers)
            if resp2.status_code not in (200, 201, 202):
                raise RuntimeError(f"Graph sendMail failed. Status: {resp.status_code}, Response: {resp.text}. Fallback Status: {resp2.status_code}, Fallback Response: {resp2.text}")
            logger.info("Successfully sent reply via Graph /me/sendMail fallback")
        else:
            logger.info(f"Successfully sent reply via Graph to {to_email}")

    def send_reply_with_attachment(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        original_message_id: Optional[str] = None,
        file_bytes: Optional[bytes] = None,
        file_name: Optional[str] = None,
        reply_all: bool = False,
        cc_emails: Optional[List[str]] = None
    ):
        """Sends an HTML reply with attachments trying MS Graph first, falling back to SMTP."""
        try:
            logger.info("Attempting to send reply via Microsoft Graph API...")
            self.send_reply_via_graph(to_email, cc_emails or [], subject, html_body, file_bytes, file_name)
            return
        except Exception as graph_err:
            logger.warning(f"Graph send failed: {graph_err}. Falling back to SMTP...")

        # Fallback to SMTP (MIME) if Graph fails
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        from email.mime.base import MIMEBase
        from email import encoders

        msg = MIMEMultipart("mixed")
        msg["From"] = self.shared_mailbox
        msg["To"] = to_email
        msg["Subject"] = f"RE: {subject}" if not subject.lower().startswith("re:") else subject

        if cc_emails:
            msg["Cc"] = ", ".join(cc_emails)

        if original_message_id:
            msg["In-Reply-To"] = original_message_id
            msg["References"] = original_message_id

        msg.attach(MIMEText(html_body, "html"))

        if file_bytes and file_name:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(file_bytes)
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f'attachment; filename="{file_name}"')
            msg.attach(part)

        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.ehlo()
            server.starttls()
            server.ehlo()

            token = self.refresh_token_if_needed()
            auth_string = f"user={self.shared_mailbox}\x01auth=Bearer {token}\x01\x01"
            b64_auth = base64.b64encode(auth_string.encode()).decode()

            code, resp = server.docmd("AUTH", "XOAUTH2 " + b64_auth)
            if code != 235:
                raise RuntimeError(f"SMTP OAuth Authentication failed: {resp}")

            recipients = [clean_email(to_email)] + [clean_email(cc) for cc in cc_emails if clean_email(cc)] if cc_emails else [clean_email(to_email)]
            server.sendmail(self.shared_mailbox, recipients, msg.as_string())
            server.quit()
            logger.info(f"Successfully sent reply to {to_email} with CC {cc_emails}")
        except Exception as e:
            logger.error(f"Failed SMTP send reply to {to_email}: {e}")
            raise RuntimeError(f"Failed to send email reply: {e}")
