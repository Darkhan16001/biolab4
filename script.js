
"use strict";

// =====================================
// BIO LAB 17 — BY DARKHAN
// 80 минут • 24 оқушы • 3 команда
// =====================================

const $ = id => document.getElementById(id);
const STORE = "biolab17_darkhan_v1";

const PAGE_COUNT = 16;

const PAGE_MINUTES = [
  2,                 // 0 Кіріспе
  3, 3, 3, 3, 3, 3,  // 1–6 Түсіндіру
  5,                 // 7 YouTube
  12,                // 8 Конспект
  3,                 // 9 Қатысу
  18,                // 10 Ауызша
  10,                // 11 Тест
  4, 3, 3,           // 12–14 Ойындар
  2                  // 15 Қорытынды
];

const CLASS_NAMES = [
  "Рамазан",
  "Тұрғанжан",
  "Нұрай",
  "Әлқуат",
  "Шырай",
  "Гүлсезім",
  "Маржан",
  "Мариям",
  "Жансая",
  "Азиза",
  "Ақсезім",
  "Нұрболсын",
  "Ақнұр",
  "Іңкәр",
  "Асхат",
  "Аяжан",
  "Мирас",
  "Санжар",
  "Ерасыл",
  "Нұрасыл",
  "Расул",
  "Айнұр",
  "Дархан",
  "Айкерім"
];

const TEAMS = [
  "🍇 Гликолиз",
  "⚙️ Кребс циклі",
  "⚡ АҮФ-синтаза"
];

// =====================================
// 1. МӘЛІМЕТТЕР
// =====================================

function newState() {
  return {
    page: 0,
    startedAt: null,
    pageEnteredAt: null,

    students: CLASS_NAMES.map((name, id) => ({
      id,
      name,
      present: true
    })),

    oral: {},
    quiz: {},
    battle: {},
    logic: {},
    creative: {},

    oralSelected: null,
    quizSelected: null,
    battleIndex: 0
  };
}

let state = newState();

try {
  const saved = JSON.parse(
    localStorage.getItem(STORE) || "null"
  );

  if (
    saved &&
    Array.isArray(saved.students) &&
    saved.students.length === 24
  ) {
    state = { ...newState(), ...saved };
  }
} catch (error) {
  console.warn("Сақталған ақпарат оқылмады", error);
}

for (const key of [
  "oral",
  "quiz",
  "battle",
  "logic",
  "creative"
]) {
  if (
    !state[key] ||
    typeof state[key] !== "object" ||
    Array.isArray(state[key])
  ) {
    state[key] = {};
  }
}

function save() {
  try {
    localStorage.setItem(
      STORE,
      JSON.stringify(state)
    );
  } catch (error) {
    console.warn("Сақтау қатесі", error);
  }
}

function safe(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(
    obj, key
  );
}

function presentStudents() {
  return state.students.filter(s => s.present);
}

function teamCount() {
  return Math.min(3, presentStudents().length);
}

function studentTeam(id) {
  const students = presentStudents();
  const index = students.findIndex(s => s.id === id);

  if (index < 0 || !teamCount()) return -1;

  return index % teamCount();
}

function membersOf(team) {
  return presentStudents().filter(
    s => studentTeam(s.id) === team
  );
}

function randomFrom(array) {
  if (!array.length) return null;

  const index = Math.floor(
    Math.random() * array.length
  );

  return array[index];
}

// =====================================
// 2. НАВИГАЦИЯ
// =====================================

function goTo(page) {
  page = Number(page);

  if (
    !Number.isInteger(page) ||
    page < 0 ||
    page >= PAGE_COUNT
  ) return;

  if (page > 0 && !state.startedAt) {
    state.startedAt = Date.now();
  }

  if (state.page === 7 && page !== 7) {
    stopVideo();
  }

  if (
    state.page !== page ||
    !state.pageEnteredAt
  ) {
    state.pageEnteredAt = Date.now();
  }

  state.page = page;
  save();

  for (let i = 0; i < PAGE_COUNT; i++) {
    const screen = $("page-" + i);
    const active = page === i;

    screen.hidden = !active;
    screen.classList.toggle("active", active);
  }

  document.querySelectorAll(".nav-btn")
    .forEach(button => {
      button.classList.toggle(
        "active",
        Number(button.dataset.page) === page
      );
    });

  $("pageIndicator").textContent =
    `${page + 1} / ${PAGE_COUNT}`;

  $("previousPage").disabled = page === 0;
  $("nextPage").disabled = page === PAGE_COUNT - 1;

  $("nextPage").textContent =
    page === PAGE_COUNT - 2
      ? "Қорытынды →"
      : "Келесі →";

  refresh();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

window.goTo = goTo;

document.querySelectorAll(".nav-btn")
  .forEach(button => {
    button.addEventListener("click", () => {
      goTo(Number(button.dataset.page));
    });
  });

$("previousPage").addEventListener(
  "click",
  () => goTo(state.page - 1)
);

$("nextPage").addEventListener(
  "click",
  () => goTo(state.page + 1)
);

// =====================================
// 3. ТАЙМЕР
// =====================================

function fmt(seconds) {
  seconds = Math.max(0, Math.floor(seconds));

  return (
    String(Math.floor(seconds / 60))
      .padStart(2, "0") +
    ":" +
    String(seconds % 60)
      .padStart(2, "0")
  );
}

function updateClock() {
  const now = Date.now();

  const total = state.startedAt
    ? Math.floor((now - state.startedAt) / 1000)
    : 0;

  const section = state.pageEnteredAt
    ? Math.floor((now - state.pageEnteredAt) / 1000)
    : 0;

  const limit = PAGE_MINUTES[state.page] * 60;
  const remaining = Math.max(0, limit - section);

  $("totalClock").textContent = fmt(total);
  $("sectionClock").textContent = fmt(remaining);

  $("totalClock").style.color =
    total >= 4800 ? "#ffe08a" : "#49dfae";

  $("sectionClock").style.color =
    section >= limit ? "#ff778b" : "#49dfae";
}

setInterval(updateClock, 1000);

// =====================================
// 4. ТОЛЫҚ ЭКРАН
// =====================================

$("fullscreenBtn").addEventListener(
  "click",
  async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement
          .requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      alert("Толық экран бұл браузерде ашылмады.");
    }
  }
);

// =====================================
// 5. YOUTUBE
// =====================================

const VIDEOS = [
  {
    id: "mbi3F_zsENs",
    title: "Гликолиз кезеңдері. Жасушалық тыныс алу"
  },
  {
    id: "8iGVQ0PlOcM",
    title: "Аэробты және анаэробты тыныс алу"
  }
];

function playVideo(index) {
  const video = VIDEOS[index];

  if (!video) return;

  $("videoPlayer").src =
    "https://www.youtube-nocookie.com/embed/" +
    video.id +
    "?start=0&end=150&rel=0&playsinline=1";

  $("videoTitle").textContent =
    "▶ " + video.title;

  $("videoLink").href =
    "https://www.youtube.com/watch?v=" +
    video.id;
}

