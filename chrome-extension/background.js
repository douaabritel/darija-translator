// background.js — Manifest V3 service worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translate-darija",
    title: "Translate to Darija 🇲🇦",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "translate-darija" && info.selectionText) {
    await chrome.sidePanel.open({ tabId: tab.id });
    // Allow the side panel to initialize before sending the message
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: "TRANSLATE_SELECTION",
        text: info.selectionText.trim()
      });
    }, 400);
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});

// Relay selected-text messages from content script to side panel
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "SELECTED_TEXT") {
    chrome.runtime.sendMessage({
      action: "TRANSLATE_SELECTION",
      text: message.text
    });
  }
});
