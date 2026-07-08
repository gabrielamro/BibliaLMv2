"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Bell,
  CheckCircle2,
  ClipboardList,
  HeartHandshake,
  KeyRound,
  QrCode,
  ShieldCheck,
  UserCheck,
  Users,
  Smartphone,
  Inbox,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

type FlowStep = {
  title: string;
  actor: string;
  actorColor: string;
  description: string;
  icon: LucideIcon;
  meta: string;
};

const journeyFlowSteps: FlowStep[] = [
  {
    title: "Interação Inicial",
    actor: "Membro / Visitante",
    actorColor: "bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30",
    description: "Escaneia um QR Code na igreja e preenche um formulário (oração, voluntariado, etc.).",
    icon: Smartphone,
    meta: "Entrada sem atrito via celular",
  },
  {
    title: "Triagem Inteligente",
    actor: "Sistema",
    actorColor: "bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/30",
    description: "Roteia o envio automaticamente: solicitações íntimas para pastores, operacionais para líderes.",
    icon: Sparkles,
    meta: "Garante privacidade & ordem",
  },
  {
    title: "Análise na Inbox",
    actor: "Pastor / Gestor",
    actorColor: "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30",
    description: "O responsável avalia o pedido, define a urgência e registra notas internas confidenciais.",
    icon: Inbox,
    meta: "Triagem sem expor bastidores",
  },
  {
    title: "Criação de Escala",
    actor: "Gestor / Líder",
    actorColor: "bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30",
    description: "Designa o membro para servir em uma equipe de culto, evento ou atividade específica.",
    icon: ClipboardList,
    meta: "Organiza as equipes",
  },
  {
    title: "Geração de Alerta",
    actor: "Central de Notificações",
    actorColor: "bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30",
    description: "Cria a notificação e acende o alerta visual de pendência no painel do usuário.",
    icon: Bell,
    meta: "Notificação em tempo real",
  },
  {
    title: "Aceite & Resposta",
    actor: "Voluntário / Membro",
    actorColor: "bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30",
    description: "Visualiza a escala na área 'Minha Igreja', confirma ou recusa, e o líder é alertado.",
    icon: CheckCircle2,
    meta: "Ciclo de comunicação fechado",
  },
];

type Journey = {
  role: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  steps: Array<{ title: string; text: string; icon: LucideIcon }>;
  guardrails: string[];
};

const journeys: Journey[] = [
  {
    role: "Gestor",
    eyebrow: "Operacao da igreja",
    description: "Organiza a estrutura operacional sem precisar assumir funcoes pastorais sensiveis.",
    icon: ShieldCheck,
    steps: [
      { title: "Configura a igreja", text: "Define preferencias, cria equipes, prepara QR Codes e acompanha indicadores leves.", icon: KeyRound },
      { title: "Distribui responsabilidades", text: "Concede permissoes, cria designacoes e atribui pedidos para pessoas autorizadas.", icon: Users },
      { title: "Acompanha pendencias", text: "Usa dashboard, inbox e alertas para saber o que precisa de acao.", icon: Bell },
    ],
    guardrails: ["Nao recebe acesso pastoral sensivel automaticamente.", "Nao mede espiritualidade de pessoas.", "Usa dados reais e listas paginadas."],
  },
  {
    role: "Lider",
    eyebrow: "Escopo e equipe",
    description: "Cuida de uma equipe, grupo ou atividade especifica dentro do escopo recebido.",
    icon: Users,
    steps: [
      { title: "Recebe escopo", text: "O acesso vem por role e escopo: equipe, grupo, culto, evento ou igreja.", icon: KeyRound },
      { title: "Acompanha pessoas", text: "Visualiza designacoes, voluntarios e pedidos que foram atribuídos ao seu escopo.", icon: UserCheck },
      { title: "Aciona proximos passos", text: "Atualiza status, confirma responsaveis e ajuda a manter retorno claro ao membro.", icon: CheckCircle2 },
    ],
    guardrails: ["Nao acessa cuidado pastoral privado por padrao.", "Nao administra toda a igreja sem permissao.", "Atua apenas onde recebeu responsabilidade."],
  },
  {
    role: "Pastor",
    eyebrow: "Cuidado pastoral",
    description: "Acompanha pedidos sensiveis e cuidado humano sem virar gestor administrativo por obrigacao.",
    icon: HeartHandshake,
    steps: [
      { title: "Recebe pedidos sensiveis", text: "Pedidos de oracao e conversa pastoral entram na inbox com prioridade adequada.", icon: HeartHandshake },
      { title: "Atribui cuidado", text: "Pode assumir ou encaminhar acompanhamentos sem expor notas internas ao membro.", icon: ClipboardList },
      { title: "Devolve retorno seguro", text: "O membro ve status publico e proxima acao, nao bastidores pastorais.", icon: ShieldCheck },
    ],
    guardrails: ["Pastor nao vira gestor automaticamente.", "Privacidade vem antes de conveniencia operacional.", "IA nao substitui cuidado humano."],
  },
  {
    role: "Voluntario",
    eyebrow: "Servico e resposta",
    description: "Recebe convites, aceita ou recusa designacoes e acompanha sua propria jornada em Minha Igreja.",
    icon: UserCheck,
    steps: [
      { title: "Recebe designacao", text: "A igreja envia uma atividade de servico com contexto, data e retorno esperado.", icon: ClipboardList },
      { title: "Confirma disponibilidade", text: "O voluntario aceita ou recusa, e a liderança recebe alerta acionavel.", icon: CheckCircle2 },
      { title: "Acompanha reconhecimento", text: "Servicos auditaveis podem gerar insignias e Mana sem ranking espiritual publico.", icon: Bell },
    ],
    guardrails: ["Ve suas proprias atividades, nao dados administrativos.", "Reconhecimento nao mede valor espiritual.", "Recusa nao deve expor justificativas publicamente."],
  },
];

