import { Post } from '../types';

export interface MockUser {
  id: string;
  displayName: string;
  username: string;
  photoURL: string;
  role: 'user' | 'church' | 'cell';
  churchName?: string;
  cellName?: string;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 'user-maria',
    displayName: 'Maria Silva',
    username: 'mariasilva',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    role: 'user',
  },
  {
    id: 'user-pedro',
    displayName: 'Pedro Santos',
    username: 'pedrosantos',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    role: 'user',
  },
  {
    id: 'user-ana',
    displayName: 'Ana Oliveira',
    username: 'anaoliveira',
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    role: 'user',
  },
  {
    id: 'user-joao',
    displayName: 'João Costa',
    username: 'joaocosta',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    role: 'user',
  },
  {
    id: 'user-carlos',
    displayName: 'Carlos Mendes',
    username: 'carlosmendes',
    photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    role: 'user',
  },
  {
    id: 'user-lucia',
    displayName: 'Lúcia Ferreira',
    username: 'luciaferreira',
    photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    role: 'user',
  },
  {
    id: 'church-batista',
    displayName: 'Igreja Batista Palavra de Vida',
    username: 'ibatistapalavra',
    photoURL: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=150&h=150&fit=crop',
    role: 'church',
    churchName: 'Igreja Batista Palavra de Vida',
  },
  {
    id: 'cell-juvenil',
    displayName: 'Célula Jovens Fogo do Espírito',
    username: 'celulajovens',
    photoURL: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=150&h=150&fit=crop',
    role: 'cell',
    cellName: 'Jovens Fogo do Espírito',
  },
];

const createMockPost = (
  id: string,
  user: MockUser,
  type: Post['type'],
  content: string,
  options: Partial<Post> = {}
): Post => {
  const baseDate = new Date();
  const hoursAgo = parseInt(id.split('-')[1] || '0', 10) || 0;
  baseDate.setHours(baseDate.getHours() - hoursAgo);

  return {
    id: `mock-${id}`,
    userId: user.id,
    userDisplayName: user.displayName,
    userUsername: user.username,
    userPhotoURL: user.photoURL,
    type,
    content,
    likesCount: Math.floor(Math.random() * 50) + 1,
    commentsCount: Math.floor(Math.random() * 15),
    shares: Math.floor(Math.random() * 10),
    likes: 0,
    comments: 0,
    saved: false,
    likedBy: [],
    createdAt: baseDate.toISOString(),
    time: hoursAgo === 0 ? 'Agora' : hoursAgo === 1 ? '1h' : `${hoursAgo}h`,
    location: user.churchName || user.cellName || 'São Paulo, SP',
    destination: 'global',
    ...options,
  };
};

