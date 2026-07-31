"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  RotateCcw,
  Users,
  X,
} from "lucide-react";
import type { ChurchFormSubmission, ChurchServiceTeam } from "../../types";
import { churchManagementService, type UserCultoAssignment } from "../../services/churchManagementService";
import { splitVolunteerLeadershipFeedback, VOLUNTEER_REJECTION_PUBLIC_STATUS } from "../../utils/churchManagementRules";

type HubModal =
  | { kind: "assignment"; data: UserCultoAssignment }
  | { kind: "submission"; data: ChurchFormSubmission }
  | { kind: "team"; data: ChurchServiceTeam }
  | null;

type Props = {
  assignments: UserCultoAssignment[];
  submissions: ChurchFormSubmission[];
  teams: ChurchServiceTeam[];
  userId: string;
  onAssignmentUpdated: (updated: UserCultoAssignment) => void;
};

const assignmentStatus = {
  pending: { label: "Aguardando aceite", tone: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200" },
  accepted: { label: "Confirmada", tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200" },
} as const;

function volunteerStatus(submission: ChurchFormSubmission) {
  if (submission.status === "answered" && /aprova/i.test(`${submission.publicStatus} ${submission.publicFeedback}`)) {
    return { label: "Aprovada", tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200", progress: 100 };
  }
  if (submission.publicStatus === VOLUNTEER_REJECTION_PUBLIC_STATUS) {
    return { label: "Recusada", tone: "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200", progress: 100 };
  }
  if (["answered", "closed", "archived"].includes(submission.status)) {
    return { label: submission.publicStatus || "Concluída", tone: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200", progress: 100 };
  }
  if (submission.status === "waiting_member") {
    return { label: "Aguardando você", tone: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200", progress: 75 };
  }
  if (["assigned", "in_progress"].includes(submission.status)) {
    return { label: submission.publicStatus || "Em análise", tone: "bg-blue-100 text-blue-800 dark:bg-blue-400/15 dark:text-blue-200", progress: 60 };
  }
  return { label: submission.publicStatus || "Solicitação enviada", tone: "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200", progress: 30 };
}

function formatDate(value?: string | null) {
  if (!value) return "Data a definir";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
}

export default function PersonalCultosOperations({ assignments, submissions, teams, userId, onAssignmentUpdated }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<HubModal>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [retryingSubmissionId, setRetryingSubmissionId] = useState("");
  const [retryFeedback, setRetryFeedback] = useState("");
  const volunteerSubmissions = useMemo(
    () => submissions.filter((submission) => submission.formType === "volunteer"),
    [submissions],
  );
  const pendingCount = assignments.filter(({ assignment }) => assignment.status === "pending").length;
  const activeRequests = volunteerSubmissions.filter((item) => !["answered", "closed", "archived"].includes(item.status)).length;

  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [modal]);

  const respond = async (item: UserCultoAssignment, response: "accepted" | "declined") => {
    setSaving(true);
    setFeedback("");
    try {
      const updatedAssignment = await churchManagementService.respondToAssignment(item.assignment.id, userId, response);
      const updated = { ...item, assignment: updatedAssignment };
      onAssignmentUpdated(updated);
      setModal({ kind: "assignment", data: updated });
      setFeedback(response === "accepted" ? "Escala confirmada. A liderança já pode acompanhar sua resposta." : "Convite recusado. A liderança será notificada.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível registrar sua resposta.");
    } finally {
      setSaving(false);
    }
  };

  const retryVolunteerApplication = async (submission: ChurchFormSubmission) => {
    setRetryingSubmissionId(submission.id);
    setRetryFeedback("");
    try {
      const form = await churchManagementService.getVolunteerRetryForm(submission);
      router.push(`/qr/${encodeURIComponent(form.token)}`);
    } catch (error) {
      setRetryFeedback(error instanceof Error ? error.message : "Não foi possível abrir o formulário original.");
    } finally {
      setRetryingSubmissionId("");
    }
  };

  return (
    <section id="escala" aria-labelledby="personal-scale-title" className="mb-7 scroll-mt-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-900/40 dark:bg-white/[0.03] md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Área pessoal</p>
          <h2 id="personal-scale-title" className="mt-1 text-2xl font-black">Minha escala</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Cultos, convites, candidaturas e equipes reunidos em um único fluxo.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">{pendingCount} convite(s) pendente(s)</span>
          <span className="rounded-full bg-violet-50 px-3 py-2 text-violet-800 dark:bg-violet-400/10 dark:text-violet-200">{activeRequests} solicitação(ões) em andamento</span>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-black"><CalendarDays size={19} className="text-emerald-700" /> Cultos e designações</h3>
            <span className="text-xs text-slate-500">{assignments.length} item(ns)</span>
          </div>
          <div className="space-y-3">
            {assignments.map((item) => {
              const status = assignmentStatus[item.assignment.status as keyof typeof assignmentStatus] ?? assignmentStatus.pending;
              return (
                <button key={item.assignment.id} type="button" onClick={() => { setFeedback(""); setModal({ kind: "assignment", data: item }); }} className="group flex min-h-[92px] w-full items-center gap-4 rounded-2xl border border-slate-200 bg-[#fdfbf7] p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-emerald-400/10">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200"><CalendarDays size={21} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2"><strong className="truncate">{item.service?.title || item.assignment.title}</strong><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${status.tone}`}>{status.label}</span></span>
                    <small className="mt-1 block text-slate-500">{formatDate(item.assignment.startsAt || item.assignment.createdAt)}{item.team ? ` · ${item.team.name}` : ""}</small>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" />
                </button>
              );
            })}
            {!assignments.length ? <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-white/10">Nenhuma escala ativa no momento.</div> : null}
          </div>
        </div>

        <div className="space-y-5">
          <div id="solicitacoes" className="scroll-mt-6">
            <div className="mb-3 flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-black"><ClipboardCheck size={19} className="text-violet-700" /> Voluntariado</h3><span className="text-xs text-slate-500">{volunteerSubmissions.length}</span></div>
            <div className="space-y-2">
              {volunteerSubmissions.map((submission) => {
                const status = volunteerStatus(submission);
                return <button key={submission.id} type="button" onClick={() => { setRetryFeedback(""); setModal({ kind: "submission", data: submission }); }} className="w-full rounded-2xl border border-violet-100 bg-violet-50/45 p-4 text-left transition hover:border-violet-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:border-violet-400/15 dark:bg-violet-400/[0.06]"><span className="flex items-start justify-between gap-3"><span><strong className="block text-sm">Pedido para servir</strong><small className="mt-1 block text-slate-500">Atualizado em {formatDate(submission.updatedAt)}</small></span><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${status.tone}`}>{status.label}</span></span><span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-white dark:bg-white/10"><span className="block h-full rounded-full bg-violet-600" style={{ width: `${status.progress}%` }} /></span></button>;
              })}
              {!volunteerSubmissions.length ? <div className="rounded-2xl border border-dashed border-violet-200 p-4 text-sm text-slate-500 dark:border-violet-400/20">Nenhuma solicitação de voluntariado enviada.</div> : null}
            </div>
          </div>

          <div id="equipes" className="scroll-mt-6">
            <div className="mb-3 flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-black"><Users size={19} className="text-blue-700" /> Minhas equipes</h3><span className="text-xs text-slate-500">{teams.length}</span></div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {teams.map((team) => <button key={team.id} type="button" onClick={() => setModal({ kind: "team", data: team })} className="flex min-h-14 items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-3 text-left transition hover:border-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-blue-400/15 dark:bg-blue-400/[0.06]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-200"><Users size={17} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{team.name}</strong><small className="block truncate text-slate-500">{team.area || "Equipe de serviço"}</small></span><ChevronRight size={16} className="text-slate-300" /></button>)}
              {!teams.length ? <div className="rounded-xl border border-dashed border-blue-200 p-4 text-sm text-slate-500 dark:border-blue-400/20">Você ainda não faz parte de uma equipe.</div> : null}
            </div>
          </div>
        </div>
      </div>

      {modal ? <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }} className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div role="dialog" aria-modal="true" aria-labelledby="personal-hub-modal-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-[#111827] sm:max-w-xl sm:rounded-3xl"><div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#111827]"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Meus Cultos</p><h2 id="personal-hub-modal-title" className="mt-1 text-xl font-black">{modal.kind === "assignment" ? (modal.data.service?.title || modal.data.assignment.title) : modal.kind === "submission" ? "Solicitação de voluntariado" : modal.data.name}</h2></div><button type="button" onClick={() => setModal(null)} aria-label="Fechar" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"><X size={19} /></button></div><div className="p-5 sm:p-6">{modal.kind === "assignment" ? <AssignmentDetails item={modal.data} feedback={feedback} saving={saving} onRespond={respond} /> : modal.kind === "submission" ? <SubmissionDetails submission={modal.data} retrying={retryingSubmissionId === modal.data.id} retryFeedback={retryFeedback} onRetry={retryVolunteerApplication} /> : <TeamDetails team={modal.data} />}</div></div></div> : null}
    </section>
  );
}

function AssignmentDetails({ item, feedback, saving, onRespond }: { item: UserCultoAssignment; feedback: string; saving: boolean; onRespond: (item: UserCultoAssignment, response: "accepted" | "declined") => void }) {
  const pending = item.assignment.status === "pending";
  return <div><span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${pending ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{pending ? "Aguardando aceite" : "Confirmada"}</span><div className="mt-5 grid gap-3 sm:grid-cols-2"><Info label="Data e horário" value={formatDate(item.assignment.startsAt || item.assignment.createdAt)} /><Info label="Equipe" value={item.team?.name || "Equipe não informada"} /><Info label="Função" value={item.assignment.description || item.assignment.title} /><Info label="Situação" value={pending ? "Sua resposta está pendente" : "Presença confirmada"} /></div>{item.assignment.publicFeedback ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-white/5 dark:text-slate-300">{item.assignment.publicFeedback}</p> : null}{feedback ? <p role="status" className="mt-4 rounded-xl bg-blue-50 p-4 text-sm font-semibold text-blue-800 dark:bg-blue-400/10 dark:text-blue-200">{feedback}</p> : null}{pending ? <div className="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" disabled={saving} onClick={() => void onRespond(item, "accepted")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white disabled:opacity-60"><Check size={17} /> Aceitar escala</button><button type="button" disabled={saving} onClick={() => void onRespond(item, "declined")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700 disabled:opacity-60 dark:border-white/10 dark:text-slate-200"><X size={17} /> Recusar</button></div> : <div className="mt-5 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200"><CheckCircle2 size={20} /> Esta escala está confirmada.</div>}</div>;
}

function SubmissionDetails({ submission, retrying, retryFeedback, onRetry }: { submission: ChurchFormSubmission; retrying: boolean; retryFeedback: string; onRetry: (submission: ChurchFormSubmission) => void }) {
  const status = volunteerStatus(submission);
  const isRejected = submission.publicStatus === VOLUNTEER_REJECTION_PUBLIC_STATUS;
  const feedbackParts = splitVolunteerLeadershipFeedback(submission.publicFeedback || submission.publicStatus || "A igreja recebeu seu pedido e fará a análise.");
  return <div><span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${status.tone}`}>{status.label}</span><div className="mt-5"><Info label="Enviado em" value={formatDate(submission.createdAt)} /><div className="mt-3"><Info label="Última atualização" value={formatDate(submission.updatedAt)} /></div></div><div className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-white/10"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Retorno da igreja</p><p className="mt-2 text-sm font-normal leading-6 text-slate-700 dark:text-slate-200">{feedbackParts.before}{feedbackParts.leadership ? <><span> Retorno da liderança: </span><strong className="font-bold text-slate-950 dark:text-white">{feedbackParts.leadership}</strong></> : null}{feedbackParts.after ? <span> {feedbackParts.after}</span> : null}</p></div><div className="mt-3 rounded-2xl bg-violet-50 p-4 dark:bg-violet-400/10"><p className="text-[10px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-200">Próximo passo</p><p className="mt-2 text-sm font-normal leading-6 text-violet-900 dark:text-violet-100">{submission.nextAction || (status.progress === 100 ? "Nenhuma ação pendente." : "Aguarde o retorno da liderança pela notificação.")}</p>{isRejected ? <button type="button" onClick={() => onRetry(submission)} disabled={retrying} aria-busy={retrying} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-black text-white transition hover:bg-violet-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-60"><RotateCcw size={17} className={retrying ? "animate-spin" : ""} />{retrying ? "Abrindo formulário..." : "Tentar novamente"}</button> : null}{retryFeedback ? <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">{retryFeedback}</p> : null}</div></div>;
}

function TeamDetails({ team }: { team: ChurchServiceTeam }) {
  return <div><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-200"><Users size={25} /></div><p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">{team.description || "Equipe operacional da igreja."}</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><Info label="Área" value={team.area || "Serviço"} /><Info label="Situação" value={team.status === "active" ? "Equipe ativa" : "Equipe pausada"} /></div><p className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200"><CheckCircle2 size={19} /> Você faz parte desta equipe.</p></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}
