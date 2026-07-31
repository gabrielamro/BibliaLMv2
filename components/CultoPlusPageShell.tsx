"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Brain,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Church,
  ClipboardCheck,
  Coffee,
  FilePenLine,
  HandHeart,
  Home,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Radio,
  Search,
  Settings,
  Target,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useHeader } from "../contexts/HeaderContext";
import { useSettings } from "../contexts/SettingsContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useLocation } from "../utils/router";
import { churchManagementService } from "../services/churchManagementService";
import { canAccessChurchManagement } from "../utils/churchManagementRules";
import { dbService } from "../services/supabase";
import AppViewSwitcher from "./AppViewSwitcher";
import CultoPlusBrand from "./CultoPlusBrand";
import ManagerNotificationCenter from "./church-management/ManagerNotificationCenter";
import type { AppModuleId } from "../constants";

type CultoPlusPageShellProps = {
  children: React.ReactNode;
  isPastor?: boolean;
  userName?: string;
  avatar?: string | null;
  compactDesktop?: boolean;
};

type ModuleItem = {
  module: AppModuleId;
  label: string;
  href: string;
  icon: React.ElementType;
  iconTone: string;
  color: string;
  openTone: string;
  borderTone: string;
  submenuTone: string;
  hoverTone: string;
  pastoralOnly?: boolean;
  children: Array<{ label: string; href: string; icon: React.ElementType }>;
};

const DESKTOP_MENU_STORAGE_KEY = "cultoplus_sidebar_compact";

const modules: ModuleItem[] = [
  {
    module: "home",
    label: "Início", href: "/newhome", icon: Home,
    iconTone: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300", color: "text-violet-700 dark:text-violet-300", openTone: "bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10", borderTone: "border-violet-300 dark:border-violet-500/30", submenuTone: "bg-violet-50/70 dark:bg-violet-500/[0.06]", hoverTone: "hover:bg-violet-100/80 dark:hover:bg-violet-500/15",
    children: [{ label: "Visão geral", href: "/newhome", icon: Home }, { label: "Calendário", href: "/newhome?tab=calendario", icon: CalendarDays }],
  },
  {
    module: "bible",
    label: "Bíblia", href: "/bibliasagrada", icon: BookOpen,
    iconTone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", color: "text-amber-700 dark:text-amber-300", openTone: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10", borderTone: "border-amber-300 dark:border-amber-500/30", submenuTone: "bg-amber-50/70 dark:bg-amber-500/[0.06]", hoverTone: "hover:bg-amber-100/80 dark:hover:bg-amber-500/15",
    children: [
      { label: "Bíblia Sagrada", href: "/bibliasagrada", icon: BookOpen },
      { label: "Pão Diário", href: "/devocional", icon: Coffee },
      { label: "Meta de leitura", href: "/plano", icon: Target },
      { label: "Orações", href: "/oracoes", icon: HandHeart },
      { label: "Quiz Bíblico", href: "/quiz", icon: Brain },
    ],
  },
  {
    module: "kingdom",
    label: "Reino", href: "/social", icon: Users,
    iconTone: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300", color: "text-fuchsia-700 dark:text-fuchsia-300", openTone: "bg-gradient-to-r from-fuchsia-50 to-rose-50 dark:from-fuchsia-500/10 dark:to-rose-500/10", borderTone: "border-fuchsia-300 dark:border-fuchsia-500/30", submenuTone: "bg-fuchsia-50/70 dark:bg-fuchsia-500/[0.06]", hoverTone: "hover:bg-fuchsia-100/80 dark:hover:bg-fuchsia-500/15",
    children: [{ label: "Feed", href: "/social", icon: Users }, { label: "Igrejas", href: "/social/igrejas", icon: Church }, { label: "Explorar", href: "/social/explore", icon: Search }],
  },
  {
    module: "cultos",
    label: "Cultos", href: "/meus-cultos", icon: CalendarDays,
    iconTone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", color: "text-emerald-700 dark:text-emerald-300", openTone: "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10", borderTone: "border-emerald-300 dark:border-emerald-500/30", submenuTone: "bg-emerald-50/70 dark:bg-emerald-500/[0.06]", hoverTone: "hover:bg-emerald-100/80 dark:hover:bg-emerald-500/15",
    children: [
      { label: "Agenda de cultos", href: "/culto", icon: CalendarDays },
      { label: "Meu painel", href: "/meus-cultos", icon: Radio },
      { label: "Minha escala", href: "/meus-cultos#escala", icon: ClipboardCheck },
      { label: "Minhas equipes", href: "/meus-cultos#equipes", icon: Users },
      { label: "Solicitações", href: "/meus-cultos#solicitacoes", icon: FilePenLine },
    ],
  },
  {
    module: "create",
    label: "Criar", href: "/newhome?tab=criar", icon: PenLine,
    iconTone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300", color: "text-indigo-700 dark:text-indigo-300", openTone: "bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10", borderTone: "border-indigo-300 dark:border-indigo-500/30", submenuTone: "bg-indigo-50/70 dark:bg-indigo-500/[0.06]", hoverTone: "hover:bg-indigo-100/80 dark:hover:bg-indigo-500/15",
    children: [{ label: "Estúdio Criativo", href: "/newhome?tab=criar", icon: PenLine }, { label: "Arte Sacra", href: "/criar-arte-sacra", icon: FilePenLine }, { label: "Registrar culto", href: "/meus-cultos/novo", icon: FilePenLine }],
  },
  {
    module: "pastoral",
    label: "Workspace Pastoral", href: "/workspace-pastoral", icon: LayoutDashboard, pastoralOnly: true,
    iconTone: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300", color: "text-purple-700 dark:text-purple-300", openTone: "bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-500/10 dark:to-fuchsia-500/10", borderTone: "border-purple-300 dark:border-purple-500/30", submenuTone: "bg-purple-50/70 dark:bg-purple-500/[0.06]", hoverTone: "hover:bg-purple-100/80 dark:hover:bg-purple-500/15",
    children: [{ label: "Painel pastoral", href: "/workspace-pastoral", icon: LayoutDashboard }, { label: "Gerenciar cultos", href: "/workspace-pastoral/cultos", icon: CalendarDays }],
  },
  {
    module: "neutral",
    label: "Configurações", href: "/minha-conta", icon: Settings,
    iconTone: "bg-slate-200 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300", color: "text-slate-700 dark:text-slate-300", openTone: "bg-gradient-to-r from-slate-100 to-gray-50 dark:from-slate-500/10 dark:to-gray-500/10", borderTone: "border-slate-300 dark:border-slate-500/30", submenuTone: "bg-slate-100/70 dark:bg-slate-500/[0.06]", hoverTone: "hover:bg-slate-200/80 dark:hover:bg-slate-500/15",
    children: [{ label: "Minha conta", href: "/minha-conta", icon: Settings }, { label: "Meu perfil", href: "/perfil", icon: Users }],
  },
];

