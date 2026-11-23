// Publishes the weekly puzzle on kvdhdevelopment.github.io (owner 2026-11-23; source in the Cluedoku repo,
// docs/website/weekpuzzel/). Runs every Monday in the site's GitHub Action (.github/workflows/weekpuzzel.yml) from the
// `wachtrij` branch, which holds this script, teksten.json, plan.json and one folder per week (weken/NNN, made by
// scripts/weekpuzzel-bouw.mjs). Week n appears on start + 7·(n−1) days; its solution one week later. Everything it
// writes is derived from the queue, so running it twice gives the same site. Plain Node, no packages.
//
//   node publiceer.mjs <site folder> [YYYY-MM-DD]
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(process.argv[2] ?? '');
if (!process.argv[2] || !existsSync(join(SITE, 'privacy.html'))) throw new Error('geef de map van de website (met privacy.html)');
const VANDAAG = process.argv[3] ?? new Date().toISOString().slice(0, 10);
const T = JSON.parse(readFileSync(join(HIER, 'teksten.json'), 'utf8'));
const PLAN = JSON.parse(readFileSync(join(HIER, 'plan.json'), 'utf8'));
const LANGS = Object.keys(T);
const BASIS = 'https://kvdhdevelopment.github.io/';
const DAG = 864e5;
const datumVan = (n) => new Date(Date.parse(PLAN.start) + (n - 1) * 7 * DAG).toISOString().slice(0, 10);
const NU = Math.floor((Date.parse(VANDAAG) - Date.parse(PLAN.start)) / (7 * DAG)) + 1;
const nnn = (n) => String(n).padStart(3, '0');
const weken = PLAN.weken
  .filter((w) => w.week <= NU && existsSync(join(HIER, 'weken', nnn(w.week), 'data.json')))
  .map((w) => ({ ...w, data: JSON.parse(readFileSync(join(HIER, 'weken', nnn(w.week), 'data.json'), 'utf8')) }))
  .sort((a, b) => a.week - b.week);
if (!weken.length) { console.log(`${VANDAAG}: nog geen week om te publiceren`); process.exit(0); }
const LAATSTE = weken[weken.length - 1].week;
const opgelost = (n) => n < NU;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const vul = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const datum = (lang, iso) => new Intl.DateTimeFormat(T[lang].hreflang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));
const overzicht = (lang) => `/${T[lang].pad}${T[lang].slug}/`;
const weekPad = (lang, n) => `${overzicht(lang)}${n}/`;
const play = (lang) => `https://play.google.com/store/apps/details?id=com.vdhd.cluedoku&hl=${T[lang].hreflang}&referrer=${encodeURIComponent('utm_source=weekpuzzel&utm_medium=' + lang)}`;
const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5v17l15-8.5z" fill="currentColor"/></svg>';
const PRINT_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v5H7zM5 9h14a2 2 0 0 1 2 2v6h-4v4H7v-4H3v-6a2 2 0 0 1 2-2zm4 7v3h6v-3z" fill="currentColor"/></svg>';

