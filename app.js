const stickers = [];

const teams = [
  ["México", "MEX"], ["África do Sul", "RSA"], ["Coreia do Sul", "KOR"], ["Rep. Tcheca", "CZE"],
  ["Canadá", "CAN"], ["Bósnia", "BIH"], ["Catar", "QAT"], ["Suíça", "SUI"],
  ["Brasil", "BRA"], ["Marrocos", "MAR"], ["Haiti", "HAI"], ["Escócia", "SCO"],
  ["Estados Unidos", "USA"], ["Paraguai", "PAR"], ["Austrália", "AUS"], ["Turquia", "TUR"],
  ["Alemanha", "GER"], ["Curaçao", "CUW"], ["Costa do Marfim", "CIV"], ["Equador", "ECU"],
  ["Holanda", "NED"], ["Japão", "JPN"], ["Suécia", "SWE"], ["Tunísia", "TUN"],
  ["Bélgica", "BEL"], ["Egito", "EGY"], ["Irã", "IRN"], ["Nova Zelândia", "NZL"],
  ["Espanha", "ESP"], ["Cabo Verde", "CPV"], ["Arábia Saudita", "KSA"], ["Uruguai", "URU"],
  ["França", "FRA"], ["Senegal", "SEN"], ["Iraque", "IRQ"], ["Noruega", "NOR"],
  ["Argentina", "ARG"], ["Argélia", "ALG"], ["Áustria", "AUT"], ["Jordânia", "JOR"],
  ["Portugal", "POR"], ["Congo", "COD"], ["Uzbequistão", "UZB"], ["Colômbia", "COL"],
  ["Inglaterra", "ENG"], ["Croácia", "CRO"], ["Gana", "GHA"], ["Panamá", "PAN"]
];

teams.forEach(([country, code]) => {
  for (let i = 1; i <= 20; i++) {
    stickers.push({ id: `${code}-${i}`, category: "Seleções", country, code, number: i });
  }
});

for (let i = 1; i <= 20; i++) {
  stickers.push({ id: `FWC-${i}`, category: "FIFA", country: "FIFA World Cup", code: "FWC", number: i });
}

for (let i = 1; i <= 14; i++) {
  stickers.push({ id: `CC-${i}`, category: "Coca-Cola", country: "Coca-Cola", code: "CC", number: i });
}

let page = "colecao";
let selectedVoiceItems = [];
let lastPointerDown = 0;
let holdTimer = null;
let activeRecognition = null;
let voiceTranscript = "";
let isRecording = false;
let ignoreNextEnd = false;
let toastTimer = null;

let collection = JSON.parse(localStorage.getItem("figurinhas2026")) || {};
let collapsedCards = JSON.parse(localStorage.getItem("figurinhas2026Collapsed")) || {};

function save() {
  localStorage.setItem("figurinhas2026", JSON.stringify(collection));
}

function saveCollapsedCards() {
  localStorage.setItem("figurinhas2026Collapsed", JSON.stringify(collapsedCards));
}

function statusOf(id) {
  if (!collection[id]) collection[id] = { owned: false, duplicates: 0 };
  return collection[id];
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 3200);
}

function setRecordingUI(active) {
  document.getElementById("voiceBtn").classList.toggle("recording", active);
  document.getElementById("voiceStatus").classList.toggle("hidden", !active);
  document.getElementById("recordingFrame").classList.toggle("hidden", !active);
}

function updateAlbumProgress() {
  const total = stickers.length;
  const owned = stickers.filter(sticker => statusOf(sticker.id).owned).length;
  const percent = total === 0 ? 0 : Math.round((owned / total) * 100);
  document.getElementById("albumProgress").textContent = `${owned}/${total} figurinhas • ${percent}% completo`;
}

