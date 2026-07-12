/* RPwD Easy Read — single-page app
 * Loads content.json, hash-routes between views, renders HTML, wires TTS,
 * search and the big-text toggle. Registers the service worker for offline.
 * No framework. Plain vanilla JS.
 */

'use strict';

const CONTENT_URL = 'content.json';
let CONTENT = null;

/* Five themed bands replace the old 17 chapter hues.
 * Mapping approved by the author 2026-07-12 (tower D-P49):
 * every chapter belongs to exactly one band; Section numbers stay
 * the citable anchor everywhere. */
const BANDS = [
  { id: 'foundations', name: 'Foundations & Definitions', short: 'FOUNDATIONS', chapters: ['I', 'XVII'] },
  { id: 'rights', name: 'Rights & Entitlements', short: 'RIGHTS', chapters: ['II'] },
  { id: 'services', name: 'Services & Support', short: 'SERVICES', chapters: ['III', 'IV', 'V', 'VI', 'VII'] },
  { id: 'systems', name: 'Systems & Authorities', short: 'SYSTEMS', chapters: ['VIII', 'IX', 'X', 'XI', 'XII', 'XIV', 'XV'] },
  { id: 'enforcement', name: 'Enforcement', short: 'ENFORCEMENT', chapters: ['XIII', 'XVI'] },
];

const bandForChapter = (chId) => BANDS.find((b) => b.chapters.includes(chId));

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
  book_learning: "A person sitting cross-legged on the floor, reading a book",
  book_open: "Three people reading one open book together",
  book_simple: "A closed book with a star on its cover, lying on a table",
  briefcase: "A wheelchair user with a briefcase on her lap arriving at the office; a colleague waves hello",
  building_ramp: "A person wheels up a ramp into a building on their own",
  bus: "A bus with a fold-out ramp at the door; a wheelchair user boards by herself",
  certificate_star: "A woman wheelchair user holds her star certificate above her head in celebration",
  chair_reserved: "A row of waiting chairs; one carries a wheelchair symbol and is kept free",
  clipboard_check: "Hands holding a clipboard, ticking items on a checklist",
  clock: "A wall clock; two people check the time together",
  commissioner_badge: "An official with a star badge meets a wheelchair user across his desk",
  committee_people: "A committee around a table; a wheelchair user sits as one of its members",
  computer: "A desktop computer and keyboard on an office desk",
  courthouse: "A courthouse building with wide steps and columns; people arriving",
  disaster_safe: "Two people sharing one umbrella in the rain",
  document: "An official document with ruled lines, a round seal stamp, and a pen beside it",
  equality: "A shopkeeper serves a wheelchair user and another customer equally at the counter",
  friends_support: "Four young friends drinking tea together; one uses a wheelchair, each holds their own glass",
  fund_box: "An open cash box on a table with coins beside it",
  globe_world: "A desk globe of the world on a stand",
  heart: "Two people holding hands, a heart above them",
  high_support_hands: "Two people solving a jigsaw puzzle together at a table",
  house_family: "A family at the door of their home, a heart on the wall",
  justice_scales: "A balance scale with two pans hanging perfectly equal",
  medical_cross: "A doctor and a wheelchair user talk face to face at the clinic",
  megaphone: "A group of advocates raise their voices together; one holds a megaphone, one uses a wheelchair",
  money_jar: "A woman drops a coin into a jar of savings",
  pencil_signing: "A woman seated at a table, signing a document with a pen",
  school: "A school building; students arrive, one using a wheelchair",
  shield: "Two people holding up a shield together",
  vote: "A woman places her ballot paper into the ballot box",
  warning: "A large warning triangle sign beside a woman using a wheelchair",
  women_children: "Parents holding hands with their child, a heart between them",
};

const altFor = (name) => ALT_TEXT[name] || `Illustration for this section`;

/* ============ views ============ */

const BAND_THUMBS = {
  foundations: 'document',
  rights: 'equality',
  services: 'school',
  systems: 'committee_people',
  enforcement: 'justice_scales',
};

/* One curated thumb per chapter (D-P51 decision 4); every pick unique so
 * the 17 cards on one screen never repeat an image. */
const CHAPTER_THUMBS = {
  I: 'book_simple',
  II: 'equality',
  III: 'school',
  IV: 'briefcase',
  V: 'heart',
  VI: 'chair_reserved',
  VII: 'high_support_hands',
  VIII: 'building_ramp',
  IX: 'clipboard_check',
  X: 'certificate_star',
  XI: 'committee_people',
  XII: 'commissioner_badge',
  XIII: 'courthouse',
  XIV: 'money_jar',
  XV: 'fund_box',
  XVI: 'warning',
  XVII: 'document',
};

