#!/usr/bin/env node
// check-slides.mjs — Automated visual QA for Frontend Slides decks.
//
// The fixed 1920×1080 stage clips everything with overflow:hidden, so two real
// failure modes are INVISIBLE in a screenshot — the deck looks fine while content
// is broken. This tool measures the live DOM instead of eyeballing pixels:
//
//   • overflow — text or media laid out beyond the 1920×1080 slide and silently
//     clipped. The content is lost, but a screenshot looks clean.
//   • overlap  — sibling panels in a flow (flex/grid) container covering each
//     other. This is the "grid panels can visually cover each other" failure
//     that SKILL.md warns scrollHeight checks alone cannot catch.
//
// Usage (direct):    node check-slides.mjs <deck.html|deck-dir> [--json] [--strict] [--slide N]
// Usage (bootstrap): bash scripts/check-slides.sh <deck.html|deck-dir> [flags]
//
// Importable as a library (for the planned CLI / web surfaces):
//   import { checkSlides } from './check-slides.mjs'
//   const report = await checkSlides('/abs/path/deck.html', { strict: false })
//
// Exit codes: 0 = clean · 1 = problems found · 2 = bad input / no slides found.

import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, statSync, realpathSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { pathToFileURL } from 'url';

// ─── Tunable thresholds ───────────────────────────────────────────────────────
const DEFAULTS = {
  tol: 1.5,           // px past the frame before it counts as overflow (sub-pixel slack)
  minArea: 4000,      // px²; ignore tiny boxes when checking panel overlap
  overlapRatio: 0.2,  // flag overlap when intersection ≥ 20% of the smaller panel
};

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.mjs': 'application/javascript', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.avif': 'image/avif', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.eot': 'application/vnd.ms-fontobject',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon',
};

