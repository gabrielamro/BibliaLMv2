"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarClock,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Inbox,
  Lock,
  Loader2,
  Mail,
  MessageSquareHeart,
  Phone,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  UserX,
  UsersRound,
  X,
} from "lucide-react";
import { type ChurchInboxItemPreview, type ChurchInboxStatus } from "../../services/churchManagementPreviewService";
import { churchManagementService } from "../../services/churchManagementService";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchFormSubmission, ChurchServiceTeam, ChurchSubmissionPriority, ChurchSubmissionStatus, ChurchTeamFunction } from "../../types";
import { getInboxAssignmentUpdate, getInboxStatusToggleUpdate, VOLUNTEER_REJECTION_PUBLIC_STATUS } from "../../utils/churchManagementRules";

const statusFilters: Array<ChurchInboxStatus | "Todos"> = ["Todos", "Recebido", "Atribuido", "Em acompanhamento", "Aguardando membro", "Encerrado"];

const priorityClass: Record<ChurchInboxItemPreview["priority"], string> = {
  Normal: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  Alta: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  Urgente: "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200",
};

const statusClass: Record<ChurchInboxStatus, string> = {
  Recebido: "bg-blue-50 text-blue-700 dark:bg-blue-400/15 dark:text-blue-200",
  Atribuido: "bg-violet-50 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200",
  "Em acompanhamento": "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
  "Aguardando membro": "bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  Encerrado: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
};

type DisplayInboxItem = ChurchInboxItemPreview & {
  realId: string;
  realStatus: ChurchSubmissionStatus;
  contact: string;
  createdAt: string;
  payload: Record<string, unknown>;
};

