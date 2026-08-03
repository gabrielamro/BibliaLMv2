"use client";

import React from 'react';
import { useNavigate } from '../utils/router';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Church,
  Compass,
  FileText,
  HandHeart,
  HeartHandshake,
  Layers,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { LogoIcon } from '../components/LogoIcon';

const heroImage = '/presentation/biblialm-pastoral-pitch-hero.png';

const pastoralProblems = [
  {
    title: 'Constância bíblica frágil',
    text: 'Muitos membros desejam crescer, mas não conseguem transformar intenção espiritual em rotina durante a semana.',
    icon: <BookOpen size={20} />,
  },
  {
    title: 'Lideranca sobrecarregada',
    text: 'Pastores e líderes precisam preparar estudos, devocionais, comunicados e trilhas com pouco tempo disponível.',
    icon: <Users size={20} />,
  },
  {
    title: 'Acompanhamento disperso',
    text: 'A igreja local nem sempre enxerga onde cada pessoa esta na jornada de leitura, discipulado e comunidade.',
    icon: <Compass size={20} />,
  },
];

const memberJourney = [
  'Recebe uma meta de leitura clara',
  'Acompanha progresso e constância',
  'Faz devocionais e registra reflexoes',
  'Participa de trilhas, salas e desafios',
  'Permanece conectado a igreja local',
];

const pastorJourney = [
  'Cria estudos com apoio de IA',
  'Organiza jornadas de discipulado',
  'Publica conteúdos para a comunidade',
  'Acompanha sinais de engajamento',
  'Multiplica cuidado sem perder supervisão pastoral',
];

const modules = [
  {
    title: 'Biblia e leitura',
    text: 'Bíblia, planos, metas, progresso diário e alertas de constância.',
    icon: <BookOpen size={22} />,
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200',
  },
  {
    title: 'Devocional e oração',
    text: 'Pão diário, orações guiadas e uma rotina espiritual simples.',
    icon: <HandHeart size={22} />,
    tone: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200',
  },
  {
    title: 'IA para estudo',
    text: 'Apoio para criar estudos, organizar ideias e preparar materiais.',
    icon: <Brain size={22} />,
    tone: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200',
  },
  {
    title: 'Comunidade',
    text: 'Igreja, grupos, perfis, feed, salas e participacao dos membros.',
    icon: <Church size={22} />,
    tone: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200',
  },
  {
    title: 'Discipulado gamificado',
    text: 'Mana, streak, quiz, conquistas e sinais de continuidade.',
    icon: <Target size={22} />,
    tone: 'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900/50 dark:bg-cyan-950/20 dark:text-cyan-200',
  },
  {
    title: 'Criacao pastoral',
    text: 'Estudos, salas, arte sacra, podcasts e conteúdos para ministérios.',
    icon: <FileText size={22} />,
    tone: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/50 dark:bg-violet-950/20 dark:text-violet-200',
  },
];

const presentationRoadmap = [
  {
    step: '01',
    title: 'Abrir com a dor pastoral',
    text: 'A igreja pastoreia pessoas conectadas, mas muitas vezes espiritualmente dispersas.',
  },
  {
    step: '02',
    title: 'Nomear a oportunidade',
    text: 'Transformar tecnologia em apoio real para leitura bíblica, cuidado e discipulado semanal.',
  },
  {
    step: '03',
    title: 'Apresentar a visão',
    text: 'Culto+ como ecossistema cristão com IA a serviço da igreja local.',
  },
  {
    step: '04',
    title: 'Mostrar a jornada do membro',
    text: 'Da leitura diaria a comunidade, com metas, devocionais, trilhas e acompanhamento.',
  },
  {
    step: '05',
    title: 'Mostrar a jornada do pastor',
    text: 'Criação de estudos, salas, conteúdos e jornadas sem retirar a supervisão pastoral.',
  },
  {
    step: '06',
    title: 'Explicar os limites',
    text: 'IA como ferramenta auxiliar. A Palavra, a igreja e a liderança continuam no centro.',
  },
  {
    step: '07',
    title: 'Sugerir um piloto',
    text: 'Começar com novos convertidos, jovens, célula ou liderança por 30 dias.',
  },
  {
    step: '08',
    title: 'Fechar com parceria',
    text: 'Construir junto com pastores uma ferramenta que sirva a igreja de verdade.',
  },
];

