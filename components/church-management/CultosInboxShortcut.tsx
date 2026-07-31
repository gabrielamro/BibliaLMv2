"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BadgeCheck, CheckCircle2, ChevronRight, Inbox, Loader2, RefreshCcw, UserCheck, X } from "lucide-react";
import { churchManagementService } from "../../services/churchManagementService";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchManagerAlert } from "../../types";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data não informada"
    : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function CultosInboxShortcut({ churchId, variant = "icon" }: { churchId?: string | null; variant?: "icon" | "button" }) {
  const { currentUser } = useAuth();
  const [approvals, setApprovals] = useState<ChurchManagerAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState("");
  const [actionFeedback, setActionFeedback] = useState("");
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const load = useCallback(async () => {
    if (!churchId) return;
    setLoading(true);
    try {
      const alerts = await churchManagementService.getManagerAlerts(churchId);
      setApprovals(alerts.filter((alert) => alert.kind === "approval" || alert.kind === "volunteer"));
    } catch {
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  }, [churchId]);

  useEffect(() => { void load(); }, [load]);

  const close = useCallback(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, []);

  const approveScale = async (approval: ChurchManagerAlert) => {
    const assignmentId = approval.id.startsWith("approval:") ? approval.id.slice("approval:".length) : "";
    if (!assignmentId) return;
    setApprovingId(approval.id);
    setActionFeedback("");
    try {
      await churchManagementService.approveTeamServiceAssignment(
        assignmentId,
        currentUser?.id ?? currentUser?.uid ?? null,
      );
      setApprovals((items) => items.filter((item) => item.id !== approval.id));
      setActionFeedback("Escala aprovada. Os voluntários serão notificados.");
    } catch (error) {
      setActionFeedback(error instanceof Error ? error.message : "Não foi possível aprovar a escala.");
    } finally {
      setApprovingId("");
    }
  };

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (detailsRef.current?.open && !detailsRef.current.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !detailsRef.current?.open) return;
      close();
      detailsRef.current?.querySelector<HTMLElement>("summary")?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [close]);

  if (!churchId) return null;

  return (
    <details ref={detailsRef} className="group relative">
      <summary aria-label={`Abrir Inbox: ${approvals.length} item(ns) para aprovação`} className={variant === "button"
        ? "relative flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#071735] shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
        : "relative flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-sm transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"}>
        <Inbox size={19} aria-hidden="true" />
        {variant === "button" ? <><span>Pendências</span><span className={`flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-black ${approvals.length > 0 ? "bg-amber-400 text-slate-950" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200"}`}>{approvals.length > 99 ? "99+" : approvals.length}</span></> : null}
        {variant === "icon" && approvals.length > 0 ? <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-black text-slate-950 ring-2 ring-slate-900">{approvals.length > 99 ? "99+" : approvals.length}</span> : null}
      </summary>

      <section aria-label="Aprovações rápidas do Inbox" className="fixed inset-x-3 top-[4.5rem] z-[210] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-white/10 dark:bg-[#151515] dark:text-white sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[360px]">
        <header className="bg-gradient-to-r from-slate-950 to-emerald-900 p-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200">Inbox da gestão</p>
              <h2 className="mt-1 font-black">Aguardando aprovação</h2>
              <p className="mt-1 text-[11px] text-slate-300">Escalas e novos voluntários que precisam de decisão.</p>
            </div>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => void load()} disabled={loading} aria-label="Atualizar aprovações" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20 disabled:opacity-50"><RefreshCcw size={15} className={loading ? "animate-spin" : ""} /></button>
              <button type="button" onClick={close} aria-label="Fechar Inbox" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20"><X size={17} /></button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs"><Inbox size={16} /><strong>{approvals.length}</strong><span className="text-slate-300">pendência(s) para analisar</span></div>
        </header>

        <div className="max-h-[340px] overflow-y-auto p-2">
          {loading && approvals.length === 0 ? <div className="flex min-h-24 items-center justify-center gap-2 text-xs font-semibold text-slate-500"><Loader2 size={16} className="animate-spin" /> Carregando Inbox...</div> : null}
          {!loading && approvals.length === 0 ? <div className="p-6 text-center"><CheckCircle2 size={28} className="mx-auto text-emerald-600" /><strong className="mt-3 block text-sm">Nenhuma aprovação pendente</strong><p className="mt-1 text-xs text-slate-500">O Inbox está em dia.</p></div> : null}
          {actionFeedback ? <p role="status" className="mx-2 mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-semibold leading-4 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">{actionFeedback}</p> : null}
          {approvals.slice(0, 4).map((approval) => (
            <article key={approval.id} className="flex items-center gap-2 rounded-xl p-2 transition hover:bg-slate-50 dark:hover:bg-white/5">
              <Link href={approval.link} onClick={close} className="flex min-w-0 flex-1 items-start gap-3 rounded-lg p-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${approval.kind === "volunteer" ? "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200" : "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200"}`}><UserCheck size={17} /></span>
                <span className="min-w-0 flex-1"><strong className="block text-xs">{approval.title}</strong><small className="mt-1 line-clamp-2 block text-[10px] leading-4 text-slate-500 dark:text-slate-400">{approval.message}</small><time dateTime={approval.createdAt} className="mt-1 block text-[9px] font-semibold text-slate-400">{formatDate(approval.createdAt)}</time></span>
                <ChevronRight size={14} className="mt-2 shrink-0 text-slate-300" />
              </Link>
              {approval.kind === "volunteer" ? (
                <Link href={`/gestao-igreja/inbox?approve=${encodeURIComponent(approval.id.replace(/^volunteer:/, ""))}`} onClick={close} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg bg-emerald-700 px-2.5 text-[10px] font-black text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"><BadgeCheck size={13} /> Aprovar</Link>
              ) : (
                <button type="button" onClick={() => void approveScale(approval)} disabled={Boolean(approvingId)} aria-busy={approvingId === approval.id} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg bg-emerald-700 px-2.5 text-[10px] font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">{approvingId === approval.id ? <Loader2 size={13} className="animate-spin" /> : <BadgeCheck size={13} />} {approvingId === approval.id ? "Aprovando" : "Aprovar"}</button>
              )}
            </article>
          ))}
        </div>

        <Link href="/gestao-igreja/inbox" onClick={close} className="flex min-h-12 items-center justify-center gap-2 border-t border-slate-200 text-xs font-black text-emerald-700 transition hover:bg-emerald-50 dark:border-white/10 dark:text-emerald-300 dark:hover:bg-emerald-500/10"><Inbox size={15} /> Abrir Inbox completo</Link>
      </section>
    </details>
  );
}
