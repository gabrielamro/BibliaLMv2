"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  BookOpen,
  BookMarked,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Church,
  Clock3,
  Coffee,
  FileImage,
  FileText,
  Heart,
  History,
  Home,
  LayoutDashboard,
  LifeBuoy,
  LibraryBig,
  Loader2,
  LogOut,
  MessageCircle,
  Moon,
  Music2,
  NotebookPen,
  PenLine,
  Plus,
  QrCode,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  UserRound,
  UserCircle,
  Users,
  Wand2,
  X,
  Sun,
} from "lucide-react";
import CultoPlusBrand from "../components/CultoPlusBrand";
import AppViewSwitcher from "../components/AppViewSwitcher";
import ManagerNotificationCenter from "../components/church-management/ManagerNotificationCenter";
import { useAuth } from "../contexts/AuthContext";
import { useHeader } from "../contexts/HeaderContext";
import { useSettings } from "../contexts/SettingsContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { DAILY_BIBLE_VERSES, type AppModuleId } from "../constants";
import { dbService } from "../services/supabase";
import { cultoPlusService } from "../services/cultoPlusService";
import { churchManagementService, type UserCultoAssignment } from "../services/churchManagementService";
import type { ChurchAssignment, ChurchMemberRole, ChurchService, CustomPlan } from "../types";
import { canAccessPastoralWorkspace, isGeneralManager, isGeneralPastor } from "../utils/profileAccess";
import { canAccessChurchManagement } from "../utils/churchManagementRules";
import { getReadingGoalProgress } from "../utils/inicioHome";
import { getNewHomeTabModule } from "../utils/moduleTheme";

type HomeTab = "inicio" | "criar" | "reino" | "gestao" | "calendario";
type ShelfFilter = "all" | "study" | "plan" | "note";
type ShelfItem = {
  id: string;
  type: "study" | "plan" | "note";
  title: string;
  status?: string;
  updatedAt?: string;
  coverUrl?: string;
  isEnrolled?: boolean;
  progress?: number;
};
type HomeWeekItem = {
  id: string;
  title: string;
  date: string;
  meta: string;
  href: string;
  isConfirmedAssignment: boolean;
};
const tabs: Array<{ id: HomeTab; module: AppModuleId; label: string; icon: React.ElementType }> = [
  { id: "inicio", module: "home", label: "Início", icon: Home },
  { id: "criar", module: "create", label: "Criar", icon: Wand2 },
  { id: "reino", module: "kingdom", label: "Reino", icon: Users },
  { id: "gestao", module: "management", label: "Gestão", icon: LayoutDashboard },
  { id: "calendario", module: "cultos", label: "Calendário", icon: CalendarDays },
];

const shortcuts: Array<{ label: string; description: string; path: string; icon: React.ElementType; module: AppModuleId }> = [
  { label: "Bíblia", description: "Leia e aprofunde-se na Palavra", path: "/bibliasagrada", icon: BookOpen, module: "bible" },
  { label: "Estudos", description: "Estudos guiados e reflexões", path: "/estudos", icon: BookMarked, module: "bible" },
  { label: "Pão Diário", description: "Reflexão para o seu dia", path: "/devocional", icon: Coffee, module: "bible" },
  { label: "Orações", description: "Ore e interceda pela igreja", path: "/oracoes", icon: Heart, module: "bible" },
  { label: "Reino", description: "Conecte-se com a comunidade", path: "/social", icon: Users, module: "kingdom" },
  { label: "Estúdio Criativo", description: "Crie artes, áudio e estudos", path: "/newhome?tab=criar", icon: Wand2, module: "create" },
  { label: "Conselheiro IA", description: "Converse e receba orientações", path: "/chat", icon: MessageCircle, module: "neutral" },
  { label: "Quiz", description: "Teste seus conhecimentos", path: "/quiz", icon: Brain, module: "bible" },
];

type SidebarSubItem = { label: string; path: string; icon: React.ElementType; pastorOnly?: boolean; managerOnly?: boolean; volunteerOnly?: boolean };
type SidebarModule = {
  module: AppModuleId;
  label: string;
  path: string;
  icon: React.ElementType;
  pastorOnly?: boolean;
  children: SidebarSubItem[];
};

const sidebarItems: SidebarModule[] = [
  { module: "home", label: "Início", path: "/newhome", icon: Home, children: [
    { label: "Visão geral", path: "/newhome", icon: Home }, { label: "Criar", path: "/newhome?tab=criar", icon: Wand2 }, { label: "Reino", path: "/newhome?tab=reino", icon: Users }, { label: "Gestão", path: "/newhome?tab=gestao", icon: LayoutDashboard }, { label: "Calendário", path: "/newhome?tab=calendario", icon: CalendarDays }, { label: "Mapa Vivo", path: "/mapa-vivo", icon: Sparkles },
  ] },
  { module: "bible", label: "Bíblia", path: "/bibliasagrada", icon: BookOpen, children: [
    { label: "Bíblia Sagrada", path: "/bibliasagrada", icon: BookOpen }, { label: "Meta de leitura", path: "/plano", icon: Target }, { label: "Pão Diário", path: "/devocional", icon: Coffee }, { label: "Meus Estudos", path: "/estudos", icon: BookMarked }, { label: "Anotações", path: "/notes", icon: NotebookPen }, { label: "Quiz Bíblico", path: "/quiz", icon: Brain },
  ] },
  { module: "kingdom", label: "Reino", path: "/social", icon: Users, children: [
    { label: "Feed", path: "/social", icon: Users }, { label: "Orações", path: "/social/oracao", icon: Heart }, { label: "Igrejas", path: "/social/igrejas", icon: Church }, { label: "Explorar", path: "/social/explore", icon: Search }, { label: "Artigos", path: "/social/artigos", icon: FileText }, { label: "Meu perfil", path: "/perfil", icon: UserRound },
  ] },
  { module: "cultos", label: "Cultos", path: "/meus-cultos", icon: CalendarDays, children: [
    { label: "Agenda de cultos", path: "/culto", icon: CalendarDays }, { label: "Meu painel", path: "/meus-cultos", icon: Home }, { label: "Minha escala", path: "/meus-cultos#escala", icon: Check }, { label: "Minhas equipes", path: "/meus-cultos#equipes", icon: Users }, { label: "Solicitações", path: "/meus-cultos#solicitacoes", icon: BookMarked },
  ] },
  { module: "create", label: "Criar", path: "/newhome?tab=criar", icon: PenLine, children: [
    { label: "Estúdio Criativo", path: "/newhome?tab=criar", icon: Sparkles }, { label: "Criar estudo", path: "/criar-conteudo", icon: NotebookPen }, { label: "Criar arte sacra", path: "/criar-arte-sacra", icon: FileImage }, { label: "Criar podcast", path: "/criar-podcast", icon: Music2 }, { label: "Criar sala", path: "/criar-sala", icon: Users, pastorOnly: true }, { label: "Histórico", path: "/historico", icon: History },
  ] },
  { module: "pastoral", label: "Workspace Pastoral", path: "/workspace-pastoral", icon: Church, pastorOnly: true, children: [
    { label: "Painel pastoral", path: "/workspace-pastoral", icon: LayoutDashboard }, { label: "Minhas salas", path: "/workspace-pastoral", icon: Users }, { label: "Criar sala", path: "/criar-sala", icon: Plus }, { label: "Acervo", path: "/acervo", icon: LibraryBig }, { label: "Gerenciar cultos", path: "/workspace-pastoral/cultos", icon: CalendarDays }, { label: "Novo culto", path: "/workspace-pastoral/cultos/novo", icon: PenLine },
  ] },
  { module: "neutral", label: "Configurações", path: "/minha-conta", icon: Settings, children: [
    { label: "Minha conta", path: "/minha-conta", icon: Settings }, { label: "Meu perfil", path: "/perfil", icon: UserRound }, { label: "Planos", path: "/planos", icon: Target }, { label: "Manual do Maná", path: "/regras", icon: BookOpen }, { label: "Suporte", path: "/suporte", icon: MessageCircle }, { label: "Termos de uso", path: "/termos", icon: FileText }, { label: "Privacidade", path: "/privacidade", icon: ShieldCheck },
  ] },
];

function visibleSubItems(items: SidebarSubItem[], access: { isPastor: boolean; isVolunteer: boolean; canManage: boolean }) {
  return items.filter((item) => (!item.pastorOnly || access.isPastor) && (!item.volunteerOnly || access.isVolunteer) && (!item.managerOnly || access.canManage));
}

function visibleModules(items: SidebarModule[], access: { isPastor: boolean }) {
  return items.filter((item) => !item.pastorOnly || access.isPastor);
}

function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "Data a definir";
  return new Date(value).toLocaleDateString("pt-BR", options ?? { day: "2-digit", month: "short" });
}

function formatTime(value?: string | null) {
  if (!value) return "Horário a definir";
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function getAssignmentServiceId(assignment: ChurchAssignment) {
  if (assignment.scopeType === "service" && assignment.scopeId) return assignment.scopeId;

  if (assignment.sourceType === "gestao_culto_team") {
    return assignment.sourceId?.match(/^culto_team:([^:]+):/)?.[1] ?? null;
  }

  if (assignment.sourceType === "gestao_culto_member") {
    return assignment.sourceId?.match(/^culto_team_member:([^:]+):/)?.[1] ?? null;
  }

  return null;
}

function buildHomeWeekItems(services: ChurchService[], assignments: ChurchAssignment[]): HomeWeekItem[] {
  const confirmedAssignments = assignments.filter((assignment) => assignment.status === "accepted");
  const confirmedServiceIds = new Set(
    confirmedAssignments
      .map(getAssignmentServiceId)
      .filter((serviceId): serviceId is string => Boolean(serviceId)),
  );
  const confirmedStartTimes = new Set(
    confirmedAssignments
      .map((assignment) => assignment.startsAt ? new Date(assignment.startsAt).getTime() : Number.NaN)
      .filter(Number.isFinite),
  );

  return [...services]
    .sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime())
    .slice(0, 3)
    .map((service) => {
      const serviceStartTime = new Date(service.startsAt).getTime();
      const isConfirmedAssignment = confirmedServiceIds.has(service.id) || confirmedStartTimes.has(serviceStartTime);

      return {
        id: `service-${service.id}`,
        title: service.title,
        date: service.startsAt,
        meta: isConfirmedAssignment ? "Você está escalado" : service.status === "live" ? "Ao vivo" : "Culto da igreja",
        href: `/culto/${service.slug}`,
        isConfirmedAssignment,
      };
    });
}

