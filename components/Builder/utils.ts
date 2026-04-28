import { Block, BlockType } from './types';
import { defaultBlockData } from './constants';

export const buildStudyGuideHtml = (sections?: Partial<Record<'introduction' | 'context' | 'application' | 'prayer' | 'conclusion', string>>) => `
<div class="bible-study-premium">
  <p class="text-bible-gold font-bold uppercase tracking-[0.2em] text-xs mb-8 flex items-center gap-2">
    <span class="w-8 h-[1px] bg-bible-gold/30"></span> Guia de Estudo Profundo
  </p>
  
  <h2 class="text-4xl md:text-5xl font-serif font-black text-bible-ink dark:text-white mb-8 leading-tight tracking-tighter">
    1. Introdução — <span class="text-bible-gold italic">O Coração da Mensagem</span>
  </h2>
  <div class="text-lg md:text-xl leading-relaxed text-gray-600 dark:text-gray-300 mb-12 first-letter:text-5xl first-letter:font-bold first-letter:text-bible-gold first-letter:mr-3 first-letter:float-left">
    ${sections?.introduction || 'Comece com uma abertura poderosa e envolvente. Apresente o tema central e por que essa mensagem é um divisor de águas para quem busca sabedoria hoje.'}
  </div>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-bible-ink dark:text-white mb-6 border-l-4 border-bible-gold pl-6">
    2. Contextualização Histórica
  </h2>
  <div class="prose prose-lg dark:prose-invert mb-12">
    ${sections?.context || 'Mergulhe nas raízes do texto. Explique o pano de fundo histórico, o ambiente cultural e as nuances teológicas que dão profundidade real à Palavra.'}
  </div>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-bible-ink dark:text-white mb-6">
    3. Aplicação na Vida Real
  </h2>
  <div class="bg-gray-50 dark:bg-white/5 p-8 rounded-3xl mb-12 border border-gray-100 dark:border-white/5">
    ${sections?.application || 'Traga a verdade para o agora. Liste passos práticos, desafios de mudança de mente e como viver essa revelação nos desafios do cotidiano.'}
  </div>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-bible-ink dark:text-white mb-6 text-emerald-600 dark:text-emerald-400">
    4. Oração Pastoral
  </h2>
  <div class="italic text-xl font-serif text-gray-500 dark:text-gray-400 mb-12 border-l-2 border-emerald-500/30 pl-8 py-2">
    ${sections?.prayer || 'Uma oração que conecta o estudo ao trono da graça, feita com reverência e expectativa espiritual.'}
  </div>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-bible-ink dark:text-white mb-8 text-center italic">
    5. Conclusão Transformadora
  </h2>
  <div class="text-center max-w-2xl mx-auto font-medium text-gray-500">
    ${sections?.conclusion || 'Feche com uma síntese que ecoe na alma, reforçando o chamado à decisão e a esperança que a Palavra comunica.'}
  </div>
</div>
`.trim();

export const buildWrittenContentHtml = (sections?: Partial<Record<'introduction' | 'context' | 'application' | 'prayer' | 'conclusion', string>>) => `
<div class="bible-written-premium">
  <div class="mb-16 text-center">
    <span class="inline-block px-4 py-1 bg-bible-gold/10 text-bible-gold rounded-full text-[10px] font-black uppercase tracking-widest mb-4">Relatório Teológico Alpha</span>
    <h1 class="text-5xl md:text-6xl font-serif font-black text-bible-ink dark:text-white tracking-tighter mb-4">A Revelação <span class="text-bible-gold">Plena</span></h1>
    <div class="w-24 h-1 bg-bible-gold mx-auto rounded-full"></div>
  </div>

  <h2 class="text-3xl font-serif font-bold text-bible-ink dark:text-white mb-6">1. O Despertar</h2>
  <div class="prose prose-xl dark:prose-invert mb-16">
    ${sections?.introduction || '<p>Apresente o tema com autoridade. Situe o leitor na jornada que ele está prestes a trilhar e ancore a mensagem na urgência espiritual do momento.</p>'}
  </div>

  <h2 class="text-3xl font-serif font-bold text-bible-ink dark:text-white mb-6">2. As Raízes da Verdade</h2>
  <div class="prose prose-xl dark:prose-invert mb-16">
    ${sections?.context || '<p>Explore o "porquê" por trás dos versículos. Traga à luz os significados ocultos pelo tempo e as conexões entre o Antigo e o Novo Testamento.</p>'}
  </div>

  <h2 class="text-3xl font-serif font-bold text-bible-ink dark:text-white mb-6">3. O Caminho Prático</h2>
  <div class="prose prose-xl dark:prose-invert mb-16 px-8 border-l-8 border-bible-gold/20">
    ${sections?.application || '<p>Como essa verdade altera sua rotina amanhã às 8h? Seja incisivo, prático e pastoral ao traduzir o céu para a terra.</p>'}
  </div>

  <div class="my-20 p-12 bg-bible-ink text-white rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
     <h2 class="text-4xl font-serif italic mb-6 text-bible-gold">4. Clamor e Resposta</h2>
     <div class="text-2xl font-serif italic text-white/90 leading-relaxed max-w-3xl mx-auto">
       ${sections?.prayer || 'Uma oração de entrega e alinhamento com a vontade do Criador.'}
     </div>
  </div>

  <h2 class="text-3xl font-serif font-bold text-bible-ink dark:text-white mb-8 text-right italic leading-none">5. O Chamado Final</h2>
  <div class="text-right text-lg text-gray-500 dark:text-gray-400 mb-16">
    ${sections?.conclusion || 'Um ponto final que é, na verdade, um novo começo. O que o leitor deve levar consigo para o resto da vida?'}
  </div>
</div>
`.trim();