const flow = [
  ["1", "Papel e escopo", "A igreja separa plano comercial de responsabilidade eclesiastica."],
  ["2", "Entrada operacional", "QR, designacao, equipe, grupo ou culto gera um registro real."],
  ["3", "Inbox e alerta", "A pessoa certa recebe uma pendencia pequena, deduplicada e acionavel."],
  ["4", "Retorno ao membro", "Minha Igreja mostra status publico, proxima acao e historico permitido."],
];

export default function ChurchRoleJourneysPage() {
  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="border-b border-slate-200 bg-[#0f172a] text-white dark:border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <Link href="/gestao-igreja" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                <ShieldCheck size={15} className="text-[#d8b15f]" />
                Jornada por papel
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">Como a Gestao da Igreja funciona</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                Um mapa simples para gestor, lider, pastor e voluntario entenderem onde entram, o que podem fazer e quais limites protegem a igreja.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {flow.map(([number, title, text]) => (
                <div key={number} className="rounded-lg border border-white/15 bg-white/8 p-4">
                  <p className="text-2xl font-black text-[#d8b15f]">{number}</p>
                  <h2 className="mt-2 text-sm font-black uppercase tracking-wider">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FLUXO OPERACIONAL COMPLETO ==================== */}
      <section className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 mb-4">
            <Sparkles size={13} className="text-[#c5a059]" />
            Mapeamento de Processo
          </div>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Fluxo da Jornada: Do Envio à Notificação
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Veja como cada ação se conecta de ponta a ponta. O processo garante que as solicitações dos membros encontrem os atores certos de forma ágil, segura e organizada.
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 items-stretch relative">
          {journeyFlowSteps.map((step, idx) => {
            const StepIcon = step.icon;
            return (
              <div key={idx} className="flex-1 flex flex-col xl:flex-row items-center gap-4 xl:gap-0 relative">
                {/* Card do Passo */}
                <div className="w-full flex-1 flex flex-col justify-between p-5 rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.02] shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 group min-h-[240px]">
                  <div>
                    {/* Ator Principal */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${step.actorColor}`}>
                        {step.actor}
                      </span>
                      <span className="text-xs font-black text-slate-400 dark:text-slate-600">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Ícone e Título */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 text-[#c5a059] group-hover:scale-110 transition-transform">
                        <StepIcon size={20} />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        {step.title}
                      </h3>
                    </div>

                    {/* Descrição */}
                    <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
                      {step.description}
                    </p>
                  </div>

                  {/* Detalhe ou Meta do Passo */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 text-[10px] text-slate-400 dark:text-slate-500 italic">
                    {step.meta}
                  </div>
                </div>

                {/* Seta Conectora */}
                {idx < journeyFlowSteps.length - 1 && (
                  <div className="flex items-center justify-center shrink-0 text-slate-400 dark:text-slate-600
                    xl:w-8 xl:h-auto
                    h-8 w-full
                  ">
                    <ArrowRight className="hidden xl:block text-[#c5a059]" size={20} />
                    <ArrowDown className="block xl:hidden animate-bounce text-[#c5a059]" size={20} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-8 md:px-8 xl:grid-cols-2">
        {journeys.map((journey) => {
          const RoleIcon = journey.icon;
          return (
            <article key={journey.role} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                  <RoleIcon size={23} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{journey.eyebrow}</p>
                  <h2 className="mt-1 text-2xl font-black">{journey.role}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{journey.description}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {journey.steps.map((step) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={step.title} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                      <div className="flex gap-3">
                        <StepIcon size={18} className="mt-1 shrink-0 text-[#9a7a2f]" />
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-wider">{step.title}</h3>
                          <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">{step.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-lg bg-slate-50 p-4 dark:bg-white/10">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">Limites saudaveis</h3>
                <div className="mt-3 grid gap-2">
                  {journey.guardrails.map((item) => (
                    <p key={item} className="flex gap-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      <CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-10 md:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Funcionalidade em uma frase</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                A Gestao da Igreja transforma entradas reais em responsabilidades claras, alertas pequenos e retorno seguro para o membro.
              </p>
            </div>
            <Link href="/gestao-igreja/qrcodes" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
              <QrCode size={16} />
              Ver QR Codes
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
