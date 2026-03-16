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

function placeholder() {
  const d = document.createElement("div");
  d.className = "url-suggestion-favicon-placeholder";
  d.textContent = "🌐";
  return d;
}

export function initUrlBar() {
  const urlBarInput = document.getElementById("url-bar-input");
  const suggestions = document.getElementById("url-suggestions");
  let topSitesCache = [];
  let debounceTimer = null;
  let activeIdx = -1;

  if (typeof chrome !== "undefined" && chrome.topSites) {
    chrome.topSites.get((sites) => {
      topSitesCache = sites || [];
    });
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

    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "url-suggestion-item";
      li.dataset.url = item.url;

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
        e.preventDefault();
        navigate(item.url);
      });
      suggestions.appendChild(li);
    });

    suggestions.hidden = false;
  }

  function applyInlineCompletion(typed, items) {
    if (urlBarInput.value !== typed) return;
    if (!items.length || !typed) return;
    const lower = typed.toLowerCase();
    for (const item of items) {
      const url = item.url;
      const candidates = [
        url.replace(/^https?:\/\/www\./, ""),
        url.replace(/^https?:\/\//, ""),
      ];
      for (const candidate of candidates) {
        if (candidate.toLowerCase().startsWith(lower)) {
          const completed = typed + candidate.slice(lower.length);
          urlBarInput.value = completed;
          urlBarInput.setSelectionRange(typed.length, completed.length);
          return;
        }
      }
    }
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

    const topMatches = topSitesCache.filter(
      (s) =>
        s.url.toLowerCase().includes(trimmed) ||
        (s.title || "").toLowerCase().includes(trimmed),
    );

    if (typeof chrome !== "undefined" && chrome.history) {
      chrome.history.search({ text: trimmed, maxResults: 8 }, (histItems) => {
        const seen = new Set();
        const merged = [];
        [...(histItems || []), ...topMatches].forEach((item) => {
          if (!seen.has(item.url)) {
            seen.add(item.url);
            merged.push(item);
          }
        });
        const results = merged.slice(0, 8);
        renderSuggestions(results);
        applyInlineCompletion(val, results);
      });
    } else {
      const results = topMatches.slice(0, 8);
      renderSuggestions(results);
      applyInlineCompletion(val, results);
    }
  }

  urlBarInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => queryAndRender(urlBarInput.value), 50);
  });

  urlBarInput.addEventListener("keydown", (e) => {
    const items = suggestions.querySelectorAll(".url-suggestion-item");
    const selStart = urlBarInput.selectionStart;
    const selEnd = urlBarInput.selectionEnd;
    const hasInline =
      selStart !== selEnd && selEnd === urlBarInput.value.length;

    if ((e.key === "Tab" || e.key === "ArrowRight") && hasInline) {
      e.preventDefault();
      urlBarInput.setSelectionRange(selEnd, selEnd);
      return;
    }
    if (e.key === "Backspace" && hasInline) {
      e.preventDefault();
      urlBarInput.value = urlBarInput.value.slice(0, selStart);
      urlBarInput.setSelectionRange(selStart, selStart);
      closeSuggestions();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(Math.min(activeIdx + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(activeIdx - 1, -1));
    } else if (e.key === "Escape") {
      if (hasInline) {
        urlBarInput.value = urlBarInput.value.slice(0, selStart);
        urlBarInput.setSelectionRange(selStart, selStart);
        closeSuggestions();
      } else {
        closeSuggestions();
        urlBarInput.blur();
      }
    } else if (e.key === "Enter") {
      if (hasInline) {
        e.preventDefault();
        const completed = urlBarInput.value;
        urlBarInput.setSelectionRange(completed.length, completed.length);
        closeSuggestions();
        navigateInput(completed);
      } else if (activeIdx >= 0 && items[activeIdx]) {
        e.preventDefault();
        navigate(items[activeIdx].dataset.url);
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".url-bar-wrap")) closeSuggestions();
  });

  document.getElementById("url-bar-form").addEventListener("submit", (e) => {
    e.preventDefault();
    closeSuggestions();
    navigateInput(urlBarInput.value.trim());
  });

  urlBarInput.focus();
}
