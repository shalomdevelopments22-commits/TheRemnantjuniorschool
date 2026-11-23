let adminEditMode = false;
function genCode(prefix) { return prefix + "-" + Math.floor(1000 + Math.random() * 9000); }

const defaultData = {
  passRate: "98.5%",
  progress: [
    { title: "New ICT & Early Robotics Corner", desc: "Equipped ECD A, ECD B & Primary classrooms with interactive tablets.", img: "https://unsplash.com" },
    { title: "98.5% Grade Readiness & HBC Mastery", desc: "Strong results across Maths, English, ChiShona & Science Ventures.", img: "https://unsplash.com" }
  ],
  activities: [
    { title: "Wednesday Adventist & Adventurer Club", desc: "Every Wednesday students wear Adventist/Adventurer uniforms for leadership drills.", img: "https://unsplash.com" },
    { title: "Mass Display & Physical Education", desc: "Weekly coordinated routines, skipping, and athletics.", img: "https://unsplash.com" }
  ],
  enrolments: [],
  payments: [],
  students: [],
  staff: [],
  messages: []
};

let db = JSON.parse(localStorage.getItem("trjs_portal_v2")) || defaultData;
function saveDB() { localStorage.setItem("trjs_portal_v2", JSON.stringify(db)); }

function switchView(id, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function toggleAdminEdit() {
  adminEditMode = !adminEditMode;
  document.body.classList.toggle('admin-editing', adminEditMode);
  const btn = document.getElementById('editModeBtn');
  btn.textContent = adminEditMode ? 'Admin Front-End Edit: ON' : 'Admin Front-End Edit: OFF';
  btn.classList.toggle('on', adminEditMode);
  const pr = document.getElementById('passRateDisplay');
  pr.contentEditable = adminEditMode;
  pr.classList.toggle('editable-highlight', adminEditMode);
  document.querySelectorAll('.edit-only').forEach(el => el.style.display = adminEditMode ? 'inline-block' : 'none');
  renderAll();
}
function renderCards(type, cid) {
  document.getElementById(cid).innerHTML = db[type].map((item, i) => `
    <div class="media-card"><img src="${item.img}" alt="${item.title}" />
      <div class="media-body">
        <h4 contenteditable="${adminEditMode}" class="${adminEditMode?'editable-highlight':''}" onblur="db['${type}'][${i}].title=this.innerText;saveDB();">${item.title}</h4>
        <p contenteditable="${adminEditMode}" class="${adminEditMode?'editable-highlight':''}" onblur="db['${type}'][${i}].desc=this.innerText;saveDB();" style="font-size:0.86rem;color:#64748b;">${item.desc}</p>
      </div>
      <div class="edit-controls"><label>Replace Picture:</label><input type="file" accept="image/*" onchange="uploadImg(event,'${type}',${i})" /></div>
    </div>`).join('');
}
function uploadImg(e, type, i) { const f = e.target.files[0]; if(!f)return; const r = new FileReader(); r.onload = ev => { db[type][i].img = ev.target.result; saveDB(); renderAll(); }; r.readAsDataURL(f); }
function addNewCard(type) { db[type].push({ title: "New Update", desc: "Click to edit.", img: "https://unsplash.com" }); saveDB(); renderAll(); }

function submitEnrolment(e) {
  e.preventDefault();
  const pRef = genCode("PAR"), sCode = genCode("STU");
  db.enrolments.unshift({ child: enrolChild.value, cls: enrolClass.value, parent: enrolParent.value, phone: enrolPhone.value, status: "Pending", parentRef: pRef, studentCode: sCode });
  saveDB(); e.target.reset(); renderAll();
  alert(`Enrolment submitted!\nParent Reference Code: ${pRef}\nStudent Access Code: ${sCode}`);
}

function approveEnrolment(i) {
  const en = db.enrolments[i]; en.status = "Approved";
  if (!en.parentRef) en.parentRef = genCode("PAR");
  if (!en.studentCode) en.studentCode = genCode("STU");
  db.students.push({ name: en.child, cls: en.cls, parentRef: en.parentRef, studentCode: en.studentCode, week: {Mon:"Present",Tue:"Present",Wed:"Present",Thu:"Present",Fri:"Present"}, attendanceHistory: [], behavior: "Good conduct.", performance: [], exams: [] });
  saveDB(); renderAll();
}

function addExistingStudent() {
  const name = document.getElementById('quickStudentName').value.trim();
  const cls = document.getElementById('quickStudentClass').value;
  if (!name) return;
  const pRef = genCode("PAR"), sCode = genCode("STU");
  db.students.push({ name, cls, parentRef: pRef, studentCode: sCode, week: {Mon:"Present",Tue:"Present",Wed:"Present",Thu:"Present",Fri:"Present"}, attendanceHistory: [], behavior: "Good conduct.", performance: [], exams: [] });
  document.getElementById('quickStudentName').value = "";
  saveDB(); renderAll();
  alert(`Added ${name}!\nGenerated Parent Ref: ${pRef}\nGenerated Student Code: ${sCode}`);
}

function toggleDay(sIdx, day) {
  db.students[sIdx].week[day] = db.students[sIdx].week[day] === "Present" ? "Absent" : "Present";
  saveDB(); renderAll();
}

function submitWeeklyRegister() {
  const teacher = document.getElementById('registerTeacherName').value.trim();
  if (!teacher) { alert("Please enter the name of the teacher marking the register before submitting."); return; }
  const wk = document.getElementById('registerWeekDate').value || new Date().toISOString().slice(0,10);
  db.students.forEach(s => {
    const presentCount = Object.values(s.week).filter(d => d === "Present").length;
    const absDays = Object.entries(s.week).filter(([k,v]) => v === "Absent").map(([k]) => k).join(", ");
    s.attendanceHistory.unshift(`Week of ${wk}: ${presentCount}/5 Present${absDays ? " (Absent: " + absDays + ")" : ""} — Marked by ${teacher}`);
  });
  saveDB(); renderAll();
  alert(`Weekly attendance register submitted by ${teacher}!`);
}

function openStudentModal(idx) {
  const s = db.students[idx];
  document.getElementById('stuModalTitle').innerText = `${s.name} (${s.cls})`;
  document.getElementById('stuModalBody').innerHTML = `
    <div style="background:#eff6ff;padding:0.75rem;border-radius:6px;margin-bottom:0.85rem;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0.5rem;">
      <div><strong>Parent Ref:</strong> <code>${s.parentRef || 'None'}</code> | <strong>Student Code:</strong> <code>${s.studentCode || 'None'}</code></div>
      <button class="btn btn-sm" onclick="regenerateCodes(${idx})">Generate Codes</button>
    </div>
    <h4>Attendance History</h4>
    <ul style="padding-left:1.2rem;margin-bottom:0.85rem;font-size:0.88rem;">${(s.attendanceHistory.length ? s.attendanceHistory : ['No weekly logs submitted yet.']).map(h => `<li>${h}</li>`).join('')}</ul>
    <h4>Behavior & Conduct Report</h4>
    <div style="display:flex;gap:0.5rem;margin-bottom:0.85rem;">
      <input id="editBehaviorInput" value="${s.behavior || ''}" />
      <button class="btn btn-sm" onclick="saveBehavior(${idx})">Save</button>
    </div>
    <h4>Student Performance Notes</h4>
    <ul style="padding-left:1.2rem;margin-bottom:0.5rem;font-size:0.88rem;">${(s.performance.length ? s.performance : ['No notes yet.']).map(p => `<li>${p}</li>`).join('')}</ul>
    <div style="display:flex;gap:0.5rem;margin-bottom:0.85rem;">
      <input id="newPerfInput" placeholder="Add new performance note..." />
      <button class="btn btn-sm" onclick="addPerformance(${idx})">+ Add</button>
    </div>
    <h4>Exam Results</h4>
    <table style="margin-bottom:0.6rem;"><thead><tr><th>Term</th><th>Subject</th><th>Score</th><th>Grade</th></tr></thead>
      <tbody>${(s.exams || []).map(ex => `<tr><td>${ex.term}</td><td>${ex.subject}</td><td><strong>${ex.score}</strong></td><td>${ex.grade}</td></tr>`).join('')}</tbody>
    </table>
    <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
      <input id="exTerm" placeholder="Term (e.g. Term 3 2026)" style="max-width:150px;" />
      <input id="exSubj" placeholder="Subject" style="max-width:180px;" />
      <input id="exScore" placeholder="Score (e.g. 89%)" style="max-width:110px;" />
      <input id="exGrade" placeholder="Grade (A)" style="max-width:90px;" />
      <button class="btn btn-sm btn-gold" onclick="addExamResult(${idx})">+ Add Exam</button>
    </div>`;
  document.getElementById('studentModal').style.display = 'flex';
}
function regenerateCodes(idx) {
  db.students[idx].parentRef = genCode("PAR");
  db.students[idx].studentCode = genCode("STU");
  saveDB(); renderAll(); openStudentModal(idx);
}
function saveBehavior(idx) { db.students[idx].behavior = document.getElementById('editBehaviorInput').value; saveDB(); alert("Behavior report updated!"); }
function addPerformance(idx) { const v = document.getElementById('newPerfInput').value.trim(); if(!v)return; db.students[idx].performance.unshift(new Date().toISOString().slice(0,10)+": "+v); saveDB(); openStudentModal(idx); }
function addExamResult(idx) {
  const term = exTerm.value || "Term 3 2026", subject = exSubj.value, score = exScore.value, grade = exGrade.value || "A";
  if (!subject || !score) return;
  db.students[idx].exams.push({ term, subject, score, grade });
  saveDB(); openStudentModal(idx);
}

function lookupStudentByCode(e) {
  e.preventDefault();
  const code = document.getElementById('portalAccessInput').value.trim().toUpperCase();
  const box = document.getElementById('codeLookupResult');
  const asParent = db.students.find(s => (s.parentRef || '').toUpperCase() === code);
  const asStudent = db.students.find(s => (s.studentCode || '').toUpperCase() === code);

  if (asParent) {
    box.innerHTML = `<div style="border:1px solid #cbd5e1;border-radius:8px;padding:1rem;background:#f8fafc;">
      <h4 style="color:#0f294a;">Parent Full Report: ${asParent.name} (${asParent.cls})</h4>
      <p style="margin:0.4rem 0;"><strong>Behavior Report:</strong> ${asParent.behavior}</p>
      <p style="margin:0.4rem 0;"><strong>Attendance History:</strong> ${(asParent.attendanceHistory||[]).join(' | ') || 'Current week active'}</p>
      <p style="margin:0.4rem 0;"><strong>Performance Notes:</strong> ${(asParent.performance||[]).join('; ') || 'Satisfactory'}</p>
      <h4 style="margin-top:0.6rem;">Exam Results</h4>
      <table><thead><tr><th>Term</th><th>Subject</th><th>Score</th><th>Grade</th></tr></thead>
      <tbody>${(asParent.exams||[]).map(ex=>`<tr><td>${ex.term}</td><td>${ex.subject}</td><td><strong>${ex.score}</strong></td><td>${ex.grade}</td></tr>`).join('')}</tbody></table></div>`;
  } else if (asStudent) {
    box.innerHTML = `<div style="border:1px solid #cbd5e1;border-radius:8px;padding:1rem;background:#f8fafc;">
      <h4 style="color:#0f294a;">Student Exam Results: ${asStudent.name} (${asStudent.cls})</h4>
      <table><thead><tr><th>Term</th><th>Subject</th><th>Score</th><th>Grade</th></tr></thead>
      <tbody>${(asStudent.exams||[]).map(ex=>`<tr><td>${ex.term}</td><td>${ex.subject}</td><td><strong>${ex.score}</strong></td><td>${ex.grade}</td></tr>`).join('')}</tbody></table></div>`;
  } else {
    box.innerHTML = `<p style="color:#dc2626;font-weight:600;">Invalid Reference or Student Access Code. Please check with school administration.</p>`;
  }
}

function updateSuggestedAmount() {
  const val = document.getElementById('payPurpose').value, amt = document.getElementById('payAmount');
  if (val.includes('$275')) amt.value = 275; else if (val.includes('$382')) amt.value = 382; else if (val.includes('$35')) amt.value = 35; else amt.value = '';
}

function logPayment(e) {
  e.preventDefault();
  const sName = payStudent.value.trim();
  const file = document.getElementById('payProof').files[0];
  let stu = db.students.find(s => s.name.toLowerCase() === sName.toLowerCase());
  if (!stu) {
    stu = { name: sName, cls: "ECD A", parentRef: genCode("PAR"), studentCode: genCode("STU"), week: {Mon:"Present",Tue:"Present",Wed:"Present",Thu:"Present",Fri:"Present"}, attendanceHistory: [], behavior: "Good conduct.", performance: [], exams: [] };
    db.students.push(stu);
  } else if (!stu.parentRef) {
    stu.parentRef = genCode("PAR"); stu.studentCode = genCode("STU");
  }
  const finish = (proofData) => {
    db.payments.unshift({ student: sName, purpose: payPurpose.value, amount: "$" + payAmount.value, ref: payRef.value, proof: proofData, status: "Pending" });
    saveDB(); e.target.reset(); renderAll();
    alert(`Payment logged for ${sName}!\nParent Reference Code: ${stu.parentRef}\nStudent Exam Access Code: ${stu.studentCode}`);
  };
  if (file) { const r = new FileReader(); r.onload = ev => finish(ev.target.result); r.readAsDataURL(file); } else { finish(null); }
}

function viewReceipt(idx) {
  const p = db.payments[idx];
  document.getElementById('receiptModalTitle').innerText = `${p.student} — ${p.amount} (${p.ref})`;
  const body = document.getElementById('receiptModalBody');
  body.innerHTML = p.proof ? (p.proof.startsWith('data:application/pdf') ? `<iframe src="${p.proof}" style="width:100%;height:420px;border:none;"></iframe>` : `<img src="${p.proof}" style="max-width:100%;border-radius:6px;" />`) : `<p>No receipt image attached.</p>`;
  document.getElementById('receiptModal').style.display = 'flex';
}

function toggleAttendance(key, i) { db[key][i].status = db[key][i].status === "Present" ? "Absent" : "Present"; saveDB(); renderAll(); }
function sendMsg(e) { e.preventDefault(); db.messages.push({ sender: "Parent", text: parentMsgInput.value }); parentMsgInput.value = ""; saveDB(); renderAll(); }


function uploadSchoolLogo(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    db.schoolLogo = ev.target.result;
    saveDB();
    applySchoolLogo();
    alert("School logo updated and saved!");
  };
  r.readAsDataURL(file);
}

