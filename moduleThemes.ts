export type AppModuleId =
  | 'home'
  | 'bible'
  | 'kingdom'
  | 'cultos'
  | 'create'
  | 'management'
  | 'pastoral'
  | 'neutral';

export const APP_MODULES: Record<AppModuleId, { label: string; description: string }> = {
  home: { label: 'Início', description: 'Visão pessoal e direção da jornada' },
  bible: { label: 'Bíblia', description: 'Leitura, estudo, oração e formação bíblica' },
  kingdom: { label: 'Reino', description: 'Comunidade, feed e descoberta' },
  cultos: { label: 'Cultos', description: 'Agenda, participação, escala e memória de cultos' },
  create: { label: 'Criar', description: 'Ferramentas autorais e criação assistida' },
  management: { label: 'Gestão da Igreja', description: 'Operação, pessoas, equipes e indicadores' },
  pastoral: { label: 'Workspace Pastoral', description: 'Ensino, cuidado e conteúdo pastoral' },
  neutral: { label: 'Culto+', description: 'Conta, suporte e superfícies globais' },
};

export const APP_MODULE_ROUTE_RULES: ReadonlyArray<{
  module: AppModuleId;
  exact?: readonly string[];
  prefixes?: readonly string[];
}> = [
  { module: 'management', prefixes: ['/gestao-igreja', '/novidades-gestao-igreja'] },
  { module: 'pastoral', exact: ['/acervo', '/criar-sala', '/oracoes/gerenciar', '/workspace'], prefixes: ['/workspace-pastoral'] },
  { module: 'create', exact: ['/chat', '/estudio-criativo'], prefixes: ['/criar-conteudo', '/criar-arte-sacra', '/criar-podcast', '/criar-estudo'] },
  { module: 'bible', exact: ['/trilhas', '/diario-espiritual', '/bibliasagrada', '/biblia', '/biblia-dashboard', '/devocional', '/oracoes', '/quiz', '/notes'], prefixes: ['/plano', '/estudos', '/estudo', '/jornada', '/v/'] },
  { module: 'kingdom', exact: ['/social'], prefixes: ['/social/', '/p/', '/u/', '/igreja/', '/grupo/'] },
  { module: 'cultos', exact: ['/culto', '/meus-cultos'], prefixes: ['/culto/', '/meus-cultos/'] },
  { module: 'home', exact: ['/', '/newhome', '/rotina', '/mapa-vivo'] },
];

const HOME_TAB_MODULES: Record<string, AppModuleId> = {
  inicio: 'home',
  criar: 'create',
  reino: 'kingdom',
  gestao: 'management',
  calendario: 'cultos',
};

const normalizePathname = (pathname: string) => {
  const withoutQuery = pathname.split(/[?#]/)[0] || '/';
  if (withoutQuery === '/') return withoutQuery;
  return withoutQuery.replace(/\/+$/, '');
};

export const getAppModuleForRoute = (pathname: string, search = ''): AppModuleId => {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === '/newhome') {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    return HOME_TAB_MODULES[params.get('tab') || 'inicio'] ?? 'home';
  }

  for (const rule of APP_MODULE_ROUTE_RULES) {
    if (rule.exact?.includes(normalizedPathname)) return rule.module;
    if (rule.prefixes?.some((prefix) => normalizedPathname.startsWith(prefix))) return rule.module;
  }

  return 'neutral';
};

export const getNewHomeTabModule = (tab: string): AppModuleId => HOME_TAB_MODULES[tab] ?? 'home';
