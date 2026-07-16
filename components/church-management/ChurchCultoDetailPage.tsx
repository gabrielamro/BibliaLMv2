"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Info,
  Plus,
  QrCode,
  Send,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { churchManagementService, type ChurchCultoOperationalItem } from "../../services/churchManagementService";
import type { ChurchServiceTeam, ServiceScheduleAssignment, ServiceScheduleStatus } from "../../types";
import ChurchTeamCreateModal from "./ChurchTeamCreateModal";

type DetailTab = "teams" | "volunteers" | "slots" | "invites" | "info" | "history";

const TABS: Array<{ value: DetailTab; label: string }> = [
  { value: "teams", label: "Equipes" },
  { value: "volunteers", label: "Voluntários" },
  { value: "slots", label: "Vagas e funcoes" },
  { value: "invites", label: "Convites" },
  { value: "info", label: "Informações" },
  { value: "history", label: "Histórico" },
];

const STATUS_LABELS: Record<ServiceScheduleStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  declined: "Recusado",
  replaced: "Substituído",
};

const STATUS_STYLES: Record<ServiceScheduleStatus, string> = {
  pending: "bg-orange-50 text-orange-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  declined: "bg-red-50 text-red-700",
  replaced: "bg-sky-50 text-sky-700",
};

function activeChurchId(userProfile: ReturnType<typeof useAuth>["userProfile"]) {
  return userProfile?.churchData?.churchId ?? null;
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

function stats(item: ChurchCultoOperationalItem) {
  const total = item.schedules.length;
  const confirmed = item.schedules.filter((schedule) => schedule.status === "confirmed").length;
  const pending = item.schedules.filter((schedule) => schedule.status === "pending").length;
  const declined = item.schedules.filter((schedule) => schedule.status === "declined").length;
  const teams = new Set(item.schedules.map((schedule) => schedule.ministryId || schedule.ministryName).filter(Boolean));
  item.assignments.forEach((assignment) => assignment.teamId && teams.add(assignment.teamId));
  const pendingTeamAssignments = item.assignments.filter((assignment) => assignment.sourceType === "gestao_culto_team" && assignment.status === "pending").length;
  const isComplete = total > 0 && confirmed === total && pending === 0 && declined === 0 && pendingTeamAssignments === 0;
  return {
    teams: teams.size,
    total,
    confirmed,
    pending,
    declined,
    pendingTeamAssignments,
    isComplete,
    completion: isComplete ? 100 : total > 0 ? Math.round((confirmed / total) * 100) : 0,
  };
}

function groupByTeam(schedules: ServiceScheduleAssignment[]) {
  return schedules.reduce<Record<string, { name: string; schedules: ServiceScheduleAssignment[] }>>((acc, schedule) => {
    const key = schedule.ministryId || schedule.ministryName || "sem-time";
    if (!acc[key]) acc[key] = { name: schedule.ministryName || "Equipe sem nome", schedules: [] };
    acc[key].schedules.push(schedule);
    return acc;
  }, {});
}

export default function ChurchCultoDetailPage({
  serviceId: embeddedServiceId,
  embedded = false,
  onClose,
}: {
  serviceId?: string;
  embedded?: boolean;
  onClose?: () => void;
}) {
  const params = useParams<{ serviceId: string }>();
  const searchParams = useSearchParams();
  const { currentUser, userProfile } = useAuth();
  const churchId = activeChurchId(userProfile);
  const currentUserId = currentUser?.uid ?? currentUser?.id ?? userProfile?.uid ?? null;
  const [item, setItem] = useState<ChurchCultoOperationalItem | null>(null);
  const [teams, setTeams] = useState<ChurchServiceTeam[]>([]);
  const [teamParticipantCounts, setTeamParticipantCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>(searchParams.get("action") === "invite" ? "invites" : "teams");
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [approvingAssignmentId, setApprovingAssignmentId] = useState<string | null>(null);

  const loadDetail = useCallback(async (showLoading = true) => {
    if (!churchId) {
      setIsLoading(false);
      return;
    }
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const serviceId = decodeURIComponent(embeddedServiceId ?? params.serviceId);
      const [items, nextTeams] = await Promise.all([
        churchManagementService.getCultoOperationalItems(churchId, 50),
        churchManagementService.listTeams(churchId, { limit: 100 }),
      ]);
      const nextCounts = await churchManagementService.getTeamParticipantCounts(churchId, nextTeams.map((team) => team.id));
      setItem(items.find((nextItem) => nextItem.service.id === serviceId) ?? null);
      setTeams(nextTeams);
      setTeamParticipantCounts(nextCounts);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o culto.");
    } finally {
      setIsLoading(false);
    }
  }, [churchId, embeddedServiceId, params.serviceId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const itemStats = useMemo(() => (item ? stats(item) : null), [item]);
  const groupedTeams = useMemo(() => (item ? groupByTeam(item.schedules) : {}), [item]);

  const copyText = async (value: string, message: string) => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard indisponivel");
      await navigator.clipboard.writeText(value);
      setActionFeedback(message);
    } catch {
      setActionFeedback("Não foi possível copiar agora.");
    }
  };

  const approveTeamScale = async (assignmentId: string) => {
    if (!currentUserId) {
      setActionFeedback("Usuário atual não identificado para aprovar a escala.");
      return;
    }
    setApprovingAssignmentId(assignmentId);
    setActionFeedback(null);
    try {
      const result = await churchManagementService.approveTeamServiceAssignment(assignmentId, currentUserId);
      await loadDetail(false);
      setActionFeedback(`Escala aprovada. ${result.participantsNotified} participante(s) receberam convite.`);
    } catch (approvalError) {
      setActionFeedback(approvalError instanceof Error ? approvalError.message : "Não foi possível aprovar a escala.");
    } finally {
      setApprovingAssignmentId(null);
    }
  };

  if (isLoading) {
    return <main className={embedded ? "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" : "min-h-screen bg-[#f8fafc] p-8 text-sm font-semibold text-slate-600"}><section className={embedded ? "rounded-2xl bg-white p-8 text-sm font-semibold text-slate-600 shadow-2xl" : undefined}>Carregando detalhes do culto...</section></main>;
  }

  if (error || !item || !itemStats) {
    return (
      <main className={embedded ? "fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4 md:p-8" : "min-h-screen bg-[#f8fafc] p-8 text-[#071735]"}>
        <section className={embedded ? "mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-[#071735] shadow-2xl md:p-8" : "rounded-lg border border-slate-200 bg-white p-8 shadow-sm"}>
          {embedded && onClose ? <button type="button" onClick={onClose} aria-label="Fechar detalhes do culto" className="float-right inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"><X size={18} /></button> : null}
          {!embedded ? <Link href="/gestao-igreja/cultos" className="text-sm font-black text-[#061b49]">Voltar para Gestão de Cultos</Link> : null}
          <h1 className="text-2xl font-black">Culto não encontrado</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">{error || "Não encontramos este culto na igreja ativa."}</p>
        </section>
      </main>
    );
  }

  const publicHref = item.service.slug ? `/culto/${item.service.slug}` : "/workspace-pastoral/cultos";
  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}${publicHref}` : publicHref;
  const inviteText = `Venha participar do culto "${item.service.title}" na ${item.service.churchName || "igreja"}. ${publicUrl}`;

  return (
    <main className={embedded ? "fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4 md:p-8" : "min-h-screen bg-[#f8fafc] text-[#071735]"}>
      <section className={embedded ? "mx-auto grid max-w-7xl gap-6 rounded-2xl bg-[#f8fafc] px-5 py-6 text-[#071735] shadow-2xl md:px-8 md:py-8 xl:grid-cols-[minmax(0,1fr)_280px]" : "mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_280px]"}>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            {!embedded ? <Link href="/gestao-igreja/cultos" className="inline-flex items-center gap-2 text-sm font-black text-[#061b49]">Voltar para Gestão de Cultos</Link> : <span className="text-sm font-black text-slate-500">Detalhes do culto</span>}
            {embedded && onClose ? <button type="button" onClick={onClose} aria-label="Fechar detalhes do culto" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"><X size={18} /></button> : null}
          </div>
          <header className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-normal">{item.service.title}</h1>
              <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                <span className="inline-flex items-center gap-2"><CalendarDays size={16} /> {formatWeekday(item.service.startsAt)}, {formatDate(item.service.startsAt)}</span>
                <span className="inline-flex items-center gap-2"><Clock3 size={16} /> {formatTime(item.service.startsAt)}</span>
                <span>{item.service.churchName || "Sede da igreja"}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`rounded-md px-3 py-1 text-[11px] font-black uppercase ${itemStats.isComplete ? "bg-emerald-100 text-emerald-800" : "bg-orange-50 text-orange-700"}`}>{itemStats.isComplete ? "Culto 100%" : "Em andamento"}</span>
                <span className="rounded-md bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">{itemStats.confirmed} de {itemStats.total} confirmados</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setQrModalOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black shadow-sm transition hover:bg-slate-50"><QrCode size={17} /> QR Code</button>
              <button type="button" onClick={() => setInviteModalOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black shadow-sm transition hover:bg-slate-50"><Users size={17} /> Convidar voluntários</button>
              <button type="button" onClick={() => setScaleModalOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#061b49] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#0b2b6c]"><Users size={17} /> Editar escala</button>
            </div>
          </header>

          <section className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Metric icon={Users} label="Equipes" value={itemStats.teams} />
            <Metric icon={Users} label="Escalados" value={itemStats.total} />
            <Metric icon={CheckCircle2} label="Confirmados" value={itemStats.confirmed} />
            <Metric icon={Clock3} label="Pendentes" value={itemStats.pending} tone="orange" />
          </section>

          <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <strong className="text-sm">{itemStats.completion}% da escala confirmada</strong>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${itemStats.completion}%` }} />
              </div>
              <span className="text-sm font-black text-emerald-600">{itemStats.confirmed} de {itemStats.total} confirmados</span>
            </div>
          </section>

          <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black">Alertas e pendências</h2>
            <div className="mt-4 grid gap-2">
              {itemStats.pendingTeamAssignments > 0 ? item.assignments.filter((assignment) => assignment.sourceType === "gestao_culto_team" && assignment.status === "pending").map((assignment) => (
                <AlertRow key={assignment.id} text={`A escala ${assignment.title} aguarda aprovação`} action={approvingAssignmentId === assignment.id ? "Aprovando..." : "Aprovar escala"} disabled={approvingAssignmentId !== null} onAction={() => void approveTeamScale(assignment.id)} />
              )) : null}
              {itemStats.pending > 0 ? <AlertRow text={`${itemStats.pending} voluntário(s) ainda não responderam`} action="Ver convites" onAction={() => { setTab("invites"); setInviteModalOpen(false); }} /> : null}
              {itemStats.declined > 0 ? <AlertRow text={`${itemStats.declined} participante(s) recusaram o convite`} action="Substituir" onAction={() => setScaleModalOpen(true)} /> : null}
              {itemStats.total === 0 && itemStats.pendingTeamAssignments === 0 ? <AlertRow text="Nenhuma equipe foi escalada para este culto" action="Escalar" onAction={() => setScaleModalOpen(true)} /> : null}
              {itemStats.isComplete ? (
                <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Culto 100% concluído: todas as pessoas escaladas confirmaram e não há pendências.</p>
              ) : itemStats.pending === 0 && itemStats.declined === 0 && itemStats.pendingTeamAssignments === 0 && itemStats.total > 0 ? (
                <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-800">A escala foi criada, mas ainda falta pelo menos uma confirmacao para chegar a 100%.</p>
              ) : null}
            </div>
            {actionFeedback ? <p role="status" className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">{actionFeedback}</p> : null}
          </section>

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
            <div className="mt-4">{renderTab(tab, item, groupedTeams)}</div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black">Proxima acao recomendada</h2>
            <div className="mt-6 text-center">
              <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#061b49]"><Send size={26} /></div>
              <p className="mt-4 text-sm font-black">Reenviar convites pendentes</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{itemStats.pending} voluntário(s) ainda não responderam.</p>
              <button type="button" onClick={() => setTab("invites")} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#061b49] text-sm font-black text-white">Executar acao</button>
            </div>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black">Resumo do culto</h2>
            <Summary label="Equipes" value={itemStats.teams} />
            <Summary label="Escalados" value={itemStats.total} />
            <Summary label="Confirmados" value={itemStats.confirmed} />
            <Summary label="Pendentes" value={itemStats.pending} />
            <Summary label="Recusado" value={itemStats.declined} />
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black">Detalhes rápidos</h2>
            <Summary label="Data" value={formatDate(item.service.startsAt)} />
            <Summary label="Horário" value={formatTime(item.service.startsAt)} />
            <Summary label="Local" value={item.service.churchName || "Sede da igreja"} />
            <Summary label="Tema" value={item.service.theme || "Não informado"} />
            <Link href={publicHref} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-black text-[#061b49]"><ExternalLink size={15} /> Culto online</Link>
          </section>
        </aside>
      </section>

      {qrModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="detail-qr-title" className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="detail-qr-title" className="text-xl font-black text-[#071735]">QR Code do culto</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Use este QR para abrir a página online do culto.</p>
              </div>
              <button type="button" onClick={() => setQrModalOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600">x</button>
            </div>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(publicUrl)}`} alt={`QR Code ${item.service.title}`} className="mx-auto mt-5 h-64 w-64 rounded-lg border border-slate-200 bg-white p-3" />
            <p className="mt-4 break-all rounded-lg bg-slate-50 p-3 text-xs font-semibold text-slate-600">{publicUrl}</p>
            <button type="button" onClick={() => void copyText(publicUrl, "Link do culto copiado.")} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#061b49] text-sm font-black text-white">Copiar link</button>
          </section>
        </div>
      ) : null}

      {inviteModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="detail-invite-title" className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="detail-invite-title" className="text-xl font-black text-[#071735]">Convidar voluntários</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Compartilhe o culto com a equipe. A escala operacional continua sendo gerenciada na aba de equipes.</p>
              </div>
              <button type="button" onClick={() => setInviteModalOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600">x</button>
            </div>
            <textarea readOnly value={inviteText} className="mt-5 min-h-32 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700" />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => void copyText(inviteText, "Convite copiado.")} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 text-sm font-black text-[#061b49]">Copiar convite</button>
              <button type="button" onClick={() => { setTab("invites"); setInviteModalOpen(false); }} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#061b49] text-sm font-black text-white">Ver convites</button>
            </div>
          </section>
        </div>
      ) : null}

      {scaleModalOpen ? (
        <DetailScaleModal
          item={item}
          teams={teams}
          teamParticipantCounts={teamParticipantCounts}
          currentUserId={currentUserId}
          onClose={() => setScaleModalOpen(false)}
          onChanged={async () => {
            if (!churchId) return;
            const items = await churchManagementService.getCultoOperationalItems(churchId, 50);
            setItem(items.find((nextItem) => nextItem.service.id === item.service.id) ?? item);
          }}
        />
      ) : null}
    </main>
  );
}

function renderTab(tab: DetailTab, item: ChurchCultoOperationalItem, groupedTeams: Record<string, { name: string; schedules: ServiceScheduleAssignment[] }>) {
  if (tab === "teams") {
    return (
      <div className="space-y-3">
        {Object.entries(groupedTeams).map(([teamId, team]) => {
          const confirmed = team.schedules.filter((schedule) => schedule.status === "confirmed").length;
          return (
            <article key={teamId} className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
                <div>
                  <h3 className="text-base font-black">{team.name}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{confirmed} de {team.schedules.length} confirmados</p>
                </div>
                <ChevronDown size={18} className="text-slate-400" />
              </div>
              <div className="divide-y divide-slate-100">
                {team.schedules.map((schedule) => <VolunteerRow key={schedule.id} schedule={schedule} />)}
              </div>
            </article>
          );
        })}
        {Object.keys(groupedTeams).length === 0 ? <EmptyState text="Nenhuma equipe vinculada a este culto." /> : null}
      </div>
    );
  }

  if (tab === "volunteers" || tab === "invites") {
    return (
      <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="divide-y divide-slate-100">
          {item.schedules.map((schedule) => <VolunteerRow key={schedule.id} schedule={schedule} />)}
        </div>
        {item.schedules.length === 0 ? <EmptyState text="Nenhum voluntario escalado." /> : null}
      </article>
    );
  }

  if (tab === "slots") {
    return (
      <div className="grid gap-3">
        {Object.entries(groupedTeams).map(([teamId, team]) => (
          <article key={teamId} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-base font-black">{team.name}</h3>
            <div className="mt-3 grid gap-2">
              {team.schedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm font-semibold">
                  <span>{schedule.role || "Função não informada"}</span>
                  <span className="text-slate-500">{schedule.userDisplayName}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (tab === "info") {
    return (
      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black">{item.service.title}</h3>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">{item.service.theme || "Tema não informado."}</p>
        <p className="mt-3 text-sm font-semibold text-slate-500">Pregador: {item.service.preacherName || "Não informado"}</p>
      </article>
    );
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black">Histórico operacional</h3>
      <div className="mt-4 space-y-2">
        {item.assignments.map((assignment) => (
          <p key={assignment.id} className="rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-600">{assignment.title} - {assignment.status}</p>
        ))}
        {item.assignments.length === 0 ? <EmptyState text="Nenhum histórico operacional registrado." /> : null}
      </div>
    </article>
  );
}

function Metric({ icon: Icon, label, value, tone = "blue" }: { icon: typeof Users; label: string; value: number; tone?: "blue" | "orange" }) {
  const toneClass = tone === "orange" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-[#061b49]";
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${toneClass}`}><Icon size={22} /></div>
        <div>
          <p className="text-xs font-black text-slate-600">{label}</p>
          <p className="mt-1 text-3xl font-black">{value}</p>
        </div>
      </div>
    </article>
  );
}

