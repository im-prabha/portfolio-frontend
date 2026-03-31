// API base URL is set by config.js (loaded in HTML before this script)
const API = window.API_BASE || "http://localhost:5000";

// ── toast ──
function showToast(msg, type="success") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = "toast show " + type;
  setTimeout(() => { t.className = "toast"; }, 3500);
}

// ── auth header ──
function auth() {
  const tok = localStorage.getItem("token");
  return tok ? { "Authorization": "Bearer " + tok } : {};
}

// ── convert File to base64 data URL ──
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// ── confirm modal ──
function confirmAction(title, msg, onOk) {
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMsg").textContent   = msg;
  document.getElementById("confirmModal").style.display = "flex";
  document.getElementById("confirmOkBtn").onclick = function() {
    document.getElementById("confirmModal").style.display = "none";
    onOk();
  };
}

// ── image modal ──
function viewImage(src) {
  document.getElementById("modalImg").src = src;
  document.getElementById("imageModal").style.display = "flex";
}

// ── remove animation helper ──
function animateRemove(el, cb) {
  el.style.opacity = "0";
  el.style.transform = "scale(0.95)";
  el.style.transition = "all 0.3s ease";
  setTimeout(cb, 300);
}


// ════════════════════════════
// PROJECTS
// ════════════════════════════
function loadProjects() {
  fetch(API + "/projects")
    .then(r => r.json())
    .then(data => {
      const list  = document.getElementById("projectList");
      const count = document.getElementById("projectCount");
      if (!list) return;
      if (count) count.textContent = data.length;
      if (!data.length) { list.innerHTML = `<div class="empty-card">No projects yet.</div>`; return; }
      list.innerHTML = "";
      data.forEach(p => {
        const card = document.createElement("div");
        card.className = "list-card";

        // Build image strip
        const imgs = (p.images || []).map((img, idx) => `
          <div class="img-thumb-wrap">
            <img src="${img}" class="img-thumb" onclick="viewImage('${img}')" title="View image">
            <button class="img-thumb-del" onclick="removeProjectImage('${p._id}',${idx})" title="Remove">✕</button>
          </div>`).join("");

        const techBadges = (p.tech || []).map(t => `<span class="badge">${t.trim()}</span>`).join("");
        card.innerHTML = `
          <div class="list-card-title">${p.title}</div>
          <div class="list-card-sub">${p.description || ""}</div>
          <div class="tech-row">${techBadges}</div>
          <div class="list-card-links">
            ${p.github ? `<a href="${p.github}" target="_blank">GitHub ↗</a>` : ""}
            ${p.live   ? `<a href="${p.live}"   target="_blank">Live ↗</a>`   : ""}
          </div>
          <div class="img-strip">${imgs}</div>
          <label class="upload-label">
            📷 Add Image(s)
            <input type="file" accept="image/*" multiple onchange="uploadProjectImages('${p._id}',this)">
          </label>
          <div class="list-card-footer">
            <button class="delete-btn" onclick="deleteProject('${p._id}',this)">🗑 Delete</button>
          </div>`;
        list.appendChild(card);
      });
    })
    .catch(() => showToast("Failed to load projects","error"));
}

function addProject() {
  const title = document.getElementById("title").value.trim();
  const desc  = document.getElementById("description").value.trim();
  const tech  = document.getElementById("tech").value.split(",").map(t=>t.trim()).filter(Boolean);
  const gh    = document.getElementById("github").value.trim();
  const live  = document.getElementById("live").value.trim();
  if (!title) { showToast("Title required ❗","error"); return; }

  fetch(API+"/projects", {
    method:"POST",
    headers:{ "Content-Type":"application/json", ...auth() },
    body: JSON.stringify({ title, description:desc, tech, github:gh, live })
  }).then(r=>r.json()).then(data => {
    if (!data._id) { showToast(data.message||"Failed","error"); return; }
    showToast("Project added ✅");
    ["title","description","tech","github","live"].forEach(id => document.getElementById(id).value="");
    loadProjects();
  }).catch(() => showToast("Failed ❌","error"));
}

