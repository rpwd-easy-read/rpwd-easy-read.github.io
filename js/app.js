/* RPwD Easy Read — single-page app
 * Loads content.json, hash-routes between views, renders HTML, wires TTS,
 * search and the big-text toggle. Registers the service worker for offline.
 * No framework. Plain vanilla JS.
 */

'use strict';

const CONTENT_URL = 'content.json';
let CONTENT = null;

/* ============ helpers ============ */

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const byNum = (n) => CONTENT.sections.find((s) => s.num === Number(n));
const byChapter = (ch) => CONTENT.sections.filter((s) => s.chapter === ch);
const chapterById = (ch) => CONTENT.chapters.find((c) => c.id === ch);

const firstTwoSentences = (text, max = 140) => {
  const clipped = text.length > max ? text.slice(0, max).trim() + '…' : text;
  return clipped;
};

const ALT_TEXT = {
  book_learning: "A person sitting and reading a book in their lap, smiling",
  book_open: "An open book with pages spread wide and a red bookmark ribbon",
  book_simple: "A closed blue book titled RPwD ACT with a gold star",
  briefcase: "A brown briefcase with a handle and clasp",
  building_ramp: "A building with windows and a green accessibility ramp, a person in a wheelchair going up the ramp",
  bus: "A bright blue bus with four smiling passengers in the windows and an accessibility ramp at the door",
  certificate_star: "A gold star on red ribbons, like a medal or award",
  chair_reserved: "A blue chair with a yellow RESERVED sign on the backrest",
  clipboard_check: "A clipboard with a checklist showing four items, all ticked with green check marks",
  clock: "A round yellow clock face with black hands showing the time",
  commissioner_badge: "A person in a dark blue formal suit with a red tie and a gold star badge on their chest",
  committee_people: "Four people sitting around a table, wearing blue, pink, green, and orange clothes",
  computer: "A computer screen showing a checklist: Big text, Easy words, Pictures — all ticked",
  courthouse: "A grand building with four tall columns, an orange roof, and wide steps",
  disaster_safe: "A red umbrella protecting a person from rain drops falling from above",
  document: "A white paper document with text lines, a folded corner, and a round red seal stamp",
  equality: "Two people side by side — one standing in blue, one in a wheelchair in pink — with a green equals sign between them",
  friends_support: "Two people standing close with arms around each other, a red heart above them",
  globe_world: "A globe showing green land and blue water",
  heart: "A large pink heart",
  high_support_hands: "Two large hands gently holding and supporting a smaller person in the middle",
  house_family: "A house with a red roof, brown door, blue windows, and a pink heart on the wall",
  justice_scales: "A wooden balance scale with two golden pans hanging evenly",
  medical_cross: "A large red plus-sign cross inside a white circle — the healthcare symbol",
  megaphone: "An orange megaphone with blue sound waves coming out of it",
  money_jar: "A glass jar filled with coins marked with the rupee symbol",
  pencil_signing: "A yellow pencil writing a signature on a white document",
  school: "A school building with an orange roof, a green flag, four windows, and an ABC sign above the door",
  shield: "A blue shield with a white check mark inside — the protection symbol",
  vote: "A ballot paper with a green tick being placed into a blue ballot box marked VOTE",
  warning: "A yellow triangle with a black exclamation mark — a warning sign",
  women_children: "A taller person in pink holding hands with a child in purple, with a heart between them",
};

const altFor = (name) => ALT_TEXT[name] || `Illustration for this section`;

/* ============ views ============ */

