"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  ClipboardList,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  memberAssignmentsPreview,
  type ChurchAssignmentStatus,
} from "../../services/churchManagementPreviewService";
import { churchManagementService } from "../../services/churchManagementService";
import { dbService } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchAssignment } from "../../types";

const statusClass: Record<ChurchAssignmentStatus, string> = {
  Ativa: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
  "Aguardando aceite": "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  Recusada: "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200",
  Pausada: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
};

const cardMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function MemberAssignmentsPreview() {
  const { currentUser, userProfile, updateProfile } = useAuth();
  const [statuses, setStatuses] = useState<Record<string, ChurchAssignmentStatus>>({});
  const [feedback, setFeedback] = useState("Convites pendentes aparecem aqui com resposta visivel para voce e para a lideranca.");
  const [realAssignments, setRealAssignments] = useState<ChurchAssignment[]>([]);
  const [membershipByChurch, setMembershipByChurch] = useState<Record<string, boolean>>({});
  const [churchesById, setChurchesById] = useState<Record<string, any>>({});
  const [joiningChurchId, setJoiningChurchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const reduceMotion = useReducedMotion();
  const activeChurchId = userProfile?.churchData?.churchId;
  const currentUserId = currentUser?.uid ?? currentUser?.id;

  useEffect(() => {
    if (!currentUserId) return;
    let isMounted = true;
    setIsLoading(true);
    churchManagementService.listAssignmentsForUser(currentUserId, 25)
      .then((items) => {
        if (isMounted) setRealAssignments(items);
      })
      .catch(() => {
        if (isMounted) setRealAssignments([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId, currentUserId]);

  useEffect(() => {
    if (!currentUserId || realAssignments.length === 0) return;
    let isMounted = true;
    const churchIds = [...new Set(realAssignments.map((assignment) => assignment.churchId))];
    Promise.all(churchIds.map(async (churchId) => {
      const [isMember, church] = await Promise.all([
        churchManagementService.isChurchMember(churchId, currentUserId),
        dbService.getChurchById(churchId).catch(() => null),
      ]);
      return { churchId, isMember, church };
    }))
      .then((results) => {
        if (!isMounted) return;
        setMembershipByChurch(Object.fromEntries(results.map((result) => [result.churchId, result.isMember])));
        setChurchesById(Object.fromEntries(results.filter((result) => result.church).map((result) => [result.churchId, result.church])));
      })
      .catch(() => undefined);
    return () => {
      isMounted = false;
    };
  }, [currentUserId, realAssignments]);

  const assignments = useMemo(() => {
    if (realAssignments.length === 0) return memberAssignmentsPreview;
    return realAssignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      team: "Equipe atribuida",
      status: mapRealAssignmentStatus(assignment.status),
      nextService: assignment.startsAt ? new Date(assignment.startsAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Agenda a definir",
      leader: assignment.leaderUserId ? "Lider atribuido" : "Lider a definir",
      feedback: assignment.publicFeedback || assignment.description || "Designacao atribuida pela igreja.",
      icon: ClipboardList,
      realStatus: assignment.status,
    }));
  }, [realAssignments]);

  const setAssignmentStatus = async (id: string, nextStatus: ChurchAssignmentStatus) => {
    const hasRealAssignment = realAssignments.some((assignment) => assignment.id === id);
    if (hasRealAssignment && currentUserId) {
      const assignment = realAssignments.find((item) => item.id === id);
      if (nextStatus === "Ativa" && assignment && membershipByChurch[assignment.churchId] === false) {
        setFeedback("Para aceitar este convite, primeiro torne-se membro da igreja indicada.");
        return;
      }
      try {
        const updated = await churchManagementService.respondToAssignment(id, currentUserId, nextStatus === "Ativa" ? "accepted" : "declined");
        setRealAssignments((items) => items.map((item) => item.id === updated.id ? updated : item));
      } catch {
        setFeedback("Nao foi possivel registrar sua resposta agora. Verifique sua permissao ou tente novamente.");
        return;
      }
    }
    setStatuses((current) => ({ ...current, [id]: nextStatus }));
    setFeedback(
      nextStatus === "Ativa"
        ? "Designacao aceita. A lideranca sera notificada e a conquista de disponibilidade sera registrada quando o banco estiver com insignias/Mana aplicado."
        : "Designacao recusada. A lideranca sera notificada sem expor justificativas publicamente."
    );
  };

  const joinChurchForAssignment = async (churchId: string) => {
    if (!currentUserId) return;
    setJoiningChurchId(churchId);
    try {
      const church = churchesById[churchId] ?? await dbService.getChurchById(churchId);
      if (!church) throw new Error("Igreja não encontrada.");
      await dbService.joinChurch(currentUserId, church);
      await updateProfile({
        churchData: {
          churchId: church.id,
          churchName: church.name,
          churchSlug: church.slug,
          isAnonymous: false,
        },
      });
      setMembershipByChurch((current) => ({ ...current, [churchId]: true }));
      setFeedback(`Agora você é membro de ${church.name}. Já pode aceitar o convite.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível solicitar o vínculo com a igreja.");
    } finally {
      setJoiningChurchId(null);
    }
  };

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
                <ClipboardList size={15} className="text-[#d8b15f]" />
                Minhas designacoes
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">
                Onde estou servindo
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                Acompanhe convites, equipes, agenda e respostas sem ver bastidores administrativos ou dados de outras pessoas.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Pendentes", "1"],
                ["Ativas", "2"],
                ["Proxima agenda", "Domingo"],
              ].map(([label, value]) => (
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
        <motion.div {...motionProps} className="grid gap-4">
          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              Carregando suas designacoes...
            </div>
          ) : null}
          {assignments.map((assignment) => {
            const Icon = assignment.icon;
            const status = statuses[assignment.id] ?? assignment.status;
            const canRespond = status === "Aguardando aceite";
            const realAssignment = realAssignments.find((item) => item.id === assignment.id);
            const needsMembership = canRespond && realAssignment ? membershipByChurch[realAssignment.churchId] === false : false;
            return (
              <motion.article key={assignment.id} variants={cardMotion} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                      <Icon size={21} />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black">{assignment.title}</h2>
                        <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${statusClass[status]}`}>
                          {status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{assignment.feedback}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Equipe</p>
                    <p className="mt-1 text-sm font-semibold">{assignment.team}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Lider</p>
                    <p className="mt-1 text-sm font-semibold">{assignment.leader}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Agenda</p>
                    <p className="mt-1 text-sm font-semibold">{assignment.nextService}</p>
                  </div>
                </div>

                {canRespond && needsMembership ? (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-400/10">
                    <p className="text-sm font-black text-amber-950 dark:text-amber-100">Você ainda não é membro desta igreja.</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-amber-900 dark:text-amber-200">Para aceitar este convite, torne-se membro de {churchesById[realAssignment?.churchId ?? ""]?.name || "esta igreja"}.</p>
                    <button type="button" onClick={() => realAssignment && void joinChurchForAssignment(realAssignment.churchId)} disabled={joiningChurchId === realAssignment?.churchId} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-700 px-3 text-xs font-black text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60">
                      {joiningChurchId === realAssignment?.churchId ? "Vinculando..." : "Tornar-se membro e continuar"}
                    </button>
                  </div>
                ) : canRespond ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={() => setAssignmentStatus(assignment.id, "Ativa")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
                      <Check size={16} />
                      Aceitar
                    </button>
                    <button type="button" onClick={() => setAssignmentStatus(assignment.id, "Recusada")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                      <X size={16} />
                      Recusar
                    </button>
                  </div>
                ) : null}
              </motion.article>
            );
          })}
        </motion.div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center gap-3">
              <Bell size={22} className="text-[#9a7a2f]" />
              <h2 className="text-xl font-black">Feedback</h2>
            </div>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{feedback}</p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck size={22} className="text-emerald-600 dark:text-emerald-300" />
              <h2 className="text-xl font-black">Limites seguros</h2>
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p className="flex gap-3"><CalendarDays size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />Voce ve sua agenda e equipe, nao dados administrativos de outros voluntarios.</p>
              <p className="flex gap-3"><ShieldCheck size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />Aceitar designacao nao concede permissao sensivel automaticamente.</p>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function mapRealAssignmentStatus(status: ChurchAssignment["status"]): ChurchAssignmentStatus {
  const map: Record<ChurchAssignment["status"], ChurchAssignmentStatus> = {
    draft: "Pausada",
    pending: "Aguardando aceite",
    accepted: "Ativa",
    declined: "Recusada",
    paused: "Pausada",
    expired: "Pausada",
    removed: "Pausada",
  };
  return map[status];
}
