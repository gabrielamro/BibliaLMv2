"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Bell,
  CalendarDays,
  CheckCircle2,
  Medal,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  memberAssignmentsPreview,
  memberBadgesPreview,
} from "../../services/churchManagementPreviewService";
import { churchManagementService } from "../../services/churchManagementService";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchAssignment, ChurchVolunteerBadge } from "../../types";

type MemberPhase = "equipes" | "insignias";

const configs: Record<MemberPhase, { eyebrow: string; title: string; description: string; icon: LucideIcon }> = {
  equipes: {
    eyebrow: "Minhas equipes",
    title: "Onde sirvo e com quem caminho",
    description: "Equipes permitidas, lider responsavel, agenda e proxima acao visivel para o membro.",
    icon: Users,
  },
  insignias: {
    eyebrow: "Minhas conquistas",
    title: "Selos padrao de servico",
    description: "Conquistas e Mana aparecem como memoria de disponibilidade, sem ranking espiritual.",
    icon: Medal,
  },
};

const cardMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function MemberOperationalPhasePreview({ phase }: { phase: MemberPhase }) {
  const { currentUser, userProfile } = useAuth();
  const config = configs[phase];
  const Icon = config.icon;
  const reduceMotion = useReducedMotion();
  const activeChurchId = userProfile?.churchData?.churchId;
  const currentUserId = currentUser?.id ?? currentUser?.uid;
  const [assignments, setAssignments] = useState<ChurchAssignment[]>([]);
  const [badges, setBadges] = useState<ChurchVolunteerBadge[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeChurchId || !currentUserId) return;
    let isMounted = true;
    setIsLoading(true);
    const request = phase === "equipes"
      ? churchManagementService.listAssignments(activeChurchId, { assigneeUserId: currentUserId, limit: 25 }).then((items) => {
          if (isMounted) setAssignments(items);
        })
      : churchManagementService.listBadges(activeChurchId, { userId: currentUserId, limit: 25 }).then((items) => {
          if (isMounted) setBadges(items);
        });
    request
      .catch(() => {
        if (!isMounted) return;
        setAssignments([]);
        setBadges([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId, currentUserId, phase]);

  const stats = useMemo(() => {
    if (phase === "equipes" && assignments.length > 0) {
      return [["Atividades", String(assignments.length)], ["Pendencias", String(assignments.filter((item) => item.status === "pending").length)], ["Agenda", String(assignments.filter((item) => item.startsAt).length)]];
    }
    if (phase === "insignias" && badges.length > 0) {
      return [["Conquistas", String(badges.length)], ["Mana", String(badges.reduce((sum, badge) => sum + badge.manaAmount, 0))], ["Visibilidade", "Segura"]];
    }
    return phase === "equipes"
      ? [["Equipes", "3"], ["Pendencias", "1"], ["Agenda", "2"]]
      : [["Conquistas", "3"], ["Mana", "45"], ["Visibilidade", "Privada"]];
  }, [assignments, badges, phase]);
  const motionProps = reduceMotion
    ? {}
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
        variants: { visible: { transition: { staggerChildren: 0.05 } } },
      };

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="border-b border-slate-200 bg-[#0f172a] text-white dark:border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <Link href="/minha-igreja" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                <Icon size={15} className="text-[#d8b15f]" />
                {config.eyebrow}
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">{config.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{config.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/15 bg-white/8 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{label}</p>
                  <p className="mt-3 text-3xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_0.75fr]">
        {isLoading ? (
          <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            Carregando seus dados da igreja...
          </div>
        ) : null}
        <motion.div {...motionProps} className="grid gap-4">
          {phase === "equipes" ? renderTeams(assignments) : renderBadges(badges)}
        </motion.div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center gap-3">
              <Bell size={22} className="text-[#9a7a2f]" />
              <h2 className="text-xl font-black">Retornos</h2>
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p className="flex gap-3"><CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />Mudancas importantes aparecem como notificacao e como status aqui.</p>
              <p className="flex gap-3"><ShieldCheck size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />Voce nao ve dados internos de outros membros nem notas pastorais.</p>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center gap-3">
              <CalendarDays size={22} className="text-slate-700 dark:text-slate-200" />
              <h2 className="text-xl font-black">Proxima acao</h2>
            </div>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              {phase === "equipes"
                ? "Confirme sua disponibilidade quando a lideranca criar uma escala."
                : "Conquistas dependem de evento auditavel e nao medem valor espiritual."}
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}

function renderTeams(assignments: ChurchAssignment[]) {
  if (assignments.length > 0) {
    return assignments.map((assignment) => (
      <motion.article key={assignment.id} variants={cardMotion} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950"><Users size={21} /></span>
          <div>
            <h2 className="text-lg font-black">{assignment.teamId ? "Equipe vinculada" : assignment.title}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{assignment.publicFeedback || assignment.description || "Atividade vinculada a sua igreja."}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Atividade", assignment.title],
            ["Status", getAssignmentStatusLabel(assignment.status)],
            ["Agenda", assignment.startsAt ? new Date(assignment.startsAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "A definir"],
          ].map(([label, value]) => <InfoTile key={label} label={label} value={value} />)}
        </div>
      </motion.article>
    ));
  }

  return memberAssignmentsPreview.map((assignment) => {
    const Icon = assignment.icon;
    return (
      <motion.article key={assignment.id} variants={cardMotion} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950"><Icon size={21} /></span>
          <div>
            <h2 className="text-lg font-black">{assignment.team}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{assignment.feedback}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Atividade", assignment.title],
            ["Lider", assignment.leader],
            ["Agenda", assignment.nextService],
          ].map(([label, value]) => <InfoTile key={label} label={label} value={value} />)}
        </div>
      </motion.article>
    );
  });
}

function renderBadges(badges: ChurchVolunteerBadge[]) {
  if (badges.length > 0) {
    return badges.map((badge) => (
      <motion.article key={badge.id} variants={cardMotion} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950"><Award size={21} /></span>
            <div>
              <h2 className="text-lg font-black">{badge.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{badge.description || "Conquista padrao do BibliaLM registrada por evento auditavel."}</p>
            </div>
          </div>
          <span className="w-fit rounded-lg bg-[#d8b15f]/15 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#8a6b22] dark:text-[#f4d789]">{badge.manaAmount} Mana</span>
        </div>
      </motion.article>
    ));
  }

  return memberBadgesPreview.map((badge) => {
    const Icon = badge.icon ?? Award;
    return (
      <motion.article key={badge.label} variants={cardMotion} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950"><Icon size={21} /></span>
            <div>
              <h2 className="text-lg font-black">{badge.label}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{badge.text}</p>
            </div>
          </div>
          <span className="w-fit rounded-lg bg-[#d8b15f]/15 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#8a6b22] dark:text-[#f4d789]">{badge.mana}</span>
        </div>
      </motion.article>
    );
  });
}

function getAssignmentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Rascunho",
    pending: "Aguardando aceite",
    accepted: "Aceita",
    declined: "Recusada",
    paused: "Pausada",
    expired: "Expirada",
    removed: "Removida",
  };
  return labels[status] ?? "Atualizada";
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}
