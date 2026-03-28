import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const CATALOG_DIR = path.join(ROOT_DIR, 'docs', 'mockups', 'route-catalog');
const MANIFEST_PATH = path.join(CATALOG_DIR, 'manifest.json');
const OUTPUT_PATH = path.join(CATALOG_DIR, 'visual-map.html');

const CATEGORIES = [
  {
    key: 'used',
    title: 'Usada',
    description: 'Telas que hoje entregam UI propria e aparecem no fluxo principal.',
    match: (route) => [
      '/intro',
      '/intro-v2',
      '/navegar',
      '/social',
      '/planos',
      '/aluno',
      '/biblia',
      '/chat',
      '/devocional',
      '/oracoes',
      '/suporte',
      '/privacidade',
      '/termos',
      '/regras',
      '/artes-sacras',
      '/criar-conteudo',
      '/criar-arte-sacra',
      '/criar-podcast',
      '/faith-tech',
      '/fonte-conhecimento',
    ].includes(route),
    tone: 'gold',
  },
  {
    key: 'redirect',
    title: 'Redireciona',
    description: 'Rotas que hoje caem em outra tela por redirect direto ou protecao.',
    match: (route) => [
      '/',
      '/estudio-criativo',
      '/trilhas',
      '/admin',
      '/apresentacao',
      '/biblia-dashboard',
      '/complete-profile',
      '/criador-jornada',
      '/criar-estudo',
      '/estudos',
      '/estudos/livro/[bookId]',
      '/estudos/planos',
      '/grupo/[cellSlug]',
      '/historico',
      '/login',
      '/minha-conta',
      '/notes',
      '/oracoes/gerenciar',
      '/perfil',
      '/plano',
      '/plano/leitura',
      '/pulpito',
      '/pulpito/editor',
      '/rotina',
      '/s/[token]',
      '/social/church',
      '/social/profile',
      '/social/u/[username]',
      '/system-integrity',
      '/workspace',
      '/workspace-pastoral',
    ].includes(route),
    tone: 'violet',
  },
  {
    key: 'mock',
    title: 'Mock / Demo',
    description: 'Telas de validacao, iframe, demo ou conteudo de exemplo.',
    match: (route) => [
      '/mockinicio1',
      '/mocsantuario',
      '/landing/[slug]',
      '/jornada/[planId]',
      '/p/[postId]',
      '/v/[studyId]',
    ].includes(route),
    tone: 'blue',
  },
  {
    key: 'unused',
    title: 'Nao usada no fluxo principal',
    description: 'Rotas reais, mas sem entrada clara na navegacao principal atual.',
    match: (route) => [
      '/biblia-dashboard',
      '/criar-estudo',
      '/estudos/livro/[bookId]',
      '/grupo/[cellSlug]',
      '/minha-conta',
      '/social/igreja/[churchSlug]',
    ].includes(route),
    tone: 'rose',
  },
];

function titleForRoute(route) {
  return route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, ' · ').replace(/\[(.*?)\]/g, '$1');
}

function sectionId(key) {
  return key.replace(/[^a-z]/g, '');
}

function card(route) {
  const file = path.basename(route.screenshotPath);
  const finalUrl = route.finalUrl.replace('http://localhost:3010', '') || route.materializedRoute;
  return `
    <a class="card" href="./${file}" target="_blank" rel="noreferrer">
      <img src="./${file}" alt="${route.materializedRoute}" loading="lazy" />
      <div class="meta">
        <span class="route">${route.materializedRoute}</span>
        <strong>${titleForRoute(route.materializedRoute)}</strong>
        <span class="url">${finalUrl}</span>
      </div>
    </a>`;
}

function buildSection(category, routes) {
  return `
    <section class="section section-${category.tone}">
      <div class="section-head">
        <div>
          <h2>${category.title}</h2>
          <p>${category.description}</p>
        </div>
        <div class="count">${routes.length}</div>
      </div>
      <div class="grid">
        ${routes.map(card).join('\n')}
      </div>
    </section>`;
}

