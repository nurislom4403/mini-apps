const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const BACKEND_URL = "https://your-backend-domain.com";  
// ↑↑↑ O‘Z SERVER URL’INGIZNI BU YERGA YOZING !!!

let currentTestId = null;
let currentTestCode = null;
let questions = [];

// Dastlabki ishga tushirish
async function init() {
  document.getElementById("loading").innerText = "Telegram ma'lumotlari tekshirilmoqda...";

  // Admin ekanligini tekshirish (hozircha username orqali – o‘zgartirish kerak!)
  const isAdmin = tg.initDataUnsafe.user?.username === "sizning_admin_username"; // ← BU YERNI O‘ZGARTIR!

  if (isAdmin) {
    renderAdminPanel();
  } else {
    renderEnterCodePage();
  }
}

function showLoading(text = "Yuklanmoqda...") {
  document.getElementById("app").innerHTML = `<div id="loading">${text}</div>`;
}

function renderAdminPanel() {
  document.getElementById("app").innerHTML = `
    <h1>Admin Panel</h1>
    <h2>Yangi test yaratish</h2>
    <button onclick="startCreateMilliy()">Milliy sertifikat testi</button>
    <button onclick="startCreateOddiy()">Oddiy test</button>
    <br><br>
    <button class="secondary" onclick="viewStats()">Statistikani ko'rish</button>
  `;
}

async function startCreateMilliy() {
  showLoading("Test yaratilmoqda...");
  try {
    const res = await fetch(`${BACKEND_URL}/api/create_test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "milliy" })
    });
    if (!res.ok) throw new Error("Server xatosi");
    const data = await res.json();
    currentTestId = data.test_id;
    renderMilliyQuestionsForm();
  } catch (err) {
    alert("Xato: " + err.message);
    renderAdminPanel();
  }
}

function renderMilliyQuestionsForm() {
  let html = `<h1>Milliy sertifikat — to‘g‘ri javoblar</h1>`;

  for (let i = 1; i <= 32; i++) html += questionInput(i, "A B C D", true);
  for (let i = 33; i <= 35; i++) html += questionInput(i, "A B C D E F G H", true);
  for (let i = 36; i <= 45; i++) html += questionInput(i, "matn", false);

  html += `
    <h2>Test davomiyligi</h2>
    <input id="hours"   type="number" min="0" max="5"   placeholder="soat"   value="2">
    <input id="minutes" type="number" min="0" max="59"  placeholder="daqiqa" value="30">
    <br><br>
    <button onclick="saveMilliyAnswersAndDuration()">Saqlash va faollashtirish</button>
  `;

  document.getElementById("app").innerHTML = html;
}

function questionInput(num, variants, isClosed) {
  let opts = '<option value="">Tanlang</option>';
  if (isClosed) {
    variants.split(" ").forEach(v => opts += `<option value="${v}">${v}</option>`);
  }
  return `
    <div class="question-block">
      <strong>Savol ${num}</strong><br>
      To‘g‘ri javob: 
      ${isClosed ? 
        `<select id="ans${num}">${opts}</select>` :
        `<input id="ans${num}" placeholder="to‘g‘ri javob matni">`
      }
      ${num <= 35 ? `
        <br>Kitob varianti: 
        <select id="var${num}">
          <option value="A">1-kitob (A)</option>
          <option value="B">2-kitob (B)</option>
        </select>` : ""}
    </div>
  `;
}

async function saveMilliyAnswersAndDuration() {
  showLoading("Javoblar saqlanmoqda...");

  const answers = [];
  for (let i = 1; i <= 45; i++) {
    const ans = document.getElementById(`ans${i}`)?.value;
    const varEl = document.getElementById(`var${i}`)?.value || "A";
    if (!ans) return alert(`Savol ${i} uchun javob kiritilmagan!`);
    answers.push({ number: i, correct_answer: ans, variant: i <= 35 ? varEl : null });
  }

  const hours   = parseInt(document.getElementById("hours").value)   || 0;
  const minutes = parseInt(document.getElementById("minutes").value) || 0;

  try {
    for (const q of answers) {
      await fetch(`${BACKEND_URL}/api/set_question/${currentTestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(q)
      });
    }

    await fetch(`${BACKEND_URL}/api/set_duration/${currentTestId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours, minutes })
    });

    alert(`Test yaratildi!\nKod: ${"TEST" + currentTestId.toString().padStart(6,"0")}`);
    renderAdminPanel();
  } catch (err) {
    alert("Saqlashda xato: " + err.message);
  }
}

// Oddiy test (hozircha placeholder – kerak bo‘lsa to‘ldiramiz)
function startCreateOddiy() {
  document.getElementById("app").innerHTML = `
    <h1>Oddiy test (hozircha qisman)</h1>
    <p>Bu qismni keyinroq to‘ldirish mumkin</p>
    <button onclick="renderAdminPanel()">Orqaga</button>
  `;
}

// Foydalanuvchi uchun
function renderEnterCodePage() {
  document.getElementById("app").innerHTML = `
    <h1>Test ishlash</h1>
    <input id="testcode" placeholder="Test kodini kiriting" maxlength="10">
    <br><br>
    <button onclick="enterTest()">Kirish</button>
  `;
}

async function enterTest() {
  const code = document.getElementById("testcode").value.trim().toUpperCase();
  if (code.length < 4) return alert("Kod juda qisqa!");

  showLoading("Test tekshirilmoqda...");

  try {
    const res = await fetch(`${BACKEND_URL}/api/enter_test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    if (!res.ok) throw new Error("Test topilmadi yoki muddati o‘tgan");
    const data = await res.json();

    questions = data.questions;
    currentTestCode = code;
    renderTestForm();
  } catch (err) {
    alert(err.message);
    renderEnterCodePage();
  }
}

