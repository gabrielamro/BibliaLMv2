"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Church, Eye, EyeOff, ShieldCheck, UserRound } from "lucide-react";

export type AppView = "personal" | "pastoral" | "management";

type AppViewSwitcherProps = {
  activeView: AppView;
  canOpenPastoral?: boolean;
  canOpenManagement?: boolean;
  compact?: boolean;
};

const STORAGE_KEY = "cultoplus_view_switcher_hidden";

const viewDefinitions = [
  { id: "personal" as const, label: "Minha visão", description: "Início e vida pessoal", href: "/newhome", icon: UserRound, tone: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300", activeTone: "border-violet-300 bg-violet-50 dark:border-violet-500/30 dark:bg-violet-500/10", dot: "bg-violet-600" },
  { id: "pastoral" as const, label: "Visão pastoral", description: "Ensino e cuidado", href: "/workspace-pastoral", icon: Church, tone: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300", activeTone: "border-purple-300 bg-purple-50 dark:border-purple-500/30 dark:bg-purple-500/10", dot: "bg-purple-600" },
  { id: "management" as const, label: "Gestão da Igreja", description: "Operação e equipes", href: "/gestao-igreja/cultos", icon: ShieldCheck, tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", activeTone: "border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10", dot: "bg-emerald-500" },
];

export default function AppViewSwitcher({ activeView, canOpenPastoral = false, canOpenManagement = false, compact = false }: AppViewSwitcherProps) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try { setHidden(localStorage.getItem(STORAGE_KEY) === "true"); } catch { /* O seletor continua funcional sem persistência local. */ }
  }, []);

  const changeVisibility = (nextHidden: boolean) => {
    setHidden(nextHidden);
    try { localStorage.setItem(STORAGE_KEY, String(nextHidden)); } catch { /* O estado local ainda funciona. */ }
  };

  if (hidden) {
    return <button type="button" onClick={() => changeVisibility(false)} aria-expanded="false" className="flex min-h-11 w-full items-center justify-between rounded-xl border border-[#e6e0d8] bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.07]"><span className="flex items-center gap-2"><Eye size={16} /> Mostrar alternância de visão</span><ChevronRight size={14} /></button>;
  }

  const views = viewDefinitions.filter((view) => view.id === "personal" || (view.id === "pastoral" && canOpenPastoral) || (view.id === "management" && canOpenManagement));

  return (
    <section aria-label="Alternar visão do aplicativo">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Alternar visão</p>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">Papéis acumulativos</span>
          <button type="button" onClick={() => changeVisibility(true)} aria-label="Ocultar alternância de visão" title="Ocultar" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 dark:hover:bg-white/10 dark:hover:text-white"><EyeOff size={15} /></button>
        </div>
      </div>
      <nav aria-label="Visões disponíveis" className={`mt-2 grid gap-2 ${compact ? "sm:grid-cols-3" : ""}`}>
        {views.map((view) => {
          const Icon = view.icon;
          const active = view.id === activeView;
          return <Link key={view.id} href={view.href} aria-current={active ? "page" : undefined} className={`group flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${active ? view.activeTone : "border-[#e6e0d8] bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.07]"}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${view.tone}`}><Icon size={18} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-slate-800 dark:text-slate-100">{view.label}</strong><small className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{view.description}</small></span>{active ? <span className={`h-2 w-2 shrink-0 rounded-full ${view.dot}`} aria-label="Visão atual" /> : <ChevronRight size={14} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5" />}</Link>;
        })}
      </nav>
    </section>
  );
}
