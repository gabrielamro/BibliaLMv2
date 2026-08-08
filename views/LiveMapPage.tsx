"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BookOpen,
  BookMarked,
  Brain,
  Briefcase,
  CalendarRange,
  CheckCircle2,
  Church,
  Coffee,
  Compass,
  Crown,
  FileText,
  HandHeart,
  History,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LucideIcon,
  Map,
  MessageCircle,
  Mic2,
  NotebookPen,
  PenLine,
  Radio,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Wand2,
  Zap,
} from 'lucide-react';
import SEO from '../components/SEO';

type AccessType = 'Livre' | 'Login' | 'Pastor' | 'Admin';
type ModuleId =
  | 'overview'
  | 'inicio'
  | 'estudo'
  | 'criar'
  | 'reino'
  | 'pastoral'
  | 'culto'
  | 'gamificacao'
  | 'sistema';

interface ModuleTheme {
  id: ModuleId;
  rf: string;
  label: string;
  shortLabel: string;
  title: string;
  subtitle: string;
  description: string;
  intent: string;
  icon: LucideIcon;
  accent: string;
  text: string;
  soft: string;
  border: string;
  button: string;
}

interface FeatureSpec {
  id: string;
  moduleId: Exclude<ModuleId, 'overview'>;
  name: string;
  route: string;
  description: string;
  audience: string;
  whenToUse: string;
  access: AccessType;
  keywords: string[];
  cta?: string;
}

