# Backend Starter

Minimal FastAPI backend for hackathon builds.

## Run locally

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## Starter endpoints

- `GET /api/health`
- `POST /api/idea`

## What to add first at a hackathon

1. Auth or session layer
2. One persistence layer (SQLite, Supabase, Postgres)
3. One AI or core workflow endpoint
4. One demo-friendly status endpoint
