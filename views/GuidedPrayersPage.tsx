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
    <div
      data-testid="guided-prayers-page"
      className="h-full overflow-y-auto bg-[#f4efe6] p-4 text-[#4a382a] dark:bg-[#191817] dark:text-[#e7e0d4] md:p-8"
    >
      <SEO title="Orações" name="Culto+" image="/brand/culto-plus-logo.png" />
      <div className="mx-auto max-w-6xl space-y-8 pb-24">
        <section
          data-testid="prayer-of-the-day"
          className="relative overflow-hidden rounded-[2rem] border border-[#c9a45c]/45 bg-[linear-gradient(118deg,_#24170f_0%,_#49301d_54%,_#775022_100%)] p-6 text-[#f4ecdf] shadow-[0_24px_60px_rgba(72,42,20,0.22)] md:p-8 dark:border-[#c9a45c]/30 dark:bg-[linear-gradient(118deg,_#171310_0%,_#2b2119_55%,_#46301b_100%)]"
        >
          <div className="pointer-events-none absolute right-[-80px] top-[-120px] select-none font-serif text-[220px] font-medium leading-none text-white/5">
            OR
          </div>
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-xl border border-[#e7c77f]/30 bg-[#fff8e8]/10 px-3 py-2 text-[#efd18b] backdrop-blur-sm">
                <HandHeart size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Módulo Orações</span>
              </div>
              <h1 className="font-serif text-3xl font-semibold leading-tight text-[#fff8ec] md:text-5xl">
                Oração do Dia
              </h1>
              <h2 className="mt-4 text-xl font-bold text-[#f0d9aa]">
                {dailyPrayer.title}
              </h2>
              <p className="mt-4 whitespace-pre-wrap font-serif text-lg italic leading-relaxed text-[#e7e0d4] [&_.smart-text-content_span]:!text-inherit">
                "<SmartText text={dailyPrayer.content} enabled={true} />"
              </p>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[#d7b56d]">
                {dailyPrayer.authorName}
              </p>
            </div>
            <button
              onClick={() => handlePlayAudio(dailyPrayer.id)}
              aria-label={isPlaying && playingPrayerId === dailyPrayer.id ? 'Pausar oração do dia' : 'Ouvir oração do dia'}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#efd18b]/45 bg-[#fff8e8] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#5f3518] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#f3e3c4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efd18b]"
            >
              {isPlaying && playingPrayerId === dailyPrayer.id ? <StopCircle size={16} /> : <Volume2 size={16} />}
              Ouvir
            </button>
          </div>
        </section>

        <div
          data-testid="personal-prayer-generator"
          className="rounded-[2rem] border border-[#c9a45c]/35 bg-[#fffdf8] p-6 shadow-[0_16px_42px_rgba(67,55,43,0.08)] dark:border-[#a88c61]/22 dark:bg-[#23211f]"
        >
          <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold text-[#3a2416] dark:text-[#fff7e8]">
            <Sparkles size={20} className="text-[#a8752d]" /> Gerar Oração Personalizada
          </h2>

          {!generatedPrayer ? (
            <div className="flex flex-col gap-2 md:flex-row">
              <input
                type="text"
                value={aiTopic}
                onChange={(event) => setAiTopic(event.target.value)}
                placeholder="Pelo que você quer orar? Ex: entrevista de emprego"
                className="flex-1 rounded-2xl border border-[#d9c59d] bg-[#faf6ee] p-4 text-[#4a382a] outline-none placeholder:text-[#948578] focus:border-[#9a682e] focus:ring-2 focus:ring-[#b58132]/15 dark:border-[#a88c61]/25 dark:bg-[#1d1b19] dark:text-[#e7e0d4] dark:placeholder:text-[#8e8175]"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !aiTopic}
                aria-label="Gerar oração personalizada"
                className="min-h-11 rounded-2xl bg-[#74451f] px-6 font-bold text-[#fff7e7] transition-colors hover:bg-[#5f3518] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a682e] disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Plus />}
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in rounded-3xl border border-[#c9a45c]/35 bg-[#faf1df] p-6 dark:border-[#a88c61]/25 dark:bg-[#2a2825]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <h3 className="font-serif text-2xl font-bold text-stone-950 dark:text-stone-100">
                  {generatedPrayer.title}
                </h3>
                <button
                  onClick={() => handlePlayAudio('generated')}
                  aria-label={isPlaying && playingPrayerId === 'generated' ? 'Pausar oração personalizada' : 'Ouvir oração personalizada'}
                  className="rounded-full bg-[#fffdf8] p-3 text-[#8a5a25] transition-colors hover:bg-[#f3e3c4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a682e] dark:bg-[#3a342e] dark:text-[#e7c77f]"
                >
                  {isPlaying && playingPrayerId === 'generated' ? <StopCircle size={20} /> : <Volume2 size={20} />}
                </button>
              </div>
              <p className="mb-6 whitespace-pre-wrap font-serif text-lg italic leading-relaxed text-[#554b42] dark:text-[#e7e0d4] [&_.smart-text-content_span]:!text-inherit">
                "<SmartText text={generatedPrayer.content} enabled={true} />"
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { setGeneratedPrayer(null); setAiTopic(''); stopAudio(true); }}
                  className="text-sm font-bold text-[#76695d] transition-colors hover:text-[#74451f] dark:text-[#b9ab9d] dark:hover:text-[#e7c77f]"
                >
                  Nova Oração
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedPrayer.content)}
                  className="flex items-center gap-1 text-sm font-bold text-[#74451f] transition-colors hover:text-[#5f3518] dark:text-[#e7c77f]"
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
            aria-pressed={activeCat === 'all'}
            className={`min-h-11 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a682e] ${activeCat === 'all' ? 'bg-[#74451f] text-[#fff7e7] shadow-md' : 'border border-[#d9c59d] bg-[#fffdf8] text-[#756658] hover:border-[#b58132] dark:border-[#a88c61]/22 dark:bg-[#23211f] dark:text-[#cbbdad]'}`}
          >
            Tudo
          </button>
          {PRAYER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              aria-pressed={activeCat === cat.id}
              className={`min-h-11 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a682e] ${activeCat === cat.id ? 'bg-[#74451f] text-[#fff7e7] shadow-md' : 'border border-[#d9c59d] bg-[#fffdf8] text-[#756658] hover:border-[#b58132] dark:border-[#a88c61]/22 dark:bg-[#23211f] dark:text-[#cbbdad]'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#8a5a25] dark:text-[#e7c77f]" size={40} />
          </div>
        ) : filteredPrayers.length === 0 ? (
          <div className="py-20 text-center text-gray-400">Nenhuma oração encontrada nesta categoria.</div>
        ) : (
          <div data-testid="guided-prayers-grid" className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredPrayers.map((prayer) => (
              <div
                key={prayer.id}
                className="group rounded-[2rem] border border-[#d9c59d]/75 bg-[#fffdf8] p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#b58132] hover:shadow-[0_18px_42px_rgba(67,55,43,0.12)] dark:border-[#a88c61]/20 dark:bg-[#23211f] dark:hover:border-[#c9a45c]/45"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">{prayer.title}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={(event) => { event.stopPropagation(); handlePlayAudio(prayer.id); }}
                      aria-label={isPlaying && playingPrayerId === prayer.id ? `Pausar ${prayer.title}` : `Ouvir ${prayer.title}`}
                      className="rounded-full bg-[#f3e3c4] p-2 text-[#74451f] transition-colors hover:bg-[#ead3aa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a682e] dark:bg-[#c9a45c]/10 dark:text-[#e7c77f]"
                    >
                      {isPlaying && playingPrayerId === prayer.id ? <StopCircle size={16} /> : <Volume2 size={16} />}
                    </button>
                    <div className="rounded-full bg-[#eee7dc] p-2 text-[#8a7c6e] dark:bg-white/5 dark:text-[#9f9183]">
                      {prayer.churchId ? <Church size={16} /> : <Globe size={16} />}
                    </div>
                  </div>
                </div>
                <p className="mb-4 line-clamp-3 font-serif text-sm italic leading-relaxed text-[#685b50] dark:text-[#d8cfc5] [&_.smart-text-content_span]:!text-inherit">
                  "<SmartText text={prayer.content} enabled={true} />"
                </p>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                  <span>{prayer.authorName}</span>
                  <button
                    className="inline-flex min-h-11 items-center gap-1 text-[#74451f] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a682e] dark:text-[#e7c77f]"
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

