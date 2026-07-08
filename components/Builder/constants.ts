import { BlockType } from './types';

export const blockLabels: Record<BlockType, { label: string; description: string; color: string }> = {
  'free-text': {
    label: 'Editor de Texto',
    description: 'Bloco em branco para edição livre de conteúdo',
    color: 'bg-bible-gold text-white'
  },
  hero: {
    label: 'Capa Impactante',
    description: 'Título, subtítulo e CTA com fundo visual',
    color: 'bg-blue-500 text-white'
  },
  authority: {
    label: 'Perfil do Autor',
    description: 'Foto, nome e biografia curta',
    color: 'bg-purple-500 text-white'
  },
  biblical: {
    label: 'Versículo em Destaque',
    description: 'Texto bíblico com design elegante',
    color: 'bg-amber-500 text-white'
  },
  video: {
    label: 'Vídeo / Player',
    description: 'Embed de YouTube ou aula gravada',
    color: 'bg-red-500 text-white'
  },
  'study-content': {
    label: 'Conteúdo do Estudo',
    description: 'Área principal de texto rico e estruturado',
    color: 'bg-emerald-500 text-white'
  },
  slide: {
    label: 'Carrossel / Slides',
    description: 'Sequência de slides com texto e fundo',
    color: 'bg-indigo-500 text-white'
  },
  'hero-split': {
    label: 'Hero Editorial',
    description: 'Imagem lateral com frase de impacto',
    color: 'bg-stone-500 text-white'
  },
  'study-outline': {
    label: 'Sumário',
    description: 'Índice automático baseado nos subtítulos (H2) do estudo',
    color: 'bg-yellow-700 text-white'
  },
  'related-verses': {
    label: 'Versículos Relacionados',
    description: 'Lista lateral de referências e resumos',
    color: 'bg-orange-700 text-white'
  },
  'reflection-question': {
    label: 'Pergunta ao Coração',
    description: 'Fechamento reflexivo com resposta pessoal',
    color: 'bg-rose-600 text-white'
  },
  'references-chain': {
    label: 'Referências Encadeadas',
    description: 'Versículos conectados em formato de cadeia',
    color: 'bg-teal-600 text-white'
  },
  'cta': {
    label: 'Bloco de CTA',
    description: 'Chamada para ação com botões',
    color: 'bg-violet-600 text-white'
  },
  footer: {
    label: 'Rodapé / Social',
    description: 'Copyright e links de redes sociais',
    color: 'bg-gray-800 text-white'
  },
  'rich-text': {
    label: 'Texto Template',
    description: 'Título e conteúdo principal do estudo pastoral',
    color: 'bg-bible-gold text-white'
  },
  spacer: {
    label: 'Espaçador / Layout',
    description: 'Espaço vazio configurável (1/1, 1/2, 1/3)',
    color: 'bg-slate-200 text-slate-600'
  }
};