const CSS = `@font-face{font-family:Fredoka;font-weight:700;font-display:swap;src:url(/fonts/fredoka-latin-700-normal.woff2) format('woff2')}
@font-face{font-family:Fredoka;font-weight:700;font-display:swap;src:url(/fonts/fredoka-latin-ext-700-normal.woff2) format('woff2');unicode-range:U+0100-02AF,U+1E00-1EFF}
@font-face{font-family:Nunito;font-weight:600;font-display:swap;src:url(/fonts/nunito-latin-600-normal.woff2) format('woff2')}
@font-face{font-family:Nunito;font-weight:600;font-display:swap;src:url(/fonts/nunito-latin-ext-600-normal.woff2) format('woff2');unicode-range:U+0100-02AF,U+1E00-1EFF}
@font-face{font-family:Nunito;font-weight:800;font-display:swap;src:url(/fonts/nunito-latin-800-normal.woff2) format('woff2')}
:root{--inkt:#2b2140;--paars:#3d2f5c;--rood:#ff6f61;--geel:#ffd84d;--papier:#fbf8f3;--zacht:#5d5478}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;font-family:Nunito,system-ui,sans-serif;font-weight:600;color:var(--inkt);background:var(--papier);line-height:1.5}
a{color:inherit}
img{max-width:100%;height:auto}
.wrap{max-width:1040px;margin:0 auto;padding:0 16px}
.held{background:linear-gradient(160deg,var(--paars),#2b2140);color:#fff;position:relative;overflow:hidden}
.held::before{content:"";position:absolute;inset:0;background-image:linear-gradient(#ffffff10 1px,transparent 1px),linear-gradient(90deg,#ffffff10 1px,transparent 1px);background-size:32px 32px}
.held .wrap{position:relative}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:18px}
.merk{display:flex;align-items:center;gap:12px;text-decoration:none;font-family:Fredoka;font-weight:700;font-size:26px;letter-spacing:1px}
.merk img{width:40px;height:40px;border-radius:10px}
.talen select{font:inherit;font-weight:700;background:#ffffff18;color:#fff;border:2px solid #ffffff40;border-radius:999px;padding:6px 12px;max-width:44vw}
.talen option{color:var(--inkt)}
.kruim{display:inline-block;margin-top:22px;color:#e9e4f5;font-size:15px}
h1{font-family:Fredoka;font-weight:700;font-size:clamp(28px,4.4vw,46px);line-height:1.1;margin:8px 0 10px}
.meta{color:#e9e4f5;margin:0 0 22px}
.lead{font-size:18px;color:#e9e4f5;margin:0 0 22px;max-width:40em}
.held-in{padding-bottom:40px}
.knoppen{display:flex;flex-wrap:wrap;gap:12px}
.knop{display:inline-flex;align-items:center;gap:10px;font-family:Fredoka;font-weight:700;font-size:18px;text-decoration:none;border:3px solid var(--inkt);border-radius:14px;padding:10px 18px;box-shadow:4px 4px 0 #00000066;background:#fff;color:var(--inkt)}
.knop--rood{background:var(--rood);color:#fff}
.knop svg{width:20px;height:20px;flex:none}
section{padding:40px 0}
h2{font-family:Fredoka;font-weight:700;font-size:28px;margin:0 0 16px}
.intro{font-size:18px;font-style:italic;max-width:42em;margin:0 0 24px}
.zaak{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:32px;align-items:start}
.bord{background:#fff;border:3px solid var(--inkt);border-radius:16px;padding:10px;box-shadow:5px 5px 0 #2b214033}
.bord img{display:block;width:100%}
.aanw p{margin:0 0 10px;background:#fff;border:2px solid #2b214033;border-radius:12px;padding:10px 14px}
.regels{background:#fff4d6;border:3px solid var(--inkt);border-radius:16px;padding:14px 18px;margin-top:18px}
.regels h3{font-family:Fredoka;margin:0 0 6px;font-size:19px}
.regels p{margin:0}
.oplossing{background:#fff;border-top:3px solid var(--inkt);border-bottom:3px solid var(--inkt)}
details summary{cursor:pointer;font-family:Fredoka;font-weight:700;font-size:20px;display:inline-flex;border:3px solid var(--inkt);border-radius:14px;padding:10px 18px;background:var(--geel);box-shadow:4px 4px 0 #2b214055;list-style:none}
details summary::-webkit-details-marker{display:none}
details[open] summary{margin-bottom:20px}
.stappen{padding-left:22px}
.stappen li{margin-bottom:6px}
.app{background:#fff4d6}
.app p{font-size:18px;max-width:42em}
.nav{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;padding:24px 0 0}
.nav a{font-weight:800}
.lijst{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:18px;margin:0;padding:0;list-style:none}
.lijst a{display:block;text-decoration:none;background:#fff;border:3px solid var(--inkt);border-radius:16px;padding:10px;box-shadow:4px 4px 0 #2b214033;height:100%}
.lijst img{display:block;width:100%;border-radius:8px}
.lijst strong{display:block;font-family:Fredoka;font-size:18px;line-height:1.2;margin-top:8px}
.lijst span{display:block;color:var(--zacht);font-size:14px}
.uitgelicht{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;align-items:center;text-decoration:none;background:#fff;border:3px solid var(--inkt);border-radius:18px;padding:16px;box-shadow:6px 6px 0 #2b214044}
.uitgelicht img{display:block;width:100%}
.uitgelicht h3{font-family:Fredoka;font-size:28px;line-height:1.15;margin:4px 0 8px}
footer{padding:28px 0 40px;color:var(--zacht);font-size:15px}
footer .wrap{display:flex;flex-wrap:wrap;gap:10px 24px;justify-content:space-between}
footer nav{display:flex;flex-wrap:wrap;gap:6px 14px}
@media (max-width:760px){.zaak,.uitgelicht{grid-template-columns:1fr}.knop{font-size:17px}section{padding:30px 0}}`;

