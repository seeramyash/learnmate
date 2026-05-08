# LearnMate AI

LearnMate AI is an adaptive learning companion that explains topics, generates quizzes, tracks student progress, and adjusts future explanations from each learner's performance history.

The project contains a FastAPI backend, a static HTML/CSS/JavaScript frontend, JSON-based learner memory, optional Firecrawl resource lookup, Gemini/Ollama LLM support, and an optional 3D assistant integration.

## Live Demo
[Open App](https://learnmate-fq4u.onrender.com/)

## Demo Video
[Watch Demo](https://drive.google.com/file/d/1zj4rMaL2JIe6idseJuolNa7TltAVUkZy/view?usp=sharing)

## Features

- Adaptive topic explanations through `POST /learn`
- Multiple-choice quiz generation through `POST /quiz`
- Quiz grading and feedback through `POST /quiz/submit`
- Persistent per-user progress in `backend/data/memory.json`
- Learning adaptation based on accuracy, weak areas, streaks, and repeated mistakes
- Progress dashboard data through `GET /progress`
- Optional learning resource suggestions through `POST /resources`
- Debug/demo endpoints for viewing and resetting learner memory
- Optional 3D assistant iframe powered by the bundled Her-Haven/React Three Fiber app

## Tech Stack

- Backend: Python, FastAPI, Pydantic, Uvicorn
- AI providers: Google Gemini API or local Ollama fallback
- Optional resource search: Firecrawl API
- Frontend: HTML, CSS, vanilla JavaScript
- Optional 3D assistant: React, Vite, Three.js, Express
- Storage: Local JSON file

## Project Structure

```text
learnmate/
|-- backend/
|   |-- main.py
|   |-- models/
|   |-- routes/
|   |-- services/
|   |-- utils/
|   `-- data/
|-- frontend/
|   |-- index.html
|   |-- app.js
|   `-- style.css
|-- Her-Haven-main/
|   `-- chat_bot/
|       |-- r3f-virtual-girlfriend-backend-main/
|       `-- r3f-virtual-girlfriend-frontend-main/
|-- DEMO.md
|-- VIVA_REPORT.md
|-- requirements.txt
|-- start_learnmate.bat
|-- start_learnmate.ps1
`-- README.md
```

## Requirements

- Python 3.10 or newer
- Node.js 18 or newer, only needed for the optional 3D assistant
- At least one LLM option:
  - `GEMINI_API_KEY` or `GOOGLE_API_KEY`
  - or a local Ollama server running at `http://localhost:11434`

## Environment Variables

Create a `.env` file in the project root. You can copy `.env.example` and fill in your own values.

```env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_API_KEY=
GEMINI_MODEL=models/gemini-2.0-flash

OLLAMA_API_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3.1:8b
OLLAMA_TIMEOUT=120

FIRECRAWL_API_KEY=
FIRECRAWL_API_URL=https://api.firecrawl.dev/v1/search
```

## Backend Setup

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "learnmate-ai"
}
```

## Deploy on Render

This repository includes `render.yaml` for a single Render Python Web Service.
The FastAPI backend serves both the API and the static frontend, so the deployed
site works from one Render URL.

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint** and select this repository.
3. Add the required secret environment variable:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Optional:

```env
FIRECRAWL_API_KEY=your_firecrawl_api_key
GOOGLE_API_KEY=your_google_api_key_if_you_use_it_instead
```

The Render service uses:

```text
Build Command: pip install -r requirements.txt
Start Command: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
Health Check Path: /health
```

After deployment, open the Render URL. The frontend will call the API from the
same origin automatically. If AI quiz generation fails, confirm that
`GEMINI_API_KEY` is set in the Render service environment.

## Frontend Setup

In a second terminal:

```bash
cd frontend
python -m http.server 5500 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:5500
```

The frontend automatically targets `http://127.0.0.1:8000` when served from localhost. To use another backend URL, set `window.LEARNMATE_API_BASE` or save `LEARNMATE_API_BASE` in browser local storage.

## Optional 3D Assistant

The main frontend can load the 3D assistant from:

```text
http://127.0.0.1:5173
```

Install and run the assistant backend:

```bash
cd Her-Haven-main/chat_bot/r3f-virtual-girlfriend-backend-main
npm install
npm start
```

Install and run the assistant frontend:

```bash
cd Her-Haven-main/chat_bot/r3f-virtual-girlfriend-frontend-main
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Large generated folders such as `node_modules`, downloaded speech tools, FFmpeg binaries, generated audio files, caches, and virtual environments are intentionally ignored by Git.

## One-Command Windows Start

After installing Python dependencies and optional Node dependencies, you can start the services with:

```powershell
.\start_learnmate.ps1
```

or:

```bat
start_learnmate.bat
```

This starts:

- Backend API on `http://127.0.0.1:8000`
- Static frontend on `http://127.0.0.1:5500`
- Optional assistant backend from the Her-Haven folder
- Optional assistant frontend on `http://127.0.0.1:5173`

## Main API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | API health check |
| `POST` | `/learn` | Generate an adaptive explanation |
| `POST` | `/resources` | Return optional resource suggestions |
| `POST` | `/quiz` | Generate MCQ quiz questions |
| `POST` | `/quiz/submit` | Grade quiz answers and update memory |
| `GET` | `/progress?user_id=student_1` | Fetch progress metrics |
| `POST` | `/progress` | Fetch progress metrics from JSON body |
| `GET` | `/debug/memory?user_id=student_1` | View raw learner memory |
| `POST` | `/debug/reset` | Reset a learner's stored progress |
| `POST` | `/grok-chat` | 3D assistant chat-compatible endpoint |

Example learn request:

```bash
curl -X POST http://127.0.0.1:8000/learn ^
  -H "Content-Type: application/json" ^
  -d "{\"user_id\":\"student_1\",\"topic\":\"Recursion\"}"
```

Example quiz request:

```bash
curl -X POST http://127.0.0.1:8000/quiz ^
  -H "Content-Type: application/json" ^
  -d "{\"user_id\":\"student_1\",\"topic\":\"Recursion\",\"num_questions\":5}"
```

## Adaptive Learning Logic

LearnMate stores each learner's history and uses it to tune future responses:

- Low quiz accuracy produces simpler explanations.
- Strong quiz accuracy produces more advanced explanations.
- Repeated mistakes on a topic force a simpler explanation level.
- Quiz difficulty is selected from memory when the request does not provide one.
- Weak areas and topic history appear in the progress dashboard.

## Demo

See `DEMO.md` for a short walkthrough that covers learning, quiz generation, quiz feedback, progress tracking, raw memory, and reset behavior.

## Notes

- `.env` files are ignored so API keys are not committed.
- `backend/data/memory.json` is runtime learner state and is ignored.
- If no Gemini key is set, the backend attempts to use Ollama locally.
- If Firecrawl is not configured, LearnMate still works and falls back to generated/search-link resource suggestions.
