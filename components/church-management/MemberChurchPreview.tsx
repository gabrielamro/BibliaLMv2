"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Award,
  ChevronRight,
  Clock3,
  Medal,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { churchManagementService } from "../../services/churchManagementService";
import {
  memberActionsPreview,
  memberBadgesPreview,
  memberInfoCardsPreview,
  memberUpdatesPreview,
} from "../../services/churchManagementPreviewService";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchAssignment, ChurchFormSubmission, ChurchVolunteerBadge } from "../../types";

const cardMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const memberQuickLinks = [
  { label: "Jornada do obreiro", href: "/minha-igreja/jornada-obreiro" },
  { label: "Acompanhamento", href: "/minha-igreja/acompanhamento" },
  { label: "Designacoes", href: "/minha-igreja/designacoes" },
  { label: "Equipes", href: "/minha-igreja/equipes" },
  { label: "Conquistas", href: "/minha-igreja/insignias" },
];

export default function MemberChurchPreview() {
  const { currentUser, userProfile } = useAuth();
  const reduceMotion = useReducedMotion();
  const activeChurchId = userProfile?.churchData?.churchId;
  const currentUserId = currentUser?.id ?? currentUser?.uid;
  const [submissions, setSubmissions] = useState<ChurchFormSubmission[]>([]);
  const [assignments, setAssignments] = useState<ChurchAssignment[]>([]);
  const [badges, setBadges] = useState<ChurchVolunteerBadge[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeChurchId || !currentUserId) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      churchManagementService.listSubmissions(activeChurchId, { submitterUserId: currentUserId, limit: 10 }),
      churchManagementService.listAssignments(activeChurchId, { assigneeUserId: currentUserId, limit: 10 }),
      churchManagementService.listBadges(activeChurchId, { userId: currentUserId, limit: 10 }),
    ])
      .then(([submissionItems, assignmentItems, badgeItems]) => {
        if (!isMounted) return;
        setSubmissions(submissionItems);
        setAssignments(assignmentItems);
        setBadges(badgeItems);
      })
      .catch(() => {
        if (!isMounted) return;
        setSubmissions([]);
        setAssignments([]);
        setBadges([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeChurchId, currentUserId]);

  const headerStats = useMemo(() => {
    if (!activeChurchId || (!submissions.length && !assignments.length && !badges.length)) {
      return [
        ["Pendencias", "3"],
        ["Designacoes", "4"],
        ["Mana de servico", "85"],
      ];
    }

    return [
      ["Pendencias", String(submissions.filter((item) => item.status !== "closed" && item.status !== "archived").length + assignments.filter((item) => item.status === "pending").length)],
      ["Designacoes", String(assignments.length)],
      ["Mana de servico", String(badges.reduce((sum, badge) => sum + badge.manaAmount, 0))],
    ];
  }, [activeChurchId, assignments, badges, submissions]);

  const timelineItems = useMemo(() => {
    if (submissions.length > 0 || assignments.length > 0) {
      return [
        ...submissions.slice(0, 3).map((submission) => ({
          key: `submission-${submission.id}`,
          title: getSubmissionTitle(submission.formType),
          detail: submission.publicFeedback || submission.publicStatus || "Recebido pela igreja.",
          status: getPublicStatus(submission.status, submission.publicStatus),
          icon: ShieldCheck,
        })),
        ...assignments.slice(0, 2).map((assignment) => ({
          key: `assignment-${assignment.id}`,
          title: assignment.title,
          detail: assignment.publicFeedback || assignment.description || "Designacao atribuida pela igreja.",
          status: getAssignmentStatus(assignment.status),
          icon: Clock3,
        })),
      ];
    }

    return memberUpdatesPreview.map((update) => ({
      key: update.title,
      title: update.title,
      detail: update.detail,
      status: update.status,
      icon: update.icon,
    }));
  }, [assignments, submissions]);

  const badgeItems = useMemo(() => {
    if (badges.length > 0) {
      return badges.slice(0, 3).map((badge) => ({
        key: badge.id,
        label: badge.title,
        text: badge.description || "Conquista padrao do BibliaLM registrada por evento auditavel.",
        mana: `${badge.manaAmount} Mana`,
      }));
    }

    return memberBadgesPreview.map((badge) => ({ key: badge.label, ...badge }));
  }, [badges]);

  const motionProps = reduceMotion
    ? {}
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
        variants: { visible: { transition: { staggerChildren: 0.06 } } },
      };

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="border-b border-slate-200 bg-[#0f172a] text-white dark:border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                <Sparkles size={15} className="text-[#d8b15f]" />
                Minha Igreja
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">
                Meu Acompanhamento
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                A area do membro para acompanhar retornos da igreja, proximas
                acoes, designacoes de servico, equipes, conquistas e Mana recebido.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {headerStats.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/15 bg-white/8 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{label}</p>
                  <p className="mt-3 text-3xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <motion.section {...motionProps} className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1.15fr)_0.85fr]">
        <div>
          {isLoading ? (
            <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              Carregando seus retornos da igreja...
            </div>
          ) : null}
          <nav className="mb-6 grid gap-3 sm:grid-cols-2" aria-label="Atalhos da area do membro">
            {memberQuickLinks.map((item) => (
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
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Retornos da igreja
              </p>
              <h2 className="mt-2 text-3xl font-black">Linha do tempo segura</h2>
            </div>
          </div>
          <div className="space-y-4">
            {timelineItems.map((update) => {
              const Icon = update.icon;
              return (
                <motion.article
                  key={update.key}
                  variants={cardMotion}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                        <Icon size={21} />
                      </span>
                      <div>
                        <h3 className="text-lg font-black">{update.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{update.detail}</p>
                      </div>
                    </div>
                    <span className="w-fit rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-200">
                      {update.status}
                    </span>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-5 flex items-center gap-3">
              <Clock3 size={22} className="text-slate-700 dark:text-slate-200" />
              <h2 className="text-xl font-black">Proximas acoes</h2>
            </div>
            <div className="space-y-3">
              {memberActionsPreview.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    className="flex min-h-12 w-full items-center gap-3 rounded-lg border border-slate-200 px-3 text-left text-sm font-semibold transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
                  >
                    <Icon size={18} className="text-slate-500 dark:text-slate-300" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-5 flex items-center gap-3">
              <Medal size={22} className="text-[#9a7a2f]" />
              <h2 className="text-xl font-black">Conquistas</h2>
            </div>
            <div className="space-y-3">
              {badgeItems.map((badge) => (
                <div key={badge.key} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Award size={17} className="text-[#9a7a2f]" />
                      <p className="font-black">{badge.label}</p>
                    </div>
                    <span className="rounded-lg bg-[#d8b15f]/15 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#8a6b22] dark:text-[#f4d789]">
                      {badge.mana}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{badge.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck size={22} className="text-emerald-600 dark:text-emerald-300" />
              <h2 className="text-xl font-black">Privacidade</h2>
            </div>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              Esta area mostra apenas o que pertence a voce. Notas pastorais
              internas, dados de outros membros e bastidores da equipe nao aparecem aqui.
            </p>
          </section>
        </aside>
      </motion.section>

      <section className="border-t border-slate-200 bg-white px-5 py-8 dark:border-white/10 dark:bg-white/[0.03] md:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {memberInfoCardsPreview.map(([title, Icon, text]) => {
            return (
              <article key={title} className="rounded-lg border border-slate-200 bg-[#f8fafc] p-5 dark:border-white/10 dark:bg-[#0f172a]">
                <Icon size={22} className="mb-4 text-slate-700 dark:text-slate-200" />
                <h3 className="text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function getSubmissionTitle(formType: string) {
  const labels: Record<string, string> = {
    prayer: "Pedido de oracao",
    volunteer: "Interesse em voluntariado",
    visitor: "Contato de visitante",
    pastor_care: "Cuidado pastoral",
    group: "Entrada em grupo",
    custom: "Formulario da igreja",
  };
  return labels[formType] ?? "Acompanhamento da igreja";
}

function getPublicStatus(status: string, publicStatus?: string) {
  if (publicStatus) return publicStatus;
  const labels: Record<string, string> = {
    received: "Recebido",
    assigned: "Encaminhado",
    in_progress: "Em acompanhamento",
    waiting_member: "Aguardando voce",
    answered: "Respondido",
    closed: "Encerrado",
    archived: "Arquivado",
  };
  return labels[status] ?? "Atualizado";
}

function getAssignmentStatus(status: string) {
  const labels: Record<string, string> = {
    draft: "Rascunho",
    pending: "Aguardando aceite",
    accepted: "Ativa",
    declined: "Recusada",
    paused: "Pausada",
    expired: "Expirada",
    removed: "Removida",
  };
  return labels[status] ?? "Atualizada";
}
