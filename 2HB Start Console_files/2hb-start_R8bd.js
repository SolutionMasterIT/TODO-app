const clock = document.querySelector("#clock");
const dateLine = document.querySelector("#dateLine");
const greeting = document.querySelector("#greeting");
const year = document.querySelector("#year");
const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");
const suggestionsBox = document.querySelector("#searchSuggestions");
const cards = document.querySelectorAll(".app-card, .mini-card, .project-card, .ai-card");
const colorPlane = document.querySelector("#colorPlane");
const hueSlider = document.querySelector("#hueSlider");
const colorSwatch = document.querySelector("#colorSwatch");
const hexValue = document.querySelector("#hexValue");
const rgbValue = document.querySelector("#rgbValue");
const hslValue = document.querySelector("#hslValue");
const calcDisplay = document.querySelector("#calcDisplay");
const calcGrid = document.querySelector(".calc-grid");
const translateText = document.querySelector("#translateText");
const translateButton = document.querySelector("#translateButton");
const translateNowButton = document.querySelector("#translateNowButton");
const translationOutput = document.querySelector("#translationOutput");
const translateStatus = document.querySelector("#translateStatus");

const formatDate = new Intl.DateTimeFormat("hu-HU", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
});

function updateTime() {
  const now = new Date();
  const hours = now.getHours();
  clock.textContent = now.toLocaleTimeString("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  dateLine.textContent = formatDate.format(now);
  greeting.textContent = hours < 5 ? "Éjszakai műszak" : hours < 12 ? "Jó reggelt" : hours < 18 ? "Szép napot" : "Szép estét";
}

updateTime();
setInterval(updateTime, 1000);
year.textContent = `${new Date().getFullYear()} ©`;

cards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (card.classList.contains("soon-card")) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateX = ((y / rect.height) - .5) * -7;
    const rotateY = ((x / rect.width) - .5) * 7;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-7px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

window.addEventListener("keydown", (event) => {
  const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
  if (event.key === "/" && !isTyping) {
    event.preventDefault();
    searchInput.focus();
  }
});

let suggestionItems = [];
let activeSuggestion = -1;
let suggestTimer = 0;
let suggestRequest = 0;

function searchGoogle(query) {
  const term = query.trim();
  if (!term) return;
  window.open(`https://www.google.com/search?q=${encodeURIComponent(term)}`, "_blank", "noopener");
}

function clearSuggestions() {
  suggestionsBox.hidden = true;
  suggestionsBox.innerHTML = "";
  searchInput.removeAttribute("aria-activedescendant");
  suggestionItems = [];
  activeSuggestion = -1;
}

function setActiveSuggestion(index) {
  activeSuggestion = index;
  suggestionItems.forEach((button, buttonIndex) => {
    const isActive = buttonIndex === activeSuggestion;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  if (suggestionItems[activeSuggestion]) {
    searchInput.setAttribute("aria-activedescendant", suggestionItems[activeSuggestion].id);
  } else {
    searchInput.removeAttribute("aria-activedescendant");
  }
}

function renderSuggestions(list) {
  const unique = [...new Set(list)].slice(0, 8);
  if (!unique.length) {
    clearSuggestions();
    return;
  }

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));

  suggestionsBox.innerHTML = unique.map((item, index) => (
    `<button class="suggestion-item" id="suggestion-${index}" type="button" role="option" aria-selected="false">${escapeHtml(item)}</button>`
  )).join("");

  suggestionItems = [...suggestionsBox.querySelectorAll(".suggestion-item")];
  suggestionItems.forEach((button) => {
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      searchInput.value = button.textContent;
      clearSuggestions();
      searchGoogle(button.textContent);
    });
  });

  suggestionsBox.hidden = false;
  setActiveSuggestion(-1);
}

function requestGoogleSuggestions(query) {
  const requestId = ++suggestRequest;
  const callbackName = `__twoHbSuggest${Date.now()}${Math.random().toString(36).slice(2)}`;
  const script = document.createElement("script");
  let finished = false;

  function finish(list) {
    if (finished) return;
    finished = true;
    script.remove();
    delete window[callbackName];
    if (requestId === suggestRequest) renderSuggestions(list);
  }

  window[callbackName] = (payload) => {
    finish(Array.isArray(payload?.[1]) ? payload[1] : []);
  };

  script.onerror = () => finish([]);
  script.src = `https://suggestqueries.google.com/complete/search?client=firefox&hl=hu&gl=hu&callback=${callbackName}&q=${encodeURIComponent(query)}`;
  document.head.appendChild(script);
  window.setTimeout(() => finish([]), 3500);
}

