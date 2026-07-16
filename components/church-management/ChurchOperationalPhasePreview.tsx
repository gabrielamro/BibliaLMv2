"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Bell,
  CheckCircle2,
  ChevronRight,
  AtSign,
  KeyRound,
  Link2,
  Loader2,
  Medal,
  Plus,
  Printer,
  QrCode,
  Save,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { churchManagementService } from "../../services/churchManagementService";
import { dbService } from "../../services/supabase";
import {
  churchBadgeRulesPreview,
} from "../../services/churchManagementPreviewService";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchManagementNotification, ChurchMemberRole, ChurchOperationalRole, ChurchQrForm, ChurchRoleScopeType, ChurchServiceTeam, UserProfile } from "../../types";

type OperationalPhase = "equipes" | "permissoes" | "notificacoes" | "insignias";

interface PhaseConfig {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const configs: Record<OperationalPhase, PhaseConfig> = {
  equipes: {
    eyebrow: "Equipes de servico",
    title: "Lideres, voluntarios e capacidade",
    description: "Grupos operacionais com lider, atividade, vagas abertas, proxima acao e alertas de reforco.",
    icon: Users,
  },
  permissoes: {
    eyebrow: "Roles por igreja",
    title: "Perfis, escopos e limites",
    description: "Separacao entre plano comercial, papel operacional e acesso pastoral sensivel.",
    icon: KeyRound,
  },
  notificacoes: {
    eyebrow: "Alertas e notificacoes",
    title: "Eventos que geram retorno",
    description: "Tudo que muda status, responsavel, convite, QR ou cuidado precisa avisar a pessoa certa.",
    icon: Bell,
  },
  insignias: {
    eyebrow: "Insignias e Mana",
    title: "Reconhecimento auditavel",
    description: "Regras de reconhecimento por servico pratico, com limites de Mana e sem ranking espiritual.",
    icon: Medal,
  },
};

const cardMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

type TeamCard = {
  id: string;
  title: string;
  description: string;
  area: string;
  leader: string;
  members: number;
  openSpots: number;
  health: string;
  icon: LucideIcon;
};

type RoleCard = {
  id: string;
  editableRoleId: string | null;
  profile: string;
  description: string;
  scope: string;
  people: number;
  canSeeSensitiveCare: boolean;
  canManageOperations: boolean;
  guardrail: string;
  icon: LucideIcon;
};

type NotificationCard = {
  id: string;
  title: string;
  text: string;
  severity: string;
  audience: string;
  trigger: string;
  channel: string;
  dedupeKey: string;
  icon: LucideIcon;
};

const roleOptions: Array<{ value: ChurchOperationalRole; label: string }> = [
  { value: "church_manager", label: "Gestor da Igreja" },
  { value: "pastor", label: "Pastor" },
  { value: "leader", label: "Lider" },
  { value: "volunteer", label: "Voluntario" },
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

export default function ChurchOperationalPhasePreview({ phase }: { phase: OperationalPhase }) {
  const { currentUser, userProfile } = useAuth();
  const config = configs[phase];
  const Icon = config.icon;
  const reduceMotion = useReducedMotion();
  const activeChurchId = userProfile?.churchData?.churchId;
  const currentUserId = currentUser?.id ?? currentUser?.uid ?? userProfile?.uid ?? null;
  const [realTeams, setRealTeams] = useState<ChurchServiceTeam[]>([]);
  const [inviteTeam, setInviteTeam] = useState<TeamCard | null>(null);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isSeedingTeams, setIsSeedingTeams] = useState(false);
  const [teamFeedback, setTeamFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [teamDraft, setTeamDraft] = useState({
    name: "",
    area: "",
    description: "",
    capacity: "8",
  });
  const [realRoles, setRealRoles] = useState<ChurchMemberRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isGrantingRole, setIsGrantingRole] = useState(false);
  const [roleFeedback, setRoleFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [roleDraft, setRoleDraft] = useState({
    userId: "",
    role: "volunteer" as ChurchOperationalRole,
    scopeType: "church" as ChurchRoleScopeType,
    scopeId: "",
  });
  const [notifications, setNotifications] = useState<ChurchManagementNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  useEffect(() => {
    if (phase !== "equipes" || !activeChurchId) return;
    let isMounted = true;
    setIsLoadingTeams(true);
    churchManagementService.listTeams(activeChurchId, { limit: 50 })
      .then((teams) => {
        if (isMounted) setRealTeams(teams);
      })
      .catch(() => {
        if (isMounted) setRealTeams([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingTeams(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId, phase]);

  useEffect(() => {
    if (phase !== "notificacoes" || !activeChurchId) return;
    let isMounted = true;
    setIsLoadingNotifications(true);
    churchManagementService.listNotifications(activeChurchId, { limit: 50 })
      .then((items) => {
        if (isMounted) setNotifications(items);
      })
      .catch(() => {
        if (isMounted) setNotifications([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingNotifications(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId, phase]);

  useEffect(() => {
    if (phase !== "permissoes" || !activeChurchId) return;
    let isMounted = true;
    setIsLoadingRoles(true);
    churchManagementService.listRoles(activeChurchId, { limit: 100 })
      .then((roles) => {
        if (isMounted) setRealRoles(roles);
      })
      .catch(() => {
        if (isMounted) setRealRoles([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingRoles(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId, phase]);

  const teamCards = useMemo<TeamCard[]>(() => {
    return realTeams.map((team) => ({
      id: team.id,
      title: team.name,
      description: team.description || "Equipe operacional da igreja.",
      area: team.area,
      leader: team.leaderId ? "Lider vinculado" : "Lider a definir",
      members: 0,
      openSpots: team.capacity ?? 0,
      health: team.status === "active" ? "Ativa" : "Pausada",
      icon: Users,
    }));
  }, [realTeams]);

  const missingInitialTeams = useMemo(() => {
    const existingNames = new Set(realTeams.map((team) => team.name.trim().toLowerCase()));
    return INITIAL_CHURCH_TEAMS.filter((team) => !existingNames.has(team.name.trim().toLowerCase()));
  }, [realTeams]);

  const roleCards = useMemo<RoleCard[]>(() => {
    return roleOptions.map((option) => {
      const roles = realRoles.filter((role) => role.role === option.value && role.status === "active");
      const editableRoleId = roles[0]?.id ?? null;
      return {
        id: option.value,
        editableRoleId,
        profile: option.label,
        description: getRoleDescription(option.value),
        scope: getRoleScopeSummary(roles),
        people: roles.length,
        canSeeSensitiveCare: option.value === "pastor",
        canManageOperations: option.value === "church_manager" || option.value === "pastor" || option.value === "leader",
        guardrail: getRoleGuardrail(option.value),
        icon: KeyRound,
      };
    });
  }, [realRoles]);

  const notificationCards = useMemo<NotificationCard[]>(() => {
    return notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      text: notification.message,
      severity: notification.severity === "urgent" ? "Urgente" : notification.severity === "action" ? "Acao" : "Info",
      audience: notification.userId ? "Usuario" : notification.audienceRole ?? "Igreja",
      trigger: notification.eventType,
      channel: notification.channel === "both" ? "Ambos" : notification.channel === "member" ? "Minha Igreja" : "Dashboard",
      dedupeKey: notification.dedupeKey ?? "sem dedupe",
      icon: Bell,
    }));
  }, [notifications]);

  const createTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!teamDraft.name.trim() || !teamDraft.area.trim()) {
      setTeamFeedback({ type: "error", message: "Informe nome e area da equipe." });
      return;
    }
    if (!activeChurchId) {
      setTeamFeedback({ type: "info", message: "Vincule seu perfil a uma igreja para gravar equipes reais. Esta tela segue em modo preview." });
      return;
    }

    setIsCreatingTeam(true);
    setTeamFeedback(null);
    try {
      const created = await churchManagementService.createTeam({
        churchId: activeChurchId,
        name: teamDraft.name.trim(),
        area: teamDraft.area.trim(),
        description: teamDraft.description.trim(),
        capacity: Number(teamDraft.capacity) || null,
        createdBy: currentUser?.id ?? currentUser?.uid ?? null,
      });
      setRealTeams((teams) => [created, ...teams]);
      setTeamDraft({ name: "", area: "", description: "", capacity: "8" });
      setTeamFeedback({ type: "success", message: "Equipe criada. Ela ja pode ser usada como base para designacoes e convites." });
    } catch (error) {
      setTeamFeedback({ type: "error", message: error instanceof Error ? error.message : "Nao foi possivel criar a equipe agora." });
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const seedInitialTeams = async () => {
    if (!activeChurchId) {
      setTeamFeedback({ type: "info", message: "Vincule seu perfil a uma igreja para criar times reais." });
      return;
    }
    if (missingInitialTeams.length === 0) return;

    setIsSeedingTeams(true);
    setTeamFeedback(null);
    try {
      const createdTeams: ChurchServiceTeam[] = [];
      for (const team of missingInitialTeams) {
        const created = await churchManagementService.createTeam({
          churchId: activeChurchId,
          name: team.name,
          area: team.area,
          description: team.description,
          capacity: team.capacity,
          createdBy: currentUser?.id ?? currentUser?.uid ?? null,
        });
        createdTeams.push(created);
      }

      setRealTeams((teams) => [...createdTeams, ...teams]);
      setTeamFeedback({ type: "success", message: `${createdTeams.length} time(s) iniciais criados sem participantes.` });
    } catch (error) {
      setTeamFeedback({ type: "error", message: error instanceof Error ? error.message : "Nao foi possivel criar os times iniciais." });
    } finally {
      setIsSeedingTeams(false);
    }
  };

  const grantRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roleDraft.userId.trim()) {
      setRoleFeedback({ type: "error", message: "Informe o ID do usuario que recebera o papel." });
      return;
    }
    if (!activeChurchId) {
      setRoleFeedback({ type: "info", message: "Vincule seu perfil a uma igreja para gravar permissoes reais. Esta tela segue em modo preview." });
      return;
    }

    setIsGrantingRole(true);
    setRoleFeedback(null);
    try {
      const role = await churchManagementService.grantRole({
        churchId: activeChurchId,
        userId: roleDraft.userId.trim(),
        role: roleDraft.role,
        scopeType: roleDraft.scopeType,
        scopeId: roleDraft.scopeId.trim() || null,
        grantedBy: currentUser?.id ?? currentUser?.uid ?? null,
      });
      setRealRoles((roles) => [role, ...roles.filter((item) => item.id !== role.id)]);
      setRoleDraft((current) => ({ ...current, userId: "", scopeId: "" }));
      setRoleFeedback({ type: "success", message: "Papel operacional concedido e notificado ao usuario quando possivel." });
    } catch (error) {
      setRoleFeedback({ type: "error", message: error instanceof Error ? error.message : "Nao foi possivel conceder o papel agora." });
    } finally {
      setIsGrantingRole(false);
    }
  };

  const motionProps = reduceMotion
    ? {}
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
        variants: { visible: { transition: { staggerChildren: 0.05 } } },
      };

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="border-b border-slate-200 bg-[#0f172a] text-white dark:border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <Link href="/gestao-igreja" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                <Icon size={15} className="text-[#d8b15f]" />
                {config.eyebrow}
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">{config.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{config.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {getPhaseMetrics(phase, teamCards, roleCards, notificationCards).map((metric, metricIndex) => (
                <div key={`${metric.label}-${metricIndex}`} className="rounded-lg border border-white/15 bg-white/8 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{metric.label}</p>
                  <p className="mt-3 text-3xl font-black">{metric.value}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{metric.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_0.75fr]">
        {isLoadingTeams || isLoadingRoles || isLoadingNotifications ? (
          <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            Carregando dados da igreja...
          </div>
        ) : null}
        <motion.div {...motionProps} className="grid gap-4">
          {renderPhaseCards(phase, teamCards, roleCards, notificationCards, setInviteTeam)}
        </motion.div>

        <aside className="space-y-4">
          {phase === "equipes" ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Nova equipe</p>
                  <h2 className="mt-1 text-2xl font-black">Criar grupo</h2>
                </div>
                <Plus size={22} className="text-[#9a7a2f]" />
              </div>

              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                A lista de equipes permanece focada em capacidade, lideranca e vagas. Cadastros e edicoes acontecem em tela propria.
              </p>
              {missingInitialTeams.length > 0 ? (
                <button
                  type="button"
                  onClick={seedInitialTeams}
                  disabled={isSeedingTeams}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  <Users size={16} />
                  {isSeedingTeams ? "Criando times" : "Criar times iniciais"}
                </button>
              ) : null}
              <Link href="/gestao-igreja/equipes/nova" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
                <Plus size={16} />
                Nova equipe
              </Link>
              {teamFeedback ? (
                <p className={`mt-4 rounded-lg border p-3 text-sm font-semibold leading-6 ${
                  teamFeedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100"
                    : teamFeedback.type === "error"
                      ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100"
                      : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                }`}>
                  {teamFeedback.message}
                </p>
              ) : null}
            </section>
          ) : null}

          {phase === "permissoes" ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Novo papel</p>
                  <h2 className="mt-1 text-2xl font-black">Conceder role</h2>
                </div>
                <KeyRound size={22} className="text-[#9a7a2f]" />
              </div>

              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                A tela de permissoes mostra perfis, escopos e guarda-corpos. A concessao de um novo papel acontece em uma tela dedicada.
              </p>
              <Link href="/gestao-igreja/permissoes/nova" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
                <Plus size={16} />
                Nova permissao
              </Link>
            </section>
          ) : null}

          {phase === "insignias" ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Padrao BibliaLM</p>
                  <h2 className="mt-1 text-2xl font-black">Conquistas oficiais</h2>
                </div>
                <Medal size={22} className="text-[#9a7a2f]" />
              </div>
              <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                <p>As insignias desta area sao conquistas oficiais do BibliaLM para voluntarios, lideres e pastores.</p>
                <p>A igreja nao cria, edita ou concede selos manualmente. O app registra conquistas a partir de eventos auditaveis, como designacoes aceitas, servico concluido e responsabilidades exercidas.</p>
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-semibold dark:border-white/10 dark:bg-white/10">
                  O papel da gestao e acompanhar sinais de servico; o reconhecimento permanece padronizado para proteger consistencia, privacidade e evitar competicao espiritual.
                </p>
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck size={22} className="text-emerald-600 dark:text-emerald-300" />
              <h2 className="text-xl font-black">Guarda-corpo</h2>
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {getGuardrails(phase).map((item) => (
                <p key={item} className="flex gap-3">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  {item}
                </p>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center gap-3">
              <Bell size={22} className="text-[#9a7a2f]" />
              <h2 className="text-xl font-black">Proxima fase real</h2>
            </div>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              Persistir em services com `getSummary`, `list` paginado e `getDetails`, usando projection explicita e RLS por igreja/escopo.
            </p>
            <Link href="/gestao-igreja/inbox" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
              Ver inbox
              <ChevronRight size={16} />
            </Link>
          </section>
        </aside>
      </section>
      {inviteTeam ? (
        <TeamInviteModal
          team={inviteTeam}
          churchId={activeChurchId ?? null}
          currentUserId={currentUserId}
          onClose={() => setInviteTeam(null)}
        />
      ) : null}
    </main>
  );
}

function getPhaseMetrics(phase: OperationalPhase, teams: TeamCard[], roles: RoleCard[], notifications: NotificationCard[]) {
  if (phase === "equipes") {
    return [
      { label: "Equipes", value: String(teams.length), detail: "Operacionais" },
      { label: "Voluntarios", value: String(teams.reduce((sum, item) => sum + item.members, 0)), detail: "Distribuidos" },
      { label: "Vagas", value: String(teams.reduce((sum, item) => sum + item.openSpots, 0)), detail: "Abertas" },
    ];
  }
  if (phase === "permissoes") {
    return [
      { label: "Perfis", value: String(roles.length), detail: "Por igreja" },
      { label: "Pessoas", value: String(roles.reduce((sum, item) => sum + item.people, 0)), detail: "Com role" },
      { label: "Sensivel", value: String(roles.filter((role) => role.canSeeSensitiveCare).length), detail: "Role pastoral" },
    ];
  }
  if (phase === "notificacoes") {
    return [
      { label: "Eventos", value: String(notifications.length), detail: "Mapeados" },
      { label: "Acionaveis", value: String(notifications.filter((item) => item.severity === "Acao" || item.severity === "Urgente").length), detail: "Exigem resposta" },
      { label: "Canais", value: String(new Set(notifications.map((item) => item.channel)).size), detail: "Gestao e membro" },
    ];
  }
  return [
    { label: "Insignias", value: String(churchBadgeRulesPreview.length), detail: "Iniciais" },
    { label: "Padrao", value: "App", detail: "Nao editavel pela igreja" },
    { label: "Perfis", value: "3", detail: "Voluntario, Lider e Pastor" },
  ];
}

function renderPhaseCards(
  phase: OperationalPhase,
  teams: TeamCard[],
  roles: RoleCard[],
  notifications: NotificationCard[],
  onInviteTeam: (team: TeamCard) => void,
) {
  if (phase === "equipes") {
    if (teams.length === 0) {
      return <EmptyPhase title="Nenhuma equipe cadastrada" text="Crie a primeira equipe para organizar lideres, voluntarios, capacidade e designacoes." href="/gestao-igreja/equipes/nova" action="Nova equipe" />;
    }
    return teams.map((team) => {
      const Icon = team.icon;
      return (
        <motion.article key={team.id} variants={cardMotion} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950"><Icon size={21} /></span>
              <div>
                <h2 className="text-lg font-black">{team.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{team.description}</p>
              </div>
            </div>
            <span className="w-fit rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-200">{team.health}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              ["Area", team.area],
              ["Lider", team.leader],
              ["Membros", String(team.members)],
              ["Vagas", String(team.openSpots)],
            ].map(([label, value]) => <InfoTile key={label} label={label} value={value} />)}
          </div>
          <Link href={`/gestao-igreja/equipes/${team.id}/editar`} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
            Editar equipe
          </Link>
          <button
            type="button"
            onClick={() => onInviteTeam(team)}
            className="ml-0 mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
          >
            <AtSign size={15} />
            Convidar
          </button>
          <Link href={`/gestao-igreja/equipes/${team.id}`} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
            Ver detalhe
          </Link>
        </motion.article>
      );
    });
  }

  if (phase === "permissoes") {
    return roles.map((role) => {
      const Icon = role.icon;
      return (
        <motion.article key={role.id} variants={cardMotion} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950"><Icon size={21} /></span>
            <div>
              <h2 className="text-lg font-black">{role.profile}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{role.description}</p>
              <p className="mt-3 rounded-lg border border-slate-200 p-3 text-sm leading-7 text-slate-600 dark:border-white/10 dark:text-slate-300">{role.guardrail}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              ["Escopo", role.scope],
              ["Pessoas", String(role.people)],
              ["Cuidado sensivel", role.canSeeSensitiveCare ? "Sim" : "Nao"],
              ["Operacao", role.canManageOperations ? "Sim" : "Nao"],
            ].map(([label, value]) => <InfoTile key={label} label={label} value={value} />)}
          </div>
          {role.editableRoleId ? (
            <>
              <Link href={`/gestao-igreja/permissoes/${role.editableRoleId}/editar`} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                Editar permissao
              </Link>
              <Link href={`/gestao-igreja/permissoes/${role.editableRoleId}`} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                Ver detalhe
              </Link>
            </>
          ) : (
            <p className="mt-4 rounded-lg border border-dashed border-slate-200 p-3 text-xs font-black uppercase tracking-wider text-slate-500 dark:border-white/10 dark:text-slate-400">
              Nenhum usuario ativo neste papel.
            </p>
          )}
        </motion.article>
      );
    });
  }

  if (phase === "notificacoes") {
    if (notifications.length === 0) {
      return <EmptyPhase title="Nenhum alerta registrado" text="Os alertas reais aparecem aqui quando QR, inbox, designacoes e permissoes gerarem eventos." href="/gestao-igreja/notificacoes" action="Abrir central" />;
    }
    return notifications.map((notification) => {
      const Icon = notification.icon;
      return (
        <motion.article key={notification.id} variants={cardMotion} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950"><Icon size={21} /></span>
              <div>
                <h2 className="text-lg font-black">{notification.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{notification.text}</p>
              </div>
            </div>
            <span className="w-fit rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-200">{notification.severity}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              ["Publico", notification.audience],
              ["Gatilho", notification.trigger],
              ["Canal", notification.channel],
              ["Dedupe", notification.dedupeKey],
            ].map(([label, value]) => <InfoTile key={label} label={label} value={value} />)}
          </div>
        </motion.article>
      );
    });
  }

  return churchBadgeRulesPreview.map((badge) => {
    const Icon = badge.icon;
    return (
      <motion.article key={badge.title} variants={cardMotion} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950"><Icon size={21} /></span>
          <div>
            <h2 className="text-lg font-black">{badge.title}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{badge.rule}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Criterio", badge.manaLimit],
            ["Visibilidade", badge.visibility],
            ["Origem", "Padrao BibliaLM"],
          ].map(([label, value]) => <InfoTile key={label} label={label} value={value} />)}
        </div>
      </motion.article>
    );
  });
}

function TeamInviteModal({
  team,
  churchId,
  currentUserId,
  onClose,
}: {
  team: TeamCard;
  churchId: string | null;
  currentUserId: string | null;
  onClose: () => void;
}) {
  const [qrForm, setQrForm] = useState<ChurchQrForm | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [inviteLoadingId, setInviteLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const publicQrUrl = qrForm && typeof window !== "undefined" ? `${window.location.origin}/qr/${qrForm.token}` : "";
  const qrImageUrl = publicQrUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicQrUrl)}` : "";

  const ensureVolunteerQr = async () => {
    if (!churchId) {
      setFeedback({ type: "info", message: "Vincule uma igreja ativa para gerar QR Code do time." });
      return null;
    }
    if (qrForm) return qrForm;

    setQrLoading(true);
    setFeedback(null);
    try {
      const existingForms = await churchManagementService.listQrForms(churchId, { limit: 100 });
      const existing = existingForms.find((form) =>
        form.formType === "volunteer" &&
        form.destination === `team:${team.id}` &&
        form.status === "active"
      );
      if (existing) {
        setQrForm(existing);
        setFeedback({ type: "success", message: "QR Code existente reutilizado para este time." });
        return existing;
      }

      const validityDays = 30;
      const created = await churchManagementService.createQrForm({
        churchId,
        title: `Voluntariado - ${team.title}`,
        formType: "volunteer",
        description: `Convite para servir no ${team.title}. Area: ${team.area}.`,
        destination: `team:${team.id}`,
        fields: [
          { label: "Nome", type: "text", required: true },
          { label: "Contato", type: "tel", required: true },
          { label: "Disponibilidade", type: "textarea" },
        ],
        privacyText: "Sua resposta sera recebida pela equipe responsavel da igreja.",
        confirmationText: `Recebemos seu interesse em servir no ${team.title}. A lideranca dara retorno quando houver proxima acao.`,
        expiresAt: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: currentUserId,
      });
      setQrForm(created);
      setFeedback({ type: "success", message: "QR Code de voluntariado criado para este time." });
      return created;
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Nao foi possivel gerar o QR Code." });
      return null;
    } finally {
      setQrLoading(false);
    }
  };

  const copyInviteLink = async () => {
    const form = await ensureVolunteerQr();
    if (!form || typeof window === "undefined") return;
    const link = `${window.location.origin}/qr/${form.token}`;
    if (navigator.clipboard) await navigator.clipboard.writeText(link);
    setFeedback({ type: "success", message: "Link do convite copiado." });
  };

  const printQr = async () => {
    const form = await ensureVolunteerQr();
    if (!form || typeof window === "undefined") return;
    window.print();
  };

  const searchUsers = async () => {
    const term = userSearch.trim().replace(/^@/, "");
    if (term.length < 2) {
      setFeedback({ type: "info", message: "Digite pelo menos 2 caracteres para pesquisar." });
      return;
    }
    setSearchingUsers(true);
    setFeedback(null);
    try {
      const results = await dbService.searchUsersGlobal(term);
      setUsers(results.slice(0, 8));
      if (results.length === 0) setFeedback({ type: "info", message: "Nenhum usuario encontrado para esse termo." });
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Nao foi possivel pesquisar usuarios." });
    } finally {
      setSearchingUsers(false);
    }
  };

  const inviteUser = async (user: UserProfile) => {
    if (!churchId) {
      setFeedback({ type: "info", message: "Vincule uma igreja ativa para convidar usuarios." });
      return;
    }
    setInviteLoadingId(user.uid);
    setFeedback(null);
    try {
      await churchManagementService.createAssignment({
        churchId,
        teamId: team.id,
        title: `Convite para ${team.title}`,
        description: `Convite para servir no ${team.title}. Area: ${team.area}.`,
        scopeType: "team",
        scopeId: team.id,
        assigneeUserId: user.uid,
        leaderUserId: currentUserId,
        publicFeedback: `Voce foi convidado para servir no ${team.title}. Confirme sua disponibilidade para a lideranca acompanhar.`,
        createdBy: currentUserId,
      });
      setFeedback({ type: "success", message: `${user.displayName || user.username || "Usuario"} convidado para o time.` });
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Nao foi possivel enviar o convite." });
    } finally {
      setInviteLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b111d]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-white/10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Convidar voluntarios</p>
            <h2 className="mt-1 text-2xl font-black">{team.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{team.area}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
          >
            Fechar
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <section className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
              <div className="print:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">QR de voluntariado</p>
                <h3 className="mt-1 text-lg font-black">{team.title}</h3>
                {qrForm ? (
                  <div className="mt-4">
                    <img src={qrImageUrl} alt={`QR Code ${team.title}`} className="mx-auto h-52 w-52 rounded-lg border border-slate-200 bg-white p-2" />
                    <p className="mt-3 break-all text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{publicQrUrl}</p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-5 text-center dark:border-white/15">
                    <QrCode size={36} className="mx-auto text-slate-400" />
                    <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Nenhum QR carregado para este time.</p>
                  </div>
                )}
              </div>
              <div className="mt-4 grid gap-2 print:hidden">
                <button type="button" onClick={ensureVolunteerQr} disabled={qrLoading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950">
                  <QrCode size={15} />
                  {qrLoading ? "Gerando" : qrForm ? "Reutilizar QR" : "Gerar QR"}
                </button>
                <button type="button" onClick={printQr} disabled={qrLoading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                  <Printer size={15} />
                  Imprimir QR
                </button>
                <button type="button" onClick={copyInviteLink} disabled={qrLoading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                  <Link2 size={15} />
                  Copiar link
                </button>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 p-4 dark:border-white/10 print:hidden">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Convidar usuario</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="@usuario, nome ou email"
                  className="min-h-11 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#d8b15f] focus:ring-2 focus:ring-[#d8b15f]/20 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
                <button type="button" onClick={searchUsers} disabled={searchingUsers} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950">
                  <AtSign size={15} />
                  {searchingUsers ? "Buscando" : "Buscar"}
                </button>
              </div>
              <div className="mt-4 grid gap-2">
                {users.map((user) => (
                  <article key={user.uid} className="flex flex-col gap-3 rounded-lg bg-slate-50 p-3 dark:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black">{user.displayName || "Usuario"}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">@{user.username || "sem-usuario"} - {user.email}</p>
                    </div>
                    <button type="button" onClick={() => inviteUser(user)} disabled={inviteLoadingId === user.uid} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-white disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                      {inviteLoadingId === user.uid ? "Enviando" : "Enviar invite"}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {feedback ? (
            <p className={`mt-4 rounded-lg border p-3 text-sm font-semibold leading-6 ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100"
                : feedback.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100"
                  : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
            }`}>
              {feedback.message}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function EmptyPhase({ title, text, href, action }: { title: string; text: string; href: string; action: string }) {
  return (
    <motion.article variants={cardMotion} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p>
      <Link href={href} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
        <Plus size={16} />
        {action}
      </Link>
    </motion.article>
  );
}

function getScopeLabel(scope: ChurchRoleScopeType) {
  const labels: Record<ChurchRoleScopeType, string> = {
    church: "Igreja",
    team: "Equipe",
    group: "Grupo",
    service: "Culto",
    event: "Evento",
  };
  return labels[scope];
}

function getRoleScopeSummary(roles: ChurchMemberRole[]) {
  if (roles.length === 0) return "Sem usuarios";
  const scopes = new Set(roles.map((role) => getScopeLabel(role.scopeType)));
  return Array.from(scopes).join(", ");
}

function getRoleDescription(role: ChurchOperationalRole) {
  const descriptions: Record<ChurchOperationalRole, string> = {
    church_manager: "Administra a operacao da igreja, equipes, QR Codes, pedidos e configuracoes permitidas.",
    pastor: "Acompanha cuidado pastoral e pode acessar conteudos sensiveis quando autorizado pela igreja.",
    leader: "Coordena pessoas e atividades dentro do escopo atribuido.",
    volunteer: "Recebe designacoes, participa de equipes e acompanha seu proprio servico.",
  };
  return descriptions[role];
}

function getRoleGuardrail(role: ChurchOperationalRole) {
  const guardrails: Record<ChurchOperationalRole, string> = {
    church_manager: "Gestor nao recebe acesso pastoral sensivel automaticamente.",
    pastor: "Pastor nao vira gestor administrativo automaticamente.",
    leader: "Lider deve operar apenas dentro do escopo recebido.",
    volunteer: "Voluntario ve suas proprias atividades, nao dados administrativos.",
  };
  return guardrails[role];
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

function getGuardrails(phase: OperationalPhase) {
  if (phase === "equipes") {
    return ["Equipe nao concede permissao sensivel sozinha.", "Lider ve apenas o escopo da propria equipe.", "Vagas e convites geram alertas acionaveis."];
  }
  if (phase === "permissoes") {
    return ["Plano comercial nao e role de igreja.", "Pastor nao vira gestor automaticamente.", "Gestor nao ve cuidado sensivel sem permissao pastoral."];
  }
  if (phase === "notificacoes") {
    return ["Eventos repetidos devem usar dedupe_key.", "Notificacao informativa e alerta acionavel sao coisas diferentes.", "Membro recebe feedback sem bastidores internos."];
  }
  return ["Insignia e selo sao padroes do BibliaLM, nao configuracao da igreja.", "Conquistas dependem de eventos auditaveis e regras do app.", "Ranking individual publico fica fora do MVP."];
}
