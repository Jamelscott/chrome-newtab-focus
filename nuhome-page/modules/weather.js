import { escHtml } from "./utils.js";

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

export function buildWeatherSection(locations) {
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
