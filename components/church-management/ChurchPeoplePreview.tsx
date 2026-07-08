"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Crown,
  Eye,
  Filter,
  KeyRound,
  Mail,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { churchManagementService } from "../../services/churchManagementService";
import { dbService } from "../../services/supabase";
import type { ChurchAssignment, ChurchMemberRole, ChurchOperationalRole, ChurchServiceTeam, UserProfile } from "../../types";

type PersonStatus = "available" | "pending" | "conflict";

type PersonRow = {
  id: string;
  name: string;
  email: string;
  photoURL?: string | null;
  roles: ChurchOperationalRole[];
  roleLabels: string[];
  teams: ChurchServiceTeam[];
  nextAssignment?: ChurchAssignment;
  totalAssignments: number;
  pendingAssignments: number;
  declinedAssignments: number;
  status: PersonStatus;
};

const ROLE_LABELS: Record<ChurchOperationalRole, string> = {
  church_manager: "Gestor",
  pastor: "Pastor",
  leader: "Lider",
  volunteer: "Voluntaria",
};

const STATUS_LABELS: Record<PersonStatus, string> = {
  available: "Disponivel",
  pending: "Pendente",
  conflict: "Conflito",
};

const STATUS_CLASSES: Record<PersonStatus, string> = {
  available: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  conflict: "bg-orange-50 text-orange-700",
};

