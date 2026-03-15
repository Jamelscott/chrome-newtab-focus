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

export function initClock(fmt) {
  tickClock(fmt);
  setInterval(() => tickClock(fmt), 1000);
}