/* A band holding one chapter skips its band page (D-P51 decision 1,
 * data-driven: an amendment adding a chapter restores the band page by
 * itself). */
const bandHref = (band) => band.chapters.length === 1
  ? `#/chapter/${band.chapters[0]}`
  : `#/map/${band.id}`;

const pictureCard = (href, img, name, accentVar, tintVar) => `
  <a class="pcard" href="${href}"
     style="--pcard-accent: ${accentVar}; --pcard-tint: ${tintVar}">
    <span class="pcard-img" aria-hidden="true">
      <img src="img/illustrations/${img}.webp" alt="" loading="lazy">
    </span>
    <span class="pcard-name">${esc(name)}</span>
  </a>
`;

function renderHome() {
  const tiles = BANDS.map((b) => pictureCard(
    bandHref(b), BAND_THUMBS[b.id], b.name,
    `var(--band-${b.id}-accent)`, `var(--band-${b.id}-tint)`
  )).join('');

  return `
    <div class="hero">
      <div class="hero-copy">
        <p class="hero-eyebrow">Nothing about us without us.</p>
        <h1>Know your rights. In plain words.</h1>
        <p class="hero-tagline">A plain-language guide to all 102 sections of India's disability rights law. One idea at a time, with a picture for each one.</p>
      </div>
      <figure class="hero-illus">
        <img src="img/illustrations/${esc('book_learning')}.webp" alt="${esc(altFor('book_learning'))}">
      </figure>
      <div class="hero-actions">
        <a href="#/map" class="btn btn-primary">Read the Act →</a>
        <a href="#/about" class="btn">How this guide works</a>
      </div>
    </div>

    <section class="band-row" aria-label="Choose a part of the law">
      <h2>Choose a part of the law</h2>
      <div class="pcards">${tiles}</div>
    </section>

    <a class="onramp" href="#/section/1">
      <span class="onramp-thumb" aria-hidden="true">
        <img src="img/illustrations/book_open.webp" alt="">
      </span>
      <span class="onramp-body">
        <strong class="onramp-title">New to the Act?</strong>
        <span class="onramp-text">Start with 3 short pages on what this law is and who it is for.</span>
        <span class="onramp-cta">Start here →</span>
      </span>
    </a>

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
  `;
}

function renderMap() {
  const cards = BANDS.map((b) => pictureCard(
    bandHref(b), BAND_THUMBS[b.id], b.name,
    `var(--band-${b.id}-accent)`, `var(--band-${b.id}-tint)`
  )).join('');

  return `
    <h1 class="page-title">All sections</h1>
    <div class="pcards" aria-label="Parts of the law">${cards}</div>
    <section class="search" aria-label="Find a section">
      <label for="search-map">Find a section</label>
      <input type="search" id="search-map"
             placeholder="Type a word like school, job, bus, money..."
             autocomplete="off">
      <div class="search-results" id="search-map-results" role="region" aria-live="polite"></div>
    </section>
  `;
}

function renderBand(bandId) {
  const band = BANDS.find((b) => b.id === bandId);
  if (!band) return '';
  const cards = band.chapters.map((chId) => {
    const ch = chapterById(chId);
    return pictureCard(
      `#/chapter/${chId}`, CHAPTER_THUMBS[chId], ch.plain_caption,
      `var(--band-${band.id}-accent)`, `var(--band-${band.id}-tint)`
    );
  }).join('');

  return `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a class="back-link" href="#/map">← All sections</a>
    </nav>
    <h1 class="page-title">${esc(band.name)}</h1>
    <div class="pcards" aria-label="Chapters in this part">${cards}</div>
  `;
}

function renderChapter(chId) {
  const chapter = chapterById(chId);
  if (!chapter) return '<p>Chapter not found.</p>';
  const band = bandForChapter(chId);
  const sections = byChapter(chId);
  const items = sections.map((s) => `
    <li>
      <a href="#/section/${s.num}">
        <span class="snum">S${s.num}</span>
        <span class="stitle">${esc(s.plain_title)}</span>
      </a>
    </li>
  `).join('');

  const backTarget = band.chapters.length === 1
    ? { href: '#/map', label: 'All sections' }
    : { href: `#/map/${band.id}`, label: band.name };

  return `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a class="back-link" href="${backTarget.href}">← ${esc(backTarget.label)}</a>
    </nav>
    <div class="chapter-hero">
      <div class="kicker">${esc(band.name)} · ${esc(chapter.kicker)}</div>
      <h1>${esc(chapter.plain_caption)}</h1>
      ${chapter.plain_caption === chapter.title ? '' : `<p>In the Act: ${esc(chapter.title)}</p>`}
    </div>
    <ul class="plain-rows">${items}</ul>
  `;
}

