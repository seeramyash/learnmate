# Her Haven

A one-stop monorepo for women’s health, wellness, safety, and self‑improvement. This repository aggregates multiple apps and services (web frontends, ML/Streamlit apps, utilities, and experiments) into a single codebase.

## DEMO
stego(login)- https://stego-v7mi.onrender.com
Chat bot- https://chat-bot-3xrm.onrender.com
haven bot- https://chat-bot-3xrm.onrender.com
chat- https://chat-les0.onrender.com
womendata- https://womenswellnessreports.onrender.com

## Monorepo structure

- `chat_bot/`
  - `r3f-virtual-girlfriend-frontend-main/` — Vite/React-based 3D/UX frontend for conversational features.
  - `r3f-virtual-girlfriend-backend-main/` — Backend services and integrations for the chat experience.
  - Additional tooling (e.g., `ffmpeg*`, `Rhubarb-Lip-Sync*`).
- `login/` — Frontend auth/login experience (Vite/React).
- `LAWSSSS/` — Frontend prototype/utility (Node-based).
- `stego/` — Frontend app (Vite/React) for steganography or media utilities.
- `msc/`
  - `CHAT/` — Messaging/communications module (Node-based).
  - `her-connect/` — Vite-based social/connection module.
- `wellness/` — Python app (Streamlit + ML assets) for wellness tracking and insights; also has `docs/`, `scripts/`, `src/`, and `frontend/`.
- `WomensWellnessReport/` — Python app (likely Streamlit + ML assets) for generating wellness reports; includes `frontend/` and `ml_models_saved/`.

> Note: Several subprojects include their own `README.md` files with deeper setup and usage details.

## Prerequisites

- Node.js LTS (18+ recommended) and a package manager (npm/yarn/pnpm)
- Python 3.9–3.11 (for Streamlit/ML apps)
- Git

## Quick start

Clone and explore the subprojects you want to run:

- Node/Vite apps (example):
  1. `cd login`
  2. `npm install`
  3. `npm run dev`

- Python/Streamlit apps (example):
  1. `cd wellness`
  2. Create and activate a virtualenv
     - Windows (PowerShell): `python -m venv .venv; .\.venv\Scripts\Activate.ps1`
  3. `pip install -r requirements.txt`
  4. `streamlit run src/app.py` (or check the module’s README for the entrypoint)

Adjust commands per subproject; see each folder’s `README.md` for exact scripts/entrypoints.

## Environment variables

Create a `.env` (or `.env.local`) file per app when required. Common keys include API tokens, model endpoints, and service URLs. Never commit secrets.

## Development

- Keep changes scoped to a subproject when possible.
- Cross-cutting docs belong in this root repo’s README or a new `/docs` folder.
- Prefer adding a subproject-level `README.md` for specific run/deploy steps.

## Contributing

1. Create a feature branch off `main`.
2. Make changes and add/update tests where applicable.
3. Open a pull request with a clear description and screenshots when relevant.

## License

If you intend this to be open source, add a LICENSE at the root (MIT/Apache-2.0/BSD-3-Clause). Otherwise, treat this repository as proprietary.
