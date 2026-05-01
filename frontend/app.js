/* =========================================
   LearnMate AI — Full Frontend Logic v2
   ========================================= */

/* --- API Config --- */
function resolveApiBase() {
  const configured = window.LEARNMATE_API_BASE || localStorage.getItem("LEARNMATE_API_BASE");
  if (configured && configured.trim()) return configured.trim().replace(/\/+$/, "");
  const { protocol, hostname, port, origin } = window.location;
  if (protocol.startsWith("http")) {
    if (port === "8000") return origin.replace(/\/+$/, "");
    if (hostname === "localhost" || hostname === "127.0.0.1") return `${protocol}//${hostname}:8000`;
    return origin.replace(/\/+$/, "");
  }
  return "http://127.0.0.1:8000";
}

let API_BASE = resolveApiBase();

/* --- State --- */
let currentQuiz = [];
let currentTopic = "";
let userAnswers = {};
let quizSubmitted = false;
let topicsHistory = [];
let chartInstances = {};
let currentSection = "home";

/* --- DOM Refs --- */
const userIdInput  = document.getElementById("userId");
const topicInput   = document.getElementById("topic");
const chatMessages = document.getElementById("chatMessages");
const typingInd    = document.getElementById("typingIndicator");
const chatInput    = document.getElementById("chatInput");
const loadingStatus = document.getElementById("loadingStatus");
const modelBadge   = document.getElementById("modelBadge");

const learnBtn     = document.getElementById("learnBtn");
const quizBtn      = document.getElementById("quizBtn");
const quizGenBtn   = document.getElementById("quizGenBtn");
const resourcesBtn = document.getElementById("resourcesBtn");
const progressBtn  = document.getElementById("progressBtn");
const submitQuizBtn = document.getElementById("submitQuizBtn");
const resetBtn     = document.getElementById("resetBtn");
const memoryBtn    = document.getElementById("memoryBtn");
const memoryViewBtn = document.getElementById("memoryViewBtn");
const resetMemBtn  = document.getElementById("resetMemBtn");
const sendBtn      = document.getElementById("sendBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
const refreshProgressBtn = document.getElementById("refreshProgressBtn");

const quizOutput   = document.getElementById("quizOutput");
const quizResultOutput = document.getElementById("quizResultOutput");
const quizMeta     = document.getElementById("quizMeta");
const resourcesPanel = document.getElementById("resourcesPanel");

const statAccuracyVal = document.getElementById("statAccuracyVal");
const statStreakVal   = document.getElementById("statStreakVal");
const statTopicsVal   = document.getElementById("statTopicsVal");
const statQuestionsVal = document.getElementById("statQuestionsVal");
const sidebarStreak   = document.getElementById("sidebarStreak");
const sidebarUserName = document.getElementById("sidebarUserName");
const weakAreasEl   = document.getElementById("weakAreas");
const strongAreasEl = document.getElementById("strongAreas");
const memoryOutput  = document.getElementById("memoryOutput");
const rawMemoryOutput = document.getElementById("rawMemoryOutput");
const topicHistory  = document.getElementById("topicHistory");
const topicMasteryList = document.getElementById("topicMasteryList");
const donutPercent  = document.getElementById("donutPercent");
const profileStyle  = document.getElementById("profileStyle");
const profileTrend  = document.getElementById("profileTrend");
const profileSessions = document.getElementById("profileSessions");
const profileTopics = document.getElementById("profileTopics");

const toggle3dBtn = document.getElementById("toggle3dBtn");
const herHavenContainer = document.getElementById("herHavenContainer");
const herHavenIframe = document.getElementById("herHavenIframe");
const herHavenError = document.getElementById("herHavenError");
const sectionsWrapper = document.getElementById("sectionsWrapper");
const identityBar = document.getElementById("identityBar");

const HER_HAVEN_URL = "http://127.0.0.1:5173";

const allActionBtns = [learnBtn, quizBtn, quizGenBtn, resourcesBtn, progressBtn, submitQuizBtn, resetBtn, memoryBtn, sendBtn].filter(Boolean);

/* =========================================
   SECTION NAVIGATION
   ========================================= */
function scrollToSection(name) {
  const sections = ["home","learn","quiz","progress","resources","memory"];
  sections.forEach(s => {
    const el = document.getElementById(`section-${s}`);
    if (el) el.classList.remove("active-section");
  });
  const target = document.getElementById(`section-${name}`);
  if (target) { target.classList.add("active-section"); target.scrollIntoView({ behavior: "smooth", block: "start" }); }
  currentSection = name;

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.section === name || (name === "learn" && item.dataset.section === "home" && name === "home"));
  });

  // Set active based on data-section
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
    if (item.dataset.section === name) item.classList.add("active");
    if (name === "learn" && item.dataset.section === "learn") item.classList.add("active");
    if (name === "home" && item.getAttribute("href") === "#section-home") item.classList.add("active");
  });

  // Close sidebar on mobile
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").classList.remove("active");
}

// Nav item click handlers
document.querySelectorAll(".nav-item[data-section]").forEach(item => {
  item.addEventListener("click", e => {
    e.preventDefault();
    const section = item.dataset.section;
    if (section === "settings") { openSettings(); return; }
    scrollToSection(section);
  });
});

// Mark Home as active on load
document.querySelectorAll(".nav-item").forEach(item => { item.classList.remove("active"); });
const homeNav = document.querySelector(".nav-item[href='#section-home']");
if (homeNav) homeNav.classList.add("active");

/* =========================================
   3D ASSISTANT TOGGLE
   ========================================= */
let is3dMode = false;
let iframeLoaded = false;

if (toggle3dBtn) {
  toggle3dBtn.addEventListener("click", async () => {
    is3dMode = !is3dMode;
    if (is3dMode) {
      if (sectionsWrapper) sectionsWrapper.style.display = "none";
      if (identityBar) identityBar.style.display = "none";
      if (herHavenContainer) herHavenContainer.style.display = "flex";
      toggle3dBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> <span class="hide-mobile">Exit 3D</span>';
      toggle3dBtn.classList.remove("accent");

      if (!iframeLoaded && herHavenIframe) {
        herHavenIframe.src = HER_HAVEN_URL;
        iframeLoaded = true;
        if (herHavenError) herHavenError.style.display = "none";
      }
    } else {
      if (herHavenContainer) herHavenContainer.style.display = "none";
      if (sectionsWrapper) sectionsWrapper.style.display = "block";
      if (identityBar) identityBar.style.display = "flex";
      toggle3dBtn.innerHTML = '<i class="fa-solid fa-vr-cardboard"></i> <span class="hide-mobile">3D Assistant</span>';
      toggle3dBtn.classList.add("accent");
    }
  });
}

