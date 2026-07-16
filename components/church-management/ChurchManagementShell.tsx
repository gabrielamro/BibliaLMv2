"use client";

import React from "react";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronRight,
  Church,
  ClipboardList,
  Heart,
  Home,
  Medal,
  Menu,
  QrCode,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useLocation } from "../../utils/router";
import CultoPlusBrand from "../CultoPlusBrand";
import AppViewSwitcher from "../AppViewSwitcher";
import ManagerNotificationCenter from "./ManagerNotificationCenter";

const managementItems = [
  { label: "Cultos", href: "/gestao-igreja/cultos", icon: CalendarDays, tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  { label: "Visão geral", href: "/gestao-igreja", icon: Home, tone: "bg-slate-200 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300" },
  { label: "Pessoas", href: "/gestao-igreja/pessoas", icon: Users, tone: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  { label: "Equipes", href: "/gestao-igreja/equipes", icon: Users, tone: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  { label: "Designações", href: "/gestao-igreja/designacoes", icon: ClipboardList, tone: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300" },
  { label: "Voluntariado", href: "/gestao-igreja/voluntariado", icon: Heart, tone: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
  { label: "Grupos e células", href: "/gestao-igreja/grupos", icon: Church, tone: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300" },
  { label: "QR Codes", href: "/gestao-igreja/qrcodes", icon: QrCode, tone: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300" },
  { label: "Inbox pastoral", href: "/gestao-igreja/inbox", icon: Heart, tone: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300" },
  { label: "Notificações", href: "/gestao-igreja/notificacoes", icon: Bell, tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  { label: "Permissões", href: "/gestao-igreja/permissoes", icon: ShieldCheck, tone: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300" },
  { label: "Insígnias", href: "/gestao-igreja/insignias", icon: Medal, tone: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300" },
  { label: "Indicadores", href: "/gestao-igreja/indicadores", icon: BarChart3, tone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" },
  { label: "Configurações", href: "/gestao-igreja/configuracoes", icon: Settings, tone: "bg-gray-200 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300" },
];

function ManagementMenu({ mobile = false }: { mobile?: boolean }) {
  const location = useLocation();
  return <nav aria-label="Menu Gestão da Igreja" className={mobile ? "grid grid-cols-2 gap-2 p-3" : "space-y-1"}>
    {managementItems.map((item) => {
      const Icon = item.icon;
      const active = item.href === "/gestao-igreja" ? location.pathname === item.href : location.pathname.startsWith(item.href);
      return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-12 items-center gap-3 rounded-xl border-l-4 px-2.5 text-xs font-bold transition ${active ? "border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-950 dark:from-emerald-500/15 dark:to-teal-500/10 dark:text-emerald-100" : "border-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.tone}`}><Icon size={16} /></span><span className="min-w-0 flex-1 truncate">{item.label}</span><ChevronRight size={14} className={active ? "text-emerald-600" : "text-slate-300"} /></Link>;
    })}
  </nav>;
}

export default function ChurchManagementShell({ children }: { children: React.ReactNode }) {
  const { userProfile } = useAuth();
  const { isPastor } = useWorkspace();
  const name = userProfile?.displayName || "Gestor";
  const avatar = userProfile?.photoURL;
  const churchId = userProfile?.churchData?.churchId;

  return <div className="church-management-shell min-h-full bg-[#fdfbf7] text-[#1f2937] dark:bg-[#0b0b0c] dark:text-gray-100">
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col border-r border-[#e6e0d8] bg-white px-4 py-6 lg:flex dark:border-white/10 dark:bg-[#111113]">
        <div className="flex items-center justify-between gap-2"><CultoPlusBrand className="!h-20" /><ManagerNotificationCenter churchId={churchId} panelAlign="left" /></div>
        <div className="mt-6"><AppViewSwitcher activeView="management" canOpenPastoral={isPastor} canOpenManagement /></div>
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-900 p-4 text-white"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">Visão atual</p><h2 className="mt-2 text-lg font-black">Gestão da Igreja</h2><p className="mt-1 text-xs leading-5 text-slate-300">Operação, pessoas, cultos e equipes.</p></div>
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 no-scrollbar"><ManagementMenu /></div>
        <Link href="/perfil" className="mt-4 flex items-center gap-3 border-t border-[#ece6df] pt-4 dark:border-white/10">{avatar ? <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">{name.slice(0, 2).toUpperCase()}</span>}<span className="min-w-0"><strong className="block truncate text-sm">{name}</strong><small className="text-xs text-gray-500">Gestão operacional</small></span></Link>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-[#e6e0d8] bg-white px-4 py-3 lg:hidden dark:border-white/10 dark:bg-[#111113]"><div className="flex items-center justify-between"><CultoPlusBrand /><div className="flex items-center gap-2"><ManagerNotificationCenter churchId={churchId} /><details className="relative"><summary aria-label="Abrir menu Gestão da Igreja" className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl bg-slate-900 text-white"><Menu size={20} /></summary><div className="absolute right-0 top-12 z-50 max-h-[78vh] w-[min(94vw,390px)] overflow-y-auto rounded-2xl border border-[#e6e0d8] bg-white shadow-2xl dark:border-white/10 dark:bg-[#151515]"><div className="border-b border-[#ece6df] p-4 dark:border-white/10"><strong className="block">Gestão da Igreja</strong><small className="text-gray-500">Você pode alternar de visão sem trocar de conta</small></div><div className="border-b border-[#ece6df] p-3 dark:border-white/10"><AppViewSwitcher activeView="management" canOpenPastoral={isPastor} canOpenManagement compact /></div><ManagementMenu mobile /></div></details></div></div></header>
        {children}
      </div>
    </div>
  </div>;
}