function renderHome() {
  return `
    <div class="hero">
      <div class="hero-illustrations" aria-hidden="true">
        <img src="img/illustrations/equality.png" alt="" class="hero-img hero-img-1">
        <img src="img/illustrations/school.png" alt="" class="hero-img hero-img-2">
        <img src="img/illustrations/bus.png" alt="" class="hero-img hero-img-3">
      </div>
      <h1>${esc(CONTENT.meta.title)}</h1>
      <p class="hero-subtitle">${esc(CONTENT.meta.subtitle)}</p>
      <p class="hero-tagline">
        Your rights, in plain words — with the law still attached.
        <br>A complete reference for persons with intellectual and learning disabilities.
        <br><em style="font-size:0.85em;color:var(--muted)">Prepared by the Disability Law Unit of Vidya Sagar</em>
      </p>
      <div class="hero-actions">
        <a href="#/map" class="btn btn-primary btn-big">See all 17 chapters</a>
        <a href="#/complain" class="btn btn-big">How to complain</a>
      </div>
    </div>

    <section class="search" aria-label="Find a section">
      <label for="search-home">Find a section</label>
      <input type="search" id="search-home"
             placeholder="Type a word like school, job, bus, money..."
             autocomplete="off"
             aria-describedby="search-hint">
      <p id="search-hint" class="visually-hidden">
        Type two or more letters to search across all 102 sections.
      </p>
      <div class="search-results" id="search-home-results" role="region" aria-live="polite"></div>
    </section>

    <div class="home-features">
      <div class="feature-card">
        <img src="img/illustrations/shield.png" alt="" class="feature-img" aria-hidden="true">
        <h3>Your rights</h3>
        <p>Read each right in plain words. Every page keeps the official Section number — so you can use it in a complaint.</p>
      </div>
      <div class="feature-card">
        <img src="img/illustrations/women_children.png" alt="" class="feature-img" aria-hidden="true">
        <h3>Friendly pictures</h3>
        <p>Every section has a simple drawing. Look at the picture if the words are hard.</p>
      </div>
      <div class="feature-card">
        <img src="img/illustrations/megaphone.png" alt="" class="feature-img" aria-hidden="true">
        <h3>Read out loud</h3>
        <p>Tap the speak button on any section page to hear the words read out loud.</p>
      </div>
    </div>

    <div class="hero-actions" style="margin-top: 2rem;">
      <a href="#/about" class="btn">About this guide</a>
      <a href="#/your-rights" class="btn">Your rights in one page</a>
      <a href="#/help" class="btn">Who can help you</a>
    </div>
  `;
}

function renderMap() {
  const cards = CONTENT.chapters.map((ch) => {
    const first = ch.sections[0];
    const last = ch.sections[ch.sections.length - 1];
    const range = first === last ? `Section ${first}` : `Sections ${first}–${last}`;
    return `
      <a href="#/chapter/${esc(ch.id)}" class="chapter-card" style="--card-color: ${esc(ch.color)}">
        <div class="num">${esc(ch.kicker)}</div>
        <div class="title">${esc(ch.title)}</div>
        <div class="range">${esc(range)}</div>
      </a>
    `;
  }).join('');

  return `
    <h1 class="page-title">Map of your rights</h1>
    <p class="page-intro">All 17 chapters and 102 sections. Each chapter has its own colour.</p>
    <div class="chapter-grid">${cards}</div>

    <section class="search" aria-label="Find a section">
      <label for="search-map">Or search by word</label>
      <input type="search" id="search-map"
             placeholder="Type a word..."
             autocomplete="off">
      <div class="search-results" id="search-map-results" role="region" aria-live="polite"></div>
    </section>
  `;
}

function renderChapter(chId) {
  const chapter = chapterById(chId);
  if (!chapter) return '<p>Chapter not found.</p>';
  const sections = byChapter(chId);
  const items = sections.map((s) => `
    <li>
      <a href="#/section/${s.num}">
        <div class="num">SECTION ${s.num}</div>
        <div class="title">${esc(s.official_title)}</div>
        <p class="desc">${esc(firstTwoSentences(s.plain_text, 160))}</p>
      </a>
    </li>
  `).join('');

  return `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="#/">Home</a> · <a href="#/map">All chapters</a>
    </nav>
    <div class="chapter-hero">
      <div class="kicker">${esc(chapter.kicker)}</div>
      <h1>${esc(chapter.title)}</h1>
      <p>${esc(chapter.subtitle)}</p>
    </div>
    <ul class="section-list">${items}</ul>
  `;
}

function renderSection(num) {
  const s = byNum(num);
  if (!s) return '<p>Section not found.</p>';
  const ch = chapterById(s.chapter);
  const idx = CONTENT.sections.findIndex((x) => x.num === s.num);
  const prev = idx > 0 ? CONTENT.sections[idx - 1] : null;
  const next = idx < CONTENT.sections.length - 1 ? CONTENT.sections[idx + 1] : null;

  return `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="#/">Home</a> ·
      <a href="#/map">All chapters</a> ·
      <a href="#/chapter/${esc(s.chapter)}">${esc(ch.title)}</a>
    </nav>

    <div class="section-head">
      <div class="section-badge" aria-hidden="true">${s.num}</div>
      <div class="section-title-wrap">
        <div class="section-chapter-label">${esc(ch.kicker)} · SECTION ${s.num}</div>
        <h1 class="section-title">${esc(s.title)}</h1>
      </div>
    </div>

    <div class="section-grid">
      <figure class="section-illus">
        <img src="img/illustrations/${esc(s.illustration)}.png"
             alt="${esc(altFor(s.illustration))}"
             loading="lazy">
      </figure>
      <div>
        <p class="section-plain">${esc(s.plain_text)}</p>
      </div>
    </div>

    <div class="use-when">
      <div class="use-when-label">★ USE THIS WHEN</div>
      <p class="use-when-body">${esc(s.use_when)}</p>
    </div>

    <div class="section-controls" aria-label="Page controls">
      <button type="button" class="btn" id="btn-speak" aria-label="Read this section out loud">
        🔊 Read out loud
      </button>
      <button type="button" class="btn btn-ghost" id="btn-stop" hidden>
        ■ Stop
      </button>
    </div>

    <div class="prev-next">
      ${prev
        ? `<a href="#/section/${prev.num}" class="btn" rel="prev">← Section ${prev.num}</a>`
        : '<span></span>'}
      ${next
        ? `<a href="#/section/${next.num}" class="btn" rel="next">Section ${next.num} →</a>`
        : '<span></span>'}
    </div>
  `;
}