window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "learnmate_action") {
    if (event.data.action === "quiz") {
      if (is3dMode && toggle3dBtn) toggle3dBtn.click();
      if (quizBtn) quizBtn.click();
      setTimeout(() => { if (quizGenBtn) quizGenBtn.click(); }, 300);
    } else if (event.data.action === "progress") {
      if (is3dMode && toggle3dBtn) toggle3dBtn.click();
      if (progressBtn) progressBtn.click();
    } else if (event.data.action === "add_chat_history") {
      if (event.data.role === "user") {
        addUserMessage(event.data.content);
      } else if (event.data.role === "ai") {
        addAiMessage(`<p>${escapeHtml(event.data.content)}</p>`);
      }
    }
  }
});

/* =========================================
   THEME
   ========================================= */
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");

function setTheme(mode) {
  document.documentElement.dataset.theme = mode;
  localStorage.setItem("learnmate-theme", mode);
  if (themeIcon) themeIcon.className = mode === "dark" ? "fa-solid fa-moon" : "fa-solid fa-sun";
  setTimeout(() => reinitCharts(), 100);
}

function initTheme() {
  const saved = localStorage.getItem("learnmate-theme");
  setTheme((saved === "light" || saved === "dark") ? saved : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
}

themeToggleBtn.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

/* =========================================
   SIDEBAR MOBILE
   ========================================= */
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");

sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  sidebarOverlay.classList.toggle("active");
});

sidebarOverlay.addEventListener("click", () => {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("active");
});

/* =========================================
   SETTINGS MODAL
   ========================================= */
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const settingsNavBtn = document.getElementById("settingsNavBtn");
const apiBaseInput = document.getElementById("apiBaseInput");
const saveApiBaseBtn = document.getElementById("saveApiBaseBtn");

function openSettings() {
  if (apiBaseInput) apiBaseInput.value = API_BASE;
  settingsModal.style.display = "flex";
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("active");
}

if (settingsNavBtn) settingsNavBtn.addEventListener("click", e => { e.preventDefault(); openSettings(); });
if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", () => settingsModal.style.display = "none");
settingsModal.addEventListener("click", e => { if (e.target === settingsModal) settingsModal.style.display = "none"; });

if (saveApiBaseBtn) {
  saveApiBaseBtn.addEventListener("click", () => {
    const val = apiBaseInput.value.trim().replace(/\/+$/, "");
    if (val) { API_BASE = val; localStorage.setItem("LEARNMATE_API_BASE", val); checkHealth(); }
    settingsModal.style.display = "none";
  });
}

/* =========================================
   API HELPERS
   ========================================= */
async function parseResponse(res) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); }
  catch { if (res.ok) return { message: text }; throw new Error(text); }
}

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  if (!res.ok) { const d = data?.detail || data?.message || "Request failed"; throw new Error(typeof d === "string" ? d : JSON.stringify(d)); }
  return data;
}

async function getJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  const data = await parseResponse(res);
  if (!res.ok) { const d = data?.detail || data?.message || "Request failed"; throw new Error(typeof d === "string" ? d : JSON.stringify(d)); }
  return data;
}

/* =========================================
   LOADING
   ========================================= */
function setLoading(active, message = "Processing…") {
  allActionBtns.forEach(btn => { if (btn) btn.disabled = active; });
  if (loadingStatus) loadingStatus.textContent = active ? `⟳ ${message}` : "";
}

function getInputs() {
  const user_id = userIdInput.value.trim();
  const topic = topicInput.value.trim();
  if (!user_id) throw new Error("Please enter a User ID above.");
  if (!topic)   throw new Error("Please enter a topic above.");
  return { user_id, topic };
}

/* =========================================
   HELPERS
   ========================================= */
function getTimeStr() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(val) {
  return String(val).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
}

function renderMarkdown(text) {
  if (window.marked) {
    try { return marked.parse(text); }
    catch { return `<p>${escapeHtml(text).replace(/\n/g,'<br>')}</p>`; }
  }
  return `<div style="white-space:pre-wrap">${escapeHtml(text)}</div>`;
}

function cssEscape(v) {
  if (window.CSS && CSS.escape) return CSS.escape(String(v));
  return String(v).replaceAll("\\","\\\\").replaceAll('"','\\"');
}

function getModelBadgeMeta(modelUsed) {
  if (modelUsed === "gemini") {
    return { label: "API (Gemini)", icon: "fa-solid fa-cloud", className: "gemini" };
  }
  if (modelUsed === "ollama") {
    return { label: "Local (Ollama)", icon: "fa-solid fa-computer", className: "ollama" };
  }
  return { label: "Fallback", icon: "fa-solid fa-circle-dot", className: "fallback" };
}

function updateModelBadge(modelUsed) {
  if (!modelBadge) return;
  const meta = getModelBadgeMeta(modelUsed);
  modelBadge.className = `model-badge ${meta.className}`;
  modelBadge.innerHTML = `<i class="${meta.icon}"></i><span>${meta.label}</span>`;
}

function normalizeSources(sources, topic) {
  if (Array.isArray(sources) && sources.length) {
    return sources.map((source, index) => ({
      title: source?.title || `Resource ${index + 1}`,
      url: source?.url || `https://www.google.com/search?q=${encodeURIComponent(topic)}`,
      summary: source?.summary || "Helpful reference material for this topic.",
    }));
  }

  const encoded = encodeURIComponent(topic);
  return [
    {
      title: `${topic} overview`,
      url: `https://www.google.com/search?q=${encoded}+overview`,
      summary: `Beginner-friendly search results for ${topic}.`,
    },
    {
      title: `${topic} tutorial`,
      url: `https://www.google.com/search?q=${encoded}+tutorial`,
      summary: `Tutorial-style explanations and walkthroughs for ${topic}.`,
    },
    {
      title: `${topic} practice questions`,
      url: `https://www.google.com/search?q=${encoded}+practice+questions`,
      summary: `Practice problems and revision links for ${topic}.`,
    },
  ];
}

/* =========================================
   CHAT MESSAGES
   ========================================= */
function addUserMessage(text) {
  const div = document.createElement("div");
  div.className = "message user-message";
  div.innerHTML = `
    <div class="msg-avatar"><i class="fa-solid fa-user"></i></div>
    <div class="msg-content">
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <span class="msg-time">${getTimeStr()}</span>
    </div>`;
  chatMessages.appendChild(div);
  scrollChat();
}

