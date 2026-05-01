import { createContext, useContext, useEffect, useState } from "react";

const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3333";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  // Per-tab session ID (reset when tab closes)
  const [sessionId] = useState(() => {
    const existing = sessionStorage.getItem("sessionId");
    if (existing) return existing;
    const id = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    sessionStorage.setItem("sessionId", id);
    return id;
  });

  const mapPhonemeToViseme = (p) => {
    const s = (p || '').toLowerCase();
    if (/^(p|b|m)$/.test(s)) return 'A';
    if (/^(k|g|q|ng|x|ch|jh)$/.test(s)) return 'B';
    if (/^(iy|i|ee|y|ih|eh)$/i.test(s)) return 'C';
    if (/^(aa|ah|ae|a)$/i.test(s)) return 'D';
    if (/^(ow|o|ao|oh)$/i.test(s)) return 'E';
    if (/^(uw|u|w|oo|ou)$/i.test(s)) return 'F';
    if (/^(f|v)$/i.test(s)) return 'G';
    if (/^(th|dh)$/i.test(s)) return 'H';
    if (/^(sil|sp|pau)$/.test(s)) return 'X';
    return 'C';
  };

  const buildMouthCues = (phonemes = [], words = []) => {
    const cues = [];
    let lastEnd = 0;
    if (Array.isArray(phonemes) && phonemes.length) {
      for (const ph of phonemes) {
        const start = Number(ph.start ?? ph.start_time ?? ph.t) || lastEnd;
        const end = Number(ph.end ?? ph.end_time ?? (start + 0.08));
        const label = ph.phoneme || ph.phone || ph.value || '';
        cues.push({ start, end, value: mapPhonemeToViseme(label) });
        lastEnd = end;
      }
      return { mouthCues: cues };
    }
    if (Array.isArray(words) && words.length) {
      for (const w of words) {
        const start = Number(w.start ?? w.start_time) || lastEnd;
        const end = Number(w.end ?? w.end_time ?? (start + 0.2));
        cues.push({ start, end, value: 'C' });
        lastEnd = end;
      }
      return { mouthCues: cues };
    }
    return undefined;
  };

  const chat = async (message, images, audio, model = 'llama') => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/grok-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, sessionId, images, audio, model }),
      });
      const json = await res.json().catch(() => ({}));
      const resp = Array.isArray(json?.messages) ? json.messages : [];

      if (!res.ok) {
        console.error("/chat failed:", json?.error || res.statusText);
        return; // do not push invalid messages
      }
      if (resp.length === 0) {
        console.warn("/chat returned no messages");
        return;
      }

      // Enrich each message with ElevenLabs TTS + phoneme timestamps for lipsync
      const enriched = await Promise.all(
        resp.map(async (m) => {
          try {
            if (!m?.text) return m;
            window.parent.postMessage({ type: 'learnmate_action', action: 'add_chat_history', role: 'ai', content: m.text }, '*');
            const tts = await fetch(`${backendUrl}/tts/elevenlabs`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: m.text })
            }).then(r => r.json());
            if (tts?.audio) {
              const base64 = tts.audio.includes(',') ? tts.audio.split(',')[1] : tts.audio;
              const lips = buildMouthCues(tts.phonemes, tts.words);
              return { ...m, audio: base64, audioMime: 'audio/mpeg', lipsync: lips };
            }
          } catch (e) {
            console.warn('TTS failed, falling back to text only:', e?.message || e);
          }
          return m;
        })
      );

      setMessages((messages) => [...messages, ...enriched]);
    } catch (err) {
      console.error("chat() error:", err);
    } finally {
      setLoading(false);
    }
  };
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
  };
  const stopChat = () => {
    setMessages([]);
    setMessage(null);
    setLoading(false);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        onMessagePlayed,
        stopChat,
        loading,
        cameraZoomed,
        setCameraZoomed,
        sessionId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
