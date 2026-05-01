# Her Haven - Quick Start Guide

## 🚀 Starting Everything

### One-Command Start (Recommended)
```powershell
cd C:\Users\seera\Videos\her-haven\stego
.\start-all.ps1
```

This will open 3 PowerShell windows:
1. **Chatbot Backend** - AI engine (port 3000)
2. **Chatbot Frontend** - 3D interface (port 5176) 
3. **Main Server** - Stego & Law Bot (port 4000)

## 🌐 Access URLs

After all servers start (wait ~10 seconds):

- **Main App**: http://localhost:4000/
- **Chatbot**: http://localhost:5176/ (opens in new tab from navbar)
- **Law Bot**: http://localhost:4000/law/
- **Therapy Bot**: http://localhost:4000/therapy.html
- **Mensuration**: http://localhost:4000/mensuration.html

## 📋 Requirements

### Chatbot Backend
- **Ollama** must be installed and running
- Default model: `llama3.2:3b`
- Check with: `ollama list`

### Environment Variables
Create `.env` files if needed:

**stego/.env:**
```env
PORT=4000
STABILITY_API_KEY=your_key_here
```

**chat_bot/r3f-virtual-girlfriend-backend-main/.env:**
```env
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
TTS_ENGINE=sapi
```

## 🛑 Stopping Servers

Close each PowerShell window or press `Ctrl+C` in each terminal.

## ❓ Troubleshooting

### Chatbot not loading
- Check that all 3 servers are running
- Ensure Ollama is installed and models are downloaded
- Wait 10-15 seconds for everything to initialize

### Port conflicts
- Make sure ports 3000, 4000, and 5176 are available
- Close other apps using these ports

### Chatbot opens in new tab
- This is intentional - chatbot runs independently on port 5176
- Make sure both chatbot backend (3000) and frontend (5176) are running

## 📂 Project Structure

```
her-haven/
├── stego/                  # Main server (port 4000)
├── LAWSSSS/                # Law bot static files
├── chat_bot/
│   ├── r3f-virtual-girlfriend-backend-main/    # Backend (port 3000)
│   └── r3f-virtual-girlfriend-frontend-main/   # Frontend (port 5173)
└── login/                  # Login system (separate)
```

## 🎯 Development Notes

- Chatbot runs independently on port 5176
- Clicking the chatbot icon opens it in a new tab
- All apps share the same navigation bar
- Use `yarn dev` for chatbot development (both frontend and backend)
