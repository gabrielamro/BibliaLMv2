import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const CATALOG_DIR = path.join(ROOT_DIR, 'docs', 'mockups', 'route-catalog');
const MANIFEST_PATH = path.join(CATALOG_DIR, 'manifest.json');
const OUTPUT_PATH = path.join(CATALOG_DIR, 'flow.html');

const SECTION_RULES = [
  { key: 'entry', title: 'Entrada e Onboarding', match: (r) => ['/', '/intro', '/intro-v2', '/login', '/landing/', '/apresentacao', '/complete-profile'].some((p) => r.route === p || r.route.startsWith(p)) },
  { key: 'home', title: 'Home e Continuidade', match: (r) => ['/', '/inicio03', '/mockinicio1', '/mocsantuario', '/navegar'].some((p) => r.route === p) },
  { key: 'study', title: 'Leitura e Estudos', match: (r) => ['/biblia', '/biblia-dashboard', '/estudos', '/estudo/', '/plano', '/plano/leitura', '/planos', '/devocional', '/quiz', '/rotina', '/trilhas', '/v/'].some((p) => r.route === p || r.route.startsWith(p)) },
  { key: 'create', title: 'Criação com IA', match: (r) => ['/chat', '/criar-', '/criador-', '/estudio-criativo', '/pulpito', '/workspace', '/faith-tech', '/fonte-conhecimento'].some((p) => r.route === p || r.route.startsWith(p)) },
  { key: 'community', title: 'Comunidade e Social', match: (r) => ['/social', '/igreja/', '/grupo/', '/oracoes', '/p/', '/s/'].some((p) => r.route === p || r.route.startsWith(p)) },
  { key: 'personal', title: 'Perfil e Sistema', match: (r) => ['/perfil', '/minha-conta', '/historico', '/notes', '/acervo', '/suporte', '/privacidade', '/termos', '/system-integrity', '/admin', '/aluno'].some((p) => r.route === p || r.route.startsWith(p)) },
];

function labelForRoute(route) {
  return route === '/' ? 'home' : route.replace(/^\//, '');
}

function friendlyTitle(route) {
  return route
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/\[|\]/g, '').replace(/-/g, ' '))
    .join(' · ') || 'home';
}

function groupRoutes(routes) {
  const grouped = new Map();
  for (const rule of SECTION_RULES) grouped.set(rule.key, []);
  grouped.set('other', []);

  for (const route of routes) {
    const rule = SECTION_RULES.find((candidate) => candidate.match(route));
    if (rule) grouped.get(rule.key).push(route);
    else grouped.get('other').push(route);
  }

  return grouped;
}

function buildCard(route) {
  const screenshot = path.basename(route.screenshotPath);
  const finalUrl = route.finalUrl?.replace('http://localhost:3010', '') || route.materializedRoute;
  return `
    <figure class="shot ${route.ok ? '' : 'fail'}">
      <a href="./${screenshot}" target="_blank" rel="noreferrer">
        <img src="./${screenshot}" alt="${route.materializedRoute}" loading="lazy" />
      </a>
      <figcaption>
        <strong>${route.materializedRoute}</strong>
        <span>${friendlyTitle(route.materializedRoute)}</span>
        <code>${finalUrl}</code>
      </figcaption>
    </figure>`;
}

