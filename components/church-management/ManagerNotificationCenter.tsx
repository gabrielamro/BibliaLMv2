"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CalendarClock, CheckCircle2, ChevronRight, RefreshCcw, UserPlus, X } from "lucide-react";
import { churchManagementService } from "../../services/churchManagementService";
import type { ChurchManagerAlert } from "../../types";

const notificationDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dueDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatAlertDate(value: string, formatter: Intl.DateTimeFormat) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data não informada" : formatter.format(date);
}

export default function ManagerNotificationCenter({ churchId, className = "", panelAlign = "right" }: { churchId?: string | null; className?: string; panelAlign?: "left" | "right" }) {
  const [alerts, setAlerts] = useState<ChurchManagerAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const load = useCallback(async () => {
    if (!churchId) return;
    setLoading(true);
    try { setAlerts(await churchManagementService.getManagerAlerts(churchId)); }
    catch { setAlerts([]); }
    finally { setLoading(false); }
  }, [churchId]);

  useEffect(() => { load(); }, [load]);

  const closePanel = useCallback(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (details?.open && !details.contains(event.target as Node)) closePanel();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !detailsRef.current?.open) return;
      closePanel();
      detailsRef.current?.querySelector<HTMLElement>("summary")?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePanel]);

  if (!churchId) return null;

  const visibleAlerts = alerts.slice(0, 8);
  const urgentCount = alerts.filter((item) => item.severity === "urgent").length;
  const kindCounts = {
    approval: alerts.filter((item) => item.kind === "approval").length,
    volunteer: alerts.filter((item) => item.kind === "volunteer").length,
    service: alerts.filter((item) => item.kind === "service_configuration").length,
  };

  return <details ref={detailsRef} className={`group relative ${className}`}>
    <summary aria-label={`Notificações da Gestão da Igreja: ${alerts.length} pendentes`} className="relative flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-[#ded8cf] bg-white text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
      <Bell size={19} />
      {alerts.length > 0 ? <span className={`absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-black text-white ${urgentCount > 0 ? "bg-red-500" : "bg-emerald-600"}`}>{alerts.length > 99 ? "99+" : alerts.length}</span> : null}
    </summary>
    <section className={`fixed inset-x-3 top-[4.5rem] z-[200] flex max-h-[calc(100dvh-5.25rem)] w-auto flex-col overflow-hidden rounded-2xl border border-[#ded8cf] bg-white shadow-2xl dark:border-white/10 dark:bg-[#151515] sm:absolute sm:inset-x-auto sm:top-12 sm:max-h-[min(620px,calc(100vh-5rem))] sm:w-[390px] ${panelAlign === "left" ? "sm:left-0" : "sm:right-0"}`} aria-label="Central rápida do gestor">
      <header className="shrink-0 bg-gradient-to-r from-slate-950 to-emerald-900 p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200">Gestão da Igreja</p><h2 className="mt-1 font-black">Pendências operacionais</h2></div>
          <div className="flex gap-1.5">
            <button type="button" onClick={load} disabled={loading} aria-label="Atualizar notificações da gestão" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"><RefreshCcw size={15} className={loading ? "animate-spin" : ""} /></button>
            <button type="button" onClick={closePanel} aria-label="Fechar notificações" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><X size={17} /></button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">{[["Aprovações", kindCounts.approval], ["Voluntários", kindCounts.volunteer], ["Cultos", kindCounts.service]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-white/10 p-2"><strong className="block text-lg">{value}</strong><small className="text-[9px] text-slate-300">{label}</small></div>)}</div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading && alerts.length === 0 ? <p className="p-4 text-center text-xs font-semibold text-slate-500">Carregando fluxo de gestão...</p> : null}
        {!loading && visibleAlerts.length === 0 ? <div className="p-5 text-center"><CheckCircle2 className="mx-auto text-emerald-600" size={28} /><strong className="mt-3 block text-sm">Tudo em ordem</strong><p className="mt-1 text-xs text-slate-500">Nenhuma pendência operacional agora.</p></div> : null}
        {visibleAlerts.map((alert) => {
          const Icon = alert.kind === "service_configuration" ? CalendarClock : alert.kind === "volunteer" ? UserPlus : Bell;
          return <Link key={alert.id} href={alert.link} className="flex min-h-16 gap-3 rounded-xl p-3 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:hover:bg-white/5">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${alert.severity === "urgent" ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" : alert.kind === "volunteer" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"}`}><Icon size={17} /></span>
            <span className="min-w-0 flex-1">
              <strong className="block text-xs text-slate-800 dark:text-slate-100">{alert.title}</strong>
              <small className="mt-1 line-clamp-2 block text-[10px] leading-4 text-slate-500 dark:text-slate-400">{alert.message}</small>
              <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                <time dateTime={alert.createdAt}>Em {formatAlertDate(alert.createdAt, notificationDateFormatter)}</time>
                {alert.dueAt ? <time dateTime={alert.dueAt} className="text-emerald-700 dark:text-emerald-400">Culto: {formatAlertDate(alert.dueAt, dueDateFormatter)}</time> : null}
              </span>
            </span>
            <ChevronRight size={14} className="mt-2 shrink-0 text-slate-300" />
          </Link>;
        })}
      </div>
      <Link href="/gestao-igreja/notificacoes" className="flex min-h-11 shrink-0 items-center justify-center border-t border-[#ece6df] text-xs font-black text-emerald-700 transition hover:bg-emerald-50 dark:border-white/10 dark:text-emerald-300 dark:hover:bg-emerald-500/10">Abrir central de notificações</Link>
    </section>
  </details>;
}