function addAiMessage(htmlContent, rawText = "") {
  const div = document.createElement("div");
  div.className = "message ai-message";
  const copyText = rawText || htmlContent.replace(/<[^>]+>/g, " ").trim();
  div.innerHTML = `
    <div class="msg-avatar"><i class="fa-solid fa-brain"></i></div>
    <div class="msg-content">
      <div class="msg-bubble">${htmlContent}</div>
      <span class="msg-time">${getTimeStr()}</span>
      <div class="msg-actions">
        <button class="msg-action-btn copy-btn"><i class="fa-regular fa-copy"></i> Copy</button>
        <button class="msg-action-btn speak-btn"><i class="fa-solid fa-volume-high"></i> Speak</button>
        <button class="msg-action-btn regen-btn"><i class="fa-solid fa-rotate-right"></i> Regenerate</button>
      </div>
    </div>`;
  chatMessages.appendChild(div);
  scrollChat();

  div.querySelector(".copy-btn").addEventListener("click", () => {
    navigator.clipboard.writeText(copyText).then(() => { div.querySelector(".copy-btn").innerHTML = '<i class="fa-solid fa-check"></i> Copied!'; setTimeout(() => { const b = div.querySelector(".copy-btn"); if(b) b.innerHTML = '<i class="fa-regular fa-copy"></i> Copy'; }, 2000); });
  });
  div.querySelector(".speak-btn").addEventListener("click", () => {
    const utt = new SpeechSynthesisUtterance(copyText.slice(0, 500));
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  });
  div.querySelector(".regen-btn").addEventListener("click", () => {
    if (currentTopic) { addUserMessage(`Regenerate explanation for "${currentTopic}"`); doLearnDirect(currentTopic); }
  });
  return div;
}

function addErrorMessage(text) {
  const div = document.createElement("div");
  div.className = "message ai-message";
  div.innerHTML = `
    <div class="msg-avatar" style="background:linear-gradient(135deg,#f43f5e,#fb923c)"><i class="fa-solid fa-circle-exclamation"></i></div>
    <div class="msg-content">
      <div class="msg-bubble" style="border-color:rgba(244,63,94,0.3);background:rgba(244,63,94,0.08);">
        <span style="color:var(--error)"><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(text)}</span>
      </div>
      <span class="msg-time">${getTimeStr()}</span>
    </div>`;
  chatMessages.appendChild(div);
  scrollChat();
}

function showTyping() { typingInd.style.display = "flex"; scrollChat(); }
function hideTyping() { typingInd.style.display = "none"; }
function scrollChat() { requestAnimationFrame(() => { chatMessages.scrollTop = chatMessages.scrollHeight; }); }

/* =========================================
   LEARN
   ========================================= */
learnBtn.addEventListener("click", doLearn);

async function doLearn() {
  let inputs;
  try { inputs = getInputs(); } catch (err) { addErrorMessage(err.message); scrollToSection("learn"); return; }
  scrollToSection("learn");
  const { user_id, topic } = inputs;
  currentTopic = topic;
  addUserMessage(`Explain "${topic}" to me.`);
  await doLearnDirect(topic, user_id);
}

async function doLearnDirect(topic, user_id) {
  if (!user_id) user_id = userIdInput.value.trim();
  if (!user_id) { addErrorMessage("Please enter a User ID in the bar above."); return; }

  showTyping();
  setLoading(true, "Generating explanation…");
  try {
    const data = await postJson("/learn", { user_id, topic });
    hideTyping();
    if (!data || !data.explanation) throw new Error("No explanation in response.");
    updateModelBadge(data.model_used);

    const level = data.adaptation_level || "moderate";
    const levelColor = level === "very_simple" ? "#f97316" : level === "advanced" ? "#10b981" : "#6366f1";
    const levelLabel = level.replace("_", " ");
    const provider = getModelBadgeMeta(data.model_used);

    const html = `
      <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:12px">
        <span style="background:rgba(34,211,238,0.08); border:1px solid rgba(34,211,238,0.18); color:var(--text); border-radius:999px; padding:3px 12px; font-size:11px; font-weight:600;">
          <i class="fa-solid fa-brain"></i> AI output
        </span>
        <span style="background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.18); color:var(--text); border-radius:999px; padding:3px 12px; font-size:11px; font-weight:600;">
          <i class="${provider.icon}"></i> ${provider.label}
        </span>
        <span style="background:${levelColor}22; border:1px solid ${levelColor}55; color:${levelColor}; border-radius:999px; padding:3px 12px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em">
          <i class="fa-solid fa-sliders"></i> ${levelLabel} level
        </span>
      </div>
      ${renderMarkdown(data.explanation)}
      ${data.resources_summary ? `<div style="margin-top:14px; padding:10px 14px; background:rgba(34,211,238,0.07); border:1px solid rgba(34,211,238,0.2); border-radius:8px; font-size:12.5px; color:var(--text-muted)"><i class="fa-solid fa-link" style="color:#22d3ee; margin-right:6px"></i>${escapeHtml(data.resources_summary)}</div>` : ""}
    `;
    addAiMessage(html, data.explanation);
    trackTopic(topic);
    updateSidebarUser(user_id);
    silentProgressRefresh(user_id);
  } catch (err) {
    hideTyping();
    addErrorMessage(err.message);
  } finally {
    setLoading(false);
  }
}

/* =========================================
   RESOURCES
   ========================================= */
resourcesBtn.addEventListener("click", doResources);

async function doResources() {
  let inputs;
  try { inputs = getInputs(); } catch (err) { addErrorMessage(err.message); return; }
  const { user_id, topic } = inputs;

  addUserMessage(`Get resources for "${topic}".`);
  scrollToSection("learn");
  showTyping();
  setLoading(true, "Fetching resources…");

  try {
    const data = await postJson("/resources", { user_id, topic });
    hideTyping();

    // Render in the Resources section too
    renderResourceCards(topic, data);

    const sourceLines = normalizeSources(data?.sources, topic).map((s, i) => `
          <div style="display:flex; align-items:flex-start; gap:10px; padding:10px 12px; margin:5px 0; background:rgba(99,102,241,0.07); border:1px solid rgba(99,102,241,0.15); border-radius:10px; font-size:12px;">
            <div style="width:26px; height:26px; background:linear-gradient(135deg,#6366f1,#a855f7); border-radius:6px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; flex-shrink:0;">${i+1}</div>
            <div style="flex:1; min-width:0">
              <a href="${escapeHtml(s.url)}" target="_blank" rel="noreferrer" style="font-weight:600; color:var(--accent-cyan); text-decoration:none">${escapeHtml(s.title)}</a>
              <div style="margin-top:4px; color:var(--text-muted); line-height:1.55">${escapeHtml(s.summary)}</div>
            </div>
          </div>`).join("");

    const html = `
      <div style="font-weight:700; margin-bottom:10px"><i class="fa-solid fa-book-open" style="color:#22d3ee; margin-right:6px"></i>Resources for "${escapeHtml(topic)}"</div>
      ${data?.summary ? `<div style="margin-bottom:12px; font-size:13.5px; line-height:1.7">${escapeHtml(data.summary)}</div>` : ""}
      ${sourceLines}`;
    addAiMessage(html, data?.summary || "");
  } catch (err) {
    hideTyping();
    addErrorMessage(err.message);
  } finally {
    setLoading(false);
  }
}

