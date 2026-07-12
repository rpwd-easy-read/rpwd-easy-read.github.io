/* RPwD Easy Read: single-page app
 * Loads content.json, hash-routes between views, renders HTML, wires TTS,
 * search and the big-text toggle. Registers the service worker for offline.
 * No framework. Plain vanilla JS.
 */

'use strict';

const CONTENT_URL = 'content.json';
let CONTENT = null;

/* Five themed bands replace the old 17 chapter hues.
 * Mapping approved by the author 2026-07-12:
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

/* One curated thumb per chapter (author decision); every pick unique so
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

/* A band holding one chapter skips its band page (author decision,
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
      <div class="section-controls-group">
        <button type="button" class="btn btn-primary" id="btn-speak">
          ▶ Read this to me
        </button>
        <button type="button" class="btn" id="btn-stop" hidden>
          ■ Stop reading
        </button>
      </div>
      <div class="section-controls-group">
        <a href="#/section/${s.num}/more" class="btn" id="btn-know-more"
           aria-expanded="false" aria-controls="know-more-panel">
          Section ${s.num} text from the RPwD Act
        </a>
      </div>
    </div>

    ${renderKnowMorePanel(s)}

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

/* Verbatim gazette text, rendered as a quiet quoted block.
 * Hidden by default. The Know more link opens it via the sub-route
 * #/section/N/more; Escape or the Close button returns to #/section/N.
 *
 * If a section has signed-off `know_more_bullets` (v2.3b, per band),
 * the plain-words layer renders ABOVE the verbatim quote. Sections
 * without signed bullets show only the verbatim law: complete and
 * honest from day one, no dead buttons, no coming soon. */
function renderKnowMorePanel(s) {
  const paragraphs = String(s.official_text || '')
    .split('\n\n')
    .map((p) => `<p>${esc(p)}</p>`)
    .join('');
  const bullets = Array.isArray(s.know_more_bullets) ? s.know_more_bullets : null;
  const plainWordsLayer = bullets && bullets.length
    ? `
        <div class="know-more-plain">
          <p class="know-more-kicker">More in plain words</p>
          <ul class="know-more-bullets">
            ${bullets.map((b) => `<li>${esc(b)}</li>`).join('')}
          </ul>
        </div>
      `
    : '';
  return `
    <section class="know-more-panel"
             id="know-more-panel"
             aria-labelledby="km-title"
             hidden>
      <div class="know-more-inner">
        <div class="know-more-head">
          <p class="know-more-kicker">RPwD Act 2016</p>
          <h2 id="km-title" class="know-more-title" tabindex="-1">
            Section ${s.num} text from the RPwD Act
          </h2>
          <p class="know-more-subtitle">${esc(s.official_title)}</p>
        </div>
        <p class="know-more-note">
          The plain-language version above belongs to you first.
          Below is more depth, then the verbatim statute so
          nothing is withheld.
        </p>
        ${plainWordsLayer}
        <p class="know-more-kicker">The law's actual words</p>
        <blockquote class="know-more-quote" aria-label="Verbatim text of Section ${s.num}">
          ${paragraphs}
        </blockquote>
        <div class="know-more-foot">
          <a href="#/section/${s.num}" class="btn" id="btn-know-more-close">
            ✕ Close
          </a>
        </div>
      </div>
    </section>
  `;
}

/* Shared speech engine for Read this to me and the module player's
 * Listen button. Carries the three Chrome TTS fixes in one place:
 * pick a real installed voice (forcing a lang with no matching voice
 * goes silent on some Windows and Android builds), defer speak() past
 * cancel() (Chrome swallows a speak issued in the same tick), and a
 * pause-resume keep-alive (desktop Chrome stalls long utterances
 * after about 15s). onStateChange(true|false) drives the caller's
 * play/stop button swap. */
