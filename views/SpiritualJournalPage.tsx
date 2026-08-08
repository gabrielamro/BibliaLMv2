"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Flame,
  HeartHandshake,
  Loader2,
  LockKeyhole,
  Moon,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
  Sparkles,
  Star,
  Sun,
  Target,
  Trash2,
  User,
  Wheat,
} from 'lucide-react';
import SEO from '../components/SEO';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../contexts/AuthContext';
import {
  deleteUserJournalData,
  exportUserJournalData,
  getManausDateStr,
  getOrCreateSpiritualDayEntry,
  getSpiritualDayCommitments,
  getSpiritualDayTimeline,
  updateDayPrivateNote,
  updateHeartState,
} from '../services/spiritualJournalService';
import {
  getUserUnifiedFavorites,
  removeUnifiedFavorite,
} from '../services/unifiedFavoritesService';
import type {
  HeartState,
  SpiritualCommitmentItem,
  SpiritualDayEntry,
  SpiritualTimelineItem,
  UserContentFavorite,
} from '../types';
import toast from 'react-hot-toast';

export const HEART_STATE_OPTIONS: Array<{
  id: HeartState;
  emoji: string;
  label: string;
  description: string;
}> = [
  { id: 'em_paz', emoji: '🕊️', label: 'Em paz', description: 'Tranquilo e confiante no Senhor.' },
  { id: 'grato', emoji: '🙏', label: 'Grato', description: 'Reconhecendo a bondade de Deus.' },
  { id: 'esperancoso', emoji: '🕯️', label: 'Esperançoso', description: 'Olhando para as promessas eternas.' },
  { id: 'cansado', emoji: '😴', label: 'Cansado', description: 'Buscando alívio e renovação de forças.' },
  { id: 'ansioso', emoji: '🌿', label: 'Ansioso', description: 'Entregando as preocupações em oração.' },
  { id: 'triste', emoji: '🌧️', label: 'Triste', description: 'Acolhendo o consolo do Espírito Santo.' },
  { id: 'direcao', emoji: '🧭', label: 'Buscando direção', description: 'Pedindo sabedoria para decisões.' },
];