const MODULES: ModuleTheme[] = [
  {
    id: 'overview',
    rf: 'RF-MV-006',
    label: 'Visao Geral',
    shortLabel: 'Geral',
    title: 'Mapa Vivo do Culto+',
    subtitle: 'Tudo que o Culto+ faz, organizado por jornada espiritual.',
    description: 'Uma pagina-guia para revelar as ferramentas do Culto+ sem tirar a Biblia do centro.',
    intent: 'Entender o produto em uma unica leitura.',
    icon: Map,
    accent: 'bg-bible-gold',
    text: 'text-bible-leather dark:text-bible-gold',
    soft: 'bg-[#f7efe1] dark:bg-[#241f17]',
    border: 'border-[#e5d4b3] dark:border-[#4a3b20]',
    button: 'bg-bible-gold text-white hover:bg-bible-leather',
  },
  {
    id: 'inicio',
    rf: 'RF-MV-007',
    label: 'Inicio',
    shortLabel: 'Inicio',
    title: 'Inicio / Santuario',
    subtitle: 'Resumo diario, continuidade e atalhos.',
    description: 'A Home organiza o que o usuario precisa para retomar leitura, devocional, estudos, criacao e Reino.',
    intent: 'Comecar bem o dia e continuar de onde parou.',
    icon: Home,
    accent: 'bg-[#c5a059]',
    text: 'text-[#8a6428] dark:text-[#e0bd74]',
    soft: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800/60',
    button: 'bg-[#c5a059] text-white hover:bg-[#5d4037]',
  },
  {
    id: 'estudo',
    rf: 'RF-MV-008',
    label: 'Biblia & Estudo',
    shortLabel: 'Estudo',
    title: 'Biblia & Estudo',
    subtitle: 'Leitura, notas, devocionais e aprofundamento.',
    description: 'O nucleo do Culto+: ler, compreender, anotar, revisar e transformar conhecimento em pratica.',
    intent: 'Aprofundar a Palavra com foco.',
    icon: BookOpen,
    accent: 'bg-blue-600',
    text: 'text-blue-700 dark:text-blue-300',
    soft: 'bg-blue-50 dark:bg-blue-950/25',
    border: 'border-blue-200 dark:border-blue-800/70',
    button: 'bg-blue-700 text-white hover:bg-blue-800',
  },
  {
    id: 'criar',
    rf: 'RF-MV-009',
    label: 'Criar com IA',
    shortLabel: 'Criar',
    title: 'Criar com IA',
    subtitle: 'Obreiro IA, arte, podcast e conteudo.',
    description: 'Ferramentas para gerar estudos, artes sacras, podcasts e materiais pastorais com a IA como apoio.',
    intent: 'Transformar estudo biblico em conteudo edificante.',
    icon: Wand2,
    accent: 'bg-pink-600',
    text: 'text-pink-700 dark:text-pink-300',
    soft: 'bg-pink-50 dark:bg-pink-950/20',
    border: 'border-pink-200 dark:border-pink-800/70',
    button: 'bg-pink-600 text-white hover:bg-pink-700',
  },
  {
    id: 'reino',
    rf: 'RF-MV-010',
    label: 'Reino',
    shortLabel: 'Reino',
    title: 'Reino',
    subtitle: 'Comunidade, igrejas, grupos e oracao.',
    description: 'O espaco comunitario para publicar reflexoes, interceder, encontrar igrejas e viver a fe em grupo.',
    intent: 'Cuidar de gente e fortalecer vinculos.',
    icon: Crown,
    accent: 'bg-emerald-600',
    text: 'text-emerald-700 dark:text-emerald-300',
    soft: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800/70',
    button: 'bg-emerald-700 text-white hover:bg-emerald-800',
  },
  {
    id: 'pastoral',
    rf: 'RF-MV-011',
    label: 'Pastoral',
    shortLabel: 'Pastoral',
    title: 'Pastoral',
    subtitle: 'Workspace, salas, jornadas e pulpito.',
    description: 'Ferramentas para lideres criarem jornadas, acompanharem membros e prepararem ensino biblico.',
    intent: 'Equipar lideranca com estrutura e clareza.',
    icon: Briefcase,
    accent: 'bg-violet-600',
    text: 'text-violet-700 dark:text-violet-300',
    soft: 'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-200 dark:border-violet-800/70',
    button: 'bg-violet-700 text-white hover:bg-violet-800',
  },
  {
    id: 'culto',
    rf: 'RF-MV-012',
    label: 'Culto+',
    shortLabel: 'Culto+',
    title: 'Culto+',
    subtitle: 'Agenda, OnePage e diario do culto.',
    description: 'Modulo para criar, publicar, acompanhar e registrar cultos da igreja com contexto comunitario.',
    intent: 'Conectar celebracao, anotacao e acompanhamento.',
    icon: Radio,
    accent: 'bg-teal-700',
    text: 'text-teal-800 dark:text-teal-300',
    soft: 'bg-teal-50 dark:bg-teal-950/20',
    border: 'border-teal-200 dark:border-teal-800/70',
    button: 'bg-teal-700 text-white hover:bg-teal-800',
  },
  {
    id: 'gamificacao',
    rf: 'RF-MV-013',
    label: 'Gamificacao',
    shortLabel: 'Mana',
    title: 'Gamificacao',
    subtitle: 'Mana, quiz, rankings, streak e auditoria.',
    description: 'Incentivos de constancia espiritual com regras explicitas, progresso, conquistas, rankings e eventos auditaveis.',
    intent: 'Estimular disciplina e participacao sem transformar fe em competicao vazia.',
    icon: Trophy,
    accent: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
    soft: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-200 dark:border-orange-800/70',
    button: 'bg-orange-600 text-white hover:bg-orange-700',
  },
  {
    id: 'sistema',
    rf: 'RF-MV-014',
    label: 'Conta & Sistema',
    shortLabel: 'Sistema',
    title: 'Conta & Sistema',
    subtitle: 'Perfil, planos, suporte, admin e integridade.',
    description: 'A camada de identidade, acesso, suporte e administracao que sustenta o uso seguro do app.',
    intent: 'Organizar acesso, seguranca e suporte.',
    icon: ShieldCheck,
    accent: 'bg-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
    soft: 'bg-slate-100 dark:bg-slate-900/60',
    border: 'border-slate-200 dark:border-slate-700',
    button: 'bg-slate-800 text-white hover:bg-slate-900',
  },
];

