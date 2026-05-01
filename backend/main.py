import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT.parent / "frontend"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import os
env_path = ROOT.parent / ".env"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                key, _, val = line.partition("=")
                os.environ.setdefault(key.strip(), val.strip().strip("'\""))

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from routes import debug, progress, quiz, tutor, grok_chat
from services.memory_service import ensure_memory_dir

ensure_memory_dir()

app = FastAPI(
    title="LearnMate AI",
    description="Adaptive learning companion API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "message": "Invalid input"},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(_: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "message": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"}
    )


@app.get("/health")
def health():
    return {"status": "ok", "service": "learnmate-ai"}


app.include_router(tutor.router)
app.include_router(quiz.router)
app.include_router(progress.router)
app.include_router(debug.router)
app.include_router(grok_chat.router)

if FRONTEND_DIR.exists():

    @app.get("/")
    def frontend_index():
        return FileResponse(FRONTEND_DIR / "index.html")

    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIR),
        name="frontend-assets",
    )

    @app.get("/{path:path}", include_in_schema=False)
    def frontend_fallback(path: str):
        candidate = FRONTEND_DIR / path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIR / "index.html")
