# AarogyaVaani

**Voice of Health** — a voice-first AI healthcare assistant for rural India.

Users open the app and speak. No typing, no literacy, no smartphone experience needed. AarogyaVaani auto-detects the caller's language and responds with medically grounded advice in real-time voice, powered by a curated health knowledge base.

---

## What it does

AarogyaVaani is a full-stack health assistant that combines real-time voice AI with persistent health memory. A user can call in, describe their symptoms in Hindi, get advice grounded in verified medical content, upload a prescription photo, and weeks later call back — the system remembers everything and gives better answers each time.

### Core capabilities

- **Voice calls in 30+ languages** — Hindi, English, Kannada, Tamil, Telugu, Bengali, Marathi, Urdu, and more. Language is auto-detected from speech.
- **Health knowledge base** — RAG-powered retrieval from curated content on diabetes management, maternal health, government schemes (Ayushman Bharat), and general wellness.
- **Persistent memory** — Every conversation is summarised and stored per-user. Future calls reference past context for progressively smarter advice.
- **Medical report upload** — Upload prescriptions, lab reports, or scans (PDF/image). GPT-4o extracts medicines, conditions, and summaries. Stored permanently in health memory.
- **Doctor brief generation** — One-click professional summary of a patient's full history, formatted for clinical handoff.
- **Health tasks** — AI-extracted follow-ups from conversations: medication refills, doctor visits, tests to schedule. With priority levels and calendar export.
- **Family profiles** — Manage health data for multiple family members under one account.
- **Red flag detection** — Real-time emergency keyword detection (chest pain, stroke signs, severe bleeding) with instant 108 ambulance call prompt.
- **Offline fallback** — Text-based health queries when voice connectivity is poor.

---

## App sections

When you open the app, the sidebar (desktop) or bottom nav (mobile) gives you access to everything:

| Section | What it does |
|---|---|
| **Voice Call** | The main interaction. Tap the big call button and speak to AarogyaVaani about any health concern. Supports doctor mode for physicians. Upload reports mid-call. Real-time transcript on the right panel. |
| **Dashboard** | Health summary at a glance — recent conversations, active medications, follow-up reminders, and quick-action buttons. |
| **Knowledge Base** | Your personal health memory. Built from every conversation and uploaded report. This is what makes answers get better over time. |
| **Doctor Brief** | Generate a structured clinical summary to share with your physician — conditions, medications, conversation history, uploaded reports. |
| **Medications** | All medicines tracked in one place. Extracted automatically from prescriptions and voice conversations. Dosage, frequency, and purpose. |
| **Compare** | Compare health data across time periods. Track changes in conditions, medications, and vitals over weeks or months. |
| **Family** | Separate health profiles for each family member. Own memory, medications, and conversation history per person. |
| **Tasks** | Health to-dos extracted from conversations. Medication refills, doctor visits, tests. Priority levels and calendar export. |
| **Call History** | Full transcripts of every past voice conversation. Searchable. |
| **Profile** | Your personal details — name, age, language, existing conditions. Keeping this accurate improves personalisation. |

### Call page features

The call page is the primary interface:

- **Call button** — Large pulsing button to start/end voice calls. Shows connecting, active, and ended states.
- **Nurse avatar** — Animated SVG character with volume-reactive eyes, head bob, and glow. Follows your mouse cursor. Blinks naturally.
- **Doctor mode toggle** — Switch between patient mode (simplified health advice) and doctor mode (clinical terminology, detailed report references).
- **Upload button** — Drag-and-drop or click to upload prescriptions and reports during a call. Extracted data feeds into the conversation.
- **Transcript panel** — Real-time conversation transcript on the right side (desktop) or slide-over (mobile). Shows provenance chips indicating data sources (previous call, uploaded report, knowledge base).
- **Reports tab** — View all uploaded medical reports with extracted medicines, conditions, and document excerpts.
- **Mute control** — Mute/unmute microphone during active calls.
- **Volume indicator** — Visual audio level bar showing assistant speech volume.
- **Emergency overlay** — Full-screen red alert when dangerous symptoms are detected (chest pain, stroke, severe bleeding) with direct 108 ambulance call button.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| Frontend | React 18 + Vite 6 + Tailwind CSS 4 |
| Voice AI | Vapi (GPT-4o + ElevenLabs TTS + Deepgram STT) |
| Vector DB | Qdrant Cloud |
| Embeddings | Multi-provider failover: HuggingFace, Mistral, Cohere, Nvidia |
| LLM | OpenRouter (GPT-4o-mini) |
| Report analysis | GPT-4o vision for PDF/image extraction |
| Auth | Clerk |
| Deployment | Vercel (serverless) |

