"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Network, ShieldCheck, Users } from "lucide-react";
import { churchManagementService, type ChurchGroupFollowUpResult, type ChurchGroupOperationalItem } from "../../services/churchManagementService";
import { useAuth } from "../../contexts/AuthContext";

export default function ChurchGroupsPreview() {
  const { userProfile } = useAuth();
  const activeChurchId = userProfile?.churchData?.churchId;
  const [items, setItems] = useState<ChurchGroupOperationalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowingUp, setIsFollowingUp] = useState(false);
  const [followUpResult, setFollowUpResult] = useState<ChurchGroupFollowUpResult | null>(null);

  useEffect(() => {
    if (!activeChurchId) return;
    let isMounted = true;
    setIsLoading(true);
    churchManagementService.getGroupOperationalItems(activeChurchId, 24)
      .then((items) => {
        if (isMounted) setItems(items);
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

  const metrics = useMemo(() => {
    const groups = items.map((item) => item.group);
    const members = groups.reduce((sum, group) => sum + (group.stats?.memberCount ?? 0), 0);
    const mana = groups.reduce((sum, group) => sum + (group.stats?.totalMana ?? 0), 0);
    const leaders = groups.filter((group) => group.leaderName || group.leaderUid).length;
    const pendingInvites = items.reduce((sum, item) => sum + item.pendingInvitesCount, 0);
    return [
      { label: "Grupos ativos", value: groups.length, icon: Network },
      { label: "Membros em grupos", value: members, icon: Users },
      { label: "Liderancas", value: leaders, icon: ShieldCheck },
      { label: "Convites pendentes", value: pendingInvites, icon: Network },
    ];
  }, [items]);

  const handleFollowUp = async () => {
    if (!activeChurchId || isFollowingUp) return;
    setIsFollowingUp(true);
    setFollowUpResult(null);
    try {
      const result = await churchManagementService.createGroupInviteFollowUp(activeChurchId);
      setFollowUpResult(result);
    } finally {
      setIsFollowingUp(false);
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
                <Network size={15} className="text-[#d8b15f]" />
                Grupos conectados
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">Grupos e celulas</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                Visao operacional dos grupos da igreja para lideranca, designacoes, acompanhamento e conquistas padronizadas.
              </p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/8 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Separacao correta</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">Gestao da Igreja acompanha e aciona grupos, enquanto o cadastro completo permanece no modulo de igreja/grupos.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        {isLoading ? (
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            Carregando grupos...
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, metricIndex) => {
            const Icon = metric.icon;
            return (
              <article key={`${metric.label}-${metricIndex}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <Icon size={21} className="text-[#9a7a2f]" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{metric.label}</p>
                <p className="mt-3 text-3xl font-black">{metric.value}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Diretorio operacional</h2>
              <Link href="/igrejas" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                Abrir igreja
                <ExternalLink size={15} />
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map(({ group, pendingInvitesCount }) => (
                <article key={group.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{group.privacy ?? "public"}</p>
                  <h3 className="mt-2 text-lg font-black">{group.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Lider: {group.leaderName ?? "A definir"}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <span className="rounded-lg bg-slate-100 p-3 font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">{group.stats?.memberCount ?? 0} membros</span>
                    <span className="rounded-lg bg-slate-100 p-3 font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">{pendingInvitesCount} convites</span>
                  </div>
                </article>
              ))}
              {!isLoading && items.length === 0 ? (
                <article className="rounded-lg border border-slate-200 p-5 dark:border-white/10 md:col-span-2">
                  <h3 className="text-lg font-black">Nenhum grupo conectado</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Quando a igreja criar grupos/celulas reais, eles aparecem aqui para acompanhamento operacional.
                  </p>
                  <Link href="/igrejas" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                    Abrir modulo de igreja
                    <ExternalLink size={15} />
                  </Link>
                </article>
              ) : null}
            </div>
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <ShieldCheck size={24} className="text-emerald-600 dark:text-emerald-300" />
            <h2 className="mt-4 text-xl font-black">Como entra no roadmap</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p className="rounded-lg border border-slate-200 p-3 dark:border-white/10">Designacoes podem ser filtradas por grupo ou celula.</p>
              <p className="rounded-lg border border-slate-200 p-3 dark:border-white/10">Convites pendentes aparecem no acompanhamento sem abrir dados sensiveis.</p>
              <p className="rounded-lg border border-slate-200 p-3 dark:border-white/10">Conquistas e manas continuam padrao do BibliaLM, registradas por eventos auditaveis.</p>
            </div>
            <button
              type="button"
              onClick={handleFollowUp}
              disabled={!activeChurchId || isFollowingUp}
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
            >
              <ShieldCheck size={15} />
              {isFollowingUp ? "Acompanhando" : "Gerar alertas"}
            </button>
            {followUpResult ? (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                {followUpResult.notificationsCreated} alerta(s) para {followUpResult.pendingInvites} convite(s) pendente(s).
              </p>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}
