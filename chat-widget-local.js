/**
 * Creativo Milano — fully free, in-browser chat widget
 * -------------------------------------------------------
 * No server, no API key, no ongoing costs of any kind. The AI model itself
 * downloads and runs directly in each visitor's browser using Transformers.js
 * (open source, by Hugging Face) and a small open model called SmolLM2.
 *
 * HOW TO USE:
 * 1. Put this file in the same folder as your HTML pages.
 * 2. Add this line right before </body> on any page you want the chat on:
 *      <script type="module" src="chat-widget-local.js"></script>
 *    Note the type="module" — required, unlike the server-based widget version.
 * 3. That's it. No backend to deploy, no keys to configure.
 *
 * HONEST TRADEOFFS (read before relying on this in production):
 * - The model is small (360M parameters) so answers are noticeably less
 *   sharp than Claude/ChatGPT/Gemini — it can misunderstand unusual phrasing
 *   or wander off-topic on complex questions.
 * - First load downloads the model (roughly 200-400MB) — this can take from
 *   a few seconds to about a minute depending on the visitor's connection.
 *   After that first download, the browser caches it, so return visits are instant.
 * - Runs entirely on the visitor's device — on old phones or low-memory
 *   devices it may be slow or fail to load. There's a text fallback for that.
 * - Editing what the assistant "knows" means editing the KNOWLEDGE_BASE
 *   constant below and re-uploading this file — no separate database.
 */

const MODEL_ID = "onnx-community/SmolLM2-360M-Instruct";

// ---- Knowledge base: keep this SHORT. Small models lose track of long context. ----
// Edit freely — plain text, no code knowledge needed. Replace placeholders with real info.
const KNOWLEDGE_BASE = `You are the assistant for Creativo Milano, a Milan-based design-and-build studio, part of the Outdoor Factory group.
Five disciplines: Museums (e.g. DDM Digital Experience Museum, History Museum), Theme parks (Phaetonia Land, Kids Town, Aqua Park Resort), Monuments (Karabakh Monument, Azerbaijan), Urban architecture (Festival City, Campus Park), and Theme park maintenance.
Address: Via Sant'Orsola 8/A, Milan, Italy. Email: [replace with real email]. Phone: [replace with real phone].
Be warm, brief, and helpful. If unsure, suggest contacting the studio directly. Do not invent prices, dates or client names.`;

const GREETING = "Hi! I'm the Creativo Milano assistant (running fully in your browser). Ask me about our museums, theme parks, monuments, or urban projects.";

// ---- Styles ----
const style = document.createElement("style");
style.textContent = `
  .cm-chat-launcher{position:fixed;bottom:24px;right:24px;width:58px;height:58px;border-radius:50%;
    background:#0F75BC;color:#fff;border:none;cursor:pointer;box-shadow:0 10px 26px -8px rgba(0,0,0,.35);
    display:flex;align-items:center;justify-content:center;z-index:9999;transition:transform .2s ease;}
  .cm-chat-launcher:hover{transform:scale(1.06);}
  .cm-chat-launcher svg{width:26px;height:26px;}
  .cm-chat-panel{position:fixed;bottom:96px;right:24px;width:min(360px,90vw);height:min(520px,70vh);
    background:#FAF8F3;border-radius:18px;box-shadow:0 24px 60px -16px rgba(0,0,0,.35);
    display:flex;flex-direction:column;overflow:hidden;z-index:9999;font-family:'Inter',sans-serif;
    opacity:0;transform:translateY(16px);pointer-events:none;transition:opacity .25s ease,transform .25s ease;}
  .cm-chat-panel.open{opacity:1;transform:translateY(0);pointer-events:auto;}
  .cm-chat-header{background:#0F75BC;color:#fff;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;}
  .cm-chat-header .title{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:.95rem;}
  .cm-chat-header .subtitle{font-size:.7rem;opacity:.85;margin-top:2px;}
  .cm-chat-close{background:none;border:none;color:#fff;cursor:pointer;padding:4px;opacity:.85;}
  .cm-chat-close:hover{opacity:1;}
  .cm-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;}
  .cm-msg{max-width:82%;padding:10px 13px;border-radius:14px;font-size:.87rem;line-height:1.45;white-space:pre-wrap;}
  .cm-msg.bot{background:#fff;border:1px solid #E5E1D6;align-self:flex-start;border-bottom-left-radius:4px;}
  .cm-msg.user{background:#0F75BC;color:#fff;align-self:flex-end;border-bottom-right-radius:4px;}
  .cm-msg.typing{display:flex;gap:4px;align-items:center;}
  .cm-msg.typing span{width:6px;height:6px;border-radius:50%;background:#9a9a94;animation:cm-bounce 1s infinite;}
  .cm-msg.typing span:nth-child(2){animation-delay:.15s;} .cm-msg.typing span:nth-child(3){animation-delay:.3s;}
  @keyframes cm-bounce{0%,60%,100%{transform:translateY(0);opacity:.5;}30%{transform:translateY(-4px);opacity:1;}}
  .cm-load-bar-wrap{padding:0 16px 10px;}
  .cm-load-label{font-size:.7rem;color:#5C5C57;margin-bottom:4px;font-family:'JetBrains Mono',monospace;}
  .cm-load-bar{height:5px;background:#E5E1D6;border-radius:3px;overflow:hidden;}
  .cm-load-bar-fill{height:100%;width:0%;background:#FCB040;transition:width .2s ease;}
  .cm-chat-input-row{display:flex;gap:8px;padding:12px;border-top:1px solid #E5E1D6;background:#fff;}
  .cm-chat-input{flex:1;border:1px solid #E5E1D6;border-radius:24px;padding:10px 14px;font-size:.87rem;
    font-family:'Inter',sans-serif;outline:none;}
  .cm-chat-input:focus{border-color:#25AAE1;}
  .cm-chat-input:disabled{opacity:.5;}
  .cm-chat-send{background:#FCB040;border:none;border-radius:50%;width:38px;height:38px;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s ease;}
  .cm-chat-send:hover{transform:scale(1.06);}
  .cm-chat-send:disabled{opacity:.5;cursor:default;transform:none;}
  .cm-chat-send svg{width:16px;height:16px;color:#18181A;}
  @media (max-width:480px){
    .cm-chat-panel{right:12px;left:12px;width:auto;bottom:88px;}
    .cm-chat-launcher{right:16px;bottom:16px;}
  }
`;
document.head.appendChild(style);

