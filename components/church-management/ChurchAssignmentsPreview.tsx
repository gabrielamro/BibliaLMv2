"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  QrCode,
  Save,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ChurchAssignmentStatus as PreviewAssignmentStatus } from "../../services/churchManagementPreviewService";
import { churchManagementService } from "../../services/churchManagementService";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchAssignment, ChurchAssignmentStatus, ChurchRoleScopeType } from "../../types";

const statusClass: Record<PreviewAssignmentStatus, string> = {
  Ativa: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
  "Aguardando aceite": "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  Recusada: "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200",
  Pausada: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
};

type AssignmentDisplay = {
  id: string;
  title: string;
  description: string;
  team: string;
  scope: string;
  leader: string;
  nextService: string;
  pendingInvites: number;
  volunteers: number;
  status: PreviewAssignmentStatus;
  memberFeedback: string;
  icon: LucideIcon;
  realId?: string;
  assigneeUserId?: string | null;
  leaderUserId?: string | null;
  rawStatus?: ChurchAssignmentStatus;
  teamId?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  canApproveTeamScale?: boolean;
};

const cardMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function ChurchAssignmentsPreview() {
  const { currentUser, userProfile } = useAuth();
  const [selectedId, setSelectedId] = useState("");
  const [realAssignments, setRealAssignments] = useState<ChurchAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PreviewAssignmentStatus | "Todos">("Todos");
  const [scopeFilter, setScopeFilter] = useState("Todos");
  const [isCreating, setIsCreating] = useState(false);
  const [approvingAssignmentId, setApprovingAssignmentId] = useState<string | null>(null);
  const [createFeedback, setCreateFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [approvalFeedback, setApprovalFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    scopeType: "service" as ChurchRoleScopeType,
    startsAt: "",
    assigneeUserId: "",
    publicFeedback: "Voce recebeu uma escala da igreja. Confirme sua disponibilidade para que a lideranca acompanhe.",
  });
  const reduceMotion = useReducedMotion();
  const activeChurchId = userProfile?.churchData?.churchId;
  const currentUserId = currentUser?.uid ?? currentUser?.id ?? null;

  useEffect(() => {
    if (!activeChurchId) return;
    let isMounted = true;
    setIsLoading(true);
    churchManagementService.listAssignments(activeChurchId, { limit: 50 })
      .then((assignments) => {
        if (!isMounted) return;
        setRealAssignments(assignments);
        if (assignments[0]?.id) setSelectedId(assignments[0].id);
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
  }, [activeChurchId]);

  const displayAssignments = useMemo<AssignmentDisplay[]>(() => {
    return realAssignments.map((assignment) => {
      const isTeamScaleApproval = assignment.sourceType === "gestao_culto_team" && !assignment.assigneeUserId;
      return {
        id: assignment.id,
        realId: assignment.id,
        title: assignment.title,
        description: assignment.description || "Atividade criada para organizacao da igreja.",
        team: assignment.teamId ? "Equipe vinculada" : "Sem equipe vinculada",
        scope: getScopeLabel(assignment.scopeType),
        leader: assignment.leaderUserId ? "Lider vinculado" : "Gestor da igreja",
        nextService: assignment.startsAt ? new Date(assignment.startsAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Data a definir",
        pendingInvites: assignment.status === "pending" ? 1 : 0,
        volunteers: assignment.assigneeUserId ? 1 : 0,
        status: mapAssignmentStatus(assignment.status),
        memberFeedback: assignment.publicFeedback || "A igreja informara proximos passos.",
        icon: ClipboardList as LucideIcon,
        assigneeUserId: assignment.assigneeUserId,
        leaderUserId: assignment.leaderUserId,
        rawStatus: assignment.status,
        teamId: assignment.teamId,
        sourceType: assignment.sourceType,
        sourceId: assignment.sourceId,
        canApproveTeamScale: isTeamScaleApproval && assignment.status === "pending",
      };
    });
  }, [realAssignments]);

  const selectedAssignment =
    displayAssignments.find((assignment) => assignment.id === selectedId) ??
    displayAssignments[0];

  const filteredAssignments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return displayAssignments.filter((assignment) =>
      (statusFilter === "Todos" || assignment.status === statusFilter) &&
      (scopeFilter === "Todos" || assignment.scope === scopeFilter) &&
      (!term || [assignment.title, assignment.description, assignment.team, assignment.scope, assignment.leader, assignment.status]
        .join(" ")
        .toLowerCase()
        .includes(term))
    );
  }, [displayAssignments, scopeFilter, search, statusFilter]);

  const scopeOptions = useMemo(() => ["Todos", ...Array.from(new Set(displayAssignments.map((assignment) => assignment.scope)))], [displayAssignments]);

  const summary = useMemo(
    () => [
      { id: "assignments-total", label: "Escalas", value: String(displayAssignments.length), detail: "Registros reais", icon: ClipboardList },
      { id: "volunteers-total", label: "Voluntarios", value: String(displayAssignments.reduce((sum, item) => sum + item.volunteers, 0)), detail: "Em escalas", icon: Users },
      { id: "invites-pending", label: "Convites", value: String(displayAssignments.reduce((sum, item) => sum + item.pendingInvites, 0)), detail: "Aguardando aceite", icon: Bell },
      { id: "assignments-scheduled", label: "Escalas", value: String(displayAssignments.filter((item) => item.nextService !== "Data a definir").length), detail: "Com data definida", icon: CalendarDays },
    ],
    [displayAssignments, realAssignments.length]
  );

  const createAssignment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim()) {
      setCreateFeedback({ type: "error", message: "Informe o nome da escala." });
      return;
    }
    if (!activeChurchId) {
      setCreateFeedback({ type: "info", message: "Vincule seu perfil a uma igreja para gravar escalas reais. Esta tela segue em modo preview." });
      return;
    }

    setIsCreating(true);
    setCreateFeedback(null);
    try {
      const created = await churchManagementService.createAssignment({
        churchId: activeChurchId,
        title: draft.title.trim(),
        description: draft.description.trim(),
        scopeType: draft.scopeType,
        startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : null,
        assigneeUserId: draft.assigneeUserId.trim() || null,
        leaderUserId: currentUser?.id ?? currentUser?.uid ?? null,
        publicFeedback: draft.publicFeedback.trim(),
        createdBy: currentUser?.id ?? currentUser?.uid ?? null,
      });
      setRealAssignments((assignments) => [created, ...assignments]);
      setSelectedId(created.id);
      setDraft((current) => ({ ...current, title: "", description: "", startsAt: "", assigneeUserId: "" }));
      setCreateFeedback({ type: "success", message: "Escala criada. O membro tera retorno na area Minha Igreja quando estiver vinculado." });
    } catch (error) {
      setCreateFeedback({ type: "error", message: error instanceof Error ? error.message : "Nao foi possivel criar a escala agora." });
    } finally {
      setIsCreating(false);
    }
  };

  const approveTeamScale = async (assignmentId: string) => {
    if (!currentUserId) {
      setApprovalFeedback({ type: "error", message: "Usuario atual nao identificado para aprovar a escala." });
      return;
    }
    setApprovingAssignmentId(assignmentId);
    setApprovalFeedback(null);
    try {
      const result = await churchManagementService.approveTeamServiceAssignment(assignmentId, currentUserId);
      setRealAssignments((assignments) => {
        const updated = assignments.map((assignment) => assignment.id === result.teamAssignment.id ? result.teamAssignment : assignment);
        const existingIds = new Set(updated.map((assignment) => assignment.id));
        const newAssignments = result.memberAssignments.filter((assignment) => !existingIds.has(assignment.id));
        return [...newAssignments, ...updated];
      });
      setSelectedId(result.teamAssignment.id);
      setApprovalFeedback({
        type: "success",
        message: `Escala aprovada. ${result.participantsNotified} participante(s) receberam convite para aceitar.`,
      });
    } catch (error) {
      setApprovalFeedback({ type: "error", message: error instanceof Error ? error.message : "Nao foi possivel aprovar a escala." });
    } finally {
      setApprovingAssignmentId(null);
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
                <ClipboardList size={15} className="text-[#d8b15f]" />
                Escalas personalizaveis
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">
                Escalas, times e aceite
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                Escale times criados ou usuarios individuais, gere convites para aceite e acompanhe voluntarios por culto ou evento.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summary.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.id} className="rounded-lg border border-white/15 bg-white/8 p-4">
                    <Icon size={17} className="mb-3 text-[#d8b15f]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{metric.label}</p>
                    <p className="mt-2 text-3xl font-black">{metric.value}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">{metric.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        {isLoading ? (
          <div className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            Carregando escalas da igreja...
          </div>
        ) : null}
        <motion.div {...motionProps} className="grid gap-4">
          <label className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Buscar escala</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Digite escala, equipe, lider ou status" className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#d8b15f] focus:ring-2 focus:ring-[#d8b15f]/20 dark:border-white/10 dark:bg-white/10 dark:text-white" />
          </label>
          <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-2">
            <SelectFilter
              label="Status"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as PreviewAssignmentStatus | "Todos")}
              options={["Todos", "Ativa", "Aguardando aceite", "Recusada", "Pausada"]}
            />
            <SelectFilter label="Escopo" value={scopeFilter} onChange={setScopeFilter} options={scopeOptions} />
          </div>
          {!isLoading && filteredAssignments.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <h2 className="text-xl font-black">Nenhuma escala cadastrada</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Crie a primeira escala para convidar voluntarios, acompanhar aceite e gerar retorno em Minha Igreja.
              </p>
              <Link href="/gestao-igreja/designacoes/nova" className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
                <Plus size={16} />
                Nova escala
              </Link>
            </div>
          ) : null}
          {filteredAssignments.map((assignment) => {
            const Icon = assignment.icon;
            const isSelected = assignment.id === selectedAssignment?.id;
            return (
              <motion.button
                key={assignment.id}
                variants={cardMotion}
                type="button"
                onClick={() => {
                  setSelectedId(assignment.id);
                  setApprovalFeedback(null);
                }}
                className={`rounded-lg border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl dark:bg-white/[0.04] ${
                  isSelected
                    ? "border-[#d8b15f] ring-2 ring-[#d8b15f]/20 dark:border-[#f4d789]"
                    : "border-slate-200 dark:border-white/10"
                }`}
              >
                <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                      <Icon size={21} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black">{assignment.title}</h2>
                        <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${statusClass[assignment.status]}`}>
                          {assignment.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{assignment.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-right md:w-36 md:shrink-0">
                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Equipe</p>
                      <p className="mt-1 text-sm font-black">{assignment.team}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Pessoas</p>
                      <p className="mt-1 text-xl font-black">{assignment.volunteers}</p>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {selectedAssignment ? (
          <AssignmentDetail
            assignment={selectedAssignment}
            draft={draft}
            setDraft={setDraft}
            onCreate={createAssignment}
            isCreating={isCreating}
            createFeedback={createFeedback}
            onApproveTeamScale={approveTeamScale}
            isApproving={approvingAssignmentId === selectedAssignment.realId}
            approvalFeedback={approvalFeedback}
          />
        ) : (
          <aside className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <h2 className="text-2xl font-black">Pronta para a primeira atividade</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                A listagem vai mostrar apenas escalas reais gravadas no banco.
              </p>
              <Link href="/gestao-igreja/designacoes/nova" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
                <Plus size={16} />
                Nova escala
              </Link>
            </section>
          </aside>
        )}
      </section>
    </main>
  );
}

function AssignmentDetail({
  assignment,
  draft,
  setDraft,
  onCreate,
  isCreating,
  createFeedback,
  onApproveTeamScale,
  isApproving,
  approvalFeedback,
}: {
  assignment: AssignmentDisplay;
  draft: {
    title: string;
    description: string;
    scopeType: ChurchRoleScopeType;
    startsAt: string;
    assigneeUserId: string;
    publicFeedback: string;
  };
  setDraft: React.Dispatch<React.SetStateAction<{
    title: string;
    description: string;
    scopeType: ChurchRoleScopeType;
    startsAt: string;
    assigneeUserId: string;
    publicFeedback: string;
  }>>;
  onCreate: (event: React.FormEvent<HTMLFormElement>) => void;
  isCreating: boolean;
  createFeedback: { type: "success" | "error" | "info"; message: string } | null;
  onApproveTeamScale: (assignmentId: string) => void;
  isApproving: boolean;
  approvalFeedback: { type: "success" | "error" | "info"; message: string } | null;
}) {
  return (
    <aside className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Nova escala</p>
            <h2 className="mt-1 text-2xl font-black">Escalar time ou voluntario</h2>
          </div>
          <Plus size={22} className="text-[#9a7a2f]" />
        </div>

        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
          A tela de escalas fica focada em acompanhamento, filtros e detalhes. O cadastro acontece em uma tela propria, com time, culto/evento e voluntario opcional.
        </p>
        <Link href="/gestao-igreja/designacoes/nova" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
          <Plus size={16} />
          Nova escala
        </Link>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Detalhe da escala</p>
            <h2 className="mt-1 text-2xl font-black">{assignment.title}</h2>
          </div>
          <Plus size={22} className="text-[#9a7a2f]" />
        </div>

        <dl className="grid gap-3 text-sm leading-7">
          {[
            ["Equipe", assignment.team],
            ["Escopo", assignment.scope],
            ["Lider", assignment.leader],
            ["Proxima agenda", assignment.nextService],
            ["Convites pendentes", `${assignment.pendingInvites}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
              <dt className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</dt>
              <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{value}</dd>
            </div>
          ))}
        </dl>

        {assignment.canApproveTeamScale ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-400/20 dark:bg-amber-400/10">
            <p className="text-sm font-semibold leading-6 text-amber-900 dark:text-amber-100">
              Esta equipe aguarda aprovacao. Ao aprovar, os participantes do time recebem convites individuais para aceitar a escala.
            </p>
            <button
              type="button"
              onClick={() => onApproveTeamScale(assignment.realId ?? assignment.id)}
              disabled={isApproving}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
            >
              {isApproving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {isApproving ? "Aprovando" : "Aprovar escala do time"}
            </button>
          </div>
        ) : null}

        {approvalFeedback ? (
          <p className={`mt-4 rounded-lg border p-3 text-sm font-semibold ${
            approvalFeedback.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100"
              : approvalFeedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100"
                : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
          }`}>
            {approvalFeedback.message}
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <Link href={`/gestao-igreja/designacoes/${assignment.realId ?? assignment.id}/editar`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
            <ClipboardList size={16} />
            Editar escala
          </Link>
          <Link href={`/gestao-igreja/designacoes/${assignment.realId ?? assignment.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
            <ClipboardList size={16} />
            Ver detalhe
          </Link>
          <Link href="/gestao-igreja/designacoes/nova" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
            <Plus size={16} />
            Escalar / convidar
          </Link>
          <Link href="/gestao-igreja/qrcodes/novo?type=volunteer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
            <QrCode size={16} />
            QR voluntario
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="mb-4 flex items-center gap-3">
          <ShieldCheck size={22} className="text-emerald-600 dark:text-emerald-300" />
          <h2 className="text-xl font-black">Feedback ao membro</h2>
        </div>
        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{assignment.memberFeedback}</p>
        <div className="mt-4 flex gap-3 rounded-lg border border-slate-200 p-3 text-sm leading-7 text-slate-600 dark:border-white/10 dark:text-slate-300">
          <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />
          Escala informa atividade e proxima acao, mas permissao sensivel continua dependendo de role.
        </div>
      </section>
    </aside>
  );
}

function mapAssignmentStatus(status: ChurchAssignmentStatus): PreviewAssignmentStatus {
  const labels: Record<ChurchAssignmentStatus, PreviewAssignmentStatus> = {
    draft: "Pausada",
    pending: "Aguardando aceite",
    accepted: "Ativa",
    declined: "Recusada",
    paused: "Pausada",
    expired: "Pausada",
    removed: "Pausada",
  };
  return labels[status];
}

function getScopeLabel(scope: ChurchRoleScopeType) {
  const labels: Record<ChurchRoleScopeType, string> = {
    church: "Igreja",
    team: "Equipe",
    group: "Grupo",
    service: "Culto",
    event: "Evento",
  };
  return labels[scope];
}

function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#d8b15f] focus:ring-2 focus:ring-[#d8b15f]/20 dark:border-white/10 dark:bg-[#151b27] dark:text-white">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
