import { storageGet, storageSet } from "./modules/storage.js";
import { initClock } from "./modules/clock.js";
import { renderFavs } from "./modules/favs.js";
import { buildWeatherSection } from "./modules/weather.js";
import { initUrlBar } from "./modules/urlbar.js";
import { initNotes } from "./modules/notes.js";

const STORAGE_KEY = "ntf_config";

// Reload page when settings are saved from the extension popup
if (typeof chrome !== "undefined" && chrome.runtime) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "config-updated") location.reload();
  });
}

storageGet(STORAGE_KEY, null).then((config) => {
  const fmt = config?.clockFormat ?? "24";
  const count = config?.weatherCount ?? 2;
  const locs = (
    config?.weatherLocations ?? [
      { name: "Vancouver, BC", lat: "49.2827", lon: "-123.1207" },
      { name: "London, ON", lat: "42.9849", lon: "-81.2453" },
    ]
  ).slice(0, count);

  if (!config) {
    const banner = document.getElementById("setup-banner");
    if (banner) banner.style.display = "flex";
  }

  function doRenderFavs() {
    renderFavs(config?.favourites ?? [], (newFav) => {
      config = config ?? {};
      config.favourites = [...(config.favourites ?? []), newFav];
      storageSet(STORAGE_KEY, config);
      doRenderFavs();
    });
  }

  initClock(fmt);
  doRenderFavs();
  buildWeatherSection(locs);
  initUrlBar();
});

initNotes();
