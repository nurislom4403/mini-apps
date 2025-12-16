const tg = window.Telegram.WebApp;
tg.expand();
tg.ready(); // Qo'shimcha: WebApp tayyorligini bildirish

let answers = {};
let testCodeValue = "";
let isAdminMode = false;

// Valid kodlar — har ikki rejimda ham mavjud bo'lishi kerak
const validCodes = ["MT-2025-01", "MT-2025-02"]; // Keyin backenddan keladi

// URL parametrlaridan rejimni olish (masalan, ?mode=admin)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('mode') === 'admin') {
    isAdminMode = true;
    document.getElementById('code-box').classList.add('hidden');
    document.getElementById('admin-code-box').classList.remove('hidden');
    document.getElementById('test-box').classList.remove('hidden');
    document.getElementById('submitButton').innerText = 'Saqlash';
    
    generateNewCode();   // Yangi kod generatsiya
    generateTest();      // Testni yaratish
} else {
    // User rejimi — kod kiritish sahifasi ko'rinadi
    // Inputga avto-fokus qo'yish (telefonda klaviatura chiqishi uchun)
    setTimeout(() => {
        const input = document.getElementById('testCode');
        if (input) input.focus();
    }, 600);
}

function generateNewCode() {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 99) + 1; // 1-99 oralig'i, 2 raqamli format uchun
    testCodeValue = `MT-${year}-${randomNum.toString().padStart(2, '0')}`;
    document.getElementById('generatedCode').value = testCodeValue;
}

function checkCode() {
    const code = document.getElementById("testCode").value.trim().toUpperCase();
    const error = document.getElementById("codeError");
    
    if (!code) {
        error.innerText = "❌ Test kodini kiriting";
        return;
    }
    
    // Kodni katta harfga aylantirib tekshirish (foydalanuvchi xato yozmasin)
    if (!validCodes.includes(code)) {
        error.innerText = "❌ Bunday test kodi mavjud emas";
        return;
    }
    
    error.innerText = "";
    testCodeValue = code;
    document.getElementById("code-box").classList.add("hidden");
    document.getElementById("test-box").classList.remove("hidden");
    generateTest();
}

function generateTest() {
    const container = document.getElementById("test-container");
    container.innerHTML = "";
    const titleSuffix = isAdminMode ? " (to'g'ri javob)" : "";

    // 1–32 savol: A–D variantli
    for (let i = 1; i <= 32; i++) {
        createClosed(i, ["A", "B", "C", "D"], titleSuffix);
    }
    
    // 33–35 savol: A–F variantli
    for (let i = 33; i <= 35; i++) {
        createClosed(i, ["A", "B", "C", "D", "E", "F"], titleSuffix);
    }
    
    // 36–45 ochiq savollar (a va b qismli)
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
    document.getElementById("test-container").appendChild(div);
}

function selectClosed(num, value, el) {
    answers[num] = value;
    // Faqat shu savol ichidagi variantlarni tozalash
    el.parentElement.querySelectorAll(".option").forEach(b => b.classList.remove("active"));
    el.classList.add("active");
}

function createOpen(num, suffix) {
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML = `
        <div class="q-title">${num}-savol (a)${suffix}</div>
        <input class="text-answer" placeholder="Javobingizni yozing" oninput="saveOpen(${num}, 'a', this.value)">
        
        <div class="q-title">${num}-savol (b)${suffix}</div>
        <input class="text-answer" placeholder="Javobingizni yozing" oninput="saveOpen(${num}, 'b', this.value)">
    `;
    document.getElementById("test-container").appendChild(div);
}

function saveOpen(num, part, value) {
    if (!answers[num]) answers[num] = {};
    answers[num][part] = value.trim();
}

function submitTest() {
    const error = document.getElementById("testError");
    error.innerText = "";

    // 1-35 savollar to'ldirilganmi?
    for (let i = 1; i <= 35; i++) {
        if (!answers[i]) {
            error.innerText = "❌ 1-35 savollarga javob bering";
            error.scrollIntoView({ behavior: "smooth" });
            return;
        }
    }
    
    // 36-45 savollar to'ldirilganmi?
    for (let i = 36; i <= 45; i++) {
        if (!answers[i] || !answers[i].a?.trim() || !answers[i].b?.trim()) {
            error.innerText = "❌ 36-45 savollarni to'liq to'ldiring";
            error.scrollIntoView({ behavior: "smooth" });
            return;
        }
    }

    // Ma'lumotlarni botga yuborish
    const data = {
        test_code: testCodeValue,
        answers: answers
    };
    
    if (isAdminMode) {
        data.mode = 'create_test';
    }
    
    tg.sendData(JSON.stringify(data));
    tg.close();
}
