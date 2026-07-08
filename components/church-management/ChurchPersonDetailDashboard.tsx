"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, Crown, History, KeyRound, Mail, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { churchManagementService } from "../../services/churchManagementService";
import { dbService } from "../../services/supabase";
import type { ChurchAssignment, ChurchMemberRole, ChurchOperationalRole, ChurchParticipationLog, ChurchServiceTeam, UserProfile } from "../../types";

const ROLE_LABELS: Record<ChurchOperationalRole, string> = {
  church_manager: "Gestor",
  pastor: "Pastor",
  leader: "Lider",
  volunteer: "Voluntario",
};

export default function ChurchPersonDetailDashboard() {
  const params = useParams<{ id: string }>();
  const personId = params.id;
  const { userProfile } = useAuth();
  const activeChurchId = userProfile?.churchData?.churchId ?? null;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<ChurchMemberRole[]>([]);
  const [teams, setTeams] = useState<ChurchServiceTeam[]>([]);
  const [assignments, setAssignments] = useState<ChurchAssignment[]>([]);
  const [participationLogs, setParticipationLogs] = useState<ChurchParticipationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeChurchId || !personId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    Promise.all([
      dbService.getUserProfile(personId),
      churchManagementService.listRoles(activeChurchId, { limit: 300 }),
      churchManagementService.listTeams(activeChurchId, { limit: 120 }),
      churchManagementService.listAssignments(activeChurchId, { assigneeUserId: personId, limit: 200 }),
      churchManagementService.listParticipationLogs(activeChurchId, { userId: personId }),
    ])
      .then(([nextProfile, nextRoles, nextTeams, nextAssignments, nextParticipationLogs]) => {
        if (!isMounted) return;
        setProfile(nextProfile);
        setRoles(nextRoles.filter((role) => role.userId === personId));
        setTeams(nextTeams);
        setAssignments(nextAssignments);
        setParticipationLogs(nextParticipationLogs);
      })
      .catch((loadError) => {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar a pessoa.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeChurchId, personId]);

  const activeRoles = useMemo(() => roles.filter((role) => role.status === "active"), [roles]);
  const memberTeams = useMemo(() => {
    const teamIds = new Set(activeRoles.filter((role) => role.scopeType === "team" && role.scopeId).map((role) => role.scopeId as string));
    teams.filter((team) => team.leaderId === personId).forEach((team) => teamIds.add(team.id));
    return teams.filter((team) => teamIds.has(team.id));
  }, [activeRoles, personId, teams]);
  const pendingAssignments = assignments.filter((assignment) => assignment.status === "pending");
  const declinedAssignments = assignments.filter((assignment) => assignment.status === "declined");

  if (isLoading) {
    return <main className="min-h-screen bg-[#f8fafc] p-8 text-sm font-semibold text-slate-600">Carregando pessoa...</main>;
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-[#f8fafc] p-8 text-[#071735]">
        <Link href="/gestao-igreja/pessoas" className="text-sm font-black text-[#061b49]">Voltar para Pessoas</Link>
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-black">Pessoa nao encontrada</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">{error || "Nao encontramos este membro na igreja ativa."}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#071735]">
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <Link href="/gestao-igreja/pessoas" className="inline-flex items-center gap-2 text-sm font-black text-[#061b49]">
            <ArrowLeft size={16} />
            Voltar para Pessoas
          </Link>

          <header className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 gap-4">
                {profile.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.photoURL} alt="" className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <span className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-[#061b49]">{getInitials(profile.displayName)}</span>
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Membro da igreja</p>
                  <h1 className="mt-2 truncate text-4xl font-black tracking-normal">{profile.displayName || profile.username || "Membro"}</h1>
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500"><Mail size={15} /> {profile.email || "sem email"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/gestao-igreja/permissoes/nova?userId=${encodeURIComponent(profile.uid)}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black text-[#061b49]">
                  <KeyRound size={16} />
                  Editar papel
                </Link>
                <Link href={`/gestao-igreja/designacoes/nova?userId=${encodeURIComponent(profile.uid)}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#061b49] px-4 text-sm font-black text-white">
                  <CalendarDays size={16} />
                  Escalar
                </Link>
              </div>
            </div>
          </header>

          <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Metric icon={KeyRound} label="Papeis" value={activeRoles.length} helper="Ativos" />
            <Metric icon={Users} label="Equipes" value={memberTeams.length} helper="Vinculadas" />
            <Metric icon={CalendarDays} label="Escalas" value={assignments.length} helper="Historico" />
            <Metric icon={CheckCircle2} label="Pendentes" value={pendingAssignments.length} helper="Aguardando aceite" />
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-2">
            <InfoCard title="Papeis e permissoes" icon={ShieldCheck}>
              <div className="flex flex-wrap gap-2">
                {activeRoles.length > 0 ? activeRoles.map((role) => (
                  <StatusPill key={role.id} label={`${ROLE_LABELS[role.role]} - ${role.scopeType}`} tone={role.role === "pastor" ? "warning" : "info"} />
                )) : <p className="text-sm font-semibold text-slate-500">Nenhum papel operacional ativo.</p>}
              </div>
            </InfoCard>
            <InfoCard title="Equipes vinculadas" icon={Users}>
              <div className="space-y-3">
                {memberTeams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between gap-3 text-sm font-semibold">
                    <Link href={`/gestao-igreja/equipes/${team.id}`} className="text-[#061b49]">{team.name}</Link>
                    <span className="text-xs text-slate-500">{team.area}</span>
                  </div>
                ))}
                {memberTeams.length === 0 ? <p className="text-sm font-semibold text-slate-500">Nenhuma equipe vinculada.</p> : null}
              </div>
            </InfoCard>
          </section>

          <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <History size={19} className="text-[#061b49]" />
              <h2 className="text-base font-black">Escalas e historico</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_140px_140px] md:items-center">
                  <div>
                    <p className="text-sm font-black">{assignment.title}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{assignment.description}</p>
                  </div>
                  <StatusPill label={assignment.status} tone={assignment.status === "pending" ? "warning" : "muted"} />
                  <span className="text-xs font-semibold text-slate-500">{assignment.startsAt ? formatDate(assignment.startsAt) : "Sem data"}</span>
                </div>
              ))}
            </div>
            {assignments.length === 0 ? <p className="text-sm font-semibold text-slate-500">Nenhuma escala encontrada para este membro.</p> : null}
          </section>

          <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <CheckCircle2 size={19} className="text-[#061b49]" />
              <h2 className="text-base font-black">Participacao registrada</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {participationLogs.map((log) => (
                <div key={log.id} className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_140px_140px] md:items-center">
                  <div>
                    <p className="text-sm font-black">{getParticipationLabel(log.status)}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{log.notes || log.role || "Sem observacao"}</p>
                  </div>
                  <StatusPill label={log.status} tone={log.status === "participated" ? "info" : "warning"} />
                  <span className="text-xs font-semibold text-slate-500">{formatDate(log.recordedAt)}</span>
                </div>
              ))}
            </div>
            {participationLogs.length === 0 ? <p className="text-sm font-semibold text-slate-500">Nenhum registro de participacao encontrado.</p> : null}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black">Resumo operacional</h2>
            <Summary label="Usuario" value={profile.uid} />
            <Summary label="Cidade" value={profile.city || "Nao informada"} />
            <Summary label="Status" value={profile.subscriptionStatus || "ativo"} />
            <Summary label="Recusas/faltas" value={declinedAssignments.length} />
            <Summary label="Presencas" value={participationLogs.filter((log) => log.status === "participated").length} />
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black">Acoes rapidas</h2>
            <div className="mt-4 grid gap-2">
              <Link href={`/gestao-igreja/permissoes/nova?userId=${encodeURIComponent(profile.uid)}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-black text-[#061b49]">
                <UserPlus size={16} />
                Adicionar papel
              </Link>
              <Link href="/gestao-igreja/equipes" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-black text-[#061b49]">
                <Users size={16} />
                Mover de equipe
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </main>
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
    <div className="mt-3 grid grid-cols-[90px_1fr] gap-2 text-xs">
      <span className="font-black text-slate-500">{label}</span>
      <span className="break-words font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "info" | "warning" | "muted" }) {
  const classes = tone === "info" ? "bg-blue-50 text-blue-700" : tone === "warning" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex w-fit min-h-7 items-center rounded-md px-2 text-[10px] font-black uppercase ${classes}`}>{label}</span>;
}

function getInitials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "M";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function getParticipationLabel(status: ChurchParticipationLog["status"]) {
  const labels: Record<ChurchParticipationLog["status"], string> = {
    participated: "Participou",
    missed: "Faltou",
    justified_absence: "Ausencia justificada",
    replaced: "Substituido",
    cancelled: "Cancelado",
  };
  return labels[status];
}
