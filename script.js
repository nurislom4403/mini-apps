const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let currentTest = null;
let isAdmin = false;

// Mini App boshlanishi
function init() {
  const user = tg.initDataUnsafe.user || {};
  isAdmin = user.username === "SIZNING_ADMIN_USERNAME"; // ← admin username o'zgartiring
  if(isAdmin){ renderAdminPanel(); }
  else{ renderUserTestEntry(); }
}

// Admin panel
function renderAdminPanel(){
  document.getElementById("app").innerHTML = `
    <h1>Admin Panel</h1>
    <h2>Test yaratish</h2>
    <button onclick="startCreateTest('milliy')">Milliy test</button>
    <button onclick="startCreateTest('oddiy')">Oddiy test</button>
  `;
}

// Test yaratish (admin)
function startCreateTest(type){
  currentTest = {type:type, questions:[], duration:{hours:2, minutes:30}};
  let html = `<h2>${type.toUpperCase()} — Javoblarni kiriting</h2>`;
  if(type==='milliy'){
    for(let i=1;i<=45;i++){
      let variants = (i<=32)?"A B C D":(i<=35)?"A B C D E F G H":"";
      html+=questionInput(i,variants,i<=35);
    }
  }else{
    let num = parseInt(prompt("Nechta savol yaratilsin?","10"))||10;
    for(let i=1;i<=num;i++){
      html+=questionInput(i,"A B C D",true);
    }
  }
  html+=`<h3>Vaqt (soat:daqiqa)</h3>
    <input id="hours" type="number" min="0" max="5" value="2">
    <input id="minutes" type="number" min="0" max="59" value="30">
    <br><br><button onclick="saveTest()">Testni yuborish</button>`;
  document.getElementById("app").innerHTML = html;
}

// Savol input HTML
function questionInput(num,variants,isClosed){
  let opts="";
  if(isClosed){ variants.split(" ").forEach(v=>{opts+=`<option value="${v}">${v}</option>`;}); }
  return `<div class="question-block">
    <strong>Savol ${num}</strong><br>
    ${isClosed?`<select id="ans${num}">${opts}</select>`:`<input id="ans${num}" placeholder="javob">`}
  </div>`;
}

// Testni botga yuborish
function saveTest(){
  const hours=parseInt(document.getElementById("hours").value)||0;
  const minutes=parseInt(document.getElementById("minutes").value)||0;
  currentTest.duration={hours,minutes};
  currentTest.questions=[];
  const total = document.querySelectorAll(".question-block").length;
  for(let i=1;i<=total;i++){
    const el=document.getElementById(`ans${i}`);
    currentTest.questions.push({number:i,answer:el.value});
  }
  tg.sendData(JSON.stringify({action:"create_test",data:currentTest}));
  document.getElementById("app").innerHTML="<h2>Test botga yuborildi ✅</h2>";
}

// Foydalanuvchi test kiritish
function renderUserTestEntry(){
  document.getElementById("app").innerHTML=`
    <h1>Testga kirish</h1>
    <input id="testcode" placeholder="Test kodi">
    <br><br><button onclick="enterTest()">Boshlash</button>
  `;
}

// Testga kirish (foydalanuvchi)
function enterTest(){
  const code = document.getElementById("testcode").value.trim();
  if(!code){ alert("Kod kiriting!"); return;}
  tg.sendData(JSON.stringify({action:"enter_test",code:code}));
  document.getElementById("app").innerHTML="<h2>Test kodi botga yuborildi ✅</h2>";
}

init();
