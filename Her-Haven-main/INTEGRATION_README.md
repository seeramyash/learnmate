# Her Haven - Integrated Navigation Setup

## Overview
The Her Haven project now has integrated navigation across all three main applications:
- **Steganography Tool** (main page)
- **Law Bot** (AI legal assistant)
- **Chat Bot** (3D virtual girlfriend chatbot)
- **Therapy Bot** (therapy assistant)
- **Mensuration Tracker**

## How It Works

### Navigation Bar
All apps share a common navigation bar that appears at the top of each page. The navbar includes icons for:
- 🖼️ Steganography (/)
- ⚖️ Law Bot (/law/)
- 🤖 Chat Bot (/chatbot/)
- 💬 Therapy Bot (/therapy.html)
- 💧 Mensuration Tracker (/mensuration.html)

### Architecture
1. **Stego Server** (Port 4000) - Main server that:
   - Serves the steganography tool
   - Serves Law Bot as static files under `/law/`
   - Proxies Chat Bot requests to the Vite dev server under `/chatbot/`
   - Handles image generation API

2. **Chat Bot Frontend** (Port 5173) - Vite development server for the React 3D chatbot

3. **Chat Bot Backend** (Port 3000) - Express server that:
   - Handles AI chat requests using Ollama (local LLM)
   - Generates TTS audio using SAPI/Azure/Piper
   - Generates lip-sync animation data
   - Maintains chat session history

### Starting the Application

#### Option 1: Using the PowerShell Script (Recommended)
```powershell
cd C:\Users\seera\Videos\her-haven\stego
.\start-all.ps1
```

This will open three terminal windows:
1. Chatbot backend server (port 3000)
2. Chatbot frontend dev server (port 5173)
3. Stego server with proxy (port 4000)

#### Option 2: Manual Start
Open three separate terminals:

**Terminal 1 - Chatbot Backend:**
```powershell
cd C:\Users\seera\Videos\her-haven\chat_bot\r3f-virtual-girlfriend-backend-main
npm start
```

**Terminal 2 - Chatbot Frontend:**
```powershell
cd C:\Users\seera\Videos\her-haven\chat_bot\r3f-virtual-girlfriend-frontend-main
npm run dev
```

**Terminal 3 - Main Server:**
```powershell
cd C:\Users\seera\Videos\her-haven\stego
npm start
```

### Accessing the Application
Once both servers are running:
- Main App: http://localhost:4000/
- Law Bot: http://localhost:4000/law/
- Chat Bot: http://localhost:4000/chatbot/
- Therapy Bot: http://localhost:4000/therapy.html
- Mensuration Tracker: http://localhost:4000/mensuration.html

## File Structure
```
her-haven/
├── stego/                      # Main steganography app + server
│   ├── server.js              # Express server with proxying
│   ├── start-all.ps1          # Startup script
│   └── public/
│       ├── components/
│       │   └── navbar.html    # Shared navigation bar
│       └── nav.js             # Navigation loader & highlighter
├── LAWSSSS/                    # Law Bot static app
├── chat_bot/
│   └── r3f-virtual-girlfriend-frontend-main/  # 3D Chatbot
└── login/                      # Login system (separate)
```

## Technical Details

### Navbar Implementation
- `navbar.html` - Contains the navigation HTML with Font Awesome icons
- `nav.js` - Dynamically loads the navbar and highlights the active page
- Active route detection handles `/law/`, `/chatbot/`, and other routes

### Proxy Configuration
The stego server uses `http-proxy-middleware` to proxy chatbot requests:
- Requests to `/chatbot/*` are forwarded to `http://localhost:5173`
- WebSocket support enabled for Vite HMR (Hot Module Replacement)
- Error handling provides clear messages if chatbot server is down

## Dependencies
- `express` - Web server
- `http-proxy-middleware` - Proxy for chatbot
- `axios` - API requests
- `dotenv` - Environment variables
- Font Awesome 6.4.0 - Icons (loaded via CDN)

## Environment Variables
Create a `.env` file in the `stego` folder:
```env
PORT=4000
STABILITY_API_KEY=your_api_key_here
```

## Notes
- The chatbot MUST be running on port 5173 for the proxy to work
- If you change the chatbot port, update it in `server.js` line 21
- The navbar automatically highlights the active page based on the current URL
