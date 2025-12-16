const tg = window.Telegram.WebApp;
tg.expand();
let answers = {};
let testCodeValue = "";
let isAdminMode = false;

// URL parametrlaridan rejimni olish (masalan, ?mode=admin)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('mode') === 'admin') {
    isAdminMode = true;
    document.getElementById('code-box').classList.add('hidden');
    document.getElementById('admin-code-box').classList.remove('hidden');
    document.getElementById('test-box').classList.remove('hidden');
    document.getElementById('submitButton').innerText = 'Saqlash'; // Admin uchun tugma nomi o'zgaradi
    generateTest();
    generateNewCode(); // Yangi kod generatsiya
} else {
    // User rejimi
    // Hozircha FAKE test kodlar (keyin botdan keladi)
    const validCodes = ["MT-2025-01", "MT-2025-02"];
}

function generateNewCode() {
    // Yangi unikal kod generatsiya (masalan, MT-YYYY-RANDOM)
    const year = new Date().getFullYear();
    const randomNum = Math.floor(100 + Math.random() * 900); // 3 raqamli random
    testCodeValue = `MT-${year}-${randomNum.toString().padStart(2, '0')}`;
    document.getElementById('generatedCode').value = testCodeValue;
}

function checkCode() {
    const code = document.getElementById("testCode").value.trim();
    const error = document.getElementById("codeError");
    if (!code) {
        error.innerText = "❌ Test kodini kiriting";
        return;
    }
    if (!validCodes.includes(code)) {
        error.innerText = "❌ Bunday test kodi mavjud emas";
        return;
    }
    testCodeValue = code;
    document.getElementById("code-box").classList.add("hidden");
    document.getElementById("test-box").classList.remove("hidden");
    generateTest();
}

function generateTest() {
    const container = document.getElementById("test-container");
    container.innerHTML = "";
    const titleSuffix = isAdminMode ? " (to'g'ri javob)" : ""; // Admin uchun belgi
    // 1–32 (A–D)
    for (let i = 1; i <= 32; i++) {
        createClosed(i, ["A", "B", "C", "D"], titleSuffix);
    }
    // 33–35 (A–F)
    for (let i = 33; i <= 35; i++) {
        createClosed(i, ["A", "B", "C", "D", "E", "F"], titleSuffix);
    }
    // 36–45 ochiq
    for (let i = 36; i <= 45; i++) {
        createOpen(i, titleSuffix);
    }
}

function createClosed(num, options, suffix) {
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML = `
        <div class="q-title">${num}.${suffix}</div>
        <div class="options">
            ${options.map(o =>
                `<div class="option" onclick="selectClosed(${num}, '${o}', this)">${o}</div>`
            ).join("")}
        </div>
    `;
    container.appendChild(div);
}

function selectClosed(num, value, el) {
    answers[num] = value;
    el.parentElement.querySelectorAll(".option").forEach(b => b.classList.remove("active"));
    el.classList.add("active");
}

function createOpen(num, suffix) {
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML = `
        <div class="q-title">${num}-savol (a)${suffix}</div>
        <input class="text-answer" oninput="saveOpen(${num}, 'a', this.value)">
        <div class="q-title">${num}-savol (b)${suffix}</div>
        <input class="text-answer" oninput="saveOpen(${num}, 'b', this.value)">
    `;
    container.appendChild(div);
}

function saveOpen(num, part, value) {
    if (!answers[num]) answers[num] = {};
    answers[num][part] = value.trim();
}

function submitTest() {
    const error = document.getElementById("testError");
    // Tekshiruv: barcha savollar to'ldirilganmi
    for (let i = 1; i <= 35; i++) {
        if (!answers[i]) {
            error.innerText = "❌ Hamma test javoblarini belgilang";
            return;
        }
    }
    for (let i = 36; i <= 45; i++) {
        if (!answers[i] || !answers[i].a || !answers[i].b) {
            error.innerText = "❌ Hamma ochiq savollarni to‘ldiring";
            return;
        }
    }
    // Botga yuborish
    const data = {
        test_code: testCodeValue,
        answers: answers
    };
    if (isAdminMode) {
        data.mode = 'create_test'; // Admin rejimida qo'shimcha flag
    }
    tg.sendData(JSON.stringify(data));
    tg.close();
}