function applySchoolLogo() {
  const crest = document.getElementById('schoolCrest');
  if (!crest) return;
  if (db.schoolLogo) {
    crest.innerHTML = `<img src="${db.schoolLogo}" alt="School Logo" style="width:100%;height:100%;object-fit:cover;" />`;
  }
}
function renderAll() {
  applySchoolLogo();
  document.getElementById('passRateDisplay').innerText = db.passRate;
  renderCards('progress', 'progressGrid'); renderCards('activities', 'activitiesGrid');
  enrolmentTableBody.innerHTML = db.enrolments.map((e, i) => `<tr><td>${e.child}</td><td>${e.cls}</td><td>${e.parent}<br><small>${e.parentRef ? 'Ref: '+e.parentRef : ''}</small></td><td><span class="pill ${e.status==='Approved'?'pill-present':'pill-pending'}">${e.status}</span></td><td>${e.status==='Pending'?`<button class="btn btn-sm" onclick="approveEnrolment(${i})">Approve</button>`:'Done'}</td></tr>`).join('');
  paymentTableBody.innerHTML = db.payments.map((p, idx) => `<tr><td>${p.student}</td><td>${p.purpose||'Fees'}</td><td><strong>${p.amount}</strong></td><td>${p.ref}${p.proof?` <button type="button" class="btn btn-sm" onclick="viewReceipt(${idx})">View Receipt</button>`:''}</td><td><span class="pill pill-present">${p.status}</span></td></tr>`).join('');
  const days = ['Mon','Tue','Wed','Thu','Fri'];
  studentRegisterBody.innerHTML = db.students.map((s, i) => `<tr>
    <td><a href="javascript:void(0)" onclick="openStudentModal(${i})" style="color:#0f294a;font-weight:700;text-decoration:underline;">${s.name}</a></td>
    <td>${s.cls}</td>
    ${days.map(d => `<td><button class="pill ${s.week[d]==='Present'?'pill-present':'pill-absent'}" style="border:none;cursor:pointer;" onclick="toggleDay(${i},'${d}')">${s.week[d]==='Present'?'P':'A'}</button></td>`).join('')}
    <td><code>${s.parentRef||'-'}</code></td><td><code>${s.studentCode||'-'}</code></td></tr>`).join('');
  staffRegisterBody.innerHTML = db.staff.map((st, i) => `<tr><td>${st.name}</td><td>${st.role}</td><td><span class="pill ${st.status==='Present'?'pill-present':'pill-absent'}">${st.status}</span></td><td><button class="btn btn-sm" onclick="toggleAttendance('staff',${i})">Toggle</button></td></tr>`).join('');
  chatBox.innerHTML = db.messages.map(m => `<div style="margin-bottom:0.5rem;padding:0.45rem;background:#fff;border-radius:6px;border:1px solid #e2e8f0;"><strong>${m.sender}:</strong> ${m.text}</div>`).join('');
}
window.onload = renderAll;