function stopVideo() {
  $("videoPlayer").src = "about:blank";
  $("videoTitle").textContent =
    "Видео тоқтатылды.";
}

document.querySelectorAll("[data-video]")
  .forEach(button => {
    button.addEventListener("click", () => {
      playVideo(Number(button.dataset.video));
    });
  });

$("stopVideo").addEventListener(
  "click",
  stopVideo
);

// =====================================
// 6. ҚАТЫСУШЫЛАР
// =====================================

function gamesStarted() {
  return (
    Object.keys(state.battle).length > 0 ||
    Object.keys(state.logic).length > 0 ||
    Object.keys(state.creative).length > 0
  );
}

function beforeRosterChange() {
  if (!gamesStarted()) return true;

  const ok = confirm(
    "Қатысушылар өзгергенде командалар " +
    "қайта бөлінеді. Командалық ұпайлар " +
    "тазаланады. Жеке бағалар сақталады. " +
    "Жалғастырамыз ба?"
  );

  if (!ok) return false;

  state.battle = {};
  state.logic = {};
  state.creative = {};
  state.battleIndex = 0;

  return true;
}

function attendanceChanged() {
  const active = presentStudents();

  if (!active.some(s => s.id === state.oralSelected)) {
    state.oralSelected = null;
  }

  if (!active.some(s => s.id === state.quizSelected)) {
    state.quizSelected = null;
  }

  save();
  refresh();

  $("attendanceFeedback").textContent =
    `✅ Қатысады: ${active.length}. ` +
    `Қатыспайды: ${24 - active.length}.`;
}

function setPresence(id, present) {
  const student = state.students[id];

  if (!student || student.present === present) {
    return;
  }

  if (!beforeRosterChange()) return;

  student.present = present;
  attendanceChanged();
}

function renderAttendance() {
  const active = presentStudents();
  const absent = state.students.filter(s => !s.present);

  $("presentCount").textContent = active.length;
  $("absentCount").textContent = absent.length;
  $("teamCount").textContent = teamCount();

  $("presentList").innerHTML = active.map(s => `
    <div class="student-row">
      <span class="student-number">${s.id + 1}.</span>

      <input type="text"
             maxlength="60"
             value="${safe(s.name)}"
             data-name="${s.id}"
             aria-label="Оқушының аты">

      <button class="small-danger"
              data-absent="${s.id}">
        ✕ Алып тастау
      </button>
    </div>
  `).join("");

  $("absentList").innerHTML = absent.length
    ? absent.map(s => `
        <div class="absent-row">
          <span>${safe(s.name)}</span>
          <button class="small-success"
                  data-restore="${s.id}">
            ↩ Қайтару
          </button>
        </div>
      `).join("")
    : "<p>Қатыспайтын оқушылар жоқ.</p>";

  document.querySelectorAll("[data-absent]")
    .forEach(button => {
      button.addEventListener("click", () => {
        setPresence(Number(button.dataset.absent), false);
      });
    });

  document.querySelectorAll("[data-restore]")
    .forEach(button => {
      button.addEventListener("click", () => {
        setPresence(Number(button.dataset.restore), true);
      });
    });

  document.querySelectorAll("[data-name]")
    .forEach(input => {
      input.addEventListener("change", () => {
        const id = Number(input.dataset.name);
        const name = input.value.trim();

        if (!name) {
          input.value = state.students[id].name;
          return;
        }

        state.students[id].name = name;
        save();

        renderTeamRoster();
        renderOral();
        renderQuiz();
        renderScores();
      });
    });
}

$("allPresent").addEventListener("click", () => {
  if (!state.students.some(s => !s.present)) return;
  if (!beforeRosterChange()) return;

  state.students.forEach(s => s.present = true);
  attendanceChanged();
});

function renderTeamRoster() {
  if (!teamCount()) {
    $("teamRoster").innerHTML =
      '<div class="card">Қатысушылар жоқ.</div>';
    return;
  }

  $("teamRoster").innerHTML = TEAMS
    .slice(0, teamCount())
    .map((name, team) => `
      <div class="team-card">
        <h3>${name}</h3>
        <p>${membersOf(team).length} оқушы</p>
        <ol>
          ${membersOf(team).map(s =>
            `<li>${safe(s.name)}</li>`
          ).join("")}
        </ol>
      </div>
    `).join("");
}

// =====================================
// 7. 24 КҮРДЕЛІ АУЫЗША СҰРАҚ
// =====================================

