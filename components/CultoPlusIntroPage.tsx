import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  BookHeart,
  BookOpen,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Church,
  CircleUserRound,
  ClipboardCheck,
  Coffee,
  HeartHandshake,
  HeartPulse,
  LayoutDashboard,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import CultoPlusBrand from "./CultoPlusBrand";

type Capability = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
  surfaceClass: string;
};

type JourneyStep = {
  title: string;
  description: string;
  icon: LucideIcon;
  className: string;
};

const capabilities: Capability[] = [
  {
    title: "Bíblia e jornada",
    description: "Bíblia Sagrada, Pão Diário, planos de leitura, estudos profundos, oração e apoio com IA.",
    icon: BookOpen,
    iconClass: "text-violet-700",
    surfaceClass: "bg-violet-50 ring-violet-100",
  },
  {
    title: "Comunidade",
    description: "Grupos, células, pedidos de oração, interações e vínculos que fortalecem o pertencimento.",
    icon: UsersRound,
    iconClass: "text-rose-700",
    surfaceClass: "bg-rose-50 ring-rose-100",
  },
  {
    title: "Cultos",
    description: "Agenda, culto online, experiência antes, durante e depois, check-in e conteúdo em um só fluxo.",
    icon: CalendarDays,
    iconClass: "text-emerald-700",
    surfaceClass: "bg-emerald-50 ring-emerald-100",
  },
  {
    title: "Servir",
    description: "Voluntariado, equipes, funções, convites, escalas e confirmações com menos etapas.",
    icon: HeartHandshake,
    iconClass: "text-orange-700",
    surfaceClass: "bg-orange-50 ring-orange-100",
  },
  {
    title: "Cuidado pastoral",
    description: "Inbox pastoral, acompanhamento, jornadas e liderança próxima de cada pessoa.",
    icon: HeartPulse,
    iconClass: "text-pink-700",
    surfaceClass: "bg-pink-50 ring-pink-100",
  },
  {
    title: "Gestão da igreja",
    description: "Pessoas, permissões, QR Codes, aprovações, alertas e indicadores para agir no momento certo.",
    icon: Church,
    iconClass: "text-cyan-800",
    surfaceClass: "bg-cyan-50 ring-cyan-100",
  },
];

const journey: JourneyStep[] = [
  { title: "Ler", description: "A Palavra que transforma", icon: BookOpen, className: "text-violet-700 bg-violet-50 ring-violet-100" },
  { title: "Crescer", description: "Discipulado que forma", icon: Sparkles, className: "text-rose-700 bg-rose-50 ring-rose-100" },
  { title: "Participar", description: "Comunidade que acolhe", icon: UsersRound, className: "text-emerald-700 bg-emerald-50 ring-emerald-100" },
  { title: "Servir", description: "Dons em movimento", icon: HeartHandshake, className: "text-orange-700 bg-orange-50 ring-orange-100" },
  { title: "Cuidar", description: "Presença que acompanha", icon: MessageCircleHeart, className: "text-pink-700 bg-pink-50 ring-pink-100" },
  { title: "Gerir", description: "Clareza para avançar", icon: LayoutDashboard, className: "text-cyan-800 bg-cyan-50 ring-cyan-100" },
];

const roleCards = [
  {
    eyebrow: "Minha visão",
    title: "Membro",
    description: "Viva sua fé, acompanhe cultos, participe de grupos, receba avisos e encontre seu lugar para servir.",
    icon: CircleUserRound,
    iconClass: "text-violet-700 bg-violet-100",
    borderClass: "border-violet-100",
    items: ["Bíblia e Pão Diário", "Minha jornada", "Cultos e escalas"],
  },
  {
    eyebrow: "Workspace Pastoral",
    title: "Líder",
    description: "Prepare mensagens, lidere pessoas e equipes, acompanhe necessidades e cuide com continuidade.",
    icon: HeartPulse,
    iconClass: "text-rose-700 bg-rose-100",
    borderClass: "border-rose-100",
    items: ["Preparar mensagem", "Inbox pastoral", "Acompanhamentos"],
  },
  {
    eyebrow: "Gestão da Igreja",
    title: "Gestor",
    description: "Tenha clareza sobre cultos, pessoas, aprovações, equipes e tudo que precisa de uma decisão.",
    icon: Church,
    iconClass: "text-emerald-800 bg-emerald-100",
    borderClass: "border-emerald-100",
    items: ["Próximo culto", "Equipes e pessoas", "Aprovações e alertas"],
  },
];

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#087a6b]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#0b1530] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
        {title}
      </h2>
      {description ? <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">{description}</p> : null}
    </div>
  );
}

