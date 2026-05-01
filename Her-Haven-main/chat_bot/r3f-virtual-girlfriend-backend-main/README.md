

![Video Thumbnail](https://img.youtube.com/vi/EzzcEL_1o9o/maxresdefault.jpg)

[Video tutorial](https://youtu.be/EzzcEL_1o9o)

The frontend is [here](https://github.com/wass08/r3f-virtual-girlfriend-frontend).

## Setup

1) Ollama (local LLM)
- Install and start Ollama: https://ollama.ai
- Ensure http://127.0.0.1:11434 is reachable
- A small model like `llama3.2:3b` works well locally
- Configure OLLAMA_URL and OLLAMA_MODEL in `.env` if needed

2) Piper TTS (free voice)
- Install Piper for Windows: https://github.com/rhasspy/piper/releases
- Download a voice model (e.g., en_US-amy-medium.onnx) from https://github.com/rhasspy/piper/releases/tag/v0.0.2-voices or other sources
- Place the model file under `voices/` and set PIPER_MODEL in `.env`
- If `piper.exe` is not on PATH, set PIPER_EXE in `.env`

3) Rhubarb Lip Sync
- Download Rhubarb binary for your OS: https://github.com/DanielSWolf/rhubarb-lip-sync/releases
- Put the executable under `bin` as `bin/rhubarb.exe` (Windows) or `bin/rhubarb` (Unix)

4) Environment variables
- Copy `.env.example` to `.env` and adjust values as needed

5) Install dependencies
```
yarn
```

6) Run dev servers (in two terminals)
- Backend:
```
yarn dev
```
- Frontend:
```
yarn dev
```

Note: Backend now uses Ollama + Piper + Rhubarb (no OpenAI/ElevenLabs).