// Analysis for a single slide. SERIALIZED AND RUN IN THE BROWSER via page.evaluate,
// so it must be self-contained (no Node closures) and take a single argument.
// Returns { findings: [...], scroll: {w,h} } or { error }.
function analyzeInPage({ slideIndex, cfg }) {
  const STAGE_W = 1920, STAGE_H = 1080, TOL = cfg.tol;
  const slides = document.querySelectorAll('.slide');
  const slide = slides[slideIndex];
  if (!slide) return { error: 'no-slide' };

  // Show only this slide and remove the stage scale so 1 CSS px == 1 logical px.
  slides.forEach((s, i) => {
    s.classList.toggle('active', i === slideIndex);
    s.classList.toggle('visible', i === slideIndex);
  });
  const stage = document.querySelector('.deck-stage');
  if (stage) stage.style.transform = 'none';

  // Force reveal/entrance animations into their final resting position — otherwise
  // a pre-animation translateY would be mis-measured as overflow.
  slide.querySelectorAll('.reveal, [class*="reveal"]').forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.visibility = 'visible';
  });
  void slide.getBoundingClientRect(); // flush layout

  const sr = slide.getBoundingClientRect();
  const DECOR = /(^|[\s_-])(bg|background|backdrop|decor|decoration|glow|blob|particle|gradient|ornament|grain|noise|texture|halo|aura|shape|orb|gridlines?|grid-lines?|pattern|vignette|spotlight)([\s_-]|$)/i;

  const directText = (el) =>
    Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
  const isVisible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    return parseFloat(cs.opacity) >= 0.05;
  };
  const isDecorative = (el) => {
    if (el.getAttribute('aria-hidden') === 'true') return true;
    const cs = getComputedStyle(el);
    if (cs.pointerEvents === 'none' && !directText(el)) return true;
    const tag = (el.id || '') + ' ' + (typeof el.className === 'string' ? el.className : '');
    return DECOR.test(tag);
  };
  const desc = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const cls = (typeof el.className === 'string' ? el.className : '')
      .trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (cls.length) s += '.' + cls.join('.');
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (t) s += ' “' + (t.length > 44 ? t.slice(0, 44) + '…' : t) + '”';
    return s;
  };

  const findings = [];

  // ── Overflow: visible text/media whose box extends past the 1920×1080 frame ──
  const MEDIA = new Set(['IMG', 'VIDEO', 'CANVAS', 'SVG', 'PICTURE']);
  slide.querySelectorAll('*').forEach((el) => {
    if (!isVisible(el) || isDecorative(el)) return;
    const isText = directText(el);
    const isMedia = MEDIA.has(el.tagName);
    if (!isText && !isMedia) return; // only flag real content, not layout wrappers
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    const right = r.right - sr.left - STAGE_W;
    const bottom = r.bottom - sr.top - STAGE_H;
    const left = sr.left - r.left;
    const top = sr.top - r.top;
    const worst = Math.max(right, bottom, left, top);
    if (worst <= TOL) return;
    const dirs = [];
    if (right > TOL) dirs.push(`right +${Math.round(right)}px`);
    if (bottom > TOL) dirs.push(`bottom +${Math.round(bottom)}px`);
    if (left > TOL) dirs.push(`left +${Math.round(left)}px`);
    if (top > TOL) dirs.push(`top +${Math.round(top)}px`);
    findings.push({ type: 'overflow', severity: 'error', amount: Math.round(worst), where: dirs.join(', '), element: desc(el) });
  });

  // ── Overlap: flow siblings in a flex/grid (or grid-like) container colliding ──
  slide.querySelectorAll('*').forEach((container) => {
    const cs = getComputedStyle(container);
    const isFlow = cs.display.includes('flex') || cs.display.includes('grid');
    const classHint = /(grid|cards?|columns?|panels?|two-?col|three-?col)/i
      .test(typeof container.className === 'string' ? container.className : '');
    if (!isFlow && !classHint) return;
    const kids = Array.from(container.children).filter((el) => {
      if (!isVisible(el) || isDecorative(el)) return false;
      const p = getComputedStyle(el).position;
      if (p === 'absolute' || p === 'fixed') return false; // layered on purpose
      const r = el.getBoundingClientRect();
      return r.width * r.height >= cfg.minArea;
    });
    for (let i = 0; i < kids.length; i++) {
      for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i].getBoundingClientRect();
        const b = kids[j].getBoundingClientRect();
        const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        const inter = ix * iy;
        if (inter <= 0) continue;
        const ratio = inter / Math.min(a.width * a.height, b.width * b.height);
        if (ratio >= cfg.overlapRatio) {
          findings.push({ type: 'overlap', severity: 'warn', amount: Math.round(ratio * 100), element: desc(kids[i]) + '  ⟂  ' + desc(kids[j]) });
        }
      }
    }
  });

  return { findings, scroll: { w: slide.scrollWidth, h: slide.scrollHeight } };
}

// Start a tiny static server rooted at the deck's folder (fonts/assets need HTTP).
function serve(rootDir, indexFile) {
  const server = createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    const filePath = join(rootDir, url === '/' ? indexFile : url);
    try {
      const body = readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  return new Promise((res) => server.listen(0, () => res({ server, port: server.address().port })));
}

/**
 * Analyze a deck and return a structured report.
 * @param {string} htmlPath  Absolute path to a .html file or a folder with index.html.
 * @param {object} [opts]    { strict, slide, tol, minArea, overlapRatio }
 * @returns {Promise<{ok,file,slideCount,errors,warnings,slides,noSlides?}>}
 */
export async function checkSlides(htmlPath, opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  const st = statSync(htmlPath);
  const file = st.isDirectory() ? join(htmlPath, 'index.html') : htmlPath;
  const rootDir = dirname(file);
  const indexFile = basename(file);

  const { server, port } = await serve(rootDir, indexFile);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(600); // let web fonts settle (font swap changes text width)

    const slideCount = await page.evaluate(() => document.querySelectorAll('.slide').length);
    if (slideCount === 0) {
      return { ok: false, file, slideCount: 0, errors: 0, warnings: 0, slides: [], noSlides: true };
    }

    const indices = Number.isInteger(opts.slide)
      ? [opts.slide].filter((i) => i >= 0 && i < slideCount)
      : Array.from({ length: slideCount }, (_, i) => i);

    const slides = [];
    let errors = 0, warnings = 0;
    for (const i of indices) {
      const r = await page.evaluate(analyzeInPage, { slideIndex: i, cfg });
      const findings = (r && r.findings) || [];
      for (const f of findings) f.severity === 'error' ? errors++ : warnings++;
      if (findings.length) slides.push({ index: i, findings });
    }

    const ok = errors === 0 && (!cfg.strict || warnings === 0);
    return { ok, file, slideCount, errors, warnings, slides };
  } finally {
    await browser.close();
    server.close();
  }
}

