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
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { dbService } from "../../services/supabase";
import {
  churchManagementService,
  type ChurchCultoOperationalItem,
  type ChurchTeamParticipant,
} from "../../services/churchManagementService";
import type { ChurchAssignment, ChurchMemberRole, ChurchOperationalRole, ChurchQrForm, ChurchServiceTeam, UserProfile } from "../../types";
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

type ChurchTeamDetailDashboardProps = {
  teamId?: string;
  embedded?: boolean;
  onClose?: () => void;
};

export default function ChurchTeamDetailDashboard({ teamId: embeddedTeamId, embedded = false, onClose }: ChurchTeamDetailDashboardProps = {}) {
  const params = useParams<{ id: string }>();
  const teamId = embeddedTeamId ?? params.id;
  const { currentUser, userProfile } = useAuth();
  const activeChurchId = userProfile?.churchData?.churchId ?? null;
  const currentUserId = currentUser?.id ?? currentUser?.uid ?? userProfile?.uid ?? null;

  const [team, setTeam] = useState<ChurchServiceTeam | null>(null);
  const [participants, setParticipants] = useState<ChurchTeamParticipant[]>([]);
  const [churchMembers, setChurchMembers] = useState<UserProfile[]>([]);
  const [userSearchResults, setUserSearchResults] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<ChurchMemberRole[]>([]);
  const [teamFunctions, setTeamFunctions] = useState<ChurchTeamFunction[]>([]);
  const [assignments, setAssignments] = useState<ChurchAssignment[]>([]);
  const [cultos, setCultos] = useState<ChurchCultoOperationalItem[]>([]);
  const [tab, setTab] = useState<TeamTab>(embedded ? "members" : "overview");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [qrForm, setQrForm] = useState<ChurchQrForm | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showSidebarCards, setShowSidebarCards] = useState(true);
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
      const [nextTeam, nextParticipants, nextRoles, nextFunctions, nextAssignments, nextCultos, nextChurchMembers] = await Promise.all([
        churchManagementService.getTeam(teamId),
        churchManagementService.listTeamParticipants(activeChurchId, teamId),
        churchManagementService.listRoles(activeChurchId, { limit: 300 }),
        churchManagementService.listTeamFunctions(activeChurchId, teamId),
        churchManagementService.listAssignments(activeChurchId, { teamId, limit: 200 }),
        churchManagementService.getCultoOperationalItems(activeChurchId, 30),
        dbService.getChurchMembers(activeChurchId),
      ]);
      setTeam(nextTeam);
      setParticipants(nextParticipants);
      setChurchMembers(nextChurchMembers);
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

  useEffect(() => {
    const term = memberSearch.trim();
    if (selectedMember || term.length < 2) {
      setUserSearchResults([]);
      return;
    }

    let isMounted = true;
    void dbService.searchUsersGlobal(term)
      .then((results) => {
        if (isMounted) setUserSearchResults(results.slice(0, 12));
      })
      .catch(() => {
        if (isMounted) setUserSearchResults([]);
      });

    return () => {
      isMounted = false;
    };
  }, [memberSearch, selectedMember]);

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

  const memberSuggestions = useMemo(() => {
    const term = normalize(memberSearch);
    if (!term || selectedMember) return [];
    const participantIds = new Set(participants.map((participant) => participant.userId));
    const pendingInviteIds = new Set(assignments.filter((assignment) => assignment.status === "pending" && assignment.assigneeUserId).map((assignment) => assignment.assigneeUserId as string));
    const uniqueUsers = new Map<string, UserProfile>();
    [...churchMembers, ...userSearchResults].forEach((member) => uniqueUsers.set(member.uid, member));
    return [...uniqueUsers.values()]
      .filter((member) => !participantIds.has(member.uid) && !pendingInviteIds.has(member.uid))
      .filter((member) => normalize(`${member.displayName} ${member.email} ${member.username}`).includes(term))
      .slice(0, 8);
  }, [assignments, churchMembers, memberSearch, participants, selectedMember, userSearchResults]);

  const churchMemberIds = useMemo(() => new Set(churchMembers.map((member) => member.uid)), [churchMembers]);

  const inviteMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeChurchId || !team || !selectedMember) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      await churchManagementService.createAssignment({
        churchId: activeChurchId,
        teamId: team.id,
        title: `Convite para servir na equipe ${team.name}`,
        description: `Convite para integrar a equipe ${team.name} como ${ROLE_LABELS[newMemberRole] ?? "Voluntário"}.`,
        scopeType: "team",
        scopeId: team.id,
        assigneeUserId: selectedMember.uid,
        leaderUserId: leaderId || team.leaderId || currentUserId,
        publicFeedback: `Você foi convidado para servir na equipe ${team.name}. Aceite ou recuse o convite para informar a liderança.`,
      });
      if (leaderId && leaderId !== team.leaderId) {
        await churchManagementService.updateTeam(team.id, { leaderId });
        await churchManagementService.grantRole({
          churchId: activeChurchId,
          userId: leaderId,
          role: "leader",
          scopeType: "team",
          scopeId: team.id,
          grantedBy: currentUserId,
        });
      }
      setMemberSearch("");
      setSelectedMember(null);
      setFeedback(`Convite enviado para ${selectedMember.displayName || selectedMember.email}. Aguardando aprovação do membro.`);
      await load();
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : "Não foi possível enviar o convite.");
    } finally {
      setIsSaving(false);
    }
  };

  const ensureTeamQr = async () => {
    if (!activeChurchId || !team) {
      setFeedback("Vincule uma igreja ativa para cadastrar o QR Code.");
      return null;
    }
    if (qrForm) return qrForm;

    setQrLoading(true);
    setFeedback(null);
    try {
      const forms = await churchManagementService.listQrForms(activeChurchId, { limit: 100 });
      const existing = forms.find((form) => form.formType === "volunteer" && form.destination === `team:${team.id}` && form.status === "active");
      if (existing) {
        const enrichedDescription = buildTeamQrDescription(team.name, team.area, expectedFunctions);
        const updated = existing.description.includes("Funções da equipe:")
          ? existing
          : await churchManagementService.updateQrForm(existing.id, { description: enrichedDescription });
        setQrForm(updated);
        return updated;
      }

      const created = await churchManagementService.createQrForm({
        churchId: activeChurchId,
        title: `Voluntariado - ${team.name}`,
        formType: "volunteer",
        description: `Convite para servir na equipe ${team.name}. Área: ${team.area || "voluntariado"}.`,
        ...({ description: buildTeamQrDescription(team.name, team.area, expectedFunctions) } as Record<string, unknown>),
        destination: `team:${team.id}`,
        fields: [
          { label: "Nome", type: "text", required: true },
          { label: "Contato", type: "tel", required: true },
          { label: "Disponibilidade", type: "textarea" },
        ],
        privacyText: "Sua resposta será recebida pela equipe responsável da igreja.",
        confirmationText: `Recebemos seu interesse em servir na equipe ${team.name}. A liderança dará retorno sobre o próximo passo.`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: currentUserId,
      });
      setQrForm(created);
      setFeedback("QR Code cadastrado e pronto para compartilhar.");
      return created;
    } catch (qrError) {
      setFeedback(qrError instanceof Error ? qrError.message : "Não foi possível cadastrar o QR Code.");
      return null;
    } finally {
      setQrLoading(false);
    }
  };

  const copyTeamInviteLink = async () => {
    const form = await ensureTeamQr();
    if (!form || typeof window === "undefined") return;
    const link = `${window.location.origin}/qr/${form.token}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setFeedback("Link de convite copiado.");
      window.setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      setFeedback("Não foi possível copiar o link automaticamente.");
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
    return (
      <main className={embedded ? "fixed inset-0 z-[80] overflow-y-auto bg-slate-950/60 p-4 md:p-8" : "min-h-screen bg-[#f8fafc] p-8"}>
        <section className={embedded ? "mx-auto max-w-7xl rounded-2xl bg-[#f8fafc] p-8 text-sm font-semibold text-slate-600 shadow-2xl" : "text-sm font-semibold text-slate-600"}>
          Carregando equipe...
        </section>
      </main>
    );
  }

  if (error || !team) {
    return (
      <main className={embedded ? "fixed inset-0 z-[80] overflow-y-auto bg-slate-950/60 p-4 md:p-8" : "min-h-screen bg-[#f8fafc] p-8 text-[#071735]"}>
        <section className={embedded ? "mx-auto max-w-2xl rounded-2xl bg-white p-8 text-[#071735] shadow-2xl" : ""}>
          {embedded ? (
            <button type="button" onClick={onClose} className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Fechar equipe operacional">
              <X size={18} />
            </button>
          ) : <Link href="/gestao-igreja/equipes" className="text-sm font-black text-[#061b49]">Voltar para Equipes</Link>}
          <div className={embedded ? "" : "mt-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm"}>
            <h1 className="text-2xl font-black">Equipe nao encontrada</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">{error || "Nao encontramos esta equipe na igreja ativa."}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={embedded ? "fixed inset-0 z-[80] overflow-y-auto bg-slate-950/60 p-4 md:p-8" : "min-h-screen bg-[#f8fafc] text-[#071735]"}>
      <section role={embedded ? "dialog" : undefined} aria-modal={embedded ? true : undefined} aria-labelledby={embedded ? "team-detail-title" : undefined} className={embedded ? "mx-auto grid max-h-[calc(100vh-2rem)] max-w-7xl gap-4 overflow-y-auto rounded-2xl bg-[#f8fafc] px-4 py-5 shadow-2xl md:px-7 md:py-6 xl:grid-cols-[minmax(0,1fr)_280px]" : "mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_320px]"}>
        {embedded ? (
          <header className="sticky top-0 z-10 col-span-full -mx-5 -mt-6 flex items-center justify-between gap-4 border-b border-slate-200 bg-[#f8fafc]/95 px-5 py-4 backdrop-blur md:-mx-8 md:-mt-8 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#061b49] text-white"><Users size={20} /></div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Equipe operacional</p>
                <h1 id="team-detail-title" className="truncate text-xl font-black text-[#071735] md:text-2xl">{team.name}</h1>
              </div>
              <StatusPill label={participants.length > 0 ? `${participants.length} membro(s)` : "Aguardando voluntários"} tone={participants.length > 0 ? "success" : "warning"} />
            </div>
            <button type="button" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50" aria-label="Fechar equipe operacional">
              <X size={18} />
            </button>
          </header>
        ) : null}
        <div className="min-w-0">
          {!embedded ? (
            <Link href="/gestao-igreja/equipes" className="inline-flex items-center gap-2 text-sm font-black text-[#061b49]">
              <ArrowLeft size={16} />
              Voltar para Equipes
            </Link>
          ) : null}

          <header className={`${embedded ? "hidden" : "mt-5 flex"} flex-col gap-5 lg:flex-row lg:items-start lg:justify-between`}>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Equipe operacional</p>
              <h1 id={embedded ? "team-detail-title" : undefined} className="mt-3 text-4xl font-black tracking-normal">{team.name}</h1>
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
              {embedded ? (
                <button type="button" onClick={() => void ensureTeamQr()} disabled={qrLoading} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#061b49] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#0b2b6c] disabled:cursor-not-allowed disabled:opacity-60">
                  <QrCode size={16} />
                  {qrLoading ? "Cadastrando QR Code" : qrForm ? "Ver QR Code" : "Cadastrar QR Code"}
                </button>
              ) : (
                <Link href={`/gestao-igreja/qrcodes/novo?type=volunteer&teamId=${encodeURIComponent(team.id)}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#061b49] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#0b2b6c]">
                  <QrCode size={16} />
                  QR voluntariado
                </Link>
              )}
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

        {!showSidebarCards ? (
          <button type="button" onClick={() => setShowSidebarCards(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-black text-[#061b49] shadow-sm transition hover:bg-slate-50 xl:sticky xl:top-0 xl:self-start">
            <Users size={15} />
            Mostrar ações laterais
          </button>
        ) : null}

        {showSidebarCards ? <aside className="max-h-[calc(100vh-5rem)] space-y-3 overflow-y-auto pr-1 xl:sticky xl:top-0 xl:self-start">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div>
              <p className="text-xs font-black text-[#071735]">Ações da equipe</p>
              <p className="text-[10px] font-semibold text-slate-500">Convites e configuração rápida</p>
            </div>
            <button type="button" onClick={() => setShowSidebarCards(false)} className="inline-flex min-h-8 items-center rounded-md px-2 text-[10px] font-black text-slate-500 transition hover:bg-slate-100 hover:text-[#061b49]">
              Ocultar
            </button>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-black">Convidar membro</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">O membro receberá o convite e deverá aprovar a participação.</p>
            <form onSubmit={inviteMember} className="mt-4 grid gap-3">
              <label className="relative grid gap-2 text-xs font-black uppercase text-slate-500">
                Membro da igreja
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    value={selectedMember ? selectedMember.displayName : memberSearch}
                    onChange={(event) => {
                      setSelectedMember(null);
                      setMemberSearch(event.target.value);
                    }}
                    className="min-h-11 w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm font-semibold normal-case text-[#071735] outline-none focus:border-[#061b49]"
                    placeholder="Digite nome, usuário ou e-mail"
                    aria-autocomplete="list"
                    aria-expanded={memberSuggestions.length > 0}
                  />
                  {memberSuggestions.length > 0 ? (
                    <div role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                      {memberSuggestions.map((member) => (
                        <button
                          key={member.uid}
                          type="button"
                          role="option"
                          onClick={() => {
                            setSelectedMember(member);
                            setMemberSearch(member.displayName || member.email);
                          }}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition hover:bg-slate-50"
                        >
                          {member.photoURL ? <img src={member.photoURL} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-[#061b49]">{getInitials(member.displayName)}</span>}
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black normal-case text-[#071735]">{member.displayName || "Membro"}</span>
                            <span className="block truncate text-xs font-semibold normal-case text-slate-500">{member.email || `@${member.username}`}</span>
                            {!churchMemberIds.has(member.uid) ? <span className="mt-0.5 block text-[10px] font-black uppercase tracking-wide text-red-600">Usuário não é membro da igreja</span> : null}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </label>
              <label className="grid gap-2 text-xs font-black uppercase text-slate-500">
                Papel no time
                <select value={newMemberRole} onChange={(event) => setNewMemberRole(event.target.value as ChurchOperationalRole)} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold normal-case text-[#071735] outline-none focus:border-[#061b49]">
                  <option value="volunteer">Voluntario</option>
                  <option value="leader">Lider auxiliar</option>
                </select>
              </label>
              <label className="grid gap-2 text-xs font-black uppercase text-slate-500">
                Líder principal
                <select value={leaderId} onChange={(event) => setLeaderId(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold normal-case text-[#071735] outline-none focus:border-[#061b49]">
                  <option value="">Usar líder atual ou gestor</option>
                  {churchMembers.map((member) => <option key={member.uid} value={member.uid}>{member.displayName || member.email}</option>)}
                </select>
              </label>
              <button type="submit" disabled={isSaving || !selectedMember} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#061b49] text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                <MailPlus size={16} />
                {isSaving ? "Enviando convite" : "Enviar convite"}
              </button>
            </form>
          </section>

          <section className="overflow-hidden rounded-lg border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700"><QrCode size={20} /></div>
              <div>
                <h2 className="text-sm font-black text-[#071735]">QR Code de convite</h2>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">Compartilhe para receber novos voluntários nesta equipe.</p>
              </div>
            </div>

            {qrForm ? (
              <div className="mt-4 rounded-lg border border-cyan-100 bg-white p-3">
                <div className="flex flex-col items-center gap-3 sm:flex-row">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${typeof window !== "undefined" ? window.location.origin : ""}/qr/${qrForm.token}`)}`} alt={`QR Code para ${team.name}`} className="h-32 w-32 rounded-md border border-slate-200 bg-white p-1" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Link de convite</p>
                    <p className="mt-1 break-all text-xs font-semibold text-slate-600">{typeof window !== "undefined" ? `${window.location.origin}/qr/${qrForm.token}` : `/qr/${qrForm.token}`}</p>
                    <button type="button" onClick={copyTeamInviteLink} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#061b49] px-3 text-xs font-black text-white transition hover:bg-[#0b2b6c]">
                      <MailPlus size={14} />
                      {linkCopied ? "Link copiado" : "Copiar link"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => void ensureTeamQr()} disabled={qrLoading} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60">
                <QrCode size={16} />
                {qrLoading ? "Cadastrando QR Code" : "Cadastrar QR Code"}
              </button>
            )}
          </section>

          <details className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none text-sm font-black text-[#071735]">Função esperada <span className="float-right text-xs font-semibold text-slate-400">Abrir</span></summary>
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
          </details>

          <section className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Resumo</span>
              <span className="truncate text-[10px] font-semibold text-slate-500">{team.area || "Área não informada"}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-600">
              <span><strong className="text-[#071735]">{stats.capacity || "Livre"}</strong> capacidade</span>
              <span><strong className="text-[#071735]">{stats.openSpots}</strong> vagas</span>
              <span><strong className="text-[#071735]">{stats.pendingAssignments}</strong> pendências</span>
            </div>
          </section>
        </aside> : null}
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

function buildTeamQrDescription(teamName: string, area: string, functions: Array<{ name: string; quantity?: number | null }>) {
  const functionLines = functions
    .filter((item) => item.name.trim())
    .map((item) => `- ${item.name}${item.quantity ? ` - ${item.quantity}` : ""}`)
    .join("\n");
  return `Convite para servir na equipe ${teamName}. Area: ${area || "voluntariado"}.${functionLines ? `\n\nFuncoes da equipe:\n${functionLines}` : ""}`;
}
