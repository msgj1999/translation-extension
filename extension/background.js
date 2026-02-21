/**
 * Background Service Worker (Manifest V3)
 *
 * 1. Escuta o clique no ícone → injeta o content.js
 * 2. Escuta pedidos de screenshot do content.js → usa captureVisibleTab
 */

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
    console.log("content.js injetado na aba:", tab.id);
  } catch (err) {
    console.error("Erro ao injetar content.js:", err);
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { action: "ACTIVATE_SELECTION" });
    console.log("Mensagem ACTIVATE_SELECTION enviada.");
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
  }
});

// Escuta pedidos de screenshot vindos do content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "CAPTURE_SCREENSHOT") {
    chrome.tabs.captureVisibleTab(
      sender.tab.windowId,
      { format: "png" },
      (dataUrl) => {
        sendResponse({ screenshotDataUrl: dataUrl });
      }
    );
    // Retorna true para indicar que sendResponse será chamado de forma assíncrona
    return true;
  }
});