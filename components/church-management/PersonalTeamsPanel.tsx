"use client";

import React from "react";
import { CheckCircle2, ChevronRight, Users } from "lucide-react";
import type { ChurchServiceTeam } from "../../types";

type Props = {
  teams: ChurchServiceTeam[];
  onSelect: (team: ChurchServiceTeam) => void;
};

export default function PersonalTeamsPanel({ teams, onSelect }: Props) {
  return (
    <section id="equipes" aria-labelledby="personal-teams-title" className="scroll-mt-24">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="personal-teams-title" className="flex items-center gap-2 text-base font-semibold">
          <Users size={18} aria-hidden="true" className="module-accent-text" />
          Minhas equipes
        </h2>
        <span className="text-xs text-slate-600 dark:text-slate-400">{teams.length}</span>
      </div>

      {teams.length ? (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {teams.map((team) => (
            <li key={team.id}>
              <button
                type="button"
                onClick={() => onSelect(team)}
                className="module-focus flex min-h-14 w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 text-left transition hover:border-[var(--module-border)] dark:border-white/10 dark:bg-white/[0.03]"
              >
                <span className="module-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <Users size={17} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">{team.name}</strong>
                  <small className="block truncate text-xs text-slate-600 dark:text-slate-400">{team.area || "Equipe de serviço"}</small>
                </span>
                <ChevronRight size={16} aria-hidden="true" className="module-accent-text shrink-0 opacity-60" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="module-border rounded-xl border border-dashed p-4 text-sm text-slate-600 dark:text-slate-300">
          Você ainda não faz parte de uma equipe. Envie uma solicitação de voluntariado para servir.
        </p>
      )}
    </section>
  );
}

export function PersonalTeamDetails({ team }: { team: ChurchServiceTeam }) {
  return (
    <div>
      <div className="module-icon flex h-14 w-14 items-center justify-center rounded-2xl">
        <Users size={25} aria-hidden="true" />
      </div>
      <p className="mt-5 text-sm leading-7 text-slate-700 dark:text-slate-300">
        {team.description || "Equipe operacional da igreja."}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Área</p>
          <p className="mt-1 text-sm font-semibold">{team.area || "Serviço"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Situação</p>
          <p className="mt-1 text-sm font-semibold">{team.status === "active" ? "Equipe ativa" : "Equipe pausada"}</p>
        </div>
      </div>
      <p className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-100">
        <CheckCircle2 size={19} aria-hidden="true" /> Você faz parte desta equipe.
      </p>
    </div>
  );
}
