# Frontend Plan

## Information Architecture

- Primary sections: Home, Scout flow, Athlete flow
- Navigation model: single-landing with role-based entry, then short linear flow

## Pages and Flows

- Home: two clear paths (Scout, Athlete)
- Scout flow: profile → search → results → athlete detail
- Athlete flow: profile → video upload → report (AI + About Me tabs)

## Page-by-Page UI Specs

### Home

- Purpose: role selection and value prop
- Primary actions: choose Scout or Athlete, log in
- Key elements: hero, two role CTAs, login button
- UI states: default; hover/focus for role CTAs

### Login

- Purpose: basic auth entry
- Primary actions: submit username/email + password
- Key elements: login form, submit button

### Scout Profile

- Purpose: complete scout profile and preferences
- Primary actions: save profile
- Key fields: username, password, contact info, sport, school/program, program
  level, recruiting states (dropdown + list), positions recruiting (dropdown +
  list)
- UI states: saved confirmation; error on save

### Scout About Me

- Purpose: show scouting demographics used for search refinement
- Primary actions: edit profile inline, log out, switch back to Find Athletes
- Key elements: required profile fields + optional recruiting preferences

### Scout Search

- Purpose: set filters and run search
- Primary actions: apply filters, view About Me tab, log out
- Key elements: search bar, email alert button after search, actively recruiting list
- UI states: loading results; no matches; error retrieving results

### Scout Results

- Purpose: browse athlete list
- Primary actions: view profile, contact
- Key elements: athlete rows with scouting report summary and actions
- UI states: pagination/loading more; empty; error

### Athlete Detail (Scout View)

- Purpose: evaluate athlete
- Primary actions: view video, return to search
- Key elements: full-length scouting report, videos section with per-drill
  grade/date/notes, view video buttons
- UI states: video loading; report generating; report error

### Athlete Profile

- Purpose: complete athlete profile
- Primary actions: save profile, proceed to upload
- Key fields: username, password, high school team (required), goal (required),
  sport-based position dropdown, bio, stats, contact, coach info (optional),
  socials (Instagram, X, TikTok, YouTube handles), club team (optional), current
  offers list (optional), highlight tape URL (optional)
- UI states: saved confirmation; error on save

### Athlete Video Upload

- Purpose: upload video for analysis
- Primary actions: upload, skip for now
- Key elements: drill cards for wall ball, 20-yard dash, 5-10-5 shuttle, upload
  input
- UI states: uploading, upload success, upload failure, unsupported file

### Athlete Scouting Evaluation

- Purpose: show AI scouting, coaching, and research; separate from demographics
- Primary actions: switch Scouting Evaluation/About Me tabs, view redo drills
- Key elements: full-length scouting report, coaching guidance, competitions and
  results with date, event link, and results; add link input/button; combine
  drills list with upload/redo and AI feedback per drill; competitions
  auto-generated from athlete profile + sources
- UI states: generating, generated, generation error, auto-update on new inputs

### Athlete About Me (Tab)

- Purpose: show demographic profile separate from AI content
- Primary actions: edit profile inline, log out
- Key elements: about me section with name, sport, position, grad year, location,
  height/weight, high school team, goal, socials, club team, current offers,
  highlight tape

## Component Inventory

- Role CTAs, profile form, upload dropzone, video player, AI feedback panel,
  scout filter panel, athlete result cards, tab switcher, combine drill cards,
  about me card

## State Management

- Local state: forms, upload progress, UI state
- Shared state: auth/session, profile data, search filters

## Forms and Validation

- Lightweight validation with clear inline errors

## Error and Empty States

- Friendly empty states for no results and missing uploads

## Accessibility

- Keyboard-friendly, clear focus states, sufficient contrast

## Performance

- Optimize for fast initial load and quick feedback updates

## Analytics

- Track role entry, profile completion, video upload, search usage

## Open Questions

- UI framework choice: assume Tailwind-only unless specified otherwise