const ORAL = [
  {
    q: "Неліктен өкпемен тыныс алу мен жасушалық тыныс алуды бір үдеріс деп есептеуге болмайды?",
    a: "Өкпемен тыныс алу газ алмасуға қатысады. Жасушалық тыныс алу органикалық заттардан энергия алатын ферменттік реакциялар жүйесі."
  },
  {
    q: "Глюкозаның толық аэробты тотығу теңдеуін түсіндір.",
    a: "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O. Глюкоза тотығып, оттегі соңғы электрон акцепторы болады; энергияның бір бөлігі АҮФ-те сақталады."
  },
  {
    q: "Гликолиз неге оттегіні тікелей қажет етпейді?",
    a: "Гликолиздің ферменттік реакцияларында молекулалық O₂ тікелей реагент ретінде пайдаланылмайды. NAD⁺ қажет, ол басқа жолдар арқылы қайта түзілуі тиіс."
  },
  {
    q: "Гликолиздің энергетикалық шығыны мен таза нәтижесін сипатта.",
    a: "Алғашқы кезеңде екі АҮФ жұмсалады, кейін төрт АҮФ түзіледі. Таза пайда — екі АҮФ, сонымен бірге екі NADH және екі пируват."
  },
  {
    q: "Гликолиз соңында пайда болатын пируваттың көміртек құрамын түсіндір.",
    a: "Алты көміртекті глюкоза екі үш көміртекті пируватқа айналады. Көміртектің жалпы саны осы кезеңде сақталады."
  },
  {
    q: "Пируват ацетил-КоА-ға айналғанда қандай өзгерістер болады?",
    a: "Әр пируваттан бір көміртек CO₂ ретінде бөлінеді, NAD⁺ тотықсызданып NADH түзіледі, қалған екі көміртекті ацетил тобы КоА-ға байланысады."
  },
  {
    q: "Кребс циклі неліктен электрон тасымалдау тізбегімен байланысты?",
    a: "Кребс циклінде NADH пен FADH₂ түзіледі. Олар электрон тасымалдау тізбегіне электрондар береді."
  },
  {
    q: "Кребс циклінде глюкозаға шаққанда қандай негізгі өнімдер түзіледі?",
    a: "Екі айналымда төрт CO₂, алты NADH, екі FADH₂ және екі GTP немесе АҮФ эквиваленті түзіледі."
  },
  {
    q: "Неліктен Кребс цикліндегі АҮФ мөлшері жалпы аэробты шығымның аз бөлігін құрайды?",
    a: "Көп энергия NADH және FADH₂ электрондарында сақталып, тотығу фосфорлануында АҮФ түзуге жұмсалады."
  },
  {
    q: "Митохондрияның ішкі мембранасы АҮФ синтезіне қалай қатысады?",
    a: "Онда электрон тасымалдау кешендері мен АҮФ-синтаза орналасады; мембрананың екі жағында H⁺ электрохимиялық градиенті түзіледі."
  },
  {
    q: "Протондық градиент жойылса, тотығу фосфорлануына қандай әсер болады?",
    a: "АҮФ-синтазаның АҮФ түзуіне қажет қозғаушы күш әлсірейді, сондықтан тотығу фосфорлануы төмендейді."
  },
  {
    q: "NADH пен FADH₂-нің электрон тасымалдаудағы рөлін салыстыр.",
    a: "Екеуі де электрон тасымалдайды. Олар тізбекке әртүрлі орындардан электрон беретіндіктен, АҮФ түзуге қосатын үлестері де ерекшеленеді."
  },
  {
    q: "Аэробты тыныс алуда оттегі неге міндетті?",
    a: "Оттегі электрон тасымалдау тізбегіндегі соңғы электрон акцепторы. Ол электрондар мен протондарды қабылдап, су түзілуіне қатысады."
  },
  {
    q: "Неліктен аэробты тыныс алуда АҮФ ашытуға қарағанда көбірек түзіледі?",
    a: "Глюкозаның толық тотығуы және электрон тасымалдау тізбегіндегі протондық градиент қосымша АҮФ синтезіне мүмкіндік береді."
  },
  {
    q: "Ашыту не үшін NAD⁺-ты қайта түзуі тиіс?",
    a: "NAD⁺ гликолиздегі тотығу реакцияларына қажет. Ол таусылса, гликолиз жалғаса алмайды."
  },
  {
    q: "Сүтқышқылды ашытудың соңғы өнімін және маңызын ата.",
    a: "Пируват лактатқа айналады; NADH қайта NAD⁺-қа айналып, гликолизді жалғастыруға мүмкіндік береді."
  },
  {
    q: "Спирттік ашыту мен сүтқышқылды ашытудың айырмашылығы қандай?",
    a: "Спирттік ашытуда этанол мен CO₂, ал сүтқышқылды ашытуда лактат түзіледі. Екеуі де NAD⁺ қайта түзілуін қамтамасыз етеді."
  },
  {
    q: "Неліктен ашыту мен анаэробты тыныс алуды бірдей деуге болмайды?",
    a: "Ашытуда электрон тасымалдау тізбегі қолданылмайды; анаэробты тыныс алуда тізбек бар, бірақ соңғы электрон акцепторы оттегі емес."
  },
  {
    q: "Неліктен анаэробты тыныс алудың АҮФ шығымы барлық микроағзада бірдей емес?",
    a: "Электрон тасымалдау тізбегі, соңғы акцептор және пайдаланылатын субстрат әртүрлі болуы мүмкін, сондықтан АҮФ шығымы да өзгереді."
  },
  {
    q: "Гликолиздің аэробты және ашыту жолдарына ортақ болуын түсіндір.",
    a: "Екі жол да глюкозаны цитозольде пируватқа айналдырудан басталады. Кейін пируват пен NADH-тің тағдыры ерекшеленеді."
  },
  {
    q: "Катаболизм мен анаболизмнің бір-бірімен байланысын түсіндір.",
    a: "Катаболизм энергия бөлуге және аралық заттар түзуге қатысады; анаболизм күрделі қосылыстарды синтездеуге энергия мен бастапқы заттарды қолданады."
  },
  {
    q: "Неліктен Кребс циклін амфиболикалық жол деп атайды?",
    a: "Ол катаболизмге қатысып энергия тасымалдаушыларын түзеді және кей аралық өнімдері анаболизмге бастапқы зат бола алады."
  },
  {
    q: "Жасушада АҮФ жеткілікті, ал АДФ аз болса, энергия өндіру қалай реттелуі мүмкін?",
    a: "Энергия өндіруге сұраныс төмендеп, кей катаболизм ферменттері және тыныс алу жылдамдығы кері байланыс арқылы баяулауы мүмкін."
  },
  {
    q: "Глюкозаның алты көміртегі толық аэробты тотығуда қайда кетеді?",
    a: "Екі CO₂ пируваттың ацетил-КоА-ға айналуында, төрт CO₂ Кребс циклінің екі айналымында бөлінеді."
  }
];

// =====================================
// 8. КЕЗДЕЙСОҚ АУЫЗША СҰРАҚ
// =====================================

function oralRemaining() {
  return presentStudents().filter(
    s => !has(state.oral, s.id)
  );
}

function renderOral() {
  const active = presentStudents();
  const remaining = oralRemaining();

  const id = state.oralSelected;
  const student = active.find(s => s.id === id);
  const selected = Boolean(student);
  const graded = selected && has(state.oral, id);

  $("oralProgressText").textContent =
    `${active.length - remaining.length} / ` +
    `${active.length} бағаланды`;

  $("oralPick").disabled =
    !active.length ||
    (selected && !graded) ||
    remaining.length === 0;

  $("oralPick").textContent =
    remaining.length
      ? "🎲 Рандом таңдау"
      : "✅ Барлығы аяқталды";

  $("oralReveal").disabled = !selected;

  document.querySelectorAll(".oral-grade")
    .forEach(button => {
      button.disabled = !selected || graded;
    });

  if (!selected) {
    $("oralStudent").textContent =
      active.length
        ? "🎲 Оқушыны кездейсоқ таңдау"
        : "Қатысушылар жоқ";

    $("oralQuestion").textContent =
      remaining.length
        ? "Рандом батырмасын бас."
        : "Барлық сұрақ аяқталды.";

    $("oralAnswer").hidden = true;
    $("oralAnswer").textContent = "";

    $("oralFeedback").textContent =
      `${remaining.length} оқушының жауабы қалды.`;
  } else {
    $("oralStudent").textContent =
      "🎤 " + student.name;

    $("oralQuestion").textContent = ORAL[id].q;

    $("oralAnswer").textContent =
      "Жауап үлгісі: " + ORAL[id].a;

    $("oralAnswer").hidden = !graded;

    $("oralFeedback").textContent = graded
      ? `${student.name}: ${state.oral[id]} / 3 ұпай.`
      : "Оқушының жауабын тыңдап, баға қой.";
  }

  $("oralResults").innerHTML =
    active.map(s => `
      <div class="progress-person">
        <span>${safe(s.name)}</span>
        <b>
          ${has(state.oral, s.id)
            ? state.oral[s.id] + " / 3"
            : "Кезекте"}
        </b>
      </div>
    `).join("");
}

$("oralPick").addEventListener("click", () => {
  const current = state.oralSelected;

  if (
    current !== null &&
    presentStudents().some(s => s.id === current) &&
    !has(state.oral, current)
  ) {
    $("oralFeedback").textContent =
      "Алдымен осы оқушының жауабын бағала.";
    return;
  }

  const remaining = oralRemaining();

  state.oralSelected = remaining.length
    ? randomFrom(remaining).id
    : null;

  save();
  renderOral();
});

