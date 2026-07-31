"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Clock3,
  Filter,
  KeyRound,
  Loader2,
  Mail,
  MoreHorizontal,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { churchManagementService } from "../../services/churchManagementService";
import { cultoPlusService } from "../../services/cultoPlusService";
import { dbService } from "../../services/supabase";
import type { ChurchAssignment, ChurchMemberRole, ChurchOperationalRole, ChurchService, ChurchServiceTeam, UserProfile } from "../../types";

type PersonStatus = "active" | "pending" | "no_team" | "no_schedule" | "no_membership";
type QuickFilter = "all" | "members" | "volunteers" | "leaders" | "pending";
type DrawerMode = "profile" | "schedule" | "team";

type PersonRow = {
  id: string;
  name: string;
  email: string;
  photoURL?: string | null;
  isChurchMember: boolean;
  roles: ChurchOperationalRole[];
  roleLabels: string[];
  teams: ChurchServiceTeam[];
  nextAssignment?: ChurchAssignment;
  totalAssignments: number;
  pendingAssignments: number;
  declinedAssignments: number;
  status: PersonStatus;
};

type ChurchPeoplePreviewProps = {
  embedded?: boolean;
  onOpenTeams?: () => void;
  onOpenInvite?: () => void;
  onOpenPermissions?: () => void;
};

const ROLE_LABELS: Record<ChurchOperationalRole, string> = {
  church_manager: "Gestor",
  pastor: "Pastor",
  leader: "Líder",
  volunteer: "Voluntário",
};

const STATUS_LABELS: Record<PersonStatus, string> = {
  active: "Escala confirmada",
  pending: "Aguardando resposta",
  no_team: "Sem equipe",
  no_schedule: "Sem próxima escala",
  no_membership: "Sem vínculo",
};

const STATUS_CLASSES: Record<PersonStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
  pending: "bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200",
  no_team: "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200",
  no_schedule: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  no_membership: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-200",
};

const QUICK_FILTERS: Array<{ id: QuickFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "members", label: "Membros" },
  { id: "volunteers", label: "Voluntários" },
  { id: "leaders", label: "Líderes" },
  { id: "pending", label: "Com pendência" },
];

