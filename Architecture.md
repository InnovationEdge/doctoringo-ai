# KnowHow AI - System Architecture

## Overview

KnowHow AI არის იურიდიული AI ასისტენტი, რომელიც იყენებს RAG (Retrieval-Augmented Generation) სისტემას საქართველოს და სხვა ქვეყნების კანონმდებლობაზე პასუხების გასაცემად.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Chat    │ │ Settings │ │Documents │ │  Plans   │ │ Landing  │  │
│  │  Area    │ │  Modal   │ │  Page    │ │  Page    │ │  Page    │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       │            │            │            │            │         │
│       └────────────┴────────────┴────────────┴────────────┘         │
│                              │                                       │
│                      ┌───────┴───────┐                              │
│                      │   api.ts      │  (API Integration Layer)     │
│                      └───────┬───────┘                              │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTPS (SSE for streaming)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Django REST Framework)                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     API Layer (/api/)                        │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│  │  │  Chat   │ │ Payment │ │Documents│ │  Auth   │           │   │
│  │  │  App    │ │  App    │ │  App    │ │(allauth)│           │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │   │
│  └───────┼──────────┼──────────┼──────────┼────────────────────┘   │
│          │          │          │          │                         │
│  ┌───────┴──────────┴──────────┴──────────┴────────────────────┐   │
│  │                    Core Services                             │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│  │  │   RAG    │ │  Gemini  │ │  OpenAI  │ │  Flitt   │       │   │
│  │  │ System   │ │   API    │ │   API    │ │ Payment  │       │   │
│  │  └────┬─────┘ └──────────┘ └──────────┘ └──────────┘       │   │
│  └───────┼─────────────────────────────────────────────────────┘   │
│          │                                                          │
│  ┌───────┴─────────────────────────────────────────────────────┐   │
│  │                    Data Layer                                │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │   │
│  │  │PostgreSQL│ │ ChromaDB │ │  GCS     │                     │   │
│  │  │(Primary) │ │ (Vectors)│ │ (Files)  │                     │   │
│  │  └──────────┘ └──────────┘ └──────────┘                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Tech Stack
- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool & Dev Server
- **TailwindCSS** - Styling
- **Radix UI** - Accessible Components
- **Motion (Framer)** - Animations
- **react-markdown** - Markdown Rendering

### Key Components

```
src/
├── components/
│   ├── App.tsx              # Main App, Auth State, Routing
│   ├── ChatArea.tsx         # Chat Interface, Message Streaming
│   ├── ChatMessage.tsx      # Message Display, Markdown, Thinking
│   ├── AppSidebar.tsx       # Session List, Navigation
│   ├── SettingsModal.tsx    # User Settings, Subscription
│   ├── OnboardingFlow.tsx   # New User Onboarding
│   ├── LandingPage.tsx      # Public Landing, Contact Form
│   ├── PlansPage.tsx        # Subscription Plans
│   ├── LegalDocumentsPage.tsx # Document Management
│   └── SearchOverlay.tsx    # Chat Search
│
├── lib/
│   └── api.ts               # All API Integrations
│
└── ui/                      # Reusable UI Components (shadcn)
```

### State Management
- **Local State** - React useState for component state
- **Session Storage** - User preferences, onboarding status
- **API State** - Server-side state via REST API

### Authentication Flow
```
1. User clicks "Login with Google"
2. Redirect to /accounts/google/login/
3. Google OAuth flow
4. Redirect back with session cookie
5. Frontend calls /api/user/ to get user data
6. User state stored in App.tsx
```

---

## Backend Architecture

### Tech Stack
- **Django 6.0** - Web Framework
- **Django REST Framework** - API Layer
- **django-allauth** - OAuth Authentication
- **PostgreSQL** - Primary Database
- **ChromaDB** - Vector Store for RAG
- **Google Cloud Run** - Hosting
- **Google Cloud Storage** - File Storage

### App Structure

```
knowhow-backend/
├── config/
│   ├── settings.py          # Django Settings
│   ├── urls.py              # URL Configuration
│   └── adapters.py          # Custom OAuth Adapter
│
├── chat/
│   ├── views.py             # Chat, User, Session APIs
│   ├── models.py            # ChatSession, ChatMessage, UploadedFile
│   ├── serializers.py       # DRF Serializers
│   ├── prompts/             # Country-specific Legal Prompts
│   └── title_generator.py   # Auto Chat Titles
│
├── payment/
│   ├── views.py             # Subscription, Payment APIs
│   ├── models.py            # UserSubscription, Payment
│   └── services.py          # Flitt Payment Integration
│
├── documents/
│   ├── views.py             # Document CRUD, Generate, Download
│   ├── models.py            # Document Model
│   └── document_generator.py # PDF/DOCX Generation
│
└── rag/
    ├── retriever.py         # Document Retrieval
    ├── smart_retriever.py   # Intelligent Query Processing
    ├── embeddings.py        # Text Embeddings
    ├── vector_store.py      # ChromaDB Integration
    └── matsne_scraper.py    # Legal Document Scraper
```

---

## AI Models

### Model Tiers

| Tier | Model | Use Case |
|------|-------|----------|
| **Premium** | `gemini-2.0-flash-thinking-exp` | Complex legal analysis with visible reasoning |
| **Standard** | `gemini-2.5-flash` | Fast everyday legal questions |
| **Fallback** | `gpt-4o` / `o1` | When Gemini unavailable |

### Thinking Model
Premium tier იყენებს Gemini 2.0 Flash Thinking მოდელს, რომელიც:
- აჩვენებს reasoning process-ს რეალურ დროში
- უფრო ზუსტია რთული იურიდიული კითხვებისთვის
- Streaming-ით გადასცემს thinking და content ცალ-ცალკე