$("oralReveal").addEventListener("click", () => {
  if (state.oralSelected === null) return;

  $("oralAnswer").hidden =
    !$("oralAnswer").hidden;
});

document.querySelectorAll(".oral-grade")
  .forEach(button => {
    button.addEventListener("click", () => {
      const id = state.oralSelected;

      if (
        id === null ||
        has(state.oral, id) ||
        !presentStudents().some(s => s.id === id)
      ) return;

      state.oral[id] =
        Number(button.dataset.points);

      save();
      renderOral();
      renderScores();
    });
  });

// =====================================
// 9. 24 ЖЕКЕ КҮРДЕЛІ ТЕСТ
// =====================================

const QUIZ = [
  {
    q: "Гликолиздің таза энергетикалық нәтижесі қандай?",
    options: [
      "4 АҮФ және 4 NADH",
      "2 АҮФ және 2 NADH",
      "30 АҮФ және 2 FADH₂",
      "Тек CO₂ және су"
    ],
    answer: 1,
    why: "Гликолизде 4 АҮФ түзіліп, 2 АҮФ жұмсалады; таза нәтиже — 2 АҮФ және 2 NADH."
  },
  {
    q: "Гликолиздің эукариот жасушасындағы орны қайсы?",
    options: [
      "Митохондрия матриксі",
      "Ядро",
      "Цитозоль",
      "Ішкі мембрана"
    ],
    answer: 2,
    why: "Гликолиз цитозольде жүреді."
  },
  {
    q: "Гликолиз оттегі жоқ кезде де жүруі үшін не қажет?",
    options: [
      "NAD⁺ қайта түзілуі",
      "Кребс циклінің міндетті тоқтамауы",
      "Тек оттегі молекуласы",
      "Митохондрия кристалары"
    ],
    answer: 0,
    why: "NAD⁺ қайта түзілуі гликолиз реакцияларының жалғасуы үшін маңызды."
  },
  {
    q: "Бір глюкозадан қанша пируват түзіледі?",
    options: ["1", "3", "2", "6"],
    answer: 2,
    why: "Бір 6C глюкоза екі 3C пируватқа айналады."
  },
  {
    q: "Пируват ацетил-КоА-ға айналғанда қандай газ бөлінеді?",
    options: ["O₂", "N₂", "H₂", "CO₂"],
    answer: 3,
    why: "Әр пируваттың бір көміртегі CO₂ ретінде бөлінеді."
  },
  {
    q: "Кребс циклі эукариот жасушасында қай жерде жүреді?",
    options: [
      "Митохондрия матриксінде",
      "Цитозольде ғана",
      "Ядро қабығында",
      "Рибосомада"
    ],
    answer: 0,
    why: "Кребс циклі митохондрия матриксінде өтеді."
  },
  {
    q: "Кребс циклі түзетін электрон тасымалдаушылар қайсы?",
    options: [
      "АҮФ және су",
      "NADH және FADH₂",
      "ДНҚ және РНҚ",
      "Глюкоза және оттегі"
    ],
    answer: 1,
    why: "NADH пен FADH₂ электрондарды тыныс алу тізбегіне береді."
  },
  {
    q: "Бір глюкозаға сәйкес Кребс циклі қанша айналым жасайды?",
    options: ["4", "1", "6", "2"],
    answer: 3,
    why: "Бір глюкозадан екі ацетил-КоА түзіледі."
  },
  {
    q: "Аэробты тыныс алуда ең көп АҮФ түзілетін кезең қайсы?",
    options: [
      "Тек гликолиз",
      "Тек пируваттың түзілуі",
      "Тотығу фосфорлануы",
      "Тек ашыту"
    ],
    answer: 2,
    why: "АҮФ-тің басым бөлігі тотығу фосфорлануында түзіледі."
  },
  {
    q: "Протондық градиенттің АҮФ синтезіндегі рөлі қандай?",
    options: [
      "АҮФ-синтазаға энергия береді",
      "Глюкозаны бірден CO₂-ге айналдырады",
      "Ядроны ыдыратады",
      "NADH-ты ДНҚ-ға айналдырады"
    ],
    answer: 0,
    why: "АҮФ-синтаза H⁺ электрохимиялық градиентінің энергиясын пайдаланады."
  },
  {
    q: "Оттегі жетіспесе митохондриядағы қай үдеріс тежелуі мүмкін?",
    options: [
      "Рибозаның түзілуі ғана",
      "Тотығу фосфорлануы",
      "Адениннің құрылысы",
      "Осмос ұғымы"
    ],
    answer: 1,
    why: "O₂ — аэробты электрон тасымалдау тізбегінің соңғы акцепторы."
  },
  {
    q: "Эукариоттағы толық аэробты глюкоза тотығуының жуық АҮФ шығымы?",
    options: ["2", "4", "8", "30–32"],
    answer: 3,
    why: "Әдеттегі қазіргі баға — шамамен 30–32 АҮФ."
  },
  {
    q: "Оттегі жоқ жағдайда NAD⁺-ты қалпына келтіретін үдеріс?",
    options: [
      "Ашыту",
      "Тек Кребс циклі",
      "Тек АҮФ-синтаза",
      "Тек фотосинтез"
    ],
    answer: 0,
    why: "Ашыту NADH-тан NAD⁺ қайта түзілуіне мүмкіндік береді."
  },
  {
    q: "Сүтқышқылды ашыту соңында қандай зат пайда болады?",
    options: [
      "Этанол міндетті түрде",
      "Тек CO₂",
      "Лактат",
      "Ацетил-КоА міндетті түрде"
    ],
    answer: 2,
    why: "Пируват лактатқа дейін тотықсызданады."
  },
  {
    q: "Спирттік ашытудың негізгі өнімдері қандай?",
    options: [
      "Тек пируват",
      "Этанол және CO₂",
      "Тек O₂",
      "Тек NADH"
    ],
    answer: 1,
    why: "Ашытқылардың спирттік ашытуында этанол мен CO₂ түзіледі."
  },
  {
    q: "Ашыту мен анаэробты тыныс алудың басты айырмашылығы?",
    options: [
      "Екеуінде де міндетті O₂ керек",
      "Екеуі толық бірдей",
      "Ашытуда тек митохондрия жұмыс істейді",
      "Анаэробты тыныс алуда электрон тасымалдау тізбегі бар"
    ],
    answer: 3,
    why: "Анаэробты тыныс алу оттегісіз акцептор мен электрон тасымалдау тізбегін пайдалана алады."
  },
  {
    q: "Ашытуда бір глюкозадан таза қанша АҮФ алынады?",
    options: ["2", "12", "30", "36"],
    answer: 0,
    why: "АҮФ гликолизде түзіледі; таза пайда — екі молекула."
  },
  {
    q: "Электрон тасымалдау тізбегі эукариотта қайда орналасады?",
    options: [
      "Цитозольде еркін",
      "Митохондрияның ішкі мембранасында",
      "Ядро ішінде",
      "Рибосома бетінде"
    ],
    answer: 1,
    why: "Мембраналық кешендер H⁺ градиентін құрады."
  },
  {
    q: "Аэробты тыныс алуда соңғы электрон акцепторы қандай?",
    options: ["NADH", "Глюкоза", "O₂", "АҮФ"],
    answer: 2,
    why: "O₂ электрондар мен протондарды қабылдап, су түзілуіне қатысады."
  },
  {
    q: "Мембрана H⁺ иондарын еркін өткізіп жіберсе не болады?",
    options: [
      "Градиент өседі",
      "АҮФ-синтаза шексіз жұмыс істейді",
      "Кребс циклі фотосинтезге айналады",
      "Протондық градиент әлсірейді"
    ],
    answer: 3,
    why: "Градиенттің әлсіреуі тотығу фосфорлануын тежейді."
  },
  {
    q: "Катаболизм дегеніміз не?",
    options: [
      "Күрделі заттардың ыдырау реакциялары",
      "Тек нәруыз синтезі",
      "Тек жасушаның бөлінуі",
      "Тек ДНҚ көшіру"
    ],
    answer: 0,
    why: "Катаболизм күрделі қосылыстардың ыдырауына қатысады."
  },
  {
    q: "Анаболизмге мысалды таңда.",
    options: [
      "Глюкозаның пируватқа ыдырауы",
      "Аминқышқылдарынан нәруыз синтезі",
      "Пируваттың CO₂ бөлуі",
      "NADH-тың тотығуы"
    ],
    answer: 1,
    why: "Нәруыз синтезі — күрделі молекула түзу үдерісі."
  },
  {
    q: "Неліктен Кребс циклі амфиболикалық деп сипатталады?",
    options: [
      "Өйткені тек жарықта жүреді",
      "Өйткені АҮФ түзілмейді",
      "Ыдырау мен синтезге аралық заттар бере алады",
      "Өйткені ядроның ішіндегі жалғыз үдеріс"
    ],
    answer: 2,
    why: "Кребс циклі катаболизмге де, анаболизмге де қатысатын аралық өнімдер береді."
  },
  {
    q: "Глюкозаның толық аэробты тотығуында алты көміртек қайда кетеді?",
    options: [
      "Алты O₂ молекуласына",
      "Екі АҮФ молекуласына",
      "Тек суға",
      "Алты CO₂ молекуласына"
    ],
    answer: 3,
    why: "Глюкозаның алты көміртегі толық тотығу кезінде алты CO₂ құрамына өтеді."
  }
];

