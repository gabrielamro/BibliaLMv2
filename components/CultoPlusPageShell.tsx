"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, Church, Home, LayoutDashboard, PenLine, Radio, Settings, Users } from "lucide-react";
import { useLocation } from "../utils/router";
import CultoPlusBrand from "./CultoPlusBrand";

type CultoPlusPageShellProps = {
  children: React.ReactNode;
  isPastor?: boolean;
  userName?: string;
  avatar?: string | null;
};

const mainItems = [
  { label: "Início", href: "/newhome", icon: Home, tone: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  { label: "Bíblia", href: "/bibliasagrada", icon: BookOpen, tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  { label: "Reino", href: "/social", icon: Users, tone: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300" },
  { label: "Cultos", href: "/culto", icon: CalendarDays, tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  { label: "Criar", href: "/newhome?tab=criar", icon: PenLine, tone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" },
  { label: "Minha Igreja", href: "/minha-igreja", icon: Church, tone: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
];

export default function CultoPlusPageShell({ children, isPastor = false, userName = "Membro", avatar }: CultoPlusPageShellProps) {
  const location = useLocation();
  const isCultosArea = location.pathname === "/culto" || location.pathname.startsWith("/culto/") || location.pathname.startsWith("/meus-cultos");

  return <div className="min-h-full bg-[#fdfbf7] text-[#2d2a26] dark:bg-[#0b0b0c] dark:text-gray-100">
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-[256px] shrink-0 flex-col border-r border-[#e6e0d8] bg-white px-4 py-6 lg:flex dark:border-white/10 dark:bg-[#111113]">
        <CultoPlusBrand />
        <nav aria-label="Navegação Culto+" className="mt-7 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 no-scrollbar">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const active = item.label === "Cultos" ? isCultosArea : location.pathname === item.href || (item.href !== "/newhome" && location.pathname.startsWith(item.href.split("?")[0]));
            return <React.Fragment key={item.label}>
              <Link href={item.href} className={`flex min-h-14 items-center gap-3 rounded-xl border-l-4 px-2.5 text-sm font-semibold transition ${active ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "border-transparent hover:bg-[#f7f2ed] dark:hover:bg-white/5"}`}><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.tone}`}><Icon size={19} /></span>{item.label}</Link>
              {item.label === "Cultos" && <div className="ml-5 space-y-0.5 rounded-r-xl border-l border-emerald-300 bg-emerald-50/70 py-1 pl-3 pr-1 dark:border-emerald-500/30 dark:bg-emerald-500/[0.06]">
                <Link href="/culto" className="flex min-h-10 items-center gap-2.5 rounded-lg px-2 text-xs font-semibold text-gray-600 hover:bg-emerald-100 dark:text-gray-300 dark:hover:bg-emerald-500/15"><CalendarDays size={15} className="text-emerald-700" /> Agenda</Link>
                <Link href="/meus-cultos" aria-current={location.pathname === "/meus-cultos" ? "page" : undefined} className={`flex min-h-10 items-center gap-2.5 rounded-lg px-2 text-xs font-semibold ${location.pathname.startsWith("/meus-cultos") ? "bg-emerald-700 text-white" : "text-gray-600 hover:bg-emerald-100 dark:text-gray-300 dark:hover:bg-emerald-500/15"}`}><Radio size={15} /> Meus Cultos</Link>
                <Link href="/minha-igreja/designacoes" className="flex min-h-10 items-center gap-2.5 rounded-lg px-2 text-xs font-semibold text-gray-600 hover:bg-emerald-100 dark:text-gray-300 dark:hover:bg-emerald-500/15"><Users size={15} className="text-emerald-700" /> Minha escala</Link>
              </div>}
            </React.Fragment>;
          })}
          {isPastor && <Link href="/workspace-pastoral" className="flex min-h-14 items-center gap-3 rounded-xl border-l-4 border-transparent px-2.5 text-sm font-semibold transition hover:bg-purple-50 dark:hover:bg-purple-500/10"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"><LayoutDashboard size={19} /></span>Workspace Pastoral</Link>}
          <Link href="/minha-conta" className="flex min-h-14 items-center gap-3 rounded-xl border-l-4 border-transparent px-2.5 text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-white/5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300"><Settings size={19} /></span>Configurações</Link>
        </nav>
        <Link href="/perfil" className="mt-4 flex items-center gap-3 border-t border-[#ece6df] pt-4 dark:border-white/10">
          {avatar ? <img src={avatar} alt={userName} className="h-10 w-10 rounded-full object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-700">{userName.slice(0, 2).toUpperCase()}</span>}
          <span className="min-w-0"><strong className="block truncate text-sm">{userName}</strong><small className="text-xs text-gray-500">Gestão pessoal</small></span>
        </Link>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-[#e6e0d8] bg-white px-4 py-3 lg:hidden dark:border-white/10 dark:bg-[#111113]"><CultoPlusBrand /><Link href="/meus-cultos/novo" aria-label="Registrar culto" className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 text-white"><PenLine size={19} /></Link></header>
        {children}
      </div>
    </div>
  </div>;
}
