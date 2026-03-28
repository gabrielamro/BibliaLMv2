import path from 'node:path';

const AUTH_PREFIXES = [
  '/acervo',
  '/admin',
  '/aluno',
  '/biblia',
  '/biblia-dashboard',
  '/chat',
  '/complete-profile',
  '/criador-jornada',
  '/criar-arte-sacra',
  '/criar-conteudo',
  '/criar-estudo',
  '/criar-podcast',
  '/devocional',
  '/estudio-criativo',
  '/historico',
  '/minha-conta',
  '/notes',
  '/oracoes',
  '/perfil',
  '/plano',
  '/pulpito',
  '/quiz',
  '/rotina',
  '/workspace',
  '/workspace-pastoral',
];

export function appFilePathToRoute(filePath) {
  const normalized = filePath.replaceAll('\\', '/');
  const relative = normalized.startsWith('app/')
    ? normalized.slice('app/'.length)
    : normalized;

  if (relative === 'page.tsx') {
    return '/';
  }

  const withoutPage = relative.replace(/\/page\.tsx$/, '');
  return `/${withoutPage}`;
}

export function classifyRoute(route) {
  const isDynamic = route.includes('[') && route.includes(']');
  const isRootProfile = /^\/*\[[^\]]+\]$/.test(route);
  const requiresAuth = AUTH_PREFIXES.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));

  return {
    isDynamic,
    isRootProfile,
    requiresAuth,
  };
}

export function materializeRoute(route, fallbackParams = {}) {
  return route.replace(/\[([^\]]+)\]/g, (_, key) => {
    return fallbackParams[key] ?? `sample-${key}`;
  });
}

export function discoverAppRoutes(filePaths) {
  return [...filePaths]
    .map((filePath) => {
      const route = appFilePathToRoute(filePath);
      return {
        filePath,
        route,
        ...classifyRoute(route),
      };
    })
    .sort((left, right) => left.route.localeCompare(right.route));
}

export function slugifyRoute(route) {
  if (route === '/') {
    return 'home';
  }

  return route
    .replace(/^\//, '')
    .replaceAll('/', '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
}

export function screenshotOutputPath(baseDir, route) {
  return path.join(baseDir, `${slugifyRoute(route)}.png`);
}

export function buildCaptureEntries(routes, fallbackParams, outputDir) {
  return routes.map((entry) => {
    const materializedRoute = materializeRoute(entry.route, fallbackParams);
    return {
      ...entry,
      materializedRoute,
      screenshotPath: screenshotOutputPath(outputDir, materializedRoute),
    };
  });
}
