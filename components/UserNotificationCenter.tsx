"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Check, CheckCircle2, ChevronRight, Info, Sparkles, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import type { AppNotification } from "../types";

const notificationDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatNotificationDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Agora" : notificationDateFormatter.format(date);
}

function NotificationIcon({ type }: { type: AppNotification["type"] }) {
  if (type === "success") return <CheckCircle2 size={17} />;
  if (type === "badge") return <Sparkles size={17} />;
  if (type === "warning") return <Info size={17} />;
  return <Bell size={17} />;
}

export default function UserNotificationCenter({ className = "", desktopMenuCompact = false }: { className?: string; desktopMenuCompact?: boolean }) {
  const { currentUser, notifications, unreadNotificationsCount, markNotificationsAsRead } = useAuth();
  const detailsRef = useRef<HTMLDetailsElement>(null);

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
      detailsRef.current.querySelector<HTMLElement>("summary")?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePanel]);

  if (!currentUser) return null;

  const visibleNotifications = notifications.slice(0, 8);

  return (
    <details ref={detailsRef} data-testid="user-notification-center" className={`group relative ${className}`}>
      <summary aria-label={`Notificações: ${unreadNotificationsCount} não lidas`} className="module-focus relative flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-[#ded8cf] bg-white text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
        <Bell size={19} />
        {unreadNotificationsCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
            {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
          </span>
        ) : null}
      </summary>

      <section aria-label="Central de notificações do usuário" className={`fixed inset-x-3 top-[4.5rem] z-[230] flex max-h-[calc(100dvh-5.25rem)] w-auto flex-col overflow-hidden rounded-2xl border border-[#ded8cf] bg-white shadow-2xl dark:border-white/10 dark:bg-[#151515] sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:max-h-[min(560px,calc(100vh-5rem))] sm:w-[360px] lg:fixed lg:right-auto lg:top-6 ${desktopMenuCompact ? "lg:left-[84px]" : "lg:left-[256px]"}`}>
        <header className="module-gradient shrink-0 p-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/70">Sua conta</p>
              <h2 className="mt-1 font-black">Notificações</h2>
              <p className="mt-1 text-xs text-white/75">Avisos sobre sua jornada no Culto+.</p>
            </div>
            <button type="button" onClick={closePanel} aria-label="Fechar notificações" className="module-focus flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20">
              <X size={17} />
            </button>
          </div>
          {unreadNotificationsCount > 0 ? (
            <button type="button" onClick={() => void markNotificationsAsRead()} className="module-focus mt-4 inline-flex min-h-9 items-center gap-2 rounded-lg bg-white/10 px-3 text-xs font-bold transition hover:bg-white/20">
              <Check size={14} /> Marcar todas como lidas
            </button>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {visibleNotifications.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle2 className="mx-auto module-accent-text" size={28} />
              <strong className="mt-3 block text-sm">Tudo em dia</strong>
              <p className="mt-1 text-xs text-slate-500">Nenhuma notificação por enquanto.</p>
            </div>
          ) : visibleNotifications.map((notification) => {
            const content = (
              <>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${notification.read ? "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400" : "module-icon"}`}>
                  <NotificationIcon type={notification.type} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs text-slate-800 dark:text-slate-100">{notification.title}</strong>
                  <small className="mt-1 line-clamp-2 block text-[10px] leading-4 text-slate-500 dark:text-slate-400">{notification.message}</small>
                  <time dateTime={notification.timestamp} className="mt-1.5 block text-[9px] font-semibold text-slate-400">{formatNotificationDate(notification.timestamp)}</time>
                </span>
                {notification.link ? <ChevronRight size={14} className="mt-2 shrink-0 text-slate-300" /> : null}
              </>
            );
            const itemClass = `flex min-h-16 gap-3 rounded-xl p-3 transition ${notification.read ? "hover:bg-slate-50 dark:hover:bg-white/5" : "module-soft-surface hover:brightness-[0.98]"}`;

            return notification.link ? (
              <Link key={notification.id} href={notification.link} onClick={closePanel} className={`${itemClass} module-focus`}>{content}</Link>
            ) : (
              <div key={notification.id} className={itemClass}>{content}</div>
            );
          })}
        </div>
      </section>
    </details>
  );
}
