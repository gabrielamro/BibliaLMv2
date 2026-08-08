"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, RotateCcw } from "lucide-react";
import type { ChurchFormSubmission } from "../../types";
import { churchManagementService } from "../../services/churchManagementService";
import { splitVolunteerLeadershipFeedback, VOLUNTEER_REJECTION_PUBLIC_STATUS } from "../../utils/churchManagementRules";
import { formatScaleDateTime, getVolunteerRequestStatus } from "./personalScalePresentation";

type Props = {
  requests: ChurchFormSubmission[];
  onSelect: (submission: ChurchFormSubmission) => void;
};

export default function VolunteerRequestsPanel({ requests, onSelect }: Props) {
  return (
    <section id="solicitacoes" aria-labelledby="personal-requests-title" className="scroll-mt-24">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="personal-requests-title" className="flex items-center gap-2 text-base font-semibold">
          <ClipboardCheck size={18} aria-hidden="true" className="module-accent-text" />
          Solicitações de voluntariado
        </h2>
        <span className="text-xs text-slate-600 dark:text-slate-400">{requests.length}</span>
      </div>

      {requests.length ? (
        <ul className="space-y-2">
          {requests.map((submission) => {
            const status = getVolunteerRequestStatus(submission);
            return (
              <li key={submission.id}>
                <button
                  type="button"
                  onClick={() => onSelect(submission)}
                  className="module-focus w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-[var(--module-border)] dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <strong className="block text-sm">Pedido para servir</strong>
                      <small className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                        Atualizado em {formatScaleDateTime(submission.updatedAt)}
                      </small>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${status.tone}`}>
                      {status.label}
                    </span>
                  </span>
                  <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <span className="module-accent-bg block h-full rounded-full" style={{ width: `${status.progress}%` }} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="module-border rounded-2xl border border-dashed p-4 text-sm text-slate-600 dark:text-slate-300">
          Nenhuma solicitação de voluntariado enviada.
        </p>
      )}
    </section>
  );
}

export function VolunteerRequestDetails({ submission }: { submission: ChurchFormSubmission }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [retryFeedback, setRetryFeedback] = useState("");
  const status = getVolunteerRequestStatus(submission);
  const isRejected = submission.publicStatus === VOLUNTEER_REJECTION_PUBLIC_STATUS;
  const feedbackParts = splitVolunteerLeadershipFeedback(
    submission.publicFeedback || submission.publicStatus || "A igreja recebeu seu pedido e fará a análise.",
  );

  const retry = async () => {
    setRetrying(true);
    setRetryFeedback("");
    try {
      const form = await churchManagementService.getVolunteerRetryForm(submission);
      router.push(`/qr/${encodeURIComponent(form.token)}`);
    } catch (error) {
      setRetryFeedback(error instanceof Error ? error.message : "Não foi possível abrir o formulário original.");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div>
      <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${status.tone}`}>{status.label}</span>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Enviado em</p>
          <p className="mt-1 text-sm font-semibold">{formatScaleDateTime(submission.createdAt)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Última atualização</p>
          <p className="mt-1 text-sm font-semibold">{formatScaleDateTime(submission.updatedAt)}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Retorno da igreja</p>
        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
          {feedbackParts.before}
          {feedbackParts.leadership ? (
            <>
              <span> Retorno da liderança: </span>
              <strong className="font-semibold text-slate-950 dark:text-white">{feedbackParts.leadership}</strong>
            </>
          ) : null}
          {feedbackParts.after ? <span> {feedbackParts.after}</span> : null}
        </p>
      </div>

      <div className="module-soft-surface module-border mt-3 rounded-2xl border p-4">
        <p className="module-accent-text text-[10px] font-semibold uppercase tracking-wider">Próximo passo</p>
        <p className="mt-2 text-sm leading-6">
          {submission.nextAction || (status.progress === 100 ? "Nenhuma ação pendente." : "Aguarde o retorno da liderança pela notificação.")}
        </p>
        {isRejected ? (
          <button
            type="button"
            onClick={() => void retry()}
            disabled={retrying}
            aria-busy={retrying}
            className="module-focus module-accent-bg mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw size={17} aria-hidden="true" className={retrying ? "animate-spin" : ""} />
            {retrying ? "Abrindo formulário..." : "Tentar novamente"}
          </button>
        ) : null}
        {retryFeedback ? (
          <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-800 dark:bg-rose-400/10 dark:text-rose-100">
            {retryFeedback}
          </p>
        ) : null}
      </div>
    </div>
  );
}