async function uploadProjectImages(id, input) {
  if (!input.files.length) return;
  showToast("Uploading image(s)…","info");
  try {
    const formData = new FormData();
    Array.from(input.files).forEach(f => formData.append("images", f));
    const res  = await fetch(`${API}/projects/${id}/images`, { method:"POST", headers: auth(), body: formData });
    const data = await res.json();
    if (data.message && data.message.includes("uploaded")) { showToast("Image(s) uploaded ✅"); loadProjects(); }
    else showToast(data.message||"Upload failed","error");
  } catch { showToast("Upload failed ❌","error"); }
}

function removeProjectImage(id, idx) {
  confirmAction("Remove Image?","This will delete the image.", () => {
    fetch(`${API}/projects/${id}/images/${idx}`, { method:"DELETE", headers: auth() })
      .then(() => { showToast("Image removed 🗑"); loadProjects(); })
      .catch(() => showToast("Failed","error"));
  });
}

function deleteProject(id, btn) {
  confirmAction("Delete Project?","This cannot be undone.", () => {
    animateRemove(btn.closest(".list-card"), () => {
      fetch(API+"/projects/"+id, { method:"DELETE", headers: auth() })
        .then(() => { showToast("Deleted 🗑"); loadProjects(); })
        .catch(() => showToast("Delete failed","error"));
    });
  });
}


// ════════════════════════════
// RESUME
// ════════════════════════════
function uploadResume() {
  const fi = document.getElementById("resumeFile");
  if (!fi.files.length) { showToast("Select a PDF ❗","error"); return; }
  showToast("Uploading…","info");
  const fd = new FormData();
  fd.append("resume", fi.files[0]);
  fetch(API+"/resume/upload", { method:"POST", headers: auth(), body: fd })
    .then(r=>r.json())
    .then(d => {
      if (d.message==="Resume uploaded successfully") { showToast("Resume uploaded ✅"); checkResumeExists(); }
      else showToast(d.message||"Upload failed","error");
    })
    .catch(() => showToast("Upload failed ❌","error"));
}

function viewResume()     { window.open(API+"/resume/view",     "_blank"); }
function downloadResume() { window.open(API+"/resume/download", "_blank"); }

function deleteResume() {
  confirmAction("Delete Resume?","The resume file will be permanently removed.", () => {
    fetch(API+"/resume", { method:"DELETE", headers: auth() })
      .then(r=>r.json())
      .then(d => { showToast(d.message==="Resume deleted" ? "Resume deleted 🗑" : d.message); checkResumeExists(); })
      .catch(() => showToast("Delete failed","error"));
  });
}

function checkResumeExists() {
  fetch(API+"/resume/exists")
    .then(r=>r.json())
    .then(d => {
      const status  = document.getElementById("resumeStatus");
      const actions = document.getElementById("resumeActions");
      if (status) status.textContent = d.exists ? "✅ Resume uploaded" : "No resume uploaded yet.";
      if (actions) actions.style.display = d.exists ? "flex" : "none";
    }).catch(() => {});
}


// ════════════════════════════
// SKILLS
// ════════════════════════════
function loadSkills() {
  fetch(API+"/skills").then(r=>r.json()).then(data => {
    const list  = document.getElementById("skillList");
    const count = document.getElementById("skillCount");
    if (!list) return;
    if (count) count.textContent = data.length;
    if (!data.length) { list.innerHTML = `<div class="empty-card">No skills yet.</div>`; return; }
    list.innerHTML = "";
    data.forEach(s => {
      const item = document.createElement("div");
      item.className = "skill-item";
      item.innerHTML = `
        <div class="skill-meta"><span class="skill-name">${s.name}</span><span class="skill-pct">${s.level}%</span></div>
        <div class="skill-bar-bg"><div class="skill-bar-fill" style="width:${s.level}%"></div></div>
        <div class="skill-actions"><button class="delete-btn" onclick="deleteSkill('${s._id}',this)">🗑 Delete</button></div>`;
      list.appendChild(item);
    });
  }).catch(() => showToast("Failed to load skills","error"));
}