function renderSection(num) {
  const s = byNum(num);
  if (!s) return '<p>Section not found.</p>';
  const ch = chapterById(s.chapter);
  const idx = CONTENT.sections.findIndex((x) => x.num === s.num);
  const prev = idx > 0 ? CONTENT.sections[idx - 1] : null;
  const next = idx < CONTENT.sections.length - 1 ? CONTENT.sections[idx + 1] : null;

  const band = bandForChapter(s.chapter);

  return `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="#/map">All sections</a> ›
      ${band.chapters.length === 1
        ? `<a href="#/chapter/${esc(s.chapter)}">${esc(band.name)}</a>`
        : `<a href="#/map/${band.id}">${esc(band.name)}</a> ›
           <a href="#/chapter/${esc(s.chapter)}">${esc(ch.plain_caption)}</a>`} ›
      Section ${s.num}
    </nav>

    <div class="section-head">
      <div class="section-badge">Section ${s.num}</div>
      <p class="section-badge-note">Official number kept for citing</p>
      <div class="section-title-wrap">
        <div class="section-chapter-label">${esc(band.name)} · ${esc(ch.kicker)}</div>
        <h1 class="section-title">${esc(s.official_title)}</h1>
      </div>
    </div>

    <div class="section-grid">
      <figure class="section-illus">
        <img src="img/illustrations/${esc(s.illustration)}.webp"
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
      <button type="button" class="btn btn-primary" id="btn-speak">
        ▶ Read this to me
      </button>
      <button type="button" class="btn" id="btn-stop" hidden>
        ■ Stop reading
      </button>
    </div>

    ${band.id === 'enforcement' ? `
    <p class="using-act-line">Is this right being broken? <a href="#/help">See Using the Act →</a></p>
    ` : ''}

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

  let keepAlive = null;
  const speak = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const text = `Section ${s.num}. ${s.official_title}. ${s.plain_text} Use this when: ${s.use_when}`;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    utter.pitch = 1.0;
    /* Pick a real installed voice: forcing a lang with no matching
       voice goes silent on some Windows and Android builds. */
    const voices = synth.getVoices();
    const voice = voices.find((v) => v.lang === 'en-IN')
      || voices.find((v) => v.lang && v.lang.indexOf('en') === 0);
    if (voice) { utter.voice = voice; utter.lang = voice.lang; }
    const stopUI = () => {
      btnStop.hidden = true; btnSpeak.hidden = false;
      if (keepAlive) { clearInterval(keepAlive); keepAlive = null; }
    };
    utter.onstart = () => {
      btnStop.hidden = false; btnSpeak.hidden = true;
      /* Chrome desktop stalls long utterances after about 15s; a
         periodic pause and resume keeps it talking. */
      keepAlive = setInterval(() => {
        if (synth.speaking && !synth.paused) { synth.pause(); synth.resume(); }
      }, 10000);
    };
    utter.onend = stopUI;
    utter.onerror = stopUI;
    /* Chrome swallows a speak() issued in the same tick as cancel(). */
    setTimeout(() => synth.speak(utter), 80);
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
        <img src="img/illustrations/book_open.webp" alt="" class="page-illus">
      </div>
      <h1>About this guide</h1>

      <h2>Who made this and why</h2>
      <p>This guide was created by Deepa Palaniappan, an accessibility professional (CPACC).</p>
      <p>It teaches India's disability rights law: the Rights of Persons with Disabilities Act 2016.</p>
      <p>It explains all 102 sections in plain words. One idea at a time. A picture for each one.</p>
      <p>Every page keeps the official Section number and title from the Act. Citing the Section number gives your case real power, so it is never stripped out.</p>
      <p>Section titles are verified against the official Act text from the Ministry of Law and Justice.</p>

      <h2>How to use this guide</h2>
      <ul class="howto-list">
        <li>
          <img src="img/illustrations/megaphone.webp" alt="" aria-hidden="true">
          <span><strong>Read this to me.</strong> Press the button on any section page. Your device reads the words out loud.</span>
        </li>
        <li>
          <img src="img/illustrations/book_learning.webp" alt="" aria-hidden="true">
          <span><strong>Big text.</strong> Press Big text at the top. All the words get bigger.</span>
        </li>
        <li>
          <img src="img/illustrations/document.webp" alt="" aria-hidden="true">
          <span><strong>Search.</strong> Type a word like school or job. The matching sections appear.</span>
        </li>
        <li>
          <img src="img/illustrations/computer.webp" alt="" aria-hidden="true">
          <span><strong>Add to your phone.</strong> Your browser can install this guide on your home screen.</span>
        </li>
        <li>
          <img src="img/illustrations/globe_world.webp" alt="" aria-hidden="true">
          <span><strong>Works offline.</strong> After your first visit, the guide works without internet.</span>
        </li>
      </ul>

      <h2>Using the Act</h2>
      <p>Is a right in this guide being broken? Learn who to tell, and the officers and courts the law sets up.</p>
      <p><a href="#/help">Using the Act →</a></p>

      <h2>Remember your rights</h2>
      <p><a href="#/your-rights">Your rights in one page →</a></p>

      <p>This guide is not legal advice. For court matters, ask a lawyer or your State Commissioner.</p>

      <h2>Credits</h2>
      <p>Created and maintained by Deepa Palaniappan, accessibility professional (CPACC).</p>
      <p>Part of the <a href="https://deepapalaniappan-a11y.github.io/disability-rights-repository-site/" target="_blank" rel="noopener">Disability Rights Repository</a>.</p>
    </div>
  `;
}