```python
# Backend streaming logic
if is_thinking_model:
    for part in candidate.content.parts:
        if part.thought:
            yield f"data: {json.dumps({'thinking': part.text})}\n\n"
        else:
            yield f"data: {json.dumps({'content': part.text})}\n\n"
```

---

## RAG System (Retrieval-Augmented Generation)

### How It Works

```
User Query
    │
    ▼
┌─────────────────┐
│ Query Analyzer  │ ─── Detect: Legal domain, entities, intent
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Query Expander  │ ─── Add synonyms, related terms (Georgian)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Hybrid Search   │
│  ├─ BM25        │ ─── Keyword matching
│  └─ Semantic    │ ─── Vector similarity
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cross-Encoder   │ ─── Re-rank results by relevance
│   Reranker      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Context Builder │ ─── Format retrieved documents
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   LLM (Gemini)  │ ─── Generate answer with citations
└────────┬────────┘
         │
         ▼
    AI Response
```

### Data Sources
- **Matsne.gov.ge** - საქართველოს საკანონმდებლო მაცნე
- **EUR-Lex** - European Union Law
- Other country-specific legal databases

---

## Database Schema

### Core Models

```sql
-- User (Django built-in)
User {
    id, username, email, first_name, last_name,
    date_joined, last_login
}

-- Chat Session
ChatSession {
    id (UUID), user_id, title,
    created_at, updated_at
}

-- Chat Message
ChatMessage {
    id (UUID), session_id, role (user/assistant),
    content, thought, timestamp
}

-- Uploaded File
UploadedFile {
    id (UUID), user_id, session_id,
    file, original_filename, file_type,
    file_size, extracted_text, uploaded_at
}

-- User Subscription
UserSubscription {
    id, user_id, status (active/cancelled/expired),
    plan_name, current_period_start, current_period_end,
    auto_renew, premium_questions_used
}

-- Payment
Payment {
    id, user_id, amount, currency, status,
    flitt_order_id, created_at
}

-- Document
Document {
    id (UUID), user_id, session_id,
    title, content, format (pdf/docx),
    file, file_size, created_at
}
```

---

## Authentication & Security

### Session-Based Auth
- Django Session Authentication
- CSRF Protection for all mutations
- Secure cookies (SameSite=None, Secure=True)
- Cross-domain cookies via `.knowhow.ge`

### OAuth Flow
```
Frontend                    Backend                     Google
   │                           │                           │
   │──── Click Login ─────────▶│                           │
   │                           │──── Redirect ────────────▶│
   │                           │                           │
   │                           │◀─── Auth Code ────────────│
   │                           │                           │
   │                           │──── Exchange Token ──────▶│
   │                           │◀─── User Info ────────────│
   │                           │                           │
   │◀─── Session Cookie ───────│                           │
   │                           │                           │
```

### CORS Configuration
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4000",
    "https://knowhow.ge",
    "https://www.knowhow.ge",
]
CORS_ALLOW_CREDENTIALS = True
```

---

## Payment System

### Flitt Integration
```
User                    Frontend                Backend                 Flitt
 │                         │                       │                      │
 │── Select Plan ─────────▶│                       │                      │
 │                         │── POST /payment/create/──▶│                  │
 │                         │                       │── Create Order ─────▶│
 │                         │                       │◀── Payment URL ──────│
 │                         │◀── Redirect URL ──────│                      │
 │◀── Redirect to Flitt ───│                       │                      │
 │                         │                       │                      │
 │── Complete Payment ─────────────────────────────────────────────────▶│
 │                         │                       │◀── Callback ─────────│
 │                         │                       │── Update Status ─────│
 │◀── Redirect Success ────│                       │                      │
```

---

## Deployment

### Infrastructure
```
┌─────────────────────────────────────────────────┐
│              Google Cloud Platform               │
│                                                  │
│  ┌──────────────┐    ┌──────────────────────┐  │
│  │  Cloud Run   │    │   Cloud SQL          │  │
│  │  (Backend)   │◀──▶│   (PostgreSQL)       │  │
│  └──────────────┘    └──────────────────────┘  │
│         │                                       │
│         │            ┌──────────────────────┐  │
│         └───────────▶│   Cloud Storage      │  │
│                      │   (Media Files)      │  │
│                      └──────────────────────┘  │
│                                                 │
│  ┌──────────────┐    ┌──────────────────────┐  │
│  │  Firebase    │    │   Secret Manager     │  │
│  │  (Frontend)  │    │   (API Keys)         │  │
│  └──────────────┘    └──────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Environment Variables
```bash
# Database
DB_NAME, DB_USER, DB_PASSWORD, DB_HOST

# AI APIs
GEMINI_API_KEY, OPENAI_API_KEY

# Payment
FLITT_MERCHANT_ID, FLITT_PAYMENT_KEY, FLITT_SECRET_KEY

# OAuth
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

# Email
EMAIL_HOST_USER, EMAIL_HOST_PASSWORD
CONTACT_EMAIL=KnowHowAIassistant@gmail.com
```

---

## Development Setup

### Backend
```bash
cd knowhow-backend
python3.13 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Configure environment
python manage.py migrate
python manage.py runserver 8000
```

### Frontend
```bash
cd knowhow-frontend
npm install --include=dev
cp .env.example .env.local  # Configure API URL
npm run dev
```

### Local URLs
- Frontend: http://localhost:4000
- Backend: http://localhost:8000
- Admin: http://localhost:8000/admin/

---

## Performance Optimizations

1. **Streaming Responses** - SSE for real-time AI responses
2. **Connection Pooling** - PostgreSQL CONN_MAX_AGE=600
3. **Lazy Loading** - Components loaded on demand
4. **Caching** - Embedding cache for repeated queries
5. **Hybrid Search** - BM25 + Semantic for better retrieval