function kop(lang, { titel, desc, canonical, alternates, beeld, ld }) {
  return `<!doctype html>
<html lang="${T[lang].hreflang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titel)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
${alternates}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(titel)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${beeld}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#2b2140">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<link rel="preload" href="/fonts/fredoka-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>
<body>`;
}
const altLinks = (pad) => LANGS.map((l) => `<link rel="alternate" hreflang="${T[l].hreflang}" href="${BASIS.slice(0, -1)}${pad(l)}">`).join('\n') +
  `\n<link rel="alternate" hreflang="x-default" href="${BASIS.slice(0, -1)}${pad('en')}">`;
const top = (lang, pad) => `<div class="wrap top">
<a class="merk" href="/${T[lang].pad}"><img src="/img/icoon-192.png" alt="" width="40" height="40">CLUEDOKU</a>
<label class="talen"><select aria-label="Language" onchange="location.href=this.value">${LANGS.map((l) => `<option value="${pad(l)}"${l === lang ? ' selected' : ''}>${esc(T[l].naam)}</option>`).join('')}</select></label>
</div>`;
const voet = (lang) => `<footer><div class="wrap">
<span>© Cluedoku · <a href="/${T[lang].pad}">Cluedoku</a> · <a href="/privacy.html">${esc(T[lang].privacy)}</a> · <a href="mailto:kvdhdevelopment@gmail.com">${esc(T[lang].contact)}</a></span>
<nav aria-label="Language">${LANGS.map((l) => `<a href="${overzicht(l)}" hreflang="${T[l].hreflang}">${esc(T[l].naam)}</a>`).join('')}</nav>
</div></footer>
</body>
</html>
`;
const app = (lang) => `<section class="app"><div class="wrap">
<h2>${esc(T[lang].appKop)}</h2>
<p>${esc(T[lang].appTekst)}</p>
<div class="knoppen"><a class="knop knop--rood" href="${esc(play(lang))}" rel="noopener">${PLAY_ICON}${esc(T[lang].play)}</a><a class="knop" href="/demo/">${esc(T[lang].demo)}</a></div>
</div></section>`;