function renderUsingTheAct() {
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
        <img src="img/illustrations/pencil_signing.webp" alt="" class="page-illus">
      </div>
      <h1>Using the Act</h1>
      <p>The Act is not only for reading. It gives you ways to act when a right is broken.</p>
      <p>This page shows you how. Who to tell. The officers and courts the law sets up.</p>

      <h2>How to complain, in 5 steps</h2>
      ${steps.map((st, i) => `
        <div class="step-card">
          <div class="num" aria-hidden="true">${i + 1}</div>
          <div>
            <h3>${esc(st[0])}</h3>
            <p>${esc(st[1])}</p>
          </div>
        </div>
      `).join('')}

      <h2>The officers and courts the law sets up</h2>
      <div class="step-card">
        <div>
          <h3>State Commissioner for Persons with Disabilities</h3>
          <p>Every state in India has one. They handle complaints inside the state. Look up your state's office or ask the state social welfare department.</p>
          <p>First place to go for most complaints.</p>
        </div>
      </div>
      <div class="step-card">
        <div>
          <h3>Chief Commissioner for Persons with Disabilities</h3>
          <p>A national office for cases that go beyond one state, or when the State Commissioner has not helped within 60 days.</p>
          <p>Office of the Chief Commissioner, New Delhi.</p>
        </div>
      </div>
      <div class="step-card">
        <div>
          <h3>Special Court</h3>
          <p>Every district has a court named to hear cases under this Act. See Sections 84 and 85.</p>
        </div>
      </div>
      <div class="step-card">
        <div>
          <h3>National Human Rights Commission</h3>
          <p>For very serious cases: cruelty, abuse, denial of basic rights.</p>
          <p>Especially under Sections 6, 7, and 92.</p>
        </div>
      </div>

      <h2>People who can stand with you</h2>
      <div class="step-card">
        <div>
          <h3>Disabled People's Organisations (DPOs)</h3>
          <p>DPOs are local groups led by persons with disabilities. They can help you write your complaint and stand with you. Look for a DPO in your city or district.</p>
        </div>
      </div>
    </div>
  `;
}

/* Training modules. Add a chapter here once its content/training/ch-NN.json
 * is generated by source/build_training.py. Registry drives the landing
 * page card and the router; the JSON is loaded lazily on first visit. */
const TRAINING_MODULES = {
  'ch-02': {
    chapter_id: 'II',
    band_id: 'rights',
    json_url: 'content/training/ch-02.json',
  },
};

const TRAINING_MODULE_CACHE = {};

async function loadTrainingModule(moduleId) {
  if (TRAINING_MODULE_CACHE[moduleId]) return TRAINING_MODULE_CACHE[moduleId];
  const meta = TRAINING_MODULES[moduleId];
  if (!meta) return null;
  // cache: 'no-cache' revalidates with the server on every fetch so a
  // trainer whose browser has an older ch-NN.json in HTTP cache still gets
  // the current content on the next visit. The service worker still serves
  // the file when offline.
  const res = await fetch(meta.json_url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load training module ${moduleId}`);
  const data = await res.json();
  TRAINING_MODULE_CACHE[moduleId] = data;
  return data;
}

const trainingCompleteKey = (id) => `rpwd-training-${id}-complete`;

