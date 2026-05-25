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

let toastTimer = null;

let collection = safeJsonParse(localStorage.getItem("figurinhas2026"), {});
let collapsedCards = safeJsonParse(localStorage.getItem("figurinhas2026Collapsed"), {});
let hideOwned = safeJsonParse(localStorage.getItem("figurinhas2026OcultarColadas"), false);
let sortAlpha = safeJsonParse(localStorage.getItem("figurinhas2026SortAlpha"), false);

function safeJsonParse(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
}

function save() {
  localStorage.setItem("figurinhas2026", JSON.stringify(collection));
}

function saveCollapsedCards() {
  localStorage.setItem("figurinhas2026Collapsed", JSON.stringify(collapsedCards));
}

function saveHideOwned() {
  localStorage.setItem("figurinhas2026OcultarColadas", JSON.stringify(hideOwned));
}

function saveSortAlpha() {
  localStorage.setItem("figurinhas2026SortAlpha", JSON.stringify(sortAlpha));
}

function statusOf(id) {
  if (!collection[id]) collection[id] = { owned: false };
  if (typeof collection[id].owned !== "boolean") collection[id].owned = false;
  return collection[id];
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
    toast.classList.remove("show");
  }, 2600);
}

function updateAlbumProgress() {
  const total = stickers.length;
  const owned = stickers.filter(s => statusOf(s.id).owned).length;
  const missing = total - owned;
  const percent = total === 0 ? 0 : Math.round((owned / total) * 100);
  document.getElementById("albumProgress").textContent =
    `${owned}/${total} coladas • ${missing} faltantes • ${percent}%`;
}

function updateControls() {
  const hideOwnedToggle = document.getElementById("hideOwnedToggle");
  if (hideOwnedToggle) hideOwnedToggle.checked = hideOwned;
  const sortAlphaToggle = document.getElementById("sortAlphaToggle");
  if (sortAlphaToggle) sortAlphaToggle.checked = sortAlpha;
}

// Returns grouped structure: [{ category, countries[] }]
// Only Seleções are sorted alphabetically when sortAlpha is on
function getGroupedCountries() {
  const categories = [...new Set(stickers.map(s => s.category))];
  return categories.map(category => {
    const countries = [...new Set(
      stickers.filter(s => s.category === category).map(s => s.country)
    )];
    if (sortAlpha && category === "Seleções") {
      countries.sort((a, b) => a.localeCompare(b, "pt-BR"));
    }
    return { category, countries };
  });
}

