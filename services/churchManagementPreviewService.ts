import {
  Award,
  Bell,
  CalendarDays,
  Car,
  CheckCircle2,
  Church,
  ClipboardList,
  Clock3,
  Eye,
  HeartHandshake,
  Home,
  KeyRound,
  Megaphone,
  Medal,
  QrCode,
  MessageSquareHeart,
  Send,
  ShieldCheck,
  Star,
  Trophy,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface ChurchMetricPreview {
  label: string;
  value: string;
  detail: string;
}

export interface ChurchActivityPreview {
  title: string;
  team: string;
  people: number;
  icon: LucideIcon;
  status: string;
}

export interface ChurchAlertPreview {
  text: string;
  severity: "info" | "warning" | "urgent";
}

export interface ChurchRecognitionPreview {
  label: string;
  text: string;
  mana: string;
  icon?: LucideIcon;
}

export interface MemberUpdatePreview {
  title: string;
  detail: string;
  status: string;
  icon: LucideIcon;
}

export interface MemberActionPreview {
  label: string;
  icon: LucideIcon;
}

export type ChurchQrFormType = "prayer" | "volunteer" | "visitor" | "pastor_care" | "group";

export interface ChurchQrFormFieldPreview {
  label: string;
  type: "text" | "tel" | "email" | "textarea" | "select";
  required?: boolean;
  options?: string[];
}

export interface ChurchQrFormPreview {
  token: string;
  title: string;
  type: ChurchQrFormType;
  description: string;
  status: "Ativo" | "Pausado" | "Expira em breve";
  scans: number;
  submissions: number;
  destination: string;
  privacy: string;
  confirmation: string;
  icon: LucideIcon;
  fields: ChurchQrFormFieldPreview[];
}

export type ChurchInboxType = "prayer" | "volunteer" | "visitor" | "pastor_care" | "group";
export type ChurchInboxStatus = "Recebido" | "Atribuido" | "Em acompanhamento" | "Aguardando membro" | "Encerrado";
export type ChurchInboxPriority = "Normal" | "Alta" | "Urgente";

export interface ChurchInboxItemPreview {
  id: string;
  title: string;
  source: string;
  type: ChurchInboxType;
  status: ChurchInboxStatus;
  publicStatus: string;
  priority: ChurchInboxPriority;
  assignee: string;
  submittedBy: string;
  submittedAt: string;
  lastUpdate: string;
  privacy: string;
  summary: string;
  nextAction: string;
  icon: LucideIcon;
}

export type ChurchAssignmentStatus = "Ativa" | "Aguardando aceite" | "Recusada" | "Pausada";
export type ChurchAssignmentScope = "Igreja" | "Culto" | "Grupo" | "Evento";

export interface ChurchAssignmentPreview {
  id: string;
  title: string;
  team: string;
  scope: ChurchAssignmentScope;
  status: ChurchAssignmentStatus;
  leader: string;
  volunteers: number;
  pendingInvites: number;
  nextService: string;
  description: string;
  memberFeedback: string;
  icon: LucideIcon;
}

export interface ChurchTeamPreview {
  id: string;
  title: string;
  area: string;
  leader: string;
  members: number;
  openSpots: number;
  nextAction: string;
  health: "Saudavel" | "Precisa reforco" | "Aguardando lider";
  description: string;
  icon: LucideIcon;
}

export interface ChurchRolePreview {
  id: string;
  title: string;
  profile: "Gestor da Igreja" | "Pastor" | "Lider" | "Voluntario";
  scope: string;
  canSeeSensitiveCare: boolean;
  canManageOperations: boolean;
  canAssignVolunteers: boolean;
  people: number;
  description: string;
  guardrail: string;
  icon: LucideIcon;
}

export interface ChurchNotificationPreview {
  id: string;
  title: string;
  audience: string;
  trigger: string;
  channel: "Dashboard" | "Minha Igreja" | "Ambos";
  severity: "Info" | "Acao" | "Urgente";
  dedupeKey: string;
  text: string;
  icon: LucideIcon;
}

export const churchMetricsPreview: ChurchMetricPreview[] = [
  { label: "Pedidos abertos", value: "24", detail: "8 aguardando responsavel" },
  { label: "Designacoes ativas", value: "86", detail: "12 aguardando aceite" },
  { label: "Equipes de servico", value: "14", detail: "3 precisam de voluntarios" },
  { label: "Insignias entregues", value: "128", detail: "Neste trimestre" },
];

export const churchActivitiesPreview: ChurchActivityPreview[] = [
  { title: "Cuidador de criancas", team: "Kids", people: 18, icon: HeartHandshake, status: "Ativa" },
  { title: "Portaria", team: "Boas-vindas", people: 12, icon: Users, status: "2 vagas" },
  { title: "Organizar carros", team: "Estacionamento", people: 9, icon: Car, status: "Precisa reforco" },
  { title: "Midia e projecao", team: "Producao", people: 7, icon: ClipboardList, status: "Ativa" },
];

export const churchAlertsPreview: ChurchAlertPreview[] = [
  { text: "3 designacoes aguardando aceite ha mais de 3 dias", severity: "warning" },
  { text: "Equipe de estacionamento precisa de 2 voluntarios domingo", severity: "urgent" },
  { text: "5 pedidos de oracao sem responsavel definido", severity: "urgent" },
  { text: "QR de voluntariado expira em 2 dias", severity: "info" },
];

export const churchRecognitionPreview: ChurchRecognitionPreview[] = [
  { label: "Servo constante", text: "4 escalas confirmadas no mes", mana: "+40 Mana", icon: Medal },
  { label: "Boas-vindas", text: "Atuacao em recepcao/portaria", mana: "+15 Mana", icon: Award },
  { label: "Cuidado kids", text: "Servico em equipe de criancas", mana: "+20 Mana", icon: HeartHandshake },
];

export const churchRoadmapPreview = [
  "Roles e permissoes",
  "Atividades e designacoes",
  "Equipes de servico",
  "QR e formularios",
  "Inbox pastoral",
  "Meu Acompanhamento",
  "Insignias e Mana",
];

export const churchQrFormsPreview: ChurchQrFormPreview[] = [
  {
    token: "oracao-domingo",
    title: "Pedido de oracao",
    type: "prayer",
    description: "Formulario acolhedor para pedidos privados de oracao enviados por QR no culto ou recepcao.",
    status: "Ativo",
    scans: 184,
    submissions: 37,
    destination: "Inbox pastoral",
    privacy: "Apenas equipe pastoral autorizada pode ler o conteudo.",
    confirmation: "Recebemos seu pedido. Nossa equipe pastoral vai acompanhar com cuidado e discricao.",
    icon: MessageSquareHeart,
    fields: [
      { label: "Nome", type: "text" },
      { label: "Telefone ou email", type: "text" },
      { label: "Pedido de oracao", type: "textarea", required: true },
      { label: "Preferencia de contato", type: "select", options: ["WhatsApp", "Email", "Nao preciso de retorno"] },
    ],
  },
  {
    token: "voluntariado-servir",
    title: "Quero ser voluntario",
    type: "volunteer",
    description: "Entrada para interessados em servir em criancas, portaria, estacionamento, midia ou apoio em eventos.",
    status: "Expira em breve",
    scans: 96,
    submissions: 22,
    destination: "Pipeline de voluntariado",
    privacy: "Lideres autorizados veem apenas os dados necessarios para contato e encaminhamento.",
    confirmation: "Recebemos seu interesse em servir. A lideranca vai avaliar o melhor encaminhamento.",
    icon: UserPlus,
    fields: [
      { label: "Nome", type: "text", required: true },
      { label: "Telefone", type: "tel", required: true },
      { label: "Area de interesse", type: "select", options: ["Criancas", "Portaria", "Estacionamento", "Midia", "Eventos"] },
      { label: "Disponibilidade", type: "textarea" },
    ],
  },
  {
    token: "visitante-boas-vindas",
    title: "Sou visitante",
    type: "visitor",
    description: "Cadastro simples para boas-vindas, contato e convite para grupo/celula.",
    status: "Ativo",
    scans: 142,
    submissions: 41,
    destination: "Equipe de boas-vindas",
    privacy: "Apenas equipe de acolhimento autorizada recebe os dados de contato.",
    confirmation: "Que alegria receber voce. A equipe de boas-vindas vai cuidar do proximo passo.",
    icon: Church,
    fields: [
      { label: "Nome", type: "text", required: true },
      { label: "Telefone", type: "tel" },
      { label: "Voce deseja conhecer um grupo?", type: "select", options: ["Sim", "Ainda nao", "Quero conversar antes"] },
    ],
  },
  {
    token: "conversar-pastor",
    title: "Quero conversar com o pastor",
    type: "pastor_care",
    description: "Solicitacao restrita para acompanhamento pastoral com linguagem cuidadosa e privacidade clara.",
    status: "Ativo",
    scans: 51,
    submissions: 9,
    destination: "Cuidado pastoral",
    privacy: "Conteudo restrito a pastor ou responsavel pastoral autorizado.",
    confirmation: "Sua solicitacao foi recebida. A igreja vai organizar um retorno pastoral com discricao.",
    icon: HeartHandshake,
    fields: [
      { label: "Nome", type: "text", required: true },
      { label: "Contato", type: "text", required: true },
      { label: "Como podemos ajudar?", type: "textarea", required: true },
    ],
  },
  {
    token: "entrar-grupo",
    title: "Quero entrar em um grupo",
    type: "group",
    description: "Interesse em celula/grupo com encaminhamento para lideranca responsavel.",
    status: "Pausado",
    scans: 74,
    submissions: 15,
    destination: "Grupos e discipulado",
    privacy: "Lideres de grupo recebem apenas o necessario para acolhimento e contato.",
    confirmation: "Recebemos seu interesse. Um lider vai ajudar voce a encontrar um grupo.",
    icon: Users,
    fields: [
      { label: "Nome", type: "text", required: true },
      { label: "Telefone", type: "tel", required: true },
      { label: "Melhor dia/periodo", type: "text" },
    ],
  },
];

export const getChurchQrFormPreviewByToken = (token: string) =>
  churchQrFormsPreview.find((form) => form.token === token);

export const churchInboxItemsPreview: ChurchInboxItemPreview[] = [
  {
    id: "inbox-001",
    title: "Pedido de oracao recebido",
    source: "QR Pedido de oracao",
    type: "prayer",
    status: "Recebido",
    publicStatus: "Recebido pela igreja",
    priority: "Alta",
    assignee: "Sem responsavel",
    submittedBy: "Membro identificado",
    submittedAt: "Hoje, 08:42",
    lastUpdate: "Sem retorno ainda",
    privacy: "Restrito a equipe pastoral autorizada",
    summary: "Pedido privado recebido pelo QR do culto. Conteudo sensivel deve abrir apenas no detalhe protegido.",
    nextAction: "Atribuir responsavel pastoral",
    icon: MessageSquareHeart,
  },
  {
    id: "inbox-002",
    title: "Interesse em voluntariado",
    source: "QR Quero ser voluntario",
    type: "volunteer",
    status: "Atribuido",
    publicStatus: "Encaminhado para lideranca",
    priority: "Normal",
    assignee: "Lider Boas-vindas",
    submittedBy: "Visitante com contato",
    submittedAt: "Hoje, 10:15",
    lastUpdate: "Atribuido ha 35 min",
    privacy: "Dados visiveis apenas para lideranca autorizada",
    summary: "Pessoa demonstrou interesse em servir em portaria ou recepcao aos domingos.",
    nextAction: "Enviar convite para conversa inicial",
    icon: UserPlus,
  },
  {
    id: "inbox-003",
    title: "Visitante deseja conhecer grupo",
    source: "QR Sou visitante",
    type: "visitor",
    status: "Em acompanhamento",
    publicStatus: "Equipe de boas-vindas acompanhando",
    priority: "Normal",
    assignee: "Equipe Boas-vindas",
    submittedBy: "Visitante",
    submittedAt: "Ontem, 19:58",
    lastUpdate: "Contato feito ontem",
    privacy: "Contato restrito a equipe de acolhimento",
    summary: "Visitante pediu informacoes sobre grupo/celula durante o culto da noite.",
    nextAction: "Sugerir grupo proximo",
    icon: Church,
  },
  {
    id: "inbox-004",
    title: "Solicitacao de conversa pastoral",
    source: "QR Quero conversar com o pastor",
    type: "pastor_care",
    status: "Aguardando membro",
    publicStatus: "Aguardando melhor horario",
    priority: "Urgente",
    assignee: "Pastor responsavel",
    submittedBy: "Membro identificado",
    submittedAt: "Ontem, 21:10",
    lastUpdate: "Mensagem enviada hoje",
    privacy: "Restrito a pastor ou responsavel pastoral autorizado",
    summary: "Solicitacao sensivel. A inbox mostra apenas resumo operacional; detalhe precisa de permissao pastoral.",
    nextAction: "Aguardar confirmacao de horario",
    icon: HeartHandshake,
  },
  {
    id: "inbox-005",
    title: "Interesse em grupo de discipulado",
    source: "QR Quero entrar em um grupo",
    type: "group",
    status: "Encerrado",
    publicStatus: "Encaminhado para grupo",
    priority: "Normal",
    assignee: "Lider de grupos",
    submittedBy: "Membro",
    submittedAt: "Segunda, 14:20",
    lastUpdate: "Encerrado ontem",
    privacy: "Apenas lideranca de grupos",
    summary: "Membro foi encaminhado para um grupo com disponibilidade no meio da semana.",
    nextAction: "Sem acao pendente",
    icon: Users,
  },
];

export const churchInboxSummaryPreview = [
  { label: "Recebidos hoje", value: "12", detail: "4 ainda sem responsavel", icon: Bell },
  { label: "Alta prioridade", value: "5", detail: "Inclui cuidado pastoral", icon: ShieldCheck },
  { label: "Aguardando membro", value: "3", detail: "Retorno ja enviado", icon: Send },
  { label: "Status visivel", value: "100%", detail: "Todo item tem retorno publico", icon: Eye },
];

export const churchAssignmentsPreview: ChurchAssignmentPreview[] = [
  {
    id: "assignment-kids",
    title: "Cuidador de criancas",
    team: "Kids",
    scope: "Culto",
    status: "Ativa",
    leader: "Lider Kids",
    volunteers: 18,
    pendingInvites: 2,
    nextService: "Domingo, 18h",
    description: "Apoio em sala infantil com escala, checagem de presenca e dupla responsavel.",
    memberFeedback: "Voce esta ativo na equipe Kids para o culto de domingo.",
    icon: HeartHandshake,
  },
  {
    id: "assignment-door",
    title: "Portaria e recepcao",
    team: "Boas-vindas",
    scope: "Igreja",
    status: "Aguardando aceite",
    leader: "Coordenador Boas-vindas",
    volunteers: 12,
    pendingInvites: 4,
    nextService: "Domingo, 09h",
    description: "Recepcao, orientacao de visitantes e apoio na entrada principal.",
    memberFeedback: "Voce recebeu um convite para servir em portaria e precisa aceitar ou recusar.",
    icon: Users,
  },
  {
    id: "assignment-parking",
    title: "Organizar carros",
    team: "Estacionamento",
    scope: "Evento",
    status: "Ativa",
    leader: "Lider Estacionamento",
    volunteers: 9,
    pendingInvites: 1,
    nextService: "Conferencia, sabado",
    description: "Apoio no fluxo de entrada, vagas, sinalizacao e seguranca do estacionamento.",
    memberFeedback: "Sua equipe de estacionamento tem uma escala ativa para o proximo evento.",
    icon: Car,
  },
  {
    id: "assignment-homegroup",
    title: "Acolhimento em grupo",
    team: "Grupos e discipulado",
    scope: "Grupo",
    status: "Pausada",
    leader: "Lider de grupos",
    volunteers: 6,
    pendingInvites: 0,
    nextService: "Sem agenda",
    description: "Acolhimento de novos membros e visitantes encaminhados para grupos.",
    memberFeedback: "Esta atividade esta pausada pela lideranca no momento.",
    icon: Home,
  },
];

export const memberAssignmentsPreview = [
  {
    id: "member-door",
    title: "Portaria e recepcao",
    team: "Boas-vindas",
    status: "Aguardando aceite" as ChurchAssignmentStatus,
    nextService: "Domingo, 09h",
    leader: "Coordenador Boas-vindas",
    feedback: "Confirme se voce pode servir nesta atividade. A lideranca sera avisada da sua resposta.",
    icon: Users,
  },
  {
    id: "member-parking",
    title: "Organizar carros",
    team: "Estacionamento",
    status: "Ativa" as ChurchAssignmentStatus,
    nextService: "Conferencia, sabado",
    leader: "Lider Estacionamento",
    feedback: "Voce esta confirmado nesta equipe. Mudancas importantes vao aparecer aqui.",
    icon: Car,
  },
  {
    id: "member-kids",
    title: "Cuidador de criancas",
    team: "Kids",
    status: "Ativa" as ChurchAssignmentStatus,
    nextService: "Domingo, 18h",
    leader: "Lider Kids",
    feedback: "Voce esta ativo na escala Kids. Reconhecimento e Mana dependem de evento auditavel.",
    icon: HeartHandshake,
  },
];

export const churchTeamsPreview: ChurchTeamPreview[] = [
  {
    id: "team-welcome",
    title: "Boas-vindas",
    area: "Portaria e recepcao",
    leader: "Coordenador Boas-vindas",
    members: 12,
    openSpots: 2,
    nextAction: "Confirmar escala de domingo",
    health: "Precisa reforco",
    description: "Equipe de recepcao, visitantes e apoio de entrada.",
    icon: Users,
  },
  {
    id: "team-kids",
    title: "Kids",
    area: "Cuidador de criancas",
    leader: "Lider Kids",
    members: 18,
    openSpots: 0,
    nextAction: "Validar dupla responsavel",
    health: "Saudavel",
    description: "Cuidado infantil com escala, presenca e responsaveis definidos.",
    icon: HeartHandshake,
  },
  {
    id: "team-parking",
    title: "Estacionamento",
    area: "Organizar carros",
    leader: "Lider Estacionamento",
    members: 9,
    openSpots: 3,
    nextAction: "Convidar voluntarios para evento",
    health: "Precisa reforco",
    description: "Fluxo de veiculos, seguranca de entrada e apoio em eventos.",
    icon: Car,
  },
  {
    id: "team-groups",
    title: "Grupos e discipulado",
    area: "Acolhimento em grupo",
    leader: "Aguardando definicao",
    members: 6,
    openSpots: 1,
    nextAction: "Definir lider responsavel",
    health: "Aguardando lider",
    description: "Encaminhamento de membros e visitantes para grupos/celulas.",
    icon: Home,
  },
];

export const churchRolesPreview: ChurchRolePreview[] = [
  {
    id: "role-manager",
    title: "Operacao da igreja",
    profile: "Gestor da Igreja",
    scope: "Igreja",
    canSeeSensitiveCare: false,
    canManageOperations: true,
    canAssignVolunteers: true,
    people: 2,
    description: "Administra equipes, QR, formularios, designacoes e dashboard operacional.",
    guardrail: "Nao recebe acesso pastoral sensivel automaticamente.",
    icon: KeyRound,
  },
  {
    id: "role-pastor",
    title: "Cuidado pastoral",
    profile: "Pastor",
    scope: "Igreja",
    canSeeSensitiveCare: true,
    canManageOperations: false,
    canAssignVolunteers: false,
    people: 3,
    description: "Acompanha pedidos pastorais, oracao e cuidado sensivel quando autorizado.",
    guardrail: "Nao vira gestor administrativo sem role explicito.",
    icon: HeartHandshake,
  },
  {
    id: "role-leader",
    title: "Lider de equipe",
    profile: "Lider",
    scope: "Equipe/Grupo",
    canSeeSensitiveCare: false,
    canManageOperations: false,
    canAssignVolunteers: true,
    people: 8,
    description: "Gerencia uma equipe, confirma escala e acompanha voluntarios no seu escopo.",
    guardrail: "Nao acessa dados fora da propria equipe sem permissao.",
    icon: Users,
  },
  {
    id: "role-volunteer",
    title: "Servico voluntario",
    profile: "Voluntario",
    scope: "Proprias designacoes",
    canSeeSensitiveCare: false,
    canManageOperations: false,
    canAssignVolunteers: false,
    people: 42,
    description: "Aceita ou recusa designacoes, acompanha agenda e recebe feedback.",
    guardrail: "Ve apenas suas proprias informacoes e equipes permitidas.",
    icon: ShieldCheck,
  },
];

export const churchNotificationsPreview: ChurchNotificationPreview[] = [
  {
    id: "notify-new-request",
    title: "Novo pedido recebido",
    audience: "Pastor ou responsavel atribuido",
    trigger: "Submissao via QR/formulario",
    channel: "Dashboard",
    severity: "Urgente",
    dedupeKey: "church:request:new",
    text: "Gera alerta acionavel sem expor conteudo sensivel no resumo.",
    icon: MessageSquareHeart,
  },
  {
    id: "notify-assignment",
    title: "Designacao atribuida",
    audience: "Voluntario convidado",
    trigger: "Convite criado por gestor/lider",
    channel: "Minha Igreja",
    severity: "Acao",
    dedupeKey: "member:assignment:pending",
    text: "Mostra aceitar/recusar e avisa a lideranca quando houver resposta.",
    icon: ClipboardList,
  },
  {
    id: "notify-qr-expiring",
    title: "QR expirando",
    audience: "Gestor da Igreja",
    trigger: "Formulario perto da data limite",
    channel: "Dashboard",
    severity: "Info",
    dedupeKey: "church:qr:expiring",
    text: "Evita QR antigo em slide, cartaz ou recepcao.",
    icon: QrCode,
  },
  {
    id: "notify-care-followup",
    title: "Follow-up aguardando membro",
    audience: "Membro e responsavel pastoral",
    trigger: "Status muda para aguardando membro",
    channel: "Ambos",
    severity: "Acao",
    dedupeKey: "care:waiting-member",
    text: "Da retorno claro ao membro sem revelar notas internas.",
    icon: Bell,
  },
];

export const churchBadgeRulesPreview = [
  {
    title: "Servo constante",
    rule: "Confirmar escalas recorrentes no periodo",
    manaLimit: "+40 Mana/mes",
    visibility: "Privada ou equipe",
    icon: Trophy,
  },
  {
    title: "Boas-vindas",
    rule: "Servir em portaria, recepcao ou acolhimento",
    manaLimit: "+15 Mana/evento",
    visibility: "Minha Igreja",
    icon: Award,
  },
  {
    title: "Cuidado kids",
    rule: "Participar de atividade auditavel com criancas",
    manaLimit: "+20 Mana/evento",
    visibility: "Minha Igreja",
    icon: Star,
  },
  {
    title: "Disponibilidade",
    rule: "Aceitar convite e confirmar presenca sem atraso",
    manaLimit: "+10 Mana/evento",
    visibility: "Privada",
    icon: CheckCircle2,
  },
];

export const memberUpdatesPreview: MemberUpdatePreview[] = [
  {
    title: "Pedido de oracao recebido",
    detail: "Sua igreja recebeu o pedido e ele aparece para a equipe pastoral autorizada.",
    status: "Recebido pela igreja",
    icon: HeartHandshake,
  },
  {
    title: "Conversa pastoral",
    detail: "A equipe enviou um retorno e aguarda sua confirmacao de melhor horario.",
    status: "Aguardando voce",
    icon: MessageSquareHeart,
  },
  {
    title: "Designacao: Portaria",
    detail: "Voce foi convidado para servir na equipe de boas-vindas no domingo.",
    status: "Aguardando aceite",
    icon: Church,
  },
  {
    title: "Equipe: Estacionamento",
    detail: "Voce esta ativo na equipe que organiza carros no culto da noite.",
    status: "Ativo",
    icon: Users,
  },
  {
    title: "Voluntariado",
    detail: "Seu interesse em servir foi encaminhado para a lideranca responsavel.",
    status: "Encaminhado",
    icon: CheckCircle2,
  },
];

export const memberBadgesPreview: ChurchRecognitionPreview[] = [
  { label: "Boas-vindas", text: "Servico em portaria/recepcao", mana: "+15 Mana", icon: Award },
  { label: "Servo disponivel", text: "Confirmou escala sem atraso", mana: "+10 Mana", icon: CheckCircle2 },
  { label: "Cuidado kids", text: "Apoio em atividade de criancas", mana: "+20 Mana", icon: HeartHandshake },
];

export const memberActionsPreview: MemberActionPreview[] = [
  { label: "Aceitar designacao de portaria", icon: CheckCircle2 },
  { label: "Confirmar disponibilidade domingo", icon: CalendarDays },
  { label: "Atualizar contato para retorno pastoral", icon: Bell },
];

export const memberInfoCardsPreview = [
  ["QR recebido", QrCode, "Seu envio fica registrado com status publico."] as const,
  ["Equipe visivel", Users, "Voce acompanha onde esta servindo."] as const,
  ["Notificacoes", Bell, "Mudancas importantes aparecem como retorno."] as const,
];

export const churchRulesPreview = [
  ["Designacao nao concede permissao sensivel sozinha.", ShieldCheck] as const,
  ["Atividade pode exigir aceite do voluntario.", CheckCircle2] as const,
  ["Insignias reconhecem servico, nao valor espiritual.", Medal] as const,
  ["Mana de servico precisa ser auditavel e limitado.", Clock3] as const,
];
