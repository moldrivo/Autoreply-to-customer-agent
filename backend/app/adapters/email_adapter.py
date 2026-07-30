from __future__ import annotations

import email
import imaplib
import logging
import re
import smtplib
from datetime import datetime, timezone
from email.header import decode_header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, parsedate_to_datetime
from typing import Any, Optional

from app.adapters.base import BasePlatformAdapter, PlatformError

logger = logging.getLogger(__name__)


def _decode_email_header(header_value: str) -> str:
    decoded_parts = decode_header(header_value or "")
    parts: list[str] = []
    for content, charset in decoded_parts:
        if isinstance(content, bytes):
            try:
                parts.append(content.decode(charset or "utf-8", errors="replace"))
            except (LookupError, UnicodeDecodeError):
                parts.append(content.decode("utf-8", errors="replace"))
        else:
            parts.append(str(content))
    return " ".join(parts)


def _extract_email_address(header_value: str) -> str:
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", header_value or "")
    return match.group(0) if match else ""


def _parse_email_body(msg: email.message.Message) -> str:
    body: Optional[str] = None
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == "text/plain":
                payload = part.get_payload(decode=True)
                if payload:
                    try:
                        body = payload.decode("utf-8", errors="replace")
                    except (LookupError, UnicodeDecodeError):
                        body = payload.decode("latin-1", errors="replace")
                    break
            elif content_type == "text/html" and body is None:
                payload = part.get_payload(decode=True)
                if payload:
                    try:
                        body = payload.decode("utf-8", errors="replace")
                    except (LookupError, UnicodeDecodeError):
                        body = payload.decode("latin-1", errors="replace")
                    body = re.sub(r"<[^>]+>", "", body)
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            try:
                body = payload.decode("utf-8", errors="replace")
            except (LookupError, UnicodeDecodeError):
                body = payload.decode("latin-1", errors="replace")
    return (body or "").strip()


class EmailAdapter(BasePlatformAdapter):

    @property
    def platform_name(self) -> str:
        return "email"

    async def verify_connection(self, credentials: dict) -> bool:
        imap_host = credentials.get("imap_host", "imap.gmail.com")
        imap_port = int(credentials.get("imap_port", 993))
        email_address = credentials.get("email", "")
        password = credentials.get("password", "") or credentials.get("app_password", "")

        if not email_address or not password:
            raise PlatformError("Email and password are required", "email", 400)

        try:
            mail = imaplib.IMAP4_SSL(imap_host, imap_port)
            mail.login(email_address, password)
            mail.logout()
            return True
        except imaplib.IMAP4.error as exc:
            logger.warning("IMAP connection failed for %s: %s", email_address, exc)
            return False
        except Exception as exc:
            logger.warning("Email connection verification failed: %s", exc)
            return False

    async def fetch_reviews(self, credentials: dict, since: Optional[str] = None) -> list[dict]:
        imap_host = credentials.get("imap_host", "imap.gmail.com")
        imap_port = int(credentials.get("imap_port", 993))
        email_address = credentials.get("email", "")
        password = credentials.get("password", "") or credentials.get("app_password", "")
        folder = credentials.get("folder", "INBOX")

        if not email_address or not password:
            raise PlatformError("Email and password are required", "email", 400)

        try:
            mail = imaplib.IMAP4_SSL(imap_host, imap_port)
            mail.login(email_address, password)
            mail.select(folder)

            if since:
                search_criteria = f'(SINCE {since.replace("-", "").replace(":", "").replace(" ", "")[:8]})'
            else:
                search_criteria = "UNSEEN"

            _status, message_ids = mail.search(None, search_criteria)
            ids = message_ids[0].split() if message_ids[0] else []

            emails: list[dict] = []
            for mid in ids[-20:]:
                _status, msg_data = mail.fetch(mid, "(RFC822)")
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        raw_email = response_part[1]
                        msg = email.message_from_bytes(raw_email)

                        subject = _decode_email_header(msg["Subject"])
                        from_header = _decode_email_header(msg["From"])
                        from_email = _extract_email_address(from_header)
                        date_str = msg["Date"]
                        message_id = msg.get("Message-ID", f"email-{mid.decode()}")

                        body = _parse_email_body(msg)

                        if body:
                            emails.append({
                                "platform_review_id": message_id.strip("<>"),
                                "customer_name": from_header.split("<")[0].strip() or from_header,
                                "customer_email": from_email or email_address,
                                "content": body,
                                "title": subject,
                                "rating": 3,
                                "review_date": date_str or datetime.now(timezone.utc).isoformat(),
                                "source": "email_inbox",
                                "platform": "email",
                                "conversation_id": message_id.strip("<>"),
                            })

            mail.logout()
            return emails

        except imaplib.IMAP4.error as exc:
            logger.error("IMAP fetch failed: %s", exc)
            raise PlatformError(f"Failed to fetch emails: {exc}", "email", 502)
        except Exception as exc:
            logger.error("Email fetch error: %s", exc)
            raise PlatformError(f"Email fetch error: {exc}", "email", 502)

    async def post_reply(self, credentials: dict, review_id: str, reply_text: str) -> dict:
        smtp_host = credentials.get("smtp_host", "smtp.gmail.com")
        smtp_port = int(credentials.get("smtp_port", 587))
        email_address = credentials.get("email", "")
        password = credentials.get("password", "") or credentials.get("app_password", "")
        sender_name = credentials.get("sender_name", "")

        if not email_address or not password:
            raise PlatformError("Email and password are required", "email", 400)

        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = formataddr((sender_name or email_address.split("@")[0], email_address))
            msg["To"] = review_id
            msg["Subject"] = "Re: Your inquiry"
            msg["Message-ID"] = email.utils.make_msgid()

            msg.attach(MIMEText(reply_text, "plain"))

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(email_address, password)
                server.sendmail(email_address, [review_id], msg.as_string())

            logger.info("Email reply sent to %s", review_id)
            return {
                "status": "success",
                "platform": "email",
                "review_id": review_id,
                "sent_at": datetime.now(timezone.utc).isoformat(),
            }

        except smtplib.SMTPException as exc:
            logger.error("SMTP send failed: %s", exc)
            raise PlatformError(f"Failed to send email: {exc}", "email", 502)
        except Exception as exc:
            logger.error("Email send error: %s", exc)
            raise PlatformError(f"Email send error: {exc}", "email", 502)

    async def validate_webhook(self, headers: dict, body: bytes) -> Optional[dict]:
        return None
