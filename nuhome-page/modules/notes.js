import { storageGet, storageSet } from "./storage.js";
import { escHtml, renderMarkdown } from "./utils.js";

const NOTES_KEY = "ntf_notes";
const MAX_NOTES = 6;

let notes = [];

const NOTE_COLORS = [
  { id: "default", bg: "#1e1e2a", header: "#16161f", label: "Default" },
  { id: "indigo", bg: "#1a1a3a", header: "#13132b", label: "Indigo" },
  { id: "teal", bg: "#0f2428", header: "#0b1c20", label: "Teal" },
  { id: "rose", bg: "#2a1420", header: "#1f0f17", label: "Rose" },
  { id: "amber", bg: "#241508", header: "#1c1006", label: "Amber" },
];

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
    <div class="note-body-preview" hidden></div>
    <div class="note-resize"></div>
  `;

  applyNoteColor(el, note.color);

  // Colour swatches
  const colorsEl = el.querySelector(".note-colors");
  el.querySelectorAll(".note-swatch").forEach((s) => {
    s.addEventListener("click", (e) => {
      e.stopPropagation();
      if (s.classList.contains("active")) {
        colorsEl.classList.toggle("open");
      } else {
        note.color = s.dataset.color;
        applyNoteColor(el, note.color);
        colorsEl.classList.remove("open");
        saveNotes();
      }
    });
  });
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

  // Markdown preview toggle
  const noteTextarea = el.querySelector(".note-body");
  const mdPreview = el.querySelector(".note-body-preview");

  function enterViewMode() {
    const html = renderMarkdown(note.description);
    if (html) {
      mdPreview.innerHTML = html;
      mdPreview.hidden = false;
      noteTextarea.hidden = true;
    } else {
      mdPreview.hidden = true;
      noteTextarea.hidden = false;
    }
  }

  function enterEditMode() {
    mdPreview.hidden = true;
    noteTextarea.hidden = false;
  }

  noteTextarea.addEventListener("focus", enterEditMode);
  noteTextarea.addEventListener("blur", () => {
    note.description = noteTextarea.value;
    saveNotes();
    enterViewMode();
  });
  mdPreview.addEventListener("click", (e) => {
    if (e.target.classList.contains("md-checkbox")) {
      // Toggle the corresponding - [ ] / - [x] line in the raw markdown
      const checkboxes = Array.from(mdPreview.querySelectorAll(".md-checkbox"));
      const idx = checkboxes.indexOf(e.target);
      const lines = note.description.split("\n");
      let count = 0;
      for (let i = 0; i < lines.length; i++) {
        if (/^(?:[-*+]\s+)?\[[ xX]\]/.test(lines[i])) {
          if (count === idx) {
            lines[i] = e.target.checked
              ? lines[i].replace(/\[ \]/, "[x]")
              : lines[i].replace(/\[[xX]\]/, "[ ]");
            break;
          }
          count++;
        }
      }
      note.description = lines.join("\n");
      noteTextarea.value = note.description;
      saveNotes();
      // Re-render to reflect change without switching to edit mode
      enterViewMode();
      return;
    }
    enterEditMode();
    noteTextarea.focus();
  });

  if (note.description.trim()) enterViewMode();

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

function autoArrangeNotes() {
  const GAP = 32;
  const START_X = 20,
    START_Y = 20;
  const MAX_Y = window.innerHeight - 20;
  let currentX = START_X,
    currentY = START_Y,
    colWidth = 0;

  notes.forEach((note) => {
    if (currentY + note.height > MAX_Y && currentY !== START_Y) {
      currentX += colWidth + GAP;
      currentY = START_Y;
      colWidth = 0;
    }
    note.x = currentX;
    note.y = currentY;
    currentY += note.height + GAP;
    colWidth = Math.max(colWidth, note.width);
    const el = document.getElementById(`note-${note.id}`);
    if (el) {
      el.style.left = `${note.x}px`;
      el.style.top = `${note.y}px`;
    }
  });
  saveNotes();
}

export function initNotes() {
  document.getElementById("arrange-notes-btn").addEventListener("click", () => {
    if (notes.length === 0) return;
    autoArrangeNotes();
  });

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
}
