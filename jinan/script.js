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

let allFiles = [];
let currentCategory = "all";

// Load daftar file
async function loadFileList() {
  try {
    const res = await fetch("files.json");
    const data = await res.json();
    allFiles = data.files.sort();
    populateCategoryTabs();
    renderFileList();
  } catch (e) {
    console.error(e);
  }
}

// Render file list sesuai kategori + search
function renderFileList(){
  const list = document.getElementById("fileList");
  list.innerHTML = "";
  const keyword = document.getElementById("searchBox").value.toLowerCase();

  const filtered = allFiles.filter(f=>{
    if(currentCategory !== "all" && !f.includes("/"+currentCategory+"/")) return false;
    if(keyword && !f.toLowerCase().includes(keyword)) return false;
    return true;
  });

  filtered.forEach(file=>{
    const li = document.createElement("li");
    li.textContent = file;
    li.addEventListener("click", ()=>loadMarkdown(file));
    list.appendChild(li);
  });
}

// Buat tab kategori
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
      currentCategory = tab.dataset.filter;
      renderFileList();
    });
  });
}

// Load Markdown ke dalam lightbox
async function loadMarkdown(path) {
  try {
    const res = await fetch(encodeURI(path));
    if (!res.ok) {
      document.getElementById("preview").innerHTML = `<h3>404 File Not Found</h3>`;
    } else {
      const text = await res.text();
      document.getElementById("preview").innerHTML = mdToHtml(text, path);
    }
    document.getElementById("lightboxOverlay").style.display = "flex";
  } catch (e) {
    document.getElementById("preview").innerHTML = "<h3>Failed to load file</h3>";
    document.getElementById("lightboxOverlay").style.display = "flex";
  }
}

// Close lightbox
document.getElementById("closeBtn").addEventListener("click", ()=>{
  document.getElementById("lightboxOverlay").style.display = "none";
});
document.getElementById("lightboxOverlay").addEventListener("click", (e)=>{
  if(e.target.id==="lightboxOverlay"){
    document.getElementById("lightboxOverlay").style.display = "none";
  }
});

document.getElementById("searchBox").addEventListener("input", renderFileList);

loadFileList();