const FEATURES: FeatureSpec[] = [
  { id: 'RF-MV-007.01', moduleId: 'inicio', name: 'Versiculo do Dia', route: '/', description: 'Palavra em destaque para abrir o app com foco biblico.', audience: 'Todos os usuarios', whenToUse: 'Ao iniciar o dia ou retomar a leitura.', access: 'Livre', keywords: ['home', 'versiculo', 'inicio'] },
  { id: 'RF-MV-007.02', moduleId: 'inicio', name: 'Pao Diario', route: '/devocional', description: 'Devocional diario com reflexao, aplicacao e oracao.', audience: 'Visitante e membro', whenToUse: 'Na rotina devocional matinal.', access: 'Livre', keywords: ['devocional', 'pao diario', 'oracao'] },
  { id: 'RF-MV-007.03', moduleId: 'inicio', name: 'Meta de Leitura', route: '/plano', description: 'Acompanha progresso de capitulos e meta anual.', audience: 'Membro logado', whenToUse: 'Para criar constancia na leitura biblica.', access: 'Login', keywords: ['plano', 'leitura', 'progresso'] },
  { id: 'RF-MV-007.04', moduleId: 'inicio', name: 'Aba Criar da Home', route: '/#criativo', description: 'Link direto para a area criativa da Home.', audience: 'Todos os usuarios', whenToUse: 'Quando a intencao principal e criar com IA.', access: 'Livre', keywords: ['criativo', 'hash', 'home'] },
  { id: 'RF-MV-007.05', moduleId: 'inicio', name: 'Aba Reino da Home', route: '/#reino', description: 'Link direto para comunidade, feed e mural da Home.', audience: 'Todos os usuarios', whenToUse: 'Quando o usuario quer ir direto ao Reino.', access: 'Livre', keywords: ['reino', 'feed', 'hash'] },
  { id: 'RF-MV-007.06', moduleId: 'inicio', name: 'Atalhos Rapidos', route: '/', description: 'Acesso concentrado para Biblia, estudo, IA, oracoes e quiz.', audience: 'Membro recorrente', whenToUse: 'Para navegar sem procurar no menu lateral.', access: 'Livre', keywords: ['atalhos', 'home', 'navegacao'] },

  { id: 'RF-MV-008.01', moduleId: 'estudo', name: 'Biblia Sagrada', route: '/biblia', description: 'Leitor biblico por livro, capitulo e versiculo.', audience: 'Todos os usuarios', whenToUse: 'Para leitura central da Palavra.', access: 'Livre', keywords: ['biblia', 'leitor', 'capitulo'] },
  { id: 'RF-MV-008.02', moduleId: 'estudo', name: 'Biblia Dashboard', route: '/biblia-dashboard', description: 'Entrada visual para retomada e exploracao da Biblia.', audience: 'Todos os usuarios', whenToUse: 'Quando o usuario quer navegar antes de ler.', access: 'Livre', keywords: ['dashboard', 'biblia'] },
  { id: 'RF-MV-008.03', moduleId: 'estudo', name: 'Meus Estudos', route: '/estudos', description: 'Biblioteca pessoal de estudos, notas e conteudos salvos.', audience: 'Membro logado', whenToUse: 'Para continuar ou revisar materiais.', access: 'Login', keywords: ['estudos', 'biblioteca', 'salvos'] },
  { id: 'RF-MV-008.05', moduleId: 'estudo', name: 'Estudo por Livro', route: '/estudos/livro/[bookId]', description: 'Aprofundamento organizado por livro biblico.', audience: 'Estudante biblico', whenToUse: 'Para estudar um livro inteiro com contexto.', access: 'Livre', keywords: ['livro', 'estudo', 'biblia'] },

  { id: 'RF-MV-009.01', moduleId: 'criar', name: 'Estudio Criativo', route: '/estudio-criativo', description: 'Central de imagens, podcasts e criacao por IA.', audience: 'Membro criador', whenToUse: 'Quando a intencao e transformar estudo em midia.', access: 'Login', keywords: ['estudio', 'criativo', 'ia'] },
  { id: 'RF-MV-009.02', moduleId: 'criar', name: 'Conselheiro IA', route: '/chat', description: 'Chat teologico para duvidas, explicacoes e direcionamento.', audience: 'Todos os usuarios', whenToUse: 'Ao precisar entender uma passagem ou tema.', access: 'Livre', keywords: ['chat', 'conselheiro', 'obreiro'] },
  { id: 'RF-MV-009.03', moduleId: 'criar', name: 'Criar Conteudo', route: '/criar-conteudo', description: 'Gera estudos, reflexoes e materiais estruturados.', audience: 'Membro e lider', whenToUse: 'Para preparar conteudo biblico com apoio da IA.', access: 'Login', keywords: ['conteudo', 'estudo', 'ia'] },
  { id: 'RF-MV-009.04', moduleId: 'criar', name: 'Arte Sacra', route: '/criar-arte-sacra', description: 'Gera imagens biblicas para estudos, posts e capas.', audience: 'Membro criador', whenToUse: 'Para comunicar visualmente uma passagem.', access: 'Login', keywords: ['arte', 'imagem', 'sacra'] },
  { id: 'RF-MV-009.06', moduleId: 'criar', name: 'Podcast IA', route: '/criar-podcast', description: 'Transforma tema ou texto em audio narrado.', audience: 'Membro e lider', whenToUse: 'Para devocionais, aulas e compartilhamento.', access: 'Login', keywords: ['podcast', 'audio', 'ia'] },

  { id: 'RF-MV-010.01', moduleId: 'reino', name: 'Feed do Reino', route: '/social', description: 'Publicacoes, reflexoes e interacoes comunitarias.', audience: 'Comunidade', whenToUse: 'Para compartilhar e acompanhar edificacao.', access: 'Livre', keywords: ['feed', 'reino', 'post'] },
  { id: 'RF-MV-010.02', moduleId: 'reino', name: 'Post Publico', route: '/p/[postId]', description: 'Visualizacao dedicada de uma publicacao.', audience: 'Leitores e comunidade', whenToUse: 'Ao abrir link compartilhado de post.', access: 'Livre', keywords: ['post', 'publico'] },
  { id: 'RF-MV-010.03', moduleId: 'reino', name: 'Explorar', route: '/social/explore', description: 'Busca por pessoas, igrejas e conteudos.', audience: 'Todos os usuarios', whenToUse: 'Para descobrir novas conexoes.', access: 'Livre', keywords: ['explorar', 'busca', 'igreja'] },
  { id: 'RF-MV-010.04', moduleId: 'reino', name: 'Igrejas', route: '/social/igrejas', description: 'Lista e descoberta de igrejas.', audience: 'Membro e visitante', whenToUse: 'Para vincular ou encontrar igreja.', access: 'Livre', keywords: ['igrejas', 'ecclesia'] },
  { id: 'RF-MV-010.05', moduleId: 'reino', name: 'Pagina da Igreja', route: '/igreja/[churchSlug]', description: 'Hub publico da igreja com posts, cultos e grupos.', audience: 'Membros e visitantes', whenToUse: 'Para acompanhar a vida da igreja.', access: 'Livre', keywords: ['igreja', 'hub', 'cultos'] },
  { id: 'RF-MV-010.06', moduleId: 'reino', name: 'Grupos / Celulas', route: '/grupo/[cellSlug]', description: 'Espaco de pequenos grupos vinculados a igreja.', audience: 'Membro de grupo', whenToUse: 'Para comunhao e comunicacao local.', access: 'Login', keywords: ['grupo', 'celula'] },
  { id: 'RF-MV-010.07', moduleId: 'reino', name: 'Mural de Oracao', route: '/social/oracao', description: 'Pedidos de oracao e intercessao comunitaria.', audience: 'Comunidade', whenToUse: 'Para pedir ou oferecer apoio em oracao.', access: 'Livre', keywords: ['oracao', 'mural', 'interceder'] },

  { id: 'RF-MV-011.01', moduleId: 'pastoral', name: 'Workspace Pastoral', route: '/workspace-pastoral', description: 'Central de gestao pastoral e jornadas.', audience: 'Pastor e lider', whenToUse: 'Para criar, organizar e acompanhar ensino.', access: 'Pastor', keywords: ['workspace', 'pastoral'] },
  { id: 'RF-MV-011.02', moduleId: 'pastoral', name: 'Criar Sala', route: '/criar-sala', description: 'Cria jornada/sala de estudo para membros.', audience: 'Pastor e lider', whenToUse: 'Para montar plano de ensino estruturado.', access: 'Pastor', keywords: ['sala', 'jornada', 'plano'] },
  { id: 'RF-MV-011.03', moduleId: 'pastoral', name: 'Acervo', route: '/acervo', description: 'Biblioteca de salas, planos e jornadas.', audience: 'Pastor e membro', whenToUse: 'Para encontrar ou retomar salas.', access: 'Livre', keywords: ['acervo', 'salas'] },
  { id: 'RF-MV-011.04', moduleId: 'pastoral', name: 'Jornada Publica', route: '/jornada/[planId]', description: 'Pagina de uma jornada para alunos e membros.', audience: 'Participante de sala', whenToUse: 'Para consumir aulas e materiais.', access: 'Livre', keywords: ['jornada', 'aula'] },
  { id: 'RF-MV-011.05', moduleId: 'pastoral', name: 'Gerenciar Oracoes', route: '/oracoes/gerenciar', description: 'Gestao de oracoes e pedidos pastorais.', audience: 'Lideranca', whenToUse: 'Para acompanhar cuidado pastoral.', access: 'Pastor', keywords: ['oracoes', 'gerenciar'] },

  { id: 'RF-MV-012.01', moduleId: 'culto', name: 'Agenda Culto+', route: '/workspace-pastoral/cultos', description: 'Gestao e calendario de cultos da igreja.', audience: 'Pastor e equipe', whenToUse: 'Para planejar e publicar cultos.', access: 'Pastor', keywords: ['culto', 'agenda'] },
  { id: 'RF-MV-012.02', moduleId: 'culto', name: 'Novo Culto+', route: '/workspace-pastoral/cultos/novo', description: 'Formulario de criacao de culto com liturgia e dados publicos.', audience: 'Pastor e equipe', whenToUse: 'Antes de um culto ou evento.', access: 'Pastor', keywords: ['novo culto', 'culto+'] },
  { id: 'RF-MV-012.03', moduleId: 'culto', name: 'OnePage do Culto', route: '/culto/[serviceSlug]', description: 'Pagina publica do culto com tema, agenda e participacao.', audience: 'Igreja e visitantes', whenToUse: 'Durante ou antes do culto.', access: 'Livre', keywords: ['onepage', 'culto'] },
  { id: 'RF-MV-012.04', moduleId: 'culto', name: 'Meus Cultos', route: '/meus-cultos', description: 'Historico pessoal de cultos acompanhados.', audience: 'Membro logado', whenToUse: 'Para revisar anotacoes e participacoes.', access: 'Login', keywords: ['meus cultos', 'historico'] },
  { id: 'RF-MV-012.05', moduleId: 'culto', name: 'Diario do Culto', route: '/meus-cultos/[journalId]', description: 'Registro individual com notas e memoria do culto.', audience: 'Membro logado', whenToUse: 'Para guardar aprendizado do culto.', access: 'Login', keywords: ['diario', 'anotacoes'] },
  { id: 'RF-MV-012.06', moduleId: 'culto', name: 'Minhas Escalas', route: '/minhas-escalas', description: 'Convites, escalas, equipes e solicitacoes de voluntariado do membro.', audience: 'Membro logado', whenToUse: 'Para responder convites e conferir onde voce serve.', access: 'Login', keywords: ['escala', 'escalas', 'designacoes', 'equipes', 'voluntariado'] },

  { id: 'RF-MV-013.01', moduleId: 'gamificacao', name: 'Quiz Biblico', route: '/quiz', description: 'Perguntas biblicas, desafios e fixacao de conhecimento.', audience: 'Todos os usuarios', whenToUse: 'Para testar e aprender de modo leve.', access: 'Livre', keywords: ['quiz', 'desafio'] },
  { id: 'RF-MV-013.02', moduleId: 'gamificacao', name: 'Central de Competicao', route: '/competicao', description: 'Painel de Mana, niveis, checklist diario, regras e rankings.', audience: 'Membro logado', whenToUse: 'Para entender progresso, proxima acao e posicao nos rankings.', access: 'Login', keywords: ['competicao', 'mana', 'ranking', 'checklist'] },
  { id: 'RF-MV-013.03', moduleId: 'gamificacao', name: 'Historico', route: '/historico', description: 'Linha do tempo de atividades e Mana gerado por acao.', audience: 'Membro logado', whenToUse: 'Para revisar o que produziu, leu e ganhou de Mana.', access: 'Login', keywords: ['historico', 'atividade', 'mana'] },
  { id: 'RF-MV-013.04', moduleId: 'gamificacao', name: 'Perfil e Badges', route: '/perfil', description: 'Estatisticas, progresso, niveis e identidade do usuario.', audience: 'Membro logado', whenToUse: 'Para acompanhar crescimento pessoal.', access: 'Login', keywords: ['perfil', 'badges', 'niveis'] },
  { id: 'RF-MV-013.05', moduleId: 'gamificacao', name: 'Regras de Mana', route: '/competicao', description: 'Lista clara de acoes que geram Mana, limites diarios e protecoes anti-abuso.', audience: 'Membro logado', whenToUse: 'Quando o usuario quer saber como ganhar Mana de forma saudavel.', access: 'Login', keywords: ['regras', 'limites', 'anti-abuso'] },
  { id: 'RF-MV-013.06', moduleId: 'gamificacao', name: 'Auditoria de Mana', route: '/admin?view=mana_audit', description: 'Painel admin para revisar e anular eventos de Mana suspeitos.', audience: 'Administradores', whenToUse: 'Para moderar eventos, investigar abuso e manter rankings confiaveis.', access: 'Admin', keywords: ['admin', 'auditoria', 'mana_events'] },

  { id: 'RF-MV-014.01', moduleId: 'sistema', name: 'Login', route: '/login', description: 'Entrada na conta e protecao de recursos pessoais.', audience: 'Visitante', whenToUse: 'Para salvar progresso e usar recursos protegidos.', access: 'Livre', keywords: ['login', 'conta'] },
  { id: 'RF-MV-014.02', moduleId: 'sistema', name: 'Completar Perfil', route: '/complete-profile', description: 'Dados pessoais e eclesiasticos do usuario.', audience: 'Membro novo', whenToUse: 'Depois do cadastro.', access: 'Login', keywords: ['perfil', 'cadastro'] },
  { id: 'RF-MV-014.03', moduleId: 'sistema', name: 'Planos', route: '/planos', description: 'Assinaturas, acesso e sustentabilidade da IA.', audience: 'Membro', whenToUse: 'Para aumentar limites e apoiar o projeto.', access: 'Livre', keywords: ['planos', 'assinatura'] },
  { id: 'RF-MV-014.04', moduleId: 'sistema', name: 'Suporte', route: '/suporte', description: 'Ajuda, contato e apoio ao usuario.', audience: 'Todos os usuarios', whenToUse: 'Quando houver duvida ou problema.', access: 'Livre', keywords: ['suporte', 'ajuda'] },
  { id: 'RF-MV-014.05', moduleId: 'sistema', name: 'Admin', route: '/admin', description: 'Painel de administracao, CMS e moderacao.', audience: 'Administradores', whenToUse: 'Para operar e moderar a plataforma.', access: 'Admin', keywords: ['admin', 'cms', 'moderacao'] },
  { id: 'RF-MV-014.06', moduleId: 'sistema', name: 'Integridade do Sistema', route: '/system-integrity', description: 'Saude tecnica e integridade operacional.', audience: 'Administradores', whenToUse: 'Para auditoria e verificacoes.', access: 'Admin', keywords: ['integridade', 'sistema'] },
];