function renderResourceCardsLegacy(topic, data) {
  const sources = Array.isArray(data?.sources) ? data.sources : [];
  const types = ["Article", "Video", "Tutorial", "PDF", "Article"];
  const icons = ["📄","🎬","🧑‍💻","📕","📚"];
  const badgeClasses = ["badge-article","badge-video","badge-tutorial","badge-pdf","badge-article"];

  if (!sources.length && !data?.summary) {
    resourcesPanel.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-icon res"><i class="fa-solid fa-book-open"></i></div>
        <h3>No External Resources</h3>
        <p>Firecrawl API may not be configured. You can still use Learn and Quiz for AI-powered learning.</p>
      </div>`;
    return;
  }

  // Build curated cards if no real sources
  const cardData = sources.length ? sources.map((s, i) => ({
    title: s.title || `Resource ${i+1}`,
    desc: s.url || "",
    url: s.url || "#",
    type: types[i % types.length],
    icon: icons[i % icons.length],
    badge: badgeClasses[i % badgeClasses.length],
  })) : generateCuratedResources(topic);

  resourcesPanel.innerHTML = `
    ${data?.summary ? `<div style="margin-bottom:16px; padding:12px 16px; background:rgba(34,211,238,0.07); border:1px solid rgba(34,211,238,0.2); border-radius:10px; font-size:13px; color:var(--text-muted)">${escapeHtml(data.summary)}</div>` : ""}
    <div class="resource-cards-grid">
      ${cardData.map(card => `
        <div class="resource-card">
          <div class="resource-card-img">${card.icon}</div>
          <div class="resource-card-body">
            <span class="resource-type-badge ${card.badge}">${card.type}</span>
            <div class="resource-card-title">${escapeHtml(card.title)}</div>
            <div class="resource-card-desc">${escapeHtml(card.desc.slice(0, 80))}${card.desc.length > 80 ? "…" : ""}</div>
            <a href="${escapeHtml(card.url)}" target="_blank"><button class="resource-open-btn"><i class="fa-solid fa-external-link"></i> Open Resource</button></a>
          </div>
        </div>`).join("")}
    </div>`;
}

function generateCuratedResources(topic) {
  const t = encodeURIComponent(topic);
  return [
    { title: `${topic} — Wikipedia`, desc: "Comprehensive overview and reference", url: `https://en.wikipedia.org/wiki/${t}`, type: "Article", icon: "📖", badge: "badge-article" },
    { title: `${topic} Tutorial — GeeksForGeeks`, desc: "Beginner-friendly tutorial with examples", url: `https://www.geeksforgeeks.org/search/?q=${t}`, type: "Tutorial", icon: "🧑‍💻", badge: "badge-tutorial" },
    { title: `${topic} Explained — YouTube`, desc: "Video explanation for visual learners", url: `https://www.youtube.com/results?search_query=${t}+explained`, type: "Video", icon: "🎬", badge: "badge-video" },
    { title: `${topic} — W3Schools / MDN`, desc: "Reference documentation and examples", url: `https://developer.mozilla.org/en-US/search?q=${t}`, type: "Article", icon: "📄", badge: "badge-article" },
  ];
}

function buildResourceCards(topic, data) {
  const sources = normalizeSources(data?.sources, topic);
  const types = ["Article", "Video", "Tutorial", "PDF", "Article"];
  const icons = [
    "fa-solid fa-file-lines",
    "fa-solid fa-circle-play",
    "fa-solid fa-graduation-cap",
    "fa-solid fa-book",
    "fa-solid fa-book-open-reader",
  ];
  const badgeClasses = ["badge-article", "badge-video", "badge-tutorial", "badge-pdf", "badge-article"];

  return sources.map((source, index) => ({
    title: source.title || `Resource ${index + 1}`,
    desc: source.summary || "Helpful learning resource.",
    url: source.url || "#",
    type: types[index % types.length],
    icon: icons[index % icons.length],
    badge: badgeClasses[index % badgeClasses.length],
  }));
}

