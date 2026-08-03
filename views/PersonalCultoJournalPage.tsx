"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, CalendarDays, Check, Heart, Loader2, Music2, NotebookPen, Plus, Save, Search, Sparkles, Trash2 } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { bibleService } from '../services/bibleService';
import { personalServiceJournalService } from '../services/personalServiceJournalService';
import {
  ChurchServiceType,
  PersonalServiceDecision,
  PersonalServiceFeeling,
  PersonalServiceJournal,
  PersonalServicePrayer,
  PersonalServiceSong,
  PersonalServiceVerse,
} from '../types';

type PersonalCultoJournalPageProps = {
  journalId?: string;
};

const SERVICE_TYPES: { value: ChurchServiceType; label: string }[] = [
  { value: 'sunday', label: 'Domingo' },
  { value: 'youth', label: 'Jovens' },
  { value: 'cell', label: 'Celula' },
  { value: 'vigil', label: 'Vigilia' },
  { value: 'conference', label: 'Conferencia' },
  { value: 'other', label: 'Outro' },
];

const FEELINGS = ['Paz', 'Gratidao', 'Quebrantado', 'Confrontado', 'Esperancoso', 'Confuso', 'Alegre', 'Encorajado', 'Cansado'];

const todayDate = () => new Date().toISOString().slice(0, 10);
const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const toDateTime = (date: string, time: string) => time ? `${date}T${time}:00` : null;
const getTimePart = (value?: string | null) => value ? value.slice(11, 16) : '';

const defaultSong = (sortOrder = 0): PersonalServiceSong => ({
  id: makeId('song'),
  title: '',
  moment: 'worship',
  reflection: '',
  sortOrder,
});

const defaultPrayer = (): PersonalServicePrayer => ({
  id: makeId('prayer'),
  content: '',
  reason: '',
  people: '',
  remindMe: false,
  answer: '',
  createdAt: new Date().toISOString(),
});

const defaultDecision = (): PersonalServiceDecision => ({
  id: makeId('decision'),
  content: '',
  action: '',
  personToPrayFor: '',
  memoryVerse: '',
  createdAt: new Date().toISOString(),
});

