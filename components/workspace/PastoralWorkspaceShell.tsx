"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, ChevronRight, Church, FolderOpen, Home, Menu, PenLine, Plus, Settings, Users } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "../../utils/router";
import CultoPlusBrand from "../CultoPlusBrand";
import AppViewSwitcher from "../AppViewSwitcher";

const pastoralItems = [
  { label: "Painel pastoral", href: "/workspace-pastoral", icon: Home },
  { label: "Minhas salas", href: "/workspace-pastoral?section=salas", icon: Users },
  { label: "Criar sala", href: "/criar-sala", icon: Plus },
  { label: "Acervo", href: "/acervo", icon: FolderOpen },
  { label: "Gerenciar cultos", href: "/workspace-pastoral/cultos", icon: CalendarDays },
  { label: "Novo culto", href: "/workspace-pastoral/cultos/novo", icon: PenLine },
  { label: "Orações guiadas", href: "/oracoes/gerenciar", icon: BookOpen },
  { label: "Configurações", href: "/minha-conta", icon: Settings },
];

function PastoralMenu({ mobile = false }: { mobile?: boolean }) {
  const location = useLocation();
  return <nav aria-label="Menu do Workspace Pastoral" className={mobile ? "grid grid-cols-2 gap-2 p-3" : "space-y-1"}>{pastoralItems.map((item) => { const Icon = item.icon; const [baseHref, query = ""] = item.href.split("?"); const active = item.href === "/workspace-pastoral" ? location.pathname === baseHref && !location.search : query ? location.pathname === baseHref && location.search === `?${query}` : location.pathname.startsWith(baseHref); return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-12 items-center gap-3 rounded-xl border-l-4 px-2.5 text-xs font-bold transition ${active ? "border-purple-500 bg-gradient-to-r from-purple-50 to-fuchsia-50 text-purple-950 dark:from-purple-500/15 dark:to-fuchsia-500/10 dark:text-purple-100" : "border-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"}`}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"><Icon size={16} /></span><span className="min-w-0 flex-1 truncate">{item.label}</span><ChevronRight size={14} className={active ? "text-purple-600" : "text-slate-300"} /></Link>; })}</nav>;
}

export default function PastoralWorkspaceShell({ children }: { children: React.ReactNode }) {
  const { userProfile } = useAuth();
  const name = userProfile?.displayName || "Pastor";
  const avatar = userProfile?.photoURL;

  return <div className="min-h-full bg-[#fdfbf7] text-[#2d2a26] dark:bg-[#0b0b0c] dark:text-gray-100"><div className="flex min-h-full"><aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col border-r border-[#e6e0d8] bg-white px-4 py-6 lg:flex dark:border-white/10 dark:bg-[#111113]"><CultoPlusBrand /><div className="mt-6"><AppViewSwitcher activeView="pastoral" canOpenPastoral canOpenManagement /></div><div className="mt-4 rounded-2xl bg-gradient-to-br from-purple-950 to-fuchsia-800 p-4 text-white"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-200">Visão atual</p><h2 className="mt-2 text-lg font-black">Workspace Pastoral</h2><p className="mt-1 text-xs leading-5 text-purple-100/80">Ensino, cuidado, salas e conteúdo.</p></div><div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 no-scrollbar"><PastoralMenu /></div><Link href="/perfil" className="mt-4 flex items-center gap-3 border-t border-[#ece6df] pt-4 dark:border-white/10">{avatar ? <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-xs font-black text-purple-700">{name.slice(0, 2).toUpperCase()}</span>}<span className="min-w-0"><strong className="block truncate text-sm">{name}</strong><small className="text-xs text-gray-500">Visão pastoral</small></span></Link></aside><div className="min-w-0 flex-1"><header className="border-b border-[#e6e0d8] bg-white px-4 py-3 lg:hidden dark:border-white/10 dark:bg-[#111113]"><div className="flex items-center justify-between"><CultoPlusBrand /><details className="relative"><summary aria-label="Abrir menu do Workspace Pastoral" className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl bg-purple-900 text-white"><Menu size={20} /></summary><div className="absolute right-0 top-12 z-50 max-h-[78vh] w-[min(94vw,390px)] overflow-y-auto rounded-2xl border border-[#e6e0d8] bg-white shadow-2xl dark:border-white/10 dark:bg-[#151515]"><div className="border-b border-[#ece6df] p-4 dark:border-white/10"><strong className="block">Workspace Pastoral</strong><small className="text-gray-500">Ensino, cuidado e conteúdo</small></div><div className="border-b border-[#ece6df] p-3 dark:border-white/10"><AppViewSwitcher activeView="pastoral" canOpenPastoral canOpenManagement compact /></div><PastoralMenu mobile /></div></details></div></header>{children}</div></div></div>;
}
