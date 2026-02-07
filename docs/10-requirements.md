# Requirements

## Users and Personas

- Scouts: need to quickly find athletes for their team and see athletes who
  might otherwise not be considered but have potential.
- Athletes: need to get scouted even if they are not at premier tournaments and
  get feedback on what to improve on.

## Core User Journeys

- Scout path: choose scout workflow → create profile → search → view athlete
  profile and videos.
- Athlete path: choose athlete workflow → create profile → upload videos →
  receive AI feedback.

## Functional Requirements

- Role selection entry on home page (scout vs athlete)
- Basic login with username/password
- Profile creation for both roles
- Athlete video upload and management
- AI-based video assessment and feedback for athletes
- Scout search and filtering (NL input parsed to filters)
- Sport selection includes lacrosse (active) and hockey/football (coming soon)
- Athlete goal captured and used in coaching guidance
- High school team captured (required)

## Non-Functional Requirements

- Performance: fast, responsive MVP experience
- Reliability: stable enough for hackathon demos
- Security: basic protections for uploads and accounts
- Accessibility: modern baseline (keyboard, contrast)
- Compliance: none for MVP

## Data Requirements

- Firestore document storage for users, profiles, reports, and saved searches
- Store videos in GCS with Firestore metadata (drill, URL, status)
- Store AI reports (scouting, research, coaching) per athlete
- Store athlete-submitted event links with notes for competitions/results
- Allow athletes to add event links from their profile
- Store saved scout searches for email alerts (SMTP/Gmail API)

## Reporting and Analytics

- Basic event tracking: role entry, profile completed, upload completed, report generated

## Acceptance Criteria

- Scout can create profile, run NL search, and view results + athlete detail
- Athlete can create profile, upload 3 drills, and view AI report
- Lacrosse is the only active sport option; other sports show "coming soon"

## Open Questions

- None for now