export default function ChurchPeoplePreview() {
  const { userProfile } = useAuth();
  const activeChurchId = userProfile?.churchData?.churchId;
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<ChurchMemberRole[]>([]);
  const [teams, setTeams] = useState<ChurchServiceTeam[]>([]);
  const [assignments, setAssignments] = useState<ChurchAssignment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      churchManagementService.listRoles(activeChurchId, { limit: 300 }),
      churchManagementService.listTeams(activeChurchId, { limit: 100 }),
      churchManagementService.listAssignments(activeChurchId, { limit: 300 }),
    ])
      .then(([nextMembers, nextRoles, nextTeams, nextAssignments]) => {
        if (!isMounted) return;
        setMembers(nextMembers);
        setRoles(nextRoles);
        setTeams(nextTeams);
        setAssignments(nextAssignments);
      })
      .catch((loadError) => {
        if (!isMounted) return;
        setMembers([]);
        setRoles([]);
        setTeams([]);
        setAssignments([]);
        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar o diretorio.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeChurchId]);

  const people = useMemo(() => buildPeopleRows(members, roles, teams, assignments), [assignments, members, roles, teams]);
  const selectedPerson = useMemo(() => people.find((person) => person.id === selectedId) ?? people[0] ?? null, [people, selectedId]);

  useEffect(() => {
    if (!selectedId && people[0]) setSelectedId(people[0].id);
  }, [people, selectedId]);

  const filteredPeople = useMemo(() => {
    const term = search.trim().toLowerCase();
    return people.filter((person) => {
      const matchesSearch = !term || [
        person.name,
        person.email,
        person.roleLabels.join(" "),
        person.teams.map((team) => team.name).join(" "),
      ].join(" ").toLowerCase().includes(term);
      const matchesTeam = teamFilter === "all" || person.teams.some((team) => team.id === teamFilter);
      const matchesRole = roleFilter === "all" || person.roles.includes(roleFilter as ChurchOperationalRole);
      const matchesStatus = statusFilter === "all" || person.status === statusFilter;
      return matchesSearch && matchesTeam && matchesRole && matchesStatus;
    });
  }, [people, roleFilter, search, statusFilter, teamFilter]);

  const metrics = useMemo(() => {
    const inTeams = people.filter((person) => person.teams.length > 0).length;
    const leaders = people.filter((person) => person.roles.includes("leader") || person.teams.some((team) => team.leaderId === person.id)).length;
    const pending = people.reduce((sum, person) => sum + person.pendingAssignments, 0);
    return [
      { label: "Membros", value: people.length, detail: "Ativos", icon: Users },
      { label: "Em equipes", value: inTeams, detail: people.length ? `${Math.round((inTeams / people.length) * 100)}% do total` : "0% do total", icon: Users },
      { label: "Lideres", value: leaders, detail: people.length ? `${Math.round((leaders / people.length) * 100)}% do total` : "0% do total", icon: Crown },
      { label: "Pendentes de aceite", value: pending, detail: "Escalas aguardando", icon: CalendarDays },
    ];
  }, [people]);

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#071735]">
      <section className="bg-[#08142d] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_680px] xl:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-300">Gestao e papeis</p>
            <h1 className="mt-4 text-4xl font-black tracking-normal">Diretorio de membros</h1>
            <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-300">
              Veja membros da igreja, equipes em que atuam, papeis operacionais e historico de participacao.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <article key={metric.label} className="rounded-lg border border-white/10 bg-white/8 p-5">
                  <Icon size={22} className="text-[#d8b15f]" />
                  <p className="mt-4 text-sm font-black">{metric.label}</p>
                  <p className="mt-2 text-3xl font-black">{metric.value}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-300">{metric.detail}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-5 md:px-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_150px_150px_220px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar membro por nome, equipe ou papel..."
                  className="min-h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-[#061b49]"
                />
              </label>
              <SelectFilter label="Equipe" value={teamFilter} onChange={setTeamFilter} options={[["all", "Equipe"], ...teams.map((team) => [team.id, team.name] as [string, string])]} />
              <SelectFilter label="Papel" value={roleFilter} onChange={setRoleFilter} options={[["all", "Papel"], ["church_manager", "Gestor"], ["pastor", "Pastor"], ["leader", "Lider"], ["volunteer", "Voluntario"]]} />
              <SelectFilter label="Status" value={statusFilter} onChange={setStatusFilter} options={[["all", "Status"], ["available", "Disponivel"], ["pending", "Pendente"], ["conflict", "Conflito"]]} />
              <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#f5eddf] px-4 text-sm font-black text-[#7a5421]">
                <Filter size={16} />
                Somente membros da igreja
              </button>
            </div>
          </section>

          {error ? <StatusMessage tone="warning">{error}</StatusMessage> : null}
          {isLoading ? <StatusMessage>Carregando diretorio de membros...</StatusMessage> : null}

          <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[1.25fr_0.62fr_0.88fr_0.8fr_0.65fr_0.62fr_0.5fr] gap-4 border-b border-slate-100 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 lg:grid">
              <span>Membro</span>
              <span>Papel</span>
              <span>Equipes</span>
              <span>Proxima escala</span>
              <span>Participacao</span>
              <span>Status</span>
              <span>Acoes</span>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredPeople.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => setSelectedId(person.id)}
                  className={`grid w-full gap-4 px-4 py-4 text-left transition hover:bg-slate-50 lg:grid-cols-[1.25fr_0.62fr_0.88fr_0.8fr_0.65fr_0.62fr_0.5fr] lg:items-center ${selectedPerson?.id === person.id ? "bg-amber-50/40 ring-1 ring-inset ring-[#d8b15f]" : ""}`}
                >
                  <MemberIdentity person={person} />
                  <div className="flex flex-wrap gap-2">
                    {person.roleLabels.slice(0, 2).map((role) => <RolePill key={role} label={role} />)}
                    {person.roleLabels.length === 0 ? <RolePill label="Membro" /> : null}
                  </div>
                  <TeamPills teams={person.teams} />
                  <div className="text-sm font-semibold text-slate-600">
                    <p>{person.nextAssignment?.title ?? "Sem escala"}</p>
                    <p className="mt-1 text-xs text-slate-500">{person.nextAssignment?.startsAt ? formatDateTime(person.nextAssignment.startsAt) : "Data a definir"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold text-slate-500">
                    <span><strong className="block text-base text-[#071735]">{person.totalAssignments}</strong> eventos</span>
                    <span><strong className="block text-base text-[#071735]">{person.declinedAssignments}</strong> faltas</span>
                  </div>
                  <span className={`inline-flex w-fit min-h-7 items-center rounded-md px-2 text-[10px] font-black uppercase ${STATUS_CLASSES[person.status]}`}>{STATUS_LABELS[person.status]}</span>
                  <div className="flex gap-1">
                    <IconButton label="Ver membro"><Eye size={15} /></IconButton>
                    <IconButton label="Editar papel"><UserPlus size={15} /></IconButton>
                    <IconButton label="Mais acoes"><MoreVertical size={15} /></IconButton>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {!isLoading && filteredPeople.length === 0 ? (
            <section className="mt-5 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <Users className="mx-auto text-slate-400" size={30} />
              <h2 className="mt-4 text-xl font-black">Nenhum membro encontrado</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">Ajuste os filtros ou vincule membros a igreja.</p>
            </section>
          ) : null}

          <footer className="mt-5 text-sm font-semibold text-slate-500">Mostrando {filteredPeople.length} de {people.length} membro(s)</footer>
        </div>

        <MemberSidePanel person={selectedPerson} />
      </section>
    </main>
  );
}