// =====================================
// 10. РАНДОМ ЖЕКЕ ТЕСТ
// =====================================

function quizRemaining() {
  return presentStudents().filter(
    s => !has(state.quiz, s.id)
  );
}

function renderQuiz() {
  const active = presentStudents();
  const remaining = quizRemaining();

  const id = state.quizSelected;
  const student = active.find(s => s.id === id);
  const selected = Boolean(student);
  const done = selected && has(state.quiz, id);

  $("quizProgressText").textContent =
    `${active.length - remaining.length} / ` +
    `${active.length} тапсырды`;

  $("quizPick").disabled =
    !active.length ||
    (selected && !done) ||
    remaining.length === 0;

  $("quizPick").textContent =
    remaining.length
      ? "🎲 Рандом таңдау"
      : "✅ Барлығы аяқталды";

  $("quizCheck").disabled = !selected || done;

  if (!selected) {
    $("quizStudent").textContent =
      active.length
        ? "🎲 Кездейсоқ оқушы"
        : "Қатысушылар жоқ";

    $("quizQuestion").textContent =
      remaining.length
        ? "Рандом таңдау батырмасын бас."
        : "Барлық тест аяқталды.";

    $("quizOptions").innerHTML = "";
    $("quizFeedback").textContent =
      `${remaining.length} тест қалды.`;
  } else {
    const question = QUIZ[id];
    const result = state.quiz[id];

    $("quizStudent").textContent =
      "🧠 " + student.name;

    $("quizQuestion").textContent =
      question.q;

    $("quizOptions").innerHTML =
      question.options.map((option, i) => {
        const checked =
          done && result.selected === i;

        const css = done
          ? i === question.answer
            ? "correct"
            : checked ? "wrong" : ""
          : "";

        return `
          <label class="choice ${css}">
            <input type="radio"
                   name="quizAnswer"
                   value="${i}"
                   ${checked ? "checked" : ""}
                   ${done ? "disabled" : ""}>
            <span>
              ${String.fromCharCode(65 + i)}.
              ${safe(option)}
            </span>
          </label>
        `;
      }).join("");

    $("quizFeedback").textContent = done
      ? (result.correct ? "✅ Дұрыс! " : "❌ Қате. ") +
        question.why
      : "Дұрыс жауапты таңда.";
  }

  $("quizResults").innerHTML =
    active.map(s => `
      <div class="progress-person">
        <span>${safe(s.name)}</span>
        <b>
          ${has(state.quiz, s.id)
            ? state.quiz[s.id].points + " / 2"
            : "Кезекте"}
        </b>
      </div>
    `).join("");
}

$("quizPick").addEventListener("click", () => {
  const id = state.quizSelected;

  if (
    id !== null &&
    presentStudents().some(s => s.id === id) &&
    !has(state.quiz, id)
  ) {
    $("quizFeedback").textContent =
      "Алдымен осы оқушының жауабын тексер.";
    return;
  }

  const remaining = quizRemaining();

  state.quizSelected = remaining.length
    ? randomFrom(remaining).id
    : null;

  save();
  renderQuiz();
});

$("quizCheck").addEventListener("click", () => {
  const id = state.quizSelected;

  if (
    id === null ||
    has(state.quiz, id) ||
    !presentStudents().some(s => s.id === id)
  ) return;

  const selected = document.querySelector(
    'input[name="quizAnswer"]:checked'
  );

  if (!selected) {
    $("quizFeedback").textContent =
      "Алдымен бір жауап таңда.";
    return;
  }

  const answer = Number(selected.value);
  const correct = answer === QUIZ[id].answer;

  state.quiz[id] = {
    selected: answer,
    correct,
    points: correct ? 2 : 0
  };

  save();
  renderQuiz();
  renderScores();
});

// =====================================
// 11. 1-ОЙЫН — RESPIRATION BATTLE
// =====================================

