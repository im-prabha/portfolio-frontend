// API base URL is set by config.js (loaded in HTML before this script)
const API = window.API_BASE || "http://localhost:5000";

// ── download resume ──
function downloadResume() { window.open(API + "/resume/download"); }

// ── image modal (public) ──
function openImgModal(src) {
  let modal = document.getElementById("publicImgModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "publicImgModal";
    modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:9999;cursor:pointer;animation:fadeIn 0.2s ease;";
    modal.innerHTML = `
      <div style="position:relative;max-width:92vw;max-height:92vh;" onclick="event.stopPropagation()">
        <button onclick="document.getElementById('publicImgModal').style.display='none'"
          style="position:absolute;top:-14px;right:-14px;width:30px;height:30px;border-radius:50%;background:#1e293b;border:1px solid rgba(255,255,255,0.15);color:#fff;cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center;">✕</button>
        <img id="publicImgSrc" src="" style="max-width:88vw;max-height:88vh;border-radius:12px;object-fit:contain;display:block;">
      </div>`;
    modal.addEventListener("click", () => modal.style.display = "none");
    document.body.appendChild(modal);
  }
  document.getElementById("publicImgSrc").src = src;
  modal.style.display = "flex";
}


// ════════════════════════
// LOAD PROJECTS
// ════════════════════════
function loadProjects() {
  const container = document.getElementById("projects");
  if (!container) return;
  container.innerHTML = loadingHTML();

  fetch(API + "/projects")
    .then(r => r.json())
    .then(data => {
      container.innerHTML = "";
      if (!data.length) { container.innerHTML = emptyHTML("No projects yet. Check back soon!"); return; }
      data.forEach((p, i) => {
        const techBadges = (p.tech || []).map(t => `<span class="badge">${t.trim()}</span>`).join("");
        const imgs = p.images || [];

        // Build image gallery
        let galleryHTML = "";
        if (imgs.length) {
          const slides = imgs.map(img => `
            <img src="${img}" class="pc-gallery-img" alt="${p.title}" onclick="openImgModal('${img}')">`).join("");
          galleryHTML = `
            <div class="pc-gallery">
              <div class="pc-gallery-inner">${slides}</div>
              <div class="pc-gallery-overlay">🔍 Click to view</div>
              ${imgs.length > 1 ? `<div class="pc-img-count">${imgs.length} images</div>` : ""}
            </div>`;
        }

        const card = document.createElement("div");
        card.className = "project-card";
        card.style.animationDelay = (i * 0.08) + "s";
        card.innerHTML = `
          ${galleryHTML}
          <div class="pc-body">
            <div class="pc-top">
              <div class="pc-icon">⬡</div>
              <div class="pc-links">
                ${p.github ? `<a href="${p.github}" target="_blank" class="pc-link">GitHub ↗</a>` : ""}
                ${p.live   ? `<a href="${p.live}"   target="_blank" class="pc-link live">Live ↗</a>` : ""}
              </div>
            </div>
            <h3>${p.title}</h3>
            <p>${p.description || ""}</p>
            <div class="pc-tech">${techBadges}</div>
          </div>`;
        container.appendChild(card);
      });
    })
    .catch(() => { if (container) container.innerHTML = emptyHTML("Failed to load projects."); });
}


// ════════════════════════
// LOAD SKILLS
// ════════════════════════
function loadSkills() {
  const container = document.getElementById("skills");
  if (!container) return;

  fetch(API + "/skills")
    .then(r => r.json())
    .then(data => {
      container.innerHTML = "";
      if (!data.length) { container.innerHTML = emptyHTML("No skills listed yet."); return; }
      data.forEach((s, i) => {
        const div = document.createElement("div");
        div.className = "skill-pill";
        div.style.animationDelay = (i * 0.06) + "s";
        div.innerHTML = `
          <div class="sp-header"><span class="sp-name">${s.name}</span><span class="sp-pct">${s.level}%</span></div>
          <div class="sp-bar-bg"><div class="sp-bar-fill" data-w="${s.level}%" style="width:0%"></div></div>`;
        container.appendChild(div);
      });
      // Animate bars
      requestAnimationFrame(() => {
        setTimeout(() => {
          document.querySelectorAll(".sp-bar-fill").forEach(b => { b.style.width = b.dataset.w; });
        }, 100);
      });
    })
    .catch(err => console.error("Skills:", err));
}


