# Scout MVP

Scout is a lacrosse-first MVP that helps athletes upload combine videos and
receive AI feedback, while scouts search and evaluate prospects. The app uses
Gemini agents for drill analysis, scout/coaching reports, and athlete research.

## App location

The Next.js app lives in `web/`.

## Quick start

1. Install dependencies in `web/`
2. Create `web/.env.local`
3. Run the dev server

```bash
cd web
npm install
npm run dev
```

## Environment variables (web/.env.local)

- `NEXT_PUBLIC_FIREBASE_*` Firebase client config (auth, project, storage, etc.)
- `FIREBASE_STORAGE_BUCKET` GCS bucket for uploads
- `FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS`
- `GOOGLE_API_KEY` or `GEMINI_API_KEY` for Gemini

## Docs Index

- `docs/README.md` - index and how to use the docs
- `docs/00-project-overview.md` - high-level vision, scope, success metrics
- `docs/05-spec-checklist.md` - spec checklist to remove ambiguity
- `docs/10-requirements.md` - functional + non-functional requirements
- `docs/20-frontend-plan.md` - UI/UX, pages, components, states
- `docs/25-ai-agents.md` - Gemini agent definitions and triggers
- `docs/30-backend-plan.md` - architecture, data, APIs, infra
- `docs/40-milestones.md` - delivery phases and test plan

## How we work

Iterate from high-level to frontend to backend, then implement in small,
deliberate tasks with documentation updates.
