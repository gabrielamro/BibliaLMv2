"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Award,
  Bell,
  CheckCircle2,
  ChevronRight,
  Church,
  Clock3,
  HeartHandshake,
  Medal,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { churchManagementService } from "../../services/churchManagementService";
import { memberInfoCardsPreview } from "../../services/churchManagementPreviewService";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchAssignment, ChurchFormSubmission, ChurchVolunteerBadge } from "../../types";

const cardMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const memberQuickLinks = [
  { label: "Jornada do obreiro", href: "/minha-igreja/jornada-obreiro" },
  { label: "Designações", href: "/minha-igreja/designacoes" },
  { label: "Equipes", href: "/minha-igreja/equipes" },
  { label: "Conquistas", href: "/minha-igreja/insignias" },
];

export default function MemberChurchPreview() {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const reduceMotion = useReducedMotion();
  const activeChurchId = userProfile?.churchData?.churchId;
  const currentUserId = currentUser?.id ?? currentUser?.uid;
  const shouldInviteChurchMembership = !authLoading && Boolean(currentUserId) && !activeChurchId;
  const [submissions, setSubmissions] = useState<ChurchFormSubmission[]>([]);
  const [assignments, setAssignments] = useState<ChurchAssignment[]>([]);
  const [badges, setBadges] = useState<ChurchVolunteerBadge[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      churchManagementService.listMemberSubmissions(currentUserId, { limit: 20 }),
      activeChurchId ? churchManagementService.listAssignments(activeChurchId, { assigneeUserId: currentUserId, limit: 10 }) : Promise.resolve([]),
      activeChurchId ? churchManagementService.listBadges(activeChurchId, { userId: currentUserId, limit: 10 }) : Promise.resolve([]),
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
    return [
      ["Pedidos ativos", String(submissions.filter((item) => !["answered", "closed", "archived"].includes(item.status)).length)],
      ["Aguardando você", String(submissions.filter((item) => item.status === "waiting_member").length + assignments.filter((item) => item.status === "pending").length)],
      ["Designações", String(assignments.length)],
      ["Mana de serviço", String(badges.reduce((sum, badge) => sum + badge.manaAmount, 0))],
    ];
  }, [assignments, badges, submissions]);

  const timelineItems = useMemo(() => {
    return [
        ...submissions.map((submission) => ({
          key: `submission-${submission.id}`,
          title: getSubmissionTitle(submission.formType),
          detail: submission.publicFeedback || submission.publicStatus || "Recebido pela igreja.",
          status: getPublicStatus(submission.status, submission.publicStatus),
          icon: ShieldCheck,
          kind: "submission" as const,
          nextAction: submission.nextAction || getDefaultNextAction(submission.status),
          updatedAt: submission.updatedAt,
          progress: getSubmissionProgress(submission.status),
        })),
        ...assignments.slice(0, 2).map((assignment) => ({
          key: `assignment-${assignment.id}`,
          title: assignment.title,
          detail: assignment.publicFeedback || assignment.description || "Designacao atribuida pela igreja.",
          status: getAssignmentStatus(assignment.status),
          icon: Clock3,
          kind: "assignment" as const,
          nextAction: assignment.status === "pending" ? "Confirme ou recuse esta designação." : "Acompanhe os avisos da sua equipe.",
          updatedAt: assignment.updatedAt,
          progress: assignment.status === "accepted" ? 100 : assignment.status === "pending" ? 50 : 100,
        })),
      ];
  }, [assignments, submissions]);

  const badgeItems = useMemo(() => {
    if (badges.length > 0) {
      return badges.slice(0, 3).map((badge) => ({
        key: badge.id,
        label: badge.title,
        text: badge.description || "Conquista padrão do Culto+ registrada por evento auditável.",
        mana: `${badge.manaAmount} Mana`,
      }));
    }

    return [];
  }, [badges]);

  const motionProps = reduceMotion
    ? {}
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
        variants: { visible: { transition: { staggerChildren: 0.06 } } },
      };

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950 dark:bg-[#070a0d] dark:text-white">
      <section className="bg-gradient-to-r from-[#071326] via-[#0d2a31] to-[#07533f] text-white">
        <div className="w-full px-4 py-7 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                <Sparkles size={15} />
                Minha Igreja
              </div>
              <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                Minha Igreja
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Acompanhe pedidos, próximas ações, designações, equipes e sua jornada de serviço em um só lugar.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {headerStats.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{label}</p>
                  <p className="mt-2 text-2xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {shouldInviteChurchMembership ? (
        <section className="w-full px-4 pt-5 sm:px-6 lg:px-8" aria-labelledby="church-membership-invitation-title">
          <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-amber-300/20 dark:bg-amber-400/10">
            <div className="flex min-w-0 gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-300/15 dark:text-amber-200">
                <Church size={21} aria-hidden="true" />
              </span>
              <div>
                <h2 id="church-membership-invitation-title" className="text-sm font-black text-amber-950 dark:text-amber-100">Você ainda não é membro de uma igreja</h2>
                <p className="mt-1 text-xs leading-5 text-amber-800 sm:text-sm dark:text-amber-200">Encontre uma igreja no Reino e solicite seu vínculo para acompanhar equipes, designações e comunicações.</p>
              </div>
            </div>
            <Link href="/social/igrejas" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#082f2b] px-5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
              Virar membro de uma igreja
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : null}

      <motion.section {...motionProps} className="grid w-full gap-6 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <div>
          {isLoading ? (
            <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              Carregando seus retornos da igreja...
            </div>
          ) : null}
          <nav className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Atalhos da área do membro">
            {memberQuickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-12 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-wider text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
              >
                {item.label}
                <ChevronRight size={16} />
              </Link>
            ))}
          </nav>
          <div id="acompanhamento" className="mb-4 scroll-mt-24 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                Meu acompanhamento
              </p>
              <h2 className="mt-1 text-2xl font-black">Pedidos e retornos</h2>
              <p className="mt-1 text-sm text-slate-500">Veja a situação atual e o próximo passo de cada solicitação.</p>
            </div>
          </div>
          <div className="space-y-4">
            {timelineItems.map((update) => {
              const Icon = update.icon;
              return (
                <motion.article
                  key={update.key}
                  variants={cardMotion}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
                        <Icon size={21} />
                      </span>
                      <div>
                        <h3 className="text-lg font-black">{update.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{update.detail}</p>
                      </div>
                    </div>
                    <span className="w-fit rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-200">
                      {update.status}
                    </span>
                  </div>
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Próxima ação</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-800 dark:text-slate-100">{update.nextAction}</p>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><span className="block h-full rounded-full bg-emerald-600" style={{ width: `${update.progress}%` }} /></div>
                  <p className="mt-2 text-[10px] font-semibold text-slate-400">Atualizado em {formatMemberDate(update.updatedAt)}</p>
                </motion.article>
              );
            })}
            {!isLoading && timelineItems.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <HeartHandshake size={32} className="mx-auto text-slate-300" />
                <h3 className="mt-3 font-black">Nenhum pedido ou designação</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Quando você enviar um pedido ou receber uma designação, o acompanhamento aparecerá aqui.</p>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-5 flex items-center gap-3">
              <Bell size={22} className="text-amber-600 dark:text-amber-300" />
              <h2 className="text-xl font-black">Próximas ações</h2>
            </div>
            <div className="space-y-3">
              {submissions.filter((item) => item.status === "waiting_member").slice(0, 3).map((item) => (
                <a key={item.id} href="#acompanhamento" className="flex min-h-12 items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 text-left text-sm font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
                  <Bell size={18} className="shrink-0" /><span>{item.nextAction || "Confira o retorno da igreja."}</span>
                </a>
              ))}
              {assignments.filter((item) => item.status === "pending").slice(0, 3).map((item) => (
                <Link key={item.id} href="/minha-igreja/designacoes" className="flex min-h-12 items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-3 text-left text-sm font-semibold text-blue-900 transition hover:bg-blue-100 dark:border-blue-300/20 dark:bg-blue-300/10 dark:text-blue-100">
                  <Clock3 size={18} className="shrink-0" /><span>Responder designação: {item.title}</span>
                </Link>
              ))}
              {!submissions.some((item) => item.status === "waiting_member") && !assignments.some((item) => item.status === "pending") ? (
                <div className="rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200"><CheckCircle2 size={20} /><p className="mt-2 text-sm font-bold">Nenhuma ação pendente agora.</p></div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
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
              {badgeItems.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500 dark:bg-white/5">Suas conquistas de serviço aparecerão aqui quando forem registradas pela igreja.</p> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck size={22} className="text-emerald-600 dark:text-emerald-300" />
              <h2 className="text-xl font-black">Privacidade</h2>
            </div>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              Esta área mostra apenas o que pertence a você. Notas pastorais
              internas, dados de outros membros e bastidores da equipe não aparecem aqui.
            </p>
          </section>
        </aside>
      </motion.section>

      <section className="border-t border-slate-200 bg-white px-5 py-8 dark:border-white/10 dark:bg-white/[0.03] md:px-8">
        <div className="grid w-full gap-4 md:grid-cols-3">
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
    prayer: "Pedido de oração",
    volunteer: "Interesse em voluntariado",
    visitor: "Contato de visitante",
    pastor_care: "Cuidado pastoral",
    group: "Entrada em grupo",
    custom: "Formulário da igreja",
  };
  return labels[formType] ?? "Acompanhamento da igreja";
}

function getPublicStatus(status: string, publicStatus?: string) {
  if (publicStatus) return publicStatus;
  const labels: Record<string, string> = {
    received: "Recebido",
    assigned: "Encaminhado",
    in_progress: "Em acompanhamento",
    waiting_member: "Aguardando você",
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

function getSubmissionProgress(status: string) {
  if (["answered", "closed", "archived"].includes(status)) return 100;
  if (["assigned", "in_progress", "waiting_member"].includes(status)) return 70;
  return 35;
}

function getDefaultNextAction(status: string) {
  if (status === "waiting_member") return "Confira o retorno da igreja e siga a orientação informada.";
  if (["answered", "closed", "archived"].includes(status)) return "Nenhuma ação pendente no momento.";
  if (["assigned", "in_progress"].includes(status)) return "Aguarde o próximo retorno da equipe responsável.";
  return "A igreja fará a primeira análise do seu pedido.";
}

function formatMemberDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "data não informada" : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
