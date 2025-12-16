const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let answers = {};
let testCodeValue = "";
let isAdminMode = false;

// URL parametrlar
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("mode") === "admin") {
    isAdminMode = true;

    document.getElementById("code-box").classList.add("hidden");
    document.getElementById("admin-code-box").classList.remove("hidden");
    document.getElementById("test-box").classList.remove("hidden");
    document.getElementById("submitButton").innerText = "Saqlash";

    generateNewCode();
    generateTest();
} else {
    setTimeout(() => {
        const input = document.getElementById("testCode");
        if (input) input.focus();
    }, 500);
}

/* ================= ADMIN ================= */

function generateNewCode() {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 900) + 100; // 100–999
    testCodeValue = `MT-${year}-${randomNum}`;
    document.getElementById("generatedCode").value = testCodeValue;
}

/* ================= USER ================= */

function checkCode() {
    const code = document.getElementById("testCode").value.trim().toUpperCase();
    const error = document.getElementById("codeError");

    if (!code) {
        error.innerText = "❌ Test kodini kiriting";
        return;
    }

    error.innerText = "";

    tg.sendData(JSON.stringify({
        action: "check_code",
        test_code: code
    }));
}

/* ================= TEST ================= */

function generateTest() {
    const container = document.getElementById("test-container");
    container.innerHTML = "";

    const suffix = isAdminMode ? " (to‘g‘ri javob)" : "";

    for (let i = 1; i <= 32; i++) {
        createClosed(i, ["A", "B", "C", "D"], suffix);
    }

    for (let i = 33; i <= 35; i++) {
        createClosed(i, ["A", "B", "C", "D", "E", "F"], suffix);
    }

    for (let i = 36; i <= 45; i++) {
        createOpen(i, suffix);
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
    el.parentElement.querySelectorAll(".option")
        .forEach(b => b.classList.remove("active"));
    el.classList.add("active");
}

function createOpen(num, suffix) {
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML = `
        <div class="q-title">${num}-savol (a)${suffix}</div>
        <input class="text-answer"
               oninput="saveOpen(${num}, 'a', this.value)"
               placeholder="Javobingizni yozing">

        <div class="q-title">${num}-savol (b)${suffix}</div>
        <input class="text-answer"
               oninput="saveOpen(${num}, 'b', this.value)"
               placeholder="Javobingizni yozing">
    `;
    document.getElementById("test-container").appendChild(div);
}

function saveOpen(num, part, value) {
    if (!answers[num]) answers[num] = {};
    answers[num][part] = value.trim();
}

/* ================= SUBMIT ================= */

function submitTest() {
    const error = document.getElementById("testError");
    error.innerText = "";

    for (let i = 1; i <= 35; i++) {
        if (!answers[i]) {
            error.innerText = "❌ 1–35 savollarga javob bering";
            error.scrollIntoView({ behavior: "smooth" });
            return;
        }
    }

    for (let i = 36; i <= 45; i++) {
        if (!answers[i] || !answers[i].a || !answers[i].b) {
            error.innerText = "❌ 36–45 savollarni to‘liq to‘ldiring";
            error.scrollIntoView({ behavior: "smooth" });
            return;
        }
    }

    const payload = {
        test_code: testCodeValue,
        answers: answers
    };

    if (isAdminMode) {
        payload.mode = "create_test";
    } else {
        payload.action = "submit_test";
    }

    tg.sendData(JSON.stringify(payload));
    tg.close();
}
