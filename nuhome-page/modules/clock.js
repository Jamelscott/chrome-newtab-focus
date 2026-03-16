const clockH = document.getElementById("clock-h");
const clockM = document.getElementById("clock-m");
const clockDate = document.getElementById("clock-date");
const clockPeriod = document.getElementById("clock-period");

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

const GRAD_STOPS = [
  [0, "rgba(30,  20,  60,  0.35)"],
  [5, "rgba(60,  30,  80,  0.30)"],
  [6, "rgba(220, 90,  50,  0.28)"],
  [8, "rgba(255, 160, 60,  0.18)"],
  [11, "rgba(80,  140, 255, 0.14)"],
  [13, "rgba(70,  130, 230, 0.12)"],
  [17, "rgba(220, 100, 50,  0.20)"],
  [19, "rgba(180, 60,  80,  0.25)"],
  [21, "rgba(91,  91,  246, 0.15)"],
  [23, "rgba(30,  20,  60,  0.35)"],
];

function colourForHour(h) {
  let stop = GRAD_STOPS[0];
  for (let i = 0; i < GRAD_STOPS.length - 1; i++) {
    if (h >= GRAD_STOPS[i][0] && h < GRAD_STOPS[i + 1][0]) {
      stop = GRAD_STOPS[i];
      break;
    }
  }
  return stop[1];
}

let _gradHour = -1;
function updateGradient() {
  const h = new Date().getHours();
  if (h === _gradHour) return;
  _gradHour = h;
  const colour = colourForHour(h);
  document.body.style.background = [
    `radial-gradient(ellipse 80% 60% at 0% 15%,   ${colour} 0%, transparent 70%)`,
    `radial-gradient(ellipse 80% 60% at 100% 15%, ${colour} 0%, transparent 70%)`,
    `var(--bg)`,
  ].join(", ");
}

// ── Flip digit ────────────────────────────────────────

function createFlipDigit(initVal = "0") {
  const wrap = document.createElement("div");
  wrap.className = "flip-digit";
  wrap.innerHTML = [
    `<div class="fd-up">`,
    `  <div class="fd-face fd-static-up"><span>${initVal}</span></div>`,
    `  <div class="fd-face fd-fold-up"><span>${initVal}</span></div>`,
    `</div>`,
    `<div class="fd-dn">`,
    `  <div class="fd-face fd-static-dn"><span>${initVal}</span></div>`,
    `  <div class="fd-face fd-fold-dn"><span>${initVal}</span></div>`,
    `</div>`,
    `<div class="fd-line"></div>`,
  ].join("");
  wrap._val = initVal;
  wrap._timer = null;
  return wrap;
}

function setFlipDigit(wrap, newVal) {
  if (wrap._val === newVal) return;
  const oldVal = wrap._val;
  wrap._val = newVal;

  // Static panels immediately show the new value
  // (they are hidden behind the fold panels during the animation)
  wrap.querySelector(".fd-static-up span").textContent = newVal;
  wrap.querySelector(".fd-static-dn span").textContent = newVal;

  // Fold panels: upper carries the old digit (folds away),
  // lower carries the new digit (folds in from behind)
  wrap.querySelector(".fd-fold-up span").textContent = oldVal;
  wrap.querySelector(".fd-fold-dn span").textContent = newVal;

  // (Re)trigger animation — remove first so it restarts on rapid changes
  if (wrap._timer) clearTimeout(wrap._timer);
  wrap.classList.remove("flipping");
  void wrap.offsetWidth; // force reflow to restart CSS animation
  wrap.classList.add("flipping");
  wrap._timer = setTimeout(() => wrap.classList.remove("flipping"), 500);
}

const digits = {};

function initDigits() {
  [
    { id: "h0", parent: clockH },
    { id: "h1", parent: clockH },
    { id: "m0", parent: clockM },
    { id: "m1", parent: clockM },
  ].forEach(({ id, parent }) => {
    const el = createFlipDigit("0");
    digits[id] = el;
    parent.appendChild(el);
  });
}

// ── Tick ─────────────────────────────────────────────

function tickClock(fmt) {
  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, "0");
  let suffix = "";
  if (fmt === "12") {
    suffix = h >= 12 ? " pm" : " am";
    h = h % 12 || 12;
  }
  const hStr = String(h);

  // Hide the leading digit tile when hour is single-digit
  digits.h0.style.display = hStr.length === 1 ? "none" : "inline-block";
  if (hStr.length === 2) setFlipDigit(digits.h0, hStr[0]);
  setFlipDigit(digits.h1, hStr.length === 1 ? hStr[0] : hStr[1]);
  setFlipDigit(digits.m0, m[0]);
  setFlipDigit(digits.m1, m[1]);

  if (clockPeriod) clockPeriod.textContent = suffix;
  clockDate.textContent = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
  updateGradient();
}

export function initClock(fmt) {
  initDigits();
  tickClock(fmt);
  setInterval(() => tickClock(fmt), 1000);
}
