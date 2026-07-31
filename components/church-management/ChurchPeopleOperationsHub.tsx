"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  HeartHandshake,
  Inbox,
  KeyRound,
  Loader2,
  QrCode,
  UserPlus,
  Users,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import ChurchAssignmentsPreview from "./ChurchAssignmentsPreview";
import ChurchOperationalPhasePreview from "./ChurchOperationalPhasePreview";
import ChurchPeoplePreview from "./ChurchPeoplePreview";
import ChurchQrCodesPreview from "./ChurchQrCodesPreview";
import ChurchTeamsDashboard from "./ChurchTeamsDashboard";
import ChurchVolunteerPipelinePage from "./ChurchVolunteerPipelinePage";
import CultosInboxShortcut from "./CultosInboxShortcut";
import { useAuth } from "../../contexts/AuthContext";
import { churchManagementService } from "../../services/churchManagementService";
import { dbService } from "../../services/supabase";
import type { ChurchAssignment, ChurchManagerAlert, ChurchMemberRole, ChurchServiceTeam } from "../../types";

type OperationsPanel = "attention" | "teams" | "assignments" | "volunteers" | "invites" | "permissions";

type OperationsSummary = {
  people: number;
  peopleInTeams: number;
  pending: number;
  weekAssignments: number;
};

const EMPTY_SUMMARY: OperationsSummary = {
  people: 0,
  peopleInTeams: 0,
  pending: 0,
  weekAssignments: 0,
};

const LEGACY_PANEL_MAP: Record<string, OperationsPanel | null> = {
  overview: null,
  people: null,
  teams: "teams",
  assignments: "assignments",
  volunteers: "volunteers",
  invites: "invites",
  permissions: "permissions",
};

const PANEL_META: Record<OperationsPanel, { eyebrow: string; title: string; description: string; icon: LucideIcon }> = {
  attention: {
    eyebrow: "Operação do dia",
    title: "Pendências da gestão",
    description: "Decida o que está bloqueando pessoas, equipes e escalas.",
    icon: Inbox,
  },
  teams: {
    eyebrow: "Organização",
    title: "Gerenciar equipes",
    description: "Crie equipes, defina líderes e acompanhe a capacidade de cada time.",
    icon: UsersRound,
  },
  assignments: {
    eyebrow: "Agenda operacional",
    title: "Escalas e designações",
    description: "Acompanhe convites, confirmações e conflitos sem sair da central.",
    icon: CalendarDays,
  },
  volunteers: {
    eyebrow: "Entrada de pessoas",
    title: "Solicitações de voluntariado",
    description: "Acompanhe candidaturas e conduza cada pessoa até uma equipe.",
    icon: HeartHandshake,
  },
  invites: {
    eyebrow: "Convites",
    title: "Links e QR Codes",
    description: "Crie portas de entrada para novos membros e voluntários.",
    icon: QrCode,
  },
  permissions: {
    eyebrow: "Segurança",
    title: "Papéis e permissões",
    description: "Revise quem pode operar cada área da gestão da igreja.",
    icon: KeyRound,
  },
};

const PANEL_MODAL_WIDTH: Record<OperationsPanel, string> = {
  attention: "sm:max-w-3xl",
  teams: "sm:max-w-[1120px]",
  assignments: "sm:max-w-[1120px]",
  volunteers: "sm:max-w-5xl",
  invites: "sm:max-w-5xl",
  permissions: "sm:max-w-5xl",
};

