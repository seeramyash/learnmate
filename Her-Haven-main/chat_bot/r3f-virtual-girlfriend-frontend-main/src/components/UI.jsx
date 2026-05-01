import { useRef, useState, useEffect } from "react";
import { useChat } from "../hooks/useChat";

export const UI = ({ hidden, ...props }) => {
  const input = useRef();
  const { chat, loading, cameraZoomed, setCameraZoomed, message, stopChat } = useChat();
  const [imagesData, setImagesData] = useState([]);
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [model, setModel] = useState('llama'); // 'llama' for text, 'llava' for vision
  const recRef = useRef(null);

  const sendMessage = () => {
    const text = input.current.value;
    const chosen = imagesData.length > 0 ? 'llava' : model; // auto vision if images present
    if (!loading && !message && (text || imagesData.length)) {
      window.parent.postMessage({ type: 'learnmate_action', action: 'add_chat_history', role: 'user', content: text }, '*');
      chat(text, imagesData, undefined, chosen);
      input.current.value = "";
      setImagesData([]);
    }
  };

  const startMic = async () => {
    // Use browser SpeechRecognition (no server) to dictate into the input
    if (recording) {
      setRecording(false);
      recRef.current?.stop?.();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported in this browser.'); return; }
    try {
      const r = new SR();
      r.lang = 'en-US'; r.interimResults = false; r.continuous = false;
      r.onresult = (e) => {
        const t = Array.from(e.results).map(x => x[0].transcript).join(' ');
        input.current.value = t; input.current.focus();
      };
      r.onend = () => { setRecording(false); };
      recRef.current = r;
      setRecording(true);
      r.start();
    } catch (e) {
      console.error('mic error', e);
      setRecording(false);
    }
  };

  if (hidden) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col pointer-events-none">
        <div className="self-start backdrop-blur-md bg-white bg-opacity-50 p-4 rounded-lg">
          <h1 className="font-black text-xl"></h1>
          <p></p>
        </div>
        <div className="w-full flex flex-col items-end justify-center gap-4">
          <button
            onClick={() => setCameraZoomed(!cameraZoomed)}
            className="pointer-events-auto bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-md"
          >
            {cameraZoomed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                />
              </svg>
            )}
          </button>
          <button
            onClick={() => {
              const body = document.querySelector("body");
              if (body.classList.contains("greenScreen")) {
                body.classList.remove("greenScreen");
              } else {
                body.classList.add("greenScreen");
              }
            }}
            className="pointer-events-auto bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </button>
        </div>
        {/* Subtitles just above input */}
        {message?.text && (
          <div className="pointer-events-none mx-auto mb-2 max-w-screen-md w-full text-center">
            <div className="inline-block bg-black bg-opacity-40 text-white px-4 py-2 rounded-md backdrop-blur-sm">
              {message.text}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 pointer-events-auto max-w-screen-md w-full mx-auto">
          <input
            className="w-full placeholder:text-gray-800 placeholder:italic p-4 rounded-md bg-opacity-50 bg-white backdrop-blur-md"
            placeholder="Type a message..."
            ref={input}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />
          {/* Web search button (fetches a summary and inserts into input) */}
          <button
            type="button"
            onClick={async () => {
              const q = (input.current?.value || '').trim();
              if (!q) return;
              const url = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/websearch';
              try {
                const res = await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ q })
                }).then(r => r.json());
                const summary = [res.heading, res.abstract, ...(res.related||[])].filter(Boolean).join(' \n- ');
                input.current.value = `${q}\n\n[web summary]\n- ${summary}\n`;
                input.current.focus();
              } catch (e) {
                console.error('websearch error', e);
              }
            }}
            className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-md"
            title="Web search"
          >
            ?
          </button>
          
          <button
            onClick={() => window.parent && window.parent.postMessage({ type: 'learnmate_action', action: 'quiz' }, '*')}
            className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-md text-sm font-semibold"
            title="Generate Quiz"
            type="button"
          >
            Quiz
          </button>
          <button
            onClick={() => window.parent && window.parent.postMessage({ type: 'learnmate_action', action: 'progress' }, '*')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-md text-sm font-semibold"
            title="Show Progress"
            type="button"
          >
            Progress
          </button>



          {/* Mic button */}
          <button
            type="button"
            onClick={startMic}
            className={`bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-md ${recording ? "animate-pulse" : ""}`}
            title={recording ? "Stop" : "Record"}
          >
            {recording ? '⏹' : '🎤'}
          </button>
          {/* Image upload */}
          <label className="bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-md cursor-pointer">
            📷
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                const readers = files.map(f => new Promise((resolve) => {
                  const r = new FileReader();
                  r.onload = () => resolve(r.result);
                  r.readAsDataURL(f);
                }));
                const arr = await Promise.all(readers);
                setImagesData(arr);
              }}
            />
          </label>
          {/* Preview chip */}
          {imagesData.length > 0 && (
            <span className="text-xs bg-black/40 text-white px-2 py-1 rounded-md">{imagesData.length} image(s)</span>
          )}
          {loading || message ? (
            <button
              onClick={stopChat}
              className="bg-red-500 hover:bg-red-600 text-white p-4 px-6 font-semibold uppercase rounded-md"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={sendMessage}
              className="bg-indigo-500 hover:bg-indigo-600 text-white p-4 px-6 font-semibold uppercase rounded-md"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </>
  );
};
