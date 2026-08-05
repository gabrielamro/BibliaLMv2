"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Copy,
  ExternalLink,
  Sparkles,
  Star,
  Target,
  X,
  Zap,
} from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { addUnifiedFavorite } from '../services/unifiedFavoritesService';
import toast from 'react-hot-toast';

export interface TrackVerseStudy {
  reference: string;
  text: string;
  studyNote: string;
}

export interface TrackStepStudy {
  stepNumber: number;
  title: string;
  studyPurpose: string;
  keyInsight: string;
  verses: TrackVerseStudy[];
  practicalAction: string;
}

export interface DetailedTrack {
  id: string;
  title: string;
  subtitle: string;
  durationDays: number;
  description: string;
  category: string;
  authorType: 'pastor' | 'platform' | 'ai';
  authorName: string;
  coverGradient: string;
  steps: TrackStepStudy[];
}

export const DETAILED_TRACKS: DetailedTrack[] = [
  {
    id: 'vencendo-ansiedade',
    title: 'Vencendo a Ansiedade',
    subtitle: 'A paz que excede todo o entendimento',
    durationDays: 7,
    description: 'Uma série de estudos bíblicos focada em versículos de entrega, confiança e descanso no cuidado de Deus.',
    category: 'Cura Emocional',
    authorType: 'pastor',
    authorName: 'Pr. Gabriel Amaro',
    coverGradient: 'from-amber-600 via-yellow-600 to-amber-700',
    steps: [
      {
        stepNumber: 1,
        title: 'Entregando o Fardo em Oração',
        studyPurpose: 'Estudar como a oração de petição com ações de graças desarma a ansiedade no espírito.',
        keyInsight: 'A paz de Deus não é ausência de problemas, mas a presença constante da proteção do Pai guardando a mente.',
        practicalAction: 'Escreva em um papel 3 preocupações de hoje e faça uma oração entregando cada uma delas nominalmente a Deus.',
        verses: [
          {
            reference: 'Filipenses 4:6-7',
            text: 'Não estejais ansiosos por coisa alguma; antes as vossas petições sejam em tudo conhecidas diante de Deus pela oração e súplica, com ação de graças. E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus.',
            studyNote: 'Observe a estrutura: Oração + Súplica + Ação de Graças = Guarda do coração.',
          },
          {
            reference: '1 Pedro 5:7',
            text: 'Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.',
            studyNote: 'O verbo "lançar" no grego indica um ato definitivo e intencional de lançar fora um fardo pesado.',
          },
          {
            reference: 'Mateus 6:33-34',
            text: 'Buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas. Não vos inquieteis, pois, pelo dia de amanhã, porque o dia de amanhã cuidará de si mesmo.',
            studyNote: 'A ansiedade tenta antecipar o amanhã; a fé foca no propósito de hoje.',
          },
        ],
      },
      {
        stepNumber: 2,
        title: 'Fortalecidos no Medo',
        studyPurpose: 'Descobrir as promessas de socorro presente nos momentos de incerteza.',
        keyInsight: 'Deus não nos promete isenção de tempestades, mas garante Sua mão direita nos sustentando.',
        practicalAction: 'Memore Isaías 41:10 e repita-o em voz alta no primeiro momento em que sentir insegurança.',
        verses: [
          {
            reference: 'Isaías 41:10',
            text: 'Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.',
            studyNote: 'Quatro certezas: Sou contigo, Sou teu Deus, Te fortaleço, Te sustento.',
          },
          {
            reference: 'Salmos 56:3',
            text: 'Em qualquer tempo em que eu temer, confiarei em ti.',
            studyNote: 'O temor pode surgir como emoção, mas a confiança é uma decisão da vontade.',
          },
        ],
      },
      {
        stepNumber: 3,
        title: 'Renovação dos Pensamentos',
        studyPurpose: 'Aprender a filtrar os pensamentos alinhando-os à verdade das Escrituras.',
        keyInsight: 'O que alimentamos na mente determina o estado do nosso coração.',
        practicalAction: 'Substitua um pensamento de dúvida por uma promessa lida neste estudo.',
        verses: [
          {
            reference: 'Salmos 94:19',
            text: 'Na multidão dos meus pensamentos dentro de mim, as tuas consolações recreiam a minha alma.',
            studyNote: 'Quando os pensamentos se multiplicam, a consolação da Palavra restaura a alma.',
          },
          {
            reference: 'Romanos 12:2',
            text: 'E não sede conformados com este mundo, mas sede transformados pela renovação do vosso entendimento...',
            studyNote: 'A transformação interior ocorre à medida que a Palavra renova nossa forma de pensar.',
          },
        ],
      },
    ],
  },
  {
    id: 'edificando-lar',
    title: 'Edificando o Lar',
    subtitle: 'Princípios bíblicos para a família e o casamento',
    durationDays: 14,
    description: 'Estudo guiado de versículos essenciais para cultivar amor, paciência, perdão e unidade na vida familiar.',
    category: 'Família',
    authorType: 'pastor',
    authorName: 'Pastoral Culto+',
    coverGradient: 'from-emerald-700 via-teal-700 to-emerald-800',
    steps: [
      {
        stepNumber: 1,
        title: 'A Aliança no Lar',
        studyPurpose: 'Compreender o fundamento espiritual de uma família consagrada ao Senhor.',
        keyInsight: 'Um lar forte é construído quando a Palavra de Deus é a autoridade central nas decisões da casa.',
        practicalAction: 'Reúna sua família ou faça uma oração abençoando o seu lar pela manhã.',
        verses: [
          {
            reference: 'Josué 24:15',
            text: 'Eu e a minha casa serviremos ao Senhor.',
            studyNote: 'Uma declaração intencional de liderança e compromisso espiritual.',
          },
          {
            reference: 'Colossenses 3:12-14',
            text: 'Revesti-vos, pois, como eleitos de Deus, santos e amados, de entranhas de misericórdia, de benignidade, humildade, mansidão, longanimidade; suportando-vos uns aos outros, e perdoando-vos uns aos outros...',
            studyNote: 'As virtudes do lar cristão são como vestes diárias que devemos escolher vestir.',
          },
        ],
      },
    ],
  },
  {
    id: 'cura-perdao',
    title: 'A Cura do Perdão',
    subtitle: 'Libertação de feridas e restauração',
    durationDays: 10,
    description: 'Uma série de versículos e estudos sobre a graça de perdoar assim como fomos perdoados por Cristo.',
    category: 'Restauração',
    authorType: 'pastor',
    authorName: 'Cuidado Pastoral',
    coverGradient: 'from-purple-700 via-indigo-700 to-purple-800',
    steps: [
      {
        stepNumber: 1,
        title: 'Perdoados para Perdoar',
        studyPurpose: 'Examinar a raiz do perdão cristão a partir da Cruz.',
        keyInsight: 'O perdão não valida a dor recebida, mas liberta o coração para viver na graça de Deus.',
        practicalAction: 'Escreva uma oração em silêncio abençoando a vida de quem feriu você.',
        verses: [
          {
            reference: 'Efésios 4:32',
            text: 'Antes sede uns para com os outros benignos, misericordiosos, perdoando-vos uns aos outros, como também Deus vos perdoou em Cristo.',
            studyNote: 'O padrão do nosso perdão humano é o perdão ilimitado que recebemos de Cristo.',
          },
        ],
      },
    ],
  },
];