function renderResourceCards(topic, data) {
  const cardData = buildResourceCards(topic, data);

  if (!cardData.length && !data?.summary) {
    resourcesPanel.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-icon res"><i class="fa-solid fa-book-open"></i></div>
        <h3>No External Resources</h3>
        <p>Resources are unavailable right now, but Learn and Quiz still work normally.</p>
      </div>`;
    return;
  }

  resourcesPanel.innerHTML = `
    ${data?.summary ? `<div style="margin-bottom:16px; padding:12px 16px; background:rgba(34,211,238,0.07); border:1px solid rgba(34,211,238,0.2); border-radius:10px; font-size:13px; color:var(--text-muted)">${escapeHtml(data.summary)}</div>` : ""}
    <div class="resource-cards-grid">
      ${cardData.map(card => `
        <div class="resource-card">
          <div class="resource-card-img"><i class="${card.icon}"></i></div>
          <div class="resource-card-body">
            <span class="resource-type-badge ${card.badge}">${card.type}</span>
            <a class="resource-card-title resource-card-link" href="${escapeHtml(card.url)}" target="_blank" rel="noreferrer">${escapeHtml(card.title)}</a>
            <div class="resource-card-desc">${escapeHtml(card.desc)}</div>
            <a href="${escapeHtml(card.url)}" target="_blank" rel="noreferrer"><button class="resource-open-btn"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open Resource</button></a>
          </div>
        </div>`).join("")}
    </div>`;
}

/* =========================================
   QUIZ
   ========================================= */
quizBtn.addEventListener("click", () => { scrollToSection("quiz"); doQuiz(); });
if (quizGenBtn) quizGenBtn.addEventListener("click", doQuiz);

async function doQuiz() {
  let inputs;
  try { inputs = getInputs(); } catch (err) { addErrorMessage(err.message); return; }
  const { user_id, topic } = inputs;
  currentTopic = topic;
  scrollToSection("quiz");

  quizOutput.innerHTML = `<div class="empty-state-card"><div class="empty-icon" style="animation:pulse 1s infinite"><i class="fa-solid fa-spinner fa-spin"></i></div><p>Generating topic-specific quiz for "${escapeHtml(topic)}"…</p></div>`;
  if (submitQuizBtn) submitQuizBtn.style.display = "none";
  quizResultOutput.innerHTML = "";
  setLoading(true, "Generating quiz…");

  try {
    const data = await postJson("/quiz", { user_id, topic, num_questions: 5 });
    if (!data || !Array.isArray(data.questions)) throw new Error("Invalid quiz response.");
    updateModelBadge(data.model_used);

    currentQuiz = data.questions;
    userAnswers = {};
    quizSubmitted = false;
    quizResultOutput.innerHTML = "";

    const provider = getModelBadgeMeta(data.model_used);
    quizMeta.textContent = `Difficulty: ${data.difficulty || "adaptive"} · ${data.questions.length} questions · Topic: ${topic} · ${provider.label}`;
    renderQuiz(currentQuiz);
    if (submitQuizBtn) submitQuizBtn.style.display = "inline-flex";

    // Also mention in chat
    addAiMessage(`<p><i class="fa-solid fa-circle-question" style="color:#a855f7;margin-right:6px"></i>Quiz on <strong>${escapeHtml(topic)}</strong> is ready in the <strong>Quiz section</strong>! <i class="${provider.icon}" style="margin-left:8px; margin-right:4px"></i>${escapeHtml(provider.label)} answered this one.</p>`);
    scrollToSection("quiz");
  } catch (err) {
    quizOutput.innerHTML = `<div class="empty-state-card"><div class="empty-icon"><i class="fa-solid fa-triangle-exclamation"></i></div><h3>Quiz Generation Failed</h3><p>${escapeHtml(err.message)}</p></div>`;
  } finally {
    setLoading(false);
  }
}

function renderQuiz(questions) {
  if (!questions.length) { quizOutput.innerHTML = `<div class="empty-state-card"><i class="fa-solid fa-inbox"></i><p>No questions generated.</p></div>`; return; }
  quizOutput.innerHTML = questions.map((q, idx) => {
    const opts = q.options.map(opt => `
      <label class="option-row" data-opt-row="${idx}::${escapeHtml(opt)}">
        <input type="radio" name="q_${idx}" value="${escapeHtml(opt)}" data-qidx="${idx}" />
        <span>${escapeHtml(opt)}</span>
      </label>`).join("");
    return `<div class="question">
      <div class="question-title"><span style="color:var(--primary-light);font-size:13px;font-weight:700;">Q${idx+1}.</span> ${escapeHtml(q.question)}</div>
      ${opts}
    </div>`;
  }).join("");

  quizOutput.querySelectorAll("input[type='radio']").forEach(radio => {
    radio.addEventListener("change", e => {
      if (quizSubmitted) return;
      userAnswers[e.target.getAttribute("data-qidx")] = e.target.value;
    });
  });
}

if (submitQuizBtn) submitQuizBtn.addEventListener("click", doSubmitQuiz);

async function doSubmitQuiz() {
  const user_id = userIdInput.value.trim();
  if (!user_id) { addErrorMessage("Please enter a User ID."); return; }
  if (!currentQuiz.length) { addErrorMessage("Generate a quiz first!"); return; }

  setLoading(true, "Submitting quiz…");
  try {
    const data = await postJson("/quiz/submit", {
      user_id, topic: currentTopic || topicInput.value.trim() || null, questions: currentQuiz, answers: userAnswers,
    });
    if (!data || !Array.isArray(data.results)) throw new Error("Invalid quiz result.");

    const resultLines = data.results.map(r => {
      const cls = r.correct ? "ok" : "bad";
      const icon = r.correct ? "fa-circle-check" : "fa-circle-xmark";
      return `<div class="${cls}" style="display:flex; align-items:flex-start; gap:8px; padding:7px 0; border-bottom:1px solid var(--border); font-size:12.5px;">
        <i class="fa-solid ${icon}" style="margin-top:2px; flex-shrink:0"></i>
        <span><strong>Q${r.index+1}:</strong> ${r.correct ? "Correct" : "Incorrect"} — your answer: <em>${escapeHtml(r.selected ?? "Not answered")}</em> | correct: <em>${escapeHtml(r.expected)}</em></span>
      </div>`;
    }).join("");

    quizResultOutput.innerHTML = `
      <div class="quiz-result-card">
        <div class="quiz-score-row">
          <div class="score-chip"><span class="val">${data.score}/${data.total}</span><span class="lbl">Score</span></div>
          <div class="score-chip"><span class="val" style="color:var(--success)">${data.correct_answers}</span><span class="lbl">Correct</span></div>
          <div class="score-chip"><span class="val" style="color:var(--error)">${data.wrong_answers}</span><span class="lbl">Wrong</span></div>
          <div class="score-chip"><span class="val" style="color:var(--accent-cyan)">${data.accuracy_percentage}%</span><span class="lbl">Accuracy</span></div>
        </div>
        <div>${resultLines}</div>
      </div>`;

    applyQuizReviewStyles(data.results);
    quizSubmitted = true;
    if (submitQuizBtn) submitQuizBtn.style.display = "none";

    scrollToSection("quiz");

    const emoji = data.accuracy_percentage >= 80 ? "🎉" : data.accuracy_percentage >= 50 ? "👍" : "💪";
    const msg = data.accuracy_percentage >= 80 ? "Excellent! Adding this topic to your strong areas." : data.accuracy_percentage >= 50 ? "Good effort! Keep practicing to master this topic." : "No worries — I'll simplify the next explanation on this topic.";
    addAiMessage(`<p>${emoji} Quiz submitted! Score: <strong>${data.score}/${data.total}</strong> (${data.accuracy_percentage}% accuracy). ${msg}</p>`);
    await silentProgressRefresh(user_id);
  } catch (err) {
    addErrorMessage(err.message);
  } finally {
    setLoading(false);
  }
}

function applyQuizReviewStyles(results) {
  results.forEach(result => {
    const idx = Number(result.index);
    if (Number.isNaN(idx) || !currentQuiz[idx]) return;
    const expected = currentQuiz[idx].answer;
    const selected = result.selected ?? "";
    currentQuiz[idx].options.forEach(opt => {
      const row = quizOutput.querySelector(`[data-opt-row="${idx}::${cssEscape(opt)}"]`);
      if (!row) return;
      row.classList.remove("correct-option","wrong-option");
      if (opt === expected) row.classList.add("correct-option");
      if (selected && opt === selected && selected !== expected) row.classList.add("wrong-option");
      const inp = row.querySelector("input");
      if (inp) inp.disabled = true;
    });
    const qContainer = quizOutput.querySelectorAll(".question")[idx];
    if (!qContainer) return;
    const existing = qContainer.querySelector(".explanation-note");
    if (existing) existing.remove();
    const note = document.createElement("div");
    note.className = "explanation-note";
    note.innerHTML = `<i class="fa-solid fa-circle-info" style="color:var(--primary-light);margin-right:6px"></i><strong>Answer:</strong> ${escapeHtml(expected)}. ${escapeHtml(currentQuiz[idx].explanation || "")}`;
    qContainer.appendChild(note);
  });
}

/* =========================================
   PROGRESS
   ========================================= */
progressBtn.addEventListener("click", doProgress);
if (refreshProgressBtn) refreshProgressBtn.addEventListener("click", doProgress);

async function doProgress() {
  const user_id = userIdInput.value.trim();
  if (!user_id) { addErrorMessage("Please enter a User ID."); return; }

  scrollToSection("progress");
  addUserMessage("Show me my learning progress.");
  showTyping();
  setLoading(true, "Loading progress…");

  try {
    const data = await getJson(`/progress?user_id=${encodeURIComponent(user_id)}`);
    hideTyping();
    renderProgress(data);
  } catch (err) {
    hideTyping();
    addErrorMessage(err.message);
  } finally {
    setLoading(false);
  }
}

async function silentProgressRefresh(user_id) {
  try {
    const data = await getJson(`/progress?user_id=${encodeURIComponent(user_id)}`);
    renderProgress(data, true);
  } catch {}
}

function renderProgress(data, silent = false) {
  const accuracy  = Number(data.accuracy_percentage ?? 0);
  const topics    = data.topics_covered || [];
  const weak      = data.weak_areas || [];
  const strong    = data.strong_areas || [];
  const streak    = data.study_streak ?? 0;
  const total     = data.total_questions ?? 0;
  const correct   = data.correct_answers ?? 0;
  const trend     = data.improvement_trend || "insufficient_data";
  const style_lrn = data.learning_style || "balanced";
  const sessions  = data.quiz_sessions ?? 0;
  const byTopic   = data.by_topic || {};

  // Stat Cards
  statAccuracyVal.textContent  = total > 0 ? `${accuracy}%` : "—";
  statStreakVal.textContent     = streak;
  statTopicsVal.textContent    = topics.length;
  statQuestionsVal.textContent = total;
  sidebarStreak.textContent    = streak;
  donutPercent.textContent     = `${Math.round(accuracy)}%`;

  // Profile
  if (profileStyle)   profileStyle.textContent   = style_lrn;
  if (profileTrend)   profileTrend.textContent   = trend === "up" ? "📈 Improving" : trend === "down" ? "📉 Declining" : trend === "stable" ? "➡️ Stable" : "—";
  if (profileSessions) profileSessions.textContent = sessions;
  if (profileTopics)  profileTopics.textContent  = topics.slice(-3).join(", ") || "—";

  // Weak/Strong
  weakAreasEl.innerHTML = weak.length
    ? weak.map(w => `<span class="tag weak">${escapeHtml(w)}</span>`).join("")
    : `<span class="empty-tag">No weak areas identified — great job!</span>`;
  strongAreasEl.innerHTML = strong.length
    ? strong.map(s => `<span class="tag strong">${escapeHtml(s)}</span>`).join("")
    : `<span class="empty-tag">Complete quizzes with ≥70% accuracy to identify strengths</span>`;

  // Topic mastery bars — use by_topic if available
  if (topics.length) {
    topicMasteryList.innerHTML = topics.map(t => {
      const bt = byTopic[t];
      const pct = bt ? Math.round((bt.correct / (bt.attempts || 1)) * 100) : Math.round(accuracy);
      const barColor = pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--primary)" : "var(--accent-orange)";
      return `<div class="topic-bar-item">
        <div class="topic-bar-label"><span class="topic-bar-name">${escapeHtml(t)}</span><span class="topic-bar-pct">${pct}%</span></div>
        <div class="topic-bar-track"><div class="topic-bar-fill" style="width:${pct}%; background:linear-gradient(90deg, ${barColor}, ${barColor}88)"></div></div>
      </div>`;
    }).join("");
  } else {
    topicMasteryList.innerHTML = `<div class="empty-state-small"><i class="fa-regular fa-compass"></i><span>Start learning to track topic mastery</span></div>`;
  }

  // Topic history
  renderTopicHistory();

  // Charts
  updateDonutChart(accuracy);
  updateBarChart(topics, byTopic, accuracy);

  if (!silent) {
    const trendIcon = trend === "up" ? "📈" : trend === "down" ? "📉" : "➡️";
    const html = `
      <div style="font-weight:700; margin-bottom:12px"><i class="fa-solid fa-chart-line" style="color:#6366f1; margin-right:6px"></i>Your Learning Progress</div>
      <div style="display:flex; flex-direction:column; gap:6px; font-size:13px;">
        <div style="display:flex; justify-content:space-between"><strong style="color:var(--text-muted)">Accuracy</strong><span>${accuracy}%</span></div>
        <div style="margin:4px 0; height:8px; background:rgba(99,102,241,0.1); border-radius:999px; overflow:hidden"><div style="height:100%; width:${Math.min(100,accuracy)}%; background:linear-gradient(90deg,var(--primary),var(--accent-cyan)); border-radius:999px"></div></div>
        <div style="display:flex; justify-content:space-between"><strong style="color:var(--text-muted)">Study Streak</strong><span style="color:#f97316"><i class="fa-solid fa-fire"></i> ${streak} day(s)</span></div>
        <div style="display:flex; justify-content:space-between"><strong style="color:var(--text-muted)">Topics Covered</strong><span>${topics.length ? topics.slice(0,4).join(", ") + (topics.length > 4 ? " +" + (topics.length - 4) + " more" : "") : "None yet"}</span></div>
        <div style="display:flex; justify-content:space-between"><strong style="color:var(--text-muted)">Questions Done</strong><span>${total} (${correct} correct)</span></div>
        <div style="display:flex; justify-content:space-between"><strong style="color:var(--text-muted)">Trend</strong><span>${trendIcon} ${trend}</span></div>
        ${weak.length ? `<div style="display:flex; justify-content:space-between"><strong style="color:var(--text-muted)">Needs Work</strong><span style="color:var(--error)">${weak.join(", ")}</span></div>` : ""}
        ${strong.length ? `<div style="display:flex; justify-content:space-between"><strong style="color:var(--text-muted)">Strong In</strong><span style="color:var(--success)">${strong.join(", ")}</span></div>` : ""}
      </div>`;
    addAiMessage(html);
    scrollToSection("progress");
  }
}

/* =========================================
   MEMORY
   ========================================= */
if (memoryBtn) memoryBtn.addEventListener("click", doMemory);
if (memoryViewBtn) memoryViewBtn.addEventListener("click", doMemory);

async function doMemory() {
  const user_id = userIdInput.value.trim();
  if (!user_id) { addErrorMessage("Please enter a User ID."); return; }

  setLoading(true, "Loading memory…");
  try {
    const data = await getJson(`/debug/memory?user_id=${encodeURIComponent(user_id)}`);
    const json = JSON.stringify(data, null, 2);

    const topics  = data.topics_learned || [];
    const weak    = data.weak_areas || [];
    const strong  = data.strong_areas || [];
    const style_l = data.learning_style || "balanced";
    const streak  = data.study_streak || 0;
    const lastDate = data.last_activity_date || "—";
    const sessions = data.quiz_sessions || 0;

    memoryOutput.innerHTML = `
      <div class="memory-item"><i class="fa-solid fa-user"></i><span>User: <strong>${escapeHtml(user_id)}</strong></span></div>
      <div class="memory-item"><i class="fa-solid fa-calendar"></i><span>Last active: <strong>${escapeHtml(String(lastDate))}</strong> | Streak: <strong>${streak} days</strong></span></div>
      <div class="memory-item"><i class="fa-solid fa-brain"></i><span>Learning style: <strong>${escapeHtml(style_l)}</strong> | Quiz sessions: <strong>${sessions}</strong></span></div>
      <div class="memory-item"><i class="fa-solid fa-book"></i><span>Topics learned (${topics.length}): <strong>${escapeHtml(topics.join(", ") || "None yet")}</strong></span></div>
      <div class="memory-item"><i class="fa-solid fa-triangle-exclamation" style="color:var(--error)"></i><span>Weak areas: <strong style="color:var(--error)">${escapeHtml(weak.join(", ") || "None identified")}</strong></span></div>
      <div class="memory-item"><i class="fa-solid fa-star" style="color:var(--success)"></i><span>Strong areas: <strong style="color:var(--success)">${escapeHtml(strong.join(", ") || "Keep quizzing to identify strengths!")}</strong></span></div>`;

    if (rawMemoryOutput) rawMemoryOutput.textContent = json;
    scrollToSection("memory");
  } catch (err) {
    if (memoryOutput) memoryOutput.innerHTML = `<div style="color:var(--error); font-size:12px"><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(err.message)}</div>`;
  } finally {
    setLoading(false);
  }
}

/* =========================================
   RESET
   ========================================= */
if (resetBtn) resetBtn.addEventListener("click", doReset);
if (resetMemBtn) resetMemBtn.addEventListener("click", doReset);

async function doReset() {
  const user_id = userIdInput.value.trim();
  if (!user_id) { addErrorMessage("Please enter a User ID."); return; }
  if (!confirm(`Reset ALL progress for "${user_id}"? This cannot be undone.`)) return;

  setLoading(true, "Resetting…");
  try {
    await postJson("/debug/reset", { user_id });
    currentQuiz = []; currentTopic = ""; userAnswers = {}; quizSubmitted = false; topicsHistory = [];
    if (submitQuizBtn) submitQuizBtn.style.display = "none";
    quizOutput.innerHTML = `<div class="empty-state-card"><div class="empty-icon"><i class="fa-solid fa-circle-question"></i></div><h3>No Quiz Yet</h3><p>Enter a topic above and click "Generate Quiz" to start.</p></div>`;
    quizResultOutput.innerHTML = "";
    quizMeta.textContent = "";

    statAccuracyVal.textContent = "—"; statStreakVal.textContent = "0"; statTopicsVal.textContent = "0"; statQuestionsVal.textContent = "0"; sidebarStreak.textContent = "0";
    donutPercent.textContent = "0%";
    weakAreasEl.innerHTML = `<span class="empty-tag">No weak areas identified yet</span>`;
    strongAreasEl.innerHTML = `<span class="empty-tag">Complete quizzes to identify your strengths</span>`;
    topicHistory.innerHTML = `<div class="empty-state-small"><i class="fa-regular fa-clock"></i><span>Your recent topics will appear here</span></div>`;
    topicMasteryList.innerHTML = `<div class="empty-state-small"><i class="fa-regular fa-compass"></i><span>Start learning to track mastery</span></div>`;
    memoryOutput.innerHTML = `<div class="empty-state-small"><i class="fa-solid fa-database"></i><span>Memory cleared — start a new session!</span></div>`;
    if (rawMemoryOutput) rawMemoryOutput.textContent = "Memory has been reset.";
    if (profileStyle) profileStyle.textContent = "balanced";
    if (profileTrend) profileTrend.textContent = "—";
    if (profileSessions) profileSessions.textContent = "0";
    if (profileTopics) profileTopics.textContent = "—";

    updateDonutChart(0);
    updateBarChart([], {}, 0);
    addAiMessage(`<p><i class="fa-solid fa-rotate-left" style="color:#22d3ee;margin-right:6px"></i>Progress reset for <strong>${escapeHtml(user_id)}</strong>. Fresh start — pick a topic and let's go!</p>`);
  } catch (err) {
    addErrorMessage(err.message);
  } finally {
    setLoading(false);
  }
}

