from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from anthropic import Anthropic
import os
import json
import base64
import re

router = APIRouter()

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
CLIENT_SECRETS_FILE = "client_secret.json"
REDIRECT_URI = "http://localhost:8000/api/gmail/callback"

TRAVEL_KEYWORDS = [
    "confirmation", "réservation", "billet", "vol", "flight", "booking",
    "hôtel", "hotel", "itinéraire", "itinerary", "e-ticket", "boarding pass",
    "carte d'embarquement", "reservation", "order confirmation"
]

_credentials_store: dict = {}  # In production: store in DB per user
anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))


def get_flow():
    if not os.path.exists(CLIENT_SECRETS_FILE):
        raise HTTPException(
            status_code=500,
            detail="Fichier client_secret.json manquant. Configurez vos credentials Google OAuth2."
        )
    return Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )


@router.get("/auth")
def gmail_auth():
    """Redirect user to Google OAuth2 consent screen."""
    flow = get_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent"
    )
    _credentials_store["state"] = state
    return RedirectResponse(auth_url)


@router.get("/callback")
def gmail_callback(code: str, state: str):
    """Handle OAuth2 callback and store credentials."""
    flow = get_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials
    _credentials_store["creds"] = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes,
    }
    return RedirectResponse("http://localhost:3000?gmail=connected")


@router.get("/status")
def gmail_status():
    """Check if Gmail is connected."""
    connected = "creds" in _credentials_store
    return {"connected": connected}


@router.get("/scan")
def scan_travel_emails():
    """Scan Gmail for travel confirmation emails and extract trip data using AI."""
    if "creds" not in _credentials_store:
        raise HTTPException(status_code=401, detail="Gmail non connecté. Allez sur /api/gmail/auth")

    creds_data = _credentials_store["creds"]
    creds = Credentials(
        token=creds_data["token"],
        refresh_token=creds_data["refresh_token"],
        token_uri=creds_data["token_uri"],
        client_id=creds_data["client_id"],
        client_secret=creds_data["client_secret"],
        scopes=creds_data["scopes"],
    )

    service = build("gmail", "v1", credentials=creds)

    # Build Gmail query for travel-related emails
    query = " OR ".join([f'subject:"{kw}"' for kw in TRAVEL_KEYWORDS[:8]])
    query += " newer_than:2y"

    results = service.users().messages().list(
        userId="me", q=query, maxResults=20
    ).execute()

    messages = results.get("messages", [])
    if not messages:
        return {"trips": [], "message": "Aucun email de voyage trouvé."}

    extracted_trips = []

    for msg_ref in messages[:10]:  # Process max 10 emails
        msg = service.users().messages().get(
            userId="me", id=msg_ref["id"], format="full"
        ).execute()

        # Extract subject and body
        headers = msg["payload"].get("headers", [])
        subject = next((h["value"] for h in headers if h["name"] == "Subject"), "")
        date_header = next((h["value"] for h in headers if h["name"] == "Date"), "")

        body = _extract_body(msg["payload"])
        if not body:
            continue

        # Use Claude to extract trip info
        trip_data = _extract_trip_with_ai(subject, body[:3000], date_header)
        if trip_data:
            extracted_trips.append(trip_data)

    return {"trips": extracted_trips, "scanned": len(messages)}


def _extract_body(payload: dict) -> str:
    """Recursively extract email body text."""
    body = ""
    if payload.get("body", {}).get("data"):
        data = payload["body"]["data"]
        body = base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="ignore")
    elif payload.get("parts"):
        for part in payload["parts"]:
            if part.get("mimeType") in ("text/plain", "text/html"):
                data = part.get("body", {}).get("data", "")
                if data:
                    body = base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="ignore")
                    break
    # Strip HTML tags
    body = re.sub(r"<[^>]+>", " ", body)
    body = re.sub(r"\s+", " ", body).strip()
    return body


def _extract_trip_with_ai(subject: str, body: str, date_header: str) -> dict | None:
    """Use Claude to extract structured trip data from email content."""
    if not anthropic_client.api_key:
        return None

    prompt = f"""Analyse cet email et extrais les informations de voyage.
Sujet: {subject}
Date email: {date_header}
Contenu: {body}

Réponds UNIQUEMENT avec un objet JSON valide (sans backticks ni texte) avec ce format exact:
{{"from":"ville départ","to":"ville destination","start":"YYYY-MM-DD","end":"YYYY-MM-DD","notes":"résumé en 1 phrase","budget":0,"type":"vol|hotel|train|autre"}}
Si ce n'est pas un email de voyage ou si les infos sont insuffisantes, réponds exactement: null"""

    try:
        response = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.content[0].text.strip()
        if text.lower() == "null":
            return None
        clean = text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean)
        data["source"] = "gmail"
        data["email_subject"] = subject
        return data
    except Exception:
        return None
