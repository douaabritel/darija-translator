// content.js — injected into every webpage
// Sends selected text to the background service worker on mouseup.

document.addEventListener("mouseup", () => {
  const selected = window.getSelection().toString().trim();
  if (selected.length > 0) {
    chrome.runtime.sendMessage({ action: "SELECTED_TEXT", text: selected });
  }
});
