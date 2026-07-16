"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  LibraryBig,
  Loader2,
  MessageCircle,
  Music2,
  NotebookPen,
  PenLine,
  Plus,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Users,
  Wand2,
  X,
} from "lucide-react";
import CultoPlusBrand from "../components/CultoPlusBrand";
import AppViewSwitcher from "../components/AppViewSwitcher";
import ManagerNotificationCenter from "../components/church-management/ManagerNotificationCenter";
import { useAuth } from "../contexts/AuthContext";
import { useHeader } from "../contexts/HeaderContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { DAILY_BIBLE_VERSES } from "../constants";
import { dbService } from "../services/supabase";
import { cultoPlusService } from "../services/cultoPlusService";
import { churchManagementService } from "../services/churchManagementService";
import type { ChurchAssignment, ChurchMemberRole, ChurchService, CustomPlan } from "../types";
import { canAccessPastoralWorkspace, isGeneralManager, isGeneralPastor } from "../utils/profileAccess";
import { canAccessChurchManagement } from "../utils/churchManagementRules";
import { getReadingGoalProgress } from "../utils/inicioHome";

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

const tabs: Array<{ id: HomeTab; label: string; icon: React.ElementType }> = [
  { id: "inicio", label: "Início", icon: Home },
  { id: "criar", label: "Criar", icon: Wand2 },
  { id: "reino", label: "Reino", icon: Users },
  { id: "gestao", label: "Gestão", icon: LayoutDashboard },
  { id: "calendario", label: "Calendário", icon: CalendarDays },
];

const shortcuts = [
  { label: "Bíblia", description: "Leia e aprofunde-se na Palavra", path: "/bibliasagrada", icon: BookOpen, color: "bg-amber-100 text-amber-700" },
  { label: "Estudos", description: "Estudos guiados e reflexões", path: "/estudos", icon: BookMarked, color: "bg-cyan-100 text-cyan-700" },
  { label: "Pão Diário", description: "Reflexão para o seu dia", path: "/devocional", icon: Coffee, color: "bg-orange-100 text-orange-700" },
  { label: "Orações", description: "Ore e interceda pela igreja", path: "/oracoes", icon: Heart, color: "bg-rose-100 text-rose-700" },
  { label: "Reino", description: "Conecte-se com a comunidade", path: "/social", icon: Users, color: "bg-violet-100 text-violet-700" },
  { label: "Estúdio Criativo", description: "Crie artes, áudio e estudos", path: "/newhome?tab=criar", icon: Wand2, color: "bg-fuchsia-100 text-fuchsia-700" },
  { label: "Conselheiro IA", description: "Converse e receba orientações", path: "/chat", icon: MessageCircle, color: "bg-teal-100 text-teal-700" },
  { label: "Quiz", description: "Teste seus conhecimentos", path: "/quiz", icon: Brain, color: "bg-pink-100 text-pink-700" },
];

type SidebarSubItem = { label: string; path: string; icon: React.ElementType; pastorOnly?: boolean; managerOnly?: boolean; volunteerOnly?: boolean };
type SidebarModule = {
  label: string;
  path: string;
  icon: React.ElementType;
  color: string;
  iconTone: string;
  openTone: string;
  submenuTone: string;
  borderTone: string;
  hoverTone: string;
  pastorOnly?: boolean;
  children: SidebarSubItem[];
};

