"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Award,
  Bell,
  ChevronRight,
  Medal,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { churchManagementService } from "../../services/churchManagementService";
import {
  churchActivitiesPreview,
  churchAlertsPreview,
  churchMetricsPreview,
  churchRecognitionPreview,
  churchRoadmapPreview,
  churchRulesPreview,
} from "../../services/churchManagementPreviewService";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchManagementSummary } from "../../types";

const cardMotion = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

const quickLinks = [
  { label: "Jornada", href: "/gestao-igreja/jornada" },
  { label: "Pessoas e equipes", href: "/gestao-igreja/pessoas" },
  { label: "Cultos/Eventos", href: "/gestao-igreja/cultos" },
  { label: "Grupos/Celulas", href: "/gestao-igreja/grupos" },
  { label: "Inbox", href: "/gestao-igreja/inbox" },
  { label: "Notificacoes", href: "/gestao-igreja/notificacoes" },
  { label: "Pedidos", href: "/gestao-igreja/pedidos" },
  { label: "Conquistas", href: "/gestao-igreja/insignias" },
  { label: "Indicadores", href: "/gestao-igreja/indicadores" },
  { label: "Configuracoes", href: "/gestao-igreja/configuracoes" },
];

export default function ChurchManagementPreview() {
  const { userProfile } = useAuth();
  const reduceMotion = useReducedMotion();
  const activeChurchId = userProfile?.churchData?.churchId;
  const [summary, setSummary] = useState<ChurchManagementSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  useEffect(() => {
    if (!activeChurchId) return;
    let isMounted = true;
    setIsLoadingSummary(true);
    churchManagementService.getSummary(activeChurchId)
      .then((data) => {
        if (isMounted) setSummary(data);
      })
      .catch(() => {
        if (isMounted) setSummary(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSummary(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId]);

  const metrics = useMemo(() => {
    if (!summary) return churchMetricsPreview;
    return [
      { label: "Pedidos abertos", value: String(summary.openSubmissions), detail: "Fonte: inbox da igreja" },
      { label: "Designacoes pendentes", value: String(summary.pendingAssignments), detail: "Convites aguardando aceite" },
      { label: "Equipes ativas", value: String(summary.activeTeams), detail: "Grupos operacionais" },
      { label: "QR ativos", value: String(summary.activeQrForms), detail: "Formularios publicos" },
      { label: "Alertas", value: String(summary.unreadNotifications), detail: "Notificacoes nao lidas" },
      { label: "Conquistas", value: String(summary.badgesAwarded), detail: "Selos padrao registrados" },
    ];
  }, [summary]);

  const attentionAlerts = useMemo(() => {
    if (!summary) return churchAlertsPreview;
    return [
      { text: `${summary.openSubmissions} pedidos abertos aguardam acompanhamento.` },
      { text: `${summary.pendingAssignments} designacoes ainda precisam de aceite.` },
      { text: `${summary.unreadNotifications} alertas estao pendentes no modulo.` },
      { text: `${summary.activeQrForms} QR Codes ativos recebem novas respostas.` },
    ];
  }, [summary]);
  const motionProps = reduceMotion
    ? {}
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
        variants: { visible: { transition: { staggerChildren: 0.06 } } },
      };

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="border-b border-slate-200 bg-[#0f172a] text-white dark:border-white/10">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
              <Sparkles size={15} className="text-[#d8b15f]" />
              Prata, platina e grafite
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-normal sm:text-5xl">
              Gestao da Igreja
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              Um primeiro corte visual para administrar pedidos, atividades de
              servico, equipes, designacoes, alertas, conquistas e Mana de
              voluntariado sem misturar isso com o Workspace Pastoral.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/gestao-igreja/designacoes"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-black uppercase tracking-wider text-slate-950 transition hover:bg-slate-100"
              >
                Ver designacoes
                <ChevronRight size={16} />
              </Link>
              <Link
                href="/gestao-igreja/jornada"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/10"
              >
                Ver jornada
              </Link>
              <Link
                href="/meus-cultos"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/10"
              >
                Area do membro
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/8 p-4 shadow-2xl shadow-black/25">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
                  Atencao hoje
                </p>
                <h2 className="mt-1 text-xl font-black">Painel operacional</h2>
              </div>
              <span className="rounded-lg bg-[#d8b15f]/15 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#f4d789]">
                {summary ? "Dados reais" : "MVP visual"}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {attentionAlerts.map((alert) => (
                <div key={alert.text} className="rounded-lg border border-white/12 bg-white/8 p-3">
                  <Bell size={16} className="mb-3 text-[#d8b15f]" />
                  <p className="text-sm leading-6 text-slate-200">{alert.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <motion.section {...motionProps} className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <nav className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Atalhos de gestao da igreja">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-12 items-center justify-between rounded-lg border border-slate-200 bg-white px-4 text-sm font-black uppercase tracking-wider text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
            >
              {item.label}
              <ChevronRight size={16} />
            </Link>
          ))}
        </nav>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isLoadingSummary ? (
            <div className="md:col-span-2 xl:col-span-4 rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              Carregando resumo da igreja...
            </div>
          ) : null}
          {metrics.map((metric) => (
            <motion.article
              key={`${metric.label}-${metric.value}`}
              variants={cardMotion}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {metric.label}
              </p>
              <p className="mt-3 text-3xl font-black">{metric.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{metric.detail}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <section id="atividades" className="mx-auto grid max-w-7xl gap-6 px-5 pb-8 md:px-8 xl:grid-cols-[minmax(0,1.15fr)_0.85fr]">
        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Designacoes por atividade
              </p>
              <h2 className="mt-2 text-3xl font-black">Equipes e servico pratico</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {churchActivitiesPreview.map((activity) => {
              const Icon = activity.icon;
              return (
                <article
                  key={activity.title}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                    <Icon size={21} />
                  </div>
                  <h3 className="text-lg font-black">{activity.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Equipe {activity.team} com {activity.people} pessoas ativas.
                  </p>
                  <Link href="/gestao-igreja/equipes" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                    Ver equipe
                    <ChevronRight size={14} />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-5 flex items-center gap-3">
              <ShieldCheck size={22} className="text-slate-700 dark:text-slate-200" />
              <h2 className="text-xl font-black">Regras do MVP</h2>
            </div>
            <div className="space-y-3">
              {churchRulesPreview.map(([rule, Icon]) => (
                <div key={rule} className="flex items-start gap-3">
                  <Icon size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{rule}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-5 flex items-center gap-3">
              <Medal size={22} className="text-[#9a7a2f]" />
              <h2 className="text-xl font-black">Conquistas e Mana</h2>
            </div>
            <div className="space-y-3">
              {churchRecognitionPreview.map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{item.label}</p>
                    <span className="rounded-lg bg-[#d8b15f]/15 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#8a6b22] dark:text-[#f4d789]">
                      {item.mana}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="border-t border-slate-200 bg-white px-5 py-8 dark:border-white/10 dark:bg-white/[0.03] md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Roadmap vivo
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {churchRoadmapPreview.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-[#f8fafc] p-4 dark:border-white/10 dark:bg-[#0f172a]">
                <Award size={18} className="text-slate-500 dark:text-slate-300" />
                <span className="text-sm font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