export default function ChurchPeopleOperationsHub() {
  const { currentUser, userProfile } = useAuth();
  const churchId = userProfile?.churchData?.churchId;
  const currentUserId = currentUser?.id ?? currentUser?.uid ?? "";
  const [activePanel, setActivePanel] = useState<OperationsPanel | null>(null);
  const [summary, setSummary] = useState<OperationsSummary>(EMPTY_SUMMARY);
  const [alerts, setAlerts] = useState<ChurchManagerAlert[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [approvingId, setApprovingId] = useState("");
  const [panelFeedback, setPanelFeedback] = useState("");

  const loadOverview = useCallback(async () => {
    if (!churchId) {
      setSummary(EMPTY_SUMMARY);
      setAlerts([]);
      setIsLoadingSummary(false);
      return;
    }

    setIsLoadingSummary(true);
    try {
      const [members, teams, roles, assignments, managerAlerts] = await Promise.all([
        dbService.getChurchMembers(churchId),
        churchManagementService.listTeams(churchId, { limit: 300 }),
        churchManagementService.listRoles(churchId, { limit: 500 }),
        churchManagementService.listAssignments(churchId, { limit: 500 }),
        churchManagementService.getManagerAlerts(churchId),
      ]);
      const actionableAlerts = managerAlerts.filter((alert) => alert.kind === "approval" || alert.kind === "volunteer");
      setAlerts(actionableAlerts);
      setSummary(buildSummary(members.length, teams, roles, assignments, actionableAlerts.length));
    } catch {
      setSummary(EMPTY_SUMMARY);
      setAlerts([]);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [churchId]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("panel") ?? params.get("tab");
    const nextPanel = requested ? normalizePanel(requested) : null;
    setActivePanel(nextPanel);

    if (params.has("tab")) {
      params.delete("tab");
      if (nextPanel) params.set("panel", nextPanel);
      const query = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    }
  }, []);

  const openPanel = (panel: OperationsPanel) => {
    setPanelFeedback("");
    setActivePanel(panel);
    updatePanelQuery(panel);
  };

  const closePanel = useCallback(() => {
    setActivePanel(null);
    setPanelFeedback("");
    updatePanelQuery(null);
  }, []);

  const approveScale = async (alert: ChurchManagerAlert) => {
    const assignmentId = alert.id.startsWith("approval:") ? alert.id.slice("approval:".length) : "";
    if (!assignmentId) return;
    setApprovingId(alert.id);
    setPanelFeedback("");
    try {
      await churchManagementService.approveTeamServiceAssignment(assignmentId, currentUserId || null);
      setPanelFeedback("Escala aprovada. Os voluntários serão notificados.");
      await loadOverview();
    } catch (error) {
      setPanelFeedback(error instanceof Error ? error.message : "Não foi possível aprovar a escala.");
    } finally {
      setApprovingId("");
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#071735] dark:bg-[#070a0d] dark:text-white">
      <header className="border-b border-slate-200 bg-white px-4 py-5 dark:border-white/10 dark:bg-[#0d1117] sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Gestão da Igreja</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Pessoas e equipes</h1>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Membros, equipes, escalas e acessos em um só fluxo.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <CultosInboxShortcut churchId={churchId} variant="button" />
            <button type="button" onClick={() => openPanel("teams")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#071735] transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
              <UsersRound size={17} />
              Gerenciar equipes
            </button>
            <button type="button" onClick={() => openPanel("invites")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
              <UserPlus size={17} />
              Convidar pessoa
            </button>
          </div>
        </div>

        <section aria-label="Resumo de pessoas e escalas" className="mt-5 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric icon={Users} label="Pessoas" value={summary.people} loading={isLoadingSummary} />
          <SummaryMetric icon={UsersRound} label="Em equipes" value={summary.peopleInTeams} loading={isLoadingSummary} />
          <SummaryMetric icon={AlertCircle} label="Pendências" value={summary.pending} loading={isLoadingSummary} tone="amber" />
          <SummaryMetric icon={CalendarDays} label="Escalas nesta semana" value={summary.weekAssignments} loading={isLoadingSummary} />
        </section>
      </header>

      <section className="px-4 pt-4 sm:px-6 lg:px-8">
        {summary.pending > 0 ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-100">
            <div className="flex min-w-0 items-start gap-3">
              <AlertCircle size={19} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" />
              <div className="min-w-0">
                <strong className="block text-sm">{summary.pending} {summary.pending === 1 ? "ação precisa" : "ações precisam"} de atenção</strong>
                <p className="mt-0.5 text-xs leading-5 text-amber-800 dark:text-amber-200">Aprovações de escala e solicitações de voluntariado aguardam uma decisão.</p>
              </div>
            </div>
            <button type="button" onClick={() => openPanel("attention")} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-400 bg-white px-4 text-xs font-black text-amber-900 transition hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 dark:bg-transparent dark:text-amber-100 dark:hover:bg-white/10">
              Revisar
              <ChevronRight size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100">
            <CheckCircle2 size={19} className="shrink-0" />
            <p className="text-sm font-semibold">Operação em dia. Nenhuma aprovação exige atenção agora.</p>
          </div>
        )}
      </section>

      <ChurchPeoplePreview
        embedded
        onOpenTeams={() => openPanel("teams")}
        onOpenInvite={() => openPanel("invites")}
        onOpenPermissions={() => openPanel("permissions")}
      />

      {activePanel ? (
        <OperationsModal panel={activePanel} onClose={closePanel}>
          {activePanel === "attention" ? (
            <AttentionPanel alerts={alerts} approvingId={approvingId} feedback={panelFeedback} onApproveScale={approveScale} />
          ) : null}
          {activePanel === "teams" ? <EmbeddedModule hideHero={false}><ChurchTeamsDashboard embedded /></EmbeddedModule> : null}
          {activePanel === "assignments" ? <EmbeddedModule><ChurchAssignmentsPreview /></EmbeddedModule> : null}
          {activePanel === "volunteers" ? <EmbeddedModule><ChurchVolunteerPipelinePage /></EmbeddedModule> : null}
          {activePanel === "invites" ? <EmbeddedModule><ChurchQrCodesPreview /></EmbeddedModule> : null}
          {activePanel === "permissions" ? <EmbeddedModule><ChurchOperationalPhasePreview phase="permissoes" /></EmbeddedModule> : null}
        </OperationsModal>
      ) : null}
    </main>
  );
}

function SummaryMetric({ icon: Icon, label, value, loading, tone = "emerald" }: { icon: LucideIcon; label: string; value: number; loading: boolean; tone?: "emerald" | "amber" }) {
  const iconClass = tone === "amber" ? "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200";
  return (
    <article className="flex min-h-24 items-center gap-3 border-b border-slate-200 p-4 last:border-b-0 dark:border-white/10 xl:border-b-0 xl:border-r xl:last:border-r-0">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}><Icon size={21} /></span>
      <span>
        <strong className="block text-2xl font-black">{loading ? "—" : value}</strong>
        <small className="mt-0.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</small>
      </span>
    </article>
  );
}

function OperationsModal({ panel, onClose, children }: { panel: OperationsPanel; onClose: () => void; children: ReactNode }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const meta = PANEL_META[panel];
  const Icon = meta.icon;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])') ?? []).filter((element) => !element.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[330] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="operations-panel-title" className={`flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-[#f7f8fa] shadow-2xl sm:max-h-[92vh] sm:rounded-3xl dark:bg-[#0d1117] ${PANEL_MODAL_WIDTH[panel]}`}>
        <header className="flex shrink-0 items-start gap-4 border-b border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#11161d] sm:px-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200"><Icon size={20} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">{meta.eyebrow}</p>
            <h2 id="operations-panel-title" className="mt-1 text-xl font-black sm:text-2xl">{meta.title}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{meta.description}</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Fechar janela" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"><X size={19} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </section>
    </div>
  );
}

