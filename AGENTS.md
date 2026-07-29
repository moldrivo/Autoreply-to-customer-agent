# AutoReply AI — Agent Instructions

## Project Overview

AI-powered platform that generates intelligent, context-aware replies to customer reviews across 12+ platforms (Google, Yelp, Trustpilot, Facebook, Amazon, etc.). Multi-tenant SaaS with a multi-agent AI pipeline (sentiment analysis, knowledge retrieval, reply generation, safety guardrails, quality evaluation).

## Architecture

```
NGINX (:80/:443)
├── /api/* → FastAPI backend (:8000)
└── /* → Next.js frontend (:3000)
```

- **Backend**: FastAPI + SQLAlchemy 2.0 (async) + Celery + PostgreSQL + Redis
- **Frontend**: Next.js 14 App Router + React 18 + TypeScript + Tailwind CSS 3
- **Auth**: JWT (access + refresh tokens) with Zustand store
- **AI**: Multi-agent pipeline (7 agents) using OpenAI GPT-4o

## Tech Stack

| Layer | Tools |
|-------|-------|
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2, Celery |
| Frontend | Next.js 14, React 18, TypeScript 5, Tailwind CSS 3, Radix UI primitives |
| State | TanStack Query (React Query 5), Zustand 5, Zod validation |
| Data | PostgreSQL 16, Redis 7 |
| AI | OpenAI GPT-4o, custom multi-agent pipeline, Pinecone/Qdrant vector DB |
| Infra | Docker Compose, NGINX, Vercel (frontend), Render (backend) |

## Directory Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI entry, middleware, routers
│   ├── adapters/            # Platform API adapters (Google, Yelp, etc.)
│   ├── agents/              # Multi-agent AI pipeline (7 agents)
│   ├── api/v1/              # REST routes (auth, reviews, analytics, etc.)
│   ├── core/                # Config, database, dependencies, security
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── services/            # Business logic layer
│   └── workers/             # Celery async tasks
├── alembic/                 # DB migrations
├── run.py                   # Dev server entry (uvicorn)
├── requirements.txt
└── Dockerfile

frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (auth)/          # Login, signup, verify
│   │   └── (dashboard)/     # Dashboard, reviews, analytics, admin, etc.
│   ├── components/          # React components
│   │   ├── ui/              # Radix-based primitives (button, card, tabs, etc.)
│   │   ├── layout/          # AppShell, Sidebar, Navbar, PageTransition
│   │   ├── analytics/       # Charts, stats cards
│   │   ├── reviews/         # ReviewCard, FiltersBar
│   │   └── brand/           # ToneSelector, ReplyPreview
│   ├── hooks/               # Custom hooks (use-analytics, use-brand, use-reviews)
│   ├── lib/                 # API client (axios), auth helpers, utilities
│   ├── providers/           # React Query provider, Theme provider
│   ├── stores/              # Zustand stores (auth-store)
│   └── types/               # TypeScript type definitions
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Commands

### Frontend
```bash
npm run dev      # Dev server on :3000
npm run build    # Production build
npm run start    # Run built app
npm run lint     # ESLint
```

### Backend
```bash
cd backend && python run.py                    # Dev server on :8000
cd backend && pytest --verbose --cov=.          # Run tests
cd backend && alembic upgrade head              # Run migrations
```

### Docker
```bash
make build       # docker compose build
make up          # docker compose up -d
make down        # docker compose down
make logs        # docker compose logs -f
```

### Full Stack
```bash
make dev         # Start backend + frontend in separate windows
make test        # Backend pytest + frontend tests
make lint        # Backend (black/flake8/mypy) + Frontend (next lint)
make clean       # Remove caches, node_modules, .next
```

## Coding Conventions

### General
- No comments in code unless documenting a non-obvious behavior
- Follow existing patterns in the file you're editing
- Mimic surrounding code style (import style, naming, formatting)

### Frontend
- **Components**: `'use client'` directive at top when using hooks/browser APIs
- **Imports**: Use `@/` alias (e.g., `@/components/ui/button`, `@/lib/api`, `@/stores/auth-store`)
- **State**: React Query for server state (API data), Zustand for client state (auth)
- **UI**: Radix UI primitives from `@/components/ui/*`, styled with `cn()` utility
- **Styling**: Tailwind CSS with custom theme from `tailwind.config.ts`
- **Icons**: `lucide-react` — import only the icons you need
- **Forms**: `react-hook-form` + `zod` validation
- **Animations**: `framer-motion` — avoid `AnimatePresence mode="wait"` in layouts (causes blank pages on navigation)
- **API calls**: Axios instance from `@/lib/api` with auto-refresh interceptor
- **Auth**: `useAuthStore` from `@/stores/auth-store`, `isAuthenticated()` from `@/lib/auth`
- **Types**: Import from `@/types`
- **Browser-only code**: Guard with `typeof window !== 'undefined'`
- **No `any` types** in frontend code; define proper interfaces

### Backend
- **Routes**: FastAPI routers in `app/api/v1/`, use dependency injection for auth/DB
- **Schemas**: Pydantic v2 models in `app/schemas/`, never use `body: dict`
- **Services**: Business logic in `app/services/`, not in route handlers
- **Async**: SQLAlchemy 2.0 async sessions, `async def` for all endpoints
- **Logging**: Structured logging with request IDs via `logging.LoggerAdapter`
- **Security**: JWT access + refresh tokens, bcrypt password hashing, rate limiting
- **Config**: Pydantic settings from `app/core/config.py` (loaded from `.env`)
- **Validation**: Pydantic field validators for all config values (reject defaults in production)
- **Errors**: Use `HTTPException` with proper status codes, global exception handler in `main.py`
- **No inline `with logging.LoggerAdapter(...) as log:`** — plain assignment only (Python 3.14 removed context manager support)
- **Database**: Use Alembic for migrations, auto-create tables on startup for dev

### Testing
- Backend: `pytest` with `--cov` flag (tests in `backend/tests/`)
- Frontend: `npm test` (tests in `frontend/__tests__/` or co-located)
- Run `make lint` and `make test` before committing

## Important Patterns

### Adding a new dashboard page
1. Create directory under `frontend/src/app/(dashboard)/<name>/`
2. Create `page.tsx` with `'use client'` directive
3. Add sidebar link in `frontend/src/components/layout/sidebar.tsx`
4. Wrap content in `<PageTransition>` for consistent animations
5. Use `useQuery` from `@tanstack/react-query` for API data
6. Handle loading, error, and empty states

### Adding a new API endpoint
1. Create route in `backend/app/api/v1/` (or add to existing router)
2. Create Pydantic schema in `backend/app/schemas/`
3. Add business logic to `backend/app/services/`
4. Add ORM model in `backend/app/models/` if new table
5. Include router in `backend/app/main.py`
6. Add frontend API function in `frontend/src/lib/api.ts`
7. Add TypeScript types in `frontend/src/types/index.ts`