function normalizeStudy(item: any): ShelfItem {
  let meta = item?.meta;
  try { if (typeof meta === "string") meta = JSON.parse(meta); } catch { meta = {}; }
  return {
    id: String(item?.id ?? item?.updatedAt ?? item?.createdAt ?? item?.title ?? "study"),
    type: "study",
    title: item?.title || meta?.title || "Estudo sem título",
    status: item?.status || "draft",
    updatedAt: item?.updatedAt || item?.updated_at || item?.createdAt || item?.created_at,
    coverUrl: item?.cover_image || item?.coverUrl || meta?.coverImage,
    progress: item?.progress,
  };
}

function normalizeNote(item: any): ShelfItem {
  return {
    id: String(item?.id ?? item?.updatedAt ?? item?.createdAt ?? item?.content ?? "note"),
    type: "note",
    title: item?.sourceStudyTitle || item?.title || String(item?.content || "Anotação").slice(0, 70),
    status: "note",
    updatedAt: item?.updatedAt || item?.updated_at || item?.createdAt || item?.created_at,
  };
}

function normalizePlan(item: CustomPlan, userId?: string): ShelfItem {
  return {
    id: item.id,
    type: "plan",
    title: item.title || "Sala sem título",
    status: item.status,
    updatedAt: item.updatedAt || item.createdAt,
    coverUrl: item.coverUrl,
    isEnrolled: Boolean(userId && item.authorId !== userId),
  };
}

export default function NewHomePage() {
  const { currentUser, userProfile, unreadNotificationsCount, openLogin, showNotification, signOut } = useAuth();
  const { settings, toggleTheme } = useSettings();
  const { plans, loading: workspaceLoading, isPastor } = useWorkspace();
  const { setIsHeaderHidden, resetHeader } = useHeader();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<HomeTab>(() => {
    const requested = searchParams.get("tab") as HomeTab | null;
    return tabs.some((tab) => tab.id === requested) ? requested! : "inicio";
  });
  const [search, setSearch] = useState("");
  const [shelfFilter, setShelfFilter] = useState<ShelfFilter>("all");
  const [shelfItems, setShelfItems] = useState<ShelfItem[]>([]);
  const [services, setServices] = useState<ChurchService[]>([]);
  const [assignments, setAssignments] = useState<ChurchAssignment[]>([]);
  const [assignmentContexts, setAssignmentContexts] = useState<UserCultoAssignment[]>([]);
  const [volunteerFormToken, setVolunteerFormToken] = useState<string | null>(null);
  const [roles, setRoles] = useState<ChurchMemberRole[]>([]);
  const [hasChurchManagementAccess, setHasChurchManagementAccess] = useState(false);
  const [managementChurchId, setManagementChurchId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const userId = currentUser?.uid ?? currentUser?.id;
  const churchId = userProfile?.churchData?.churchId;
  const activeOperationalRoles = roles.filter((role) => role.userId === userId && role.status === "active");
  const hasPastoralOperationalRole = activeOperationalRoles.some((role) => role.role === "pastor" || role.role === "church_manager");
  const isPastoralProfile = isPastor || canAccessPastoralWorkspace(userProfile) || hasPastoralOperationalRole;
  const canManageChurch = hasChurchManagementAccess;
  const isVolunteer = activeOperationalRoles.some((role) => role.role === "volunteer") || assignments.length > 0;
  const roleLabels = [
    (isGeneralPastor(userProfile) || activeOperationalRoles.some((role) => role.role === "pastor")) && "Pastor",
    (isGeneralManager(userProfile) || activeOperationalRoles.some((role) => role.role === "church_manager")) && "Gestor",
    activeOperationalRoles.some((role) => role.role === "leader") && "Líder",
    isVolunteer && "Voluntário",
  ].filter(Boolean) as string[];
  const userName = userProfile?.displayName?.split(" ")[0] || "Visitante";
  const avatar = userProfile?.photoURL || currentUser?.user_metadata?.avatar_url;
  const verseOfDay = useMemo(() => DAILY_BIBLE_VERSES[new Date().getDate() % DAILY_BIBLE_VERSES.length], []);
  const readingProgress = getReadingGoalProgress(userProfile?.stats?.totalChaptersRead || 0, 365).percent;
  const isAdmin = userProfile?.username === "gabrielamaro" || currentUser?.email === "gabrielamaro@live.com";

  useEffect(() => {
    setIsHeaderHidden(true);
    return () => {
      setIsHeaderHidden(false);
      resetHeader();
    };
  }, [resetHeader, setIsHeaderHidden]);

  useEffect(() => {
    const requested = searchParams.get("tab") as HomeTab | null;
    const nextTab = requested && tabs.some((tab) => tab.id === requested) ? requested : "inicio";
    setActiveTab((current) => current === nextTab ? current : nextTab);
  }, [searchParams]);

  useEffect(() => {
    try { sessionStorage.setItem("newhome_active_tab", activeTab); } catch { /* Navegação continua funcional sem storage. */ }
    const url = activeTab === "inicio" ? "/newhome" : `/newhome?tab=${activeTab}`;
    window.history.replaceState(null, "", url);
  }, [activeTab]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!userId) {
        setShelfItems([]);
        setServices([]);
        setAssignments([]);
        setAssignmentContexts([]);
        setVolunteerFormToken(null);
        setRoles([]);
        setLoadingData(false);
        return;
      }
      setLoadingData(true);
      setLoadError(false);
      setVolunteerFormToken(null);
      try {
        const enrolledIds = Array.from(new Set([
          ...((userProfile as any)?.enrolledPlans || []),
          ...((userProfile as any)?.enrolled_plans || []),
        ].filter(Boolean)));
        const start = new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + 30);
        const [studies, publicStudies, notes, serviceNotes, enrolledPlans, churchServices, churchAssignments, churchRoles, churchForms] = await Promise.all([
          dbService.getAll(userId, "studies"),
          dbService.getAll(userId, "public_studies"),
          dbService.getAll(userId, "notes"),
          cultoPlusService.getUserNotes(userId),
          dbService.getEnrolledPlans(enrolledIds),
          churchId ? cultoPlusService.getServicesByChurchRange(churchId, {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            status: ["published", "live", "finished"],
            limit: 6,
          }) : Promise.resolve([]),
          churchId ? churchManagementService.listUserCultoAssignments(churchId, userId, 12) : Promise.resolve([]),
          churchId ? churchManagementService.listRoles(churchId, { limit: 150 }) : Promise.resolve([]),
          churchId ? churchManagementService.listQrForms(churchId, { limit: 25 }).catch(() => []) : Promise.resolve([]),
        ]);
        if (!mounted) return;
        const combined = [
          ...(studies as any[]).map(normalizeStudy),
          ...(publicStudies as any[]).map(normalizeStudy),
          ...(notes as any[]).map(normalizeNote),
          ...(serviceNotes as any[]).map(normalizeNote),
          ...plans.map((plan) => normalizePlan(plan, userId)),
          ...(enrolledPlans as CustomPlan[]).filter((plan) => plan.authorId !== userId).map((plan) => normalizePlan(plan, userId)),
        ].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        setShelfItems(combined.slice(0, 24));
        setServices(churchServices);
        setAssignmentContexts(churchAssignments);
        setAssignments(churchAssignments.map((item) => item.assignment));
        const now = Date.now();
        const volunteerForm = churchForms.find((form) => (
          form.formType === "volunteer"
          && form.status === "active"
          && (!form.expiresAt || new Date(form.expiresAt).getTime() >= now)
        ));
        setVolunteerFormToken(volunteerForm?.token ?? null);
        setRoles(churchRoles.filter((role) => role.userId === userId));
      } catch {
        if (!mounted) return;
        setLoadError(true);
        setVolunteerFormToken(null);
        setAssignmentContexts([]);
        setShelfItems(plans.map((plan) => normalizePlan(plan, userId)));
      } finally {
        if (mounted) setLoadingData(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [churchId, plans, userId, userProfile]);

  // Keep the Home switcher consistent with the route gate, including legacy
  // church admins and approved responsibilities that have not synced to the profile yet.
  useEffect(() => {
    let mounted = true;
    const loadManagementAccess = async () => {
      if (!userId || userProfile?.subscriptionTier === "admin") {
        if (mounted) {
          setHasChurchManagementAccess(userProfile?.subscriptionTier === "admin");
          setManagementChurchId(churchId ?? null);
        }
        return;
      }

      try {
        const approvedChurch = churchId ? null : await dbService.getApprovedChurchResponsibility(userId);
        const resolvedChurchId = churchId ?? approvedChurch?.id;
        if (!resolvedChurchId) {
          if (mounted) {
            setHasChurchManagementAccess(false);
            setManagementChurchId(null);
          }
          return;
        }

        const [churchRoles, church] = await Promise.all([
          churchManagementService.listRoles(resolvedChurchId, { limit: 150 }),
          dbService.getChurchById(resolvedChurchId),
        ]);
        const isChurchAdmin = Array.isArray(church?.admins) && church.admins.includes(userId);
        if (mounted) {
          setManagementChurchId(resolvedChurchId);
          setHasChurchManagementAccess(canAccessChurchManagement({
            userId,
            roles: churchRoles,
            isPlatformAdmin: false,
            isChurchAdmin,
          }));
        }
      } catch {
        if (mounted) {
          setHasChurchManagementAccess(false);
          setManagementChurchId(null);
        }
      }
    };

    loadManagementAccess();
    return () => { mounted = false; };
  }, [churchId, userId, userProfile?.subscriptionTier]);

  const filteredShelf = useMemo(() => shelfItems.filter((item) => shelfFilter === "all" || item.type === shelfFilter).slice(0, 8), [shelfFilter, shelfItems]);
  const ownedPlans = useMemo(() => plans.filter((plan) => !userId || plan.authorId === userId), [plans, userId]);
  const pendingAssignments = assignments.filter((assignment) => assignment.status === "pending");
  const acceptedAssignments = assignments.filter((assignment) => assignment.status === "accepted");
  const nextAssignment = pendingAssignments[0] || acceptedAssignments[0];
  const nextAssignmentContext = nextAssignment
    ? assignmentContexts.find((item) => item.assignment.id === nextAssignment.id)
    : undefined;

  const changeTab = (tab: HomeTab) => setActiveTab(tab);
  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const term = search.trim();
    if (!term) return;
    window.location.href = `/bibliasagrada?search=${encodeURIComponent(term)}`;
  };

  const respondToAssignment = async (assignment: ChurchAssignment, response: "accepted" | "declined") => {
    if (!userId) return;
    try {
      const updated = await churchManagementService.respondToAssignment(assignment.id, userId, response);
      setAssignments((items) => items.map((item) => item.id === updated.id ? updated : item));
      setAssignmentContexts((items) => items.map((item) => item.assignment.id === updated.id ? { ...item, assignment: updated } : item));
      showNotification(response === "accepted" ? "Escala aceita." : "Escala recusada.", "success");
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Não foi possível responder à escala.", "error");
    }
  };

  return (
    <div id="newhome-root" data-module={getNewHomeTabModule(activeTab)} className="newhome-shell min-h-screen transition-colors">
      <div className="flex min-h-screen">
        <NewHomeSidebar userName={userProfile?.displayName || "Visitante"} avatar={avatar} isPastor={isPastoralProfile} isVolunteer={isVolunteer} canManage={canManageChurch} roleLabels={roleLabels} />
        <div className="min-w-0 flex-1">
          <header className="mx-auto max-w-[1440px] px-4 pb-2 pt-5 md:px-8 lg:px-10">
            <div className="mb-5 flex items-center justify-between lg:hidden">
              <CultoPlusBrand className="!h-16" />
              <div className="flex items-center gap-3">
                {canManageChurch ? <ManagerNotificationCenter churchId={managementChurchId ?? churchId} /> : null}
                <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
                  <Bell size={20} />
                  {unreadNotificationsCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500" />}
                </span>
                {avatar ? <img src={avatar} alt={userName} className="h-11 w-11 rounded-full object-cover" /> : <span className="module-icon flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold">{userName.slice(0, 2).toUpperCase()}</span>}
                <HomeSettingsMenu
                  currentUser={Boolean(currentUser)}
                  isAdmin={isAdmin}
                  isPastor={isPastoralProfile}
                  canManage={canManageChurch}
                  includeViewSwitcher
                  theme={settings.theme}
                  onToggleTheme={toggleTheme}
                  onLogin={openLogin}
                  onSignOut={signOut}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <form onSubmit={submitSearch} className="relative min-w-0 flex-1 lg:max-w-[620px] xl:max-w-[700px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar na Bíblia, estudos, pessoas..." className="newhome-input module-focus min-h-12 w-full rounded-2xl border px-12 text-sm outline-none transition" />
              </form>
              <div className="hidden shrink-0 items-center gap-3 lg:flex">
                <h1 data-testid="home-welcome" className="mr-1 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
                  Bem-vindo, <strong className="font-black text-inherit">{userName}</strong>
                </h1>
                {canManageChurch ? <ManagerNotificationCenter churchId={managementChurchId ?? churchId} /> : null}
                <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
                  <Bell size={20} />
                  {unreadNotificationsCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />}
                </span>
                {avatar ? <img src={avatar} alt={userName} className="h-11 w-11 rounded-full object-cover" /> : <span className="module-icon flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold">{userName.slice(0, 2).toUpperCase()}</span>}
                <HomeSettingsMenu
                  currentUser={Boolean(currentUser)}
                  isAdmin={isAdmin}
                  isPastor={isPastoralProfile}
                  canManage={canManageChurch}
                  theme={settings.theme}
                  onToggleTheme={toggleTheme}
                  onLogin={openLogin}
                  onSignOut={signOut}
                />
              </div>
            </div>
          </header>

          <HomeTabs activeTab={activeTab} onChange={changeTab} />
          <MobileModuleSubmenus isPastor={isPastoralProfile} isVolunteer={isVolunteer} canManage={canManageChurch} />

          <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-6 md:px-8 lg:px-10 lg:pb-14">
            {activeTab === "inicio" && (
              <HomeOverviewV2
                currentUser={Boolean(currentUser)}
                verse={verseOfDay}
                readingProgress={readingProgress}
                services={services}
                assignments={assignments}
                volunteerFormToken={volunteerFormToken}
                nextAssignment={nextAssignment}
                nextAssignmentContext={nextAssignmentContext}
                isVolunteer={isVolunteer}
                isPastor={isPastoralProfile}
                ownedPlans={ownedPlans}
                shelfFilter={shelfFilter}
                onShelfFilter={setShelfFilter}
                shelfItems={filteredShelf}
                loading={loadingData || (Boolean(currentUser) && workspaceLoading)}
                loadError={loadError}
                onLogin={openLogin}
                onRespond={respondToAssignment}
              />
            )}
            {activeTab === "criar" && <CreateTabV2 isPastor={isPastoralProfile} currentUser={Boolean(currentUser)} onLogin={openLogin} />}
            {activeTab === "reino" && <KingdomTabV2 />}
            {activeTab === "gestao" && <ManagementTabV2 canManage={canManageChurch} hasChurch={Boolean(churchId)} />}
            {activeTab === "calendario" && <CalendarTabV2 services={services} assignments={assignments} loading={loadingData} />}
          </main>
        </div>
      </div>
    </div>
  );
}

function NewHomeSidebar({ userName, avatar, isPastor, isVolunteer, canManage, roleLabels }: { userName: string; avatar?: string | null; isPastor: boolean; isVolunteer: boolean; canManage: boolean; roleLabels: string[] }) {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ "Início": true });
  const toggleMenu = (label: string) => setOpenMenus((current) => ({ ...current, [label]: !current[label] }));
  const modules = visibleModules(sidebarItems, { isPastor });
  return (
    <aside className="newhome-chrome sticky top-0 hidden h-screen w-[256px] shrink-0 flex-col border-r px-4 py-6 lg:flex">
      <CultoPlusBrand className="!h-20" />
      <UserViewSwitcher isPastor={isPastor} canManage={canManage} />
      <nav aria-label="Navegação principal da visão pessoal" className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 no-scrollbar">
        {modules.map((item) => {
          const Icon = item.icon;
          const expanded = Boolean(openMenus[item.label]);
          const children = visibleSubItems(item.children, { isPastor, isVolunteer, canManage });
          return <div key={item.label} data-module-theme={item.module} className="rounded-xl">
            <div className={`flex items-center rounded-xl border-l-4 transition ${expanded ? "module-nav-active" : "module-nav-link border-transparent"}`}>
              <Link href={item.path} className="module-focus flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-lg px-2.5 text-sm font-semibold"><span className="module-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"><Icon size={19} /></span><span className="truncate">{item.label}</span></Link>
              <button type="button" onClick={() => toggleMenu(item.label)} aria-expanded={expanded} aria-controls={`submenu-${item.label.replace(/\s+/g, "-").toLowerCase()}`} aria-label={`${expanded ? "Recolher" : "Expandir"} submenu ${item.label}`} className="module-focus module-accent-text mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition hover:bg-white/70 dark:hover:bg-white/10"><ChevronDown size={17} className={`transition-transform ${expanded ? "rotate-180" : ""}`} /></button>
            </div>
            {expanded && <div id={`submenu-${item.label.replace(/\s+/g, "-").toLowerCase()}`} className="module-submenu ml-5 mt-1 space-y-0.5 rounded-r-xl border-l py-1 pl-3 pr-1">{children.map((child) => { const ChildIcon = child.icon; return <Link key={child.path} href={child.path} className="module-focus module-nav-link flex min-h-10 items-center gap-2.5 rounded-lg px-2 text-xs font-semibold text-gray-600 transition dark:text-gray-300"><span className="module-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"><ChildIcon size={14} /></span><span className="truncate">{child.label}</span></Link>; })}</div>}
          </div>;
        })}
      </nav>
      <div className="mt-auto border-t border-[#ece6df] pt-4 dark:border-white/10">
        <Link href="/perfil" className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-[#f7f2ed] dark:hover:bg-white/5">
          {avatar ? <img src={avatar} alt={userName} className="h-10 w-10 rounded-full object-cover" /> : <span className="module-icon flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold">{userName.slice(0, 2).toUpperCase()}</span>}
          <span className="min-w-0"><strong className="block truncate text-sm">{userName}</strong><small className="block truncate text-[11px] text-gray-500">{roleLabels.join(" · ") || "Membro"}</small></span>
        </Link>
      </div>
    </aside>
  );
}