export const createBlock = (type: BlockType): Block => {
  const defaultData = defaultBlockData[type] || { padding: 4 };
  return {
    id: Math.random().toString(36).substr(2, 9),
    type,
    data: JSON.parse(JSON.stringify(defaultData))
  };
};

export const buildBaseBlocks = (types: (BlockType | { type: BlockType; layoutWidth?: Block['layoutWidth'] })[]): Block[] => {
  return types.map(item => {
    const type = typeof item === 'string' ? item : item.type;
    const layoutWidth = typeof item === 'string' ? undefined : item.layoutWidth;
    const block = createBlock(type);
    if (layoutWidth) {
      block.layoutWidth = layoutWidth;
    }
    return block;
  });
};

export const aiBuildLayoutWidths: Record<string, NonNullable<Block['layoutWidth']>> = {
  'hero-split': '1/1',
  biblical: '1/2',
  'study-outline': '1/3',
  'rich-text': '1/1',
  slide: '1/1',
  'related-verses': '1/1',
  authority: '1/1',
  footer: '1/1',
  'reflection-question': '1/1',
};

export const aiBuildLayoutSequence: NonNullable<Block['layoutWidth']>[] = [
  '1/1',
  '1/2',
  '1/3',
  '1/1',
  '1/1',
  '1/1',
  '1/1',
  '1/1',
  '1/1',
];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const hasHtmlTags = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

const isLikelyHeadingText = (value: string) => {
  const text = stripHtml(value);
  if (!text || text.length > 90) return false;
  if (/[.!?;:]$/.test(text)) return false;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 12) return false;

  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const headingSignals = [
    'introducao',
    'contexto',
    'profundeza',
    'autoridade',
    'poder',
    'aplicacao',
    'transformacao',
    'conclusao',
    'reflexao',
    'chamado',
    'amor de deus',
  ];

  if (headingSignals.some((signal) => normalized.includes(signal))) return true;

  const startsLikeTitle = /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ0-9]/.test(text);
  return startsLikeTitle && words.length <= 8;
};

const normalizePlainTextRichContent = (content: string, fallbackTitle: string) => {
  const lines = content
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return `<h2>${escapeHtml(fallbackTitle)}</h2>\n<p>Desenvolva aqui o paragrafo principal do estudo.</p>`;
  }

  return lines
    .map((line, index) => {
      if (index === 0 || isLikelyHeadingText(line)) {
        return `<h2>${escapeHtml(stripHtml(line))}</h2>`;
      }
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join('\n');
};

const normalizeHtmlRichHeadings = (content: string, fallbackTitle: string) => {
  let normalized = content.replace(/<h1\b/gi, '<h2').replace(/<\/h1>/gi, '</h2>');

  normalized = normalized.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (match, _attrs, inner) => {
    if (!isLikelyHeadingText(inner)) return match;
    return `<h2>${stripHtml(inner)}</h2>`;
  });

  if (!/<h2[\s>]/i.test(normalized)) {
    normalized = `<h2>${escapeHtml(fallbackTitle)}</h2>\n${normalized}`;
  }

  return normalized;
};

export const ensureRichTextH2Title = (data: any = {}) => {
  const content = typeof data.content === 'string' ? data.content.trim() : '';
  const title = data.title || data.heading || 'Desenvolvimento da Mensagem';
  const body = content || data.body || data.text || '<p>Desenvolva aqui o paragrafo principal do estudo.</p>';

  return {
    ...data,
    content: hasHtmlTags(body)
      ? normalizeHtmlRichHeadings(body, title)
      : normalizePlainTextRichContent(body, title),
  };
};