function AttentionPanel({ alerts, approvingId, feedback, onApproveScale }: { alerts: ChurchManagerAlert[]; approvingId: string; feedback: string; onApproveScale: (alert: ChurchManagerAlert) => void }) {
  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        {feedback ? <p role="status" className={`mb-4 rounded-xl p-3 text-sm font-semibold ${feedback.startsWith("Escala aprovada") ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200" : "bg-rose-50 text-rose-800 dark:bg-rose-400/10 dark:text-rose-200"}`}>{feedback}</p> : null}
        {alerts.length === 0 ? (
          <section className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm dark:border-emerald-300/20 dark:bg-white/[0.04]">
            <CheckCircle2 size={34} className="mx-auto text-emerald-600" />
            <h3 className="mt-4 text-xl font-black">Nenhuma pendência operacional</h3>
            <p className="mt-2 text-sm text-slate-500">As aprovações de escala e voluntariado estão em dia.</p>
          </section>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const volunteerId = alert.kind === "volunteer" ? alert.id.replace(/^volunteer:/, "") : "";
              return (
                <article key={alert.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center dark:border-white/10 dark:bg-white/[0.04]">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${alert.kind === "volunteer" ? "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200" : "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200"}`}>{alert.kind === "volunteer" ? <UserPlus size={20} /> : <CalendarDays size={20} />}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black">{alert.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{alert.message}</p>
                    <time dateTime={alert.createdAt} className="mt-1 block text-[10px] font-semibold text-slate-400">{formatDateTime(alert.createdAt)}</time>
                  </div>
                  {alert.kind === "approval" ? (
                    <button type="button" onClick={() => onApproveScale(alert)} disabled={Boolean(approvingId)} aria-busy={approvingId === alert.id} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
                      {approvingId === alert.id ? <Loader2 size={15} className="animate-spin" /> : <BadgeCheck size={15} />}
                      {approvingId === alert.id ? "Aprovando" : "Aprovar"}
                    </button>
                  ) : (
                    <Link href={`/gestao-igreja/inbox?approve=${encodeURIComponent(volunteerId)}`} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-black text-white transition hover:bg-emerald-800">Analisar <ChevronRight size={15} /></Link>
                  )}
                </article>
              );
            })}
          </div>
        )}
        <Link href="/gestao-igreja/inbox" className="mx-auto mt-5 flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#071735] transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"><Inbox size={16} /> Abrir Inbox completo</Link>
      </div>
    </div>
  );
}