const PersonalCultoJournalPage: React.FC<PersonalCultoJournalPageProps> = ({ journalId }) => {
  const router = useRouter();
  const { currentUser, userProfile, showNotification } = useAuth();
  const { settings } = useSettings();
  const userId = currentUser?.uid ?? currentUser?.id;
  const isEditing = Boolean(journalId);

  const [loading, setLoading] = useState(Boolean(journalId));
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('Culto de hoje');
  const [churchName, setChurchName] = useState(userProfile?.churchData?.churchName ?? '');
  const [churchId, setChurchId] = useState<string | null>(userProfile?.churchData?.churchId ?? null);
  const [theme, setTheme] = useState('');
  const [preacherName, setPreacherName] = useState('');
  const [serviceType, setServiceType] = useState<ChurchServiceType>('sunday');
  const [serviceDate, setServiceDate] = useState(todayDate());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [songs, setSongs] = useState<PersonalServiceSong[]>([defaultSong()]);
  const [verses, setVerses] = useState<PersonalServiceVerse[]>([]);
  const [verseQuery, setVerseQuery] = useState('');
  const [searchingVerse, setSearchingVerse] = useState(false);
  const [messageNotes, setMessageNotes] = useState('');
  const [prayers, setPrayers] = useState<PersonalServicePrayer[]>([defaultPrayer()]);
  const [feelings, setFeelings] = useState<PersonalServiceFeeling[]>([]);
  const [feelingReason, setFeelingReason] = useState('');
  const [feelingResponse, setFeelingResponse] = useState('');
  const [decisions, setDecisions] = useState<PersonalServiceDecision[]>([defaultDecision()]);
  const [tagsText, setTagsText] = useState('');

  useEffect(() => {
    if (!userId || !journalId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const journal = await personalServiceJournalService.getJournalById(journalId, userId);
        if (!active || !journal) return;
        hydrate(journal);
      } catch (error: any) {
        showNotification(error?.message || 'Nao foi possivel carregar o registro.', 'error');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [journalId, showNotification, userId]);

  useEffect(() => {
    if (!userId || isEditing || loading) return;
    const draft = personalServiceJournalService.getDraft(userId);
    if (!draft) return;
    if (draft.title) setTitle(draft.title);
    if (draft.churchName) setChurchName(draft.churchName);
    if (draft.churchId !== undefined) setChurchId(draft.churchId ?? null);
    if (draft.theme) setTheme(draft.theme);
    if (draft.preacherName) setPreacherName(draft.preacherName);
    if (draft.serviceType) setServiceType(draft.serviceType);
    if (draft.serviceDate) setServiceDate(draft.serviceDate);
    if (draft.startsAt) setStartTime(getTimePart(draft.startsAt));
    if (draft.endsAt) setEndTime(getTimePart(draft.endsAt));
    if (draft.songs?.length) setSongs(draft.songs);
    if (draft.verses?.length) setVerses(draft.verses);
    if (draft.messageNotes) setMessageNotes(draft.messageNotes);
    if (draft.prayers?.length) setPrayers(draft.prayers);
    if (draft.feelings?.length) setFeelings(draft.feelings);
    if (draft.decisions?.length) setDecisions(draft.decisions);
    if (draft.tags?.length) setTagsText(draft.tags.join(', '));
  }, [isEditing, loading, userId]);

  const tags = useMemo(() => tagsText.split(',').map((tag) => tag.trim()).filter(Boolean), [tagsText]);

  const buildInput = () => ({
    userId: userId || '',
    churchId,
    churchName: churchName.trim() || 'Igreja nao informada',
    title: title.trim() || 'Culto registrado',
    theme: theme.trim() || undefined,
    preacherName: preacherName.trim() || undefined,
    serviceType,
    serviceDate,
    startsAt: toDateTime(serviceDate, startTime),
    endsAt: toDateTime(serviceDate, endTime),
    songs: songs.filter((song) => song.title.trim()).map((song, index) => ({ ...song, sortOrder: index })),
    verses,
    messageNotes,
    prayers: prayers.filter((prayer) => prayer.content.trim()),
    feelings,
    decisions: decisions.filter((decision) => decision.content.trim() || decision.action?.trim()),
    tags,
  });

  useEffect(() => {
    if (!userId || isEditing || loading) return;
    const timeout = window.setTimeout(() => {
      personalServiceJournalService.autosaveDraft(userId, buildInput());
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [title, churchName, churchId, theme, preacherName, serviceType, serviceDate, startTime, endTime, songs, verses, messageNotes, prayers, feelings, decisions, tagsText, userId, isEditing, loading]);

  const hydrate = (journal: PersonalServiceJournal) => {
    setTitle(journal.title);
    setChurchName(journal.churchName);
    setChurchId(journal.churchId ?? null);
    setTheme(journal.theme ?? '');
    setPreacherName(journal.preacherName ?? '');
    setServiceType(journal.serviceType ?? 'sunday');
    setServiceDate(journal.serviceDate);
    setStartTime(getTimePart(journal.startsAt));
    setEndTime(getTimePart(journal.endsAt));
    setSongs(journal.songs.length ? journal.songs : [defaultSong()]);
    setVerses(journal.verses);
    setMessageNotes(journal.messageNotes);
    setPrayers(journal.prayers.length ? journal.prayers : [defaultPrayer()]);
    setFeelings(journal.feelings);
    setDecisions(journal.decisions.length ? journal.decisions : [defaultDecision()]);
    setTagsText(journal.tags.join(', '));
  };

  const searchVerse = async () => {
    const query = verseQuery.trim();
    if (!query) return;
    setSearchingVerse(true);
    try {
      const result = await bibleService.getTextByReference(query, settings.bibleVersion || 'ara');
      if (!result) {
        showNotification('Nao encontrei essa referencia.', 'warning');
        return;
      }
      setVerses((items) => [{
        id: makeId('verse'),
        reference: result.formattedRef,
        text: result.text,
        note: '',
        source: 'pastor',
        createdAt: new Date().toISOString(),
      }, ...items]);
      setVerseQuery('');
    } catch {
      showNotification('Nao foi possivel buscar o versiculo.', 'error');
    } finally {
      setSearchingVerse(false);
    }
  };

  const addFeeling = (label: string) => {
    setFeelings((items) => [{
      id: makeId('feeling'),
      label,
      intensity: 3,
      reason: feelingReason,
      response: feelingResponse,
      createdAt: new Date().toISOString(),
    }, ...items]);
    setFeelingReason('');
    setFeelingResponse('');
  };

  const save = async () => {
    if (!userId) return;
    if (!title.trim() || !churchName.trim()) {
      showNotification('Informe pelo menos titulo e igreja.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const input = buildInput();
      const saved = isEditing && journalId
        ? await personalServiceJournalService.updateJournal(journalId, userId, input)
        : await personalServiceJournalService.createJournal(input);
      if (!isEditing) personalServiceJournalService.clearDraft(userId);
      showNotification('Registro de culto salvo.', 'success');
      router.push(`/meus-cultos/${saved.id}`);
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[var(--module-soft)] dark:bg-black">
        <Loader2 className="module-accent-text animate-spin" size={34} />
      </div>
    );
  }

  return (
    <div data-testid="personal-culto-journal" className="min-h-full bg-[var(--module-soft)] text-gray-900 dark:bg-black dark:text-white">
      <SEO title={isEditing ? 'Editar Meu Culto' : 'Novo Meu Culto'} />
      <header className="sticky top-0 z-30 border-b border-[var(--module-border)] bg-white/90 px-4 py-3 backdrop-blur dark:bg-[#111113]/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Link href="/meus-cultos" className="module-focus module-icon inline-flex h-11 w-11 items-center justify-center rounded-xl shadow-sm" aria-label="Voltar para Meus Cultos">
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="module-accent-text text-[10px] font-bold uppercase tracking-[0.25em]">Meu Culto</p>
            <h1 className="truncate text-lg font-medium">{isEditing ? 'Editar registro' : 'Registrar culto'}</h1>
          </div>
          <button onClick={save} disabled={saving} className="module-focus module-gradient inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold text-white shadow-lg disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          <div className="rounded-[2rem] border border-cyan-100 bg-white p-5 shadow-sm dark:border-cyan-950/40 dark:bg-bible-darkPaper">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="text-cyan-700 dark:text-cyan-300" size={20} />
              <h2 className="text-lg font-medium">Contexto do culto</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titulo do registro" className="rounded-2xl border border-cyan-100 bg-cyan-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-300 dark:border-cyan-950/40 dark:bg-cyan-950/10" />
              <input value={churchName} onChange={(event) => { setChurchName(event.target.value); setChurchId(null); }} placeholder="Nome da igreja" className="rounded-2xl border border-cyan-100 bg-cyan-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-300 dark:border-cyan-950/40 dark:bg-cyan-950/10" />
              <input value={theme} onChange={(event) => setTheme(event.target.value)} placeholder="Tema percebido da mensagem" className="rounded-2xl border border-cyan-100 bg-cyan-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-300 dark:border-cyan-950/40 dark:bg-cyan-950/10 md:col-span-2" />
              <input value={preacherName} onChange={(event) => setPreacherName(event.target.value)} placeholder="Pastor/pregador" className="rounded-2xl border border-cyan-100 bg-cyan-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-300 dark:border-cyan-950/40 dark:bg-cyan-950/10" />
              <select value={serviceType} onChange={(event) => setServiceType(event.target.value as ChurchServiceType)} className="rounded-2xl border border-cyan-100 bg-cyan-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-300 dark:border-cyan-950/40 dark:bg-cyan-950/10">
                {SERVICE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
              <input type="date" value={serviceDate} onChange={(event) => setServiceDate(event.target.value)} className="rounded-2xl border border-cyan-100 bg-cyan-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-300 dark:border-cyan-950/40 dark:bg-cyan-950/10" />
              <div className="grid grid-cols-2 gap-3">
                <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="rounded-2xl border border-cyan-100 bg-cyan-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-300 dark:border-cyan-950/40 dark:bg-cyan-950/10" />
                <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="rounded-2xl border border-cyan-100 bg-cyan-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-300 dark:border-cyan-950/40 dark:bg-cyan-950/10" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-cyan-100 bg-white p-5 shadow-sm dark:border-cyan-950/40 dark:bg-bible-darkPaper">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-medium"><Music2 className="text-cyan-700 dark:text-cyan-300" size={20} /> Musicas</h2>
              <button onClick={() => setSongs((items) => [...items, defaultSong(items.length)])} className="inline-flex min-h-9 items-center gap-2 rounded-2xl bg-cyan-50 px-3 text-[10px] font-medium uppercase tracking-widest text-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-200">
                <Plus size={13} />
                Musica
              </button>
            </div>
            <div className="space-y-3">
              {songs.map((song, index) => (
                <div key={song.id} className="grid gap-2 rounded-2xl border border-cyan-50 bg-cyan-50/30 p-3 dark:border-cyan-950/30 dark:bg-cyan-950/10 md:grid-cols-[1fr_150px_auto]">
                  <input value={song.title} onChange={(event) => setSongs((items) => items.map((item) => item.id === song.id ? { ...item, title: event.target.value } : item))} placeholder={`Musica ${index + 1}`} className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm outline-none dark:border-cyan-950/40 dark:bg-bible-darkPaper" />
                  <select value={song.moment ?? 'worship'} onChange={(event) => setSongs((items) => items.map((item) => item.id === song.id ? { ...item, moment: event.target.value as PersonalServiceSong['moment'] } : item))} className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm outline-none dark:border-cyan-950/40 dark:bg-bible-darkPaper">
                    <option value="opening">Abertura</option>
                    <option value="worship">Louvor</option>
                    <option value="response">Resposta</option>
                    <option value="closing">Encerramento</option>
                    <option value="other">Outro</option>
                  </select>
                  <button onClick={() => setSongs((items) => items.filter((item) => item.id !== song.id))} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-3 text-rose-500 dark:bg-bible-darkPaper" aria-label="Remover musica">
                    <Trash2 size={15} />
                  </button>
                  <textarea value={song.reflection ?? ''} onChange={(event) => setSongs((items) => items.map((item) => item.id === song.id ? { ...item, reflection: event.target.value } : item))} placeholder="O que essa musica despertou em mim?" className="min-h-16 rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm outline-none dark:border-cyan-950/40 dark:bg-bible-darkPaper md:col-span-3" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-cyan-100 bg-white p-5 shadow-sm dark:border-cyan-950/40 dark:bg-bible-darkPaper">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-medium"><BookOpen className="text-cyan-700 dark:text-cyan-300" size={20} /> Versiculos</h2>
            <div className="flex gap-2">
              <input value={verseQuery} onChange={(event) => setVerseQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') searchVerse(); }} placeholder="Ex.: Joao 3:16" className="min-w-0 flex-1 rounded-2xl border border-cyan-100 bg-cyan-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-300 dark:border-cyan-950/40 dark:bg-cyan-950/10" />
              <button onClick={searchVerse} disabled={searchingVerse || !verseQuery.trim()} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-cyan-800 px-4 text-white disabled:opacity-60" aria-label="Pesquisar versiculo">
                {searchingVerse ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {verses.map((verse) => (
                <article key={verse.id} className="rounded-2xl border border-cyan-50 bg-cyan-50/30 p-4 dark:border-cyan-950/30 dark:bg-cyan-950/10">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-cyan-900 dark:text-cyan-100">{verse.reference}</p>
                    <button onClick={() => setVerses((items) => items.filter((item) => item.id !== verse.id))} className="text-rose-500" aria-label="Remover versiculo"><Trash2 size={14} /></button>
                  </div>
                  {verse.text && <p className="mt-2 font-serif text-sm italic leading-relaxed text-gray-600 dark:text-gray-300">"{verse.text}"</p>}
                  <textarea value={verse.note ?? ''} onChange={(event) => setVerses((items) => items.map((item) => item.id === verse.id ? { ...item, note: event.target.value } : item))} placeholder="Por que esse texto foi importante?" className="mt-3 min-h-16 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm outline-none dark:border-cyan-950/40 dark:bg-bible-darkPaper" />
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-cyan-100 bg-white p-5 shadow-sm dark:border-cyan-950/40 dark:bg-bible-darkPaper">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-medium"><NotebookPen className="text-cyan-700 dark:text-cyan-300" size={20} /> Anotacoes da mensagem</h2>
            <textarea value={messageNotes} onChange={(event) => setMessageNotes(event.target.value)} placeholder="Ideia principal, frase que marcou, o que aprendi sobre Deus, o que preciso obedecer..." className="min-h-44 w-full resize-none rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-cyan-300 dark:border-cyan-950/40 dark:bg-cyan-950/10" />
            <input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="Tags privadas: fe, familia, gratidao..." className="mt-3 w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-300 dark:border-cyan-950/40 dark:bg-cyan-950/10" />
          </div>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-[2rem] border border-rose-100 bg-white p-5 shadow-sm dark:border-rose-950/40 dark:bg-bible-darkPaper">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-medium"><Heart className="text-rose-500" size={20} /> Oracao silenciosa</h2>
            {prayers.map((prayer) => (
              <div key={prayer.id} className="space-y-2">
                <textarea value={prayer.content} onChange={(event) => setPrayers((items) => items.map((item) => item.id === prayer.id ? { ...item, content: event.target.value } : item))} placeholder="Pedido que so voce vera..." className="min-h-28 w-full resize-none rounded-2xl border border-rose-100 bg-rose-50/40 p-4 text-sm outline-none focus:ring-2 focus:ring-rose-200 dark:border-rose-950/40 dark:bg-rose-950/10" />
                <input value={prayer.reason ?? ''} onChange={(event) => setPrayers((items) => items.map((item) => item.id === prayer.id ? { ...item, reason: event.target.value } : item))} placeholder="Motivo da oracao" className="w-full rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm outline-none dark:border-rose-950/40 dark:bg-bible-darkPaper" />
                <label className="flex items-center gap-2 text-xs text-gray-500">
                  <input type="checkbox" checked={prayer.remindMe} onChange={(event) => setPrayers((items) => items.map((item) => item.id === prayer.id ? { ...item, remindMe: event.target.checked } : item))} />
                  Quero lembrar de orar por isso
                </label>
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] border border-cyan-100 bg-white p-5 shadow-sm dark:border-cyan-950/40 dark:bg-bible-darkPaper">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-medium"><Sparkles className="text-cyan-700 dark:text-cyan-300" size={20} /> Sentimento</h2>
            <div className="grid grid-cols-2 gap-2">
              {FEELINGS.map((feeling) => (
                <button key={feeling} onClick={() => addFeeling(feeling)} className="rounded-2xl bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-900 transition hover:bg-cyan-100 dark:bg-cyan-950/30 dark:text-cyan-100">
                  {feeling}
                </button>
              ))}
            </div>
            <textarea value={feelingReason} onChange={(event) => setFeelingReason(event.target.value)} placeholder="Por que me senti assim?" className="mt-3 min-h-20 w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 p-3 text-sm outline-none dark:border-cyan-950/40 dark:bg-cyan-950/10" />
            <textarea value={feelingResponse} onChange={(event) => setFeelingResponse(event.target.value)} placeholder="Como quero responder com sabedoria?" className="mt-2 min-h-20 w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 p-3 text-sm outline-none dark:border-cyan-950/40 dark:bg-cyan-950/10" />
            {feelings.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {feelings.map((feeling) => <span key={feeling.id} className="rounded-full bg-cyan-100 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-100">{feeling.label}</span>)}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-cyan-100 bg-white p-5 shadow-sm dark:border-cyan-950/40 dark:bg-bible-darkPaper">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-medium"><Check className="text-cyan-700 dark:text-cyan-300" size={20} /> Decisao e proximos passos</h2>
            {decisions.map((decision) => (
              <div key={decision.id} className="space-y-2">
                <textarea value={decision.content} onChange={(event) => setDecisions((items) => items.map((item) => item.id === decision.id ? { ...item, content: event.target.value } : item))} placeholder="Decisao pessoal..." className="min-h-24 w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 p-3 text-sm outline-none dark:border-cyan-950/40 dark:bg-cyan-950/10" />
                <input value={decision.action ?? ''} onChange={(event) => setDecisions((items) => items.map((item) => item.id === decision.id ? { ...item, action: event.target.value } : item))} placeholder="Uma acao nesta semana" className="w-full rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm outline-none dark:border-cyan-950/40 dark:bg-bible-darkPaper" />
                <input value={decision.personToPrayFor ?? ''} onChange={(event) => setDecisions((items) => items.map((item) => item.id === decision.id ? { ...item, personToPrayFor: event.target.value } : item))} placeholder="Uma pessoa por quem vou orar" className="w-full rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm outline-none dark:border-cyan-950/40 dark:bg-bible-darkPaper" />
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default PersonalCultoJournalPage;
