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
let lastPointerDown = 0;
let holdTimer = null;
let toastTimer = null;

// Mantém a mesma chave do app antigo para ninguém perder os saves.
let collection = safeJsonParse(localStorage.getItem("figurinhas2026"), {});
let collapsedCards = safeJsonParse(localStorage.getItem("figurinhas2026Collapsed"), {});
let hideOwned = safeJsonParse(localStorage.getItem("figurinhas2026OcultarColadas"), false);

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
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

function statusOf(id) {
  if (!collection[id]) {
    collection[id] = { owned: false, duplicates: 0 };
  }

  if (typeof collection[id].owned !== "boolean") collection[id].owned = false;
  if (typeof collection[id].duplicates !== "number") collection[id].duplicates = 0;

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
  const owned = stickers.filter(sticker => statusOf(sticker.id).owned).length;
  const missing = total - owned;
  const percent = total === 0 ? 0 : Math.round((owned / total) * 100);

  document.getElementById("albumProgress").textContent =
    `${owned}/${total} coladas • ${missing} faltantes • ${percent}%`;
}

function updateControls() {
  const hideOwnedToggle = document.getElementById("hideOwnedToggle");
  const exportBtn = document.getElementById("exportBtn");

  if (hideOwnedToggle) {
    hideOwnedToggle.checked = hideOwned;
    hideOwnedToggle.disabled = page !== "colecao";
  }

  if (exportBtn) {
    exportBtn.disabled = false;
  }
}

