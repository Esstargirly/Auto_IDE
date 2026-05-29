# Auto IDE

Auto IDE is an autonomous cloud IDE for generating and managing software projects from natural-language prompts. It includes a Next.js frontend, a FastAPI backend, Docker-based project sandboxing, Postgres persistence, Redis-backed background work, and integrations for OpenAI, GitHub, and Resend.

Deployed frontend: https://auto-ide.vercel.app/

## Features

- Prompt-driven project creation and iteration
- Next.js dashboard for managing generated projects
- FastAPI backend with authentication and project APIs
- Docker sandbox service for generated code workspaces
- Background worker support through Redis
- Postgres database storage with SQLAlchemy models
- GitHub and email integration hooks

## Tech Stack

- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Redis, Docker SDK
- Database: PostgreSQL
- Queue/cache: Redis
- AI: OpenAI API
- Deployment: Vercel for the frontend

## Project Structure

```text
.
├── backend/              # FastAPI API, worker, services, and app models
├── frontend/             # Next.js frontend application
├── docker-compose.yml    # Local Postgres, Redis, backend, and worker services
└── README.md
```

## Local Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker and Docker Compose
- PostgreSQL and Redis, or the included Docker Compose services

### Backend

```bash
cd backend
cp .env.example .env
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will run at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:3000`.

### Docker Compose

To start the local infrastructure and backend services together:

```bash
docker compose up --build
```

This starts Postgres, Redis, the FastAPI backend, and the background worker.

## Environment Variables

Create `backend/.env` from `backend/.env.example` and update these values for your environment:

```env
SECRET_KEY=change-this-in-production
DATABASE_URL=postgresql+psycopg2://postgres:postgrespassword@localhost:5432/auto_ide
REDIS_URL=redis://localhost:6379/0
DOCKER_HOST=unix:///var/run/docker.sock
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL_NAME=gpt-4o
GITHUB_TOKEN=your-github-token
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=onboarding@resend.dev
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

## Useful Commands

```bash
# Frontend
cd frontend && npm run dev
cd frontend && npm run build

# Backend
cd backend && uvicorn app.main:app --reload
cd backend && python app/worker.py

# Full local stack
docker compose up --build
```

## Deployment

The frontend is deployed on Vercel at https://auto-ide.vercel.app/. Configure the production backend URL and any required API environment variables in the deployment platform before connecting the live frontend to a backend service.