function trainingModuleComplete(moduleId) {
  try {
    return localStorage.getItem(trainingCompleteKey(moduleId)) === '1';
  } catch (e) { return false; }
}

function setTrainingModuleComplete(moduleId, on) {
  try {
    if (on) localStorage.setItem(trainingCompleteKey(moduleId), '1');
    else localStorage.removeItem(trainingCompleteKey(moduleId));
  } catch (e) { /* storage disabled: silent */ }
}

function renderTraining() {
  const filters = `
    <div class="band-filters" role="group" aria-label="Show chapters from one part of the law">
      <button type="button" class="filter-chip" data-filter="all" aria-pressed="true">All</button>
      ${BANDS.map((b) => `
        <button type="button" class="filter-chip" data-filter="${b.id}" aria-pressed="false">${esc(b.name)}</button>
      `).join('')}
    </div>
    <p id="training-count" class="sr-only" aria-live="polite"></p>
  `;

  const total = CONTENT.chapters.length;
  const ready = CONTENT.chapters.filter((ch) => TRAINING_MODULES[`ch-${String(ch.id.length ? romanToNum(ch.id) : 0).padStart(2, '0')}`]).length;
  const completedCount = CONTENT.chapters.reduce((n, ch) => {
    const id = `ch-${String(romanToNum(ch.id)).padStart(2, '0')}`;
    return n + (TRAINING_MODULES[id] && trainingModuleComplete(id) ? 1 : 0);
  }, 0);
  const progressLine = ready > 0
    ? `<p class="training-progress"><strong>${ready} of ${total}</strong> chapter modules are ready. You have marked <strong>${completedCount}</strong> complete on this device.</p>`
    : '';

  const cards = CONTENT.chapters.map((ch) => {
    const band = bandForChapter(ch.id);
    const moduleId = `ch-${String(romanToNum(ch.id)).padStart(2, '0')}`;
    const hasModule = !!TRAINING_MODULES[moduleId];
    const done = hasModule && trainingModuleComplete(moduleId);
    const actions = hasModule
      ? `<a href="#/training/${moduleId}/1" class="btn btn-primary">Open module</a>
         ${done ? '<p class="dl-complete">Marked complete on this device</p>' : ''}`
      : `<p class="dl-coming">Coming soon.</p>`;
    return `
      <div class="tcard" data-band="${band.id}"
           style="--pcard-accent: var(--band-${band.id}-accent); --pcard-tint: var(--band-${band.id}-tint)">
        <span class="pcard-img" aria-hidden="true">
          <img src="img/illustrations/${CHAPTER_THUMBS[ch.id]}.webp" alt="" loading="lazy">
        </span>
        <div class="tcard-body">
          <p class="tcard-eyebrow">Chapter ${esc(ch.id)}</p>
          <h2 class="tcard-name">${esc(ch.plain_caption)}</h2>
          ${actions}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="training-page">
      <h1>Training Resources</h1>
      <p class="page-intro">For trainers and support workers. Pick a chapter of the Act and open its module in the browser. Free to use and share.</p>
      ${progressLine}
      ${filters}
      <div class="pcards training-cards">${cards}</div>
    </div>
  `;
}

const ROMAN_TO_NUM = { I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8, IX:9,
  X:10, XI:11, XII:12, XIII:13, XIV:14, XV:15, XVI:16, XVII:17 };
const romanToNum = (r) => ROMAN_TO_NUM[r] || 0;

/* Build a flat list of (segment, slide) tuples across all visible segments,
 * so prev/next can walk one slide at a time and cross segment boundaries at
 * the edges. Also normalises segment data so segments authored before the
 * slides split (single `html` string, no `slides` array) still work. */
function flattenSlides(data) {
  const flat = [];
  data.segments.forEach((seg) => {
    if (seg.hidden) return;
    const slides = (seg.slides && seg.slides.length)
      ? seg.slides
      : [{ num: 1, html: seg.html || '' }];
    slides.forEach((sl) => {
      flat.push({ seg, slide: sl, slidesInSeg: slides.length });
    });
  });
  return flat;
}

function slideHref(moduleId, segNum, slideNum) {
  return slideNum > 1
    ? `#/training/${moduleId}/${segNum}/${slideNum}`
    : `#/training/${moduleId}/${segNum}`;
}

function renderTrainingModule(moduleId, segNumRaw, slideNumRaw) {
  const meta = TRAINING_MODULES[moduleId];
  if (!meta) return null;
  const data = TRAINING_MODULE_CACHE[moduleId];
  if (!data) {
    return `
      <div class="module-page">
        <p class="loading">Loading module&hellip;</p>
      </div>
    `;
  }

  const flat = flattenSlides(data);
  if (flat.length === 0) return null;

  const visibleSegs = data.segments.filter((s) => !s.hidden);
  const wantSegNum = Number(segNumRaw) || visibleSegs[0].num;
  const wantSlideNum = Math.max(1, Number(slideNumRaw) || 1);

  let flatIdx = flat.findIndex((f) => f.seg.num === wantSegNum && f.slide.num === wantSlideNum);
  if (flatIdx === -1) {
    flatIdx = flat.findIndex((f) => f.seg.num === wantSegNum);
  }
  if (flatIdx === -1) flatIdx = 0;

  const current = flat[flatIdx];
  const seg = current.seg;
  const slide = current.slide;
  const slidesInSeg = current.slidesInSeg;
  const prev = flatIdx > 0 ? flat[flatIdx - 1] : null;
  const next = flatIdx < flat.length - 1 ? flat[flatIdx + 1] : null;
  const isFirstSlideOfSeg = slide.num === 1;
  const isLastSlideOfSeg = slide.num === slidesInSeg;
  const complete = trainingModuleComplete(moduleId);

  /* Contents overlay: the 22 slides grouped under their segment headings.
   * Structure for the trainer preparing a session; the learner just walks
   * Next through the slides (D-P51 decision 6). */
  const contents = visibleSegs.map((s) => {
    const slides = (s.slides && s.slides.length)
      ? s.slides
      : [{ num: 1, html: s.html || '' }];
    const activeSeg = s.num === seg.num;
    const slideLinks = slides.length > 1
      ? `<ol class="mc-slides">
           ${slides.map((sl) => {
             const active = activeSeg && sl.num === slide.num;
             return `
               <li>
                 <a href="${slideHref(moduleId, s.num, sl.num)}"
                    ${active ? 'aria-current="page"' : ''}>Slide ${sl.num} of ${slides.length}</a>
               </li>
             `;
           }).join('')}
         </ol>`
      : '';
    const segCurrent = activeSeg && slides.length === 1 ? 'aria-current="page"' : '';
    return `
      <li class="mc-seg${activeSeg ? ' active' : ''}">
        <a href="#/training/${esc(moduleId)}/${s.num}" ${segCurrent}>
          <span class="mc-num" aria-hidden="true">${s.num}.</span> ${esc(s.title)}
        </a>
        ${slideLinks}
      </li>
    `;
  }).join('');

  let markCompleteBlock = '';
  let takeawayBlock = '';
  if (seg.is_mark_complete && isLastSlideOfSeg) {
    if (data.takeaway_html) {
      takeawayBlock = `
        <section class="module-takeaway" aria-labelledby="takeaway-heading">
          <h3 id="takeaway-heading">Take-away kit for your session</h3>
          ${data.takeaway_html}
        </section>
      `;
    }
    markCompleteBlock = `
      <div class="mark-complete-block">
        <button type="button" id="btn-mark-complete"
                class="btn btn-primary btn-mark-complete"
                data-module-id="${esc(moduleId)}"
                data-complete="${complete ? '1' : '0'}"
                aria-pressed="${complete ? 'true' : 'false'}">
          ${complete ? 'Marked complete. Click to clear.' : 'Mark this module complete'}
        </button>
        <p class="mark-complete-note">The tick is stored on this device only. Clearing browser storage clears the tick.</p>
      </div>
    `;
  }

  let endnotesBlock = '';
  if (seg.num === 13 && isLastSlideOfSeg && data.endnotes_html) {
    endnotesBlock = `
      <section class="module-endnotes" aria-labelledby="endnotes-heading">
        <h3 id="endnotes-heading">Endnotes</h3>
        ${data.endnotes_html}
      </section>
    `;
  }

  const prevLink = prev
    ? `<a href="${slideHref(moduleId, prev.seg.num, prev.slide.num)}" class="btn-prev" rel="prev"
          aria-label="Back: ${prev.seg.num}. ${esc(prev.seg.title)}${prev.slidesInSeg > 1 ? `, slide ${prev.slide.num}` : ''}">
         &lsaquo; Back
       </a>`
    : '<span class="btn-prev btn-prev-empty" aria-hidden="true"></span>';
  const nextLink = next
    ? `<a href="${slideHref(moduleId, next.seg.num, next.slide.num)}" class="btn-next" rel="next"
          aria-label="Next: ${next.seg.num}. ${esc(next.seg.title)}${next.slidesInSeg > 1 ? `, slide ${next.slide.num}` : ''}">
         Next &rsaquo;
       </a>`
    : `<a href="#/training" class="btn-next" rel="next" aria-label="Finish: back to Training">
         Finish &rsaquo;
       </a>`;

  const bandShort = (BANDS.find((b) => b.id === data.band_id) || {}).short || '';
  const headingSuffix = slidesInSeg > 1 && slide.num > 1
    ? `<span class="segment-subhead"> &middot; slide ${slide.num}</span>`
    : '';

  return `
    <div class="module-page" data-module-id="${esc(moduleId)}"
         data-flat-idx="${flatIdx}" data-flat-len="${flat.length}">
      <nav class="module-crumb" aria-label="Breadcrumb">
        <a href="#/training">&lsaquo; Training</a>
      </nav>

      <header class="module-strip">
        <div class="module-strip-text">
          <h1>
            <span class="module-strip-eyebrow">${esc(bandShort)} &middot; CHAPTER ${esc(data.chapter_id)} &middot;</span>
            ${esc(data.title)}
          </h1>
          <p class="module-strip-meta">
            ${esc(data.sections_range)} &middot; About ${data.duration_minutes} minutes
            ${complete ? '<span class="module-complete-pill"> Complete on this device</span>' : ''}
          </p>
        </div>
        <button type="button" id="btn-contents" class="btn module-contents-btn"
                aria-expanded="false" aria-controls="module-contents">
          Contents
        </button>
      </header>

      <div class="module-contents" id="module-contents" hidden>
        <nav aria-label="Module contents">
          <ol class="mc-list">${contents}</ol>
        </nav>
        <p class="module-arrow-hint">Tip: the left and right arrow keys also walk the slides.</p>
      </div>

      <article class="module-segment"
               aria-labelledby="segment-heading"
               aria-roledescription="slide"
               aria-label="Slide ${flatIdx + 1} of ${flat.length}">
        <h2 id="segment-heading" tabindex="-1">
          <span class="segment-num" aria-hidden="true">${seg.num}.</span>
          ${esc(seg.title)}${headingSuffix}
        </h2>
        ${takeawayBlock}
        <div class="segment-body">${slide.html}</div>
        ${markCompleteBlock}
        ${endnotesBlock}
      </article>

      <nav class="module-prevnext" aria-label="Module navigation">
        ${prevLink}
        <span class="module-counter">Slide ${flatIdx + 1} of ${flat.length}</span>
        ${nextLink}
      </nav>
    </div>
  `;
}

function setupTrainingModule() {
  /* Contents overlay: one tap for orientation instead of a permanent
   * stepper rail. Re-renders closed on every slide change. */
  const contentsBtn = document.getElementById('btn-contents');
  const contentsPanel = document.getElementById('module-contents');
  if (contentsBtn && contentsPanel) {
    contentsBtn.addEventListener('click', () => {
      const open = contentsPanel.hidden;
      contentsPanel.hidden = !open;
      contentsBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        const current = contentsPanel.querySelector('[aria-current]');
        if (current) current.focus();
      }
    });
  }

  const btn = document.getElementById('btn-mark-complete');
  if (btn) {
    btn.addEventListener('click', () => {
      const moduleId = btn.dataset.moduleId;
      const nowComplete = btn.dataset.complete !== '1';
      setTrainingModuleComplete(moduleId, nowComplete);
      btn.dataset.complete = nowComplete ? '1' : '0';
      btn.setAttribute('aria-pressed', nowComplete ? 'true' : 'false');
      btn.textContent = nowComplete
        ? 'Marked complete. Click to clear.'
        : 'Mark this module complete';
      const announcer = document.getElementById('sr-announce');
      if (announcer) {
        announcer.textContent = '';
        setTimeout(() => {
          announcer.textContent = nowComplete
            ? 'Module marked complete on this device.'
            : 'Complete mark cleared.';
        }, 50);
      }
    });
  }

  /* Move focus to the slide heading on each render so screen readers pick
   * up the new slide's title and keyboard users land on the right spot. */
  const heading = document.getElementById('segment-heading');
  if (heading) heading.focus({ preventScroll: false });

  /* Arrow-key slide navigation. Left goes to previous slide, right goes to
   * next. Hijacks only bare arrow keys, so text fields and the details
   * disclosure keep their native behaviour. */
  if (!window._rpwdModuleArrows) {
    window._rpwdModuleArrows = true;
    document.addEventListener('keydown', (ev) => {
      if (!location.hash.startsWith('#/training/')) return;
      if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
      const tag = (ev.target && ev.target.tagName) || '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (ev.target && ev.target.isContentEditable) return;
      let target = null;
      if (ev.key === 'ArrowRight' || ev.key === 'PageDown') {
        target = document.querySelector('.module-prevnext .btn-next');
      } else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') {
        target = document.querySelector('.module-prevnext .btn-prev');
      }
      if (target && target.getAttribute('href')) {
        ev.preventDefault();
        location.hash = target.getAttribute('href').replace(/^#/, '');
      }
    });
  }
}

function setupTrainingFilters() {
  const chips = Array.from(document.querySelectorAll('.filter-chip'));
  const rows = Array.from(document.querySelectorAll('.tcard'));
  const count = document.getElementById('training-count');
  if (!chips.length) return;

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      chips.forEach((c) => c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'));
      let shown = 0;
      rows.forEach((row) => {
        const show = filter === 'all' || row.dataset.band === filter;
        row.hidden = !show;
        if (show) shown++;
      });
      if (count) {
        count.textContent = `Showing ${shown} ${shown === 1 ? 'chapter' : 'chapters'}.`;
      }
    });
  });
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
        <img src="img/illustrations/equality.webp" alt="" class="page-illus">
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
    const hay = `${s.title} ${s.plain_title} ${s.plain_text} ${s.use_when}`.toLowerCase();
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
        <strong>Section ${s.num}: ${esc(s.plain_title)}</strong>
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