const pilotSteps = [
  'Escolher um grupo pequeno da igreja',
  'Definir uma jornada de 30 dias',
  'Ativar leitura, devocional e sala',
  'Coletar feedback pastoral e dos membros',
  'Ajustar a plataforma para a realidade da igreja',
];

const PresentationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#18211c] dark:bg-[#080b0a] dark:text-white">
      <section className="relative min-h-[92vh] overflow-hidden">
        <img
          src={heroImage}
          alt="Mesa pastoral com Biblia aberta, caderno e tablet para planejamento de discipulado digital"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,11,10,0.9)_0%,rgba(8,11,10,0.72)_42%,rgba(8,11,10,0.2)_100%)]" />

        <div className="relative z-10 flex min-h-[92vh] flex-col px-5 py-5 sm:px-8 lg:px-12">
          <nav className="flex items-center justify-between gap-4" aria-label="Navegação da apresentação">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15"
            >
              <LogoIcon className="h-7 w-7 text-[#d7b46a]" />
              <span>Culto+</span>
            </button>
            <div className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-white/70 sm:flex">
              <span>Pitch Pastoral</span>
              <ChevronRight size={14} />
              <span>Roadmap</span>
            </div>
          </nav>

          <div className="flex flex-1 items-center">
            <div className="max-w-3xl py-16">
              <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-[#d7b46a]/40 bg-[#d7b46a]/15 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#f3d88d]">
                <Church size={15} />
                Para pastores e lideres
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-normal text-white sm:text-5xl lg:text-6xl">
                Culto+: discipulado digital com IA a serviço da igreja local
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/82 sm:text-lg">
                Uma apresentação para mostrar como leitura bíblica, criação pastoral,
                comunidade e acompanhamento podem caminhar juntos sem substituir a
                Palavra, a igreja ou a liderança espiritual.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#roadmap"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#d7b46a] px-5 text-sm font-black uppercase tracking-wider text-[#172018] transition-colors hover:bg-[#e5c97d]"
                >
                  Ver roadmap <ArrowRight size={17} />
                </a>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 text-sm font-black uppercase tracking-wider text-white backdrop-blur transition-colors hover:bg-white/15"
                >
                  Abrir app
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 pb-4 sm:grid-cols-3">
            {['Biblia no centro', 'Pastor no comando', 'IA como apoio'].map((item) => (
              <div key={item} className="rounded-lg border border-white/12 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">A conversa com pastores</p>
            <h2 className="mt-3 text-3xl font-black tracking-normal text-[#18211c] dark:text-white sm:text-4xl">
              O ponto de partida não é tecnologia. É cuidado pastoral.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pastoralProblems.map((problem) => (
              <article key={problem.title} className="rounded-lg border border-[#dfe6dc] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {problem.icon}
                </div>
                <h3 className="text-lg font-black text-[#18211c] dark:text-white">{problem.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#526056] dark:text-white/68">{problem.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#dfe6dc] bg-white px-5 py-14 dark:border-white/10 dark:bg-white/[0.03] sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-700 dark:text-blue-300">A visão</p>
            <h2 className="mt-3 text-3xl font-black tracking-normal text-[#18211c] dark:text-white sm:text-4xl">
              Um ecossistema cristão para transformar intenção em rotina.
            </h2>
            <p className="mt-5 text-base leading-8 text-[#526056] dark:text-white/68">
              O Culto+ organiza leitura, devocional, estudos, salas, comunidade e
              recursos criativos em uma experiência que fortalece a jornada espiritual
              do membro e o trabalho da liderança.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-700 dark:bg-white/10 dark:text-blue-300">
                <Users size={20} />
              </div>
              <h3 className="font-black text-blue-950 dark:text-blue-100">Jornada do membro</h3>
              <ul className="mt-4 space-y-3">
                {memberJourney.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-blue-950/75 dark:text-blue-100/75">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-700 dark:bg-white/10 dark:text-emerald-300">
                <HeartHandshake size={20} />
              </div>
              <h3 className="font-black text-emerald-950 dark:text-emerald-100">Jornada do pastor</h3>
              <ul className="mt-4 space-y-3">
                {pastorJourney.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-emerald-950/75 dark:text-emerald-100/75">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-violet-700 dark:text-violet-300">Módulos principais</p>
              <h2 className="mt-3 text-3xl font-black tracking-normal text-[#18211c] dark:text-white sm:text-4xl">
                O que o pastor consegue demonstrar em poucos minutos.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-[#526056] dark:text-white/68">
              A apresentação deve mostrar valor pastoral antes de listar funcionalidades.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <article key={module.title} className={`rounded-lg border p-5 ${module.tone}`}>
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white/70 dark:bg-white/10">
                  {module.icon}
                </div>
                <h3 className="text-lg font-black">{module.title}</h3>
                <p className="mt-3 text-sm leading-7 opacity-80">{module.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="roadmap" className="border-y border-[#dfe6dc] bg-[#eef4ef] px-5 py-14 dark:border-white/10 dark:bg-[#0d1411] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">Roadmap da apresentação</p>
            <h2 className="mt-3 text-3xl font-black tracking-normal text-[#18211c] dark:text-white sm:text-4xl">
              Uma narrativa simples para conquistar confianca pastoral.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {presentationRoadmap.map((item) => (
              <article key={item.step} className="grid gap-4 rounded-lg border border-white bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:grid-cols-[64px_1fr]">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#18211c] text-sm font-black text-white dark:bg-white dark:text-[#18211c]">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#18211c] dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#526056] dark:text-white/68">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_0.9fr]">
          <article className="rounded-lg border border-[#dfe6dc] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-normal text-[#18211c] dark:text-white">
              Limites claros aumentam confianca.
            </h2>
            <p className="mt-4 text-base leading-8 text-[#526056] dark:text-white/68">
              O pitch deve afirmar com clareza: a IA não substitui aconselhamento,
              interpretacao responsavel das Escrituras ou autoridade pastoral. Ela
              organiza, apoia e acelera tarefas, sempre debaixo de discernimento humano.
            </p>
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-7 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
              A autoridade continua sendo a Palavra de Deus, discernida com responsabilidade pela liderança da igreja.
            </div>
          </article>

          <article className="rounded-lg border border-[#dfe6dc] bg-[#18211c] p-6 text-white shadow-sm dark:border-white/10">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-[#d7b46a]">
              <Layers size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-normal">Piloto sugerido: 30 dias</h2>
            <ul className="mt-5 space-y-3">
              {pilotSteps.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-white/78">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#d7b46a]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl rounded-lg border border-[#dfe6dc] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                <Lightbulb size={15} />
                Mensagem central
              </div>
              <h2 className="text-2xl font-black tracking-normal text-[#18211c] dark:text-white sm:text-3xl">
                Tecnologia servindo a Palavra, a igreja e o discipulado diário.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#526056] dark:text-white/68">
                O Culto+ deve ser apresentado como parceiro da igreja local: uma
                plataforma para fortalecer constância, conteúdo e comunidade, não para
                substituir pastores ou relações reais de cuidado.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#18211c] px-5 text-sm font-black uppercase tracking-wider text-white transition-colors hover:bg-[#28362e] dark:bg-white dark:text-[#18211c] dark:hover:bg-white/90"
              >
                Ir para início <ArrowRight size={17} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/workspace-pastoral')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#dfe6dc] px-5 text-sm font-black uppercase tracking-wider text-[#18211c] transition-colors hover:bg-[#f0f4ef] dark:border-white/15 dark:text-white dark:hover:bg-white/10"
              >
                Workspace pastoral <Sparkles size={17} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#dfe6dc] px-5 py-6 text-center text-xs font-semibold text-[#526056] dark:border-white/10 dark:text-white/50">
        Culto+ para pastores: leitura, discipulado, comunidade e IA sob discernimento pastoral.
      </footer>
    </main>
  );
};

export default PresentationPage;
