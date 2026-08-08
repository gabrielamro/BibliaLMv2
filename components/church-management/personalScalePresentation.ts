import type { ChurchAssignmentStatus, ChurchFormSubmission } from "../../types";
import { VOLUNTEER_REJECTION_PUBLIC_STATUS } from "../../utils/churchManagementRules";

export type StatusPresentation = { label: string; tone: string };

/**
 * Estados semânticos são independentes da cor do módulo: pendente usa alerta,
 * confirmado usa sucesso e recusado usa erro.
 */
export const SCALE_STATUS_PRESENTATION: Record<string, StatusPresentation> = {
  pending: { label: "Aguardando aceite", tone: "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-100" },
  accepted: { label: "Confirmada", tone: "bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-100" },
  declined: { label: "Recusada", tone: "bg-rose-100 text-rose-900 dark:bg-rose-400/15 dark:text-rose-100" },
};

export const getScaleStatusPresentation = (status: ChurchAssignmentStatus | string): StatusPresentation =>
  SCALE_STATUS_PRESENTATION[status] ?? { label: "Em revisão", tone: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200" };

export function getVolunteerRequestStatus(submission: ChurchFormSubmission): StatusPresentation & { progress: number } {
  if (submission.status === "answered" && /aprova/i.test(`${submission.publicStatus} ${submission.publicFeedback}`)) {
    return { label: "Aprovada", tone: "bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-100", progress: 100 };
  }
  if (submission.publicStatus === VOLUNTEER_REJECTION_PUBLIC_STATUS) {
    return { label: "Recusada", tone: "bg-rose-100 text-rose-900 dark:bg-rose-400/15 dark:text-rose-100", progress: 100 };
  }
  if (["answered", "closed", "archived"].includes(submission.status)) {
    return { label: submission.publicStatus || "Concluída", tone: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200", progress: 100 };
  }
  if (submission.status === "waiting_member") {
    return { label: "Aguardando você", tone: "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-100", progress: 75 };
  }
  if (["assigned", "in_progress"].includes(submission.status)) {
    return { label: submission.publicStatus || "Em análise", tone: "bg-blue-100 text-blue-900 dark:bg-blue-400/15 dark:text-blue-100", progress: 60 };
  }
  return { label: submission.publicStatus || "Solicitação enviada", tone: "bg-violet-100 text-violet-900 dark:bg-violet-400/15 dark:text-violet-100", progress: 30 };
}

export function formatScaleDateTime(value?: string | null) {
  if (!value) return "Data a definir";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
}
