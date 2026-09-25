# ✈️ Travel Manager — FastAPI + React

Application de gestion de voyages avec IA (Claude) et intégration Gmail.

## Fonctionnalités

- 📋 Gestion des voyages (départ / destination / dates / statut)
- 💰 Suivi du budget et des dépenses par catégorie
- 📓 Journal de voyage
- 📧 **Scan Gmail automatique** des confirmations de voyage
- 🤖 Assistant IA (Claude) pour questions et détection de texte

---

## Installation

### Prérequis
- Python 3.11+
- Node.js 18+

---

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Créez le fichier `.env` :
```bash
cp .env.example .env
# Éditez .env et ajoutez votre ANTHROPIC_API_KEY
```

Lancez le serveur :
```bash
uvicorn app.main:app --reload --port 8000
```

API disponible sur : http://localhost:8000
Documentation Swagger : http://localhost:8000/docs

---

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Application disponible sur : http://localhost:3000

---

### 3. Configuration Gmail OAuth2

Pour activer le scan automatique des emails :

1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Créez un nouveau projet
3. Activez l'**API Gmail**
4. Allez dans "Identifiants" → "Créer des identifiants" → "ID client OAuth 2.0"
5. Type : **Application Web**
6. URI de redirection autorisé : `http://localhost:8000/api/gmail/callback`
7. Téléchargez le fichier JSON et renommez-le `client_secret.json`
8. Placez `client_secret.json` dans le dossier `backend/`

Puis dans l'application, allez dans l'onglet **Gmail** et cliquez "Connecter Gmail".

---

## Structure du projet

```
travel-app/
├── backend/
│   ├── app/
│   │   ├── main.py              # Point d'entrée FastAPI
│   │   ├── routers/
│   │   │   ├── trips.py         # CRUD voyages
│   │   │   ├── journal.py       # CRUD journal
│   │   │   ├── gmail.py         # OAuth2 Gmail + scan
│   │   │   └── ai.py            # Chat IA + détection texte
│   │   ├── models/
│   │   │   └── schemas.py       # Modèles Pydantic
│   │   └── services/
│   │       └── db.py            # Base de données (in-memory)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── TripsPage.jsx     # Liste des voyages
    │   │   ├── BudgetPage.jsx    # Graphiques budget
    │   │   ├── JournalPage.jsx   # Journal de voyage
    │   │   ├── GmailPage.jsx     # Connexion + scan Gmail
    │   │   └── AIPage.jsx        # Chat IA + détection texte
    │   ├── services/
    │   │   └── api.js            # Appels API
    │   └── App.jsx
    └── package.json
```

---

## Production

Pour persister les données, remplacez `app/services/db.py` par une vraie base SQLite ou PostgreSQL avec SQLAlchemy.
