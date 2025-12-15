const tg = window.Telegram.WebApp;
tg.expand();

const container = document.getElementById("test-container");
let answers = {};

// 1–32: A–D
for (let i = 1; i <= 32; i++) {
    createClosedQuestion(i, ["A", "B", "C", "D"]);
}

// 33–35: A–F
for (let i = 33; i <= 35; i++) {
    createClosedQuestion(i, ["A", "B", "C", "D", "E", "F"]);
}

// 36–55: ochiq (a, b)
for (let i = 36; i <= 55; i++) {
    createOpenQuestion(i);
}

function createClosedQuestion(num, options) {
    const div = document.createElement("div");
    div.className = "question";

    div.innerHTML = `
        <div class="q-title">${num}.</div>
        <div class="options">
            ${options.map(o =>
                `<div class="option" onclick="selectAnswer(${num}, '${o}', this)">${o}</div>`
            ).join("")}
        </div>
    `;

    container.appendChild(div);
}

function selectAnswer(num, value, el) {
    answers[num] = value;
    el.parentElement.querySelectorAll(".option").forEach(b => b.classList.remove("active"));
    el.classList.add("active");
}

function createOpenQuestion(num) {
    const div = document.createElement("div");
    div.className = "question";

    div.innerHTML = `
        <div class="q-title">${num}-savol (a)</div>
        <input class="text-answer" oninput="saveOpen(${num}, 'a', this.value)">

        <div class="q-title">${num}-savol (b)</div>
        <input class="text-answer" oninput="saveOpen(${num}, 'b', this.value)">
    `;

    container.appendChild(div);
}

function saveOpen(num, part, value) {
    if (!answers[num]) answers[num] = {};
    answers[num][part] = value;
}

document.getElementById("submitBtn").onclick = () => {
    tg.sendData(JSON.stringify({
        answers: answers
    }));
    tg.close();
};
