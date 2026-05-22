import { supabase } from './supabase';
import {
  ChurchServiceType,
  PersonalServiceDecision,
  PersonalServiceFeeling,
  PersonalServiceJournal,
  PersonalServicePrayer,
  PersonalServiceSong,
  PersonalServiceVerse,
} from '../types';
import { formatSupabaseError } from '../utils/supabaseErrors';

type CreatePersonalServiceJournalInput = {
  userId: string;
  churchId?: string | null;
  churchName: string;
  linkedServiceId?: string | null;
  title: string;
  theme?: string;
  preacherName?: string;
  serviceType?: ChurchServiceType;
  serviceDate: string;
  startsAt?: string | null;
  endsAt?: string | null;
  songs?: PersonalServiceSong[];
  verses?: PersonalServiceVerse[];
  messageNotes?: string;
  prayers?: PersonalServicePrayer[];
  feelings?: PersonalServiceFeeling[];
  decisions?: PersonalServiceDecision[];
  tags?: string[];
};

type UpdatePersonalServiceJournalInput = Partial<Omit<CreatePersonalServiceJournalInput, 'userId'>>;

type JournalQueryOptions = {
  limit?: number;
  includeArchived?: boolean;
  search?: string;
};

const JOURNAL_STORAGE_KEY = 'biblialm.personalServiceJournals';
const DRAFT_STORAGE_KEY = 'biblialm.personalServiceJournalDrafts';

const now = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const isBrowser = () => typeof window !== 'undefined';