function EmbeddedModule({ children, hideHero = true }: { children: ReactNode; hideHero?: boolean }) {
  return <div className={`operational-embedded [&>main]:min-h-0 [&>main]:bg-transparent [&>main>section]:max-w-none [&>main>section]:px-4 sm:[&>main>section]:px-6 ${hideHero ? "[&>main>section:first-child]:hidden" : ""}`}>{children}</div>;
}

function buildSummary(memberCount: number, teams: ChurchServiceTeam[], roles: ChurchMemberRole[], assignments: ChurchAssignment[], pending: number): OperationsSummary {
  const activeTeamIds = new Set(teams.filter((team) => team.status === "active").map((team) => team.id));
  const peopleInTeams = new Set(
    roles
      .filter((role) => role.status === "active" && role.scopeType === "team" && role.scopeId && activeTeamIds.has(role.scopeId))
      .map((role) => role.userId),
  );
  teams.filter((team) => team.status === "active" && team.leaderId).forEach((team) => peopleInTeams.add(team.leaderId as string));

  const { start, end } = getCurrentWeekRange();
  const weekAssignments = assignments.filter((assignment) => {
    if (!assignment.startsAt || !["pending", "accepted"].includes(assignment.status)) return false;
    const startsAt = new Date(assignment.startsAt).getTime();
    return startsAt >= start && startsAt < end;
  }).length;

  return { people: memberCount, peopleInTeams: peopleInTeams.size, pending, weekAssignments };
}

function getCurrentWeekRange() {
  const current = new Date();
  const day = current.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const startDate = new Date(current.getFullYear(), current.getMonth(), current.getDate() + mondayOffset);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 7);
  return { start: startDate.getTime(), end: endDate.getTime() };
}

function normalizePanel(value: string): OperationsPanel | null {
  if (value in LEGACY_PANEL_MAP) return LEGACY_PANEL_MAP[value];
  return ["attention", "teams", "assignments", "volunteers", "invites", "permissions"].includes(value) ? value as OperationsPanel : null;
}

function updatePanelQuery(panel: OperationsPanel | null) {
  const url = new URL(window.location.href);
  url.searchParams.delete("tab");
  if (panel) url.searchParams.set("panel", panel);
  else url.searchParams.delete("panel");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data não informada" : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