const BATTLE = [
  {
    q: "Митохондрияның ішкі мембранасы H⁺ иондарын еркін өткізе бастады. Қандай нәтиже күтіледі?",
    options: [
      "АҮФ синтезі шексіз артады",
      "Протондық градиент әлсірейді",
      "Глюкоза бірден ДНҚ-ға айналады",
      "Кребс цикліндегі көміртек саны өзгереді"
    ],
    answer: 1,
    why: "Протондық градиент әлсіресе, АҮФ-синтазаның жұмысы да төмендеуі мүмкін."
  },
  {
    q: "Ашытуда NAD⁺ қалпына келмеді. Қай үдеріс тікелей қиындыққа ұшырайды?",
    options: [
      "Ядро қабығының түзілуі",
      "Фотосинтездің жарық кезеңі",
      "Гликолиздің жалғасуы",
      "Рибосома құрылысы"
    ],
    answer: 2,
    why: "NAD⁺ гликолиздегі тотығу реакцияларына қажет."
  },
  {
    q: "Бір глюкозадан екі ацетил-КоА түзіледі. Кребс циклі қанша айналым жасайды?",
    options: [
      "2 айналым",
      "1 айналым",
      "3 айналым",
      "6 айналым"
    ],
    answer: 0,
    why: "Әр ацетил-КоА бір айналымға қатысады."
  },
  {
    q: "Электрондардың соңғы акцепторы O₂ болмай қалды. Аэробты тыныс алуға не болады?",
    options: [
      "Күшейеді",
      "АҮФ шығымы міндетті түрде екі есе өседі",
      "Кребс циклі бірден фотосинтезге айналады",
      "Электрон тасымалдау тізбегі тежеледі"
    ],
    answer: 3,
    why: "O₂ жетіспегенде аэробты тізбектің қалыпты жұмысы бұзылады."
  },
  {
    q: "Бір глюкозадан 2 таза АҮФ және лактат пайда болды. Бұл қандай үдеріс?",
    options: [
      "Толық аэробты тотығу",
      "Сүтқышқылды ашыту",
      "Фотосинтез",
      "Тек Кребс циклі"
    ],
    answer: 1,
    why: "Лактат түзілуі мен 2 таза АҮФ — сүтқышқылды ашытуға тән."
  },
  {
    q: "NADH пен FADH₂ не үшін қажет?",
    options: [
      "Электрондарды тасымалдау үшін",
      "Оттегіні глюкозаға айналдыру үшін",
      "Ядроны бөлу үшін",
      "АҮФ-ті толық жою үшін"
    ],
    answer: 0,
    why: "Олар электрон тасымалдау тізбегіне электрон береді."
  },
  {
    q: "Гликолизден кейін пируват ацетил-КоА-ға айналды. Бір глюкозадан осы кезеңде қанша CO₂ бөлінеді?",
    options: ["4", "6", "2", "0"],
    answer: 2,
    why: "Екі пируваттың әрқайсысы бір CO₂ бөледі."
  },
  {
    q: "Ашыту мен нағыз анаэробты тыныс алудың айырмашылығын көрсет.",
    options: [
      "Екеуі де тек оттегімен жүреді",
      "Ашытуда міндетті түрде нитрат акцептор болады",
      "Екеуі тек митохондрияда жүреді",
      "Анаэробты тыныс алуда электрон тасымалдау тізбегі болады"
    ],
    answer: 3,
    why: "Нағыз анаэробты тыныс алуда оттегі емес соңғы акцептор және электрон тасымалдау тізбегі қолданылады."
  },
  {
    q: "Кребс циклі неліктен амфиболикалық жол?",
    options: [
      "Катаболизм мен анаболизмге бірдей аралық заттар бере алады",
      "Тек жарықта жұмыс істейді",
      "Ешқандай зат түзбейді",
      "Тек жасуша қабырғасында жүреді"
    ],
    answer: 0,
    why: "Кребс циклі тотығу реакцияларына да, биосинтезге қажет аралық заттарға да қатысады."
  }
];

function battleLength() {
  return teamCount() * 3;
}

function battleTeam(index) {
  return teamCount()
    ? index % teamCount()
    : -1;
}

function renderBattle() {
  const length = battleLength();

  if (!length) {
    $("battleNumber").textContent = "0 / 0";
    $("battleTeam").textContent = "Команда жоқ";
    $("battleQuestion").textContent =
      "Алдымен қатысушыларды белгіле.";
    $("battleOptions").innerHTML = "";
    $("battleBar").style.width = "0%";
    $("battleCheck").disabled = true;
    $("battleNext").disabled = true;
    $("battleFeedback").textContent = "";
    return;
  }

  const index = Math.max(
    0,
    Math.min(length - 1, state.battleIndex)
  );

  state.battleIndex = index;

  const question = BATTLE[index];
  const done = has(state.battle, index);
  const result = state.battle[index];

  $("battleNumber").textContent =
    `Жағдаят ${index + 1} / ${length}`;

  $("battleTeam").textContent =
    TEAMS[battleTeam(index)];

  $("battleQuestion").textContent = question.q;

  $("battleBar").style.width =
    `${(index + 1) / length * 100}%`;

  $("battleOptions").innerHTML =
    question.options.map((option, i) => {
      const checked =
        done && result.selected === i;

      const css = done
        ? i === question.answer
          ? "correct"
          : checked ? "wrong" : ""
        : "";

      return `
        <label class="choice ${css}">
          <input type="radio"
                 name="battleAnswer"
                 value="${i}"
                 ${checked ? "checked" : ""}
                 ${done ? "disabled" : ""}>
          <span>
            ${String.fromCharCode(65 + i)}.
            ${safe(option)}
          </span>
        </label>
      `;
    }).join("");

  $("battleCheck").disabled = done;
  $("battleNext").disabled = false;

  $("battleNext").textContent =
    index === length - 1
      ? "2-ойынға өту →"
      : "Келесі жағдаят →";

  $("battleFeedback").textContent = done
    ? (result.correct ? "✅ Дұрыс! " : "❌ Қате. ") +
      question.why
    : "Командамен ақылдасып, жауап таңдаңдар.";
}

$("battleCheck").addEventListener("click", () => {
  const index = state.battleIndex;

  if (
    !teamCount() ||
    index >= battleLength() ||
    has(state.battle, index)
  ) return;

  const selected = document.querySelector(
    'input[name="battleAnswer"]:checked'
  );

  if (!selected) {
    $("battleFeedback").textContent =
      "Бір жауап нұсқасын таңда.";
    return;
  }

  const answer = Number(selected.value);
  const correct = answer === BATTLE[index].answer;

  state.battle[index] = {
    selected: answer,
    correct,
    points: correct ? 3 : 0
  };

  save();
  renderBattle();
  renderScores();
});

$("battleNext").addEventListener("click", () => {
  if (!teamCount()) return;

  if (state.battleIndex >= battleLength() - 1) {
    goTo(13);
    return;
  }

  state.battleIndex++;
  save();
  renderBattle();
});

// =====================================
// 12. 2-ОЙЫН — ҒЫЛЫМИ ДЕТЕКТИВ
// =====================================

