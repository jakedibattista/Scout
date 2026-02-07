# Backend Plan

## Architecture Overview

- Next.js app with API routes (or a small Node service on Cloud Run)
- Gemini API for analysis and report generation
- Google Cloud Storage for video uploads
- Firestore for document storage (profiles, reports, searches)

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
  recruitingStates?, minAge?, positionFocus?
- `athleteProfiles`: userId, username, name, email, state, sport, position,
  height, weight, gradYear, highSchoolTeam, goal, clubTeam?, currentOffers?,
  highlightTapeUrl?, socials?, gpa?, relocateStates?
- `events`: athleteId, url, notes, date?, results?, createdAt
- `videos`: athleteId, drillType, fileUrl, uploadDate, status, feedback?, retries?
- `reports`: athleteId, type (scout|research|coach), summary, strengths,
  weaknesses, metrics, recommendedLevel, createdAt
- `savedSearches`: scoutId, query, parsedFilters, createdAt, notifyEmail

### Implementation Status (MVP)

- Live in Firestore: `users`, `scoutProfiles`, `athleteProfiles`, `events`
- Pending: `videos`, `reports`, `savedSearches` persistence and workflows

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
- recruitingStates?: string[]
- minAge?: number
- positionFocus?: string[]

#### `athleteProfiles`

- userId: string
- username: string
- name: string
- email: string
- state: string
- sport: "lacrosse" | "hockey" | "football"
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
- url: string
- notes: string
- date?: string
- results?: string
- createdAt: timestamp

#### `videos`

- athleteId: string
- drillType: "speed_ladder" | "shuttle_run" | "position_specific"
- fileUrl: string
- uploadDate: timestamp
- status: "uploaded" | "processing" | "ready" | "failed"
- feedback?: string
- retries?: number

#### `reports`

- athleteId: string
- type: "scout" | "research" | "coach"
- summary: string
- strengths: string[]
- weaknesses: string[]
- metrics: Record<string, string | number>
- recommendedLevel: "D1" | "D2" | "D3" | "JUCO" | "Club"
- goalAlignment?: string
- createdAt: timestamp

#### `savedSearches`

- scoutId: string
- query: string
- parsedFilters: Record<string, string | number | string[]>
- createdAt: timestamp
- notifyEmail: boolean

## API Design

- Endpoints: profile CRUD, video upload URL, report generation, scout search
- Auth model: basic username/password login (MVP)
- Rate limits: basic per-user limits if needed

### API Contract (MVP)

- `POST /api/auth/login`: basic login
- `POST /api/scout/profile`: create/update scout profile
- `POST /api/athlete/profile`: create/update athlete profile
- `POST /api/athlete/events`: add athlete-submitted event link
- `POST /api/athlete/video/upload-url`: get signed GCS upload URL
- `POST /api/athlete/video/complete`: mark upload complete + kick off report
- `POST /api/reports/generate`: generate scouting/research/coach reports (goal
  influences coaching only, not alerts)
- `POST /api/scout/search`: NL search → parsed filters → results
- `POST /api/scout/search/save`: save search for alerts
- `GET /api/scout/athlete/:id`: athlete profile + videos + reports

### Email Alerts

- Real emails via SMTP or Gmail API
- AI-generated message includes athlete link and recommendation reason

### Data Flow

1. Athlete completes profile → `athleteProfiles` document created.
2. Athlete requests upload URL → signed GCS URL returned.
3. Upload completes → `videos` document created (status: uploaded).
4. Report generation starts → Gemini agents run → `reports` stored.
5. Scout runs NL search → parsed filters → matching athlete profiles.

## Storage

- Primary database: Firestore (document store, denormalized)
- File storage: Google Cloud Storage

### Indexing

- Required indexes for `athleteProfiles`: sport, position, state, gradYear
- Optional indexes for `reports`: recommendedLevel, metrics tags

## Integrations

- Gemini API (latest models)

## Observability

- Logging: request + error logs
- Metrics: basic latency and error counts
- Alerts: optional for hackathon

## Deployment

- Environments: dev + hackathon demo
- CI/CD: minimal, manual deploy acceptable

## Open Questions

- None for now
