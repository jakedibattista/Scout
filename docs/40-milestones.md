# Milestones

## Phase 0 - Planning

- Complete overview and requirements docs
- Validate scope and constraints

## Phase 1 - UX and Frontend Skeleton

- Define page map and user flows
- Build static UI prototype
- UI flows implemented: home, scout search/about, athlete profile/upload/report

## Phase 2 - Backend Foundations

- Define data model and API contracts
- Stand up core services
- API stubs wired for profiles, search, reports, uploads

## Phase 3 - Integration

- Connect frontend to backend
- Harden error states and auth
- Pending: GCS uploads, Gemini reports, SMTP/Gmail alerts, real scout search

## Phase 4 - Release Readiness

- Performance and security review
- Monitoring and alerting configured

## Test Plan

- Unit: none for hackathon
- Integration: none for hackathon
- E2E: none for hackathon

## Progress Today

- Implemented basic login routing and account storage
- Persisted scout and athlete profiles in Firestore
- Populated About Me pages from Firestore (scout + athlete)
- Added athlete event link persistence
- Fixed profile form Enter-key submits

## Next Steps

- Finish video upload flow (GCS signed URLs + metadata save)
- Implement GCS signed upload URLs and real video uploads
- Connect Gemini for scouting/research/coaching report generation
- Send real email alerts via SMTP/Gmail API
- Replace static scout search/results with real data

