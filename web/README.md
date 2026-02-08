# Scout Web App

Next.js app for the Scout MVP (athlete + scout workflows).

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Environment variables

Create `web/.env.local`:

- `NEXT_PUBLIC_FIREBASE_*` Firebase client config
- `FIREBASE_STORAGE_BUCKET` GCS bucket for uploads
- `FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS`
- `GOOGLE_API_KEY` or `GEMINI_API_KEY` for Gemini

## Structure

- `app/` routes + UI
- `app/api/` backend API routes
- `lib/` Firebase, Gemini agents, report builders