function AlertRow({ text, action, onAction, disabled = false }: { text: string; action: string; onAction: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-orange-50 p-3 text-sm font-semibold text-orange-800">
      <span className="inline-flex items-center gap-2"><AlertTriangle size={16} /> {text}</span>
      <button type="button" onClick={onAction} disabled={disabled} className="min-h-9 rounded-lg border border-orange-200 bg-white px-4 text-xs font-black text-[#061b49] transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60">{action}</button>
    </div>
  );
}

function VolunteerRow({ schedule }: { schedule: ServiceScheduleAssignment }) {
  return (
    <div className="grid gap-3 p-3 text-sm md:grid-cols-[minmax(0,1fr)_180px_120px] md:items-center">
      <strong className="min-w-0 truncate">{schedule.userDisplayName}</strong>
      <span className="font-semibold text-slate-500">{schedule.role || "Função não informada"}</span>
      <span className={`w-fit rounded-md px-2 py-1 text-[11px] font-black ${STATUS_STYLES[schedule.status]}`}>{STATUS_LABELS[schedule.status]}</span>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="mt-3 grid grid-cols-[90px_1fr] gap-2 text-xs">
      <span className="font-black text-slate-500">{label}</span>
      <span className="font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm font-semibold text-slate-500">{text}</div>;
}

function DetailScaleModal({
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
  const [createTeamModalOpen, setCreateTeamModalOpen] = useState(false);
  const selectedTeams = useMemo(() => teams.filter((team) => selectedTeamIds.includes(team.id)), [selectedTeamIds, teams]);
  const selectedTeamsWithoutVolunteers = useMemo(
    () => selectedTeams.filter((team) => (teamParticipantCounts[team.id] ?? 0) === 0),
    [selectedTeams, teamParticipantCounts],
  );

  const saveScale = async () => {
    if (!currentUserId) {
      setFeedback("Usuário atual não identificado para criar a escala.");
      return;
    }
    if (selectedTeams.length === 0) {
      setFeedback("Selecione pelo menos uma equipe para este culto.");
      return;
    }
    if (selectedTeamsWithoutVolunteers.length > 0) {
      setFeedback(`A equipe ${selectedTeamsWithoutVolunteers[0].name} ainda não possui voluntários. Gerencie os membros antes de enviar a escala.`);
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
      setFeedback("Escala enviada para aprovação do líder ou gestor. Depois da aprovação, os voluntários serão notificados.");
      await onChanged();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível salvar a escala.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="detail-scale-title" className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Editar escala</p>
            <h2 id="detail-scale-title" className="mt-1 text-2xl font-black text-[#071735]">{item.service.title}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">{formatDate(item.service.startsAt)} às {formatTime(item.service.startsAt)}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600">x</button>
        </header>
        <div className="max-h-[60vh] overflow-y-auto p-5">
          <h3 className="text-base font-black text-[#071735]">Times que participam</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">Selecione as equipes que devem servir neste culto. A solicitação passa pela aprovação do líder ou gestor.</p>
          {teams.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {teams.map((team) => {
                const participantCount = teamParticipantCounts[team.id] ?? 0;
                const selected = selectedTeamIds.includes(team.id);
                return (
                  <label key={team.id} className={`flex min-h-20 cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${selected ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => setSelectedTeamIds((current) => current.includes(team.id) ? current.filter((id) => id !== team.id) : [...current, team.id])}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#061b49]"
                    />
                    <span>
                      <span className="block text-sm font-black text-[#071735]">{team.name}</span>
                      <span className="mt-1 block text-xs font-semibold text-slate-500">{team.area || team.description || "Time operacional"}</span>
                      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-500">{participantCount} participante{participantCount === 1 ? "" : "s"}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-600">
              <p>Nenhuma equipe cadastrada. Crie uma equipe antes de escalar o culto.</p>
              <button type="button" onClick={() => setCreateTeamModalOpen(true)} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#061b49] px-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#0b2b6c]">
                <Plus size={15} /> Cadastrar equipe
              </button>
            </div>
          )}
          {feedback ? <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">{feedback}</p> : null}
          {selectedTeamsWithoutVolunteers.length > 0 ? (
            <div role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              <p>Esta equipe ainda não possui voluntários para receber a escala.</p>
              <Link
                href={`/gestao-igreja/equipes/${selectedTeamsWithoutVolunteers[0].id}`}
                onClick={onClose}
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-[#061b49] px-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#0b2b6c]"
              >
                Gerenciar voluntários e convites
              </Link>
            </div>
          ) : null}
        </div>
        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-[#061b49] transition hover:bg-slate-50">Cancelar</button>
          <button type="button" onClick={saveScale} disabled={isSaving || teams.length === 0 || selectedTeamsWithoutVolunteers.length > 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#061b49] px-4 text-sm font-black text-white transition hover:bg-[#0b2b6c] disabled:cursor-not-allowed disabled:opacity-60">
            <CheckCircle2 size={16} />
            {isSaving ? "Salvando escala" : selectedTeamsWithoutVolunteers.length > 0 ? "Adicione voluntários primeiro" : "Salvar times"}
          </button>
        </footer>
      </section>
      <ChurchTeamCreateModal
        churchId={item.service.churchId}
        currentUserId={currentUserId}
        open={createTeamModalOpen}
        onClose={() => setCreateTeamModalOpen(false)}
        onCreated={async (team) => {
          setSelectedTeamIds((current) => current.includes(team.id) ? current : [...current, team.id]);
          await onChanged();
        }}
      />
    </div>
  );
}