// Build the A-Z sidebar (only shown when sortAlpha is on, only indexes Seleções)
function buildAlphaSidebar(selecaoCountries) {
  const existingSidebar = document.getElementById("alphaSidebar");
  if (existingSidebar) existingSidebar.remove();
  const existingBubble = document.getElementById("alphaBubble");
  if (existingBubble) existingBubble.remove();

  if (!sortAlpha) return;

  const letters = [...new Set(
    selecaoCountries.map(c => {
      const ch = c.normalize("NFD")[0].toUpperCase();
      return /[A-Z]/.test(ch) ? ch : "#";
    })
  )].sort();

  const sidebar = document.createElement("div");
  sidebar.id = "alphaSidebar";
  sidebar.className = "alpha-sidebar";

  letters.forEach(letter => {
    const span = document.createElement("span");
    span.textContent = letter;
    span.dataset.letter = letter;
    sidebar.appendChild(span);
  });

  document.body.appendChild(sidebar);

  const bubble = document.createElement("div");
  bubble.id = "alphaBubble";
  bubble.className = "alpha-bubble hidden";
  document.body.appendChild(bubble);

  let isActive = false;

  function getLetterAt(clientY) {
    const spans = sidebar.querySelectorAll("span");
    for (const span of spans) {
      const rect = span.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) return span.dataset.letter;
    }
    return null;
  }

  function scrollToLetter(letter, clientY) {
    if (!letter) return;
    bubble.textContent = letter;
    bubble.classList.remove("hidden");
    bubble.style.top = `${clientY - 22}px`;
    sidebar.querySelectorAll("span").forEach(s => {
      s.classList.toggle("active", s.dataset.letter === letter);
    });
    const anchor = document.getElementById(`alpha-${letter}`);
    if (anchor) {
      const y = anchor.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y });
    }
  }

  function end() {
    isActive = false;
    bubble.classList.add("hidden");
    sidebar.querySelectorAll("span").forEach(s => s.classList.remove("active"));
  }

  sidebar.addEventListener("pointerdown", e => {
    e.preventDefault();
    isActive = true;
    sidebar.setPointerCapture(e.pointerId);
    scrollToLetter(getLetterAt(e.clientY), e.clientY);
  });

  sidebar.addEventListener("pointermove", e => {
    if (!isActive) return;
    scrollToLetter(getLetterAt(e.clientY), e.clientY);
  });

  sidebar.addEventListener("pointerup", end);
  sidebar.addEventListener("pointercancel", end);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function render() {
  updateAlbumProgress();
  updateControls();

  const app = document.getElementById("app");
  app.innerHTML = "";

  const groups = getGroupedCountries();
  let renderedCards = 0;
  const lastLetterRef = { val: null };

  groups.forEach(({ category, countries }) => {
    const categoryWrap = document.createElement("div");
    categoryWrap.className = "category-wrap";

    const categoryTitle = document.createElement("h2");
    categoryTitle.className = "category-title";
    categoryTitle.textContent = category;
    categoryWrap.appendChild(categoryTitle);

    let cardsInCategory = 0;

    countries.forEach(country => {
      const countryStickers = stickers.filter(s => s.country === country && s.category === category);

      const visibleStickers = countryStickers.filter(s => {
        if (hideOwned) return !statusOf(s.id).owned;
        return true;
      });

      if (visibleStickers.length === 0) return;

      const ownedCount = countryStickers.filter(s => statusOf(s.id).owned).length;
      const missingCount = countryStickers.length - ownedCount;
      const percent = Math.round((ownedCount / countryStickers.length) * 100);
      const isComplete = ownedCount === countryStickers.length;
      const countryCode = countryStickers[0]?.code || "";
      const cardKey = `${category}-${country}`;
      const collapsed = !!collapsedCards[cardKey];

      const card = document.createElement("section");
      card.className = `country-card${collapsed ? " collapsed" : ""}${isComplete ? " complete" : ""}`;

      // Alpha anchor only on Seleções cards when A-Z active
      if (sortAlpha && category === "Seleções") {
        const firstChar = country.normalize("NFD")[0].toUpperCase();
        const letter = /[A-Z]/.test(firstChar) ? firstChar : "#";
        if (letter !== lastLetterRef.val) {
          lastLetterRef.val = letter;
          card.id = `alpha-${letter}`;
        }
      }

      const showCode = category === "Seleções";
      card.innerHTML = `
        <div class="country-head">
          <div>
            <h3 class="country-name">${escapeHtml(country)}${showCode ? ` <span class="country-code">• ${escapeHtml(countryCode)}</span>` : ""}</h3>
            <div class="country-subtitle">${ownedCount} de ${countryStickers.length} coladas${isComplete ? " ✓ Completa!" : ` • ${missingCount} faltantes`}</div>
          </div>
          <div class="country-right">
            <div class="country-progress">${percent}%</div>
            <button class="collapse-btn" aria-label="${collapsed ? "Abrir card" : "Minimizar card"}">
              ${collapsed ? "›" : "⌄"}
            </button>
          </div>
        </div>
        <div class="card-content ${collapsed ? "hidden-card" : ""}">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${percent}%"></div>
          </div>
          <div class="grid"></div>
        </div>
      `;

      card.querySelector(".collapse-btn").addEventListener("click", e => {
        e.stopPropagation();
        collapsedCards[cardKey] = !collapsedCards[cardKey];
        saveCollapsedCards();
        render();
      });

      const grid = card.querySelector(".grid");

      visibleStickers.forEach(sticker => {
        const status = statusOf(sticker.id);
        const button = document.createElement("button");
        button.className = "sticker" + (status.owned ? " owned" : "");
        button.textContent = sticker.number;

        let lastPointerDown = 0;
        let holdTimer = null;

        button.addEventListener("click", () => {
          if (Date.now() - lastPointerDown > 650) return;
          const st = statusOf(sticker.id);
          st.owned = !st.owned;
          save();
          render();
        });

        button.addEventListener("pointerdown", () => {
          lastPointerDown = Date.now();
          clearTimeout(holdTimer);
          holdTimer = setTimeout(() => {
            const st = statusOf(sticker.id);
            st.owned = false;
            if (navigator.vibrate) navigator.vibrate(45);
            save();
            render();
          }, 650);
        });

        button.addEventListener("pointerup", () => clearTimeout(holdTimer));
        button.addEventListener("pointerleave", () => clearTimeout(holdTimer));
        button.addEventListener("pointercancel", () => clearTimeout(holdTimer));

        grid.appendChild(button);
      });

      categoryWrap.appendChild(card);
      cardsInCategory++;
      renderedCards++;
    });

    if (cardsInCategory > 0) app.appendChild(categoryWrap);
  });

  if (renderedCards === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `<strong>Nenhuma figurinha para mostrar.</strong><span>Desative "Ocultar coladas" para ver todas novamente.</span>`;
    app.appendChild(empty);
  }

  // Sidebar indexes only Seleções
  const selecoes = groups.find(g => g.category === "Seleções");
  buildAlphaSidebar(selecoes ? selecoes.countries : []);
}

// ── Export helpers ──────────────────────────────────────────────

function stickersForExport(type) {
  return stickers.filter(s => type === "missing" ? !statusOf(s.id).owned : true);
}

