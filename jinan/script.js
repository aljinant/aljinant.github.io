function escapeHtml(text){
  return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function parseInline(text, basePath){
  return text
    .replace(/!\[(.*?)\]\((.*?)\)/g, (m, alt, src) => {
      if (!src.startsWith("http") && basePath) {
        let folder = basePath;
        if (folder.includes("/")) {
          folder = folder.substring(0, folder.lastIndexOf("/") + 1);
        }
        src = folder + src;   
      }
      return `<img alt="${alt}" src="${src}">`;
    })
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function mdToHtml(md, basePath){
  const lines = md.split("\n");
  let html = "";
  let stack = [];
  let inCode = false;

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
      const content = parseInline(match[2], basePath);

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
      html = html.replace(/<\/li>$/, "<br>"+parseInline(line.trim(), basePath)+"</li>");
    }
    else {
      while (stack.length) {
        html += "</ul>";
        stack.pop();
      }
      if (line.trim()!=="") html += "<p>"+parseInline(line, basePath)+"</p>";
    }
  }

  while (stack.length) {
    html += "</ul>";
    stack.pop();
  }

  return html;
}

// 🔥 GLOBAL
let allFiles = [];

// 🔥 Load daftar file
async function loadFileList() {
  try {
    const res = await fetch("files.json");
    const data = await res.json();
    allFiles = data.files;
    populateCategoryTabs();
    renderFileList("all");
  } catch (e) {
    document.getElementById("preview").innerHTML = "<h3>Cannot load files.json</h3>";
  }
}

// 🔥 Render daftar file sesuai kategori
function renderFileList(filter){
  const select = document.getElementById("fileSelect");
  const filtered = allFiles.filter(f=>{
    if(filter==="all") return true;
    return f.includes("/"+filter+"/");
  });

  select.innerHTML = filtered.map(f => `<option value="${f}">${f}</option>`).join("");

  if(filtered.length>0){
    loadMarkdown(filtered[0]);
  } else {
    document.getElementById("preview").innerHTML = "<h3>Tidak ada file</h3>";
  }
}

// 🔥 Buat tab kategori
function populateCategoryTabs(){
  const tabs = document.getElementById("categoryTabs");
  const categories = ["all","web","jaringan","cse"];

  tabs.innerHTML = categories.map(cat=>{
    let label = cat==="all"?"Semua":cat.charAt(0).toUpperCase()+cat.slice(1);
    return `<li data-filter="${cat}" class="${cat==="all"?"active":""}">${label}</li>`;
  }).join("");

  document.querySelectorAll("#categoryTabs li").forEach(tab=>{
    tab.addEventListener("click", ()=>{
      document.querySelectorAll("#categoryTabs li").forEach(t=>t.classList.remove("active"));
      tab.classList.add("active");
      renderFileList(tab.dataset.filter);
    });
  });
}

// 🔥 Load Markdown
async function loadMarkdown(path) {
  try {
    const res = await fetch(encodeURI(path));
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

// 🔥 Event select file
document.getElementById("fileSelect").addEventListener("change", e => {
  loadMarkdown(e.target.value);
});

loadFileList();