/* =========================================
   CLEAR CHAT
   ========================================= */
if (clearChatBtn) clearChatBtn.addEventListener("click", () => {
  if (!confirm("Clear all chat messages?")) return;
  chatMessages.innerHTML = `
    <div class="message ai-message">
      <div class="msg-avatar"><i class="fa-solid fa-brain"></i></div>
      <div class="msg-content">
        <div class="msg-bubble"><p>👋 Chat cleared! I'm ready whenever you are. Enter a topic above and hit Learn!</p></div>
        <span class="msg-time">${getTimeStr()}</span>
      </div>
    </div>`;
});

/* =========================================
   CHAT INPUT (send)
   ========================================= */
if (sendBtn) sendBtn.addEventListener("click", handleChatSend);
if (chatInput) chatInput.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } });

async function handleChatSend() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  topicInput.value = text;
  currentTopic = text;
  addUserMessage(text);
  scrollToSection("learn");
  await doLearnDirect(text);
}

/* Voice input */
const voiceBtn = document.getElementById("voiceInputBtn");
if (voiceBtn && "webkitSpeechRecognition" in window) {
  const recog = new webkitSpeechRecognition();
  recog.lang = "en-US"; recog.interimResults = false;
  recog.onresult = e => { const t = e.results[0][0].transcript; chatInput.value = t; };
  voiceBtn.addEventListener("click", () => recog.start());
}

