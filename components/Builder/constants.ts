import { BlockType } from './types';

export const blockLabels: Record<BlockType, { label: string; description: string; color: string }> = {
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
  footer: {
    label: 'Rodapé / Social',
    description: 'Copyright e links de redes sociais',
    color: 'bg-gray-800 text-white'
  }
};

export const defaultBlockData: Record<BlockType, any> = {
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
    imageStyle: 'realistic',
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
    copyright: `© ${new Date().getFullYear()} Todos os direitos reservados`,
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
        id: `slide-default`,
        backgroundImage: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?q=80&w=2000',
        type: 'image',
        title: 'A Palavra de Deus',
        description: 'Pois a palavra de Deus é viva, e eficaz, e mais cortante que qualquer espada de dois gumes, e que penetra até a divisão de alma e espírito, e de juntas e medulas, e pronta para discernir as disposições e pensamentos do coração. Hebreus 4:12',
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
  }
};