---

## How it works

1. User opens the web app and taps the call button
2. Vapi handles real-time speech-to-text (Deepgram) and text-to-speech (ElevenLabs)
3. The AI agent (GPT-4o) receives the transcript and calls the backend RAG endpoint
4. The backend searches the Qdrant knowledge base using multilingual embeddings
5. User memory (past conversations, uploaded reports) is included in the context
6. Relevant health content + personal history is returned to the agent
7. The agent responds in the user's detected language via voice
8. At call end, a conversation summary is saved for future context
9. Uploaded reports are processed with GPT-4o vision, and extracted medicines/conditions are stored permanently

---

## Project structure

```
aarogyavaani/
  app/                        # FastAPI backend
    main.py                   # Server: Vapi webhook, RAG, uploads, reports, tasks
    config.py                 # Environment config
    models.py                 # Pydantic request/response models
    embeddings.py             # Multi-provider embedding router with failover
    keypool.py                # API key rotation with cooldown
    languages.py              # 80+ language catalog
  frontend/                   # React + Vite + Tailwind
    src/
      pages/                  # CallPage, DashboardPage, HistoryPage, ProfilePage,
                              # DoctorBriefPage, MedicationsPage, ReportComparePage,
                              # FamilyPage, TasksPage, KnowledgeBasePage,
                              # LandingPage, BlogPage, BlogPostPage
      components/             # Layout, NurseAvatar, OnboardingPopup, GuidedTour,
                              # PageTransition, AppPrimitives
      lib/                    # API client, Vapi client, config
      styles/                 # index.css (animations, keyframes)
  knowledge_base/             # Health content in English, Hindi, Kannada
    english/                  # Diabetes, maternal health, Ayushman Bharat
    hindi/
    kannada/
  vapi_config/                # Vapi assistant configuration + tool schemas
  scripts/                    # Qdrant setup, ingestion, deployment, testing
```

---

## API endpoints

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
| `/medical_reports/upload` | POST | Upload and analyse medical reports (PDF/image) |
| `/medical_reports/{user_id}` | GET | List uploaded medical reports |
| `/doctor_brief` | POST | Generate doctor-facing patient summary |

---

## Getting started

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

### Environment variables

The backend requires:

```
QDRANT_URL=               # Qdrant Cloud cluster URL
QDRANT_API_KEY=           # Qdrant API key
VAPI_API_KEY=             # Vapi platform key
HF_API_TOKEN=             # HuggingFace inference API token
HF_API_TOKEN_1=           # HuggingFace token (rotation pool)
HF_API_TOKEN_2=           # HuggingFace token (rotation pool)
MISTRAL_API_KEY=          # Mistral embeddings fallback
COHERE_API_KEY=           # Cohere embeddings fallback
NVIDIA_API_KEY=           # Nvidia embeddings fallback
OPENROUTER_API_KEY=       # OpenRouter for LLM calls
VERCEL_TOKEN=             # Vercel deployment token (deploy scripts only)
```

The frontend requires (in `aarogyavaani/frontend/.env`):

```
VITE_API_BASE_URL=        # Backend URL (default: http://localhost:8000)
VITE_VAPI_PUBLIC_KEY=     # Vapi public key for web SDK
VITE_VAPI_ASSISTANT_ID=   # Vapi assistant ID
```

---

## Knowledge base

Curated, verified health content covering:

- **Diabetes management** — symptoms, diet, medication adherence, blood sugar monitoring, complications
- **Maternal health** — prenatal care, nutrition, danger signs, postnatal care, immunisation schedules
- **Ayushman Bharat** — government health insurance eligibility, enrollment process, hospital coverage, claim procedures

Content is maintained in three languages (English, Hindi, Kannada) and ingested into Qdrant using the scripts in `aarogyavaani/scripts/`.

---

## Voice onboarding

First-time users are greeted with a conversational onboarding experience on the call page. The nurse avatar "speaks" to the user through chat bubbles, walking them through:

1. What AarogyaVaani is and what it can do
2. How to start a voice call
3. What each section of the app is for (dashboard, knowledge, medications, etc.)
4. How to upload reports and generate doctor briefs
5. How the system remembers and improves over time

This runs once on first visit and can be re-triggered from profile settings.
