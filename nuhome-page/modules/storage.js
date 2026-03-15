export function storageGet(key, fallback) {
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

export function storageSet(key, value) {
  try {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ [key]: value });
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {}
}