function setupSectionControls(s) {
  const btnSpeak = document.getElementById('btn-speak');
  const btnStop = document.getElementById('btn-stop');
  if (!btnSpeak) return;

  if (!('speechSynthesis' in window)) {
    btnSpeak.hidden = true;
    return;
  }

  const speak = () => {
    window.speechSynthesis.cancel();
    const text = `${s.title}. ${s.plain_text} Use this when: ${s.use_when}`;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    utter.pitch = 1.0;
    utter.lang = 'en-IN';
    utter.onstart = () => { btnStop.hidden = false; btnSpeak.hidden = true; };
    utter.onend = () => { btnStop.hidden = true; btnSpeak.hidden = false; };
    utter.onerror = () => { btnStop.hidden = true; btnSpeak.hidden = false; };
    window.speechSynthesis.speak(utter);
  };

  btnSpeak.addEventListener('click', speak);
  btnStop.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    btnStop.hidden = true;
    btnSpeak.hidden = false;
  });
}

function renderAbout() {
  return `
    <div class="content-page">
      <div class="page-hero-illus" aria-hidden="true">
        <img src="img/illustrations/book_open.png" alt="" class="page-illus">
      </div>
      <h1>About this guide</h1>
      <ul>
        <li>This guide explains all 102 sections of India's Rights of Persons with Disabilities Act 2016.</li>
        <li>It is written in plain words for people who find legal language hard.</li>
        <li>Every page keeps the official Section number and title from the Act. The plain words sit below.</li>
        <li>Some sections give you rights you can claim. Others explain how the system works behind the scenes — those say "For reference" in the Use this when box.</li>
        <li>Each chapter has its own colour, so you can tell at a glance which chapter you are in.</li>
        <li>Section titles in this guide were verified against the official Act text from the Ministry of Law and Justice.</li>
        <li>This guide is not legal advice. For court matters, please ask a lawyer or your State Commissioner.</li>
      </ul>
      <h2>Why the legal headings stay</h2>
      <p>When you raise a complaint, citing the Section number gives your case real power. We never strip it out.</p>
      <h2>How to use this guide</h2>
      <ol>
        <li><strong>Chapter and Section number</strong> — tells you exactly where in the Act you are.</li>
        <li><strong>Official Section title</strong> — the exact name from the Act. Use this in complaints.</li>
        <li><strong>Picture</strong> — a simple drawing to help you remember the idea.</li>
        <li><strong>Plain words</strong> — the same idea in easy English.</li>
        <li><strong>Use this when…</strong> — real-life examples of when this section helps you.</li>
      </ol>
    </div>
  `;
}

function renderComplain() {
  const steps = [
    ['Write down what happened.',
     'Date, place, names if you know them. Two or three lines is fine.'],
    ['Find the right Section number.',
     'Use this guide to pick the Section that fits your problem. Write it on your complaint.'],
    ['Send your complaint.',
     "Send it to the State Commissioner for Persons with Disabilities in your state. By email or by post."],
    ['Keep proof.',
     'Save a copy. Get a receipt, an email reply, or a stamp showing they got your complaint.'],
    ['Wait 60 days.',
     'If nothing happens in 60 days, you can take it to the Chief Commissioner or to court.'],
  ];
  return `
    <div class="content-page">
      <div class="page-hero-illus" aria-hidden="true">
        <img src="img/illustrations/pencil_signing.png" alt="" class="page-illus">
      </div>
      <h1>How to file a complaint</h1>
      <p>Five simple steps to raise a complaint under the RPwD Act:</p>
      ${steps.map((st, i) => `
        <div class="step-card">
          <div class="num">${i + 1}</div>
          <div>
            <h3>${esc(st[0])}</h3>
            <p>${esc(st[1])}</p>
          </div>
        </div>
      `).join('')}
      <p><a href="#/help" class="btn">Who can help you →</a></p>
    </div>
  `;
}