function buildPdfHtml(type) {
  const total = stickers.length;
  const owned = stickers.filter(s => statusOf(s.id).owned).length;
  const missing = total - owned;
  const exportItems = stickersForExport(type);
  const title = type === "missing" ? "Figurinhas faltantes" : "Todas as figurinhas";
  const today = new Date().toLocaleDateString("pt-BR");

  const categories = [...new Set(exportItems.map(s => s.category))];

  const groupsHtml = categories.map(category => {
    const catItems = exportItems.filter(s => s.category === category);
    const countries = [...new Set(catItems.map(s => s.country))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const countriesHtml = countries.map(country => {
      const cs = catItems.filter(s => s.country === country).sort((a, b) => a.number - b.number);
      return `
        <div class="pdf-country">
          <h3>${escapeHtml(country)}</h3>
          <div class="pdf-grid">
            ${cs.map(sticker => {
              const st = statusOf(sticker.id);
              return `<div class="pdf-sticker ${st.owned ? "owned" : "missing"}"><strong>${sticker.number}</strong></div>`;
            }).join("")}
          </div>
        </div>`;
    }).join("");
    return `
      <section class="pdf-category">
        <h2>${escapeHtml(category)}</h2>
        <div class="pdf-countries">${countriesHtml}</div>
      </section>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)} - Figurinhas 2026</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #221f18; background: #fff; }
    .pdf-page { padding: 4px; }
    .pdf-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; border-bottom: 1px solid #237c4f; padding-bottom: 3px; margin-bottom: 3px; }
    .pdf-header h1 { margin: 0; font-size: 12px; }
    .pdf-header p { margin: 0; color: #6d6557; font-size: 6px; font-weight: 700; text-align: right; }
    .pdf-category { margin: 0 0 10px; }
    .pdf-category h2 { margin: 0 0 2px; padding: 1px 3px; border-radius: 4px; background: #237c4f; color: #fff; font-size: 7px; }
    .pdf-countries { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px 4px; }
    .pdf-country { display: grid; grid-template-columns: 55px 1fr; align-items: center; gap: 2px; border: 1px solid #e5dbc4; border-radius: 4px; padding: 2px; min-height: 15px; break-inside: avoid; }
    .pdf-country h3 { margin: 0; font-size: 7px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 900; }
    .pdf-grid { display: grid; grid-template-columns: repeat(20, minmax(0, 1fr)); gap: 2px; }
    .pdf-sticker { height: 16px; border-radius: 2px; border: 0.5px solid #d6cab0; display: grid; place-items: center; background: #fff; color: #221f18; }
    .pdf-sticker.owned { background: #eaf6ee; color: #237c4f; border-color: #a8dabc; }
    .pdf-sticker strong { font-size: 8px; font-weight: 900; }
    .empty { border: 1px solid #eadfc2; border-radius: 8px; padding: 8px; font-weight: 800; font-size: 10px; }
    @page { size: A4 landscape; margin: 3mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <main class="pdf-page">
    <section class="pdf-header">
      <h1>${escapeHtml(title)}</h1>
      <p>Figurinhas 2026 • ${today}<br>Total ${total} • Coladas ${owned} • Faltantes ${missing}</p>
    </section>
    ${exportItems.length > 0 ? groupsHtml : `<div class="empty">Nenhuma figurinha para exportar.</div>`}
  </main>
  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 350));<\/script>
</body>
</html>`;
}

function exportPdf(type) {
  const html = buildPdfHtml(type);
  const win = window.open("", "_blank");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    closeExportModal();
    showToast("PDF aberto. Escolha salvar como PDF na janela de impressão.");
    return;
  }
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer";
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
  URL.revokeObjectURL(url);
  closeExportModal();
  showToast("Tentando abrir o PDF. Se não funcionar, permita pop-ups no navegador.");
}

function exportJson() {
  const dataStr = JSON.stringify(collection, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "figurinhas2026.json";
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
  URL.revokeObjectURL(url);
  closeExportModal();
  showToast("JSON exportado com sucesso.");
}

function importJson() {
  const input = document.createElement("input");
  input.type = "file"; input.accept = ".json";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        collection = JSON.parse(ev.target.result);
        save(); render(); closeExportModal();
        showToast("JSON importado com sucesso.");
      } catch {
        showToast("Erro ao importar JSON: formato inválido.");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function openExportModal() {
  document.getElementById("exportModal").classList.remove("hidden");
}

function closeExportModal() {
  document.getElementById("exportModal").classList.add("hidden");
}

// ── Event listeners ─────────────────────────────────────────────

document.getElementById("hideOwnedToggle").addEventListener("change", e => {
  hideOwned = e.target.checked;
  saveHideOwned();
  render();
});

document.getElementById("sortAlphaToggle").addEventListener("change", e => {
  sortAlpha = e.target.checked;
  saveSortAlpha();
  render();
});

document.getElementById("exportBtn").addEventListener("click", openExportModal);
document.getElementById("exportAllBtn").onclick = () => exportPdf("all");
document.getElementById("exportMissingBtn").onclick = () => exportPdf("missing");
document.getElementById("exportCloseBtn").onclick = closeExportModal;
document.getElementById("exportJsonBtn").onclick = exportJson;
document.getElementById("importJsonBtn").onclick = importJson;
document.getElementById("exportModal").addEventListener("click", e => {
  if (e.target.id === "exportModal") closeExportModal();
});

render();