export default function ChurchInboxPreview() {
  const { currentUser, userProfile } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<(typeof statusFilters)[number]>("Todos");
  const [selectedId, setSelectedId] = useState("");
  const [submissions, setSubmissions] = useState<ChurchFormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<ChurchInboxItemPreview["priority"] | "Todas">("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [assigneeDraft, setAssigneeDraft] = useState("");
  const [priorityDraft, setPriorityDraft] = useState<ChurchSubmissionPriority>("normal");
  const [teams, setTeams] = useState<ChurchServiceTeam[]>([]);
  const [teamFunctions, setTeamFunctions] = useState<ChurchTeamFunction[]>([]);
  const [approvalTeamId, setApprovalTeamId] = useState("");
  const [approvalFunctionId, setApprovalFunctionId] = useState("");
  const [isLoadingFunctions, setIsLoadingFunctions] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRejectionConfirmationOpen, setIsRejectionConfirmationOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionFeedback, setRejectionFeedback] = useState("");
  const [quickApprovalId, setQuickApprovalId] = useState("");
  const [listFeedback, setListFeedback] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const quickCloseButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const quickModalRef = useRef<HTMLElement>(null);
  const approvalQueryHandledRef = useRef("");
  const activeChurchId = userProfile?.churchData?.churchId;
  const currentUserId = currentUser?.id ?? currentUser?.uid ?? "";

  useEffect(() => {
    if (!activeChurchId) return;
    let active = true;
    setIsLoading(true);
    Promise.all([
      churchManagementService.listSubmissions(activeChurchId, { limit: 100 }),
      churchManagementService.listTeams(activeChurchId, { limit: 100 }),
    ])
      .then(([items, availableTeams]) => {
        if (!active) return;
        setSubmissions(items);
        setTeams(availableTeams.filter((team) => team.status === "active"));
      })
      .catch(() => { if (active) { setSubmissions([]); setTeams([]); } })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [activeChurchId]);

  useEffect(() => {
    const submissionId = new URLSearchParams(window.location.search).get("approve") ?? "";
    if (!submissionId || approvalQueryHandledRef.current === submissionId) return;
    const submission = submissions.find((item) => item.id === submissionId);
    if (!submission || submission.formType !== "volunteer") return;
    approvalQueryHandledRef.current = submissionId;
    setSelectedId("");
    setApprovalTeamId(teams.length === 1 ? teams[0].id : "");
    setApprovalFunctionId("");
    setApprovalFeedback("");
    setListFeedback("");
    setQuickApprovalId(submissionId);
  }, [submissions, teams]);

  const displayItems = useMemo(() => submissions.map(mapSubmissionToDisplay), [submissions]);
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("pt-BR");
  const filteredItems = useMemo(() => displayItems.filter((item) => {
    const matchesSearch = !normalizedSearch || [item.title, item.summary, item.submittedBy, item.contact, item.source, item.nextAction]
      .some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedSearch));
    return matchesSearch && (selectedStatus === "Todos" || item.status === selectedStatus) && (priorityFilter === "Todas" || item.priority === priorityFilter);
  }), [displayItems, normalizedSearch, priorityFilter, selectedStatus]);

  const selectedItem = displayItems.find((item) => item.id === selectedId) ?? null;
  const selectedSubmission = selectedItem ? submissions.find((item) => item.id === selectedItem.realId) ?? null : null;
  const quickApprovalSubmission = submissions.find((item) => item.id === quickApprovalId) ?? null;
  const isVolunteerCandidate = selectedSubmission?.formType === "volunteer";
  const isVolunteerApproved = isVolunteerCandidate && selectedSubmission.publicStatus === "Aprovado para servir";
  const isVolunteerRejected = isVolunteerCandidate && selectedSubmission.publicStatus === VOLUNTEER_REJECTION_PUBLIC_STATUS;
  const isVolunteerResolved = isVolunteerApproved || isVolunteerRejected;

  useEffect(() => {
    if (!selectedItem) return;
    const submission = submissions.find((item) => item.id === selectedItem.realId);
    setAssigneeDraft(submission?.assignedTo ?? "");
    setPriorityDraft(submission?.priority ?? "normal");
    setActionFeedback("");
    setApprovalFeedback("");
  }, [selectedItem, submissions]);

  useEffect(() => {
    setIsRejectionConfirmationOpen(false);
    setRejectionReason("");
    setRejectionFeedback("");
  }, [selectedSubmission?.id]);

  useEffect(() => {
    if (!isVolunteerCandidate || isVolunteerResolved) {
      setApprovalTeamId("");
      setApprovalFunctionId("");
      setTeamFunctions([]);
      return;
    }
    setApprovalTeamId(teams.length === 1 ? teams[0].id : "");
    setApprovalFunctionId("");
  }, [isVolunteerCandidate, isVolunteerResolved, selectedSubmission?.id, teams]);

  useEffect(() => {
    if (!activeChurchId || !approvalTeamId) {
      setTeamFunctions([]);
      setApprovalFunctionId("");
      return;
    }
    let active = true;
    setIsLoadingFunctions(true);
    churchManagementService.listTeamFunctions(activeChurchId, approvalTeamId)
      .then((items) => { if (active) setTeamFunctions(items.filter((item) => item.status === "active")); })
      .catch(() => { if (active) setTeamFunctions([]); })
      .finally(() => { if (active) setIsLoadingFunctions(false); });
    return () => { active = false; };
  }, [activeChurchId, approvalTeamId]);

  useEffect(() => {
    if (!selectedItem) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedId("");
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(modalRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter((element) => !element.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [selectedItem]);

  useEffect(() => {
    if (!quickApprovalSubmission) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQuickApprovalId("");
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(quickModalRef.current?.querySelectorAll<HTMLElement>('button, [href], select, [tabindex]:not([tabindex="-1"])') ?? []).filter((element) => !element.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    requestAnimationFrame(() => quickCloseButtonRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [quickApprovalSubmission]);

  const updateSelectedStatus = async () => {
    if (!selectedItem) return;
    try {
      const updated = await churchManagementService.updateSubmissionStatus(selectedItem.realId, getInboxStatusToggleUpdate(selectedItem.realStatus));
      setSubmissions((items) => items.map((item) => item.id === updated.id ? updated : item));
      setActionFeedback("Status atualizado e pronto para refletir em Minha Igreja.");
    } catch {
      setActionFeedback("Não foi possível atualizar agora. Verifique sua permissão para esta igreja.");
    }
  };

  const updateSelectedAssignment = async () => {
    if (!selectedItem) return;
    try {
      const updated = await churchManagementService.updateSubmissionStatus(selectedItem.realId, getInboxAssignmentUpdate({
        currentStatus: selectedItem.realStatus,
        assigneeDraft,
        priority: priorityDraft,
        publicStatus: selectedItem.publicStatus,
      }));
      setSubmissions((items) => items.map((item) => item.id === updated.id ? updated : item));
      setActionFeedback("Responsável e prioridade atualizados com sucesso.");
    } catch {
      setActionFeedback("Não foi possível salvar a atribuição agora. Verifique sua permissão.");
    }
  };

  const approveVolunteer = async (submission: ChurchFormSubmission, closeQuickApproval = false) => {
    if (!approvalTeamId) {
      setApprovalFeedback("Selecione a equipe que receberá o voluntário.");
      return;
    }
    setIsApproving(true);
    setApprovalFeedback("");
    try {
      const result = await churchManagementService.approveVolunteerSubmission({
        submissionId: submission.id,
        teamId: approvalTeamId,
        functionId: approvalFunctionId || null,
        approvedBy: currentUserId || null,
      });
      setSubmissions((items) => items.map((item) => item.id === result.submission.id ? result.submission : item));
      const successMessage = "Voluntário aprovado e adicionado à equipe. O membro já foi notificado.";
      setApprovalFeedback(successMessage);
      if (closeQuickApproval) {
        setQuickApprovalId("");
        setListFeedback(successMessage);
      }
    } catch (error) {
      setApprovalFeedback(error instanceof Error ? error.message : "Não foi possível aprovar o voluntário agora.");
    } finally {
      setIsApproving(false);
    }
  };

  const rejectVolunteer = async () => {
    if (!selectedSubmission) return;
    setIsRejecting(true);
    setRejectionFeedback("");
    try {
      const updated = await churchManagementService.rejectVolunteerSubmission({
        submissionId: selectedSubmission.id,
        rejectedBy: currentUserId || null,
        reason: rejectionReason || null,
      });
      setSubmissions((items) => items.map((item) => item.id === updated.id ? updated : item));
      setIsRejectionConfirmationOpen(false);
      setRejectionReason("");
    } catch (error) {
      setRejectionFeedback(error instanceof Error ? error.message : "Não foi possível recusar esta solicitação agora.");
    } finally {
      setIsRejecting(false);
    }
  };

  const openQuickApproval = (submissionId: string) => {
    setSelectedId("");
    setApprovalTeamId(teams.length === 1 ? teams[0].id : "");
    setApprovalFunctionId("");
    setApprovalFeedback("");
    setListFeedback("");
    setQuickApprovalId(submissionId);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("Todos");
    setPriorityFilter("Todas");
  };

  const summary = buildRealSummary(submissions);

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950 dark:bg-[#070a0d] dark:text-white">
      <section className="bg-gradient-to-r from-[#071326] via-[#0d2a31] to-[#07533f] text-white">
        <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/gestao-igreja" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 px-3 text-xs font-bold transition hover:bg-white/10">
            <ArrowLeft size={15} /> Voltar
          </Link>
          <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200"><MessageSquareHeart size={15} /> Gestão da Igreja</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Inbox pastoral</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">Centralize pedidos, novos voluntários e necessidades de cuidado em um fluxo simples, seguro e acionável.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-[620px]">
              {summary.map(({ label, value, icon: Icon, tone }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between"><Icon size={16} className={tone} /><strong className="text-xl">{value}</strong></div>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_220px_auto]">
            <label className="relative">
              <span className="sr-only">Pesquisar na inbox</span>
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por nome, contato ou assunto..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-white/10 dark:bg-[#11161d] dark:focus:ring-emerald-500/20" />
            </label>
            <label>
              <span className="sr-only">Filtrar por status</span>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as (typeof statusFilters)[number])} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-[#11161d]">
                {statusFilters.map((status) => <option key={status} value={status}>Status: {getStatusLabel(status)}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Filtrar por prioridade</span>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as ChurchInboxItemPreview["priority"] | "Todas")} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-[#11161d]">
                {["Todas", "Normal", "Alta", "Urgente"].map((priority) => <option key={priority} value={priority}>Prioridade: {priority}</option>)}
              </select>
            </label>
            <button type="button" onClick={clearFilters} className="min-h-11 rounded-xl border border-slate-200 px-4 text-xs font-black uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10">Limpar</button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div><h2 className="text-lg font-black">Solicitações recebidas</h2><p className="text-xs text-slate-500">{filteredItems.length} de {displayItems.length} registros</p></div>
          {isLoading ? <span className="text-xs font-bold text-emerald-700">Atualizando inbox...</span> : null}
        </div>

        {listFeedback ? <p role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-200">{listFeedback}</p> : null}

        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="hidden grid-cols-[minmax(250px,1.35fr)_minmax(170px,0.9fr)_150px_140px_145px_210px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 lg:grid dark:border-white/10 dark:bg-white/5">
            <span>Solicitação</span><span>Remetente</span><span>Status</span><span>Responsável</span><span>Recebido</span><span>Ações</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const submission = submissions.find((candidate) => candidate.id === item.realId);
              const isVolunteer = submission?.formType === "volunteer";
              const isApproved = isVolunteer && submission.publicStatus === "Aprovado para servir";
              const isRejected = isVolunteer && submission.publicStatus === VOLUNTEER_REJECTION_PUBLIC_STATUS;
              const canQuickApprove = Boolean(isVolunteer && submission?.submitterUserId && !isApproved && !isRejected && !["closed", "archived"].includes(submission.status));
              return (
                <article key={item.id} className="grid w-full gap-4 px-4 py-4 text-left transition hover:bg-emerald-50/40 sm:px-5 lg:grid-cols-[minmax(250px,1.35fr)_minmax(170px,0.9fr)_150px_140px_145px_210px] lg:items-center dark:hover:bg-emerald-400/5">
                  <span className="flex min-w-0 gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200"><Icon size={19} /></span>
                    <span className="min-w-0"><strong className="block truncate text-sm text-slate-900 dark:text-white">{item.title}</strong><small className="mt-1 line-clamp-1 block text-xs text-slate-500">{item.summary}</small><span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[9px] font-black uppercase ${priorityClass[item.priority]}`}>{item.priority}</span></span>
                  </span>
                  <span className="min-w-0"><strong className="block truncate text-xs text-slate-800 dark:text-slate-100">{item.submittedBy}</strong><small className="mt-1 block truncate text-[11px] text-slate-500">{item.contact}</small></span>
                  <span><span className={`inline-flex rounded-full px-2.5 py-1.5 text-[9px] font-black uppercase ${isApproved ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200" : isRejected ? "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200" : statusClass[item.status]}`}>{isApproved ? "Aprovado" : isRejected ? "Recusado" : getStatusLabel(item.status)}</span></span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{item.assignee}</span>
                  <span className="text-xs text-slate-500"><CalendarClock size={14} className="mb-1" />{item.submittedAt}</span>
                  <span className="grid grid-cols-2 gap-2">
                    {canQuickApprove ? <button type="button" onClick={() => openQuickApproval(item.realId)} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 text-xs font-black text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"><BadgeCheck size={15} /> Aprovar</button> : null}
                    <button type="button" onClick={() => setSelectedId(item.id)} className={`${canQuickApprove ? "" : "col-span-2"} inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10`}>Detalhes <ChevronRight size={14} /></button>
                  </span>
                </article>
              );
            })}
          </div>
          {!isLoading && filteredItems.length === 0 ? (
            <div className="px-6 py-14 text-center"><Inbox size={32} className="mx-auto text-slate-300" /><h3 className="mt-3 font-black">Nenhuma solicitação encontrada</h3><p className="mt-1 text-sm text-slate-500">Ajuste os filtros ou aguarde uma nova resposta pelos formulários da igreja.</p><button type="button" onClick={clearFilters} className="mt-4 min-h-11 rounded-xl border border-slate-200 px-4 text-xs font-black uppercase dark:border-white/10">Limpar filtros</button></div>
          ) : null}
        </div>
      </section>

      {quickApprovalSubmission ? (
        <div className="fixed inset-0 z-[310] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isApproving) setQuickApprovalId(""); }}>
          <section ref={quickModalRef} role="dialog" aria-modal="true" aria-labelledby="quick-approval-title" className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6 dark:bg-[#11161d]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Aprovação rápida</p>
                <h2 id="quick-approval-title" className="mt-1 text-xl font-black">Aprovar voluntário</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{quickApprovalSubmission.submitterName || "Membro identificado"} será adicionado à equipe selecionada.</p>
              </div>
              <button ref={quickCloseButtonRef} type="button" onClick={() => setQuickApprovalId("")} disabled={isApproving} aria-label="Fechar aprovação rápida" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"><X size={19} /></button>
            </div>

            {teams.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 dark:border-amber-300/30 dark:bg-amber-400/10">
                <p className="text-sm font-semibold leading-6 text-amber-800 dark:text-amber-200">Cadastre uma equipe antes de aprovar esta candidatura.</p>
                <Link href="/gestao-igreja/equipes" className="mt-2 inline-flex min-h-10 items-center text-xs font-black uppercase text-emerald-800 underline underline-offset-4 dark:text-emerald-200">Gerenciar equipes</Link>
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                <label>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Equipe *</span>
                  <select value={approvalTeamId} onChange={(event) => { setApprovalTeamId(event.target.value); setApprovalFunctionId(""); setApprovalFeedback(""); }} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-white/10 dark:bg-[#0d1117] dark:focus:ring-emerald-500/20">
                    <option value="">Selecione uma equipe</option>
                    {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Função na equipe</span>
                  <select value={approvalFunctionId} onChange={(event) => setApprovalFunctionId(event.target.value)} disabled={!approvalTeamId || isLoadingFunctions} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#0d1117]">
                    <option value="">{isLoadingFunctions ? "Carregando funções..." : "Sem função específica"}</option>
                    {teamFunctions.map((teamFunction) => <option key={teamFunction.id} value={teamFunction.id}>{teamFunction.name}</option>)}
                  </select>
                </label>
                {approvalFeedback ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">{approvalFeedback}</p> : null}
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setQuickApprovalId("")} disabled={isApproving} className="min-h-11 rounded-xl border border-slate-200 px-4 text-xs font-black uppercase text-slate-700 disabled:opacity-50 dark:border-white/10 dark:text-slate-200">Cancelar</button>
                  <button type="button" onClick={() => approveVolunteer(quickApprovalSubmission, true)} disabled={!approvalTeamId || isApproving || isLoadingFunctions} aria-busy={isApproving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-black uppercase text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
                    {isApproving ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}{isApproving ? "Aprovando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {selectedItem ? (
        <div className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(""); }}>
          <section ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="inbox-detail-title" className="flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-[#f7f8fa] shadow-2xl sm:max-h-[92vh] sm:rounded-3xl dark:bg-[#0d1117]">
            <header className="shrink-0 bg-gradient-to-r from-[#071326] to-[#07533f] px-5 py-4 text-white sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">Detalhes da solicitação</p><h2 id="inbox-detail-title" className="mt-1 truncate text-xl font-black sm:text-2xl">{selectedItem.title}</h2><p className="mt-1 text-xs text-slate-300">{selectedItem.source} • recebido em {selectedItem.submittedAt}</p></div>
                <button ref={closeButtonRef} type="button" onClick={() => setSelectedId("")} aria-label="Fechar detalhes" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><X size={20} /></button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
                <div className="space-y-5">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1.5 text-[9px] font-black uppercase ${isVolunteerApproved ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200" : isVolunteerRejected ? "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200" : statusClass[selectedItem.status]}`}>{isVolunteerApproved ? "Aprovado" : isVolunteerRejected ? "Recusado" : getStatusLabel(selectedItem.status)}</span><span className={`rounded-full px-2.5 py-1.5 text-[9px] font-black uppercase ${priorityClass[selectedItem.priority]}`}>{selectedItem.priority}</span>{selectedItem.privacy.includes("Restrito") ? <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1.5 text-[9px] font-black uppercase text-rose-700 dark:bg-rose-400/15 dark:text-rose-200"><Lock size={11} /> Restrito</span> : null}</div>
                    <h3 className="mt-4 text-sm font-black uppercase tracking-wider text-slate-500">Resumo</h3><p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200">{selectedItem.summary}</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <Info icon={CircleUserRound} label="Enviado por" value={selectedItem.submittedBy} />
                      <Info icon={Phone} label="Contato" value={selectedItem.contact} />
                      <Info icon={UserCheck} label="Responsável" value={selectedItem.assignee} />
                      <Info icon={CalendarClock} label="Última atualização" value={selectedItem.lastUpdate} />
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
                    <h3 className="flex items-center gap-2 font-black"><Mail size={18} className="text-emerald-600" /> Respostas enviadas</h3>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      {getPayloadEntries(selectedItem.payload).map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-white/5"><dt className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">{value}</dd></div>)}
                    </dl>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
                    <h3 className="flex items-center gap-2 font-black"><ShieldCheck size={18} className="text-emerald-600" /> Retorno e privacidade</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2"><Info icon={Bell} label="Status para o membro" value={selectedItem.publicStatus} /><Info icon={Lock} label="Privacidade" value={selectedItem.privacy} /></div>
                  </section>
                </div>

                <aside className="space-y-4">
                  {isVolunteerCandidate ? (
                    <section className={`rounded-2xl border p-5 ${isVolunteerApproved ? "border-emerald-200 bg-emerald-50 dark:border-emerald-300/20 dark:bg-emerald-400/10" : isVolunteerRejected ? "border-rose-200 bg-rose-50 dark:border-rose-300/20 dark:bg-rose-400/10" : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]"}`}>
                      {isVolunteerApproved ? (
                        <div className="flex gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"><BadgeCheck size={21} /></span>
                          <div>
                            <h3 className="font-black text-emerald-900 dark:text-emerald-100">Voluntário aprovado</h3>
                            <p className="mt-1 text-xs font-semibold leading-5 text-emerald-800 dark:text-emerald-200">{selectedSubmission.publicFeedback || "O membro já está vinculado à equipe e recebeu o retorno da aprovação."}</p>
                          </div>
                        </div>
                      ) : isVolunteerRejected ? (
                        <div className="flex gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white"><UserX size={21} /></span>
                          <div>
                            <h3 className="font-black text-rose-900 dark:text-rose-100">Solicitação recusada</h3>
                            <p className="mt-1 text-xs font-semibold leading-5 text-rose-800 dark:text-rose-200">{selectedSubmission.publicFeedback || "A solicitação foi encerrada e o usuário pode enviar uma nova candidatura."}</p>
                            <p className="mt-2 text-[11px] font-bold leading-5 text-rose-700 dark:text-rose-200">O usuário foi notificado e pode solicitar novamente.</p>
                          </div>
                        </div>
                      ) : isRejectionConfirmationOpen ? (
                        <>
                          <div className="flex gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200"><UserX size={21} /></span>
                            <div>
                              <h3 className="font-black">Recusar solicitação?</h3>
                              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Esta ação encerra somente o pedido atual. O usuário será notificado e poderá enviar uma nova solicitação depois.</p>
                            </div>
                          </div>
                          <label className="mt-4 block">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Mensagem para o usuário <span className="font-semibold normal-case tracking-normal">(opcional)</span></span>
                            <textarea value={rejectionReason} onChange={(event) => { setRejectionReason(event.target.value); setRejectionFeedback(""); }} maxLength={500} rows={4} placeholder="Explique com cuidado o motivo ou a orientação para uma próxima tentativa." className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100 dark:border-white/10 dark:bg-[#11161d] dark:focus:ring-rose-500/20" />
                            <span className="mt-1 block text-right text-[10px] font-semibold text-slate-400">{rejectionReason.length}/500</span>
                          </label>
                          {rejectionFeedback ? <p role="alert" className="mt-3 rounded-xl bg-rose-100 p-3 text-xs font-semibold leading-5 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200">{rejectionFeedback}</p> : null}
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <button type="button" onClick={() => { setIsRejectionConfirmationOpen(false); setRejectionReason(""); setRejectionFeedback(""); }} disabled={isRejecting} className="min-h-11 rounded-xl border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">Cancelar</button>
                            <button type="button" onClick={rejectVolunteer} disabled={isRejecting} aria-busy={isRejecting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
                              {isRejecting ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />}
                              {isRejecting ? "Recusando..." : "Confirmar recusa"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3 className="flex items-center gap-2 font-black"><UsersRound size={18} className="text-emerald-700 dark:text-emerald-300" /> Aprovar voluntário</h3>
                          <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">Escolha onde a pessoa irá servir. A aprovação adiciona o membro à equipe e envia o retorno automaticamente.</p>
                          {!selectedSubmission?.submitterUserId ? (
                            <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-200">Esta candidatura não possui um usuário identificado e ainda não pode ser aprovada.</p>
                          ) : teams.length === 0 ? (
                            <div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3 dark:border-amber-300/30 dark:bg-amber-400/10">
                              <p className="text-xs font-semibold leading-5 text-amber-800 dark:text-amber-200">Cadastre uma equipe antes de aprovar esta candidatura.</p>
                              <Link href="/gestao-igreja/equipes" className="mt-2 inline-flex min-h-10 items-center text-xs font-black uppercase text-emerald-800 underline underline-offset-4 dark:text-emerald-200">Gerenciar equipes</Link>
                            </div>
                          ) : (
                            <>
                              <label className="mt-4 block">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Equipe *</span>
                                <select value={approvalTeamId} onChange={(event) => { setApprovalTeamId(event.target.value); setApprovalFunctionId(""); setApprovalFeedback(""); }} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-[#11161d]">
                                  <option value="">Selecione uma equipe</option>
                                  {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                                </select>
                              </label>
                              <label className="mt-3 block">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Função na equipe</span>
                                <select value={approvalFunctionId} onChange={(event) => setApprovalFunctionId(event.target.value)} disabled={!approvalTeamId || isLoadingFunctions} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#11161d]">
                                  <option value="">{isLoadingFunctions ? "Carregando funções..." : "Sem função específica"}</option>
                                  {teamFunctions.map((teamFunction) => <option key={teamFunction.id} value={teamFunction.id}>{teamFunction.name}</option>)}
                                </select>
                              </label>
                              <button type="button" onClick={() => selectedSubmission && approveVolunteer(selectedSubmission)} disabled={!approvalTeamId || isApproving || isLoadingFunctions} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
                                {isApproving ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
                                {isApproving ? "Aprovando..." : "Aprovar e adicionar à equipe"}
                              </button>
                            </>
                          )}
                          {approvalFeedback ? <p role="status" className="mt-3 rounded-xl bg-slate-100 p-3 text-xs font-semibold leading-5 text-slate-700 dark:bg-white/10 dark:text-slate-200">{approvalFeedback}</p> : null}
                          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
                            <button type="button" onClick={() => { setIsRejectionConfirmationOpen(true); setApprovalFeedback(""); setRejectionFeedback(""); }} disabled={!selectedSubmission?.submitterUserId || isApproving} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 text-xs font-black uppercase tracking-wider text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-300/20 dark:text-rose-200 dark:hover:bg-rose-400/10"><UserX size={16} /> Recusar solicitação</button>
                            {!selectedSubmission?.submitterUserId ? <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">É necessário identificar o usuário para enviar a notificação da recusa.</p> : null}
                          </div>
                        </>
                      )}
                    </section>
                  ) : null}
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">{isVolunteerResolved ? "Situação" : "Próxima ação"}</p><p className="mt-2 text-sm font-bold leading-6">{selectedItem.nextAction}</p>
                    {!isVolunteerResolved ? <button type="button" onClick={updateSelectedStatus} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#082f2b] px-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-emerald-900"><CheckCircle2 size={16} /> Atualizar status</button> : null}
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
                    <h3 className="flex items-center gap-2 font-black"><UserRound size={18} /> Responsável e prioridade</h3>
                    <label className="mt-4 block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">ID do responsável</span><input value={assigneeDraft} onChange={(event) => setAssigneeDraft(event.target.value)} placeholder="UUID do pastor, líder ou gestor" className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-[#11161d]" /></label>
                    <button type="button" onClick={() => setAssigneeDraft(currentUserId)} disabled={!currentUserId} className="mt-2 min-h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-black uppercase text-slate-600 disabled:opacity-50 dark:border-white/10 dark:text-slate-300">Atribuir a mim</button>
                    <label className="mt-4 block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Prioridade</span><select value={priorityDraft} onChange={(event) => setPriorityDraft(event.target.value as ChurchSubmissionPriority)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-[#11161d]"><option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></label>
                    <button type="button" onClick={updateSelectedAssignment} className="mt-4 min-h-11 w-full rounded-xl bg-slate-950 px-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">Salvar atribuição</button>
                  </section>
                  {actionFeedback ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-200">{actionFeedback}</p> : null}
                </aside>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Bell; label: string; value: string }) {
  return <div className="flex gap-3 rounded-xl bg-slate-50 p-3 dark:bg-white/5"><Icon size={17} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300" /><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 break-words text-xs font-bold text-slate-800 dark:text-slate-100">{value}</p></div></div>;
}

function mapSubmissionToDisplay(submission: ChurchFormSubmission): DisplayInboxItem {
  return {
    id: submission.id,
    realId: submission.id,
    realStatus: submission.status,
    title: getSubmissionTitle(submission.formType),
    source: `Formulário ${getFormTypeLabel(submission.formType)}`,
    type: normalizeDisplayType(submission.formType),
    status: mapSubmissionStatus(submission.status),
    publicStatus: submission.publicStatus,
    priority: mapPriority(submission.priority),
    assignee: submission.assignedTo ? "Responsável atribuído" : "Sem responsável",
    submittedBy: submission.submitterName || (submission.submitterUserId ? "Membro identificado" : "Envio público"),
    contact: submission.submitterContact || "Contato não informado",
    submittedAt: formatDate(submission.createdAt),
    createdAt: submission.createdAt,
    lastUpdate: formatDate(submission.updatedAt),
    privacy: submission.isSensitive ? "Restrito ao cuidado pastoral autorizado" : "Visível para responsáveis autorizados",
    summary: submission.internalSummary || submission.publicFeedback || "Solicitação recebida pela igreja.",
    nextAction: submission.nextAction || "Definir próxima ação",
    payload: submission.payload ?? {},
    icon: submission.formType === "volunteer" ? UserCheck : submission.formType === "pastor_care" ? ShieldCheck : MessageSquareHeart,
  };
}

function mapSubmissionStatus(status: ChurchSubmissionStatus): ChurchInboxStatus {
  const map: Record<ChurchSubmissionStatus, ChurchInboxStatus> = { received: "Recebido", assigned: "Atribuido", in_progress: "Em acompanhamento", waiting_member: "Aguardando membro", answered: "Encerrado", closed: "Encerrado", archived: "Encerrado" };
  return map[status];
}

function getStatusLabel(status: ChurchInboxStatus | "Todos") {
  return status === "Atribuido" ? "Atribuído" : status;
}

function mapPriority(priority: ChurchSubmissionPriority): ChurchInboxItemPreview["priority"] {
  if (priority === "urgent") return "Urgente";
  if (priority === "high") return "Alta";
  return "Normal";
}

function normalizeDisplayType(type: string): ChurchInboxItemPreview["type"] {
  if (type === "volunteer" || type === "visitor" || type === "pastor_care" || type === "group") return type;
  return "prayer";
}

function getSubmissionTitle(type: string) {
  const titles: Record<string, string> = { prayer: "Pedido de oração", volunteer: "Interesse em voluntariado", visitor: "Novo visitante", pastor_care: "Conversa pastoral", group: "Interesse em grupo" };
  return titles[type] ?? "Solicitação recebida";
}

function getFormTypeLabel(type: string) {
  const labels: Record<string, string> = { prayer: "de oração", volunteer: "de voluntariado", visitor: "de visitantes", pastor_care: "de cuidado pastoral", group: "de grupos" };
  return labels[type] ?? type;
}

function getPayloadEntries(payload: Record<string, unknown>) {
  const entries = Object.entries(payload).filter(([, value]) => value !== null && value !== undefined && String(value).trim());
  return entries.length ? entries.map(([label, value]) => [label, Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value)] as const) : [["Informações", "Nenhuma resposta adicional foi informada."] as const];
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data não informada" : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function buildRealSummary(submissions: ChurchFormSubmission[]) {
  return [
    { label: "Recebidos", value: submissions.length, icon: Inbox, tone: "text-blue-300" },
    { label: "Alta prioridade", value: submissions.filter((item) => item.priority === "high" || item.priority === "urgent").length, icon: AlertTriangle, tone: "text-amber-300" },
    { label: "Aguardando", value: submissions.filter((item) => item.status === "waiting_member").length, icon: Bell, tone: "text-rose-300" },
    { label: "Sem responsável", value: submissions.filter((item) => !item.assignedTo).length, icon: UserRound, tone: "text-emerald-300" },
  ];
}