// ════════════════════════
// LOAD CERTIFICATES
// ════════════════════════
function loadCertificates() {
  const container = document.getElementById("certificates");
  if (!container) return;
  container.innerHTML = loadingHTML();

  fetch(API + "/certificates")
    .then(r => r.json())
    .then(data => {
      container.innerHTML = "";
      if (!data.length) { container.innerHTML = emptyHTML("No certificates yet."); return; }
      data.forEach((c, i) => {
        const div = document.createElement("div");
        div.className = "cert-card";
        div.style.animationDelay = (i * 0.08) + "s";
        div.innerHTML = `
          ${c.image
            ? `<div class="cert-thumb-wrap" onclick="openImgModal('${c.image}')">
                 <img src="${c.image}" class="cert-thumb" alt="${c.title}">
                 <div class="cert-thumb-overlay">🔍 View</div>
               </div>`
            : `<div class="cert-no-img">🏆</div>`
          }
          <div class="cert-body">
            <h3>${c.title}</h3>
            <p class="cert-issuer">${c.issuer}</p>
            ${c.link ? `<a href="${c.link}" target="_blank" class="cert-link-btn">View Certificate ↗</a>` : ""}
          </div>`;
        container.appendChild(div);
      });
    })
    .catch(() => { if (container) container.innerHTML = emptyHTML("Failed to load certificates."); });
}


// ════════════════════════
// LOAD INTERNSHIPS
// ════════════════════════
function loadInternships() {
  const container = document.getElementById("internships");
  if (!container) return;
  container.innerHTML = loadingHTML();

  fetch(API + "/internships")
    .then(r => r.json())
    .then(data => {
      container.innerHTML = "";
      if (!data.length) { container.innerHTML = emptyHTML("No internships yet."); return; }
      data.forEach((item, i) => {
        const div = document.createElement("div");
        div.className = "timeline-item";
        div.style.animationDelay = (i * 0.1) + "s";
        div.innerHTML = `
          <div class="tl-dot"></div>
          <div class="tl-content">
            <div class="tl-header">
              <h3>${item.role}</h3>
              <span class="tl-duration">${item.duration || ""}</span>
            </div>
            <div class="tl-company">${item.company}</div>
            <p class="tl-desc">${item.description || ""}</p>
            ${item.certificateImage
              ? `<div class="tl-cert-img-wrap" onclick="openImgModal('${item.certificateImage}')">
                   <img src="${item.certificateImage}" class="tl-cert-thumb" alt="Certificate">
                   <div class="tl-cert-overlay">🏅 View Certificate</div>
                 </div>`
              : ""}
          </div>`;
        container.appendChild(div);
      });
    })
    .catch(() => { if (container) container.innerHTML = emptyHTML("Failed to load internships."); });
}


// ════════════════════════
// LOAD EDUCATION
// ════════════════════════
function loadEducation() {
  const container = document.getElementById("education");
  if (!container) return;
  container.innerHTML = loadingHTML();

  fetch(API + "/education")
    .then(r => r.json())
    .then(data => {
      container.innerHTML = "";
      if (!data.length) { container.innerHTML = emptyHTML("No education listed yet."); return; }
      data.forEach((item, i) => {
        const gradeLabel  = item.gradeType === "cgpa" ? "CGPA" : "Percentage";
        const gradeSuffix = item.gradeType === "percentage" ? "%" : "";
        const gradeStr    = item.gradeValue
          ? `<span class="edu-grade-badge ${item.gradeType || "percentage"}">${gradeLabel}: ${item.gradeValue}${gradeSuffix}</span>`
          : "";
        const div = document.createElement("div");
        div.className = "timeline-item";
        div.style.animationDelay = (i * 0.1) + "s";
        div.innerHTML = `
          <div class="tl-dot"></div>
          <div class="tl-content">
            <div class="tl-header">
              <h3>${item.degree}</h3>
              <span class="tl-duration">${item.year || ""}</span>
            </div>
            <div class="tl-company">${item.institution}</div>
            ${gradeStr ? `<div style="margin-top:8px">${gradeStr}</div>` : ""}
          </div>`;
        container.appendChild(div);
      });
    })
    .catch(() => { if (container) container.innerHTML = emptyHTML("Failed to load education."); });
}