const LOGIC = [
  [
    {
      text: "Гликолиз цитозольде жүреді және O₂-ні тікелей пайдаланбайды.",
      correct: true,
      why: "Гликолиздің ферменттік кезеңдері молекулалық O₂-ні тікелей пайдаланбайды."
    },
    {
      text: "Бір глюкозаның гликолизінен 4 таза АҮФ түзіледі.",
      correct: false,
      why: "4 АҮФ түзіледі, бірақ 2 АҮФ жұмсалғандықтан таза нәтиже — 2."
    },
    {
      text: "Гликолизде екі пируват және екі NADH түзіледі.",
      correct: true,
      why: "Бұл — гликолиздің негізгі өнімдері."
    },
    {
      text: "Гликолиз міндетті түрде митохондрия матриксінде жүреді.",
      correct: false,
      why: "Эукариот жасушаларында гликолиз цитозольде жүреді."
    }
  ],
  [
    {
      text: "Кребс цикліне ацетил-КоА қатысады.",
      correct: true,
      why: "Ацетил-КоА Кребс цикліне ацетил тобын береді."
    },
    {
      text: "NADH пен FADH₂ электрондарды тыныс алу тізбегіне жеткізеді.",
      correct: true,
      why: "Олар тотықсызданған электрон тасымалдаушылар."
    },
    {
      text: "Митохондрияның ішкі мембранасының H⁺ градиентіне қатысы жоқ.",
      correct: false,
      why: "Мембрана градиентті сақтау үшін маңызды."
    },
    {
      text: "Кребс циклінің екі айналымында бір глюкозаға шаққанда 4 CO₂ бөлінеді.",
      correct: true,
      why: "Екі ацетил-КоА-ның циклде тотығуымен 4 CO₂ түзіледі."
    }
  ],
  [
    {
      text: "Сүтқышқылды ашыту NAD⁺ қайта түзілуіне қатысады.",
      correct: true,
      why: "NAD⁺ гликолиздің жалғасуына қажет."
    },
    {
      text: "Спирттік ашытуда этанол мен CO₂ түзілуі мүмкін.",
      correct: true,
      why: "Бұл ашытқыларға тән спирттік ашыту жолы."
    },
    {
      text: "Ашыту мен анаэробты тыныс алуда электрон тасымалдау тізбегі міндетті түрде бірдей.",
      correct: false,
      why: "Ашытуда электрон тасымалдау тізбегі пайдаланылмайды."
    },
    {
      text: "Анаболизм күрделі молекулаларды синтездеуге қатысады.",
      correct: true,
      why: "Анаболизмнің негізгі бағыты — биосинтез."
    }
  ]
];

function renderLogic() {
  if (!teamCount()) {
    $("logicArea").innerHTML =
      '<div class="card">Қатысушылар жоқ.</div>';
    return;
  }

  $("logicArea").innerHTML = LOGIC
    .slice(0, teamCount())
    .map((items, team) => {
      const result = state.logic[team];
      const done = Boolean(result);

      const rows = items.map((item, i) => {
        const selected = done
          ? String(result.answers[i])
          : "";

        return `
          <div class="statement">
            <p>
              <b>${i + 1}.</b> ${safe(item.text)}
            </p>

            <select data-logic="${team}-${i}"
                    ${done ? "disabled" : ""}>
              <option value="">Таңдау</option>

              <option value="true"
                ${selected === "true" ? "selected" : ""}>
                ✅ Дұрыс
              </option>

              <option value="false"
                ${selected === "false" ? "selected" : ""}>
                ❌ Қате
              </option>
            </select>
          </div>
        `;
      }).join("");

      const explanation = done
        ? items.map((item, i) => `
            <p>
              <b>
                ${result.answers[i] === item.correct
                  ? "✅"
                  : "❌"}
              </b>
              ${safe(item.why)}
            </p>
          `).join("")
        : "";

      return `
        <div class="logic-panel">
          <h3>${TEAMS[team]}</h3>

          <p>
            Төрт пікірді талдап,
            дұрыс немесе қате екенін анықтаңдар.
          </p>

          ${rows}

          <button class="btn primary"
                  data-logic-check="${team}"
                  ${done ? "disabled" : ""}>
            🧩 Тексеру
          </button>

          <p class="feedback"
             id="logicFeedback-${team}">
            ${done
              ? `Нәтиже: ${result.points} / 4 ұпай`
              : ""}
          </p>

          ${done
            ? `<div class="answer-panel">
                 ${explanation}
               </div>`
            : ""}
        </div>
      `;
    }).join("");

  document.querySelectorAll("[data-logic-check]")
    .forEach(button => {
      button.addEventListener("click", () => {
        const team = Number(
          button.dataset.logicCheck
        );

        if (has(state.logic, team)) return;

        const items = LOGIC[team];

        const fields = items.map((item, i) =>
          document.querySelector(
            `[data-logic="${team}-${i}"]`
          )
        );

        if (fields.some(field => field.value === "")) {
          $("logicFeedback-" + team).textContent =
            "Төрт жауапты түгел таңдаңдар.";
          return;
        }

        const answers = fields.map(
          field => field.value === "true"
        );

        const points = answers.reduce(
          (sum, answer, i) =>
            sum + Number(
              answer === items[i].correct
            ),
          0
        );

        state.logic[team] = { answers, points };

        save();
        renderLogic();
        renderScores();
      });
    });
}

// =====================================
// 13. 3-ОЙЫН — ЭНЕРГИЯ ЗЕРТХАНАСЫ
// =====================================

const CREATIVE = [
  {
    title: "🍇 Гликолиз зертханасы",
    task:
      "Алты көміртекті глюкозаның екі пируватқа " +
      "айналуын сыз. АҮФ жұмсалуын және түзілуін, " +
      "NADH түзілуін көрсет. Неліктен таза АҮФ " +
      "пайдасы екіге тең екенін түсіндір.",
    rubric:
      "2 ұпай — сызба; " +
      "2 ұпай — энергетикалық негіздеме; " +
      "1 ұпай — қорғау."
  },
  {
    title: "⚙️ Кребс және электрон тізбегі",
    task:
      "Пируват → ацетил-КоА → Кребс циклі → " +
      "NADH/FADH₂ → электрон тізбегі бағытын сыз. " +
      "Протондық градиент не үшін қажет " +
      "екенін ғылыми дәлелде.",
    rubric:
      "2 ұпай — дұрыс кезеңдер; " +
      "2 ұпай — механизм; " +
      "1 ұпай — дәлел."
  },
  {
    title: "🧪 Аэробты және ашыту",
    task:
      "Екі бағанды салыстыру сызбасын жаса. " +
      "Әр жолдың O₂-ге қатысын, АҮФ шығымын, " +
      "соңғы өнімдерін және NAD⁺ рөлін көрсет. " +
      "Ашыту мен нағыз анаэробты тыныс " +
      "алудың айырмашылығын қорытындыла.",
    rubric:
      "2 ұпай — салыстыру; " +
      "2 ұпай — NAD⁺ және тыныс алу айырмашылығы; " +
      "1 ұпай — қорытынды."
  }
];