function addSkill() {
  const name  = document.getElementById("skillName").value.trim();
  const level = parseInt(document.getElementById("skillLevel").value);
  if (!name) { showToast("Name required ❗","error"); return; }
  if (isNaN(level)||level<0||level>100) { showToast("Level 0–100 ❗","error"); return; }
  fetch(API+"/skills", { method:"POST", headers:{ "Content-Type":"application/json", ...auth() }, body: JSON.stringify({name,level}) })
    .then(r=>r.json()).then(d => {
      if (!d._id) { showToast(d.message||"Failed","error"); return; }
      showToast("Skill added ✅");
      document.getElementById("skillName").value="";
      document.getElementById("skillLevel").value="";
      loadSkills();
    }).catch(() => showToast("Failed ❌","error"));
}

function deleteSkill(id, btn) {
  confirmAction("Delete Skill?","This cannot be undone.", () => {
    animateRemove(btn.closest(".skill-item"), () => {
      fetch(API+"/skills/"+id, { method:"DELETE", headers: auth() })
        .then(() => { showToast("Deleted 🗑"); loadSkills(); })
        .catch(() => showToast("Failed","error"));
    });
  });
}


// ════════════════════════════
// CERTIFICATES
// ════════════════════════════
function loadCertificates() {
  fetch(API+"/certificates").then(r=>r.json()).then(data => {
    const list  = document.getElementById("certificateList");
    const count = document.getElementById("certCount");
    if (!list) return;
    if (count) count.textContent = data.length;
    if (!data.length) { list.innerHTML = `<div class="empty-card">No certificates yet.</div>`; return; }
    list.innerHTML = "";
    data.forEach(c => {
      const card = document.createElement("div");
      card.className = "list-card";
      card.innerHTML = `
        <div class="list-card-title">${c.title}</div>
        <div class="list-card-sub">Issued by: ${c.issuer}</div>
        ${c.link ? `<div class="list-card-links"><a href="${c.link}" target="_blank">View ↗</a></div>` : ""}
        <div class="img-upload-row">
          ${c.image
            ? `<div class="img-thumb-wrap">
                 <img src="${c.image}" class="img-thumb" onclick="viewImage('${c.image}')">
                 <button class="img-thumb-del" onclick="removeCertImage('${c._id}',this)" title="Remove">✕</button>
               </div>`
            : `<label class="upload-label">🖼 Upload Image
                 <input type="file" accept="image/*" onchange="uploadCertImage('${c._id}',this)">
               </label>`
          }
        </div>
        <div class="list-card-footer">
          <button class="delete-btn" onclick="deleteCertificate('${c._id}',this)">🗑 Delete</button>
        </div>`;
      list.appendChild(card);
    });
  }).catch(() => showToast("Failed to load certificates","error"));
}

function addCertificate() {
  const title  = document.getElementById("certTitle").value.trim();
  const issuer = document.getElementById("certIssuer").value.trim();
  const link   = document.getElementById("certLink").value.trim();
  if (!title||!issuer) { showToast("Title and issuer required ❗","error"); return; }

  // Use FormData — no image at add time, uploaded after
  const fd = new FormData();
  fd.append("title",  title);
  fd.append("issuer", issuer);
  fd.append("link",   link);

  fetch(API+"/certificates", { method:"POST", headers: auth(), body: fd })
    .then(r=>r.json()).then(d => {
      if (!d._id) { showToast(d.message||"Failed","error"); return; }
      showToast("Certificate added ✅");
      ["certTitle","certIssuer","certLink"].forEach(id => document.getElementById(id).value="");
      loadCertificates();
    }).catch(() => showToast("Failed ❌","error"));
}

async function uploadCertImage(id, input) {
  if (!input.files.length) return;
  showToast("Uploading image…","info");
  try {
    const fd = new FormData();
    fd.append("image", input.files[0]);
    const res  = await fetch(`${API}/certificates/${id}/image`, { method:"POST", headers: auth(), body: fd });
    const data = await res.json();
    if (data.message && data.message.includes("uploaded")) { showToast("Image uploaded ✅"); loadCertificates(); }
    else showToast(data.message||"Failed","error");
  } catch { showToast("Upload failed ❌","error"); }
}

function removeCertImage(id, btn) {
  confirmAction("Remove Image?","This will delete the certificate image.", () => {
    fetch(`${API}/certificates/${id}/image`, { method:"DELETE", headers: auth() })
      .then(r=>r.json())
      .then(d => { showToast(d.message||"Removed 🗑"); loadCertificates(); })
      .catch(() => showToast("Failed","error"));
  });
}

