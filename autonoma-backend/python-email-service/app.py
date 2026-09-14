"""
FastAPI REST Service for Python Outlook Email Integration.
Exposes REST endpoints for OAuth authentication, email fetching, BeautifulSoup parsing, and SMTP reply.
"""

import os
import socket

# Force IPv4 socket resolution on macOS to bypass 40-second IPv6 timeout to Microsoft endpoints
_orig_getaddrinfo = socket.getaddrinfo
def _ipv4_getaddrinfo(*args, **kwargs):
    res = _orig_getaddrinfo(*args, **kwargs)
    return [r for r in res if r[0] == socket.AF_INET] or res
socket.getaddrinfo = _ipv4_getaddrinfo

from typing import List, Optional, Dict, Any
import base64
import logging
import email
from fastapi import FastAPI, HTTPException, Query, Body, UploadFile, File, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from outlook_oauth_service import OutlookOAuthService
from generic_imap_service import GenericImapSmtpService

def add_token_headers(response: Response, service: Any):
    if service:
        if hasattr(service, 'access_token') and service.access_token:
            response.headers["X-Outlook-New-Access-Token"] = service.access_token
        if hasattr(service, 'refresh_token') and service.refresh_token:
            response.headers["X-Outlook-New-Refresh-Token"] = service.refresh_token

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("PythonEmailAPI")

