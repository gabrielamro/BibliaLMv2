import { BlockType } from './types';

export const blockLabels: Record<BlockType, { label: string; description: string; color: string }> = {
  hero: {
    label: 'Capa Impactante',
    description: 'Titulo, subtitulo e CTA com fundo visual',
    color: 'bg-blue-500 text-white'
  },
  authority: {
    label: 'Perfil do Autor',
    description: 'Foto, nome e biografia curta',
    color: 'bg-purple-500 text-white'
  },
  biblical: {
    label: 'Versiculo em Destaque',
    description: 'Texto biblico com design elegante',
    color: 'bg-amber-500 text-white'
  },
  video: {
    label: 'Video / Player',
    description: 'Embed de YouTube ou aula gravada',
    color: 'bg-red-500 text-white'
  },
  'study-content': {
    label: 'Conteudo do Estudo',
    description: 'Area principal de texto rico e estruturado',
    color: 'bg-emerald-500 text-white'
  },
  slide: {
    label: 'Carrossel / Slides',
    description: 'Sequencia de slides com texto e fundo',
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
    label: 'Versiculos Relacionados',
    description: 'Lista lateral de referencias e resumos',
    color: 'bg-orange-700 text-white'
  },
  'reflection-question': {
    label: 'Pergunta ao Coracao',
    description: 'Fechamento reflexivo com resposta pessoal',
    color: 'bg-rose-600 text-white'
  },
  'references-chain': {
    label: 'Referencias Encadeadas',
    description: 'Versiculos conectados em formato de cadeia',
    color: 'bg-teal-600 text-white'
  },
  'cta': {
    label: 'Bloco de CTA',
    description: 'Chamada para acao com botoes',
    color: 'bg-violet-600 text-white'
  },
  footer: {
    label: 'Rodape / Social',
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
  hero: {
    title: 'A Revelacao Plena',
    subtitle: 'Uma jornada profunda pelas bases da fe crista e o poder da Palavra.',
    ctaText: 'Comecar agora',
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
    bio: 'Uma breve descricao sobre o autor e sua autoridade no tema.',
    badges: [],
    socials: { instagram: '', youtube: '', website: '' },
    padding: 4
  },
  biblical: {
    verse: 'Joao 3:16',
    text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigenito, para que todo aquele que nele cre nao pereca, mas tenha a vida eterna.',
    reference: 'Joao 3:16',
    style: 'classic',
    showImage: false,
    enableHyperlink: true,
    showCta: false,
    ctaText: 'Ver na Biblia',
    ctaStyle: 'solid',
    padding: 8
  },
  video: {
    url: '',
    title: 'Video Introdutorio',
    description: '',
    thumbnail: '',
    padding: 4
  },
  footer: {
    logo: '',
    tagline: 'Transformando vidas atraves da Palavra',
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
        description: 'A Palavra de Deus e viva, eficaz e penetra o coracao com verdade e discernimento.',
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
    title: 'A gratidao transforma o coracao e nos aproxima de Deus.',
    eyebrow: 'Hero split',
    imageUrl: '',
    imageAlt: 'Imagem editorial do estudo',
    backgroundColor: '#f6efe3',
    textColor: '#7a5942',
    padding: 8
  },
  'study-outline': {
    title: 'Sumário',
    description: 'Navegue pelas secoes do estudo',
    items: ['Introducao', 'Contexto Historico', 'Mergulho nas Escrituras', 'Aplicacao Pratica', 'Reflexao Final'],
    activeIndex: 0,
    enableScrollSpy: true,
    padding: 4,
    layoutWidth: '1/3'
  },
  'related-verses': {
    title: 'Versiculos Relacionados',
    description: 'Card lateral para referencias de apoio e pequenos comentarios.',
    verses: [
      { reference: 'Salmos 118:1', summary: 'A gratidao aparece como resposta comunitaria ao amor constante do Senhor.' },
      { reference: 'Colossenses 3:17', summary: 'Tudo no template aponta para uma vida centrada em Cristo e marcada por gratidao.' },
      { reference: 'Filipenses 4:6', summary: 'A estrutura finaliza em pratica pastoral, levando a oracao e confianca.' }
    ],
    padding: 4,
    layoutWidth: '1/3'
  },
  'reflection-question': {
    title: 'Pergunta ao Coracao',
    question: 'Como voce quer responder a esta mensagem nos proximos dias?',
    support: 'A V2 fecha com um convite pessoal e pastoral para transformar leitura em resposta.',
    placeholder: 'Escreva um comentario, oracao guiada, compromisso ou reflexao pastoral...',
    padding: 6
  },
  'references-chain': {
    title: 'Referencias Encadeadas',
    description: 'Versiculos conectados ao tema principal',
    references: [
      { reference: 'Salmos 118:1', text: 'O Senhor e o meu pastor...', summary: 'A gratidao como resposta ao amor de Deus.' },
      { reference: 'Colossenses 3:17', text: 'Tudo o que fizeres...', summary: 'Viver com gratidao em todas as circunstancias.' }
    ],
    showExpandAll: true,
    padding: 4
  },
  'cta': {
    headline: 'Crie seus proprios estudos',
    subheadline: 'Junte-se a comunidade BibleLM para acesso ilimitado',
    primaryText: 'Comecar Gratuitamente',
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
