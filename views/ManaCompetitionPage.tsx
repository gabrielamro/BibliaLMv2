"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Award, BookOpen, CheckCircle2, ChevronRight, Flame, Medal, ShieldCheck, Sparkles, Trophy, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import {
  getManaChecklist,
  getManaProgress,
  getPublicManaRules,
  getWeeklyMana,
  USER_MANA_LEVELS,
} from '../services/gamificationService';
import type { ChurchGamificationSnapshot, UserProfile } from '../types';

const statCards = [
  { key: 'totalChaptersRead', label: 'Capitulos lidos', icon: BookOpen },
  { key: 'totalDevotionalsRead', label: 'Devocionais', icon: Flame },
  { key: 'totalQuizzesCompleted', label: 'Quizzes', icon: Trophy },
  { key: 'totalShares', label: 'Compartilhamentos', icon: Sparkles },
] as const;

const ManaCompetitionPage: React.FC = () => {
  const { userProfile, systemSettings } = useAuth();
  const [ranking, setRanking] = useState<UserProfile[]>([]);
  const [churchRanking, setChurchRanking] = useState<ChurchGamificationSnapshot[]>([]);
  const [normalizedChurchRanking, setNormalizedChurchRanking] = useState<ChurchGamificationSnapshot[]>([]);
  const [isLoadingRanking, setIsLoadingRanking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      dbService.getGlobalRanking(),
      dbService.getChurchGamificationRanking(undefined, 'total', 5),
      dbService.getChurchGamificationRanking(undefined, 'normalized', 5),
    ])
      .then(([users, churches, normalizedChurches]) => {
        if (!isMounted) return;
        setRanking(users);
        setChurchRanking(churches);
        setNormalizedChurchRanking(normalizedChurches);
      })
      .finally(() => {
        if (isMounted) setIsLoadingRanking(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const xp = userProfile?.lifetimeXp ?? 0;
  const weeklyMana = useMemo(() => getWeeklyMana(userProfile?.activityLog ?? []), [userProfile?.activityLog]);
  const progress = useMemo(() => getManaProgress(xp), [xp]);
  const checklist = useMemo(() => userProfile ? getManaChecklist(userProfile) : [], [userProfile]);
  const rules = useMemo(() => getPublicManaRules(), []);
  const activeCampaigns = useMemo(() => {
    const now = new Date();
    return (systemSettings.gamificationCampaigns ?? []).filter(campaign => {
      if (!campaign.isActive) return false;
      const startsAt = new Date(campaign.startsAt);
      const endsAt = new Date(campaign.endsAt);
      return (Number.isNaN(startsAt.getTime()) || startsAt <= now) && (Number.isNaN(endsAt.getTime()) || endsAt >= now);
    });
  }, [systemSettings.gamificationCampaigns]);
  const completedToday = checklist.filter(item => item.isDoneToday).length;

  return (
    <main className="min-h-screen bg-slate-50 text-gray-950 dark:bg-bible-dark dark:text-white">
      <section className="border-b border-white/70 bg-white/90 px-4 py-6 shadow-sm dark:border-white/10 dark:bg-bible-darkPaper/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <Trophy size={14} /> Temporada atual
            </div>
            <h1 className="text-3xl font-black md:text-4xl">Maná, níveis e rankings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
              Acompanhe sua constancia, entenda como ganhar Mana e veja a competicao saudavel da comunidade.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:min-w-[360px]">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <span className="block text-xs font-bold uppercase text-emerald-700 dark:text-emerald-200">Mana total</span>
              <strong className="mt-1 block text-2xl">{xp}</strong>
            </div>
            <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-4 dark:border-cyan-500/20 dark:bg-cyan-500/10">
              <span className="block text-xs font-bold uppercase text-cyan-700 dark:text-cyan-200">Ultimos 7 dias</span>
              <strong className="mt-1 block text-2xl">{weeklyMana}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-bible-darkPaper">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-purple-700 dark:text-purple-300">
                  <Award size={18} /> Meu progresso
                </div>
                <h2 className="mt-1 text-2xl font-black">{progress.current.name}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{progress.current.focus}</p>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {progress.next ? (
                  <span>Faltam <strong className="text-gray-950 dark:text-white">{progress.remaining}</strong> Mana para {progress.next.name}.</span>
                ) : (
                  <span>Voce chegou ao maior nivel atual.</span>
                )}
              </div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500" style={{ width: `${progress.percent}%` }} />
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map(card => {
              const Icon = card.icon;
              return (
                <article key={card.key} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-bible-darkPaper">
                  <Icon className="mb-3 text-bible-gold" size={20} />
                  <span className="block text-xs font-bold uppercase text-gray-500">{card.label}</span>
                  <strong className="mt-1 block text-2xl">{Number(userProfile?.stats?.[card.key] ?? 0)}</strong>
                </article>
              );
            })}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-bible-darkPaper">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">Checklist diario</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">{completedToday} de {checklist.length} acoes concluidas hoje.</p>
              </div>
              <CheckCircle2 className="text-emerald-600" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {checklist.map(item => (
                <Link key={item.action} href={item.href} className="group flex min-h-24 items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:border-bible-gold hover:bg-amber-50/60 dark:border-white/10 dark:hover:bg-amber-500/10">
                  <div>
                    <span className="flex items-center gap-2 font-bold">
                      {item.isDoneToday && <CheckCircle2 size={16} className="text-emerald-600" />}
                      {item.label}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">{item.limitLabel} | +{item.possibleXp} Mana</span>
                  </div>
                  <ChevronRight className="text-gray-300 transition group-hover:text-bible-gold" size={20} />
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-bible-darkPaper">
            <h2 className="text-lg font-black">Como ganhar Mana</h2>
            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
              <div className="grid grid-cols-[1fr_84px_120px] bg-gray-50 px-4 py-3 text-xs font-black uppercase text-gray-500 dark:bg-gray-900/40">
                <span>Acao</span>
                <span>Mana</span>
                <span>Limite</span>
              </div>
              {rules.slice(0, 18).map(rule => (
                <div key={rule.action} className="grid grid-cols-[1fr_84px_120px] border-t border-gray-100 px-4 py-3 text-sm dark:border-white/10">
                  <span>
                    <strong className="block">{rule.label}</strong>
                    <span className="text-xs text-gray-500">{rule.description}</span>
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">+{rule.defaultXp}</span>
                  <span className="text-xs text-gray-500">{rule.dailyLimit ? `${rule.dailyLimit}/dia` : 'Livre'}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-bible-darkPaper">
            <h2 className="text-lg font-black">Desafios ativos</h2>
            {activeCampaigns.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">Nenhuma campanha ativa agora.</p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {activeCampaigns.map(campaign => (
                  <article key={campaign.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                    <h3 className="font-black text-gray-950 dark:text-white">{campaign.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{campaign.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                      <span className="rounded-full bg-white px-2 py-1 text-amber-700 dark:bg-black/20 dark:text-amber-200">{campaign.rewardLabel}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-gray-500 dark:bg-black/20">{new Date(campaign.endsAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-bible-darkPaper">
            <div className="mb-4 flex items-center gap-2">
              <Medal className="text-bible-gold" size={20} />
              <h2 className="font-black">Niveis de usuario</h2>
            </div>
            <div className="space-y-3">
              {USER_MANA_LEVELS.map(level => (
                <div key={level.key} className={`rounded-lg border p-3 ${level.key === progress.current.key ? 'border-bible-gold bg-amber-50 dark:bg-amber-500/10' : 'border-gray-100 dark:border-white/10'}`}>
                  <strong className="block text-sm">{level.name}</strong>
                  <span className="text-xs text-gray-500">{level.minXp}{level.maxXp ? `-${level.maxXp}` : '+'} Mana | {level.focus}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-bible-darkPaper">
            <div className="mb-4 flex items-center gap-2">
              <Users className="text-cyan-600" size={20} />
              <h2 className="font-black">Ranking global</h2>
            </div>
            {isLoadingRanking ? (
              <p className="text-sm text-gray-500">Carregando ranking...</p>
            ) : (
              <div className="space-y-3">
                {ranking.map((user, index) => (
                  <div key={user.uid} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3 dark:border-white/10">
                    <span className="flex min-w-0 items-center gap-3">
                      <strong className="w-6 text-center text-sm text-gray-400">{index + 1}</strong>
                      <span className="truncate text-sm font-bold">{user.displayName || user.username}</span>
                    </span>
                    <span className="text-sm font-black text-purple-700 dark:text-purple-300">{user.lifetimeXp ?? 0}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-cyan-200 bg-cyan-50 p-5 dark:border-cyan-500/20 dark:bg-cyan-500/10">
            <div className="mb-2 flex items-center gap-2 font-black text-cyan-800 dark:text-cyan-100">
              <ShieldCheck size={20} /> Minha igreja
            </div>
            <p className="text-sm leading-6 text-cyan-900/80 dark:text-cyan-100/80">
              {userProfile?.churchData?.churchName
                ? `${userProfile.churchData.churchName} aparece aqui como contexto. Rankings internos e globais por igreja ficam preparados para snapshots de Mana.`
                : 'Vincule-se a uma igreja para acompanhar ranking interno, grupos e progresso coletivo.'}
            </p>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-bible-darkPaper">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="text-emerald-600" size={20} />
              <h2 className="font-black">Ranking de igrejas</h2>
            </div>
            {churchRanking.length === 0 && normalizedChurchRanking.length === 0 ? (
              <p className="text-sm leading-6 text-gray-500">Snapshots de igreja ainda nao encontrados. A migration prepara esses dados para rankings absoluto e proporcional.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-gray-400">Absoluto</p>
                  <div className="space-y-2">
                    {churchRanking.map((church, index) => (
                      <div key={`${church.churchId}-total`} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 text-sm dark:border-white/10">
                        <span className="truncate font-bold">{index + 1}. {church.churchName || church.churchId}</span>
                        <span className="font-black text-emerald-700 dark:text-emerald-300">{church.totalXp}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-gray-400">Proporcional</p>
                  <div className="space-y-2">
                    {normalizedChurchRanking.map((church, index) => (
                      <div key={`${church.churchId}-normalized`} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 text-sm dark:border-white/10">
                        <span className="truncate font-bold">{index + 1}. {church.churchName || church.churchId}</span>
                        <span className="font-black text-cyan-700 dark:text-cyan-300">{church.xpPerActiveMember.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
};

export default ManaCompetitionPage;
