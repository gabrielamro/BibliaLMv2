"use client";

import React from "react";
import { CalendarDays, ChevronRight } from "lucide-react";
import type { UserCultoAssignment } from "../../services/churchManagementService";
import { ServiceModalityBadge } from "../culto-plus/ServiceModalityBadge";
import { formatScaleDateTime, getScaleStatusPresentation } from "./personalScalePresentation";

type Props = {
  items: UserCultoAssignment[];
  onSelect: (item: UserCultoAssignment) => void;
  emptyMessage: string;
  listLabel: string;
};

export default function PersonalScaleList({ items, onSelect, emptyMessage, listLabel }: Props) {
  if (!items.length) {
    return (
      <p className="module-border rounded-2xl border border-dashed px-4 py-6 text-sm text-slate-600 dark:text-slate-300">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul aria-label={listLabel} className="space-y-2">
      {items.map((item) => {
        const status = getScaleStatusPresentation(item.assignment.status);
        return (
          <li key={item.assignment.id}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="module-focus group flex min-h-[76px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-[var(--module-border)] hover:bg-[var(--module-surface)] dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
            >
              <span className="module-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                <CalendarDays size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <strong className="min-w-0 truncate text-sm">{item.service?.title || item.assignment.title}</strong>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${status.tone}`}>
                    {status.label}
                  </span>
                  {item.service ? <ServiceModalityBadge service={item.service} size="xs" /> : null}
                </span>
                <small className="mt-1 block truncate text-xs text-slate-600 dark:text-slate-400">
                  {formatScaleDateTime(item.assignment.startsAt || item.service?.startsAt || item.assignment.createdAt)}
                  {item.team ? ` · ${item.team.name}` : ""}
                </small>
              </span>
              <ChevronRight
                size={18}
                aria-hidden="true"
                className="module-accent-text shrink-0 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100"
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