function render() {
  updateAlbumProgress();
  updateControls();

  document.getElementById("title").textContent =
    page === "colecao" ? "Figurinhas 2026" : "Repetidas";

  document.getElementById("backBtn").classList.toggle("hidden", page === "colecao");
  document.getElementById("nextBtn").classList.toggle("hidden", page === "repetidas");

  const app = document.getElementById("app");
  app.innerHTML = "";

  const categories = [...new Set(stickers.map(sticker => sticker.category))];
  let renderedCards = 0;

  categories.forEach(category => {
    const categoryWrap = document.createElement("div");
    categoryWrap.className = "category-wrap";

    const categoryTitle = document.createElement("h2");
    categoryTitle.className = "category-title";
    categoryTitle.textContent = category;
    categoryWrap.appendChild(categoryTitle);

    const countries = [
      ...new Set(
        stickers
          .filter(sticker => sticker.category === category)
          .map(sticker => sticker.country)
      )
    ];

    let cardsInCategory = 0;

    countries.forEach(country => {
      const countryStickers = stickers.filter(
        sticker => sticker.category === category && sticker.country === country
      );

      const visibleStickers = countryStickers.filter(sticker => {
        const status = statusOf(sticker.id);

        if (page === "repetidas") return status.duplicates > 0;
        if (hideOwned) return !status.owned;
        return true;
      });

      if (visibleStickers.length === 0) return;

      const ownedCount = countryStickers.filter(sticker => statusOf(sticker.id).owned).length;
      const missingCount = countryStickers.length - ownedCount;
      const percent = Math.round((ownedCount / countryStickers.length) * 100);
      const countryCode = countryStickers[0]?.code || countryStickers[0]?.id?.split('-')[0] || "";
      const countryLabel = category === "Seleções" && countryCode
        ? `${country} <span class="country-code">• ${countryCode}</span>`
        : country;

      const cardKey = `${category}-${country}`;
      const collapsed = !!collapsedCards[cardKey];

      const card = document.createElement("section");
      card.className = `country-card ${collapsed ? "collapsed" : ""}`;

      card.innerHTML = `
        <div class="country-head">
          <div>
            <h3 class="country-name">${countryLabel}</h3>
            <div class="country-subtitle">${ownedCount} de ${countryStickers.length} coladas • ${missingCount} faltantes</div>
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

        if (page === "colecao" && status.owned) {
          button.classList.add("owned");
        }

        if (page === "repetidas") {
          button.classList.add("duplicate");
        }

        button.innerHTML = `
          ${sticker.number}
          ${status.duplicates > 0 ? `<span class="dup-count">${status.duplicates}</span>` : ""}
        `;

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

      categoryWrap.appendChild(card);
      cardsInCategory++;
      renderedCards++;
    });

    if (cardsInCategory > 0) {
      app.appendChild(categoryWrap);
    }
  });

  if (renderedCards === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = page === "repetidas"
      ? `<strong>Nenhuma repetida por enquanto.</strong><span>Quando tiver repetidas, elas aparecem aqui.</span>`
      : `<strong>Nenhuma figurinha para mostrar.</strong><span>Desative “Ocultar coladas” para ver todas novamente.</span>`;
    app.appendChild(empty);
  }
}

function clickSticker(sticker) {
  const status = statusOf(sticker.id);

  if (page === "colecao") {
    if (!status.owned) {
      status.owned = true;
    } else {
      status.duplicates++;
    }
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

  if (navigator.vibrate) {
    navigator.vibrate(45);
  }

  save();
  render();
}

function openExportModal() {
  document.getElementById("exportModal").classList.remove("hidden");
}

function closeExportModal() {
  document.getElementById("exportModal").classList.add("hidden");
}

function stickersForExport(type) {
  return stickers.filter(sticker => {
    const status = statusOf(sticker.id);
    return type === "missing" ? !status.owned : true;
  });
}

function groupedExportData(type) {
  const items = stickersForExport(type);
  const categories = [...new Set(items.map(sticker => sticker.category))];

  return categories.map(category => {
    const categoryItems = items.filter(sticker => sticker.category === category);
    const countries = [...new Set(categoryItems.map(sticker => sticker.country))];

    return {
      category,
      countries: countries.map(country => ({
        country,
        stickers: categoryItems
          .filter(sticker => sticker.country === country)
          .sort((a, b) => a.number - b.number)
      }))
    };
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildPdfHtml(type) {
  const total = stickers.length;
  const owned = stickers.filter(sticker => statusOf(sticker.id).owned).length;
  const missing = total - owned;
  const exportItems = stickersForExport(type);
  const groups = groupedExportData(type);
  const title = type === "missing" ? "Figurinhas faltantes" : "Todas as figurinhas";
  const today = new Date().toLocaleDateString("pt-BR");

  const groupsHtml = groups.map(group => `
    <section class="pdf-category">
      <h2>${escapeHtml(group.category)}</h2>
      <div class="pdf-countries">
        ${group.countries.map(countryGroup => `
          <div class="pdf-country">
            <h3>${escapeHtml(countryGroup.country)}</h3>
            <div class="pdf-grid">
              ${countryGroup.stickers.map(sticker => {
                const status = statusOf(sticker.id);
                return `
                  <div class="pdf-sticker ${status.owned ? "owned" : "missing"}">
                    <strong>${sticker.number}</strong>
                    ${status.duplicates > 0 ? `<small>+${status.duplicates}</small>` : ""}
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  `).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, orientation=landscape" />
  <title>${escapeHtml(title)} - Figurinhas 2026</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #221f18; background: #fff; }
    .pdf-page { padding: 4px; }
    .pdf-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; border-bottom: 1px solid #237c4f; padding-bottom: 3px; margin-bottom: 3px; }
    .pdf-header h1 { margin: 0; font-size: 12px; line-height: 1; }
    .pdf-header p { margin: 0; color: #6d6557; font-size: 6px; font-weight: 700; line-height: 1.15; text-align: right; }
    .pdf-category { margin: 0 0 12px; break-inside: avoid; page-break-inside: avoid; }
    .pdf-category h2 { margin: 0 0 2px; padding: 1px 3px; border-radius: 4px; background: #237c4f; color: #fff; font-size: 7px; line-height: 1.2; }
    .pdf-countries { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px 4px; }
    .pdf-country { display: grid; grid-template-columns: 55px 1fr; align-items: center; gap: 2px; border: 1px solid #e5dbc4; border-radius: 4px; padding: 2px; min-height: 15px; break-inside: avoid; page-break-inside: avoid; }
    .pdf-country h3 { margin: 0; font-size: 7px; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 900; }
    .pdf-grid { display: grid; grid-template-columns: repeat(20, minmax(0, 1fr)); gap: 2px; }
    .pdf-sticker { height: 16px; border-radius: 2px; border: 0.5px solid #d6cab0; display: grid; place-items: center; position: relative; background: #fff; color: #221f18; }
    .pdf-sticker.owned { background: #eaf6ee; color: #237c4f; border-color: #a8dabc; }
    .pdf-sticker.missing { background: #fff; color: #221f18; border-color: #d7c9a8; }
    .pdf-sticker strong { font-size: 8px; line-height: 1; font-weight: 900; }
    .pdf-sticker small { position: absolute; top: -3px; right: -2px; background: #d94a38; color: white; border-radius: 999px; min-width: 6px; height: 6px; display: grid; place-items: center; font-size: 3px; font-weight: 900; }
    .empty { border: 1px solid #eadfc2; border-radius: 8px; padding: 8px; font-weight: 800; font-size: 10px; }
    @page { size: A4 landscape; margin: 3mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      html { width: 100vw; height: 100vh; }
      .pdf-page { padding: 0; }
    }
  </style>
</head>
<body>
  <main class="pdf-page">
    <section class="pdf-header">
      <h1>${escapeHtml(title)}</h1>
      <p>Figurinhas 2026 • ${today}<br>Total ${total} • Coladas ${owned} • Faltantes ${missing} • PDF ${exportItems.length}</p>
    </section>

    ${exportItems.length > 0 ? groupsHtml : `<div class="empty">Nenhuma figurinha para exportar.</div>`}
  </main>

  <script>
    window.addEventListener("load", () => {
      setTimeout(() => window.print(), 350);
    });
  <\/script>
</body>
</html>`;
}

function exportPdf(type) {
  const html = buildPdfHtml(type);
  const pdfWindow = window.open("", "_blank");

  if (pdfWindow) {
    pdfWindow.document.open();
    pdfWindow.document.write(html);
    pdfWindow.document.close();
    closeExportModal();
    showToast("PDF aberto. Escolha salvar como PDF na janela de impressão.");
    return;
  }

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  closeExportModal();
  showToast("Tentando abrir o PDF. Se não funcionar, permita pop-ups no navegador.");
}

function exportJson() {
  const dataStr = JSON.stringify(collection, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'figurinhas2026.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  closeExportModal();
  showToast('JSON exportado com sucesso.');
}

function importJson() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        collection = imported;
        save();
        render();
        closeExportModal();
        showToast('JSON importado com sucesso.');
      } catch (error) {
        showToast('Erro ao importar JSON: formato inválido.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

document.getElementById("nextBtn").onclick = () => {
  page = "repetidas";
  render();
};

document.getElementById("backBtn").onclick = () => {
  page = "colecao";
  render();
};

const hideOwnedToggle = document.getElementById("hideOwnedToggle");
if (hideOwnedToggle) {
  hideOwnedToggle.addEventListener("change", event => {
    hideOwned = event.target.checked;
    saveHideOwned();
    render();
  });
}

const exportBtn = document.getElementById("exportBtn");
if (exportBtn) {
  exportBtn.addEventListener("click", openExportModal);
}

document.getElementById("exportAllBtn").onclick = () => exportPdf("all");
document.getElementById("exportMissingBtn").onclick = () => exportPdf("missing");
document.getElementById("exportCloseBtn").onclick = closeExportModal;

document.getElementById("exportJsonBtn").onclick = exportJson;
document.getElementById("importJsonBtn").onclick = importJson;

document.getElementById("exportModal").addEventListener("click", event => {
  if (event.target.id === "exportModal") closeExportModal();
});

render();
