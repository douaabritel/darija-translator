// sidepanel.js

const DEFAULT_SERVER = "http://localhost:8080";
const API_PATH = "/darija-translator/api/translator/translate";

const inpText      = document.getElementById("inp-text");
const inpUsername  = document.getElementById("inp-username");
const inpPassword  = document.getElementById("inp-password");
const inpServer    = document.getElementById("inp-server");
const selLang      = document.getElementById("sel-lang");
const output       = document.getElementById("output");
const spinner      = document.getElementById("spinner");
const errorMsg     = document.getElementById("error-msg");
const btnTranslate = document.getElementById("btn-translate");
const btnClear     = document.getElementById("btn-clear");
const btnSpeak     = document.getElementById("btn-speak");
const btnCopy      = document.getElementById("btn-copy");
const btnSaveAuth  = document.getElementById("btn-save-auth");

chrome.storage.local.get(["username", "password", "server"], (data) => {
  inpUsername.value = data.username || "";
  inpPassword.value = data.password || "";
  inpServer.value   = data.server   || DEFAULT_SERVER;
});

btnSaveAuth.addEventListener("click", () => {
  chrome.storage.local.set({
    username: inpUsername.value.trim(),
    password: inpPassword.value,
    server:   inpServer.value.trim()
  });
  btnSaveAuth.textContent = "Saved ✓";
  setTimeout(() => { btnSaveAuth.textContent = "Save Settings"; }, 1500);
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "TRANSLATE_SELECTION" && message.text) {
    inpText.value = message.text;
    triggerTranslation();
  }
});

btnTranslate.addEventListener("click", triggerTranslation);
inpText.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") triggerTranslation();
});

btnClear.addEventListener("click", () => {
  inpText.value = "";
  output.innerHTML = '<span class="placeholder-text">Translation will appear here…</span>';
  btnSpeak.disabled = true;
  hideError();
});

btnCopy.addEventListener("click", () => {
  const text = output.innerText;
  if (text && !text.includes("Translation will appear")) {
    navigator.clipboard.writeText(text).then(() => {
      btnCopy.textContent = "Copied ✓";
      setTimeout(() => { btnCopy.textContent = "Copy نسخ"; }, 1500);
    });
  }
});

btnSpeak.addEventListener("click", () => {
  const text = output.innerText;
  if (!text || text.includes("Translation will appear")) return;
  chrome.tts.speak(text, {
    lang: "ar-MA",
    rate: 0.9,
    onEvent: (event) => {
      if (event.type === "end" || event.type === "error") btnSpeak.textContent = "🔊";
    }
  });
  btnSpeak.textContent = "⏸";
});

async function triggerTranslation() {
  const text     = inpText.value.trim();
  const username = inpUsername.value.trim();
  const password = inpPassword.value;
  const server   = inpServer.value.trim() || DEFAULT_SERVER;

  if (!text) { showError("Please enter text to translate."); return; }
  if (!username || !password) { showError("Please enter your credentials in Settings."); return; }

  hideError();
  setLoading(true);
  output.innerHTML = "";

  try {
    const response = await fetch(server + API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(`${username}:${password}`)}`
      },
      body: JSON.stringify({ text, sourceLanguage: selLang.value })
    });

    if (response.status === 401) { showError("Authentication failed. Check your credentials."); return; }

    const data = await response.json();
    if (data.success && data.translatedText) {
      output.textContent = data.translatedText;
      btnSpeak.disabled = false;
    } else {
      showError(data.errorMessage || "Translation failed.");
    }
  } catch (err) {
    showError(`Connection error: ${err.message}`);
  } finally {
    setLoading(false);
  }
}

function setLoading(active) {
  spinner.classList.toggle("active", active);
  btnTranslate.disabled = active;
  btnTranslate.textContent = active ? "Translating…" : "Translate ترجم";
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.add("visible");
}

function hideError() {
  errorMsg.textContent = "";
  errorMsg.classList.remove("visible");
}