export default function ChurchPeoplePreview({ embedded = false, onOpenTeams, onOpenInvite, onOpenPermissions }: ChurchPeoplePreviewProps) {
  const { currentUser, userProfile } = useAuth();
  const activeChurchId = userProfile?.churchData?.churchId;
  const currentUserId = currentUser?.id ?? currentUser?.uid ?? "";
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<ChurchMemberRole[]>([]);
  const [teams, setTeams] = useState<ChurchServiceTeam[]>([]);
  const [assignments, setAssignments] = useState<ChurchAssignment[]>([]);
  const [services, setServices] = useState<ChurchService[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("profile");
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState("");
  const [scheduleServiceId, setScheduleServiceId] = useState("");
  const [scheduleTeamId, setScheduleTeamId] = useState("");
  const [scheduleRole, setScheduleRole] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleFeedback, setScheduleFeedback] = useState("");
  const [teamInviteId, setTeamInviteId] = useState("");
  const [isInvitingToTeam, setIsInvitingToTeam] = useState(false);
  const [teamInviteFeedback, setTeamInviteFeedback] = useState("");

  useEffect(() => {
    if (!activeChurchId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    Promise.all([
      dbService.getChurchMembers(activeChurchId),
      churchManagementService.listRoles(activeChurchId, { limit: 500 }),
      churchManagementService.listTeams(activeChurchId, { limit: 300 }),
      churchManagementService.listAssignments(activeChurchId, { limit: 500 }),
      cultoPlusService.getServicesByChurchRange(activeChurchId, {
        startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString(),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 8, 0, 23, 59, 59).toISOString(),
        includeDrafts: false,
        limit: 300,
      }),
    ])
      .then(([nextMembers, nextRoles, nextTeams, nextAssignments, nextServices]) => {
        if (!isMounted) return;
        setMembers(nextMembers);
        setRoles(nextRoles);
        setTeams(nextTeams);
        setAssignments(nextAssignments);
        setServices(nextServices);
      })
      .catch((loadError) => {
        if (!isMounted) return;
        setMembers([]);
        setRoles([]);
        setTeams([]);
        setAssignments([]);
        setServices([]);
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar a lista de pessoas.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeChurchId]);

  const people = useMemo(() => buildPeopleRows(members, roles, teams, assignments), [assignments, members, roles, teams]);
  const selectedPerson = useMemo(() => people.find((person) => person.id === selectedId) ?? null, [people, selectedId]);

  const filteredPeople = useMemo(() => {
    const term = normalize(search);
    return people.filter((person) => {
      const matchesSearch = !term || normalize([
        person.name,
        person.email,
        person.roleLabels.join(" "),
        person.teams.map((team) => team.name).join(" "),
      ].join(" ")).includes(term);
      const matchesQuickFilter = quickFilter === "all"
        || (quickFilter === "members" && person.isChurchMember)
        || (quickFilter === "volunteers" && person.roles.includes("volunteer"))
        || (quickFilter === "leaders" && (person.roles.includes("leader") || person.teams.some((team) => team.leaderId === person.id)))
        || (quickFilter === "pending" && person.pendingAssignments > 0);
      const matchesTeam = teamFilter === "all" || person.teams.some((team) => team.id === teamFilter);
      const matchesRole = roleFilter === "all" || person.roles.includes(roleFilter as ChurchOperationalRole);
      const matchesStatus = statusFilter === "all" || person.status === statusFilter;
      return matchesSearch && matchesQuickFilter && matchesTeam && matchesRole && matchesStatus;
    });
  }, [people, quickFilter, roleFilter, search, statusFilter, teamFilter]);

  const actorRoles = roles.filter((role) => role.userId === currentUserId && role.status === "active");
  const canManageChurch = actorRoles.some((role) => role.role === "church_manager");
  const leaderTeamIds = new Set([
    ...teams.filter((team) => team.leaderId === currentUserId).map((team) => team.id),
    ...actorRoles.filter((role) => role.role === "leader" && role.scopeType === "team" && role.scopeId).map((role) => role.scopeId as string),
  ]);
  const selectedPersonAssignments = assignments.filter((assignment) => assignment.assigneeUserId === selectedPerson?.id);
  const authorizedTeams = selectedPerson?.teams.filter((team) => canManageChurch || leaderTeamIds.has(team.id)) ?? [];
  const availableTeams = selectedPerson
    ? teams.filter((team) => team.status === "active" && !selectedPerson.teams.some((personTeam) => personTeam.id === team.id) && (canManageChurch || leaderTeamIds.has(team.id)))
    : [];
  const selectedDayServices = services.filter((service) => toDateKey(service.startsAt) === selectedDate);

  const openPerson = (personId: string, mode: DrawerMode = "profile") => {
    setSelectedId(personId);
    setDrawerMode(mode);
    setSelectedDate("");
    setScheduleServiceId("");
    setScheduleTeamId("");
    setScheduleFeedback("");
    setTeamInviteId("");
    setTeamInviteFeedback("");
  };

  const selectCalendarDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    setScheduleServiceId("");
    setScheduleTeamId(authorizedTeams.length === 1 ? authorizedTeams[0].id : "");
    setScheduleRole("");
    setScheduleNotes("");
    setScheduleFeedback("");
  };

  const createCalendarAssignment = async () => {
    if (!activeChurchId || !selectedPerson || !currentUserId || !scheduleServiceId || !scheduleTeamId) return;
    setIsScheduling(true);
    setScheduleFeedback("");
    try {
      const created = await churchManagementService.createMemberCultoAssignment({
        churchId: activeChurchId,
        serviceId: scheduleServiceId,
        teamId: scheduleTeamId,
        member: { uid: selectedPerson.id, displayName: selectedPerson.name, photoURL: selectedPerson.photoURL ?? null },
        actorUserId: currentUserId,
        role: scheduleRole,
        notes: scheduleNotes,
      });
      setAssignments((items) => [created, ...items]);
      setScheduleFeedback("Escala enviada. O voluntário precisa confirmar a participação.");
      setScheduleServiceId("");
      setScheduleRole("");
      setScheduleNotes("");
    } catch (scheduleError) {
      setScheduleFeedback(scheduleError instanceof Error ? scheduleError.message : "Não foi possível criar a escala.");
    } finally {
      setIsScheduling(false);
    }
  };

  const inviteToTeam = async () => {
    if (!activeChurchId || !selectedPerson || !teamInviteId || !currentUserId) return;
    const team = teams.find((item) => item.id === teamInviteId);
    if (!team) return;
    const alreadyPending = assignments.some((assignment) => assignment.assigneeUserId === selectedPerson.id && assignment.teamId === team.id && assignment.scopeType === "team" && assignment.status === "pending");
    if (alreadyPending) {
      setTeamInviteFeedback("Já existe um convite pendente para esta pessoa nesta equipe.");
      return;
    }

    setIsInvitingToTeam(true);
    setTeamInviteFeedback("");
    try {
      const created = await churchManagementService.createAssignment({
        churchId: activeChurchId,
        teamId: team.id,
        title: `Convite para servir na equipe ${team.name}`,
        description: `Convite para integrar a equipe ${team.name} como voluntário.`,
        scopeType: "team",
        scopeId: team.id,
        assigneeUserId: selectedPerson.id,
        leaderUserId: team.leaderId || currentUserId,
        publicFeedback: `Você foi convidado para servir na equipe ${team.name}. Aceite ou recuse o convite para informar a liderança.`,
        createdBy: currentUserId,
        sourceType: "team_membership_invite",
        sourceId: `team_membership:${team.id}:${selectedPerson.id}`,
      });
      setAssignments((items) => [created, ...items]);
      setTeamInviteId("");
      setTeamInviteFeedback(`Convite enviado para ${selectedPerson.name}. Aguardando a aprovação do membro.`);
    } catch (inviteError) {
      setTeamInviteFeedback(inviteError instanceof Error ? inviteError.message : "Não foi possível enviar o convite para a equipe.");
    } finally {
      setIsInvitingToTeam(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setQuickFilter("all");
    setTeamFilter("all");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  const closePerson = useCallback(() => setSelectedId(null), []);

  return (
    <main className={`${embedded ? "min-h-0" : "min-h-screen"} bg-[#f7f8fa] text-[#071735] dark:bg-[#070a0d] dark:text-white`}>
      {!embedded ? (
        <header className="border-b border-slate-200 bg-white px-5 py-6 dark:border-white/10 dark:bg-[#0d1117] md:px-8">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Gestão da Igreja</p>
          <h1 className="mt-1 text-3xl font-black">Pessoas e equipes</h1>
          <p className="mt-1 text-sm text-slate-500">Membros, equipes, escalas e acessos em um só fluxo.</p>
        </header>
      ) : null}

      <section className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative block min-w-0 flex-1">
              <span className="sr-only">Buscar pessoas</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, equipe ou função..." className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-white/10 dark:bg-[#11161d] dark:focus:ring-emerald-400/10" />
            </label>
            <button type="button" onClick={() => setAdvancedFiltersOpen((open) => !open)} aria-expanded={advancedFiltersOpen} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
              <Filter size={16} />
              Filtros
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtros rápidos">
            {QUICK_FILTERS.map((filter) => (
              <button key={filter.id} type="button" onClick={() => setQuickFilter(filter.id)} aria-pressed={quickFilter === filter.id} className={`min-h-10 rounded-xl border px-3 text-xs font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 ${quickFilter === filter.id ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"}`}>{filter.label}</button>
            ))}
          </div>

          {advancedFiltersOpen ? (
            <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <SelectFilter label="Equipe" value={teamFilter} onChange={setTeamFilter} options={[["all", "Todas as equipes"], ...teams.map((team) => [team.id, team.name] as [string, string])]} />
              <SelectFilter label="Papel" value={roleFilter} onChange={setRoleFilter} options={[["all", "Todos os papéis"], ["church_manager", "Gestor"], ["pastor", "Pastor"], ["leader", "Líder"], ["volunteer", "Voluntário"]]} />
              <SelectFilter label="Situação" value={statusFilter} onChange={setStatusFilter} options={[["all", "Todas as situações"], ...Object.entries(STATUS_LABELS)]} />
              <button type="button" onClick={clearFilters} className="min-h-11 rounded-xl px-4 text-xs font-black text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/10">Limpar</button>
            </div>
          ) : null}
        </section>

        {error ? <StatusMessage tone="warning">{error}</StatusMessage> : null}
        {isLoading ? <StatusMessage>Carregando pessoas...</StatusMessage> : null}

        <section aria-label="Lista de pessoas" className="mt-4 overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="hidden grid-cols-[1.25fr_0.5fr_0.82fr_0.82fr_0.68fr_0.72fr] gap-4 border-b border-slate-100 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-white/10 lg:grid">
            <span>Pessoa</span>
            <span>Vínculo</span>
            <span>Equipes</span>
            <span>Próxima escala</span>
            <span>Situação</span>
            <span>Ações</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {filteredPeople.map((person) => (
              <article key={person.id} className={`grid gap-4 px-4 py-4 transition hover:bg-slate-50 dark:hover:bg-white/[0.03] lg:grid-cols-[1.25fr_0.5fr_0.82fr_0.82fr_0.68fr_0.72fr] lg:items-center ${selectedPerson?.id === person.id ? "bg-emerald-50/60 ring-1 ring-inset ring-emerald-300 dark:bg-emerald-400/5" : ""}`}>
                <button type="button" onClick={() => openPerson(person.id)} className="min-w-0 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"><MemberIdentity person={person} /></button>
                <TableCell label="Vínculo"><span className={`text-xs font-bold ${person.isChurchMember ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{person.isChurchMember ? "Membro" : "Sem vínculo"}</span></TableCell>
                <TableCell label="Equipes"><TeamPills teams={person.teams} /></TableCell>
                <TableCell label="Próxima escala">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <p className="line-clamp-1">{person.nextAssignment?.title ?? "Sem escala"}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{person.nextAssignment?.startsAt ? formatDateTime(person.nextAssignment.startsAt) : "Nenhuma data futura"}</p>
                  </div>
                </TableCell>
                <TableCell label="Situação"><span className={`inline-flex min-h-7 w-fit items-center rounded-lg px-2 text-[9px] font-black uppercase tracking-wide ${STATUS_CLASSES[person.status]}`}>{STATUS_LABELS[person.status]}</span></TableCell>
                <TableCell label="Ações">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button type="button" onClick={() => openPerson(person.id)} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 px-2.5 text-[10px] font-black text-[#071735] transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-white/10 dark:text-white dark:hover:bg-white/10">Ver</button>
                    <button type="button" onClick={() => openPerson(person.id, "schedule")} className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-emerald-200 px-2.5 text-[10px] font-black text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-emerald-300/20 dark:text-emerald-300 dark:hover:bg-emerald-400/10"><CalendarDays size={13} /> Escalar</button>
                    <details className="relative">
                      <summary aria-label={`Mais ações para ${person.name}`} className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-white/10 dark:hover:bg-white/10"><MoreHorizontal size={16} /></summary>
                      <div className="absolute right-0 top-10 z-30 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#151a21]">
                        <button type="button" onClick={() => openPerson(person.id, "team")} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/10"><UserPlus size={14} /> Convidar para equipe</button>
                        <button type="button" onClick={() => openPerson(person.id)} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/10"><KeyRound size={14} /> Ver acessos</button>
                      </div>
                    </details>
                  </div>
                </TableCell>
              </article>
            ))}
          </div>
        </section>

        {!isLoading && filteredPeople.length === 0 ? (
          <section className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-white/15 dark:bg-white/[0.03]">
            <Users size={30} className="mx-auto text-slate-400" />
            <h2 className="mt-4 text-xl font-black">Nenhuma pessoa encontrada</h2>
            <p className="mt-2 text-sm text-slate-500">Ajuste a busca ou limpe os filtros aplicados.</p>
            <button type="button" onClick={clearFilters} className="mt-4 min-h-10 rounded-xl bg-emerald-700 px-4 text-xs font-black text-white">Limpar filtros</button>
          </section>
        ) : null}

        <footer className="mt-4 text-xs font-semibold text-slate-500">Mostrando {filteredPeople.length} de {people.length} pessoa(s)</footer>
      </section>

      {selectedPerson ? (
        <PersonOperationsDrawer
          person={selectedPerson}
          assignments={selectedPersonAssignments}
          authorizedTeams={authorizedTeams}
          availableTeams={availableTeams}
          mode={drawerMode}
          calendarMonth={calendarMonth}
          selectedDate={selectedDate}
          selectedDayServices={selectedDayServices}
          scheduleServiceId={scheduleServiceId}
          scheduleTeamId={scheduleTeamId}
          scheduleRole={scheduleRole}
          scheduleNotes={scheduleNotes}
          scheduleFeedback={scheduleFeedback}
          isScheduling={isScheduling}
          teamInviteId={teamInviteId}
          teamInviteFeedback={teamInviteFeedback}
          isInvitingToTeam={isInvitingToTeam}
          onClose={closePerson}
          onModeChange={setDrawerMode}
          onMonthChange={setCalendarMonth}
          onDateSelect={selectCalendarDate}
          onServiceChange={setScheduleServiceId}
          onTeamChange={setScheduleTeamId}
          onRoleChange={setScheduleRole}
          onNotesChange={setScheduleNotes}
          onCreateAssignment={() => void createCalendarAssignment()}
          onTeamInviteChange={setTeamInviteId}
          onInviteToTeam={() => void inviteToTeam()}
          onOpenTeams={() => { setSelectedId(null); onOpenTeams?.(); }}
          onOpenInvite={() => { setSelectedId(null); onOpenInvite?.(); }}
          onOpenPermissions={() => { setSelectedId(null); onOpenPermissions?.(); }}
        />
      ) : null}
    </main>
  );
}

function PersonOperationsDrawer({
  person,
  assignments,
  authorizedTeams,
  availableTeams,
  mode,
  calendarMonth,
  selectedDate,
  selectedDayServices,
  scheduleServiceId,
  scheduleTeamId,
  scheduleRole,
  scheduleNotes,
  scheduleFeedback,
  isScheduling,
  teamInviteId,
  teamInviteFeedback,
  isInvitingToTeam,
  onClose,
  onModeChange,
  onMonthChange,
  onDateSelect,
  onServiceChange,
  onTeamChange,
  onRoleChange,
  onNotesChange,
  onCreateAssignment,
  onTeamInviteChange,
  onInviteToTeam,
  onOpenTeams,
  onOpenInvite,
  onOpenPermissions,
}: {
  person: PersonRow;
  assignments: ChurchAssignment[];
  authorizedTeams: ChurchServiceTeam[];
  availableTeams: ChurchServiceTeam[];
  mode: DrawerMode;
  calendarMonth: Date;
  selectedDate: string;
  selectedDayServices: ChurchService[];
  scheduleServiceId: string;
  scheduleTeamId: string;
  scheduleRole: string;
  scheduleNotes: string;
  scheduleFeedback: string;
  isScheduling: boolean;
  teamInviteId: string;
  teamInviteFeedback: string;
  isInvitingToTeam: boolean;
  onClose: () => void;
  onModeChange: (mode: DrawerMode) => void;
  onMonthChange: (date: Date) => void;
  onDateSelect: (dateKey: string) => void;
  onServiceChange: (value: string) => void;
  onTeamChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onCreateAssignment: () => void;
  onTeamInviteChange: (value: string) => void;
  onInviteToTeam: () => void;
  onOpenTeams: () => void;
  onOpenInvite: () => void;
  onOpenPermissions: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const futureAssignments = assignments
    .filter((item) => item.startsAt && new Date(item.startsAt).getTime() >= Date.now() && ["pending", "accepted"].includes(item.status))
    .sort((a, b) => new Date(a.startsAt as string).getTime() - new Date(b.startsAt as string).getTime());

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isScheduling && !isInvitingToTeam) {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])') ?? []).filter((element) => !element.hasAttribute("disabled"));
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
  }, [isInvitingToTeam, isScheduling, onClose]);

  return (
    <div className="fixed inset-0 z-[320] bg-slate-950/35 backdrop-blur-[1px]" onMouseDown={(event) => { if (event.target === event.currentTarget && !isScheduling && !isInvitingToTeam) onClose(); }}>
      <section ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby="person-drawer-title" className={`absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden bg-[#f7f8fa] shadow-2xl transition-[max-width] dark:bg-[#0d1117] ${mode === "schedule" ? "max-w-2xl" : "max-w-lg"}`}>
        <header className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#11161d]">
          <div className="flex items-start gap-3">
            {person.photoURL ? <img src={person.photoURL} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-black text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">{getInitials(person.name)}</span>}
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Perfil operacional</p>
              <h2 id="person-drawer-title" className="mt-1 truncate text-2xl font-black">{person.name}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><span className={`h-2 w-2 rounded-full ${person.isChurchMember ? "bg-emerald-500" : "bg-rose-500"}`} />{person.isChurchMember ? "Membro ativo" : "Sem vínculo com a igreja"}</p>
            </div>
            <button ref={closeButtonRef} type="button" onClick={onClose} disabled={isScheduling || isInvitingToTeam} aria-label="Fechar perfil operacional" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"><X size={18} /></button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button type="button" onClick={() => onModeChange(mode === "schedule" ? "profile" : "schedule")} aria-pressed={mode === "schedule"} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-[10px] font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 ${mode === "schedule" ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 dark:border-emerald-300/20 dark:bg-white/5 dark:text-emerald-300"}`}><CalendarDays size={15} /> Escalar</button>
            <button type="button" onClick={() => onModeChange(mode === "team" ? "profile" : "team")} aria-pressed={mode === "team"} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-[10px] font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 ${mode === "team" ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"}`}><UserPlus size={15} /> Adicionar à equipe</button>
            <button type="button" onClick={onOpenInvite} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-black text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"><Mail size={15} /> Convidar</button>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {mode === "schedule" ? (
            <ScheduleComposer
              person={person}
              assignments={assignments}
              authorizedTeams={authorizedTeams}
              calendarMonth={calendarMonth}
              selectedDate={selectedDate}
              selectedDayServices={selectedDayServices}
              scheduleServiceId={scheduleServiceId}
              scheduleTeamId={scheduleTeamId}
              scheduleRole={scheduleRole}
              scheduleNotes={scheduleNotes}
              feedback={scheduleFeedback}
              isSaving={isScheduling}
              onMonthChange={onMonthChange}
              onDateSelect={onDateSelect}
              onServiceChange={onServiceChange}
              onTeamChange={onTeamChange}
              onRoleChange={onRoleChange}
              onNotesChange={onNotesChange}
              onCreate={onCreateAssignment}
              onAddToTeam={() => onModeChange("team")}
            />
          ) : null}

          {mode === "team" ? (
            <DrawerSection title="Convidar para uma equipe" action="Gerenciar equipes" onAction={onOpenTeams}>
              <p className="text-xs leading-5 text-slate-500">O vínculo só será criado depois que a pessoa aceitar o convite.</p>
              <div className="mt-3 grid gap-3">
                {availableTeams.length > 0 ? (
                  <>
                    <FieldSelect label="Equipe" value={teamInviteId} onChange={onTeamInviteChange} options={[["", "Selecione a equipe"], ...availableTeams.map((team) => [team.id, team.name] as [string, string])]} />
                    <button type="button" onClick={onInviteToTeam} disabled={!teamInviteId || isInvitingToTeam} aria-busy={isInvitingToTeam} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{isInvitingToTeam ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}{isInvitingToTeam ? "Enviando..." : "Enviar convite"}</button>
                  </>
                ) : (
                  <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-200">Não há outra equipe disponível no seu escopo de gestão.</p>
                )}
                {teamInviteFeedback ? <FeedbackMessage message={teamInviteFeedback} success={teamInviteFeedback.startsWith("Convite enviado")} /> : null}
              </div>
            </DrawerSection>
          ) : null}

          <DrawerSection title="Próximas escalas" action={futureAssignments.length > 3 ? "Ver agenda" : undefined} onAction={() => onModeChange("schedule")}>
            <div className="space-y-2">
              {futureAssignments.slice(0, 4).map((assignment) => (
                <div key={assignment.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-white/5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm dark:bg-white/10 dark:text-emerald-300"><CalendarDays size={16} /></span>
                  <div className="min-w-0 flex-1"><strong className="block truncate text-xs">{assignment.title}</strong><small className="mt-1 block text-[10px] text-slate-500">{assignment.startsAt ? formatDateTime(assignment.startsAt) : "Data a definir"}</small></div>
                  <AssignmentStatus status={assignment.status} />
                </div>
              ))}
              {futureAssignments.length === 0 ? <EmptyLine icon={Clock3} text="Nenhuma escala futura." action="Escalar agora" onAction={() => onModeChange("schedule")} /> : null}
            </div>
          </DrawerSection>

          <DrawerSection title="Equipes" action="Editar equipes" onAction={onOpenTeams}>
            <div className="space-y-2">
              {person.teams.map((team) => (
                <div key={team.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-white/10">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200"><UsersRound size={16} /></span>
                  <div className="min-w-0 flex-1"><strong className="block truncate text-xs">{team.name}</strong><small className="mt-1 block truncate text-[10px] text-slate-500">{team.area || "Área não informada"}</small></div>
                  <ChevronRight size={15} className="text-slate-300" />
                </div>
              ))}
              {person.teams.length === 0 ? <EmptyLine icon={Users} text="Ainda não participa de uma equipe." action="Convidar" onAction={() => onModeChange("team")} /> : null}
            </div>
          </DrawerSection>

          <DrawerSection title="Acessos" action="Gerenciar acessos" onAction={onOpenPermissions}>
            <div className="flex flex-wrap gap-2">{person.roleLabels.length > 0 ? person.roleLabels.map((role) => <RolePill key={role} label={role} />) : <RolePill label="Membro" />}</div>
            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-700" />Participar de uma equipe não concede automaticamente acesso administrativo.</p>
          </DrawerSection>

          <DrawerSection title="Contato">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"><Mail size={15} className="text-slate-400" />{person.email}</p>
          </DrawerSection>
        </div>
      </section>
    </div>
  );
}

function ScheduleComposer({ person, assignments, authorizedTeams, calendarMonth, selectedDate, selectedDayServices, scheduleServiceId, scheduleTeamId, scheduleRole, scheduleNotes, feedback, isSaving, onMonthChange, onDateSelect, onServiceChange, onTeamChange, onRoleChange, onNotesChange, onCreate, onAddToTeam }: {
  person: PersonRow;
  assignments: ChurchAssignment[];
  authorizedTeams: ChurchServiceTeam[];
  calendarMonth: Date;
  selectedDate: string;
  selectedDayServices: ChurchService[];
  scheduleServiceId: string;
  scheduleTeamId: string;
  scheduleRole: string;
  scheduleNotes: string;
  feedback: string;
  isSaving: boolean;
  onMonthChange: (date: Date) => void;
  onDateSelect: (dateKey: string) => void;
  onServiceChange: (value: string) => void;
  onTeamChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onCreate: () => void;
  onAddToTeam: () => void;
}) {
  const days = buildCalendarDays(calendarMonth);
  const assignmentsByDate = groupBy(assignments.filter((item) => item.startsAt), (item) => toDateKey(item.startsAt as string));
  const todayKey = toDateKey(new Date());
  return (
    <DrawerSection title="Agenda e nova escala">
      <div className="flex items-center justify-between gap-3">
        <div><strong className="block text-sm capitalize">{calendarMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</strong><small className="mt-1 block text-[10px] text-slate-500">Selecione um dia livre de {person.name.split(" ")[0]}.</small></div>
        <div className="flex gap-1.5"><IconAction label="Mês anterior" onClick={() => onMonthChange(addMonths(calendarMonth, -1))}><ArrowLeft size={15} /></IconAction><IconAction label="Próximo mês" onClick={() => onMonthChange(addMonths(calendarMonth, 1))}><ArrowRight size={15} /></IconAction></div>
      </div>
      <div className="mt-3 grid grid-cols-7 border-x border-t border-slate-100 text-center text-[8px] font-black uppercase text-slate-400 dark:border-white/10">{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => <span key={day} className="py-2">{day}</span>)}</div>
      <div className="grid grid-cols-7 border-l border-t border-slate-100 dark:border-white/10">
        {days.map((day) => {
          const dateKey = toDateKey(day);
          const dayAssignments = assignmentsByDate.get(dateKey) ?? [];
          const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
          const isPast = dateKey < todayKey;
          const selected = dateKey === selectedDate;
          return (
            <button key={dateKey} type="button" onClick={() => !isPast && onDateSelect(dateKey)} disabled={isPast} aria-label={`${day.toLocaleDateString("pt-BR")}${dayAssignments.length ? `, ${dayAssignments.length} escala(s)` : ", disponível"}`} className={`relative min-h-14 border-b border-r border-slate-100 p-1 text-left transition dark:border-white/10 ${selected ? "bg-emerald-50 ring-2 ring-inset ring-emerald-600 dark:bg-emerald-400/10" : isCurrentMonth ? "bg-white hover:bg-emerald-50/60 dark:bg-transparent dark:hover:bg-white/5" : "bg-slate-50 text-slate-400 dark:bg-white/[0.02]"} ${isPast ? "cursor-not-allowed opacity-45" : ""}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${dateKey === todayKey ? "bg-emerald-700 text-white" : ""}`}>{day.getDate()}</span>
              {dayAssignments.length > 0 ? <span className={`absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full ${dayAssignments.some((item) => item.status === "pending") ? "bg-amber-500" : "bg-emerald-500"}`} /> : null}
            </button>
          );
        })}
      </div>

      {selectedDate ? (
        <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
          <div><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Data selecionada</p><strong className="mt-1 block text-sm capitalize">{formatDateKey(selectedDate)}</strong></div>
          {selectedDayServices.length === 0 ? <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-200">Não existem cultos disponíveis nesta data.</p> : (
            <>
              <FieldSelect label="Culto" value={scheduleServiceId} onChange={onServiceChange} options={[["", "Selecione o culto"], ...selectedDayServices.map((service) => [service.id, `${service.title} · ${formatTime(service.startsAt)}`] as [string, string])]} />
              {authorizedTeams.length > 0 ? <FieldSelect label="Equipe" value={scheduleTeamId} onChange={onTeamChange} options={[["", "Selecione a equipe"], ...authorizedTeams.map((team) => [team.id, team.name] as [string, string])]} /> : <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-200">A pessoa precisa aceitar o convite de uma equipe que você gerencia antes de ser escalada. <button type="button" onClick={onAddToTeam} className="font-black underline">Adicionar à equipe</button></p>}
              <label><span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Função neste culto</span><input value={scheduleRole} onChange={(event) => onRoleChange(event.target.value)} placeholder="Ex.: Recepção principal" className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-[#11161d]" /></label>
              <label><span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Observação</span><textarea value={scheduleNotes} onChange={(event) => onNotesChange(event.target.value)} rows={2} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-[#11161d]" /></label>
              {feedback ? <FeedbackMessage message={feedback} success={feedback.startsWith("Escala enviada")} /> : null}
              <button type="button" onClick={onCreate} disabled={!scheduleServiceId || !scheduleTeamId || isSaving} aria-busy={isSaving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? <Loader2 size={15} className="animate-spin" /> : <BadgeCheck size={15} />}{isSaving ? "Enviando..." : "Enviar escala"}</button>
            </>
          )}
        </div>
      ) : null}
    </DrawerSection>
  );
}

function buildPeopleRows(members: UserProfile[], roles: ChurchMemberRole[], teams: ChurchServiceTeam[], assignments: ChurchAssignment[]): PersonRow[] {
  const churchMemberIds = new Set(members.map((member) => member.uid));
  const memberById = new Map(members.map((member) => [member.uid, member]));
  roles.forEach((role) => {
    if (!memberById.has(role.userId)) memberById.set(role.userId, createFallbackProfile(role));
  });

  const activeRoles = roles.filter((role) => role.status === "active");
  const rolesByUser = groupBy(activeRoles, (role) => role.userId);
  const assignmentsByUser = groupBy(assignments, (assignment) => assignment.assigneeUserId ?? "");

  return Array.from(memberById.values()).map((member) => {
    const userRoles = rolesByUser.get(member.uid) ?? [];
    const userAssignments = assignmentsByUser.get(member.uid) ?? [];
    const teamIds = new Set(userRoles.filter((role) => role.scopeType === "team" && role.scopeId).map((role) => role.scopeId as string));
    teams.filter((team) => team.leaderId === member.uid).forEach((team) => teamIds.add(team.id));
    const memberTeams = teams.filter((team) => teamIds.has(team.id) && team.status === "active");
    const roleValues = Array.from(new Set(userRoles.map((role) => role.role)));
    const pendingAssignments = userAssignments.filter((assignment) => assignment.status === "pending").length;
    const declinedAssignments = userAssignments.filter((assignment) => assignment.status === "declined").length;
    const nextAssignment = userAssignments
      .filter((assignment) => assignment.startsAt && new Date(assignment.startsAt).getTime() >= Date.now() && ["pending", "accepted"].includes(assignment.status))
      .sort((a, b) => new Date(a.startsAt as string).getTime() - new Date(b.startsAt as string).getTime())[0];
    const isChurchMember = churchMemberIds.has(member.uid);
    const status: PersonStatus = !isChurchMember ? "no_membership" : pendingAssignments > 0 ? "pending" : memberTeams.length === 0 ? "no_team" : nextAssignment ? "active" : "no_schedule";
    return {
      id: member.uid,
      name: member.displayName || member.username || `Usuário ${member.uid.slice(0, 8)}`,
      email: member.email || member.username || "Contato não informado",
      photoURL: member.photoURL,
      isChurchMember,
      roles: roleValues,
      roleLabels: roleValues.map((role) => ROLE_LABELS[role]),
      teams: memberTeams,
      nextAssignment,
      totalAssignments: userAssignments.length,
      pendingAssignments,
      declinedAssignments,
      status,
    };
  }).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function createFallbackProfile(role: ChurchMemberRole): UserProfile {
  return {
    uid: role.userId,
    displayName: role.meta?.displayName || role.meta?.name || role.meta?.email || `Usuário ${role.userId.slice(0, 8)}`,
    email: role.meta?.email || "",
    photoURL: role.meta?.photoURL ?? null,
    username: "",
    lifetimeXp: 0,
    credits: 0,
    badges: [],
    subscriptionTier: "free",
    subscriptionStatus: "inactive",
    activityLog: [],
    stats: {
      totalChaptersRead: 0,
      daysStreak: 0,
      studiesCreated: 0,
      totalDevotionalsRead: 0,
      totalNotes: 0,
      totalShares: 0,
      totalImagesGenerated: 0,
      totalChatMessages: 0,
      totalSermonsCreated: 0,
      totalVersesMarked: 0,
      totalQuizzesCompleted: 0,
      perfectQuizzes: 0,
    },
  };
}

function DrawerSection({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black">{title}</h3>{action && onAction ? <button type="button" onClick={onAction} className="min-h-9 rounded-lg px-2 text-[10px] font-black text-blue-700 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-400/10">{action}</button> : null}</div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function EmptyLine({ icon: Icon, text, action, onAction }: { icon: typeof Clock3; text: string; action: string; onAction: () => void }) {
  return <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 p-3 dark:border-white/15"><Icon size={17} className="text-slate-400" /><span className="min-w-0 flex-1 text-xs text-slate-500">{text}</span><button type="button" onClick={onAction} className="text-[10px] font-black text-emerald-700 dark:text-emerald-300">{action}</button></div>;
}

function AssignmentStatus({ status }: { status: ChurchAssignment["status"] }) {
  const label = status === "accepted" ? "Confirmada" : status === "pending" ? "Pendente" : status === "declined" ? "Recusada" : "Inativa";
  const classes = status === "accepted" ? "bg-emerald-100 text-emerald-800" : status === "declined" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800";
  return <span className={`shrink-0 rounded-lg px-2 py-1 text-[8px] font-black uppercase ${classes}`}>{label}</span>;
}

function FeedbackMessage({ message, success }: { message: string; success: boolean }) {
  return <p role="status" className={`rounded-xl p-3 text-xs font-semibold leading-5 ${success ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200" : "bg-rose-50 text-rose-800 dark:bg-rose-400/10 dark:text-rose-200"}`}>{message}</p>;
}

function TableCell({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0"><span className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400 lg:hidden">{label}</span>{children}</div>;
}

function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <label><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#071735] outline-none transition focus:border-emerald-600 dark:border-white/10 dark:bg-[#11161d] dark:text-white">{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}

function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <label><span className="text-[9px] font-black uppercase tracking-wider text-slate-500">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-[#11161d]">{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}

function MemberIdentity({ person }: { person: PersonRow }) {
  return <div className="flex min-w-0 items-center gap-3">{person.photoURL ? <img src={person.photoURL} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" /> : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-black text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">{getInitials(person.name)}</span>}<div className="min-w-0"><p className="truncate text-sm font-black">{person.name}</p><p className="mt-1 truncate text-[10px] font-semibold text-slate-500">{person.email}</p></div></div>;
}

function TeamPills({ teams }: { teams: ChurchServiceTeam[] }) {
  if (teams.length === 0) return <span className="text-xs font-semibold text-slate-400">Nenhuma</span>;
  return <div className="flex flex-wrap gap-1.5">{teams.slice(0, 2).map((team) => <span key={team.id} className="rounded-lg bg-violet-50 px-2 py-1 text-[9px] font-black text-violet-700 dark:bg-violet-400/10 dark:text-violet-200">{team.name}</span>)}{teams.length > 2 ? <span className="rounded-lg border border-slate-200 px-2 py-1 text-[9px] font-black text-slate-500 dark:border-white/10">+{teams.length - 2}</span> : null}</div>;
}

function RolePill({ label }: { label: string }) {
  return <span className="rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-black uppercase text-blue-700 dark:bg-blue-400/10 dark:text-blue-200">{label}</span>;
}

function IconAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-white/10 dark:hover:bg-white/10">{children}</button>;
}

function StatusMessage({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warning" }) {
  const classes = tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100" : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300";
  return <section className={`mt-4 rounded-2xl border p-4 text-sm font-semibold ${classes}`}>{children}</section>;
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T[]>();
  items.forEach((item) => {
    const key = getKey(item);
    if (!key) return;
    const group = map.get(key) ?? [];
    group.push(item);
    map.set(key, group);
  });
  return map;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getInitials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "M";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildCalendarDays(month: Date) {
  const first = startOfMonth(month);
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}

function toDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
