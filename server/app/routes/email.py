"""Email sending API endpoints.

POST /api/email/send
  JSON body: {"to": "recipient@example.com", "subject": "...", "body": "..."}

Environment variables required:
  SENDER_EMAIL      -> Gmail address (or other SMTP account)
  SENDER_PASSWORD   -> App password (NEVER a real Gmail password; use App Password)

Returns JSON:
  {"status": "ok", "message_id": "<optional>", "to": "..."}

Errors:
  400 for validation errors
  500 for SMTP errors (message sanitized)
"""
from __future__ import annotations

import os
import smtplib
import ssl
import time
from email.message import EmailMessage
from typing import Tuple

from flask import Blueprint, jsonify, request

email_bp = Blueprint("email", __name__)


def _validate_payload(data: dict) -> Tuple[str, str, str]:
    # Accept either 'to' or legacy/alternate 'to_addr'
    to_addr = (data.get("to") or data.get("to_addr") or "").strip()
    subject = (data.get("subject") or "").strip()
    body = data.get("body") or ""
    if not to_addr or "@" not in to_addr:
        raise ValueError("Valid 'to' email required")
    if not subject:
        raise ValueError("'subject' is required")
    if not body.strip():
        raise ValueError("'body' is required")
    return to_addr, subject, body


def _build_email(sender: str, to_addr: str, subject: str, body: str) -> EmailMessage:
    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_addr
    return msg


@email_bp.route("/api/email/send", methods=["POST"])
def send_email():  # pragma: no cover - network side effect
    data = request.get_json(silent=True) or {}
    try:
        to_addr, subject, body = _validate_payload(data)
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400

    sender = os.getenv("SENDER_EMAIL", "").strip()
    password = os.getenv("SENDER_PASSWORD", "").strip()
    if not sender or not password:
        return (
            jsonify({
                "error": "Email service not configured (SENDER_EMAIL / SENDER_PASSWORD missing)",
            }),
            500,
        )

    msg = _build_email(sender, to_addr, subject, body)

    # Use SMTP_SSL with context for security; Gmail requires app password if 2FA enabled.
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context, timeout=30) as server:
            server.login(sender, password)
            server.send_message(msg)
        return jsonify({"status": "ok", "to": to_addr, "timestamp": int(time.time())})
    except smtplib.SMTPAuthenticationError:
        return jsonify({"error": "Authentication failed for sender account"}), 500
    except smtplib.SMTPException as e:
        return jsonify({"error": f"SMTP error: {e.__class__.__name__}"}), 500
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": f"Unexpected error: {e.__class__.__name__}"}), 500