function mainPath(manifest) {
  const wanted = ['/', '/intro', '/navegar', '/biblia', '/estudio/modulo/[moduleId]', '/social', '/perfil'];
  const ordered = [];
  for (const pattern of wanted) {
    const exact = manifest.routes.find((r) => r.route === pattern || r.materializedRoute === pattern.replace('[moduleId]', 'modulo-1'));
    if (exact) ordered.push(exact);
  }
  return ordered;
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'));

  const grouped = new Map(CATEGORIES.map((c) => [c.key, []]));
  for (const route of manifest.routes) {
    const category = CATEGORIES.find((c) => c.match(route.route) || c.match(route.materializedRoute));
    if (category) grouped.get(category.key).push(route);
  }

  const summary = CATEGORIES.map((c) => {
    const count = grouped.get(c.key).length;
    return `<div class="summary summary-${c.tone}"><span>${c.title}</span><strong>${count}</strong></div>`;
  }).join('');

  const pathCards = mainPath(manifest).map((route, index) => `
    <div class="spine-node">
      <div class="spine-index">${index + 1}</div>
      <a href="./${path.basename(route.screenshotPath)}" target="_blank" rel="noreferrer">
        <img src="./${path.basename(route.screenshotPath)}" alt="${route.materializedRoute}" />
      </a>
      <span>${route.materializedRoute}</span>
    </div>`).join('<div class="spine-arrow">→</div>');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mapa Visual - BibliaLM</title>
  <style>
    :root{
      --bg:#07070a;
      --panel:#111118;
      --panel2:#161622;
      --text:#f6f2eb;
      --muted:#a39db1;
      --line:rgba(255,255,255,.08);
      --gold:#d5a44c;
      --gold2:#8a6420;
      --violet:#7d58ff;
      --violet2:#4e39a6;
      --blue:#3a7dff;
      --blue2:#2446a3;
      --rose:#ff6b8b;
      --rose2:#9a3651;
      --shadow:0 18px 55px rgba(0,0,0,.35);
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      font-family:Inter,Segoe UI,Arial,sans-serif;
      background:
        radial-gradient(circle at 0% 0%, rgba(213,164,76,.14), transparent 24%),
        radial-gradient(circle at 100% 0%, rgba(125,88,255,.12), transparent 26%),
        radial-gradient(circle at 50% 100%, rgba(58,125,255,.10), transparent 26%),
        var(--bg);
      color:var(--text);
    }
    .wrap{width:min(1500px,94vw);margin:22px auto 54px}
    .hero{
      background:linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
      border:1px solid var(--line);
      border-radius:30px;
      padding:24px;
      box-shadow:var(--shadow);
      position:sticky;
      top:10px;
      backdrop-filter:blur(18px);
      z-index:10;
    }
    .hero-top{
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:14px;
      flex-wrap:wrap;
    }
    .hero h1{
      margin:0;
      font-size:clamp(1.7rem,3vw,3.25rem);
      letter-spacing:-.04em;
      line-height:1.05;
    }
    .hero p{
      margin:10px 0 0;
      max-width:920px;
      color:var(--muted);
      line-height:1.55;
    }
    .badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
    .badge{
      border:1px solid rgba(255,255,255,.12);
      background:rgba(255,255,255,.06);
      color:#fff;
      border-radius:999px;
      padding:7px 11px;
      font-size:11px;
      font-weight:800;
      letter-spacing:.08em;
      text-transform:uppercase;
    }
    .summary-grid{
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:10px;
      margin-top:16px;
    }
    .summary{
      border-radius:18px;
      border:1px solid var(--line);
      padding:12px 14px;
      background:rgba(255,255,255,.05);
    }
    .summary span{display:block;color:var(--muted);font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    .summary strong{display:block;font-size:1.5rem;margin-top:4px}
    .summary-gold{box-shadow:inset 0 0 0 1px rgba(213,164,76,.18)}
    .summary-violet{box-shadow:inset 0 0 0 1px rgba(125,88,255,.18)}
    .summary-blue{box-shadow:inset 0 0 0 1px rgba(58,125,255,.18)}
    .summary-rose{box-shadow:inset 0 0 0 1px rgba(255,107,139,.18)}

    .spine{
      margin-top:14px;
      background:rgba(255,255,255,.04);
      border:1px solid var(--line);
      border-radius:24px;
      padding:18px;
      box-shadow:var(--shadow);
    }
    .spine h2{margin:0 0 8px}
    .spine-row{
      display:grid;
      grid-template-columns:repeat(7, minmax(0,1fr));
      gap:10px;
      align-items:center;
      margin-top:12px;
    }
    .spine-node{
      background:rgba(255,255,255,.05);
      border:1px solid rgba(255,255,255,.08);
      border-radius:18px;
      padding:10px;
      text-align:center;
      display:grid;
      gap:8px;
      min-height:100%;
    }
    .spine-index{
      width:26px;height:26px;border-radius:999px;margin:0 auto;
      background:linear-gradient(135deg,var(--gold),var(--gold2));
      color:#1a140a;font-weight:900;font-size:12px;display:grid;place-items:center;
    }
    .spine-node img{
      width:100%;height:118px;object-fit:cover;border-radius:12px;border:1px solid rgba(255,255,255,.08)
    }
    .spine-node span{font-size:11px;color:var(--muted);font-weight:700}
    .spine-arrow{
      text-align:center;
      font-size:24px;
      color:rgba(255,255,255,.32);
      font-weight:900;
    }

    .section{
      margin-top:16px;
      border-radius:26px;
      border:1px solid var(--line);
      background:rgba(255,255,255,.04);
      box-shadow:var(--shadow);
      overflow:hidden;
    }
    .section-head{
      display:flex;
      justify-content:space-between;
      gap:12px;
      align-items:flex-start;
      padding:18px 18px 0;
    }
    .section-head h2{margin:0;font-size:1.12rem}
    .section-head p{margin:6px 0 0;color:var(--muted);max-width:780px;line-height:1.45}
    .count{
      width:44px;height:44px;border-radius:14px;display:grid;place-items:center;font-weight:900;font-size:1rem;
      background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);
    }
    .grid{
      padding:18px;
      display:grid;
      grid-template-columns:repeat(auto-fill,minmax(230px,1fr));
      gap:12px;
    }
    .card{
      text-decoration:none;color:inherit;
      border-radius:20px;
      overflow:hidden;
      background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
      border:1px solid rgba(255,255,255,.08);
      display:grid;
      min-height:100%;
      transition:transform .18s ease, border-color .18s ease;
    }
    .card:hover{transform:translateY(-3px);border-color:rgba(255,255,255,.2)}
    .card img{width:100%;height:220px;object-fit:cover;background:#fff;display:block}
    .meta{padding:12px;display:grid;gap:4px}
    .meta .route{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
    .meta strong{font-size:.95rem}
    .meta .url{font-size:12px;color:var(--muted);word-break:break-all}

    .section-gold .count{background:rgba(213,164,76,.16)}
    .section-violet .count{background:rgba(125,88,255,.16)}
    .section-blue .count{background:rgba(58,125,255,.16)}
    .section-rose .count{background:rgba(255,107,139,.16)}

    @media (max-width:1100px){
      .summary-grid{grid-template-columns:repeat(2,1fr)}
      .spine-row{grid-template-columns:1fr 40px 1fr 40px 1fr 40px 1fr}
    }
    @media (max-width:760px){
      .summary-grid{grid-template-columns:1fr}
      .spine-row{grid-template-columns:1fr}
      .spine-arrow{display:none}
      .hero{position:static}
      .section-head{flex-direction:column}
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="hero">
      <div class="hero-top">
        <div>
          <h1>Mapa visual do BibliaLM</h1>
          <p>As 69 screenshots foram organizadas em uma leitura visual por categoria: telas usadas no fluxo principal, rotas que redirecionam, mocks/demos e páginas que hoje não aparecem como entrada clara do fluxo.</p>
          <div class="badges">
            <span class="badge">Usada</span>
            <span class="badge">Redireciona</span>
            <span class="badge">Mock / Demo</span>
            <span class="badge">Nao usada</span>
          </div>
        </div>
      </div>
      <div class="summary-grid">${summary}</div>
    </header>

    <section class="spine">
      <h2>Fluxo central</h2>
      <p style="margin:0;color:var(--muted);line-height:1.5">Uma linha de leitura para mostrar a navegacao principal: entrada, continuidade, leitura, social e perfil.</p>
      <div class="spine-row">
        ${pathCards}
      </div>
    </section>

    ${CATEGORIES.map((category) => buildSection(category, grouped.get(category.key))).join('\n')}
  </div>
</body>
</html>`;

  await fs.writeFile(OUTPUT_PATH, html, 'utf8');
  console.log(`Generated ${OUTPUT_PATH}`);
}

await main();