function buildSection(title, routes) {
  const cards = routes.map(buildCard).join('\n');
  return `
    <section class="section">
      <div class="section-head">
        <h2>${title}</h2>
        <p>${routes.length} tela(s)</p>
      </div>
      <div class="track">
        ${cards}
      </div>
    </section>`;
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'));
  const grouped = groupRoutes(manifest.routes);

  const sections = SECTION_RULES
    .map((rule) => buildSection(rule.title, grouped.get(rule.key)))
    .filter(Boolean)
    .join('\n');

  const otherRoutes = grouped.get('other');
  const otherSection = otherRoutes.length
    ? buildSection('Outras Telas', otherRoutes)
    : '';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mapa de Fluxo - BibliaLM</title>
  <style>
    :root{
      --bg:#0b0b0d;
      --panel:#131318;
      --panel-2:#181822;
      --text:#f5f1ea;
      --muted:#a8a2b7;
      --gold:#d1a24c;
      --gold-2:#8d6b2e;
      --line:rgba(255,255,255,.08);
      --shadow:0 20px 60px rgba(0,0,0,.35);
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      font-family:Inter,Segoe UI,Arial,sans-serif;
      color:var(--text);
      background:
        radial-gradient(circle at top left, rgba(209,162,76,.16), transparent 28%),
        radial-gradient(circle at bottom right, rgba(81,79,180,.18), transparent 22%),
        var(--bg);
    }
    .wrap{width:min(1480px,94vw);margin:22px auto 56px}
    .hero{
      background:linear-gradient(135deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
      border:1px solid var(--line);
      border-radius:30px;
      padding:24px;
      box-shadow:var(--shadow);
      position:sticky;
      top:12px;
      backdrop-filter:blur(16px);
      z-index:10;
    }
    .hero h1{
      margin:0;
      font-size:clamp(1.6rem,2.5vw,3rem);
      letter-spacing:-.03em;
    }
    .hero p{margin:10px 0 0;color:var(--muted);max-width:980px;line-height:1.55}
    .pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
    .pill{
      border:1px solid rgba(255,255,255,.13);
      border-radius:999px;
      padding:7px 11px;
      font-size:11px;
      font-weight:800;
      letter-spacing:.08em;
      text-transform:uppercase;
      color:#fff;
      background:rgba(255,255,255,.05);
    }
    .timeline{
      margin-top:16px;
      display:grid;
      gap:12px;
    }
    .section{
      background:rgba(255,255,255,.04);
      border:1px solid var(--line);
      border-radius:24px;
      padding:18px;
      box-shadow:var(--shadow);
    }
    .section-head{
      display:flex;
      justify-content:space-between;
      gap:12px;
      align-items:end;
      margin-bottom:12px;
    }
    .section-head h2{margin:0;font-size:1.05rem}
    .section-head p{margin:0;color:var(--muted);font-size:.88rem}
    .track{
      display:grid;
      grid-template-columns:repeat(auto-fill,minmax(230px,1fr));
      gap:12px;
    }
    .shot{
      margin:0;
      background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
      border:1px solid rgba(255,255,255,.1);
      border-radius:20px;
      overflow:hidden;
      display:grid;
      min-height:100%;
    }
    .shot a{display:block;line-height:0}
    .shot img{
      width:100%;
      height:240px;
      object-fit:cover;
      background:#fff;
      display:block;
    }
    .shot figcaption{
      padding:12px;
      display:grid;
      gap:5px;
    }
    .shot strong{font-size:.92rem}
    .shot span,.shot code{font-size:.78rem;color:var(--muted)}
    .shot code{word-break:break-all}
    .shot.fail{outline:1px solid rgba(255,90,90,.3)}
    .legend{
      margin-top:14px;
      display:grid;
      gap:10px;
      grid-template-columns:repeat(4,1fr);
    }
    .legend .box{
      background:rgba(255,255,255,.05);
      border:1px solid var(--line);
      border-radius:16px;
      padding:12px;
    }
    .legend .box strong{display:block;margin-bottom:4px}
    .legend .box span{color:var(--muted);font-size:.88rem}
    @media (max-width:1024px){
      .legend{grid-template-columns:repeat(2,1fr)}
      .track{grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}
      .shot img{height:220px}
    }
    @media (max-width:720px){
      .legend{grid-template-columns:1fr}
      .section-head{flex-direction:column;align-items:start}
      .hero{position:static}
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="hero">
      <h1>Mapa de Fluxo visual do BibliaLM</h1>
      <p>69 screenshots reais organizadas por jornada. Abra este arquivo para percorrer o sistema por etapas, com as telas agrupadas na ordem mais natural de uso.</p>
      <div class="pills">
        <span class="pill">Entrada</span>
        <span class="pill">Leitura</span>
        <span class="pill">Criação</span>
        <span class="pill">Comunidade</span>
        <span class="pill">Perfil</span>
        <span class="pill">Admin</span>
      </div>
      <div class="legend">
        <div class="box"><strong>Como usar</strong><span>Clique em qualquer screenshot para abrir em tamanho real.</span></div>
        <div class="box"><strong>Leitura</strong><span>Mostra o caminho do visitante até o estudo e a leitura diária.</span></div>
        <div class="box"><strong>Criação</strong><span>Conecta o centro de IA, estudo, imagem e podcast.</span></div>
        <div class="box"><strong>Comunidade</strong><span>Organiza social, igreja, grupos e perfis públicos.</span></div>
      </div>
    </header>
    <main class="timeline">
      ${sections}
      ${otherSection}
    </main>
  </div>
</body>
</html>`;

  await fs.writeFile(OUTPUT_PATH, html, 'utf8');
  console.log(`Generated ${OUTPUT_PATH}`);
}

await main();