// ════════════════════════
// LOAD CAREER SUMMARY
// ════════════════════════
function loadCareer() {
  const container = document.getElementById("career");
  if (!container) return;

  fetch(API + "/career")
    .then(r => r.json())
    .then(data => {
      const item = Array.isArray(data) ? data[0] : data;
      if (!item || !item.summary) {
        container.innerHTML = `<p class="empty-state" style="border:none;padding:0;text-align:left;">Career summary coming soon.</p>`;
        return;
      }
      container.innerHTML = `<p class="career-text">${item.summary}</p>`;
    })
    .catch(() => { if (container) container.innerHTML = ""; });
}


// ════════════════════════
// LOAD SOCIAL LINKS
// ════════════════════════
function loadSocial() {
  const container = document.getElementById("social");
  if (!container) return;

  fetch(API + "/social")
    .then(r => r.json())
    .then(data => {
      const d = Array.isArray(data) ? data[0] : data;
      if (!d) return;
      container.innerHTML = "";
      const links = [
        { label:"LinkedIn", icon:"in", href:d.linkedin,                         color:"#0a66c2" },
        { label:"GitHub",   icon:"gh", href:d.github,                           color:"#6e5494" },
        { label:"Email",    icon:"@",  href:d.email ? `mailto:${d.email}` : "", color:"#6366f1" },
      ];
      links.forEach(l => {
        if (!l.href) return;
        const a = document.createElement("a");
        a.className = "social-card-link";
        a.href = l.href;
        if (!l.href.startsWith("mailto")) a.target = "_blank";
        a.innerHTML = `
          <span class="sc-icon" style="background:${l.color}22;color:${l.color}">${l.icon}</span>
          <span class="sc-label">${l.label}</span>
          <span class="sc-arrow">↗</span>`;
        container.appendChild(a);
      });
    })
    .catch(err => console.error("Social:", err));
}


// ════════════════════════
// RESUME VIEWER (index)
// ════════════════════════
function loadResumeViewer() {
  const section = document.getElementById("resumeViewerSection");
  const frame   = document.getElementById("resumeFrame");
  if (!section || !frame) return;

  fetch(API + "/resume/exists")
    .then(r => r.json())
    .then(d => {
      if (d.exists) {
        frame.src = API + "/resume/view";
        section.style.display = "block";
      }
    })
    .catch(() => {});
}


// ════════════════════════
// HELPERS
// ════════════════════════
function loadingHTML() {
  return `<div class="loading-row"><span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span></div>`;
}

function emptyHTML(msg) {
  return `<p class="empty-state">${msg}</p>`;
}


// ════════════════════════
// NAV TOGGLE (mobile)
// ════════════════════════
function toggleNav() {
  document.getElementById("navLinks")?.classList.toggle("open");
}


// ════════════════════════
// PAGE LOAD ROUTER
// ════════════════════════
window.onload = function () {
  const path = location.pathname;

  if      (path.includes("projects"))     loadProjects();
  else if (path.includes("certificates")) loadCertificates();
  else if (path.includes("education"))    loadEducation();
  else if (path.includes("internships"))  loadInternships();
  else if (path.includes("contact"))      loadSocial();
  else {
    // index.html
    loadCareer();
    loadSkills();
    loadResumeViewer();
  }

  // active nav link
  document.querySelectorAll(".nav-links a").forEach(a => {
    if (a.href === location.href) a.classList.add("active");
  });
};