function deleteCertificate(id, btn) {
  confirmAction("Delete Certificate?","This cannot be undone.", () => {
    animateRemove(btn.closest(".list-card"), () => {
      fetch(API+"/certificates/"+id, { method:"DELETE", headers: auth() })
        .then(() => { showToast("Deleted 🗑"); loadCertificates(); })
        .catch(() => showToast("Delete failed","error"));
    });
  });
}


// ════════════════════════════
// INTERNSHIPS
// ════════════════════════════
function loadInternships() {
  fetch(API+"/internships").then(r=>r.json()).then(data => {
    const list  = document.getElementById("internshipList");
    const count = document.getElementById("internCount");
    if (!list) return;
    if (count) count.textContent = data.length;
    if (!data.length) { list.innerHTML = `<div class="empty-card">No internships yet.</div>`; return; }
    list.innerHTML = "";
    data.forEach(i => {
      const card = document.createElement("div");
      card.className = "list-card";
      card.innerHTML = `
        <div class="list-card-title">${i.role}</div>
        <div class="list-card-sub"><b style="color:#a5b4fc">${i.company}</b> · ${i.duration||""}</div>
        <div class="list-card-sub">${i.description||""}</div>
        <div class="img-upload-row">
          ${i.certificateImage
            ? `<div class="img-thumb-wrap">
                 <img src="${i.certificateImage}" class="img-thumb" onclick="viewImage('${i.certificateImage}')">
                 <button class="img-thumb-del" onclick="removeInternImage('${i._id}',this)" title="Remove">✕</button>
               </div>`
            : `<label class="upload-label">🏅 Upload Certificate
                 <input type="file" accept="image/*" onchange="uploadInternImage('${i._id}',this)">
               </label>`
          }
        </div>
        <div class="list-card-footer">
          <button class="delete-btn" onclick="deleteInternship('${i._id}',this)">🗑 Delete</button>
        </div>`;
      list.appendChild(card);
    });
  }).catch(() => showToast("Failed to load internships","error"));
}

function addInternship() {
  const company = document.getElementById("internCompany").value.trim();
  const role    = document.getElementById("internRole").value.trim();
  const dur     = document.getElementById("internDuration").value.trim();
  const desc    = document.getElementById("internDesc").value.trim();
  if (!company||!role) { showToast("Company and role required ❗","error"); return; }
  fetch(API+"/internships", { method:"POST", headers:{ "Content-Type":"application/json",...auth() }, body: JSON.stringify({company,role,duration:dur,description:desc}) })
    .then(r=>r.json()).then(d => {
      if (!d._id) { showToast(d.message||"Failed","error"); return; }
      showToast("Internship added ✅");
      ["internCompany","internRole","internDuration","internDesc"].forEach(id => document.getElementById(id).value="");
      loadInternships();
    }).catch(() => showToast("Failed ❌","error"));
}

async function uploadInternImage(id, input) {
  if (!input.files.length) return;
  showToast("Uploading…","info");
  try {
    const fd = new FormData();
    fd.append("image", input.files[0]);
    const res  = await fetch(`${API}/internships/${id}/image`, { method:"POST", headers: auth(), body: fd });
    const data = await res.json();
    if (data.message && data.message.includes("uploaded")) { showToast("Certificate uploaded ✅"); loadInternships(); }
    else showToast(data.message||"Failed","error");
  } catch { showToast("Upload failed ❌","error"); }
}

function removeInternImage(id, btn) {
  confirmAction("Remove Image?","This will delete the certificate image.", () => {
    fetch(`${API}/internships/${id}/image`, { method:"DELETE", headers: auth() })
      .then(r=>r.json())
      .then(d => { showToast(d.message||"Removed 🗑"); loadInternships(); })
      .catch(() => showToast("Failed","error"));
  });
}

function deleteInternship(id, btn) {
  confirmAction("Delete Internship?","This cannot be undone.", () => {
    animateRemove(btn.closest(".list-card"), () => {
      fetch(API+"/internships/"+id, { method:"DELETE", headers: auth() })
        .then(() => { showToast("Deleted 🗑"); loadInternships(); })
        .catch(() => showToast("Delete failed","error"));
    });
  });
}