// ─── CLI ──────────────────────────────────────────────────────────────────────
// Symlink-safe main check: macOS temp dirs live under /var → /private/var, and
// Node realpaths import.meta.url, so a raw string compare against argv[1] fails.
const isMain = (() => {
  try { return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href; }
  catch { return false; }
})();
if (isMain) {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  const slideFlagIdx = args.indexOf('--slide');
  const slideValueIdx = slideFlagIdx === -1 ? -1 : slideFlagIdx + 1;
  const slide = slideValueIdx !== -1 ? parseInt(args[slideValueIdx], 10) : undefined;
  const input = args.find((a, i) => !a.startsWith('--') && i !== slideValueIdx);

  if (!input) {
    console.error('Usage: node check-slides.mjs <deck.html|deck-dir> [--json] [--strict] [--slide N]');
    process.exit(2);
  }

  const json = flags.has('--json');
  const strict = flags.has('--strict');

  let report;
  try {
    report = await checkSlides(input, { strict, slide: Number.isInteger(slide) ? slide : undefined });
  } catch (e) {
    console.error(`check-slides failed: ${e.message}`);
    process.exit(2);
  }

  if (json) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 1);
  }

  const tty = process.stdout.isTTY;
  const c = (code) => (tty ? code : '');
  const RED = c('\x1b[31m'), YEL = c('\x1b[33m'), GRN = c('\x1b[32m'), DIM = c('\x1b[2m'), B = c('\x1b[1m'), R = c('\x1b[0m');

  if (report.noSlides) {
    console.error(`${RED}✗${R} No .slide elements found in ${report.file}.`);
    console.error('  Decks generated by this skill use <section class="slide"> inside .deck-stage.');
    process.exit(2);
  }

  console.log('');
  console.log(`${B}Visual QA — ${basename(report.file)}${R}  ${DIM}(${report.slideCount} slides)${R}`);
  if (report.slides.length === 0) {
    console.log(`${GRN}✓${R} No overflow or overlap detected. All ${report.slideCount} slides fit the 1920×1080 stage.`);
  } else {
    for (const s of report.slides) {
      console.log(`\n  ${B}Slide ${s.index + 1}${R}`);
      for (const f of s.findings) {
        if (f.type === 'overflow') {
          console.log(`    ${RED}● overflow${R} ${DIM}(${f.where})${R}  ${f.element}`);
        } else {
          console.log(`    ${YEL}● overlap${R}  ${DIM}(${f.amount}% of smaller panel)${R}  ${f.element}`);
        }
      }
    }
    console.log('');
    const parts = [];
    if (report.errors) parts.push(`${RED}${report.errors} overflow${R}`);
    if (report.warnings) parts.push(`${YEL}${report.warnings} overlap${R}`);
    console.log(`  ${parts.join('  ·  ')}   ${report.ok ? GRN + 'pass' + R : RED + 'FAIL' + R}`);
    if (report.warnings && !strict) console.log(`  ${DIM}overlap is a warning; pass --strict to fail the run on it too.${R}`);
  }
  console.log('');
  process.exit(report.ok ? 0 : 1);
}
