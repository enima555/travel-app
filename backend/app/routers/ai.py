from fastapi import APIRouter, HTTPException
from anthropic import Anthropic
from app.models.schemas import AIQuery, DetectRequest
from app.services import db
import os
import json

router = APIRouter()
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))


def _require_api_key():
    if not client.api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY non configurée.")


@router.post("/chat")
def chat(query: AIQuery):
    """Answer questions about the user's trips."""
    _require_api_key()
    trips = db.get_all_trips()
    trips_summary = "\n".join([
        f"- {t['from_city']} → {t['to_city']} ({t['start']} / {t.get('end','?')}), "
        f"budget: {t['budget']}€, dépensé: {t['spent']}€, statut: {t['status']}"
        for t in trips
    ])
    system = f"""Tu es un assistant de voyage personnel. 
Voici les voyages de l'utilisateur:
{trips_summary}

Réponds en français, de façon concise et utile (5 phrases max)."""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=600,
        system=system,
        messages=[{"role": "user", "content": query.question}]
    )
    return {"reply": response.content[0].text}


@router.post("/detect")
def detect_trip(req: DetectRequest):
    """Extract trip information from raw text (email, SMS, itinerary...)."""
    _require_api_key()
    prompt = f"""Extrais les informations de voyage de ce texte.
Réponds UNIQUEMENT avec un objet JSON valide (sans backticks ni texte) avec ce format:
{{"from":"ville départ","to":"ville destination","start":"YYYY-MM-DD","end":"YYYY-MM-DD","notes":"résumé en 1 phrase","budget":0}}
Si les infos sont insuffisantes, réponds exactement: null

Texte: {req.text}"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )
    text = response.content[0].text.strip()
    if text.lower() == "null":
        raise HTTPException(status_code=422, detail="Aucune information de voyage détectée.")
    try:
        clean = text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)
    except Exception:
        raise HTTPException(status_code=422, detail="Impossible d'analyser la réponse IA.")