function renderHelp() {
  return `
    <div class="content-page">
      <div class="page-hero-illus" aria-hidden="true">
        <img src="img/illustrations/friends_support.png" alt="" class="page-illus">
      </div>
      <h1>Who can help you</h1>
      <p>If your rights are not respected, these offices and organisations can help:</p>

      <h2>Government offices</h2>
      <div class="step-card">
        <div>
          <h3>State Commissioner for Persons with Disabilities</h3>
          <p>Every state in India has one. They handle complaints inside the state. Look up your state's office or ask the state social welfare department.</p>
          <p><em>First place to go for most complaints.</em></p>
        </div>
      </div>
      <div class="step-card">
        <div>
          <h3>Chief Commissioner for Persons with Disabilities</h3>
          <p>A national office for cases that go beyond one state, or when the State Commissioner has not helped within 60 days.</p>
          <p><em>Office of the Chief Commissioner, New Delhi.</em></p>
        </div>
      </div>
      <div class="step-card">
        <div>
          <h3>National Human Rights Commission</h3>
          <p>For very serious cases — cruelty, abuse, denial of basic rights.</p>
          <p><em>Especially under Sections 6, 7, and 92.</em></p>
        </div>
      </div>

      <h2>Disabled People's Organisations (DPOs)</h2>
      <div class="step-card">
        <div>
          <p>DPOs are local groups led by persons with disabilities. They can help you write your complaint and stand with you. Look for a DPO in your city or district.</p>
        </div>
      </div>

      <h2>Civil society organisations</h2>
      <div class="step-card">
        <div>
          <h3>Disability Law Unit at Vidya Sagar</h3>
          <p>A team that works on disability rights and legal support. They can guide you on how to use the RPwD Act.</p>
          <p><strong><a href="mailto:dlu@vidyasagar.co.in">Ummul Khair</a></strong> · <a href="mailto:dlu@vidyasagar.co.in">dlu@vidyasagar.co.in</a> · <a href="tel:+919884795209">+91 9884795209</a></p>
        </div>
      </div>
    </div>
  `;
}

function renderYourRights() {
  const points = [
    ['You are equal.', 'No one can treat you badly.', 'Section 3', 3],
    ['You can live with your family.', 'Not in an institution against your will.', 'Section 5', 5],
    ['No one can hurt or use you.', 'You can call the police.', 'Sections 6, 7', 6],
    ['You can go to school.', 'Schools must make space for you.', 'Sections 16, 17', 16],
    ['You can work.', '4 in 100 government jobs are reserved.', 'Sections 20, 34', 20],
    ['You can have healthcare and a pension.', 'Free, close to home.', 'Sections 24, 25', 24],
    ['Buildings and information must work for you.', 'Ramps. Lifts. Easy formats.', 'Sections 40, 42', 40],
    ['If anyone breaks these rules,', 'they can be fined or jailed.', 'Sections 89, 92', 89],
  ];
  return `
    <div class="content-page">
      <div class="page-hero-illus" aria-hidden="true">
        <img src="img/illustrations/equality.png" alt="" class="page-illus">
      </div>
      <h1>Remember: your rights in one page</h1>
      <ul class="rights-list">
        ${points.map((p) => `
          <li>
            <strong>${esc(p[0])}</strong>
            ${esc(p[1])}
            <br><a href="#/section/${p[3]}" class="ref">${esc(p[2])}</a>
          </li>
        `).join('')}
      </ul>
      <p><strong>Always write the Section number when you raise a complaint. That is what makes it powerful.</strong></p>
    </div>
  `;
}

/* ============ search ============ */

function searchSections(q) {
  if (!q || q.length < 2) return [];
  const query = q.toLowerCase();
  return CONTENT.sections.filter((s) => {
    const hay = `${s.title} ${s.plain_text} ${s.use_when}`.toLowerCase();
    return hay.includes(query);
  }).slice(0, 25);
}

function setupSearch(inputId, resultsId) {
  const input = document.getElementById(inputId);
  const results = document.getElementById(resultsId);
  if (!input || !results) return;
  const update = () => {
    const q = input.value.trim();
    if (q.length < 2) {
      results.innerHTML = '';
      return;
    }
    const hits = searchSections(q);
    if (hits.length === 0) {
      results.innerHTML = '<p>No matches. Try a different word.</p>';
      return;
    }
    results.innerHTML = hits.map((s) => `
      <a href="#/section/${s.num}" class="search-result">
        <strong>Section ${s.num} — ${esc(s.official_title)}</strong>
        ${esc(firstTwoSentences(s.plain_text, 150))}
      </a>
    `).join('');
  };
  input.addEventListener('input', update);
}

