"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Crown,
  Edit3,
  History,
  MailPlus,
  Plus,
  QrCode,
  Save,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  churchManagementService,
  type ChurchCultoOperationalItem,
  type ChurchTeamParticipant,
} from "../../services/churchManagementService";
import type { ChurchAssignment, ChurchMemberRole, ChurchOperationalRole, ChurchServiceTeam } from "../../types";
import type { ChurchTeamFunction } from "../../types";

type TeamTab = "overview" | "members" | "functions" | "invites" | "history";

const TABS: Array<{ value: TeamTab; label: string }> = [
  { value: "overview", label: "Visao geral" },
  { value: "members", label: "Membros" },
  { value: "functions", label: "Funcoes e vagas" },
  { value: "invites", label: "Convites" },
  { value: "history", label: "Historico" },
];

const ROLE_LABELS: Record<ChurchOperationalRole | "team_leader", string> = {
  church_manager: "Gestor",
  pastor: "Pastor",
  leader: "Lider",
  volunteer: "Voluntario",
  team_leader: "Lider da equipe",
};

export default function ChurchTeamDetailDashboard() {
  const params = useParams<{ id: string }>();
  const teamId = params.id;
  const { currentUser, userProfile } = useAuth();
  const activeChurchId = userProfile?.churchData?.churchId ?? null;
  const currentUserId = currentUser?.id ?? currentUser?.uid ?? userProfile?.uid ?? null;

  const [team, setTeam] = useState<ChurchServiceTeam | null>(null);
  const [participants, setParticipants] = useState<ChurchTeamParticipant[]>([]);
  const [roles, setRoles] = useState<ChurchMemberRole[]>([]);
  const [teamFunctions, setTeamFunctions] = useState<ChurchTeamFunction[]>([]);
  const [assignments, setAssignments] = useState<ChurchAssignment[]>([]);
  const [cultos, setCultos] = useState<ChurchCultoOperationalItem[]>([]);
  const [tab, setTab] = useState<TeamTab>("overview");
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<ChurchOperationalRole>("volunteer");
  const [functionName, setFunctionName] = useState("");
  const [functionCount, setFunctionCount] = useState("1");
  const [leaderId, setLeaderId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!activeChurchId || !teamId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [nextTeam, nextParticipants, nextRoles, nextFunctions, nextAssignments, nextCultos] = await Promise.all([
        churchManagementService.getTeam(teamId),
        churchManagementService.listTeamParticipants(activeChurchId, teamId),
        churchManagementService.listRoles(activeChurchId, { limit: 300 }),
        churchManagementService.listTeamFunctions(activeChurchId, teamId),
        churchManagementService.listAssignments(activeChurchId, { teamId, limit: 200 }),
        churchManagementService.getCultoOperationalItems(activeChurchId, 30),
      ]);
      setTeam(nextTeam);
      setParticipants(nextParticipants);
      setRoles(nextRoles);
      setTeamFunctions(nextFunctions);
      setAssignments(nextAssignments);
      setCultos(nextCultos);
      setLeaderId(nextTeam?.leaderId ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar a equipe.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [activeChurchId, teamId]);

  const teamRoles = useMemo(
    () => roles.filter((role) => role.status === "active" && role.scopeType === "team" && role.scopeId === teamId),
    [roles, teamId],
  );

  const teamCultos = useMemo(
    () => cultos.filter((item) => item.assignments.some((assignment) => assignment.teamId === teamId) || item.schedules.some((schedule) => normalize(schedule.ministryName) === normalize(team?.name ?? ""))),
    [cultos, team?.name, teamId],
  );

  const teamDescription = useMemo(() => parseTeamDescription(team?.description ?? ""), [team?.description]);
  const expectedFunctions = useMemo(
    () => teamFunctions.length > 0
      ? teamFunctions.filter((item) => item.status === "active").map((item) => ({ name: item.name, quantity: item.requiredCount }))
      : teamDescription.functions,
    [teamDescription.functions, teamFunctions],
  );

  const stats = useMemo(() => {
    const capacity = team?.capacity ?? 0;
    const leaders = participants.filter((participant) => participant.role === "team_leader" || participant.role === "leader").length;
    const openSpots = Math.max(capacity - participants.length, 0);
    const pendingAssignments = assignments.filter((assignment) => assignment.status === "pending").length;
    return { capacity, leaders, openSpots, pendingAssignments };
  }, [assignments, participants, team?.capacity]);

  const addMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeChurchId || !newMemberId.trim()) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      await churchManagementService.grantRole({
        churchId: activeChurchId,
        userId: newMemberId.trim(),
        role: newMemberRole,
        scopeType: "team",
        scopeId: teamId,
        grantedBy: currentUserId,
      });
      setNewMemberId("");
      setFeedback("Membro vinculado a equipe.");
      await load();
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : "Nao foi possivel adicionar o membro.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveLeader = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!team || !leaderId.trim()) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      await churchManagementService.updateTeam(team.id, { leaderId: leaderId.trim() });
      if (activeChurchId) {
        await churchManagementService.grantRole({
          churchId: activeChurchId,
          userId: leaderId.trim(),
          role: "leader",
          scopeType: "team",
          scopeId: team.id,
          grantedBy: currentUserId,
        });
      }
      setFeedback("Lider atualizado.");
      await load();
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : "Nao foi possivel atualizar o lider.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveFunction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeChurchId || !team || !functionName.trim()) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      await churchManagementService.upsertTeamFunction({
        churchId: activeChurchId,
        teamId: team.id,
        name: functionName.trim(),
        requiredCount: Number(functionCount) || 1,
        createdBy: currentUserId,
      });
      setFunctionName("");
      setFunctionCount("1");
      setFeedback("Funcao esperada salva.");
      await load();
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : "Nao foi possivel salvar a funcao.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <main className="min-h-screen bg-[#f8fafc] p-8 text-sm font-semibold text-slate-600">Carregando equipe...</main>;
  }

  if (error || !team) {
    return (
      <main className="min-h-screen bg-[#f8fafc] p-8 text-[#071735]">
        <Link href="/gestao-igreja/equipes" className="text-sm font-black text-[#061b49]">Voltar para Equipes</Link>
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-black">Equipe nao encontrada</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">{error || "Nao encontramos esta equipe na igreja ativa."}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#071735]">
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <Link href="/gestao-igreja/equipes" className="inline-flex items-center gap-2 text-sm font-black text-[#061b49]">
            <ArrowLeft size={16} />
            Voltar para Equipes
          </Link>

          <header className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Equipe operacional</p>
              <h1 className="mt-3 text-4xl font-black tracking-normal">{team.name}</h1>
              <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">{teamDescription.description || "Equipe operacional da igreja."}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill label={team.status === "active" ? "Ativa" : team.status} tone={team.status === "active" ? "success" : "muted"} />
                <StatusPill label={team.area || "Sem area"} tone="info" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/gestao-igreja/equipes/${team.id}/editar`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black shadow-sm transition hover:bg-slate-50">
                <Edit3 size={16} />
                Editar equipe
              </Link>
              <Link href={`/gestao-igreja/qrcodes/novo?type=volunteer&teamId=${encodeURIComponent(team.id)}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#061b49] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#0b2b6c]">
                <QrCode size={16} />
                QR voluntariado
              </Link>
            </div>
          </header>

          <section className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Metric icon={Users} label="Membros" value={participants.length} helper={`Capacidade ${stats.capacity || "livre"}`} />
            <Metric icon={Crown} label="Lideres" value={stats.leaders} helper={team.leaderId ? "Principal definido" : "A definir"} />
            <Metric icon={ClipboardList} label="Vagas abertas" value={stats.openSpots} helper="Estrutura permanente" />
            <Metric icon={CalendarDays} label="Cultos" value={teamCultos.length} helper="Escalas recentes" />
          </section>

          {feedback ? <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm">{feedback}</section> : null}

          <section className="mt-5">
            <div className="flex gap-4 overflow-x-auto border-b border-slate-200">
              {TABS.map((nextTab) => (
                <button
                  key={nextTab.value}
                  type="button"
                  onClick={() => setTab(nextTab.value)}
                  className={`min-h-11 whitespace-nowrap border-b-2 px-1 text-sm font-black transition ${tab === nextTab.value ? "border-[#061b49] text-[#061b49]" : "border-transparent text-slate-500 hover:text-[#061b49]"}`}
                >
                  {nextTab.label}
                </button>
              ))}
            </div>
            <div className="mt-4">{renderTab(tab, team, expectedFunctions, participants, teamRoles, assignments, teamCultos)}</div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black">Adicionar membro</h2>
            <form onSubmit={addMember} className="mt-4 grid gap-3">
              <label className="grid gap-2 text-xs font-black uppercase text-slate-500">
                ID do usuario
                <input value={newMemberId} onChange={(event) => setNewMemberId(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold normal-case text-[#071735] outline-none focus:border-[#061b49]" placeholder="uuid do usuario" />
              </label>
              <label className="grid gap-2 text-xs font-black uppercase text-slate-500">
                Papel no time
                <select value={newMemberRole} onChange={(event) => setNewMemberRole(event.target.value as ChurchOperationalRole)} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold normal-case text-[#071735] outline-none focus:border-[#061b49]">
                  <option value="volunteer">Voluntario</option>
                  <option value="leader">Lider auxiliar</option>
                </select>
              </label>
              <button type="submit" disabled={isSaving || !newMemberId.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#061b49] text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                <UserPlus size={16} />
                Adicionar
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black">Lider principal</h2>
            <form onSubmit={saveLeader} className="mt-4 grid gap-3">
              <label className="grid gap-2 text-xs font-black uppercase text-slate-500">
                ID do lider
                <input value={leaderId} onChange={(event) => setLeaderId(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold normal-case text-[#071735] outline-none focus:border-[#061b49]" placeholder="uuid do lider" />
              </label>
              <button type="submit" disabled={isSaving || !leaderId.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-black text-[#061b49] disabled:cursor-not-allowed disabled:opacity-60">
                <Save size={16} />
                Salvar lider
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black">Funcao esperada</h2>
            <form onSubmit={saveFunction} className="mt-4 grid gap-3">
              <label className="grid gap-2 text-xs font-black uppercase text-slate-500">
                Nome da funcao
                <input value={functionName} onChange={(event) => setFunctionName(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold normal-case text-[#071735] outline-none focus:border-[#061b49]" placeholder="Ex.: Vocal" />
              </label>
              <label className="grid gap-2 text-xs font-black uppercase text-slate-500">
                Quantidade
                <input type="number" min="0" value={functionCount} onChange={(event) => setFunctionCount(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold normal-case text-[#071735] outline-none focus:border-[#061b49]" />
              </label>
              <button type="submit" disabled={isSaving || !functionName.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-black text-[#061b49] disabled:cursor-not-allowed disabled:opacity-60">
                <Save size={16} />
                Salvar funcao
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black">Resumo</h2>
            <Summary label="Area" value={team.area || "Nao informada"} />
            <Summary label="Capacidade" value={stats.capacity || "Livre"} />
            <Summary label="Vagas" value={stats.openSpots} />
            <Summary label="Pendencias" value={stats.pendingAssignments} />
          </section>
        </aside>
      </section>
    </main>
  );
}

function renderTab(
  tab: TeamTab,
  team: ChurchServiceTeam,
  expectedFunctions: Array<{ name: string; quantity?: number | null }>,
  participants: ChurchTeamParticipant[],
  roles: ChurchMemberRole[],
  assignments: ChurchAssignment[],
  cultos: ChurchCultoOperationalItem[],
) {
  if (tab === "overview") {
    return (
      <section className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="Dados gerais" icon={ShieldCheck}>
          <Summary label="Nome" value={team.name} />
          <Summary label="Area" value={team.area || "Nao informada"} />
          <Summary label="Status" value={team.status} />
          <Summary label="Criada em" value={formatDate(team.createdAt)} />
        </InfoCard>
        <InfoCard title="Operacao" icon={ClipboardList}>
          <Summary label="Participantes" value={participants.length} />
          <Summary label="Roles de time" value={roles.length} />
          <Summary label="Designacoes" value={assignments.length} />
          <Summary label="Cultos vinculados" value={cultos.length} />
        </InfoCard>
      </section>
    );
  }

  if (tab === "members") {
    return (
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="divide-y divide-slate-100">
          {participants.map((participant) => (
            <div key={participant.userId} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_180px_120px] md:items-center">
              <div className="flex min-w-0 items-center gap-3">
                {participant.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={participant.photoURL} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-[#061b49]">{getInitials(participant.displayName)}</span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{participant.displayName}</p>
                  <p className="truncate text-xs font-semibold text-slate-500">{participant.userId}</p>
                </div>
              </div>
              <StatusPill label={ROLE_LABELS[participant.role ?? "volunteer"] ?? "Voluntario"} tone={participant.role === "team_leader" || participant.role === "leader" ? "info" : "muted"} />
              <Link href={`/gestao-igreja/pessoas/${participant.userId}`} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 text-xs font-black text-[#061b49]">Ver perfil</Link>
            </div>
          ))}
        </div>
        {participants.length === 0 ? <EmptyState text="Nenhum membro vinculado a esta equipe." /> : null}
      </section>
    );
  }

  if (tab === "functions") {
    const roleCounts = countBy(participants.map((participant) => ROLE_LABELS[participant.role ?? "volunteer"] ?? "Voluntario"));
    return (
      <section className="grid gap-3">
        {expectedFunctions.map((item) => (
          <article key={item.name} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black">{item.name}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Necessidade permanente cadastrada na equipe.</p>
              </div>
              <strong className="text-2xl">{item.quantity ?? "-"}</strong>
            </div>
          </article>
        ))}
        {Array.from(roleCounts.entries()).map(([role, count]) => (
          <article key={role} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black">{role}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Funcao inferida pelos papeis atuais da equipe.</p>
              </div>
              <strong className="text-2xl">{count}</strong>
            </div>
          </article>
        ))}
        {roleCounts.size === 0 && expectedFunctions.length === 0 ? <EmptyState text="As funcoes serao exibidas quando houver membros ou funcoes esperadas cadastradas." /> : null}
      </section>
    );
  }

  if (tab === "invites") {
    return (
      <section className="grid gap-3">
        {assignments.map((assignment) => (
          <article key={assignment.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-base font-black">{assignment.title}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{assignment.description}</p>
              </div>
              <StatusPill label={assignment.status} tone={assignment.status === "pending" ? "warning" : "muted"} />
            </div>
          </article>
        ))}
        {assignments.length === 0 ? <EmptyState text="Nenhum convite ou designacao encontrado para esta equipe." /> : null}
      </section>
    );
  }

  return (
    <section className="grid gap-3">
      {cultos.map((item) => (
        <article key={item.service.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-base font-black">{item.service.title}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">{formatDate(item.service.startsAt)} - {item.schedulesCount} participante(s)</p>
            </div>
            <Link href={`/gestao-igreja/cultos/${item.service.id}`} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-black text-[#061b49]">Ver culto</Link>
          </div>
        </article>
      ))}
      {cultos.length === 0 ? <EmptyState text="Historico de cultos da equipe ainda nao encontrado." /> : null}
    </section>
  );
}

function Metric({ icon: Icon, label, value, helper }: { icon: typeof Users; label: string; value: number; helper: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#061b49]"><Icon size={22} /></div>
        <div>
          <p className="text-xs font-black text-slate-600">{label}</p>
          <p className="mt-1 text-3xl font-black">{value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
        </div>
      </div>
    </article>
  );
}

function InfoCard({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <Icon size={19} className="text-[#061b49]" />
        <h2 className="text-base font-black">{title}</h2>
      </div>
      {children}
    </article>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <strong className="text-right text-[#071735]">{value}</strong>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "success" | "info" | "warning" | "muted" }) {
  const classes = tone === "success" ? "bg-emerald-50 text-emerald-700" : tone === "info" ? "bg-blue-50 text-blue-700" : tone === "warning" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex w-fit min-h-7 items-center rounded-md px-2 text-[10px] font-black uppercase ${classes}`}>{label}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm font-semibold text-slate-500">{text}</div>;
}

function countBy(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return counts;
}

function normalize(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getInitials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "M";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function parseTeamDescription(description: string) {
  const marker = "Funcoes esperadas:";
  const index = description.indexOf(marker);
  const cleanDescription = index >= 0 ? description.slice(0, index).trim() : description.trim();
  const functionsText = index >= 0 ? description.slice(index + marker.length).trim() : "";
  const functions = functionsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const quantityMatch = line.match(/(\d+)/);
      return {
        name: line.replace(/\s*[-:]\s*\d+.*$/i, "").trim() || line,
        quantity: quantityMatch ? Number(quantityMatch[1]) : null,
      };
    });
  return { description: cleanDescription, functions };
}
