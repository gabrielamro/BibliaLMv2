"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Bell,
  CheckCircle2,
  ClipboardList,
  Medal,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  churchActivitiesPreview,
  churchAlertsPreview,
  churchRecognitionPreview,
  memberUpdatesPreview,
} from "../../services/churchManagementPreviewService";

type SectionKind = "designacoes" | "equipes" | "insignias" | "pedidos";

interface SectionConfig {
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
}

const configs: Record<SectionKind, SectionConfig> = {
  designacoes: {
    title: "Designacoes e atividades",
    eyebrow: "Gestao da Igreja",
    description: "Templates personalizaveis para atividades como criancas, portaria, recepcao, estacionamento e apoio em eventos.",
    icon: ClipboardList,
  },
  equipes: {
    title: "Equipes de servico",
    eyebrow: "Lideres e voluntarios",
    description: "Grupos de lideres e voluntarios por atividade, com alertas de falta de pessoas e pendencias de aceite.",
    icon: Users,
  },
  insignias: {
    title: "Insignias e Mana",
    eyebrow: "Reconhecimento de servico",
    description: "Reconhecimento de disponibilidade e servico, com Mana limitado e auditavel, sem ranking espiritual.",
    icon: Medal,
  },
  pedidos: {
    title: "Pedidos e cuidado",
    eyebrow: "Inbox pastoral",
    description: "Fila de pedidos, status publico, responsaveis e alertas sem expor notas pastorais sensiveis.",
    icon: ShieldCheck,
  },
};

export default function ChurchManagementSectionPage({ section }: { section: SectionKind }) {
  const config = configs[section];
  const Icon = config.icon;

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="border-b border-slate-200 bg-[#0f172a] text-white dark:border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <Link href="/gestao-igreja" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                <Icon size={15} className="text-[#d8b15f]" />
                {config.eyebrow}
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">{config.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{config.description}</p>
            </div>
            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-black uppercase tracking-wider text-slate-950 transition hover:bg-slate-100">
              Nova entrada
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_0.8fr]">
        <div className="grid gap-4">
          {(section === "pedidos" ? memberUpdatesPreview : churchActivitiesPreview).map((item) => {
            const ItemIcon = item.icon;
            const title = item.title;
            const detail = "detail" in item ? item.detail : `Equipe ${item.team} com ${item.people} pessoas ativas.`;
            const status = "status" in item ? item.status : "Ativa";

            return (
              <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                      <ItemIcon size={21} />
                    </span>
                    <div>
                      <h2 className="text-lg font-black">{title}</h2>
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{detail}</p>
                    </div>
                  </div>
                  <span className="w-fit rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    {status}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-5 flex items-center gap-3">
              <Bell size={22} className="text-[#9a7a2f]" />
              <h2 className="text-xl font-black">Alertas</h2>
            </div>
            <div className="space-y-3">
              {churchAlertsPreview.map((alert) => (
                <div key={alert.text} className="rounded-lg border border-slate-200 p-3 text-sm leading-6 text-slate-600 dark:border-white/10 dark:text-slate-300">
                  {alert.text}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-5 flex items-center gap-3">
              <Award size={22} className="text-[#9a7a2f]" />
              <h2 className="text-xl font-black">Reconhecimento</h2>
            </div>
            <div className="space-y-3">
              {churchRecognitionPreview.map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-white/10">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  <div>
                    <p className="font-black">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