export const normalizeAIBuildBlock = (block: any, index: number): Block => {
  const type = block.type as BlockType;
  const data = type === 'rich-text' ? ensureRichTextH2Title(block.data || {}) : block.data;

  return {
    id: block.id || `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    layoutWidth: aiBuildLayoutSequence[index] || aiBuildLayoutWidths[type] || block.layoutWidth || '1/1',
    data,
  };
};

const getAIBuildBlockData = (block: any) => block?.data || block || {};

export const normalizeAIBuildBlocks = (rawBlocks: any): Block[] => {
  if (Array.isArray(rawBlocks)) {
    return rawBlocks
      .filter((block) => block?.type)
      .map((block, index) => normalizeAIBuildBlock(block, index));
  }

  if (!rawBlocks || typeof rawBlocks !== 'object') return [];

  const orderedBlocks = [
    {
      type: 'hero-split',
      source: rawBlocks['hero-split'] || rawBlocks.heroSplit || rawBlocks.hero,
    },
    {
      type: 'biblical',
      source: rawBlocks.biblical,
    },
    {
      type: 'study-outline',
      source: rawBlocks['study-outline'] || rawBlocks.studyOutline || rawBlocks.outline,
    },
    {
      type: 'rich-text',
      source: rawBlocks['rich-text'] || rawBlocks.richText || rawBlocks.studyContent || rawBlocks['study-content'],
    },
    {
      type: 'slide',
      source: rawBlocks.slide,
    },
    {
      type: 'related-verses',
      source: rawBlocks['related-verses'] || rawBlocks.relatedVerses,
    },
    {
      type: 'authority',
      source: rawBlocks.authority,
    },
    {
      type: 'footer',
      source: rawBlocks.footer,
    },
    {
      type: 'reflection-question',
      source: rawBlocks['reflection-question'] || rawBlocks.reflectionQuestion || rawBlocks.reflection,
    },
  ];

  return orderedBlocks
    .filter((item) => item.source)
    .map((item, index) =>
      normalizeAIBuildBlock(
        {
          id: item.source.id,
          type: item.source.type || item.type,
          layoutWidth: item.source.layoutWidth,
          data: getAIBuildBlockData(item.source),
        },
        index
      )
    );
};

export const ESTUDO_PASTORAL_LAYOUT = [
  { type: 'hero' as const, layoutWidth: '1/1' as const },
  { type: 'biblical' as const, layoutWidth: '1/1' as const },
  { type: 'rich-text' as const, layoutWidth: '1/1' as const },
  { type: 'reflection-question' as const, layoutWidth: '1/1' as const },
  { type: 'cta' as const, layoutWidth: '1/1' as const },
  { type: 'footer' as const, layoutWidth: '1/1' as const },
];

export const buildEstudoPastoralBlocks = (): Block[] => {
  return ESTUDO_PASTORAL_LAYOUT.map((item) => {
    const block = createBlock(item.type);
    block.layoutWidth = item.layoutWidth;
    block.data = { ...block.data, layoutWidth: item.layoutWidth };
    
    if (block.type === 'hero') {
      block.data = { ...block.data, 
        title: "Salmo 91: O Abrigo do Altíssimo",
        subtitle: "Uma promessa de proteção divina para quem busca refúgio em Deus",
        ctaText: "Começar Estudo"
      };
    }
    if (block.type === 'biblical') {
      block.data = { ...block.data,
        verse: "Salmo 91:1-2",
        text: "Aquele que habita no abrigo do Altíssimo, sob a sombra do Onipotente descansará. Direi do SENHOR: Ele é o meu Deus, o meu refúgio, o meu alto refúgio, o meu Deus, em quem confio.",
        reference: "Salmo 91:1-2",
        enableHyperlink: true
      };
    }
    if (block.type === 'reflection-question') {
      block.data = { ...block.data,
        question: "Você tem buscado refúgio em Deus ou em outras fontes de proteção?",
        support: "Reflita sobre as áreas da sua vida onde você precisa confiar mais na proteção divina."
      };
    }
    if (block.type === 'cta') {
      block.data = { ...block.data,
        headline: "Continue aprofundando",
        subheadline: "Explore mais estudos do Saltério ou crie seu próprio estudo",
        primaryText: "Ver mais estudos",
        secondaryText: "Criar meu estudo"
      };
    }
    
    return block;
  });
};
