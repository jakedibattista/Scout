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
- Usernames are unique across the platform (used as athlete IDs).
- Profile creation for both roles
- Gender selection for athletes and scouts (male/female; scouts can select both)
- Athlete video upload and management
- Scout view can access athlete videos by default.
- AI-based video assessment and feedback for athletes
- Research agent to auto-populate competitions from public sources on profile creation
- Athlete can manually re-run research to refresh competitions
- Scout search and filtering (NL input parsed to filters)
- Scout search shows a short dynamic summary per result (based on query intent)
- Sport selection includes lacrosse (active) and hockey/football (coming soon)
- Athlete goal captured and used in coaching guidance
- Coaching guidance is direct to athlete and action-oriented
- High school team captured (required)

## Non-Functional Requirements

- Performance: fast, responsive MVP experience
- Reliability: stable enough for hackathon demos
- Security: basic protections for uploads and accounts
- Accessibility: modern baseline (keyboard, contrast)
- Compliance: none for MVP

## Data Requirements

- Firestore document storage for users, profiles, reports, and saved searches
- Store athlete gender and scout recruiting gender preferences
- Store videos in GCS with Firestore metadata (drill, URL, status, analysis)
- Store AI reports (scouting, coaching) per athlete
- Store event entries (event name, link, summary) from athlete or research agent
- Allow athletes to add event links from their profile
- Store saved scout searches (no email/push notifications in MVP)

## Reporting and Analytics

- Basic event tracking: role entry, profile completed, upload completed, report generated

## Acceptance Criteria

- Scout can create profile, run NL search, and view results + athlete detail
- Athlete can create profile, upload 3 drills, and view AI report
- Lacrosse is the only active sport option; other sports show "coming soon"

## Open Questions

- None for now
