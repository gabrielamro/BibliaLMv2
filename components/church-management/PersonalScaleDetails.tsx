"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, X } from "lucide-react";
import type { UserCultoAssignment } from "../../services/churchManagementService";
import { ServiceModalityBadge, ServiceParticipationHint } from "../culto-plus/ServiceModalityBadge";
import { formatScaleDateTime, getScaleStatusPresentation } from "./personalScalePresentation";

type Props = {
  item: UserCultoAssignment;
  feedback: string;
  feedbackTone: "info" | "error";
  saving: boolean;
  onRespond: (item: UserCultoAssignment, response: "accepted" | "declined") => void;
};

export default function PersonalScaleDetails({ item, feedback, feedbackTone, saving, onRespond }: Props) {
  const status = getScaleStatusPresentation(item.assignment.status);
  const isPending = item.assignment.status === "pending";
  const serviceHref = item.service?.slug ? `/culto/${item.service.slug}` : "/meus-cultos";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${status.tone}`}>{status.label}</span>
        {item.service ? <ServiceModalityBadge service={item.service} /> : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Info label="Data e horário" value={formatScaleDateTime(item.assignment.startsAt || item.service?.startsAt || item.assignment.createdAt)} />
        <Info label="Equipe" value={item.team?.name || "Equipe não informada"} />
        <Info label="Função" value={item.assignment.description || item.assignment.title} />
        <Info label="Culto" value={item.service?.title || "Culto não vinculado"}>
          {item.service ? (
            <ServiceParticipationHint
              service={item.service}
              locationLabel={item.service.churchName}
              className="mt-1"
            />
          ) : null}
        </Info>
      </div>

      {item.assignment.publicFeedback ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-white/5 dark:text-slate-300">
          {item.assignment.publicFeedback}
        </p>
      ) : null}

      {feedback ? (
        <p
          role="status"
          className={`mt-4 rounded-xl p-4 text-sm font-semibold ${
            feedbackTone === "error"
              ? "bg-rose-50 text-rose-800 dark:bg-rose-400/10 dark:text-rose-100"
              : "bg-blue-50 text-blue-900 dark:bg-blue-400/10 dark:text-blue-100"
          }`}
        >
          {feedback}
        </p>
      ) : null}

      {isPending ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => onRespond(item, "accepted")}
            className="module-focus module-accent-bg inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60"
          >
            <Check size={17} aria-hidden="true" /> Aceitar escala
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onRespond(item, "declined")}
            className="module-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:opacity-60 dark:border-white/10 dark:text-slate-200"
          >
            <X size={17} aria-hidden="true" /> Recusar
          </button>
        </div>
      ) : item.assignment.status === "declined" ? (
        <p className="mt-5 flex items-center gap-3 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-800 dark:bg-rose-400/10 dark:text-rose-100">
          <X size={20} aria-hidden="true" /> Você recusou esta escala. A liderança foi notificada.
        </p>
      ) : (
        <p className="mt-5 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-100">
          <CheckCircle2 size={20} aria-hidden="true" /> Esta escala está confirmada.
        </p>
      )}

      <Link
        href={serviceHref}
        className="module-focus module-accent-text mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-semibold"
      >
        {item.service?.slug ? "Abrir o culto relacionado" : "Ver a agenda de cultos"}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}

function Info({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
      {children}
    </div>
  );
}