/* =========================================
   CHIPS
   ========================================= */
document.querySelectorAll(".chip[data-topic]").forEach(chip => {
  chip.addEventListener("click", () => {
    const topic = chip.dataset.topic;
    const action = chip.dataset.action;
    topicInput.value = topic;
    currentTopic = topic;
    if (action === "quiz") { scrollToSection("quiz"); doQuiz(); }
    else { scrollToSection("learn"); doLearn(); }
  });
});

/* Home CTA buttons */
document.querySelectorAll(".cta-btn").forEach(btn => btn.addEventListener("click", () => {})); // Already inline

/* =========================================
   TOPIC HISTORY
   ========================================= */
function trackTopic(topic) {
  if (!topicsHistory.includes(topic)) { topicsHistory.unshift(topic); if (topicsHistory.length > 10) topicsHistory.pop(); }
  renderTopicHistory();
}

function renderTopicHistory() {
  if (!topicsHistory.length) {
    topicHistory.innerHTML = `<div class="empty-state-small"><i class="fa-regular fa-clock"></i><span>Your recent topics will appear here</span></div>`;
    return;
  }
  topicHistory.innerHTML = topicsHistory.map((t, i) =>
    `<div class="topic-history-item">
      <i class="fa-solid fa-book-open-reader"></i>
      <span>${escapeHtml(t)}</span>
      ${i===0 ? `<span style="margin-left:auto; font-size:10px; background:rgba(99,102,241,0.15); color:var(--primary-light); border-radius:4px; padding:2px 7px">latest</span>` : ""}
    </div>`).join("");
}