function submenuId(label: string) {
  return `cultoplus-submenu-${label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").toLowerCase()}`;
}

function routePath(href: string) {
  return href.split(/[?#]/)[0] || "/";
}

function isModuleActive(item: ModuleItem, pathname: string) {
  return [item.href, ...item.children.map((child) => child.href)].some((href) => {
    const path = routePath(href);
    if (path === "/bibliasagrada" && pathname === "/biblia") return true;
    return pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));
  });
}

export default function CultoPlusPageShell({ children, isPastor = false, userName, avatar, compactDesktop = false }: CultoPlusPageShellProps) {
  const location = useLocation();
  const { currentUser, userProfile } = useAuth();
  const { isHeaderHidden } = useHeader();
  const { isFocusMode } = useSettings();
  const { isPastor: hasWorkspaceAccess } = useWorkspace();
  const churchId = userProfile?.churchData?.churchId;
  const currentUserId = currentUser?.id ?? currentUser?.uid ?? userProfile?.uid;
  const pastoralAccess = isPastor || hasWorkspaceAccess;
  const [canManage, setCanManage] = useState(userProfile?.subscriptionTier === "admin");

  useEffect(() => {
    if (userProfile?.subscriptionTier === "admin") {
      setCanManage(true);
      return;
    }
    if (!churchId || !currentUserId) {
      setCanManage(false);
      return;
    }

    let isMounted = true;
    void Promise.all([
      churchManagementService.listRoles(churchId, { limit: 200 }),
      dbService.isUserChurchManager(currentUserId, churchId),
    ])
      .then(([roles, isChurchManager]) => {
        if (!isMounted) return;
        setCanManage(isChurchManager || canAccessChurchManagement({ userId: currentUserId, roles }));
      })
      .catch(() => {
        if (isMounted) setCanManage(false);
      });

    return () => {
      isMounted = false;
    };
  }, [churchId, currentUserId, userProfile?.subscriptionTier]);
  const visibleModules = useMemo(() => modules.filter((item) => !item.pastoralOnly || pastoralAccess), [pastoralAccess]);
  const activeModule = useMemo(
    () => visibleModules.find((item) => isModuleActive(item, location.pathname)) ?? visibleModules[0],
    [location.pathname, visibleModules],
  );
  const resolvedUserName = userName || userProfile?.displayName || userProfile?.username || "Membro";
  const resolvedAvatar = avatar ?? userProfile?.photoURL ?? null;
  const [isDesktopMenuCompact, setIsDesktopMenuCompact] = useState(compactDesktop);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => ({ [activeModule.label]: true }));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileModule, setMobileModule] = useState(activeModule.label);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const storedPreference = window.localStorage.getItem(DESKTOP_MENU_STORAGE_KEY);
      if (storedPreference !== null) setIsDesktopMenuCompact(storedPreference === "true");
    } catch {
      // A preferência é opcional; o menu continua usando o padrão da página.
    }
  }, []);

  const toggleDesktopMenu = () => {
    setIsDesktopMenuCompact((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(DESKTOP_MENU_STORAGE_KEY, String(next));
      } catch {
        // O estado da sessão continua funcional mesmo sem armazenamento local.
      }
      return next;
    });
  };

  useEffect(() => {
    setMobileOpen(false);
    setMobileModule(activeModule.label);
    setOpenMenus((current) => ({ ...current, [activeModule.label]: true }));
  }, [activeModule.label, location.pathname, location.search]);

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) setMobileOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, [mobileOpen]);

  if (isFocusMode) return <>{children}</>;

  return (
    <div data-testid="cultoplus-page-shell" data-module={activeModule.module} className="min-h-full bg-[#fdfbf7] text-[#2d2a26] dark:bg-[#0b0b0c] dark:text-gray-100">
      <div className="flex min-h-full items-stretch">
        <aside data-testid="cultoplus-desktop-menu" data-compact={isDesktopMenuCompact ? "true" : "false"} className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[#e6e0d8] bg-white py-4 transition-[width,padding] duration-200 lg:flex dark:border-white/10 dark:bg-[#111113] ${isDesktopMenuCompact ? 'w-[84px] items-center px-2' : 'w-[256px] px-4 py-6'}`}>
          <div className={`flex w-full ${isDesktopMenuCompact ? "flex-col items-center gap-2" : "items-center justify-between gap-3"}`}>
            <CultoPlusBrand compact={isDesktopMenuCompact} className={isDesktopMenuCompact ? "!h-12" : "!h-16 min-w-0"} />
            <button
              type="button"
              data-testid="cultoplus-desktop-menu-toggle"
              onClick={toggleDesktopMenu}
              aria-expanded={!isDesktopMenuCompact}
              aria-controls="cultoplus-desktop-navigation"
              aria-label={isDesktopMenuCompact ? "Expandir menu" : "Esconder menu"}
              title={isDesktopMenuCompact ? "Expandir menu" : "Esconder menu"}
              className="module-focus module-nav-link flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e6e0d8] bg-white text-slate-600 shadow-sm transition hover:border-[var(--module-border)] hover:text-[var(--module-accent)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
            >
              {isDesktopMenuCompact ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            </button>
          </div>
          {!isDesktopMenuCompact ? <div className="mt-6"><AppViewSwitcher activeView="personal" canOpenPastoral={pastoralAccess} canOpenManagement={canManage} /></div> : null}
          <nav id="cultoplus-desktop-navigation" aria-label="Navegação principal da visão pessoal" className={`min-h-0 flex-1 space-y-1 overflow-y-auto no-scrollbar ${isDesktopMenuCompact ? 'mt-5 w-full' : 'mt-4 pr-1'}`}>
            {visibleModules.map((item) => {
              const Icon = item.icon;
              const expanded = Boolean(openMenus[item.label]);
              const id = submenuId(item.label);
              return <div key={item.label} data-module-theme={item.module} className="rounded-xl">
                <div className={`flex items-center rounded-xl transition ${isDesktopMenuCompact ? (isModuleActive(item, location.pathname) ? "module-nav-active ring-1 ring-[var(--module-border)]" : "module-nav-link") : `border-l-4 ${expanded ? "module-nav-active" : "module-nav-link border-transparent"}`}`}>
                  <Link href={item.href} title={isDesktopMenuCompact ? item.label : undefined} aria-label={isDesktopMenuCompact ? item.label : undefined} className={`module-focus flex min-h-14 min-w-0 flex-1 items-center rounded-lg text-sm font-semibold ${isDesktopMenuCompact ? 'justify-center px-1' : 'gap-3 px-2.5'}`}><span className="module-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"><Icon size={19} /></span>{!isDesktopMenuCompact ? <span className="truncate">{item.label}</span> : null}</Link>
                  {!isDesktopMenuCompact ? <button type="button" onClick={() => setOpenMenus((current) => ({ ...current, [item.label]: !current[item.label] }))} aria-expanded={expanded} aria-controls={id} aria-label={`${expanded ? "Recolher" : "Expandir"} submenu ${item.label}`} className="module-focus module-accent-text mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition hover:bg-white/70 dark:hover:bg-white/10"><ChevronDown size={17} className={`transition-transform ${expanded ? "rotate-180" : ""}`} /></button> : null}
                </div>
                {!isDesktopMenuCompact && expanded ? <div id={id} className="module-submenu ml-5 mt-1 space-y-0.5 rounded-r-xl border-l py-1 pl-3 pr-1">{item.children.map((child) => { const ChildIcon = child.icon; const childPath = routePath(child.href); const active = !child.href.includes("#") && (childPath === location.pathname || (childPath === "/bibliasagrada" && location.pathname === "/biblia")); return <Link key={child.href} href={child.href} aria-current={active ? "page" : undefined} className={`module-focus flex min-h-10 items-center gap-2.5 rounded-lg px-2 text-xs font-semibold transition ${active ? "module-accent-bg" : "module-nav-link text-gray-600 dark:text-gray-300"}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white/15 text-white" : "module-icon"}`}><ChildIcon size={14} /></span><span className="truncate">{child.label}</span></Link>; })}</div> : null}
              </div>;
            })}
          </nav>
          <Link href="/perfil" title={isDesktopMenuCompact ? resolvedUserName : undefined} className={`mt-4 flex items-center rounded-xl border-t border-[#ece6df] p-2 pt-4 transition hover:bg-[#f7f2ed] dark:border-white/10 dark:hover:bg-white/5 ${isDesktopMenuCompact ? 'justify-center' : 'gap-3'}`}>
            {resolvedAvatar ? <img src={resolvedAvatar} alt={resolvedUserName} className="h-10 w-10 rounded-full object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-700">{resolvedUserName.slice(0, 2).toUpperCase()}</span>}
            {!isDesktopMenuCompact ? <span className="min-w-0"><strong className="block truncate text-sm">{resolvedUserName}</strong><small className="block truncate text-[11px] text-gray-500">{pastoralAccess ? "Membro · Liderança" : "Membro"}</small></span> : null}
          </Link>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {!isHeaderHidden ? <header data-testid="cultoplus-mobile-menu-header" className="relative border-b border-[#e6e0d8] bg-white px-4 py-3 lg:hidden dark:border-white/10 dark:bg-[#111113]" ref={mobileMenuRef}>
            <div className="flex items-center justify-between gap-3">
              <CultoPlusBrand className="!h-16" />
              <div className="flex items-center gap-2">
                {canManage ? <ManagerNotificationCenter churchId={churchId} /> : null}
                <button type="button" onClick={() => setMobileOpen((current) => !current)} aria-expanded={mobileOpen} aria-controls="cultoplus-mobile-menu" aria-label="Abrir menu" className="module-focus module-accent-bg flex h-11 w-11 items-center justify-center rounded-xl"><Menu size={20} /></button>
              </div>
            </div>
            {mobileOpen ? <div id="cultoplus-mobile-menu" className="absolute inset-x-3 top-[76px] z-50 max-h-[78vh] overflow-y-auto rounded-2xl border border-[#e6e0d8] bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-[#151515]">
              <AppViewSwitcher activeView="personal" canOpenPastoral={pastoralAccess} canOpenManagement={canManage} compact />
              <div role="tablist" aria-label="Módulos" className="mt-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar">{visibleModules.map((item) => { const Icon = item.icon; const selected = mobileModule === item.label; return <button key={item.label} data-module-theme={item.module} type="button" role="tab" aria-selected={selected} onClick={() => setMobileModule(item.label)} className={`module-focus flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-bold ${selected ? "module-nav-active" : "border-[#e4ded5] dark:border-white/10"}`}><Icon size={16} />{item.label}</button>; })}</div>
              {visibleModules.filter((item) => item.label === mobileModule).map((item) => <div key={item.label} data-module-theme={item.module} role="tabpanel" className="module-submenu grid grid-cols-1 gap-2 rounded-xl border p-3 sm:grid-cols-2">{item.children.map((child) => { const ChildIcon = child.icon; return <Link key={child.href} href={child.href} onClick={() => setMobileOpen(false)} className="module-focus module-nav-link flex min-h-12 items-center gap-3 rounded-xl bg-white px-3 text-xs font-semibold shadow-sm dark:bg-[#171719]"><span className="module-icon flex h-8 w-8 items-center justify-center rounded-lg"><ChildIcon size={15} /></span><span className="min-w-0 flex-1 truncate">{child.label}</span><ChevronRight size={14} className="module-accent-text" /></Link>; })}</div>)}
            </div> : null}
          </header> : null}
          <div className="flex flex-1 flex-col">{children}</div>
        </div>
      </div>
    </div>
  );
}
