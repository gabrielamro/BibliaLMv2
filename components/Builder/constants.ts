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
    padding: 16
  },
  authority: {
    name: 'Nome do Autor',
    photo: '',
    bio: 'Uma breve descrição sobre o autor e sua autoridade no tema.',
    badges: [],
    socials: { instagram: '', youtube: '', website: '' },
    padding: 12
  },
  biblical: {
    verse: 'João 3:16',
    text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
    reference: 'João 3:16',
    style: 'elegant',
    showImage: true,
    imageStyle: 'realistic',
    padding: 12
  },
  video: {
    url: '',
    title: 'Vídeo Introdutório',
    description: '',
    thumbnail: '',
    padding: 12
  },
  footer: {
    logo: '',
    tagline: 'Transformando vidas através da Palavra',
    links: [],
    copyright: `© ${new Date().getFullYear()} Todos os direitos reservados`,
    showSocial: true,
    padding: 12
  },
  'study-content': {
    content: '',
    introduction: '',
    context: '',
    application: '',
    prayer: '',
    conclusion: '',
    padding: 12
  },
  slide: {
    slides: [
      {
        id: `slide-1-${Date.now()}`,
        backgroundImage: '',
        content: '<h2>Título do Slide</h2><p>Adicione seu conteúdo aqui...</p>',
        overlayOpacity: 0.3
      }
    ],
    height: 'medium',
    autoplay: false,
    autoplayInterval: 5000,
    showNavigation: true,
    padding: 0
  }
};
