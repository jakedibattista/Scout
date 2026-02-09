# Scout MVP (Hackathon)

Scout is a lacrosse-first scouting platform. Athletes upload combine videos for
AI analysis, while scouts run natural-language searches to find the right
prospects. The system uses Gemini agents for drill analysis, scouting/coaching
reports, and public competition research.

## Judge quick start

- App lives in `web/`
- Run locally:
  ```bash
  cd web
  npm install
  npm run dev
  ```
- Live demo (Vercel): https://scout-three-peach.vercel.app/

## What you can try

- Athlete: create profile → upload 3 drills (wall ball, 20‑yard dash, 5‑10‑5)
- AI: drill notes + metrics + coaching guidance + scouting report
- Events: add/edit/delete competitions; run research to auto‑populate
- Scout: natural-language search, saved searches, athlete detail view

## How it works (high level)

- Next.js app in `web/` (App Router)
- Firestore stores profiles, videos, reports, and events
- GCS stores raw videos (signed URL upload)
- Gemini agents:
  - Drill review (video → metrics + notes)
  - Scout report (summary + strengths + weaknesses)
  - Coaching guidance (actionable athlete coaching)
  - Research (Gemini Google Search → competition entries)
  - Scout query parser (NL search → structured filters)

## Tech stack (plain English)

- Next.js for the website and backend APIs in one place
- Firebase/Firestore for user data, reports, and events
- Google Cloud Storage for raw video uploads
- Gemini AI for video analysis, reports, and research

## Environment variables (web/.env.local)

- `NEXT_PUBLIC_FIREBASE_*` Firebase client config (auth, project, storage, etc.)
- `FIREBASE_STORAGE_BUCKET` GCS bucket for uploads
- `FIREBASE_SERVICE_ACCOUNT_JSON` Firebase Admin JSON (stringified)
- `GOOGLE_API_KEY` or `GEMINI_API_KEY` for Gemini

## Repo map

- `web/` Next.js app
- `docs/` product + architecture documentation
- `firebase/` Firebase configs (rules, indexes, CORS)

## Docs Index

- `docs/README.md` - index and how to use the docs
- `docs/00-project-overview.md` - high-level vision, scope, success metrics
- `docs/05-spec-checklist.md` - spec checklist to remove ambiguity
- `docs/10-requirements.md` - functional + non-functional requirements
- `docs/20-frontend-plan.md` - UI/UX, pages, components, states
- `docs/25-ai-agents.md` - Gemini agent definitions and triggers
- `docs/30-backend-plan.md` - architecture, data, APIs, infra
- `docs/40-milestones.md` - delivery phases and test plan

## Notes for judges

- MVP scope: no email/push notifications or scout contact workflow yet
- Saved searches are stored for future alerts
