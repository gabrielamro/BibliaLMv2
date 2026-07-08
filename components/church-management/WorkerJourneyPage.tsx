"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  HeartHandshake,
  Medal,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

const steps = [
  {
    title: "Recebo um convite",
    text: "A igreja envia uma designacao, escala, equipe ou pedido de disponibilidade. O obreiro ve apenas o que diz respeito a ele.",
    icon: Bell,
  },
  {
    title: "Entendo o contexto",
    text: "A atividade mostra funcao, proxima acao, retorno esperado e, quando existir, equipe ou culto relacionado.",
    icon: ClipboardList,
  },
  {
    title: "Respondo com responsabilidade",
    text: "O obreiro aceita ou recusa uma designacao. A lideranca recebe alerta sem expor detalhes publicos desnecessarios.",
    icon: UserCheck,
  },
  {
    title: "Sirvo com acompanhamento",
    text: "Minha Igreja centraliza designacoes, equipes, status de pedidos enviados e mensagens de retorno permitidas.",
    icon: CalendarDays,
  },
  {
    title: "Recebo reconhecimento saudavel",
    text: "Eventos auditaveis de servico podem gerar insignias e Mana, sem ranking espiritual individual no MVP.",
    icon: Medal,
  },
];

const panels = [
  ["Minhas designacoes", "Convites, aceite, recusa e atividades em aberto.", "/minha-igreja/designacoes", ClipboardCheck],
  ["Minhas equipes", "Onde sirvo, com quem caminho e qual escopo recebi.", "/minha-igreja/equipes", HeartHandshake],
  ["Meu acompanhamento", "Pedidos enviados, voluntariado, grupos e retorno publico.", "/minha-igreja/acompanhamento", ShieldCheck],
  ["Minhas conquistas", "Insignias e Mana de servico registrados por eventos reais.", "/minha-igreja/insignias", Award],
];

export default function WorkerJourneyPage() {
  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="border-b border-slate-200 bg-[#0f172a] text-white dark:border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <Link href="/minha-igreja" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                <UserCheck size={15} className="text-[#d8b15f]" />
                Jornada do obreiro
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">Como servir pela Minha Igreja</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                Um caminho simples para o obreiro entender convites, designacoes, equipes, acompanhamento e reconhecimento sem confundir servico com competicao espiritual.
              </p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/8 p-5">
              <h2 className="text-xl font-black">Principio central</h2>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                Minha Igreja e o espelho seguro da gestao: mostra o que eu recebi, o que respondi, onde sirvo e qual retorno a igreja pode me dar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex gap-4">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                    <Icon size={22} />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Passo {index + 1}</p>
                    <h2 className="mt-1 text-xl font-black">{step.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{step.text}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="text-xl font-black">Areas da jornada</h2>
            <div className="mt-4 grid gap-3">
              {panels.map(([title, text, href, Icon]) => {
                const PanelIcon = Icon as typeof UserCheck;
                return (
                  <Link key={title as string} href={href as string} className="rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10">
                    <div className="flex gap-3">
                      <PanelIcon size={19} className="mt-1 shrink-0 text-[#9a7a2f]" />
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider">{title as string}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{text as string}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="text-xl font-black">O que protege o obreiro</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {[
                "O obreiro nao ve dados administrativos da igreja.",
                "Recusas e disponibilidade devem ser tratadas com discricao.",
                "Insignias reconhecem servico auditavel, nao maturidade espiritual.",
                "Pedidos pastorais sensiveis continuam restritos a pessoas autorizadas.",
              ].map((item) => (
                <p key={item} className="flex gap-3">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  {item}
                </p>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