const ACCESS_FILTERS: Array<'Todos' | AccessType> = ['Todos', 'Livre', 'Login', 'Pastor', 'Admin'];

const JOURNEYS = [
  {
    title: 'Quero ler a Biblia',
    moduleId: 'estudo' as const,
    steps: ['Biblia Sagrada', 'Pao Diario', 'Plano de Leitura', 'Meus Estudos'],
    route: '/biblia',
  },
  {
    title: 'Quero criar algo',
    moduleId: 'criar' as const,
    steps: ['Conselheiro IA', 'Criar Conteudo', 'Arte Sacra', 'Podcast IA', 'Compartilhar'],
    route: '/#criativo',
  },
  {
    title: 'Quero viver comunidade',
    moduleId: 'reino' as const,
    steps: ['Reino', 'Igrejas', 'Grupos', 'Mural de Oracao', 'Feed'],
    route: '/#reino',
  },
  {
    title: 'Sou pastor ou lider',
    moduleId: 'pastoral' as const,
    steps: ['Workspace', 'Criar Sala', 'Culto+', 'Acompanhar'],
    route: '/workspace-pastoral',
  },
];

const FLOW = [
  { label: 'Home', moduleId: 'inicio' as const, icon: Home, route: '/' },
  { label: 'Estudar', moduleId: 'estudo' as const, icon: BookOpen, route: '/biblia' },
  { label: 'Criar', moduleId: 'criar' as const, icon: Wand2, route: '/#criativo' },
  { label: 'Reino', moduleId: 'reino' as const, icon: Crown, route: '/#reino' },
  { label: 'Pastoral', moduleId: 'pastoral' as const, icon: Briefcase, route: '/workspace-pastoral' },
  { label: 'Culto+', moduleId: 'culto' as const, icon: Radio, route: '/workspace-pastoral/cultos' },
  { label: 'Progresso', moduleId: 'gamificacao' as const, icon: Trophy, route: '/competicao' },
  { label: 'Conta', moduleId: 'sistema' as const, icon: ShieldCheck, route: '/perfil' },
];

