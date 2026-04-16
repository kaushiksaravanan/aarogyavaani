# AarogyaVaani

Voice-first AI healthcare assistant for rural India. Users call in and speak to get healthcare guidance in their own language -- no literacy or smartphone skills required.

**AarogyaVaani** (meaning "Voice of Health" in Hindi) auto-detects the caller's language and responds with medically grounded advice powered by a curated knowledge base covering diabetes management, maternal health, and government health schemes like Ayushman Bharat.

## Features

- **Multilingual voice calls** -- Hindi, English, Kannada with auto-detection (80+ languages supported)
- **RAG-powered health knowledge** -- Qdrant vector database with curated, verified health content
- **Persistent user memory** -- conversation summaries stored per-user across calls
- **Medical report upload** -- PDF/image analysis using GPT-4o with structured extraction of medicines and conditions
- **Doctor brief generation** -- LLM-generated professional summaries for physicians
- **Call history and health tasks** -- AI-extracted actionable tasks with priority levels and calendar export
- **Health reports** -- aggregated reports with tracked conditions, recommendations, and call timeline
- **User profiles** -- name, age, gender, conditions, preferred language, family members

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| Frontend | React 18 + Vite 6 + Tailwind CSS 4 |
| Voice AI | Vapi (GPT-4o + ElevenLabs TTS + Deepgram STT) |
| Vector DB | Qdrant Cloud |
| Embeddings | Multi-provider failover: HuggingFace, Mistral, Cohere, Nvidia |
| LLM | OpenRouter (GPT-4o-mini) |
| Auth | Clerk |
| Deployment | Vercel (serverless) |

## Project Structure

```
aarogyavaani/
  app/                    # FastAPI backend
    main.py               # Main server: Vapi webhook, RAG, uploads, reports
    config.py             # Environment config
    models.py             # Pydantic request/response models
    embeddings.py         # Multi-provider embedding router with failover
    keypool.py            # API key rotation with cooldown
    languages.py          # 80+ language catalog
  frontend/               # React + Vite + Tailwind
    src/pages/            # Landing, Call, Dashboard, History, Profile, Blog
    src/lib/              # API client, Vapi client, config
    src/components/       # Layout, PageTransition
  knowledge_base/         # Health content in English, Hindi, Kannada
    english/              # Diabetes, maternal health, Ayushman Bharat
    hindi/
    kannada/
  vapi_config/            # Vapi assistant configuration + tool schemas
  scripts/                # Qdrant setup, ingestion, deployment, testing
```

## API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Health check |
| `/query_health_knowledge` | POST | RAG query against knowledge base + user memory |
| `/save_conversation_summary` | POST | Persist conversation summary to Qdrant |
| `/vapi/webhook` | POST | Vapi server URL (function-calls, end-of-call, assistant-request) |
| `/generate_tasks` | POST | Extract actionable health tasks from conversation |
| `/call_history/{user_id}` | GET | Fetch user's call history |
| `/health_report/{user_id}` | GET | Generate aggregated health report |
| `/supported_languages` | GET | Full language catalog |
| `/medical_reports/upload` | POST | Upload and analyze medical reports (PDF/image) |
| `/medical_reports/{user_id}` | GET | List uploaded medical reports |
| `/doctor_brief` | POST | Generate doctor-facing patient summary |

## Getting Started

### Backend

```bash
cd aarogyavaani
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd aarogyavaani/frontend
npm install
npm run dev
```

### Environment Variables

The backend requires the following environment variables:

```
QDRANT_URL=           # Qdrant Cloud cluster URL
QDRANT_API_KEY=       # Qdrant API key
VAPI_API_KEY=         # Vapi platform key
HF_API_TOKEN=         # HuggingFace inference API token
HF_API_TOKEN_1=       # HuggingFace token (rotation pool)
HF_API_TOKEN_2=       # HuggingFace token (rotation pool)
MISTRAL_API_KEY=      # Mistral embeddings fallback
COHERE_API_KEY=       # Cohere embeddings fallback
NVIDIA_API_KEY=       # Nvidia embeddings fallback
OPENROUTER_API_KEY=   # OpenRouter for LLM calls
VERCEL_TOKEN=         # Vercel deployment token (deploy scripts only)
```

## How It Works

1. User opens the web app and starts a voice call
2. Vapi handles real-time speech-to-text (Deepgram) and text-to-speech (ElevenLabs)
3. The AI agent (GPT-4o) receives the transcript and calls the backend RAG endpoint
4. The backend searches the Qdrant knowledge base using multilingual embeddings
5. Relevant health content + past conversation memory is returned to the agent
6. The agent responds in the user's detected language
7. At call end, a conversation summary is saved for future context

## Knowledge Base

Curated health content covering:

- **Diabetes management** -- symptoms, diet, medication adherence, blood sugar monitoring
- **Maternal health** -- prenatal care, nutrition, danger signs, postnatal care
- **Ayushman Bharat** -- government health insurance scheme eligibility, enrollment, coverage

Content is maintained in three languages (English, Hindi, Kannada) and ingested into Qdrant using the scripts in `aarogyavaani/scripts/`.
