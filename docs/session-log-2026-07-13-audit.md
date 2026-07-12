# Session log 2026-07-13: fresh-eyes full site audit

Independent auditor session, not a build session, run per
the programme tower audit brief. Full method
and findings: `docs\AUDIT-2026-07-13.md`. Raw harness scripts and JSON
evidence: `design-review\audit-2026-07-13\`.

## What happened, in order

1. Confirmed live parity: all seven served files SHA-256 identical
   between https://rpwd-easy-read.github.io/ and HEAD; main equals
   origin/main. Decision: run heavy sweeps locally against the proven
   identical tree, Lighthouse against the live origin.
2. Static sweeps first: design-v1 to HEAD diff of plain_text and
   use_when proved zero changes (the locked Easy Read text is
   untouched); bullets confirmed exactly S3 to S15 in data; copy sweep
   clean except one antithesis flag.
3. Built a puppeteer-core harness (installed Chrome, axe-core from
   node_modules, local static server) and swept all 257 routes: axe
   zero everywhere, console totally clean, every image loads, no
   content leaks, bullets fidelity perfect in the rendered DOM.
4. Interaction sweeps found the two real bugs of the day:
   - P1: the skip link (and the training endnote jumps) 404 the app,
     because the hash router treats any in-page fragment as an unknown
     route.
   - P2: the Know more Escape listener leaks per render; a stale one
     rewrites the URL to a previously visited section.
   First-pass TTS failures turned out to be harness artifacts (a plain
   assignment to window.speechSynthesis silently fails; the stub needs
   defineProperty). With a working stub the whole TTS state machine
   passed.
5. Reflow probe found section pages at 329px in big text at 320px
   (prev/next buttons cannot shrink). PWA probe confirmed fund_box and
   globe_world missing from the offline precache.
6. Lighthouse on six live route classes: accessibility 100 on all,
   performance 87 to 100 against the 83 baseline.
7. Fixed five findings in one commit (d181975), all small and
   unambiguous, none touching design, content wording, statute text,
   or IA: router fragment guard, Escape listener isConnected guard,
   prev-next flex-wrap, two precache additions, .webp cache-first.
   SW bumped v23 to v24. Gate re-run green: axe 0 on 257 routes,
   eleven targeted regressions pass.
8. Flagged, not fixed: the antithesis sentence on Using the Act
   (recommended one-line rewrite), stale public claims (SW version and
   illustration count), em dashes in two code comments.

## Decisions taken this session

- D: Audit evidence lives in design-review\audit-2026-07-13\ (scripts
  plus raw JSON), report in docs\AUDIT-2026-07-13.md, per the audit
  prompt's output spec.
- D: The five fixes qualified as unambiguous small defects under the
  prompt's fix-in-session rule; everything wording-shaped was flagged
  instead. One fix commit total (one-finisher).
- D: Fragment URLs on fresh load normalise to home rather than 404;
  in-session fragment jumps never re-render. Chosen as the smallest
  honest router behaviour that keeps the skip link, the endnote jumps,
  and deep links all working.

## Current status

Live site audited end to end and green. Fixes pushed, deploy verified
on the live origin: served files hash-match HEAD, the skip link keeps
the page, and the live service worker cache is rpwd-easy-read-v24.
Nothing left open in this repo from the audit except the three flags
awaiting Deepa's call.