export default function SpiritualJournalPage() {
  const { currentUser } = useAuth();
  const userId = currentUser ? (currentUser.uid ?? currentUser.id) : null;
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Irmão(ã)';

  const [currentDateStr, setCurrentDateStr] = useState<string>(() => getManausDateStr());
  const [loading, setLoading] = useState(true);

  // Estados principais do dia
  const [dayEntry, setDayEntry] = useState<SpiritualDayEntry | null>(null);
  const [privateNoteInput, setPrivateNoteInput] = useState('');
  const [heartNoteInput, setHeartNoteInput] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Linha do tempo, compromissos e favoritos
  const [timelineItems, setTimelineItems] = useState<SpiritualTimelineItem[]>([]);
  const [commitments, setCommitments] = useState<SpiritualCommitmentItem[]>([]);
  const [favorites, setFavorites] = useState<UserContentFavorite[]>([]);

  // Abas e Filtros
  const [activeTab, setActiveTab] = useState<'timeline' | 'prayers' | 'commitments' | 'favorites'>('timeline');
  const [timelineFilter, setTimelineFilter] = useState<string>('all');

  // Modais de exclusão e exportação
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadJournalData = useCallback(async (dateStr: string) => {
    if (!userId) return;
    setLoading(true);
    try {
      const [entry, timeline, userCommitments, userFavs] = await Promise.all([
        getOrCreateSpiritualDayEntry(userId, dateStr),
        getSpiritualDayTimeline(userId, dateStr),
        getSpiritualDayCommitments(userId, dateStr),
        getUserUnifiedFavorites(userId),
      ]);

      setDayEntry(entry);
      setPrivateNoteInput(entry.privateNote || '');
      setHeartNoteInput(entry.heartStateNote || '');
      setTimelineItems(timeline);
      setCommitments(userCommitments);
      setFavorites(userFavs);
    } catch (error) {
      console.error('Erro ao carregar Diário Espiritual:', error);
      toast.error('Não foi possível carregar os registros do dia.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadJournalData(currentDateStr);
  }, [currentDateStr, loadJournalData]);

  const changeDateByDays = (delta: number) => {
    const d = new Date(`${currentDateStr}T12:00:00`);
    d.setDate(d.getDate() + delta);
    setCurrentDateStr(d.toISOString().split('T')[0]);
  };

  const handleSelectMood = async (mood: HeartState) => {
    if (!userId) return;
    try {
      const updated = await updateHeartState(userId, mood, heartNoteInput, currentDateStr);
      setDayEntry(updated);
      toast.success(`Check-in registrado: ${mood.replace('_', ' ')}`);
    } catch (error) {
      toast.error('Erro ao salvar check-in emocional.');
    }
  };

  const handleSavePrivateNote = async () => {
    if (!userId || isSavingNote) return;
    setIsSavingNote(true);
    try {
      const updated = await updateDayPrivateNote(userId, privateNoteInput, currentDateStr);
      setDayEntry(updated);
      toast.success('Anotação privada salva no diário.');
    } catch (error) {
      toast.error('Erro ao salvar anotação.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleRemoveFavorite = async (contentType: any, contentId: string) => {
    if (!userId) return;
    const success = await removeUnifiedFavorite(userId, contentType, contentId);
    if (success) {
      setFavorites((prev) => prev.filter((f) => !(f.contentType === contentType && f.contentId === contentId)));
      toast.success('Favorito removido.');
    }
  };

  const handleExportData = async () => {
    if (!userId) return;
    const data = await exportUserJournalData(userId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diario_espiritual_cultoplus_${currentDateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso!');
  };

  const handleDeleteData = async () => {
    if (!userId) return;
    const ok = await deleteUserJournalData(userId);
    setIsDeleteModalOpen(false);
    if (ok) {
      toast.success('Seus registros privados foram excluídos.');
      void loadJournalData(currentDateStr);
    } else {
      toast.error('Não foi possível excluir os registros.');
    }
  };

  const formattedHeaderDate = React.useMemo(() => {
    const d = new Date(`${currentDateStr}T12:00:00`);
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }, [currentDateStr]);

  const filteredTimeline = React.useMemo(() => {
    if (timelineFilter === 'all') return timelineItems;
    return timelineItems.filter((item) => item.type === timelineFilter);
  }, [timelineFilter, timelineItems]);

  const activeMoodOption = HEART_STATE_OPTIONS.find((opt) => opt.id === dayEntry?.heartState);

  return (
    <main data-module-theme="bible" className="cultoplus-page-content relative min-h-screen bg-[radial-gradient(ellipse_at_top_right,_#fffdf8_0%,_#f7efe1_45%,_#eee4d3_100%)] px-4 py-6 text-[#302316] sm:px-6 lg:px-8 dark:bg-[radial-gradient(ellipse_at_top_right,_#25221e_0%,_#1c1a17_48%,_#141311_100%)] dark:text-[#e7e1d8]">
      <SEO title="Diário Espiritual" name="Culto+" image="/brand/culto-plus-logo.png" description="Sua linha do tempo privada de oração, reflexão e caminhada com Deus no Culto+." />

      <div className="mx-auto max-w-5xl space-y-6">
        {/* CABEÇALHO DA PÁGINA & NAVEGAÇÃO DE DATA (America/Manaus) */}
        <header className="relative overflow-hidden rounded-[28px] border border-[#e8dfd1] bg-[#fffdf7]/90 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#23201c]/90">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#edad2c]">
                <BookOpen size={16} aria-hidden="true" />
                <span>Linha do Tempo Privada</span>
              </div>
              <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#302316] sm:text-3xl dark:text-[#fff7eb]">
                Diário Espiritual
              </h1>
              <p className="mt-1 text-xs text-[#736353] dark:text-[#a89988]">
                {userName}, estes registros são 100% privados e salvos em tempo real.
              </p>
            </div>

            {/* Navegador entre dias */}
            <div className="flex items-center gap-2 rounded-full border border-[#ded5c7] bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-[#2b2722]">
              <button
                type="button"
                onClick={() => changeDateByDays(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#4a3928] hover:bg-[#f4ebd9] dark:text-[#ebdccb] dark:hover:bg-white/10"
                aria-label="Dia anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="px-3 text-center">
                <span className="block font-serif text-xs font-bold capitalize text-[#302316] dark:text-[#fff7eb]">
                  {formattedHeaderDate}
                </span>
              </div>

              <button
                type="button"
                onClick={() => changeDateByDays(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#4a3928] hover:bg-[#f4ebd9] dark:text-[#ebdccb] dark:hover:bg-white/10"
                aria-label="Próximo dia"
              >
                <ChevronRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentDateStr(getManausDateStr())}
                className="ml-1 rounded-full bg-[#edad2c] px-3.5 py-1.5 text-[10px] font-black uppercase text-white shadow-sm hover:bg-[#d99c22] transition"
              >
                Hoje
              </button>
            </div>
          </div>

          {/* BARRA DE RESUMO DO DIA */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#eee4d5] pt-4 sm:grid-cols-4 dark:border-white/10">
            <div className="flex items-center gap-2.5 rounded-2xl border border-[#eee4d5] bg-white/60 p-3 dark:border-white/5 dark:bg-white/[0.02]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edad2c]/15 text-[#edad2c]">
                <Wheat size={16} aria-hidden="true" />
              </span>
              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-500">Pão Diário</span>
                <span className="text-xs font-bold text-[#302316] dark:text-[#fff7eb]">
                  {timelineItems.some((t) => t.type === 'devotional') ? 'Lido hoje' : 'Pendente'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-[#eee4d5] bg-white/60 p-3 dark:border-white/5 dark:bg-white/[0.02]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/15 text-purple-500">
                <HeartHandshake size={16} aria-hidden="true" />
              </span>
              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-500">Orações</span>
                <span className="text-xs font-bold text-[#302316] dark:text-[#fff7eb]">
                  {timelineItems.filter((t) => t.type === 'prayer').length} registradas
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-[#eee4d5] bg-white/60 p-3 dark:border-white/5 dark:bg-white/[0.02]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                <Target size={16} aria-hidden="true" />
              </span>
              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-500">Compromissos</span>
                <span className="text-xs font-bold text-[#302316] dark:text-[#fff7eb]">
                  {commitments.length} ativos
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-[#eee4d5] bg-white/60 p-3 dark:border-white/5 dark:bg-white/[0.02]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
                <Star size={16} aria-hidden="true" />
              </span>
              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-500">Favoritos</span>
                <span className="text-xs font-bold text-[#302316] dark:text-[#fff7eb]">
                  {favorites.length} salvos
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* CHECK-IN "COMO ESTÁ SEU CORAÇÃO HOJE?" (FASE 2) */}
        <section className="rounded-[24px] border border-[#f0e4cf] bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-[#23201c]/90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#edad2c]/15 text-[#edad2c]">
                <Sparkles size={18} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-base font-bold text-[#302316] dark:text-[#fff7eb]">
                  Como está seu coração hoje?
                </h2>
                <p className="text-[11px] text-[#736353] dark:text-[#a89988]">
                  Check-in emocional diário opcional. Apenas você visualiza esse registro.
                </p>
              </div>
            </div>

            {activeMoodOption ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#edad2c]/40 bg-[#edad2c]/10 px-3 py-1 text-xs font-bold text-[#edad2c]">
                <span>{activeMoodOption.emoji}</span>
                <span>{activeMoodOption.label}</span>
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7" role="radiogroup" aria-label="Seleção do estado do coração">
            {HEART_STATE_OPTIONS.map((option) => {
              const isSelected = dayEntry?.heartState === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => void handleSelectMood(option.id)}
                  className={`flex min-h-[76px] flex-col items-center justify-center rounded-2xl border p-3 text-center transition ${
                    isSelected
                      ? 'border-[#edad2c] bg-[#edad2c]/15 font-bold text-[#302316] shadow-sm dark:text-[#fff7eb]'
                      : 'border-[#eee4d5] bg-white/70 hover:border-[#edad2c]/50 dark:border-white/10 dark:bg-[#2b2722]'
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="mt-1 text-[11px] font-semibold">{option.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* CAMPO "O QUE FICOU NO SEU CORAÇÃO HOJE?" (ANOTAÇÃO PRIVADA COM AUTOSAVE) */}
        <section className="rounded-[24px] border border-[#f0e4cf] bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-[#23201c]/90">
          <div className="flex items-center justify-between">
            <label htmlFor="journal-private-note-input" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#edad2c]">
              <Pencil size={15} aria-hidden="true" />
              <span>O que ficou no seu coração hoje?</span>
            </label>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#736353] dark:text-[#a89988]">
              <LockKeyhole size={12} className="text-[#edad2c]" aria-hidden="true" /> Salvo em tempo real
            </span>
          </div>

          <textarea
            id="journal-private-note-input"
            value={privateNoteInput}
            onChange={(e) => setPrivateNoteInput(e.target.value)}
            onBlur={() => void handleSavePrivateNote()}
            rows={4}
            placeholder="Escreva livremente uma reflexão, uma decisão, um agradecimento ou uma oração em silêncio..."
            className="mt-3 w-full resize-y rounded-2xl border border-[#ded5c7] bg-[#fffdf8] p-4 text-sm font-medium text-[#302316] outline-none focus:border-[#edad2c] dark:border-white/10 dark:bg-[#1f1d1a] dark:text-[#fff7eb]"
          />

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => void handleSavePrivateNote()}
              disabled={isSavingNote}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#edad2c] px-6 text-xs font-black uppercase text-white shadow-sm hover:bg-[#d99c22] disabled:opacity-50 transition"
            >
              {isSavingNote ? <Loader2 className="animate-spin" size={14} /> : <Pencil size={14} />}
              <span>Salvar anotação</span>
            </button>
          </div>
        </section>

        {/* NAVEGAÇÃO DE ABAS DO DIÁRIO */}
        <div className="flex items-center justify-between border-b border-[#ded5c7] pb-2 dark:border-white/10">
          <div className="flex items-center gap-2 overflow-x-auto" role="tablist" aria-label="Seções do Diário">
            {[
              { id: 'timeline', label: 'Linha do Tempo', count: timelineItems.length },
              { id: 'prayers', label: 'Orações', count: timelineItems.filter((t) => t.type === 'prayer').length },
              { id: 'commitments', label: 'Compromissos', count: commitments.length },
              { id: 'favorites', label: 'Favoritos', count: favorites.length },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-bold transition ${
                    isActive
                      ? 'bg-[#edad2c] text-white shadow-sm'
                      : 'bg-white/60 text-[#736353] hover:bg-white dark:bg-white/5 dark:text-[#a89988]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 ? (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-[#edad2c]/20 text-[#edad2c]'}`}>
                      {tab.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Opções de Exportação e Exclusão */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleExportData()}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#ded5c7] bg-white px-3.5 text-[11px] font-bold text-[#4a3928] shadow-sm hover:border-[#edad2c] dark:border-white/10 dark:bg-[#2b2722] dark:text-[#ebdccb]"
              title="Exportar dados do diário"
            >
              <Download size={13} className="text-[#edad2c]" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20"
              title="Excluir registros do diário"
              aria-label="Excluir registros"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-500">
              <Loader2 className="mx-auto animate-spin text-[#edad2c]" size={24} />
              <p className="mt-2">Carregando registros do diário...</p>
            </div>
          ) : activeTab === 'timeline' ? (
            <div>
              {/* Filtro por tipo de registro */}
              <div className="mb-4 flex items-center gap-2">
                <Filter size={14} className="text-[#edad2c]" aria-hidden="true" />
                <span className="text-xs font-bold text-[#736353] dark:text-[#a89988]">Filtrar:</span>
                {[
                  ['all', 'Todos'],
                  ['devotional', 'Devocionais'],
                  ['track_note', 'Trilhas'],
                  ['saved_post', 'Posts Salvos'],
                  ['favorite', 'Favoritos'],
                ].map(([fKey, fLabel]) => (
                  <button
                    key={fKey}
                    type="button"
                    onClick={() => setTimelineFilter(fKey)}
                    className={`min-h-8 rounded-full px-3 py-1 text-[11px] font-bold transition ${
                      timelineFilter === fKey
                        ? 'bg-[#edad2c]/20 text-[#edad2c] border border-[#edad2c]/40'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {fLabel}
                  </button>
                ))}
              </div>

              {filteredTimeline.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#ded5c7] p-8 text-center text-xs text-gray-500 dark:border-white/10">
                  <Wheat className="mx-auto mb-2 text-[#edad2c]" size={28} />
                  Nenhum acontecimento registrado nesta data ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTimeline.map((item) => (
                    <article
                      key={item.id}
                      className="flex items-start justify-between rounded-2xl border border-[#eee4d5] bg-white/90 p-4 shadow-sm transition hover:border-[#edad2c]/40 dark:border-white/10 dark:bg-[#23201c]"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#edad2c]/15 px-2.5 py-0.5 text-[9px] font-black uppercase text-[#edad2c]">
                            {item.badge || item.type}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h3 className="font-serif text-sm font-bold text-[#302316] dark:text-[#fff7eb]">
                          {item.title}
                        </h3>
                        {item.subtitle ? (
                          <p className="text-xs text-[#736353] dark:text-[#a89988]">{item.subtitle}</p>
                        ) : null}
                        {item.snippet ? (
                          <p className="mt-1 font-serif text-xs italic text-gray-600 dark:text-gray-300">
                            “{item.snippet}”
                          </p>
                        ) : null}
                      </div>

                      {item.actionUrl ? (
                        <Link
                          href={item.actionUrl}
                          className="inline-flex min-h-9 items-center rounded-full border border-[#ded5c7] bg-white px-3.5 text-xs font-bold text-[#302316] hover:border-[#edad2c] dark:border-white/10 dark:bg-[#2b2722] dark:text-[#fff7eb]"
                        >
                          Abrir
                        </Link>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* ABA FAVORITOS UNIFICADOS (FASE 4) */}
          {activeTab === 'favorites' ? (
            <div className="space-y-3">
              {favorites.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#ded5c7] p-8 text-center text-xs text-gray-500 dark:border-white/10">
                  <Star className="mx-auto mb-2 text-[#edad2c]" size={28} />
                  Sua biblioteca de favoritos está vazia. Salve versículos, estudos ou posts para ver aqui.
                </div>
              ) : (
                favorites.map((fav) => (
                  <article
                    key={fav.id}
                    className="flex items-start justify-between rounded-2xl border border-[#eee4d5] bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-[#23201c]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#edad2c]/15 px-2.5 py-0.5 text-[9px] font-black uppercase text-[#edad2c]">
                          {fav.contentType}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {fav.createdAt ? new Date(fav.createdAt).toLocaleDateString('pt-BR') : ''}
                        </span>
                      </div>

                      <h3 className="mt-1 font-serif text-sm font-bold text-[#302316] dark:text-[#fff7eb]">
                        {fav.title}
                      </h3>

                      {fav.snapshot?.textSnippet ? (
                        <p className="mt-1 font-serif text-xs italic text-gray-600 dark:text-gray-300">
                          “{fav.snapshot.textSnippet}”
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      {fav.snapshot?.originUrl ? (
                        <Link
                          href={fav.snapshot.originUrl}
                          className="inline-flex min-h-9 items-center rounded-full border border-[#ded5c7] bg-white px-3.5 text-xs font-bold text-[#302316] hover:border-[#edad2c] dark:border-white/10 dark:bg-[#2b2722] dark:text-[#fff7eb]"
                        >
                          Abrir
                        </Link>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => void handleRemoveFavorite(fav.contentType, fav.contentId)}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:text-red-500"
                        title="Remover favorito"
                        aria-label="Remover favorito"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          ) : null}

          {/* ABA COMPROMISSOS (FASE 6) */}
          {activeTab === 'commitments' ? (
            <div className="space-y-3">
              {commitments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#ded5c7] p-8 text-center text-xs text-gray-500 dark:border-white/10">
                  <Target className="mx-auto mb-2 text-[#edad2c]" size={28} />
                  Nenhum compromisso ou escala agendada para este dia.
                </div>
              ) : (
                commitments.map((com) => (
                  <article
                    key={com.id}
                    className="flex items-start justify-between rounded-2xl border border-[#eee4d5] bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-[#23201c]"
                  >
                    <div>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[9px] font-black uppercase text-emerald-600">
                        {com.status}
                      </span>
                      <h3 className="mt-1 font-serif text-sm font-bold text-[#302316] dark:text-[#fff7eb]">
                        {com.title}
                      </h3>
                      {com.description ? (
                        <p className="mt-0.5 text-xs text-gray-500">{com.description}</p>
                      ) : null}
                    </div>

                    {com.actionUrl ? (
                      <Link
                        href={com.actionUrl}
                        className="inline-flex min-h-9 items-center rounded-full border border-[#ded5c7] bg-white px-3.5 text-xs font-bold text-[#302316] hover:border-[#edad2c] dark:border-white/10 dark:bg-[#2b2722] dark:text-[#fff7eb]"
                      >
                        Ver detalhes
                      </Link>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE DADOS */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => void handleDeleteData()}
        title="Excluir seus registros privados?"
        message="Esta ação é permanente e irá remover todas as suas notas privadas do Diário Espiritual e favoritos salvos nesta conta."
        confirmText="Excluir permanentemente"
        cancelText="Cancelar"
        variant="danger"
      />
    </main>
  );
}