const readStorage = <T,>(key: string, fallback: T): T => {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = <T,>(key: string, value: T) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const isMissingJournalSchema = (error: any) => {
  const message = formatSupabaseError(error).toLowerCase();
  return (
    error?.code === 'PGRST205' ||
    error?.code === '42P01' ||
    message.includes('personal_service_journals') ||
    message.includes('schema cache') ||
    message.includes('failed to fetch')
  );
};

const ensureArray = <T,>(value: T[] | undefined): T[] => Array.isArray(value) ? value : [];

const mapJournal = (row: any): PersonalServiceJournal => ({
  id: row.id,
  userId: row.user_id,
  churchId: row.church_id ?? undefined,
  churchName: row.church_name ?? '',
  linkedServiceId: row.linked_service_id ?? undefined,
  title: row.title ?? '',
  theme: row.theme ?? undefined,
  preacherName: row.preacher_name ?? undefined,
  serviceType: row.service_type ?? undefined,
  serviceDate: row.service_date,
  startsAt: row.starts_at ?? undefined,
  endsAt: row.ends_at ?? undefined,
  songs: ensureArray(row.songs),
  verses: ensureArray(row.verses),
  messageNotes: row.message_notes ?? '',
  prayers: ensureArray(row.prayers),
  feelings: ensureArray(row.feelings),
  decisions: ensureArray(row.decisions),
  tags: ensureArray(row.tags),
  isArchived: Boolean(row.is_archived),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toPayload = (journal: PersonalServiceJournal) => ({
  id: journal.id,
  user_id: journal.userId,
  church_id: journal.churchId ?? null,
  church_name: journal.churchName,
  linked_service_id: journal.linkedServiceId ?? null,
  title: journal.title,
  theme: journal.theme ?? null,
  preacher_name: journal.preacherName ?? null,
  service_type: journal.serviceType ?? null,
  service_date: journal.serviceDate,
  starts_at: journal.startsAt ?? null,
  ends_at: journal.endsAt ?? null,
  songs: journal.songs,
  verses: journal.verses,
  message_notes: journal.messageNotes,
  prayers: journal.prayers,
  feelings: journal.feelings,
  decisions: journal.decisions,
  tags: journal.tags,
  is_archived: journal.isArchived,
  created_at: journal.createdAt,
  updated_at: journal.updatedAt,
});

const getLocalJournals = (userId?: string) =>
  readStorage<PersonalServiceJournal[]>(JOURNAL_STORAGE_KEY, [])
    .filter((journal) => !userId || journal.userId === userId)
    .sort((a, b) => new Date(b.serviceDate || b.createdAt).getTime() - new Date(a.serviceDate || a.createdAt).getTime());

const saveLocalJournal = (journal: PersonalServiceJournal) => {
  const journals = readStorage<PersonalServiceJournal[]>(JOURNAL_STORAGE_KEY, []);
  writeStorage(JOURNAL_STORAGE_KEY, [journal, ...journals.filter((item) => item.id !== journal.id)]);
};

const applyQueryOptions = (items: PersonalServiceJournal[], options?: JournalQueryOptions) => {
  const query = options?.search?.trim().toLowerCase();
  return items
    .filter((journal) => options?.includeArchived ? true : !journal.isArchived)
    .filter((journal) => {
      if (!query) return true;
      return [
        journal.title,
        journal.churchName,
        journal.theme,
        journal.preacherName,
        journal.messageNotes,
        ...journal.tags,
        ...journal.songs.map((song) => `${song.title} ${song.reflection ?? ''}`),
        ...journal.verses.map((verse) => `${verse.reference} ${verse.text ?? ''} ${verse.note ?? ''}`),
      ].join(' ').toLowerCase().includes(query);
    })
    .slice(0, options?.limit ?? Number.POSITIVE_INFINITY);
};

const createJournalObject = (input: CreatePersonalServiceJournalInput): PersonalServiceJournal => ({
  id: makeId('pjr'),
  userId: input.userId,
  churchId: input.churchId ?? undefined,
  churchName: input.churchName,
  linkedServiceId: input.linkedServiceId ?? undefined,
  title: input.title,
  theme: input.theme,
  preacherName: input.preacherName,
  serviceType: input.serviceType,
  serviceDate: input.serviceDate,
  startsAt: input.startsAt ?? undefined,
  endsAt: input.endsAt ?? undefined,
  songs: ensureArray(input.songs),
  verses: ensureArray(input.verses),
  messageNotes: input.messageNotes ?? '',
  prayers: ensureArray(input.prayers),
  feelings: ensureArray(input.feelings),
  decisions: ensureArray(input.decisions),
  tags: ensureArray(input.tags),
  isArchived: false,
  createdAt: now(),
  updatedAt: now(),
});

export const personalServiceJournalService = {
  createJournal: async (input: CreatePersonalServiceJournalInput): Promise<PersonalServiceJournal> => {
    const journal = createJournalObject(input);
    try {
      const { data, error } = await supabase
        .from('personal_service_journals')
        .insert(toPayload(journal))
        .select()
        .single();
      if (error) throw error;
      return data ? mapJournal(data) : journal;
    } catch (error) {
      if (!isMissingJournalSchema(error)) throw new Error(`Erro ao salvar registro de culto. ${formatSupabaseError(error)}`);
      saveLocalJournal(journal);
      return journal;
    }
  },

  updateJournal: async (journalId: string, userId: string, updates: UpdatePersonalServiceJournalInput): Promise<PersonalServiceJournal> => {
    const current = getLocalJournals(userId).find((journal) => journal.id === journalId);
    const updatedAt = now();
    const payload: Record<string, any> = {
      church_id: updates.churchId,
      church_name: updates.churchName,
      linked_service_id: updates.linkedServiceId,
      title: updates.title,
      theme: updates.theme,
      preacher_name: updates.preacherName,
      service_type: updates.serviceType,
      service_date: updates.serviceDate,
      starts_at: updates.startsAt,
      ends_at: updates.endsAt,
      songs: updates.songs,
      verses: updates.verses,
      message_notes: updates.messageNotes,
      prayers: updates.prayers,
      feelings: updates.feelings,
      decisions: updates.decisions,
      tags: updates.tags,
      updated_at: updatedAt,
    };
    const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

    try {
      const { data, error } = await supabase
        .from('personal_service_journals')
        .update(cleaned)
        .eq('id', journalId)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return mapJournal(data);
    } catch (error) {
      if (!isMissingJournalSchema(error)) throw new Error(`Erro ao atualizar registro de culto. ${formatSupabaseError(error)}`);
      if (!current) throw new Error('Registro de culto nao encontrado.');
      const next: PersonalServiceJournal = { ...current, ...updates, updatedAt };
      saveLocalJournal(next);
      return next;
    }
  },

  getJournalById: async (journalId: string, userId: string): Promise<PersonalServiceJournal | null> => {
    try {
      const { data, error } = await supabase
        .from('personal_service_journals')
        .select('*')
        .eq('id', journalId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapJournal(data) : null;
    } catch (error) {
      if (!isMissingJournalSchema(error)) throw new Error(`Erro ao carregar registro de culto. ${formatSupabaseError(error)}`);
      return getLocalJournals(userId).find((journal) => journal.id === journalId) ?? null;
    }
  },

  getJournalsByUser: async (userId: string, options?: JournalQueryOptions): Promise<PersonalServiceJournal[]> => {
    try {
      let query = supabase
        .from('personal_service_journals')
        .select('*')
        .eq('user_id', userId)
        .order('service_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (!options?.includeArchived) query = query.eq('is_archived', false);
      if (options?.limit) query = query.limit(options.limit);
      const { data, error } = await query;
      if (error) throw error;
      return applyQueryOptions((data ?? []).map(mapJournal), options);
    } catch (error) {
      if (!isMissingJournalSchema(error)) throw new Error(`Erro ao carregar registros de culto. ${formatSupabaseError(error)}`);
      return applyQueryOptions(getLocalJournals(userId), options);
    }
  },

  archiveJournal: async (journalId: string, userId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('personal_service_journals')
        .update({ is_archived: true, updated_at: now() })
        .eq('id', journalId)
        .eq('user_id', userId);
      if (error) throw error;
    } catch (error) {
      if (!isMissingJournalSchema(error)) throw new Error(`Erro ao arquivar registro de culto. ${formatSupabaseError(error)}`);
      const journals = readStorage<PersonalServiceJournal[]>(JOURNAL_STORAGE_KEY, []);
      writeStorage(JOURNAL_STORAGE_KEY, journals.map((journal) => journal.id === journalId && journal.userId === userId
        ? { ...journal, isArchived: true, updatedAt: now() }
        : journal));
    }
  },

  autosaveDraft: (userId: string, draft: Partial<CreatePersonalServiceJournalInput>) => {
    const drafts = readStorage<Record<string, Partial<CreatePersonalServiceJournalInput>>>(DRAFT_STORAGE_KEY, {});
    writeStorage(DRAFT_STORAGE_KEY, { ...drafts, [userId]: { ...draft, userId } });
  },

  getDraft: (userId: string) => {
    const drafts = readStorage<Record<string, Partial<CreatePersonalServiceJournalInput>>>(DRAFT_STORAGE_KEY, {});
    return drafts[userId] ?? null;
  },

  clearDraft: (userId: string) => {
    const drafts = readStorage<Record<string, Partial<CreatePersonalServiceJournalInput>>>(DRAFT_STORAGE_KEY, {});
    delete drafts[userId];
    writeStorage(DRAFT_STORAGE_KEY, drafts);
  },
};