function renderCreative() {
  if (!teamCount()) {
    $("creativeArea").innerHTML =
      '<div class="card">Қатысушылар жоқ.</div>';
    return;
  }

  $("creativeArea").innerHTML = CREATIVE
    .slice(0, teamCount())
    .map((task, team) => {
      const score = has(state.creative, team)
        ? state.creative[team]
        : null;

      return `
        <div class="creative-panel">
          <h3>${TEAMS[team]}</h3>
          <h3>${safe(task.title)}</h3>

          <p>${safe(task.task)}</p>

          <p><b>Бағалау:</b> ${safe(task.rubric)}</p>

          <label for="creative-${team}">
            Команда ұпайы
          </label>

          <select id="creative-${team}">
            <option value="">Ұпай таңда</option>

            ${[0, 1, 2, 3, 4, 5].map(n => `
              <option value="${n}"
                ${score === n ? "selected" : ""}>
                ${n} ұпай
              </option>
            `).join("")}
          </select>

          <button class="btn success"
                  data-creative-save="${team}">
            🏅 Бағалау
          </button>

          <p class="feedback"
             id="creativeFeedback-${team}">
            ${score === null
              ? "Бағаланған жоқ."
              : `${score} / 5 ұпай сақталды.`}
          </p>
        </div>
      `;
    }).join("");

  document.querySelectorAll("[data-creative-save]")
    .forEach(button => {
      button.addEventListener("click", () => {
        const team = Number(
          button.dataset.creativeSave
        );

        const value = $("creative-" + team).value;

        if (value === "") {
          $("creativeFeedback-" + team).textContent =
            "Алдымен ұпай таңда.";
          return;
        }

        state.creative[team] = Number(value);

        save();
        renderCreative();
        renderScores();
      });
    });
}

// =====================================
// 14. ҰПАЙ ЕСЕПТЕУ
// =====================================

function personalPoints(id) {
  const oral = has(state.oral, id)
    ? Number(state.oral[id]) || 0
    : 0;

  const quiz = has(state.quiz, id)
    ? Number(state.quiz[id].points) || 0
    : 0;

  return oral + quiz;
}

function gamePoints(team) {
  let points = 0;

  for (let index = 0; index < battleLength(); index++) {
    if (
      battleTeam(index) === team &&
      has(state.battle, index)
    ) {
      points += state.battle[index].points;
    }
  }

  if (has(state.logic, team)) {
    points += state.logic[team].points;
  }

  if (has(state.creative, team)) {
    points += state.creative[team];
  }

  return points;
}

function teamPoints(team) {
  const members = membersOf(team);

  if (!members.length) return 0;

  const totalPersonal = members.reduce(
    (sum, s) => sum + personalPoints(s.id),
    0
  );

  // Әртүрлі мөлшердегі командаларды
  // әділдеу салыстыру үшін орташа нәтиже.
  const personalAverage =
    Math.round(totalPersonal / members.length * 2);

  return personalAverage + gamePoints(team);
}

function scoreCards() {
  return TEAMS.slice(0, teamCount())
    .map((name, team) => `
      <div class="team-card">
        <h3>${name}</h3>

        <div class="team-score">
          ${teamPoints(team)} ұпай
        </div>

        <p>
          ${membersOf(team).length} оқушы
        </p>

        <p>
          Командалық ойындар:
          ${gamePoints(team)} ұпай
        </p>
      </div>
    `).join("");
}

function renderScores() {
  const cards = scoreCards();

  $("game1Scores").innerHTML = cards;
  $("game2Scores").innerHTML = cards;
  $("game3Scores").innerHTML = cards;
  $("finalScores").innerHTML = cards;

  $("sidebarScores").innerHTML =
    state.page < 9
      ? ""
      : TEAMS.slice(0, teamCount())
          .map((name, team) => `
            <div class="mini-score">
              <span>${name}</span>
              <b>${teamPoints(team)}</b>
            </div>
          `).join("");

  renderFinal();
}

// =====================================
// 15. ҚОРЫТЫНДЫ
// =====================================

function renderFinal() {
  const active = presentStudents();

  if (!active.length) {
    $("winner").textContent =
      "Қатысушылар белгіленген жоқ.";

    $("studentResults").innerHTML = "";
    return;
  }

  const scores = Array.from(
    { length: teamCount() },
    (_, team) => teamPoints(team)
  );

  const maximum = Math.max(...scores);

  const winners = scores
    .map((score, index) => ({ score, index }))
    .filter(item => item.score === maximum);

  const assessed =
    active.some(s =>
      has(state.oral, s.id) ||
      has(state.quiz, s.id)
    ) ||
    gamesStarted();

  if (!assessed) {
    $("winner").textContent =
      "Нәтижелер тапсырмалардан кейін шығады.";
  } else if (winners.length === 1) {
    $("winner").innerHTML =
      "🏆 ЖЕҢІМПАЗ КОМАНДА<br>" +
      TEAMS[winners[0].index] +
      "<br>" +
      maximum + " ұпай";
  } else {
    $("winner").innerHTML =
      "🤝 ҰПАЙЛАР ТЕҢ<br>" +
      winners.map(w => TEAMS[w.index]).join(" және ") +
      "<br>" +
      maximum + " ұпай";
  }

  $("studentResults").innerHTML = active
    .map(s => {
      const oral = has(state.oral, s.id)
        ? state.oral[s.id]
        : "—";

      const quiz = has(state.quiz, s.id)
        ? state.quiz[s.id].points
        : "—";

      return `
        <tr>
          <td>${safe(s.name)}</td>
          <td>${TEAMS[studentTeam(s.id)]}</td>
          <td>${oral}</td>
          <td>${quiz}</td>
          <td><b>${personalPoints(s.id)}</b></td>
        </tr>
      `;
    }).join("");
}

// =====================================
// 16. КОНСПЕКТІ КӨШІРУ
// =====================================

$("copyNotes").addEventListener(
  "click",
  async () => {
    const text = $("notesContent").innerText;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const field = document.createElement("textarea");
        field.value = text;
        field.style.position = "fixed";
        field.style.opacity = "0";

        document.body.appendChild(field);
        field.select();

        const success = document.execCommand("copy");
        field.remove();

        if (!success) throw new Error("Copy error");
      }

      alert("✅ Конспект көшірілді!");
    } catch (error) {
      alert(
        "Автоматты көшіру мүмкін болмады. " +
        "Мәтінді қолмен көшір."
      );
    }
  }
);

// =====================================
// 17. ЖАҢА САБАҚ
// =====================================

$("resetLesson").addEventListener("click", () => {
  const ok = confirm(
    "Жаңа сабақ бастаймыз ба? " +
    "Барлық бағалар мен қатысу белгілері тазаланады."
  );

  if (!ok) return;

  state = newState();

  save();
  stopVideo();
  goTo(0);
  updateClock();
});

// =====================================
// 18. ИНТЕРФЕЙСТІ ЖАҢАРТУ
// =====================================

function refresh() {
  renderAttendance();
  renderTeamRoster();

  renderOral();
  renderQuiz();

  renderBattle();
  renderLogic();
  renderCreative();

  renderScores();
  updateClock();
}

// =====================================
// 19. САЙТТЫ ІСКЕ ҚОСУ
// =====================================

function initialize() {
  const page = Math.max(
    0,
    Math.min(
      PAGE_COUNT - 1,
      Number(state.page) || 0
    )
  );

  goTo(page);
}

initialize();