// ════════════════════════════
// EDUCATION
// ════════════════════════════
function loadEducation() {
  fetch(API+"/education").then(r=>r.json()).then(data => {
    const list  = document.getElementById("educationList");
    const count = document.getElementById("eduCount");
    if (!list) return;
    if (count) count.textContent = data.length;
    if (!data.length) { list.innerHTML = `<div class="empty-card">No education yet.</div>`; return; }
    list.innerHTML = "";
    data.forEach(e => {
      const lbl   = e.gradeType==="cgpa" ? "CGPA" : "Percentage";
      const sfx   = e.gradeType==="percentage" ? "%" : "";
      const badge = e.gradeValue ? `<span class="grade-badge ${e.gradeType||'percentage'}">${lbl}: ${e.gradeValue}${sfx}</span>` : "";
      const card  = document.createElement("div");
      card.className = "list-card";
      card.innerHTML = `
        <div class="list-card-title">${e.degree}</div>
        <div class="list-card-sub"><b style="color:#a5b4fc">${e.institution}</b> · ${e.year||""}</div>
        ${badge ? `<div style="margin:8px 0">${badge}</div>` : ""}
        <div class="list-card-footer">
          <button class="delete-btn" onclick="deleteEducation('${e._id}',this)">🗑 Delete</button>
        </div>`;
      list.appendChild(card);
    });
  }).catch(() => showToast("Failed to load education","error"));
}

function addEducation() {
  const inst  = document.getElementById("eduInstitution").value.trim();
  const deg   = document.getElementById("eduDegree").value.trim();
  const year  = document.getElementById("eduYear").value.trim();
  const gtype = document.getElementById("eduGradeType").value;
  const gval  = document.getElementById("eduGradeValue").value.trim();
  if (!inst||!deg) { showToast("Institution and degree required ❗","error"); return; }
  fetch(API+"/education", { method:"POST", headers:{ "Content-Type":"application/json",...auth() }, body: JSON.stringify({institution:inst,degree:deg,year,gradeType:gtype,gradeValue:gval}) })
    .then(r=>r.json()).then(d => {
      if (!d._id) { showToast(d.message||"Failed","error"); return; }
      showToast("Education added ✅");
      ["eduInstitution","eduDegree","eduYear","eduGradeValue"].forEach(id => document.getElementById(id).value="");
      document.getElementById("eduGradeType").value="percentage";
      updateGradePlaceholder();
      loadEducation();
    }).catch(() => showToast("Failed ❌","error"));
}

function updateGradePlaceholder() {
  const t = document.getElementById("eduGradeType");
  const i = document.getElementById("eduGradeValue");
  if (!t||!i) return;
  i.placeholder = t.value==="cgpa" ? "e.g. 8.5  (out of 10)" : "e.g. 85  (without % sign)";
}

function deleteEducation(id, btn) {
  confirmAction("Delete Education?","This cannot be undone.", () => {
    animateRemove(btn.closest(".list-card"), () => {
      fetch(API+"/education/"+id, { method:"DELETE", headers: auth() })
        .then(() => { showToast("Deleted 🗑"); loadEducation(); })
        .catch(() => showToast("Failed","error"));
    });
  });
}


// ════════════════════════════
// CAREER SUMMARY
// ════════════════════════════
function loadCareer() {
  fetch(API+"/career").then(r=>r.json()).then(d => {
    const ta = document.getElementById("careerSummary");
    if (!ta) return;
    const s = d?.summary||"";
    ta.value = s;
    const cc = document.getElementById("charCount");
    if (cc) cc.textContent = s.length;
  }).catch(()=>{});
}

function saveCareer() {
  const s = document.getElementById("careerSummary").value.trim();
  if (!s) { showToast("Summary cannot be empty ❗","error"); return; }
  fetch(API+"/career", { method:"POST", headers:{ "Content-Type":"application/json",...auth() }, body: JSON.stringify({summary:s}) })
    .then(r=>r.json()).then(d => {
      if (d.message&&!d._id&&!d.summary) { showToast(d.message,"error"); return; }
      showToast("Career summary saved ✅");
    }).catch(() => showToast("Failed ❌","error"));
}


