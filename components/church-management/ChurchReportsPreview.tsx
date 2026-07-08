"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Bell, ClipboardList, Inbox, Medal, QrCode, ShieldCheck, Users } from "lucide-react";
import { churchManagementService } from "../../services/churchManagementService";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchManagementSummary } from "../../types";

export default function ChurchReportsPreview() {
  const { userProfile } = useAuth();
  const activeChurchId = userProfile?.churchData?.churchId;
  const [summary, setSummary] = useState<ChurchManagementSummary | null>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);

  useEffect(() => {
    if (!activeChurchId) return;
    let isMounted = true;
    setIsLoading(true);
    Promise.all([
      churchManagementService.getSummary(activeChurchId),
      churchManagementService.getAnalyticsSnapshots(activeChurchId, 6),
    ])
      .then(([data, snapshotItems]) => {
        if (isMounted) {
          setSummary(data);
          setSnapshots(snapshotItems);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSummary(null);
          setSnapshots([]);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId]);

  const metrics = useMemo(() => {
    const data = summary ?? {
      openSubmissions: 0,
      pendingAssignments: 0,
      activeTeams: 0,
      activeQrForms: 0,
      unreadNotifications: 0,
      badgesAwarded: 0,
    };
    return [
      { label: "Pedidos abertos", value: data.openSubmissions, source: "church_form_submissions", icon: Inbox, href: "/gestao-igreja/inbox" },
      { label: "Designacoes pendentes", value: data.pendingAssignments, source: "church_assignments", icon: ClipboardList, href: "/gestao-igreja/designacoes" },
      { label: "Equipes ativas", value: data.activeTeams, source: "church_service_teams", icon: Users, href: "/gestao-igreja/equipes" },
      { label: "QR ativos", value: data.activeQrForms, source: "church_qr_forms", icon: QrCode, href: "/gestao-igreja/qrcodes" },
      { label: "Alertas nao lidos", value: data.unreadNotifications, source: "church_management_notifications", icon: Bell, href: "/gestao-igreja/notificacoes" },
      { label: "Conquistas registradas", value: data.badgesAwarded, source: "conquistas padrao", icon: Medal, href: "/gestao-igreja/insignias" },
    ];
  }, [summary]);

  const handleCreateSnapshot = async () => {
    if (!activeChurchId || isCreatingSnapshot) return;
    setIsCreatingSnapshot(true);
    try {
      await churchManagementService.createAnalyticsSnapshot(activeChurchId);
      const items = await churchManagementService.getAnalyticsSnapshots(activeChurchId, 6);
      setSnapshots(items);
    } finally {
      setIsCreatingSnapshot(false);
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
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                <BarChart3 size={15} className="text-[#d8b15f]" />
                Indicadores leves
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">Indicadores e relatorios</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                Resumo operacional com consultas pequenas, sem analytics historico pesado no MVP.
              </p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/8 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Estrategia de custo</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">Esta tela usa contadores/sumarios. Tendencias, exportacoes e snapshots historicos ficam para fase de analytics.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        {isLoading ? (
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            Carregando indicadores...
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Link key={`${metric.label}-${metric.href}`} href={metric.href} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.04]">
                <Icon size={22} className="text-[#9a7a2f]" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{metric.label}</p>
                <p className="mt-3 text-4xl font-black">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Fonte: {metric.source}</p>
              </Link>
            );
          })}
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck size={22} className="text-emerald-600 dark:text-emerald-300" />
            <h2 className="text-xl font-black">Limites do MVP</h2>
          </div>
          <div className="grid gap-3 text-sm leading-7 text-slate-600 dark:text-slate-300 md:grid-cols-3">
            <p>Sem ranking espiritual individual.</p>
            <p>Sem varreduras historicas automaticas.</p>
            <p>Sem exportacao ampla antes de snapshots.</p>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Snapshots historicos</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Registro leve dos indicadores do dia para tendencia sem varredura pesada.</p>
            </div>
            <button
              type="button"
              onClick={handleCreateSnapshot}
              disabled={!activeChurchId || isCreatingSnapshot}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
            >
              <BarChart3 size={15} />
              {isCreatingSnapshot ? "Salvando" : "Criar snapshot"}
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {snapshots.map((snapshot) => (
              <article key={snapshot.id ?? `${snapshot.period_key}-${snapshot.created_at}`} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{snapshot.period_key ?? "Periodo"}</p>
                <p className="mt-3 text-2xl font-black">{snapshot.members_count ?? 0}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">membros registrados</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <span className="rounded-lg bg-slate-100 p-3 font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">{snapshot.forms_submissions_count ?? 0} pedidos</span>
                  <span className="rounded-lg bg-slate-100 p-3 font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">{snapshot.checkins_count ?? 0} check-ins</span>
                </div>
              </article>
            ))}
            {!isLoading && snapshots.length === 0 ? (
              <article className="rounded-lg border border-slate-200 p-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:text-slate-300 md:col-span-3">
                Nenhum snapshot criado ainda. Use a acao acima para registrar o estado atual dos indicadores.
              </article>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