export const defaultBlockData: Record<BlockType, any> = {
  'free-text': {
    content: '',
    padding: 4
  },
  hero: {
    title: 'A Revelação Plena',
    subtitle: 'Uma jornada profunda pelas bases da fé cristã e o poder da Palavra.',
    ctaText: 'Começar agora',
    alignment: 'center',
    showCta: true,
    showSubtitle: true,
    showAuthor: true,
    backgroundColor: '#0f172a',
    textColor: '#ffffff',
    overlayOpacity: 0.5,
    padding: 8
  },
  authority: {
    name: 'Nome do Autor',
    photo: '',
    bio: 'Uma breve descrição sobre o autor e sua autoridade no tema.',
    badges: [],
    socials: { instagram: '', youtube: '', website: '' },
    padding: 4
  },
  biblical: {
    verse: 'João 3:16',
    text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
    reference: 'João 3:16',
    style: 'classic',
    showImage: false,
    enableHyperlink: true,
    showCta: false,
    ctaText: 'Ver na Bíblia',
    ctaStyle: 'solid',
    padding: 8
  },
  video: {
    url: '',
    title: 'Vídeo Introdutório',
    description: '',
    thumbnail: '',
    padding: 4
  },
  footer: {
    logo: '',
    tagline: 'Transformando vidas através da Palavra',
    links: [],
    copyright: `(c) ${new Date().getFullYear()} Todos os direitos reservados`,
    showSocial: true,
    padding: 4
  },
  'study-content': {
    content: '',
    introduction: '',
    context: '',
    application: '',
    prayer: '',
    conclusion: '',
    padding: 4
  },
  slide: {
    slides: [
      {
        id: 'slide-default',
        backgroundImage: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?q=80&w=2000',
        type: 'image',
        title: 'A Palavra de Deus',
        description: 'A Palavra de Deus é viva, eficaz e penetra o coração com verdade e discernimento.',
        mediaUrl: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?q=80&w=2000',
        overlayOpacity: 0.6,
        layout: 'image-right',
        textColor: '#ffffff'
      }
    ],
    margin: { top: 4, bottom: 0 },
    height: 'medium',
    autoplay: false,
    autoplayInterval: 5000,
    showNavigation: true,
    padding: 0
  },
  'hero-split': {
    title: 'A gratidão transforma o coração e nos aproxima de Deus.',
    eyebrow: 'Hero split',
    imageUrl: '',
    imageAlt: 'Imagem editorial do estudo',
    backgroundColor: '#f6efe3',
    textColor: '#7a5942',
    padding: 8
  },
  'study-outline': {
    title: 'Sumário',
    description: 'Navegue pelas seções do estudo',
    items: ['Introdução', 'Contexto Histórico', 'Mergulho nas Escrituras', 'Aplicação Prática', 'Reflexão Final'],
    activeIndex: 0,
    enableScrollSpy: true,
    padding: 4,
    layoutWidth: '1/3',
    showOnMobile: false
  },
  'related-verses': {
    title: 'Versículos Relacionados',
    description: 'Card lateral para referências de apoio e pequenos comentários.',
    verses: [
      { reference: 'Salmos 118:1', summary: 'A gratidão aparece como resposta comunitária ao amor constante do Senhor.' },
      { reference: 'Colossenses 3:17', summary: 'Tudo no template aponta para uma vida centrada em Cristo e marcada por gratidão.' },
      { reference: 'Filipenses 4:6', summary: 'A estrutura finaliza em prática pastoral, levando à oração e confiança.' }
    ],
    padding: 4,
    layoutWidth: '1/3'
  },
  'reflection-question': {
    title: 'Pergunta ao Coração',
    question: 'Como você quer responder a esta mensagem nos próximos dias?',
    support: 'A V2 fecha com um convite pessoal e pastoral para transformar leitura em resposta.',
    placeholder: 'Escreva um comentário, oração guiada, compromisso ou reflexão pastoral...',
    padding: 6
  },
  'references-chain': {
    title: 'Referências Encadeadas',
    description: 'Versículos conectados ao tema principal',
    references: [
      { reference: 'Salmos 118:1', text: 'O Senhor é o meu pastor...', summary: 'A gratidão como resposta ao amor de Deus.' },
      { reference: 'Colossenses 3:17', text: 'Tudo o que fizeres...', summary: 'Viver com gratidão em todas as circunstâncias.' }
    ],
    showExpandAll: true,
    padding: 4
  },
  'cta': {
    headline: 'Crie seus próprios estudos',
    subheadline: 'Junte-se à comunidade BibleLM para acesso ilimitado',
    primaryText: 'Começar Gratuitamente',
    secondaryText: 'Ver mais estudos',
    primaryStyle: 'gradient',
    backgroundStyle: 'warm',
    padding: 8
  },
  'rich-text': {
    content: '',
    padding: 4
  },
  spacer: {
    layoutWidth: '1/1',
    height: 40,
    backgroundColor: 'transparent',
    padding: 0
  }
};