function render() {
  updateAlbumProgress();

  document.getElementById("title").textContent = page === "colecao" ? "Figurinhas 2026" : "Repetidas";
  document.getElementById("backBtn").classList.toggle("hidden", page === "colecao");
  document.getElementById("nextBtn").classList.toggle("hidden", page === "repetidas");

  const app = document.getElementById("app");
  app.innerHTML = "";

  const categories = [...new Set(stickers.map(sticker => sticker.category))];

  categories.forEach(category => {
    const categoryTitle = document.createElement("h2");
    categoryTitle.className = "category-title";
    categoryTitle.textContent = category;
    app.appendChild(categoryTitle);

    const countries = [...new Set(stickers.filter(s => s.category === category).map(s => s.country))];

    countries.forEach(country => {
      const countryStickers = stickers.filter(s => s.category === category && s.country === country);
      const visibleStickers = countryStickers.filter(sticker => {
        const status = statusOf(sticker.id);
        return page === "colecao" || status.duplicates > 0;
      });

      if (visibleStickers.length === 0) return;

      const ownedCount = countryStickers.filter(sticker => statusOf(sticker.id).owned).length;
      const percent = Math.round((ownedCount / countryStickers.length) * 100);

      const cardKey = `${category}-${country}`;
      const collapsed = !!collapsedCards[cardKey];

      const card = document.createElement("section");
      card.className = `country-card ${collapsed ? "collapsed" : ""}`;
      card.innerHTML = `
        <div class="country-head">
          <div>
            <div class="country-name">${country}</div>
            <div class="country-subtitle">${ownedCount} de ${countryStickers.length} completas</div>
          </div>

          <div class="country-right">
            <div class="country-progress">${percent}%</div>
            <button class="collapse-btn" aria-label="${collapsed ? "Abrir card" : "Minimizar card"}">${collapsed ? "›" : "⌄"}</button>
          </div>
        </div>

        <div class="card-content ${collapsed ? "hidden-card" : ""}">
          <div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>
          <div class="grid"></div>
        </div>
      `;

      card.querySelector(".collapse-btn").addEventListener("click", event => {
        event.stopPropagation();
        collapsedCards[cardKey] = !collapsedCards[cardKey];
        saveCollapsedCards();
        render();
      });

      const grid = card.querySelector(".grid");

      visibleStickers.forEach(sticker => {
        const status = statusOf(sticker.id);
        const button = document.createElement("button");
        button.className = "sticker";

        if (page === "colecao" && status.owned) button.classList.add("owned");
        if (page === "repetidas") button.classList.add("duplicate");

        button.innerHTML = `${sticker.number}${status.duplicates > 0 ? `<span class="dup-count">${status.duplicates}</span>` : ""}`;

        button.addEventListener("click", () => {
          if (Date.now() - lastPointerDown > 650) return;
          clickSticker(sticker);
        });

        button.addEventListener("pointerdown", () => {
          lastPointerDown = Date.now();
          clearTimeout(holdTimer);
          holdTimer = setTimeout(() => removeSticker(sticker), 650);
        });

        button.addEventListener("pointerup", () => clearTimeout(holdTimer));
        button.addEventListener("pointerleave", () => clearTimeout(holdTimer));
        button.addEventListener("pointercancel", () => clearTimeout(holdTimer));

        grid.appendChild(button);
      });

      app.appendChild(card);
    });
  });
}

function clickSticker(sticker) {
  const status = statusOf(sticker.id);

  if (page === "colecao") {
    if (!status.owned) status.owned = true;
    else status.duplicates++;
  } else {
    status.duplicates = Math.max(0, status.duplicates - 1);
  }

  save();
  render();
}