function renderTestForm() {
  let html = `<h1>Javoblar</h1><p>Savollar PDF faylda</p>`;

  questions.forEach(q => {
    html += `
      <div class="question-block">
        <strong>${q.number}-savol</strong><br>
        ${q.type.includes("yopiq") ? 
          `<select id="uans${q.number}">
            <option value="">Tanlang</option>
            ${q.type.includes("abcd") ? 
              ["A","B","C","D"] : ["A","B","C","D","E","F","G","H"]}
              .map(v => `<option value="${v}">${v}</option>`).join("")}
          </select>` :
          `<input id="uans${q.number}" placeholder="Javobingiz">`
        }
      </div>
    `;
  });

  html += `<button onclick="submitAnswers()">Topshirish</button>`;
  document.getElementById("app").innerHTML = html;
}

async function submitAnswers() {
  const answers = [];
  questions.forEach(q => {
    const val = document.getElementById(`uans${q.number}`)?.value?.trim();
    if (val) answers.push({ question_number: q.number, answer: val });
  });

  if (answers.length < questions.length && !confirm("Ba'zi savollar bo‘sh. Davom ettirasizmi?")) {
    return;
  }

  showLoading("Natija hisoblanmoqda...");

  try {
    const res = await fetch(`${BACKEND_URL}/api/submit_answers/0`, {  // test_id ni backendda kod orqali aniqlash kerak
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answers)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.detail || "Xato");

    let html = `
      <div class="result">
        <span class="green">To‘g‘ri: ${result.correct}</span><br>
        <span class="red">Xato: ${result.wrong}</span>
      </div>
      <h3>Batafsil natija:</h3>
    `;
    result.details?.forEach(d => {
      html += `<p>${d.number}-savol → ${d.status === "tog'ri" ? "✅ To‘g‘ri" : "❌ Xato"}</p>`;
    });
    document.getElementById("app").innerHTML = html + `<button onclick="renderEnterCodePage()">Boshqa test</button>`;
  } catch (err) {
    alert("Xato: " + err.message);
  }
}

function viewStats() {
  alert("Statistika ko‘rish funksiyasi hali to‘liq ulanmagan.\nBackendda /api/stats endpoint kerak.");
}

// Ishga tushirish
init();
