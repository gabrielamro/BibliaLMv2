import { supabase } from './supabase';
import type {
  HeartState,
  SpiritualCommitmentItem,
  SpiritualDayEntry,
  SpiritualTimelineItem,
} from '../types';

/**
  * Resolve a data base no fuso America/Manaus (YYYY-MM-DD)
  */
export function getManausDateStr(date?: Date): string {
  const d = date || new Date();
  const manausFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Manaus',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return manausFormatter.format(d); // Retorna YYYY-MM-DD
}

/**
  * Obtém ou inicializa o registro único do dia espiritual do usuário
  */
export async function getOrCreateSpiritualDayEntry(
  userId: string,
  dateStr?: string,
): Promise<SpiritualDayEntry> {
  const targetDate = dateStr || getManausDateStr();

  try {
    const { data, error } = await supabase
      .from('spiritual_day_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('entry_date', targetDate)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('Erro ao consultar spiritual_day_entries:', error);
    }

    if (data) {
      return {
        id: data.id,
        userId: data.user_id,
        entryDate: data.entry_date,
        heartState: data.heart_state as HeartState | null,
        heartStateNote: data.heart_state_note,
        privateNote: data.private_note,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    // Criar se não existir
    const newEntryPayload = {
      user_id: userId,
      entry_date: targetDate,
      heart_state: null,
      heart_state_note: null,
      private_note: '',
    };

    const { data: created, error: insertError } = await supabase
      .from('spiritual_day_entries')
      .insert(newEntryPayload)
      .select('*')
      .single();

    if (insertError) {
      console.warn('Erro ao inserir spiritual_day_entry:', insertError);
      return {
        userId,
        entryDate: targetDate,
        privateNote: '',
      };
    }

    return {
      id: created.id,
      userId: created.user_id,
      entryDate: created.entry_date,
      heartState: created.heart_state as HeartState | null,
      heartStateNote: created.heart_state_note,
      privateNote: created.private_note,
      createdAt: created.created_at,
      updatedAt: created.updated_at,
    };
  } catch (error) {
    console.error('Falha em getOrCreateSpiritualDayEntry:', error);
    return {
      userId,
      entryDate: targetDate,
      privateNote: '',
    };
  }
}

/**
  * Salva/atualiza o estado emocional (humor) do dia
  */
export async function updateHeartState(
  userId: string,
  heartState: HeartState,
  heartStateNote?: string,
  dateStr?: string,
): Promise<SpiritualDayEntry> {
  const targetDate = dateStr || getManausDateStr();

  const payload = {
    user_id: userId,
    entry_date: targetDate,
    heart_state: heartState,
    heart_state_note: heartStateNote || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('spiritual_day_entries')
    .upsert(payload, { onConflict: 'user_id,entry_date' })
    .select('*')
    .single();

  if (error) {
    console.error('Erro ao atualizar heart_state:', error);
  }

  return {
    id: data?.id,
    userId,
    entryDate: targetDate,
    heartState,
    heartStateNote,
    privateNote: data?.private_note || '',
    updatedAt: new Date().toISOString(),
  };
}

/**
  * Salva/atualiza a nota privada do dia ("O que ficou no seu coração hoje?")
  */
export async function updateDayPrivateNote(
  userId: string,
  privateNote: string,
  dateStr?: string,
): Promise<SpiritualDayEntry> {
  const targetDate = dateStr || getManausDateStr();

  const payload = {
    user_id: userId,
    entry_date: targetDate,
    private_note: privateNote,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('spiritual_day_entries')
    .upsert(payload, { onConflict: 'user_id,entry_date' })
    .select('*')
    .single();

  if (error) {
    console.error('Erro ao atualizar private_note:', error);
  }

  return {
    id: data?.id,
    userId,
    entryDate: targetDate,
    heartState: data?.heart_state as HeartState | null,
    heartStateNote: data?.heart_state_note,
    privateNote,
    updatedAt: new Date().toISOString(),
  };
}

/**
  * Carrega a linha do tempo diária agregando todas as fontes automáticas
  */
export async function getSpiritualDayTimeline(
  userId: string,
  dateStr?: string,
): Promise<SpiritualTimelineItem[]> {
  const targetDate = dateStr || getManausDateStr();
  const timeline: SpiritualTimelineItem[] = [];

  try {
    // 1. Devocional do Dia & Reflexão
    const { data: devotionalHistory } = await supabase
      .from('user_devotional_history')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', `${targetDate}T00:00:00Z`)
      .lte('created_at', `${targetDate}T23:59:59Z`);

    if (devotionalHistory && devotionalHistory.length > 0) {
      devotionalHistory.forEach((item: any) => {
        timeline.push({
          id: `dev-${item.id}`,
          type: 'devotional',
          title: item.title || 'Pão Diário Lido',
          subtitle: item.reference || 'Reflexão diária',
          dateStr: targetDate,
          timestamp: item.created_at || `${targetDate}T12:00:00Z`,
          badge: item.completed_at ? 'Concluído' : 'Em progresso',
          snippet: item.reflection || 'Leitura e reflexão concluídas no Pão Diário.',
          actionUrl: '/devocional',
        });
      });
    }

    // 2. Posts salvos no Reino
    const { data: savedPosts } = await supabase
      .from('post_saves')
      .select('*, post:posts(*)')
      .eq('user_id', userId)
      .gte('created_at', `${targetDate}T00:00:00Z`)
      .lte('created_at', `${targetDate}T23:59:59Z`);

    if (savedPosts && savedPosts.length > 0) {
      savedPosts.forEach((save: any) => {
        timeline.push({
          id: `save-${save.id}`,
          type: 'saved_post',
          title: 'Post salvo no Reino',
          subtitle: save.post?.title || 'Publicação guardada',
          dateStr: targetDate,
          timestamp: save.created_at,
          badge: 'Salvo',
          snippet: save.post?.content ? `${save.post.content.slice(0, 100)}...` : undefined,
          actionUrl: `/p/${save.post_id}`,
        });
      });
    }

    // 3. Favoritos do Dia
    const { data: favorites } = await supabase
      .from('user_content_favorites')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', `${targetDate}T00:00:00Z`)
      .lte('created_at', `${targetDate}T23:59:59Z`);

    if (favorites && favorites.length > 0) {
      favorites.forEach((fav: any) => {
        timeline.push({
          id: `fav-${fav.id}`,
          type: 'favorite',
          title: `Favorito: ${fav.title}`,
          subtitle: fav.content_type.toUpperCase(),
          dateStr: targetDate,
          timestamp: fav.created_at,
          badge: 'Favoritado',
          snippet: fav.snapshot?.textSnippet || fav.snapshot?.reference,
          actionUrl: fav.snapshot?.originUrl || '/diario-espiritual',
        });
      });
    }

    // 4. Reflexões registradas dentro das Trilhas de Estudo
    const { data: trackNotes } = await supabase
      .from('track_step_journal_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', `${targetDate}T00:00:00Z`)
      .lte('created_at', `${targetDate}T23:59:59Z`);

    if (trackNotes && trackNotes.length > 0) {
      trackNotes.forEach((entry: any) => {
        timeline.push({
          id: `track-note-${entry.id}`,
          type: 'track_note',
          title: entry.step_title,
          subtitle: `${entry.track_title} · Passo ${entry.step_number}`,
          dateStr: targetDate,
          timestamp: entry.created_at,
          badge: 'Trilha',
          snippet: entry.note,
          actionUrl: '/trilhas',
        });
      });
    }
  } catch (error) {
    console.warn('Erro ao construir timeline:', error);
  }

  // Ordenar por horário mais recente
  return timeline.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
  * Carrega compromissos (Escalas, Cultos e Ações Práticas do Devocional)
  */
export async function getSpiritualDayCommitments(
  userId: string,
  dateStr?: string,
): Promise<SpiritualCommitmentItem[]> {
  const targetDate = dateStr || getManausDateStr();
  const commitments: SpiritualCommitmentItem[] = [];

  try {
    // 1. Escalas de Voluntário Confirmadas
    const { data: volunteerScales } = await supabase
      .from('church_management_volunteers')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'confirmed');

    if (volunteerScales && volunteerScales.length > 0) {
      volunteerScales.forEach((scale: any) => {
        commitments.push({
          id: `scale-${scale.id}`,
          type: 'volunteer_scale',
          title: `Escala: ${scale.role || 'Voluntário'}`,
          description: scale.notes || 'Escala de serviço na igreja local',
          dateStr: targetDate,
          status: 'confirmed',
          locationOrTeam: scale.team_name || 'Equipe de Servos',
          actionUrl: '/gestao-igreja/escalas',
        });
      });
    }
  } catch (error) {
    console.warn('Erro ao carregar compromissos:', error);
  }

  return commitments;
}

/**
  * Obtém histórico mensal de humor (Heart State)
  */
export async function getMonthlyMoodHistory(
  userId: string,
  year: number,
  month: number,
): Promise<Array<{ date: string; state: HeartState; note?: string }>> {
  const monthStr = String(month).padStart(2, '0');
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-31`;

  const { data, error } = await supabase
    .from('spiritual_day_entries')
    .select('entry_date, heart_state, heart_state_note')
    .eq('user_id', userId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .not('heart_state', 'is', null);

  if (error || !data) return [];

  return data.map((item: any) => ({
    date: item.entry_date,
    state: item.heart_state as HeartState,
    note: item.heart_state_note,
  }));
}

/**
  * Exporta todos os registros do Diário Espiritual do usuário em formato JSON
  */
export async function exportUserJournalData(userId: string) {
  const [entries, favorites, trackNotes, trackProgress] = await Promise.all([
    supabase.from('spiritual_day_entries').select('*').eq('user_id', userId),
    supabase.from('user_content_favorites').select('*').eq('user_id', userId),
    supabase.from('track_step_journal_entries').select('*').eq('user_id', userId),
    supabase.from('user_track_progress').select('*').eq('user_id', userId),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    userId,
    entries: entries.data || [],
    favorites: favorites.data || [],
    trackNotes: trackNotes.data || [],
    trackProgress: trackProgress.data || [],
  };
}

/**
  * Exclui todos os registros privados do usuário (Hard Delete)
  */
export async function deleteUserJournalData(userId: string): Promise<boolean> {
  const [resEntries, resFavs, resTrackNotes, resTrackProgress] = await Promise.all([
    supabase.from('spiritual_day_entries').delete().eq('user_id', userId),
    supabase.from('user_content_favorites').delete().eq('user_id', userId),
    supabase.from('track_step_journal_entries').delete().eq('user_id', userId),
    supabase.from('user_track_progress').delete().eq('user_id', userId),
  ]);

  return !resEntries.error && !resFavs.error && !resTrackNotes.error && !resTrackProgress.error;
}
