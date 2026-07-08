"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Filter,
  Info,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { churchManagementService, type ChurchCultoOperationalItem } from "../../services/churchManagementService";
import { cultoPlusService } from "../../services/cultoPlusService";
import type { ChurchServiceTeam, ServiceLiturgyItem, ServiceScheduleStatus } from "../../types";

type OperationalFilter = "all" | "pending" | "confirmed" | "unmanaged";
type SuggestedService = {
  key: string;
  title: string;
  activity: string;
  weekday: string;
  startsAt: Date;
  endsAt: Date;
  serviceType: "sunday" | "youth" | "cell" | "other";
};
type SuggestionDraft = {
  title: string;
  activity: string;
  startTime: string;
  endTime: string;
};

const FILTER_OPTIONS: Array<{ value: OperationalFilter; label: string }> = [
  { value: "all", label: "Todos os status" },
  { value: "pending", label: "Aguardando resposta" },
  { value: "confirmed", label: "Confirmados" },
  { value: "unmanaged", label: "Sem equipes" },
];

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  live: "Ao vivo",
  finished: "Encerrado",
  archived: "Arquivado",
};

const SCHEDULE_STATUS_LABELS: Record<ServiceScheduleStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  declined: "Recusado",
  replaced: "Substituido",
};

const DEFAULT_MONTHLY_LITURGY: Array<Pick<ServiceLiturgyItem, "kind" | "title" | "startsAt">> = [
  { kind: "entrance", title: "Recepcao e ambiente", startsAt: "16:45" },
  { kind: "opening", title: "Abertura e oracao", startsAt: "17:00" },
  { kind: "worship", title: "Louvor e adoracao", startsAt: "17:15" },
  { kind: "word", title: "Palavra", startsAt: "17:50" },
  { kind: "offering", title: "Dizimos, ofertas e avisos", startsAt: "18:35" },
  { kind: "response", title: "Resposta e intercessao", startsAt: "18:45" },
  { kind: "closing", title: "Encerramento", startsAt: "18:55" },
];