export default function TracksPage() {
  const { currentUser } = useAuth();
  const userId = currentUser ? (currentUser.uid ?? currentUser.id) : null;

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

  const activeTrack = DETAILED_TRACKS.find((track) => track.id === selectedTrackId) ?? null;
  const activeStep = activeTrack?.steps[currentStepIndex] ?? null;
  const activeStepKey = activeTrack && activeStep ? `${activeTrack.id}:${activeStep.stepNumber}` : '';
  const isStepCompleted = activeStepKey ? completedSteps.includes(activeStepKey) : false;

  useEffect(() => {
    if (!selectedTrackId) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleDialogKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSelectedTrackId(null);
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleDialogKeyboard);

    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleDialogKeyboard);
      window.requestAnimationFrame(() => triggerButtonRef.current?.focus());
    };
  }, [selectedTrackId]);

  const openTrack = (trackId: string, trigger: HTMLButtonElement) => {
    triggerButtonRef.current = trigger;
    setCurrentStepIndex(0);
    setSelectedTrackId(trackId);
  };

  const closeTrack = () => setSelectedTrackId(null);

  const handleCopyVerse = (text: string, ref: string) => {
    void navigator.clipboard.writeText(`"${text}" (${ref})`);
    toast.success('Versículo copiado!');
  };

  const handleFavoriteVerse = async (text: string, ref: string) => {
    if (!activeTrack) return;

    if (!userId) {
      toast.error('Faça login para favoritar este versículo.');
      return;
    }
    const result = await addUnifiedFavorite(userId, 'verse', `${activeTrack.id}-${ref}`, ref, {
      reference: ref,
      textSnippet: text,
      authorName: activeTrack.title,
    });
    if (result) {
      toast.success(`Versículo ${ref} salvo nos seus Favoritos!`);
    } else {
      toast.error('Erro ao salvar favorito.');
    }
  };

  const toggleStepCompleted = () => {
    if (!activeStepKey) return;

    if (isStepCompleted) {
      setCompletedSteps((previousSteps) => previousSteps.filter((stepKey) => stepKey !== activeStepKey));
      toast.success('Passo marcado como pendente.');
    } else {
      setCompletedSteps((previousSteps) => [...previousSteps, activeStepKey]);
      toast.success('Passo de estudo concluído! Parabéns!');
    }
  };

  return (
    <div data-module-theme="bible" className="cultoplus-page-content relative min-h-screen bg-[radial-gradient(ellipse_at_top_right,_#fffdf8_0%,_#f7efe1_45%,_#eee4d3_100%)] px-4 py-6 text-[#302316] sm:px-6 lg:px-8 dark:bg-[radial-gradient(ellipse_at_top_right,_#25221e_0%,_#1c1a17_48%,_#141311_100%)] dark:text-[#e7e1d8]">
      <SEO title="Trilhas de Estudo Bíblico" name="Culto+" image="/brand/culto-plus-logo.png" description="Séries guiadas de versículos e estudos bíblicos com propósitos de aprendizado e transformação." />

      <div className="mx-auto max-w-6xl space-y-6">
        <header className="relative overflow-hidden rounded-[28px] border border-[#e8dfd1] bg-[#fffdf7]/90 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#23201c]/90">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#edad2c]">
                <Compass size={16} aria-hidden="true" />
                <span>Módulo de Trilhas Bíblicas</span>
              </div>
              <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#302316] sm:text-3xl dark:text-[#fff7eb]">
                Séries de Estudo da Palavra
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#736353] dark:text-[#a89988]">
                Escolha uma trilha para abrir o primeiro passo. Avance no seu ritmo por leituras, reflexões e práticas guiadas pela Palavra.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="rounded-full bg-[#edad2c]/15 px-3 py-1.5 text-xs font-bold text-[#b97800] dark:text-[#f1bd56]">
                {DETAILED_TRACKS.length} Trilhas Disponíveis
              </span>
            </div>
          </div>
        </header>

        <section aria-labelledby="tracks-catalog-title">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#b97800] dark:text-[#f1bd56]">Catálogo</span>
              <h2 id="tracks-catalog-title" className="mt-1 font-serif text-xl font-bold text-[#302316] dark:text-[#fff7eb]">
                Escolha sua próxima jornada
              </h2>
            </div>
            <BookOpen className="hidden text-[#edad2c] sm:block" size={28} aria-hidden="true" />
          </div>

          <div data-testid="tracks-catalog" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {DETAILED_TRACKS.map((track) => (
              <button
                key={track.id}
                type="button"
                data-testid="track-card"
                aria-label={`Abrir trilha ${track.title}`}
                onClick={(event) => openTrack(track.id, event.currentTarget)}
                className="group flex min-h-[360px] w-full flex-col overflow-hidden rounded-[26px] border border-[#e8dfd1] bg-white/90 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#edad2c]/70 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#edad2c]/35 dark:border-white/10 dark:bg-[#23201c]/95"
              >
                <span className={`relative flex min-h-36 w-full flex-col justify-between overflow-hidden bg-gradient-to-br ${track.coverGradient} p-5 text-white`}>
                  <span className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" aria-hidden="true" />
                  <span className="relative flex items-start justify-between gap-3">
                    <span className="rounded-full bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] backdrop-blur">
                      {track.category}
                    </span>
                    <Sparkles size={20} className="text-white/80" aria-hidden="true" />
                  </span>
                  <span className="relative">
                    <span className="block font-serif text-2xl font-bold leading-tight">{track.title}</span>
                    <span className="mt-1 block text-xs font-medium text-white/85">{track.subtitle}</span>
                  </span>
                </span>

                <span className="flex flex-1 flex-col p-5">
                  <span className="text-sm leading-relaxed text-[#736353] dark:text-[#b9ab9b]">{track.description}</span>
                  <span className="mt-5 grid grid-cols-2 gap-2 text-xs">
                    <span className="rounded-xl bg-[#f8f1e6] px-3 py-2 text-[#5d4a37] dark:bg-white/5 dark:text-[#d9cabb]">
                      <strong className="block text-[#302316] dark:text-[#fff7eb]">
                        {track.steps.length} {track.steps.length === 1 ? 'passo' : 'passos'}
                      </strong>
                      Estudo guiado
                    </span>
                    <span className="rounded-xl bg-[#f8f1e6] px-3 py-2 text-[#5d4a37] dark:bg-white/5 dark:text-[#d9cabb]">
                      <strong className="block text-[#302316] dark:text-[#fff7eb]">{track.durationDays} dias</strong>
                      Ritmo sugerido
                    </span>
                  </span>
                  <span className="mt-auto flex items-center justify-between border-t border-[#eee4d5] pt-4 dark:border-white/10">
                    <span className="text-[11px] font-semibold text-[#736353] dark:text-[#a89988]">{track.authorName}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide text-[#b97800] dark:text-[#f1bd56]">
                      Iniciar <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {activeTrack && activeStep ? (
        <div
          className="fixed inset-0 z-[160] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeTrack();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="track-dialog-title"
            aria-describedby="track-dialog-description"
            data-testid="track-dialog"
            className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[28px] border border-[#eadfce] bg-[#fffaf2] shadow-2xl sm:max-h-[90dvh] sm:rounded-[28px] dark:border-white/10 dark:bg-[#1d1a17]"
          >
            <header className={`relative shrink-0 overflow-hidden bg-gradient-to-r ${activeTrack.coverGradient} px-5 py-5 text-white sm:px-7`}>
              <span className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10" aria-hidden="true" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/75">
                    {activeTrack.category} · {activeTrack.durationDays} dias
                  </span>
                  <h2 id="track-dialog-title" className="mt-1 font-serif text-2xl font-bold sm:text-3xl">{activeTrack.title}</h2>
                  <p id="track-dialog-description" className="mt-1 text-xs text-white/85 sm:text-sm">{activeTrack.subtitle}</p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  data-testid="track-close"
                  onClick={closeTrack}
                  aria-label="Fechar trilha"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/20 text-white transition hover:bg-black/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
                >
                  <X size={21} aria-hidden="true" />
                </button>
              </div>

              <div className="relative mt-5 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/20">
                  <div
                    className="h-full rounded-full bg-white transition-[width] duration-300"
                    style={{ width: `${((currentStepIndex + 1) / activeTrack.steps.length) * 100}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs font-bold">Passo {currentStepIndex + 1} de {activeTrack.steps.length}</span>
              </div>
            </header>

            <div data-testid="track-step-content" className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-7 sm:py-6">
              <div className="mx-auto max-w-3xl space-y-5">
                <section>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#b97800] dark:text-[#f1bd56]">Passo {activeStep.stepNumber}</span>
                  <h3 className="mt-1 font-serif text-2xl font-bold text-[#302316] dark:text-[#fff7eb]">{activeStep.title}</h3>
                </section>

                <section className="rounded-[22px] border border-[#eadfce] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#27231f]">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#b97800] dark:text-[#f1bd56]">
                    <Target size={16} aria-hidden="true" />
                    <span>Propósito do estudo</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-[#302316] dark:text-[#fff7eb]">{activeStep.studyPurpose}</p>
                  <div className="mt-4 rounded-2xl border border-[#edad2c]/30 bg-[#edad2c]/10 p-4 text-sm text-[#4a3928] dark:text-[#ebdccb]">
                    <strong className="block text-xs font-bold text-[#b97800] dark:text-[#f1bd56]">Insight-chave</strong>
                    <p className="mt-1 leading-relaxed">{activeStep.keyInsight}</p>
                  </div>
                </section>

                <section className="space-y-3" aria-labelledby="step-verses-title">
                  <div className="flex items-end justify-between gap-3">
                    <h4 id="step-verses-title" className="font-serif text-lg font-bold text-[#302316] dark:text-[#fff7eb]">Versículos para estudo</h4>
                    <span className="text-xs text-[#736353] dark:text-[#a89988]">{activeStep.verses.length} passagens</span>
                  </div>
                  {activeStep.verses.map((verse) => (
                    <article key={verse.reference} className="rounded-[22px] border border-[#eadfce] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#27231f]">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-[#edad2c]/15 px-3 py-1 font-serif text-xs font-bold text-[#a96800] dark:text-[#f1bd56]">{verse.reference}</span>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => handleCopyVerse(verse.text, verse.reference)} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ded5c7] bg-white text-[#5d4a37] transition hover:border-[#edad2c] hover:text-[#b97800] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#edad2c]/30 dark:border-white/10 dark:bg-[#312c27] dark:text-[#e5d8ca]" aria-label={`Copiar ${verse.reference}`}>
                            <Copy size={16} aria-hidden="true" />
                          </button>
                          <button type="button" onClick={() => void handleFavoriteVerse(verse.text, verse.reference)} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ded5c7] bg-white text-[#5d4a37] transition hover:border-[#edad2c] hover:text-[#b97800] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#edad2c]/30 dark:border-white/10 dark:bg-[#312c27] dark:text-[#e5d8ca]" aria-label={`Favoritar ${verse.reference}`}>
                            <Star size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <blockquote className="mt-4 font-serif text-base leading-relaxed text-[#302316] dark:text-[#fff7eb]">“{verse.text}”</blockquote>
                      <div className="mt-4 rounded-xl border border-[#eee4d5] bg-[#fffaf2] p-3 text-xs text-[#736353] dark:border-white/5 dark:bg-[#1a1816] dark:text-[#b9ab9b]">
                        <strong className="block text-[10px] font-bold uppercase text-[#b97800] dark:text-[#f1bd56]">Foco teológico</strong>
                        <p className="mt-1 leading-relaxed">{verse.studyNote}</p>
                      </div>
                    </article>
                  ))}
                </section>

                <section className="rounded-[22px] border border-[#eadfce] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#27231f]">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#b97800] dark:text-[#f1bd56]">
                    <Zap size={16} aria-hidden="true" />
                    <span>Desafio prático</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#302316] dark:text-[#fff7eb]">{activeStep.practicalAction}</p>
                  <div className="mt-5 flex flex-col gap-3 border-t border-[#eee4d5] pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                    <button
                      type="button"
                      onClick={toggleStepCompleted}
                      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#edad2c]/30 ${isStepCompleted ? 'bg-emerald-600 text-white' : 'bg-[#edad2c] text-white hover:bg-[#d99c22]'}`}
                    >
                      <CheckCircle2 size={16} aria-hidden="true" />
                      <span>{isStepCompleted ? 'Passo concluído' : 'Marcar como concluído'}</span>
                    </button>
                    <Link href="/diario-espiritual" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#ded5c7] bg-white px-5 text-xs font-bold text-[#302316] transition hover:border-[#edad2c] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#edad2c]/30 dark:border-white/10 dark:bg-[#312c27] dark:text-[#fff7eb]">
                      <span>Registrar no Diário</span>
                      <ExternalLink size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </section>
              </div>
            </div>

            <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-[#eadfce] bg-white/95 p-4 backdrop-blur sm:flex sm:items-center sm:justify-between sm:px-7 dark:border-white/10 dark:bg-[#24201c]/95">
              <button
                type="button"
                data-testid="track-previous-step"
                onClick={() => setCurrentStepIndex((previousIndex) => Math.max(0, previousIndex - 1))}
                disabled={currentStepIndex === 0}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#ded5c7] bg-white px-5 text-xs font-bold text-[#302316] transition hover:border-[#edad2c] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#edad2c]/30 dark:border-white/10 dark:bg-[#312c27] dark:text-[#fff7eb]"
              >
                <ChevronLeft size={17} aria-hidden="true" />
                <span>Anterior</span>
              </button>
              <span className="hidden text-center text-xs font-semibold text-[#736353] sm:block dark:text-[#a89988]">{activeStep.title}</span>
              <button
                type="button"
                data-testid="track-next-step"
                onClick={() => setCurrentStepIndex((previousIndex) => Math.min(activeTrack.steps.length - 1, previousIndex + 1))}
                disabled={currentStepIndex === activeTrack.steps.length - 1}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#edad2c] px-5 text-xs font-bold text-white transition hover:bg-[#d99c22] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#edad2c]/30"
              >
                <span>Próximo passo</span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
