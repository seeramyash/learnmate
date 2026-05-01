# Her Haven - Setup Complete! ✅

## What's Been Configured

The Her Haven project now has a unified navigation system across all apps. The chatbot runs independently and opens in a new tab when clicked from the navbar.

## Architecture

```
Her Haven Project
├── Port 4000 - Main Server (Stego + Law Bot)
│   ├── Steganography tool
│   └── Law Bot (served statically)
│
├── Port 5176 - Chatbot Frontend (React + Three.js)
│   └── 3D virtual girlfriend interface
│
└── Port 3000 - Chatbot Backend (Express)
    ├── Ollama LLM integration
    ├── TTS audio generation
    └── Lip-sync animation
```

## Quick Start

### One Command to Rule Them All
```powershell
cd C:\Users\seera\Videos\her-haven\stego
.\start-all.ps1
```

This starts:
1. **Chatbot Backend** (port 3000) - using `yarn dev`
2. **Chatbot Frontend** (port 5176) - using `yarn dev`
3. **Main Server** (port 4000) - using `npm start`

Wait ~10 seconds for everything to initialize.

## Access Your Apps

| App | URL | Description |
|-----|-----|-------------|
| **Stego** | http://localhost:4000/ | Steganography tool (main page) |
| **Law Bot** | http://localhost:4000/law/ | AI legal assistant |
| **Chatbot** | http://localhost:5176/ | 3D virtual girlfriend (opens in new tab) |
| **Therapy Bot** | http://localhost:4000/therapy.html | Therapy assistant |
| **Mensuration** | http://localhost:4000/mensuration.html | Period tracker |

## Navigation

All pages have a shared navigation bar with icons:
- 🖼️ **Steganography** - Main page
- ⚖️ **Law Bot** - Legal assistant
- 🤖 **Chatbot** - Virtual girlfriend (opens new tab)
- 💬 **Therapy Bot** - Therapy assistant
- 💧 **Mensuration** - Period tracker

## Key Changes Made

### 1. Navbar (`navbar.html`)
- Added chatbot icon linking to `http://localhost:5176/`
- Opens in new tab (`target="_blank"`)

### 2. Vite Config (`vite.config.js`)
- Set chatbot frontend port to **5176**
- Removed base path (chatbot runs independently)

### 3. Startup Script (`start-all.ps1`)
- Uses `yarn dev` for both chatbot backend and frontend
- Starts 3 servers in separate PowerShell windows
- Proper sequencing with delays

### 4. Server.js
- Removed chatbot proxy/static serving
- Simplified to only serve Stego + Law Bot

## Requirements

### Must Have Installed
- **Node.js** & **npm** (for main server)
- **Yarn** (for chatbot - both frontend & backend)
- **Ollama** (for chatbot AI)
  - Install from: https://ollama.ai
  - Required model: `llama3.2:3b`
  - Check with: `ollama list`

### Environment Variables

**stego/.env:**
```env
PORT=4000
STABILITY_API_KEY=your_api_key_here
```

**chat_bot/r3f-virtual-girlfriend-backend-main/.env:**
```env
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
TTS_ENGINE=sapi
```

## Development Workflow

### Working on Chatbot Frontend
```powershell
cd C:\Users\seera\Videos\her-haven\chat_bot\r3f-virtual-girlfriend-frontend-main
yarn dev
```
Changes auto-reload with HMR at http://localhost:5176/

### Working on Chatbot Backend
```powershell
cd C:\Users\seera\Videos\her-haven\chat_bot\r3f-virtual-girlfriend-backend-main
yarn dev
```
Uses nodemon for auto-restart on changes.

### Working on Main Server
```powershell
cd C:\Users\seera\Videos\her-haven\stego
npm start
```

## Troubleshooting

### Chatbot not loading
1. Check all 3 PowerShell windows are open and running
2. Verify Ollama is installed: `ollama list`
3. Wait 10-15 seconds after starting
4. Check http://localhost:3000/ (backend should respond)

### Port already in use
Close the app using that port:
```powershell
# Find process using port 5176
Get-NetTCPConnection -LocalPort 5176 | Select-Object OwningProcess
# Kill it
Stop-Process -Id <process_id>
```

### Yarn not found
Install yarn globally:
```powershell
npm install -g yarn
```

### Chatbot backend errors
- Make sure Ollama is running
- Download required model: `ollama pull llama3.2:3b`
- Check `.env` file in backend folder

## File Locations

```
C:\Users\seera\Videos\her-haven\
├── stego\
│   ├── server.js (main server)
│   ├── start-all.ps1 (startup script)
│   └── public\
│       ├── components\navbar.html (shared navbar)
│       └── nav.js (navbar loader)
│
├── LAWSSSS\ (law bot static files)
│
├── chat_bot\
│   ├── r3f-virtual-girlfriend-backend-main\ (backend - port 3000)
│   └── r3f-virtual-girlfriend-frontend-main\ (frontend - port 5176)
│
└── login\ (separate login system)
```

## Success! 🎉

Your Her Haven project is now fully integrated with:
- ✅ Unified navigation across all apps
- ✅ Independent chatbot with its own port
- ✅ One-command startup for everything
- ✅ Hot module replacement for development
- ✅ Clean architecture with proper separation

**Navigate seamlessly between all features using the navbar!**
