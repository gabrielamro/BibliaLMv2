"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgePlus,
  BriefcaseBusiness,
  CalendarDays,
  Edit3,
  Grid2X2,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { churchManagementService } from "../../services/churchManagementService";
import type { ChurchServiceTeam } from "../../types";
import ChurchTeamCreateModal from "./ChurchTeamCreateModal";

type TeamRow = {
  team: ChurchServiceTeam;
  participantCount: number;
  leaderCount: number;
  openSpots: number;
  icon: LucideIcon;
  color: string;
};

const AREA_ICONS: Array<{ match: string; icon: LucideIcon; color: string }> = [
  { match: "event", icon: CalendarDays, color: "bg-[#061b49]" },
  { match: "consolid", icon: CalendarDays, color: "bg-purple-700" },
  { match: "diacon", icon: UserCheck, color: "bg-rose-500" },
  { match: "limpeza", icon: BadgePlus, color: "bg-cyan-700" },
  { match: "estacion", icon: BriefcaseBusiness, color: "bg-emerald-700" },
  { match: "ceia", icon: CalendarDays, color: "bg-sky-700" },
  { match: "louvor", icon: Users, color: "bg-indigo-700" },
];

const INITIAL_CHURCH_TEAMS = [
  { name: "Time Portaria", area: "Acesso e seguranca", capacity: 8, description: "Organiza entrada, fluxo externo, orientacao inicial e apoio antes/depois do culto." },
  { name: "Time Recepcao", area: "Acolhimento", capacity: 12, description: "Recebe membros e visitantes, orienta assentos, entrega materiais e apoia conexao com a igreja." },
  { name: "Time Louvor", area: "Louvor e adoracao", capacity: 10, description: "Organiza vocal, instrumentos, ensaio, passagem de som e apoio musical do culto." },
  { name: "Time Midia", area: "Tecnica e comunicacao", capacity: 8, description: "Cuida de camera, transmissao, projecao, som, iluminacao, fotos e suporte tecnico." },
  { name: "Time Kids", area: "Infantil", capacity: 12, description: "Acompanha criancas com professores, auxiliares, recepcao infantil e controle de retirada." },
  { name: "Time Intercessao", area: "Oracao", capacity: 8, description: "Cobre o culto em oracao, acolhe pedidos e apoia momentos de resposta com discricao." },
  { name: "Time Santa Ceia", area: "Liturgia e apoio", capacity: 10, description: "Prepara elementos, organiza distribuicao, recolhimento e apoio durante a Santa Ceia." },
  { name: "Time Estacionamento", area: "Fluxo externo", capacity: 8, description: "Apoia chegada e saida de veiculos, travessia, orientacao e seguranca no entorno." },
  { name: "Time Limpeza e Organizacao", area: "Operacao", capacity: 8, description: "Prepara ambientes, reorganiza cadeiras, mantem banheiros e areas comuns em ordem." },
  { name: "Time Diaconia", area: "Servico e cuidado", capacity: 10, description: "Apoia necessidades praticas do culto, ordem, cuidado com pessoas e suporte aos lideres." },
  { name: "Time Consolidacao", area: "Novos decididos", capacity: 8, description: "Acompanha visitantes, decisoes, novos convertidos e proximos passos apos o culto." },
  { name: "Time Eventos", area: "Apoio geral", capacity: 12, description: "Suporte para conferencias, vigilia, encontros especiais, credenciamento e bastidores." },
];

