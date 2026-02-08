# AI Agents

This doc defines the task-specific Gemini agents we use for the MVP. Each agent
shares the same Gemini client but has its own prompt, schema, and output shape.

## Agent 1: Combine Drill Review

- Purpose: analyze wall ball, 20-yard dash, and 5-10-5 shuttle videos
- Input: drill type + video file (GCS → Gemini file upload)
- Output: `analysisNotes`, `analysisMetrics`, `analysisStatus` on `videos` docs
- Wall ball metrics: `total_reps_60s`, `max_consecutive_reps`
- Shuttle timing: start on first move from middle cone, end after crossing middle cone on return

## Agent 2: Athlete Research

- Purpose: fill "Competitions and Results" with external events
- Input: athlete profile + Gemini Google Search tool
- Output: event entries stored in `events` (event name, link, summary)

## Agent 3: Scouting + Coaching Guidance

- Purpose: generate scouting report and coaching guidance for athletes
- Input: athlete profile + drill analysis + events
- Output: `reports` documents (types: `scout`, `coach`)

## Research Triggers

- After a new athlete profile is created
- Manual "Run research" action from athlete report

## Coaching Update Triggers

- After a drill analysis completes
- After an event entry is added or edited
- After athlete profile is saved (manual refresh)

## Scouting Report Triggers

- After a drill analysis completes
- After an event entry is added or edited
- After athlete profile is saved (manual refresh)

## Agent 4: Scout Query Parser

- Purpose: parse natural-language scout searches into structured filters
- Input: NL search string
- Output: `parsedFilters` for searching Firestore

## Shared Rules

- One Gemini client; separate prompt blocks per agent
- Outputs stored in Firestore (not Storage metadata)
- Agents update `analysisStatus`/`analysisUpdatedAt` for visibility
- Research events are deduped strictly by event name or URL (case-insensitive)
- Research empty states are visible to the athlete
- Scout report should be conservative; avoid inflated praise
- Coaching guidance is second-person and action-oriented, referencing the athlete goal
