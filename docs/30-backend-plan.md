# Backend Plan

## Architecture Overview

- Next.js app with API routes (or a small Node service on Cloud Run)
- Gemini API for analysis and report generation
- Google Cloud Storage for video uploads (signed URLs)
- Firestore for document storage (profiles, videos, reports, searches)

## Services and Responsibilities

- Web app: UI, auth/session, workflow state
- API: profile management, video metadata, AI orchestration
- Storage: video files

## Data Model

- Entities: User, ScoutProfile, AthleteProfile, Video, Report, SavedSearch
- Relationships: Users have one profile; Athletes have many videos and reports

### Firestore Collections (MVP)

- `users`: id, role, email, username, passwordHash, createdAt
- `scoutProfiles`: userId, username, name, email, sport, program, level,
  genderFocus?, recruitingStates?, gradYearsRecruiting?, positionFocus?
- `athleteProfiles`: userId, username, name, email, state, sport, position,
  gender, height, weight, gradYear, highSchoolTeam, goal, clubTeam?, currentOffers?,
  highlightTapeUrl?, socials?, gpa?, relocateStates?
- `events`: athleteId, eventName, url, summary, createdAt, updatedAt
- `videos`: athleteId (username), drillType, fileUrl, uploadDate, status,
  analysisStatus, analysisNotes?, analysisMetrics?, retries?
- `reports`: athleteId, type (scout|coach), summary, strengths, weaknesses,
  metrics, createdAt
- `savedSearches`: scoutId, query, filters, createdAt, notifyEmail

### Implementation Status (MVP)

- Live in Firestore: `users`, `scoutProfiles`, `athleteProfiles`, `events`, `videos`, `reports`, `savedSearches`

### Field-Level Schema (MVP)

#### `users`

- id: string (uid)
- role: "scout" | "athlete"
- email: string
- username: string
- passwordHash: string
- createdAt: timestamp

#### `scoutProfiles`

- userId: string
- username: string
- name: string
- email: string
- sport: "lacrosse" | "hockey" | "football"
- program: string
- level: "D1" | "D2" | "D3" | "JUCO" | "Club"
- genderFocus?: "male" | "female" | "both"
- recruitingStates?: string[]
- gradYearsRecruiting?: number[]
- positionFocus?: string[]

#### `athleteProfiles`

- userId: string
- username: string
- name: string
- email: string
- state: string
- sport: "lacrosse" | "hockey" | "football"
- gender: "male" | "female"
- position: string
- height: string
- weight: string
- gradYear: number
- highSchoolTeam: string
- goal: string
- clubTeam?: string
- currentOffers?: string[]
- highlightTapeUrl?: string
- socials?: { instagram?: string; x?: string; tiktok?: string; youtube?: string }
- gpa?: number
- relocateStates?: string[]

#### `events`

- athleteId: string
- eventName: string
- url: string
- summary: string
- createdAt: timestamp
- updatedAt: timestamp

#### `videos`

- athleteId: string (unique username)
- drillType: "wall_ball" | "dash_20" | "shuttle_5_10_5"
- fileUrl: string
- uploadDate: timestamp
- status: "uploaded" | "processing" | "ready" | "failed"
- analysisStatus?: "pending" | "running" | "ready" | "failed"
- analysisNotes?: string | null
- analysisMetrics?: Record<string, string | number> (schema set by Gemini agent)
 - analysisUpdatedAt?: timestamp
- analysisError?: string | null
- retries?: number

#### `reports`

- athleteId: string
- type: "scout" | "coach"
- summary: string
- strengths: string[]
- weaknesses: string[]
- metrics: Record<string, string | number>
- goalAlignment?: string
- createdAt: timestamp

#### `savedSearches`

- scoutId: string
- query: string
- filters: Record<string, string | number | string[]>
- createdAt: timestamp
- notifyEmail: boolean (stored preference only in MVP)

## API Design

- Endpoints: profile CRUD, video upload URL, drill analysis, report generation, scout search
- Auth model: basic username/password login (MVP)
- Rate limits: basic per-user limits if needed

### API Contract (MVP)

- `POST /api/auth/login`: basic login
- `POST /api/scout/profile`: create/update scout profile
- `POST /api/athlete/profile`: create/update athlete profile
- `POST /api/athlete/events`: add athlete-submitted event link
- `PATCH /api/athlete/events`: edit athlete event entries
- `POST /api/athlete/video/upload-url`: get signed GCS upload URL
- `POST /api/athlete/video/complete`: mark upload complete + kick off report
- `POST /api/athlete/video/analyze`: run drill analysis via Gemini
- `POST /api/reports/refresh`: regenerate scouting + coaching reports
- `POST /api/scout/search`: NL search → parsed filters → results
- `POST /api/scout/search/save`: save search for alerts
- `GET /api/scout/athlete/:id`: athlete profile + videos + reports

### Email Alerts (Future)

- Not in MVP. We store saved searches + preferences only.

### Data Flow

1. Athlete completes profile → `athleteProfiles` document created.
2. Athlete requests upload URL → signed GCS URL returned.
3. Upload completes → `videos` document created (status: uploaded).
4. Drill analysis starts → Gemini drill agent runs → `analysisNotes/metrics` stored.
5. Report generation starts → Gemini report agent runs → `reports` stored.
6. Research agent adds events on profile creation → `events` updated.
7. Athlete can add/edit events → `events` updated.
8. Scout runs NL search → parsed filters → matching athlete profiles.

## Storage

- Primary database: Firestore (document store, denormalized)
- File storage: Google Cloud Storage

### Indexing

- Required indexes for `athleteProfiles`: sport, position, state, gradYear
- Optional indexes for `reports`: metrics tags

## Integrations

- Gemini API via task-specific agents:
  - Combine drill agent (video analysis for wall ball, 20-yard dash, 5-10-5)
  - Athlete research agent (Gemini Google Search tool → event entries)
  - Scouting/coaching agent (scouting report + coaching guidance)
  - Scout query agent (NL search → structured filters)
  - All agents share one Gemini client with role-specific prompts

## Google Cloud Usage

- Storage: GCS bucket for uploaded videos; signed URLs for upload/view
- Firestore: source of truth for profiles, videos, analysis, reports
- Gemini: analysis results stored in Firestore, not in Storage metadata

## Observability

- Logging: request + error logs
- Metrics: basic latency and error counts
- Alerts: optional for hackathon

## Deployment

- Environments: dev + hackathon demo
- CI/CD: minimal, manual deploy acceptable

## Open Questions

- None for now
