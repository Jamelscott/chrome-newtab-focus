import { faviconUrl } from "./utils.js";

const MAX_FAVS = 12;

function makeFavEl({ label, url }) {
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
  return a;
}

function makeAddBtn(onAdd) {
  const btn = document.createElement("button");
  btn.className = "fav-item fav-add";
  btn.title = "Add favourite";
  btn.innerHTML = `<span class="fav-add-icon">+</span><span class="fav-label">Add</span>`;

  btn.addEventListener("click", () => {
    const form = document.createElement("div");
    form.className = "fav-item fav-add-form";

    const urlInput = document.createElement("input");
    urlInput.className = "fav-add-url";
    urlInput.placeholder = "https://…";
    urlInput.type = "text";
    urlInput.spellcheck = false;

    const labelInput = document.createElement("input");
    labelInput.className = "fav-add-label";
    labelInput.placeholder = "Label";
    labelInput.type = "text";

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "fav-add-confirm";
    confirmBtn.textContent = "✓";
    confirmBtn.type = "button";

    form.appendChild(urlInput);
    form.appendChild(labelInput);
    form.appendChild(confirmBtn);
    btn.replaceWith(form);
    urlInput.focus();

    function submit() {
      let url = urlInput.value.trim();
      if (!url) {
        cancel();
        return;
      }
      if (!/^https?:\/\//i.test(url)) url = "https://" + url;
      let label = labelInput.value.trim();
      if (!label) {
        try {
          label = new URL(url).hostname;
        } catch {
          label = url;
        }
      }
      onAdd({ url, label });
    }

    function cancel() {
      form.replaceWith(btn);
    }

    confirmBtn.addEventListener("click", submit);
    [urlInput, labelInput].forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
        if (e.key === "Escape") cancel();
      });
    });

    setTimeout(() => {
      document.addEventListener("click", function onOutside(e) {
        if (!form.contains(e.target)) {
          cancel();
          document.removeEventListener("click", onOutside);
        }
      });
    }, 0);
  });

  return btn;
}

export function renderFavs(favs, onAdd) {
  const grid = document.getElementById("fav-grid");
  grid.innerHTML = "";
  favs.forEach((fav) => {
    if (fav.url) grid.appendChild(makeFavEl(fav));
  });
  if (favs.length < MAX_FAVS && onAdd) grid.appendChild(makeAddBtn(onAdd));
}