/* ============ router ============ */

function parseRoute() {
  const hash = location.hash.slice(1) || '/';
  const parts = hash.split('/').filter(Boolean);
  return { hash, parts };
}

function setBodyChapter(ch) {
  const classes = (document.body.className || '').split(/\s+/).filter((c) => c && !c.startsWith('ch-'));
  classes.push('ch-' + (ch || 'I'));
  document.body.className = classes.join(' ');
}

function setActiveNav(nav) {
  document.querySelectorAll('.nav-main a').forEach((a) => {
    if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function renderRoute() {
  const main = document.getElementById('main');
  const { parts } = parseRoute();

  let html = '';
  let title = CONTENT.meta.title;
  let setupFn = null;
  let ch = null;
  let nav = '';

  if (parts.length === 0) {
    html = renderHome();
    nav = 'home';
    setupFn = () => setupSearch('search-home', 'search-home-results');
  } else if (parts[0] === 'map') {
    html = renderMap();
    title = 'Map of your rights';
    nav = 'map';
    setupFn = () => setupSearch('search-map', 'search-map-results');
  } else if (parts[0] === 'chapter' && parts[1]) {
    const chapter = chapterById(parts[1]);
    if (chapter) {
      html = renderChapter(parts[1]);
      ch = parts[1];
      title = chapter.title;
      nav = 'map';
    }
  } else if (parts[0] === 'section' && parts[1]) {
    const s = byNum(parts[1]);
    if (s) {
      html = renderSection(s.num);
      ch = s.chapter;
      title = s.title;
      setupFn = () => setupSectionControls(s);
    }
  } else if (parts[0] === 'about') {
    html = renderAbout();
    title = 'About this guide';
  } else if (parts[0] === 'complain') {
    html = renderComplain();
    title = 'How to file a complaint';
    nav = 'complain';
  } else if (parts[0] === 'help') {
    html = renderHelp();
    title = 'Who can help you';
    nav = 'help';
  } else if (parts[0] === 'your-rights') {
    html = renderYourRights();
    title = 'Your rights in one page';
  }

  if (!html) {
    html = `
      <div class="content-page">
        <h1>Page not found</h1>
        <p>The page you asked for is not here.</p>
        <p><a href="#/" class="btn">← Go home</a></p>
      </div>
    `;
    title = 'Not found';
  }

  main.innerHTML = html;
  document.title = title + ' — RPwD Act 2016 Easy Read';
  setBodyChapter(ch);
  setActiveNav(nav);

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  // Announce page change to screen readers
  const announcer = document.getElementById('sr-announce');
  if (announcer) {
    announcer.textContent = '';
    setTimeout(() => { announcer.textContent = title; }, 100);
  }

  main.focus();
  window.scrollTo(0, 0);

  if (setupFn) setupFn();
}

/* ============ toolbar ============ */

function setupToolbar() {
  const btnBig = document.getElementById('btn-big-text');
  if (btnBig) {
    const pref = localStorage.getItem('rpwd-big-text') === '1';
    if (pref) {
      document.body.classList.add('big-text');
      btnBig.setAttribute('aria-pressed', 'true');
    }
    btnBig.addEventListener('click', () => {
      const on = document.body.classList.toggle('big-text');
      btnBig.setAttribute('aria-pressed', on ? 'true' : 'false');
      localStorage.setItem('rpwd-big-text', on ? '1' : '0');
    });
  }

  const btnPrint = document.getElementById('btn-print');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => window.print());
  }
}

/* ============ service worker ============ */

function registerSW() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  }
}

/* ============ boot ============ */

async function boot() {
  const main = document.getElementById('main');
  try {
    const res = await fetch(CONTENT_URL);
    if (!res.ok) throw new Error('content.json not found');
    CONTENT = await res.json();
    setupToolbar();
    renderRoute();
    window.addEventListener('hashchange', renderRoute);
    registerSW();
  } catch (err) {
    console.error(err);
    main.innerHTML = `
      <div class="content-page">
        <h1>Could not load the guide</h1>
        <p>Something went wrong reading the content file. Try again, or open this page through a web server (not directly from the file system).</p>
        <p><code>${esc(err.message)}</code></p>
      </div>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
