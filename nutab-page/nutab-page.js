(() => {
  const STORAGE_KEY = "ntf_config";
  const NOTES_KEY = "ntf_notes";

  /* ── Storage helpers ─────────────────────────────────────── */
  function storageGet(key, fallback) {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== "undefined" && chrome.storage) {
          chrome.storage.local.get(key, (r) => resolve(r[key] ?? fallback));
        } else {
          const raw = localStorage.getItem(key);
          resolve(raw ? JSON.parse(raw) : fallback);
        }
      } catch {
        resolve(fallback);
      }
    });
  }

  function storageSet(key, value) {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.set({ [key]: value });
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {}
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ── Listen for settings updates ─────────────────────── */
  if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "config-updated") location.reload();
    });
  }

  /* ── Clock ──────────────────────────────────────────────── */
  const clockH = document.getElementById("clock-h");
  const clockM = document.getElementById("clock-m");
  const clockDate = document.getElementById("clock-date");
  const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  /* ── Time-of-day gradient ──────────────────────────────── */
  // Each entry: [hour (0-23), gradient colour stop (rgba)]
  const GRAD_STOPS = [
    [0, "rgba(30,  20,  60,  0.35)"], // midnight – deep indigo
    [5, "rgba(60,  30,  80,  0.30)"], // pre-dawn – violet
    [6, "rgba(220, 90,  50,  0.28)"], // sunrise  – amber-orange
    [8, "rgba(255, 160, 60,  0.18)"], // morning  – warm gold
    [11, "rgba(80,  140, 255, 0.14)"], // late morning – sky blue
    [13, "rgba(70,  130, 230, 0.12)"], // afternoon – clear blue
    [17, "rgba(220, 100, 50,  0.20)"], // golden hour – orange
    [19, "rgba(180, 60,  80,  0.25)"], // sunset   – rose
    [21, "rgba(91,  91,  246, 0.15)"], // dusk     – accent indigo
    [23, "rgba(30,  20,  60,  0.35)"], // night    – deep indigo
  ];

  function colourForHour(h) {
    let stop = GRAD_STOPS[0];
    for (let i = 0; i < GRAD_STOPS.length - 1; i++) {
      if (h >= GRAD_STOPS[i][0] && h < GRAD_STOPS[i + 1][0]) {
        stop = GRAD_STOPS[i];
        break;
      }
    }
    return stop[1]; // CSS transition handles the visual blend
  }

  let _gradHour = -1;
  function updateGradient() {
    const h = new Date().getHours();
    if (h === _gradHour) return;
    _gradHour = h;
    document.body.style.background = `radial-gradient(ellipse 80% 60% at 0% 15%, ${colourForHour(h)} 0%, transparent 70%), var(--bg)`;
  }

  function tickClock(fmt) {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, "0");
    let suffix = "";
    if (fmt === "12") {
      suffix = h >= 12 ? " pm" : " am";
      h = h % 12 || 12;
    }
    clockH.textContent = String(h).padStart(2, "0");
    clockM.innerHTML =
      m + (suffix ? `<span class="clock-period">${suffix}</span>` : "");
    clockDate.textContent = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
    updateGradient();
  }

  /* ── Shared favicon helper ──────────────────────────────── */
  function faviconUrl(url, size = 32) {
    try {
      return `https://www.google.com/s2/favicons?sz=${size}&domain_url=${encodeURIComponent(new URL(url).origin)}`;
    } catch {
      return null;
    }
  }

  /* ── Favourites ─────────────────────────────────────────── */
  function renderFavs(favs) {
    const grid = document.getElementById("fav-grid");
    grid.innerHTML = "";
    favs.forEach(({ label, url }) => {
      if (!url) return;
      let hostname = "";
      try {
        hostname = new URL(url).hostname;
      } catch {}
      const a = document.createElement("a");
      a.className = "fav-item";
      a.href = url;
      const img = document.createElement("img");
      img.className = "fav-favicon";
      img.src = faviconUrl(url, 64);
      img.alt = label;
      img.onerror = () => {
        const s = document.createElement("span");
        s.className = "fav-fallback";
        s.textContent = "🌐";
        img.replaceWith(s);
      };
      const span = document.createElement("span");
      span.className = "fav-label";
      span.textContent = label || hostname;
      a.appendChild(img);
      a.appendChild(span);
      grid.appendChild(a);
    });
  }

  /* ── Weather ────────────────────────────────────────────── */
  const WMO = {
    0: { label: "Clear sky", emoji: "☀️" },
    1: { label: "Mainly clear", emoji: "🌤️" },
    2: { label: "Partly cloudy", emoji: "⛅" },
    3: { label: "Overcast", emoji: "☁️" },
    45: { label: "Foggy", emoji: "🌫️" },
    48: { label: "Icy fog", emoji: "🌫️" },
    51: { label: "Light drizzle", emoji: "🌦️" },
    53: { label: "Drizzle", emoji: "🌦️" },
    55: { label: "Heavy drizzle", emoji: "🌧️" },
    61: { label: "Light rain", emoji: "🌧️" },
    63: { label: "Rain", emoji: "🌧️" },
    65: { label: "Heavy rain", emoji: "🌧️" },
    71: { label: "Light snow", emoji: "🌨️" },
    73: { label: "Snow", emoji: "❄️" },
    75: { label: "Heavy snow", emoji: "❄️" },
    77: { label: "Snow grains", emoji: "❄️" },
    80: { label: "Rain showers", emoji: "🌦️" },
    81: { label: "Showers", emoji: "🌧️" },
    82: { label: "Heavy showers", emoji: "⛈️" },
    85: { label: "Snow showers", emoji: "🌨️" },
    86: { label: "Heavy snow showers", emoji: "🌨️" },
    95: { label: "Thunderstorm", emoji: "⛈️" },
    96: { label: "Thunderstorm", emoji: "⛈️" },
    99: { label: "Thunderstorm", emoji: "⛈️" },
  };

  async function fetchWeather(cardId, name, lat, lon) {
    const card = document.getElementById(cardId);
    if (!card) return;
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m` +
          `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
          `&temperature_unit=celsius&timezone=auto&forecast_days=2`,
      );
      const data = await res.json();
      const {
        temperature_2m: temp,
        weathercode: code,
        windspeed_10m: wind,
        relative_humidity_2m: humidity,
      } = data.current;
      const { label: curLabel, emoji: curEmoji } = WMO[code] ?? {
        label: "Unknown",
        emoji: "🌡️",
      };
      const { emoji: tomEmoji, label: tomLabel } = WMO[
        data.daily.weathercode[1]
      ] ?? { emoji: "🌡️", label: "Unknown" };
      const todayHi = Math.round(data.daily.temperature_2m_max[0]);
      const todayLo = Math.round(data.daily.temperature_2m_min[0]);
      const tomHi = Math.round(data.daily.temperature_2m_max[1]);
      const tomLo = Math.round(data.daily.temperature_2m_min[1]);
      card.style.maxHeight = "320px";
      card.innerHTML = `
        <div class="weather-city">${escHtml(name)}</div>
        <div class="weather-days">
          <div>
            <div class="weather-day-label">Today</div>
            <div class="weather-main"><span class="weather-emoji">${curEmoji}</span><span class="weather-temp">${Math.round(temp)}°C</span></div>
            <div class="weather-desc">${curLabel}</div>
            <div class="weather-meta"><span>↑${todayHi}° ↓${todayLo}°</span></div>
            <div class="weather-meta"><span>💧 ${humidity}%</span><span>💨 ${Math.round(wind)} km/h</span></div>
          </div>
          <div>
            <div class="weather-day-label">Tomorrow</div>
            <div class="weather-main"><span class="weather-emoji">${tomEmoji}</span><span class="weather-temp">${tomHi}°C</span></div>
            <div class="weather-desc">${tomLabel}</div>
            <div class="weather-meta"><span>↑${tomHi}° ↓${tomLo}°</span></div>
          </div>
        </div>`;
    } catch {
      card.style.maxHeight = "72px";
      card.innerHTML = `<div class="weather-city">${escHtml(name)}</div><div class="weather-placeholder">Unavailable</div>`;
    }
  }

  function buildWeatherSection(locations) {
    const section = document.getElementById("weather-section");
    section.innerHTML = "";
    locations.forEach((loc, i) => {
      const div = document.createElement("div");
      div.className = "weather-card";
      div.id = `weather-loc-${i}`;
      div.innerHTML = `<div class="weather-city">${escHtml(loc.name)}</div><div class="weather-placeholder">Loading…</div>`;
      div.style.maxHeight = "72px";
      section.appendChild(div);
      fetchWeather(`weather-loc-${i}`, loc.name, loc.lat, loc.lon);
    });
  }

  /* ── Setup banner ────────────────────────────────────────── */
  function showSetupBanner() {
    const banner = document.getElementById("setup-banner");
    if (banner) banner.style.display = "flex";
  }

  /* ── Boot ────────────────────────────────────────────────── */
  function loadConfig() {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== "undefined" && chrome.storage) {
          chrome.storage.local.get(STORAGE_KEY, (r) =>
            resolve(r[STORAGE_KEY] ?? null),
          );
        } else {
          const raw = localStorage.getItem(STORAGE_KEY);
          resolve(raw ? JSON.parse(raw) : null);
        }
      } catch {
        resolve(null);
      }
    });
  }

  loadConfig().then((config) => {
    const fmt = config?.clockFormat ?? "24";
    const favs = config?.favourites ?? [];
    const count = config?.weatherCount ?? 2;
    const locs = (
      config?.weatherLocations ?? [
        { name: "Vancouver, BC", lat: "49.2827", lon: "-123.1207" },
        { name: "London, ON", lat: "42.9849", lon: "-81.2453" },
      ]
    ).slice(0, count);

    if (!config) showSetupBanner();

    tickClock(fmt);
    setInterval(() => tickClock(fmt), 1000);
    renderFavs(favs);
    buildWeatherSection(locs);

    /* ── URL bar + suggestions dropdown ──────────────────────── */
    const urlBarInput = document.getElementById("url-bar-input");
    const suggestions = document.getElementById("url-suggestions");
    let topSitesCache = [];
    let debounceTimer = null;
    let activeIdx = -1;

    /* Pre-load top sites once */
    if (typeof chrome !== "undefined" && chrome.topSites) {
      chrome.topSites.get((sites) => {
        topSitesCache = sites || [];
      });
    }

    function faviconFor(url) {
      try {
        const origin = new URL(url).origin;
        return `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(origin)}`;
      } catch {
        return null;
      }
    }

    function navigate(url) {
      window.location.href = url;
    }

    function navigateInput(val) {
      if (!val) return;
      if (/^https?:\/\//i.test(val)) {
        navigate(val);
      } else if (/^[^\s]+\.[^\s]{2,}$/.test(val)) {
        navigate("https://" + val);
      } else {
        navigate("https://www.google.com/search?q=" + encodeURIComponent(val));
      }
    }

    function closeSuggestions() {
      suggestions.hidden = true;
      suggestions.innerHTML = "";
      activeIdx = -1;
    }

    function renderSuggestions(items) {
      suggestions.innerHTML = "";
      activeIdx = -1;
      if (!items.length) {
        closeSuggestions();
        return;
      }

      items.forEach((item, i) => {
        const li = document.createElement("li");
        li.className = "url-suggestion-item";
        li.dataset.url = item.url;

        /* Favicon */
        const favSrc = faviconFor(item.url);
        if (favSrc) {
          const img = document.createElement("img");
          img.className = "url-suggestion-favicon";
          img.src = favSrc;
          img.alt = "";
          img.onerror = () => img.replaceWith(placeholder());
          li.appendChild(img);
        } else {
          li.appendChild(placeholder());
        }

        /* Text */
        const textDiv = document.createElement("div");
        textDiv.className = "url-suggestion-text";
        const titleSpan = document.createElement("span");
        titleSpan.className = "url-suggestion-title";
        titleSpan.textContent = item.title || item.url;
        const urlSpan = document.createElement("span");
        urlSpan.className = "url-suggestion-url";
        urlSpan.textContent = item.url;
        textDiv.appendChild(titleSpan);
        textDiv.appendChild(urlSpan);
        li.appendChild(textDiv);

        li.addEventListener("mousedown", (e) => {
          e.preventDefault(); /* don't blur input */
          navigate(item.url);
        });

        suggestions.appendChild(li);
      });

      suggestions.hidden = false;
    }

    function placeholder() {
      const d = document.createElement("div");
      d.className = "url-suggestion-favicon-placeholder";
      d.textContent = "🌐";
      return d;
    }

    function setActive(idx) {
      const items = suggestions.querySelectorAll(".url-suggestion-item");
      items.forEach((el) => el.classList.remove("is-active"));
      if (idx >= 0 && idx < items.length) {
        items[idx].classList.add("is-active");
        items[idx].scrollIntoView({ block: "nearest" });
      }
      activeIdx = idx;
    }

    function queryAndRender(val) {
      const trimmed = val.trim().toLowerCase();

      if (!trimmed) {
        closeSuggestions();
        return;
      }

      /* Filter cached top sites */
      const topMatches = topSitesCache.filter(
        (s) =>
          s.url.toLowerCase().includes(trimmed) ||
          (s.title || "").toLowerCase().includes(trimmed),
      );

      /* Merge with history results */
      if (typeof chrome !== "undefined" && chrome.history) {
        chrome.history.search({ text: trimmed, maxResults: 8 }, (histItems) => {
          const seen = new Set();
          const merged = [];
          [...(histItems || []), ...topMatches].forEach((item) => {
            const url = item.url;
            if (!seen.has(url)) {
              seen.add(url);
              merged.push(item);
            }
          });
          renderSuggestions(merged.slice(0, 8));
        });
      } else {
        renderSuggestions(topMatches.slice(0, 8));
      }
    }

    /* Input → debounced query */
    urlBarInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => queryAndRender(urlBarInput.value), 150);
    });

    /* Keyboard navigation */
    urlBarInput.addEventListener("keydown", (e) => {
      const items = suggestions.querySelectorAll(".url-suggestion-item");
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive(Math.min(activeIdx + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive(Math.max(activeIdx - 1, -1));
      } else if (e.key === "Escape") {
        closeSuggestions();
        urlBarInput.blur();
      } else if (e.key === "Enter") {
        if (activeIdx >= 0 && items[activeIdx]) {
          e.preventDefault();
          navigate(items[activeIdx].dataset.url);
        }
        /* else fall through to form submit */
      }
    });

    /* Click outside → close */
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".url-bar-wrap")) closeSuggestions();
    });

    /* Form submit (typed URL / search — no suggestion selected) */
    document.getElementById("url-bar-form").addEventListener("submit", (e) => {
      e.preventDefault();
      closeSuggestions();
      navigateInput(urlBarInput.value.trim());
    });

    urlBarInput.focus();
  });

  /* ── Sticky Notes ──────────────────────────────────────────── */
  const MAX_NOTES = 5;
  let notes = [];

  const NOTE_COLORS = [
    { id: "default", bg: "#1e1e2a", header: "#16161f", label: "Default" },
    { id: "indigo", bg: "#1a1a3a", header: "#13132b", label: "Indigo" },
    { id: "teal", bg: "#0f2428", header: "#0b1c20", label: "Teal" },
    { id: "rose", bg: "#2a1420", header: "#1f0f17", label: "Rose" },
    { id: "amber", bg: "#241508", header: "#1c1006", label: "Amber" },
  ];

  // Map color id → actual display dot colour
  const SWATCH_DOT = {
    default: "#3a3a52",
    indigo: "#5b5bf6",
    teal: "#2dd4bf",
    rose: "#f43f5e",
    amber: "#e8820c",
  };

  function saveNotes() {
    storageSet(NOTES_KEY, notes);
  }

  function updateAddBtn() {
    const btn = document.getElementById("add-note-btn");
    if (btn) btn.disabled = notes.length >= MAX_NOTES;
  }

  function applyNoteColor(el, colorId) {
    const c = NOTE_COLORS.find((c) => c.id === colorId) ?? NOTE_COLORS[0];
    el.style.background = c.bg;
    const header = el.querySelector(".note-header");
    if (header) header.style.background = c.header;
    const colorsEl = el.querySelector(".note-colors");
    if (colorsEl) {
      el.querySelectorAll(".note-swatch").forEach((s) => {
        s.classList.toggle("active", s.dataset.color === colorId);
      });
      // Move active swatch to end
      const active = colorsEl.querySelector(".note-swatch.active");
      if (active) colorsEl.appendChild(active);
    }
  }

  function createNoteEl(note) {
    note.color = note.color ?? "default";
    const sortedColors = [
      ...NOTE_COLORS.filter((c) => c.id !== note.color),
      NOTE_COLORS.find((c) => c.id === note.color) ?? NOTE_COLORS[0],
    ];
    const swatchHTML = sortedColors
      .map(
        (c) =>
          `<span class="note-swatch${note.color === c.id ? " active" : ""}" data-color="${c.id}" title="${c.label}" style="background:${SWATCH_DOT[c.id]}"></span>`,
      )
      .join("");

    const el = document.createElement("div");
    el.className = "sticky-note";
    el.id = `note-${note.id}`;
    el.style.left = `${note.x}px`;
    el.style.top = `${note.y}px`;
    el.style.width = `${note.width}px`;
    el.style.height = `${note.height}px`;
    el.innerHTML = `
      <div class="note-header">
        <span class="note-drag-handle" title="Drag">&#8942;&#8942;</span>
        <input class="note-title" value="${escHtml(note.title)}" placeholder="Title…" spellcheck="false" />
        <div class="note-colors">${swatchHTML}</div>
        <button class="note-delete" title="Delete">×</button>
      </div>
      <textarea class="note-body" placeholder="Write something…" spellcheck="false">${escHtml(note.description)}</textarea>
      <div class="note-resize"></div>
    `;

    // Apply colour immediately
    applyNoteColor(el, note.color);

    // Colour swatches
    const colorsEl = el.querySelector(".note-colors");
    el.querySelectorAll(".note-swatch").forEach((s) => {
      s.addEventListener("click", (e) => {
        e.stopPropagation();
        if (s.classList.contains("active")) {
          // Toggle picker open/closed
          colorsEl.classList.toggle("open");
        } else {
          // Pick colour and close
          note.color = s.dataset.color;
          applyNoteColor(el, note.color);
          colorsEl.classList.remove("open");
          saveNotes();
        }
      });
    });

    // Close picker when clicking outside
    document.addEventListener("click", () => colorsEl.classList.remove("open"));

    // Delete
    el.querySelector(".note-delete").addEventListener("click", () => {
      notes = notes.filter((n) => n.id !== note.id);
      saveNotes();
      el.remove();
      updateAddBtn();
    });

    // Auto-save title
    let titleTimer;
    el.querySelector(".note-title").addEventListener("input", (e) => {
      clearTimeout(titleTimer);
      titleTimer = setTimeout(() => {
        note.title = e.target.value;
        saveNotes();
      }, 400);
    });

    // Auto-save body
    let bodyTimer;
    el.querySelector(".note-body").addEventListener("input", (e) => {
      clearTimeout(bodyTimer);
      bodyTimer = setTimeout(() => {
        note.description = e.target.value;
        saveNotes();
      }, 400);
    });

    // Drag
    el.querySelector(".note-drag-handle").addEventListener("mousedown", (e) => {
      e.preventDefault();
      const ox = e.clientX - note.x;
      const oy = e.clientY - note.y;
      el.classList.add("is-dragging");

      function onMove(e) {
        note.x = Math.max(
          0,
          Math.min(window.innerWidth - note.width, e.clientX - ox),
        );
        note.y = Math.max(
          0,
          Math.min(window.innerHeight - note.height, e.clientY - oy),
        );
        el.style.left = `${note.x}px`;
        el.style.top = `${note.y}px`;
      }
      function onUp() {
        el.classList.remove("is-dragging");
        saveNotes();
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      }
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });

    // Resize
    el.querySelector(".note-resize").addEventListener("mousedown", (e) => {
      e.preventDefault();
      const sx = e.clientX,
        sy = e.clientY;
      const sw = note.width,
        sh = note.height;

      function onMove(e) {
        note.width = Math.max(140, sw + (e.clientX - sx));
        note.height = Math.max(100, sh + (e.clientY - sy));
        el.style.width = `${note.width}px`;
        el.style.height = `${note.height}px`;
      }
      function onUp() {
        saveNotes();
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      }
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });

    return el;
  }

  function renderNotes() {
    document.querySelectorAll(".sticky-note").forEach((el) => el.remove());
    notes.forEach((note) => document.body.appendChild(createNoteEl(note)));
    updateAddBtn();
  }

  document.getElementById("add-note-btn").addEventListener("click", () => {
    if (notes.length >= MAX_NOTES) return;
    const id = Date.now();
    const note = {
      id,
      title: "",
      description: "",
      color: "default",
      x: Math.round(window.innerWidth / 2 - 100 + (Math.random() * 60 - 30)),
      y: Math.round(window.innerHeight / 2 - 100 + (Math.random() * 60 - 30)),
      width: 200,
      height: 200,
    };
    notes.push(note);
    saveNotes();
    document.body.appendChild(createNoteEl(note));
    updateAddBtn();
    document
      .getElementById(`note-${id}`)
      ?.querySelector(".note-title")
      ?.focus();
  });

  storageGet(NOTES_KEY, []).then((saved) => {
    notes = saved;
    renderNotes();
  });
})();