function removeSticker(sticker) {
  const status = statusOf(sticker.id);

  if (page === "repetidas") {
    status.duplicates = Math.max(0, status.duplicates - 1);
  } else if (status.duplicates > 0) {
    status.duplicates--;
  } else if (status.owned) {
    status.owned = false;
  }

  if (navigator.vibrate) navigator.vibrate(45);
  save();
  render();
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const numberWords = {
  "um": 1, "uma": 1, "primeiro": 1,
  "dois": 2, "duas": 2, "segundo": 2,
  "tres": 3, "terceiro": 3,
  "quatro": 4,
  "cinco": 5,
  "seis": 6,
  "sete": 7,
  "oito": 8,
  "nove": 9,
  "dez": 10,
  "onze": 11,
  "doze": 12,
  "treze": 13,
  "quatorze": 14, "catorze": 14,
  "quinze": 15,
  "dezesseis": 16, "dezaseis": 16,
  "dezessete": 17, "dezasete": 17,
  "dezoito": 18,
  "dezenove": 19,
  "vinte": 20
};

function numberFromToken(token) {
  if (/^\d+$/.test(token)) return Number(token);
  return numberWords[token] || null;
}

function allCountryAliases() {
  const aliases = [];
  teams.forEach(([name, code]) => {
    aliases.push({ country: name, alias: normalizeText(name).split(" ") });
    aliases.push({ country: name, alias: [code.toLowerCase()] });
  });
  aliases.push({ country: "FIFA World Cup", alias: ["fifa"] });
  aliases.push({ country: "FIFA World Cup", alias: ["world", "cup"] });
  aliases.push({ country: "Coca-Cola", alias: ["coca"] });
  aliases.push({ country: "Coca-Cola", alias: ["coca-cola"] });
  aliases.push({ country: "Coca-Cola", alias: ["cola"] });
  return aliases.sort((a, b) => b.alias.length - a.alias.length);
}

const countryAliases = allCountryAliases();

function matchCountryAt(tokens, index) {
  for (const item of countryAliases) {
    const part = tokens.slice(index, index + item.alias.length);
    if (part.join(" ") === item.alias.join(" ")) return item;
  }
  return null;
}

function parseVoice(text) {
  const clean = normalizeText(text);
  const tokens = clean.split(" ").filter(Boolean);
  const found = new Map();
  let currentCountry = null;

  for (let i = 0; i < tokens.length; i++) {
    const countryMatch = matchCountryAt(tokens, i);
    if (countryMatch) {
      currentCountry = countryMatch.country;
      i += countryMatch.alias.length - 1;
      continue;
    }

    const num = numberFromToken(tokens[i]);
    if (currentCountry && num) {
      const valid = stickers.some(s => s.country === currentCountry && s.number === num);
      if (valid) {
        if (!found.has(currentCountry)) found.set(currentCountry, new Set());
        found.get(currentCountry).add(num);
      }
    }
  }

  return [...found.entries()].map(([country, set]) => ({
    country,
    numbers: [...set].sort((a, b) => a - b)
  }));
}

async function startVoiceRecording(event) {
  event.preventDefault();

  // PRIMEIRO CLIQUE = pedir permissão
  try {
    await navigator.mediaDevices.getUserMedia({
      audio: true
    });
  } catch (err) {
    showToast("Permita acesso ao microfone");
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    showToast("Seu navegador não suporta reconhecimento de voz");
    return;
  }

  voiceTranscript = "";
  isRecording = true;

  setRecordingUI(true);

  activeRecognition = new SpeechRecognition();

  activeRecognition.lang = "pt-BR";
  activeRecognition.continuous = true;
  activeRecognition.interimResults = true;
  activeRecognition.maxAlternatives = 1;

  activeRecognition.onresult = (event) => {
    let finalText = "";

    for (let i = 0; i < event.results.length; i++) {
      finalText += event.results[i][0].transcript + " ";
    }

    voiceTranscript = finalText.trim();
  };

  activeRecognition.onerror = (event) => {
    console.log("VOICE ERROR:", event.error);

    // ignora erro ao soltar botão
    if (
      event.error === "aborted" ||
      event.error === "no-speech"
    ) {
      return;
    }

    showToast("Erro no reconhecimento de voz");
    cleanupVoice();
  };

  activeRecognition.onend = () => {
    if (isRecording) {
      finishVoiceRecording();
    }
  };

  try {
    activeRecognition.start();
  } catch (err) {
    console.log(err);
    showToast("Não foi possível iniciar o microfone");
  }
}

function showToast(text) {
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast hidden";
    document.body.appendChild(toast);
  }

  toast.textContent = text;
  toast.classList.remove("hidden");
  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
    toast.classList.remove("show");
  }, 2500);
}