function setBodyBand(chId) {
  const band = chId ? bandForChapter(chId) : null;
  const classes = (document.body.className || '').split(/\s+/).filter((c) => c && !c.startsWith('band-'));
  if (band) classes.push('band-' + band.id);
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
    title = 'Know your rights. In plain words.';
    nav = 'home';
    setupFn = () => setupSearch('search-home', 'search-home-results');
  } else if (parts[0] === 'map' && parts[1]) {
    const band = BANDS.find((b) => b.id === parts[1]);
    if (band) {
      html = renderBand(band.id);
      ch = band.chapters[0];
      title = band.name;
      nav = 'map';
    }
  } else if (parts[0] === 'map') {
    html = renderMap();
    title = 'All sections';
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
      title = `Section ${s.num}: ${s.official_title}`;
      setupFn = () => setupSectionControls(s);
    }
  } else if (parts[0] === 'about') {
    html = renderAbout();
    title = 'About this guide';
    nav = 'about';
  } else if (parts[0] === 'training' && parts[1] && TRAINING_MODULES[parts[1]]) {
    const moduleId = parts[1];
    const segNum = parts[2] ? Number(parts[2]) : 1;
    const slideNum = parts[3] ? Number(parts[3]) : 1;
    const meta = TRAINING_MODULES[moduleId];
    const cached = TRAINING_MODULE_CACHE[moduleId];
    if (!cached) {
      // Kick off load; re-render when data arrives.
      loadTrainingModule(moduleId)
        .then(() => renderRoute())
        .catch((err) => {
          console.error(err);
          const m = document.getElementById('main');
          if (m) m.innerHTML = `
            <div class="content-page">
              <h1>Could not load this training module</h1>
              <p>Try again, or check your connection.</p>
              <p><a href="#/training" class="btn">Back to Training</a></p>
            </div>
          `;
        });
    }
    html = renderTrainingModule(moduleId, segNum, slideNum);
    const bandForModule = BANDS.find((b) => b.id === meta.band_id);
    ch = bandForModule ? bandForModule.chapters[0] : null;
    title = cached ? cached.title : 'Training module';
    if (cached) {
      const seg = cached.segments.find((s) => s.num === segNum);
      if (seg) {
        const nSlides = (seg.slides && seg.slides.length) || 1;
        const slidePart = nSlides > 1 ? ` (slide ${Math.min(Math.max(slideNum, 1), nSlides)})` : '';
        title = `${seg.num}. ${seg.title}${slidePart}: ${cached.title}`;
      }
    }
    nav = 'training';
    setupFn = setupTrainingModule;
  } else if (parts[0] === 'training') {
    html = renderTraining();
    title = 'Training Resources';
    nav = 'training';
    setupFn = setupTrainingFilters;
  } else if (parts[0] === 'complain' || parts[0] === 'help' || parts[0] === 'using-the-act') {
    html = renderUsingTheAct();
    title = 'Using the Act';
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
  document.title = title + ' · RPwD Act 2016 Easy Read';
  setBodyBand(ch);
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
      document.documentElement.classList.add('big-text');
      btnBig.setAttribute('aria-pressed', 'true');
    }
    btnBig.addEventListener('click', () => {
      const on = document.documentElement.classList.toggle('big-text');
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
