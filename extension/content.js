/**
 * Content Script - Manga Translator
 *
 * Lógica completa:
 * 1. Escuta a mensagem ACTIVATE_SELECTION do background.js
 * 2. Cria um overlay transparente com cursor de mira (crosshair)
 * 3. Permite o usuário desenhar um retângulo de seleção
 * 4. Captura a área selecionada usando Canvas
 * 5. Envia o Base64 para o backend via fetch
 * 6. Exibe a tradução posicionada sobre o balão original
 */

// ============================================================
// CONFIGURAÇÃO - URL do seu backend
// ============================================================
const API_URL = "http://localhost:8080/api/manga/translate";

// Evita injetar múltiplas vezes
if (window.__mangaTranslatorLoaded) {
  // Se já foi carregado, apenas reativa o modo de seleção
  activateSelection();
} else {
  window.__mangaTranslatorLoaded = true;
  init();
}

function init() {
  // Escuta mensagens do background.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "ACTIVATE_SELECTION") {
      activateSelection();
    }
  });
}

// ============================================================
// PASSO 4: OVERLAY + SELEÇÃO DE ÁREA
// ============================================================

function activateSelection() {
  // Remove overlay anterior se existir
  removeOverlay();

  // Cria o overlay transparente que cobre toda a página
  const overlay = document.createElement("div");
  overlay.id = "manga-translator-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    cursor: crosshair;
    z-index: 999999;
    background: rgba(0, 0, 0, 0.15);
  `;

  // Caixa de seleção (retângulo pontilhado)
  const selectionBox = document.createElement("div");
  selectionBox.id = "manga-translator-selection";
  selectionBox.style.cssText = `
    position: fixed;
    border: 2px dashed #ff4444;
    background: rgba(255, 68, 68, 0.08);
    display: none;
    z-index: 1000000;
    pointer-events: none;
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(selectionBox);

  // Variáveis de estado do mouse
  let isSelecting = false;
  let startX = 0;
  let startY = 0;

  // --- MOUSEDOWN: Início da seleção ---
  overlay.addEventListener("mousedown", (e) => {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;

    selectionBox.style.left = startX + "px";
    selectionBox.style.top = startY + "px";
    selectionBox.style.width = "0px";
    selectionBox.style.height = "0px";
    selectionBox.style.display = "block";
  });

  // --- MOUSEMOVE: Desenha o retângulo ---
  overlay.addEventListener("mousemove", (e) => {
    if (!isSelecting) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    selectionBox.style.left = left + "px";
    selectionBox.style.top = top + "px";
    selectionBox.style.width = width + "px";
    selectionBox.style.height = height + "px";
  });

  // --- MOUSEUP: Fim da seleção → Captura ---
  overlay.addEventListener("mouseup", (e) => {
    if (!isSelecting) return;
    isSelecting = false;

    const endX = e.clientX;
    const endY = e.clientY;

    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    // Remove o overlay e a caixa de seleção
    removeOverlay();

    // Ignora seleções muito pequenas (clique acidental)
    if (width < 10 || height < 10) {
      console.log("Seleção muito pequena, ignorada.");
      return;
    }

    // Captura a área selecionada
    captureAndTranslate(left, top, width, height);
  });

  // --- ESC: Cancela a seleção ---
  const escHandler = (e) => {
    if (e.key === "Escape") {
      removeOverlay();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);
}

function removeOverlay() {
  const overlay = document.getElementById("manga-translator-overlay");
  const selection = document.getElementById("manga-translator-selection");
  if (overlay) overlay.remove();
  if (selection) selection.remove();
}

// ============================================================
// PASSO 4 (cont.): CAPTURA COM CANVAS
// ============================================================

async function captureAndTranslate(left, top, width, height) {
  try {
    // 1. Pede o screenshot ANTES de mostrar o loading (para não capturar o texto "Traduzindo...")
    const response = await chrome.runtime.sendMessage({ action: "CAPTURE_SCREENSHOT" });

    // Só agora mostra o loading, depois que o screenshot já foi tirado
    const loadingDiv = showLoading(left, top, width, height);

    if (!response || !response.screenshotDataUrl) {
      throw new Error("Falha ao capturar screenshot da aba.");
    }

    // 2. Carrega o screenshot numa imagem
    const img = new Image();
    img.src = response.screenshotDataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    // 3. Recorta apenas a área selecionada usando Canvas
    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement("canvas");
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");

    // O screenshot já vem em resolução real (com devicePixelRatio aplicado)
    ctx.drawImage(
      img,
      left * dpr, top * dpr, width * dpr, height * dpr,
      0, 0, width * dpr, height * dpr
    );

    // 4. Gera o Base64 da área recortada
    const base64Full = canvas.toDataURL("image/png");
    const base64Data = base64Full.split(",")[1];

    console.log("Base64 gerado, tamanho:", base64Data.length, "caracteres");

    // 5. Envia para o backend
    const apiResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        imageBase64: base64Data
      })
    });

    if (!apiResponse.ok) {
      throw new Error(`Erro HTTP: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();

    // Remove o loading
    loadingDiv.remove();

    // 6. Exibe a tradução sobre o balão
    if (data.translatedText) {
      showTranslation(left, top, width, height, data.translatedText);
    } else {
      showError(left, top, "Nenhum texto encontrado.");
    }

  } catch (err) {
    console.error("Erro no Manga Translator:", err);
    const loading = document.getElementById("manga-translator-loading");
    if (loading) loading.remove();
    showError(left, top, "Erro: " + err.message);
  }
}

// ============================================================
// PASSO 5 (cont.): FEEDBACK VISUAL
// ============================================================

function showLoading(left, top, width, height) {
  const div = document.createElement("div");
  div.id = "manga-translator-loading";
  div.style.cssText = `
    position: fixed;
    left: ${left}px;
    top: ${top}px;
    width: ${width}px;
    height: ${height}px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    background: rgba(30, 25, 50, 0.7);
    border-radius: 4px;
    z-index: 1000001;
    font-family: Arial, sans-serif;
    font-size: 14px;
    color: #f0edff;
    font-weight: bold;
  `;
  div.textContent = "Traduzindo...";
  document.body.appendChild(div);
  return div;
}

function showTranslation(left, top, width, height, text) {
  const container = document.createElement("div");
  container.className = "manga-translator-result";
  container.style.cssText = `
    position: fixed;
    left: ${left}px;
    top: ${top}px;
    width: ${width}px;
    height: ${height}px;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    background: rgba(30, 25, 50, 0.7);
    border-radius: 4px;
    z-index: 1000001;
    font-family: Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    transition: opacity 0.3s ease;
    padding: 6px;
    box-sizing: border-box;
  `;

  // Texto traduzido com auto-ajuste de tamanho
  const textDiv = document.createElement("div");
  textDiv.style.cssText = `
    color: #f0edff;
    font-weight: 600;
    line-height: 1.35;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
    max-height: 100%;
    overflow: hidden;
  `;
  textDiv.textContent = text;

  container.appendChild(textDiv);
  document.body.appendChild(container);

  // Auto-ajuste: reduz a fonte até o texto caber na área
  let fontSize = Math.min(32, Math.max(12, height * 0.25));
  textDiv.style.fontSize = fontSize + "px";

  while (
      (textDiv.scrollHeight > height - 12 || textDiv.scrollWidth > width - 12) &&
      fontSize > 8
      ) {
    fontSize -= 1;
    textDiv.style.fontSize = fontSize + "px";
  }

  // Clique simples para fechar com fade-out
  container.addEventListener("click", () => {
    container.style.opacity = "0";
    setTimeout(() => container.remove(), 300);
  });
}

function showError(left, top, message) {
  const div = document.createElement("div");
  div.style.cssText = `
    position: fixed;
    left: ${left}px;
    top: ${top}px;
    background: #fff3f3;
    border: 2px solid #e74c3c;
    border-radius: 4px;
    z-index: 1000001;
    font-family: Arial, sans-serif;
    font-size: 13px;
    color: #e74c3c;
    padding: 10px 14px;
    max-width: 300px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  `;
  div.textContent = message;
  document.body.appendChild(div);

  // Auto-remove após 4 segundos
  setTimeout(() => div.remove(), 4000);
}
