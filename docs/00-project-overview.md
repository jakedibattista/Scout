# Project Overview

## Vision

Create a two-sided website that guides college scouts and youth athletes into
their own workflows. Athletes build profiles, upload videos, and receive AI
feedback modeled after how scouts evaluate talent. Scouts build profiles,
filter by sport and intent (e.g., D1-ready vs. hidden potential), and discover
athletes they might otherwise miss.

## Goals

- Use latest Gemini models to generate scouting reports, analyze video, and
  research athletes efficiently.
- Make scouting and recruiting easy and fair for athletes; reduce scout effort
  to find and evaluate players.
- Deliver a beautiful, modern 2026-style MVP with 1-2 polished workflows.

## Non-Goals

- Scalable or complex database design; optimize for speed and simplicity.
- Custom or fine-tuned AI models; rely on strong prompting and agent roles.
- Sophisticated matching; simple AI-labeled categories are sufficient.

## Success Metrics

- Core workflows are functional end-to-end (athlete upload + AI feedback, scout
  search + discovery).
- UI feels modern, polished, and app-like.
- Gemini API usage demonstrates versatile, high-quality outputs across roles.

## Scope

- In scope: scout workflow, athlete workflow, profiles, video upload, AI
  analysis/feedback, scout search/filters, lacrosse-first MVP with sport picker
- Out of scope: large-scale data pipelines, advanced matching, custom model
  training, additional sports beyond lacrosse (coming soon only)

## Constraints

- Technical: Gemini API, Google Cloud supported products only
- Time: 1 week
- Budget: hackathon MVP

## Assumptions

- MVP is lacrosse-first with sport picker (hockey/football marked "coming soon")
- Basic username/password auth is sufficient for MVP
- Gemini usage is organized into task-specific agents (drill analysis, research,
  coaching/scouting, scout query parsing).
- Coaching guidance is second-person and action-oriented (athlete-facing).
- Scout reports are conservative and avoid inflated praise.
- Athlete research uses the Gemini Google Search tool with manual re-run.

## Stakeholders

- Product owner: Jake Dibattista
- Engineering: Buddy Tech
- Design: Buddy Tech

## Risks

- Video processing latency or failures impact demo
- Over-scope in a 1-week timeline

## Open Questions

- None for now

## Glossary

- NL search: natural language search input
- Combine: standardized drill set for video evaluation