function stopVoiceRecording(event) {
  event.preventDefault();

  if (!isRecording) return;

  isRecording = false;

  try {
    activeRecognition.stop();
  } catch (err) {}

  setTimeout(() => {
    finishVoiceRecording();
  }, 250);
}

function cleanupVoice() {
  isRecording = false;
  setRecordingUI(false);

  if (activeRecognition) {
    try {
      activeRecognition.abort();
    } catch (err) {}
  }

  activeRecognition = null;
}

function finishVoiceRecording() {
  const recognition = activeRecognition;
  cleanupVoice();

  if (recognition) {
    try {
      ignoreNextEnd = true;
      recognition.stop();
    } catch (error) {}
  }

  if (!voiceTranscript) {
    showToast("Não ouvi nada. Segure o botão, fale e solte.");
    return;
  }

  selectedVoiceItems = parseVoice(voiceTranscript);

  if (selectedVoiceItems.length === 0) {
    showToast('Não detectei figurinhas. Exemplo: "Brasil 2 Brasil 3 Brasil 4".');
    return;
  }

  openVoiceModal(voiceTranscript);
}

function openVoiceModal(transcript) {
  document.getElementById("voiceModal").classList.remove("hidden");
  document.getElementById("modalTitle").textContent = "Conferir gravação";
  document.getElementById("modalText").textContent = `Entendi: “${transcript}”`;
  renderModalNumbers();
}

function renderModalNumbers() {
  const grid = document.getElementById("modalGrid");
  grid.innerHTML = "";

  selectedVoiceItems.forEach(item => {
    const group = document.createElement("div");
    group.className = "modal-group";
    group.innerHTML = `<strong>${item.country}</strong><div class="modal-numbers"></div>`;

    const numbers = group.querySelector(".modal-numbers");
    item.numbers.forEach(number => {
      const button = document.createElement("button");
      button.className = "modal-num selected";
      button.textContent = number;
      button.onclick = () => {
        item.numbers = item.numbers.filter(n => n !== number);
        selectedVoiceItems = selectedVoiceItems.filter(group => group.numbers.length > 0);
        renderModalNumbers();
      };
      numbers.appendChild(button);
    });

    grid.appendChild(group);
  });
}

function confirmModalNumbers() {
  selectedVoiceItems.forEach(item => {
    item.numbers.forEach(number => {
      const sticker = stickers.find(s => s.country === item.country && s.number === number);
      if (!sticker) return;

      const status = statusOf(sticker.id);
      if (status.owned) status.duplicates++;
      else status.owned = true;
    });
  });

  save();
  closeModal();
  render();
}

function closeModal() {
  document.getElementById("voiceModal").classList.add("hidden");
  selectedVoiceItems = [];
}

document.getElementById("nextBtn").onclick = () => { page = "repetidas"; render(); };
document.getElementById("backBtn").onclick = () => { page = "colecao"; render(); };

const voiceBtn = document.getElementById("voiceBtn");
voiceBtn.addEventListener("pointerdown", startVoiceRecording);
voiceBtn.addEventListener("pointerup", stopVoiceRecording);
voiceBtn.addEventListener("pointercancel", stopVoiceRecording);
voiceBtn.addEventListener("pointerleave", event => {
  if (isRecording) stopVoiceRecording(event);
});

document.getElementById("modalConfirm").onclick = confirmModalNumbers;
document.getElementById("modalClose").onclick = closeModal;

render();