// ════════════════════════════
// SOCIAL LINKS
// ════════════════════════════
function loadSocial() {
  fetch(API+"/social").then(r=>r.json()).then(d => {
    if (!d) return;
    if (d.linkedin) document.getElementById("linkedin").value   = d.linkedin;
    if (d.github)   document.getElementById("githubLink").value = d.github;
    if (d.email)    document.getElementById("email").value      = d.email;
  }).catch(()=>{});
}

function saveSocial() {
  const li = document.getElementById("linkedin").value.trim();
  const gh = document.getElementById("githubLink").value.trim();
  const em = document.getElementById("email").value.trim();
  fetch(API+"/social", { method:"POST", headers:{ "Content-Type":"application/json",...auth() }, body: JSON.stringify({linkedin:li,github:gh,email:em}) })
    .then(r=>r.json()).then(d => {
      if (d.message&&!d._id) { showToast(d.message,"error"); return; }
      showToast("Social links saved ✅");
    }).catch(() => showToast("Failed ❌","error"));
}


// ════════════════════════════
// CREDENTIALS
// ════════════════════════════
function changeCredentials() {
  const cur  = document.getElementById("currentPassword").value;
  const user = document.getElementById("newUsername").value.trim();
  const pw   = document.getElementById("newPassword").value;
  const conf = document.getElementById("confirmNewPassword").value;
  if (!cur)              { showToast("Current password required ❗","error"); return; }
  if (pw&&pw!==conf)     { showToast("Passwords don't match ❗","error"); return; }
  if (pw&&pw.length<6)   { showToast("Min 6 characters ❗","error"); return; }
  fetch(API+"/auth/change-credentials", { method:"POST", headers:{ "Content-Type":"application/json",...auth() }, body: JSON.stringify({currentPassword:cur,newUsername:user,newPassword:pw}) })
    .then(r=>r.json()).then(d => {
      if (d.message==="Credentials updated successfully") {
        showToast("Updated ✅ — logging out…");
        setTimeout(()=>{ localStorage.removeItem("token"); window.location.href="admin-login.html"; }, 2000);
      } else showToast(d.message||"Failed","error");
    }).catch(()=>showToast("Failed ❌","error"));
}

function updateCredentialKey() {
  const pw  = document.getElementById("keyCurrentPassword").value;
  const key = document.getElementById("newCredentialKey").value.trim();
  if (!pw||!key) { showToast("All fields required ❗","error"); return; }
  if (key.length<6) { showToast("Key must be ≥ 6 chars ❗","error"); return; }
  fetch(API+"/auth/update-credential-key", { method:"POST", headers:{ "Content-Type":"application/json",...auth() }, body: JSON.stringify({currentPassword:pw,newCredentialKey:key}) })
    .then(r=>r.json()).then(d => {
      if (d.message==="Credential key updated successfully") {
        showToast("Key updated ✅");
        document.getElementById("keyCurrentPassword").value="";
        document.getElementById("newCredentialKey").value="";
      } else showToast(d.message||"Failed","error");
    }).catch(()=>showToast("Failed ❌","error"));
}


// ════════════════════════════
// DRAG & DROP RESUME
// ════════════════════════════
function initDropZone() {
  const zone = document.getElementById("resumeDropZone");
  if (!zone) return;
  zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", e => {
    e.preventDefault(); zone.classList.remove("dragover");
    const f = e.dataTransfer.files[0];
    if (f) {
      const dt = new DataTransfer(); dt.items.add(f);
      document.getElementById("resumeFile").files = dt.files;
      document.getElementById("resumeFileName").textContent = "📎 " + f.name;
    }
  });
  document.getElementById("resumeFile").addEventListener("change", function() {
    document.getElementById("resumeFileName").textContent = this.files[0] ? "📎 " + this.files[0].name : "";
  });
}


// ════════════════════════════
// PAGE LOAD
// ════════════════════════════
window.onload = function() {
  if (window.location.pathname.includes("admin-dashboard")) {
    if (!localStorage.getItem("token")) { window.location.href="admin-login.html"; return; }
  }
  loadProjects(); loadSkills(); loadCertificates();
  loadInternships(); loadEducation(); loadCareer(); loadSocial();
  initDropZone(); updateGradePlaceholder(); checkResumeExists();

  const ta = document.getElementById("careerSummary");
  if (ta) ta.addEventListener("input", function() {
    const cc = document.getElementById("charCount");
    if (cc) cc.textContent = this.value.length;
  });
};