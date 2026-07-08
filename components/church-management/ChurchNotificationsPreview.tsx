"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Check, CheckCircle2, EyeOff, RefreshCcw, ShieldCheck } from "lucide-react";
import { churchManagementService } from "../../services/churchManagementService";
import { churchNotificationsPreview } from "../../services/churchManagementPreviewService";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchManagementNotification } from "../../types";

type NotificationFilter = "active" | "unread" | "action" | "dismissed" | "all";

type DisplayNotification = {
  id: string;
  title: string;
  message: string;
  severity: string;
  channel: string;
  eventType: string;
  read: boolean;
  dismissed: boolean;
  link?: string | null;
  createdAt?: string | null;
  real: boolean;
};

export default function ChurchNotificationsPreview() {
  const { userProfile } = useAuth();
  const activeChurchId = userProfile?.churchData?.churchId;
  const [items, setItems] = useState<ChurchManagementNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("active");
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadNotifications = () => {
    if (!activeChurchId) return;
    setIsLoading(true);
    setFeedback(null);
    churchManagementService.listNotifications(activeChurchId, { limit: 50 })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!activeChurchId) return;
    let isMounted = true;
    setIsLoading(true);
    churchManagementService.listNotifications(activeChurchId, { limit: 50 })
      .then((notifications) => {
        if (isMounted) setItems(notifications);
      })
      .catch(() => {
        if (isMounted) setItems([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId]);

  const mappedItems = useMemo<DisplayNotification[]>(() => {
    if (items.length === 0) {
      return churchNotificationsPreview.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.text,
        severity: item.severity,
        channel: item.channel,
        eventType: item.trigger,
        read: false,
        dismissed: false,
        link: null,
        createdAt: null,
        real: false,
      }));
    }

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      severity: item.severity === "urgent" ? "Urgente" : item.severity === "action" ? "Acao" : "Info",
      channel: item.channel === "both" ? "Ambos" : item.channel === "member" ? "Minha Igreja" : "Dashboard",
      eventType: item.eventType,
      read: Boolean(item.readAt),
      dismissed: Boolean(item.dismissedAt),
      link: item.link,
      createdAt: item.createdAt,
      real: true,
    }));
  }, [items]);

  const counts = useMemo(() => ({
    active: mappedItems.filter((item) => !item.dismissed).length,
    unread: mappedItems.filter((item) => !item.read && !item.dismissed).length,
    action: mappedItems.filter((item) => item.severity !== "Info" && !item.dismissed).length,
    dismissed: mappedItems.filter((item) => item.dismissed).length,
    all: mappedItems.length,
  }), [mappedItems]);

  const displayItems = useMemo(() => mappedItems.filter((item) => {
    if (filter === "active") return !item.dismissed;
    if (filter === "unread") return !item.read && !item.dismissed;
    if (filter === "action") return item.severity !== "Info" && !item.dismissed;
    if (filter === "dismissed") return item.dismissed;
    return true;
  }), [filter, mappedItems]);

  const updateState = async (id: string, action: "read" | "dismiss") => {
    const target = mappedItems.find((item) => item.id === id);
    if (!target?.real) {
      setFeedback("Acao disponivel quando houver notificacoes reais da igreja.");
      return;
    }
    try {
      const updated = await churchManagementService.updateNotificationState(id, action);
      setItems((current) => current.map((item) => item.id === id ? updated : item));
      setFeedback(action === "read" ? "Notificacao marcada como lida." : "Notificacao dispensada.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel atualizar a notificacao.");
    }
  };

  const markVisibleRead = async () => {
    const visibleIds = displayItems.filter((item) => item.real && !item.read && !item.dismissed).map((item) => item.id);
    if (!activeChurchId || visibleIds.length === 0) {
      setFeedback("Nao ha notificacoes visiveis pendentes para marcar como lidas.");
      return;
    }
    try {
      await churchManagementService.markNotificationsRead(activeChurchId, visibleIds);
      const timestamp = new Date().toISOString();
      setItems((current) => current.map((item) => visibleIds.includes(item.id) ? { ...item, readAt: timestamp } : item));
      setFeedback(`${visibleIds.length} notificacao(oes) marcada(s) como lida(s).`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel marcar as notificacoes como lidas.");
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="border-b border-slate-200 bg-[#0f172a] text-white dark:border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <Link href="/gestao-igreja" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                <Bell size={15} className="text-[#d8b15f]" />
                Alertas e notificacoes
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">Central de alertas</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                Acompanhe eventos acionaveis, feedbacks ao membro e alertas operacionais sem carregar historico pesado.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Ativas", String(counts.active)],
                ["Nao lidas", String(counts.unread)],
                ["Acionaveis", String(counts.action)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/15 bg-white/8 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{label}</p>
                  <p className="mt-3 text-3xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                ["active", "Ativas", counts.active],
                ["unread", "Nao lidas", counts.unread],
                ["action", "Acionaveis", counts.action],
                ["dismissed", "Dispensadas", counts.dismissed],
                ["all", "Todas", counts.all],
              ].map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key as NotificationFilter)}
                  className={`min-h-10 rounded-lg px-3 text-xs font-black uppercase tracking-wider transition ${filter === key ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"}`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={loadNotifications} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                <RefreshCcw size={14} />
                Atualizar
              </button>
              <button type="button" onClick={markVisibleRead} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                <Check size={14} />
                Ler visiveis
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              Carregando notificacoes...
            </div>
          ) : null}

          {!isLoading && displayItems.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm font-semibold leading-7 text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              Nenhuma notificacao encontrada para este filtro.
            </div>
          ) : null}

          {displayItems.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                    <Bell size={21} />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black">{item.title}</h2>
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-200">{item.severity}</span>
                      {item.read ? <span className="rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-800">Lida</span> : null}
                      {item.dismissed ? <span className="rounded-lg bg-slate-200 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-200">Dispensada</span> : null}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.message}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {item.eventType} - {item.channel}
                      {item.createdAt ? ` - ${new Date(item.createdAt).toLocaleDateString("pt-BR")}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.link ? (
                    <Link href={item.link} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                      Abrir
                    </Link>
                  ) : null}
                  {!item.read ? (
                    <button type="button" onClick={() => updateState(item.id, "read")} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                      <Check size={14} />
                      Lida
                    </button>
                  ) : null}
                  {!item.dismissed ? (
                    <button type="button" onClick={() => updateState(item.id, "dismiss")} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                      <EyeOff size={14} />
                      Dispensar
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-4">
          {feedback ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold leading-7 text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              {feedback}
            </section>
          ) : null}
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck size={22} className="text-emerald-600 dark:text-emerald-300" />
              <h2 className="text-xl font-black">Regras</h2>
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p className="flex gap-3"><CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />Eventos repetidos devem ser deduplicados por chave.</p>
              <p className="flex gap-3"><CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />Alertas acionaveis ficam separados de historico pesado.</p>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
