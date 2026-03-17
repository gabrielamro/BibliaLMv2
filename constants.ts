
import { Book, Devotional, SubscriptionPlan, Badge, QuizQuestion, ReadingTrack, GuidedPrayer } from './types';

export const SYSTEM_VERSION = "1.7.0";
export const DEFAULT_FONT_SIZE = 3;

// --- LEITURA INTELIGENTE (SMART TEXT) ---
export const BIBLICAL_ENTITIES = {
  DIVINE: [
    "Deus", "Senhor", "SENHOR", "Jesus", "Cristo", "Espírito Santo",
    "Pai", "Filho", "Jeová", "Yahweh", "Altíssimo", "Todo-Poderoso",
    "Messias", "Emanuel", "Cordeiro de Deus", "Leão da Tribo de Judá",
    "Rei dos reis", "Senhor dos senhores", "Mestre", "Salvador"
  ],
  PEOPLE: [
    "Adão", "Eva", "Caim", "Abel", "Noé", "Abraão", "Isaque", "Jacó", "José",
    "Moisés", "Arão", "Josué", "Rute", "Samuel", "Saul", "Davi", "Golias", "Jônatas",
    "Salomão", "Elias", "Eliseu", "Isaías", "Jeremias", "Ezequiel", "Daniel",
    "Jonas", "Maria", "José", "João Batista", "Pedro", "André", "Tiago", "João",
    "Filipe", "Bartolomeu", "Tomé", "Mateus", "Tadeu", "Simão", "Judas", "Paulo",
    "Estêvão", "Barnabé", "Timóteo", "Tito", "Filemom", "Lázaro", "Marta", "Maria Madalena",
    "Zaqueu", "Nicodemos", "Pôncio Pilatos", "Herodes", "César"
  ]
};