function createSpeaker(buildText, onStateChange) {
  let keepAlive = null;
  const done = () => {
    if (keepAlive) { clearInterval(keepAlive); keepAlive = null; }
    onStateChange(false);
  };
  const speak = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(buildText());
    utter.rate = 0.9;
    utter.pitch = 1.0;
    const voices = synth.getVoices();
    const voice = voices.find((v) => v.lang === 'en-IN')
      || voices.find((v) => v.lang && v.lang.indexOf('en') === 0);
    if (voice) { utter.voice = voice; utter.lang = voice.lang; }
    utter.onstart = () => {
      onStateChange(true);
      keepAlive = setInterval(() => {
        if (synth.speaking && !synth.paused) { synth.pause(); synth.resume(); }
      }, 10000);
    };
    utter.onend = done;
    utter.onerror = done;
    setTimeout(() => synth.speak(utter), 80);
  };
  const stop = () => {
    window.speechSynthesis.cancel();
    done();
  };
  return { speak, stop };
}

function setupSectionControls(s) {
  const btnSpeak = document.getElementById('btn-speak');
  const btnStop = document.getElementById('btn-stop');
  if (!btnSpeak) return;

  if (!('speechSynthesis' in window)) {
    btnSpeak.hidden = true;
    return;
  }

  /* Panel-aware text picker. When the Know more panel is open,
   * read the panel content too (author decision). Otherwise scope
   * stays on the Easy Read plain text. */
  const buildSpeechText = () => {
    const panel = document.getElementById('know-more-panel');
    const panelOpen = panel && !panel.hidden;
    const base = `Section ${s.num}. ${s.official_title}. `
      + `${s.plain_text} Use this when: ${s.use_when}`;
    if (!panelOpen) return base;
    const bullets = Array.isArray(s.know_more_bullets) ? s.know_more_bullets : null;
    const bulletsPart = bullets && bullets.length
      ? ` More in plain words. ${bullets.join(' ')}`
      : '';
    const verbatim = (s.official_text || '').replace(/\s+/g, ' ').trim();
    return base + bulletsPart + ` The law's actual words. ${verbatim}`;
  };

  const speaker = createSpeaker(buildSpeechText, (speaking) => {
    btnStop.hidden = !speaking;
    btnSpeak.hidden = speaking;
  });

  btnSpeak.addEventListener('click', speaker.speak);
  btnStop.addEventListener('click', speaker.stop);
}

/* Know more panel: open/close via the sub-route #/section/N/more.
 * The sub-route decision means Back always returns to the
 * section page cleanly. Focus moves to the panel heading on open;
 * Escape or Close returns focus to the Know more button. */
function setupKnowMorePanel(s, openOnLoad) {
  const panel = document.getElementById('know-more-panel');
  const trigger = document.getElementById('btn-know-more');
  const heading = document.getElementById('km-title');
  const closeBtn = document.getElementById('btn-know-more-close');
  if (!panel || !trigger) return;

  const open = () => {
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    if (heading) {
      heading.focus();
      heading.scrollIntoView({ block: 'start' });
    }
  };
  const close = () => {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    /* Cancel any in-flight speech that was reading the panel. */
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    trigger.focus();
  };

  /* The Know more link and the Close link both flip the URL hash.
   * We intercept them here so the panel state changes without a full
   * route re-render, keeping focus and scroll stable. */
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    history.pushState(null, '', `#/section/${s.num}/more`);
    open();
  });
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      history.pushState(null, '', `#/section/${s.num}`);
      close();
    });
  }
  document.addEventListener('keydown', (e) => {
    /* This listener outlives its render: a re-render leaves the old
     * panel detached but still captured here. Without the isConnected
     * guard, Escape on a later page rewrites the URL to this section. */
    if (!panel.isConnected) return;
    if (e.key === 'Escape' && !panel.hidden) {
      history.pushState(null, '', `#/section/${s.num}`);
      close();
    }
  });

  if (openOnLoad) open();
}

