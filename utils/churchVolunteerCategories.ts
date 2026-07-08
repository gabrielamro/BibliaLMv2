import type { ChurchFormSubmission } from '../types';

export type ChurchVolunteerCategoryKey =
  | 'worship_arts'
  | 'media_tech'
  | 'hospitality'
  | 'kids'
  | 'discipleship_care'
  | 'social_action'
  | 'infrastructure'
  | 'uncategorized';

export type ChurchVolunteerRole = {
  label: string;
  aliases: string[];
};

export type ChurchVolunteerCategory = {
  key: ChurchVolunteerCategoryKey;
  title: string;
  shortTitle: string;
  description: string;
  roles: ChurchVolunteerRole[];
};

export const CHURCH_VOLUNTEER_CATEGORIES: ChurchVolunteerCategory[] = [
  {
    key: 'worship_arts',
    title: 'Ministerio de Louvor e Adoracao',
    shortTitle: 'Louvor e Arte',
    description: 'Conduz a igreja em canticos e expressoes artisticas.',
    roles: [
      { label: 'Instrumentista', aliases: ['instrumentista', 'baterista', 'guitarrista', 'baixista', 'tecladista', 'violonista', 'musico'] },
      { label: 'Vocalista / Ministro de Louvor', aliases: ['vocalista', 'ministro de louvor', 'backing vocal', 'louvor'] },
      { label: 'Coralista', aliases: ['coralista', 'coral'] },
      { label: 'Sonoplasta / Operador de Audio', aliases: ['sonoplasta', 'operador de audio', 'operador de áudio', 'mesa de som', 'som'] },
      { label: 'Danca / Teatro', aliases: ['danca', 'dança', 'teatro', 'artes', 'expressao artistica', 'expressão artística'] },
    ],
  },
  {
    key: 'media_tech',
    title: 'Midia, Comunicacao e Tecnologia',
    shortTitle: 'Midia e Tech',
    description: 'Cuida de transmissao, projecao, redes sociais e suporte tecnologico.',
    roles: [
      { label: 'Operador de Projecao / Slide', aliases: ['projecao', 'projeção', 'slide', 'telao', 'telão', 'letras'] },
      { label: 'Operador de Corte de Camera', aliases: ['camera', 'câmera', 'corte', 'transmissao', 'transmissão', 'live'] },
      { label: 'Fotografo / Videomaker', aliases: ['fotografo', 'fotógrafo', 'videomaker', 'video', 'vídeo'] },
      { label: 'Designer Grafico / Social Media', aliases: ['designer', 'design', 'social media', 'redes sociais', 'comunicacao', 'comunicação'] },
      { label: 'Iluminador / Operador de Luz', aliases: ['iluminador', 'luz', 'iluminacao', 'iluminação'] },
      { label: 'Suporte de TI', aliases: ['ti', 'suporte de ti', 'wifi', 'wi-fi', 'computador', 'sistemas'] },
    ],
  },
  {
    key: 'hospitality',
    title: 'Hospitalidade e Recepcao',
    shortTitle: 'Hospitalidade',
    description: 'Recebe, orienta e acolhe pessoas desde a chegada.',
    roles: [
      { label: 'Recepcionista / Porteiro', aliases: ['recepcionista', 'porteiro', 'portaria', 'boas-vindas', 'boas vindas', 'recepcao', 'recepção'] },
      { label: 'Ushers / Diacono / Organizador de Assentos', aliases: ['usher', 'ushers', 'diacono', 'diácono', 'assento', 'oferta', 'organizador de assentos'] },
      { label: 'Estacionamento / Trafego', aliases: ['estacionamento', 'trafego', 'tráfego', 'carros', 'patio', 'pátio'] },
      { label: 'Balcao de Informacoes / Conexao', aliases: ['balcao', 'balcão', 'informacoes', 'informações', 'conexao', 'conexão', 'visitantes'] },
      { label: 'Cafeteria / Cantina', aliases: ['cafeteria', 'cantina', 'cafe', 'café', 'lanches', 'agua', 'água'] },
    ],
  },
  {
    key: 'kids',
    title: 'Ministerio Infantil',
    shortTitle: 'Kids',
    description: 'Cuida do ensino biblico e da seguranca das criancas.',
    roles: [
      { label: 'Bercarista / Baba', aliases: ['bercarista', 'berçarista', 'baba', 'babá', 'bebes', 'bebês'] },
      { label: 'Professor Infantil', aliases: ['professor infantil', 'ministerio infantil', 'ministério infantil', 'criancas', 'crianças', 'kids'] },
      { label: 'Monitor / Auxiliar Infantil', aliases: ['monitor infantil', 'auxiliar infantil', 'monitor', 'auxiliar'] },
      { label: 'Equipe de Check-in Infantil', aliases: ['check-in', 'checkin', 'cracha', 'crachá', 'entrada e saida', 'entrada e saída'] },
    ],
  },
  {
    key: 'discipleship_care',
    title: 'Discipulado, Cuidado e Integracao',
    shortTitle: 'Discipulado',
    description: 'Acompanha crescimento espiritual, cuidado e integracao.',
    roles: [
      { label: 'Lider de Pequeno Grupo / Celula / GC', aliases: ['celula', 'célula', 'pequeno grupo', 'gc', 'grupo'] },
      { label: 'Professor da EBD', aliases: ['ebd', 'escola biblica', 'escola bíblica', 'professor ebd', 'teologia'] },
      { label: 'Conselheiro / Intercessao', aliases: ['conselheiro', 'intercessao', 'intercessão', 'orar', 'oracao', 'oração', 'altar'] },
      { label: 'Consolidador', aliases: ['consolidador', 'consolidacao', 'consolidação', 'novo convertido', 'novos convertidos'] },
    ],
  },
  {
    key: 'social_action',
    title: 'Acao Social e Comunidade',
    shortTitle: 'Acao Social',
    description: 'Serve a comunidade e atende familias em necessidade.',
    roles: [
      { label: 'Assistente Social / Triagem', aliases: ['assistente social', 'triagem', 'familias', 'famílias'] },
      { label: 'Entrega de Cestas Basicas', aliases: ['cesta basica', 'cesta básica', 'alimentos', 'entrega'] },
      { label: 'Capelania Hospitalar / Prisional', aliases: ['capelania', 'hospitalar', 'prisional', 'hospital', 'presidio', 'presídio'] },
      { label: 'Profissional Voluntario', aliases: ['medico', 'médico', 'dentista', 'psicologo', 'psicólogo', 'advogado', 'atendimento gratuito'] },
    ],
  },
  {
    key: 'infrastructure',
    title: 'Infraestrutura, Logistica e Apoio',
    shortTitle: 'Infraestrutura',
    description: 'Mantem a estrutura fisica e operacional funcionando.',
    roles: [
      { label: 'Limpeza / Zeladoria', aliases: ['limpeza', 'zeladoria', 'zelador'] },
      { label: 'Manutencao / Reparos', aliases: ['manutencao', 'manutenção', 'reparos', 'eletricista', 'pintor', 'pedreiro'] },
      { label: 'Brigada / Primeiros Socorros', aliases: ['brigada', 'incendio', 'incêndio', 'primeiros socorros', 'emergencia', 'emergência', 'saude', 'saúde'] },
      { label: 'Cenografia / Decoracao', aliases: ['cenografia', 'decoracao', 'decoração', 'natal', 'conferencia', 'conferência'] },
    ],
  },
];