app = FastAPI(
    title="Python Outlook Email Microservice",
    description="Outlook IMAP/SMTP over OAuth 2.0 with BeautifulSoup4 HTML Parsing",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:8081", "http://127.0.0.1:3001", "http://127.0.0.1:8081"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration & Service Singleton State
config_state = {
    "tenant_id": os.getenv("MSGRAPH_TENANT_ID", "dc9c3a4c-20c8-4af8-beeb-e0fbd4d8be82"),
    "client_id": os.getenv("MSGRAPH_CLIENT_ID", "66d2e052-616b-4c4b-b091-ea3aa08e5b4e"),
    "client_secret": os.getenv("MSGRAPH_CLIENT_SECRET", "placeholder_client_secret"),
    "shared_mailbox": os.getenv("SHARED_MAILBOX", "darshan.k@technosprint.net"),
    "processed_folder": os.getenv("PROCESSED_FOLDER", "Processed"),
    "redirect_uri": os.getenv("REDIRECT_URI", "http://localhost:3001/oauth/callback")
}

email_service_instance: Optional[OutlookOAuthService] = None

def get_service(
    tenant_id: Optional[str] = None,
    client_id: Optional[str] = None,
    client_secret: Optional[str] = None,
    shared_mailbox: Optional[str] = None,
    processed_folder: Optional[str] = None,
    access_token: Optional[str] = None,
    refresh_token: Optional[str] = None,
    email_provider: Optional[str] = None
) -> Any:
    provider = (email_provider or "OUTLOOK").upper()
    if provider != "OUTLOOK":
        # Gmail or Yahoo Mail (Generic IMAP/SMTP)
        return GenericImapSmtpService(
            email_address=(shared_mailbox or config_state["shared_mailbox"]).strip(),
            password=(client_secret or config_state["client_secret"]).strip(),
            provider=provider,
            processed_folder=(processed_folder or config_state["processed_folder"]).strip()
        )

    # If request-scoped credentials are provided, return a dynamic instance
    if tenant_id and client_id and client_secret:
        service = OutlookOAuthService(
            tenant_id=tenant_id,
            client_id=client_id,
            client_secret=client_secret,
            shared_mailbox=shared_mailbox or config_state["shared_mailbox"],
            redirect_uri=config_state["redirect_uri"],
            processed_folder=processed_folder or config_state["processed_folder"],
            fallback_client_secret=config_state["client_secret"]
        )
        if access_token:
            service.access_token = access_token
        if refresh_token:
            service.refresh_token = refresh_token
        return service

    global email_service_instance
    if not email_service_instance:
        email_service_instance = OutlookOAuthService(
            tenant_id=config_state["tenant_id"],
            client_id=config_state["client_id"],
            client_secret=config_state["client_secret"],
            shared_mailbox=config_state["shared_mailbox"],
            redirect_uri=config_state["redirect_uri"],
            processed_folder=config_state["processed_folder"],
            fallback_client_secret=config_state["client_secret"]
        )
    return email_service_instance


# ── Pydantic Request Models ──
class ConfigUpdateRequest(BaseModel):
    tenant_id: str
    client_id: str
    client_secret: str
    shared_mailbox: str
    processed_folder: Optional[str] = "Processed"
    redirect_uri: Optional[str] = "http://localhost:3000/oauth/callback"

class AuthCodeRequest(BaseModel):
    code: str
    tenant_id: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    shared_mailbox: Optional[str] = None
    redirect_uri: Optional[str] = None

class SendReplyRequest(BaseModel):
    to_email: str
    subject: str
    html_body: str
    original_message_id: Optional[str] = None
    file_bytes_b64: Optional[str] = None
    file_name: Optional[str] = None
    reply_all: Optional[bool] = False
    cc_emails: Optional[List[str]] = None


# ── API Endpoints ──

@app.get("/health")
def health_check():
    return {"status": "UP", "service": "Python Outlook Email Service", "parser": "BeautifulSoup4"}

@app.post("/api/v1/config")
def update_config(req: ConfigUpdateRequest):
    global email_service_instance, config_state
    config_state.update(req.dict())
    email_service_instance = OutlookOAuthService(**config_state)
    logger.info(f"Updated configuration for mailbox: {req.shared_mailbox}")
    return {"message": "Configuration updated successfully", "config": config_state}

@app.get("/api/v1/auth/url")
def get_auth_url():
    service = get_service()
    url = service.get_authorization_url()
    return {"auth_url": url}

@app.post("/api/v1/auth/callback")
def auth_callback(req: AuthCodeRequest):
    tenant = (req.tenant_id or config_state["tenant_id"]).strip()
    client = (req.client_id or config_state["client_id"]).strip()
    secret = (req.client_secret or config_state["client_secret"]).strip()
    mailbox = (req.shared_mailbox or config_state["shared_mailbox"]).strip()
    redirect = (req.redirect_uri or config_state["redirect_uri"]).strip()

    logger.info(f"[OAuthCallback] tenant={tenant[:4]}...{tenant[-4:] if len(tenant) > 4 else ''} (len={len(tenant)})")
    logger.info(f"[OAuthCallback] client={client[:4]}...{client[-4:] if len(client) > 4 else ''} (len={len(client)})")
    logger.info(f"[OAuthCallback] secret={secret[:3]}...{secret[-3:] if len(secret) > 3 else ''} (len={len(secret)})")
    logger.info(f"[OAuthCallback] Exact secret: '{secret}'")
    logger.info(f"[OAuthCallback] redirect={redirect}")

    service = OutlookOAuthService(
        tenant_id=tenant,
        client_id=client,
        client_secret=secret,
        shared_mailbox=mailbox,
        redirect_uri=redirect,
        fallback_client_secret=config_state["client_secret"]
    )
    try:
        tokens = service.acquire_tokens_by_code(req.code)
        claims = tokens.get("id_token_claims", {})
        user_email = claims.get("preferred_username") or claims.get("email") or claims.get("upn")
        return {
            "status": "SUCCESS",
            "message": "Tokens acquired successfully",
            "access_token": tokens.get("access_token"),
            "refresh_token": tokens.get("refresh_token"),
            "expires_in": tokens.get("expires_in"),
            "user_email": user_email
        }
    except Exception as e:
        if secret != config_state["client_secret"]:
            logger.warning("Token acquisition failed with provided secret. Attempting fallback to application default client_secret...")
            try:
                fallback_service = OutlookOAuthService(
                    tenant_id=tenant,
                    client_id=client,
                    client_secret=config_state["client_secret"],
                    shared_mailbox=mailbox,
                    redirect_uri=redirect
                )
                tokens = fallback_service.acquire_tokens_by_code(req.code)
                claims = tokens.get("id_token_claims", {})
                user_email = claims.get("preferred_username") or claims.get("email") or claims.get("upn")
                return {
                    "status": "SUCCESS",
                    "message": "Tokens acquired successfully (fallback secret)",
                    "access_token": tokens.get("access_token"),
                    "refresh_token": tokens.get("refresh_token"),
                    "expires_in": tokens.get("expires_in"),
                    "user_email": user_email
                }
            except Exception as fallback_err:
                logger.error(f"Fallback token acquisition also failed: {fallback_err}")

        logger.error(f"OAuth callback failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/emails/unread")
def fetch_unread_emails(
    response: Response,
    max_count: int = Query(20, ge=1, le=100),
    x_outlook_tenant_id: Optional[str] = Header(None),
    x_outlook_client_id: Optional[str] = Header(None),
    x_outlook_client_secret: Optional[str] = Header(None),
    x_outlook_shared_mailbox: Optional[str] = Header(None),
    x_outlook_processed_folder: Optional[str] = Header(None),
    x_outlook_access_token: Optional[str] = Header(None),
    x_outlook_refresh_token: Optional[str] = Header(None),
    x_email_provider: Optional[str] = Header(None)
):
    service = get_service(
        tenant_id=x_outlook_tenant_id,
        client_id=x_outlook_client_id,
        client_secret=x_outlook_client_secret,
        shared_mailbox=x_outlook_shared_mailbox,
        processed_folder=x_outlook_processed_folder,
        access_token=x_outlook_access_token,
        refresh_token=x_outlook_refresh_token,
        email_provider=x_email_provider
    )
    try:
        emails = service.fetch_unread_emails(max_count=max_count)
        add_token_headers(response, service)
        return {"count": len(emails), "emails": emails}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch unread emails: {e}")

@app.get("/api/v1/emails/recent")
def fetch_recent_emails(
    response: Response,
    max_count: int = Query(20, ge=1, le=100),
    x_outlook_tenant_id: Optional[str] = Header(None),
    x_outlook_client_id: Optional[str] = Header(None),
    x_outlook_client_secret: Optional[str] = Header(None),
    x_outlook_shared_mailbox: Optional[str] = Header(None),
    x_outlook_processed_folder: Optional[str] = Header(None),
    x_outlook_access_token: Optional[str] = Header(None),
    x_outlook_refresh_token: Optional[str] = Header(None),
    x_email_provider: Optional[str] = Header(None)
):
    service = get_service(
        tenant_id=x_outlook_tenant_id,
        client_id=x_outlook_client_id,
        client_secret=x_outlook_client_secret,
        shared_mailbox=x_outlook_shared_mailbox,
        processed_folder=x_outlook_processed_folder,
        access_token=x_outlook_access_token,
        refresh_token=x_outlook_refresh_token,
        email_provider=x_email_provider
    )
    try:
        emails = service.fetch_recent_emails(max_count=max_count)
        add_token_headers(response, service)
        return {"count": len(emails), "emails": emails}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recent emails: {e}")

@app.get("/api/v1/emails/{uid}/attachments")
def get_attachments(
    uid: str,
    response: Response,
    x_outlook_tenant_id: Optional[str] = Header(None),
    x_outlook_client_id: Optional[str] = Header(None),
    x_outlook_client_secret: Optional[str] = Header(None),
    x_outlook_shared_mailbox: Optional[str] = Header(None),
    x_outlook_processed_folder: Optional[str] = Header(None),
    x_outlook_access_token: Optional[str] = Header(None),
    x_outlook_refresh_token: Optional[str] = Header(None),
    x_email_provider: Optional[str] = Header(None)
):
    service = get_service(
        tenant_id=x_outlook_tenant_id,
        client_id=x_outlook_client_id,
        client_secret=x_outlook_client_secret,
        shared_mailbox=x_outlook_shared_mailbox,
        processed_folder=x_outlook_processed_folder,
        access_token=x_outlook_access_token,
        refresh_token=x_outlook_refresh_token,
        email_provider=x_email_provider
    )
    try:
        attachments = service.get_attachments(uid=uid)
        add_token_headers(response, service)
        return {"uid": uid, "count": len(attachments), "attachments": attachments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get attachments for UID {uid}: {e}")

@app.post("/api/v1/emails/{uid}/read")
def mark_as_read(
    uid: str,
    response: Response,
    x_outlook_tenant_id: Optional[str] = Header(None),
    x_outlook_client_id: Optional[str] = Header(None),
    x_outlook_client_secret: Optional[str] = Header(None),
    x_outlook_shared_mailbox: Optional[str] = Header(None),
    x_outlook_processed_folder: Optional[str] = Header(None),
    x_outlook_access_token: Optional[str] = Header(None),
    x_outlook_refresh_token: Optional[str] = Header(None),
    x_email_provider: Optional[str] = Header(None)
):
    service = get_service(
        tenant_id=x_outlook_tenant_id,
        client_id=x_outlook_client_id,
        client_secret=x_outlook_client_secret,
        shared_mailbox=x_outlook_shared_mailbox,
        processed_folder=x_outlook_processed_folder,
        access_token=x_outlook_access_token,
        refresh_token=x_outlook_refresh_token,
        email_provider=x_email_provider
    )
    try:
        service.mark_as_read(uid=uid)
        add_token_headers(response, service)
        return {"uid": uid, "status": "MARKED_READ"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark UID {uid} as read: {e}")

@app.post("/api/v1/emails/{uid}/move")
def move_to_processed(
    uid: str,
    response: Response,
    folder_name: Optional[str] = Query(None),
    x_outlook_tenant_id: Optional[str] = Header(None),
    x_outlook_client_id: Optional[str] = Header(None),
    x_outlook_client_secret: Optional[str] = Header(None),
    x_outlook_shared_mailbox: Optional[str] = Header(None),
    x_outlook_processed_folder: Optional[str] = Header(None),
    x_outlook_access_token: Optional[str] = Header(None),
    x_outlook_refresh_token: Optional[str] = Header(None),
    x_email_provider: Optional[str] = Header(None)
):
    service = get_service(
        tenant_id=x_outlook_tenant_id,
        client_id=x_outlook_client_id,
        client_secret=x_outlook_client_secret,
        shared_mailbox=x_outlook_shared_mailbox,
        processed_folder=x_outlook_processed_folder,
        access_token=x_outlook_access_token,
        refresh_token=x_outlook_refresh_token,
        email_provider=x_email_provider
    )
    try:
        moved_id = service.move_to_processed_folder(uid=uid, folder_name=folder_name)
        add_token_headers(response, service)
        return {"uid": uid, "moved_to": folder_name or service.processed_folder, "status": "MOVED"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to move UID {uid}: {e}")

@app.post("/api/v1/emails/reply")
def send_reply(
    req: SendReplyRequest,
    response: Response,
    x_outlook_tenant_id: Optional[str] = Header(None),
    x_outlook_client_id: Optional[str] = Header(None),
    x_outlook_client_secret: Optional[str] = Header(None),
    x_outlook_shared_mailbox: Optional[str] = Header(None),
    x_outlook_processed_folder: Optional[str] = Header(None),
    x_outlook_access_token: Optional[str] = Header(None),
    x_outlook_refresh_token: Optional[str] = Header(None),
    x_email_provider: Optional[str] = Header(None)
):
    service = get_service(
        tenant_id=x_outlook_tenant_id,
        client_id=x_outlook_client_id,
        client_secret=x_outlook_client_secret,
        shared_mailbox=x_outlook_shared_mailbox,
        processed_folder=x_outlook_processed_folder,
        access_token=x_outlook_access_token,
        refresh_token=x_outlook_refresh_token,
        email_provider=x_email_provider
    )
    try:
        file_bytes = base64.b64decode(req.file_bytes_b64) if req.file_bytes_b64 else None
        service.send_reply_with_attachment(
            to_email=req.to_email,
            subject=req.subject,
            html_body=req.html_body,
            original_message_id=req.original_message_id,
            file_bytes=file_bytes,
            file_name=req.file_name,
            reply_all=req.reply_all or False,
            cc_emails=req.cc_emails
        )
        add_token_headers(response, service)
        return {"status": "SENT", "to": req.to_email, "subject": req.subject}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send reply email: {e}")

@app.post("/api/v1/emails/parse-eml")
async def parse_eml_file(file: UploadFile = File(...)):
    """
    Accepts raw .eml file from Java, parses it using BeautifulSoup,
    and returns a structured JSON payload.
    """
    try:
        content = await file.read()
        msg = email.message_from_bytes(content)
        service = get_service()
        parsed_data = service._parse_mime_message(uid="uploaded-eml", msg=msg)
        body_html = parsed_data.get("body_html", "")
        body_text = parsed_data.get("body_text", "")

        # Extract and filter attachments
        from html_parser import AttachmentFilter
        attachments = []
        for part in msg.walk():
            if part.get_content_maintype() == 'multipart':
                continue

            filename = part.get_filename()
            content_disposition = str(part.get("Content-Disposition", ""))

            if not content_disposition and not filename:
                continue

            is_inline = False
            if "inline" in content_disposition.lower():
                is_inline = True

            content_id = part.get("Content-ID", "")
            content_type = part.get_content_type()

            decoded_filename = service._decode_header_text(filename or "attachment.bin")
            file_bytes = part.get_payload(decode=True)
            if not file_bytes:
                continue

            size = len(file_bytes)

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

            attachments.append({
                "filename": decoded_filename,
                "content_type": content_type,
                "base64_data": base64.b64encode(file_bytes).decode("ascii")
            })
        parsed_data["attachments"] = attachments
        return parsed_data
    except Exception as e:
        logger.error(f"EML parsing failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to parse EML: {e}")

class ClassifyRequest(BaseModel):
    text: str
    subject: Optional[str] = None

@app.post("/api/v1/emails/classify")
def classify_email(req: ClassifyRequest):
    try:
        from keyword_classifier import classify_email_text
        combined = (req.subject or "") + "\n" + (req.text or "")
        result = classify_email_text(combined)
        return result
    except Exception as e:
        logger.error(f"Classification failed: {e}")
        return {"intent": "general_inquiry", "confidence": 0.0, "reasoning": f"Error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
