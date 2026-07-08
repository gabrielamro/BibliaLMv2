"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { dbService } from '../services/supabase';
import { GuidedPrayer } from '../types';
import { generateSpecificPrayer } from '../services/pastorAgent';
import {
  ChevronRight,
  Church,
  Copy,
  Globe,
  HandHeart,
  Loader2,
  Plus,
  Sparkles,
  StopCircle,
  Volume2,
} from 'lucide-react';
import SEO from '../components/SEO';
import useAudioNarration from '../hooks/useAudioNarration';
import SmartText from '../components/reader/SmartText';
import { STATIC_PRAYERS } from '../constants';

const PRAYER_CATEGORIES = [
  { id: 'morning', label: 'Manhã' },
  { id: 'night', label: 'Noite' },
  { id: 'anxiety', label: 'Ansiedade' },
  { id: 'gratitude', label: 'Gratidão' },
  { id: 'family', label: 'Família' },
  { id: 'warfare', label: 'Batalha' },
];

const GuidedPrayersPage: React.FC = () => {
  const { currentUser, userProfile, checkFeatureAccess, openSubscription } = useAuth();
  const { setTitle, setIcon, resetHeader } = useHeader();
  const [prayers, setPrayers] = useState<GuidedPrayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrayer, setGeneratedPrayer] = useState<{ title: string; content: string } | null>(null);
  const [playingPrayerId, setPlayingPrayerId] = useState<string | null>(null);

  const { isPlaying, togglePlayPause, stopAudio } = useAudioNarration(
    playingPrayerId
      ? (prayers.find((prayer) => prayer.id === playingPrayerId)?.content || generatedPrayer?.content || '')
      : ''
  );

  useEffect(() => {
    setTitle('Orações');
    setIcon(<HandHeart size={20} />);
    return () => resetHeader();
  }, [setTitle, setIcon, resetHeader]);

  useEffect(() => {
    loadPrayers();
  }, [currentUser]);

  const loadPrayers = async () => {
    setLoading(true);
    try {
      const churchId = userProfile?.churchData?.churchId;
      const dbPrayers = await dbService.getGuidedPrayers(churchId);
      const combinedPrayers = [...STATIC_PRAYERS, ...dbPrayers];
      const uniquePrayers = Array.from(new Map(combinedPrayers.map((item) => [item.id, item])).values());

      setPrayers(uniquePrayers);
    } catch (e) {
      console.error(e);
      setPrayers(STATIC_PRAYERS);
    } finally {
      setLoading(false);
    }
  };

  const determineCategory = (text: string): GuidedPrayer['category'] => {
    const lower = text.toLowerCase();
    if (lower.includes('manhã') || lower.includes('manha') || lower.includes('dia') || lower.includes('acordar')) return 'morning';
    if (lower.includes('noite') || lower.includes('dormir') || lower.includes('sono')) return 'night';
    if (lower.includes('ansiedade') || lower.includes('medo') || lower.includes('preocupação') || lower.includes('preocupacao')) return 'anxiety';
    if (lower.includes('família') || lower.includes('familia') || lower.includes('filhos') || lower.includes('casamento')) return 'family';
    if (lower.includes('guerra') || lower.includes('batalha') || lower.includes('inimigo')) return 'warfare';
    if (lower.includes('obrigado') || lower.includes('gratidão') || lower.includes('gratidao') || lower.includes('agradecer')) return 'gratitude';
    return 'general';
  };

  const handleGenerate = async () => {
    if (!aiTopic.trim()) return;
    if (currentUser && !checkFeatureAccess('aiChatAccess')) {
      openSubscription();
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateSpecificPrayer(aiTopic, 'Reverente e Esperançoso');
      setGeneratedPrayer(result);

      if (result?.content) {
        await dbService.createGuidedPrayer({
          title: result.title,
          content: result.content,
          category: determineCategory(aiTopic),
          authorId: 'system-ai',
          authorName: 'Obreiro IA',
          isTemplate: true,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayAudio = (prayerId: string) => {
    if (playingPrayerId === prayerId && isPlaying) {
      togglePlayPause();
      return;
    }

    if (playingPrayerId) stopAudio(true);
    setPlayingPrayerId(prayerId);
    setTimeout(() => togglePlayPause(), 100);
  };

  const dailyPrayer = useMemo(
    () => prayers.find((prayer) => prayer.category === 'morning') || prayers[0] || STATIC_PRAYERS[0],
    [prayers]
  );

  const filteredPrayers = activeCat === 'all'
    ? prayers
    : prayers.filter((prayer) => prayer.category === activeCat);

  return (
    <div className="h-full overflow-y-auto bg-stone-50/60 p-4 dark:bg-black/20 md:p-8">
      <SEO title="Orações" />
      <div className="mx-auto max-w-6xl space-y-8 pb-24">
        <section className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-bible-darkPaper md:p-8">
          <div className="pointer-events-none absolute right-[-80px] top-[-120px] select-none font-serif text-[220px] font-medium leading-none text-stone-900/5 dark:text-stone-300/5">
            AM
          </div>
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                <HandHeart size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Módulo Orações</span>
              </div>
              <h1 className="font-serif text-3xl font-bold leading-tight text-gray-950 dark:text-white md:text-5xl">
                Oração do Dia
              </h1>
              <h2 className="mt-4 text-xl font-bold text-stone-800 dark:text-stone-200">
                {dailyPrayer.title}
              </h2>
              <p className="mt-4 whitespace-pre-wrap font-serif text-lg italic leading-relaxed text-gray-700 dark:text-gray-300">
                "<SmartText text={dailyPrayer.content} enabled={true} />"
              </p>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300">
                {dailyPrayer.authorName}
              </p>
            </div>
            <button
              onClick={() => handlePlayAudio(dailyPrayer.id)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-stone-800 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-stone-900"
            >
              {isPlaying && playingPrayerId === dailyPrayer.id ? <StopCircle size={16} /> : <Volume2 size={16} />}
              Ouvir
            </button>
          </div>
        </section>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-bible-darkPaper">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-stone-700 dark:text-stone-300">
            <Sparkles size={20} /> Gerar Oração Personalizada
          </h2>

          {!generatedPrayer ? (
            <div className="flex flex-col gap-2 md:flex-row">
              <input
                type="text"
                value={aiTopic}
                onChange={(event) => setAiTopic(event.target.value)}
                placeholder="Pelo que você quer orar? Ex: entrevista de emprego"
                className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 p-4 outline-none focus:ring-2 ring-stone-500/50 dark:border-gray-700 dark:bg-gray-900"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !aiTopic}
                className="min-h-11 rounded-2xl bg-stone-800 px-6 font-bold text-white transition-colors hover:bg-stone-900 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Plus />}
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in rounded-3xl border border-stone-200 bg-stone-50 p-6 dark:border-stone-700 dark:bg-stone-950/20">
              <div className="mb-4 flex items-start justify-between gap-4">
                <h3 className="font-serif text-2xl font-bold text-stone-950 dark:text-stone-100">
                  {generatedPrayer.title}
                </h3>
                <button
                  onClick={() => handlePlayAudio('generated')}
                  className="rounded-full bg-stone-100 p-3 text-stone-700 transition-colors hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                >
                  {isPlaying && playingPrayerId === 'generated' ? <StopCircle size={20} /> : <Volume2 size={20} />}
                </button>
              </div>
              <p className="mb-6 whitespace-pre-wrap font-serif text-lg italic leading-relaxed text-gray-700 dark:text-gray-300">
                "<SmartText text={generatedPrayer.content} enabled={true} />"
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { setGeneratedPrayer(null); setAiTopic(''); stopAudio(true); }}
                  className="text-sm font-bold text-gray-500 transition-colors hover:text-stone-700"
                >
                  Nova Oração
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedPrayer.content)}
                  className="flex items-center gap-1 text-sm font-bold text-stone-700 transition-colors hover:text-stone-800"
                >
                  <Copy size={16} /> Copiar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setActiveCat('all')}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeCat === 'all' ? 'bg-stone-800 text-white shadow-md' : 'bg-white text-gray-500 dark:bg-bible-darkPaper'}`}
          >
            Tudo
          </button>
          {PRAYER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeCat === cat.id ? 'bg-stone-800 text-white shadow-md' : 'bg-white text-gray-500 dark:bg-bible-darkPaper'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-stone-700" size={40} />
          </div>
        ) : filteredPrayers.length === 0 ? (
          <div className="py-20 text-center text-gray-400">Nenhuma oração encontrada nesta categoria.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredPrayers.map((prayer) => (
              <div
                key={prayer.id}
                className="group rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm transition-all hover:border-stone-400 hover:shadow-lg dark:border-stone-800 dark:bg-bible-darkPaper dark:hover:border-stone-500"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">{prayer.title}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={(event) => { event.stopPropagation(); handlePlayAudio(prayer.id); }}
                      className="rounded-full bg-stone-50 p-2 text-stone-700 transition-colors hover:bg-stone-100 dark:bg-stone-800 dark:text-stone-300"
                    >
                      {isPlaying && playingPrayerId === prayer.id ? <StopCircle size={16} /> : <Volume2 size={16} />}
                    </button>
                    <div className="rounded-full bg-gray-100 p-2 text-gray-400 dark:bg-gray-800">
                      {prayer.churchId ? <Church size={16} /> : <Globe size={16} />}
                    </div>
                  </div>
                </div>
                <p className="mb-4 line-clamp-3 text-sm italic text-gray-600 dark:text-gray-300">
                  "<SmartText text={prayer.content} enabled={true} />"
                </p>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                  <span>{prayer.authorName}</span>
                  <button
                    className="inline-flex items-center gap-1 text-stone-700 hover:underline dark:text-stone-300"
                    onClick={() => { setGeneratedPrayer({ title: prayer.title, content: prayer.content }); window.scrollTo(0, 0); }}
                  >
                    Ler Completa <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidedPrayersPage;