export const MOCK_POSTS: Post[] = [
  createMockPost('post-1', MOCK_USERS[6], 'reflection', 
    '📖 João 14:6: "Eu sou o caminho, a verdade e a vida. Ninguém vem ao Pai senão por mim."\n\nHoje no culto da manhã, o pastor falou sobre a diferença entre buscar Deus e buscar conforto. Precisamos entender que o caminho nem sempre é fácil, mas é sempre seguro. Confie no Senhor!',
    { imageUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop' }
  ),

  createMockPost('post-2', MOCK_USERS[0], 'prayer', 
    '🙏 Por favor, intercedam pela minha família. Meu pai está enfrentando problemas de saúde e precisamos muito das orações de vocês. Deus é fiel e confio que Ele vai nos fortalecer nesta provação.'
  ),

  createMockPost('post-3', MOCK_USERS[1], 'feeling', '😇', { mood: 'blessed' }),

  createMockPost('post-4', MOCK_USERS[1], 'feeling', 'Estou me sentindo muito grato hoje! Aprovação na faculdade e a paz de Deus no coração.',
    { mood: 'grato' }
  ),

  createMockPost('post-5', MOCK_USERS[7], 'reflection', 
    '🌟 Na Célula de ontem, falamos sobre Gálatas 5:22-23 - o fruto do Espírito. O amor, a alegria, a paz, a paciência... são características que deveríamos cultivar todos os dias. Quem quer se desafiar a crescer neste fruto esta semana?'
  ),

  createMockPost('post-6', MOCK_USERS[2], 'reflection', 
    '📖 Salmos 46:10: "Aquietai-vos e sabei que Eu sou Deus."\n\nQuantas vezes tentamos resolver tudo com nossas próprias forças? Hoje decidi parar, respirar e lembrar que Deus está no controle. Ele é maior que qualquer problema que estamos enfrentando.'
  ),

  createMockPost('post-7', MOCK_USERS[3], 'prayer', 
    '🆘 Gente, preciso de oração forte. Estou passando por um momento de muita ansiedade no trabalho e sinto que estou perdendo a paz. Oração pela minha mente e coração, por favor.'
  ),

  createMockPost('post-8', MOCK_USERS[4], 'feeling', '🔥', { mood: 'fire' }),

  createMockPost('post-9', MOCK_USERS[6], 'image', 
    'Louvor e adoração ao Senhor! Que momento maravilhoso de comunhão. Graças a Deus por cada pessoa que esteve presente.',
    { imageUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop' }
  ),

  createMockPost('post-10', MOCK_USERS[0], 'reflection', 
    '💭 Provérbios 3:5-6: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento."\n\nAprendendo a confiar no timing de Deus. Às vezes o "não" dele é na verdade um "não ainda" para algo melhor.'
  ),

  createMockPost('post-11', MOCK_USERS[5], 'feeling', '🕊️', { mood: 'paz' }),

  createMockPost('post-12', MOCK_USERS[7], 'cell_meeting', 
    '📍 Célula Jovens Fogo do Espírito - Quinta-feira 19h\n\nTema: "O Poder da Oração Intercessora"\nVenha orar conosco! Endereço: Rua das Flores, 123 - Centro'
  ),

  createMockPost('post-13', MOCK_USERS[2], 'prayer', 
    '🙏 Agradeço a Deus e a vocês que oraram! Minha mãe recebeu alta do hospital. O Senhor agiu de forma sobrenatural. Deus é bom o tempo todo!'
  ),

  createMockPost('post-14', MOCK_USERS[3], 'reflection', 
    '📖 Mateus 11:28: "Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei."\n\nJesus nos convida para o descanso. Não precisamos carregar o mundo nas costas. Entregue suas preocupações a Ele.'
  ),

  createMockPost('post-15', MOCK_USERS[4], 'feeling', '🤔', { mood: 'thoughtful' }),

  createMockPost('post-16', MOCK_USERS[1], 'reflection', 
    'Oração de hoje pela manhã:\n\n"Pai, antes de começar meu dia, quero Te entregar minha agenda. Que minhas palavras sejam de edificação e meus passos guiados por Tua mão. Que eu reflita Cristo em cada interação. Em nome de Jesus, amém."'
  ),

  createMockPost('post-17', MOCK_USERS[6], 'devotional', 
    '📱 Devocional da Manhã - Dia 15 de Março\n\nTema: "A Fidelidade de Deus nas Pequenas Coisas"\n\nDeus não está apenas nas grandes decisões da vida. Ele está presente nas pequenas manhãs, nos cafezinhos em Sua presença, nas vitórias do dia a dia. Valorize os momentos simples com Deus.'
  ),

  createMockPost('post-18', MOCK_USERS[5], 'prayer', 
    '🙏 Intercedam pela minha jornada cristã. Estou me sentindo distante e preciso me reconectar com Deus. Orem para que meu coração se abra novamente à voz do Espírito Santo.'
  ),

  createMockPost('post-19', MOCK_USERS[0], 'image', 
    'Arte gerada por IA: "A luz de Cristo iluminando o caminho" ✨\n\nDeus é a luz que guia nossos passos nas trevas. Confie Nele!',
    { imageUrl: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&auto=format&fit=crop' }
  ),

  createMockPost('post-20', MOCK_USERS[7], 'reflection', 
    '📖 Atos 1:8: "Mas recebereis a virtude do alto, quando o Espírito Santo vier sobre vós."\n\nA promessa do Espírito Santo é para todos nós! Não importa se você é crente há pouco ou muito tempo - Deus quer te capacitar com o Seu poder.'
  ),

  createMockPost('post-21', MOCK_USERS[3], 'feeling', '😄', { mood: 'feliz' }),

  createMockPost('post-22', MOCK_USERS[4], 'prayer', 
    '🙏 Pela cidade de São Paulo - que Deus toque os corações das pessoas, que o evangelho alcance os mais necessitados, que a paz reine nas famílias. Intercessão poderosa!'
  ),

  createMockPost('post-23', MOCK_USERS[2], 'cell_meeting', 
    '📸 Fotos da Célula de sábado! Que noite abençoada. Obrigado a todos que vieram e aos que oraram em casa. Nos vemos na próxima quinta!',
    { imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=crop' }
  ),

  createMockPost('post-24', MOCK_USERS[5], 'reflection', 
    'Romanos 8:28: "Sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus."\n\nNem tudo que acontece parece bom, mas Deus é capaz de usar até as situações difíceis para nos moldar e nos abençoar. Confie no processo!'
  ),

  createMockPost('post-25', MOCK_USERS[1], 'feeling', '🕊️', { mood: 'paz' }),
];

export const getMockPosts = (): Post[] => MOCK_POSTS;

export const getMockPostsByType = (type: Post['type']): Post[] => 
  MOCK_POSTS.filter(p => p.type === type);

export const getMockPostsByUser = (userId: string): Post[] => 
  MOCK_POSTS.filter(p => p.userId === userId);

export const getMockUserById = (userId: string): MockUser | undefined => 
  MOCK_USERS.find(u => u.id === userId);