function UserViewSwitcher({ isPastor, canManage }: { isPastor: boolean; canManage: boolean }) {
  return <div className="mt-6"><AppViewSwitcher activeView="personal" canOpenPastoral={isPastor} canOpenManagement={canManage} /></div>;
}

function HomeSettingsMenu({
  currentUser,
  isAdmin,
  isPastor,
  canManage,
  includeViewSwitcher = false,
  theme,
  onToggleTheme,
  onLogin,
  onSignOut,
}: {
  currentUser: boolean;
  isAdmin: boolean;
  isPastor: boolean;
  canManage: boolean;
  includeViewSwitcher?: boolean;
  theme: string;
  onToggleTheme: () => void;
  onLogin: () => void;
  onSignOut: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeMenu = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event instanceof MouseEvent && menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeMenu);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, [open]);

  const close = () => setOpen(false);
  const itemClass = "module-focus module-nav-link flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-bold text-gray-700 transition dark:text-gray-200";

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-label="Abrir configurações" aria-expanded={open} aria-controls="newhome-settings-menu" className={`module-focus flex h-11 w-11 items-center justify-center rounded-full border transition ${open ? "newhome-soft module-accent-text" : "newhome-card text-gray-600 hover:text-[var(--module-primary)] dark:text-gray-200"}`}>
        <Settings size={19} />
      </button>
      {open ? (
        <div id="newhome-settings-menu" className="newhome-card absolute right-0 top-[52px] z-[80] max-h-[min(76vh,620px)] w-[min(88vw,310px)] overflow-y-auto rounded-2xl border p-2 shadow-2xl">
          {includeViewSwitcher && (isPastor || canManage) ? (
            <div className="mb-2 border-b border-[#ece6df] px-1 pb-3 dark:border-white/10">
              <AppViewSwitcher activeView="personal" canOpenPastoral={isPastor} canOpenManagement={canManage} compact />
            </div>
          ) : null}
          {currentUser ? <Link href="/perfil" onClick={close} className={itemClass}><UserRound size={17} className="module-accent-text" /> Meu perfil</Link> : null}
          <Link href="/intro" onClick={close} className={itemClass}><LayoutDashboard size={17} className="module-accent-text" /> Apresentação</Link>
          <Link href="/regras" onClick={close} className={itemClass}><Sparkles size={17} className="module-accent-text" /> Manual do Maná</Link>
          <button type="button" onClick={() => { onToggleTheme(); close(); }} className={itemClass}>
            {theme === "dark" ? <Sun size={17} className="text-orange-500" /> : <Moon size={17} className="text-indigo-600" />}
            {theme === "dark" ? "Modo claro" : "Modo escuro"}
          </button>
          <div className="my-1 h-px bg-[#ece6df] dark:bg-white/10" />
          <Link href="/suporte" onClick={close} className={itemClass}><LifeBuoy size={17} /> Suporte / Doar</Link>
          <Link href="/termos" onClick={close} className={itemClass}><FileText size={17} /> Termos de uso</Link>
          <Link href="/privacidade" onClick={close} className={itemClass}><ShieldCheck size={17} /> Privacidade</Link>
          {isAdmin ? <>
            <div className="my-1 h-px bg-red-100 dark:bg-red-900/30" />
            <Link href="/admin" onClick={close} className={`${itemClass} text-red-600 dark:text-red-400`}><Terminal size={17} /> Painel Admin</Link>
            <Link href="/system-integrity" onClick={close} className={`${itemClass} text-red-600 dark:text-red-400`}><ShieldAlert size={17} /> Integridade</Link>
          </> : null}
          <div className="my-1 h-px bg-[#ece6df] dark:bg-white/10" />
          {currentUser ? (
            <button type="button" onClick={() => { void onSignOut(); close(); }} className={`${itemClass} text-red-600 dark:text-red-400`}><LogOut size={17} /> Sair</button>
          ) : (
            <button type="button" onClick={() => { onLogin(); close(); }} className={`${itemClass} text-violet-700 dark:text-violet-300`}><UserCircle size={17} /> Entrar na conta</button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function HomeTabs({ activeTab, onChange }: { activeTab: HomeTab; onChange: (tab: HomeTab) => void }) {
  return (
    <div className="newhome-chrome sticky top-0 z-40 border-y backdrop-blur-xl">
      <div role="tablist" aria-label="Áreas da Home" className="mx-auto flex max-w-[1440px] snap-x overflow-x-auto px-4 md:px-8 lg:px-10 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;
            return (
              <button key={tab.id} data-module-theme={tab.module} type="button" role="tab" aria-selected={active} aria-controls={`newhome-panel-${tab.id}`} onClick={() => onChange(tab.id)} className={`module-focus relative flex min-h-14 min-w-[104px] snap-start items-center justify-center gap-2 px-4 text-sm transition md:min-w-[132px] ${active ? "module-accent-text font-semibold" : "text-gray-500 hover:text-[#2d2a26] dark:hover:text-white"}`}>
                <Icon size={19} />{tab.label}
                {active && <span className="module-tab-indicator absolute inset-x-4 bottom-0 h-[3px] rounded-full" />}
              </button>
            );
          })}
      </div>
    </div>
  );
}

function MobileModuleSubmenus({ isPastor, isVolunteer, canManage }: { isPastor: boolean; isVolunteer: boolean; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState("Início");
  const modules = visibleModules(sidebarItems, { isPastor });
  const selected = modules.find((item) => item.label === selectedModule) ?? modules[0];
  const children = visibleSubItems(selected.children, { isPastor, isVolunteer, canManage });

  return <section data-module-theme={selected.module} className="newhome-chrome border-b px-4 py-2 lg:hidden">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-module-submenus" className="module-focus mx-auto flex min-h-11 w-full max-w-[1440px] items-center justify-between rounded-xl px-2 text-sm font-semibold"><span className="flex items-center gap-2"><LayoutDashboard size={18} className="module-accent-text" /> Submenus dos módulos</span><ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} /></button>
    {open && <div id="mobile-module-submenus" className="mx-auto max-w-[1440px] pb-2"><div role="tablist" aria-label="Módulos" className="flex gap-2 overflow-x-auto py-2 no-scrollbar">{modules.map((item) => { const Icon = item.icon; const selectedItem = item.label === selected.label; return <button key={item.label} data-module-theme={item.module} type="button" role="tab" aria-selected={selectedItem} onClick={() => setSelectedModule(item.label)} className={`module-focus flex min-h-12 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${selectedItem ? "module-nav-active" : "newhome-card text-gray-600 dark:text-gray-300"}`}><span className="module-icon flex h-8 w-8 items-center justify-center rounded-lg"><Icon size={16} /></span>{item.label}</button>; })}</div><div role="tabpanel" aria-label={`Submenu ${selected.label}`} className="module-submenu grid grid-cols-2 gap-2 rounded-2xl border p-3">{children.map((child) => { const ChildIcon = child.icon; return <Link key={child.path} href={child.path} className="newhome-card module-focus module-nav-link flex min-h-12 items-center gap-2 rounded-xl px-3 text-xs font-semibold shadow-sm transition"><span className="module-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"><ChildIcon size={15} /></span><span className="min-w-0 flex-1 truncate">{child.label}</span><ChevronRight size={14} className="module-accent-text" /></Link>; })}</div></div>}
  </section>;
}

function HomeOverviewV2(props: {
  currentUser: boolean;
  verse: { text: string; ref: string };
  readingProgress: number;
  services: ChurchService[];
  assignments: ChurchAssignment[];
  volunteerFormToken?: string | null;
  nextAssignment?: ChurchAssignment;
  nextAssignmentContext?: UserCultoAssignment;
  isVolunteer: boolean;
  isPastor: boolean;
  ownedPlans: CustomPlan[];
  shelfFilter: ShelfFilter;
  onShelfFilter: (filter: ShelfFilter) => void;
  shelfItems: ShelfItem[];
  loading: boolean;
  loadError: boolean;
  onLogin: () => void;
  onRespond: (assignment: ChurchAssignment, response: "accepted" | "declined") => void;
}) {
  const { currentUser, verse, readingProgress, services, assignments, volunteerFormToken, nextAssignment, nextAssignmentContext, isVolunteer, isPastor, ownedPlans, shelfFilter, onShelfFilter, shelfItems, loading, loadError, onLogin, onRespond } = props;
  return (
    <div id="newhome-panel-inicio" role="tabpanel" aria-label="Início" className="space-y-6">
      {!currentUser && (
        <section className="newhome-soft flex flex-col gap-4 rounded-3xl border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-bold">Entre para personalizar sua Home</h2><p className="module-muted-text mt-1 text-sm">Continue estudos, acompanhe cultos e veja suas escalas.</p></div>
          <button onClick={onLogin} className="newhome-cta min-h-11 rounded-xl px-5 text-sm font-bold transition">Entrar</button>
        </section>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-stretch">
        <div data-testid="home-overview-main-column" className="flex min-w-0 flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/devocional" data-module-theme="bible" data-testid="home-primary-devotional" className="newhome-card newhome-card-interactive group relative flex min-h-[330px] flex-col overflow-hidden rounded-3xl border p-6 transition hover:-translate-y-0.5">
              <div className="pointer-events-none absolute -bottom-20 -right-12 h-64 w-64 rounded-full bg-[var(--module-surface-strong)] opacity-70 blur-3xl" />
              <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-[var(--module-surface)] opacity-70 blur-3xl" />
              <div data-testid="home-devotional-header" className="relative flex min-h-12 items-center gap-3">
                <span data-testid="home-devotional-icon" className="module-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"><Coffee size={20} /></span>
                <h2 className="font-serif text-2xl leading-tight">Pão Diário</h2>
              </div>

              <div data-testid="home-devotional-verse-panel" className="newhome-soft relative mt-5 rounded-2xl border p-5">
                <p className="module-accent-text flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em]"><BookOpen size={14} /> Palavra do dia</p>
                <blockquote className="mt-3 line-clamp-3 font-serif text-lg leading-7 text-gray-700 dark:text-gray-200">“{verse.text}”</blockquote>
                <span className="module-accent-text mt-3 inline-flex rounded-lg bg-white/70 px-2.5 py-1 text-[11px] font-bold shadow-sm dark:bg-white/10">{verse.ref}</span>
              </div>

              <div className="newhome-rule relative mt-4 flex gap-3 rounded-2xl border bg-white/60 p-4 dark:bg-white/[0.035]">
                <span className="module-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"><Sparkles size={15} /></span>
                <div className="min-w-0">
                  <p className="module-accent-text text-[10px] font-black uppercase tracking-[0.14em]">Para meditar</p>
                  <p data-testid="home-devotional-reflection" className="module-muted-text mt-1 line-clamp-3 text-[11px] leading-4">
                    A Palavra de hoje nos convida a desacelerar, ouvir a voz de Deus e permitir que ela transforme nossas escolhas...
                  </p>
                </div>
              </div>

              <div className="relative mt-auto flex items-center justify-between gap-3 pt-4">
                <span data-testid="home-devotional-cta" className="newhome-cta inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition">Ler agora <ChevronRight size={16} /></span>
                <small className="module-muted-text flex items-center gap-1.5 text-[10px] font-semibold"><Clock3 size={13} /> 5 min de leitura</small>
              </div>
            </Link>

            <MyWeekHighlight services={services} assignments={assignments} volunteerFormToken={volunteerFormToken} loading={loading} />
          </div>

          <JourneyCards readingProgress={readingProgress} />
        </div>

        <HomeRightRail isVolunteer={isVolunteer} nextAssignment={nextAssignment} nextAssignmentContext={nextAssignmentContext} onRespond={onRespond} />
      </div>

      <StudyShelf filter={shelfFilter} onFilter={onShelfFilter} items={shelfItems} loading={loading} loadError={loadError} />
      {isPastor && <PastorRooms plans={ownedPlans} />}
      <ShortcutGrid />
    </div>
  );
}

function JourneyCards({ readingProgress }: { readingProgress: number }) {
  const completed = Math.max(1, Math.round((readingProgress / 100) * 13));
  const items = [
    {
      title: "Meta de Leitura",
      subtitle: "13 capítulos por dia",
      href: "/plano-leitura",
      icon: BookOpen,
      content: (
        <div className="newhome-soft mt-3 flex min-h-[72px] items-center gap-3 rounded-xl p-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full p-1" style={{ background: `conic-gradient(var(--module-primary) ${Math.max(readingProgress, 8)}%, var(--module-surface-strong) 0)` }}>
            <span className="newhome-card flex h-full w-full items-center justify-center rounded-full text-xs font-black">{readingProgress}%</span>
          </span>
          <span className="min-w-0">
            <strong className="block text-sm">{completed} de 13 capítulos</strong>
            <small className="module-muted-text mt-0.5 block text-[10px]">Progresso da meta diária</small>
          </span>
        </div>
      ),
      action: "Ver plano",
    },
    {
      title: "Continuar leitura",
      subtitle: "Retome de onde parou",
      href: "/bibliasagrada",
      icon: BookOpen,
      content: (
        <div className="newhome-soft mt-3 min-h-[72px] rounded-xl p-3">
          <strong className="font-serif text-xl">João 14</strong>
          <span className="mt-2 flex items-center gap-2">
            <span className="h-1.5 flex-1 rounded-full bg-[var(--module-surface-strong)]"><span className="module-accent-bg block h-full rounded-full" style={{ width: `${Math.max(8, readingProgress)}%` }} /></span>
            <small>{readingProgress}%</small>
          </span>
        </div>
      ),
      action: "Continuar",
    },
    {
      title: "Oração ao Amanhecer",
      subtitle: "Comece seu dia em oração",
      href: "/oracoes",
      icon: Heart,
      content: <div className="newhome-soft mt-3 flex min-h-[72px] items-center rounded-xl p-3 text-xs leading-5">Separe alguns minutos para agradecer e interceder.</div>,
      action: "Orar agora",
    },
  ];
  return (
    <section data-module-theme="bible" data-testid="journey-shortcuts" aria-label="Atalhos da jornada" className="grid flex-1 gap-3 sm:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.title} href={item.href} className="newhome-card newhome-card-interactive flex h-full min-h-[210px] min-w-0 flex-col rounded-2xl border p-4 transition hover:-translate-y-0.5">
            <div data-testid="journey-card-header" className="flex min-h-10 items-center gap-3">
              <span data-testid="journey-card-icon" className="module-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"><Icon size={18} /></span>
              <span className="min-w-0">
                <h3 className="truncate text-sm font-black leading-tight">{item.title}</h3>
                <p className="module-muted-text mt-0.5 truncate text-[11px]">{item.subtitle}</p>
              </span>
            </div>
            {item.content}
            <span className="newhome-rule module-accent-text mt-auto flex min-h-11 items-center justify-center rounded-xl border text-xs font-semibold">{item.action}</span>
          </Link>
        );
      })}
    </section>
  );
}

