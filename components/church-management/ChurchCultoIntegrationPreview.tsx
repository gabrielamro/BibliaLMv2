"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCopy,
  ClipboardList,
  ExternalLink,
  Filter,
  Link2,
  Plus,
  QrCode,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { cultoPlusService } from "../../services/cultoPlusService";
import { churchManagementService, type ChurchCultoOperationalItem, type ChurchCultoSyncResult } from "../../services/churchManagementService";
import { dbService } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchAssignment, ChurchService, ChurchServiceTeam, ServiceMinistry, ServiceScheduleAssignment, UserProfile } from "../../types";

type OperationalFilter = "all" | "without-scale" | "incomplete" | "complete" | "alerts";

const STATUS_LABELS: Record<ChurchService["status"], string> = {
  draft: "Rascunho",
  published: "Publicado",
  checkin_open: "Check-in aberto",
  live: "Ao vivo",
  in_progress: "Em andamento",
  finished: "Encerrado",
  archived: "Arquivado",
};

const SERVICE_TYPE_LABELS: Record<ChurchService["serviceType"], string> = {
  sunday: "Domingo",
  youth: "Jovens",
  women: "Mulheres",
  cell: "Celula",
  conference: "Conferencia",
  vigil: "Vigilia",
  communion: "Santa Ceia",
  other: "Outro",
};

const SCHEDULE_STATUS_LABELS: Record<ServiceScheduleAssignment["status"], string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  declined: "Recusado",
  replaced: "Substituido",
};

const SCHEDULE_STATUS_STYLES: Record<ServiceScheduleAssignment["status"], string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100",
  declined: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100",
  replaced: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100",
};

const FILTER_OPTIONS: { value: OperationalFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "without-scale", label: "Sem escala" },
  { value: "incomplete", label: "Incompletos" },
  { value: "complete", label: "Completos" },
  { value: "alerts", label: "Com alertas" },
];

const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(value));

const getServiceDaysDistance = (service: ChurchService) => {
  const startsAt = new Date(service.startsAt).getTime();
  const now = Date.now();
  return Math.ceil((startsAt - now) / (1000 * 60 * 60 * 24));
};

const buildServiceManagementStatus = (item: ChurchCultoOperationalItem) => {
  if (item.schedulesCount === 0) return "Sem gestao operacional";
  if (item.pendingSchedulesCount > 0) return "Aguardando aceite";
  const confirmed = item.schedules.filter((schedule) => schedule.status === "confirmed").length;
  const declinedOrReplaced = item.schedules.filter((schedule) => schedule.status === "declined" || schedule.status === "replaced").length;
  if (confirmed > 0 && declinedOrReplaced === 0) return "Escala completa";
  return "Escala com ajustes";
};

const getOperationalStats = (item: ChurchCultoOperationalItem) => {
  const confirmed = item.schedules.filter((schedule) => schedule.status === "confirmed").length;
  const pending = item.schedules.filter((schedule) => schedule.status === "pending").length;
  const declined = item.schedules.filter((schedule) => schedule.status === "declined").length;
  const replaced = item.schedules.filter((schedule) => schedule.status === "replaced").length;
  const teams = new Set(item.schedules.map((schedule) => schedule.ministryId)).size;
  const open = declined + replaced;
  const total = item.schedules.length;
  const completion = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  return { confirmed, pending, declined, replaced, open, total, teams, completion };
};

const getServiceAlerts = (item: ChurchCultoOperationalItem) => {
  const stats = getOperationalStats(item);
  const daysDistance = getServiceDaysDistance(item.service);
  const alerts: string[] = [];

  if (item.schedulesCount === 0) alerts.push("Culto sem escala operacional");
  if (stats.pending > 0) alerts.push(`${stats.pending} convite(s) aguardando aceite`);
  if (stats.open > 0) alerts.push(`${stats.open} vaga(s) exigem substituicao`);
  if (daysDistance >= 0 && daysDistance <= 2 && stats.completion < 100) alerts.push("Culto proximo com escala incompleta");
  if (item.service.status === "draft") alerts.push("Culto ainda em rascunho");

  return alerts;
};

