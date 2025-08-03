function escapeHtml(text){
  return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function mdToHtml(md, basePath){
  const lines = md.split("\n");
  let html = "";
  let stack = [];
  let inCode = false;

  function parseInline(text){
    return text
      .replace(/!\[(.*?)\]\((.*?)\)/g, (m, alt, src) => {
        if (!src.startsWith("http") && basePath) {
          const folder = basePath.substring(0, basePath.lastIndexOf("/") + 1);
          src = folder + src;
        }
        return `<img alt="${alt}" src="${src}">`;
      })
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  for (let line of lines) {
    if (/^```/.test(line)) {
      inCode = !inCode;
      html += inCode ? "<pre><code>" : "</code></pre>";
      continue;
    }
    if (inCode) { html += escapeHtml(line)+"\n"; continue; }

    if (/^### /.test(line)) { html += "<h3>"+line.slice(4)+"</h3>"; continue; }
    if (/^## /.test(line)) { html += "<h2>"+line.slice(3)+"</h2>"; continue; }
    if (/^# /.test(line)) { html += "<h1>"+line.slice(2)+"</h1>"; continue; }

    const match = line.match(/^(\s*)- (.*)/);
    if (match) {
      const indent = match[1].length;
      const content = parseInline(match[2]);

      if (!stack.length || indent > stack[stack.length-1]) {
        html += "<ul>";
        stack.push(indent);
      }
      while (stack.length && indent < stack[stack.length-1]) {
        html += "</ul>";
        stack.pop();
      }
      html += "<li>"+content+"</li>";
    }
    else if (/^\s+/.test(line) && stack.length) {
      html = html.replace(/<\/li>$/, "<br>"+parseInline(line.trim())+"</li>");
    }
    else {
      while (stack.length) {
        html += "</ul>";
        stack.pop();
      }
      if (line.trim()!=="") html += "<p>"+parseInline(line)+"</p>";
    }
  }

  while (stack.length) {
    html += "</ul>";
    stack.pop();
  }

  return html;
}

async function loadFileList() {
  try {
    const res = await fetch("files.json");
    const data = await res.json();
    const select = document.getElementById("fileSelect");
    select.innerHTML = data.files.map(f => `<option value="${f}">${f}</option>`).join("");
    loadMarkdown(data.files[0]);
  } catch (e) {
    document.getElementById("preview").innerHTML = "<h3>Cannot load files.json</h3>";
  }
}

async function loadMarkdown(path) {
  try {
    const res = await fetch(encodeURI(path)); // FIX: support spasi
    if (!res.ok) {
      document.getElementById("preview").innerHTML = `<h3>404 File Not Found</h3>`;
      return;
    }
    const text = await res.text();
    document.getElementById("preview").innerHTML = mdToHtml(text, path);
  } catch (e) {
    document.getElementById("preview").innerHTML = "<h3>Failed to load file</h3>";
  }
}

document.getElementById("fileSelect").addEventListener("change", e => {
  loadMarkdown(e.target.value);
});

loadFileList();