const ROADMAP = [
  { phase: 'Fase 1', title: 'Inventario funcional vivo', description: 'Manter rotas, aliases, publico e acesso sincronizados com o app real.' },
  { phase: 'Fase 2', title: 'Conteudo pastoral revisado', description: 'Garantir linguagem simples: Biblia no centro, IA como Obreiro, Reino como comunidade.' },
  { phase: 'Fase 3', title: 'Tour guiado', description: 'Adicionar uma jornada interativa por perfil: visitante, membro, pastor e admin.' },
  { phase: 'Fase 4', title: 'Checklist de descoberta', description: 'Permitir marcar recursos conhecidos e sugerir proximos passos espirituais.' },
];

const moduleById = MODULES.reduce<Record<ModuleId, ModuleTheme>>((acc, module) => {
  acc[module.id] = module;
  return acc;
}, {} as Record<ModuleId, ModuleTheme>);

const ACCESS_CLASSES: Record<AccessType, string> = {
  Livre: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
  Login: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800',
  Pastor: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800',
  Admin: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700',
};

const moduleFeatureCount = (moduleId: ModuleId) => {
  if (moduleId === 'overview') return FEATURES.length;
  return FEATURES.filter((feature) => feature.moduleId === moduleId).length;
};

const LiveMapPage: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>('overview');
  const [query, setQuery] = useState('');
  const [accessFilter, setAccessFilter] = useState<'Todos' | AccessType>('Todos');

  const activeTheme = moduleById[activeModule];

  const filteredFeatures = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return FEATURES.filter((feature) => {
      const matchesModule = activeModule === 'overview' || feature.moduleId === activeModule;
      const matchesAccess = accessFilter === 'Todos' || feature.access === accessFilter;
      const searchable = [
        feature.id,
        feature.name,
        feature.route,
        feature.description,
        feature.audience,
        feature.whenToUse,
        feature.access,
        ...feature.keywords,
        moduleById[feature.moduleId].label,
      ].join(' ').toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      return matchesModule && matchesAccess && matchesQuery;
    });
  }, [accessFilter, activeModule, query]);

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-gray-900 dark:bg-[#0b0b0b] dark:text-white">
      <SEO
        title="Mapa Vivo do Culto+"
        description="Conheca todas as funcionalidades do Culto+ organizadas por jornada, modulo, acesso e fluxo de navegacao."
        keywords="Culto+, mapa do app, Biblia, IA, Reino, Pastoral"
      />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-10">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <div className="rounded-2xl border border-[#e6dccb] bg-white p-6 shadow-sm dark:border-[#262626] dark:bg-[#141414] md:p-8">
            <div className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#e8d9bc] bg-[#fbf7ef] px-4 text-xs font-medium uppercase tracking-widest text-[#8a6428] dark:border-[#3b301c] dark:bg-[#1f1a12] dark:text-[#e0bd74]">
              <Map size={15} />
              RF-MV-001
            </div>
            <h1 className="max-w-3xl text-3xl font-medium leading-tight text-gray-950 dark:text-white md:text-5xl">
              Mapa Vivo do Culto+
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600 dark:text-gray-300 md:text-base">
              Tudo que o Culto+ faz, organizado por jornada espiritual. A Biblia permanece no centro, a IA trabalha como Obreiro e o Reino conecta pessoas para edificacao.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-bible-gold px-5 text-sm font-medium text-white transition-colors hover:bg-bible-leather">
                Comecar pelo Inicio <ArrowRight size={16} />
              </Link>
              <a href="#fluxo" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-medium text-gray-700 transition-colors hover:border-bible-gold hover:text-bible-leather dark:border-gray-700 dark:bg-[#181818] dark:text-gray-200">
                Ver fluxo completo <Route size={16} />
              </a>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-[#e6dccb] bg-[#fffaf2] p-5 dark:border-[#262626] dark:bg-[#111111]">
            {MODULES.filter((module) => module.id !== 'overview').slice(0, 8).map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => setActiveModule(module.id)}
                  className="flex min-h-14 items-center gap-3 rounded-xl border border-transparent bg-white px-3 text-left transition-all hover:border-current dark:bg-[#181818]"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${module.soft} ${module.text}`}>
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">{module.shortLabel}</span>
                    <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{module.intent}</span>
                  </span>
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-medium ${module.border} ${module.text}`}>
                    {moduleFeatureCount(module.id)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section aria-label="Abas de modulos" className="rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-[#141414]">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {MODULES.map((module) => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => setActiveModule(module.id)}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-all ${
                    isActive
                      ? `${module.button} border-transparent shadow-sm`
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-[#181818] dark:text-gray-300 dark:hover:bg-[#202020]'
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon size={16} />
                  {module.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className={`rounded-2xl border p-5 ${activeTheme.soft} ${activeTheme.border}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className={`mb-2 text-xs font-medium uppercase tracking-widest ${activeTheme.text}`}>{activeTheme.rf}</p>
              <h2 className="text-2xl font-medium text-gray-950 dark:text-white">{activeTheme.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">{activeTheme.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-3 text-center dark:bg-[#181818]">
                <span className={`block text-xl font-medium ${activeTheme.text}`}>{moduleFeatureCount(activeModule)}</span>
                <span className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Funcoes</span>
              </div>
              <div className="rounded-xl bg-white p-3 text-center dark:bg-[#181818]">
                <span className={`block text-xl font-medium ${activeTheme.text}`}>{filteredFeatures.length}</span>
                <span className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Visiveis</span>
              </div>
              <div className="col-span-2 rounded-xl bg-white p-3 text-center dark:bg-[#181818] sm:col-span-1">
                <span className={`block text-xl font-medium ${activeTheme.text}`}>9</span>
                <span className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Abas</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="relative block">
            <span className="sr-only">Buscar funcionalidades</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por rota, modulo, recurso ou palavra-chave"
              className="min-h-12 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-bible-gold focus:ring-4 focus:ring-bible-gold/15 dark:border-gray-800 dark:bg-[#141414] dark:text-white"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto">
            {ACCESS_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setAccessFilter(filter)}
                className={`min-h-11 shrink-0 rounded-xl border px-4 text-xs font-medium uppercase tracking-widest transition-colors ${
                  accessFilter === filter
                    ? 'border-bible-gold bg-bible-gold text-white'
                    : 'border-gray-200 bg-white text-gray-500 hover:text-gray-900 dark:border-gray-800 dark:bg-[#141414] dark:text-gray-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredFeatures.map((feature) => {
            const module = moduleById[feature.moduleId];
            const Icon = module.icon;
            return (
              <article key={feature.id} className={`flex min-h-[300px] flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-[#141414] ${module.border}`}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${module.soft} ${module.text}`}>
                    <Icon size={21} />
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-widest ${ACCESS_CLASSES[feature.access]}`}>
                    {feature.access}
                  </span>
                </div>
                <p className={`text-[10px] font-medium uppercase tracking-widest ${module.text}`}>{feature.id}</p>
                <h3 className="mt-2 text-lg font-medium leading-tight text-gray-950 dark:text-white">{feature.name}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{feature.description}</p>
                <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
                  <p><span className="font-medium text-gray-800 dark:text-gray-200">Rota:</span> <code className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-[#202020]">{feature.route}</code></p>
                  <p><span className="font-medium text-gray-800 dark:text-gray-200">Para quem:</span> {feature.audience}</p>
                  <p><span className="font-medium text-gray-800 dark:text-gray-200">Quando usar:</span> {feature.whenToUse}</p>
                </div>
                <div className="mt-auto pt-5">
                  <Link href={feature.route.includes('[') ? '#' : feature.route} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-xs font-medium uppercase tracking-widest transition-colors ${module.button}`}>
                    {feature.route.includes('[') ? 'Fluxo dinamico' : feature.cta || 'Abrir'} <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        {filteredFeatures.length === 0 && (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-[#141414]">
            <Search className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            <h3 className="text-lg font-medium">Nenhuma funcionalidade encontrada</h3>
            <p className="mt-2 text-sm text-gray-500">Tente buscar por Biblia, podcast, igreja, pastor, culto, quiz ou oracao.</p>
          </section>
        )}

        <section id="fluxo" className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#141414]">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bible-gold text-white">
              <Route size={20} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-bible-gold">RF-MV-016</p>
              <h2 className="text-xl font-medium text-gray-950 dark:text-white">Fluxo de navegacao</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
            {FLOW.map((step, index) => {
              const module = moduleById[step.moduleId];
              const Icon = step.icon;
              return (
                <div key={step.label} className="relative">
                  <Link href={step.route} className={`flex min-h-[116px] flex-col justify-between rounded-2xl border p-4 transition-transform hover:-translate-y-0.5 ${module.soft} ${module.border}`}>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white ${module.text} dark:bg-[#181818]`}>
                      <Icon size={18} />
                    </span>
                    <span>
                      <span className="block text-[10px] font-medium uppercase tracking-widest text-gray-500">Passo {index + 1}</span>
                      <span className="block text-sm font-medium text-gray-950 dark:text-white">{step.label}</span>
                    </span>
                  </Link>
                  {index < FLOW.length - 1 && (
                    <div className="pointer-events-none absolute -right-2 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 md:flex">
                      <ArrowRight size={14} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#141414]">
            <div className="mb-5 flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-bible-gold" />
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-bible-gold">RF-MV-019</p>
                <h2 className="text-xl font-medium">Escolha sua jornada</h2>
              </div>
            </div>
            <div className="space-y-3">
              {JOURNEYS.map((journey) => {
                const module = moduleById[journey.moduleId];
                return (
                  <Link key={journey.title} href={journey.route} className={`block rounded-2xl border p-4 transition-colors hover:bg-white dark:hover:bg-[#181818] ${module.soft} ${module.border}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-gray-950 dark:text-white">{journey.title}</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {journey.steps.map((step) => (
                            <span key={step} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-gray-600 dark:bg-[#202020] dark:text-gray-300">
                              {step}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className={`mt-1 h-5 w-5 ${module.text}`} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#141414]">
            <div className="mb-5 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-emerald-600">Roadmap</p>
                <h2 className="text-xl font-medium">Evolucao do Mapa Vivo</h2>
              </div>
            </div>
            <div className="space-y-4">
              {ROADMAP.map((item) => (
                <div key={item.phase} className="grid grid-cols-[80px_1fr] gap-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <span className="text-xs font-medium uppercase tracking-widest text-bible-gold">{item.phase}</span>
                  <span>
                    <span className="block text-sm font-medium text-gray-950 dark:text-white">{item.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-gray-500 dark:text-gray-400">{item.description}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LiveMapPage;