function weekPagina(lang, w) {
  const t = T[lang];
  const d = w.data.talen[lang];
  const naam = vul(t.week, { n: w.week });
  const titel = `${naam}: ${d.titel} – Cluedoku`;
  const desc = vul(t.weekDesc, { titel: d.titel, niveau: d.niveau });
  const canonical = BASIS.slice(0, -1) + weekPad(lang, w.week);
  const vorige = weken.find((x) => x.week === w.week - 1);
  const volgende = weken.find((x) => x.week === w.week + 1);
  const ld = {
    '@context': 'https://schema.org', '@type': 'CreativeWork', name: `${naam}: ${d.titel}`, description: desc, url: canonical,
    inLanguage: t.hreflang, datePublished: datumVan(w.week), isAccessibleForFree: true, image: canonical + 'zaak.webp',
    genre: 'Logic puzzle', publisher: { '@type': 'Organization', name: 'Cluedoku', url: BASIS },
  };
  const oplossing = opgelost(w.week)
    ? `<details><summary>${esc(t.oplossingToon)}</summary>
<div class="zaak">
<div class="bord"><img src="oplossing.webp" alt="${esc(t.oplossing)}: ${esc(d.titel)}" loading="lazy"></div>
<div><p>${d.dader}</p><h3>${esc(t.stappen)}</h3><ol class="stappen">${d.stappen.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
<p><a class="knop" href="oplossing.pdf" download>${PRINT_ICON}${esc(t.oplossingPdf)}</a></p></div>
</div></details>`
    : `<p>${esc(vul(t.oplossingStraks, { datum: datum(lang, datumVan(w.week + 1)) }))}</p>`;
  return `${kop(lang, { titel, desc, canonical, alternates: altLinks((l) => weekPad(l, w.week)), beeld: canonical + 'zaak.webp', ld })}
<header class="held">
${top(lang, (l) => weekPad(l, w.week))}
<div class="wrap held-in">
<a class="kruim" href="${overzicht(lang)}">← ${esc(t.alle)}</a>
<h1>${esc(naam)}: ${esc(d.titel)}</h1>
<p class="meta">${esc(d.niveau)} · ${esc(vul(t.verschenen, { datum: datum(lang, datumVan(w.week)) }))}</p>
<div class="knoppen"><a class="knop knop--rood" href="zaak.pdf" download>${PRINT_ICON}${esc(t.printPdf)}</a><a class="knop" href="${esc(play(lang))}" rel="noopener">${PLAY_ICON}${esc(t.play)}</a></div>
</div>
</header>
<main>
<section><div class="wrap">
<p class="intro">${esc(d.intro)}</p>
<div class="zaak">
<div class="bord"><img src="zaak.webp" alt="${esc(naam)}: ${esc(d.titel)}" width="1000"></div>
<div><h2>${esc(t.aanwijzingen)}</h2><div class="aanw">${d.aanwijzingen.map((a) => `<p>${a}</p>`).join('')}</div>
<div class="regels"><h3>${esc(t.regelsKop)}</h3><p>${esc(d.regels)}</p></div></div>
</div>
</div></section>
<section class="oplossing"><div class="wrap">
<h2>${esc(t.oplossing)}</h2>
${oplossing}
</div></section>
${app(lang)}
<div class="wrap nav">
<span>${vorige ? `<a href="${weekPad(lang, vorige.week)}">← ${esc(t.vorige)}</a>` : ''}</span>
<a href="${overzicht(lang)}">${esc(t.alle)}</a>
<span>${volgende ? `<a href="${weekPad(lang, volgende.week)}">${esc(t.volgende)} →</a>` : ''}</span>
</div>
</main>
${voet(lang)}`;
}

