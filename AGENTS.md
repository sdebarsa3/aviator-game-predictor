# Base44 Dev Environment

## Project Overview
Static vanilla HTML/CSS/JS app (Aviator Predictor). No build step, no backend, no database, no external services.

## Setup
- Served via Vite dev server (installed globally in the container) for live reload.
- `docker compose -f docker-compose.base44.yml up -d` starts the app on port 3000.
- Source is bind-mounted at `/app`; edits hot-reload automatically.

## Notes
- `index.html` references `logo.png` which is not in the repo — shows a broken image, does not affect functionality.
- No environment variables or secrets required.