function MyWeekHighlight({
  services,
  assignments,
  volunteerFormToken,
  loading,
}: {
  services: ChurchService[];
  assignments: ChurchAssignment[];
  volunteerFormToken?: string | null;
  loading: boolean;
}) {
  const weekItems = buildHomeWeekItems(services, assignments);
  const nextServiceId = weekItems[0]?.id;
  const hasUpcomingConfirmedAssignment = assignments.some((assignment) => {
    if (assignment.status !== "accepted") return false;
    if (!assignment.startsAt) return true;
    const startsAt = new Date(assignment.startsAt).getTime();
    return Number.isFinite(startsAt) && startsAt >= Date.now() - (12 * 60 * 60 * 1000);
  });

  return (
    <section
      data-module-theme="cultos"
      data-testid="home-week-card"
      className="newhome-card newhome-card-interactive group relative flex min-h-[330px] flex-col overflow-hidden rounded-3xl border p-6 transition hover:-translate-y-0.5"
    >
      <div className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-[var(--module-surface-strong)] opacity-70 blur-3xl" />
      <div data-testid="home-week-header" className="relative flex min-h-12 items-center justify-between gap-4">
        <h2 className="font-serif text-2xl leading-tight">Minha semana</h2>
        <span className="module-accent-bg flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg">
          <CalendarDays size={22} />
        </span>
      </div>

      {loading ? (
        <div className="relative mt-5"><LoadingCard label="Carregando agenda..." /></div>
      ) : weekItems.length ? (
        <div className="relative mt-5 grid gap-2" role="list" aria-label="Programações da semana">
          {weekItems.map((item) => {
            const isNextService = item.id === nextServiceId;
            const isConfirmedAssignment = item.isConfirmedAssignment;
            return (
              <Link
                key={item.id}
                href={item.href}
                role="listitem"
                data-testid={isConfirmedAssignment ? "home-week-confirmed-service" : isNextService ? "home-week-next-service" : "home-week-program"}
                className={`module-focus flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${
                  isConfirmedAssignment
                    ? "border-indigo-200 bg-indigo-50/90 dark:border-indigo-500/30 dark:bg-indigo-500/10"
                    : isNextService
                      ? "newhome-soft"
                      : "newhome-rule bg-white/70 dark:bg-white/[0.04]"
                }`}
              >
                <span className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl ${
                  isConfirmedAssignment
                    ? "bg-indigo-600 text-white dark:bg-indigo-400 dark:text-indigo-950"
                    : isNextService
                      ? "module-accent-bg"
                      : "module-icon"
                }`}>
                  <small className="text-[9px] font-black uppercase">{formatDate(item.date, { month: "short" })}</small>
                  <strong className="text-lg leading-none">{formatDate(item.date, { day: "2-digit" })}</strong>
                </span>
                <span className="min-w-0 flex-1">
                  {isConfirmedAssignment ? (
                    <small className="block text-[9px] font-black uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-300">Você está escalado</small>
                  ) : isNextService ? (
                    <small className="module-accent-text block text-[9px] font-black uppercase tracking-[0.14em]">Próximo culto</small>
                  ) : null}
                  <strong className="block truncate text-sm">{item.title}</strong>
                  <small className="module-muted-text mt-0.5 block truncate">{formatTime(item.date)} · {item.meta}</small>
                </span>
                <ChevronRight className="module-accent-text shrink-0" size={15} />
              </Link>
            );
          })}
        </div>
      ) : null}

      {!loading && !hasUpcomingConfirmedAssignment ? (
        volunteerFormToken ? (
          <Link
            href={`/qr/${encodeURIComponent(volunteerFormToken)}`}
            data-testid="home-week-volunteer-invite"
            className="module-focus relative mt-3 flex min-h-[68px] items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50/80 px-3 py-2.5 text-violet-950 transition hover:border-violet-300 hover:bg-violet-100/80 dark:border-violet-400/25 dark:bg-violet-400/10 dark:text-violet-100"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white"><Users size={18} /></span>
            <span className="min-w-0 flex-1 text-xs leading-4"><strong className="block">Quer servir?</strong> Candidate-se como voluntário.</span>
            <ChevronRight size={15} className="shrink-0" />
          </Link>
        ) : (
          <div
            data-testid="home-week-volunteer-invite"
            className="relative mt-3 flex min-h-[68px] items-center gap-3 rounded-2xl border border-dashed border-violet-200 bg-violet-50/60 px-3 py-2.5 text-violet-950 dark:border-violet-400/25 dark:bg-violet-400/10 dark:text-violet-100"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white"><Users size={18} /></span>
            <p className="text-xs leading-4"><strong>Quer servir?</strong> Procure a liderança da sua igreja para se candidatar como voluntário.</p>
          </div>
        )
      ) : null}

      <div className="relative mt-auto pt-4">
        <Link href="/newhome?tab=calendario" data-testid="home-week-cta" className="newhome-cta module-focus flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition">
          Ver minha semana <ChevronRight size={17} />
        </Link>
      </div>
    </section>
  );
}

function HomeRightRail({
  isVolunteer,
  nextAssignment,
  nextAssignmentContext,
  onRespond,
}: {
  isVolunteer: boolean;
  nextAssignment?: ChurchAssignment;
  nextAssignmentContext?: UserCultoAssignment;
  onRespond: (assignment: ChurchAssignment, response: "accepted" | "declined") => void;
}) {
  const kingdomPreviews = [
    {
      id: "community",
      author: "Comunidade Culto+",
      time: "Hoje",
      text: "Compartilhe testemunhos, reflexões e acompanhe o que Deus está fazendo na sua comunidade.",
      highlight: "Onde estiverem dois ou três reunidos...",
      reactions: 124,
      comments: 18,
      icon: Users,
    },
    {
      id: "prayer",
      author: "Sala de oração",
      time: "Há 2h",
      text: "A comunidade está reunida em oração pelas famílias e pelos novos voluntários.",
      highlight: "Levai as cargas uns dos outros.",
      reactions: 86,
      comments: 12,
      icon: Heart,
    },
  ];

  return <aside data-testid="home-right-rail" className="flex min-w-0 flex-col gap-4 xl:h-full xl:sticky xl:top-20">
    {isVolunteer && <section data-module-theme="cultos" data-testid="home-my-scale-card" className="newhome-soft rounded-2xl border p-4"><div className="flex items-center justify-between"><h2 className="text-sm font-black">Minha escala</h2><Link href="/meus-cultos#escala" className="module-accent-text text-xs font-semibold">Ver todas</Link></div>{nextAssignment ? <AssignmentAttention assignment={nextAssignment} service={nextAssignmentContext?.service} team={nextAssignmentContext?.team} onRespond={onRespond} /> : <p className="module-muted-text mt-2 text-xs">Nenhuma escala ativa.</p>}</section>}

    <section data-module-theme="kingdom" data-testid="home-kingdom-card" className="newhome-card flex min-h-0 flex-col overflow-hidden rounded-2xl border xl:flex-1">
      <div className="flex items-center justify-between p-4 pb-2"><h2 className="text-lg font-black">No Reino</h2><Link href="/social" className="module-accent-text text-xs font-semibold">Ver tudo</Link></div>
      <div className="grid min-h-0 flex-1 gap-3 px-4 pb-3 xl:grid-rows-2">
        {kingdomPreviews.map((post) => {
          const PostIcon = post.icon;
          return (
            <article key={post.id} data-testid="home-kingdom-post" className="newhome-rule flex min-h-0 flex-col rounded-xl border bg-white/60 p-3 dark:bg-white/[0.035]">
              <div className="flex items-center gap-2.5">
                <span className="module-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full"><PostIcon size={14} /></span>
                <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{post.author}</strong><small className="module-muted-text block text-[10px]">{post.time}</small></span>
              </div>
              <p className="module-muted-text mt-2 line-clamp-2 text-[11px] leading-4">{post.text}</p>
              <div className="mt-auto flex items-end gap-2 pt-2">
                <div className="module-gradient flex min-h-12 min-w-0 flex-1 items-center rounded-lg px-2.5 py-2">
                  <p className="line-clamp-2 font-serif text-xs font-bold leading-4 text-white">“{post.highlight}”</p>
                </div>
                <div className="module-muted-text flex shrink-0 flex-col gap-1 text-[10px]">
                  <span className="flex items-center gap-1"><Heart size={12} /> {post.reactions}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={12} /> {post.comments}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <Link href="/social" className="newhome-rule module-accent-text mx-4 mb-4 mt-auto flex min-h-10 items-center justify-center rounded-xl border text-xs font-semibold">Ver no Reino</Link>
    </section>
  </aside>;
}

function HomeOverview(props: {
  userName: string;
  currentUser: boolean;
  verse: { text: string; ref: string };
  readingProgress: number;
  services: ChurchService[];
  assignments: ChurchAssignment[];
  nextAssignment?: ChurchAssignment;
  isVolunteer: boolean;
  isPastor: boolean;
  ownedPlans: CustomPlan[];
  shelfFilter: ShelfFilter;
  onShelfFilter: (filter: ShelfFilter) => void;
  shelfItems: ShelfItem[];
  loading: boolean;
  loadError: boolean;
  onLogin: () => void;
  onRespond: (assignment: ChurchAssignment, response: "accepted" | "declined") => void;
}) {
  const { userName, currentUser, verse, readingProgress, services, assignments, nextAssignment, isVolunteer, isPastor, ownedPlans, shelfFilter, onShelfFilter, shelfItems, loading, loadError, onLogin, onRespond } = props;
  const pending = assignments.find((item) => item.status === "pending");
  const accepted = assignments.find((item) => item.status === "accepted");
  return (
    <div id="newhome-panel-inicio" role="tabpanel" aria-label="Início" className="space-y-8">
      <div><h1 className="text-3xl font-black tracking-tight md:text-4xl">Bem-vindo, {userName}</h1><p className="mt-1 text-gray-500">Sua jornada hoje</p></div>
      {!currentUser && <section className="flex flex-col gap-4 rounded-3xl border border-[#e6d7bf] bg-[#fff8ea] p-5 text-[#2d2a26] sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold">Entre para personalizar sua Home</h2><p className="mt-1 text-sm text-gray-600">Continue estudos, acompanhe cultos e veja suas escalas.</p></div><button onClick={onLogin} className="min-h-11 rounded-xl bg-[#2d2a26] px-5 text-sm font-bold text-white">Entrar</button></section>}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5 md:grid-cols-2">
          <Link href="/bibliasagrada" className="group relative min-h-[300px] overflow-hidden rounded-3xl border border-[#e4ded5] bg-gradient-to-br from-[#fffaf0] to-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:from-[#201a13] dark:to-[#161616]">
            <p className="font-semibold text-amber-700">Continuar leitura</p><h2 className="mt-4 font-serif text-5xl">João 14</h2><div className="mt-5 flex items-center gap-3"><BookOpen className="text-amber-600" /><div className="h-2 flex-1 rounded-full bg-[#e8e1d8]"><div className="h-full rounded-full bg-amber-600" style={{ width: `${Math.max(8, readingProgress)}%` }} /></div><span className="text-sm">{readingProgress}%</span></div><blockquote className="mt-6 font-serif text-lg leading-8 text-gray-700 dark:text-gray-200">“{verse.text}”</blockquote><span className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-600 px-5 font-semibold text-white">Continuar <ChevronRight size={18} /></span>
          </Link>
          <MyWeekHighlight services={services} assignments={assignments} loading={loading} />
        </div>
        <section className="rounded-3xl border border-[#e4ded5] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="text-xl font-bold">Precisa da sua atenção</h2>
          {loading ? <LoadingCard label="Carregando sua agenda..." /> : nextAssignment ? <AssignmentAttention assignment={nextAssignment} onRespond={onRespond} /> : <div className="mt-5 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"><Check className="mb-3" />Nenhuma pendência urgente agora.</div>}
          {accepted && accepted.id !== nextAssignment?.id && <div className="mt-3 flex items-center gap-3 rounded-2xl border border-emerald-200 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-white"><Check size={18} /></span><div className="min-w-0"><strong className="block truncate text-sm">{accepted.title}</strong><span className="text-xs text-gray-500">{formatDate(accepted.startsAt)} · {formatTime(accepted.startsAt)} · Confirmada</span></div></div>}
          {isVolunteer && <Link href="/meus-cultos#escala" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">Ver minhas designações <ChevronRight size={16} /></Link>}
        </section>
      </div>

      <ServicesStrip services={services} />
      <StudyShelf filter={shelfFilter} onFilter={onShelfFilter} items={shelfItems} loading={loading} loadError={loadError} />
      {isPastor && <PastorRooms plans={ownedPlans} />}
      {isVolunteer && <VolunteerSection pending={pending} accepted={accepted} onRespond={onRespond} />}
      <ShortcutGrid />
    </div>
  );
}

function AssignmentAttention({
  assignment,
  service,
  team,
  onRespond,
}: {
  assignment: ChurchAssignment;
  service?: UserCultoAssignment["service"];
  team?: UserCultoAssignment["team"];
  onRespond: (assignment: ChurchAssignment, response: "accepted" | "declined") => void;
}) {
  const pending = assignment.status === "pending";
  const teamLabel = team?.name || "Equipe não informada";

  return <div className={`mt-3 rounded-xl border p-4 ${pending ? "border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20" : "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20"}`}>
    <p className={`text-[10px] font-bold uppercase tracking-wider ${pending ? "text-amber-700" : "text-emerald-700 dark:text-emerald-300"}`}>{pending ? "Convite de escala" : "Próxima escala"}</p>
    <h3 className="mt-1.5 text-base font-black">{assignment.title}</h3>
    <div className="mt-2 grid gap-1 text-[11px] text-gray-600 dark:text-gray-300">
      <p data-testid="home-assignment-team" className="flex items-center gap-1.5"><Users size={13} className="shrink-0" /><strong>Equipe:</strong> <span className="truncate">{teamLabel}{team?.area ? ` · ${team.area}` : ""}</span></p>
      {service ? <p data-testid="home-assignment-service" className="flex items-center gap-1.5"><Church size={13} className="shrink-0" /><strong>Culto:</strong> <span className="truncate">{service.title}</span></p> : null}
      <p className="flex items-center gap-1.5"><CalendarDays size={13} className="shrink-0" /><span>{formatDate(assignment.startsAt)} · {formatTime(assignment.startsAt)}</span></p>
    </div>
    {pending && <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => onRespond(assignment, "accepted")} className="min-h-10 rounded-xl bg-amber-600 text-xs font-bold text-white">Aceitar</button><button onClick={() => onRespond(assignment, "declined")} className="min-h-10 rounded-xl border border-amber-300 bg-white text-xs font-bold text-amber-800 dark:bg-transparent">Recusar</button></div>}
  </div>;
}

function ServicesStrip({ services }: { services: ChurchService[] }) {
  return <section className="rounded-3xl border border-[#e4ded5] bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Próximos cultos</h2><Link href="/culto" className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Ver agenda completa</Link></div><div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-2">{services.length ? services.slice(0, 4).map((service) => <Link key={service.id} href={`/culto/${service.slug}`} className="flex min-w-[270px] snap-start items-center gap-4 rounded-2xl border border-[#e8e2da] p-4 transition hover:border-emerald-400 dark:border-white/10"><span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"><small className="uppercase">{formatDate(service.startsAt, { month: "short" })}</small><strong className="text-xl">{formatDate(service.startsAt, { day: "2-digit" })}</strong></span><span className="min-w-0"><strong className="block truncate">{service.title}</strong><small className="text-gray-500">{formatTime(service.startsAt)} · {service.status === "live" ? "Ao vivo" : "Publicado"}</small></span><ChevronRight className="ml-auto shrink-0 text-gray-400" size={18} /></Link>) : <p className="rounded-2xl bg-[#f8f5f1] p-5 text-sm text-gray-500 dark:bg-white/5">Nenhum culto publicado nos próximos 30 dias.</p>}</div></section>;
}

function StudyShelf({ filter, onFilter, items, loading, loadError }: { filter: ShelfFilter; onFilter: (filter: ShelfFilter) => void; items: ShelfItem[]; loading: boolean; loadError: boolean }) {
  const filters: Array<{ id: ShelfFilter; label: string }> = [{ id: "all", label: "Tudo" }, { id: "study", label: "Estudos" }, { id: "plan", label: "Salas" }, { id: "note", label: "Notas" }];
  return <section data-testid="study-shelf" className="newhome-card rounded-3xl border p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Estudos</p><h2 className="mt-1 text-2xl font-black">Continue estudando</h2></div><Link href="/estudos" className="min-h-11 rounded-xl border border-cyan-700 px-4 py-3 text-sm font-semibold text-cyan-800 dark:text-cyan-300">Ver biblioteca</Link></div><div className="mt-4 flex gap-2 overflow-x-auto pb-1">{filters.map((item) => <button key={item.id} onClick={() => onFilter(item.id)} className={`min-h-11 whitespace-nowrap rounded-xl px-5 text-sm font-semibold ${filter === item.id ? "bg-cyan-700 text-white" : "border border-[#dfd9d1] bg-white text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"}`}>{item.label}</button>)}</div>{loadError && <p className="mt-3 text-sm text-amber-700">Alguns conteúdos não puderam ser carregados agora.</p>}<div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-3"><Link href="/criar-conteudo" data-testid="new-study-cta" className="module-focus flex min-h-[190px] w-[150px] flex-none snap-start flex-col items-center justify-center rounded-2xl border border-cyan-700 bg-cyan-50/60 text-cyan-800 transition hover:bg-cyan-100/70 dark:border-cyan-400 dark:bg-cyan-950/20 dark:text-cyan-200 dark:hover:bg-cyan-900/30"><Plus size={27} /><span className="mt-2 text-sm font-semibold">Novo estudo</span></Link>{loading ? <LoadingCard label="Carregando estudos..." /> : items.length ? items.map((item) => <ShelfCard key={`${item.type}-${item.id}`} item={item} />) : <div className="flex min-h-[190px] w-[240px] flex-none items-center justify-center rounded-2xl border border-[#e4ded5] bg-white p-5 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-white/5">Nenhum conteúdo neste filtro.</div>}</div></section>;
}

function ShelfCard({ item }: { item: ShelfItem }) {
  const route = item.type === "plan" ? (item.isEnrolled ? `/jornada/${item.id}` : `/criar-sala?id=${item.id}`) : item.type === "note" ? "/estudos" : `/v/${item.id}`;
  const tone = item.type === "plan" ? "from-violet-700 to-fuchsia-600" : item.type === "note" ? "from-amber-700 to-orange-500" : "from-cyan-800 to-sky-500";
  return <Link href={route} data-testid="study-shelf-card" className="min-h-[190px] w-[240px] max-w-[78vw] flex-none snap-start overflow-hidden rounded-2xl border border-[#e4ded5] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]"><div className={`relative h-20 bg-gradient-to-br ${tone}`}>{item.coverUrl && <img src={item.coverUrl} alt="" className="h-full w-full object-cover opacity-70" />}<span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-black uppercase text-[#2d2a26]">{item.type === "plan" ? "Sala" : item.type === "note" ? "Nota" : "Estudo"}</span></div><div className="p-3.5"><h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5">{item.title}</h3><div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-gray-500"><span className="truncate">{item.isEnrolled ? "Inscrito" : item.status === "published" ? "Publicado" : item.type === "note" ? "Anotação" : "Em andamento"}</span><span className="shrink-0">{formatDate(item.updatedAt)}</span></div></div></Link>;
}

function PastorRooms({ plans }: { plans: CustomPlan[] }) {
  return <section><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">Área pastoral</p><h2 className="mt-1 text-2xl font-black text-violet-950 dark:text-violet-200">Minhas salas</h2><p className="text-sm text-gray-500">Salas que você criou</p></div><div className="flex gap-2"><Link href="/workspace-pastoral" className="min-h-11 rounded-xl border border-violet-300 px-4 py-3 text-sm font-semibold text-violet-800 dark:text-violet-200">Gerenciar salas</Link><Link href="/criar-sala" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white"><Plus size={16} /> Nova sala</Link></div></div><div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-3">{plans.length ? plans.slice(0, 5).map((plan) => <Link key={plan.id} href={`/criar-sala?id=${plan.id}`} className="min-w-[280px] snap-start rounded-2xl border border-violet-200 bg-white p-5 dark:border-violet-900/50 dark:bg-white/[0.04]"><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-700 text-white"><Users size={20} /></span><span className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${plan.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>{plan.status === "published" ? "Publicada" : "Rascunho"}</span></div><h3 className="mt-4 text-lg font-black">{plan.title}</h3><p className="mt-3 text-sm text-gray-500">{plan.subscribersCount || 0} participantes</p><p className="mt-1 text-sm text-gray-500">{plan.startDate ? `Próximo encontro: ${formatDate(plan.startDate)}` : "Sem encontro agendado"}</p></Link>) : <div className="rounded-2xl border border-dashed border-violet-300 p-6 text-sm text-gray-500">Você ainda não criou salas. <Link href="/criar-sala" className="font-semibold text-violet-700">Criar primeira sala</Link></div>}</div></section>;
}

function VolunteerSection({ pending, accepted, onRespond }: { pending?: ChurchAssignment; accepted?: ChurchAssignment; onRespond: (assignment: ChurchAssignment, response: "accepted" | "declined") => void }) {
  return <section><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Serviço</p><h2 className="mt-1 text-2xl font-black text-emerald-950 dark:text-emerald-200">Minha escala</h2></div><Link href="/meus-cultos#escala" className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Ver designações</Link></div><div className="mt-4 grid gap-4 md:grid-cols-2">{pending && <AssignmentAttention assignment={pending} onRespond={onRespond} />}{accepted && <div className="rounded-2xl border border-emerald-200 bg-white p-5 dark:border-emerald-900 dark:bg-white/[0.04]"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Confirmada</p><h3 className="mt-2 text-xl font-black">{accepted.title}</h3><p className="mt-2 text-sm text-gray-500">{formatDate(accepted.startsAt)} · {formatTime(accepted.startsAt)}</p></div>}{!pending && !accepted && <div className="rounded-2xl border border-[#e4ded5] bg-white p-5 text-sm text-gray-500 dark:border-white/10 dark:bg-white/[0.04]">Nenhuma escala ativa no momento.</div>}</div></section>;
}

function ShortcutGrid() {
  return <section><h2 className="text-2xl font-black">Explore o Culto+</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{shortcuts.map((item) => { const Icon = item.icon; return <Link key={item.label} href={item.path} data-module-theme={item.module} className="newhome-card newhome-card-interactive group flex min-h-[104px] items-center gap-4 rounded-2xl border p-4 transition hover:-translate-y-0.5"><span className="module-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-full"><Icon size={22} /></span><span className="min-w-0"><strong className="block">{item.label}</strong><small className="module-muted-text mt-1 block leading-5">{item.description}</small></span><ChevronRight className="module-accent-text ml-auto shrink-0 opacity-50 transition group-hover:opacity-100" size={18} /></Link>; })}</div></section>;
}

function CreateTabV2({ isPastor, currentUser, onLogin }: { isPastor: boolean; currentUser: boolean; onLogin: () => void }) {
  const tools = [
    { label: "Gerar Imagens", description: "Crie artes sacras inspiradas em textos bíblicos.", path: "/criar-arte-sacra", icon: FileImage, module: "create" as AppModuleId },
    { label: "Gerar Podcast", description: "Transforme reflexões em episódios narrados.", path: "/criar-podcast", icon: Music2, module: "create" as AppModuleId },
    { label: "Esboços com IA", description: "Estruture estudos, mensagens e devocionais.", path: "/criar-conteudo", icon: Wand2, module: "create" as AppModuleId },
    ...(isPastor ? [{ label: "Criar Sala", description: "Monte uma jornada para sua comunidade.", path: "/criar-sala", icon: Users, module: "pastoral" as AppModuleId }] : []),
  ];
  return <div id="newhome-panel-criar" role="tabpanel" className="space-y-6">
    <section className="newhome-hero relative overflow-hidden rounded-3xl p-6 md:p-8"><div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" /><div className="relative flex flex-col gap-5 md:flex-row md:items-center"><span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg ring-1 ring-white/20"><Sparkles size={30} /></span><div><p className="newhome-hero-muted text-xs font-bold uppercase tracking-[0.2em]">Criar</p><h1 className="mt-2 text-3xl font-black">Seu estúdio criativo</h1><p className="newhome-hero-muted mt-2 max-w-2xl text-sm leading-6">Gere imagens bíblicas, episódios de podcast e esboços com assistentes especializados.</p></div><span className="rounded-xl bg-white/15 px-4 py-3 text-sm font-bold text-white ring-1 ring-white/20 md:ml-auto">IA disponível</span></div></section>
    {!currentUser && <button onClick={onLogin} className="newhome-cta min-h-11 rounded-xl px-5 font-bold transition">Entrar para criar</button>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{tools.map((item) => { const Icon = item.icon; return <Link key={item.label} data-module-theme={item.module} href={currentUser ? item.path : "#"} onClick={(event) => { if (!currentUser) { event.preventDefault(); onLogin(); } }} className="newhome-card newhome-card-interactive group flex min-h-[190px] flex-col rounded-3xl border p-5 transition hover:-translate-y-0.5"><span className="module-icon flex h-12 w-12 items-center justify-center rounded-2xl"><Icon size={23} /></span><h2 className="mt-auto text-xl font-black">{item.label}</h2><p className="module-muted-text mt-2 text-sm leading-6">{item.description}</p><span className="module-accent-text mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider">Iniciar <ChevronRight size={14} /></span></Link>; })}</section>
    <div className="grid gap-5 lg:grid-cols-2"><section className="newhome-card rounded-3xl border p-6"><h2 className="flex items-center gap-2 font-black"><History size={18} className="module-accent-text" /> Histórico recente</h2><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{["Criação", "Mar Vermelho", "Jerusalém", "Daniel"].map((title) => <Link href="/historico" key={title} className="module-gradient flex aspect-square flex-col justify-end rounded-2xl p-3"><span className="text-xs font-semibold">{title}</span></Link>)}</div></section><section className="newhome-card rounded-3xl border p-6"><h2 className="flex items-center gap-2 font-black"><BookOpen size={18} className="module-accent-text" /> Dicas de prompt</h2><div className="mt-5 space-y-3"><div className="newhome-soft rounded-2xl border p-4 text-sm leading-6"><strong className="block">Imagens</strong>Descreva o cenário, o estilo artístico e a iluminação desejada.</div><div className="newhome-soft rounded-2xl border p-4 text-sm leading-6"><strong className="block">Podcasts</strong>Informe o texto-base e escolha um tom encorajador ou reflexivo.</div></div></section></div>
  </div>;
}

function KingdomTabV2() {
  return <div id="newhome-panel-reino" role="tabpanel" className="min-w-0 space-y-6"><section className="newhome-hero rounded-3xl p-6 md:p-8"><p className="newhome-hero-muted text-xs font-bold uppercase tracking-[0.2em]">Reino</p><h1 className="mt-2 text-3xl font-black">Comunidade e comunhão</h1><p className="newhome-hero-muted mt-2">Acompanhe reflexões, testemunhos e pedidos de oração.</p></section><div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]"><section className="min-w-0 space-y-4"><div className="newhome-card rounded-3xl border p-5"><div className="flex items-center gap-3"><span className="module-icon flex h-11 w-11 items-center justify-center rounded-full"><UserRound size={20} /></span><Link href="/social" className="newhome-soft flex min-h-11 min-w-0 flex-1 items-center rounded-full px-4 text-sm">Compartilhe algo com o Reino...</Link></div><div className="newhome-rule mt-4 flex gap-5 border-t pt-4 text-sm"><Link href="/social" className="module-accent-text flex items-center gap-2 font-semibold"><FileImage size={18} /> Publicar</Link><Link href="/social/oracao" className="module-accent-text flex items-center gap-2 font-semibold"><Heart size={18} /> Pedir oração</Link></div></div><article className="newhome-card overflow-hidden rounded-3xl border"><div className="p-5"><div className="flex items-center gap-3"><span className="module-gradient flex h-11 w-11 items-center justify-center rounded-full"><Church size={20} /></span><span><strong className="block text-sm">Comunidade Culto+</strong><small className="module-muted-text">Reflexão de hoje</small></span></div><p className="module-muted-text mt-4 text-sm leading-7">Deus tem sido fiel em cada detalhe. Compartilhe com a comunidade aquilo que fortaleceu sua fé nesta semana.</p></div><div className="module-gradient flex h-56 items-end p-6"><p className="max-w-sm font-serif text-2xl font-bold text-white">Uma comunidade reunida pela Palavra.</p></div><div className="module-muted-text flex gap-6 p-5 text-sm"><span className="flex items-center gap-2"><Heart size={19} /> 124</span><span className="flex items-center gap-2"><MessageCircle size={19} /> 18</span></div></article></section><aside className="min-w-0 space-y-4"><ShortcutCard href="/social" icon={Users} title="Abrir o feed" description="Veja todas as publicações da comunidade" /><ShortcutCard href="/social/oracao" icon={Heart} title="Sala de oração" description="Pedidos e intercessões da comunidade" /><ShortcutCard href="/social/explore" icon={Search} title="Explorar" description="Encontre igrejas, pessoas e conteúdos" /></aside></div></div>;
}

function ManagementTabV2({ canManage, hasChurch }: { canManage: boolean; hasChurch: boolean }) {
  const cards = [
    { title: "Pessoas e equipes", desc: "Diretório, agenda, escalas e acessos", icon: Users, path: "/gestao-igreja/pessoas" },
    { title: "Inbox Pastoral", desc: "Pedidos e aconselhamento", icon: Heart, path: "/gestao-igreja/inbox" },
    { title: "Notificações", desc: "Avisos e alertas", icon: Bell, path: "/gestao-igreja/notificacoes" },
    { title: "Indicadores", desc: "Métricas da igreja", icon: LayoutDashboard, path: "/gestao-igreja/indicadores" },
  ];
  return <div id="newhome-panel-gestao" role="tabpanel" className="space-y-6"><section className="newhome-hero relative overflow-hidden rounded-3xl p-6 md:p-8"><Church className="text-white/85" size={30} /><h1 className="mt-4 text-3xl font-black">Gestão da Igreja</h1><p className="newhome-hero-muted mt-2 max-w-2xl text-sm leading-6">Pessoas, equipes, comunicação e indicadores em um painel protegido por permissões.</p></section>{canManage && hasChurch ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => { const Icon = card.icon; return <Link key={card.title} href={card.path} className="newhome-card newhome-card-interactive group min-h-[150px] rounded-3xl border p-5 transition hover:-translate-y-0.5"><div className="flex items-start justify-between"><span className="module-icon flex h-11 w-11 items-center justify-center rounded-xl"><Icon size={20} /></span><ChevronRight size={18} className="module-accent-text opacity-45 transition group-hover:opacity-100" /></div><h2 className="mt-5 font-black">{card.title}</h2><p className="module-muted-text mt-1 text-sm">{card.desc}</p></Link>; })}</div> : <section className="newhome-card max-w-2xl rounded-3xl border p-6"><ShieldCheck className="module-accent-text" /><h2 className="mt-4 text-xl font-black">Área protegida</h2><p className="module-muted-text mt-2 text-sm leading-7">A gestão aparece para pastores, gestores e líderes autorizados. Sua área pessoal e suas escalas continuam disponíveis.</p><Link href={hasChurch ? "/minha-igreja" : "/social/igrejas"} className="newhome-cta mt-5 inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-bold transition">{hasChurch ? "Abrir Minha Igreja" : "Encontrar uma igreja"}</Link></section>}</div>;
}

function CalendarTabV2({ services, assignments, loading }: { services: ChurchService[]; assignments: ChurchAssignment[]; loading: boolean }) {
  const pending = assignments.filter((item) => item.status === "pending");
  const events = [...services.map((service) => ({ id: `service-${service.id}`, date: service.startsAt, title: service.title, meta: service.churchName || "Culto", tone: "module-accent-bg" })), ...assignments.filter((item) => item.startsAt).map((item) => ({ id: `assignment-${item.id}`, date: item.startsAt!, title: item.title, meta: item.status === "pending" ? "Convite pendente" : "Minha escala", tone: item.status === "pending" ? "bg-amber-500" : "module-accent-bg" }))].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return <div id="newhome-panel-calendario" role="tabpanel" className="space-y-6"><section className="newhome-hero relative overflow-hidden rounded-3xl p-6 md:p-8"><CalendarDays size={30} className="text-white/85" /><h1 className="mt-4 text-3xl font-black">Meu calendário</h1><p className="newhome-hero-muted mt-2 max-w-2xl text-sm">Cultos, escalas e convites reunidos em uma única agenda.</p></section><div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><section className="newhome-card rounded-3xl border p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Próximos compromissos</h2><span className="module-muted-text text-sm">{events.length} itens</span></div>{loading ? <LoadingCard label="Carregando compromissos..." /> : events.length ? <div className="mt-4 space-y-3">{events.slice(0, 10).map((event) => <div key={event.id} className="newhome-rule flex items-center gap-4 rounded-2xl border p-4"><span className="newhome-soft flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl"><small>{formatDate(event.date, { month: "short" }).toUpperCase()}</small><strong className="text-xl">{formatDate(event.date, { day: "2-digit" })}</strong></span><span className={`h-10 w-1 rounded-full ${event.tone}`} /><span className="min-w-0"><strong className="block truncate">{event.title}</strong><small className="module-muted-text">{event.meta} · {formatTime(event.date)}</small></span></div>)}</div> : <p className="newhome-soft mt-4 rounded-2xl p-5 text-sm">Nenhum compromisso encontrado para os próximos dias.</p>}</section><aside className="space-y-5"><section className="rounded-3xl border border-amber-300 bg-amber-50/70 p-5 dark:border-amber-700/50 dark:bg-amber-950/25"><h2 className="font-black">Convites pendentes</h2><strong className="mt-3 block text-4xl text-amber-800 dark:text-amber-300">{pending.length}</strong><p className="mt-2 text-sm text-amber-950/65 dark:text-amber-100/70">Escalas aguardando sua resposta.</p><Link href="/minha-igreja/designacoes" className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-amber-700 text-sm font-bold text-white transition hover:bg-amber-800">Ver convites</Link></section><section className="newhome-card rounded-3xl border p-5"><h2 className="font-black">Atalhos</h2><Link href="/culto" className="newhome-rule module-accent-text mt-4 flex min-h-11 items-center justify-between border-b text-sm">Agenda de cultos <ChevronRight size={16} /></Link><Link href="/minha-igreja/designacoes" className="module-accent-text flex min-h-11 items-center justify-between text-sm">Minha escala <ChevronRight size={16} /></Link></section></aside></div></div>;
}

function CreateTab({ isPastor, currentUser, onLogin }: { isPastor: boolean; currentUser: boolean; onLogin: () => void }) {
  const actions = [{ label: "Criar estudo", description: "Organize uma mensagem ou estudo bíblico", path: "/criar-conteudo", icon: NotebookPen, tone: "bg-cyan-100 text-cyan-800" }, { label: "Criar arte sacra", description: "Transforme um versículo em imagem", path: "/criar-arte-sacra", icon: Sparkles, tone: "bg-blue-100 text-blue-800" }, { label: "Criar podcast", description: "Gere um episódio bíblico em áudio", path: "/criar-podcast", icon: Music2, tone: "bg-pink-100 text-pink-800" }, ...(isPastor ? [{ label: "Criar sala", description: "Monte uma jornada para sua comunidade", path: "/criar-sala", icon: Users, tone: "bg-violet-100 text-violet-800" }] : [])];
  return <div id="newhome-panel-criar" role="tabpanel" className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Criar</p><h1 className="mt-2 text-3xl font-black">Seu estúdio criativo</h1><p className="mt-2 text-gray-500">Escolha uma ferramenta e continue na área especializada.</p></div>{!currentUser && <button onClick={onLogin} className="min-h-11 rounded-xl bg-[#2d2a26] px-5 font-bold text-white">Entrar para criar</button>}<div className="grid gap-4 md:grid-cols-2">{actions.map((item) => { const Icon = item.icon; return <Link key={item.label} href={currentUser ? item.path : "#"} onClick={(event) => { if (!currentUser) { event.preventDefault(); onLogin(); } }} className="rounded-3xl border border-[#e4ded5] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.04]"><span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.tone}`}><Icon size={26} /></span><h2 className="mt-5 text-xl font-black">{item.label}</h2><p className="mt-2 text-sm text-gray-500">{item.description}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Abrir ferramenta <ChevronRight size={16} /></span></Link>; })}</div></div>;
}

function KingdomTab() {
  return <div id="newhome-panel-reino" role="tabpanel" className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-700">Reino</p><h1 className="mt-2 text-3xl font-black">Comunidade e comunhão</h1><p className="mt-2 text-gray-500">A Home mostra atalhos; as conversas completas continuam no Reino.</p></div><div className="grid gap-4 md:grid-cols-3"><ShortcutCard href="/social" icon={Users} title="Abrir o feed" description="Reflexões, testemunhos e novidades" tone="bg-fuchsia-100 text-fuchsia-800" /><ShortcutCard href="/social/oracao" icon={Heart} title="Sala de oração" description="Pedidos e intercessões da comunidade" tone="bg-indigo-100 text-indigo-800" /><ShortcutCard href="/social/explore" icon={Search} title="Explorar" description="Encontre igrejas, pessoas e conteúdos" tone="bg-orange-100 text-orange-800" /></div></div>;
}

function ManagementTab({ canManage, hasChurch }: { canManage: boolean; hasChurch: boolean }) {
  return <div id="newhome-panel-gestao" role="tabpanel" className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Gestão</p><h1 className="mt-2 text-3xl font-black">Minha Igreja</h1><p className="mt-2 text-gray-500">Os atalhos respeitam seu papel e as permissões da igreja.</p></div>{canManage && hasChurch ? <div className="grid gap-4 md:grid-cols-3"><ShortcutCard href="/gestao-igreja" icon={LayoutDashboard} title="Painel da igreja" description="Pessoas, equipes e indicadores" tone="bg-slate-200 text-slate-800" /><ShortcutCard href="/workspace-pastoral/cultos" icon={CalendarDays} title="Agenda de cultos" description="Planeje e publique celebrações" tone="bg-emerald-100 text-emerald-800" /><ShortcutCard href="/workspace-pastoral" icon={Users} title="Workspace pastoral" description="Salas, jornadas e recursos" tone="bg-violet-100 text-violet-800" /></div> : <section className="max-w-2xl rounded-3xl border border-[#e4ded5] bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]"><Church className="text-blue-700" /><h2 className="mt-4 text-xl font-black">Área protegida</h2><p className="mt-2 text-sm leading-7 text-gray-500">A gestão administrativa aparece somente para pastores, gestores e líderes autorizados. Você ainda pode acompanhar sua igreja e suas designações.</p><Link href={hasChurch ? "/minha-igreja" : "/social/igrejas"} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-5 text-sm font-bold text-white">{hasChurch ? "Abrir Minha Igreja" : "Encontrar uma igreja"}</Link></section>}</div>;
}

function CalendarTab({ services, assignments, loading }: { services: ChurchService[]; assignments: ChurchAssignment[]; loading: boolean }) {
  const events = [...services.map((service) => ({ id: `service-${service.id}`, date: service.startsAt, title: service.title, meta: service.churchName || "Culto", tone: "bg-emerald-600" })), ...assignments.filter((item) => item.startsAt).map((item) => ({ id: `assignment-${item.id}`, date: item.startsAt!, title: item.title, meta: item.status === "pending" ? "Convite pendente" : "Minha escala", tone: item.status === "pending" ? "bg-amber-500" : "bg-blue-600" }))].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return <div id="newhome-panel-calendario" role="tabpanel" className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Calendário</p><h1 className="mt-2 text-3xl font-black">Minha semana</h1><p className="mt-2 text-gray-500">Cultos e escalas reais reunidos em um só resumo.</p></div><section className="max-w-4xl rounded-3xl border border-[#e4ded5] bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">{loading ? <LoadingCard label="Carregando compromissos..." /> : events.length ? <div className="space-y-3">{events.slice(0, 10).map((event) => <div key={event.id} className="flex items-center gap-4 rounded-2xl border border-[#ece6df] p-4 dark:border-white/10"><span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#f7f3ee]"><small>{formatDate(event.date, { month: "short" }).toUpperCase()}</small><strong className="text-xl">{formatDate(event.date, { day: "2-digit" })}</strong></span><span className={`h-10 w-1 rounded-full ${event.tone}`} /><span className="min-w-0"><strong className="block truncate">{event.title}</strong><small className="text-gray-500">{event.meta} · {formatTime(event.date)}</small></span></div>)}</div> : <p className="text-sm text-gray-500">Nenhum compromisso encontrado para os próximos dias.</p>}</section></div>;
}

function ShortcutCard({ href, icon: Icon, title, description }: { href: string; icon: React.ElementType; title: string; description: string; tone?: string }) {
  return <Link href={href} className="newhome-card newhome-card-interactive block min-w-0 w-full overflow-hidden rounded-3xl border p-6 transition hover:-translate-y-0.5"><span className="module-icon flex h-12 w-12 items-center justify-center rounded-2xl"><Icon size={23} /></span><h2 className="mt-5 truncate text-xl font-black">{title}</h2><p className="module-muted-text mt-2 line-clamp-2 text-sm leading-6">{description}</p><span className="module-accent-text mt-5 inline-flex items-center gap-2 text-sm font-semibold">Abrir <ChevronRight size={16} /></span></Link>;
}

function LoadingCard({ label }: { label: string }) {
  return <div className="newhome-card module-muted-text flex min-h-[120px] min-w-[240px] items-center justify-center gap-3 rounded-2xl border p-5 text-sm"><Loader2 className="module-accent-text animate-spin" size={18} />{label}</div>;
}