// ---- Markup ----
const launcher = document.createElement("button");
launcher.className = "cm-chat-launcher";
launcher.setAttribute("aria-label", "Open chat with Creativo Milano assistant");
launcher.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.4 8.5 8.5 0 0 1-4-1L3 20l1.1-5.5a8.38 8.38 0 0 1-1-4A8.38 8.38 0 0 1 11.5 2h.5a8.5 8.5 0 0 1 9 8.5z"/></svg>`;

const panel = document.createElement("div");
panel.className = "cm-chat-panel";
panel.innerHTML = `
  <div class="cm-chat-header">
    <div>
      <div class="title">Creativo Milano</div>
      <div class="subtitle">AI runs free, right in your browser</div>
    </div>
    <button class="cm-chat-close" aria-label="Close chat">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
  </div>
  <div class="cm-chat-messages"></div>
  <div class="cm-load-bar-wrap" style="display:none;">
    <div class="cm-load-label">Loading assistant…</div>
    <div class="cm-load-bar"><div class="cm-load-bar-fill"></div></div>
  </div>
  <div class="cm-chat-input-row">
    <input class="cm-chat-input" type="text" placeholder="Type your question..." maxlength="400" disabled>
    <button class="cm-chat-send" aria-label="Send message" disabled>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7Z"/></svg>
    </button>
  </div>
`;

document.body.appendChild(launcher);
document.body.appendChild(panel);

const messagesEl = panel.querySelector(".cm-chat-messages");
const inputEl = panel.querySelector(".cm-chat-input");
const sendBtn = panel.querySelector(".cm-chat-send");
const closeBtn = panel.querySelector(".cm-chat-close");
const loadWrap = panel.querySelector(".cm-load-bar-wrap");
const loadLabel = panel.querySelector(".cm-load-label");
const loadFill = panel.querySelector(".cm-load-bar-fill");

let history = [{ role: "system", content: KNOWLEDGE_BASE }];
let opened = false;
let generator = null;
let modelReady = false;
let modelFailed = false;
let sending = false;

function addMessage(role, text) {
  const el = document.createElement("div");
  el.className = "cm-msg " + (role === "user" ? "user" : "bot");
  el.textContent = text;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

function addTyping() {
  const el = document.createElement("div");
  el.className = "cm-msg bot typing";
  el.innerHTML = "<span></span><span></span><span></span>";
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

async function loadModel() {
  loadWrap.style.display = "block";
  try {
    // Loaded dynamically from CDN — no build step, no npm install needed.
    const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0");

    generator = await pipeline("text-generation", MODEL_ID, {
      dtype: "q4", // quantized for smaller download and faster CPU inference
      progress_callback: (progress) => {
        if (progress.status === "progress" && progress.total) {
          const pct = Math.round((progress.loaded / progress.total) * 100);
          loadFill.style.width = pct + "%";
          loadLabel.textContent = `Loading assistant… ${pct}%`;
        }
      },
    });

    modelReady = true;
    loadWrap.style.display = "none";
    inputEl.disabled = false;
    sendBtn.disabled = false;
    inputEl.placeholder = "Type your question...";
    inputEl.focus();
    addMessage("bot", GREETING);
  } catch (err) {
    modelFailed = true;
    loadWrap.style.display = "none";
    addMessage(
      "bot",
      "This browser or device couldn't load the built-in assistant. Please reach out to us directly using the contact section of the site — we're happy to help."
    );
  }
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || sending || !modelReady) return;

  sending = true;
  sendBtn.disabled = true;
  inputEl.disabled = true;
  inputEl.value = "";
  addMessage("user", text);
  history.push({ role: "user", content: text });
  const typingEl = addTyping();

  try {
    // Keep only the system prompt plus the last few turns — small models handle short context best.
    const trimmedHistory = [history[0], ...history.slice(-6)];

    const output = await generator(trimmedHistory, {
      max_new_tokens: 200,
      temperature: 0.6,
      do_sample: true,
    });

    typingEl.remove();

    const lastTurn = output[0]?.generated_text;
    const reply = Array.isArray(lastTurn) ? lastTurn[lastTurn.length - 1].content : String(lastTurn || "").trim();

    const cleanReply = reply && reply.length > 0 ? reply : "Sorry, could you rephrase that?";
    addMessage("bot", cleanReply);
    history.push({ role: "assistant", content: cleanReply });
  } catch (err) {
    typingEl.remove();
    addMessage("bot", "Something went wrong generating a reply — please try asking again.");
  } finally {
    sending = false;
    sendBtn.disabled = false;
    inputEl.disabled = false;
    inputEl.focus();
  }
}

launcher.addEventListener("click", () => {
  panel.classList.add("open");
  launcher.style.display = "none";
  if (!opened) {
    opened = true;
    if (!modelReady && !modelFailed) loadModel();
  }
});

closeBtn.addEventListener("click", () => {
  panel.classList.remove("open");
  launcher.style.display = "flex";
});

sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
