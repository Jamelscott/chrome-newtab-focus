export function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function faviconUrl(url, size = 32) {
  try {
    return `https://www.google.com/s2/favicons?sz=${size}&domain_url=${encodeURIComponent(new URL(url).origin)}`;
  } catch {
    return null;
  }
}

export function renderMarkdown(text) {
  if (!text || !text.trim()) return "";

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function inline(raw) {
    const slots = [];
    let s = raw.replace(/`([^`]+)`/g, (_, c) => {
      slots.push(`<code>${esc(c)}</code>`);
      return `\u0000${slots.length - 1}\u0000`;
    });
    s = esc(s)
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      .replace(/~~(.+?)~~/g, "<del>$1</del>")
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (_, t, u) =>
          `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`,
      );
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => slots[+i]);
  }

  const lines = text.split("\n");
  const out = [];
  let inList = null;
  let inCode = false;
  const codeBuf = [];

  function closeList() {
    if (inList) {
      out.push(`</${inList}>`);
      inList = null;
    }
  }

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        out.push(`<pre><code>${esc(codeBuf.join("\n"))}</code></pre>`);
        codeBuf.length = 0;
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (/^[-*_]{3,}$/.test(line.trim())) {
      closeList();
      out.push("<hr>");
      continue;
    }

    const hm = line.match(/^(#{1,6})\s+(.+)/);
    if (hm) {
      closeList();
      const lvl = hm[1].length;
      out.push(`<h${lvl}>${inline(hm[2])}</h${lvl}>`);
      continue;
    }

    if (line.startsWith("> ")) {
      closeList();
      out.push(`<blockquote><p>${inline(line.slice(2))}</p></blockquote>`);
      continue;
    }

    const ulm = line.match(/^[-*+]\s+(.*)/);
    if (ulm) {
      if (inList === "ol") {
        out.push("</ol>");
        inList = null;
      }
      if (!inList) {
        out.push("<ul>");
        inList = "ul";
      }
      out.push(`<li>${inline(ulm[1])}</li>`);
      continue;
    }

    const olm = line.match(/^\d+\.\s+(.*)/);
    if (olm) {
      if (inList === "ul") {
        out.push("</ul>");
        inList = null;
      }
      if (!inList) {
        out.push("<ol>");
        inList = "ol";
      }
      out.push(`<li>${inline(olm[1])}</li>`);
      continue;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }

    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }

  closeList();
  if (inCode) out.push(`<pre><code>${esc(codeBuf.join("\n"))}</code></pre>`);

  return out.join("");
}