const sidebarItems: SidebarModule[] = [
  { label: "Início", path: "/newhome", icon: Home, color: "text-violet-700 dark:text-violet-300", iconTone: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300", openTone: "bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10", submenuTone: "bg-violet-50/70 dark:bg-violet-500/[0.06]", borderTone: "border-violet-300 dark:border-violet-500/30", hoverTone: "hover:bg-violet-100/80 hover:text-violet-900 dark:hover:bg-violet-500/15 dark:hover:text-violet-100", children: [
    { label: "Visão geral", path: "/newhome", icon: Home }, { label: "Criar", path: "/newhome?tab=criar", icon: Wand2 }, { label: "Reino", path: "/newhome?tab=reino", icon: Users }, { label: "Gestão", path: "/newhome?tab=gestao", icon: LayoutDashboard }, { label: "Calendário", path: "/newhome?tab=calendario", icon: CalendarDays }, { label: "Mapa Vivo", path: "/mapa-vivo", icon: Sparkles },
  ] },
  { label: "Bíblia", path: "/bibliasagrada", icon: BookOpen, color: "text-amber-700 dark:text-amber-300", iconTone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", openTone: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10", submenuTone: "bg-amber-50/70 dark:bg-amber-500/[0.06]", borderTone: "border-amber-300 dark:border-amber-500/30", hoverTone: "hover:bg-amber-100/80 hover:text-amber-900 dark:hover:bg-amber-500/15 dark:hover:text-amber-100", children: [
    { label: "Bíblia Sagrada", path: "/bibliasagrada", icon: BookOpen }, { label: "Meta de leitura", path: "/plano", icon: Target }, { label: "Pão Diário", path: "/devocional", icon: Coffee }, { label: "Meus Estudos", path: "/estudos", icon: BookMarked }, { label: "Anotações", path: "/notes", icon: NotebookPen }, { label: "Quiz Bíblico", path: "/quiz", icon: Brain },
  ] },
  { label: "Reino", path: "/social", icon: Users, color: "text-fuchsia-700 dark:text-fuchsia-300", iconTone: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300", openTone: "bg-gradient-to-r from-fuchsia-50 to-rose-50 dark:from-fuchsia-500/10 dark:to-rose-500/10", submenuTone: "bg-fuchsia-50/70 dark:bg-fuchsia-500/[0.06]", borderTone: "border-fuchsia-300 dark:border-fuchsia-500/30", hoverTone: "hover:bg-fuchsia-100/80 hover:text-fuchsia-900 dark:hover:bg-fuchsia-500/15 dark:hover:text-fuchsia-100", children: [
    { label: "Feed", path: "/social", icon: Users }, { label: "Orações", path: "/social/oracao", icon: Heart }, { label: "Igrejas", path: "/social/igrejas", icon: Church }, { label: "Explorar", path: "/social/explore", icon: Search }, { label: "Artigos", path: "/social/artigos", icon: FileText }, { label: "Meu perfil", path: "/perfil", icon: UserRound },
  ] },
  { label: "Cultos", path: "/culto", icon: CalendarDays, color: "text-emerald-700 dark:text-emerald-300", iconTone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", openTone: "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10", submenuTone: "bg-emerald-50/70 dark:bg-emerald-500/[0.06]", borderTone: "border-emerald-300 dark:border-emerald-500/30", hoverTone: "hover:bg-emerald-100/80 hover:text-emerald-900 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-100", children: [
    { label: "Agenda de cultos", path: "/culto", icon: CalendarDays }, { label: "Meus Cultos", path: "/meus-cultos", icon: Church }, { label: "Gerenciar cultos", path: "/workspace-pastoral/cultos", icon: LayoutDashboard, pastorOnly: true }, { label: "Novo culto", path: "/workspace-pastoral/cultos/novo", icon: Plus, pastorOnly: true },
  ] },
  { label: "Criar", path: "/newhome?tab=criar", icon: PenLine, color: "text-indigo-700 dark:text-indigo-300", iconTone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300", openTone: "bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10", submenuTone: "bg-indigo-50/70 dark:bg-indigo-500/[0.06]", borderTone: "border-indigo-300 dark:border-indigo-500/30", hoverTone: "hover:bg-indigo-100/80 hover:text-indigo-900 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-100", children: [
    { label: "Estúdio Criativo", path: "/newhome?tab=criar", icon: Sparkles }, { label: "Criar estudo", path: "/criar-conteudo", icon: NotebookPen }, { label: "Criar arte sacra", path: "/criar-arte-sacra", icon: FileImage }, { label: "Criar podcast", path: "/criar-podcast", icon: Music2 }, { label: "Criar sala", path: "/criar-sala", icon: Users, pastorOnly: true }, { label: "Histórico", path: "/historico", icon: History },
  ] },
  { label: "Minha Igreja", path: "/minha-igreja", icon: Church, color: "text-blue-700 dark:text-blue-300", iconTone: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300", openTone: "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10", submenuTone: "bg-blue-50/70 dark:bg-blue-500/[0.06]", borderTone: "border-blue-300 dark:border-blue-500/30", hoverTone: "hover:bg-blue-100/80 hover:text-blue-900 dark:hover:bg-blue-500/15 dark:hover:text-blue-100", children: [
    { label: "Visão geral", path: "/minha-igreja", icon: Home }, { label: "Minha escala", path: "/minha-igreja/designacoes", icon: Check }, { label: "Minhas equipes", path: "/minha-igreja/equipes", icon: Users }, { label: "Minhas insígnias", path: "/minha-igreja/insignias", icon: Sparkles }, { label: "Jornada do obreiro", path: "/minha-igreja/jornada-obreiro", icon: BookMarked }, { label: "Gestão da igreja", path: "/gestao-igreja", icon: ShieldCheck, managerOnly: true },
  ] },
  { label: "Workspace Pastoral", path: "/workspace-pastoral", icon: Church, color: "text-purple-700 dark:text-purple-300", iconTone: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300", openTone: "bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-500/10 dark:to-fuchsia-500/10", submenuTone: "bg-purple-50/70 dark:bg-purple-500/[0.06]", borderTone: "border-purple-300 dark:border-purple-500/30", hoverTone: "hover:bg-purple-100/80 hover:text-purple-900 dark:hover:bg-purple-500/15 dark:hover:text-purple-100", pastorOnly: true, children: [
    { label: "Painel pastoral", path: "/workspace-pastoral", icon: LayoutDashboard }, { label: "Minhas salas", path: "/workspace-pastoral", icon: Users }, { label: "Criar sala", path: "/criar-sala", icon: Plus }, { label: "Acervo", path: "/acervo", icon: LibraryBig }, { label: "Gerenciar cultos", path: "/workspace-pastoral/cultos", icon: CalendarDays }, { label: "Novo culto", path: "/workspace-pastoral/cultos/novo", icon: PenLine },
  ] },
  { label: "Configurações", path: "/minha-conta", icon: Settings, color: "text-slate-700 dark:text-slate-300", iconTone: "bg-slate-200 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300", openTone: "bg-gradient-to-r from-slate-100 to-gray-50 dark:from-slate-500/10 dark:to-gray-500/10", submenuTone: "bg-slate-100/70 dark:bg-slate-500/[0.06]", borderTone: "border-slate-300 dark:border-slate-500/30", hoverTone: "hover:bg-slate-200/80 hover:text-slate-950 dark:hover:bg-slate-500/15 dark:hover:text-white", children: [
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
  const { currentUser, userProfile, unreadNotificationsCount, openLogin, showNotification } = useAuth();
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
        setRoles([]);
        setLoadingData(false);
        return;
      }
      setLoadingData(true);
      setLoadError(false);
      try {
        const enrolledIds = Array.from(new Set([
          ...((userProfile as any)?.enrolledPlans || []),
          ...((userProfile as any)?.enrolled_plans || []),
        ].filter(Boolean)));
        const start = new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + 30);
        const [studies, publicStudies, notes, serviceNotes, enrolledPlans, churchServices, churchAssignments, churchRoles] = await Promise.all([
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
          churchId ? churchManagementService.listAssignments(churchId, { assigneeUserId: userId, limit: 12 }) : Promise.resolve([]),
          churchId ? churchManagementService.listRoles(churchId, { limit: 150 }) : Promise.resolve([]),
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
        setAssignments(churchAssignments);
        setRoles(churchRoles.filter((role) => role.userId === userId));
      } catch {
        if (!mounted) return;
        setLoadError(true);
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
      showNotification(response === "accepted" ? "Escala aceita." : "Escala recusada.", "success");
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Não foi possível responder à escala.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2d2a26] dark:bg-[#0b0b0c] dark:text-gray-100">
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
                {avatar ? <img src={avatar} alt={userName} className="h-11 w-11 rounded-full object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eadff5] text-sm font-bold text-[#5b2b87]">{userName.slice(0, 2).toUpperCase()}</span>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <form onSubmit={submitSearch} className="relative min-w-0 flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar na Bíblia, estudos, pessoas..." className="min-h-12 w-full rounded-2xl border border-[#ded8cf] bg-white px-12 text-sm outline-none transition focus:border-[#a92e91] focus:ring-2 focus:ring-[#a92e91]/10 dark:border-white/10 dark:bg-white/5" />
              </form>
              <div className="hidden items-center gap-3 lg:flex">
                {canManageChurch ? <ManagerNotificationCenter churchId={managementChurchId ?? churchId} /> : null}
                <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
                  <Bell size={20} />
                  {unreadNotificationsCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />}
                </span>
                {avatar ? <img src={avatar} alt={userName} className="h-11 w-11 rounded-full object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eadff5] text-sm font-bold text-[#5b2b87]">{userName.slice(0, 2).toUpperCase()}</span>}
              </div>
            </div>
          </header>

          <MobileUserViewSwitcher isPastor={isPastoralProfile} canManage={canManageChurch} />

          <HomeTabs activeTab={activeTab} onChange={changeTab} />
          <MobileModuleSubmenus isPastor={isPastoralProfile} isVolunteer={isVolunteer} canManage={canManageChurch} />

          <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-6 md:px-8 lg:px-10 lg:pb-14">
            {activeTab === "inicio" && (
              <HomeOverviewV2
                userName={userName}
                currentUser={Boolean(currentUser)}
                verse={verseOfDay}
                readingProgress={readingProgress}
                services={services}
                assignments={assignments}
                nextAssignment={nextAssignment}
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
    <aside className="sticky top-0 hidden h-screen w-[256px] shrink-0 flex-col border-r border-[#e6e0d8] bg-white px-4 py-6 lg:flex dark:border-white/10 dark:bg-[#111113]">
      <CultoPlusBrand className="!h-20" />
      <UserViewSwitcher isPastor={isPastor} canManage={canManage} />
      <nav aria-label="Navegação principal da visão pessoal" className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 no-scrollbar">
        {modules.map((item) => {
          const Icon = item.icon;
          const expanded = Boolean(openMenus[item.label]);
          const children = visibleSubItems(item.children, { isPastor, isVolunteer, canManage });
          return <div key={item.label} className="rounded-xl">
            <div className={`flex items-center rounded-xl border-l-4 transition ${expanded ? `${item.openTone} ${item.borderTone}` : "border-transparent hover:bg-[#f7f2ed] dark:hover:bg-white/5"}`}>
              <Link href={item.path} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-2.5 text-sm font-semibold"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconTone}`}><Icon size={19} /></span><span className="truncate">{item.label}</span></Link>
              <button type="button" onClick={() => toggleMenu(item.label)} aria-expanded={expanded} aria-controls={`submenu-${item.label.replace(/\s+/g, "-").toLowerCase()}`} aria-label={`${expanded ? "Recolher" : "Expandir"} submenu ${item.label}`} className={`mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 ${item.color} hover:bg-white/70 dark:hover:bg-white/10`}><ChevronDown size={17} className={`transition-transform ${expanded ? "rotate-180" : ""}`} /></button>
            </div>
            {expanded && <div id={`submenu-${item.label.replace(/\s+/g, "-").toLowerCase()}`} className={`ml-5 mt-1 space-y-0.5 rounded-r-xl border-l py-1 pl-3 pr-1 ${item.submenuTone} ${item.borderTone}`}>{children.map((child) => { const ChildIcon = child.icon; return <Link key={child.path} href={child.path} className={`flex min-h-10 items-center gap-2.5 rounded-lg px-2 text-xs font-semibold text-gray-600 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 dark:text-gray-300 ${item.hoverTone}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.iconTone}`}><ChildIcon size={14} /></span><span className="truncate">{child.label}</span></Link>; })}</div>}
          </div>;
        })}
      </nav>
      <div className="mt-auto border-t border-[#ece6df] pt-4 dark:border-white/10">
        <Link href="/perfil" className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-[#f7f2ed] dark:hover:bg-white/5">
          {avatar ? <img src={avatar} alt={userName} className="h-10 w-10 rounded-full object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eadff5] text-xs font-bold text-[#5b2b87]">{userName.slice(0, 2).toUpperCase()}</span>}
          <span className="min-w-0"><strong className="block truncate text-sm">{userName}</strong><small className="block truncate text-[11px] text-gray-500">{roleLabels.join(" · ") || "Membro"}</small></span>
        </Link>
      </div>
    </aside>
  );
}

function UserViewSwitcher({ isPastor, canManage }: { isPastor: boolean; canManage: boolean }) {
  return <div className="mt-6"><AppViewSwitcher activeView="personal" canOpenPastoral={isPastor} canOpenManagement={canManage} /></div>;
}

function MobileUserViewSwitcher({ isPastor, canManage }: { isPastor: boolean; canManage: boolean }) {
  if (!isPastor && !canManage) return null;

  return <section className="border-b border-[#ebe5de] bg-white px-4 py-3 lg:hidden dark:border-white/10 dark:bg-[#111113]"><div className="mx-auto max-w-[1440px]"><AppViewSwitcher activeView="personal" canOpenPastoral={isPastor} canOpenManagement={canManage} compact /></div></section>;
}

function HomeTabs({ activeTab, onChange }: { activeTab: HomeTab; onChange: (tab: HomeTab) => void }) {
  return (
    <div className="sticky top-0 z-40 border-y border-[#ebe5de] bg-[#fdfbf7]/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0b0c]/95">
      <div role="tablist" aria-label="Áreas da Home" className="mx-auto flex max-w-[1440px] snap-x overflow-x-auto px-4 md:px-8 lg:px-10 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;
          return (
            <button key={tab.id} type="button" role="tab" aria-selected={active} aria-controls={`newhome-panel-${tab.id}`} onClick={() => onChange(tab.id)} className={`relative flex min-h-14 min-w-[104px] snap-start items-center justify-center gap-2 px-4 text-sm transition md:min-w-[132px] ${active ? "font-semibold text-[#2d2a26] dark:text-white" : "text-gray-500 hover:text-[#2d2a26] dark:hover:text-white"}`}>
              <Icon size={19} />{tab.label}
              {active && <span className="absolute inset-x-4 bottom-0 h-[3px] rounded-full bg-gradient-to-r from-violet-700 via-fuchsia-600 to-[#ff5d55]" />}
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

  return <section className="border-b border-[#ebe5de] bg-white/80 px-4 py-2 lg:hidden dark:border-white/10 dark:bg-[#111113]/80">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-module-submenus" className="mx-auto flex min-h-11 w-full max-w-[1440px] items-center justify-between rounded-xl px-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600"><span className="flex items-center gap-2"><LayoutDashboard size={18} className="text-violet-700" /> Submenus dos módulos</span><ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} /></button>
    {open && <div id="mobile-module-submenus" className="mx-auto max-w-[1440px] pb-2"><div role="tablist" aria-label="Módulos" className="flex gap-2 overflow-x-auto py-2 no-scrollbar">{modules.map((item) => { const Icon = item.icon; const selectedItem = item.label === selected.label; return <button key={item.label} type="button" role="tab" aria-selected={selectedItem} onClick={() => setSelectedModule(item.label)} className={`flex min-h-12 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${selectedItem ? `${item.openTone} ${item.borderTone} ${item.color}` : "border-[#e4ded5] bg-white text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"}`}><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.iconTone}`}><Icon size={16} /></span>{item.label}</button>; })}</div><div role="tabpanel" aria-label={`Submenu ${selected.label}`} className={`grid grid-cols-2 gap-2 rounded-2xl border p-3 ${selected.submenuTone} ${selected.borderTone}`}>{children.map((child) => { const ChildIcon = child.icon; return <Link key={child.path} href={child.path} className={`flex min-h-12 items-center gap-2 rounded-xl bg-white px-3 text-xs font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 dark:bg-[#171719] ${selected.hoverTone}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${selected.iconTone}`}><ChildIcon size={15} /></span><span className="min-w-0 flex-1 truncate">{child.label}</span><ChevronRight size={14} className={selected.color} /></Link>; })}</div></div>}
  </section>;
}

function HomeOverviewV2(props: {
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
  const firstStudy = shelfItems.find((item) => item.type === "study");

  return (
    <div id="newhome-panel-inicio" role="tabpanel" aria-label="Início" className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">Bom dia, {userName}</h1>
        <p className="mt-1 text-gray-500">Sua jornada hoje</p>
      </div>

      {!currentUser && (
        <section className="flex flex-col gap-4 rounded-3xl border border-[#e6d7bf] bg-[#fff8ea] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-bold">Entre para personalizar sua Home</h2><p className="mt-1 text-sm text-gray-600">Continue estudos, acompanhe cultos e veja suas escalas.</p></div>
          <button onClick={onLogin} className="min-h-11 rounded-xl bg-[#2d2a26] px-5 text-sm font-bold text-white">Entrar</button>
        </section>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Link href="/bibliasagrada" className="group relative min-h-[330px] overflow-hidden rounded-3xl border border-[#e4ded5] bg-gradient-to-br from-[#fffaf0] to-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:from-[#201a13] dark:to-[#161616]">
              <div className="pointer-events-none absolute -bottom-20 -right-12 h-64 w-64 rounded-full bg-amber-200/30 blur-2xl" />
              <p className="font-semibold text-amber-700">Continuar leitura</p>
              <h2 className="mt-4 font-serif text-5xl">João 14</h2>
              <div className="mt-5 flex items-center gap-3"><BookOpen className="text-amber-600" /><div className="h-2 flex-1 rounded-full bg-[#e8e1d8]"><div className="h-full rounded-full bg-amber-600" style={{ width: `${Math.max(8, readingProgress)}%` }} /></div><span className="text-sm">{readingProgress}%</span></div>
              <blockquote className="mt-6 line-clamp-2 font-serif text-lg leading-8 text-gray-700 dark:text-gray-200">“{verse.text}”</blockquote>
              <span className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-600 px-5 font-semibold text-white">Continuar <ChevronRight size={18} /></span>
            </Link>

            <Link href={services[0] ? `/culto/${services[0].slug}` : "/culto"} className="group relative min-h-[330px] overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-[#f4fbf6] via-white to-[#d9f1e4] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-emerald-900/40 dark:from-emerald-950/40 dark:via-[#151515] dark:to-emerald-950/30">
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-emerald-500/20 blur-2xl" />
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">Próximo culto</p>
              <h2 className="relative mt-4 line-clamp-3 font-serif text-4xl leading-[1.05] text-emerald-950 dark:text-emerald-100">{services[0]?.title || "Cultos da sua igreja"}</h2>
              <div className="relative mt-6 flex items-center gap-3 text-lg"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"><CalendarDays size={21} /></span><span>{services[0] ? `${formatDate(services[0].startsAt, { weekday: "long" })}, ${formatTime(services[0].startsAt)}` : "Veja a agenda publicada"}</span></div>
              <span className="relative mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-5 font-semibold text-white">Ver agenda <ChevronRight size={18} /></span>
            </Link>
          </div>

          <JourneyCards readingProgress={readingProgress} verse={verse} firstStudy={firstStudy} />
        </div>

        <HomeRightRail services={services} assignments={assignments} loading={loading} isVolunteer={isVolunteer} nextAssignment={nextAssignment} onRespond={onRespond} />
      </div>

      <ServicesStrip services={services} />
      <StudyShelf filter={shelfFilter} onFilter={onShelfFilter} items={shelfItems} loading={loading} loadError={loadError} />
      {isPastor && <PastorRooms plans={ownedPlans} />}
      {isVolunteer && <VolunteerSection pending={pending} accepted={accepted} onRespond={onRespond} />}
      <ShortcutGrid />
    </div>
  );
}

function JourneyCards({ readingProgress, verse, firstStudy }: { readingProgress: number; verse: { text: string; ref: string }; firstStudy?: ShelfItem }) {
  const completed = Math.max(1, Math.round((readingProgress / 100) * 13));
  const items = [
    { title: "Meta de Leitura", subtitle: "13 capítulos por dia", href: "/plano-leitura", icon: BookOpen, tone: "bg-amber-600 text-white", content: <div className="mt-4 flex justify-center"><span className="flex h-20 w-20 items-center justify-center rounded-full p-[5px]" style={{ background: `conic-gradient(#b87808 ${Math.max(readingProgress, 8)}%, #efe6d8 0)` }}><span className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-[#2d2a26] dark:bg-[#161616] dark:text-white"><strong className="text-xl">{completed}</strong><small>de 13</small></span></span></div>, action: "Ver plano" },
    { title: "Pão Diário", subtitle: "Reflexão de hoje", href: "/devocional", icon: Coffee, tone: "bg-orange-600 text-white", content: <p className="mt-4 line-clamp-4 text-sm leading-5 text-gray-600 dark:text-gray-300">{verse.text}<span className="mt-1 block font-semibold text-orange-600">{verse.ref}</span></p>, action: "Ler agora" },
    { title: "Oração ao Amanhecer", subtitle: "Comece seu dia em oração", href: "/oracoes", icon: Heart, tone: "bg-sky-500 text-white", content: <div className="mt-4 rounded-2xl bg-sky-50 p-3 text-sm leading-5 text-sky-900 dark:bg-sky-950/30 dark:text-sky-200">Separe alguns minutos para agradecer e interceder.</div>, action: "Orar agora" },
    { title: "Meus Estudos", subtitle: firstStudy ? "Continue de onde parou" : "Sua biblioteca bíblica", href: "/estudos", icon: BookMarked, tone: "bg-cyan-600 text-white", content: <div className="mt-4 min-h-[76px] text-sm text-gray-600 dark:text-gray-300">{firstStudy ? <><span className="line-clamp-2 font-semibold text-[#2d2a26] dark:text-white">{firstStudy.title}</span><span className="mt-2 block text-xs">Atualizado em {formatDate(firstStudy.updatedAt)}</span></> : <span>Seus estudos e anotações aparecerão aqui.</span>}</div>, action: "Ver estudos" },
  ];
  return <section aria-label="Atalhos da jornada" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{items.map((item) => { const Icon = item.icon; return <Link key={item.title} href={item.href} className="flex min-h-[250px] flex-col rounded-2xl border border-[#e4ded5] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]"><span className={`flex h-11 w-11 items-center justify-center rounded-full ${item.tone}`}><Icon size={20} /></span><h3 className="mt-3 font-black leading-tight">{item.title}</h3><p className="mt-1 text-xs text-gray-500">{item.subtitle}</p>{item.content}<span className="mt-auto flex min-h-10 items-center justify-center rounded-xl border border-[#ded7cf] text-sm font-semibold dark:border-white/15">{item.action}</span></Link>; })}</section>;
}

function HomeRightRail({ services, assignments, loading, isVolunteer, nextAssignment, onRespond }: { services: ChurchService[]; assignments: ChurchAssignment[]; loading: boolean; isVolunteer: boolean; nextAssignment?: ChurchAssignment; onRespond: (assignment: ChurchAssignment, response: "accepted" | "declined") => void }) {
  const weekItems = [...services.slice(0, 2).map((item) => ({ id: `service-${item.id}`, title: item.title, date: item.startsAt, meta: item.status === "live" ? "Ao vivo" : "Culto" })), ...assignments.filter((item) => item.startsAt).slice(0, 2).map((item) => ({ id: `assignment-${item.id}`, title: item.title, date: item.startsAt!, meta: item.status === "pending" ? "Escala pendente" : "Minha escala" }))].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3);
  return <aside className="space-y-5 xl:sticky xl:top-20">
    <section className="rounded-3xl border border-[#e4ded5] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between"><h2 className="text-xl font-black">Minha semana</h2><Link href="/newhome?tab=calendario" className="text-sm font-semibold text-violet-700">Ver tudo</Link></div>
      {loading ? <LoadingCard label="Carregando agenda..." /> : weekItems.length ? <div className="mt-3 divide-y divide-[#ece6df] dark:divide-white/10">{weekItems.map((item) => <div key={item.id} className="flex gap-3 py-4"><span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-[#e7e0d8] text-emerald-800"><small className="text-[10px] font-bold uppercase">{formatDate(item.date, { month: "short" })}</small><strong className="text-xl leading-none">{formatDate(item.date, { day: "2-digit" })}</strong></span><span className="min-w-0"><strong className="line-clamp-2 text-sm">{item.title}</strong><small className="mt-1 block text-gray-500">{formatTime(item.date)} · {item.meta}</small></span></div>)}</div> : <p className="mt-4 rounded-2xl bg-[#f8f5f1] p-4 text-sm text-gray-500 dark:bg-white/5">Sua agenda aparecerá aqui.</p>}
      <Link href="/newhome?tab=calendario" className="mt-3 flex min-h-11 items-center justify-center rounded-xl border border-[#ded7cf] text-sm font-semibold dark:border-white/15">Ver agenda completa</Link>
    </section>

    {isVolunteer && <section className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20"><div className="flex items-center justify-between"><h2 className="font-black">Minha escala</h2><Link href="/minha-igreja/designacoes" className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Ver todas</Link></div>{nextAssignment ? <AssignmentAttention assignment={nextAssignment} onRespond={onRespond} /> : <p className="mt-3 text-sm text-gray-500">Nenhuma escala ativa.</p>}</section>}

    <section className="overflow-hidden rounded-3xl border border-[#e4ded5] bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between p-5 pb-3"><h2 className="text-xl font-black">No Reino</h2><Link href="/social" className="text-sm font-semibold text-violet-700">Ver tudo</Link></div>
      <div className="px-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-700 to-orange-500 text-white"><Users size={18} /></span><span><strong className="block text-sm">Comunidade Culto+</strong><small className="text-gray-500">Hoje</small></span></div><p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">Compartilhe testemunhos, reflexões e acompanhe o que Deus está fazendo na sua comunidade.</p></div>
      <div className="mx-5 mt-3 flex h-36 items-end overflow-hidden rounded-2xl bg-gradient-to-br from-violet-950 via-fuchsia-700 to-orange-400 p-4"><p className="max-w-[220px] font-serif text-xl font-bold text-white">“Onde estiverem dois ou três reunidos...”</p></div>
      <div className="flex items-center gap-5 px-5 py-4 text-sm text-gray-500"><span className="flex items-center gap-1"><Heart size={18} /> 124</span><span className="flex items-center gap-1"><MessageCircle size={18} /> 18</span></div>
      <Link href="/social" className="mx-5 mb-5 flex min-h-11 items-center justify-center rounded-xl border border-[#ded7cf] text-sm font-semibold dark:border-white/15">Ver no Reino</Link>
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
      <div><h1 className="text-3xl font-black tracking-tight md:text-4xl">Bom dia, {userName}</h1><p className="mt-1 text-gray-500">Sua jornada hoje</p></div>
      {!currentUser && <section className="flex flex-col gap-4 rounded-3xl border border-[#e6d7bf] bg-[#fff8ea] p-5 text-[#2d2a26] sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold">Entre para personalizar sua Home</h2><p className="mt-1 text-sm text-gray-600">Continue estudos, acompanhe cultos e veja suas escalas.</p></div><button onClick={onLogin} className="min-h-11 rounded-xl bg-[#2d2a26] px-5 text-sm font-bold text-white">Entrar</button></section>}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5 md:grid-cols-2">
          <Link href="/bibliasagrada" className="group relative min-h-[300px] overflow-hidden rounded-3xl border border-[#e4ded5] bg-gradient-to-br from-[#fffaf0] to-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:from-[#201a13] dark:to-[#161616]">
            <p className="font-semibold text-amber-700">Continuar leitura</p><h2 className="mt-4 font-serif text-5xl">João 14</h2><div className="mt-5 flex items-center gap-3"><BookOpen className="text-amber-600" /><div className="h-2 flex-1 rounded-full bg-[#e8e1d8]"><div className="h-full rounded-full bg-amber-600" style={{ width: `${Math.max(8, readingProgress)}%` }} /></div><span className="text-sm">{readingProgress}%</span></div><blockquote className="mt-6 font-serif text-lg leading-8 text-gray-700 dark:text-gray-200">“{verse.text}”</blockquote><span className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-600 px-5 font-semibold text-white">Continuar <ChevronRight size={18} /></span>
          </Link>
          <Link href={services[0] ? `/culto/${services[0].slug}` : "/culto"} className="relative min-h-[300px] overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-emerald-900/40 dark:from-emerald-950/40 dark:via-[#151515] dark:to-emerald-950/30">
            <p className="font-semibold text-emerald-700 dark:text-emerald-300">Próximo culto</p><h2 className="mt-4 font-serif text-4xl leading-tight text-emerald-950 dark:text-emerald-100">{services[0]?.title || "Cultos da sua igreja"}</h2><div className="mt-6 flex items-center gap-3 text-lg"><CalendarDays className="text-emerald-700" /><span>{services[0] ? `${formatDate(services[0].startsAt, { weekday: "long" })}, ${formatTime(services[0].startsAt)}` : "Veja a agenda publicada"}</span></div><span className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-5 font-semibold text-white">Ver agenda <ChevronRight size={18} /></span>
          </Link>
        </div>
        <section className="rounded-3xl border border-[#e4ded5] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="text-xl font-bold">Precisa da sua atenção</h2>
          {loading ? <LoadingCard label="Carregando sua agenda..." /> : nextAssignment ? <AssignmentAttention assignment={nextAssignment} onRespond={onRespond} /> : <div className="mt-5 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"><Check className="mb-3" />Nenhuma pendência urgente agora.</div>}
          {accepted && accepted.id !== nextAssignment?.id && <div className="mt-3 flex items-center gap-3 rounded-2xl border border-emerald-200 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-white"><Check size={18} /></span><div className="min-w-0"><strong className="block truncate text-sm">{accepted.title}</strong><span className="text-xs text-gray-500">{formatDate(accepted.startsAt)} · {formatTime(accepted.startsAt)} · Confirmada</span></div></div>}
          {isVolunteer && <Link href="/minha-igreja/designacoes" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">Ver minhas designações <ChevronRight size={16} /></Link>}
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

function AssignmentAttention({ assignment, onRespond }: { assignment: ChurchAssignment; onRespond: (assignment: ChurchAssignment, response: "accepted" | "declined") => void }) {
  const pending = assignment.status === "pending";
  return <div className={`mt-5 rounded-2xl border p-5 ${pending ? "border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20" : "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20"}`}><p className={`text-xs font-bold uppercase tracking-wider ${pending ? "text-amber-700" : "text-emerald-700 dark:text-emerald-300"}`}>{pending ? "Convite de escala" : "Próxima escala"}</p><h3 className="mt-2 text-xl font-black">{assignment.title}</h3><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{formatDate(assignment.startsAt)} · {formatTime(assignment.startsAt)}</p>{pending && <div className="mt-4 grid grid-cols-2 gap-3"><button onClick={() => onRespond(assignment, "accepted")} className="min-h-11 rounded-xl bg-amber-600 text-sm font-bold text-white">Aceitar</button><button onClick={() => onRespond(assignment, "declined")} className="min-h-11 rounded-xl border border-amber-300 bg-white text-sm font-bold text-amber-800 dark:bg-transparent">Recusar</button></div>}</div>;
}

function ServicesStrip({ services }: { services: ChurchService[] }) {
  return <section className="rounded-3xl border border-[#e4ded5] bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Próximos cultos</h2><Link href="/culto" className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Ver agenda completa</Link></div><div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-2">{services.length ? services.slice(0, 4).map((service) => <Link key={service.id} href={`/culto/${service.slug}`} className="flex min-w-[270px] snap-start items-center gap-4 rounded-2xl border border-[#e8e2da] p-4 transition hover:border-emerald-400 dark:border-white/10"><span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"><small className="uppercase">{formatDate(service.startsAt, { month: "short" })}</small><strong className="text-xl">{formatDate(service.startsAt, { day: "2-digit" })}</strong></span><span className="min-w-0"><strong className="block truncate">{service.title}</strong><small className="text-gray-500">{formatTime(service.startsAt)} · {service.status === "live" ? "Ao vivo" : "Publicado"}</small></span><ChevronRight className="ml-auto shrink-0 text-gray-400" size={18} /></Link>) : <p className="rounded-2xl bg-[#f8f5f1] p-5 text-sm text-gray-500 dark:bg-white/5">Nenhum culto publicado nos próximos 30 dias.</p>}</div></section>;
}

function StudyShelf({ filter, onFilter, items, loading, loadError }: { filter: ShelfFilter; onFilter: (filter: ShelfFilter) => void; items: ShelfItem[]; loading: boolean; loadError: boolean }) {
  const filters: Array<{ id: ShelfFilter; label: string }> = [{ id: "all", label: "Tudo" }, { id: "study", label: "Estudos" }, { id: "plan", label: "Salas" }, { id: "note", label: "Notas" }];
  return <section><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Estudos</p><h2 className="mt-1 text-2xl font-black">Continue estudando</h2></div><Link href="/estudos" className="min-h-11 rounded-xl border border-cyan-700 px-4 py-3 text-sm font-semibold text-cyan-800 dark:text-cyan-300">Ver biblioteca</Link></div><div className="mt-4 flex gap-2 overflow-x-auto pb-1">{filters.map((item) => <button key={item.id} onClick={() => onFilter(item.id)} className={`min-h-11 whitespace-nowrap rounded-xl px-5 text-sm font-semibold ${filter === item.id ? "bg-cyan-700 text-white" : "border border-[#dfd9d1] bg-white text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"}`}>{item.label}</button>)}</div>{loadError && <p className="mt-3 text-sm text-amber-700">Alguns conteúdos não puderam ser carregados agora.</p>}<div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-3"><Link href="/criar-conteudo" className="flex min-h-[200px] min-w-[170px] snap-start flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-400 bg-cyan-50/60 text-cyan-800 dark:bg-cyan-950/20 dark:text-cyan-200"><Plus size={30} /><span className="mt-3 font-semibold">Novo estudo</span></Link>{loading ? <LoadingCard label="Carregando estudos..." /> : items.length ? items.map((item) => <ShelfCard key={`${item.type}-${item.id}`} item={item} />) : <div className="flex min-h-[200px] min-w-[260px] items-center justify-center rounded-2xl border border-[#e4ded5] bg-white p-5 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-white/5">Nenhum conteúdo neste filtro.</div>}</div></section>;
}

function ShelfCard({ item }: { item: ShelfItem }) {
  const route = item.type === "plan" ? (item.isEnrolled ? `/jornada/${item.id}` : `/criar-sala?id=${item.id}`) : item.type === "note" ? "/estudos" : `/v/${item.id}`;
  const tone = item.type === "plan" ? "from-violet-700 to-fuchsia-600" : item.type === "note" ? "from-amber-700 to-orange-500" : "from-cyan-800 to-sky-500";
  return <Link href={route} className="min-h-[200px] min-w-[260px] snap-start overflow-hidden rounded-2xl border border-[#e4ded5] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]"><div className={`relative h-24 bg-gradient-to-br ${tone}`}>{item.coverUrl && <img src={item.coverUrl} alt="" className="h-full w-full object-cover opacity-70" />}<span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-black uppercase text-[#2d2a26]">{item.type === "plan" ? "Sala" : item.type === "note" ? "Nota" : "Estudo"}</span></div><div className="p-4"><h3 className="line-clamp-2 min-h-12 font-bold">{item.title}</h3><div className="mt-3 flex items-center justify-between text-xs text-gray-500"><span>{item.isEnrolled ? "Inscrito" : item.status === "published" ? "Publicado" : item.type === "note" ? "Anotação" : "Em andamento"}</span><span>{formatDate(item.updatedAt)}</span></div></div></Link>;
}

function PastorRooms({ plans }: { plans: CustomPlan[] }) {
  return <section><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">Área pastoral</p><h2 className="mt-1 text-2xl font-black text-violet-950 dark:text-violet-200">Minhas salas</h2><p className="text-sm text-gray-500">Salas que você criou</p></div><div className="flex gap-2"><Link href="/workspace-pastoral" className="min-h-11 rounded-xl border border-violet-300 px-4 py-3 text-sm font-semibold text-violet-800 dark:text-violet-200">Gerenciar salas</Link><Link href="/criar-sala" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white"><Plus size={16} /> Nova sala</Link></div></div><div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-3">{plans.length ? plans.slice(0, 5).map((plan) => <Link key={plan.id} href={`/criar-sala?id=${plan.id}`} className="min-w-[280px] snap-start rounded-2xl border border-violet-200 bg-white p-5 dark:border-violet-900/50 dark:bg-white/[0.04]"><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-700 text-white"><Users size={20} /></span><span className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${plan.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>{plan.status === "published" ? "Publicada" : "Rascunho"}</span></div><h3 className="mt-4 text-lg font-black">{plan.title}</h3><p className="mt-3 text-sm text-gray-500">{plan.subscribersCount || 0} participantes</p><p className="mt-1 text-sm text-gray-500">{plan.startDate ? `Próximo encontro: ${formatDate(plan.startDate)}` : "Sem encontro agendado"}</p></Link>) : <div className="rounded-2xl border border-dashed border-violet-300 p-6 text-sm text-gray-500">Você ainda não criou salas. <Link href="/criar-sala" className="font-semibold text-violet-700">Criar primeira sala</Link></div>}</div></section>;
}

function VolunteerSection({ pending, accepted, onRespond }: { pending?: ChurchAssignment; accepted?: ChurchAssignment; onRespond: (assignment: ChurchAssignment, response: "accepted" | "declined") => void }) {
  return <section><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Serviço</p><h2 className="mt-1 text-2xl font-black text-emerald-950 dark:text-emerald-200">Minha escala</h2></div><Link href="/minha-igreja/designacoes" className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Ver designações</Link></div><div className="mt-4 grid gap-4 md:grid-cols-2">{pending && <AssignmentAttention assignment={pending} onRespond={onRespond} />}{accepted && <div className="rounded-2xl border border-emerald-200 bg-white p-5 dark:border-emerald-900 dark:bg-white/[0.04]"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Confirmada</p><h3 className="mt-2 text-xl font-black">{accepted.title}</h3><p className="mt-2 text-sm text-gray-500">{formatDate(accepted.startsAt)} · {formatTime(accepted.startsAt)}</p></div>}{!pending && !accepted && <div className="rounded-2xl border border-[#e4ded5] bg-white p-5 text-sm text-gray-500 dark:border-white/10 dark:bg-white/[0.04]">Nenhuma escala ativa no momento.</div>}</div></section>;
}

function ShortcutGrid() {
  return <section><h2 className="text-2xl font-black">Explore o Culto+</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{shortcuts.map((item) => { const Icon = item.icon; return <Link key={item.label} href={item.path} className="group flex min-h-[104px] items-center gap-4 rounded-2xl border border-[#e4ded5] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${item.color}`}><Icon size={22} /></span><span className="min-w-0"><strong className="block">{item.label}</strong><small className="mt-1 block leading-5 text-gray-500">{item.description}</small></span><ChevronRight className="ml-auto shrink-0 text-gray-300 group-hover:text-gray-500" size={18} /></Link>; })}</div></section>;
}

function CreateTabV2({ isPastor, currentUser, onLogin }: { isPastor: boolean; currentUser: boolean; onLogin: () => void }) {
  const tools = [
    { label: "Gerar Imagens", description: "Crie artes sacras inspiradas em textos bíblicos.", path: "/criar-arte-sacra", icon: FileImage, tone: "bg-blue-100 text-blue-700" },
    { label: "Gerar Podcast", description: "Transforme reflexões em episódios narrados.", path: "/criar-podcast", icon: Music2, tone: "bg-pink-100 text-pink-700" },
    { label: "Esboços com IA", description: "Estruture estudos, mensagens e devocionais.", path: "/criar-conteudo", icon: Wand2, tone: "bg-emerald-100 text-emerald-700" },
    ...(isPastor ? [{ label: "Criar Sala", description: "Monte uma jornada para sua comunidade.", path: "/criar-sala", icon: Users, tone: "bg-violet-100 text-violet-700" }] : []),
  ];
  return <div id="newhome-panel-criar" role="tabpanel" className="space-y-6">
    <section className="relative overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-r from-[#fffaf5] via-white to-violet-50 p-6 md:p-8 dark:border-violet-900/40 dark:from-[#1a151c] dark:via-[#151515] dark:to-violet-950/30"><div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-fuchsia-400/15 blur-3xl" /><div className="relative flex flex-col gap-5 md:flex-row md:items-center"><span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-700 to-fuchsia-600 text-white shadow-lg"><Sparkles size={30} /></span><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Criar</p><h1 className="mt-2 text-3xl font-black">Seu estúdio criativo</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Gere imagens bíblicas, episódios de podcast e esboços com assistentes especializados.</p></div><span className="md:ml-auto rounded-xl bg-emerald-100 px-4 py-3 text-sm font-bold text-emerald-800">IA disponível</span></div></section>
    {!currentUser && <button onClick={onLogin} className="min-h-11 rounded-xl bg-[#2d2a26] px-5 font-bold text-white">Entrar para criar</button>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{tools.map((item) => { const Icon = item.icon; return <Link key={item.label} href={currentUser ? item.path : "#"} onClick={(event) => { if (!currentUser) { event.preventDefault(); onLogin(); } }} className="group flex min-h-[190px] flex-col rounded-3xl border border-[#e4ded5] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.04]"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}><Icon size={23} /></span><h2 className="mt-auto text-xl font-black">{item.label}</h2><p className="mt-2 text-sm leading-6 text-gray-500">{item.description}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider">Iniciar <ChevronRight size={14} /></span></Link>; })}</section>
    <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-3xl border border-[#e4ded5] bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]"><h2 className="flex items-center gap-2 font-black"><History size={18} /> Histórico recente</h2><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{["Criação", "Mar Vermelho", "Jerusalém", "Daniel"].map((title, index) => <Link href="/historico" key={title} className={`flex aspect-square flex-col justify-end rounded-2xl bg-gradient-to-br p-3 text-white ${index % 2 ? "from-fuchsia-800 to-orange-500" : "from-blue-900 to-cyan-500"}`}><span className="text-xs font-semibold">{title}</span></Link>)}</div></section><section className="rounded-3xl border border-[#e4ded5] bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]"><h2 className="flex items-center gap-2 font-black"><BookOpen size={18} /> Dicas de prompt</h2><div className="mt-5 space-y-3"><div className="rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200"><strong className="block">Imagens</strong>Descreva o cenário, o estilo artístico e a iluminação desejada.</div><div className="rounded-2xl bg-pink-50 p-4 text-sm leading-6 text-pink-900 dark:bg-pink-950/30 dark:text-pink-200"><strong className="block">Podcasts</strong>Informe o texto-base e escolha um tom encorajador ou reflexivo.</div></div></section></div>
  </div>;
}

function KingdomTabV2() {
  return <div id="newhome-panel-reino" role="tabpanel" className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-700">Reino</p><h1 className="mt-2 text-3xl font-black">Comunidade e comunhão</h1><p className="mt-2 text-gray-500">Acompanhe reflexões, testemunhos e pedidos de oração.</p></div><div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><section className="space-y-4"><div className="rounded-3xl border border-[#e4ded5] bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-violet-700"><UserRound size={20} /></span><Link href="/social" className="flex min-h-11 flex-1 items-center rounded-full bg-[#f7f3ee] px-4 text-sm text-gray-500 dark:bg-white/5">Compartilhe algo com o Reino...</Link></div><div className="mt-4 flex gap-3 border-t border-[#ece6df] pt-4 text-sm dark:border-white/10"><Link href="/social" className="flex items-center gap-2 font-semibold text-fuchsia-700"><FileImage size={18} /> Publicar</Link><Link href="/social/oracao" className="flex items-center gap-2 font-semibold text-indigo-700"><Heart size={18} /> Pedir oração</Link></div></div><article className="overflow-hidden rounded-3xl border border-[#e4ded5] bg-white dark:border-white/10 dark:bg-white/[0.04]"><div className="p-5"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-700 to-orange-500 text-white"><Church size={20} /></span><span><strong className="block text-sm">Comunidade Culto+</strong><small className="text-gray-500">Reflexão de hoje</small></span></div><p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300">Deus tem sido fiel em cada detalhe. Compartilhe com a comunidade aquilo que fortaleceu sua fé nesta semana.</p></div><div className="flex h-56 items-end bg-gradient-to-br from-indigo-950 via-violet-800 to-orange-400 p-6"><p className="max-w-sm font-serif text-2xl font-bold text-white">Uma comunidade reunida pela Palavra.</p></div><div className="flex gap-6 p-5 text-sm text-gray-500"><span className="flex items-center gap-2"><Heart size={19} /> 124</span><span className="flex items-center gap-2"><MessageCircle size={19} /> 18</span></div></article></section><aside className="space-y-4"><ShortcutCard href="/social" icon={Users} title="Abrir o feed" description="Veja todas as publicações da comunidade" tone="bg-fuchsia-100 text-fuchsia-800" /><ShortcutCard href="/social/oracao" icon={Heart} title="Sala de oração" description="Pedidos e intercessões da comunidade" tone="bg-indigo-100 text-indigo-800" /><ShortcutCard href="/social/explore" icon={Search} title="Explorar" description="Encontre igrejas, pessoas e conteúdos" tone="bg-orange-100 text-orange-800" /></aside></div></div>;
}

function ManagementTabV2({ canManage, hasChurch }: { canManage: boolean; hasChurch: boolean }) {
  const cards = [
    { title: "Pessoas", desc: "Diretório e acompanhamento", icon: Users, path: "/gestao-igreja/pessoas", tone: "bg-blue-100 text-blue-700" },
    { title: "Equipes", desc: "Líderes e voluntários", icon: Target, path: "/gestao-igreja/equipes", tone: "bg-emerald-100 text-emerald-700" },
    { title: "QR Codes", desc: "Check-in e formulários", icon: QrCode, path: "/gestao-igreja/qrcodes", tone: "bg-cyan-100 text-cyan-700" },
    { title: "Inbox Pastoral", desc: "Pedidos e aconselhamento", icon: Heart, path: "/gestao-igreja/inbox", tone: "bg-pink-100 text-pink-700" },
    { title: "Designações", desc: "Funções e tarefas", icon: Check, path: "/gestao-igreja/designacoes", tone: "bg-orange-100 text-orange-700" },
    { title: "Notificações", desc: "Avisos e alertas", icon: Bell, path: "/gestao-igreja/notificacoes", tone: "bg-yellow-100 text-yellow-700" },
    { title: "Permissões", desc: "Controle de acesso", icon: ShieldCheck, path: "/gestao-igreja/permissoes", tone: "bg-violet-100 text-violet-700" },
    { title: "Indicadores", desc: "Métricas da igreja", icon: LayoutDashboard, path: "/gestao-igreja/indicadores", tone: "bg-slate-200 text-slate-700" },
  ];
  return <div id="newhome-panel-gestao" role="tabpanel" className="space-y-6"><section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-[#31253d] p-6 text-white md:p-8"><Church className="text-amber-400" size={30} /><h1 className="mt-4 text-3xl font-black">Gestão da Igreja</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">Pessoas, equipes, comunicação e indicadores em um painel protegido por permissões.</p></section>{canManage && hasChurch ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => { const Icon = card.icon; return <Link key={card.title} href={card.path} className="group min-h-[150px] rounded-3xl border border-[#e4ded5] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.04]"><div className="flex items-start justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.tone}`}><Icon size={20} /></span><ChevronRight size={18} className="text-gray-300" /></div><h2 className="mt-5 font-black">{card.title}</h2><p className="mt-1 text-sm text-gray-500">{card.desc}</p></Link>; })}</div> : <section className="max-w-2xl rounded-3xl border border-[#e4ded5] bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]"><ShieldCheck className="text-blue-700" /><h2 className="mt-4 text-xl font-black">Área protegida</h2><p className="mt-2 text-sm leading-7 text-gray-500">A gestão aparece para pastores, gestores e líderes autorizados. Sua área pessoal e suas escalas continuam disponíveis.</p><Link href={hasChurch ? "/minha-igreja" : "/social/igrejas"} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-5 text-sm font-bold text-white">{hasChurch ? "Abrir Minha Igreja" : "Encontrar uma igreja"}</Link></section>}</div>;
}

function CalendarTabV2({ services, assignments, loading }: { services: ChurchService[]; assignments: ChurchAssignment[]; loading: boolean }) {
  const pending = assignments.filter((item) => item.status === "pending");
  const events = [...services.map((service) => ({ id: `service-${service.id}`, date: service.startsAt, title: service.title, meta: service.churchName || "Culto", tone: "bg-emerald-600" })), ...assignments.filter((item) => item.startsAt).map((item) => ({ id: `assignment-${item.id}`, date: item.startsAt!, title: item.title, meta: item.status === "pending" ? "Convite pendente" : "Minha escala", tone: item.status === "pending" ? "bg-amber-500" : "bg-blue-600" }))].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return <div id="newhome-panel-calendario" role="tabpanel" className="space-y-6"><section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-950 p-6 text-white md:p-8"><CalendarDays size={30} className="text-blue-200" /><h1 className="mt-4 text-3xl font-black">Meu calendário</h1><p className="mt-2 max-w-2xl text-sm text-blue-100">Cultos, escalas e convites reunidos em uma única agenda.</p></section><div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><section className="rounded-3xl border border-[#e4ded5] bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Próximos compromissos</h2><span className="text-sm text-gray-500">{events.length} itens</span></div>{loading ? <LoadingCard label="Carregando compromissos..." /> : events.length ? <div className="mt-4 space-y-3">{events.slice(0, 10).map((event) => <div key={event.id} className="flex items-center gap-4 rounded-2xl border border-[#ece6df] p-4 dark:border-white/10"><span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#f7f3ee] dark:bg-white/5"><small>{formatDate(event.date, { month: "short" }).toUpperCase()}</small><strong className="text-xl">{formatDate(event.date, { day: "2-digit" })}</strong></span><span className={`h-10 w-1 rounded-full ${event.tone}`} /><span className="min-w-0"><strong className="block truncate">{event.title}</strong><small className="text-gray-500">{event.meta} · {formatTime(event.date)}</small></span></div>)}</div> : <p className="mt-4 rounded-2xl bg-[#f8f5f1] p-5 text-sm text-gray-500 dark:bg-white/5">Nenhum compromisso encontrado para os próximos dias.</p>}</section><aside className="space-y-5"><section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/40 dark:bg-amber-950/20"><h2 className="font-black">Convites pendentes</h2><strong className="mt-3 block text-4xl text-amber-700">{pending.length}</strong><p className="mt-2 text-sm text-gray-500">Escalas aguardando sua resposta.</p><Link href="/minha-igreja/designacoes" className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-amber-600 text-sm font-bold text-white">Ver convites</Link></section><section className="rounded-3xl border border-[#e4ded5] bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"><h2 className="font-black">Atalhos</h2><Link href="/culto" className="mt-4 flex min-h-11 items-center justify-between border-b border-[#ece6df] text-sm dark:border-white/10">Agenda de cultos <ChevronRight size={16} /></Link><Link href="/minha-igreja/designacoes" className="flex min-h-11 items-center justify-between text-sm">Minha escala <ChevronRight size={16} /></Link></section></aside></div></div>;
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

function ShortcutCard({ href, icon: Icon, title, description, tone }: { href: string; icon: React.ElementType; title: string; description: string; tone: string }) {
  return <Link href={href} className="rounded-3xl border border-[#e4ded5] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.04]"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}><Icon size={23} /></span><h2 className="mt-5 text-xl font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-gray-500">{description}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Abrir <ChevronRight size={16} /></span></Link>;
}

function LoadingCard({ label }: { label: string }) {
  return <div className="flex min-h-[120px] min-w-[240px] items-center justify-center gap-3 rounded-2xl border border-[#e4ded5] bg-white p-5 text-sm text-gray-500 dark:border-white/10 dark:bg-white/[0.04]"><Loader2 className="animate-spin" size={18} />{label}</div>;
}