export const UNCATEGORIZED_VOLUNTEER_CATEGORY: ChurchVolunteerCategory = {
  key: 'uncategorized',
  title: 'Sem categoria definida',
  shortTitle: 'Sem categoria',
  description: 'Interesses que ainda precisam de triagem manual.',
  roles: [],
};

export const ALL_CHURCH_VOLUNTEER_CATEGORIES = [
  ...CHURCH_VOLUNTEER_CATEGORIES,
  UNCATEGORIZED_VOLUNTEER_CATEGORY,
];

export const CHURCH_VOLUNTEER_ROLE_OPTIONS = CHURCH_VOLUNTEER_CATEGORIES.flatMap((category) =>
  category.roles.map((role) => `${category.shortTitle} - ${role.label}`)
);

export function getVolunteerCategoryByKey(key: ChurchVolunteerCategoryKey): ChurchVolunteerCategory {
  return ALL_CHURCH_VOLUNTEER_CATEGORIES.find((category) => category.key === key) ?? UNCATEGORIZED_VOLUNTEER_CATEGORY;
}

export function inferVolunteerCategory(submission: Pick<ChurchFormSubmission, 'payload' | 'internalSummary' | 'publicFeedback' | 'nextAction'>): ChurchVolunteerCategory {
  const haystack = normalizeText([
    ...Object.entries(submission.payload ?? {}).flatMap(([key, value]) => [key, String(value ?? '')]),
    submission.internalSummary,
    submission.publicFeedback,
    submission.nextAction,
  ].join(' '));

  for (const category of CHURCH_VOLUNTEER_CATEGORIES) {
    const matchesCategory = normalizeText(`${category.title} ${category.shortTitle}`).split(' ').some((word) => word.length > 3 && haystack.includes(word));
    const matchesRole = category.roles.some((role) => role.aliases.some((alias) => hasNormalizedTerm(haystack, alias)));
    if (matchesCategory || matchesRole) return category;
  }

  return UNCATEGORIZED_VOLUNTEER_CATEGORY;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasNormalizedTerm(haystack: string, term: string) {
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm) return false;
  return ` ${haystack} `.includes(` ${normalizedTerm} `);
}