export const INSPIRATIONAL_VERSES = [
  { text: "O SENHOR é o meu pastor, nada me faltará.", ref: "Salmos 23:1" },
  { text: "Posso todas as coisas naquele que me fortalece.", ref: "Filipenses 4:13" },
  { text: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.", ref: "Salmos 119:105" },
  { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito...", ref: "João 3:16" },
  { text: "O meu socorro vem do Senhor, que fez o céu e a terra.", ref: "Salmos 121:2" },
  { text: "Seja forte e corajoso! Não se apavore nem desanime.", ref: "Josué 1:9" },
  { text: "Tudo o que fizerem, façam de todo o coração, como para o Senhor.", ref: "Colossenses 3:23" },
  { text: "Alegrem-se sempre no Senhor. Novamente direi: Alegrem-se!", ref: "Filipenses 4:4" },
  { text: "O teu amor é melhor do que a vida! Por isso os meus lábios te louvarão.", ref: "Salmos 63:3" },
  { text: "Confie no Senhor de todo o seu coração e não se apóie em seu próprio entendimento.", ref: "Provérbios 3:5" }
];

export const AI_SUGGESTED_TRACKS: ReadingTrack[] = [
  {
    id: 'ai-track-1',
    title: 'Vencendo a Ansiedade',
    description: 'Um caminho de 4 dias para encontrar descanso na paz que excede o entendimento.',
    authorId: 'system-ai',
    authorName: 'Obreiro IA',
    scope: 'global',
    tags: ['Paz', 'Saúde Mental'],
    createdAt: new Date().toISOString(),
    steps: [
      { id: 's1', bookId: 'sl', chapter: 23, verses: '1-6', commentAuthor: 'ai', devotionalHtml: '<b>A Provisão do Pai.</b><br/>O Bom Pastor supre nossas necessidades emocionais e físicas. Quando paramos de tentar controlar tudo e aceitamos o pastoreio do Senhor, até o vale sombrio perde seu terror. Reserve um momento intenso para respirar fundo e meditar na contínua e ativa provisão de Deus para com a sua vida.' },
      { id: 's2', bookId: 'mt', chapter: 6, verses: '25-34', commentAuthor: 'ai', devotionalHtml: '<b>Olhe para as aves.</b><br/>Jesus nos convida a observar as aves e os lírios. A ansiedade tenta nos convencer de que estamos esquecidos ou desprotegidos no futuro. Contudo, Ele nos ensina que o nosso cuidado diário já está garantido. Medite nesses versículos como um antídoto direto para o medo do amanhã.' },
      { id: 's3', bookId: 'fp', chapter: 4, verses: '6-7', commentAuthor: 'ai', devotionalHtml: '<b>O poder da gratidão.</b><br/>O apóstolo revela que o segredo não é suprimir os pedidos, mas fazê-los *junto com ações de graças*. Quando você agradece pelo que já tem, sua mente se recalibra para focar na bondade do Senhor, e não nas incertezas. A Paz toma conta.' },
      { id: 's4', bookId: '1pe', chapter: 5, verses: '6-7', commentAuthor: 'ai', devotionalHtml: '<b>Lançando o Fardo.</b><br/>Aqui encontramos uma ordem maravilhosa: lançar sobre Ele toda ansiedade. Deus não quer que você carregue o dia isoladamente nas costas. Entregue. Deposite no altar e recuse-se a pegar de volta.' }
    ]
  },
  {
    id: 'ai-track-2',
    title: 'Identidade em Cristo',
    description: 'Descubra quem Deus diz que você é e rompa com rótulos do passado.',
    authorId: 'system-ai',
    authorName: 'Obreiro IA',
    scope: 'global',
    tags: ['Autoestima', 'Identidade'],
    createdAt: new Date().toISOString(),
    steps: [
      { id: 's1', bookId: 'ef', chapter: 1, verses: '3-14', commentAuthor: 'ai', devotionalHtml: '<b>Você foi desejado!</b><br/>Antes da fundação do mundo, muito antes de qualquer erro seu ou rótulo que a sociedade tentou aplicar, Deus te escolheu. Ler Efésios é como abrir seu "certificado de adoção" espiritual. Prepare-se para ler as riquezas celestiais garantidas ao seu nome.' },
      { id: 's2', bookId: 'rm', chapter: 8, verses: '1-2, 31-39', commentAuthor: 'ai', devotionalHtml: '<b>Livre de Condenação.</b><br/>A culpa é um dos maiores empecilhos para o amor próprio e identidade. Neste trecho de Romanos, Paulo decreta algo libertador: Já não há condenação para você. Entenda agora o seu status imutável de filho.' },
      { id: 's3', bookId: '2co', chapter: 5, verses: '17', commentAuthor: 'ai', devotionalHtml: '<b>Página em Branco.</b><br/>Você é uma Nova Criatura. O passado perdeu os direitos autorais sobre sua história e as coisas velhas ficaram para trás de forma absoluta. Sua verdadeira identidade reflete a imagem de Cristo. Encerre essa trilha assumindo o poder deste recomeço.' }
    ]
  },
  {
    id: 'ai-track-3',
    title: 'Sabedoria Financeira',
    description: 'Princípios do Reino para gerir recursos e viver em liberdade.',
    authorId: 'system-ai',
    authorName: 'Obreiro IA',
    scope: 'global',
    tags: ['Finanças', 'Trabalho'],
    createdAt: new Date().toISOString(),
    steps: [
      { id: 's1', bookId: 'pv', chapter: 3, verses: '9-10', commentAuthor: 'ai', devotionalHtml: '<b>Honra às Primícias.</b><br/>Deus quer ser o primeiro, e não as sobras da nossa vida. O livro de Provérbios traz um conselho formidável de que, ao honrarmos a Deus com nossa melhor renda, os celeiros transbordam de prosperidade integral.' },
      { id: 's2', bookId: 'mt', chapter: 25, verses: '14-30', commentAuthor: 'ai', devotionalHtml: '<b>A Mordomia.</b><br/>A Parábola dos Talentos ensina que o que temos hoje é um capital fornecido por Deus para ser administrado. A prosperidade do Reino surge na oposição do medo e da preguiça. Multiplicar é um mandamento e louvor!' },
      { id: 's3', bookId: '1tm', chapter: 6, verses: '6-10', commentAuthor: 'ai', devotionalHtml: '<b>O Alicerce do Contentamento.</b><br/>Gerir finanças envolve fugir da armadilha do amor ao dinheiro. Paulo adverte a Timóteo que a piedade unida ao contentamento é o verdadeiro lucro que alguém pode obter nesta terra.' }
    ]
  }
];

export const STATIC_PRAYERS: GuidedPrayer[] = [
  // MANHÃ
  {
    id: 'static-morning-1',
    title: 'Oração ao Amanhecer',
    content: 'Pai amado, obrigado por este novo dia. Entrego minhas mãos para o Teu trabalho e meus pés para o Teu caminho. Que minhas palavras hoje sejam temperadas com sal e que eu reflita a Tua luz em cada conversa. Conduz-me em Tua sabedoria. Amém.',
    category: 'morning',
    authorId: 'system',
    authorName: 'BíbliaLM',
    isTemplate: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'static-morning-2',
    title: 'Despertar com Propósito',
    content: 'Senhor, ao abrir meus olhos, te louvo pela vida. Que hoje eu não viva no automático, mas com a intencionalidade de quem serve ao Reino. Enche-me do Teu Espírito para que eu tenha discernimento em cada decisão. Amém.',
    category: 'morning',
    authorId: 'system',
    authorName: 'BíbliaLM',
    isTemplate: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'static-morning-3',
    title: 'Entrega do Dia',
    content: 'Deus Soberano, antes que a correria comece, eu paro para Te adorar. Eu consagro minha agenda, meus compromissos e meus imprevistos a Ti. Que a Tua paz governe meu coração, independentemente das circunstâncias externas. Em nome de Jesus, Amém.',
    category: 'morning',
    authorId: 'system',
    authorName: 'BíbliaLM',
    isTemplate: true,
    createdAt: new Date().toISOString()
  },

  // NOITE
  {
    id: 'static-night-1',
    title: 'Paz para Dormir',
    content: 'Senhor, as lutas de hoje terminaram. Deposito diante de Ti minhas preocupações e incertezas. Confio que Tu não dormes e velas por mim. Cubra meu quarto com Tua paz e renova minhas forças enquanto descanso. Em paz me deito e logo adormeço. Amém.',
    category: 'night',
    authorId: 'system',
    authorName: 'BíbliaLM',
    isTemplate: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'static-night-2',
    title: 'Exame de Consciência',
    content: 'Pai, obrigado por me sustentar até aqui. Perdoa-me se falhei em palavras ou atitudes hoje. Limpa meu coração de qualquer mágoa ou ansiedade antes de eu repousar. Que meu sono seja tranquilo e reparador na Tua presença. Amém.',
    category: 'night',
    authorId: 'system',
    authorName: 'BíbliaLM',
    isTemplate: true,
    createdAt: new Date().toISOString()
  },

  // ANSIEDADE
  {
    id: 'static-anxiety-1',
    title: 'Acalma meu Coração',
    content: 'Senhor, minha mente está agitada e meu coração inquieto. Tua Palavra diz para lançar sobre Ti toda a minha ansiedade. Eu faço isso agora. Tomo o fardo leve de Jesus e deixo o peso do controle. Tu és Deus, e eu não sou. Eu confio no Teu cuidado. Amém.',
    category: 'anxiety',
    authorId: 'system',
    authorName: 'BíbliaLM',
    isTemplate: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'static-anxiety-2',
    title: 'Contra o Medo do Futuro',
    content: 'Deus Eterno, o futuro pertence a Ti. Ajuda-me a viver o "hoje" que o Senhor me deu. Repreendo todo espírito de medo e incerteza. Que a Tua paz, que excede todo o entendimento, guarde a minha mente em Cristo Jesus agora. Amém.',
    category: 'anxiety',
    authorId: 'system',
    authorName: 'BíbliaLM',
    isTemplate: true,
    createdAt: new Date().toISOString()
  },

  // GRATIDÃO
  {
    id: 'static-gratitude-1',
    title: 'Louvor pela Provisão',
    content: 'Pai, eu Te agradeço pelo pão de cada dia, pelo teto sobre minha cabeça e pelo ar que respiro. Muitas vezes peço muito e agradeço pouco. Hoje, quero apenas dizer: Obrigado pela Tua fidelidade constante, mesmo quando sou infiel. Amém.',
    category: 'gratitude',
    authorId: 'system',
    authorName: 'BíbliaLM',
    isTemplate: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'static-gratitude-2',
    title: 'Gratidão pela Salvação',
    content: 'Senhor Jesus, obrigado pela cruz. Obrigado porque meu nome está escrito no Livro da Vida. Nada neste mundo se compara à alegria de Te conhecer. Renova em mim a alegria da Tua salvação hoje. Amém.',
    category: 'gratitude',
    authorId: 'system',
    authorName: 'BíbliaLM',
    isTemplate: true,
    createdAt: new Date().toISOString()
  },

  // FAMÍLIA
  {
    id: 'static-family-1',
    title: 'Bênção sobre o Lar',
    content: 'Senhor, visita minha casa. Que a Tua presença seja real em nossa sala, na cozinha e nos quartos. Afasta toda desunião, gritaria e falta de perdão. Que nosso lar seja um pedaço do céu na terra, um lugar de refúgio e amor. Amém.',
    category: 'family',
    authorId: 'system',
    authorName: 'BíbliaLM',
    isTemplate: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'static-family-2',
    title: 'Pelos Filhos e Cônjuge',
    content: 'Pai, entrego minha família em Tuas mãos. Protege-os de todo mal físico e espiritual. Dá-nos sabedoria para lidar uns com os outros com paciência e graça, assim como Tu tens conosco. Que eu seja exemplo de Cristo dentro da minha própria casa. Amém.',
    category: 'family',
    authorId: 'system',
    authorName: 'BíbliaLM',
    isTemplate: true,
    createdAt: new Date().toISOString()
  },

  // BATALHA ESPIRITUAL
  {
    id: 'static-warfare-1',
    title: 'Armadura de Deus',
    content: 'Senhor, eu me revisto agora com toda a armadura de Deus. Coloco o capacete da salvação, a couraça da justiça, o cinto da verdade e calço as sandálias do evangelho da paz. Empunho o escudo da fé contra os dardos inflamados e a espada do Espírito. Estou firme na rocha que é Cristo. Amém.',
    category: 'warfare',
    authorId: 'system',
    authorName: 'BíbliaLM',
    isTemplate: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'static-warfare-2',
    title: 'Quebra de Fortalezas',
    content: 'Em nome de Jesus, eu declaro que toda fortaleza mental, todo vício e toda opressão que tenta se levantar contra mim cai por terra agora. Maior é Aquele que está em mim do que aquele que está no mundo. Eu sou livre pelo sangue do Cordeiro. Amém.',
    category: 'warfare',
    authorId: 'system',
    authorName: 'BíbliaLM',
    isTemplate: true,
    createdAt: new Date().toISOString()
  }
];

export const DONATION_CONFIG = {
  pixKey: "gabrielamaroo@gmail.com",
  pixName: "Gabriel Lenin Queiroz Amaro",
  bankName: "Mercado Pago",
  supportLink: "https://apoia.se/seoprojeto",
  mercadoPagoAccessToken: "APP_USR-3990318978447697-010516-5d4bd5051c6200d2d7eb517bee95b5ed-91370123",
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Visitante',
    price: 0,
    priceAnnual: 0,
    limits: { images: 2, podcasts: 1, analysis: 3, chat: 10 },
    benefits: ['Bíblia e Devocional', 'Mural da Comunidade', 'Postar no Feed Social', 'Quiz e Gamificação', '2 Artes Sacras/dia']
  },
  {
    id: 'bronze',
    name: 'Semeador',
    price: 9.99,
    priceAnnual: 99.90,
    limits: { images: 10, podcasts: 5, analysis: 10, chat: 50 },
    benefits: ['Conselheiro IA Full', '10 Artes Sacras/dia', 'Personalizar Perfil', 'Badge Semeador']
  },
  {
    id: 'silver',
    name: 'Fiel',
    price: 19.99,
    priceAnnual: 199.90,
    limits: { images: 30, podcasts: 15, analysis: 30, chat: 200 },
    benefits: ['Fundar Igrejas/Células', 'Criador de Sermões', 'Geração de Podcasts', 'Análises NotebookLM']
  },
  {
    id: 'gold',
    name: 'Visionário',
    price: 39.99,
    priceAnnual: 399.90,
    limits: { images: 9999, podcasts: 9999, analysis: 9999, chat: 9999 },
    benefits: ['IA ILIMITADA', 'EXPERIÊNCIA SEM ANÚNCIOS', 'Temas Exclusivos', 'Destaque Global de Posts'],
    recommended: true
  },
  {
    id: 'pastor',
    name: 'Pastor',
    price: 59.90,
    priceAnnual: 599.00,
    limits: { images: 9999, podcasts: 9999, analysis: 9999, chat: 9999 },
    benefits: ['Tudo do Visionário', 'Workspace Pastoral FULL', 'Gestão de Planos de Estudo', 'Selo de Autoridade'],
    recommended: false
  },
  {
    id: 'admin',
    name: 'Admin',
    price: 0,
    priceAnnual: 0,
    limits: { images: 9999, podcasts: 9999, analysis: 9999, chat: 9999 },
    benefits: ['Controle total do CMS', 'Gerenciamento de Usuários', 'Dashboards Avançados'],
    recommended: false
  }
];

export const CREDIT_PACKAGES = [{ id: 'starter', name: 'Iniciante', credits: 50, price: 14.90, popular: false }, { id: 'plus', name: 'Plus', credits: 150, price: 39.90, popular: true }, { id: 'gold', name: 'Gold', credits: 500, price: 99.90, popular: false }];
export const BADGES: Badge[] = [{ id: 'level_1', name: 'Peregrino', description: 'Iniciou a jornada acumulando 50 Maná.', icon: '🌱', category: 'level', requirement: 50, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }, { id: 'level_2', name: 'Discípulo', description: 'Mostrou constância alcançando 200 Maná.', icon: '📜', category: 'level', requirement: 200, color: 'bg-teal-100 text-teal-700 border-teal-200' }, { id: 'level_3', name: 'Guerreiro', description: 'Fervoroso no espírito com 500 Maná.', icon: '⚔️', category: 'level', requirement: 500, color: 'bg-cyan-100 text-cyan-700 border-cyan-200' }, { id: 'level_4', name: 'Mestre', description: 'Um profundo conhecedor com 1.000 Maná.', icon: '👑', category: 'level', requirement: 1000, color: 'bg-sky-100 text-sky-700 border-sky-200' }, { id: 'level_5', name: 'Apóstolo Digital', description: 'Uma referência na comunidade com 5.000 Maná.', icon: '🕊️', category: 'level', requirement: 5000, color: 'bg-amber-100 text-amber-700 border-amber-200' }, { id: 'ach_first_read', name: 'Primeiro Passo', description: 'Completou a leitura do primeiro capítulo.', icon: '📖', category: 'achievement', requirementStat: 'totalChaptersRead', requirement: 1, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }, { id: 'ach_first_amen', name: 'Voz de Fé', description: 'Confirmou seu primeiro devocional com um Amém.', icon: '🙏', category: 'achievement', requirementStat: 'totalDevotionalsRead', requirement: 1, color: 'bg-rose-100 text-rose-700 border-rose-200' }, { id: 'ach_devoted_10', name: 'Coração Devoto', description: 'Realizou 10 devocionais diários.', icon: '❤️', category: 'achievement', requirementStat: 'totalDevotionalsRead', requirement: 10, color: 'bg-rose-100 text-rose-700 border-rose-200' }, { id: 'ach_first_note', name: 'Escriba Iniciante', description: 'Criou sua primeira anotação ou reflexão.', icon: '✍️', category: 'achievement', requirementStat: 'totalNotes', requirement: 1, color: 'bg-blue-100 text-blue-700 border-blue-200' }, { id: 'ach_first_sermon', name: 'Voz Profética', description: 'Criou seu primeiro esboço de sermão.', icon: '🎙️', category: 'achievement', requirementStat: 'totalSermonsCreated', requirement: 1, color: 'bg-blue-100 text-blue-700 border-blue-200' }, { id: 'ach_first_share', name: 'Evangelista Digital', description: 'Compartilhou a Palavra pela primeira vez.', icon: '📲', category: 'achievement', requirementStat: 'totalShares', requirement: 1, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' }, { id: 'ach_first_image', name: 'Artista Sacro', description: 'Criou sua primeira arte com Inteligência Artificial.', icon: '🎨', category: 'achievement', requirementStat: 'totalImagesGenerated', requirement: 1, color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200' }, { id: 'ach_first_chat', name: 'Buscador de Sabedoria', description: 'Buscou entendimento com o Conselheiro IA.', icon: '🧠', category: 'achievement', requirementStat: 'totalChatMessages', requirement: 1, color: 'bg-violet-100 text-violet-700 border-violet-200' }, { id: 'quiz_scholar', name: 'Sábio Iniciante', description: 'Completou seu primeiro Desafio da Sabedoria.', icon: '💡', category: 'achievement', requirementStat: 'totalQuizzesCompleted', requirement: 1, color: 'bg-purple-100 text-purple-700 border-purple-200' }, { id: 'quiz_master_law', name: 'Mestre da Lei', description: 'Alcançou 2500 Maná em conhecimento.', icon: '📜', category: 'level', requirement: 2500, color: 'bg-purple-100 text-purple-700 border-purple-200' }, { id: 'quiz_theologian', name: 'Teólogo Supremo', description: 'Dominou as escrituras (Nível Difícil).', icon: '🏛️', category: 'achievement', requirementStat: 'perfectQuizzes', requirement: 5, color: 'bg-purple-100 text-purple-700 border-purple-200' }, { id: 'quiz_prophet', name: 'Erudito da Lei', description: 'Completou 10 Desafios da Sabedoria.', icon: '🏺', category: 'achievement', requirementStat: 'totalQuizzesCompleted', requirement: 10, color: 'bg-purple-100 text-purple-700 border-purple-200' }, { id: 'quiz_perfect', name: 'Mente de Cristo', description: 'Acertou 100% das questões em um desafio.', icon: '🧠', category: 'achievement', requirementStat: 'perfectQuizzes', requirement: 1, color: 'bg-purple-100 text-purple-700 border-purple-200' }, { id: 'streak_7', name: 'Chama Acesa', description: 'Manteve o foco por 7 dias seguidos.', icon: '🕯️', category: 'streak', requirement: 7, color: 'bg-orange-100 text-orange-700 border-orange-200' }, { id: 'streak_30', name: 'Inabalável', description: '30 dias de comunhão diária ininterrupta.', icon: '⛰️', category: 'streak', requirement: 30, color: 'bg-orange-100 text-orange-700 border-orange-200' }, { id: 'supporter_seed', name: 'Selo Semeador', description: 'Plantou uma semente de fé tornando-se Semeador.', icon: '🌾', category: 'supporter', color: 'bg-lime-100 text-lime-700 border-lime-200' }, { id: 'supporter_faithful', name: 'Selo Fiel', description: 'Investiu na obra tornando-se Fiel.', icon: '🕊️', category: 'supporter', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' }, { id: 'supporter_visionary', name: 'Selo Visionário', description: 'Visão de águia que impulsiona o projeto (Plano Ouro).', icon: '🦅', category: 'supporter', color: 'bg-amber-100 text-amber-700 border-amber-200' }, { id: 'event_early', name: 'Pioneiro', description: 'Esteve presente no lançamento do App.', icon: '🚀', category: 'event', color: 'bg-gray-800 text-white border-gray-600' }];
export const AFFILIATE_PRODUCTS = [{ id: 'biblia-thompson', title: 'Bíblia Thompson', description: 'O mapa do tesouro das Escrituras.', image: 'https://images.unsplash.com/photo-1499652848871-1527a310b13a?auto=format&fit=crop&q=80&w=400', link: 'https://www.amazon.com.br/s?k=biblia+thompson&tag=gabrielamr-20', source: 'Amazon' }, { id: 'biblia-nvi', title: 'Bíblia NVI Estudo', description: 'Mergulhe na história com clareza.', image: 'https://images.unsplash.com/photo-1507842217121-ca1958b94ec8?auto=format&fit=crop&q=80&w=400', link: 'https://www.amazon.com.br/s?k=biblia+nvi+estudo&tag=gabrielamr-20', source: 'Amazon' }, { id: 'livro-cs-lewis', title: 'Cristianismo Puro e Simples', description: 'A razão encontra a fé.', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400', link: 'https://www.amazon.com.br/s?k=cristianismo+puro+e+simples&tag=gabrielamr-20', source: 'Amazon' }, { id: 'biblia-king-james', title: 'King James 1611', description: 'A beleza clássica da tradição.', image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400', link: 'https://lista.mercadolivre.com.br/biblia-king-james-1611', source: 'Mercado Livre' }, { id: 'comentario-moody', title: 'Comentário Moody', description: 'Profundidade em cada versículo.', image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=400', link: 'https://lista.mercadolivre.com.br/comentario-biblico-moody', source: 'Mercado Livre' }];
export const BIBLE_BOOKS_LIST = [{ id: 'gn', name: 'Gênesis', subtitle: 'O Começo de Tudo', testament: 'old' }, { id: 'ex', name: 'Êxodo', subtitle: 'O Caminho da Liberdade', testament: 'old' }, { id: 'lv', name: 'Levítico', subtitle: 'Guia de Santidade', testament: 'old' }, { id: 'nm', name: 'Números', subtitle: 'Jornada no Deserto', testament: 'old' }, { id: 'dt', name: 'Deuteronômio', subtitle: 'A Lei Repetida', testament: 'old' }, { id: 'js', name: 'Josué', subtitle: 'Terra Conquistada', testament: 'old' }, { id: 'jz', name: 'Juízes', subtitle: 'Heróis Improváveis', testament: 'old' }, { id: 'rt', name: 'Rute', subtitle: 'Uma História de Amor', testament: 'old' }, { id: '1sm', name: '1 Samuel', subtitle: 'A Voz de Deus', testament: 'old' }, { id: '2sm', name: '2 Samuel', subtitle: 'Coração de Rei', testament: 'old' }, { id: '1rs', name: '1 Reis', subtitle: 'Glória e Ruína', testament: 'old' }, { id: '2rs', name: '2 Reis', subtitle: 'Fim do Reino', testament: 'old' }, { id: '1cr', name: '1 Crônicas', subtitle: 'Raízes da Fé', testament: 'old' }, { id: '2cr', name: '2 Crônicas', subtitle: 'Casa de Deus', testament: 'old' }, { id: 'ed', name: 'Esdras', subtitle: 'O Povo Volta', testament: 'old' }, { id: 'ne', name: 'Neemias', subtitle: 'Muros Erguidos', testament: 'old' }, { id: 'et', name: 'Ester', subtitle: 'Rainha Corajosa', testament: 'old' }, { id: 'jo', name: 'Jó', subtitle: 'Fé na Dol', testament: 'old' }, { id: 'sl', name: 'Salmos', subtitle: 'Canções da Alma', testament: 'old' }, { id: 'pv', name: 'Provérbios', subtitle: 'Sabedoria Prática', testament: 'old' }, { id: 'ec', name: 'Eclesiastes', subtitle: 'Sentido da Vida', testament: 'old' }, { id: 'ct', name: 'Cânticos', subtitle: 'Poema de Amor', testament: 'old' }, { id: 'is', name: 'Isaías', subtitle: 'O Grande Profeta', testament: 'old' }, { id: 'jr', name: 'Jeremias', subtitle: 'Chamado Difícil', testament: 'old' }, { id: 'lm', name: 'Lamentações', subtitle: 'Choro e Esperança', testament: 'old' }, { id: 'ez', name: 'Ezequiel', subtitle: 'Visões do Céu', testament: 'old' }, { id: 'dn', name: 'Daniel', subtitle: 'Fé na Cova', testament: 'old' }, { id: 'os', name: 'Oseias', subtitle: 'Amor Incondicional', testament: 'old' }, { id: 'jl', name: 'Joel', subtitle: 'O Dia do Senhor', testament: 'old' }, { id: 'am', name: 'Amós', subtitle: 'Justiça Social', testament: 'old' }, { id: 'ob', name: 'Obadias', subtitle: 'Julgamento', testament: 'old' }, { id: 'jn', name: 'Jonas', subtitle: 'O Missionário Fugitivo', testament: 'old' }, { id: 'mq', name: 'Miqueias', subtitle: 'Justiça e Misericórdia', testament: 'old' }, { id: 'na', name: 'Naum', subtitle: 'O Fim de Nínive', testament: 'old' }, { id: 'hc', name: 'Habacuque', subtitle: 'Perguntas a Deus', testament: 'old' }, { id: 'sf', name: 'Sofonias', subtitle: 'O Dia da Ira', testament: 'old' }, { id: 'ag', name: 'Ageu', subtitle: 'Reconstruindo o Templo', testament: 'old' }, { id: 'zc', name: 'Zacarias', subtitle: 'Visões Futuras', testament: 'old' }, { id: 'ml', name: 'Malaquias', subtitle: 'O Mensageiro', testament: 'old' }, { id: 'tb', name: 'Tobias', subtitle: 'Proteção de Rafael', testament: 'apocryphal' }, { id: 'jdt', name: 'Judite', subtitle: 'A Coragem de uma Mulher', testament: 'apocryphal' }, { id: 'sab', name: 'Sabedoria', subtitle: 'Sabedoria de Salomão', testament: 'apocryphal' }, { id: 'eclo', name: 'Eclesiástico', subtitle: 'Sabedoria de Sirácida', testament: 'apocryphal' }, { id: 'br', name: 'Baruque', subtitle: 'Profecia no Exílio', testament: 'apocryphal' }, { id: '1mc', name: '1 Macabeus', subtitle: 'A Luta pela Fé', testament: 'apocryphal' }, { id: '2mc', name: '2 Macabeus', subtitle: 'Martírio e Resistência', testament: 'apocryphal' }, { id: 'mt', name: 'Mateus', subtitle: 'O Rei Messias', testament: 'new' }, { id: 'mc', name: 'Marcos', subtitle: 'O Servo Sofredor', testament: 'new' }, { id: 'lc', name: 'Lucas', subtitle: 'O Filho do Homem', testament: 'new' }, { id: 'joao', name: 'João', subtitle: 'O Filho de Deus', testament: 'new' }, { id: 'at', name: 'Atos', subtitle: 'O Espírito em Ação', testament: 'new' }, { id: 'rm', name: 'Romanos', subtitle: 'O Evangelho da Graça', testament: 'new' }, { id: '1co', name: '1 Coríntios', subtitle: 'Problemas na Igreja', testament: 'new' }, { id: '2co', name: '2 Coríntios', subtitle: 'O Ministério', testament: 'new' }, { id: 'gl', name: 'Gálatas', subtitle: 'Liberdade em Cristo', testament: 'new' }, { id: 'ef', name: 'Efésios', subtitle: 'A Igreja Gloriosa', testament: 'new' }, { id: 'fp', name: 'Filipenses', subtitle: 'Alegria em Cristo', testament: 'new' }, { id: 'cl', name: 'Colossenses', subtitle: 'Supremacia de Cristo', testament: 'new' }, { id: '1ts', name: '1 Tessalonicenses', subtitle: 'A Volta de Cristo', testament: 'new' }, { id: '2ts', name: '2 Tessalonicenses', subtitle: 'O Dia do Senhor', testament: 'new' }, { id: '1tm', name: '1 Timóteo', subtitle: 'Liderança', testament: 'new' }, { id: '2tm', name: '2 Timóteo', subtitle: 'Fidelidade', testament: 'new' }, { id: 'tt', name: 'Tito', subtitle: 'Boas Obras', testament: 'new' }, { id: 'fm', name: 'Filemom', subtitle: 'Perdão', testament: 'new' }, { id: 'hb', name: 'Hebreus', subtitle: 'Superioridade de Cristo', testament: 'new' }, { id: 'tg', name: 'Tiago', subtitle: 'Fé em Ação', testament: 'new' }, { id: '1pe', name: '1 Pedro', subtitle: 'Esperança Viva', testament: 'new' }, { id: '2pe', name: '2 Pedro', subtitle: 'Cuidado com o Erro', testament: 'new' }, { id: '1jo', name: '1 João', subtitle: 'Certeza da Salvação', testament: 'new' }, { id: '2jo', name: '2 João', subtitle: 'A Verdade', testament: 'new' }, { id: '3jo', name: '3 João', subtitle: 'Hospitalidade', testament: 'new' }, { id: 'jd', name: 'Judas', subtitle: 'Batalha pela Fé', testament: 'new' }, { id: 'ap', name: 'Apocalipse', subtitle: 'A Vitória Final', testament: 'new' }];
export const DAILY_BREAD: Devotional = { date: "Hoje", title: "Pão da Vida", verseReference: "João 6:35", verseText: "Declarou-lhes Jesus: Eu sou o pão da vida; o que vem a mim jamais terá fome; e o que crê em mim jamais terá sede.", content: "Jesus não apenas nos dá o pão, Ele É o pão. Ele sustenta nossa alma e satisfaz nossa fome espiritual mais profunda. Busque-o hoje e encontre satisfação plena.", prayer: "Senhor Jesus, tu és o meu sustento. Alimenta minha alma hoje com a tua presença." };
export const OFFLINE_DEVOTIONALS: Devotional[] = [{ date: "Fallback", title: "Confiança Inabalável", verseReference: "Salmos 56:3", verseText: "Em qualquer tempo em que eu temer, confiarei em ti.", content: "O medo é uma reação natural, mas a fé é uma decisão sobrenatural. Quando o medo bater à porta, não o convide para entrar; em vez disso, declare sua confiança no Deus que é maior que qualquer problema.", prayer: "Senhor, quando o medo vier, ajuda-me a lembrar que Tu és maior e que posso confiar plenamente em Ti." }];
export const STATIC_QUIZZES: Record<string, QuizQuestion[]> = { 'heroes': [{ id: 101, question: "Quem foi engolido por um grande peixe após tentar fugir de Deus?", options: ["Moisés", "Jonas", "Noé", "Pedro"], correctIndex: 1, explanation: "Jonas tentou fugir para Társis, mas foi engolido por um grande peixe preparado por Deus.", reference: "Jonas 1:17" }, { id: 102, question: "Quem derrotou o gigante Golias com uma pedra?", options: ["Saul", "Davi", "Sansão", "Gideão"], correctIndex: 1, explanation: "Davi, ainda jovem, derrotou Golias confiando no nome do Senhor.", reference: "1 Samuel 17:50" }] };
export const BIBLE_DATA: Book[] = [{ id: 'gn', name: 'Gênesis', testament: 'old', chapters: [{ number: 1, verses: [{ number: 1, text: "No princípio criou Deus o céu e a terra." }, { number: 2, text: "E a terra era sem forma e vazia; e havia trevas sobre a face do abismo; e o Espírito de Deus se movia sobre a face das águas." }, { number: 3, text: "E disse Deus: Haja luz; e houve luz." }, { number: 4, text: "E viu Deus que era boa a luz; e fez Deus separação entre a luz e as trevas." }, { number: 5, text: "E Deus chamou à luz Dia; e às trevas chamou Noite. E foi a tarde e a manhã, o dia primeiro." }, { number: 6, text: "E disse Deus: Haja uma expansão no meio das águas, e haja separação entre águas e águas." }, { number: 7, text: "E fez Deus a expansão, e fez separação entre as águas que estavam debaixo da expansão e as águas que estavam sobre a expansão; e assim foi." }, { number: 8, text: "E chamou Deus à expansão Céus, e foi a tarde e a manhã, o dia segundo." }, { number: 9, text: "E disse Deus: Ajuntem-se as águas debaixo dos céus num lugar; e apareça a porção seca; e assim foi." }, { number: 10, text: "E chamou Deus à porção seca Terra; e ao ajuntamento das águas chamou Mares; e viu Deus que era bom." }, { number: 11, text: "E disse Deus: Produza a terra erva verde, erva que dê semente, árvore frutífera que dê fruto segundo a sua espécie, cuja semente está nela sobre a terra; e assim foi." }, { number: 12, text: "E a terra produziu erva, erva dando semente conforme a sua espécie, e a árvore frutífera, cuja semente está nela conforme a sua espécie; e viu Deus que era bom." }, { number: 13, text: "E foi a tarde e a manhã, o dia terceiro." }, { number: 14, text: "E disse Deus: Haja luminares na expansão dos céus, para haver separação entre o dia e a noite; e sejam eles para sinais e para tempos determinados e para dias e anos." }, { number: 15, text: "E sejam para luminares na expansão dos céus, para iluminar a terra; e assim foi." }, { number: 16, text: "E fez Deus os dois grandes luminares: o luminar maior para governar o dia, e o luminar menor para governar a noite; e fez as estrelas." }, { number: 17, text: "E Deus os pôs na expansão dos céus para iluminar a terra," }, { number: 18, text: "E para governar o dia e a noite, e para fazer separação entre a luz e as trevas; e viu Deus que era bom." }, { number: 19, text: "E foi a tarde e a manhã, o dia quarto." }, { number: 20, text: "E disse Deus: Produzam as águas abundantemente répteis de alma vivente; e voem as aves sobre a terra voem na expansão dos céus." }, { number: 21, text: "E Deus criou as grandes baleias, e todo o réptil de alma vivente que as águas abundantemente produziram conforme as suas espécies; e toda a ave de asas conforme a sua espécie; e viu Deus que era bom." }, { number: 22, text: "E Deus os abençoou, dizendo: Frutificai e multiplicai-vos, e enchei as águas nos mares; e as aves se multipliquem na terra." }, { number: 23, text: "E foi a tarde e a manhã, o dia quinto." }, { number: 24, text: "E disse Deus: Produza a terra alma vivente conforme a sua espécie; gado, e répteis e feras da terra conforme a sua espécie; e assim foi." }, { number: 25, text: "E fez Deus as feras da terra conforme a sua espécie, e o gado conforme a sua espécie, e todo o réptil da terra conforme a sua espécie; e viu Deus que era bom." }, { number: 26, text: "E disse Deus: Façamos o homem à nossa imagem, conforme a nossa semelhança; e domine sobre os peixes do mar, e sobre as aves dos céus, e sobre o gado, e sobre toda a terra, e sobre todo o réptil que se move sobre a terra." }, { number: 27, text: "E criou Deus o homem à sua imagem; à imagem de Deus o criou; homem e mulher os criou." }, { number: 28, text: "E Deus os abençoou, e Deus lhes disse: Frutificai e multiplicai-vos, e enchei a terra, e sujeitai-a; e dominai sobre os peixes do mar e sobre as aves dos céus, e sobre todo o animal que se move sobre a terra." }, { number: 29, text: "E disse Deus: Eis que vos tenho dado toda a erva que dá semente, que está sobre a face de toda a terra; e toda a árvore, em que há fruto que dê semente, ser-vos-á para mantimento." }, { number: 30, text: "E a todo o animal da terra, e a toda a ave dos céus, e a toda a réptil da terra, em que há alma vivente, toda a erva verde será para mantimento; e assim foi." }, { number: 31, text: "E viu Deus tudo quanto tinha feito, e eis que era muito bom; e foi a tarde e a manhã, o dia sexto." }] }] }, { id: 'sl', name: 'Salmos', testament: 'old', chapters: [{ number: 23, verses: [{ number: 1, text: "O SENHOR é o meu pastor, nada me faltará." }, { number: 2, text: "Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas." }, { number: 3, text: "Refrigera a minha alma; guia-me pelas veredas da justiça, por amor do seu nome." }, { number: 4, text: "Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam." }, { number: 5, text: "Preparas uma mesa perante mim na presença dos meus inimigos, unges a minha cabeça com óleo, o meu cálice transborda." }, { number: 6, text: "Certamente que a bondade e a misericórdia me seguirão todos os dias da minha vida; e habitarei na casa do Senhor por longos dias." }] }] }];
