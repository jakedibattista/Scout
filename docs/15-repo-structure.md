# Repo Structure

This repo should stay clean and public-ready. Keep the root minimal and group
files by their function.

## Top-Level Layout

```
Scout/
├── README.md
├── .gitignore
├── docs/
├── web/
└── firebase/
```

## Root Allowlist

Only these items should live at the repo root:

- `README.md`
- `LICENSE` (if/when added)
- `.gitignore`
- `.github/` (workflows, templates)
- `docs/`
- `web/`
- `firebase/`

## Placement Rules

- Group files by function or ownership (infra, app, docs), not by file type.
- New documentation goes in `docs/`.
- App code stays in `web/`.
- Firebase config and rules stay in `firebase/`.
- Avoid adding ad-hoc files at root; if needed, create a folder.

## Firebase Notes

Firebase config lives in `firebase/`. Run Firebase CLI commands from that
directory or pass `--config firebase/firebase.json` when running from root.
