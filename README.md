# NTMC Transit — Turso deployment package

Start with `SETUP_GUIDE_BN.md`.

Folders:
- `backend/` — Turso/libSQL Express API
- `frontend/` — existing React UI, configured for a build-time API URL and GitHub Pages hash routing
- `migration/transit.db` — private source SQLite database for one-time migration only; `.gitignore` excludes it from Git

Do not publish `migration/transit.db`, `.env` files, Turso tokens, or JWT secrets.