searchInput.addEventListener("input", () => {
  const value = searchInput.value.trim();
  window.clearTimeout(suggestTimer);

  if (value.length < 2) {
    clearSuggestions();
    return;
  }

  suggestTimer = window.setTimeout(() => {
    requestGoogleSuggestions(value);
  }, 180);
});

searchInput.addEventListener("focus", () => {
  if (searchInput.value.trim().length >= 2 && !suggestionItems.length) {
    requestGoogleSuggestions(searchInput.value.trim());
  }
});

searchInput.addEventListener("blur", () => {
  window.setTimeout(clearSuggestions, 160);
});

searchInput.addEventListener("keydown", (event) => {
  if (suggestionsBox.hidden || !suggestionItems.length) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    setActiveSuggestion((activeSuggestion + 1) % suggestionItems.length);
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    setActiveSuggestion(activeSuggestion <= 0 ? suggestionItems.length - 1 : activeSuggestion - 1);
  }

  if (event.key === "Enter" && activeSuggestion >= 0) {
    event.preventDefault();
    const selected = suggestionItems[activeSuggestion].textContent;
    searchInput.value = selected;
    clearSuggestions();
    searchGoogle(selected);
  }

  if (event.key === "Escape") {
    clearSuggestions();
  }
});

searchForm.addEventListener("submit", (event) => {
  if (!searchInput.value.trim()) event.preventDefault();
});

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

function rgbToHsl({ r, g, b }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > .5 ? d / (2 - max - min) : d / (max + min);
    if (max === red) h = (green - blue) / d + (green < blue ? 6 : 0);
    if (max === green) h = (blue - red) / d + 2;
    if (max === blue) h = (red - green) / d + 4;
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;

  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];

  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255)
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

let selectedColor = { h: 266, s: .52, v: 1 };

function drawColorPlane() {
  const context = colorPlane.getContext("2d");
  const width = colorPlane.width;
  const height = colorPlane.height;
  const hue = Number(hueSlider.value);
  const base = hsvToRgb(hue, 1, 1);

  context.fillStyle = `rgb(${base.r}, ${base.g}, ${base.b})`;
  context.fillRect(0, 0, width, height);

  const whiteGradient = context.createLinearGradient(0, 0, width, 0);
  whiteGradient.addColorStop(0, "rgba(255,255,255,1)");
  whiteGradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = whiteGradient;
  context.fillRect(0, 0, width, height);

  const blackGradient = context.createLinearGradient(0, 0, 0, height);
  blackGradient.addColorStop(0, "rgba(0,0,0,0)");
  blackGradient.addColorStop(1, "rgba(0,0,0,1)");
  context.fillStyle = blackGradient;
  context.fillRect(0, 0, width, height);

  const x = selectedColor.s * width;
  const y = (1 - selectedColor.v) * height;
  context.beginPath();
  context.arc(x, y, 7, 0, Math.PI * 2);
  context.strokeStyle = "#fff";
  context.lineWidth = 3;
  context.stroke();
  context.beginPath();
  context.arc(x, y, 10, 0, Math.PI * 2);
  context.strokeStyle = "rgba(0,0,0,.45)";
  context.lineWidth = 2;
  context.stroke();
}

function updateColorValues() {
  selectedColor.h = Number(hueSlider.value);
  const rgb = hsvToRgb(selectedColor.h, selectedColor.s, selectedColor.v);
  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  colorSwatch.style.background = hex;
  colorSwatch.style.boxShadow = `inset 0 0 0 1px rgba(255,255,255,.08), 0 0 42px ${hex}66`;
  hexValue.value = hex;
  rgbValue.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  hslValue.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  drawColorPlane();
}

function setColorFromPlane(event) {
  const rect = colorPlane.getBoundingClientRect();
  const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
  const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
  selectedColor.s = x / rect.width;
  selectedColor.v = 1 - (y / rect.height);
  updateColorValues();
}

function setColorFromHex(hex) {
  const rgb = hexToRgb(hex);
  const red = rgb.r / 255;
  const green = rgb.g / 255;
  const blue = rgb.b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === red) h = 60 * (((green - blue) / delta) % 6);
    if (max === green) h = 60 * ((blue - red) / delta + 2);
    if (max === blue) h = 60 * ((red - green) / delta + 4);
  }
  if (h < 0) h += 360;
  selectedColor = {
    h,
    s: max === 0 ? 0 : delta / max,
    v: max
  };
  hueSlider.value = String(Math.round(h));
  updateColorValues();
}