function overzichtPagina(lang) {
  const t = T[lang];
  const canonical = BASIS.slice(0, -1) + overzicht(lang);
  const nieuw = weken[weken.length - 1];
  const dn = nieuw.data.talen[lang];
  const kaart = (w) => {
    const d = w.data.talen[lang];
    return `<li><a href="${weekPad(lang, w.week)}"><img src="${weekPad(lang, w.week)}klein.webp" alt="" loading="lazy" width="360"><strong>${esc(vul(t.week, { n: w.week }))}: ${esc(d.titel)}</strong><span>${esc(d.niveau)}</span><span>${esc(datum(lang, datumVan(w.week)))}</span></a></li>`;
  };
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: t.kop, description: t.overzichtDesc, url: canonical, inLanguage: t.hreflang };
  return `${kop(lang, { titel: t.overzichtTitel, desc: t.overzichtDesc, canonical, alternates: altLinks(overzicht), beeld: BASIS.slice(0, -1) + weekPad(lang, nieuw.week) + 'zaak.webp', ld })}
<header class="held">
${top(lang, overzicht)}
<div class="wrap held-in">
<h1>${esc(t.kop)}</h1>
<p class="lead">${esc(t.overzichtLead)}</p>
</div>
</header>
<main>
<section><div class="wrap">
<h2>${esc(t.nieuwste)}</h2>
<a class="uitgelicht" href="${weekPad(lang, nieuw.week)}"><img src="${weekPad(lang, nieuw.week)}zaak.webp" alt="" width="1000"><div><span>${esc(vul(t.week, { n: nieuw.week }))} · ${esc(datum(lang, datumVan(nieuw.week)))}</span><h3>${esc(dn.titel)}</h3><p>${esc(dn.niveau)}</p><p>${esc(dn.intro)}</p><span class="knop knop--rood">${PRINT_ICON}${esc(t.printPdf)}</span></div></a>
</div></section>
${weken.length > 1 ? `<section style="padding-top:0"><div class="wrap"><h2>${esc(t.eerder)}</h2><ul class="lijst">${weken.slice(0, -1).reverse().map(kaart).join('')}</ul></div></section>` : ''}
${app(lang)}
</main>
${voet(lang)}`;
}

// ---- write ----
let nieuweBestanden = 0;
const kopieer = (van, naar) => { if (!existsSync(naar) || readFileSync(van).compare(readFileSync(naar)) !== 0) { copyFileSync(van, naar); nieuweBestanden++; } };
for (const lang of LANGS) {
  for (const w of weken) {
    const dir = join(SITE, T[lang].pad, T[lang].slug, String(w.week));
    mkdirSync(dir, { recursive: true });
    const bron = join(HIER, 'weken', nnn(w.week), lang);
    for (const f of ['zaak.webp', 'klein.webp', 'zaak.pdf', ...(opgelost(w.week) ? ['oplossing.webp', 'oplossing.pdf'] : [])]) kopieer(join(bron, f), join(dir, f));
    writeFileSync(join(dir, 'index.html'), weekPagina(lang, w));
  }
  writeFileSync(join(SITE, T[lang].pad, T[lang].slug, 'index.html'), overzichtPagina(lang));
}

// sitemap: the weekly lines carry <!--w--> (scripts/website.mjs keeps them when it rewrites the sitemap)
const kaartPad = join(SITE, 'sitemap.xml');
const oud = readFileSync(kaartPad, 'utf8').split('\n').filter((r) => !r.includes('<!--w-->'));
const alt = (pad) => LANGS.map((a) => `<xhtml:link rel="alternate" hreflang="${T[a].hreflang}" href="${BASIS.slice(0, -1)}${pad(a)}"/>`).join('');
const regels = [
  ...LANGS.map((l) => `<url><loc>${BASIS.slice(0, -1)}${overzicht(l)}</loc><lastmod>${datumVan(Math.max(LAATSTE, Math.min(NU, LAATSTE + 1)))}</lastmod>${alt(overzicht)}</url><!--w-->`),
  ...weken.flatMap((w) => LANGS.map((l) => `<url><loc>${BASIS.slice(0, -1)}${weekPad(l, w.week)}</loc><lastmod>${datumVan(opgelost(w.week) ? w.week + 1 : w.week)}</lastmod>${alt((a) => weekPad(a, w.week))}</url><!--w-->`)),
];
const eind = oud.findIndex((r) => r.includes('</urlset>'));
oud.splice(eind, 0, ...regels);
writeFileSync(kaartPad, oud.join('\n'));
console.log(`${VANDAAG}: week ${weken.map((w) => w.week).join(', ')} online (oplossingen t/m week ${NU - 1}), ${nieuweBestanden} bestanden gekopieerd`);