const groupSchedulesByMinistry = (schedules: ServiceScheduleAssignment[]) => {
  return schedules.reduce<Record<string, { ministryName: string; schedules: ServiceScheduleAssignment[] }>>((groups, schedule) => {
    const key = schedule.ministryId || schedule.ministryName || "sem-equipe";
    if (!groups[key]) groups[key] = { ministryName: schedule.ministryName || "Equipe sem nome", schedules: [] };
    groups[key].schedules.push(schedule);
    return groups;
  }, {});
};

const buildOperationalTeamGroups = (item: ChurchCultoOperationalItem, teams: ChurchServiceTeam[]) => {
  const groups = groupSchedulesByMinistry(item.schedules);
  const groupNames = new Set(Object.values(groups).map((group) => normalizeName(group.ministryName)));

  item.assignments
    .filter((assignment) => isTeamServiceAssignmentForService(assignment, item.service.id) && assignment.teamId)
    .forEach((assignment) => {
      const team = teams.find((currentTeam) => currentTeam.id === assignment.teamId);
      const ministryName = team?.name || assignment.title.replace(/^Escala\s+/i, "") || "Time selecionado";
      if (groupNames.has(normalizeName(ministryName))) return;
      groups[assignment.teamId || assignment.id] = { ministryName, schedules: [] };
      groupNames.add(normalizeName(ministryName));
    });

  return groups;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const item = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    return String(item.message || item.details || item.hint || item.code || "Nao foi possivel concluir a operacao.");
  }
  return "Nao foi possivel concluir a operacao.";
};

const normalizeName = (value: string) => value.trim().toLowerCase();
const buildTeamServiceSourceId = (serviceId: string, teamId: string) => `culto_team:${serviceId}:${teamId}`;
const isTeamServiceAssignmentForService = (assignment: ChurchAssignment, serviceId: string) =>
  assignment.sourceType === "gestao_culto_team" && assignment.sourceId?.startsWith(`culto_team:${serviceId}:`);

const ensureServiceMinistryForTeam = async (
  churchId: string,
  userId: string,
  team: ChurchServiceTeam,
  cache?: ServiceMinistry[],
) => {
  const ministries = cache ?? await cultoPlusService.getMinistriesByChurch(churchId);
  const existing = ministries.find((ministry) => normalizeName(ministry.name) === normalizeName(team.name));
  if (existing) return existing;
  return cultoPlusService.createMinistry(churchId, userId, team.name, team.description || team.area || "");
};