function calculateExpression(expression) {
  const safeExpression = expression.replace(/,/g, ".").replace(/%/g, "/100");
  if (!/^[0-9+\-*/().\s]+$/.test(safeExpression)) return "Hiba";
  try {
    const result = Function(`"use strict"; return (${safeExpression})`)();
    return Number.isFinite(result) ? String(Math.round(result * 1e10) / 1e10) : "Hiba";
  } catch {
    return "Hiba";
  }
}

hueSlider.addEventListener("input", updateColorValues);
colorPlane.addEventListener("pointerdown", (event) => {
  colorPlane.setPointerCapture(event.pointerId);
  setColorFromPlane(event);
});
colorPlane.addEventListener("pointermove", (event) => {
  if (event.buttons === 1) setColorFromPlane(event);
});
document.querySelectorAll("[data-color]").forEach((button) => {
  button.addEventListener("click", () => setColorFromHex(button.dataset.color));
});
updateColorValues();

calcGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-calc]");
  if (!button) return;
  const value = button.dataset.calc;

  if (value === "clear") {
    calcDisplay.value = "";
    return;
  }

  if (value === "back") {
    calcDisplay.value = calcDisplay.value.slice(0, -1);
    return;
  }

  if (value === "=") {
    calcDisplay.value = calculateExpression(calcDisplay.value);
    return;
  }

  calcDisplay.value += value;
  calcDisplay.focus();
});

calcDisplay.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    calcDisplay.value = calculateExpression(calcDisplay.value);
  }
});

translateButton.addEventListener("click", () => {
  const text = translateText.value.trim();
  const url = new URL("https://translate.google.com/");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", "hu");
  url.searchParams.set("text", text || "Hello, how are you?");
  url.searchParams.set("op", "translate");
  window.open(url.toString(), "_blank", "noopener");
});

let translateTimer = 0;
let translateRequest = 0;

async function translateInline() {
  const text = translateText.value.trim();
  const requestId = ++translateRequest;
  if (!text) {
    translationOutput.textContent = "Ide kerül a magyar fordítás.";
    translateStatus.textContent = "Alapértelmezés: angolról magyarra, Google motorral.";
    return;
  }

  translateStatus.textContent = "Fordítás folyamatban...";
  try {
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "en");
    url.searchParams.set("tl", "hu");
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", text);
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("Translate request failed");
    const payload = await response.json();
    const translated = Array.isArray(payload?.[0])
      ? payload[0].map((part) => part?.[0]).filter(Boolean).join("")
      : "";
    if (requestId !== translateRequest) return;
    translationOutput.textContent = translated || "Nem érkezett fordítás.";
    translateStatus.textContent = "Google gyorsfordítás EN → HU.";
  } catch {
    if (requestId !== translateRequest) return;
    translationOutput.textContent = "A gyorsfordítás most nem elérhető. Nyisd meg a Google Fordítót a gombbal.";
    translateStatus.textContent = "Nem sikerült helyben fordítani.";
  }
}

translateText.addEventListener("input", () => {
  window.clearTimeout(translateTimer);
  translateTimer = window.setTimeout(translateInline, 550);
});
translateNowButton.addEventListener("click", translateInline);

const canvas = document.querySelector("#matrix");
const ctx = canvas.getContext("2d");
let width = 0;
let height = 0;
let nodes = [];

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.min(90, Math.max(36, Math.floor(width / 22)));
  nodes = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - .5) * .24,
    vy: (Math.random() - .5) * .24,
    r: Math.random() * 1.8 + .8
  }));
}

function drawNetwork() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(60, 255, 147, .52)";
  ctx.strokeStyle = "rgba(139, 66, 255, .16)";
  ctx.lineWidth = 1;

  nodes.forEach((node, index) => {
    node.x += node.vx;
    node.y += node.vy;

    if (node.x < -20) node.x = width + 20;
    if (node.x > width + 20) node.x = -20;
    if (node.y < -20) node.y = height + 20;
    if (node.y > height + 20) node.y = -20;

    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fill();

    for (let i = index + 1; i < nodes.length; i++) {
      const other = nodes[i];
      const dx = node.x - other.x;
      const dy = node.y - other.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 145) {
        ctx.globalAlpha = (145 - distance) / 145;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  });

  requestAnimationFrame(drawNetwork);
}

resizeCanvas();
drawNetwork();
window.addEventListener("resize", resizeCanvas);
