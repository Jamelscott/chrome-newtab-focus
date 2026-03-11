(() => {
  'use strict';

  /* ── Storage keys ─────────────────────────────────────────── */
  const KEY_URL         = 'ntf_url';
  const KEY_FOCUS_URL_BAR = 'ntf_focusUrlBar';

  /* ── DOM refs ─────────────────────────────────────────────── */
  const urlInput        = document.getElementById('urlInput');
  const urlForm         = document.getElementById('urlForm');
  const focusToggle     = document.getElementById('focusToggle');
  const toggleDescription = document.getElementById('toggleDescription');

  /* ── Helpers ──────────────────────────────────────────────── */

  /**
   * Persist a key-value pair.  Falls back to localStorage when the
   * chrome.storage API is unavailable (e.g. during local development).
   */
  function saveValue(key, value) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const entry = {};
        entry[key] = value;
        chrome.storage.local.set(entry);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (_) {
      // storage unavailable – silently ignore
    }
  }

  /**
   * Retrieve a stored value.  Returns a Promise that resolves with the
   * value (or `defaultValue` when nothing is stored).
   */
  function loadValue(key, defaultValue) {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(key, (result) => {
            resolve(key in result ? result[key] : defaultValue);
          });
        } else {
          const raw = localStorage.getItem(key);
          resolve(raw !== null ? JSON.parse(raw) : defaultValue);
        }
      } catch (_) {
        resolve(defaultValue);
      }
    });
  }

  /** Normalize a URL string so it always has a protocol prefix. */
  function normalizeUrl(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://' + trimmed;
  }

  /* ── Toggle state ─────────────────────────────────────────── */

  function setToggleState(focusUrlBar) {
    focusToggle.setAttribute('aria-checked', focusUrlBar ? 'true' : 'false');
    toggleDescription.textContent = focusUrlBar
      ? 'Browser address bar will be focused'
      : 'Page URL input will be focused';
  }

  /* ── Initialise ───────────────────────────────────────────── */

  async function init() {
    const [savedUrl, focusUrlBar] = await Promise.all([
      loadValue(KEY_URL, ''),
      loadValue(KEY_FOCUS_URL_BAR, true),
    ]);

    // Restore saved URL
    if (savedUrl) {
      urlInput.value = savedUrl;
    }

    // Restore toggle
    setToggleState(focusUrlBar);

    // Apply focus behaviour
    if (focusUrlBar) {
      // Leave focus on the browser's address bar (do nothing – Chrome keeps
      // it focused by default on a new-tab page when no element is focused).
    } else {
      // Steal focus away from the address bar by focusing the page input.
      urlInput.focus();
      urlInput.select();
    }
  }

  /* ── Event: toggle ────────────────────────────────────────── */

  focusToggle.addEventListener('click', () => {
    const current = focusToggle.getAttribute('aria-checked') === 'true';
    const next = !current;
    setToggleState(next);
    saveValue(KEY_FOCUS_URL_BAR, next);
  });

  /* ── Event: form submit ───────────────────────────────────── */

  urlForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const url = normalizeUrl(urlInput.value);
    if (!url) return;

    saveValue(KEY_URL, url);
    window.location.href = url;
  });

  /* ── Boot ─────────────────────────────────────────────────── */

  init();
})();