export default function ChurchTeamsDashboard({ embedded = false }: { embedded?: boolean }) {
  const { currentUser, userProfile } = useAuth();
  const activeChurchId = userProfile?.churchData?.churchId;
  const currentUserId = currentUser?.id ?? currentUser?.uid ?? userProfile?.uid ?? null;
  const [teams, setTeams] = useState<ChurchServiceTeam[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeedingDefaults, setIsSeedingDefaults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageFeedback, setPageFeedback] = useState<string | null>(null);

  const loadTeams = async () => {
    if (!activeChurchId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextTeams = await churchManagementService.listTeams(activeChurchId, { limit: 120 });
      const nextCounts = await churchManagementService.getTeamParticipantCounts(activeChurchId, nextTeams.map((team) => team.id));
      setTeams(nextTeams);
      setCounts(nextCounts);
    } catch (loadError) {
      setTeams([]);
      setCounts({});
      setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar equipes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTeams();
  }, [activeChurchId]);

  const rows = useMemo<TeamRow[]>(() => teams.map((team) => {
    const participantCount = counts[team.id] ?? 0;
    return {
      team,
      participantCount,
      leaderCount: team.leaderId ? 1 : 0,
      openSpots: Math.max((team.capacity ?? 0) - participantCount, 0),
      ...getTeamVisual(team),
    };
  }), [counts, teams]);

  const areas = useMemo(() => Array.from(new Set(teams.map((team) => team.area).filter(Boolean))).sort(), [teams]);
  const missingInitialTeams = useMemo(() => {
    const existingNames = new Set(teams.map((team) => team.name.trim().toLowerCase()));
    return INITIAL_CHURCH_TEAMS.filter((team) => !existingNames.has(team.name.trim().toLowerCase()));
  }, [teams]);

  const seedDefaultTeams = async () => {
    if (!activeChurchId) {
      setPageFeedback("Vincule seu perfil a uma igreja para criar o modelo padrao.");
      return;
    }
    if (missingInitialTeams.length === 0) {
      setPageFeedback("O modelo padrao de equipes ja esta cadastrado.");
      return;
    }

    setIsSeedingDefaults(true);
    setPageFeedback(null);
    try {
      for (const team of missingInitialTeams) {
        await churchManagementService.createTeam({
          churchId: activeChurchId,
          name: team.name,
          area: team.area,
          description: team.description,
          capacity: team.capacity,
          createdBy: currentUserId,
        });
      }
      setPageFeedback(`${missingInitialTeams.length} equipe(s) padrao criada(s).`);
      await loadTeams();
    } catch (seedError) {
      setPageFeedback(seedError instanceof Error ? seedError.message : "Nao foi possivel criar o modelo padrao.");
    } finally {
      setIsSeedingDefaults(false);
    }
  };

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      const text = [row.team.name, row.team.area, row.team.description].join(" ").toLowerCase();
      const matchesQuery = !term || text.includes(term);
      const matchesArea = areaFilter === "all" || row.team.area === areaFilter;
      const matchesStatus = statusFilter === "all" || row.team.status === statusFilter;
      return matchesQuery && matchesArea && matchesStatus;
    });
  }, [areaFilter, query, rows, statusFilter]);

  const metrics = useMemo(() => {
    const activeTeams = rows.filter((row) => row.team.status === "active").length;
    const leaders = rows.reduce((sum, row) => sum + row.leaderCount, 0);
    const volunteers = rows.reduce((sum, row) => sum + row.participantCount, 0);
    const openSpots = rows.reduce((sum, row) => sum + row.openSpots, 0);
    return [
      { label: "Equipes ativas", value: activeTeams, detail: `${Math.max(rows.length - activeTeams, 0)} inativas`, icon: Users, tone: "violet" },
      { label: "Lideres designados", value: leaders, detail: `de ${rows.length} equipes`, icon: UserCheck, tone: "blue" },
      { label: "Voluntarios", value: volunteers, detail: "ativos", icon: UserPlus, tone: "orange" },
      { label: "Vagas abertas", value: openSpots, detail: `em ${rows.filter((row) => row.openSpots > 0).length} equipes`, icon: BriefcaseBusiness, tone: "gold" },
    ];
  }, [rows]);

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#071735]">
      <section className={`${embedded ? "w-full" : "mx-auto max-w-7xl"} px-5 py-8 md:px-8`}>
        {!embedded ? <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Gestao da Igreja</p>
            <h1 className="mt-4 text-4xl font-black tracking-normal">Equipes</h1>
            <p className="mt-3 text-base font-medium text-slate-600">Gerencie os times da igreja, defina lideres, vagas e perfis para cada funcao.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={seedDefaultTeams}
              disabled={isSeedingDefaults || missingInitialTeams.length === 0}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-[#061b49] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Users size={18} />
              {isSeedingDefaults ? "Criando modelo" : "Criar modelo padrao"}
            </button>
            <button type="button" onClick={() => setCreateModalOpen(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#061b49] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#0b2b6c]">
              <Plus size={18} />
              Nova Equipe
            </button>
          </div>
        </header> : null}

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_210px_210px_50px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar equipe por nome ou area..."
                className="min-h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-[#061b49]"
              />
            </label>
            <SelectFilter value={areaFilter} onChange={setAreaFilter} options={[["all", "Todas as areas"], ...areas.map((area) => [area, area] as [string, string])]} />
            <SelectFilter value={statusFilter} onChange={setStatusFilter} options={[["all", "Todos os status"], ["active", "Status: Ativas"], ["paused", "Status: Pausadas"], ["archived", "Status: Arquivadas"]]} />
            <button type="button" aria-label="Alternar visualizacao" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 text-[#071735]">
              <Grid2X2 size={18} />
            </button>
          </div>
        </section>

        {error ? <StatusMessage tone="warning">{error}</StatusMessage> : null}
        {pageFeedback ? <StatusMessage>{pageFeedback}</StatusMessage> : null}
        {isLoading ? <StatusMessage>Carregando equipes...</StatusMessage> : null}

        <section className="mt-6">
          <div className="hidden grid-cols-[1.35fr_0.55fr_0.75fr_0.72fr_0.55fr_0.55fr_0.58fr] gap-5 px-2 pb-3 text-[11px] font-black uppercase tracking-wider text-slate-500 lg:grid">
            <span>Equipe</span>
            <span>Area</span>
            <span>Lider</span>
            <span>Voluntarios</span>
            <span>Vagas</span>
            <span>Status</span>
            <span>Acoes</span>
          </div>

          <div className="space-y-3">
            {filteredRows.map((row) => {
              const Icon = row.icon;
              return (
                <article key={row.team.id} className="grid gap-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1.35fr_0.55fr_0.75fr_0.72fr_0.55fr_0.55fr_0.58fr] lg:items-center">
                  <div className="flex min-w-0 gap-4">
                    <span className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-white ${row.color}`}>
                      <Icon size={24} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-black">{row.team.name}</h2>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">{row.team.description || "Equipe operacional da igreja."}</p>
                    </div>
                  </div>
                  <span className="w-fit rounded-md bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">{row.team.area || "Sem area"}</span>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-[#061b49]">{row.team.leaderId ? "L" : "?"}</span>
                    <div>
                      <p className="text-sm font-black">{row.team.leaderId ? "Lider vinculado" : "Lider a definir"}</p>
                      <p className="text-xs font-semibold text-slate-500">Lider</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-slate-500">
                    <span><strong className="block text-lg text-[#071735]">{row.participantCount}</strong> Voluntarios</span>
                    <span><strong className="block text-lg text-[#071735]">{row.leaderCount}</strong> Lider</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-500"><strong className="block text-lg text-[#071735]">{row.openSpots}</strong> Abertas</span>
                  <span className={`inline-flex w-fit min-h-8 items-center rounded-full px-3 text-[10px] font-black uppercase ${row.team.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {row.team.status === "active" ? "Ativa" : row.team.status}
                  </span>
                  <div className="flex gap-2">
                    <ActionLink href={`/gestao-igreja/equipes/${row.team.id}/editar`} label="Editar"><Edit3 size={16} /></ActionLink>
                    <ActionLink href={`/gestao-igreja/equipes/${row.team.id}`} label="Membros"><Users size={16} /></ActionLink>
                    <ActionLink href={`/gestao-igreja/cultos?teamId=${encodeURIComponent(row.team.id)}`} label="Mais"><MoreHorizontal size={16} /></ActionLink>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {!isLoading && filteredRows.length === 0 ? (
          <section className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <Users className="mx-auto text-slate-400" size={30} />
            <h2 className="mt-4 text-xl font-black">Nenhuma equipe encontrada</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">Crie uma equipe ou ajuste os filtros.</p>
            <button type="button" onClick={() => setCreateModalOpen(true)} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#061b49] px-5 text-sm font-black text-white transition hover:bg-[#0b2b6c]">
              <Plus size={17} /> Cadastrar equipe
            </button>
          </section>
        ) : null}

        <footer className="mt-6 text-sm font-semibold text-slate-500">Mostrando {filteredRows.length} de {rows.length} equipe(s)</footer>
      </section>
      <ChurchTeamCreateModal
        churchId={activeChurchId}
        currentUserId={currentUserId}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={loadTeams}
      />
    </main>
  );
}

function getTeamVisual(team: ChurchServiceTeam) {
  const text = `${team.name} ${team.area}`.toLowerCase();
  const found = AREA_ICONS.find((item) => text.includes(item.match));
  return found ?? { icon: Users, color: "bg-[#061b49]" };
}

function MetricCard({ metric }: { metric: { label: string; value: number; detail: string; icon: LucideIcon; tone: string } }) {
  const Icon = metric.icon;
  const toneClass = metric.tone === "orange" ? "bg-orange-50 text-orange-600" : metric.tone === "gold" ? "bg-amber-50 text-[#9a6a21]" : metric.tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-800";
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-full ${toneClass}`}><Icon size={25} /></div>
        <div>
          <p className="text-xs font-black uppercase text-slate-600">{metric.label}</p>
          <p className="mt-1 text-3xl font-black">{metric.value}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{metric.detail}</p>
        </div>
      </div>
    </article>
  );
}

function SelectFilter({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="relative block">
      <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-3 text-sm font-black text-[#071735] outline-none transition focus:border-[#061b49]">
        {options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}
      </select>
    </label>
  );
}

function ActionLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#071735] transition hover:bg-slate-50">
      {children}
    </Link>
  );
}

function StatusMessage({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warning" }) {
  const classes = tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-600";
  return <section className={`mt-4 rounded-lg border p-4 text-sm font-semibold ${classes}`}>{children}</section>;
}
