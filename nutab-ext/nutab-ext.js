(() => {
  "use strict";

  /* ── Storage key ─────────────────────────────────────────── */
  const STORAGE_KEY = "ntf_config";
  const DRAFT_KEY = "ntf_draft";

  const DEFAULT_CONFIG = {
    clockFormat: "24",
    favourites: [],
    weatherCount: 2,
    weatherLocations: [
      { name: "Vancouver, BC", lat: "49.2827", lon: "-123.1207" },
      { name: "London, ON", lat: "42.9849", lon: "-81.2453" },
    ],
  };

  /* ── Storage helpers ─────────────────────────────────────── */
  function saveConfig(config) {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.set({ [STORAGE_KEY]: config });
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      }
    } catch (_) {}
  }

  function loadConfig() {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== "undefined" && chrome.storage) {
          chrome.storage.local.get(STORAGE_KEY, (result) => {
            resolve(result[STORAGE_KEY] ?? null);
          });
        } else {
          const raw = localStorage.getItem(STORAGE_KEY);
          resolve(raw ? JSON.parse(raw) : null);
        }
      } catch (_) {
        resolve(null);
      }
    });
  }

  /* ── Draft helpers ─────────────────────────────────────────── */
  function getDraftState() {
    return {
      clockFormat: clockFormat.value,
      favourites: favData.map((f) => ({ label: f.label, url: f.url })),
      weatherCount,
      weatherLocations: getWeatherLocValues(),
    };
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(getDraftState()));
      markDirty();
    } catch (_) {}
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
      markClean();
    } catch (_) {}
  }

  function markDirty() {
    unsavedBadge?.classList.add("is-visible");
  }

  function markClean() {
    unsavedBadge?.classList.remove("is-visible");
  }

  /* ── DOM refs ────────────────────────────────────────────── */
  const form = document.getElementById("settingsForm");
  const submitBtn = document.getElementById("submitBtn");
  const submitLabel = document.getElementById("submitLabel");
  const unsavedBadge = document.getElementById("unsaved-badge");
  const clockFormat = document.getElementById("clockFormat");
  const favEditor = document.getElementById("favEditor");
  const weatherLocs = document.getElementById("weatherLocations");
  const seg1 = document.getElementById("weatherCount1");
  const seg2 = document.getElementById("weatherCount2");

  const MAX_FAVS = 12;
  let favData = [];
  let weatherCount = 2;

  /* ── Segmented control ───────────────────────────────────── */
  function setWeatherCount(n) {
    weatherCount = n;
    seg1.classList.toggle("seg-btn--active", n === 1);
    seg2.classList.toggle("seg-btn--active", n === 2);
    // preserve existing values when switching
    const existing = getWeatherLocValues();
    renderWeatherRows(n, existing);
  }

  [seg1, seg2].forEach((btn) =>
    btn.addEventListener("click", () => {
      setWeatherCount(Number(btn.dataset.val));
      saveDraft();
    }),
  );

  /* ── Draft autosave listeners ────────────────────────────── */
  clockFormat.addEventListener("change", saveDraft);

  weatherLocs.addEventListener("input", saveDraft);

  /* ── Favourites editor ───────────────────────────────────── */
  function renderFavEditor() {
    favEditor.innerHTML = "";
    favData.forEach((fav, i) => {
      const row = document.createElement("div");
      row.className = "fav-row";
      row.innerHTML = `
        <span class="fav-row-num">${i + 1}</span>
        <input type="text" class="field-input fav-label-input" placeholder="Label"
          value="${escHtml(fav.label)}" />
        <input type="text" class="field-input fav-url-input" placeholder="https://example.com"
          value="${escHtml(fav.url)}" />
        <button type="button" class="fav-delete-btn" title="Remove">&times;</button>
      `;
      row.querySelector(".fav-label-input").addEventListener("input", (e) => {
        favData[i] = { ...favData[i], label: e.target.value };
        saveDraft();
      });
      row.querySelector(".fav-url-input").addEventListener("input", (e) => {
        favData[i] = { ...favData[i], url: e.target.value };
        saveDraft();
      });
      row.querySelector(".fav-delete-btn").addEventListener("click", () => {
        favData.splice(i, 1);
        if (favData.length === 0) favData.push({ label: "", url: "" });
        renderFavEditor();
        saveDraft();
      });
      favEditor.appendChild(row);
    });

    if (favData.length < MAX_FAVS) {
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "fav-add-btn";
      addBtn.textContent = "+ Add favourite";
      addBtn.addEventListener("click", () => {
        favData.push({ label: "", url: "" });
        renderFavEditor();
        saveDraft();
        favEditor
          .querySelectorAll(".fav-label-input")
          [favData.length - 1]?.focus();
      });
      favEditor.appendChild(addBtn);
    }
  }

  function getFavValues() {
    return favData.map((f) => ({
      label: f.label.trim(),
      url: normalizeUrl(f.url),
    }));
  }

  /* ── Weather location rows ───────────────────────────────── */
  function renderWeatherRows(count, locs = []) {
    weatherLocs.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const loc = locs[i] ?? { name: "", lat: "", lon: "" };
      const row = document.createElement("div");
      row.className = "weather-loc-row";
      row.innerHTML = `
        <span class="fav-row-num">${i + 1}</span>
        <input type="text" class="field-input" placeholder="City name (e.g. Toronto, ON)"
          value="${escHtml(loc.name)}" data-loc-i="${i}" data-loc-field="name" />
        <input type="text" class="field-input field-input--sm" placeholder="Lat"
          value="${escHtml(loc.lat)}" data-loc-i="${i}" data-loc-field="lat" />
        <input type="text" class="field-input field-input--sm" placeholder="Lon"
          value="${escHtml(loc.lon)}" data-loc-i="${i}" data-loc-field="lon" />
        <a class="loc-lookup-link" href="https://www.latlong.net/" target="_blank" title="Look up lat/lon">🔍</a>
      `;
      weatherLocs.appendChild(row);
    }
  }

  function getWeatherLocValues() {
    const locs = [];
    for (let i = 0; i < weatherCount; i++) {
      locs.push({
        name:
          weatherLocs
            .querySelector(`[data-loc-i="${i}"][data-loc-field="name"]`)
            ?.value.trim() ?? "",
        lat:
          weatherLocs
            .querySelector(`[data-loc-i="${i}"][data-loc-field="lat"]`)
            ?.value.trim() ?? "",
        lon:
          weatherLocs
            .querySelector(`[data-loc-i="${i}"][data-loc-field="lon"]`)
            ?.value.trim() ?? "",
      });
    }
    return locs;
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function normalizeUrl(raw) {
    const t = raw.trim();
    if (!t) return "";
    return /^https?:\/\//i.test(t) ? t : "https://" + t;
  }

  /* ── Save feedback ───────────────────────────────────────── */
  function showSaved() {
    submitLabel.textContent = "Saved!";
    submitBtn.classList.add("submit-btn--saved");
    submitBtn.disabled = true;
    setTimeout(() => {
      submitLabel.textContent = "Save settings";
      submitBtn.classList.remove("submit-btn--saved");
      submitBtn.disabled = false;
    }, 1500);
  }

  /* ── Form submit ─────────────────────────────────────────── */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    saveConfig({
      clockFormat: clockFormat.value,
      favourites: getFavValues(),
      weatherCount,
      weatherLocations: getWeatherLocValues(),
    });
    clearDraft();
    showSaved();
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "config-updated" });
    }
  });

  /* ── Init ────────────────────────────────────────────────── */
  async function init() {
    const saved = await loadConfig();
    const draft = loadDraft();
    const config = draft ?? saved ?? DEFAULT_CONFIG;

    clockFormat.value = config.clockFormat ?? "24";
    favData = [...(config.favourites ?? [])];
    if (favData.length === 0) favData.push({ label: "", url: "" });
    renderFavEditor();

    const wCount = config.weatherCount ?? 2;
    const wLocs = config.weatherLocations ?? DEFAULT_CONFIG.weatherLocations;
    renderWeatherRows(wCount, wLocs);
    setWeatherCount(wCount);

    if (draft) markDirty();
  }

  init();
})();
