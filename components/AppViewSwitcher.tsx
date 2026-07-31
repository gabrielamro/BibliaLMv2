"use client";

import Link from "next/link";
import { Church, ShieldCheck, UserRound } from "lucide-react";
import type { AppModuleId } from "../constants";

export type AppView = "personal" | "pastoral" | "management";

type AppViewSwitcherProps = {
  activeView: AppView;
  canOpenPastoral?: boolean;
  canOpenManagement?: boolean;
  compact?: boolean;
};

const viewDefinitions = [
  { id: "personal" as const, module: "home" as AppModuleId, label: "Minha visão", href: "/newhome", icon: UserRound },
  { id: "pastoral" as const, module: "pastoral" as AppModuleId, label: "Visão pastoral", href: "/workspace-pastoral", icon: Church },
  { id: "management" as const, module: "management" as AppModuleId, label: "Gestão da Igreja", href: "/gestao-igreja/cultos", icon: ShieldCheck },
];

export default function AppViewSwitcher({ activeView, canOpenPastoral = false, canOpenManagement = false }: AppViewSwitcherProps) {
  const views = viewDefinitions.filter((view) => view.id === "personal" || (view.id === "pastoral" && canOpenPastoral) || (view.id === "management" && canOpenManagement));

  return (
    <section aria-label="Alternar visão do aplicativo" className="px-1">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Alternar visão</p>
        <nav aria-label="Visões disponíveis" className="flex shrink-0 items-center gap-1 rounded-xl border border-[#e6e0d8] bg-slate-50 p-1 dark:border-white/10 dark:bg-white/[0.04]">
          {views.map((view) => {
            const Icon = view.icon;
            const active = view.id === activeView;
            return (
              <Link
                key={view.id}
                data-module-theme={view.module}
                href={view.href}
                aria-label={`Alternar para ${view.label}`}
                aria-current={active ? "page" : undefined}
                title={view.label}
                className={`module-focus relative flex h-9 w-9 items-center justify-center rounded-lg transition ${active ? "module-icon shadow-sm ring-1 ring-[var(--module-border)]" : "module-accent-text module-nav-link hover:shadow-sm"}`}
              >
                <Icon size={18} aria-hidden="true" />
                {active ? <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