export default function ChurchCultoIntegrationPreview() {
  const { userProfile } = useAuth();
  const activeChurchId = userProfile?.churchData?.churchId;
  const [items, setItems] = useState<ChurchCultoOperationalItem[]>([]);
  const [teams, setTeams] = useState<ChurchServiceTeam[]>([]);
  const [teamParticipantCounts, setTeamParticipantCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<ChurchCultoSyncResult | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [rosterModal, setRosterModal] = useState<{ title: string; schedules: ServiceScheduleAssignment[] } | null>(null);
  const [scaleModal, setScaleModal] = useState<ChurchCultoOperationalItem | null>(null);
  const [filter, setFilter] = useState<OperationalFilter>("all");
  const [query, setQuery] = useState("");

  const loadItems = async (churchId: string) => {
    setIsLoading(true);
    setOperationError(null);
    try {
      const nextItems = await churchManagementService.getCultoOperationalItems(churchId, 18);
      setItems(nextItems);
      setExpandedServiceId((current) => current ?? nextItems[0]?.service.id ?? null);
    } catch (error) {
      setItems([]);
      setOperationError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!activeChurchId) return;
    let isMounted = true;
    setIsLoading(true);
    churchManagementService.getCultoOperationalItems(activeChurchId, 18)
      .then((nextItems) => {
        if (!isMounted) return;
        setItems(nextItems);
        setExpandedServiceId(nextItems[0]?.service.id ?? null);
      })
      .catch((error) => {
        if (!isMounted) return;
        setItems([]);
        setOperationError(getErrorMessage(error));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId]);

  useEffect(() => {
    if (!activeChurchId) return;
    let isMounted = true;
    churchManagementService.listTeams(activeChurchId, { limit: 100 })
      .then((nextTeams) => {
        if (isMounted) setTeams(nextTeams.filter((team) => team.status !== "archived"));
      })
      .catch(() => {
        if (isMounted) setTeams([]);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId]);

  useEffect(() => {
    if (!activeChurchId || teams.length === 0) {
      setTeamParticipantCounts({});
      return;
    }
    let isMounted = true;
    churchManagementService.getTeamParticipantCounts(activeChurchId, teams.map((team) => team.id))
      .then((counts) => {
        if (isMounted) setTeamParticipantCounts(counts);
      })
      .catch(() => {
        if (isMounted) setTeamParticipantCounts({});
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId, teams]);

  const dashboardMetrics = useMemo(() => {
    const stats = items.map(getOperationalStats);
    const servicesWithAlerts = items.filter((item) => getServiceAlerts(item).length > 0).length;
    return [
      { label: "Cultos no painel", value: items.length, icon: CalendarDays },
      { label: "Vagas preenchidas", value: stats.reduce((sum, item) => sum + item.confirmed, 0), icon: CheckCircle2 },
      { label: "Convites pendentes", value: stats.reduce((sum, item) => sum + item.pending, 0), icon: Users },
      { label: "Cultos com alertas", value: servicesWithAlerts, icon: AlertTriangle },
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const stats = getOperationalStats(item);
      const alerts = getServiceAlerts(item);
      const matchesQuery = !normalizedQuery
        || String(item.service.title || "").toLowerCase().includes(normalizedQuery)
        || String(item.service.theme || "").toLowerCase().includes(normalizedQuery)
        || String(SERVICE_TYPE_LABELS[item.service.serviceType] || item.service.serviceType || "").toLowerCase().includes(normalizedQuery);

      if (!matchesQuery) return false;
      if (filter === "without-scale") return item.schedulesCount === 0;
      if (filter === "incomplete") return item.schedulesCount > 0 && stats.completion < 100;
      if (filter === "complete") return item.schedulesCount > 0 && stats.completion === 100;
      if (filter === "alerts") return alerts.length > 0;
      return true;
    });
  }, [filter, items, query]);

  const handleSync = async () => {
    if (!activeChurchId || isSyncing) return;
    setIsSyncing(true);
    setSyncResult(null);
    setOperationError(null);
    try {
      const result = await churchManagementService.syncCultoPlusOperationalItems(activeChurchId, 18);
      setSyncResult(result);
      await loadItems(activeChurchId);
    } catch (error) {
      setOperationError(getErrorMessage(error));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefresh = async () => {
    if (!activeChurchId || isLoading) return;
    await loadItems(activeChurchId);
  };

  const handleScheduleChanged = async () => {
    if (!activeChurchId) return;
    await loadItems(activeChurchId);
  };

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="border-b border-slate-200 bg-[#0f172a] text-white dark:border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <Link href="/gestao-igreja" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="grid gap-8 lg:grid-cols-[1fr_0.82fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                <ShieldCheck size={15} className="text-[#d8b15f]" />
                Central do gestor
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-5xl">
                Controle operacional por culto
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                Gerencie cultos, equipes, cargos, vagas, convites e alertas a partir de uma unica tela. Cultos podem existir sem gestao operacional e receber escala depois.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/workspace-pastoral/cultos/novo" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-black uppercase tracking-wider text-slate-950 transition hover:bg-slate-100">
                  <Plus size={16} />
                  Novo culto
                </Link>
                <Link href="/workspace-pastoral/cultos" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/10">
                  <ExternalLink size={16} />
                  Abrir Culto+
                </Link>
              </div>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/8 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Fluxo centralizado</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                O culto e o ponto de partida. Equipes, cargos e convites entram como camada operacional quando a igreja precisar escalar voluntarios.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardMetrics.map((metric, metricIndex) => {
            const Icon = metric.icon;
            return (
              <article key={`${metric.label}-${metricIndex}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <Icon size={21} className="text-[#9a7a2f]" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{metric.label}</p>
                <p className="mt-3 text-3xl font-black">{metric.value}</p>
              </article>
            );
          })}
        </div>

        <section className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por culto, tema ou tipo"
                className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </label>
            <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 dark:border-white/10 dark:text-slate-200">
              <Filter size={16} />
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as OperationalFilter)}
                className="bg-transparent text-sm font-bold outline-none"
              >
                {FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={!activeChurchId || isLoading}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <RefreshCw size={15} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={handleSync}
              disabled={!activeChurchId || isSyncing}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
            >
              <CheckCircle2 size={15} />
              {isSyncing ? "Sincronizando" : "Sincronizar"}
            </button>
          </div>
        </section>

        {syncResult ? (
          <section className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
            Sincronizacao concluida: {syncResult.servicesChecked} culto(s), {syncResult.assignmentsCreated} escala(s) criada(s), {syncResult.assignmentsUpdated} atualizada(s), {syncResult.submissionsCreated} pedido(s) criado(s), {syncResult.submissionsUpdated} atualizado(s).
          </section>
        ) : null}

        {operationError ? (
          <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            {operationError}
          </section>
        ) : null}

        {isLoading ? (
          <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            Carregando central de cultos...
          </section>
        ) : null}

        <section className="mt-6 space-y-4">
          {filteredItems.map((item) => {
            const stats = getOperationalStats(item);
            const alerts = getServiceAlerts(item);
            const groupedTeams = buildOperationalTeamGroups(item, teams);
            const isExpanded = expandedServiceId === item.service.id;
            const serviceHref = `/culto/${item.service.slug}`;
            const qrHref = `/gestao-igreja/qrcodes/novo?type=volunteer&serviceId=${encodeURIComponent(item.service.id)}`;

            return (
              <article key={item.service.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setExpandedServiceId(isExpanded ? null : item.service.id)}
                  className="grid w-full gap-5 p-5 text-left transition hover:bg-slate-50 dark:hover:bg-white/[0.03] lg:grid-cols-[minmax(0,1fr)_auto]"
                  aria-expanded={isExpanded}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {formatDate(item.service.startsAt)}
                      </span>
                      <span className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:border-white/10 dark:text-slate-300">
                        {SERVICE_TYPE_LABELS[item.service.serviceType] || item.service.serviceType || "Outro"}
                      </span>
                      <span className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:border-white/10 dark:text-slate-300">
                        {STATUS_LABELS[item.service.status] || item.service.status || "Status"}
                      </span>
                    </div>
                    <h2 className="mt-3 text-2xl font-black leading-tight">{item.service.title}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {item.service.theme || "Culto sem tema informado."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <OperationalPill label="Status" value={buildServiceManagementStatus(item)} />
                      <OperationalPill label="Equipes" value={String(stats.teams)} />
                      <OperationalPill label="Completo" value={`${stats.completion}%`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[460px]">
                    <SmallMetric label="Vagas" value={stats.total} />
                    <SmallMetric label="Preenchidas" value={stats.confirmed} />
                    <SmallMetric label="Pendentes" value={stats.pending} />
                    <SmallMetric label="Abertas" value={stats.open} />
                  </div>

                  <ChevronDown className={`absolute right-5 mt-1 text-slate-400 transition ${isExpanded ? "rotate-180" : ""}`} size={18} />
                </button>

                {isExpanded ? (
                  <div className="border-t border-slate-200 p-5 dark:border-white/10">
                    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
                      <section>
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-black">Equipes e participantes</h3>
                            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                              Selecione o time pelo bloco abaixo para ver quem participa, status e cargo no culto.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setRosterModal({ title: item.service.title, schedules: item.schedules })}
                              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                              <Users size={15} />
                              Ver membros
                            </button>
                            <button
                              type="button"
                              onClick={() => setScaleModal(item)}
                              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                              <ClipboardList size={15} />
                              Escalar
                            </button>
                            <Link href={qrHref} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                              <QrCode size={15} />
                              QR convite
                            </Link>
                          </div>
                        </div>

                        {Object.entries(groupedTeams).length > 0 ? (
                          <div className="grid gap-3">
                            {Object.entries(groupedTeams).map(([teamId, team]) => {
                              const confirmed = team.schedules.filter((schedule) => schedule.status === "confirmed").length;
                              const pending = team.schedules.filter((schedule) => schedule.status === "pending").length;
                              const open = team.schedules.filter((schedule) => schedule.status === "declined" || schedule.status === "replaced").length;
                              return (
                                <article key={teamId} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Time selecionado</p>
                                      <h4 className="mt-1 text-lg font-black">{team.ministryName}</h4>
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <OperationalPill label="Confirmados" value={String(confirmed)} />
                                        <OperationalPill label="Pendentes" value={String(pending)} />
                                        <OperationalPill label="Abertas" value={String(open)} />
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setRosterModal({ title: `${item.service.title} - ${team.ministryName}`, schedules: team.schedules })}
                                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                                      >
                                        <Users size={15} />
                                        Membros
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setScaleModal(item)}
                                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                                      >
                                        <Users size={15} />
                                        Convidar
                                      </button>
                                      <Link href={`${qrHref}&teamId=${encodeURIComponent(teamId)}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                                        <Link2 size={15} />
                                        Link/QR
                                      </Link>
                                    </div>
                                  </div>
                                  <div className="mt-4 grid gap-2">
                                    {team.schedules.length > 0 ? team.schedules.map((schedule) => (
                                      <div key={schedule.id} className="grid gap-3 rounded-lg bg-slate-50 p-3 dark:bg-white/[0.04] md:grid-cols-[1fr_auto] md:items-center">
                                        <div>
                                          <p className="text-sm font-black">{schedule.userDisplayName}</p>
                                          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            {schedule.role || "Cargo nao informado"}
                                            {schedule.replacementUserDisplayName ? ` -> substituto: ${schedule.replacementUserDisplayName}` : ""}
                                          </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          <span className={`inline-flex min-h-9 items-center rounded-lg border px-2.5 text-[10px] font-black uppercase tracking-wider ${SCHEDULE_STATUS_STYLES[schedule.status]}`}>
                                            {SCHEDULE_STATUS_LABELS[schedule.status]}
                                          </span>
                                          <Link href="/gestao-igreja/designacoes" className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-2.5 text-[10px] font-black uppercase tracking-wider text-slate-700 transition hover:bg-white dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                                            <UserMinus size={13} />
                                            Gerir
                                          </Link>
                                        </div>
                                      </div>
                                    )) : (
                                      <div className="rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
                                        Time selecionado para este culto. Convide voluntarios pelo botao Convidar.
                                      </div>
                                    )}
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        ) : (
                          <article className="rounded-lg border border-dashed border-slate-300 p-5 dark:border-white/15">
                            <Radio size={22} className="text-slate-400" />
                            <h4 className="mt-3 text-lg font-black">Culto sem gestao operacional</h4>
                            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                              Este culto existe, mas ainda nao tem equipes, cargos ou voluntarios vinculados na escala. Ative a operacao criando designacoes ou replicando uma estrutura no Culto+.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Link href="/workspace-pastoral/cultos" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
                                <ClipboardCopy size={15} />
                                Replicar estrutura
                              </Link>
                              <button
                                type="button"
                                onClick={() => setScaleModal(item)}
                                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                              >
                                <Plus size={15} />
                                Escalar culto
                              </button>
                            </div>
                          </article>
                        )}
                      </section>

                      <aside className="space-y-4">
                        <section className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                          <h3 className="text-sm font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Alertas</h3>
                          <div className="mt-3 space-y-2">
                            {alerts.length > 0 ? alerts.map((alert) => (
                              <p key={alert} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                                {alert}
                              </p>
                            )) : (
                              <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold leading-6 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                                Nenhum alerta operacional para este culto.
                              </p>
                            )}
                          </div>
                        </section>

                        <section className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                          <h3 className="text-sm font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Acoes do culto</h3>
                          <div className="mt-3 grid gap-2">
                            <Link href={serviceHref} className="inline-flex min-h-10 items-center justify-between rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                              Abrir pagina publica
                              <ExternalLink size={15} />
                            </Link>
                            <Link href="/workspace-pastoral/cultos" className="inline-flex min-h-10 items-center justify-between rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                              Editar no Culto+
                              <ExternalLink size={15} />
                            </Link>
                            <Link href="/gestao-igreja/equipes" className="inline-flex min-h-10 items-center justify-between rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                              Gerir equipes globais
                              <Users size={15} />
                            </Link>
                          </div>
                        </section>
                      </aside>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>

        {!isLoading && filteredItems.length === 0 ? (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <CalendarDays size={24} className="text-slate-400" />
            <h2 className="mt-4 text-xl font-black">Nenhum culto encontrado</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Crie um culto no Culto+ ou limpe os filtros para voltar a ver a agenda operacional da igreja.
            </p>
            <Link href="/workspace-pastoral/cultos/novo" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
              <Plus size={16} />
              Novo culto
            </Link>
          </section>
        ) : null}
      </section>
      {rosterModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
          <section className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b111d]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-white/10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Membros da escala</p>
                <h2 className="mt-1 text-2xl font-black">{rosterModal.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setRosterModal(null)}
                className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Fechar
              </button>
            </div>
            <div className="max-h-[62vh] overflow-y-auto p-5">
              {rosterModal.schedules.length > 0 ? (
                <div className="grid gap-3">
                  {rosterModal.schedules.map((schedule) => (
                    <article key={schedule.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-base font-black">{schedule.userDisplayName}</h3>
                          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{schedule.ministryName} - {schedule.role || "Cargo nao informado"}</p>
                          {schedule.replacementUserDisplayName ? (
                            <p className="mt-2 text-xs font-bold text-sky-700 dark:text-sky-200">Substituto: {schedule.replacementUserDisplayName}</p>
                          ) : null}
                        </div>
                        <span className={`inline-flex min-h-9 w-fit items-center rounded-lg border px-2.5 text-[10px] font-black uppercase tracking-wider ${SCHEDULE_STATUS_STYLES[schedule.status]}`}>
                          {SCHEDULE_STATUS_LABELS[schedule.status]}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-5 dark:border-white/15">
                  <h3 className="text-lg font-black">Nenhum membro escalado</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Este culto ainda nao possui participantes vinculados a escala operacional.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
      {scaleModal ? (
        <ServiceScaleModal
          item={scaleModal}
          teams={teams}
          teamParticipantCounts={teamParticipantCounts}
          currentUserId={userProfile?.uid ?? null}
          onClose={() => setScaleModal(null)}
          onChanged={handleScheduleChanged}
        />
      ) : null}
    </main>
  );
}

function ServiceScaleModal({
  item,
  teams,
  teamParticipantCounts,
  currentUserId,
  onClose,
  onChanged,
}: {
  item: ChurchCultoOperationalItem;
  teams: ChurchServiceTeam[];
  teamParticipantCounts: Record<string, number>;
  currentUserId: string | null;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const scheduledTeamNames = useMemo(
    () => new Set(item.schedules.map((schedule) => normalizeName(schedule.ministryName)).filter(Boolean)),
    [item.schedules],
  );
  const requestedTeamIds = useMemo(
    () => new Set(item.assignments.filter((assignment) => isTeamServiceAssignmentForService(assignment, item.service.id)).map((assignment) => assignment.teamId).filter(Boolean) as string[]),
    [item.assignments, item.service.id],
  );
  const initialSelectedTeamIds = useMemo(
    () => teams.filter((team) => scheduledTeamNames.has(normalizeName(team.name)) || requestedTeamIds.has(team.id)).map((team) => team.id),
    [requestedTeamIds, scheduledTeamNames, teams],
  );

  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(initialSelectedTeamIds);
  const [selectedTeamIdForUser, setSelectedTeamIdForUser] = useState(initialSelectedTeamIds[0] ?? teams[0]?.id ?? "");
  const [role, setRole] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isSavingTeams, setIsSavingTeams] = useState(false);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const selectedTeams = useMemo(
    () => teams.filter((team) => selectedTeamIds.includes(team.id)),
    [selectedTeamIds, teams],
  );

  const teamsForInvite = selectedTeams.length > 0 ? selectedTeams : teams;
  const selectedTeamForUser = teams.find((team) => team.id === selectedTeamIdForUser) ?? teamsForInvite[0];

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((current) => {
      const next = current.includes(teamId) ? current.filter((id) => id !== teamId) : [...current, teamId];
      if (!next.includes(selectedTeamIdForUser)) setSelectedTeamIdForUser(next[0] ?? teams[0]?.id ?? "");
      return next;
    });
  };

  const handleSaveTeams = async () => {
    if (!currentUserId) {
      setFeedback({ type: "error", message: "Usuario atual nao identificado para criar a escala." });
      return;
    }
    if (selectedTeams.length === 0) {
      setFeedback({ type: "info", message: "Selecione pelo menos um time para participar deste culto." });
      return;
    }
    setIsSavingTeams(true);
    setFeedback(null);
    try {
      const ministries = await cultoPlusService.getMinistriesByChurch(item.service.churchId);
      await Promise.all(selectedTeams.map(async (team) => {
        await ensureServiceMinistryForTeam(item.service.churchId, currentUserId, team, ministries);
        const alreadyLinked = item.assignments.some((assignment) =>
          assignment.sourceType === "gestao_culto_team"
          && assignment.sourceId === buildTeamServiceSourceId(item.service.id, team.id)
        );
        if (alreadyLinked) return;
        await churchManagementService.requestTeamServiceApproval({
          service: item.service,
          team,
          createdBy: currentUserId,
        });
      }));
      setFeedback({ type: "success", message: "Times enviados para aprovacao do lider ou gestor antes de notificar os participantes." });
      await onChanged();
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsSavingTeams(false);
    }
  };

  const handleSearchUsers = async () => {
    const term = userSearch.trim();
    if (term.length < 2) {
      setFeedback({ type: "info", message: "Digite pelo menos 2 caracteres para pesquisar." });
      return;
    }
    setIsSearchingUsers(true);
    setFeedback(null);
    try {
      const results = await dbService.searchUsersGlobal(term);
      setUsers(results.slice(0, 8));
      if (results.length === 0) setFeedback({ type: "info", message: "Nenhum usuario encontrado para esse termo." });
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleInviteUser = async (member: UserProfile) => {
    if (!currentUserId) {
      setFeedback({ type: "error", message: "Usuario atual nao identificado para criar a escala." });
      return;
    }
    if (!selectedTeamForUser) {
      setFeedback({ type: "info", message: "Selecione um time antes de convidar o voluntario." });
      return;
    }
    setInvitingUserId(member.uid);
    setFeedback(null);
    try {
      const ministry = await ensureServiceMinistryForTeam(item.service.churchId, currentUserId, selectedTeamForUser);
      await cultoPlusService.createScheduleAssignment(item.service, ministry, member, role.trim() || selectedTeamForUser.name);
      setSelectedTeamIds((current) => current.includes(selectedTeamForUser.id) ? current : [...current, selectedTeamForUser.id]);
      setFeedback({ type: "success", message: `${member.displayName} foi convidado para ${selectedTeamForUser.name} neste culto.` });
      await onChanged();
    } catch (error) {
      setFeedback({ type: "error", message: getErrorMessage(error) });
    } finally {
      setInvitingUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b111d]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-white/10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Escalar culto</p>
            <h2 className="mt-1 text-2xl font-black">{item.service.title}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{formatDate(item.service.startsAt)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
          >
            Fechar
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
          <section className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-black">Times que participam</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  A selecao abaixo prepara os times para este culto sem alterar os membros cadastrados no time global.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveTeams}
                disabled={isSavingTeams || teams.length === 0}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
              >
                <CheckCircle2 size={15} />
                {isSavingTeams ? "Salvando" : "Salvar times"}
              </button>
            </div>

            {teams.length > 0 ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {teams.map((team) => (
                  <label key={team.id} className="flex min-h-16 cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10">
                    <input
                      type="checkbox"
                      checked={selectedTeamIds.includes(team.id)}
                      onChange={() => toggleTeam(team.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <span>
                      <span className="block text-sm font-black">{team.name}</span>
                      <span className="mt-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">{team.area || team.description || "Time operacional"}</span>
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <Users size={12} />
                        {teamParticipantCounts[team.id] ?? 0} participante{(teamParticipantCounts[team.id] ?? 0) === 1 ? "" : "s"}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-600 dark:border-white/15 dark:text-slate-300">
                Nenhum time global encontrado. Crie os times em Gestao da Igreja &gt; Equipes para escalar este culto.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
            <h3 className="text-base font-black">Convidar voluntario para o culto</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              O convite cria uma escala deste culto. Ele nao adiciona o usuario como membro fixo do time.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr]">
              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Time da escala</span>
                <select
                  value={selectedTeamIdForUser}
                  onChange={(event) => setSelectedTeamIdForUser(event.target.value)}
                  className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                >
                  {teamsForInvite.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Cargo ou funcao</span>
                <input
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  placeholder="Ex.: Recepcao, camera, vocal"
                  className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleSearchUsers();
                    }
                  }}
                  placeholder="Buscar por @, nome ou e-mail"
                  className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                />
              </label>
              <button
                type="button"
                onClick={handleSearchUsers}
                disabled={isSearchingUsers}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <Search size={15} />
                {isSearchingUsers ? "Buscando" : "Buscar"}
              </button>
            </div>

            {users.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {users.map((member) => (
                  <div key={member.uid} className="grid gap-3 rounded-lg bg-slate-50 p-3 dark:bg-white/[0.04] sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="text-sm font-black">{member.displayName || member.username || member.email}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">@{member.username || "usuario"} {member.email ? `- ${member.email}` : ""}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInviteUser(member)}
                      disabled={invitingUserId === member.uid || !selectedTeamForUser}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
                    >
                      <Users size={15} />
                      {invitingUserId === member.uid ? "Convidando" : "Convidar"}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          {feedback ? (
            <p className={`rounded-lg border p-3 text-sm font-semibold leading-6 ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100"
                : feedback.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100"
                  : "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100"
            }`}>
              {feedback.message}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function OperationalPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex min-h-8 items-center gap-2 rounded-lg bg-slate-100 px-2.5 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:bg-white/10 dark:text-slate-300">
      <span className="text-slate-400 dark:text-slate-500">{label}</span>
      {value}
    </span>
  );
}
