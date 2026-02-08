# Spec Checklist

Fill in the blanks below so we can build with minimal ambiguity. Keep answers
short and specific. If you are unsure, write "TBD" and we will revisit.

## 1) Stack and Deployment

- Frontend framework: Next.js (App Router) [confirm]
- Backend runtime: Node.js [confirm]
- Hosting: Cloud Run [confirm]
- File storage: Google Cloud Storage [confirm]
- AI provider: Gemini (latest) [confirm]

## 2) Workflows (Step-by-step)

### Scout Workflow

1. Entry path: For Scouts (home role pick)
2. Profile fields required: Username, Password, Name, Email, Sport, School/Program
3. Search/filter inputs: Natural language search ("fastest defender in Maryland",
   "DH with 3.0 GPA") parsed into filters
4. Result actions: view profile, contact
5. Report contents for scout view: table with athlete name and scouting report
   summary, video preview link

### Athlete Workflow

1. Entry path: For Athletes (home role pick)
2. Profile fields required: Username, Password, Name, Email, State, Sport,
   Position (sport-based dropdown), Height, Weight, Grad Year, High School Team,
   Goal; Socials optional
3. Video upload requirements: Sport/position-specific "combine" with 3 drills
4. AI feedback sections: scouting report + athlete research summary + coaching
   guidance
5. Share/export actions: not required for MVP

## 3) Pages and Required Content

- Home: animated, modern landing with 2 role buttons and dynamic motion
- Login: basic username/email + password
- Scout onboarding: skip separate onboarding, go straight to profile
- Scout profile: 1-minute form with required fields
- Scout search: NL search + auto-filter by sport and program tier/region
- Scout results: results table + saved searches (no email alerts in MVP)
- Athlete detail (scout view): athlete profile + videos + AI report with per-drill
  grade/date/notes
- Athlete onboarding: skip separate onboarding, go straight to profile
- Athlete profile: top-down layout, most important info first
- Athlete video upload: sport/position combine title, 3 drills with how-to
  buttons + date completed + skip for now
- Athlete scouting evaluation: living profile with scouting report + research + coaching

## 4) Data Model Fields

### ScoutProfile

- Required: name, email, sport, school/program, program level (D1/D2/D3/etc)
- Optional: recruiting states (dropdown + list), graduation years recruiting, positions recruiting
  (dropdown + list)

### AthleteProfile

- Required: name, email, state, sport, position, height, weight, grad year,
  high school team, goal
- Optional: socials, willing-to-relocate states, GPA, club team, current offers,
  highlight tape URL

### Video

- Required: drill type, file URL, upload date, processed status
- Optional: AI feedback/notes, reattempt count

### Report

- Required: strengths, weaknesses, key metrics, summary
- Optional: coach quotes, scholarship likelihood (if desired)

## 5) Gemini Agent Design

### Agent 1: Scouting Report

- Inputs: videos, athlete profile, sport/position rubric
- Output sections: summary, athleticism, technique, decision-making, top traits,
  concerns, next steps

### Agent 2: Athlete Research

- Inputs: web search results + athlete inputs (events, teams, stats)
- Output sections: dated event summaries with event link and results (when
  available), sources list
- Tone: chronological, methodical

### Agent 3: Coaching Guidance

- Inputs: scouting report + demographics + goal + research
- Output sections: strengths, weaknesses, recommended drills/programs
- Tone: College coach talking to a potential player
- Goal alignment phrasing is determined by prompt

## 6) UI / Design System

- Brand vibe (3-5 adjectives): modern, young, dynamic
- Primary color: Black
- Secondary color: Yellow
- Accent color: Blue
- Typography (font families): Space Grotesk (headings), Inter (body)
- Buttons (shape, radius): pill/rounded-full, bold uppercase
- Card style (shadow, borders): subtle border, soft shadow, slight blur
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64

## 7) MVP Scope

- Must-have: athlete/scout intake, 3-drill combine, player profile, NL scout
  search, saved searches
- Nice-to-have: coaching and progress tracker for athletes over time
- Explicitly excluded: any sport besides lacrosse

