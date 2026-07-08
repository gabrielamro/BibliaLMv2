"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { churchManagementService, type ChurchCultoOperationalItem } from "../../services/churchManagementService";
import type { ChurchServiceTeam, ServiceScheduleAssignment, ServiceScheduleStatus } from "../../types";

type DetailTab = "teams" | "volunteers" | "slots" | "invites" | "info" | "history";

const TABS: Array<{ value: DetailTab; label: string }> = [
  { value: "teams", label: "Equipes" },
  { value: "volunteers", label: "Voluntarios" },
  { value: "slots", label: "Vagas e funcoes" },
  { value: "invites", label: "Convites" },
  { value: "info", label: "Informacoes" },
  { value: "history", label: "Historico" },
];

const STATUS_LABELS: Record<ServiceScheduleStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  declined: "Recusado",
  replaced: "Substituido",
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
  return {
    teams: teams.size,
    total,
    confirmed,
    pending,
    declined,
    completion: total > 0 ? Math.round((confirmed / total) * 100) : 0,
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

export default function ChurchCultoDetailPage() {
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

  useEffect(() => {
    const load = async () => {
      if (!churchId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const serviceId = decodeURIComponent(params.serviceId);
        const [items, nextTeams] = await Promise.all([
          churchManagementService.getCultoOperationalItems(churchId, 50),
          churchManagementService.listTeams(churchId, { limit: 100 }),
        ]);
        const nextCounts = await churchManagementService.getTeamParticipantCounts(churchId, nextTeams.map((team) => team.id));
        const found = items.find((nextItem) => nextItem.service.id === serviceId) ?? null;
        setItem(found);
        setTeams(nextTeams);
        setTeamParticipantCounts(nextCounts);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar o culto.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [churchId, params.serviceId]);

  const itemStats = useMemo(() => (item ? stats(item) : null), [item]);
  const groupedTeams = useMemo(() => (item ? groupByTeam(item.schedules) : {}), [item]);

  if (isLoading) {
    return <main className="min-h-screen bg-[#f8fafc] p-8 text-sm font-semibold text-slate-600">Carregando detalhes do culto...</main>;
  }

  if (error || !item || !itemStats) {
    return (
      <main className="min-h-screen bg-[#f8fafc] p-8 text-[#071735]">
        <Link href="/gestao-igreja/cultos" className="text-sm font-black text-[#061b49]">Voltar para Gestao de Cultos</Link>
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-black">Culto nao encontrado</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">{error || "Nao encontramos este culto na igreja ativa."}</p>
        </section>
      </main>
    );
  }

  const publicHref = item.service.slug ? `/culto/${item.service.slug}` : "/workspace-pastoral/cultos";
  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}${publicHref}` : publicHref;
  const inviteText = `Venha participar do culto "${item.service.title}" na ${item.service.churchName || "igreja"}. ${publicUrl}`;

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#071735]">
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <Link href="/gestao-igreja/cultos" className="inline-flex items-center gap-2 text-sm font-black text-[#061b49]">Voltar para Gestao de Cultos</Link>
          <header className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-normal">{item.service.title}</h1>
              <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                <span className="inline-flex items-center gap-2"><CalendarDays size={16} /> {formatWeekday(item.service.startsAt)}, {formatDate(item.service.startsAt)}</span>
                <span className="inline-flex items-center gap-2"><Clock3 size={16} /> {formatTime(item.service.startsAt)}</span>
                <span>{item.service.churchName || "Sede da igreja"}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-md bg-orange-50 px-3 py-1 text-[11px] font-black uppercase text-orange-700">Aguardando confirmacoes</span>
                <span className="rounded-md bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">{itemStats.confirmed} de {itemStats.total} confirmados</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setQrModalOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black shadow-sm transition hover:bg-slate-50"><QrCode size={17} /> QR Code</button>
              <button type="button" onClick={() => setInviteModalOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black shadow-sm transition hover:bg-slate-50"><Users size={17} /> Convidar voluntarios</button>
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
            <h2 className="text-base font-black">Alertas e pendencias</h2>
            <div className="mt-4 grid gap-2">
              {itemStats.pending > 0 ? <AlertRow text={`${itemStats.pending} voluntario(s) ainda nao responderam`} action="Reenviar" /> : null}
              {itemStats.declined > 0 ? <AlertRow text={`${itemStats.declined} participante(s) recusaram o convite`} action="Substituir" /> : null}
              {itemStats.total === 0 ? <AlertRow text="Nenhuma equipe foi escalada para este culto" action="Escalar" /> : null}
              {itemStats.pending === 0 && itemStats.declined === 0 && itemStats.total > 0 ? (
                <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Nenhuma pendencia critica encontrada.</p>
              ) : null}
            </div>
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
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{itemStats.pending} voluntario(s) ainda nao responderam.</p>
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
            <h2 className="text-sm font-black">Detalhes rapidos</h2>
            <Summary label="Data" value={formatDate(item.service.startsAt)} />
            <Summary label="Horario" value={formatTime(item.service.startsAt)} />
            <Summary label="Local" value={item.service.churchName || "Sede da igreja"} />
            <Summary label="Tema" value={item.service.theme || "Nao informado"} />
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
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Use este QR para abrir a pagina online do culto.</p>
              </div>
              <button type="button" onClick={() => setQrModalOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600">x</button>
            </div>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(publicUrl)}`} alt={`QR Code ${item.service.title}`} className="mx-auto mt-5 h-64 w-64 rounded-lg border border-slate-200 bg-white p-3" />
            <p className="mt-4 break-all rounded-lg bg-slate-50 p-3 text-xs font-semibold text-slate-600">{publicUrl}</p>
            <button type="button" onClick={() => navigator.clipboard?.writeText(publicUrl)} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#061b49] text-sm font-black text-white">Copiar link</button>
          </section>
        </div>
      ) : null}

      {inviteModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="detail-invite-title" className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="detail-invite-title" className="text-xl font-black text-[#071735]">Convidar voluntarios</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Compartilhe o culto com a equipe. A escala operacional continua sendo gerenciada na aba de equipes.</p>
              </div>
              <button type="button" onClick={() => setInviteModalOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600">x</button>
            </div>
            <textarea readOnly value={inviteText} className="mt-5 min-h-32 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700" />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => navigator.clipboard?.writeText(inviteText)} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 text-sm font-black text-[#061b49]">Copiar convite</button>
              <button type="button" onClick={() => setTab("invites")} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#061b49] text-sm font-black text-white">Ver convites</button>
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
                  <span>{schedule.role || "Funcao nao informada"}</span>
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
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">{item.service.theme || "Tema nao informado."}</p>
        <p className="mt-3 text-sm font-semibold text-slate-500">Pregador: {item.service.preacherName || "Nao informado"}</p>
      </article>
    );
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black">Historico operacional</h3>
      <div className="mt-4 space-y-2">
        {item.assignments.map((assignment) => (
          <p key={assignment.id} className="rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-600">{assignment.title} - {assignment.status}</p>
        ))}
        {item.assignments.length === 0 ? <EmptyState text="Nenhum historico operacional registrado." /> : null}
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

function AlertRow({ text, action }: { text: string; action: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-orange-50 p-3 text-sm font-semibold text-orange-800">
      <span className="inline-flex items-center gap-2"><AlertTriangle size={16} /> {text}</span>
      <button type="button" className="min-h-9 rounded-lg border border-orange-200 bg-white px-4 text-xs font-black text-[#061b49]">{action}</button>
    </div>
  );
}

function VolunteerRow({ schedule }: { schedule: ServiceScheduleAssignment }) {
  return (
    <div className="grid gap-3 p-3 text-sm md:grid-cols-[minmax(0,1fr)_180px_120px_50px] md:items-center">
      <strong className="min-w-0 truncate">{schedule.userDisplayName}</strong>
      <span className="font-semibold text-slate-500">{schedule.role || "Funcao nao informada"}</span>
      <span className={`w-fit rounded-md px-2 py-1 text-[11px] font-black ${STATUS_STYLES[schedule.status]}`}>{STATUS_LABELS[schedule.status]}</span>
      <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 font-black">...</button>
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
  const selectedTeams = useMemo(() => teams.filter((team) => selectedTeamIds.includes(team.id)), [selectedTeamIds, teams]);

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
      setFeedback("Escala enviada para aprovacao do lider ou gestor. Depois da aprovacao, os voluntarios serao notificados.");
      await onChanged();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel salvar a escala.");
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
            <p className="mt-2 text-sm font-semibold text-slate-600">{formatDate(item.service.startsAt)} as {formatTime(item.service.startsAt)}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600">x</button>
        </header>
        <div className="max-h-[60vh] overflow-y-auto p-5">
          <h3 className="text-base font-black text-[#071735]">Times que participam</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">Selecione as equipes que devem servir neste culto. A solicitacao passa pela aprovacao do lider ou gestor.</p>
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
            <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-600">Nenhuma equipe cadastrada. Crie equipes antes de escalar o culto.</p>
          )}
          {feedback ? <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">{feedback}</p> : null}
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