function updateSidebarUser(user_id) {
  if (sidebarUserName) sidebarUserName.textContent = user_id || "student_001";
}

/* =========================================
   CHARTS
   ========================================= */
function isDark() { return document.documentElement.dataset.theme !== "light"; }
function chartTextColor() { return isDark() ? "#8892a4" : "#64748b"; }
function chartGridColor() { return isDark() ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.15)"; }

function initDonutChart() {
  const ctx = document.getElementById("donutChart");
  if (!ctx) return;
  if (chartInstances.donut) chartInstances.donut.destroy();
  chartInstances.donut = new Chart(ctx, {
    type: "doughnut",
    data: { datasets: [{ data: [0, 100], backgroundColor: [isDark() ? "rgba(99,102,241,0.4)" : "rgba(99,102,241,0.5)", isDark() ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)"], borderWidth: 0, borderRadius: 4 }] },
    options: { cutout: "72%", plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { animateRotate: true, duration: 800 } },
  });
}

function updateDonutChart(pct) {
  if (!chartInstances.donut) initDonutChart();
  const chart = chartInstances.donut;
  if (!chart) return;
  const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#6366f1" : "#f97316";
  chart.data.datasets[0].data = [pct, Math.max(0, 100 - pct)];
  chart.data.datasets[0].backgroundColor = [color, isDark() ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)"];
  donutPercent.textContent = `${Math.round(pct)}%`;
  chart.update();
}

function initBarChart() {
  const ctx = document.getElementById("barChart");
  if (!ctx) return;
  if (chartInstances.bar) chartInstances.bar.destroy();
  chartInstances.bar = new Chart(ctx, {
    type: "bar",
    data: { labels: [], datasets: [{ label: "Accuracy %", data: [], backgroundColor: "rgba(99,102,241,0.65)", borderRadius: 6, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.parsed.y}%` } } },
      scales: {
        x: { grid: { color: chartGridColor() }, ticks: { color: chartTextColor(), font: { size: 10 } } },
        y: { beginAtZero: true, max: 100, grid: { color: chartGridColor() }, ticks: { color: chartTextColor(), font: { size: 10 }, callback: v => `${v}%` } }
      }
    }
  });
}

function updateBarChart(topics, byTopic, accuracy) {
  if (!chartInstances.bar) initBarChart();
  const chart = chartInstances.bar;
  if (!chart) return;
  const barWrap = document.getElementById("barChartWrap");
  const barEmpty = document.getElementById("barChartEmpty");

  if (!topics.length) {
    if (barWrap) barWrap.style.display = "none";
    if (barEmpty) barEmpty.style.display = "flex";
    return;
  }

  if (barWrap) barWrap.style.display = "block";
  if (barEmpty) barEmpty.style.display = "none";

  const labels = topics.map(t => t.length > 12 ? t.slice(0, 12) + "…" : t);
  const scores = topics.map(t => {
    const bt = byTopic[t];
    return bt && bt.attempts ? Math.round((bt.correct / bt.attempts) * 100) : Math.round(accuracy);
  });
  const colors = scores.map(s => s >= 80 ? "rgba(16,185,129,0.75)" : s >= 50 ? "rgba(99,102,241,0.75)" : "rgba(249,115,22,0.75)");

  chart.data.labels = labels;
  chart.data.datasets[0].data = scores;
  chart.data.datasets[0].backgroundColor = colors;
  chart.update();
}

function reinitCharts() {
  const pct = Number(donutPercent?.textContent?.replace("%", "")) || 0;
  initDonutChart(); updateDonutChart(pct);
  initBarChart();
}

/* =========================================
   HEALTH CHECK
   ========================================= */
async function checkHealth() {
  const dot = document.querySelector(".api-status-dot .dot");
  const txt = document.getElementById("apiStatusText");
  const settingsTxt = document.getElementById("settingsApiStatus");
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      if (dot) { dot.style.background = "var(--success)"; dot.style.boxShadow = "0 0 6px var(--success)"; }
      if (txt) txt.textContent = "Connected";
      if (settingsTxt) settingsTxt.textContent = "Backend connected ✓";
    } else throw new Error();
  } catch {
    if (dot) { dot.style.background = "var(--error)"; dot.style.boxShadow = "0 0 6px var(--error)"; }
    if (txt) txt.textContent = "Offline";
    if (settingsTxt) settingsTxt.textContent = "Backend offline ✗";
  }
}

/* =========================================
   INIT
   ========================================= */
function init() {
  initTheme();
  updateModelBadge("fallback");
  initDonutChart();
  initBarChart();
  checkHealth();

  const saved = localStorage.getItem("learnmate-user");
  if (saved) { userIdInput.value = saved; sidebarUserName.textContent = saved; }

  userIdInput.addEventListener("change", () => {
    const uid = userIdInput.value.trim();
    localStorage.setItem("learnmate-user", uid);
    updateSidebarUser(uid);
  });

  // Profile navbar
  const profileBtn = document.getElementById("profileBtn");
  if (profileBtn) profileBtn.addEventListener("click", () => scrollToSection("progress"));

  // Ensure home is visible
  scrollToSection("home");
}

init();
