"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Church,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  HandHeart,
  Layers3,
  LockKeyhole,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  UserCog,
  UserRoundCheck,
  Workflow,
  Zap,
} from "lucide-react";

const highlights = [
  {
    title: "Modulo independente",
    text: "Gestao da Igreja nasce como area propria do Culto+, sem depender do Workspace Pastoral.",
    icon: Layers3,
  },
  {
    title: "Perfis por funcao",
    text: "Gestor, Pastor, Lider e Voluntario passam a ter permissoes separadas por igreja e escopo.",
    icon: UserCog,
  },
  {
    title: "QR Codes para a igreja",
    text: "Pedidos de oracao, voluntariado, visitantes e formularios poderao nascer de um QR simples.",
    icon: QrCode,
  },
  {
    title: "Dashboard com dados reais",
    text: "Indicadores partem de eventos, contadores e snapshots, sem depender de mocks ou listas completas.",
    icon: BarChart3,
  },
];

const modules = [
  {
    title: "Dashboard operacional",
    text: "Uma primeira tela com indicadores leves, pendencias recentes, acoes rapidas e origem de cada dado.",
    icon: BarChart3,
    color: "text-slate-700 bg-slate-100 dark:text-slate-200 dark:bg-white/10",
  },
  {
    title: "Pessoas e lideranca",
    text: "Diretorio de membros com papeis, grupos, ministerios, status e acompanhamento por permissao.",
    icon: Users,
    color: "text-blue-700 bg-blue-50 dark:text-blue-200 dark:bg-blue-500/10",
  },
  {
    title: "Pedidos e cuidado",
    text: "Inbox pastoral para oracao, aconselhamento, visitantes, follow-ups e tarefas atribuidas.",
    icon: HandHeart,
    color: "text-rose-700 bg-rose-50 dark:text-rose-200 dark:bg-rose-500/10",
  },
  {
    title: "QR Codes e formularios",
    text: "Links publicos por token para imprimir, exibir em slides ou compartilhar em eventos da igreja.",
    icon: QrCode,
    color: "text-violet-700 bg-violet-50 dark:text-violet-200 dark:bg-violet-500/10",
  },
  {
    title: "Voluntarios e ministerios",
    text: "Pipeline de interessados, vinculo com ministerios, disponibilidade e escalas integradas ao Culto+.",
    icon: UserRoundCheck,
    color: "text-emerald-700 bg-emerald-50 dark:text-emerald-200 dark:bg-emerald-500/10",
  },
  {
    title: "Relatorios e snapshots",
    text: "Historico por periodo sem varrer tabelas inteiras em tempo real, mantendo o MVP mais economico.",
    icon: ClipboardList,
    color: "text-amber-700 bg-amber-50 dark:text-amber-200 dark:bg-amber-500/10",
  },
];

const roadmapSteps = [
  {
    step: "01",
    title: "Roles e permissoes",
    text: "Separar assinatura comercial de papel operacional dentro da igreja.",
  },
  {
    step: "02",
    title: "Shell premium",
    text: "Criar a experiencia platina/grafite com cards, header do modulo e navegacao propria.",
  },
  {
    step: "03",
    title: "Dashboard v0",
    text: "Mostrar dados existentes com queries leves, projection explicita e detalhes sob demanda.",
  },
  {
    step: "04",
    title: "QR e formularios",
    text: "Gerar links publicos para pedidos de oracao, voluntariado, visitantes e outros fluxos.",
  },
  {
    step: "05",
    title: "Inbox pastoral",
    text: "Organizar pedidos, responsaveis, status, prioridade e acompanhamento com privacidade.",
  },
  {
    step: "06",
    title: "Voluntariado e analytics",
    text: "Conectar ministerios, escalas, grupos, snapshots e relatorios de maturidade.",
  },
];

const principles = [
  "Pastor pode usar recursos pastorais sem ser gestor administrativo.",
  "Gestor pode administrar a igreja sem receber acesso pastoral sensivel automaticamente.",
  "Indicadores medem organizacao, participacao e cuidado, nao espiritualidade individual.",
  "IA fica fora do caminho critico e entra apenas como apoio opcional.",
];

