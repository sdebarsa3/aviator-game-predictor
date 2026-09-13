# Base44 Dev Environment

## Project Overview
Static web app (HTML/CSS/JS) — no build step, no backend, no external dependencies.
Served via Vite dev server for live reload.

## Running
```
docker compose -f docker-compose.base44.yml up -d
```
App is served on port 3000.

## Structure
- `index.html` — main page
- `style.css` — styles
- `script.js` — prediction logic (runs entirely client-side)
- `vite.config.js` — Vite dev server config (host binding + allowed hosts)

## Notes
- No external credentials needed.
- `logo.png` is referenced in `index.html` but may not exist in the repo; the app still works without it.
- All prediction logic is client-side JavaScript with localStorage for history.