function getActiveChurchId(userProfile: ReturnType<typeof useAuth>["userProfile"]) {
  return userProfile?.churchData?.churchId ?? null;
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatWeekday(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function toTimeInputValue(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatMonthYear(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(value);
}

function toDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

function buildDefaultLiturgy(): ServiceLiturgyItem[] {
  return DEFAULT_MONTHLY_LITURGY.map((item, index) => ({
    id: `monthly_default_${item.kind}_${index}`,
    kind: item.kind,
    title: item.title,
    startsAt: item.startsAt,
    responsible: "",
    notes: "Preencha este momento com conteudo, responsavel e observacoes antes de publicar a escala final.",
    sortOrder: index,
  }));
}

const SUGGESTION_TEMPLATES = [
  { day: 0, title: "Escola Biblica Dominical", activity: "Escola Biblica, culto ou celebracao", start: "08:30", end: "10:30", serviceType: "sunday" as const },
  { day: 0, title: "Culto da Familia", activity: "Culto principal/familia", start: "18:00", end: "20:00", serviceType: "sunday" as const },
  { day: 2, title: "Culto de Oracao e Doutrina", activity: "Oracao, doutrina ou departamentos", start: "19:00", end: "20:00", serviceType: "other" as const },
  { day: 3, title: "Culto de Oracao e Estudo Biblico", activity: "Culto de oracao ou estudo biblico", start: "19:00", end: "20:30", serviceType: "other" as const },
  { day: 4, title: "Celulas e Pequenos Grupos", activity: "Celulas, pequenos grupos ou culto", start: "19:00", end: "20:30", serviceType: "cell" as const },
  { day: 5, title: "Culto de Jovens e Oracao", activity: "Jovens, oracao ou libertacao", start: "19:30", end: "21:00", serviceType: "youth" as const },
  { day: 6, title: "Jovens, Adolescentes e Eventos", activity: "Jovens, adolescentes e eventos especiais", start: "18:00", end: "20:00", serviceType: "youth" as const },
];

function applyTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return next;
}

function buildDateWithTime(date: Date, time: string) {
  if (!time.match(/^\d{2}:\d{2}$/)) return new Date(date);
  return applyTime(date, time);
}

function getMonthSuggestedServices(reference = new Date()): SuggestedService[] {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const cursor = new Date(year, month, 1, 12, 0, 0, 0);
  const services: SuggestedService[] = [];

  while (cursor.getMonth() === month) {
    SUGGESTION_TEMPLATES
      .filter((template) => template.day === cursor.getDay())
      .forEach((template) => {
        const startsAt = applyTime(cursor, template.start);
        const endsAt = applyTime(cursor, template.end);
        services.push({
          key: `${toDateKey(startsAt)}:${template.title.toLowerCase()}`,
          title: template.title,
          activity: template.activity,
          weekday: formatWeekday(startsAt.toISOString()),
          startsAt,
          endsAt,
          serviceType: template.serviceType,
        });
      });
    cursor.setDate(cursor.getDate() + 1);
  }

  return services;
}

function getStats(item: ChurchCultoOperationalItem) {
  const total = item.schedules.length;
  const confirmed = item.schedules.filter((schedule) => schedule.status === "confirmed").length;
  const pending = item.schedules.filter((schedule) => schedule.status === "pending").length;
  const declined = item.schedules.filter((schedule) => schedule.status === "declined").length;
  const teams = new Set(item.schedules.map((schedule) => schedule.ministryId || schedule.ministryName).filter(Boolean));
  item.assignments.forEach((assignment) => {
    if (assignment.teamId) teams.add(assignment.teamId);
  });
  return {
    total,
    confirmed,
    pending,
    declined,
    teams: teams.size,
    completion: total > 0 ? Math.round((confirmed / total) * 100) : 0,
  };
}

function getManagementStatus(item: ChurchCultoOperationalItem) {
  const stats = getStats(item);
  if (stats.total === 0 && stats.teams === 0) return "Sem equipes";
  if (stats.pending > 0 || stats.declined > 0) return "Aguardando";
  if (stats.total > 0 && stats.confirmed === stats.total) return "Confirmado";
  return "Em andamento";
}

function serviceMatches(item: ChurchCultoOperationalItem, query: string, filter: OperationalFilter) {
  const stats = getStats(item);
  const normalizedQuery = query.trim().toLowerCase();
  const text = [item.service.title, item.service.theme, item.service.preacherName, item.service.serviceType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const matchesQuery = !normalizedQuery || text.includes(normalizedQuery);
  const matchesFilter =
    filter === "all" ||
    (filter === "pending" && (stats.pending > 0 || stats.declined > 0)) ||
    (filter === "confirmed" && stats.total > 0 && stats.confirmed === stats.total) ||
    (filter === "unmanaged" && stats.total === 0 && stats.teams === 0);
  return matchesQuery && matchesFilter;
}

function buildSummary(items: ChurchCultoOperationalItem[], teams: ChurchServiceTeam[]) {
  const totals = items.reduce(
    (acc, item) => {
      const stats = getStats(item);
      acc.confirmed += stats.confirmed;
      acc.pending += stats.pending;
      acc.total += stats.total;
      return acc;
    },
    { confirmed: 0, pending: 0, total: 0 },
  );
  return {
    cultos: items.length,
    teams: teams.filter((team) => team.status === "active").length || teams.length,
    confirmed: totals.confirmed,
    pending: totals.pending,
    invited: totals.total,
    completion: totals.total > 0 ? Math.round((totals.confirmed / totals.total) * 100) : 0,
  };
}

export default function ChurchCultosDashboard() {
  const { currentUser, userProfile } = useAuth();
  const activeChurchId = getActiveChurchId(userProfile);
  const currentUserId = currentUser?.uid ?? currentUser?.id ?? userProfile?.uid ?? null;
  const [items, setItems] = useState<ChurchCultoOperationalItem[]>([]);
  const [teams, setTeams] = useState<ChurchServiceTeam[]>([]);
  const [teamParticipantCounts, setTeamParticipantCounts] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OperationalFilter>("all");
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [scaleModal, setScaleModal] = useState<ChurchCultoOperationalItem | null>(null);
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);
  const [selectedSuggestionKeys, setSelectedSuggestionKeys] = useState<Set<string>>(new Set());
  const [suggestionDrafts, setSuggestionDrafts] = useState<Record<string, SuggestionDraft>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingMonthlyModel, setIsCreatingMonthlyModel] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = async () => {
    if (!activeChurchId) {
      setIsLoading(false);
      setItems([]);
      setTeams([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const monthRange = getCurrentMonthRange();
      const [nextItems, nextTeams] = await Promise.all([
        churchManagementService.getCultoOperationalItems(activeChurchId, 60, monthRange),
        churchManagementService.listTeams(activeChurchId, { limit: 100 }),
      ]);
      const nextCounts = await churchManagementService.getTeamParticipantCounts(activeChurchId, nextTeams.map((team) => team.id));
      setItems(nextItems);
      setTeams(nextTeams);
      setTeamParticipantCounts(nextCounts);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar os cultos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [activeChurchId]);

  const filteredItems = useMemo(
    () => items
      .filter((item) => serviceMatches(item, query, filter))
      .sort((a, b) => new Date(a.service.startsAt).getTime() - new Date(b.service.startsAt).getTime()),
    [filter, items, query],
  );
  const summary = useMemo(() => buildSummary(items, teams), [items, teams]);
  const monthlySuggestions = useMemo(() => getMonthSuggestedServices(), []);
  const availableSuggestions = useMemo(() => {
    const existingKeys = new Set(items.map((item) => `${toDateKey(item.service.startsAt)}:${item.service.title.trim().toLowerCase()}`));
    return monthlySuggestions.filter((service) => !existingKeys.has(service.key));
  }, [items, monthlySuggestions]);
  const unmanagedItems = useMemo(() => items.filter((item) => {
    const stats = getStats(item);
    return stats.total === 0 && stats.teams === 0;
  }), [items]);
  const selectedCount = selectedServiceIds.size;
  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedServiceIds.has(item.service.id));

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServiceIds((current) => {
      const next = new Set(current);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  };

  const toggleFilteredSelection = () => {
    setSelectedServiceIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) {
        filteredItems.forEach((item) => next.delete(item.service.id));
      } else {
        filteredItems.forEach((item) => next.add(item.service.id));
      }
      return next;
    });
  };

  const openSuggestionModal = () => {
    setSelectedSuggestionKeys(new Set(availableSuggestions.map((service) => service.key)));
    setSuggestionDrafts(Object.fromEntries(availableSuggestions.map((service) => [service.key, {
      title: service.title,
      activity: service.activity,
      startTime: toTimeInputValue(service.startsAt),
      endTime: toTimeInputValue(service.endsAt),
    }])));
    setSuggestionModalOpen(true);
  };

  const updateSuggestionDraft = (service: SuggestedService, updates: Partial<SuggestionDraft>) => {
    setSuggestionDrafts((current) => ({
      ...current,
      [service.key]: {
        title: current[service.key]?.title ?? service.title,
        activity: current[service.key]?.activity ?? service.activity,
        startTime: current[service.key]?.startTime ?? toTimeInputValue(service.startsAt),
        endTime: current[service.key]?.endTime ?? toTimeInputValue(service.endsAt),
        ...updates,
      },
    }));
  };

  const getSuggestionDraft = (service: SuggestedService): SuggestionDraft => suggestionDrafts[service.key] ?? {
    title: service.title,
    activity: service.activity,
    startTime: toTimeInputValue(service.startsAt),
    endTime: toTimeInputValue(service.endsAt),
  };

  const toggleSuggestionSelection = (serviceKey: string) => {
    setSelectedSuggestionKeys((current) => {
      const next = new Set(current);
      if (next.has(serviceKey)) next.delete(serviceKey);
      else next.add(serviceKey);
      return next;
    });
  };

  const toggleAllSuggestions = () => {
    setSelectedSuggestionKeys((current) => (
      current.size === availableSuggestions.length
        ? new Set()
        : new Set(availableSuggestions.map((service) => service.key))
    ));
  };

  const createSelectedSuggestions = async () => {
    if (!activeChurchId || !userProfile?.churchData || !currentUserId) {
      setFeedback("Vincule seu perfil a uma igreja para criar o modelo mensal de cultos.");
      return;
    }
    const suggestionsToCreate = availableSuggestions.filter((service) => selectedSuggestionKeys.has(service.key));
    if (suggestionsToCreate.length === 0) {
      setFeedback("Selecione ao menos uma sugestao de culto para criar.");
      return;
    }
    const invalidSuggestion = suggestionsToCreate.find((service) => {
      const draft = getSuggestionDraft(service);
      return !draft.title.trim() || !draft.activity.trim() || !draft.startTime || !draft.endTime;
    });
    if (invalidSuggestion) {
      setFeedback("Preencha titulo, descricao e horarios das sugestoes selecionadas.");
      return;
    }

    setIsCreatingMonthlyModel(true);
    setFeedback(null);
    try {
      for (const service of suggestionsToCreate) {
        const draft = getSuggestionDraft(service);
        const startsAt = buildDateWithTime(service.startsAt, draft.startTime);
        const endsAt = buildDateWithTime(service.endsAt, draft.endTime);
        await cultoPlusService.createService({
          churchId: activeChurchId,
          churchName: userProfile.churchData.churchName,
          churchSlug: userProfile.churchData.churchSlug,
          title: draft.title.trim(),
          theme: draft.activity.trim(),
          preacherName: userProfile.displayName || "Pastor",
          serviceType: service.serviceType,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          keyVerseRef: undefined,
          keyVerseText: undefined,
          bannerUrl: undefined,
          liveUrl: undefined,
          status: "published",
          createdBy: currentUserId,
          liturgyItems: buildDefaultLiturgy(),
        });
      }
      setFeedback(`${suggestionsToCreate.length} sugestao(oes) de culto criada(s) para ${formatMonthYear(new Date())}. Complete o conteudo e escale as equipes.`);
      setSuggestionModalOpen(false);
      await load();
    } catch (createError) {
      setFeedback(createError instanceof Error ? createError.message : "Nao foi possivel criar o modelo mensal de cultos.");
    } finally {
      setIsCreatingMonthlyModel(false);
    }
  };

  const deleteSelectedServices = async () => {
    if (selectedServiceIds.size === 0) return;
    const selectedItems = items.filter((item) => selectedServiceIds.has(item.service.id));
    const message = selectedItems.length === 1
      ? `Excluir "${selectedItems[0]?.service.title}" da listagem? O culto sera arquivado.`
      : `Excluir ${selectedItems.length} cultos da listagem? Os cultos serao arquivados.`;
    if (!window.confirm(message)) return;

    setIsDeletingSelected(true);
    setFeedback(null);
    try {
      for (const serviceId of selectedServiceIds) {
        await cultoPlusService.archiveService(serviceId);
      }
      setItems((current) => current.filter((item) => !selectedServiceIds.has(item.service.id)));
      setSelectedServiceIds(new Set());
      setFeedback(`${selectedItems.length} culto(s) excluido(s) da listagem.`);
    } catch (deleteError) {
      setFeedback(deleteError instanceof Error ? deleteError.message : "Nao foi possivel excluir os cultos selecionados.");
    } finally {
      setIsDeletingSelected(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#071735]">
      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
              <Info size={14} />
              Gestao da Igreja
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-normal text-[#071735]">Gestao de Cultos</h1>
            <p className="mt-2 text-base font-medium text-slate-600">Escalas, equipes e confirmacoes em um so lugar.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={openSuggestionModal}
              disabled={isCreatingMonthlyModel}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-[#061b49] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CalendarDays size={18} />
              Sugestao de cultos
            </button>
            <Link href="/workspace-pastoral/cultos/novo" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#061b49] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#0b2b6c]">
              <Plus size={18} />
              Novo Culto
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetric icon={CalendarDays} label="Cultos no periodo" value={summary.cultos} helper="Mes atual" />
          <DashboardMetric icon={Users} label="Equipes" value={summary.teams} helper="Ativas" />
          <DashboardMetric icon={CheckCircle2} label="Confirmados" value={summary.confirmed} helper={`de ${summary.invited} convidados`} progress={summary.completion} />
          <DashboardMetric icon={Clock3} label="Pendentes" value={summary.pending} helper="Aguardando resposta" tone="orange" />
        </section>

        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_190px_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar culto por nome, tema ou local..."
                className="min-h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#061b49]"
              />
            </label>
            <button type="button" className="inline-flex min-h-12 items-center justify-between rounded-lg border border-slate-200 px-4 text-sm font-black text-[#071735]">
              <span className="inline-flex items-center gap-2"><CalendarDays size={16} /> Proximos cultos</span>
            </button>
            <label className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black text-[#071735]">
              <Filter size={17} />
              <select value={filter} onChange={(event) => setFilter(event.target.value as OperationalFilter)} className="w-full bg-transparent text-sm font-black outline-none">
                {FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={deleteSelectedServices}
              disabled={selectedCount === 0 || isDeletingSelected}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-red-100 px-4 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={17} />
              {isDeletingSelected ? "Excluindo" : "Excluir"}
            </button>
          </div>
        </section>

        {error ? <StatusMessage tone="warning">{error}</StatusMessage> : null}
        {feedback ? <StatusMessage>{feedback}</StatusMessage> : null}
        {isLoading ? <StatusMessage>Carregando cultos...</StatusMessage> : null}

        {!isLoading && unmanagedItems.length > 0 ? (
          <section className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-amber-700">
                  <Info size={19} />
                </div>
                <div>
                  <h2 className="text-sm font-black">Complete o conteudo e escale as equipes</h2>
                  <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-amber-800">
                    {unmanagedItems.length} culto(s) ainda estao sem equipes. O modelo padrao cria os cultos preenchidos como ponto de partida, mas e necessario alimentar tema, liturgia, links e escalar os times para ativar o acompanhamento no app.
                  </p>
                </div>
              </div>
              <Link href="/workspace-pastoral/cultos" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#061b49] px-4 text-sm font-black text-white transition hover:bg-[#0b2b6c]">
                Editar conteudo
                <ExternalLink size={16} />
              </Link>
            </div>
          </section>
        ) : null}

        <section className="mt-6">
          {selectedCount > 0 ? (
            <div className="mb-3 flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm font-black text-[#061b49] sm:flex-row sm:items-center sm:justify-between">
              <span>{selectedCount} culto(s) selecionado(s)</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedServiceIds(new Set())} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-100 bg-white px-3 text-xs font-black transition hover:bg-slate-50">
                  Limpar selecao
                </button>
                <button type="button" onClick={deleteSelectedServices} disabled={isDeletingSelected} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 text-xs font-black text-white transition hover:bg-red-700 disabled:opacity-60">
                  <Trash2 size={15} />
                  Excluir selecionados
                </button>
              </div>
            </div>
          ) : null}

          <div className="hidden grid-cols-[44px_1.3fr_0.62fr_0.58fr_0.72fr_0.62fr_0.72fr] gap-5 px-2 pb-3 text-[11px] font-black uppercase tracking-wider text-slate-500 lg:grid">
            <label className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleFilteredSelection}
                aria-label="Selecionar todos os cultos visiveis"
                className="h-4 w-4 rounded border-slate-300 text-[#061b49]"
              />
            </label>
            <span>Culto</span>
            <span>Data e horario</span>
            <span>Equipes</span>
            <span>Confirmacoes</span>
            <span>Status</span>
            <span>Acoes</span>
          </div>

          <div className="space-y-3">
            {filteredItems.map((item) => {
              const stats = getStats(item);
              const detailHref = `/gestao-igreja/cultos/${encodeURIComponent(item.service.id)}`;
              const isSelected = selectedServiceIds.has(item.service.id);
              return (
                <article key={item.service.id} className={`grid gap-5 rounded-lg border bg-white p-4 shadow-sm transition lg:grid-cols-[44px_1.3fr_0.62fr_0.58fr_0.72fr_0.62fr_0.72fr] lg:items-center ${isSelected ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"}`}>
                  <label className="flex items-center gap-3 text-xs font-black text-slate-600 lg:justify-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleServiceSelection(item.service.id)}
                      aria-label={`Selecionar ${item.service.title}`}
                      className="h-4 w-4 rounded border-slate-300 text-[#061b49]"
                    />
                    <span className="lg:hidden">Selecionar culto</span>
                  </label>
                  <div className="grid min-w-0 grid-cols-[80px_1fr] gap-4">
                    <div className="h-36 overflow-hidden rounded-lg bg-slate-100 lg:h-32">
                      {item.service.bannerUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.service.bannerUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 via-sky-100 to-emerald-100">
                          <CalendarDays className="text-[#061b49]" size={28} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 py-1">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-700">{formatWeekday(item.service.startsAt)}</span>
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase text-emerald-700">{STATUS_LABELS[item.service.status] ?? item.service.status}</span>
                      </div>
                      <h2 className="mt-3 truncate text-lg font-black text-[#071735]">{item.service.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-600">{item.service.theme || "Tema nao informado"}</p>
                      <p className="mt-3 text-xs font-semibold text-slate-500">{item.service.churchName || "Sede da igreja"}</p>
                    </div>
                  </div>

                  <div className="text-sm font-bold text-slate-700">
                    <p className="inline-flex items-center gap-2"><CalendarDays size={15} /> {formatDate(item.service.startsAt)}</p>
                    <p className="mt-3 inline-flex items-center gap-2"><Clock3 size={15} /> {formatTime(item.service.startsAt)}</p>
                  </div>

                  <div>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#061b49]">
                      <Users size={22} />
                    </div>
                    <p className="mt-2 text-sm font-black text-slate-700">{stats.teams} equipes</p>
                    <Link href={detailHref} className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[#061b49]">
                      Ver equipes <ChevronRight size={13} />
                    </Link>
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#071735]">{stats.confirmed} / {stats.total}</p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${stats.completion}%` }} />
                    </div>
                    <div className="mt-3 grid gap-1 text-xs font-semibold text-slate-500">
                      <span>Confirmados <strong className="float-right text-emerald-600">{stats.confirmed}</strong></span>
                      <span>Pendentes <strong className="float-right text-orange-500">{stats.pending}</strong></span>
                      <span>Recusados <strong className="float-right text-red-500">{stats.declined}</strong></span>
                    </div>
                  </div>

                  <div>
                    <span className="inline-flex min-h-8 items-center rounded-md bg-orange-50 px-3 text-[10px] font-black uppercase text-orange-600">{getManagementStatus(item)}</span>
                    <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">Confirmacoes dos voluntarios</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setScaleModal(item)} className="inline-flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 text-[10px] font-black text-[#071735] transition hover:bg-slate-50">
                      <Users size={19} />
                      Escalar
                    </button>
                    <Link href={detailHref} className="inline-flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 text-[10px] font-black text-[#071735] transition hover:bg-slate-50">
                      <ChevronRight size={21} />
                      Detalhes
                    </Link>
                    {item.service.slug ? (
                      <Link href={`/culto/${item.service.slug}`} className="col-span-2 inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 text-[10px] font-black uppercase text-[#071735] transition hover:bg-slate-50">
                        <ExternalLink size={14} />
                        Ir para culto online
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {!isLoading && filteredItems.length === 0 ? (
          <section className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <CalendarDays className="mx-auto text-slate-400" size={30} />
            <h2 className="mt-4 text-xl font-black">Nenhum culto encontrado</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">Crie um culto no Culto+ ou ajuste os filtros da listagem.</p>
          </section>
        ) : null}

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#061b49] text-white">
                <Info size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-[#071735]">Como funciona a escala?</h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                  Lideres recebem notificacao para aprovar a equipe. Apos aprovacao, os voluntarios convidados confirmam ou recusam o convite.
                </p>
              </div>
            </div>
            <button type="button" onClick={load} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black text-[#061b49] transition hover:bg-slate-50">
              <RefreshCw size={16} />
              Atualizar
            </button>
          </div>
        </section>

        <footer className="mt-6 text-sm font-semibold text-slate-500">Mostrando {filteredItems.length} de {items.length} culto(s)</footer>
      </section>

      {scaleModal ? (
        <ScaleServiceModal
          item={scaleModal}
          teams={teams}
          teamParticipantCounts={teamParticipantCounts}
          currentUserId={currentUserId}
          onClose={() => setScaleModal(null)}
          onChanged={load}
        />
      ) : null}

      {suggestionModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="suggestion-modal-title" className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Modelo mensal</p>
                <h2 id="suggestion-modal-title" className="mt-1 text-2xl font-black text-[#071735]">Sugestao de cultos</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Selecione os cultos que deseja criar para {formatMonthYear(new Date())}. Eles serao criados sem equipes para voce completar conteudo e escala depois.
                </p>
              </div>
              <button type="button" onClick={() => setSuggestionModalOpen(false)} aria-label="Fechar sugestoes" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50">
                <X size={18} />
              </button>
            </header>

            <div className="max-h-[58vh] overflow-y-auto p-5">
              {availableSuggestions.length > 0 ? (
                <>
                  <div className="mb-3 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-black text-[#071735]">{selectedSuggestionKeys.size} de {availableSuggestions.length} sugestao(oes) selecionada(s)</p>
                    <button type="button" onClick={toggleAllSuggestions} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-[#061b49] transition hover:bg-slate-50">
                      {selectedSuggestionKeys.size === availableSuggestions.length ? "Desmarcar todas" : "Selecionar todas"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {availableSuggestions.map((service) => {
                      const checked = selectedSuggestionKeys.has(service.key);
                      const draft = getSuggestionDraft(service);
                      return (
                        <div key={service.key} className={`grid gap-3 rounded-lg border p-4 transition ${checked ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}>
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSuggestionSelection(service.key)}
                              aria-label={`Selecionar ${draft.title || service.title}`}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#061b49]"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px]">
                                <label className="block">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Titulo</span>
                                  <input
                                    value={draft.title}
                                    onChange={(event) => updateSuggestionDraft(service, { title: event.target.value })}
                                    className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-[#071735] outline-none transition focus:border-[#061b49]"
                                  />
                                </label>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{service.weekday}</p>
                                  <div className="mt-1 grid grid-cols-2 gap-2">
                                    <label className="block">
                                      <span className="sr-only">Horario inicial</span>
                                      <input
                                        type="time"
                                        value={draft.startTime}
                                        onChange={(event) => updateSuggestionDraft(service, { startTime: event.target.value })}
                                        className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm font-black text-[#071735] outline-none transition focus:border-[#061b49]"
                                      />
                                    </label>
                                    <label className="block">
                                      <span className="sr-only">Horario final</span>
                                      <input
                                        type="time"
                                        value={draft.endTime}
                                        onChange={(event) => updateSuggestionDraft(service, { endTime: event.target.value })}
                                        className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm font-black text-[#071735] outline-none transition focus:border-[#061b49]"
                                      />
                                    </label>
                                  </div>
                                </div>
                              </div>
                              <label className="mt-3 block">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Descricao</span>
                                <textarea
                                  value={draft.activity}
                                  onChange={(event) => updateSuggestionDraft(service, { activity: event.target.value })}
                                  rows={2}
                                  className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-5 text-slate-700 outline-none transition focus:border-[#061b49]"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                  <CalendarDays className="mx-auto text-slate-400" size={30} />
                  <h3 className="mt-4 text-lg font-black text-[#071735]">Todas as sugestoes do mes ja existem</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">Ajuste cultos manualmente no Culto+ ou exclua/arquive itens antigos antes de criar novamente.</p>
                </div>
              )}
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => setSuggestionModalOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-[#061b49] transition hover:bg-slate-50">
                Cancelar
              </button>
              <button
                type="button"
                onClick={createSelectedSuggestions}
                disabled={isCreatingMonthlyModel || selectedSuggestionKeys.size === 0 || availableSuggestions.length === 0}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#061b49] px-4 text-sm font-black text-white transition hover:bg-[#0b2b6c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CalendarDays size={16} />
                {isCreatingMonthlyModel ? "Criando cultos" : "Criar cultos selecionados"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function DashboardMetric({
  icon: Icon,
  label,
  value,
  helper,
  progress,
  tone = "blue",
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number;
  helper: string;
  progress?: number;
  tone?: "blue" | "orange";
}) {
  const toneClass = tone === "orange" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-[#061b49]";
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-full ${toneClass}`}>
          <Icon size={25} />
        </div>
        <div>
          <p className="text-xs font-black text-slate-600">{label}</p>
          <p className="mt-1 text-3xl font-black text-[#071735]">{value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
        </div>
      </div>
      {typeof progress === "number" ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">{progress}%</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function StatusMessage({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warning" }) {
  const classes = tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-600";
  return <section className={`mt-4 rounded-lg border p-4 text-sm font-semibold ${classes}`}>{children}</section>;
}

function ScaleServiceModal({
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
  const initialSelectedTeamIds = useMemo(() => {
    const assignedTeamIds = new Set(item.assignments.map((assignment) => assignment.teamId).filter(Boolean) as string[]);
    const scheduledTeamNames = new Set(item.schedules.map((schedule) => schedule.ministryName.trim().toLowerCase()));
    return teams
      .filter((team) => assignedTeamIds.has(team.id) || scheduledTeamNames.has(team.name.trim().toLowerCase()))
      .map((team) => team.id);
  }, [item.assignments, item.schedules, teams]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(initialSelectedTeamIds);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedTeams = useMemo(() => teams.filter((team) => selectedTeamIds.includes(team.id)), [selectedTeamIds, teams]);

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((current) => current.includes(teamId) ? current.filter((id) => id !== teamId) : [...current, teamId]);
  };

  const saveScale = async () => {
    if (!currentUserId) {
      setFeedback("Usuario atual nao identificado para criar a escala.");
      return;
    }
    if (selectedTeams.length === 0) {
      setFeedback("Selecione pelo menos uma equipe para este culto.");
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      for (const team of selectedTeams) {
        const alreadyRequested = item.assignments.some((assignment) => assignment.teamId === team.id && assignment.sourceType === "gestao_culto_team");
        if (alreadyRequested) continue;
        await churchManagementService.requestTeamServiceApproval({
          service: item.service,
          team,
          createdBy: currentUserId,
        });
      }
      setFeedback("Escala enviada para aprovacao do lider ou gestor. Apos aprovacao, os voluntarios serao notificados.");
      await onChanged();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel salvar a escala.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="scale-service-title" className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Escalar culto</p>
            <h2 id="scale-service-title" className="mt-1 text-2xl font-black text-[#071735]">{item.service.title}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">{formatDate(item.service.startsAt)} as {formatTime(item.service.startsAt)}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Fechar escala">
            x
          </button>
        </header>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-base font-black text-[#071735]">Times que participam</h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">A selecao prepara as equipes para este culto sem alterar os membros cadastrados no time global.</p>

            {teams.length > 0 ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {teams.map((team) => {
                  const participantCount = teamParticipantCounts[team.id] ?? 0;
                  return (
                    <label key={team.id} className={`flex min-h-20 cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${selectedTeamIds.includes(team.id) ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                      <input type="checkbox" checked={selectedTeamIds.includes(team.id)} onChange={() => toggleTeam(team.id)} className="mt-1 h-4 w-4 rounded border-slate-300 text-[#061b49]" />
                      <span>
                        <span className="block text-sm font-black text-[#071735]">{team.name}</span>
                        <span className="mt-1 block text-xs font-semibold text-slate-500">{team.area || team.description || "Time operacional"}</span>
                        <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-500">
                          <Users size={12} />
                          {participantCount} participante{participantCount === 1 ? "" : "s"}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-600">Nenhuma equipe cadastrada. Crie equipes antes de escalar o culto.</p>
            )}
          </div>

          {feedback ? <StatusMessage>{feedback}</StatusMessage> : null}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-[#061b49] transition hover:bg-slate-50">Cancelar</button>
          <button type="button" onClick={saveScale} disabled={isSaving || teams.length === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#061b49] px-4 text-sm font-black text-white transition hover:bg-[#0b2b6c] disabled:cursor-not-allowed disabled:opacity-60">
            <CheckCircle2 size={16} />
            {isSaving ? "Salvando escala" : "Salvar times"}
          </button>
        </footer>
      </section>
    </div>
  );
}