const previewMetrics = [
  { label: "Pedidos abertos", value: "24", detail: "8 aguardando responsavel" },
  { label: "QR ativos", value: "7", detail: "3 campanhas no culto" },
  { label: "Voluntarios", value: "142", detail: "18 em triagem" },
];

const attentionItems = [
  { label: "Follow-ups atrasados", value: "5", icon: Clock3 },
  { label: "Escalas pendentes", value: "12", icon: CalendarDays },
  { label: "Pedidos urgentes", value: "3", icon: Bell },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-950 dark:bg-[#06080c] dark:text-white">
      <section className="relative overflow-hidden bg-[#0f172a] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#030712_0%,#111827_44%,#cbd5e1_140%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#f8fafc,transparent)] opacity-70" />
        <div className="relative mx-auto grid min-h-[680px] max-w-7xl gap-10 px-5 py-7 md:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-12">
          <div>
            <nav className="mb-16 flex items-center justify-between gap-4 lg:mb-20" aria-label="Navegacao da apresentacao">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 text-sm font-semibold text-white transition hover:bg-white/12"
              >
                <Church size={18} className="text-[#d8b15f]" />
                Culto+
              </Link>
              <Link
                href="/apresentacao"
                className="hidden min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-xs font-black uppercase tracking-widest text-slate-200 transition hover:bg-white/10 sm:inline-flex"
              >
                Apresentacao
                <ChevronRight size={14} />
              </Link>
            </nav>

            <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
              <Sparkles size={15} className="text-[#d8b15f]" />
              Roadmap Gestao da Igreja
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
              As proximas novidades para a gestao da igreja no Culto+
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Um novo modulo independente para organizar pessoas, pedidos, QR Codes,
              voluntariado, ministerios e indicadores com uma experiencia premium em
              prata, platina e grafite.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#novidades"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-slate-100 px-5 text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white"
              >
                Ver novidades
                <ArrowRight size={17} />
              </a>
              <a
                href="#implantacao"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/8 px-5 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/12"
              >
                Etapas do roadmap
              </a>
            </div>
          </div>

          <div className="relative pb-8 lg:pb-0">
            <div className="absolute -inset-4 rounded-[2rem] border border-white/10 bg-white/5 blur-xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#f8fafc] p-4 text-slate-950 shadow-2xl shadow-black/35 dark:bg-[#111827] dark:text-white">
              <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-white/10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Preview do modulo</p>
                  <h2 className="mt-1 text-xl font-black">Gestao da Igreja</h2>
                </div>
                <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black uppercase tracking-wider text-white dark:bg-white dark:text-slate-950">
                  <QrCode size={15} />
                  Novo QR
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {previewMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{metric.label}</p>
                    <p className="mt-3 text-3xl font-black">{metric.value}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{metric.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h3 className="text-sm font-black">Fluxos que chegam por QR</h3>
                    <span className="rounded-lg bg-[#d8b15f]/15 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#8a6b22] dark:text-[#f4d789]">
                      Ao vivo
                    </span>
                  </div>
                  <div className="space-y-3">
                    {["Pedido de oracao", "Quero ser voluntario", "Sou visitante"].map((item, index) => (
                      <div key={item} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-3 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-xs font-black text-white dark:bg-slate-200 dark:text-slate-950">
                            {index + 1}
                          </span>
                          <span className="text-sm font-semibold">{item}</span>
                        </div>
                        <ArrowRight size={16} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <h3 className="text-sm font-black">Atencao hoje</h3>
                  <div className="mt-4 space-y-3">
                    {attentionItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                              <Icon size={17} />
                            </span>
                            <span className="text-sm text-slate-600 dark:text-slate-300">{item.label}</span>
                          </div>
                          <span className="text-lg font-black">{item.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="novidades" className="px-5 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Novidades previstas</p>
            <h2 className="mt-3 text-3xl font-black tracking-normal sm:text-4xl">
              O que esse roadmap pode trazer para a aplicacao
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
              A proposta amplia o Culto+ de estudo, culto e comunidade para uma
              operacao pastoral organizada, mantendo custo baixo no MVP e protegendo
              dados sensiveis.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/20">
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                    <Icon size={21} />
                  </div>
                  <h3 className="text-lg font-black">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-16 dark:border-white/10 dark:bg-white/[0.03] md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Areas do modulo</p>
              <h2 className="mt-3 text-3xl font-black tracking-normal sm:text-4xl">
                Mais cards, mais contexto, menos trabalho manual
              </h2>
            </div>
            <p className="text-base leading-8 text-slate-600 dark:text-slate-300">
              Cada area deve nascer com acoes claras, listas paginadas e detalhes
              sob demanda. O objetivo nao e so ver numeros, mas saber o que precisa
              de cuidado hoje.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-lg border border-slate-200 bg-[#f8fafc] p-5 dark:border-white/10 dark:bg-[#0f172a]">
                  <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg ${item.color}`}>
                    <Icon size={21} />
                  </div>
                  <h3 className="text-lg font-black">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="implantacao" className="px-5 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Ordem de implantacao</p>
              <h2 className="mt-3 text-3xl font-black tracking-normal sm:text-4xl">
                Um caminho por etapas, sem inflar custo no inicio
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
                O roadmap prioriza seguranca, permissoes, shell visual e dados baratos
                antes de relatorios avancados e automacoes.
              </p>
            </div>

            <div className="grid gap-3">
              {roadmapSteps.map((item) => (
                <article key={item.step} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-[72px_1fr]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-950 text-sm font-black text-white dark:bg-white dark:text-slate-950">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-black">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#eef1f5] px-5 py-16 dark:border-white/10 dark:bg-[#0f172a] md:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3">
          <article className="rounded-lg border border-slate-300 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <ShieldCheck className="mb-5 text-slate-700 dark:text-slate-200" size={28} />
            <h3 className="text-xl font-black">Seguranca por papel</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              RLS, escopos e roles reduzem o risco de expor pedidos privados ou
              informacoes pastorais sensiveis.
            </p>
          </article>
          <article className="rounded-lg border border-slate-300 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <Zap className="mb-5 text-slate-700 dark:text-slate-200" size={28} />
            <h3 className="text-xl font-black">Queries economicas</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Primeira tela leve, projections explicitas, listas paginadas,
              snapshots e detalhes carregados apenas quando necessario.
            </p>
          </article>
          <article className="rounded-lg border border-slate-300 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <LockKeyhole className="mb-5 text-slate-700 dark:text-slate-200" size={28} />
            <h3 className="text-xl font-black">Cuidado sem vigilancia</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Indicadores acompanham participacao, resposta e pendencias, sem
              classificar espiritualidade individual.
            </p>
          </article>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Principios de produto</p>
            <h2 className="mt-3 text-3xl font-black tracking-normal sm:text-4xl">
              Gestao da igreja sem confundir papeis pastorais
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
              A arquitetura proposta evita amarrar o usuario: nem todo pastor faz
              gestao administrativa, e nem todo gestor e pastor.
            </p>
          </div>

          <div className="grid gap-3">
            {principles.map((principle) => (
              <div key={principle} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300" />
                <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">{principle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 md:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-slate-300 bg-[#0f172a] p-6 text-white shadow-2xl shadow-slate-950/20 dark:border-white/10 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-300">Resultado esperado</p>
              <h2 className="mt-3 text-3xl font-black tracking-normal sm:text-4xl">
                Uma nova camada de operacao pastoral no Culto+
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                A Gestao da Igreja pode transformar o Culto+ em uma plataforma
                que conecta estudo, culto, comunidade e administracao leve da igreja
                local, com visual premium e crescimento por etapas.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-black uppercase tracking-wider text-slate-950 transition hover:bg-slate-100"
              >
                Abrir Culto+
                <ArrowRight size={17} />
              </Link>
              <a
                href="#novidades"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/15 px-5 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/10"
              >
                <Download size={17} />
                Rever novidades
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