function buildPeopleRows(
  members: UserProfile[],
  roles: ChurchMemberRole[],
  teams: ChurchServiceTeam[],
  assignments: ChurchAssignment[],
): PersonRow[] {
  const memberById = new Map(members.map((member) => [member.uid, member]));
  roles.forEach((role) => {
    if (!memberById.has(role.userId)) {
      memberById.set(role.userId, {
        uid: role.userId,
        displayName: role.meta?.displayName || role.meta?.name || role.meta?.email || `Usuario ${role.userId.slice(0, 8)}`,
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
      });
    }
  });

  const activeRoles = roles.filter((role) => role.status === "active");
  const rolesByUser = groupBy(activeRoles, (role) => role.userId);
  const assignmentsByUser = groupBy(assignments, (assignment) => assignment.assigneeUserId ?? "");

  return Array.from(memberById.values())
    .map((member) => {
      const userRoles = rolesByUser.get(member.uid) ?? [];
      const userAssignments = assignmentsByUser.get(member.uid) ?? [];
      const teamIds = new Set(userRoles.filter((role) => role.scopeType === "team" && role.scopeId).map((role) => role.scopeId as string));
      teams.filter((team) => team.leaderId === member.uid).forEach((team) => teamIds.add(team.id));
      const memberTeams = teams.filter((team) => teamIds.has(team.id));
      const roleValues = Array.from(new Set(userRoles.map((role) => role.role)));
      const pendingAssignments = userAssignments.filter((assignment) => assignment.status === "pending").length;
      const declinedAssignments = userAssignments.filter((assignment) => assignment.status === "declined").length;
      const nextAssignment = userAssignments
        .filter((assignment) => assignment.startsAt)
        .sort((a, b) => new Date(a.startsAt ?? 0).getTime() - new Date(b.startsAt ?? 0).getTime())[0];
      return {
        id: member.uid,
        name: member.displayName || member.username || `Usuario ${member.uid.slice(0, 8)}`,
        email: member.email || member.username || "sem email",
        photoURL: member.photoURL,
        roles: roleValues,
        roleLabels: roleValues.map((role) => ROLE_LABELS[role]),
        teams: memberTeams,
        nextAssignment,
        totalAssignments: userAssignments.length,
        pendingAssignments,
        declinedAssignments,
        status: declinedAssignments > 0 ? "conflict" : pendingAssignments > 0 ? "pending" : "available",
      } satisfies PersonRow;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
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

function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="sr-only">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="not-sr-only min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-[#071735] outline-none transition focus:border-[#061b49]">
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function MemberIdentity({ person }: { person: PersonRow }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {person.photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.photoURL} alt="" className="h-11 w-11 rounded-full object-cover" />
      ) : (
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-[#061b49]">{getInitials(person.name)}</span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-[#071735]">{person.name}</p>
        <p className="mt-1 truncate text-xs font-semibold text-slate-500">{person.email}</p>
      </div>
    </div>
  );
}

function TeamPills({ teams }: { teams: ChurchServiceTeam[] }) {
  if (teams.length === 0) return <span className="text-xs font-semibold text-slate-500">Sem equipe</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {teams.slice(0, 2).map((team) => <span key={team.id} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">{team.name}</span>)}
      {teams.length > 2 ? <span className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-black text-slate-500">+{teams.length - 2}</span> : null}
    </div>
  );
}

function MemberSidePanel({ person }: { person: PersonRow | null }) {
  if (!person) {
    return (
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black">Selecione um membro</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">O perfil operacional aparece aqui.</p>
      </aside>
    );
  }

  return (
    <aside className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          {person.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.photoURL} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-[#061b49]">{getInitials(person.name)}</span>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black">{person.name}</h2>
            <p className="mt-1 truncate text-xs font-semibold text-slate-500">{person.email}</p>
            <p className="mt-2 text-xs font-black text-emerald-600">{STATUS_LABELS[person.status]}</p>
          </div>
          <MoreVertical className="ml-auto text-slate-400" size={18} />
        </div>
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs font-semibold leading-5 text-blue-800">
          Toda escala exige aceite do membro e pode ser recusada ou entrar em conflito com outro compromisso.
        </div>
      </section>

      <PanelBlock title="Papeis e permissoes">
        <div className="flex flex-wrap gap-2">
          {person.roleLabels.length > 0 ? person.roleLabels.map((role) => <RolePill key={role} label={role} />) : <RolePill label="Membro" />}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-600">
          <span>Operacao: {person.roles.some((role) => role === "church_manager" || role === "leader") ? "Sim" : "Nao"}</span>
          <span>Cuidado sensivel: {person.roles.includes("pastor") ? "Sim" : "Nao"}</span>
        </div>
      </PanelBlock>

      <PanelBlock title="Equipes vinculadas">
        <div className="space-y-3">
          {person.teams.slice(0, 4).map((team) => (
            <div key={team.id} className="flex items-center justify-between gap-3 text-sm font-semibold">
              <span>{team.name}</span>
              <span className="text-xs text-slate-500">{team.area}</span>
            </div>
          ))}
          {person.teams.length === 0 ? <p className="text-sm font-semibold text-slate-500">Nenhuma equipe vinculada.</p> : null}
        </div>
      </PanelBlock>

      <PanelBlock title="Proximas escalas">
        <div className="space-y-3 text-sm font-semibold">
          {person.nextAssignment ? (
            <div className="flex items-center justify-between gap-3">
              <span>{person.nextAssignment.title}</span>
              <span className="text-xs text-slate-500">{person.nextAssignment.startsAt ? formatDateTime(person.nextAssignment.startsAt) : "A definir"}</span>
            </div>
          ) : <p className="text-sm font-semibold text-slate-500">Sem proxima escala.</p>}
        </div>
      </PanelBlock>

      <PanelBlock title="Log de participacao">
        <SummaryLine label="Participacoes" value={person.totalAssignments} />
        <SummaryLine label="Pendentes" value={person.pendingAssignments} />
        <SummaryLine label="Faltas/recusas" value={person.declinedAssignments} />
      </PanelBlock>

      <div className="grid gap-2">
        <Link href={`/gestao-igreja/pessoas/${person.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-black text-[#061b49]">
          <KeyRound size={16} />
          Editar papel
        </Link>
        <Link href="/gestao-igreja/cultos" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#061b49] text-sm font-black text-white">
          <CalendarDays size={16} />
          Escalar para culto/evento
        </Link>
      </div>
    </aside>
  );
}

function PanelBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm font-semibold">
      <span className="text-slate-500">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RolePill({ label }: { label: string }) {
  return <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-700">{label}</span>;
}

function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span aria-label={label} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#071735]">
      {children}
    </span>
  );
}

function StatusMessage({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warning" }) {
  const classes = tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-600";
  return <section className={`mt-4 rounded-lg border p-4 text-sm font-semibold ${classes}`}>{children}</section>;
}

function getInitials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "M";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