function renderAbout() {
  return `
    <div class="content-page">
      <div class="page-hero-illus" aria-hidden="true">
        <img src="img/illustrations/book_open.webp" alt="" class="page-illus">
      </div>
      <h1>About this guide</h1>

      <p>This guide teaches India's disability rights law: the Rights of Persons with Disabilities Act 2016.</p>
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
      <p>The Act gives you ways to act when a right is broken.</p>
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
   * Next through the slides (author decision). */
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
  const progressPct = Math.round(((flatIdx + 1) / flat.length) * 100);

  /* LMS player shell (2026-07-13, docs\LMS-PLAYER-SPEC.md): chrome
   * strip above and control bar below a light slide stage, in the
   * flash-simulated style of typical LMS modules. Routes, arrow keys,
   * Contents overlay, mark-complete and endnotes are unchanged. */
  return `
    <div class="module-page" data-module-id="${esc(moduleId)}"
         data-flat-idx="${flatIdx}" data-flat-len="${flat.length}">
      <nav class="module-crumb" aria-label="Breadcrumb">
        <a href="#/training">&lsaquo; Training</a>
      </nav>

      <div class="player">
        <header class="player-top">
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

        <div class="player-stage" id="player-stage" tabindex="0"
             role="region" aria-label="Slide content">
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
        </div>
        <div class="stage-more-hint" id="stage-more-hint" hidden>
          <span>More below.</span>
          <button type="button" class="btn-stage-scroll" id="btn-stage-scroll">
            Scroll down &#9662;
          </button>
        </div>

        <nav class="module-prevnext player-controls" aria-label="Module navigation">
          ${prevLink}
          <div class="player-progress">
            <span class="player-progress-track" aria-hidden="true">
              <span class="player-progress-fill" style="width: ${progressPct}%"></span>
            </span>
            <span class="module-counter">Slide ${flatIdx + 1} of ${flat.length}</span>
          </div>
          <div class="player-audio">
            <button type="button" class="btn-listen" id="btn-slide-listen">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor"/><path d="M16 8.5a4.5 4.5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.5 5.5a8.5 8.5 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              Read aloud
            </button>
            <button type="button" class="btn-listen" id="btn-slide-stop" hidden>
              &#9632; Stop
            </button>
          </div>
          ${nextLink}
        </nav>
      </div>
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

  /* Listen: read the visible slide (heading, then body) through the
   * shared speech engine. User-initiated only, no autoplay; the router
   * cancels speech on every slide or route change. */
  const btnListen = document.getElementById('btn-slide-listen');
  const btnListenStop = document.getElementById('btn-slide-stop');
  if (btnListen && btnListenStop) {
    if (!('speechSynthesis' in window)) {
      btnListen.hidden = true;
    } else {
      const buildSlideText = () => {
        const h = document.getElementById('segment-heading');
        const body = document.querySelector('.segment-body');
        const headPart = h ? h.textContent.replace(/\s+/g, ' ').trim() : '';
        const bodyPart = body ? body.innerText.replace(/\s+/g, ' ').trim() : '';
        return `${headPart}. ${bodyPart}`;
      };
      const speaker = createSpeaker(buildSlideText, (speaking) => {
        btnListenStop.hidden = !speaking;
        btnListen.hidden = speaking;
      });
      btnListen.addEventListener('click', speaker.speak);
      btnListenStop.addEventListener('click', speaker.stop);
    }
  }

  /* Move focus to the slide heading on each render so screen readers
   * pick up the new slide's title, but never let the focus jump move
   * the page (author feedback 2026-07-13: every Next yanked the viewport up and
   * forced a fresh scroll down to the stage, disorienting and heavy
   * for users with limited mobility). Instead the viewport is pinned
   * to the same spot on every slide: player strip at the top, stage
   * in view, controls fixed at the bottom. Only the slide changes. */
  const heading = document.getElementById('segment-heading');
  if (heading) heading.focus({ preventScroll: true });
  const playerEl = document.querySelector('.player');
  if (playerEl) {
    const target = Math.round(playerEl.getBoundingClientRect().top + window.scrollY - 8);
    window.scrollTo(0, Math.max(0, target));
  }

  /* Stage sizing and the long-slide affordances. On laptop widths the
   * stage grows to meet the control bar, so short and medium slides
   * show whole and in-stage scrolling is reserved for genuinely large
   * content. When a slide does overflow, a chrome bar appears with a
   * Scroll down button (author feedback 2026-07-13: an on-screen button beats a
   * scroll gesture for users with limited mobility). On phones the
   * stage has no height cap and the page scrolls naturally. */
  const stage = document.getElementById('player-stage');
  const moreHint = document.getElementById('stage-more-hint');
  const scrollBtn = document.getElementById('btn-stage-scroll');
  if (stage && moreHint) {
    const updateHint = () => {
      const overflowing = stage.scrollHeight - stage.clientHeight > 8;
      const atBottom = stage.scrollTop + stage.clientHeight >= stage.scrollHeight - 8;
      const show = overflowing && !atBottom;
      if (!show && scrollBtn && document.activeElement === scrollBtn) stage.focus();
      moreHint.style.visibility = show ? 'visible' : 'hidden';
    };
    const sizeStage = () => {
      if (!stage.isConnected) return;
      const bar = document.querySelector('.player-controls');
      if (window.matchMedia('(max-width: 600px)').matches || !bar) {
        stage.style.height = '';
        stage.style.maxHeight = '';
        moreHint.hidden = true;
        return;
      }
      stage.style.maxHeight = 'none';
      stage.style.height = 'auto';
      const room = Math.floor(bar.getBoundingClientRect().top
        - stage.getBoundingClientRect().top - 12);
      const overflowing = stage.scrollHeight > room;
      moreHint.hidden = !overflowing;
      const hintSpace = overflowing ? moreHint.offsetHeight : 0;
      stage.style.height = Math.max(280, room - hintSpace) + 'px';
      updateHint();
    };
    sizeStage();
    stage.addEventListener('scroll', updateHint);
    if (scrollBtn) {
      scrollBtn.addEventListener('click', () => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        stage.scrollBy({
          top: Math.round(stage.clientHeight * 0.8),
          behavior: reduce ? 'auto' : 'smooth',
        });
      });
    }
    /* Re-size on window resize and on the Big text toggle; the hooks
     * are installed once and call through a per-render pointer so
     * stale closures from earlier slides never run. */
    window._rpwdSizeStage = sizeStage;
    if (!window._rpwdStageHooks) {
      window._rpwdStageHooks = true;
      window.addEventListener('resize', () => {
        if (window._rpwdSizeStage) window._rpwdSizeStage();
      });
      const btnBig = document.getElementById('btn-big-text');
      if (btnBig) {
        btnBig.addEventListener('click', () => {
          setTimeout(() => {
            if (window._rpwdSizeStage) window._rpwdSizeStage();
          }, 50);
        });
      }
    }
  }

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

let hasRenderedOnce = false;

function renderRoute() {
  const main = document.getElementById('main');

  /* In-page fragments are not routes. The skip link (#main) and the
   * training endnote jumps (#fn:N, #fnref:N) land here: leave the
   * rendered page alone so the browser's own jump and focus work.
   * On a fresh page load with a fragment URL, fall through to home. */
  const fragment = location.hash.slice(1);
  if (fragment && fragment.charAt(0) !== '/') {
    if (hasRenderedOnce && document.getElementById(fragment)) return;
    history.replaceState(null, '', '#/');
  }
  hasRenderedOnce = true;

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
      const showMore = parts[2] === 'more';
      html = renderSection(s.num);
      ch = s.chapter;
      title = showMore
        ? `Section ${s.num} text from the RPwD Act: ${s.official_title}`
        : `Section ${s.num}: ${s.official_title}`;
      setupFn = () => {
        setupSectionControls(s);
        setupKnowMorePanel(s, showMore);
      };
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