function MiniNav({ active = "" }: { active?: string }) {
  const items = [
    { icon: CircleUserRound, label: "Minha visão" },
    { icon: BookOpen, label: "Bíblia" },
    { icon: UsersRound, label: "Comunidade" },
    { icon: CalendarDays, label: "Cultos" },
    { icon: HeartPulse, label: "Cuidado" },
  ];

  return (
    <aside className="hidden w-12 shrink-0 border-r border-[#ebe7df] bg-[#fffdf9] py-3 sm:flex sm:flex-col sm:items-center sm:gap-2" aria-hidden="true">
      <div className="mb-2 grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violet-600 via-fuchsia-500 to-amber-400 text-[9px] font-black text-white">C+</div>
      {items.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className={`grid h-7 w-7 place-items-center rounded-lg ${active === label ? "bg-emerald-100 text-emerald-800" : "text-slate-400"}`}
          title={label}
        >
          <Icon size={14} />
        </div>
      ))}
    </aside>
  );
}

function PersonalViewPreview() {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#e8e2d8] bg-white shadow-[0_18px_45px_rgba(11,21,48,0.12)]">
      <div className="flex min-h-[310px]">
        <MiniNav active="Minha visão" />
        <div className="min-w-0 flex-1 p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600">Minha visão</p>
          <h3 className="mt-1 text-sm font-black text-[#0b1530]">Sua jornada pessoal</h3>
          <div className="mt-4 rounded-xl bg-[#063f3a] p-4 text-white">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-200">Versículo do dia</p>
            <p className="mt-2 text-[11px] leading-5">Porque dele, por ele e para ele são todas as coisas.</p>
            <p className="mt-2 text-[9px] text-emerald-100/80">Romanos 11:36</p>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-700"><Coffee size={15} /></span>
              <span className="min-w-0 flex-1"><span className="block text-[11px] font-black text-[#0b1530]">Pão Diário</span><span className="block text-[9px] text-slate-500">Confiança que descansa</span></span>
              <ChevronRight size={13} className="text-slate-300" />
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-700"><BookHeart size={15} /></span>
                <span className="min-w-0 flex-1"><span className="block text-[11px] font-black text-[#0b1530]">Plano de leitura</span><span className="block text-[9px] text-slate-500">Caminhando com propósito</span></span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/5 rounded-full bg-violet-500" /></div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function PastoralViewPreview() {
  const rows = [
    { icon: BookHeart, title: "Preparar mensagem", hint: "Rascunhos, estudos e materiais", color: "bg-emerald-50 text-emerald-700" },
    { icon: MessageCircleHeart, title: "Inbox pastoral", hint: "Acompanhar pessoas e respostas", color: "bg-rose-50 text-rose-700" },
    { icon: UserRoundCheck, title: "Acompanhamentos", hint: "Visitas, orações e conversas", color: "bg-cyan-50 text-cyan-700" },
    { icon: CalendarCheck2, title: "Próximos cuidados", hint: "Jornadas e lembretes", color: "bg-amber-50 text-amber-700" },
  ];

  return (
    <article className="overflow-hidden rounded-2xl border border-[#e8e2d8] bg-white shadow-[0_18px_45px_rgba(11,21,48,0.12)]">
      <div className="flex min-h-[330px]">
        <MiniNav active="Cuidado" />
        <div className="min-w-0 flex-1 p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#087a6b]">Workspace Pastoral</p>
          <h3 className="mt-1 text-sm font-black text-[#0b1530]">Cuidar e preparar</h3>
          <div className="mt-4 space-y-2">
            {rows.map(({ icon: Icon, title, hint, color }) => (
              <div key={title} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${color}`}><Icon size={15} /></span>
                <span className="min-w-0 flex-1"><span className="block text-[11px] font-black text-[#0b1530]">{title}</span><span className="block truncate text-[9px] text-slate-500">{hint}</span></span>
                <ChevronRight size={13} className="text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function ManagementViewPreview() {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#e8e2d8] bg-white shadow-[0_18px_45px_rgba(11,21,48,0.12)]">
      <div className="flex min-h-[350px]">
        <MiniNav active="Cultos" />
        <div className="min-w-0 flex-1 p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#087a6b]">Gestão da Igreja</p>
          <h3 className="mt-1 text-sm font-black text-[#0b1530]">Organizar e avançar</h3>
          <div className="mt-4 rounded-xl bg-[#063f3a] p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[9px] uppercase tracking-widest text-emerald-200">Próximo culto</p><p className="mt-1 text-sm font-black">Culto de Celebração</p><p className="mt-1 text-[9px] text-emerald-100/80">Domingo • 19h</p></div>
              <CalendarDays size={18} className="text-emerald-200" />
            </div>
            <div className="mt-3 flex gap-2"><span className="rounded-full bg-white/10 px-2.5 py-1 text-[8px]">Publicado</span><span className="rounded-full bg-emerald-300/15 px-2.5 py-1 text-[8px] text-emerald-100">Em preparação</span></div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between"><span className="text-[10px] font-black text-[#0b1530]">Confirmações das equipes</span><span className="text-[9px] text-emerald-700">Em andamento</span></div>
              <div className="mt-3 flex -space-x-1.5">
                {["bg-violet-100", "bg-emerald-100", "bg-amber-100", "bg-rose-100"].map((color, index) => <span key={color} className={`grid h-6 w-6 place-items-center rounded-full border-2 border-white text-[8px] text-slate-700 ${color}`}>{index + 1}</span>)}
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-50 text-orange-700"><ClipboardCheck size={15} /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-black text-[#0b1530]">Caixa de aprovações</span><span className="block text-[9px] text-slate-500">Decisões aguardam você</span></span><ChevronRight size={13} className="text-slate-300" /></div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-700"><BellRing size={15} /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-black text-[#0b1530]">Alertas e pendências</span><span className="block text-[9px] text-slate-500">O que falta para concluir</span></span><ChevronRight size={13} className="text-slate-300" /></div>
          </div>
        </div>
      </div>
    </article>
  );
}

function EcosystemPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[760px] pb-8 pt-10 lg:pt-16" aria-label="As três visões conectadas do Culto+">
      <div className="pointer-events-none absolute left-[10%] top-0 hidden h-px w-[76%] border-t border-dashed border-emerald-300 lg:block" />
      <div className="pointer-events-none absolute left-1/2 top-0 hidden h-9 border-l border-dashed border-emerald-300 lg:block" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-end lg:gap-0">
        <div className="relative z-10 lg:translate-x-5 lg:translate-y-2 lg:scale-[0.94]">
          <span className="absolute -top-8 left-4 text-[10px] font-black uppercase tracking-[0.16em] text-violet-700">Minha visão</span>
          <PersonalViewPreview />
        </div>
        <div className="relative z-20 sm:translate-y-5 lg:translate-x-0 lg:translate-y-0">
          <span className="absolute -top-8 left-4 text-[10px] font-black uppercase tracking-[0.16em] text-[#087a6b]">Workspace Pastoral</span>
          <PastoralViewPreview />
        </div>
        <div className="relative z-30 sm:col-span-2 sm:mx-auto sm:w-1/2 lg:col-span-1 lg:mx-0 lg:w-auto lg:-translate-x-5 lg:translate-y-3 lg:scale-[0.94]">
          <span className="absolute -top-8 left-4 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">Gestão da Igreja</span>
          <ManagementViewPreview />
        </div>
      </div>
      <div className="absolute bottom-0 left-1/2 z-40 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-emerald-100 bg-white px-4 py-2 text-[10px] font-black text-[#064e45] shadow-lg sm:flex">
        <ShieldCheck size={14} className="text-emerald-600" /> Papéis diferentes. Uma só conta.
      </div>
    </div>
  );
}

export default function CultoPlusIntroPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fffdf9] font-sans text-[#0b1530] selection:bg-emerald-200 selection:text-emerald-950">
      <a href="#conteudo" className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-[#0b1530] px-4 py-3 text-sm text-white transition-transform focus:translate-y-0">Ir para o conteúdo</a>

      <header className="relative z-50 border-b border-[#eee9e0] bg-[#fffdf9]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-full max-w-[1600px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-10 xl:px-14">
          <Link href="/intro" aria-label="Culto+ — página inicial" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">
            <CultoPlusBrand className="!h-14 sm:!h-16" />
          </Link>

          <nav className="hidden items-center gap-7 text-[13px] text-slate-600 lg:flex" aria-label="Navegação da apresentação">
            <a className="transition-colors hover:text-[#087a6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" href="#experiencia">Experiência</a>
            <a className="transition-colors hover:text-[#087a6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" href="#ecossistema">Para membros</a>
            <a className="transition-colors hover:text-[#087a6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" href="#papeis">Para líderes</a>
            <a className="transition-colors hover:text-[#087a6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" href="#papeis">Para igrejas</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-black text-[#0b1530] transition hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 sm:px-5">Entrar</Link>
            <Link href="/login" className="hidden min-h-11 items-center justify-center gap-2 rounded-xl bg-[#075e52] px-5 text-sm font-black text-white shadow-[0_10px_25px_rgba(7,94,82,0.2)] transition hover:-translate-y-0.5 hover:bg-[#064e45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:inline-flex">Começar <ArrowRight size={16} /></Link>
          </div>
        </div>
      </header>

      <main id="conteudo">
        <section className="relative overflow-hidden border-b border-[#efeae1]" aria-labelledby="intro-title">
          <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-violet-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 top-16 h-80 w-80 rounded-full bg-emerald-100/70 blur-3xl" />
          <div className="mx-auto grid w-full max-w-[1600px] items-center gap-10 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[0.84fr_1.16fr] lg:gap-8 lg:px-10 lg:pb-24 lg:pt-24 xl:px-14">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-500 via-rose-500 to-amber-400" />
                Fé que conecta. Igreja que se move.
              </div>
              <h1 id="intro-title" className="mt-6 max-w-[780px] text-[2.65rem] font-black leading-[0.98] tracking-[-0.055em] text-[#0b1530] sm:text-6xl lg:text-[4.5rem] xl:text-[5.15rem]">
                Sua fé, sua comunidade e sua igreja. <span className="text-[#087a6b]">Tudo conectado.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Da leitura da Bíblia à gestão do próximo culto, o Culto+ acompanha cada passo — viver, crescer, participar, servir e cuidar.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/newhome" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#075e52] px-6 text-sm font-black text-white shadow-[0_14px_35px_rgba(7,94,82,0.22)] transition hover:-translate-y-0.5 hover:bg-[#064e45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">Viver minha jornada <ArrowRight size={17} /></Link>
                <a href="#ecossistema" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-[#0b6459] bg-white px-6 text-sm font-black text-[#075e52] transition hover:-translate-y-0.5 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">Conhecer o Culto+ <ChevronRight size={17} /></a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-500">
                <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-600" /> Uma conta</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-600" /> Visões por papel</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-600" /> Jornada contínua</span>
              </div>
            </div>

            <div className="relative z-10 lg:min-w-0">
              <EcosystemPreview />
            </div>
          </div>
        </section>

        <section id="ecossistema" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24 lg:px-10 lg:py-28 xl:px-14" aria-labelledby="ecosystem-title">
          <div className="mx-auto w-full max-w-[1600px]">
            <div id="ecosystem-title"><SectionHeading eyebrow="Tudo faz parte" title="Um ecossistema. Toda a vida da igreja." description="Culto+ aproxima a jornada de cada pessoa da missão compartilhada pela igreja — sem dividir a experiência em plataformas isoladas." /></div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {capabilities.map(({ title, description, icon: Icon, iconClass, surfaceClass }) => (
                <article key={title} className="group rounded-2xl border border-[#e9e4dc] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl ring-1 ${surfaceClass} ${iconClass}`}><Icon size={21} /></span>
                  <h3 className="mt-5 text-base font-black tracking-tight text-[#0b1530]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="experiencia" className="scroll-mt-24 border-y border-[#ece7de] bg-white px-4 py-20 sm:px-6 lg:px-10 lg:py-24 xl:px-14" aria-labelledby="journey-title">
          <div className="mx-auto w-full max-w-[1600px]">
            <div id="journey-title"><SectionHeading eyebrow="Da Palavra à ação" title="Uma jornada que não se perde entre telas." description="Cada etapa prepara a próxima. O membro acompanha o próprio caminho; líderes e gestores recebem contexto para cuidar e agir." /></div>
            <div className="relative mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:gap-0">
              <div className="pointer-events-none absolute left-[8%] right-[8%] top-7 hidden h-px bg-gradient-to-r from-violet-300 via-orange-300 to-cyan-400 lg:block" />
              {journey.map(({ title, description, icon: Icon, className }, index) => (
                <article key={title} className="relative z-10 flex items-center gap-4 rounded-2xl border border-[#eee9e1] bg-[#fffdf9] p-4 lg:flex-col lg:border-0 lg:bg-transparent lg:p-2 lg:text-center">
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ring-4 ring-white shadow-sm ${className}`}><Icon size={22} /></span>
                  <div><p className="text-sm font-black text-[#0b1530]">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
                  {index < journey.length - 1 ? <ChevronRight size={14} className="ml-auto text-slate-300 lg:hidden" /> : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="papeis" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24 lg:px-10 lg:py-28 xl:px-14" aria-labelledby="roles-title">
          <div className="mx-auto w-full max-w-[1600px]">
            <div id="roles-title"><SectionHeading eyebrow="Uma conta, mais possibilidades" title="Uma experiência que cresce com você." description="Os papéis são acumulativos. Cada pessoa acessa as ferramentas de que precisa sem perder sua vida pessoal no Culto+." /></div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {roleCards.map(({ eyebrow, title, description, icon: Icon, iconClass, borderClass, items }) => (
                <article key={title} className={`relative overflow-hidden rounded-3xl border bg-white p-6 shadow-[0_12px_38px_rgba(15,23,42,0.055)] sm:p-7 ${borderClass}`}>
                  <div className="flex items-start gap-4">
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${iconClass}`}><Icon size={23} /></span>
                    <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p><h3 className="mt-1 text-2xl font-black tracking-tight text-[#0b1530]">{title}</h3></div>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-slate-600">{description}</p>
                  <div className="mt-6 space-y-2.5 rounded-2xl bg-[#faf9f6] p-4">
                    {items.map((item) => <div key={item} className="flex items-center gap-2.5 text-xs text-slate-700"><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check size={12} /></span>{item}</div>)}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-4 text-center text-xs font-black text-emerald-900 sm:text-sm">
              <ShieldCheck size={18} className="shrink-0 text-emerald-700" /> Todos conectados na mesma plataforma. Papéis diferentes, um mesmo propósito.
            </div>
          </div>
        </section>

        <section className="px-4 pb-8 sm:px-6 lg:px-10 lg:pb-10 xl:px-14" aria-labelledby="final-cta-title">
          <div className="relative mx-auto flex w-full max-w-[1600px] flex-col items-start justify-between gap-8 overflow-hidden rounded-[2rem] bg-[#063f3a] px-6 py-9 text-white shadow-[0_20px_60px_rgba(6,63,58,0.22)] sm:px-9 lg:flex-row lg:items-center lg:px-12 lg:py-11">
            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-emerald-300/20" />
            <div className="pointer-events-none absolute -right-4 -top-16 h-52 w-52 rounded-full border border-emerald-300/20" />
            <div className="relative flex items-center gap-5">
              <div className="hidden h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#fffdf9] sm:block"><img src="/brand/culto-plus-logo.png" alt="" className="h-full w-[200%] max-w-none object-cover object-left" /></div>
              <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">Culto+ conectado</p><h2 id="final-cta-title" className="mt-2 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Toda a igreja em um só lugar.</h2><p className="mt-2 text-sm text-emerald-50/75 sm:text-base">Menos plataformas. Mais comunhão. Mais missão.</p></div>
            </div>
            <Link href="/login" className="relative inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-white px-7 text-sm font-black text-[#064e45] shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#063f3a] sm:w-auto">Começar no Culto+ <ArrowRight size={17} /></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#eee9e0] px-4 py-8 sm:px-6 lg:px-10 xl:px-14">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3"><BadgeCheck size={17} className="text-emerald-700" /><p className="text-xs text-slate-500">Culto+ — fé, comunidade, cuidado e gestão conectados.</p></div>
          <div className="flex items-center gap-5 text-xs text-slate-500"><Link className="hover:text-[#087a6b]" href="/login">Entrar</Link><a className="hover:text-[#087a6b]" href="#conteudo">Voltar ao topo</a></div>
        </div>
      </footer>
    </div>
  );
}
